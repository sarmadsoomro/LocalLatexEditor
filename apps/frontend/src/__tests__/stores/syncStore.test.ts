import { describe, expect, it } from 'vitest';

import { samePath, useSyncStore } from '../../stores/syncStore';

describe('syncStore', () => {
  it('treats Windows and SyncTeX path separators as the same file', () => {
    expect(samePath('chapters\\one.tex', 'chapters/one.tex')).toBe(true);
    expect(samePath('chapters/one.tex', 'chapters/two.tex')).toBe(false);
  });

  it('gives every request a new nonce so the same spot can be requested twice', () => {
    const { requestReveal, showInPdf } = useSyncStore.getState();
    requestReveal('main.tex', 3);
    const first = useSyncStore.getState().reveal!.nonce;
    requestReveal('main.tex', 3);
    expect(useSyncStore.getState().reveal!.nonce).toBeGreaterThan(first);

    showInPdf(2, [{ x: 1, y: 2, width: 3, height: 4 }]);
    expect(useSyncStore.getState().highlight).toMatchObject({ page: 2 });
    useSyncStore.getState().reset();
    expect(useSyncStore.getState().highlight).toBeNull();
  });
});
