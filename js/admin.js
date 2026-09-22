/* ============================================================
   BOOKPRIVATE — ADMIN DASHBOARD SCRIPT
   IMPORTANT: this is a simple client-side login, not real
   security. The credentials below are visible to anyone who
   views this file's source, and everything (enquiries, notes,
   articles) is stored in this browser's own localStorage — not
   a shared database other devices can see. That's fine for a
   solo-founder MVP, but before handling real patient data this
   whole area should move to a proper backend with server-side
   authentication.

   Change the login credentials here whenever you like:
   ============================================================ */
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'GrowPrivate2026';

const SESSION_KEY = 'bookprivate_admin_token';
const ENQUIRIES_KEY = 'bookprivate_enquiries';
const ARTICLES_KEY = 'bookprivate_articles';

// Escapes text before it's inserted as HTML, so an enquiry or article
// containing "<" or "&" can't break the page layout.
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}

// Turns a status like "Appointment booked" into a CSS-safe class
// suffix like "Appointment-booked" (matches the .status-select.status-*
// colour rules in style.css).
function statusToClass(status) {
  return String(status).replace(/\s+/g, '-');
}

/* ============================================================
   LOGIN / SESSION
   ============================================================ */

function checkLogin(event) {
  event.preventDefault();
  const username = document.getElementById('adminUsername').value.trim();
  const password = document.getElementById('adminPassword').value;
  const error = document.getElementById('loginError');

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    // A simple per-tab session token. It doesn't need to be
    // cryptographically meaningful — it just needs to exist so we
    // know this tab has already logged in.
    const token = 'session_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10);
    sessionStorage.setItem(SESSION_KEY, token);
    error.style.display = 'none';
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
  renderStats();
  renderEnquiries();
  renderArticles();
}

document.addEventListener('DOMContentLoaded', function () {
  if (sessionStorage.getItem(SESSION_KEY)) {
    showDashboard();
  }
});

/* ============================================================
   SECTION 1 — SUMMARY STATS
   ============================================================ */

function getEnquiries() {
  return JSON.parse(localStorage.getItem(ENQUIRIES_KEY) || '[]');
}

function saveEnquiries(enquiries) {
  localStorage.setItem(ENQUIRIES_KEY, JSON.stringify(enquiries));
}

function renderStats() {
  const enquiries = getEnquiries();
  const now = new Date();
  const todayStr = now.toDateString();
  const weekMs = 7 * 24 * 60 * 60 * 1000;

  const total = enquiries.length;
  const today = enquiries.filter(function (e) {
    return new Date(e.submittedAt).toDateString() === todayStr;
  }).length;
  const thisWeek = enquiries.filter(function (e) {
    return (now - new Date(e.submittedAt)) <= weekMs;
  }).length;
  const contacted = enquiries.filter(function (e) {
    return e.status === 'Contacted';
  }).length;

  document.getElementById('statTotal').textContent = total;
  document.getElementById('statToday').textContent = today;
  document.getElementById('statWeek').textContent = thisWeek;
  document.getElementById('statContacted').textContent = contacted;
}

/* ============================================================
   SECTION 2 & 3 — ENQUIRIES TABLE + EXPANDABLE NOTES
   ============================================================ */

const STATUS_OPTIONS = ['New', 'Contacted', 'Appointment booked', 'Not suitable', 'No response'];

function renderEnquiries() {
  const wrapper = document.getElementById('enquiriesTableWrapper');
  const enquiries = getEnquiries().slice().sort(function (a, b) {
    return new Date(b.submittedAt) - new Date(a.submittedAt);
  });

  if (enquiries.length === 0) {
    wrapper.innerHTML = '<p class="empty-state">No enquiries yet. They will appear here as visitors submit the ADHD assessment enquiry form on the homepage — on this device/browser only.</p>';
    return;
  }

  const rows = enquiries.map(function (e) {
    const statusOptionsHtml = STATUS_OPTIONS.map(function (opt) {
      return '<option value="' + escapeHtml(opt) + '"' + (opt === e.status ? ' selected' : '') + '>' + escapeHtml(opt) + '</option>';
    }).join('');

    const mainRow =
      '<tr>' +
        '<td><button type="button" class="enquiry-row-toggle" onclick="toggleEnquiryRow(\'' + e.id + '\')" aria-label="Show details">▸</button></td>' +
        '<td>' + escapeHtml(new Date(e.submittedAt).toLocaleString('en-GB')) + '</td>' +
        '<td>' + escapeHtml(e.fullName) + '</td>' +
        '<td>' + escapeHtml(e.email) + '</td>' +
        '<td>' + escapeHtml(e.phone) + '</td>' +
        '<td>' + escapeHtml(e.assessmentFor) + '</td>' +
        '<td>' + escapeHtml(e.age) + '</td>' +
        '<td>' + escapeHtml(e.urgency) + '</td>' +
        '<td>' + escapeHtml(e.postcode) + '</td>' +
        '<td><select class="status-select status-' + statusToClass(e.status) + '" onchange="updateStatus(\'' + e.id + '\', this)">' + statusOptionsHtml + '</select></td>' +
      '</tr>';

    const detailRow =
      '<tr class="enquiry-detail-row" id="detail-' + e.id + '" style="display:none;">' +
        '<td colspan="10">' +
          '<div class="enquiry-detail-grid">' +
            '<div class="enquiry-detail-item"><span class="label">Who is this for</span><span class="value">' + escapeHtml(e.assessmentFor) + '</span></div>' +
            '<div class="enquiry-detail-item"><span class="label">Age</span><span class="value">' + escapeHtml(e.age) + '</span></div>' +
            '<div class="enquiry-detail-item"><span class="label">Symptoms present for</span><span class="value">' + escapeHtml(e.symptomsDuration) + '</span></div>' +
            '<div class="enquiry-detail-item"><span class="label">Seen a GP</span><span class="value">' + escapeHtml(e.gpStatus) + '</span></div>' +
            '<div class="enquiry-detail-item"><span class="label">Postcode</span><span class="value">' + escapeHtml(e.postcode) + '</span></div>' +
            '<div class="enquiry-detail-item"><span class="label">Full name</span><span class="value">' + escapeHtml(e.fullName) + '</span></div>' +
            '<div class="enquiry-detail-item"><span class="label">Email</span><span class="value">' + escapeHtml(e.email) + '</span></div>' +
            '<div class="enquiry-detail-item"><span class="label">Phone</span><span class="value">' + escapeHtml(e.phone) + '</span></div>' +
            '<div class="enquiry-detail-item"><span class="label">How soon</span><span class="value">' + escapeHtml(e.urgency) + '</span></div>' +
            '<div class="enquiry-detail-item"><span class="label">Heard about us via</span><span class="value">' + escapeHtml(e.hearAbout) + '</span></div>' +
            '<div class="enquiry-detail-item"><span class="label">Consent given</span><span class="value">' + (e.consent ? 'Yes' : 'No') + '</span></div>' +
            '<div class="enquiry-detail-item"><span class="label">Enquiry ID</span><span class="value">' + escapeHtml(e.id) + '</span></div>' +
          '</div>' +
          '<div class="enquiry-notes">' +
            '<label for="notes-' + e.id + '">Admin notes</label>' +
            '<textarea id="notes-' + e.id + '" oninput="updateNotes(\'' + e.id + '\', this)">' + escapeHtml(e.notes || '') + '</textarea>' +
            '<div class="enquiry-notes-saved" id="saved-' + e.id + '">Saved</div>' +
          '</div>' +
        '</td>' +
      '</tr>';

    return mainRow + detailRow;
  }).join('');

  wrapper.innerHTML =
    '<div class="admin-table-scroll">' +
      '<table class="admin-table">' +
        '<thead><tr><th></th><th>Received</th><th>Name</th><th>Email</th><th>Phone</th><th>For</th><th>Age</th><th>How soon</th><th>Postcode</th><th>Status</th></tr></thead>' +
        '<tbody>' + rows + '</tbody>' +
      '</table>' +
    '</div>';
}

// Expands/collapses the detail row under a given enquiry row.
function toggleEnquiryRow(id) {
  const row = document.getElementById('detail-' + id);
  const isHidden = row.style.display === 'none';
  row.style.display = isHidden ? 'table-row' : 'none';
}

// Saves the new status immediately to localStorage and recolours the
// dropdown — done without a full table re-render so open detail rows
// and typed notes aren't disturbed.
function updateStatus(id, selectEl) {
  const enquiries = getEnquiries();
  const enquiry = enquiries.find(function (e) { return e.id === id; });
  if (!enquiry) return;

  enquiry.status = selectEl.value;
  saveEnquiries(enquiries);

  selectEl.className = 'status-select status-' + statusToClass(selectEl.value);
  renderStats();
}

// Saves notes as the admin types, without re-rendering the table.
function updateNotes(id, textareaEl) {
  const enquiries = getEnquiries();
  const enquiry = enquiries.find(function (e) { return e.id === id; });
  if (!enquiry) return;

  enquiry.notes = textareaEl.value;
  saveEnquiries(enquiries);

  const savedLabel = document.getElementById('saved-' + id);
  if (savedLabel) {
    savedLabel.classList.add('show');
    clearTimeout(savedLabel._hideTimer);
    savedLabel._hideTimer = setTimeout(function () {
      savedLabel.classList.remove('show');
    }, 1200);
  }
}

/* ============================================================
   SECTION 4 — BLOG MANAGEMENT (add / edit / delete)
   ============================================================ */

function getArticles() {
  return JSON.parse(localStorage.getItem(ARTICLES_KEY) || '[]');
}

function saveArticles(articles) {
  localStorage.setItem(ARTICLES_KEY, JSON.stringify(articles));
}

function generateArticleId() {
  return 'art_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
}

// Turns "My Great Title!" into "my-great-title" for use in a URL.
function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function handleArticleForm(event) {
  event.preventDefault();
  const form = event.target;
  const editingId = form.editingId.value;

  const articleData = {
    title: form.title.value.trim(),
    slug: form.slug.value.trim() || slugify(form.title.value),
    date: form.date.value,
    category: form.category.value.trim(),
    excerpt: form.excerpt.value.trim(),
    content: form.content.value.trim()
  };

  const articles = getArticles();

  if (editingId) {
    const existing = articles.find(function (a) { return a.id === editingId; });
    if (existing) {
      Object.assign(existing, articleData);
    }
  } else {
    articleData.id = generateArticleId();
    articles.unshift(articleData);
  }

  saveArticles(articles);
  cancelEdit();
  renderArticles();
}

function editArticle(id) {
  const articles = getArticles();
  const article = articles.find(function (a) { return a.id === id; });
  if (!article) return;

  const form = document.getElementById('articleForm');
  form.editingId.value = article.id;
  form.title.value = article.title;
  form.slug.value = article.slug;
  form.date.value = article.date;
  form.category.value = article.category;
  form.excerpt.value = article.excerpt;
  form.content.value = article.content;

  document.getElementById('editingNote').style.display = 'block';
  document.getElementById('articlePanel').scrollIntoView({ behavior: 'smooth' });
}

function cancelEdit() {
  const form = document.getElementById('articleForm');
  form.reset();
  form.editingId.value = '';
  document.getElementById('editingNote').style.display = 'none';
}

function deleteArticle(id) {
  if (!confirm('Delete this article? This cannot be undone.')) return;
  const articles = getArticles().filter(function (a) { return a.id !== id; });
  saveArticles(articles);
  renderArticles();
}

function renderArticles() {
  const list = document.getElementById('articlesList');
  const articles = getArticles();

  if (articles.length === 0) {
    list.innerHTML = '<p class="empty-state">No articles added here yet. The 3 launch articles already live as files in /blog/ — this list only shows articles added or edited from this dashboard.</p>';
    return;
  }

  list.innerHTML = articles.map(function (a) {
    return '<div class="admin-list-item">' +
      '<div>' +
        '<strong>' + escapeHtml(a.title) + '</strong>' +
        '<div class="admin-list-meta">' + escapeHtml(a.date) + ' &middot; ' + escapeHtml(a.category) + ' &middot; slug: ' + escapeHtml(a.slug) + '</div>' +
      '</div>' +
      '<div class="admin-list-actions">' +
        '<button class="admin-edit-btn" onclick="editArticle(\'' + a.id + '\')">Edit</button>' +
        '<button class="admin-delete-btn" onclick="deleteArticle(\'' + a.id + '\')">Delete</button>' +
      '</div>' +
    '</div>';
  }).join('');
}
