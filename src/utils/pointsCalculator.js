/**
 * Points Calculator Utility
 * Calculates points and levels based on streaks and milestones
 */

/**
 * Calculate points for a check-in based on current streak
 * Points system:
 * - Base check-in: 10 points
 * - Streak bonuses: +5 points per consecutive day (max +50)
 * - Milestone bonuses: 7 days = 50 bonus, 30 days = 200 bonus, 100 days = 1000 bonus
 */
const calculateCheckInPoints = (currentStreak) => {
  // Base points for checking in
  let points = 10;
  
  // Streak bonus: +5 points per day, capped at 50 bonus points (10 day streak)
  const streakBonus = Math.min(currentStreak * 5, 50);
  points += streakBonus;
  
  // Check for milestone bonuses
  const milestoneBonus = getMilestoneBonus(currentStreak);
  points += milestoneBonus;
  
  return points;
};

/**
 * Get milestone bonus points for reaching specific streak lengths
 */
const getMilestoneBonus = (streakLength) => {
  const milestones = {
    7: 50,      // 1 week
    30: 200,    // 1 month
    100: 1000,  // 100 days
    365: 5000,  // 1 year
  };
  
  return milestones[streakLength] || 0;
};

/**
 * Calculate user level based on total points
 * Level = floor(totalPoints / 500) + 1
 */
const calculateLevel = (totalPoints) => {
  return Math.floor(totalPoints / 500) + 1;
};

/**
 * Get points needed for next level
 */
const getPointsForNextLevel = (currentLevel) => {
  return currentLevel * 500;
};

/**
 * Get progress towards next level (0-100%)
 */
const getLevelProgress = (totalPoints) => {
  const currentLevel = calculateLevel(totalPoints);
  const pointsForCurrentLevel = (currentLevel - 1) * 500;
  const pointsForNextLevel = currentLevel * 500;
  const pointsInCurrentLevel = totalPoints - pointsForCurrentLevel;
  const pointsNeededForLevel = pointsForNextLevel - pointsForCurrentLevel;
  
  return Math.round((pointsInCurrentLevel / pointsNeededForLevel) * 100);
};

/**
 * Check if a streak length is a milestone
 */
const isMilestone = (streakLength) => {
  const milestones = [7, 30, 100, 365];
  return milestones.includes(streakLength);
};

/**
 * Get next milestone information
 */
const getNextMilestone = (currentStreak) => {
  const milestones = [
    { days: 7, reward: 50, name: '1 Week Warrior' },
    { days: 30, reward: 200, name: 'Monthly Master' },
    { days: 100, reward: 1000, name: 'Century Champion' },
    { days: 365, reward: 5000, name: 'Year-Long Legend' },
  ];
  
  for (const milestone of milestones) {
    if (currentStreak < milestone.days) {
      return {
        ...milestone,
        daysRemaining: milestone.days - currentStreak,
      };
    }
  }
  
  // If past all milestones
  return {
    days: 365 * Math.ceil(currentStreak / 365 + 1),
    reward: 5000,
    name: 'Annual Achievement',
    daysRemaining: 365 * Math.ceil(currentStreak / 365 + 1) - currentStreak,
  };
};

module.exports = {
  calculateCheckInPoints,
  getMilestoneBonus,
  calculateLevel,
  getPointsForNextLevel,
  getLevelProgress,
  isMilestone,
  getNextMilestone,
};
