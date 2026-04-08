export const SUBJECTS = [
  'Mathematics', 'English Language', 'Biology', 'Chemistry', 'Physics',
  'Geography', 'History', 'Civic Education', 'Computer Studies',
  'Additional Mathematics', 'Commerce', 'Principles of Accounts',
  'French', 'Further Mathematics', 'Economics', 'Literature in English',
  'Business Studies', 'Computer Science', 'Accounting',
]

export const FORM_LEVELS = [
  'Form 1', 'Form 2', 'Form 3', 'Form 4 (O-Level)',
  'Form 5', 'Form 6 (A-Level)',
]

export const FORM_LEVELS_WITH_UNSURE = [
  ...FORM_LEVELS, 'Not sure',
]

export const LESSON_STATUS = {
  ACTIVE: 'active',
  DRAFT:  'draft',
}

export const BOOKING_STATUS = {
  PENDING:   'pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
}

export const PAYOUT_STATUS = {
  PENDING:    'pending',
  PROCESSING: 'processing',
  COMPLETED:  'completed',
  FAILED:     'failed',
}

export const BADGE_LABELS = {
  grey:  'Verified',
  black: 'Certified',
}

export const SUBJECT_GRADIENTS = {
  'Mathematics':            'subject-gradient-math',
  'Additional Mathematics': 'subject-gradient-math',
  'Further Mathematics':    'subject-gradient-math',
  'English Language':       'subject-gradient-english',
  'Literature in English':  'subject-gradient-english',
  'French':                 'subject-gradient-english',
  'Biology':                'subject-gradient-science',
  'Chemistry':              'subject-gradient-science',
  'Physics':                'subject-gradient-science',
  'Geography':              'subject-gradient-social',
  'History':                'subject-gradient-social',
  'Civic Education':        'subject-gradient-social',
  'Computer Studies':       'subject-gradient-tech',
  'Computer Science':       'subject-gradient-tech',
  'Commerce':               'subject-gradient-commerce',
  'Economics':               'subject-gradient-commerce',
  'Business Studies':       'subject-gradient-commerce',
  'Principles of Accounts': 'subject-gradient-commerce',
  'Accounting':             'subject-gradient-commerce',
}

export const SUBJECT_ICONS = {
  'Mathematics':            '∑',
  'Additional Mathematics': '∫',
  'Further Mathematics':    'π',
  'English Language':       'Aa',
  'Literature in English':  '📖',
  'French':                 'Fr',
  'Biology':                '🧬',
  'Chemistry':              '⚗',
  'Physics':                '⚛',
  'Geography':              '🌍',
  'History':                '📜',
  'Civic Education':        '⚖',
  'Computer Studies':       '💻',
  'Computer Science':       '{ }',
  'Commerce':               '📊',
  'Economics':               '📈',
  'Business Studies':       '💼',
  'Principles of Accounts': '📒',
  'Accounting':             '📒',
}

export const TOPIC_REQUEST_STATUS = {
  OPEN:        'open',
  IN_PROGRESS: 'in_progress',
  CLOSED:      'closed',
}
