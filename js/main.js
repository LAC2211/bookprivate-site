/* ============================================================
   BOOKPRIVATE — MAIN SITE SCRIPT
   Handles the registration form (homepage) and the clinic
   enquiry form (/clinics). There is no real backend yet, so
   every submission does two things:
     1. Saves a copy in the browser's localStorage, so it shows
        up in the admin dashboard (/admin).
     2. Opens a pre-filled email to hello@bookprivate.co.uk as a
        fallback, so nothing gets lost even without a database.
   ============================================================ */

const REGISTRATION_STORAGE_KEY = 'bookprivate_submissions';
const CONTACT_EMAIL = 'hello@bookprivate.co.uk';

// Save a registration to localStorage so /admin can list it later.
function saveSubmission(data) {
  const existing = JSON.parse(localStorage.getItem(REGISTRATION_STORAGE_KEY) || '[]');
  existing.push(data);
  localStorage.setItem(REGISTRATION_STORAGE_KEY, JSON.stringify(existing));
}

// Open the visitor's email client with the details pre-filled.
function openMailto(subject, bodyLines) {
  const body = bodyLines.join('\n');
  const url = 'mailto:' + CONTACT_EMAIL +
    '?subject=' + encodeURIComponent(subject) +
    '&body=' + encodeURIComponent(body);
  window.location.href = url;
}

// Swap a submitted form out for its "thank you" message.
// Expects the form to be wrapped in <div class="form-wrapper">...</div>
// containing a sibling element with class "thank-you-message".
function showThankYou(form) {
  const wrapper = form.closest('.form-wrapper');
  form.style.display = 'none';
  const message = wrapper.querySelector('.thank-you-message');
  if (message) message.style.display = 'block';
}

// Handles both registration forms on the homepage (hero + bottom CTA).
// The "source" argument just records which form was used, for context.
function handleRegister(event, source) {
  event.preventDefault();
  const form = event.target;

  const data = {
    source: source,
    fullName: form.fullName.value.trim(),
    email: form.email.value.trim(),
    phone: form.phone.value.trim(),
    appointmentType: form.appointmentType.value,
    postcode: form.postcode.value.trim(),
    timeframe: form.timeframe.value,
    submittedAt: new Date().toISOString()
  };

  saveSubmission(data);

  openMailto('New BookPrivate registration', [
    'Name: ' + data.fullName,
    'Email: ' + data.email,
    'Phone: ' + data.phone,
    'Appointment type: ' + data.appointmentType,
    'Postcode: ' + data.postcode,
    'Preferred timeframe: ' + data.timeframe,
    'Form location: ' + data.source
  ]);

  showThankYou(form);
}

// Handles the clinic partnership enquiry form on /clinics.
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
