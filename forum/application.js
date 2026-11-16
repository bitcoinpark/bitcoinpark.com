(() => {
  'use strict';

  const section = document.getElementById('apply');
  const form = document.getElementById('attendance-form');
  const details = document.getElementById('applicant-details');
  const memberMessage = document.getElementById('member-message');
  const pageHistory = document.getElementById('application-pages');
  const submit = document.getElementById('application-submit');
  const memberChoice = 'I am a Bitcoin Park Member';
  let pending = false;

  function revealApplication() {
    section.hidden = false;
    document.getElementById('apply-title').focus({ preventScroll: true });
    section.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
      block: 'start'
    });
  }

  function updateMembership() {
    const choice = form.querySelector('input[type="radio"]:checked');
    const isMember = choice?.value === memberChoice;
    details.hidden = !choice || isMember;
    details.disabled = !choice || isMember;
    memberMessage.hidden = !isMember;
    pageHistory.value = isMember ? '0,1' : '0,2';
    document.getElementById('attendance-note').hidden = isMember;
  }

  function restoreForm() {
    pending = false;
    submit.disabled = false;
    form.removeAttribute('aria-busy');
  }

  for (const link of document.querySelectorAll('[data-application-link]')) {
    // The original Google Form URL remains a fallback when JavaScript is unavailable.
    link.href = '#apply';
    link.setAttribute('aria-controls', 'apply');
    link.querySelector('path').setAttribute('d', 'M16 5v22M6 17l10 10 10-10');
    link.addEventListener('click', event => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      if (window.location.hash !== '#apply') window.history.pushState(null, '', '#apply');
      revealApplication();
    });
  }

  form.addEventListener('change', updateMembership);
  form.addEventListener('input', event => {
    if (event.target.matches('input:not([type="radio"]), textarea')) {
      event.target.setCustomValidity('');
    }
  });

  form.addEventListener('submit', event => {
    if (pending) {
      event.preventDefault();
      return;
    }

    // Whitespace alone should not satisfy the required application questions.
    for (const field of form.querySelectorAll('input[required]:not([type="radio"]), textarea[required]')) {
      if (field.matches(':disabled')) continue;
      field.setCustomValidity(field.value.trim() ? '' : 'Please complete this field.');
    }
    if (!form.reportValidity()) {
      event.preventDefault();
      return;
    }

    updateMembership();
    pending = true;
    submit.disabled = true;
    form.setAttribute('aria-busy', 'true');
    // Let the browser POST normally and show Google's actual confirmation,
    // matching the City form. No iframe or inferred success state is needed.
  });

  window.addEventListener('hashchange', () => {
    if (window.location.hash === '#apply') revealApplication();
  });
  window.addEventListener('pageshow', () => {
    restoreForm();
    updateMembership();
  });
  updateMembership();
  if (window.location.hash === '#apply') revealApplication();
})();
