import { useState, useEffect, useRef } from "react";
import type { Template } from "@local-latex-editor/shared-types";

interface CreateProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, template: Template) => void;
}

const templates: { value: Template; label: string; icon: string }[] = [
  { value: "article", label: "Article", icon: "📄" },
  { value: "report", label: "Report", icon: "📊" },
  { value: "book", label: "Book", icon: "📚" },
  { value: "beamer", label: "Presentation", icon: "📽️" },
  { value: "letter", label: "Letter", icon: "✉️" },
  { value: "empty", label: "Empty Project", icon: "📁" },
];

export function CreateProjectDialog({
  isOpen,
  onClose,
  onCreate,
}: CreateProjectDialogProps) {
  const [name, setName] = useState("");
  const [template, setTemplate] = useState<Template>("article");
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      document.body.style.overflow = "hidden";
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 0);
    } else {
      document.body.style.overflow = "";
      previousActiveElement.current?.focus();
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !dialogRef.current) return;

      const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.addEventListener("keydown", handleTab);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("keydown", handleTab);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Project name is required");
      return;
    }

    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(name)) {
      setError("Project name contains invalid characters");
      return;
    }

    onCreate(name.trim(), template);
    setName("");
    setTemplate("article");
  };

  const handleClose = () => {
    setName("");
    setTemplate("article");
    setError(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-dialog-title"
    >
      <div
        ref={dialogRef}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-fade-in"
        role="document"
        style={{ animationDelay: "50ms" }}
      >
        <div className="flex items-center justify-between p-6 border-b border-[#E2E8F0] bg-gradient-to-r from-[#F0FDFA] to-white">
          <div>
            <h2
              id="create-dialog-title"
              className="font-heading text-xl font-semibold text-[#134E4A]"
            >
              Create New Project
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Set up a new LaTeX project
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg text-[#94A3B8] hover:text-[#475569] hover:bg-[#F1F5F9] transition-all duration-100 focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
            aria-label="Close dialog"
          >
            <svg
              className="w-5 h-5"
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

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div
              className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm animate-fade-in"
              role="alert"
            >
              <div className="flex items-center">
                <svg
                  className="w-4 h-4 mr-2 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {error}
              </div>
            </div>
          )}

          <div className="mb-5">
            <label
              htmlFor="project-name"
              className="block text-sm font-medium text-[#134E4A] mb-1.5"
            >
              Project Name
            </label>
            <input
              id="project-name"
              ref={nameInputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Research Paper"
              className="w-full px-3.5 py-2.5 border border-[#E2E8F0] rounded-lg 
                focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488]
                placeholder:text-[#CBD5E1] text-[#134E4A]
                transition-all duration-150"
              aria-required="true"
              aria-invalid={error ? "true" : "false"}
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-[#134E4A] mb-2">
              Template
            </label>
            <div className="grid grid-cols-2 gap-2">
              {templates.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTemplate(t.value)}
                  className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium border transition-all duration-150 text-left
                    ${
                      template === t.value
                        ? "bg-[#F0FDFA] border-[#0D9488] text-[#0D9488] ring-1 ring-[#0D9488]"
                        : "bg-white border-[#E2E8F0] text-[#475569] hover:border-[#14B8A6] hover:bg-[#F8FAFC]"
                    }`}
                >
                  <span className="mr-2 text-base">{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-[#475569] bg-white border border-[#E2E8F0] rounded-lg 
                hover:bg-[#F8FAFC] hover:border-[#CBD5E1] 
                focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:ring-offset-2
                transition-all duration-150"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-[#F97316] rounded-lg
                hover:bg-[#EA580C] hover:shadow-md hover:shadow-orange-200
                focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:ring-offset-2
                transition-all duration-150 active:scale-[0.98]"
            >
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
