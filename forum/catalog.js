import { clearAccess, savedAccess } from './access.js';
import { filterIdeas, filterDates } from './catalog-filters.mjs';
export { filterIdeas, filterDates } from './catalog-filters.mjs';

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function initIdeas(root, data, datesData) {
  const themes = Array.isArray(data?.themes) ? data.themes : [];
  const dates = Array.isArray(datesData?.dates) ? datesData.dates : [];
  const input = root.querySelector('#idea-search'), select = root.querySelector('#idea-theme');
  const clear = root.querySelector('#idea-clear'), status = root.querySelector('#idea-status');
  const results = root.querySelector('#idea-results'), empty = root.querySelector('#idea-empty');
  const dateSearch = root.querySelector('#date-search'), dateClear = root.querySelector('#date-clear');
  const datePicker = root.querySelector('#date-picker'), dateOptions = root.querySelector('#date-options');
  const dateStatus = root.querySelector('#date-status'), dateEmpty = root.querySelector('#date-empty');
  const selectionPanel = root.querySelector('#forum-selection'), selectionDate = root.querySelector('#selection-date');
  const selectionTitle = root.querySelector('#selection-title'), selectionDescription = root.querySelector('#selection-description');
  const selectionStatus = root.querySelector('#selection-status'), copy = root.querySelector('#selection-copy');
  const compact = matchMedia('(max-width:760px)'), openThemes = new Set();
  const storageKey = 'park-forum-selection-v1';
  let selectedDate = null, selectedIdea = null;
  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey) || 'null');
    selectedDate = dates.find(date => date.id === saved?.dateId) || null;
    for (const theme of themes) {
      const idea = theme.ideas.find(item => item.sourceRow === saved?.ideaRow);
      if (idea) selectedIdea = { ...idea, themeName: theme.name };
    }
  } catch { /* Browser storage is optional for drafting a selection. */ }

  function saveSelection() {
    try {
      if (selectedDate || selectedIdea) sessionStorage.setItem(storageKey, JSON.stringify({ dateId: selectedDate?.id || null, ideaRow: selectedIdea?.sourceRow || null }));
      else sessionStorage.removeItem(storageKey);
    } catch {}
  }
  function focusIdeas() {
    input.scrollIntoView({ block: 'nearest' });
    input.focus({ preventScroll: true });
  }
  function focusDates() {
    datePicker.open = true;
    dateSearch.scrollIntoView({ block: 'nearest' });
    dateSearch.focus({ preventScroll: true });
  }
  function renderSelection() {
    selectionPanel.hidden = !selectedDate && !selectedIdea;
    selectionStatus.textContent = '';
    copy.disabled = !selectedDate || !selectedIdea;
    root.querySelector('#date-selection-label').textContent = selectedDate ? `${selectedDate.monthDay}, ${selectedDate.year}` : 'Available Forum dates';
    selectionDate.textContent = selectedDate?.label || 'Choose a date to complete your selection';
    selectionTitle.textContent = selectedIdea?.title || 'Choose a conversation idea';
    selectionDescription.textContent = selectedIdea?.themeName || 'Search a question or browse the themes above.';
  }
  function renderDates() {
    const matches = filterDates(dates, dateSearch.value);
    dateClear.hidden = dateSearch.value.length === 0;
    dateEmpty.hidden = matches.length > 0;
    dateOptions.hidden = matches.length === 0;
    dateStatus.textContent = `${matches.length} ${matches.length === 1 ? 'date' : 'dates'}${dateSearch.value.trim() ? ' found' : ' available'}`;
    const fragment = document.createDocumentFragment();
    for (const date of matches) {
      const button = element('button', 'date-option');
      button.type = 'button'; button.dataset.date = date.id;
      button.setAttribute('aria-pressed', String(date.id === selectedDate?.id));
      button.setAttribute('aria-label', `${date.label}. Choose an idea for this date.`);
      button.setAttribute('aria-controls', 'forum-selection idea-results');
      button.append(element('span', 'date-year', `${date.weekday} · ${date.year}`), element('span', 'date-day', date.monthDay));
      button.addEventListener('click', () => {
        selectedDate = date; saveSelection(); renderSelection(); renderDates(); renderIdeas();
        if (compact.matches) datePicker.open = false;
        if (selectedIdea) { selectionPanel.scrollIntoView({ block: 'nearest' }); selectionTitle.focus({ preventScroll: true }); }
        else focusIdeas();
      });
      fragment.append(button);
    }
    dateOptions.replaceChildren(fragment);
  }
  function renderIdeas() {
    const query = input.value.trim(), filtered = Boolean(query || select.value);
    const groups = filterIdeas(themes, query, select.value);
    const count = groups.reduce((sum, group) => sum + group.ideas.length, 0);
    clear.hidden = input.value.length === 0;
    empty.hidden = count > 0; results.hidden = count === 0;
    status.textContent = `${count} ${count === 1 ? 'idea' : 'ideas'}${filtered ? ' found' : ''} across ${groups.length} ${groups.length === 1 ? 'theme' : 'themes'}`;
    const fragment = document.createDocumentFragment();
    for (const group of groups) {
      const details = element('details', 'topic ideas-theme');
      details.dataset.theme = group.id; details.open = filtered || openThemes.has(group.id);
      const summary = element('summary');
      const number = element('span', 'topic-number', String(themes.findIndex(theme => theme.id === group.id) + 1).padStart(2, '0'));
      number.setAttribute('aria-hidden', 'true');
      const toggle = element('span', 'topic-toggle', '+'); toggle.setAttribute('aria-hidden', 'true');
      summary.append(number, element('span', 'topic-title', group.name), element('span', 'idea-count', `${group.ideas.length} ${group.ideas.length === 1 ? 'idea' : 'ideas'}`), toggle);
      const list = element('ul', 'idea-list');
      for (const idea of group.ideas) {
        const item = element('li', 'idea-item');
        if (idea.title) item.append(element('h3', 'idea-title', idea.title));
        item.append(element('p', 'idea-text', idea.text));
        const chosen = selectedIdea?.sourceRow === idea.sourceRow;
        const choose = element('button', 'idea-choose', chosen ? 'Selected ✓' : 'Explore this idea ↗');
        choose.type = 'button'; choose.setAttribute('aria-pressed', String(chosen));
        choose.setAttribute('aria-label', `${chosen ? 'Selected' : 'Explore'} ${idea.title}${selectedDate ? ` for ${selectedDate.label}` : ''}`);
        choose.addEventListener('click', () => {
          selectedIdea = { ...idea, themeName: group.name };
          saveSelection(); renderSelection(); renderIdeas();
          if (!selectedDate) focusDates();
          else { selectionPanel.scrollIntoView({ block: 'nearest' }); selectionTitle.focus({ preventScroll: true }); }
        });
        item.append(choose); list.append(item);
      }
      details.append(summary, list);
      details.addEventListener('toggle', () => {
        if (!input.value.trim() && !select.value && details.isConnected) {
          if (details.open) openThemes.add(group.id); else openThemes.delete(group.id);
        }
      });
      fragment.append(details);
    }
    results.replaceChildren(fragment);
  }
  for (const theme of themes) {
    const option = element('option', '', theme.name); option.value = theme.id; select.append(option);
  }
  root.querySelector('.ideas-controls').addEventListener('submit', event => event.preventDefault());
  input.addEventListener('input', renderIdeas); input.addEventListener('search', renderIdeas);
  select.addEventListener('change', renderIdeas);
  clear.addEventListener('click', () => { input.value = ''; renderIdeas(); input.focus(); });
  root.querySelector('#idea-reset').addEventListener('click', () => { input.value = ''; select.value = ''; renderIdeas(); input.focus(); });
  dateSearch.addEventListener('input', renderDates); dateSearch.addEventListener('search', renderDates);
  const resetDates = () => { dateSearch.value = ''; renderDates(); dateSearch.focus(); };
  dateClear.addEventListener('click', resetDates); root.querySelector('#date-reset').addEventListener('click', resetDates);
  root.querySelector('#selection-clear').addEventListener('click', () => {
    selectedDate = null; selectedIdea = null; saveSelection(); renderSelection(); renderDates(); renderIdeas(); focusDates();
  });
  copy.addEventListener('click', async () => {
    if (!selectedDate || !selectedIdea) return;
    const text = `Park Forum — idea to explore\nDate: ${selectedDate.label}\nTheme: ${selectedIdea.themeName}\nIdea: ${selectedIdea.title}\n${selectedIdea.text}\n\nFor discussion; this selection does not reserve the date.`;
    try { await navigator.clipboard.writeText(text); selectionStatus.textContent = 'Selection copied. Share it to start the conversation.'; }
    catch { selectionStatus.textContent = 'Copy is unavailable. Select and copy the date and idea text instead.'; }
  });
  compact.addEventListener('change', () => { if (!compact.matches) datePicker.open = true; });
  if (compact.matches && selectedDate) datePicker.open = false;
  renderSelection(); renderDates(); renderIdeas();
}

const root = document.querySelector('#ideas-explorer'), catalog = document.querySelector('#catalog-data');
if (root && catalog) {
  const session = savedAccess();
  if (!session) location.replace('/catalog/');
  else {
    const { ideasData, datesData } = JSON.parse(catalog.textContent); catalog.remove();
    initIdeas(root, ideasData, datesData);
    document.querySelector('#catalog-lock')?.addEventListener('click', () => { clearAccess(); location.replace('/forum/'); });
    document.querySelector('#catalog-title')?.focus({ preventScroll: true });
    setTimeout(() => { clearAccess(); location.replace('/catalog/'); }, Math.max(0, session.expiresAt * 1000 - Date.now()));
    window.addEventListener('pageshow', event => { if (event.persisted && !savedAccess()) location.replace('/catalog/'); });
  }
}
