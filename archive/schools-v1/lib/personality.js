/**
 * Personality Question Pool and Tier Recommendation Logic
 * Provides a set of 15 questions to determine user learning style
 * and recommend appropriate tier (guided, balanced, exam_ready)
 */

const PERSONALITY_QUESTIONS = [
  // Questions 1-5: Quick (5 min)
  {
    id: 1,
    question: "What is your main goal right now?",
    options: [
      {
        label: "Learning new topics",
        tier_weight: { guided: 2, balanced: 0, exam_ready: 0 }
      },
      {
        label: "Revising what I know",
        tier_weight: { guided: 0, balanced: 2, exam_ready: 0 }
      },
      {
        label: "Preparing for an exam",
        tier_weight: { guided: 0, balanced: 0, exam_ready: 2 }
      }
    ]
  },
  {
    id: 2,
    question: "How confident do you feel about your studies?",
    options: [
      {
        label: "I need help understanding basics",
        tier_weight: { guided: 2, balanced: 0, exam_ready: 0 }
      },
      {
        label: "I have some knowledge gaps",
        tier_weight: { guided: 0, balanced: 2, exam_ready: 0 }
      },
      {
        label: "I have a strong foundation",
        tier_weight: { guided: 0, balanced: 0, exam_ready: 2 }
      }
    ]
  },
  {
    id: 3,
    question: "When you get a question wrong, what do you prefer?",
    options: [
      {
        label: "See the answer immediately",
        tier_weight: { guided: 2, balanced: 0, exam_ready: 0 }
      },
      {
        label: "Review it after the quiz",
        tier_weight: { guided: 0, balanced: 2, exam_ready: 0 }
      },
      {
        label: "Try to figure it out myself first",
        tier_weight: { guided: 0, balanced: 0, exam_ready: 2 }
      }
    ]
  },
  {
    id: 4,
    question: "How do you feel about timed tests?",
    options: [
      {
        label: "I prefer no time pressure",
        tier_weight: { guided: 2, balanced: 0, exam_ready: 0 }
      },
      {
        label: "A reasonable time limit is fine",
        tier_weight: { guided: 0, balanced: 2, exam_ready: 0 }
      },
      {
        label: "Time pressure helps me focus",
        tier_weight: { guided: 0, balanced: 0, exam_ready: 2 }
      }
    ]
  },
  {
    id: 5,
    question: "How often do you study?",
    options: [
      {
        label: "When I feel like it",
        tier_weight: { guided: 2, balanced: 0, exam_ready: 0 }
      },
      {
        label: "A few times a week",
        tier_weight: { guided: 0, balanced: 2, exam_ready: 0 }
      },
      {
        label: "Every day",
        tier_weight: { guided: 0, balanced: 0, exam_ready: 2 }
      }
    ]
  },

  // Questions 6-10: Standard (10 min)
  {
    id: 6,
    question: "Do you prefer reading or watching to learn?",
    options: [
      {
        label: "Prefer reading",
        tier_weight: { guided: 1, balanced: 1, exam_ready: 1 }
      },
      {
        label: "Prefer watching",
        tier_weight: { guided: 1, balanced: 1, exam_ready: 1 }
      },
      {
        label: "Mix of both",
        tier_weight: { guided: 1, balanced: 1, exam_ready: 1 }
      }
    ]
  },
  {
    id: 7,
    question: "When stuck on a problem, what do you do?",
    options: [
      {
        label: "Ask for help right away",
        tier_weight: { guided: 2, balanced: 0, exam_ready: 0 }
      },
      {
        label: "Try for a bit, then ask",
        tier_weight: { guided: 0, balanced: 2, exam_ready: 0 }
      },
      {
        label: "Keep trying on my own",
        tier_weight: { guided: 0, balanced: 0, exam_ready: 2 }
      }
    ]
  },
  {
    id: 8,
    question: "How do you feel before an exam?",
    options: [
      {
        label: "Very anxious",
        tier_weight: { guided: 2, balanced: 0, exam_ready: 0 }
      },
      {
        label: "A bit nervous",
        tier_weight: { guided: 0, balanced: 2, exam_ready: 0 }
      },
      {
        label: "Excited",
        tier_weight: { guided: 0, balanced: 0, exam_ready: 2 }
      }
    ]
  },
  {
    id: 9,
    question: "How do you handle failing a test?",
    options: [
      {
        label: "It discourages me",
        tier_weight: { guided: 2, balanced: 0, exam_ready: 0 }
      },
      {
        label: "I review and move on",
        tier_weight: { guided: 0, balanced: 2, exam_ready: 0 }
      },
      {
        label: "It motivates me to do better",
        tier_weight: { guided: 0, balanced: 0, exam_ready: 2 }
      }
    ]
  },
  {
    id: 10,
    question: "What score would make you happy on a test?",
    options: [
      {
        label: "40% or higher",
        tier_weight: { guided: 2, balanced: 0, exam_ready: 0 }
      },
      {
        label: "60-70%",
        tier_weight: { guided: 0, balanced: 2, exam_ready: 0 }
      },
      {
        label: "80% or higher",
        tier_weight: { guided: 0, balanced: 0, exam_ready: 2 }
      }
    ]
  },

  // Questions 11-15: Full (15 min)
  {
    id: 11,
    question: "Do you study better alone or with others?",
    options: [
      {
        label: "Alone",
        tier_weight: { guided: 1, balanced: 1, exam_ready: 1 }
      },
      {
        label: "With others",
        tier_weight: { guided: 1, balanced: 1, exam_ready: 1 }
      },
      {
        label: "Depends on the topic",
        tier_weight: { guided: 1, balanced: 1, exam_ready: 1 }
      }
    ]
  },
  {
    id: 12,
    question: "How many subjects are you struggling with?",
    options: [
      {
        label: "Most of them",
        tier_weight: { guided: 2, balanced: 0, exam_ready: 0 }
      },
      {
        label: "A few",
        tier_weight: { guided: 0, balanced: 2, exam_ready: 0 }
      },
      {
        label: "None",
        tier_weight: { guided: 0, balanced: 0, exam_ready: 2 }
      }
    ]
  },
  {
    id: 13,
    question: "How important are grades to you?",
    options: [
      {
        label: "Understanding material is most important",
        tier_weight: { guided: 2, balanced: 0, exam_ready: 0 }
      },
      {
        label: "Good grades and understanding both matter",
        tier_weight: { guided: 0, balanced: 2, exam_ready: 0 }
      },
      {
        label: "Getting top grades is my priority",
        tier_weight: { guided: 0, balanced: 0, exam_ready: 2 }
      }
    ]
  },
  {
    id: 14,
    question: "When is your next exam?",
    options: [
      {
        label: "Not for a while",
        tier_weight: { guided: 2, balanced: 0, exam_ready: 0 }
      },
      {
        label: "In a few months",
        tier_weight: { guided: 0, balanced: 2, exam_ready: 0 }
      },
      {
        label: "Very soon",
        tier_weight: { guided: 0, balanced: 0, exam_ready: 2 }
      }
    ]
  },
  {
    id: 15,
    question: "Would you describe yourself as competitive?",
    options: [
      {
        label: "Not really",
        tier_weight: { guided: 2, balanced: 0, exam_ready: 0 }
      },
      {
        label: "A little",
        tier_weight: { guided: 0, balanced: 2, exam_ready: 0 }
      },
      {
        label: "Very",
        tier_weight: { guided: 0, balanced: 0, exam_ready: 2 }
      }
    ]
  }
];

/**
 * Get questions for a specific quiz length
 * @param {number} count - Number of questions to return (5, 10, or 15)
 * @returns {Array} Array of questions
 */
function getQuestions(count) {
  if (count === 5) {
    return PERSONALITY_QUESTIONS.slice(0, 5);
  } else if (count === 10) {
    return PERSONALITY_QUESTIONS.slice(0, 10);
  } else {
    return PERSONALITY_QUESTIONS;
  }
}

/**
 * Recommend a tier based on answers to personality questions
 * @param {Array} answers - Array of objects with questionId and optionIndex
 * @returns {string} Recommended tier: 'guided', 'balanced', or 'exam_ready'
 */
function recommendTier(answers) {
  const tierScores = {
    guided: 0,
    balanced: 0,
    exam_ready: 0
  };

  // Sum up tier weights from all answers
  answers.forEach((answer) => {
    const question = PERSONALITY_QUESTIONS.find((q) => q.id === answer.questionId);
    if (question && question.options[answer.optionIndex]) {
      const weights = question.options[answer.optionIndex].tier_weight;
      tierScores.guided += weights.guided;
      tierScores.balanced += weights.balanced;
      tierScores.exam_ready += weights.exam_ready;
    }
  });

  // Find the tier with the highest score
  let recommendedTier = "guided";
  let highestScore = tierScores.guided;

  if (tierScores.balanced > highestScore) {
    recommendedTier = "balanced";
    highestScore = tierScores.balanced;
  }

  if (tierScores.exam_ready > highestScore) {
    recommendedTier = "exam_ready";
  }

  return recommendedTier;
}

module.exports = {
  PERSONALITY_QUESTIONS,
  getQuestions,
  recommendTier
};
