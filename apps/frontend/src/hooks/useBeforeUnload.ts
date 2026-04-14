import { useEffect, useRef } from 'react';

export interface UseBeforeUnloadOptions {
  enabled?: boolean;
  message?: string;
}

export function useBeforeUnload(options: UseBeforeUnloadOptions = {}) {
  const { enabled = true, message = 'You have unsaved changes. Are you sure you want to leave?' } = options;
  const enabledRef = useRef(enabled);
  const messageRef = useRef(message);

  useEffect(() => {
    enabledRef.current = enabled;
    messageRef.current = message;
  }, [enabled, message]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!enabledRef.current) return;

      event.preventDefault();
      event.returnValue = messageRef.current;
      return messageRef.current;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);
}

export function useUnsavedChangesWarning(hasUnsavedChanges: boolean) {
  useBeforeUnload({ enabled: hasUnsavedChanges });
}