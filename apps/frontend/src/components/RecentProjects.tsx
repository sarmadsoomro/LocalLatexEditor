import React from 'react';
import { Clock, FolderOpen, ChevronRight } from 'lucide-react';
import type { ProjectWithMetadata } from '@local-latex-editor/shared-types';
import { formatTimeAgo, formatFullDate } from '../utils/date';
import { isToday, isYesterday, isThisWeek } from 'date-fns';

interface RecentProjectsProps {
  projects: ProjectWithMetadata[];
  onOpenProject: (projectId: string) => void;
  maxItems?: number;
}

export const RecentProjects: React.FC<RecentProjectsProps> = ({
  projects,
  onOpenProject,
  maxItems = 6,
}) => {
  // Sort by lastOpened (most recent first), filter out projects never opened
  const recentProjects = [...projects]
    .filter((p) => p.metadata?.lastOpened)
    .sort((a, b) => {
      const dateA = new Date(a.metadata.lastOpened!).getTime();
      const dateB = new Date(b.metadata.lastOpened!).getTime();
      return dateB - dateA;
    })
    .slice(0, maxItems);

  if (recentProjects.length === 0) {
    return null;
  }

  // Group projects by date for display
  const groupedProjects: ProjectWithMetadata[][] = [
    recentProjects.filter(p => {
      if (!p.metadata?.lastOpened) return false;
      const date = typeof p.metadata.lastOpened === 'string' ? new Date(p.metadata.lastOpened) : p.metadata.lastOpened;
      return isToday(date);
    }),
    recentProjects.filter(p => {
      if (!p.metadata?.lastOpened) return false;
      const date = typeof p.metadata.lastOpened === 'string' ? new Date(p.metadata.lastOpened) : p.metadata.lastOpened;
      return isYesterday(date);
    }),
    recentProjects.filter(p => {
      if (!p.metadata?.lastOpened) return false;
      const date = typeof p.metadata.lastOpened === 'string' ? new Date(p.metadata.lastOpened) : p.metadata.lastOpened;
      return isThisWeek(date) && !isToday(date) && !isYesterday(date);
    }),
    recentProjects.filter(p => {
      if (!p.metadata?.lastOpened) return false;
      const date = typeof p.metadata.lastOpened === 'string' ? new Date(p.metadata.lastOpened) : p.metadata.lastOpened;
      return !isThisWeek(date);
    }),
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <div className="p-2 bg-cta/10 rounded-xl">
          <Clock className="text-cta" size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-heading">Recent Papers</h2>
          <p className="text-xs font-medium text-muted uppercase tracking-widest mt-0.5 opacity-60">Continue your research</p>
        </div>
      </div>

      {/* Today's projects */}
      {groupedProjects[0].length > 0 && (
        <ProjectGroup
          title="Today"
          projects={groupedProjects[0]}
          onOpenProject={onOpenProject}
        />
      )}

      {/* Yesterday's projects */}
      {groupedProjects[1].length > 0 && (
        <ProjectGroup
          title="Yesterday"
          projects={groupedProjects[1]}
          onOpenProject={onOpenProject}
        />
      )}

      {/* This week's projects */}
      {groupedProjects[2].length > 0 && (
        <ProjectGroup
          title="This Week"
          projects={groupedProjects[2]}
          onOpenProject={onOpenProject}
        />
      )}

      {/* Older projects (only show if no recent ones exist) */}
      {groupedProjects[0].length === 0 &&
        groupedProjects[1].length === 0 &&
        groupedProjects[2].length === 0 &&
        groupedProjects[3].length > 0 && (
          <ProjectGroup
            title="Earlier"
            projects={groupedProjects[3]}
            onOpenProject={onOpenProject}
          />
        )}
    </div>
  );
};

interface ProjectGroupProps {
  title: string;
  projects: ProjectWithMetadata[];
  onOpenProject: (projectId: string) => void;
}

const ProjectGroup: React.FC<ProjectGroupProps> = ({ title, projects, onOpenProject }) => (
  <div className="animate-fade-in">
    <h3 className="text-xs font-bold text-muted mb-4 uppercase tracking-[0.2em] opacity-40">
      {title}
    </h3>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <RecentProjectCard
          key={project.id}
          project={project}
          onClick={() => onOpenProject(project.id)}
        />
      ))}
    </div>
  </div>
);

interface RecentProjectCardProps {
  project: ProjectWithMetadata;
  onClick: () => void;
}

const RecentProjectCard: React.FC<RecentProjectCardProps> = ({ project, onClick }) => (
  <button
    onClick={onClick}
    className="group flex items-start gap-4 p-4 bg-surface hover:bg-surface-hover border border-border hover:border-cta rounded-2xl transition-all text-left w-full shadow-soft-sm hover:shadow-soft-md cursor-pointer animate-fade-in"
    aria-label={`Open project ${project.name}`}
  >
    <div className="flex-shrink-0 w-12 h-12 bg-primary/5 rounded-xl flex items-center justify-center group-hover:bg-cta group-hover:text-white transition-all duration-base shadow-inner">
      <FolderOpen className="text-primary/60 group-hover:text-inherit" size={24} />
    </div>
    <div className="flex-1 min-w-0">
      <h4 className="font-heading text-base font-bold text-heading truncate group-hover:text-cta transition-colors">
        {project.name}
      </h4>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-xs font-bold text-cta uppercase tracking-widest bg-cta/5 px-1.5 py-0.5 rounded">
          {project.metadata.template}
        </span>
        <span
          className="text-xs text-muted flex items-center gap-1"
          title={formatFullDate(project.metadata.lastOpened)}
        >
          <Clock size={12} className="opacity-40" />
          {formatTimeAgo(project.metadata.lastOpened)}
        </span>
      </div>
      <p className="text-xs text-secondary mt-2 truncate opacity-60 italic font-medium">
        {project.path}
      </p>
    </div>
    <div className="flex-shrink-0 self-center p-1.5 rounded-full bg-border/20 group-hover:bg-cta/10 transition-colors">
      <ChevronRight
        className="text-muted group-hover:text-cta transition-colors"
        size={16}
      />
    </div>
  </button>
);

export default RecentProjects;
