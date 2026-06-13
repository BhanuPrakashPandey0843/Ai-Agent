import { QUIZ_TYPES } from '../constants/quiz';
import { hashString, seededShuffle, toDateKey } from '../utils/quizDates';

const VALID_CATEGORIES = new Set(['bible', 'jesus', 'old', 'new', 'mixed']);

const normalizeCategory = (value) => {
  const raw = String(value || 'bible').trim().toLowerCase();
  return VALID_CATEGORIES.has(raw) ? raw : 'bible';
};

const normalizeOptions = (data) => {
  if (Array.isArray(data.options)) {
    return data.options.map((option) => String(option ?? '').trim()).filter(Boolean);
  }
  if (Array.isArray(data.choices)) {
    return data.choices.map((option) => String(option ?? '').trim()).filter(Boolean);
  }
  return [];
};

const resolveCorrectIndex = (data, rawOptions, options) => {
  if (typeof data.correctIndex === 'number' && Number.isFinite(data.correctIndex)) {
    const rawTarget = rawOptions[data.correctIndex];
    if (rawTarget) {
      const mapped = options.indexOf(String(rawTarget).trim());
      if (mapped >= 0) return mapped;
    }
    if (data.correctIndex >= 0 && data.correctIndex < options.length) {
      return data.correctIndex;
    }
  }
  if (typeof data.correctAnswer === 'string' && data.correctAnswer.trim()) {
    const target = data.correctAnswer.trim().toLowerCase();
    const byText = options.findIndex((option) => option.toLowerCase() === target);
    if (byText >= 0) return byText;
  }
  return 0;
};

export const isValidQuizQuestion = (question) =>
  Boolean(question?.id) &&
  Boolean(String(question?.question || '').trim()) &&
  Array.isArray(question?.options) &&
  question.options.length >= 2 &&
  typeof question.correctIndex === 'number' &&
  question.correctIndex >= 0 &&
  question.correctIndex < question.options.length;

export const normalizeQuestion = (doc) => {
  const data = doc.data ? doc.data() : doc;
  const id = doc.id || data.id;
  const rawOptions = Array.isArray(data.options)
    ? data.options.map((option) => String(option ?? '').trim())
    : [];
  const options = normalizeOptions(data);
  const correctIndex = resolveCorrectIndex(data, rawOptions, options);

  return {
    id,
    question: String(data.question || data.text || '').trim(),
    options,
    correctIndex,
    category: normalizeCategory(data.category),
    difficulty: String(data.difficulty || 'medium').trim().toLowerCase(),
    reference: String(data.reference || '').trim(),
    explanation: String(data.explanation || '').trim(),
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
