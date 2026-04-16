import { create } from "zustand";

export interface OpenFile {
  id: string;
  path: string;
  name: string;
  content: string;
  originalContent: string;
  isDirty: boolean;
}

interface EditorState {
  openFiles: OpenFile[];
  activeFileId: string | null;

  setOpenFiles: (files: OpenFile[]) => void;
  addOpenFile: (file: OpenFile) => void;
  closeFile: (fileId: string) => void;
  setActiveFile: (fileId: string | null) => void;
  updateFileContent: (fileId: string, content: string) => void;
  markFileSaved: (fileId: string) => void;
  closeAllFiles: () => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  openFiles: [],
  activeFileId: null,

  setOpenFiles: (files) => set({ openFiles: files }),

  addOpenFile: (file) =>
    set((state) => {
      const existingIndex = state.openFiles.findIndex(
        (f) => f.path === file.path,
      );
      if (existingIndex >= 0) {
        return {
          openFiles: state.openFiles,
          activeFileId: state.openFiles[existingIndex].id,
        };
      }
      return {
        openFiles: [...state.openFiles, file],
        activeFileId: file.id,
      };
    }),

  closeFile: (fileId) =>
    set((state) => {
      const newFiles = state.openFiles.filter((f) => f.id !== fileId);
      const newActiveId =
        state.activeFileId === fileId
          ? newFiles.length > 0
            ? newFiles[newFiles.length - 1].id
            : null
          : state.activeFileId;
      return {
        openFiles: newFiles,
        activeFileId: newActiveId,
      };
    }),

  setActiveFile: (fileId) => set({ activeFileId: fileId }),

  updateFileContent: (fileId, content) =>
    set((state) => {
      console.log('[STORE updateFileContent] Called:', { fileId, contentLength: content?.length, contentPreview: content?.substring(0, 50) });
      const fileIndex = state.openFiles.findIndex((f) => f.id === fileId);
      if (fileIndex === -1) {
        console.warn('[STORE updateFileContent] File not found:', fileId);
        return state;
      }
      const file = state.openFiles[fileIndex];
      console.log('[STORE updateFileContent] Current file:', { path: file.path, currentContentLength: file.content.length });
      if (file.content === content) {
        console.log('[STORE updateFileContent] Content unchanged, skipping');
        return state;
      }
      const newFile = {
        ...file,
        content,
        isDirty: content !== file.originalContent,
      };
      const newFiles = [...state.openFiles];
      newFiles[fileIndex] = newFile;
      console.log('[STORE updateFileContent] Updated file:', { path: newFile.path, newContentLength: newFile.content.length, isDirty: newFile.isDirty });
      return { openFiles: newFiles };
    }),

  markFileSaved: (fileId) =>
    set((state) => ({
      openFiles: state.openFiles.map((f) =>
        f.id === fileId
          ? {
              ...f,
              originalContent: f.content,
              isDirty: false,
            }
          : f,
      ),
    })),

  closeAllFiles: () => set({ openFiles: [], activeFileId: null }),
}));
