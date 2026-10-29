import { unlock, savedAccess, clearAccess, catalogPage } from './access.js';

const catalogMode = document.body.dataset.page === 'catalog';
const views = [...document.querySelectorAll('[data-view]')];
const back = document.querySelector('#world-back');
const form = document.querySelector('#password-form');
const password = document.querySelector('#sponsor-password');
const feedback = document.querySelector('#password-feedback');
let current = 'intro', submitting = false;
function show(view, focus = true) {
  current = view;
  document.documentElement.dataset.entered = String(view !== 'intro');
  for (const panel of views) panel.hidden = panel.dataset.view !== view;
  back.hidden = view === 'intro' || submitting;
  back.textContent = catalogMode ? '← Park Forum' : '← Back';
  if (focus) requestAnimationFrame(() => {
    const target = view === 'password' ? password : document.querySelector(`[data-view="${view}"] h1, [data-view="${view}"] h2, [data-view="${view}"] button`);
    target?.focus({ preventScroll: true });
  });
}
function sponsor() {
  feedback.textContent = ''; password.value = ''; password.removeAttribute('aria-invalid');
  if (savedAccess()) location.assign('/catalog/');
  else show('password');
}
document.querySelector('#explore').addEventListener('click', () => show('choices'));
document.querySelector('#forum-sponsor').addEventListener('click', sponsor);
document.querySelector('#learn-more').addEventListener('click', () => show('learn'));
document.querySelector('#learn-back').addEventListener('click', () => show('choices'));
back.addEventListener('click', () => {
  if (submitting) return;
  if (catalogMode) location.assign('/forum/');
  else show(current === 'choices' ? 'intro' : 'choices');
});
document.addEventListener('keydown', event => { if (event.key === 'Escape' && !back.hidden) back.click(); });
password.addEventListener('input', () => { password.removeAttribute('aria-invalid'); feedback.textContent = ''; });
async function renderCatalog(session) {
  show('loading');
  try {
    const html = await catalogPage(session);
    document.open(); document.write(html); document.close();
  } catch (error) {
    if (error.status === 401) clearAccess();
    show('password');
    feedback.textContent = error.status === 401 ? 'Your access has expired. Enter the password to continue.' : error.message || 'We couldn’t load the catalog. Please try again.';
  }
}
form.addEventListener('submit', async event => {
  event.preventDefault(); if (submitting || !form.reportValidity()) return;
  submitting = true; feedback.textContent = ''; back.hidden = true;
  const button = form.querySelector('button[type="submit"]'); button.disabled = true; password.disabled = true; button.textContent = 'Opening…';
  try {
    const session = await unlock(password.value); password.value = '';
    if (catalogMode) await renderCatalog(session);
    else location.assign('/catalog/');
  } catch (error) {
    feedback.textContent = error.message || 'We couldn’t confirm access. Please try again.';
    if (error.status === 401) { password.setAttribute('aria-invalid','true'); password.select(); }
  } finally {
    submitting = false; button.disabled = false; password.disabled = false; button.innerHTML = 'Enter catalog <span aria-hidden="true">↗</span>'; back.hidden = false;
    if (current === 'password') password.focus({ preventScroll: true });
  }
});
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
if (matchMedia('(pointer: fine)').matches) {
  let frame;
  document.addEventListener('pointermove', event => {
    if (reduced.matches || current === 'intro' || frame) return;
    frame = requestAnimationFrame(() => {
      const scene = document.querySelector('.world-image');
      scene?.style.setProperty('--scene-x', `${(event.clientX/innerWidth-.5)*-10}px`);
      scene?.style.setProperty('--scene-y', `${(event.clientY/innerHeight-.5)*-7}px`);
      frame = null;
    });
  }, { passive: true });
}
if (catalogMode) {
  const session = savedAccess();
  if (session) renderCatalog(session); else show('password', false);
} else show('intro', false);
