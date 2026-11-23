import { readFile, mkdir, writeFile } from 'node:fs/promises';

const read = (path) => new URL(path, import.meta.url);
const book = 'Anne of Green Gables';
const chapters = JSON.parse(await readFile(read('./chapters.json'), 'utf8'));
const chaptersDir = read('./docs/chapters/');
await mkdir(chaptersDir, { recursive: true });

function escapeHtml(value) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

function number(index) {
  return String(index + 1).padStart(2, '0');
}

function chapterFile(index) {
  return 'chapter-' + number(index) + '.html';
}

function layout({ title, description, prefix, home = false, content }) {
  const contents = home ? '#contents' : prefix + 'index.html#contents';
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#111912">
  <meta name="description" content="${escapeHtml(description)}">
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" href="${prefix}assets/site.css">
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  <header class="site-header">
    <div class="shell header-inner">
      <a class="brand" href="${prefix}index.html">
        <span class="gable" aria-hidden="true"><i></i></span>
        <span>Green Gables <strong>Reading Room</strong></span>
      </a>
      <nav aria-label="Main">
        <a class="top-link" href="${contents}">Contents</a>
      </nav>
    </div>
  </header>
  ${content}
  <footer class="site-footer">
    <div class="shell footer-inner">
      <span class="footer-title">Anne of Green Gables</span>
      <span>By L. M. Montgomery · Level 2 retelling by Anne Collins</span>
    </div>
  </footer>
</body>
</html>
`;
}

const list = chapters.map((chapter, index) => `
        <li>
          <a class="chapter-card" href="chapters/${chapterFile(index)}">
            <span class="chapter-number">${number(index)}</span>
            <div class="chapter-card-text">
              <h3>${escapeHtml(chapter.title)}</h3>
              <p>${escapeHtml(chapter.teaser)}</p>
            </div>
          </a>
        </li>`).join('');

const indexPage = layout({
  title: book + ' | Reading Room',
  description: 'Practice English with reading questions and revealable answers for all 11 chapters of Anne of Green Gables, Level 2.',
  prefix: './',
  home: true,
  content: `<main id="main">
    <section class="hero" aria-labelledby="book-title">
      <img class="hero-image" src="./assets/green-gables.webp" width="1536" height="1024" alt="" fetchpriority="high">
      <div class="shell hero-inner">
        <p class="eyebrow">Level 2 Reading Companion</p>
        <h1 id="book-title">Anne of<br><em>Green Gables</em></h1>
        <p class="hero-copy">Read a chapter, answer five questions, then reveal the answers to check your understanding.</p>
        <a class="action primary" href="chapters/${chapterFile(0)}">Start Chapter 1</a>
      </div>
    </section>
    <section id="contents" class="shell contents" aria-labelledby="contents-title">
      <header class="section-heading">
        <h2 id="contents-title">Table of Contents</h2>
        <p>${chapters.length} chapters <span aria-hidden="true">·</span> 5 questions per chapter</p>
      </header>
      <ol class="chapter-list">${list}
      </ol>
    </section>
  </main>`
});
await writeFile(read('./docs/index.html'), indexPage);

function questionRows(questions) {
  return questions.map(([question, answer], index) => `
          <li class="question-card">
            <div class="question-text">
              <span class="question-number" aria-hidden="true">${number(index)}</span>
              <h3 id="question-${index + 1}">${escapeHtml(question)}</h3>
            </div>
            <details class="answer-disclosure">
              <summary aria-describedby="question-${index + 1}">
                <span class="show-label">Show answer</span>
                <span class="hide-label">Hide answer</span>
                <span class="answer-icon" aria-hidden="true"></span>
              </summary>
              <p class="answer-text">${escapeHtml(answer)}</p>
            </details>
          </li>`).join('');
}

function neighbor(index, label) {
  const chapter = chapters[index];
  if (!chapter) return '';
  return `<a class="chapter-nav-link" href="${chapterFile(index)}">
            <span>${label}</span>
            <strong>${escapeHtml(chapter.title)}</strong>
          </a>`;
}

for (const [index, chapter] of chapters.entries()) {
  const title = escapeHtml(chapter.title);
  const next = neighbor(index + 1, 'Next chapter');
  const page = layout({
    title: 'Chapter ' + (index + 1) + ' – ' + chapter.title + ' | ' + book,
    description: 'Five reading questions with answers for Chapter ' + (index + 1) + ' of Anne of Green Gables, Level 2.',
    prefix: '../',
    content: `<main id="main">
    <section class="chapter-hero" aria-labelledby="chapter-title">
      <div class="shell chapter-hero-inner">
        <p class="eyebrow">Chapter ${index + 1} of ${chapters.length}</p>
        <h1 id="chapter-title">${title}</h1>
        <p>Level 2 edition <span aria-hidden="true">·</span> Page ${chapter.page}</p>
      </div>
    </section>
    <section class="shell practice" aria-labelledby="practice-title">
      <header class="section-heading practice-heading">
        <h2 id="practice-title">Reading Questions</h2>
        <p>Try each question before you reveal the answer.</p>
      </header>
      <ol class="question-list">${questionRows(chapter.questions)}
      </ol>
      <nav class="chapter-nav" aria-label="Chapter navigation">
          ${neighbor(index - 1, 'Previous chapter') || '<a class="chapter-nav-link" href="../index.html#contents"><strong>Table of Contents</strong></a>'}
          ${next || '<a class="chapter-nav-link" href="../index.html#contents"><strong>Table of Contents</strong></a>'}
      </nav>
    </section>
  </main>`
  });
  await writeFile(new URL(chapterFile(index), chaptersDir), page);
}
