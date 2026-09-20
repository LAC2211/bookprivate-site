/* ============================================================
   BOOKPRIVATE — ADMIN DASHBOARD SCRIPT
   IMPORTANT: this is a simple client-side password gate, not
   real security. The password below is visible to anyone who
   views this file, and everything is stored in the browser's
   own localStorage (not a shared database). That's fine for an
   MVP run by one person, but before handling real patient data
   this whole area should move to a proper backend with
   server-side login.

   Change the password here whenever you like:
   ============================================================ */
const ADMIN_PASSWORD = 'GrowPrivate2026';

const SESSION_KEY = 'bookprivate_admin_session';
const ARTICLES_KEY = 'bookprivate_articles';
const SUBMISSIONS_KEY = 'bookprivate_submissions';

// Escapes text before it's inserted as HTML, so a submission or
// article containing "<" or "&" can't break the page layout.
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}

/* ---------- Login ---------- */

function checkLogin(event) {
  event.preventDefault();
  const input = document.getElementById('adminPassword');
  const error = document.getElementById('loginError');

  if (input.value === ADMIN_PASSWORD) {
    sessionStorage.setItem(SESSION_KEY, 'true');
    showDashboard();
  } else {
    error.style.display = 'block';
  }
}

function logout() {
  sessionStorage.removeItem(SESSION_KEY);
  location.reload();
}

function showDashboard() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('dashboard').style.display = 'block';
  renderArticles();
  renderSubmissions();
}

// Stay logged in for the rest of this browser tab session.
document.addEventListener('DOMContentLoaded', function () {
  if (sessionStorage.getItem(SESSION_KEY) === 'true') {
    showDashboard();
  }
});

/* ---------- Articles ---------- */

function getArticles() {
  return JSON.parse(localStorage.getItem(ARTICLES_KEY) || '[]');
}

function saveArticles(articles) {
  localStorage.setItem(ARTICLES_KEY, JSON.stringify(articles));
}

// Turns "My Great Title!" into "my-great-title" for use in a URL.
function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function handleNewArticle(event) {
  event.preventDefault();
  const form = event.target;

  const article = {
    title: form.title.value.trim(),
    slug: form.slug.value.trim() || slugify(form.title.value),
    date: form.date.value,
    category: form.category.value.trim(),
    excerpt: form.excerpt.value.trim(),
    content: form.content.value.trim()
  };

  const articles = getArticles();
  articles.unshift(article);
  saveArticles(articles);

  document.getElementById('generatedHtml').value = buildArticleHtml(article);
  document.getElementById('generatedHtmlWrapper').style.display = 'block';

  renderArticles();
  form.reset();
}

// Builds a full standalone HTML page for the article, matching the
// same template used by the files already in /blog/. Copy the text
// this produces into a new file named /blog/<slug>.html.
function buildArticleHtml(article) {
  const paragraphs = article.content
    .split(/\n\s*\n/)
    .map(function (p) { return '      <p>' + escapeHtml(p.trim()) + '</p>'; })
    .join('\n');

  return '<!DOCTYPE html>\n' +
'<html lang="en">\n' +
'<head>\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
'<title>' + escapeHtml(article.title) + ' | BookPrivate Blog</title>\n' +
'<meta name="description" content="' + escapeHtml(article.excerpt) + '">\n' +
'<meta property="og:title" content="' + escapeHtml(article.title) + '">\n' +
'<meta property="og:description" content="' + escapeHtml(article.excerpt) + '">\n' +
'<meta property="og:type" content="article">\n' +
'<meta property="og:url" content="https://bookprivate.co.uk/blog/' + escapeHtml(article.slug) + '.html">\n' +
'<link rel="preconnect" href="https://fonts.googleapis.com">\n' +
'<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
'<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">\n' +
'<link rel="stylesheet" href="../css/style.css">\n' +
'</head>\n' +
'<body>\n\n' +
'<!-- NAV -->\n' +
'<nav>\n' +
'  <a href="/" class="logo"><span class="logo-book">Book</span><span class="logo-private">Private</span></a>\n' +
'  <div class="nav-links">\n' +
'    <a href="/">Home</a>\n' +
'    <a href="/#how-it-works">How it works</a>\n' +
'    <a href="/#services">Services</a>\n' +
'    <a href="/blog/">Blog</a>\n' +
'    <a href="/clinics/">For Clinics</a>\n' +
'  </div>\n' +
'</nav>\n\n' +
'<!-- ARTICLE -->\n' +
'<article class="article-page">\n' +
'  <div class="article-inner">\n' +
'    <span class="blog-tag">' + escapeHtml(article.category) + '</span>\n' +
'    <h1>' + escapeHtml(article.title) + '</h1>\n' +
'    <p class="article-meta">' + escapeHtml(article.date) + '</p>\n' +
'    <div class="article-body">\n' +
paragraphs + '\n' +
'    </div>\n' +
'    <a href="/blog/" class="article-back">&larr; Back to all articles</a>\n' +
'  </div>\n' +
'</article>\n\n' +
'<!-- FOOTER -->\n' +
'<footer>\n' +
'  <a href="/" class="footer-brand"><span class="logo-book">Book</span><span class="logo-private">Private</span></a>\n' +
'  <div class="footer-meta">\n' +
'    BookPrivate is a trading name of ClinScale Ltd &nbsp;&middot;&nbsp; ICO Registered<br>\n' +
'    <a href="mailto:hello@bookprivate.co.uk" style="color: inherit; text-decoration: none;">hello@bookprivate.co.uk</a>\n' +
'  </div>\n' +
'</footer>\n\n' +
'</body>\n' +
'</html>\n';
}

function renderArticles() {
  const list = document.getElementById('articlesList');
  const articles = getArticles();

  if (articles.length === 0) {
    list.innerHTML = '<p class="empty-state">No articles added here yet. The 3 launch articles already live as files in /blog/ — this list only shows articles you generate from the form above.</p>';
    return;
  }

  list.innerHTML = articles.map(function (a, i) {
    return '<div class="admin-list-item">' +
      '<div>' +
        '<strong>' + escapeHtml(a.title) + '</strong>' +
        '<div class="admin-list-meta">' + escapeHtml(a.date) + ' &middot; ' + escapeHtml(a.category) + ' &middot; slug: ' + escapeHtml(a.slug) + '</div>' +
      '</div>' +
      '<button class="admin-delete-btn" onclick="deleteArticle(' + i + ')">Delete</button>' +
    '</div>';
  }).join('');
}

function deleteArticle(index) {
  const articles = getArticles();
  articles.splice(index, 1);
  saveArticles(articles);
  renderArticles();
}

/* ---------- Homepage registrations ---------- */

function renderSubmissions() {
  const container = document.getElementById('submissionsList');
  const submissions = JSON.parse(localStorage.getItem(SUBMISSIONS_KEY) || '[]');

  if (submissions.length === 0) {
    container.innerHTML = '<p class="empty-state">No registrations yet. They will appear here as visitors submit the homepage form — on this device/browser only.</p>';
    return;
  }

  const rows = submissions.slice().reverse().map(function (s) {
    return '<tr>' +
      '<td>' + escapeHtml(s.fullName) + '</td>' +
      '<td>' + escapeHtml(s.email) + '</td>' +
      '<td>' + escapeHtml(s.phone) + '</td>' +
      '<td>' + escapeHtml(s.appointmentType) + '</td>' +
      '<td>' + escapeHtml(s.postcode) + '</td>' +
      '<td>' + escapeHtml(s.timeframe) + '</td>' +
      '<td>' + escapeHtml(new Date(s.submittedAt).toLocaleString('en-GB')) + '</td>' +
    '</tr>';
  }).join('');

  container.innerHTML =
    '<div class="admin-table-scroll">' +
      '<table class="admin-table">' +
        '<thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Type</th><th>Postcode</th><th>Timeframe</th><th>Submitted</th></tr></thead>' +
        '<tbody>' + rows + '</tbody>' +
      '</table>' +
    '</div>';
}
