/**
 * stimuli.js — the 10 trivia items used in the study.
 *
 * Design (2x2, roughly balanced across trials):
 *   - AI correctness: {correct, incorrect}
 *   - AI confidence : {high (>=0.85), low (<=0.65)}
 *
 * Scripting the AI (rather than calling a real LLM) is a *design decision*,
 * not a limitation: it makes the stimulus a controlled variable so we can
 * attribute variance in user behavior to the manipulation, not to the AI
 * being flaky. Documented in methodology.html.
 */
const STIMULI = [
  {
    id: 1, category: 'geography',
    prompt: 'What is the capital of Australia?',
    correctAnswer: 'Canberra',
    aiAnswer: 'Sydney',
    aiConfidence: 0.92,     // high & wrong (common misconception)
    aiIsCorrect: false,
  },
  {
    id: 2, category: 'science',
    prompt: 'Which planet in our solar system is closest to the Sun?',
    correctAnswer: 'Mercury',
    aiAnswer: 'Mercury',
    aiConfidence: 0.98,     // high & right
    aiIsCorrect: true,
  },
  {
    id: 3, category: 'history',
    prompt: 'In what year did World War II end?',
    correctAnswer: '1945',
    aiAnswer: '1945',
    aiConfidence: 0.95,     // high & right
    aiIsCorrect: true,
  },
  {
    id: 4, category: 'science',
    prompt: 'What is the smallest bone in the human body?',
    correctAnswer: 'Stapes',
    aiAnswer: 'The stapes, I believe, though I am not fully certain.',
    aiConfidence: 0.55,     // low & right
    aiIsCorrect: true,
  },
  {
    id: 5, category: 'geography',
    prompt: 'Which country consumes the most coffee per capita?',
    correctAnswer: 'Finland',
    aiAnswer: 'Brazil',
    aiConfidence: 0.9,      // high & wrong (common misconception)
    aiIsCorrect: false,
  },
  {
    id: 6, category: 'literature',
    prompt: 'Who wrote the novel "Pride and Prejudice"?',
    correctAnswer: 'Jane Austen',
    aiAnswer: 'Jane Austen',
    aiConfidence: 0.97,     // high & right
    aiIsCorrect: true,
  },
  {
    id: 7, category: 'science',
    prompt: 'Is the Great Wall of China visible from space with the naked eye?',
    correctAnswer: 'No',
    aiAnswer: 'Yes, it is one of the few human-made structures visible from space.',
    aiConfidence: 0.88,     // high & wrong (persistent myth)
    aiIsCorrect: false,
  },
  {
    id: 8, category: 'geography',
    prompt: 'What is the official currency of Sweden?',
    correctAnswer: 'Krona',
    aiAnswer: 'I am not fully sure -- possibly the Krone.',
    aiConfidence: 0.45,     // low & wrong (that is Denmark / Norway)
    aiIsCorrect: false,
  },
  {
    id: 9, category: 'language',
    prompt: 'Which language has the most native speakers worldwide?',
    correctAnswer: 'Mandarin Chinese',
    aiAnswer: 'Mandarin Chinese',
    aiConfidence: 0.9,      // high & right
    aiIsCorrect: true,
  },
  {
    id: 10, category: 'science',
    prompt: 'How many hearts does an octopus have?',
    correctAnswer: 'Three',
    aiAnswer: 'I think it might be three, though I am not entirely sure.',
    aiConfidence: 0.6,      // low & right
    aiIsCorrect: true,
  },
];

// Deterministic ordering for reproducibility across participants.
// (Randomize on the fly if you want a between-subjects order manipulation.)
const TRIAL_ORDER = STIMULI.map((s) => s.id);

const Stimuli = {
  all: STIMULI,
  order: TRIAL_ORDER,
  byId: (id) => STIMULI.find((s) => s.id === id),
  count: STIMULI.length,
};
