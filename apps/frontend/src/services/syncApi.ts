import type { PdfRect } from '../stores/syncStore';

import { api } from './api';

export interface ForwardSyncResult {
  page: number;
  rects: PdfRect[];
}

export interface InverseSyncResult {
  /** project-relative path, forward slashes */
  file: string;
  line: number;
}

export const syncApi = {
  /** Source line -> location in the compiled PDF. */
  forward(projectId: string, file: string, line: number): Promise<ForwardSyncResult> {
    const q = new URLSearchParams({ file, line: String(line) });
    return api.get<ForwardSyncResult>(`/api/projects/${projectId}/synctex/forward?${q}`);
  },

  /** Point on a PDF page (PDF points, top-left origin) -> source line. */
  inverse(projectId: string, page: number, x: number, y: number): Promise<InverseSyncResult> {
    const q = new URLSearchParams({ page: String(page), x: x.toFixed(2), y: y.toFixed(2) });
    return api.get<InverseSyncResult>(`/api/projects/${projectId}/synctex/inverse?${q}`);
  },
};
