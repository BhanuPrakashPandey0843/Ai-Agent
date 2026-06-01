import { ACHIEVEMENT_DEFS } from '../constants/quiz';

export const evaluateAchievements = (profile, context = {}) => {
  const unlocked = new Set(profile?.achievements || []);
  const stats = profile?.categoryStats || {};
  const totalCorrect = profile?.totalCorrect || 0;
  const longestStreak = profile?.longestStreak || 0;
  const bibleCorrect = stats.bible?.correct || 0;

  const checks = [
    { id: 'bible_scholar', pass: bibleCorrect >= 50 },
    { id: 'streak_7', pass: longestStreak >= 7 },
    { id: 'streak_30', pass: longestStreak >= 30 },
    { id: 'correct_100', pass: totalCorrect >= 100 },
    { id: 'top_10', pass: context.reachedTop10 === true },
  ];

  const newlyUnlocked = [];
  checks.forEach(({ id, pass }) => {
    if (pass && !unlocked.has(id)) {
      unlocked.add(id);
      newlyUnlocked.push(ACHIEVEMENT_DEFS[id]);
    }
  });

  return {
    achievements: Array.from(unlocked),
    newlyUnlocked,
  };
};

export const achievementProgress = (profile) =>
  Object.values(ACHIEVEMENT_DEFS).map((def) => {
    let current = 0;
    const stats = profile?.categoryStats || {};
    switch (def.id) {
      case 'bible_scholar':
        current = stats.bible?.correct || 0;
        break;
      case 'streak_7':
      case 'streak_30':
        current = profile?.longestStreak || 0;
        break;
      case 'correct_100':
        current = profile?.totalCorrect || 0;
        break;
      case 'top_10':
        current = profile?.reachedTop10 ? 1 : 0;
        break;
      default:
        break;
    }
    const unlocked = (profile?.achievements || []).includes(def.id);
    return { ...def, current, unlocked, progress: Math.min(1, current / def.target) };
  });
