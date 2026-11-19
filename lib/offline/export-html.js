// lib/offline/export-html.js
//
// Turns one lesson (content/highschool JSON format, or an IELTS reading lesson
// in the same shape) into a single self-contained HTML file: inline CSS, a
// small inline script for the quick checks and quiz, no network requests.
// Double-click the file and it works — no internet, no app.
//
// It is styled like the app ("Workbook": paper, ink, ruled lines, chalkboard
// green, copper numerals) but cannot load web fonts, so headings use Georgia
// and body text uses the system sans-serif.
//
// Pure functions with no imports, so this runs the same in the browser, in
// tests and in plain Node.
//
// All lesson text is escaped. `section.svg` strings are trusted repo content
// and are inserted as-is.

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']
const PASS_MARK = 0.6

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function exportFileName(lesson) {
  const raw = String(lesson?.id || lesson?.slug || 'lesson').toLowerCase()
  const safe = raw.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'lesson'
  return `rent-a-tutor-${safe}.html`
}

function prettySlug(slug) {
  return String(slug || '')
    .split('-')
    .filter(Boolean)
    .map((w) => (w.toLowerCase() === 'ielts' ? 'IELTS' : w[0].toUpperCase() + w.slice(1)))
    .join(' ')
}

function paragraphs(text) {
  if (!text) return ''
  return String(text)
    .split(/\n\n+/)
    .map((p) => `<p>${escapeHtml(p)}</p>`)
    .join('\n')
}

function list(items, className, tag = 'ul') {
  if (!items?.length) return ''
  return `<${tag} class="${className}">${items.map((b) => `<li>${escapeHtml(b)}</li>`).join('')}</${tag}>`
}

function question(item, { number } = {}) {
  const options = (item.options || []).map((opt, i) => {
    const isAnswer = i === item.answer
    return `<button type="button" class="opt${isAnswer ? ' is-answer' : ''}" data-i="${i}">` +
      `<span class="letter">${LETTERS[i] ?? i + 1}</span><span class="opt-text">${escapeHtml(opt)}</span></button>`
  }).join('\n')
  const answerText = item.options?.[item.answer]
  return `<div class="q" data-answer="${Number(item.answer)}">
<p class="q-text">${number ? `<span class="q-num">${number}.</span> ` : ''}${escapeHtml(item.question)}</p>
<div class="opts">
${options}
</div>
<div class="why">
<p class="verdict">Answer: ${escapeHtml(LETTERS[item.answer] ?? '')}${answerText != null ? ` — ${escapeHtml(answerText)}` : ''}</p>
<p>${escapeHtml(item.explanation)}</p>
</div>
</div>`
}

function sectionHtml(section, index, total) {
  const kicker = (kind) => `<p class="kicker">Step ${index + 1} of ${total}${kind ? ` · <span class="kind">${kind}</span>` : ''}</p>`
  switch (section.type) {
    case 'example': {
      const steps = (section.steps || [])
        .map((s) => `<li>${escapeHtml(String(s).replace(/^Step\s*\d+\s*[:.)-]\s*/i, ''))}</li>`)
        .join('')
      return `<section class="step example">
${kicker('Worked example')}
<h2>${escapeHtml(String(section.title || '').replace(/^Worked example:\s*/i, ''))}</h2>
<div class="problem"><p class="small-label">The question</p><p>${escapeHtml(section.problem)}</p></div>
<ol class="steps">${steps}</ol>
<div class="answer"><p class="small-label">Answer</p><p><strong>${escapeHtml(section.answer)}</strong></p></div>
</section>`
    }
    case 'check':
      return `<section class="step check">
${kicker('Quick question')}
${question(section)}
</section>`
    case 'mistake':
      return `<section class="step mistake">
${kicker('Common mistake')}
<h2>${escapeHtml(String(section.title || '').replace(/^Common mistake:\s*/i, ''))}</h2>
${paragraphs(section.body)}
</section>`
    case 'summary':
      return `<section class="step summary">
${kicker('Summary')}
<h2>${escapeHtml(section.title || 'Key points')}</h2>
${list(section.bullets, 'ticks')}
</section>`
    default:
      return `<section class="step explain">
${kicker('')}
<h2>${escapeHtml(section.title)}</h2>
${paragraphs(section.body)}
${list(section.bullets, 'squares')}
${typeof section.svg === 'string' && section.svg ? `<figure class="fig">${section.svg}</figure>` : ''}
</section>`
  }
}

const SERIF = 'Georgia,"Times New Roman",Times,serif'

const CSS = `
:root{--paper:#F9F9F7;--white:#FEFEFC;--ink:#0F1713;--body:#2F3A33;--muted:#58635D;--line:#D8DEDA;--line-strong:#B8C0BB;--green:#0F5337;--green-mid:#1A6B48;--green-pale:#F0F9F4;--copper:#B05C1F;--yellow:#FFE490;--yellow-pale:#FFF0C0;--red:#CC2E2C;--red-pale:#FFF2F1}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--paper);color:var(--body);font:17px/1.6 system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif}
::selection{background:var(--yellow);color:var(--ink)}
.wrap{max-width:43rem;margin:0 auto;padding:18px 20px 56px}
h1,h2,h3{font-family:${SERIF};font-weight:700;color:var(--ink);margin:0}
h1{font-size:2.1rem;line-height:1.08;letter-spacing:-.02em;margin-top:8px}
h2{font-size:1.5rem;line-height:1.15;letter-spacing:-.015em}
h2::first-letter{text-transform:uppercase}
p{margin:0 0 .9em;white-space:pre-line}
p:last-child{margin-bottom:0}
strong{color:var(--ink)}
.brand{display:flex;align-items:center;gap:10px;padding-bottom:14px;border-bottom:2px solid var(--ink);margin-bottom:26px}
.brand svg{width:32px;height:32px;flex:none}
.brand-name{font:700 1.15rem/1 ${SERIF};letter-spacing:-.02em;color:var(--ink)}
.brand-note{margin-left:auto;font-size:.8rem;font-weight:600;color:var(--muted)}
.place{font-size:.85rem;font-weight:600;color:var(--muted);margin:0}
.place b{color:var(--green)}
.lead{font-size:1.08rem;line-height:1.55;color:var(--muted);margin-top:14px}
.facts{font-size:.93rem;font-weight:600;color:var(--body);margin-top:14px}
.rule-head{border-bottom:2px solid var(--ink);padding-bottom:8px;margin-top:36px}
.rule-head h2{font-size:1.3rem}
.rule-head .sans{font:700 1rem/1.3 system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;color:var(--ink);margin:0}
.kicker,.small-label{font-size:.8rem;font-weight:700;color:var(--muted);margin:0 0 8px}
.kind{color:var(--green)}
.step{padding:30px 0;border-top:1px solid var(--line)}
main>.step:first-child,.aims+.step{border-top:0}
.aims+.step{padding-top:36px}
.step h2{margin-bottom:14px}
ul,ol{margin:0;padding:0;list-style:none}
.aims ol{counter-reset:a}
.aims li{counter-increment:a;position:relative;padding:10px 0 10px 34px;border-bottom:1px solid var(--line);color:var(--ink)}
.aims li::before{content:counter(a);position:absolute;left:2px;top:6px;font:400 1.35rem/1.5 ${SERIF};color:var(--copper)}
ul.squares{margin-top:14px}
ul.squares li{position:relative;padding-left:20px;margin-top:8px;color:var(--ink)}
ul.squares li::before{content:"";position:absolute;left:1px;top:.72em;width:6px;height:6px;background:var(--green-mid)}
ul.ticks{border-top:2px solid var(--ink)}
ul.ticks li{position:relative;padding:11px 0 11px 32px;border-bottom:1px solid var(--line);color:var(--ink)}
ul.ticks li::before{content:"";position:absolute;left:5px;top:1.02em;width:6px;height:12px;border:solid var(--green);border-width:0 2.5px 2.5px 0;transform:rotate(45deg)}
.mistake{background:var(--yellow-pale);border-top:0;border-radius:10px;padding:22px 20px 24px;margin:0 0 30px}
.mistake+.step{border-top:0;padding-top:0}
.mistake .kicker,.mistake .kind{color:#5C4700}
.mistake p{color:var(--ink)}
.problem{background:var(--green-pale);border-radius:10px;padding:16px 18px;color:var(--ink)}
.problem .small-label{color:var(--green);margin-bottom:4px}
ol.steps{counter-reset:s}
ol.steps li{counter-increment:s;position:relative;padding:14px 0 14px 38px;border-bottom:1px solid var(--line);color:var(--ink)}
ol.steps li:last-child{border-bottom:0}
ol.steps li::before{content:counter(s);position:absolute;left:2px;top:9px;font:400 1.6rem/1.5 ${SERIF};color:var(--copper)}
.answer{border-top:2px solid var(--ink);padding-top:12px}
.answer .small-label{margin-bottom:2px}
.answer strong{font-size:1.1rem;line-height:1.4}
.fig{margin:22px 0 0;border:1px solid var(--line);border-radius:10px;padding:14px 8px;background:var(--white);overflow:hidden}
.fig svg{display:block;width:100%;height:auto;max-width:35rem;margin:0 auto}
.fig svg text{font-family:inherit}
.q+.q{margin-top:26px;padding-top:26px;border-top:1px solid var(--line)}
.q-text{font-weight:700;color:var(--ink);font-size:1.1rem;line-height:1.38;margin-bottom:14px}
.q-num{color:var(--muted)}
.opts{display:grid;gap:9px}
.opt{position:relative;display:flex;align-items:center;gap:13px;width:100%;min-height:52px;text-align:left;font:inherit;font-size:1rem;line-height:1.35;color:var(--ink);background:var(--white);border:1px solid var(--line-strong);border-radius:8px;padding:11px 40px 11px 13px;cursor:pointer;-webkit-tap-highlight-color:transparent}
.opt:hover{border-color:var(--ink)}
.opt:focus-visible{outline:2px solid var(--green-mid);outline-offset:3px}
.opt:disabled{cursor:default;opacity:1}
.opt-text{white-space:pre-line}
.letter{flex:none;width:28px;height:28px;border-radius:50%;border:1px solid var(--line-strong);background:var(--white);color:var(--body);font:700 .88rem/1 ${SERIF};display:flex;align-items:center;justify-content:center}
.opt::after{position:absolute;right:14px;top:50%;transform:translateY(-50%);font-weight:700;font-size:1.05rem;line-height:1}
.why{margin-top:16px}
.verdict{font-weight:700;color:var(--ink);margin-bottom:2px}
.q.done .opt:not(.is-answer):not(.picked){color:var(--muted);border-color:var(--line)}
.q.done .opt:hover{border-color:var(--line)}
.q.done .opt.is-answer,.q.done .opt.is-answer:hover,html:not(.js) .opt.is-answer{border-color:var(--green-mid);background:var(--green-pale);box-shadow:inset 0 0 0 1px var(--green-mid)}
.q.done .opt.is-answer .letter,html:not(.js) .opt.is-answer .letter{background:var(--green);border-color:var(--green);color:#F8F7EE}
.q.done .opt.is-answer::after,html:not(.js) .opt.is-answer::after{content:"\\2713";color:var(--green)}
.q.wrong .opt.picked,.q.wrong .opt.picked:hover{border-color:var(--red);background:var(--red-pale);box-shadow:inset 0 0 0 1px var(--red)}
.q.wrong .opt.picked .letter{background:var(--red);border-color:var(--red);color:#fff}
.q.wrong .opt.picked::after{content:"\\2715";color:var(--red)}
.q.right .verdict{color:var(--green)}
.q.wrong .verdict{color:var(--red)}
html.js .q:not(.done) .why{display:none}
.quiz{padding-top:8px}
.quiz .rule-head{display:flex;align-items:baseline;justify-content:space-between;gap:12px}
.tally{font-size:.8rem;font-weight:600;color:var(--muted);white-space:nowrap}
.quiz-intro{color:var(--muted);font-size:.95rem;margin:12px 0 24px}
.score{margin-top:34px;border-top:2px solid var(--ink);padding-top:20px}
.score[hidden]{display:none}
.score-row{display:flex;align-items:center;gap:22px}
.score-num{font:400 4.6rem/1 ${SERIF};letter-spacing:-.03em;color:var(--ink);margin:0}
.stamp{display:inline-block;border:3px solid var(--green);border-radius:6px;padding:5px 12px;font:700 1.05rem/1.1 ${SERIF};letter-spacing:.08em;text-transform:uppercase;color:var(--green);transform:rotate(-8deg)}
.stamp.again{border-color:var(--copper);color:var(--copper)}
.score h3{font-size:1.5rem;margin-top:14px}
.score-msg{color:var(--muted);margin:6px 0 16px}
.btn{font:inherit;font-size:.95rem;font-weight:700;border:0;border-radius:8px;padding:12px 20px;background:var(--green);color:#F8F7EE;cursor:pointer;min-height:44px}
.btn:hover{background:#0B3E28}
dl{margin:0}
dl>div{padding:12px 0;border-bottom:1px solid var(--line)}
dt{font-weight:700;color:var(--ink)}
dd{margin:1px 0 0;color:var(--body)}
footer{margin-top:44px;padding-top:16px;border-top:1px solid var(--line);color:var(--muted);font-size:.85rem}
footer strong{color:var(--ink)}
@media (min-width:640px){.wrap{padding:32px 24px 72px}h1{font-size:2.75rem}h2{font-size:1.7rem}.fig{padding:22px 24px}.mistake{padding:28px 30px 30px}dl>div{display:grid;grid-template-columns:11rem 1fr;gap:20px}dd{margin:0}}
@page{margin:14mm}
@media print{
body{background:#fff;font-size:11.5pt}
.wrap{max-width:none;padding:0}
.no-print{display:none!important}
.step{padding:18px 0}
.q,.fig,.problem,.answer,.mistake,ol.steps li,.aims li,ul.ticks li,dl>div{break-inside:avoid;page-break-inside:avoid}
h2,h3,.q-text,.kicker,.small-label,.rule-head{break-after:avoid;page-break-after:avoid}
.opt{min-height:0;padding-top:7px;padding-bottom:7px}
html.js .q:not(.done) .why{display:block}
.q.done .opt:not(.is-answer):not(.picked){color:var(--ink)}
.opt.is-answer{border-color:var(--green-mid)!important;background:var(--green-pale)!important;box-shadow:inset 0 0 0 1px var(--green-mid)}
.opt.is-answer .letter{background:var(--green)!important;border-color:var(--green)!important;color:#F8F7EE!important}
.opt.is-answer::after{content:"\\2713";color:var(--green)}
*{-webkit-print-color-adjust:exact;print-color-adjust:exact}
}
`.trim()

// No lesson text is placed inside this script — it only reads the page.
const SCRIPT = `
(function(){
var d=document;d.documentElement.className+=' js';
function all(sel,root){return Array.prototype.slice.call((root||d).querySelectorAll(sel))}
var quiz=d.getElementById('quiz');
function update(){
if(!quiz)return;
var qs=all('.q',quiz),done=0,right=0;
qs.forEach(function(q){if(/\\bdone\\b/.test(q.className)){done++;if(/\\bright\\b/.test(q.className))right++}});
var tally=d.getElementById('tally');if(tally)tally.textContent=done+' of '+qs.length+' answered';
var score=d.getElementById('score');if(!score)return;
if(done<qs.length){score.hidden=true;return}
var passed=right/qs.length>=${PASS_MARK};
d.getElementById('score-num').textContent=right+'/'+qs.length;
var stamp=d.getElementById('score-stamp');stamp.textContent=passed?'Passed':'Try again';stamp.className=passed?'stamp':'stamp again';
d.getElementById('score-title').textContent=right===qs.length?'Perfect score':passed?'Lesson complete':'Not passed yet';
d.getElementById('score-msg').textContent=passed?'Well done. Read any explanations you were unsure about.':'Read the explanations above, then try the quiz again.';
score.hidden=false;
if(score.scrollIntoView)score.scrollIntoView({behavior:'smooth',block:'center'});
}
all('.q').forEach(function(q){
var opts=all('.opt',q);
opts.forEach(function(b){
b.addEventListener('click',function(){
if(/\\bdone\\b/.test(q.className))return;
var right=b.getAttribute('data-i')===q.getAttribute('data-answer');
q.className+=' done '+(right?'right':'wrong');
b.className+=' picked';
opts.forEach(function(o){o.disabled=true});
var v=q.querySelector('.verdict');
if(v){if(!v.getAttribute('data-print'))v.setAttribute('data-print',v.textContent);v.textContent=right?'Correct.':'Not quite.';}
update();
});
});
});
var again=d.getElementById('again');
if(again)again.addEventListener('click',function(){
all('.q',quiz).forEach(function(q){
q.className='q';
all('.opt',q).forEach(function(o){o.disabled=false;o.className=o.className.replace(/\\s*\\bpicked\\b/,'')});
var v=q.querySelector('.verdict');if(v&&v.getAttribute('data-print'))v.textContent=v.getAttribute('data-print');
});
update();
if(quiz.scrollIntoView)quiz.scrollIntoView({behavior:'smooth',block:'start'});
});
update();
})();
`.trim()

// The app mark: a teacher's tick on a chalkboard-green tile, with a copper full stop.
const BRAND_MARK = '<svg viewBox="0 0 36 36" aria-hidden="true"><rect width="36" height="36" rx="8" fill="#0F5337"/><path d="M9.5 19.5 15.5 25.5 26.5 10.5" fill="none" stroke="#F8F7EE" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="26.5" cy="25.5" r="2.4" fill="#E78F56"/></svg>'

export function lessonToHtml(lesson) {
  if (!lesson || !Array.isArray(lesson.sections)) throw new Error('lessonToHtml: a lesson with sections is required')
  const sections = lesson.sections
  const quiz = Array.isArray(lesson.quiz) ? lesson.quiz : []
  const objectives = Array.isArray(lesson.objectives) ? lesson.objectives : []
  const glossary = Array.isArray(lesson.glossary) ? lesson.glossary : []
  const course = lesson.course || 'highschool'
  const subjectName = prettySlug(lesson.subject) || (course === 'ielts' ? 'IELTS' : '')

  // Plain-text line above the title: "Biology · Form 4 · Term 1 · The Nervous System"
  const place = [
    subjectName ? `<b>${escapeHtml(subjectName)}</b>` : '',
    lesson.form ? `Form ${escapeHtml(lesson.form)}` : '',
    lesson.form && lesson.term ? `Term ${escapeHtml(lesson.term)}` : '',
    lesson.topic && lesson.topic !== subjectName ? escapeHtml(lesson.topic) : '',
  ].filter(Boolean).join(' · ')

  const facts = [
    lesson.minutes ? `About ${escapeHtml(lesson.minutes)} minutes` : '',
    `${sections.length} short steps`,
    quiz.length ? `${quiz.length}-question quiz` : '',
  ].filter(Boolean).join(' · ')

  const objectivesHtml = objectives.length
    ? `<section class="aims"><div class="rule-head"><p class="sans">By the end you will be able to</p></div>${list(objectives, 'goals', 'ol')}</section>`
    : ''

  const quizHtml = quiz.length
    ? `<section class="quiz" id="quiz">
<div class="rule-head"><h2>Lesson quiz</h2><span class="tally no-print" id="tally"></span></div>
<p class="quiz-intro">${quiz.length} questions. Choose an answer to check it. You need ${Math.ceil(quiz.length * PASS_MARK - 1e-9)} correct to pass the lesson.</p>
${quiz.map((item, i) => question(item, { number: i + 1 })).join('\n')}
<div class="score no-print" id="score" hidden>
<div class="score-row"><p class="score-num" id="score-num"></p><span class="stamp" id="score-stamp"></span></div>
<h3 id="score-title"></h3>
<p class="score-msg" id="score-msg"></p>
<button type="button" class="btn" id="again">Try the quiz again</button>
</div>
</section>`
    : ''

  const glossaryHtml = glossary.length
    ? `<section class="glossary"><div class="rule-head"><h2>Key words</h2></div><dl>${glossary.map((g) => `<div><dt>${escapeHtml(g.term)}</dt><dd>${escapeHtml(g.definition)}</dd></div>`).join('')}</dl></section>`
    : ''

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>${escapeHtml(lesson.title)} · Rent a Tutor</title>
<style>
${CSS}
</style>
</head>
<body>
<div class="wrap">
<header>
<div class="brand">${BRAND_MARK}<span class="brand-name">Rent a Tutor</span><span class="brand-note">Offline lesson</span></div>
${place ? `<p class="place">${place}</p>` : ''}
<h1>${escapeHtml(lesson.title)}</h1>
${lesson.summary ? `<p class="lead">${escapeHtml(lesson.summary)}</p>` : ''}
<p class="facts">${facts}</p>
</header>
<main>
${objectivesHtml}
${sections.map((s, i) => sectionHtml(s, i, sections.length)).join('\n')}
${quizHtml}
${glossaryHtml}
</main>
<footer><strong>Rent a Tutor — offline lesson</strong><br>This file works without internet. Keep it on your phone or share it with a classmate.</footer>
</div>
<script>
${SCRIPT}
</script>
</body>
</html>
`
}
