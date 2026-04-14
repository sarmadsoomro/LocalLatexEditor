import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description?: string;
}

export interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  shortcuts?: KeyboardShortcut[];
}

export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions = {}) {
  const { enabled = true, shortcuts = [] } = options;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrlKey
          ? event.ctrlKey || event.metaKey
          : !event.ctrlKey && !event.metaKey;
        const shiftMatch = shortcut.shiftKey ? event.shiftKey : !event.shiftKey;
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

        if (ctrlMatch && shiftMatch && keyMatch) {
          event.preventDefault();
          shortcut.action();
          return;
        }
      }
    },
    [enabled, shortcuts]
  );

  useEffect(() => {
    if (!enabled || shortcuts.length === 0) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, shortcuts.length, handleKeyDown]);
}

export function useEditorShortcuts(
  onSave: (() => void) | undefined,
  onClose: (() => void) | undefined,
  onNextTab: (() => void) | undefined,
  onPrevTab: (() => void) | undefined,
  onCompile: (() => void) | undefined
) {
  const shortcuts: KeyboardShortcut[] = [];

  if (onSave) {
    shortcuts.push({
      key: 's',
      ctrlKey: true,
      action: onSave,
      description: 'Save current file',
    });
  }

  if (onClose) {
    shortcuts.push({
      key: 'w',
      ctrlKey: true,
      action: onClose,
      description: 'Close current tab',
    });
  }

  if (onNextTab) {
    shortcuts.push({
      key: 'Tab',
      ctrlKey: true,
      action: onNextTab,
      description: 'Switch to next tab',
    });
  }

  if (onPrevTab) {
    shortcuts.push({
      key: 'Tab',
      ctrlKey: true,
      shiftKey: true,
      action: onPrevTab,
      description: 'Switch to previous tab',
    });
  }

  if (onCompile) {
    shortcuts.push({
      key: 'b',
      ctrlKey: true,
      action: onCompile,
      description: 'Compile to PDF',
    });
  }

  useKeyboardShortcuts({ shortcuts });
}