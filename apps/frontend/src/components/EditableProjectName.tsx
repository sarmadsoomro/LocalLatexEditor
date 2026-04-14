import { useState, useRef, useCallback } from 'react';

interface EditableProjectNameProps {
  projectId: string;
  initialName: string;
  onRename: (newName: string) => Promise<void>;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg font-semibold',
};

export function EditableProjectName({
  projectId,
  initialName,
  onRename,
  className = '',
  size = 'md',
}: EditableProjectNameProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(initialName);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateName = (name: string): string | null => {
    const trimmed = name.trim();
    if (!trimmed) {
      return 'Project name is required';
    }
    if (trimmed.length > 100) {
      return 'Project name must be less than 100 characters';
    }
    const invalidChars = /[<>:"\\/|?*]/;
    if (invalidChars.test(trimmed)) {
      return 'Project name contains invalid characters';
    }
    return null;
  };

  const handleStartEdit = useCallback(() => {
    setIsEditing(true);
    setEditValue(initialName);
    setError(null);
    // Focus and select all text after render
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
  }, [initialName]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setEditValue(initialName);
    setError(null);
  }, [initialName]);

  const handleSave = useCallback(async () => {
    const trimmedValue = editValue.trim();

    // Skip if unchanged
    if (trimmedValue === initialName) {
      setIsEditing(false);
      setError(null);
      return;
    }

    // Validate
    const validationError = validateName(trimmedValue);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onRename(trimmedValue);
      setIsEditing(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to rename project';
      setError(message);
    } finally {
      setIsSaving(false);
    }
  }, [editValue, initialName, onRename]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSave();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      }
    },
    [handleSave, handleCancel]
  );

  const handleBlur = useCallback(() => {
    // Small delay to allow click events to process
    setTimeout(() => {
      handleCancel();
    }, 200);
  }, [handleCancel]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value);
    // Clear error on change
    if (error) {
      setError(null);
    }
  }, [error]);

  if (isEditing) {
    return (
      <div className={`relative ${className}`}>
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          disabled={isSaving}
          className={`
            ${sizeClasses[size]}
            w-full px-2 py-1 rounded
            border-2 
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-[#14B8A6] focus:border-[#0D9488] focus:ring-[#14B8A6]'}
            focus:outline-none focus:ring-2 focus:ring-opacity-50
            bg-white
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
          aria-label="Edit project name"
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `error-${projectId}` : undefined}
        />
        {isSaving && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2">
            <span className="inline-block w-4 h-4 border-2 border-[#14B8A6] border-t-transparent rounded-full animate-spin" />
          </span>
        )}
        {error && (
          <p
            id={`error-${projectId}`}
            className="absolute -bottom-5 left-0 text-xs text-red-600 whitespace-nowrap"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <span
      onClick={handleStartEdit}
      className={`
        ${sizeClasses[size]}
        ${className}
        cursor-pointer
        hover:text-[#0D9488]
        transition-colors duration-150
        truncate
        inline-block
        max-w-full
      `}
      title="Click to rename"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleStartEdit();
        }
      }}
    >
      {initialName}
    </span>
  );
}
