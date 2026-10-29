import { clearAccess, savedAccess } from './access.js';

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function initCatalog(root, data, datesData) {
  const themes = Array.isArray(data?.themes) ? data.themes : [];
  const dates = Array.isArray(datesData?.dates) ? datesData.dates : [];
  const dateStep = root.querySelector('#date-step'), ideaStep = root.querySelector('#idea-step');
  const title = root.querySelector('#catalog-title'), progress = root.querySelector('#catalog-progress');
  const dateOptions = root.querySelector('#date-options'), results = root.querySelector('#idea-results');
  const selection = root.querySelector('#forum-selection'), selectionTitle = root.querySelector('#selection-title');
  const status = root.querySelector('#selection-status');
  const storageKey = 'park-forum-selection-v1';
  let selectedDate = null, selectedIdea = null;
  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey) || 'null');
    selectedDate = dates.find(date => date.id === saved?.dateId) || null;
    if (selectedDate) for (const theme of themes) {
      const idea = theme.ideas.find(item => item.sourceRow === saved?.ideaRow);
      if (idea) selectedIdea = { ...idea, themeName: theme.name };
    }
  } catch { /* Draft selections also work without browser storage. */ }

  function save() {
    try {
      if (selectedDate) sessionStorage.setItem(storageKey, JSON.stringify({ dateId: selectedDate.id, ideaRow: selectedIdea?.sourceRow || null }));
      else sessionStorage.removeItem(storageKey);
    } catch {}
  }
  function showStep(step, focus = true) {
    if (step === 2 && !selectedDate) step = 1;
    root.dataset.step = String(step);
    dateStep.hidden = step !== 1; ideaStep.hidden = step !== 2;
    progress.textContent = `Step ${step} of 2`;
    title.textContent = step === 1 ? 'Choose a date' : 'Choose an idea';
    root.querySelector('#chosen-date').textContent = selectedDate?.label || '';
    root.scrollTop = 0; window.scrollTo(0, 0);
    if (focus) title.focus({ preventScroll: true });
  }
  function updateSelection() {
    selection.hidden = !selectedIdea;
    selectionTitle.textContent = selectedIdea?.title || '';
    status.textContent = '';
    for (const button of results.querySelectorAll('.idea-choose')) {
      const chosen = Number(button.dataset.row) === selectedIdea?.sourceRow;
      button.setAttribute('aria-pressed', String(chosen));
      button.textContent = chosen ? 'Selected ✓' : 'Choose this idea ↗';
    }
    for (const button of dateOptions.querySelectorAll('.date-option')) button.setAttribute('aria-pressed', String(button.dataset.date === selectedDate?.id));
  }
  root.querySelector('#date-count').textContent = `${dates.length} available Forum dates`;
  for (const date of dates) {
    const button = element('button', 'date-option');
    button.type = 'button'; button.dataset.date = date.id;
    button.setAttribute('aria-pressed', String(selectedDate?.id === date.id));
    button.setAttribute('aria-label', `${date.label}. Continue to choose an idea.`);
    button.setAttribute('aria-controls', 'idea-step');
    button.append(element('span', 'date-year', `${date.weekday} · ${date.year}`), element('span', 'date-day', date.monthDay));
    button.addEventListener('click', () => {
      if (selectedDate?.id !== date.id) selectedIdea = null;
      selectedDate = date; save(); updateSelection(); showStep(2); results.scrollTop = 0;
    });
    dateOptions.append(button);
  }
  for (const [index, theme] of themes.entries()) {
    const group = element('section', 'idea-theme');
    const heading = element('h2', 'theme-heading', theme.name); heading.id = `theme-${index}`;
    group.setAttribute('aria-labelledby', heading.id);
    const list = element('ul', 'idea-list');
    for (const idea of theme.ideas) {
      const item = element('li', 'idea-item');
      item.append(element('h3', 'idea-title', idea.title), element('p', 'idea-text', idea.text));
      const choose = element('button', 'idea-choose', 'Choose this idea ↗');
      choose.type = 'button'; choose.dataset.row = String(idea.sourceRow);
      choose.setAttribute('aria-pressed', 'false'); choose.setAttribute('aria-label', `Choose ${idea.title}`);
      choose.addEventListener('click', () => {
        if (!selectedDate) return;
        selectedIdea = { ...idea, themeName: theme.name }; save(); updateSelection();
        selection.scrollIntoView({ block: 'nearest' });
        selectionTitle.focus({ preventScroll: true });
      });
      item.append(choose); list.append(item);
    }
    group.append(heading, list); results.append(group);
  }
  root.querySelector('#change-date').addEventListener('click', () => showStep(1));
  root.querySelector('#selection-clear').addEventListener('click', () => {
    const previous = selectedIdea?.sourceRow;
    selectedIdea = null; save(); updateSelection();
    results.querySelector(`[data-row="${previous}"]`)?.focus({ preventScroll: true });
  });
  root.querySelector('#selection-copy').addEventListener('click', async () => {
    if (!selectedDate || !selectedIdea) return;
    const text = `Park Forum — idea to explore\nDate: ${selectedDate.label}\nTheme: ${selectedIdea.themeName}\nIdea: ${selectedIdea.title}\n${selectedIdea.text}\n\nFor discussion; this selection does not reserve the date.`;
    try { await navigator.clipboard.writeText(text); status.textContent = 'Selection copied. Share it to start the conversation.'; }
    catch { status.textContent = 'Copy is unavailable. Select and copy the date and idea text instead.'; }
    status.scrollIntoView({ block: 'nearest' });
  });
  updateSelection(); showStep(1, false);
}

const root = document.querySelector('#ideas-explorer'), catalog = document.querySelector('#catalog-data');
if (root && catalog) {
  const session = savedAccess();
  if (!session) location.replace('/catalog/');
  else {
    const { ideasData, datesData } = JSON.parse(catalog.textContent); catalog.remove();
    initCatalog(root, ideasData, datesData);
    document.querySelector('#catalog-lock')?.addEventListener('click', () => { clearAccess(); location.replace('/forum/'); });
    document.querySelector('#catalog-title')?.focus({ preventScroll: true });
    setTimeout(() => { clearAccess(); location.replace('/catalog/'); }, Math.max(0, session.expiresAt * 1000 - Date.now()));
    window.addEventListener('pageshow', event => { if (event.persisted && !savedAccess()) location.replace('/catalog/'); });
  }
}
