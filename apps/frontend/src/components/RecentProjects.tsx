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
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Clock className="text-primary" size={20} />
        <h2 className="text-lg font-semibold text-heading">Recent Projects</h2>
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
  <div>
    <h3 className="text-[10px] font-bold text-muted mb-3 uppercase tracking-wider">
      {title}
    </h3>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
    className="group flex items-start gap-3 p-4 bg-surface hover:bg-surface-hover border border-border hover:border-primary rounded-xl transition-all duration-base text-left w-full hover-lift cursor-pointer shadow-sm hover:shadow-md shadow-primary/5"
  >
    <div className="flex-shrink-0 p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg group-hover:bg-primary group-hover:text-white transition-colors">
      <FolderOpen className="text-primary group-hover:text-inherit" size={24} />
    </div>
    <div className="flex-1 min-w-0">
      <h4 className="font-semibold text-heading truncate group-hover:text-primary transition-colors">
        {project.name}
      </h4>
      <p
        className="text-xs text-secondary mt-1 flex items-center gap-1.5"
        title={formatFullDate(project.metadata.lastOpened)}
      >
        <span className="w-1 h-1 rounded-full bg-primary-light" />
        {formatTimeAgo(project.metadata.lastOpened)}
      </p>
      <p className="text-[10px] font-mono text-muted mt-1.5 truncate opacity-60">
        {project.path}
      </p>
    </div>
    <ChevronRight
      className="flex-shrink-0 text-muted group-hover:text-primary transition-colors self-center"
      size={18}
    />
  </button>
);

export default RecentProjects;
