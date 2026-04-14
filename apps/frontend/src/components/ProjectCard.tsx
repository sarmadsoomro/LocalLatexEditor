import type { ProjectWithMetadata } from "@local-latex-editor/shared-types";

interface ProjectCardProps {
  project: ProjectWithMetadata;
  onClick?: () => void;
  onDelete?: () => void;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function formatDate(dateString: string | Date): string {
  const date =
    typeof dateString === "string" ? new Date(dateString) : dateString;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ProjectCard({ project, onClick, onDelete }: ProjectCardProps) {
  return (
    <article
      className="group bg-white rounded-xl shadow-sm border border-[#E2E8F0] p-6 cursor-pointer
        hover:shadow-lg hover:border-[#14B8A6] hover:-translate-y-0.5
        transition-all duration-150 ease-out
        focus-within:ring-2 focus-within:ring-[#0D9488] focus-within:ring-offset-2"
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`Open project ${project.name}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-heading text-lg font-semibold text-[#134E4A] truncate group-hover:text-[#0D9488] transition-colors duration-150">
            {project.name}
          </h3>
          <p className="mt-1 text-sm text-[#64748B]">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#F0FDFA] text-[#0D9488]">
              {project.metadata.template}
            </span>
          </p>
        </div>
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="ml-4 p-1.5 rounded-lg text-[#94A3B8] hover:text-[#EF4444] hover:bg-red-50 
              transition-all duration-100 focus:outline-none focus:ring-2 focus:ring-red-500"
            aria-label={`Delete project ${project.name}`}
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
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-[#64748B]">
        <div className="flex items-center space-x-4">
          <span className="flex items-center">
            <svg
              className="w-4 h-4 mr-1.5 text-[#14B8A6]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span aria-label={`${project.metadata.fileCount} files`}>
              {project.metadata.fileCount} files
            </span>
          </span>
          <span
            className="flex items-center"
            aria-label={`Total size ${formatFileSize(project.metadata.totalSize)}`}
          >
            <svg
              className="w-4 h-4 mr-1.5 text-[#94A3B8]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
              />
            </svg>
            {formatFileSize(project.metadata.totalSize)}
          </span>
        </div>
        <time
          dateTime={
            typeof project.createdAt === "string"
              ? project.createdAt
              : (project.createdAt as Date).toISOString()
          }
          className="text-[#94A3B8]"
        >
          {formatDate(project.createdAt)}
        </time>
      </div>

      <div className="mt-3 pt-3 border-t border-[#F1F5F9] flex items-center text-xs text-[#94A3B8]">
        <svg
          className="w-3.5 h-3.5 mr-1.5 text-[#CBD5E1]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
        Main:{" "}
        <span className="ml-1 font-medium text-[#64748B]">
          {project.metadata.mainFile}
        </span>
      </div>
    </article>
  );
}
