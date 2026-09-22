/* ============================================================
   BOOKPRIVATE — MAIN SITE SCRIPT
   Handles two forms:
     1. The ADHD assessment enquiry form on the homepage — saves
        straight to localStorage (no email, no external service).
        Every enquiry becomes visible in the admin dashboard
        (/admin) with a status you can update and notes you can add.
     2. The clinic partnership enquiry form on /clinics — this one
        still uses a simple mailto fallback, since it's a low-volume
        B2B enquiry rather than a patient lead we need to manage.
   ============================================================ */

const ENQUIRIES_KEY = 'bookprivate_enquiries';
const CONTACT_EMAIL = 'hello@bookprivate.co.uk';

/* ---------- ADHD enquiry form (homepage) ---------- */

// Generates a short, unique-enough ID for each enquiry, e.g. "enq_1732000000_a1b2c3".
function generateEnquiryId() {
  return 'enq_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
}

function getEnquiries() {
  return JSON.parse(localStorage.getItem(ENQUIRIES_KEY) || '[]');
}

function saveEnquiries(enquiries) {
  localStorage.setItem(ENQUIRIES_KEY, JSON.stringify(enquiries));
}

function handleEnquirySubmit(event) {
  event.preventDefault();
  const form = event.target;

  const enquiry = {
    id: generateEnquiryId(),
    submittedAt: new Date().toISOString(),
    status: 'New',
    notes: '',
    assessmentFor: form.assessmentFor.value,
    age: form.age.value.trim(),
    symptomsDuration: form.symptomsDuration.value,
    gpStatus: form.gpStatus.value,
    postcode: form.postcode.value.trim(),
    fullName: form.fullName.value.trim(),
    email: form.email.value.trim(),
    phone: form.phone.value.trim(),
    urgency: form.urgency.value,
    hearAbout: form.hearAbout.value,
    consent: form.consent.checked
  };

  const enquiries = getEnquiries();
  enquiries.push(enquiry);
  saveEnquiries(enquiries);

  showThankYou(form);
}

// Swaps a submitted form out for its "thank you" message.
// Expects the form to be wrapped in <div class="form-wrapper">...</div>
// containing a sibling element with class "thank-you-message".
function showThankYou(form) {
  const wrapper = form.closest('.form-wrapper');
  form.style.display = 'none';
  const message = wrapper.querySelector('.thank-you-message');
  if (message) message.style.display = 'block';
}

/* ---------- Clinic partnership enquiry form (/clinics) ---------- */

function openMailto(subject, bodyLines) {
  const body = bodyLines.join('\n');
  const url = 'mailto:' + CONTACT_EMAIL +
    '?subject=' + encodeURIComponent(subject) +
    '&body=' + encodeURIComponent(body);
  window.location.href = url;
}

function handleClinicEnquiry(event) {
  event.preventDefault();
  const form = event.target;

  const data = {
    clinicName: form.clinicName.value.trim(),
    contactName: form.contactName.value.trim(),
    email: form.email.value.trim(),
    phone: form.phone.value.trim(),
    services: form.services.value.trim(),
    availability: form.availability.value.trim()
  };

  openMailto('New BookPrivate clinic partnership enquiry', [
    'Clinic name: ' + data.clinicName,
    'Contact name: ' + data.contactName,
    'Email: ' + data.email,
    'Phone: ' + data.phone,
    'Services offered: ' + data.services,
    'Approx. weekly availability: ' + data.availability
  ]);

  showThankYou(form);
}
