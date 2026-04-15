# Rent a Tutor — Content Production Template

This document defines the exact format and style for all lesson content. Every lesson follows this template. No exceptions.

---

## Content Integrity Rules

These rules override everything else:

1. **Key terms are sacred.** Use the exact terminology from the syllabus. Topic names, concept names, formulas, definitions — never rename or reword them. Simplify the explanation around the term, not the term itself.
2. **Nothing gets cut.** Every concept in the syllabus must appear in the lesson. If the syllabus mentions it, we teach it. Summarize for clarity, never reduce for brevity.
3. **Generic coverage.** Lessons must be comprehensive enough for any school's test, not just ECZ exams. Include everything, even if it seems minor — some schools test what others skip.
4. **Consistency within a lesson.** Once a term or topic name is introduced, use it the same way throughout. Don't alternate between different names for the same thing.
5. **Accuracy first.** Humor and engagement never compromise correctness. Every fact, formula, and definition must match the syllabus.

---

## Tone & Voice

**Who is speaking:** An animated character (name TBD) — a friendly, relatable presenter who appears in every video. Think smart older cousin, not teacher.

**Voice rules:**
- Conversational, direct: "you", "let's", "we"
- Short sentences. Punchy. Like talking, not writing.
- Light humor — relatable student moments, self-aware comments, Zambian life references
- Never mocking, never cringe, never forced
- YouTube energy — not a lecture, not a comedy show
- Confident but warm: "This is actually simpler than it looks. Watch."

**Humor guidelines:**
- Relatable: "You know when the teacher writes a formula on the board and everyone just... stares? Yeah. Let's fix that."
- Self-aware: "Okay I know this looks scary. But give me 2 minutes."
- Light Zambian references: "This is the part where your friend copies your answer. Don't let them — make them watch this video."
- Frequency: One light moment every 60-90 seconds in videos. One per 4-5 slides.
- Never about: tribes, politics, religion, gender, specific people

---

## Lesson Structure

Every lesson follows this exact sequence:

```
1. INTRO VIDEO (3-5 min) — Hook, preview, motivation [FREE for all users]
2. SLIDES SECTION 1 (10-15 slides) — First chunk of content
3. QUIZ 1 (10 multiple choice questions)
4. VIDEO 2 (3-4 min) — Examples and worked problems for Section 1
5. SLIDES SECTION 2 (10-15 slides) — Second chunk of content
6. QUIZ 2 (10 multiple choice + true/false questions)
7. VIDEO 3 (3-4 min) — Deep dive on hardest concepts from Section 2
8. SLIDES SECTION 3 (10-15 slides) — Third chunk of content
9. QUIZ 3 (10 short answer questions)
10. CLOSING VIDEO (2-3 min) — Recap, connection to next topic, encouragement
11. QUIZ 4 (1 reflection question — describe what you learned)
```

---

## Video Script Format

All scripts use this format:

```
LESSON: [Exact topic name from syllabus]
VIDEO: [1 = Intro / 2 = Examples / 3 = Deep Dive / 4 = Closing]
DURATION: [Target minutes]
SUBJECT: [Subject name]
FORM: [Form level]
TERM: [Term number]

---

[SCENE 1 — HOOK]
PRESENTER:
"Opening line..."

[Visual note: describe what should appear on screen]

[SCENE 2 — CONTENT]
PRESENTER:
"Next line..."

(pause)

"Continue..."

[Visual note: show formula/diagram/example on screen]

---

KEY TERMS USED: [list every syllabus term that appears in this script]
DIFFICULT CONCEPTS ADDRESSED: [list which hard parts this video tackles]
```

### Video 1 — Introduction (3-5 min)

**Purpose:** Hook the student, preview what they'll learn, make them want to continue. This is the FREE video — it's the sales pitch for the lesson.

**Structure:**
- **HOOK (30-45 sec):** Start with a question, scenario, or surprising fact. Never start with "Today we will learn about..." Instead: "Have you ever tried to [relatable scenario] and it just didn't work? That's because of [concept]. And by the end of this lesson, you'll know exactly how to handle it."
- **WHAT YOU'LL LEARN (30 sec):** "In this lesson, we're covering three things: [1], [2], and [3]." Keep it to 3-4 bullet points spoken naturally.
- **WHY IT MATTERS (30-45 sec):** Real-world connection. How this shows up in life, careers, or exams. Zambian context when possible.
- **QUICK TASTE (1-2 min):** One simple example of the core concept. Not the full explanation — just enough to show "this isn't as hard as you think."
- **LIGHT MOMENT:** At least one relatable joke or comment somewhere in the video.
- **CLOSE (15 sec):** "Alright, let's get into it. Swipe through the slides and I'll see you after the first quiz."

### Video 2 — Examples & Worked Problems (3-4 min)

**Purpose:** After slides section 1, students have the theory. This video shows it in action.

**Structure:**
- **BRIDGE (15 sec):** "Okay, you've gone through the notes. Now let me show you how this actually works."
- **EXAMPLE 1 (1-1.5 min):** Step-by-step worked example. Explain each step as you go. "First we do X... why? Because [reason]."
- **COMMON MISTAKE (30 sec):** "Here's where most people mess up: [mistake]. Don't do that. Instead: [correct approach]."
- **EXAMPLE 2 (1 min):** Slightly harder example. Build on Example 1.
- **LIGHT MOMENT:** Somewhere natural — maybe after the common mistake.
- **CLOSE (15 sec):** "Now go try the next set of slides. And remember: [key takeaway from the examples]."

### Video 3 — Deep Dive on Hard Concepts (3-4 min)

**Purpose:** After slides section 2, tackle the hardest part of the lesson head-on.

**Structure:**
- **ACKNOWLEDGE DIFFICULTY (15 sec):** "Alright, this next part is the one that trips people up. But I'm going to break it down so it makes sense."
- **CONCEPT BREAKDOWN (1.5-2 min):** Take the hardest concept and explain it from scratch, differently than the slides did. Use an analogy, a visual, or a different angle.
- **EXAM-STYLE EXAMPLE (1 min):** "This is the kind of question you'll see on a test: [question]. Here's how you'd answer it: [step by step]."
- **CONNECTION (30 sec):** How this concept connects to what they learned in section 1.
- **LIGHT MOMENT**
- **CLOSE (15 sec):** "Almost done. One more set of slides and you've finished the lesson."

### Video 4 — Closing (2-3 min)

**Purpose:** Recap everything, connect to the next topic, send them off feeling good.

**Structure:**
- **RAPID RECAP (60 sec):** "Let's do a quick recap. In this lesson you learned: [1], [2], [3]." Hit every key concept in 1-2 sentences each.
- **BIGGER PICTURE (30 sec):** How this lesson connects to the next topic or the broader subject.
- **ENCOURAGEMENT (30 sec):** "You just learned [topic]. That's real progress. Keep it going."
- **REFLECTION PROMPT (15 sec):** "Before you move on, I want you to describe everything you remember from this lesson. Don't worry about getting it perfect — just write what stuck with you."
- **LIGHT MOMENT:** End on a warm note.

---

## Slide Format

### Technical format

Each slide is a JSON object in the `slides_data` array:

```json
{
  "title": "Slide title (short, clear)",
  "content": "One sentence of context or explanation",
  "bullets": ["Point 1 (6-8 words max)", "Point 2", "Point 3"],
  "image": "description of diagram/image to include (optional)",
  "type": "concept | example | visual | fun_fact | summary | section_opener"
}
```

### Style rules

- **Maximum 3-4 bullets per slide**
- **Maximum 6-8 words per bullet**
- **One idea per slide** — if you're explaining two things, that's two slides
- **More slides with less text** is always better than fewer packed slides
- **Every new term:** bold it and define it the first time. Use the exact syllabus term.
- **White space:** leave room for visuals. Don't fill every pixel with text.

### Slide sequence per section (10-15 slides)

1. **Section opener** (1 slide) — Title + one-line summary: "In this section: [what we're covering]"
2. **Concept slides** (2-3 slides) — Introduce the first concept. One idea per slide.
3. **Example slide** (1 slide) — Worked example applying the concept.
4. **Concept slides** (2-3 slides) — Second concept.
5. **Visual slide** (1 slide) — Diagram, table, chart, or illustration.
6. **Fun fact / engagement slide** (1 slide) — "Did you know?" or real-world connection or light comment. Breaks up the learning.
7. **More concepts** (2-3 slides) — Remaining concepts for this section.
8. **Summary slide** (1 slide) — 3-4 key takeaways: "Remember: [bullets]"

### Engagement breaks in slides

Every 4-5 slides, include one of these:
- **"Did you know?"** — Interesting fact related to the topic
- **"Think about it"** — Quick question for the student to consider (not graded)
- **"Real life"** — How this concept appears in everyday Zambian life
- **Light comment** — Brief relatable moment: "If this slide made you go 'huh?' — don't worry, the video after this quiz explains it step by step."

---

## Quiz Format

### Quiz 1 — Multiple Choice (after slides section 1)

10 questions. Each question:
```json
{
  "type": "multiple_choice",
  "question_text": "Clear, direct question",
  "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
  "correct_answer": "A",
  "explanation": "Brief explanation of why this is correct",
  "points": 1
}
```

**Question style:**
- Test understanding, not memorization
- Mix of recall ("What is..."), application ("If X happens, what would..."), and reasoning ("Why does...")
- Use the exact key terms from the lesson
- Distractors (wrong answers) should be plausible — common misconceptions, not random

### Quiz 2 — Multiple Choice + True/False (after slides section 2)

10 questions. Mix of MC (6-7) and T/F (3-4).

True/false format:
```json
{
  "type": "true_false",
  "question_text": "Statement to evaluate",
  "options": ["True", "False"],
  "correct_answer": "True",
  "explanation": "Why this is true/false",
  "points": 1
}
```

**T/F guidelines:**
- Statements should be clearly true or clearly false — no trick questions
- Test key definitions and facts from the lesson
- False statements should contain a specific, identifiable error

### Quiz 3 — Short Answer (after slides section 3)

10 questions. Student types a short answer.

```json
{
  "type": "short_answer",
  "question_text": "Question requiring a brief typed response",
  "options": null,
  "correct_answer": "expected answer (key phrase)",
  "explanation": "The full correct answer with context",
  "points": 1
}
```

**Short answer guidelines:**
- Answers should be 1-5 words (a term, a number, a short phrase)
- Questions should have one clear correct answer, not open-ended
- "What is the name of...?", "Calculate...", "Define..."
- The correct_answer field holds the key phrase for matching

### Quiz 4 — Reflection (after closing video)

1 question. Free-form text response. Not graded pass/fail.

```json
{
  "type": "free_form",
  "question_text": "In your own words, describe everything you learned in this lesson. What were the main concepts? What examples stood out to you?",
  "options": [
    {"description": "Key concept 1 name", "keywords": ["keyword1", "keyword2"]},
    {"description": "Key concept 2 name", "keywords": ["keyword1", "keyword2"]},
    {"description": "Key concept 3 name", "keywords": ["keyword1", "keyword2"]}
  ],
  "correct_answer": null,
  "explanation": null,
  "points": 0
}
```

The `options` field stores key points for the reflection grading system. Each key point has a description and keywords — the system checks if the student mentioned those keywords in their response.

**Key points should cover:**
- Every major concept from the lesson (3-6 points)
- Keywords are the essential terms a student would use if they understood the concept

---

## Content Package Output

For each lesson, generate this complete package:

```
📦 LESSON: [Exact topic name]
│
├── intro-video-script.md
│   Script for Video 1 (intro). 3-5 minutes.
│   Includes: hook, preview, why it matters, quick taste, close.
│
├── slides-section-1.json
│   10-15 slides in database JSON format.
│   Covers first third of the topic's content.
│
├── quiz-1.json
│   10 multiple choice questions.
│
├── video-2-script.md
│   Script for Video 2 (examples). 3-4 minutes.
│   Includes: worked examples, common mistakes.
│
├── slides-section-2.json
│   10-15 slides. Second third of content.
│
├── quiz-2.json
│   10 MC + T/F questions.
│
├── video-3-script.md
│   Script for Video 3 (deep dive). 3-4 minutes.
│   Includes: hardest concept breakdown, exam-style example.
│
├── slides-section-3.json
│   10-15 slides. Final third of content.
│
├── quiz-3.json
│   10 short answer questions.
│
├── video-4-script.md
│   Script for Video 4 (closing). 2-3 minutes.
│   Includes: recap, bigger picture, encouragement, reflection prompt.
│
└── quiz-4-reflection.json
    1 reflection question with key points for grading.
```

---

## Naming Convention

Files follow this pattern:
```
content/[subject-slug]/form-[N]/term-[N]/[unit-number]-[topic-slug]/
```

Example:
```
content/mathematics/form-1/term-1/1-algebraic-expressions/
  ├── intro-video-script.md
  ├── slides-section-1.json
  ├── quiz-1.json
  ├── video-2-script.md
  ├── slides-section-2.json
  ├── quiz-2.json
  ├── video-3-script.md
  ├── slides-section-3.json
  ├── quiz-3.json
  ├── video-4-script.md
  └── quiz-4-reflection.json
```

---

*This template is the source of truth for all content generation. Every lesson must follow it exactly.*
