// lib/ielts/question-types.js
//
// Registry mapping every IELTS Reading/Listening question type to one of
// three interaction PRIMITIVES. This is the seam that lets "all 11 types"
// be built as 3 renderers + 3 graders instead of 11 of each. A new type is
// one entry here — no new UI or grading code.
//
// Primitives:
//   single_select — pick exactly one option from a list
//   multi_select  — pick N options from a list (e.g. "choose TWO")
//   text_fill     — type a word/number/phrase (graded against an
//                   accepted-answers list, with an optional word limit)

export const PRIMITIVES = ['single_select', 'multi_select', 'text_fill']

// fixedOptions, when present, are the options the UI must render regardless
// of the item payload (the True/False/Not Given family).
const REGISTRY = {
  // ── single_select family ────────────────────────────────────────────
  mcq_single: {
    primitive: 'single_select',
    label: 'Multiple choice',
    instruction: 'Choose the correct letter.',
  },
  tfng: {
    primitive: 'single_select',
    label: 'True / False / Not Given',
    instruction: 'Do the statements agree with the information in the text?',
    fixedOptions: ['TRUE', 'FALSE', 'NOT GIVEN'],
  },
  ynng: {
    primitive: 'single_select',
    label: 'Yes / No / Not Given',
    instruction: "Do the statements agree with the writer's views?",
    fixedOptions: ['YES', 'NO', 'NOT GIVEN'],
  },
  matching_headings: {
    primitive: 'single_select',
    label: 'Matching headings',
    instruction: 'Choose the correct heading for each paragraph.',
  },
  matching_information: {
    primitive: 'single_select',
    label: 'Matching information',
    instruction: 'Which paragraph contains the following information?',
  },
  matching_features: {
    primitive: 'single_select',
    label: 'Matching features',
    instruction: 'Match each item to the correct option.',
  },
  matching_sentence_endings: {
    primitive: 'single_select',
    label: 'Matching sentence endings',
    instruction: 'Choose the correct ending for each sentence.',
  },
  summary_completion_wordlist: {
    primitive: 'single_select',
    label: 'Summary completion (from a list)',
    instruction: 'Complete the summary using the list of words.',
  },

  // ── multi_select family ─────────────────────────────────────────────
  mcq_multi: {
    primitive: 'multi_select',
    label: 'Multiple choice (choose several)',
    instruction: 'Choose the correct letters.',
  },

  // ── text_fill family ────────────────────────────────────────────────
  sentence_completion: {
    primitive: 'text_fill',
    label: 'Sentence completion',
    instruction: 'Complete the sentences below.',
  },
  summary_completion: {
    primitive: 'text_fill',
    label: 'Summary completion',
    instruction: 'Complete the summary below.',
  },
  note_completion: {
    primitive: 'text_fill',
    label: 'Note completion',
    instruction: 'Complete the notes below.',
  },
  table_completion: {
    primitive: 'text_fill',
    label: 'Table completion',
    instruction: 'Complete the table below.',
  },
  flowchart_completion: {
    primitive: 'text_fill',
    label: 'Flow-chart completion',
    instruction: 'Complete the flow-chart below.',
  },
  diagram_label: {
    primitive: 'text_fill',
    label: 'Diagram labelling',
    instruction: 'Label the diagram below.',
  },
  short_answer: {
    primitive: 'text_fill',
    label: 'Short-answer questions',
    instruction: 'Answer the questions below.',
  },
}

export function getQuestionType(type) {
  return REGISTRY[type] ?? null
}

export function primitiveFor(type) {
  return REGISTRY[type]?.primitive ?? null
}

export function isKnownQuestionType(type) {
  return Object.prototype.hasOwnProperty.call(REGISTRY, type)
}

export function allQuestionTypes() {
  return Object.keys(REGISTRY)
}
