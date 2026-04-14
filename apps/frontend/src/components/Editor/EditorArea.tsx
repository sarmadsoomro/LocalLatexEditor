import { lazy, Suspense } from "react";
import { TabBar, type Tab } from "./TabBar";

const MonacoEditor = lazy(() =>
  import("./MonacoEditor").then((m) => ({ default: m.MonacoEditor })),
);

function ComponentLoader() {
  return (
    <div className="h-full flex items-center justify-center bg-white dark:bg-surface">
      <div className="flex flex-col items-center gap-2">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-border-light dark:border-gray-600 border-t-primary"></div>
        <span className="text-sm text-muted">Loading...</span>
      </div>
    </div>
  );
}

interface EditorAreaProps {
  tabs: Tab[];
  activeFileId: string | null;
  content: string;
  language: string;
  onTabClick: (id: string) => void;
  onTabClose: (id: string) => void;
  onContentChange: (value: string) => void;
  onSave: () => void;
  showHint?: boolean;
}

export function EditorArea({
  tabs,
  activeFileId,
  content,
  language,
  onTabClick,
  onTabClose,
  onContentChange,
  onSave,
  showHint = false,
}: EditorAreaProps) {
  const activeTab = tabs.find((t) => t.id === activeFileId);

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col">
      {tabs.length > 0 && (
        <TabBar
          tabs={tabs}
          onTabClick={onTabClick}
          onTabClose={onTabClose}
          className="h-11 flex-shrink-0"
        />
      )}

      <div className="relative flex-1 overflow-hidden min-h-0 z-30">
        <div className="absolute inset-0">
          {activeTab ? (
            <Suspense fallback={<ComponentLoader />}>
              <MonacoEditor
                content={content}
                language={language}
                onChange={onContentChange}
                onSave={onSave}
              />
            </Suspense>
          ) : (
            <EmptyEditorState showHint={showHint} />
          )}
        </div>
      </div>
    </div>
  );
}

interface EmptyEditorStateProps {
  showHint?: boolean;
}

function EmptyEditorState({ showHint = false }: EmptyEditorStateProps) {
  return (
    <div className="h-full flex items-center justify-center text-muted bg-white dark:bg-surface">
      <div className="text-center">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/20 flex items-center justify-center mb-4">
          <svg
            className="h-10 w-10 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <p className="font-heading text-heading dark:text-heading font-medium">
          Select a file to edit
        </p>
        <p className="text-sm text-muted mt-1">
          Click or double-click a file from the sidebar
        </p>
        {showHint && (
          <p className="text-xs text-primary mt-3 font-medium">
            Compile once to open side-by-side PDF preview
          </p>
        )}
      </div>
    </div>
  );
}
