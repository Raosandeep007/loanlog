/**
 * Formatter Utilities
 * Functions for formatting data for display
 */

/**
 * Format currency amount
 */
export function formatCurrency(amount: number | null | undefined, currency: string = 'USD'): string {
  if (amount === null || amount === undefined) return '-';

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${parseFloat(amount.toString()).toFixed(2)}`;
  }
}

/**
 * Format date
 */
export function formatDate(date: Date | number | string | null | undefined, format: 'short' | 'long' | 'relative' = 'short'): string {
  if (!date) return '-';

  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;

  if (format === 'short') {
    return dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  if (format === 'long') {
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }

  if (format === 'relative') {
    return formatRelativeDate(dateObj);
  }

  return dateObj.toLocaleDateString();
}

/**
 * Format relative date
 */
export function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffInMs = date.getTime() - now.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return 'Tomorrow';
  if (diffInDays === -1) return 'Yesterday';
  if (diffInDays > 1 && diffInDays <= 7) return `In ${diffInDays} days`;
  if (diffInDays < -1 && diffInDays >= -7) return `${Math.abs(diffInDays)} days ago`;

  return formatDate(date);
}

/**
 * Calculate days until date
 */
export function daysUntil(date: Date | number | string): number {
  const now = new Date();
  const targetDate = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  const diffInMs = targetDate.getTime() - now.getTime();
  return Math.ceil(diffInMs / (1000 * 60 * 60 * 24));
}

/**
 * Get urgency level for due date
 */
export function getUrgencyLevel(dueDate: Date | number | string): 'overdue' | 'due_today' | 'due_this_week' | 'due_this_month' | 'upcoming' {
  const days = daysUntil(dueDate);

  if (days < 0) return 'overdue';
  if (days === 0) return 'due_today';
  if (days <= 7) return 'due_this_week';
  if (days <= 30) return 'due_this_month';

  return 'upcoming';
}

/**
 * Format percentage
 */
export function formatPercentage(value: number | null | undefined, decimals: number = 1): string {
  if (value === null || value === undefined) return '-';
  return `${parseFloat(value.toString()).toFixed(decimals)}%`;
}

/**
 * Format phone number
 */
export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return '-';

  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }

  return phone;
}

/**
 * Abbreviate large numbers
 */
export function abbreviateNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return '-';

  const absNum = Math.abs(num);

  if (absNum >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'B';
  }
  if (absNum >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (absNum >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }

  return num.toString();
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string | null | undefined, maxLength: number = 50): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Get status color (for use with class names)
 */
export function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    active: 'text-chart-1',
    partially_paid: 'text-chart-2',
    fully_paid: 'text-chart-3',
    overdue: 'text-destructive',
    written_off: 'text-muted-foreground',
  };

  return colorMap[status] || 'text-foreground';
}

/**
 * Get status background color
 */
export function getStatusBgColor(status: string): string {
  const colorMap: Record<string, string> = {
    active: 'bg-accent',
    partially_paid: 'bg-secondary',
    fully_paid: 'bg-chart-3/10',
    overdue: 'bg-destructive/10',
    written_off: 'bg-muted',
  };

  return colorMap[status] || 'bg-card';
}

/**
 * Format loan type
 */
export function formatLoanType(type: 'given' | 'taken'): string {
  return type === 'given' ? 'Lent' : 'Borrowed';
}

/**
 * Get loan type icon
 */
export function getLoanTypeIcon(type: 'given' | 'taken'): string {
  return type === 'given' ? '📤' : '📥';
}
