// lib/offline/export-html.js
//
// Turns one lesson (content/highschool JSON format, or an IELTS reading lesson
// in the same shape) into a single self-contained HTML file: inline CSS, a
// small inline script for the quick checks and quiz, no network requests.
// Double-click the file and it works — no internet, no app.
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

function bulletList(items, className) {
  if (!items?.length) return ''
  return `<ul class="${className}">${items.map((b) => `<li>${escapeHtml(b)}</li>`).join('')}</ul>`
}

function question(item, { number } = {}) {
  const options = (item.options || []).map((opt, i) => {
    const isAnswer = i === item.answer
    return `<button type="button" class="opt${isAnswer ? ' is-answer' : ''}" data-i="${i}">` +
      `<span class="badge">${LETTERS[i] ?? i + 1}</span><span class="opt-text">${escapeHtml(opt)}</span></button>`
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
  const step = `<p class="step-no">Step ${index + 1} of ${total}</p>`
  switch (section.type) {
    case 'example': {
      const steps = (section.steps || [])
        .map((s) => `<li>${escapeHtml(String(s).replace(/^Step\s*\d+\s*[:.)-]\s*/i, ''))}</li>`)
        .join('')
      return `<section class="card step example">
${step}<p class="tag tag-sun">Worked example</p>
<h2>${escapeHtml(String(section.title || '').replace(/^Worked example:\s*/i, ''))}</h2>
<div class="box"><p class="box-label">The question</p><p>${escapeHtml(section.problem)}</p></div>
<ol class="steps">${steps}</ol>
<div class="box box-green"><p class="box-label">Answer</p><p><strong>${escapeHtml(section.answer)}</strong></p></div>
</section>`
    }
    case 'check':
      return `<section class="card step check">
${step}<p class="tag tag-blue">Quick check</p>
${question(section)}
</section>`
    case 'mistake':
      return `<section class="card step mistake">
${step}<p class="tag tag-rose">Watch out</p>
<h2>${escapeHtml(String(section.title || '').replace(/^Common mistake:\s*/i, ''))}</h2>
${paragraphs(section.body)}
</section>`
    case 'summary':
      return `<section class="card step summary">
${step}<p class="tag tag-green">Key points</p>
<h2>${escapeHtml(section.title || 'Key points')}</h2>
${bulletList(section.bullets, 'ticks')}
</section>`
    default:
      return `<section class="card step explain">
${step}<h2>${escapeHtml(section.title)}</h2>
${paragraphs(section.body)}
${bulletList(section.bullets, 'dots')}
${typeof section.svg === 'string' && section.svg ? `<figure class="fig">${section.svg}</figure>` : ''}
</section>`
  }
}

const CSS = `
:root{--ink:#0B1730;--body:#1E2C49;--muted:#475570;--meta:#6B7A96;--line:#E6EAF2;--paper:#F6F7FB;--blue:#2563EB;--blue-50:#EFF6FF;--green:#059669;--green-50:#ECFDF5;--green-200:#A7F3D0;--rose:#E11D48;--rose-50:#FFF1F2;--rose-200:#FECDD3;--sun:#B45309;--sun-50:#FFFBEB;--sun-200:#FDE68A}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--paper);color:var(--body);font:17px/1.65 system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif}
.wrap{max-width:46rem;margin:0 auto;padding:16px 16px 56px}
h1,h2,h3{color:var(--ink);line-height:1.2;margin:0}
h1{font-size:2rem;letter-spacing:-.02em;margin-top:14px}
h2{font-size:1.35rem;letter-spacing:-.01em}
p{margin:0 0 .9em;white-space:pre-line}
p:last-child{margin-bottom:0}
.brand{display:flex;align-items:center;gap:10px;padding:6px 0 18px;font-weight:700;color:var(--ink);font-size:1.05rem}
.brand svg{width:36px;height:36px;flex:none}
.brand .pill{margin-left:auto}
.pill{display:inline-block;border-radius:999px;background:#fff;border:1px solid var(--line);color:var(--muted);font-size:.75rem;font-weight:600;padding:4px 10px;white-space:nowrap}
.pills{display:flex;flex-wrap:wrap;gap:8px}
.pill-blue{background:var(--blue-50);border-color:transparent;color:#1D4ED8}
.lead{font-size:1.08rem;color:var(--muted);margin-top:12px}
.meta{color:var(--meta);font-size:.9rem;margin-top:10px}
.card{background:#fff;border:1px solid var(--line);border-radius:18px;padding:20px;margin-top:16px;box-shadow:0 1px 2px rgba(11,23,48,.04),0 4px 16px rgba(11,23,48,.05)}
.card h2{margin-bottom:12px}
.card h2::first-letter{text-transform:uppercase}
.label,.box-label,.step-no{font-size:.72rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--meta);margin:0 0 8px}
.step-no{float:right;margin:2px 0 0 12px;color:#9AA7BF;letter-spacing:.06em}
.tag{display:inline-block;border-radius:999px;font-size:.72rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:4px 12px;margin:0 0 12px}
.tag-sun{background:#FEF3C7;color:var(--sun)}
.tag-blue{background:var(--blue-50);color:#1D4ED8}
.tag-rose{background:var(--rose-50);color:#BE123C}
.tag-green{background:var(--green-50);color:#047857}
.tag-dark{background:var(--ink);color:#fff}
ul,ol{margin:0;padding:0;list-style:none}
ul.dots li,ul.ticks li,ul.goals li{position:relative;padding-left:26px;margin-top:10px}
ul.dots li::before{content:"";position:absolute;left:6px;top:.62em;width:8px;height:8px;border-radius:50%;background:var(--blue)}
ul.ticks li::before,ul.goals li::before{content:"";position:absolute;left:5px;top:.34em;width:6px;height:11px;border:solid var(--green);border-width:0 2.5px 2.5px 0;transform:rotate(45deg)}
ul.goals li::before{border-color:var(--blue)}
.mistake{border-color:var(--rose-200);background:#FFF8F9}
.box{border:1px solid var(--line);border-radius:14px;padding:14px 16px;margin-top:12px;background:#FBFCFE}
.box-green{border-color:var(--green-200);background:var(--green-50)}
.box-green .box-label{color:#047857}
ol.steps{counter-reset:s;margin-top:4px}
ol.steps li{counter-increment:s;position:relative;padding:12px 0 0 40px;min-height:40px}
ol.steps li::before{content:counter(s);position:absolute;left:0;top:11px;width:28px;height:28px;border-radius:50%;background:var(--blue);color:#fff;font-size:.8rem;font-weight:700;text-align:center;line-height:28px}
.fig{margin:16px -8px 0;border:1px solid var(--line);border-radius:14px;padding:10px;background:#fff;overflow:hidden}
.fig svg{display:block;width:100%;height:auto;max-width:36rem;margin:0 auto}
.q+.q{margin-top:22px;padding-top:22px;border-top:1px solid var(--line)}
.q-text{font-weight:700;color:var(--ink);font-size:1.08rem;line-height:1.4;margin-bottom:12px}
.q-num{color:var(--meta)}
.opts{display:grid;gap:10px}
.opt{display:flex;align-items:center;gap:12px;width:100%;min-height:52px;text-align:left;font:inherit;font-size:1rem;color:var(--ink);background:#fff;border:2px solid #C9D1E0;border-radius:14px;padding:10px 14px;cursor:pointer;-webkit-tap-highlight-color:transparent}
.opt:hover{border-color:#60A5FA;background:#F8FAFF}
.opt:focus-visible{outline:3px solid #93C5FD;outline-offset:2px}
.opt:disabled{cursor:default;color:var(--ink);opacity:1}
.opt-text{white-space:pre-line}
.badge{flex:none;width:30px;height:30px;border-radius:9px;background:var(--line);color:var(--muted);font-size:.85rem;font-weight:700;display:flex;align-items:center;justify-content:center}
.why{margin-top:12px;border:1px solid var(--sun-200);background:var(--sun-50);border-radius:14px;padding:14px 16px;font-size:.97rem}
.verdict{font-weight:700;color:var(--sun);margin-bottom:4px}
.q.done .opt:not(.is-answer):not(.picked){opacity:.55}
.q.done .opt:hover{background:#fff;border-color:#C9D1E0}
.q.done .opt.is-answer,.q.done .opt.is-answer:hover,html:not(.js) .opt.is-answer{border-color:var(--green);background:var(--green-50)}
.q.done .opt.is-answer .badge,html:not(.js) .opt.is-answer .badge{background:var(--green);color:#fff}
.q.wrong .opt.picked,.q.wrong .opt.picked:hover{border-color:var(--rose);background:var(--rose-50)}
.q.wrong .opt.picked .badge{background:var(--rose);color:#fff}
.q.right .why{border-color:var(--green-200);background:var(--green-50)}
.q.right .verdict{color:#047857}
html.js .q:not(.done) .why{display:none}
.quiz-head{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px}
.quiz-head .tag{margin:0}
.tally{font-size:.85rem;font-weight:600;color:var(--meta)}
.quiz-intro{color:var(--muted);font-size:.95rem;margin:8px 0 18px}
.score{margin-top:22px;border-radius:16px;padding:20px;text-align:center;background:var(--ink);color:#fff}
.score[hidden]{display:none}
.score-num{font-size:2.4rem;font-weight:800;line-height:1.1}
.score-msg{color:#C9D1E0;margin:6px 0 14px}
.btn{font:inherit;font-size:.95rem;font-weight:600;border:0;border-radius:12px;padding:12px 20px;background:#FBBF24;color:var(--ink);cursor:pointer;min-height:44px}
dl{margin:0}
dt{font-weight:700;color:var(--ink);margin-top:14px}
dl dt:first-child{margin-top:0}
dd{margin:2px 0 0;color:var(--muted)}
footer{margin-top:32px;padding-top:18px;border-top:1px solid var(--line);color:var(--meta);font-size:.85rem;text-align:center}
footer strong{color:var(--ink)}
@media (min-width:640px){.wrap{padding:28px 24px 72px}h1{font-size:2.5rem}.card{padding:26px 28px}.fig{margin:16px 0 0;padding:16px}}
@page{margin:14mm}
@media print{
body{background:#fff;font-size:11.5pt}
.wrap{max-width:none;padding:0}
.no-print{display:none!important}
.card{box-shadow:none;break-inside:avoid;page-break-inside:avoid}
.card.quiz,.card.glossary{break-inside:auto;page-break-inside:auto}
.q,.fig,.box,ol.steps li{break-inside:avoid;page-break-inside:avoid}
h2,h3,.q-text,.tag,.label{break-after:avoid;page-break-after:avoid}
.fig{margin:16px 0 0}
.opt{min-height:0;padding:7px 12px}
html.js .q:not(.done) .why{display:block}
.q .opt,.q.done .opt:not(.is-answer):not(.picked){opacity:1}
.opt.is-answer{border-color:var(--green)!important;background:var(--green-50)!important}
.opt.is-answer .badge{background:var(--green)!important;color:#fff!important}
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
d.getElementById('score-num').textContent=right+' / '+qs.length;
d.getElementById('score-title').textContent=right===qs.length?'Perfect score!':passed?'Lesson complete':'Nearly there';
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
if(v){if(!v.getAttribute('data-print'))v.setAttribute('data-print',v.textContent);v.textContent=right?'Correct!':'Not quite \\u2014 here is why';}
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

const BRAND_MARK = '<svg viewBox="0 0 36 36" aria-hidden="true"><rect width="36" height="36" rx="10" fill="#2563EB"/><g transform="translate(6 6)"><path d="M4 6.5C4 5.67 4.67 5 5.5 5H10c1.1 0 2 .9 2 2v12c0-1.1-.9-2-2-2H5.5C4.67 17 4 16.33 4 15.5v-9Z" fill="#fff"/><path d="M20 6.5c0-.83-.67-1.5-1.5-1.5H14c-1.1 0-2 .9-2 2v12c0-1.1.9-2 2-2h4.5c.83 0 1.5-.67 1.5-1.5v-9Z" fill="#FBBF24"/></g></svg>'

export function lessonToHtml(lesson) {
  if (!lesson || !Array.isArray(lesson.sections)) throw new Error('lessonToHtml: a lesson with sections is required')
  const sections = lesson.sections
  const quiz = Array.isArray(lesson.quiz) ? lesson.quiz : []
  const objectives = Array.isArray(lesson.objectives) ? lesson.objectives : []
  const glossary = Array.isArray(lesson.glossary) ? lesson.glossary : []
  const course = lesson.course || 'highschool'
  const subjectName = prettySlug(lesson.subject) || (course === 'ielts' ? 'IELTS' : '')

  const pills = [
    subjectName ? `<span class="pill pill-blue">${escapeHtml(subjectName)}</span>` : '',
    lesson.form ? `<span class="pill">Form ${escapeHtml(lesson.form)}${lesson.term ? ` · Term ${escapeHtml(lesson.term)}` : ''}</span>` : '',
    lesson.topic ? `<span class="pill">${escapeHtml(lesson.topic)}</span>` : '',
  ].filter(Boolean).join('')

  const meta = [
    lesson.minutes ? `About ${escapeHtml(lesson.minutes)} minutes` : '',
    `${sections.length} short steps`,
    quiz.length ? `${quiz.length}-question quiz` : '',
  ].filter(Boolean).join(' · ')

  const objectivesHtml = objectives.length
    ? `<section class="card"><p class="label">By the end you will be able to</p>${bulletList(objectives, 'goals')}</section>`
    : ''

  const quizHtml = quiz.length
    ? `<section class="card quiz" id="quiz">
<div class="quiz-head"><p class="tag tag-dark">Lesson quiz</p><span class="tally no-print" id="tally"></span></div>
<p class="quiz-intro">${quiz.length} questions. Choose an answer to check it — you need ${Math.ceil(quiz.length * PASS_MARK)} correct to complete the lesson.</p>
${quiz.map((item, i) => question(item, { number: i + 1 })).join('\n')}
<div class="score no-print" id="score" hidden>
<p class="score-num" id="score-num"></p>
<h3 id="score-title" style="color:#fff"></h3>
<p class="score-msg" id="score-msg"></p>
<button type="button" class="btn" id="again">Try the quiz again</button>
</div>
</section>`
    : ''

  const glossaryHtml = glossary.length
    ? `<section class="card glossary"><h2>Key words</h2><dl>${glossary.map((g) => `<dt>${escapeHtml(g.term)}</dt><dd>${escapeHtml(g.definition)}</dd>`).join('')}</dl></section>`
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
<div class="brand">${BRAND_MARK}<span>Rent a Tutor</span><span class="pill">Offline lesson</span></div>
<div class="pills">${pills}</div>
<h1>${escapeHtml(lesson.title)}</h1>
${lesson.summary ? `<p class="lead">${escapeHtml(lesson.summary)}</p>` : ''}
<p class="meta">${meta}</p>
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
