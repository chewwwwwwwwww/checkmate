export const GAME_CONFIG = {
  urinalCount: 5,
  stallCount: 2,
  startLives: 3,
  patienceSeconds: 12,
  urinalUseSeconds: 4.2,
  stallUseSeconds: 9.5,
  openingGraceSeconds: 18,
  openingSpawnMultiplier: 1.45,
  baseSpawnSeconds: 2.4,
  minSpawnSeconds: 0.85,
  spawnStepSeconds: 0.16,
  difficultyEveryScore: 10,
  outageStartDifficulty: 2,
  outageCheckSeconds: 14,
  maxOutages: 2,
  outageDurationRange: [12, 24],
  rewardCheckSeconds: 11,
  rewardChance: 0.28,
  maxFeedItems: 7
};

export function buildFacilities() {
  const urinals = Array.from({ length: GAME_CONFIG.urinalCount }, (_, index) => ({
    id: `U${index + 1}`,
    kind: "urinal",
    slot: index,
    label: `${index + 1}`,
    occupiedBy: null,
    occupiedTimer: 0,
    disabled: false,
    disabledTimer: 0,
    reward: false
  }));

  const stalls = Array.from({ length: GAME_CONFIG.stallCount }, (_, index) => ({
    id: `S${index + 1}`,
    kind: "stall",
    slot: index,
    label: `${index + 6}`,
    occupiedBy: null,
    occupiedTimer: 0,
    disabled: false,
    disabledTimer: 0,
    reward: false
  }));

  return [...urinals, ...stalls];
}

export function spawnIntervalForDifficulty(difficulty) {
  const reduction = (difficulty - 1) * GAME_CONFIG.spawnStepSeconds;
  return Math.max(GAME_CONFIG.minSpawnSeconds, GAME_CONFIG.baseSpawnSeconds - reduction);
}
