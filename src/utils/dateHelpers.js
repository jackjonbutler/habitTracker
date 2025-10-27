/**
 * Date Helper Utilities
 * Functions for date comparison and manipulation
 */

/**
 * Get start of day (00:00:00) for a given date
 */
const getStartOfDay = (date = new Date()) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  return startOfDay;
};

/**
 * Get end of day (23:59:59) for a given date
 */
const getEndOfDay = (date = new Date()) => {
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay;
};

/**
 * Check if two dates are on the same day
 */
const isSameDay = (date1, date2) => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

/**
 * Check if date1 is the day before date2
 */
const isConsecutiveDay = (date1, date2) => {
  const nextDay = new Date(date1);
  nextDay.setDate(nextDay.getDate() + 1);
  return isSameDay(nextDay, date2);
};

/**
 * Get number of days between two dates
 */
const getDaysBetween = (date1, date2) => {
  const oneDay = 24 * 60 * 60 * 1000; // milliseconds in a day
  const start = getStartOfDay(date1);
  const end = getStartOfDay(date2);
  return Math.round(Math.abs((end - start) / oneDay));
};

/**
 * Get date string in YYYY-MM-DD format
 */
const formatDateString = (date) => {
  return date.toISOString().split('T')[0];
};

/**
 * Check if a date is today
 */
const isToday = (date) => {
  return isSameDay(date, new Date());
};

/**
 * Check if a date was yesterday
 */
const isYesterday = (date) => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return isSameDay(date, yesterday);
};

/**
 * Get days until next milestone
 */
const getDaysUntilMilestone = (currentStreak) => {
  const milestones = [7, 30, 100, 365];
  
  for (const milestone of milestones) {
    if (currentStreak < milestone) {
      return milestone - currentStreak;
    }
  }
  
  // If past all milestones, return days until next year milestone
  return 365 - (currentStreak % 365);
};

module.exports = {
  getStartOfDay,
  getEndOfDay,
  isSameDay,
  isConsecutiveDay,
  getDaysBetween,
  formatDateString,
  isToday,
  isYesterday,
  getDaysUntilMilestone,
};
