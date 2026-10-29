import { unlock, savedAccess, clearAccess, catalogPage } from './access.js';

const catalogMode = document.body.dataset.page === 'catalog';
const views = [...document.querySelectorAll('[data-view]')];
const back = document.querySelector('#world-back');
const form = document.querySelector('#password-form');
const password = document.querySelector('#sponsor-password');
const feedback = document.querySelector('#password-feedback');
const temple = document.querySelector('.world-temple');
const arch = document.querySelector('.world-arch');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let current = 'intro', submitting = false;
let templeLoad, archLoad, journeyTimer, journeyVersion = 0;
function show(view, focus = true) {
  clearTimeout(journeyTimer); journeyVersion++;
  current = view;
  document.documentElement.dataset.entered = String(view !== 'intro');
  document.documentElement.dataset.scene = ['journey', 'attend'].includes(view) ? 'attend' : view === 'catalog-journey' ? 'catalog' : 'forum';
  for (const panel of views) panel.hidden = panel.dataset.view !== view;
  window.scrollTo(0, 0);
  back.hidden = view === 'intro' || submitting;
  back.textContent = catalogMode ? '← Park Forum' : '← Back';
  if (focus) requestAnimationFrame(() => {
    const target = view === 'password' ? password : document.querySelector(`[data-view="${view}"] h1, [data-view="${view}"] h2, [data-view="${view}"] button`);
    target?.focus({ preventScroll: true });
  });
}
function sponsor() {
  feedback.textContent = ''; password.value = ''; password.removeAttribute('aria-invalid');
  prepareArch();
  if (savedAccess()) location.assign('/catalog/');
  else show('password');
}
document.querySelector('#explore').addEventListener('click', () => show('choices'));
document.querySelector('#forum-sponsor').addEventListener('click', sponsor);
function prepareTemple() {
  if (temple.complete && temple.naturalWidth) return Promise.resolve(true);
  if (!templeLoad) {
    temple.src = temple.dataset.src;
    templeLoad = new Promise(resolve => {
      const timeout = setTimeout(() => resolve(false), 8000);
      temple.decode().then(() => {
        clearTimeout(timeout);
        document.documentElement.dataset.templeReady = 'true';
        resolve(true);
      }, () => { clearTimeout(timeout); templeLoad = undefined; resolve(false); });
    });
  }
  return templeLoad;
}
function prepareArch() {
  if (arch.complete && arch.naturalWidth) return Promise.resolve(true);
  if (!archLoad) {
    arch.src = arch.dataset.src;
    archLoad = new Promise(resolve => {
      const timeout = setTimeout(() => resolve(false), 8000);
      arch.decode().then(() => {
        clearTimeout(timeout); document.documentElement.dataset.archReady = 'true'; resolve(true);
      }, () => { clearTimeout(timeout); archLoad = undefined; resolve(false); });
    });
  }
  return archLoad;
}
function positionArchCamera() {
  const scene = document.querySelector('.world-image'), width = scene.clientWidth, height = scene.clientHeight;
  const fit = Math.max(width / (scene.naturalWidth || 1536), height / (scene.naturalHeight || 1024));
  const [ox, oy] = getComputedStyle(scene).transformOrigin.split(' ').map(parseFloat);
  const tx = width * .7;
  const ty = (height - (scene.naturalHeight || 1024) * fit) * .5 + (scene.naturalHeight || 1024) * .61 * fit;
  const scale = 1.9;
  scene.style.setProperty('--arch-camera', `translate3d(${width * .5 - (ox + scale * (tx - ox))}px,${height * .55 - (oy + scale * (ty - oy))}px,0) scale(${scale})`);
}
function positionTempleCamera() {
  const scene = document.querySelector('.world-image');
  const style = getComputedStyle(scene), width = scene.clientWidth, height = scene.clientHeight;
  const sourceWidth = scene.naturalWidth || 1536, sourceHeight = scene.naturalHeight || 1024;
  const fit = Math.max(width / sourceWidth, height / sourceHeight);
  // Pan the image crop as well as zooming, so the temple can enter a narrow screen.
  const px = .24, py = .5;
  const [ox, oy] = style.transformOrigin.split(' ').map(parseFloat);
  const tx = (width - sourceWidth * fit) * px + sourceWidth * .24 * fit;
  const ty = (height - sourceHeight * fit) * py + sourceHeight * .735 * fit;
  const scale = 2.6;
  const x = width * .66 - (ox + scale * (tx - ox));
  const y = height * (width <= 700 ? .38 : .55) - (oy + scale * (ty - oy));
  scene.style.setProperty('--temple-camera', `translate3d(${x}px,${y}px,0) scale(${scale})`);
}
document.querySelector('#learn-more').addEventListener('click', () => { show('learn'); prepareTemple(); });
document.querySelector('#attend-forum').addEventListener('click', async () => {
  positionTempleCamera();
  show('journey', false);
  const version = journeyVersion, started = performance.now();
  await prepareTemple();
  if (version !== journeyVersion || current !== 'journey') return;
  const delay = reduced.matches ? 0 : Math.max(0, 4400 - (performance.now() - started));
  journeyTimer = setTimeout(() => show('attend'), delay);
});
back.addEventListener('click', () => {
  if (submitting) return;
  if (catalogMode) location.assign('/forum/');
  else show(['attend', 'journey'].includes(current) ? 'learn' : current === 'choices' ? 'intro' : 'choices');
});
document.addEventListener('keydown', event => { if (event.key === 'Escape' && !back.hidden) back.click(); });
password.addEventListener('input', () => { password.removeAttribute('aria-invalid'); feedback.textContent = ''; });
async function renderCatalog(session) {
  positionArchCamera();
  show('catalog-journey', false);
  const started = performance.now();
  try {
    const htmlPromise = catalogPage(session);
    const arrival = prepareArch().then(() => new Promise(resolve => {
      setTimeout(resolve, reduced.matches ? 0 : Math.max(0, 4200 - (performance.now() - started)));
    }));
    const [html] = await Promise.all([htmlPromise, arrival]);
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
window.addEventListener('resize', () => {
  if (current === 'journey') positionTempleCamera();
  if (current === 'catalog-journey') positionArchCamera();
}, { passive: true });
reduced.addEventListener('change', () => { if (reduced.matches && current === 'journey') show('attend'); });
if (matchMedia('(pointer: fine)').matches) {
  let frame;
  document.addEventListener('pointermove', event => {
    if (reduced.matches || ['intro', 'journey', 'attend', 'catalog-journey'].includes(current) || frame) return;
    frame = requestAnimationFrame(() => {
      const scene = document.querySelector('.world-image');
      scene?.style.setProperty('--scene-x', `${(event.clientX/innerWidth-.5)*-10}px`);
      scene?.style.setProperty('--scene-y', `${(event.clientY/innerHeight-.5)*-7}px`);
      frame = null;
    });
  }, { passive: true });
}
if (catalogMode) {
  prepareArch();
  const session = savedAccess();
  if (session) renderCatalog(session); else show('password', false);
} else show('intro', false);
