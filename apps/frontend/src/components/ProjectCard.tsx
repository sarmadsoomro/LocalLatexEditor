import { useState } from "react";
import type { ProjectWithMetadata, ProjectStatus } from "@local-latex-editor/shared-types";
import { EditableProjectName } from "./EditableProjectName";
import { useProjectStore } from "../stores/projectStore";
import { ChevronDown } from "lucide-react";

interface ProjectCardProps {
  project: ProjectWithMetadata;
  onClick?: () => void;
  onDelete?: () => void;
  onExport?: () => void;
  onRename?: (newName: string) => Promise<void>;
  isExporting?: boolean;
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

function getStatusColor(status: ProjectStatus | undefined): string {
  switch (status) {
    case 'published':
      return 'bg-success/10 text-success border-success/20';
    case 'in_progress':
      return 'bg-warning/10 text-warning border-warning/20';
    case 'draft':
    default:
      return 'bg-muted/10 text-muted border-border';
  }
}

function getStatusLabel(status: ProjectStatus | undefined): string {
  switch (status) {
    case 'published':
      return 'Published';
    case 'in_progress':
      return 'In Progress';
    case 'draft':
    default:
      return 'Draft';
  }
}

export function ProjectCard({
  project,
  onClick,
  onDelete,
  onExport,
  onRename,
  isExporting,
}: ProjectCardProps) {
  const { renameProject, updateProjectStatus } = useProjectStore();
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);

  const handleRename = async (newName: string) => {
    if (onRename) {
      await onRename(newName);
    } else {
      await renameProject(project.id, newName);
    }
  };

  const handleStatusChange = async (newStatus: ProjectStatus) => {
    try {
      await updateProjectStatus(project.id, newStatus);
      setIsStatusMenuOpen(false);
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const statusOptions: { value: ProjectStatus; label: string; color: string }[] = [
    { value: 'draft', label: 'Draft', color: 'bg-muted' },
    { value: 'in_progress', label: 'In Progress', color: 'bg-warning' },
    { value: 'published', label: 'Published', color: 'bg-success' },
  ];
  return (
    <article
      className="group bg-surface rounded-2xl shadow-soft-sm border border-border p-5
        hover:shadow-soft-xl hover:border-cta transition-all duration-slow ease-out
        relative flex flex-col h-full"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <EditableProjectName
            projectId={project.id}
            initialName={project.name}
            onRename={handleRename}
            size="lg"
            className="font-heading text-xl font-bold text-heading hover:text-cta transition-colors leading-tight"
          />
          <div className="mt-2 flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider text-muted border border-border">
              {project.metadata.template}
            </span>
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsStatusMenuOpen(!isStatusMenuOpen);
                }}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider border cursor-pointer hover:opacity-80 transition-opacity ${getStatusColor(project.metadata.status)}`}
              >
                {getStatusLabel(project.metadata.status)}
                <ChevronDown className="w-3 h-3" />
              </button>
              
              {isStatusMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsStatusMenuOpen(false)}
                  />
                  <div className="absolute top-full left-0 mt-1 w-40 bg-surface border border-border rounded-xl shadow-soft-lg z-50 py-1">
                    {statusOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(option.value);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-left hover:bg-surface-hover transition-colors ${
                          project.metadata.status === option.value ? 'bg-surface-hover' : ''
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${option.color}`} />
                        {option.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onClick}
            className="p-1.5 rounded-lg text-muted hover:text-cta hover:bg-cta/5 transition-all"
            aria-label="Open project"
            title="Open project"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </button>
          {onExport && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onExport();
              }}
              disabled={isExporting}
              className="p-1.5 rounded-lg text-muted hover:text-cta hover:bg-cta/5 transition-all disabled:opacity-50"
              aria-label="Export as ZIP"
              title="Export as ZIP"
            >
              {isExporting ? (
                <span className="w-5 h-5 border-2 border-cta border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              )}
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1.5 rounded-lg text-muted hover:text-error hover:bg-error/5 transition-all"
              aria-label="Delete project"
              title="Delete project"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="mt-auto space-y-4">
        <div className="flex items-center justify-between text-xs font-medium text-secondary">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-primary/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {project.metadata.fileCount} files
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-primary/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
              {formatFileSize(project.metadata.totalSize)}
            </span>
          </div>
          <time className="text-muted tabular-nums">{formatDate(project.createdAt)}</time>
        </div>

        <div className="pt-3 border-t border-border/50 flex items-center justify-between">
          <div className="flex items-center text-xs text-muted font-bold uppercase tracking-widest truncate">
            <svg className="w-3.5 h-3.5 mr-1.5 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="truncate">Main: {project.metadata.mainFile}</span>
          </div>
          <div className="w-2 h-2 rounded-full bg-success/20 animate-pulse-soft flex-shrink-0" />
        </div>
      </div>
    </article>
  );
}
