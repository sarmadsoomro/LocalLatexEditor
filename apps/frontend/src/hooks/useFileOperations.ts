import { startTransition, useCallback, useRef } from 'react';
import { useEditorStore, type OpenFile } from '../stores/editorStore';
import { fileApi } from '../services/fileApi';
import type { FileType } from '@local-latex-editor/shared-types';
import { getFileTypeFromExtension } from '@local-latex-editor/shared-types';
import { shallow } from 'zustand/shallow';

function generateFileId(): string {
  return `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function getFileName(path: string): string {
  const parts = path.split('/');
  return parts[parts.length - 1] || path;
}

function getLanguageFromFileType(fileType: FileType): string {
  switch (fileType) {
    case 'tex':
      return 'latex';
    case 'bib':
      return 'bibtex';
    case 'cls':
    case 'sty':
      return 'latex';
    default:
      return 'plaintext';
  }
}

const fileContentCache = new Map<string, string>();

function getFileCacheKey(projectId: string, filePath: string): string {
  return `${projectId}:${filePath}`;
}

export interface UseFileOperationsReturn {
  openFiles: OpenFile[];
  activeFileId: string | null;
  activeFile: OpenFile | null;
  isLoading: boolean;
  error: string | null;
  openFile: (projectId: string, filePath: string) => Promise<void>;
  closeFile: (fileId: string) => void;
  closeAllFiles: () => void;
  setActiveFile: (fileId: string) => void;
  updateFileContent: (fileId: string, content: string) => void;
  saveFile: (fileId: string, projectId: string) => Promise<void>;
  hasUnsavedChanges: boolean;
  getLanguage: (fileId: string) => string;
}

export function useFileOperations(): UseFileOperationsReturn {
  const pendingOpenRequestsRef = useRef(new Map<string, Promise<void>>());

  const {
    openFiles,
    activeFileId,
    addOpenFile,
    closeFile: closeFileFromStore,
    closeAllFiles,
    setActiveFile,
    updateFileContent: updateContentInStore,
    markFileSaved,
  } = useEditorStore(
    (state) => ({
      openFiles: state.openFiles,
      activeFileId: state.activeFileId,
      addOpenFile: state.addOpenFile,
      closeFile: state.closeFile,
      closeAllFiles: state.closeAllFiles,
      setActiveFile: state.setActiveFile,
      updateFileContent: state.updateFileContent,
      markFileSaved: state.markFileSaved,
    }),
    shallow,
  );

  const activeFile = openFiles.find((f) => f.id === activeFileId) || null;
  const hasUnsavedChanges = openFiles.some((f) => f.isDirty);

  const openFile = useCallback(
    async (projectId: string, filePath: string) => {
      const existingFile = useEditorStore
        .getState()
        .openFiles.find((f) => f.path === filePath);
      if (existingFile) {
        startTransition(() => {
          setActiveFile(existingFile.id);
        });
        return;
      }

      const cacheKey = getFileCacheKey(projectId, filePath);
      // Invalidate cache so we always get fresh content from backend
      fileContentCache.delete(cacheKey);
      const existingRequest = pendingOpenRequestsRef.current.get(cacheKey);
      if (existingRequest) {
        await existingRequest;
        return;
      }

      const openRequest = (async () => {
        try {
          console.log('[OPEN] Fetching file:', { projectId, filePath });
          const response = await fileApi.getFile(projectId, filePath);
          console.log('[OPEN] Received content length:', response.content.length);
          console.log('[OPEN] Content preview:', response.content.substring(0, 100));
          fileContentCache.set(cacheKey, response.content);

          const alreadyOpened = useEditorStore
            .getState()
            .openFiles.find((f) => f.path === filePath);
          if (alreadyOpened) {
            startTransition(() => {
              setActiveFile(alreadyOpened.id);
            });
            return;
          }

          const fileName = getFileName(filePath);
          const newFile: OpenFile = {
            id: generateFileId(),
            path: filePath,
            name: fileName,
            content: response.content,
            originalContent: response.content,
            isDirty: false,
          };

          startTransition(() => {
            addOpenFile(newFile);
          });
        } catch (error) {
          console.error('Failed to open file:', error);
          throw error;
        }
      })();

      pendingOpenRequestsRef.current.set(cacheKey, openRequest);

      try {
        await openRequest;
      } finally {
        pendingOpenRequestsRef.current.delete(cacheKey);
      }
    },
    [addOpenFile, setActiveFile]
  );

  const saveFile = useCallback(
    async (fileId: string, projectId: string) => {
      // Get fresh file data from store to avoid stale closure
      const file = useEditorStore.getState().openFiles.find((f) => f.id === fileId);
      if (!file) {
        throw new Error('File not found');
      }

      console.log('[SAVE] Attempting to save file:', {
        fileId,
        projectId,
        path: file.path,
        contentLength: file.content.length,
        contentPreview: file.content.substring(0, 100)
      });

      try {
        const result = await fileApi.saveFile(projectId, file.path, file.content);
        console.log('[SAVE] Success:', result);
        fileContentCache.set(getFileCacheKey(projectId, file.path), file.content);
        markFileSaved(fileId);
      } catch (error) {
        console.error('[SAVE] Failed:', error);
        throw error;
      }
    },
    [markFileSaved]
  );

  const getLanguage = useCallback(
    (fileId: string): string => {
      const file = openFiles.find((f) => f.id === fileId);
      if (!file) return 'plaintext';
      const fileType = getFileTypeFromExtension(file.name);
      return getLanguageFromFileType(fileType);
    },
    [openFiles]
  );

  return {
    openFiles,
    activeFileId,
    activeFile,
    isLoading: false,
    error: null,
    openFile,
    closeFile: closeFileFromStore,
    closeAllFiles,
    setActiveFile,
    updateFileContent: updateContentInStore,
    saveFile,
    hasUnsavedChanges,
    getLanguage,
  };
}