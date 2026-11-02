import { create } from 'zustand';

/** A box on a PDF page, in PDF points from the page's top-left corner. */
export interface PdfRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Editor <-> PDF navigation (SyncTeX).
 * The editor publishes its cursor and listens for reveal requests; the PDF
 * preview listens for highlight requests. Each request carries a nonce so the
 * same location can be requested twice in a row.
 */
interface SyncState {
  cursor: { path: string; line: number } | null;
  reveal: { path: string; line: number; nonce: number } | null;
  highlight: { page: number; rects: PdfRect[]; nonce: number } | null;

  setCursor: (path: string, line: number) => void;
  requestReveal: (path: string, line: number) => void;
  showInPdf: (page: number, rects: PdfRect[]) => void;
  reset: () => void;
}

let nonce = 0;

/** Project-relative paths may use "\\" (Windows file tree) or "/" (SyncTeX). */
export function samePath(a: string, b: string): boolean {
  return a.replace(/\\/g, '/') === b.replace(/\\/g, '/');
}

export const useSyncStore = create<SyncState>((set) => ({
  cursor: null,
  reveal: null,
  highlight: null,

  setCursor: (path, line) => set({ cursor: { path, line } }),
  requestReveal: (path, line) => set({ reveal: { path, line, nonce: ++nonce } }),
  showInPdf: (page, rects) => set({ highlight: { page, rects, nonce: ++nonce } }),
  reset: () => set({ cursor: null, reveal: null, highlight: null }),
}));
