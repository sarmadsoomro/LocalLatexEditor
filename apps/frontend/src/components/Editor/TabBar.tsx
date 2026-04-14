import { useRef, useEffect, useCallback } from "react";

export interface Tab {
  id: string;
  name: string;
  isDirty: boolean;
  isActive: boolean;
}

export interface TabBarProps {
  tabs: Tab[];
  onTabClick: (id: string) => void;
  onTabClose: (id: string) => void;
  className?: string;
  /** ID of the panel controlled by this tab list */
  panelId?: string;
}

export function TabBar({
  tabs,
  onTabClick,
  onTabClose,
  className = "",
  panelId,
}: TabBarProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeTabRef.current && scrollContainerRef.current) {
      activeTabRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [tabs.find((t) => t.isActive)?.id]);

  const handleCloseClick = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    onTabClose(tabId);
  };

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const currentIndex = tabs.findIndex((t) => t.isActive);
      if (currentIndex === -1) return;

      let newIndex = currentIndex;

      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          newIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
          break;
        case "ArrowRight":
          e.preventDefault();
          newIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
          break;
        case "Home":
          e.preventDefault();
          newIndex = 0;
          break;
        case "End":
          e.preventDefault();
          newIndex = tabs.length - 1;
          break;
        default:
          return;
      }

      const newTab = tabs[newIndex];
      if (newTab) {
        onTabClick(newTab.id);
        const tabElement = e.currentTarget.querySelector(
          `[data-tab-id="${newTab.id}"]`,
        ) as HTMLButtonElement;
        tabElement?.focus();
      }
    },
    [tabs, onTabClick],
  );

  if (tabs.length === 0) {
    return null;
  }

  return (
    <div
      ref={scrollContainerRef}
      role="tablist"
      aria-label="Open files"
      className={`flex h-11 items-center bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 overflow-x-auto ${className}`}
      style={{ scrollbarWidth: "thin" }}
      onKeyDown={handleKeyDown}
    >
      {tabs.map((tab) => (
        <div
          key={tab.id}
          ref={tab.isActive ? activeTabRef : null}
          role="tab"
          data-tab-id={tab.id}
          aria-selected={tab.isActive}
          aria-controls={panelId}
          tabIndex={tab.isActive ? 0 : -1}
          onClick={() => onTabClick(tab.id)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onTabClick(tab.id);
            }
          }}
          className={`
            group flex items-center gap-2 px-3 py-2 text-sm font-medium
            border-r border-gray-200 dark:border-gray-700 min-w-0 max-w-[200px]
            cursor-pointer
            focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary
            transition-colors duration-150
            ${
              tab.isActive
                ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-b-2 border-b-primary"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-gray-200"
            }
          `}
          title={tab.name}
        >
          {tab.isDirty && (
            <span
              className="w-2 h-2 rounded-full bg-primary flex-shrink-0"
              aria-label="Unsaved changes"
            />
          )}

          <span className="truncate">{tab.name}</span>

          <button
            type="button"
            onClick={(e) => handleCloseClick(e, tab.id)}
            className={`
              flex-shrink-0 w-4 h-4 flex items-center justify-center
              rounded opacity-0 group-hover:opacity-100
              text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200
              hover:bg-gray-300 dark:hover:bg-gray-600
              transition-all duration-150
              focus:outline-none focus:opacity-100 focus:ring-2 focus:ring-primary
            `}
            aria-label={`Close ${tab.name}`}
            tabIndex={-1}
          >
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
