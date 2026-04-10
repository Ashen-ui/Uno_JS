export const XP_RULES = {
    GAME_FINISHED: 20,
    GAME_WON: 50,
    WIN_STREAK: 100,
    WIN_STREAK_BONUS: 50,
    WIN_STREAK_BONUS_MULTIPLIER: 1.5,
    WIN_STREAK_BONUS_MULTIPLIER_MAX: 10,
    WIN_STREAK_BONUS_MULTIPLIER_MIN: 1,

  }
  
  export function computeWinStreakBonus(winStreak) {
    return XP_RULES.WIN_STREAK + (winStreak * XP_RULES.WIN_STREAK_BONUS)
  }
  export function computeWinStreakBonusMultiplier(winStreak) {
    return XP_RULES.WIN_STREAK_BONUS_MULTIPLIER + (winStreak * XP_RULES.WIN_STREAK_BONUS_MULTIPLIER_STEP)
  }
  export function computeWinStreakBonusMultiplierMax(winStreak) {
    return XP_RULES.WIN_STREAK_BONUS_MULTIPLIER_MAX + (winStreak * XP_RULES.WIN_STREAK_BONUS_MULTIPLIER_STEP_MAX)
  }
  export function computeWinStreakBonusMultiplierMin(winStreak) {
    return XP_RULES.WIN_STREAK_BONUS_MULTIPLIER_MIN + (winStreak * XP_RULES.WIN_STREAK_BONUS_MULTIPLIER_STEP_MIN)
  }
  export function computeWinStreakBonusMultiplierStep(winStreak) {
    return XP_RULES.WIN_STREAK_BONUS_MULTIPLIER_STEP + (winStreak * XP_RULES.WIN_STREAK_BONUS_MULTIPLIER_STEP_STEP)
  }
  export function computeWinStreakBonusMultiplierStepMin(winStreak) {
    return XP_RULES.WIN_STREAK_BONUS_MULTIPLIER_STEP_MIN + (winStreak * XP_RULES.WIN_STREAK_BONUS_MULTIPLIER_STEP_STEP_MIN)
  }
  export function computeWinStreakBonusMultiplierStepMax(winStreak) {
    return XP_RULES.WIN_STREAK_BONUS_MULTIPLIER_STEP_MAX + (winStreak * XP_RULES.WIN_STREAK_BONUS_MULTIPLIER_STEP_STEP_MAX)
  }
  export function computeLevelFromXp(totalXp) {
    return Math.floor(Math.sqrt(totalXp / 100)) + 1
  }
  
  export function xpForGameResult({ hasWon }) {
    return XP_RULES.GAME_FINISHED + (hasWon ? XP_RULES.GAME_WON : 0)
  }