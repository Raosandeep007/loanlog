/**
 * Utility functions for formatting data
 */

/**
 * Format currency amount
 */
export const formatCurrency = (amount, currency = 'USD') => {
  if (amount === null || amount === undefined) return '-';

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  } catch (error) {
    // Fallback if currency not supported
    return `${currency} ${parseFloat(amount).toFixed(2)}`;
  }
};

/**
 * Format date
 */
export const formatDate = (date, format = 'short') => {
  if (!date) return '-';

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (format === 'short') {
    return dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  if (format === 'long') {
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  }

  if (format === 'relative') {
    return formatRelativeDate(dateObj);
  }

  return dateObj.toLocaleDateString();
};

/**
 * Format relative date (e.g., "2 days ago", "in 3 days")
 */
export const formatRelativeDate = (date) => {
  const now = new Date();
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const diffInMs = dateObj - now;
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return 'Tomorrow';
  if (diffInDays === -1) return 'Yesterday';
  if (diffInDays > 1) return `In ${diffInDays} days`;
  if (diffInDays < -1) return `${Math.abs(diffInDays)} days ago`;

  return formatDate(date);
};

/**
 * Format percentage
 */
export const formatPercentage = (value, decimals = 1) => {
  if (value === null || value === undefined) return '-';
  return `${parseFloat(value).toFixed(decimals)}%`;
};

/**
 * Format phone number
 */
export const formatPhoneNumber = (phone) => {
  if (!phone) return '-';

  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');

  // Format as (XXX) XXX-XXXX for US numbers
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }

  // Return original if not standard format
  return phone;
};

/**
 * Format loan status
 */
export const formatLoanStatus = (status) => {
  const statusMap = {
    active: 'Active',
    partially_paid: 'Partially Paid',
    fully_paid: 'Fully Paid',
    overdue: 'Overdue',
    written_off: 'Written Off'
  };

  return statusMap[status] || status;
};

/**
 * Format payment frequency
 */
export const formatPaymentFrequency = (frequency) => {
  const frequencyMap = {
    daily: 'Daily',
    weekly: 'Weekly',
    biweekly: 'Bi-weekly',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    yearly: 'Yearly',
    one_time: 'One-time',
    custom: 'Custom'
  };

  return frequencyMap[frequency] || frequency;
};

/**
 * Format interest type
 */
export const formatInterestType = (type) => {
  const typeMap = {
    simple: 'Simple Interest',
    compound: 'Compound Interest',
    none: 'No Interest'
  };

  return typeMap[type] || type;
};

/**
 * Abbreviate large numbers
 */
export const abbreviateNumber = (num) => {
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
};

/**
 * Parse currency string to number
 */
export const parseCurrency = (currencyString) => {
  if (!currencyString) return 0;

  // Remove currency symbols and commas
  const cleaned = currencyString.replace(/[^0-9.-]/g, '');
  return parseFloat(cleaned) || 0;
};

/**
 * Validate email format
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone format
 */
export const isValidPhone = (phone) => {
  const phoneRegex = /^[+]?[\d\s-()]{10,}$/;
  return phoneRegex.test(phone);
};

/**
 * Calculate days until date
 */
export const daysUntil = (date) => {
  const now = new Date();
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const diffInMs = targetDate - now;
  return Math.ceil(diffInMs / (1000 * 60 * 60 * 24));
};

/**
 * Get urgency level for due date
 */
export const getUrgencyLevel = (dueDate) => {
  const days = daysUntil(dueDate);

  if (days < 0) return 'overdue';
  if (days === 0) return 'due_today';
  if (days <= 7) return 'due_this_week';
  if (days <= 30) return 'due_this_month';

  return 'upcoming';
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};
