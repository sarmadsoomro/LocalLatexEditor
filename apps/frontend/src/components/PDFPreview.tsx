import { memo, useState, useCallback, useEffect, useRef, useMemo } from "react";
import { Document, Page, pdfjs } from "react-pdf";

import { apiAuthHeaders, notifySessionExpired } from "../services/api";
import { useSyncStore } from "../stores/syncStore";

import { useToast } from "./Toast";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

// LocalStorage keys
const ZOOM_STORAGE_KEY = "latex-editor-pdf-zoom";
const getPageStorageKey = (projectId?: string) =>
  projectId ? `latex-editor-pdf-page-${projectId}` : null;

// Zoom presets
const ZOOM_PRESETS = [
  { value: 0.25, label: "25%" },
  { value: 0.5, label: "50%" },
  { value: 0.75, label: "75%" },
  { value: 1.0, label: "100%" },
  { value: 1.25, label: "125%" },
  { value: 1.5, label: "150%" },
  { value: 2.0, label: "200%" },
  { value: 4.0, label: "400%" },
];

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4.0;
const ZOOM_STEP = 0.1;

interface PDFPreviewProps {
  pdfUrl: string;
  refreshKey?: number;
  projectId?: string;
  /** Double-click or Ctrl/Cmd+click: page and point in PDF points (top-left origin). */
  onSyncClick?: (page: number, x: number, y: number) => void;
  /** file name for Save PDF, e.g. "main.pdf" */
  downloadName?: string;
}


function useDebouncedCallback<T extends (...args: never[]) => void>(
  callback: T,
  delay: number,
): T {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedFn = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay],
  ) as T;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedFn;
}

export const PDFPreview = memo(function PDFPreview({
  pdfUrl,
  downloadName,
  refreshKey,
  projectId,
  onSyncClick,
}: PDFPreviewProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(() => {
    // Initialize from localStorage
    const saved = localStorage.getItem(ZOOM_STORAGE_KEY);
    if (saved) {
      const parsed = parseFloat(saved);
      if (!isNaN(parsed) && parsed >= MIN_ZOOM && parsed <= MAX_ZOOM) {
        return parsed;
      }
    }
    return 1.0;
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null);
  const [pageInputValue, setPageInputValue] = useState<string>("1");
  const [zoomInputValue, setZoomInputValue] = useState<string>("");

  const openedUrlsRef = useRef<string[]>([]);
  useEffect(() => {
    const urls = openedUrlsRef.current;
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  // Open the tab synchronously so the popup blocker allows it, then point it at the blob.
  const openInNewTab = useCallback(() => {
    const w = window.open("", "_blank");
    void fetch(pdfUrl, { headers: apiAuthHeaders() })
      .then((response) => {
        if (response.status === 401) notifySessionExpired();
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.blob();
      })
      .then((blob) => {
        const objectUrl = URL.createObjectURL(blob);
        openedUrlsRef.current.push(objectUrl);
        setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
        if (w) {
          w.location.href = objectUrl;
        } else {
          const a = document.createElement("a");
          a.href = objectUrl;
          a.download = "document.pdf";
          a.click();
        }
      })
      .catch(() => w?.close());
  }, [pdfUrl]);
  // Save PDF: fetch a fresh copy (the viewer may own pdfData's buffer) and
  // hand it to the browser's download, which asks where to save
  const { addToast } = useToast();
  const [saving, setSaving] = useState(false);
  const savePdf = useCallback(() => {
    setSaving(true);
    void fetch(pdfUrl, { headers: apiAuthHeaders() })
      .then((response) => {
        if (response.status === 401) notifySessionExpired();
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.blob();
      })
      .then((blob) => {
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = objectUrl;
        a.download = downloadName || "document.pdf";
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
      })
      .catch(() => addToast("Could not save the PDF. Compile again, then retry.", "error"))
      .finally(() => setSaving(false));
  }, [pdfUrl, downloadName, addToast]);

  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [pageWidth, setPageWidth] = useState<number>(0);
  const [pageHeight, setPageHeight] = useState<number>(0);

  const containerRef = useRef<HTMLDivElement>(null);

  // SyncTeX: page size in PDF points, the page element, and the highlight to draw
  const pageSizePtRef = useRef<{ width: number; height: number } | null>(null);
  const pageWrapperRef = useRef<HTMLDivElement>(null);
  const highlight = useSyncStore((state) => state.highlight);
  const [visibleHighlight, setVisibleHighlight] = useState<typeof highlight>(null);
  const pageInputRef = useRef<HTMLInputElement>(null);
  const zoomInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const loadingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Persist zoom to localStorage
  const debouncedSaveZoom = useDebouncedCallback((zoom: number) => {
    localStorage.setItem(ZOOM_STORAGE_KEY, zoom.toString());
  }, 300);

  useEffect(() => {
    debouncedSaveZoom(scale);
  }, [scale, debouncedSaveZoom]);

  // Persist page to localStorage (per project)
  useEffect(() => {
    const key = getPageStorageKey(projectId);
    if (key) {
      localStorage.setItem(key, pageNumber.toString());
    }
  }, [pageNumber, projectId]);

  // Restore page from localStorage on mount
  useEffect(() => {
    const key = getPageStorageKey(projectId);
    if (key) {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 1) {
          setPageNumber(parsed);
          setPageInputValue(parsed.toString());
        }
      }
    }
  }, [projectId]);

  // Track container width for fit-to-width
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Page Up/Down for navigation
      if (event.key === "PageUp" || event.key === "PageDown") {
        event.preventDefault();
        if (event.key === "PageUp") {
          goToPrevPage();
        } else {
          goToNextPage();
        }
      }

      // Home/End for first/last page
      if (event.key === "Home") {
        event.preventDefault();
        goToFirstPage();
      }
      if (event.key === "End") {
        event.preventDefault();
        goToLastPage();
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("keydown", handleKeyDown);
      return () => container.removeEventListener("keydown", handleKeyDown);
    }
    // page helpers are stable enough; rebinding would reset the listener
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numPages]);

  // Ctrl/Cmd + scroll wheel for zoom
  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
        const delta = event.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
        setScale((prev) => {
          const newScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev + delta));
          setZoomInputValue(Math.round(newScale * 100).toString());
          return newScale;
        });
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("wheel", handleWheel, { passive: false });
      return () => container.removeEventListener("wheel", handleWheel);
    }
  }, []);

  // Load PDF
  useEffect(() => {
    let cancelled = false;

    const loadPdf = async () => {
      setLoading(true);
      setError(null);
      setPdfData(null);
      setNumPages(0);

      // Set a timeout to prevent infinite loading
      loadingTimeoutRef.current = setTimeout(() => {
        if (!cancelled) {
          setError(
            "PDF loading timed out. The file may be corrupted or too large.",
          );
          setLoading(false);
        }
      }, 30000); // 30 second timeout

      try {
        const response = await fetch(pdfUrl, { headers: apiAuthHeaders() });
        if (response.status === 401) notifySessionExpired();

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("PDF not found. Please compile the project first.");
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const contentType = response.headers.get("content-type");
        if (!contentType?.includes("pdf")) {
          throw new Error(`Expected PDF but got ${contentType}`);
        }

        const buffer = await response.arrayBuffer();

        // Validate PDF header (PDF files start with %PDF-)
        const pdfHeader = new Uint8Array(buffer.slice(0, 5));
        const headerStr = String.fromCharCode(...pdfHeader);
        if (headerStr !== "%PDF-") {
          throw new Error(
            "Invalid PDF file: file does not have valid PDF header",
          );
        }

        if (!cancelled) {
          setPdfData(buffer);
          if (loadingTimeoutRef.current) {
            clearTimeout(loadingTimeoutRef.current);
            loadingTimeoutRef.current = null;
          }
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load PDF");
          setLoading(false);
          if (loadingTimeoutRef.current) {
            clearTimeout(loadingTimeoutRef.current);
            loadingTimeoutRef.current = null;
          }
        }
      }
    };

    loadPdf();

    return () => {
      cancelled = true;
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    };
  }, [pdfUrl, refreshKey]);

  const onDocumentLoadSuccess = useCallback(
    ({ numPages }: { numPages: number }) => {
      // Clear the loading timeout since document loaded successfully
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }

      setNumPages(numPages);

      // Restore saved page or default to 1
      const key = getPageStorageKey(projectId);
      let initialPage = 1;
      if (key) {
        const saved = localStorage.getItem(key);
        if (saved) {
          const parsed = parseInt(saved, 10);
          if (!isNaN(parsed) && parsed >= 1 && parsed <= numPages) {
            initialPage = parsed;
          }
        }
      }

      setPageNumber(initialPage);
      setPageInputValue(initialPage.toString());
      setLoading(false);
      setError(null);
    },
    [projectId],
  );

  const onDocumentLoadError = useCallback((err: Error) => {
    // Clear the loading timeout since we got an error response
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }

    setError(`PDF parsing error: ${err.message}`);
    setLoading(false);
  }, []);

  const onPageLoadSuccess = useCallback(
    (page: { width: number; height: number; originalWidth: number; originalHeight: number }) => {
      pageSizePtRef.current = { width: page.originalWidth, height: page.originalHeight };
      setPageWidth(page.width);
      setPageHeight(page.height);

      // Auto-fit to width on first render if no saved zoom exists
      const savedZoom = localStorage.getItem(ZOOM_STORAGE_KEY);
      if (!savedZoom && containerWidth > 0 && page.width > 0) {
        const availableWidth = containerWidth - 64;
        const newScale = availableWidth / page.width;
        setScale(Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newScale)));
      }
    },
    [containerWidth],
  );

  const onPageRenderSuccess = useCallback(() => {
    // Page rendered successfully
  }, []);

  // SyncTeX: show a location requested from the editor
  useEffect(() => {
    if (!highlight) return;
    setPageNumber(highlight.page);
    setPageInputValue(highlight.page.toString());
    setVisibleHighlight(highlight);
    const timer = setTimeout(() => setVisibleHighlight(null), 2500);
    return () => clearTimeout(timer);
  }, [highlight]);

  // Scroll the first highlighted box into view once the page has rendered
  useEffect(() => {
    if (!visibleHighlight || visibleHighlight.page !== pageNumber) return;
    const frame = requestAnimationFrame(() => {
      pageWrapperRef.current
        ?.querySelector<HTMLElement>("[data-synctex-highlight]")
        ?.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
    });
    return () => cancelAnimationFrame(frame);
  }, [visibleHighlight, pageNumber, scale]);

  // SyncTeX: double-click or Ctrl/Cmd+click on the page -> source
  const handlePageClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!onSyncClick) return;
      if (e.type === "click" && !(e.ctrlKey || e.metaKey)) return;
      const pageEl = pageWrapperRef.current?.querySelector<HTMLElement>(".react-pdf__Page");
      const size = pageSizePtRef.current;
      if (!pageEl || !size) return;
      const rect = pageEl.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const x = ((e.clientX - rect.left) / rect.width) * size.width;
      const y = ((e.clientY - rect.top) / rect.height) * size.height;
      if (x < 0 || y < 0 || x > size.width || y > size.height) return;
      e.preventDefault();
      window.getSelection()?.removeAllRanges();
      onSyncClick(pageNumber, x, y);
    },
    [onSyncClick, pageNumber],
  );

  // Navigation functions
  const goToFirstPage = useCallback(() => {
    if (numPages > 0) {
      setPageNumber(1);
      setPageInputValue("1");
    }
  }, [numPages]);

  const goToLastPage = useCallback(() => {
    if (numPages > 0) {
      setPageNumber(numPages);
      setPageInputValue(numPages.toString());
    }
  }, [numPages]);

  const goToPrevPage = useCallback(() => {
    setPageNumber((prev) => {
      const newPage = Math.max(prev - 1, 1);
      setPageInputValue(newPage.toString());
      return newPage;
    });
  }, []);

  const goToNextPage = useCallback(() => {
    setPageNumber((prev) => {
      const newPage = Math.min(prev + 1, numPages);
      setPageInputValue(newPage.toString());
      return newPage;
    });
  }, [numPages]);

  const handlePageInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setPageInputValue(e.target.value);
    },
    [],
  );

  const handlePageInputSubmit = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        const page = parseInt(pageInputValue, 10);
        if (!isNaN(page) && page >= 1 && page <= numPages) {
          setPageNumber(page);
          setPageInputValue(page.toString());
          pageInputRef.current?.blur();
        } else {
          // Reset to current page if invalid
          setPageInputValue(pageNumber.toString());
        }
      }
    },
    [pageInputValue, numPages, pageNumber],
  );

  const handlePageInputBlur = useCallback(() => {
    const page = parseInt(pageInputValue, 10);
    if (!isNaN(page) && page >= 1 && page <= numPages) {
      setPageNumber(page);
    } else {
      setPageInputValue(pageNumber.toString());
    }
  }, [pageInputValue, numPages, pageNumber]);

  // Zoom functions
  const zoomIn = useCallback(() => {
    setScale((prev) => {
      const newScale = Math.min(prev + ZOOM_STEP, MAX_ZOOM);
      setZoomInputValue(Math.round(newScale * 100).toString());
      return newScale;
    });
  }, []);

  const zoomOut = useCallback(() => {
    setScale((prev) => {
      const newScale = Math.max(prev - ZOOM_STEP, MIN_ZOOM);
      setZoomInputValue(Math.round(newScale * 100).toString());
      return newScale;
    });
  }, []);

  const setZoomValue = useCallback((value: number) => {
    const clampedValue = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, value));
    setScale(clampedValue);
    setZoomInputValue(Math.round(clampedValue * 100).toString());
    setIsDropdownOpen(false);
  }, []);

  const handleZoomInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setZoomInputValue(e.target.value.replace(/[^0-9]/g, ""));
    },
    [],
  );

  const handleZoomInputSubmit = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        const percent = parseInt(zoomInputValue, 10);
        if (!isNaN(percent) && percent >= 25 && percent <= 400) {
          setScale(percent / 100);
          zoomInputRef.current?.blur();
        } else {
          setZoomInputValue(Math.round(scale * 100).toString());
        }
      }
    },
    [zoomInputValue, scale],
  );

  const handleZoomInputBlur = useCallback(() => {
    const percent = parseInt(zoomInputValue, 10);
    if (!isNaN(percent) && percent >= 25 && percent <= 400) {
      setScale(percent / 100);
    } else {
      setZoomInputValue(Math.round(scale * 100).toString());
    }
  }, [zoomInputValue, scale]);

  // Fit functions
  const fitToWidth = useCallback(() => {
    if (containerWidth > 0 && pageWidth > 0) {
      // Account for padding (32px on each side = 64px total)
      const availableWidth = containerWidth - 64;
      const newScale = availableWidth / pageWidth;
      setZoomValue(newScale);
    }
  }, [containerWidth, pageWidth, setZoomValue]);

  const fitToPage = useCallback(() => {
    if (containerWidth > 0 && pageHeight > 0) {
      // Account for padding (32px on each side = 64px total)
      const availableWidth = containerWidth - 64;
      const availableHeight = window.innerHeight - 150; // Account for toolbar and margins

      const scaleX = availableWidth / pageWidth;
      const scaleY = availableHeight / pageHeight;
      const newScale = Math.min(scaleX, scaleY);
      setZoomValue(newScale);
    }
  }, [containerWidth, pageHeight, pageWidth, setZoomValue]);

  useEffect(() => {
    setZoomInputValue(Math.round(scale * 100).toString());
  }, [scale]);

  // Memoized toolbar button classes
  const toolbarButtonClass = useMemo(
    () =>
      "p-1.5 rounded hover:bg-surface-hover text-muted hover:text-heading disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer",
    [],
  );

  const toolbarButtonActiveClass = useMemo(
    () => "p-1.5 rounded bg-surface-hover text-primary transition-colors cursor-pointer",
    [],
  );

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-muted">
        <div className="flex flex-col items-center gap-2">
          <svg
            className="animate-spin h-8 w-8 text-primary"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="text-sm font-medium">Loading PDF...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center text-error p-4 bg-background">
        <div className="text-center animate-fade-in">
          <svg
            className="mx-auto h-12 w-12 text-error/60 mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <p className="font-semibold text-heading">Failed to load PDF</p>
          <p className="text-sm text-error/70 mt-1 max-w-xs mx-auto">{error}</p>
          <button
            onClick={openInNewTab}
            className="mt-4 px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-dark transition-all active:scale-[0.98] cursor-pointer"
          >
            Open in New Tab
          </button>
        </div>
      </div>
    );
  }

  if (!pdfData) {
    return (
      <div className="h-full flex items-center justify-center text-muted p-4 bg-background">
        <div className="text-center opacity-60">
          <svg
            className="mx-auto h-12 w-12 text-muted"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
          <p className="mt-2 font-medium">PDF Preview</p>
          <p className="text-sm">No PDF available</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-full flex flex-col"
      ref={containerRef}
      tabIndex={0}
      role="region"
      aria-label="PDF Preview"
    >
      {/* Screen reader announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        Page {pageNumber} of {numPages || 1}
      </div>

      {/* Toolbar */}
      <div
        className="flex flex-wrap items-center justify-between px-3 py-1.5 bg-surface border-b border-border gap-x-4 gap-y-1.5"
        role="toolbar"
        aria-label="PDF controls"
      >
        {/* Page Navigation Section */}
        <div
          className="flex items-center gap-1"
          role="group"
          aria-label="Page navigation"
        >
          {/* First Page */}
          <button
            onClick={goToFirstPage}
            disabled={pageNumber <= 1}
            className={toolbarButtonClass}
            aria-label="First page"
            title="First page (Home)"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
              />
            </svg>
          </button>

          {/* Previous Page */}
          <button
            onClick={goToPrevPage}
            disabled={pageNumber <= 1}
            className={toolbarButtonClass}
            aria-label="Previous page"
            title="Previous page (Page Up)"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          {/* Page Input */}
          <div className="flex items-center gap-1">
            <label htmlFor="page-input" className="sr-only">
              Current page
            </label>
            <input
              id="page-input"
              ref={pageInputRef}
              type="text"
              value={pageInputValue}
              onChange={handlePageInputChange}
              onKeyDown={handlePageInputSubmit}
              onBlur={handlePageInputBlur}
              className="w-10 px-1.5 py-0.5 text-sm text-center border border-border bg-surface text-heading rounded focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
              aria-label={`Page ${pageNumber} of ${numPages || 1}`}
              title={`Current page (of ${numPages}). Type page number and press Enter.`}
            />
            <span className="text-sm text-muted" aria-hidden="true">
              /
            </span>
            <span
              className="text-sm text-secondary font-medium"
              aria-label={`total ${numPages || 0} pages`}
            >
              {numPages || "-"}
            </span>
          </div>

          {/* Next Page */}
          <button
            onClick={goToNextPage}
            disabled={pageNumber >= numPages}
            className={toolbarButtonClass}
            aria-label="Next page"
            title="Next page (Page Down)"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>

          {/* Last Page */}
          <button
            onClick={goToLastPage}
            disabled={pageNumber >= numPages}
            className={toolbarButtonClass}
            aria-label="Last page"
            title="Last page (End)"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 5l7 7-7 7M5 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>

        {/* Zoom Section */}
        <div
          className="flex items-center gap-1"
          role="group"
          aria-label="Zoom controls"
        >
          {/* Fit to Width */}
          <button
            onClick={fitToWidth}
            className={toolbarButtonClass}
            aria-label="Fit to width"
            title="Fit to width"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
              />
            </svg>
          </button>

          {/* Fit to Page */}
          <button
            onClick={fitToPage}
            className={toolbarButtonClass}
            aria-label="Fit to page"
            title="Fit to page"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
              />
            </svg>
          </button>

          <div
            className="w-px h-5 bg-border mx-1"
            role="separator"
            aria-orientation="vertical"
          />

          {/* Zoom Out */}
          <button
            onClick={zoomOut}
            disabled={scale <= MIN_ZOOM}
            className={toolbarButtonClass}
            aria-label="Zoom out"
            title="Zoom out"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 12H4"
              />
            </svg>
          </button>

          {/* Zoom Input */}
          <div className="flex items-center gap-1">
            <label htmlFor="zoom-input" className="sr-only">
              Zoom percentage
            </label>
            <input
              id="zoom-input"
              ref={zoomInputRef}
              type="text"
              value={zoomInputValue}
              onChange={handleZoomInputChange}
              onKeyDown={handleZoomInputSubmit}
              onBlur={handleZoomInputBlur}
              className="w-12 px-1.5 py-0.5 text-sm text-center border border-border bg-surface text-heading rounded focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
              aria-label={`Zoom: ${zoomInputValue}%`}
              title="Zoom percentage (25-400%). Type and press Enter."
            />
            <span className="text-sm text-muted" aria-hidden="true">
              %
            </span>
          </div>

          {/* Zoom In */}
          <button
            onClick={zoomIn}
            disabled={scale >= MAX_ZOOM}
            className={toolbarButtonClass}
            aria-label="Zoom in"
            title="Zoom in"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>

          {/* Zoom Presets Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={
                isDropdownOpen ? toolbarButtonActiveClass : toolbarButtonClass
              }
              aria-label="Zoom presets"
              aria-expanded={isDropdownOpen}
              aria-haspopup="listbox"
              title="Zoom presets"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {isDropdownOpen && (
              <ul
                className="absolute top-full left-0 mt-1 bg-surface border border-border rounded-lg shadow-lg z-10 py-1 min-w-[80px] animate-fade-in"
                role="listbox"
                aria-label="Zoom level options"
              >
                {ZOOM_PRESETS.map((preset) => (
                  <li key={preset.value}>
                    <button
                      onClick={() => setZoomValue(preset.value)}
                      className={`w-full px-3 py-1.5 text-sm text-left hover:bg-surface-hover transition-colors cursor-pointer ${
                        Math.abs(scale - preset.value) < 0.01
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-secondary"
                      }`}
                      role="option"
                      aria-selected={Math.abs(scale - preset.value) < 0.01}
                    >
                      {preset.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="flex items-center shrink-0 ml-auto">
          <button
            onClick={savePdf}
            disabled={!pdfData || saving}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap shrink-0 text-secondary border border-border hover:bg-surface-hover hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            aria-label="Save PDF"
            title={`Save PDF${downloadName ? ` (${downloadName})` : ""}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Save PDF
          </button>
        </div>
      </div>

      {/* PDF Content */}
      <div className="flex-1 overflow-auto bg-background flex items-start justify-center p-4">
        <Document
          file={pdfData}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={
            <div className="flex items-center justify-center h-64">
              <svg
                className="animate-spin h-8 w-8 text-primary"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
          }
        >
          <div
            ref={pageWrapperRef}
            className="relative"
            onDoubleClick={handlePageClick}
            onClick={handlePageClick}
            title={onSyncClick ? "Double-click (or Ctrl/Cmd+click) to jump to the source" : undefined}
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              className="shadow-xl"
              onLoadSuccess={onPageLoadSuccess}
              onRenderSuccess={onPageRenderSuccess}
            />
            {visibleHighlight?.page === pageNumber &&
              visibleHighlight.rects.map((r, i) => (
                <div
                  key={`${visibleHighlight.nonce}-${i}`}
                  data-synctex-highlight
                  aria-hidden="true"
                  className="synctex-pdf-highlight pointer-events-none absolute z-10 rounded-sm"
                  style={{
                    left: r.x * scale - 2,
                    top: r.y * scale - 2,
                    width: r.width * scale + 4,
                    height: Math.max(r.height * scale, 8) + 4,
                  }}
                />
              ))}
          </div>
        </Document>
      </div>
    </div>
  );
});

export default PDFPreview;
