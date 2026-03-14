export const XP_VALUES = {
  CREATE_PROJECT: 50,
  COMPLETE_SECTION: 25,
  COMPLETE_SLIDE: 15,
  GENERATE_IDEAS: 10,
  RUN_COMPLIANCE: 20,
  RUN_JUDGE_SIM: 30,
  COMPLETE_ROLEPLAY: 25,
  COMPLETE_TASK: 10,
  DAILY_LOGIN: 15,
  COMPLETE_PROJECT: 200,
} as const;

export const LEVEL_THRESHOLDS = [
  0, 100, 250, 500, 800, 1200, 1700, 2300, 3000, 4000, 5000, 6500, 8000,
  10000, 12500, 15000, 18000, 22000, 27000, 33000,
];

export function getLevelForXp(xp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}

export function getXpForNextLevel(currentXp: number): {
  current: number;
  needed: number;
  progress: number;
} {
  const level = getLevelForXp(currentXp);
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] || 0;
  const nextThreshold = LEVEL_THRESHOLDS[level] || currentThreshold + 1000;

  const progressInLevel = currentXp - currentThreshold;
  const totalForLevel = nextThreshold - currentThreshold;

  return {
    current: progressInLevel,
    needed: totalForLevel,
    progress: Math.min((progressInLevel / totalForLevel) * 100, 100),
  };
}
