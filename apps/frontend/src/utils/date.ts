import { format, formatDistanceToNow, isToday, isYesterday, isThisWeek, parseISO } from 'date-fns';

/**
 * Format a date for display in recent projects list
 * Shows: "Today", "Yesterday", "This Week", or actual date
 */
export function formatRelativeDate(dateString: string | Date | undefined): string {
  if (!dateString) return 'Never opened';

  const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;

  if (isToday(date)) {
    return `Today at ${format(date, 'h:mm a')}`;
  }

  if (isYesterday(date)) {
    return `Yesterday at ${format(date, 'h:mm a')}`;
  }

  if (isThisWeek(date)) {
    return format(date, 'EEEE'); // Day name (Monday, Tuesday, etc.)
  }

  // Older than a week
  return format(date, 'MMM d, yyyy');
}

/**
 * Format as "2 hours ago", "3 days ago", etc.
 */
export function formatTimeAgo(dateString: string | Date | undefined): string {
  if (!dateString) return 'Never';

  const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;

  return formatDistanceToNow(date, { addSuffix: true });
}

/**
 * Format for tooltip (full datetime)
 */
export function formatFullDate(dateString: string | Date | undefined): string {
  if (!dateString) return 'Never opened';

  const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;

  return format(date, 'MMMM d, yyyy h:mm:ss a');
}

/**
 * Group projects by time period for sectioned list
 */
export interface GroupedProjects<T> {
  today: T[];
  yesterday: T[];
  thisWeek: T[];
  older: T[];
}

export function groupByDate<T extends { lastOpened?: string | Date }>(
  items: T[]
): GroupedProjects<T> {
  const grouped: GroupedProjects<T> = {
    today: [],
    yesterday: [],
    thisWeek: [],
    older: [],
  };

  items.forEach((item) => {
    if (!item.lastOpened) {
      grouped.older.push(item);
      return;
    }

    const date = typeof item.lastOpened === 'string' ? parseISO(item.lastOpened) : item.lastOpened;

    if (isToday(date)) {
      grouped.today.push(item);
    } else if (isYesterday(date)) {
      grouped.yesterday.push(item);
    } else if (isThisWeek(date)) {
      grouped.thisWeek.push(item);
    } else {
      grouped.older.push(item);
    }
  });

  return grouped;
}
