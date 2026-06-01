import { QUIZ_TYPES } from '../constants/quiz';
import { hashString, seededShuffle, toDateKey } from '../utils/quizDates';

export const normalizeQuestion = (doc) => {
  const data = doc.data ? doc.data() : doc;
  const id = doc.id || data.id;
  return {
    id,
    question: data.question || '',
    options: Array.isArray(data.options) ? data.options : [],
    correctIndex: typeof data.correctIndex === 'number' ? data.correctIndex : 0,
    category: data.category || 'bible',
    difficulty: data.difficulty || 'medium',
    reference: data.reference || '',
    explanation: data.explanation || '',
    active: data.active !== false,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
};

const matchesQuizType = (question, quizType) => {
  if (!quizType.categories.includes(question.category)) return false;
  if (quizType.keyword) {
    const blob = `${question.question} ${question.explanation}`.toLowerCase();
    if (!blob.includes(quizType.keyword.toLowerCase())) return false;
  }
  return question.active !== false;
};

const fisherYates = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

/**
 * Select questions the user has not attempted for this quiz type.
 */
export const selectQuestionsForSession = ({
  allQuestions,
  attemptedIds,
  quizTypeId,
  count,
  dateKey = toDateKey(),
}) => {
  const quizType = QUIZ_TYPES[quizTypeId];
  if (!quizType) return { questions: [], exhausted: true };

  const pool = allQuestions.filter(
    (q) => matchesQuizType(q, quizType) && !attemptedIds.has(q.id)
  );

  if (!pool.length) {
    return { questions: [], exhausted: true };
  }

  const limit = count || quizType.questionsCount || 10;
  let ordered;

  if (quizType.mode === 'daily') {
    const seed = hashString(`${dateKey}_${quizTypeId}`);
    ordered = seededShuffle(pool, seed);
  } else {
    ordered = fisherYates(pool);
  }

  return {
    questions: ordered.slice(0, Math.min(limit, ordered.length)),
    exhausted: false,
    remainingCount: pool.length,
  };
};

export const filterQuestionsByCategories = (allQuestions, categories) =>
  allQuestions.filter((q) => q.active !== false && categories.includes(q.category));
