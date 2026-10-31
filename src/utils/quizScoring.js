import { DIFFICULTY_POINTS } from '../constants/quiz';

export const pointsForQuestion = (difficulty = 'medium') =>
  DIFFICULTY_POINTS[difficulty] || DIFFICULTY_POINTS.medium;

export const computeSessionScore = (answers) =>
  answers.reduce((sum, a) => sum + (a.pointsEarned || 0), 0);

/** Keep the first answer per question so a resume/double-tap cannot inflate score. */
export const dedupeAnswers = (answers) => {
  const seen = new Set();
  return (answers || []).filter((a) => {
    if (!a?.questionId || seen.has(a.questionId)) return false;
    seen.add(a.questionId);
    return true;
  });
};

export const computeAccuracy = (correctCount, total) => {
  if (!total) return 0;
  return Math.round((correctCount / total) * 1000) / 10;
};

/**
 * Leaderboard ranking: higher score wins; ties → higher accuracy; then faster time.
 */
export const compareLeaderboardEntries = (a, b) => {
  const scoreDiff = (Number(b.score) || 0) - (Number(a.score) || 0);
  if (scoreDiff) return scoreDiff;
  const accuracyDiff = (Number(b.accuracy) || 0) - (Number(a.accuracy) || 0);
  if (accuracyDiff) return accuracyDiff;
  const timeDiff = (Number(a.completionTimeMs) || 0) - (Number(b.completionTimeMs) || 0);
  if (timeDiff) return timeDiff;
  return String(a.uid || a.id || '').localeCompare(String(b.uid || b.id || ''));
};

export const levelFromXp = (xp) => Math.max(1, Math.floor(xp / 200) + 1);

export const xpProgressInLevel = (xp) => {
  const level = levelFromXp(xp);
  const base = (level - 1) * 200;
  return { level, current: xp - base, needed: 200 };
};
