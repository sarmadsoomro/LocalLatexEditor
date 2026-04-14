const fs = require('fs');
const path = require('path');

const content = `import { useState, useRef, useEffect, useCallback } from "react";
import type { FileNode } from "@local-latex-editor/shared-types";
import { FileIcon, FolderIcon } from "./icons/FileIcon";
import { isEditableFile } from "@local-latex-editor/shared-types";
import { projectApi } from "../services/projectApi";

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
}

// Flatten tree for keyboard navigation
function flattenTree(nodes: FileNode[]): FileNode[] {
  const result: FileNode[] = [];
  const traverse = (items: FileNode[]) => {
    for (const item of items) {
      result.push(item);
      if (item.type === "directory" && item.children) {
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

function FileTreeItem({
  node,
  depth,
  selectedFileId,
  onFileSelect,
  onFileOpen,
  isExpanded,
  onToggleExpand,
  focusedId,
  onFocus,
}: FileTreeItemProps) {
  const isSelected = node.id === selectedFileId;
  const isFocused = node.id === focusedId;
  const paddingLeft = \`\${depth * 16 + 8}px\`;
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

  const handleDoubleClick = () => {
    if (node.type === "file" && isEditable) {
      onFileOpen?.(node);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  const label = isEditable
    ? \`\${node.name}, editable file\`
    : node.type === "directory"
      ? \`\${node.name}, folder, \${isExpanded ? "expanded" : "collapsed"}\`
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
      className={\`flex items-center py-1 px-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:ring-inset rounded-md mx-1
        transition-colors duration-100
        \${
          isSelected
            ? "bg-[#F0FDFA] text-[#0D9488]"
            : "hover:bg-[#F8FAFC] text-[#475569]"
        } \${isEditable ? "hover:text-[#0D9488]" : ""}\`}
      style={{ paddingLeft }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
      onFocus={() => onFocus(node.id)}
    >
      {node.type === "directory" ? (
        <>
          <svg
            className={\`w-4 h-4 mr-1 text-[#14B8A6] transform transition-transform duration-100 \${
              isExpanded ? "rotate-90" : ""
            }\`}
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
            className={\`w-5 h-5 mr-2 \${isSelected ? "text-[#0D9488]" : "text-[#F59E0B]"}\`}
            aria-hidden="true"
          />
        </>
      ) : (
        <>
          <span className="w-4 mr-1" aria-hidden="true" />
          <FileIcon
            fileType={node.fileType || "other"}
            className={\`w-5 h-5 mr-2 \${isSelected ? "text-[#0D9488]" : "text-[#94A3B8]"}\`}
            aria-hidden="true"
          />
        </>
      )}
      <span
        className={\`text-sm truncate \${isSelected ? "font-medium text-[#134E4A]" : ""}\`}
      >
        {node.name}
      </span>
      {isEditable && !isSelected && (
        <span
          className="ml-auto text-xs text-[#14B8A6] opacity-0 group-hover:opacity-100 transition-opacity duration-100"
          aria-hidden="true"
        >
          edit
        </span>
      )}
    </div>
  );
}

export function FileTree({
  projectId,
  files,
  onRefresh,
  onFileSelect,
  onFileOpen,
  selectedFileId,
}: FileTreeProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [creating, setCreating] = useState<{ type: 'file' | 'folder', parentPath: string } | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const treeRef = useRef<HTMLDivElement>(null);
  const flatItemsRef = useRef<FileNode[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const initialExpanded = new Set<string>();
    const traverse = (nodes: FileNode[]) => {
      for (const node of nodes) {
        if (node.type === "directory") {
          initialExpanded.add(node.id);
          if (node.children) {
            traverse(node.children);
          }
        }
      }
    };
    traverse(files);
    setExpandedIds(initialExpanded);
  }, [files]);

  useEffect(() => {
    flatItemsRef.current = flattenTree(files);
  }, [files]);

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

  const handleCreateStart = (type: 'file' | 'folder') => {
    const parentPath = getParentPath();
    setCreating({ type, parentPath });
    setNameInput("");
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const parentPath = getParentPath();
    const targetPath = parentPath ? \`\${parentPath}/\${file.name}\` : file.name;
    
    setIsSubmitting(true);
    try {
      await projectApi.uploadFile(projectId, targetPath, file);
      onRefresh();
    } catch (err) {
      console.error(err);
      alert("Failed to upload file");
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
      ? \`\${creating.parentPath}/\${nameInput.trim()}\`
      : nameInput.trim();

    setIsSubmitting(true);
    try {
      await projectApi.createFile(projectId, targetPath, creating.type === 'folder');
      setCreating(null);
      setNameInput("");
      onRefresh();
    } catch (err) {
      console.error(err);
      alert(\`Failed to create \${creating.type}\`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTreeKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const flatItems = flatItemsRef.current;
      if (flatItems.length === 0) return;

      const currentIndex = flatItems.findIndex((item) => item.id === focusedId);

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          if (currentIndex < flatItems.length - 1) {
            setFocusedId(flatItems[currentIndex + 1].id);
          } else if (currentIndex === -1 && flatItems.length > 0) {
            setFocusedId(flatItems[0].id);
          }
          break;
        case "ArrowUp":
          e.preventDefault();
          if (currentIndex > 0) {
            setFocusedId(flatItems[currentIndex - 1].id);
          }
          break;
        case "ArrowRight":
          e.preventDefault();
          if (currentIndex >= 0) {
            const node = flatItems[currentIndex];
            if (node.type === "directory" && !expandedIds.has(node.id)) {
              handleToggleExpand(node.id);
            }
          }
          break;
        case "ArrowLeft":
          e.preventDefault();
          if (currentIndex >= 0) {
            const node = flatItems[currentIndex];
            if (node.type === "directory" && expandedIds.has(node.id)) {
              handleToggleExpand(node.id);
            }
          }
          break;
      }
    },
    [focusedId, expandedIds, handleToggleExpand],
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
      <div className="flex items-center justify-end px-2 py-1 space-x-1 border-b border-[#E2E8F0] bg-white">
        <button
          onClick={() => handleCreateStart('file')}
          className="p-1 text-[#64748B] hover:text-[#0D9488] hover:bg-[#F0FDFA] rounded transition-colors"
          title="New File"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </button>
        <button
          onClick={() => handleCreateStart('folder')}
          className="p-1 text-[#64748B] hover:text-[#0D9488] hover:bg-[#F0FDFA] rounded transition-colors"
          title="New Folder"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1m-6-4h-4m-4 0H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2v-5a2 2 0 00-2-2h-4z" />
          </svg>
        </button>
        <button
          onClick={handleUploadClick}
          className="p-1 text-[#64748B] hover:text-[#0D9488] hover:bg-[#F0FDFA] rounded transition-colors"
          title="Upload File"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
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
        <div className="px-3 py-2 bg-[#F8FAFC] border-b border-[#E2E8F0]">
          <div className="text-xs text-[#64748B] mb-1">
            Create {creating.type} in {creating.parentPath ? \`/\${creating.parentPath}\` : "/ (root)"}
          </div>
          <div className="flex gap-2">
            <input 
               autoFocus
               value={nameInput} 
               onChange={e => setNameInput(e.target.value)}
               onKeyDown={e => { 
                 if (e.key === 'Enter') handleCreateSubmit(); 
                 if (e.key === 'Escape') setCreating(null); 
               }}
               disabled={isSubmitting}
               className="flex-1 px-2 py-1 text-sm border border-[#E2E8F0] focus:outline-none focus:ring-1 focus:ring-[#0D9488] rounded"
               placeholder="Name..."
            />
            <button 
              onClick={handleCreateSubmit} 
              disabled={isSubmitting || !nameInput.trim()}
              className="text-[#0D9488] hover:text-[#0F766E] disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </button>
            <button 
              onClick={() => setCreating(null)} 
              disabled={isSubmitting}
              className="text-[#94A3B8] hover:text-[#64748B]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {files.length === 0 ? (
        <div className="p-4 text-sm text-[#64748B] text-center" role="status">
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
            if (!focusedId && files.length > 0) {
              setFocusedId(files[0].id);
            }
          }}
        >
          {renderItems(files, 0)}
        </div>
      )}
    </div>
  );
}
`;

fs.writeFileSync(path.join(__dirname, 'apps/frontend/src/components/FileTree.tsx'), content);
