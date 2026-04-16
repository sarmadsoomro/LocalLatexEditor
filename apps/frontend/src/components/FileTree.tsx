import { memo, useState, useRef, useEffect, useCallback, useMemo } from "react";
import type { FileNode } from "@local-latex-editor/shared-types";
import { FileIcon, FolderIcon } from "./icons/FileIcon";
import { isEditableFile } from "@local-latex-editor/shared-types";
import { projectApi } from "../services/projectApi";
import { useToast } from "./Toast";
import { useSettingsStore } from "../stores/settingsStore";

interface FileTreeProps {
  projectId: string;
  files: FileNode[];
  onRefresh: () => void;
  onFileSelect?: (file: FileNode) => void;
  onFileOpen?: (file: FileNode) => void;
  selectedFileId?: string | null;
}

interface FileTreeItemProps {
  node: FileNode;
  depth: number;
  selectedFileId?: string | null;
  onFileSelect?: (file: FileNode) => void;
  onFileOpen?: (file: FileNode) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  focusedId: string | null;
  onFocus: (id: string) => void;
  onContextMenu?: (e: React.MouseEvent, node: FileNode) => void;
}

// Flatten only visible tree items for keyboard navigation.
function flattenVisibleTree(
  nodes: FileNode[],
  expandedIds: Set<string>,
): FileNode[] {
  const result: FileNode[] = [];
  const traverse = (items: FileNode[]) => {
    for (const item of items) {
      result.push(item);
      if (
        item.type === "directory" &&
        item.children &&
        expandedIds.has(item.id)
      ) {
        traverse(item.children);
      }
    }
  };
  traverse(nodes);
  return result;
}

function findNode(nodes: FileNode[], id: string): FileNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNode(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

const FileTreeItem = memo(function FileTreeItem({
  node,
  depth,
  selectedFileId,
  onFileSelect,
  onFileOpen,
  isExpanded,
  onToggleExpand,
  focusedId,
  onFocus,
  onContextMenu,
}: FileTreeItemProps) {
  const isSelected = node.id === selectedFileId;
  const isFocused = node.id === focusedId;
  const paddingLeft = `${depth * 16 + 8}px`;
  const isEditable =
    node.type === "file" && (!node.fileType || isEditableFile(node.fileType));
  const itemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isFocused && itemRef.current) {
      itemRef.current.scrollIntoView({ block: "nearest" });
    }
  }, [isFocused]);

  const handleClick = () => {
    if (node.type === "directory") {
      onToggleExpand();
    } else if (isEditable) {
      onFileOpen?.(node);
    }
    onFileSelect?.(node);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onFileSelect?.(node);
    onContextMenu?.(e, node);
  };

  const label = isEditable
    ? `${node.name}, editable file`
    : node.type === "directory"
      ? `${node.name}, folder, ${isExpanded ? "expanded" : "collapsed"}`
      : node.name;

  return (
    <div
      ref={itemRef}
      role="treeitem"
      aria-selected={isSelected}
      aria-expanded={node.type === "directory" ? isExpanded : undefined}
      aria-label={label}
      tabIndex={isFocused ? 0 : -1}
      data-id={node.id}
      className={`flex items-center py-1 px-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset rounded-md mx-1
        transition-colors duration-fast group
        ${
          isSelected
            ? "bg-primary-50 text-primary dark:bg-primary-900/30 dark:text-primary-light"
            : "hover:bg-surface-hover text-secondary"
        } ${isEditable && !isSelected ? "hover:text-primary" : ""}`}
      style={{ paddingLeft }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onFocus={() => onFocus(node.id)}
      onContextMenu={handleContextMenu}
    >
      {node.type === "directory" ? (
        <>
          <svg
            className={`w-4 h-4 mr-1 text-primary-light transform transition-transform duration-fast ${
              isExpanded ? "rotate-90" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
          <FolderIcon
            isOpen={isExpanded}
            className={`w-5 h-5 mr-2 ${isSelected ? "text-primary" : "text-amber-500/80"}`}
            aria-hidden="true"
          />
        </>
      ) : (
        <>
          <span className="w-4 mr-1" aria-hidden="true" />
          <FileIcon
            fileType={node.fileType || "other"}
            className={`w-5 h-5 mr-2 ${isSelected ? "text-primary" : "text-muted"}`}
            aria-hidden="true"
          />
        </>
      )}
      <span
        className={`text-sm truncate ${isSelected ? "font-medium text-heading" : ""}`}
      >
        {node.name}
      </span>
      {isEditable && !isSelected && (
        <span
          className="ml-auto text-[10px] font-medium uppercase tracking-wider text-primary-light opacity-0 group-hover:opacity-100 transition-opacity duration-fast"
          aria-hidden="true"
        >
          edit
        </span>
      )}
    </div>
  );
});

export const FileTree = memo(function FileTree({
  projectId,
  files,
  onRefresh,
  onFileSelect,
  onFileOpen,
  selectedFileId,
}: FileTreeProps) {
  const { addToast } = useToast();
  const showHiddenFiles = useSettingsStore((state) => state.ui.showHiddenFiles);
  const showCompiledFiles = useSettingsStore((state) => state.ui.showCompiledFiles);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [creating, setCreating] = useState<{
    type: "file" | "folder";
    parentPath: string;
  } | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    node: FileNode;
    x: number;
    y: number;
  } | null>(null);
  const [deleting, setDeleting] = useState<FileNode | null>(null);
  const [renaming, setRenaming] = useState<FileNode | null>(null);

  const treeRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Preserve user-expanded state across refreshes; initialize with top-level directories only.
    setExpandedIds((prev) => {
      if (prev.size > 0 || files.length === 0) {
        return prev;
      }

      const initialExpanded = new Set<string>();
      for (const node of files) {
        if (node.type === "directory") {
          initialExpanded.add(node.id);
        }
      }
      return initialExpanded;
    });
  }, [files]);

  const filteredFiles = useMemo(() => {
    const filterNode = (node: FileNode): FileNode | null => {
      if (node.type === "file") {
        const name = node.name;
        const isHidden = name.startsWith(".");
        const isCompiledFile =
          /\.(aux|log|out|toc|bbl|blg|synctex\.gz|fdb_latexmk|fls)$/.test(name);

        if (!showHiddenFiles && isHidden) return null;
        if (!showCompiledFiles && isCompiledFile) return null;
      }

      if (node.children) {
        const filteredChildren = node.children
          .map(filterNode)
          .filter((child): child is FileNode => child !== null);
        if (filteredChildren.length === 0 && node.type === "directory") {
          return null;
        }
        return { ...node, children: filteredChildren };
      }

      return node;
    };

    return files.map(filterNode).filter((node): node is FileNode => node !== null);
  }, [files, showHiddenFiles, showCompiledFiles]);

  const filteredFlatItems = useMemo(
    () => flattenVisibleTree(filteredFiles, expandedIds),
    [filteredFiles, expandedIds],
  );

  const handleToggleExpand = useCallback((nodeId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  const handleFocus = useCallback((id: string) => {
    setFocusedId(id);
  }, []);

  const getParentPath = () => {
    if (!selectedFileId) return "";
    const node = findNode(files, selectedFileId);
    if (!node) return "";
    if (node.type === "directory") return node.path;
    const parts = node.path.split("/");
    parts.pop();
    return parts.join("/");
  };

  const handleContextMenu = (e: React.MouseEvent, node: FileNode) => {
    e.preventDefault();
    setContextMenu({ node, x: e.clientX, y: e.clientY });
    onFileSelect?.(node);
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  const handleDeleteStart = (node: FileNode) => {
    setDeleting(node);
    closeContextMenu();
  };

  const handleDeleteConfirm = async () => {
    if (!deleting) return;
    setIsSubmitting(true);
    try {
      await projectApi.deleteFile(projectId, deleting.path);
      setDeleting(null);
      onRefresh();
      addToast("File deleted successfully", "success");
    } catch (err) {
      console.error(err);
      addToast("Failed to delete file", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRenameStart = (node: FileNode) => {
    setRenaming(node);
    setNameInput(node.name);
    closeContextMenu();
  };

  const handleRenameSubmit = async () => {
    if (!renaming || !nameInput.trim()) return;
    const oldPath = renaming.path;
    const parts = oldPath.split("/");
    parts.pop();
    parts.push(nameInput.trim());
    const newPath = parts.join("/");

    if (newPath === oldPath) {
      setRenaming(null);
      return;
    }

    setIsSubmitting(true);
    try {
      await projectApi.renameFile(projectId, oldPath, newPath);
      setRenaming(null);
      onRefresh();
      addToast("File renamed successfully", "success");
    } catch (err) {
      console.error(err);
      addToast("Failed to rename file", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleCreateStart = (type: "file" | "folder") => {
    const parentPath = getParentPath();
    setCreating({ type, parentPath });
    setNameInput("");
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const parentPath = getParentPath();
    const targetPath = parentPath ? `${parentPath}/${file.name}` : file.name;

    setIsSubmitting(true);
    try {
      await projectApi.uploadFile(projectId, targetPath, file);
      onRefresh();
      addToast("File uploaded successfully", "success");
    } catch (err) {
      console.error(err);
      addToast("Failed to upload file", "error");
    } finally {
      setIsSubmitting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleCreateSubmit = async () => {
    if (!creating || !nameInput.trim()) return;

    const targetPath = creating.parentPath
      ? `${creating.parentPath}/${nameInput.trim()}`
      : nameInput.trim();

    setIsSubmitting(true);
    try {
      await projectApi.createFile(
        projectId,
        targetPath,
        creating.type === "folder",
      );
      setCreating(null);
      setNameInput("");
      onRefresh();
      addToast(
        `${creating.type === "folder" ? "Folder" : "File"} created successfully`,
        "success",
      );
    } catch (err) {
      console.error(err);
      addToast(`Failed to create ${creating.type}`, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTreeKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (filteredFlatItems.length === 0) return;

      const currentIndex = filteredFlatItems.findIndex((item) => item.id === focusedId);

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          if (currentIndex < filteredFlatItems.length - 1) {
            setFocusedId(filteredFlatItems[currentIndex + 1].id);
          } else if (currentIndex === -1 && filteredFlatItems.length > 0) {
            setFocusedId(filteredFlatItems[0].id);
          }
          break;
        case "ArrowUp":
          e.preventDefault();
          if (currentIndex > 0) {
            setFocusedId(filteredFlatItems[currentIndex - 1].id);
          }
          break;
        case "ArrowRight":
          e.preventDefault();
          if (currentIndex >= 0) {
            const node = filteredFlatItems[currentIndex];
            if (node.type === "directory" && !expandedIds.has(node.id)) {
              handleToggleExpand(node.id);
            }
          }
          break;
        case "ArrowLeft":
          e.preventDefault();
          if (currentIndex >= 0) {
            const node = filteredFlatItems[currentIndex];
            if (node.type === "directory" && expandedIds.has(node.id)) {
              handleToggleExpand(node.id);
            }
          }
          break;
      }
    },
    [filteredFlatItems, focusedId, expandedIds, handleToggleExpand],
  );

  const renderItems = (nodes: FileNode[], depth: number): React.ReactNode => {
    return nodes.map((node) => {
      const isExpanded =
        node.type === "directory" ? expandedIds.has(node.id) : false;
      return (
        <div key={node.id}>
          <FileTreeItem
            node={node}
            depth={depth}
            selectedFileId={selectedFileId}
            onFileSelect={onFileSelect}
            onFileOpen={onFileOpen}
            isExpanded={isExpanded}
            onToggleExpand={() => handleToggleExpand(node.id)}
            focusedId={focusedId}
            onFocus={handleFocus}
            onContextMenu={handleContextMenu}
          />
          {node.type === "directory" && isExpanded && node.children && (
            <div role="group">{renderItems(node.children, depth + 1)}</div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-end px-2 py-1 space-x-1 border-b border-border bg-surface">
        <button
          onClick={() => handleCreateStart("file")}
          className="p-1 text-muted hover:text-primary hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded transition-colors cursor-pointer"
          title="New File"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </button>
        <button
          onClick={() => handleCreateStart("folder")}
          className="p-1 text-muted hover:text-primary hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded transition-colors cursor-pointer"
          title="New Folder"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1m-6-4h-4m-4 0H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2v-5a2 2 0 00-2-2h-4z"
            />
          </svg>
        </button>
        <button
          onClick={handleUploadClick}
          className="p-1 text-muted hover:text-primary hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded transition-colors cursor-pointer"
          title="Upload File"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
            />
          </svg>
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {creating && (
        <div className="px-3 py-2 bg-border-light border-b border-border">
          <div className="text-[10px] font-medium uppercase tracking-wider text-muted mb-1">
            Create {creating.type} in{" "}
            <span className="text-secondary">{creating.parentPath ? `/${creating.parentPath}` : "/ (root)"}</span>
          </div>
          <div className="flex gap-2">
            <input
              autoFocus
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateSubmit();
                if (e.key === "Escape") setCreating(null);
              }}
              disabled={isSubmitting}
              className="flex-1 px-2 py-1 text-sm border border-border bg-surface focus:outline-none focus:ring-1 focus:ring-primary rounded cursor-text"
              placeholder="Name..."
            />
            <button
              onClick={handleCreateSubmit}
              disabled={isSubmitting || !nameInput.trim()}
              className="text-primary hover:text-primary-dark disabled:opacity-50 cursor-pointer"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </button>
            <button
              onClick={() => setCreating(null)}
              disabled={isSubmitting}
              className="text-muted hover:text-secondary cursor-pointer"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {filteredFiles.length === 0 ? (
        <div className="p-4 text-sm text-muted text-center" role="status">
          No files in this project
        </div>
      ) : (
        <div
          ref={treeRef}
          role="tree"
          aria-label="Project files"
          className="py-2 outline-none flex-1 overflow-y-auto"
          tabIndex={0}
          onKeyDown={handleTreeKeyDown}
          onFocus={() => {
            if (!focusedId && filteredFiles.length > 0) {
              setFocusedId(filteredFiles[0].id);
            }
          }}
          onClick={() => closeContextMenu()}
        >
          {renderItems(filteredFiles, 0)}
        </div>
      )}

      {contextMenu && (
        <div
          className="fixed z-50 bg-surface border border-border rounded-lg shadow-lg py-1 min-w-[140px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => handleRenameStart(contextMenu.node)}
            className="w-full px-4 py-2 text-sm text-left text-secondary hover:bg-surface-hover cursor-pointer flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Rename
          </button>
          <button
            onClick={() => handleDeleteStart(contextMenu.node)}
            className="w-full px-4 py-2 text-sm text-left text-error hover:bg-error/10 cursor-pointer flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </button>
        </div>
      )}

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 border border-border">
            <h3 className="text-lg font-medium text-heading mb-2">
              Delete File?
            </h3>
            <p className="text-sm text-muted mb-4">
              Are you sure you want to delete "{deleting.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleting(null)}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm text-secondary hover:bg-surface-hover rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm text-white bg-error hover:bg-error/90 rounded-lg transition-all active:scale-[0.98] cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {renaming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 border border-border">
            <h3 className="text-lg font-medium text-heading mb-4">
              Rename File
            </h3>
            <input
              autoFocus
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRenameSubmit();
                if (e.key === "Escape") setRenaming(null);
              }}
              disabled={isSubmitting}
              className="w-full px-3 py-2 text-sm border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-primary rounded cursor-text mb-4 transition-all"
              placeholder="New name..."
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setRenaming(null)}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm text-secondary hover:bg-surface-hover rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleRenameSubmit}
                disabled={isSubmitting || !nameInput.trim()}
                className="px-4 py-2 text-sm text-white bg-primary hover:bg-primary-dark rounded-lg transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
              >
                Rename
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
