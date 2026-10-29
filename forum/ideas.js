import { clearAccess, savedAccess } from './access.js';

const normalize = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim();

export function filterIdeas(themes, query = '', selectedTheme = '') {
  const terms = normalize(query).split(' ').filter(Boolean);
  return themes.filter(theme => !selectedTheme || theme.id === selectedTheme)
    .map(theme => ({
      ...theme,
      ideas: theme.ideas.filter(idea => {
        const text = normalize(`${theme.name} ${idea.title || ''} ${idea.text}`);
        const words = text.split(/[^\p{L}\p{N}]+/u);
        return terms.every(term => term.length <= 2 ? words.includes(term) : text.includes(term));
      })
    })).filter(theme => theme.ideas.length > 0);
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function initIdeas(root, data, datesData) {
  const form = root.querySelector('.ideas-controls');
  const input = root.querySelector('#idea-search');
  const select = root.querySelector('#idea-theme');
  const clear = root.querySelector('#idea-clear');
  const status = root.querySelector('#idea-status');
  const results = root.querySelector('#idea-results');
  const empty = root.querySelector('#idea-empty');
  const emptyTitle = empty.querySelector('h3');
  const emptyText = empty.querySelector('p');
  const reset = root.querySelector('#idea-reset');
  const openThemes = new Set();
  const themes = data.themes;
  const dateOptions = root.querySelector('#date-options');
  const selectionPanel = root.querySelector('#forum-selection');
  const selectionDate = root.querySelector('#selection-date');
  const selectionTitle = root.querySelector('#selection-title');
  const selectionDescription = root.querySelector('#selection-description');
  const selectionActions = root.querySelector('#selection-actions');
  const selectionStatus = root.querySelector('#selection-status');
  const storageKey = 'park-forum-selection-v1';
  let selectedDate = null;
  let selectedIdea = null;

  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey) || 'null');
    selectedDate = datesData.dates.find(date => date.id === saved?.dateId) || null;
    if (selectedDate) {
      for (const theme of themes || []) {
        const idea = theme.ideas.find(item => item.sourceRow === saved?.ideaRow);
        if (idea) selectedIdea = { ...idea, themeName: theme.name };
      }
    }
  } catch { /* Selection still works when browser storage is unavailable. */ }

  function saveSelection() {
    try {
      if (selectedDate) sessionStorage.setItem(storageKey, JSON.stringify({ dateId: selectedDate.id, ideaRow: selectedIdea?.sourceRow || null }));
      else sessionStorage.removeItem(storageKey);
    } catch { /* Keep the current selection in memory. */ }
  }

  function renderSelection() {
    selectionPanel.hidden = !selectedDate;
    selectionStatus.textContent = '';
    for (const button of dateOptions.querySelectorAll('button')) {
      button.setAttribute('aria-pressed', String(button.dataset.date === selectedDate?.id));
    }
    if (!selectedDate) return;
    selectionDate.textContent = selectedDate.label;
    selectionTitle.textContent = selectedIdea ? selectedIdea.title : 'Which idea would you like to explore?';
    selectionDescription.textContent = selectedIdea ? `${selectedIdea.themeName} — ${selectedIdea.text}` : 'Search or browse the themes below, then choose an idea for this date.';
    selectionActions.hidden = !selectedIdea;
  }

  function focusSearch() {
    input.scrollIntoView({ block: 'center' });
    input.focus({ preventScroll: true });
  }

  for (const date of datesData.dates) {
    const button = element('button', 'date-option');
    button.type = 'button';
    button.dataset.date = date.id;
    button.setAttribute('aria-pressed', 'false');
    button.setAttribute('aria-label', `${date.label}. Choose an idea for this date.`);
    button.setAttribute('aria-controls', 'forum-selection idea-results');
    button.append(element('span', 'date-year', `${date.weekday} · ${date.year}`), element('span', 'date-day', date.monthDay));
    button.addEventListener('click', () => {
      selectedDate = date;
      saveSelection();
      renderSelection();
      render();
      if (selectedIdea) selectionTitle.focus();
      else focusSearch();
    });
    dateOptions.append(button);
  }

  root.querySelector('#selection-clear').addEventListener('click', () => {
    const previous = selectedDate?.id;
    selectedDate = null;
    selectedIdea = null;
    saveSelection();
    renderSelection();
    render();
    dateOptions.querySelector(`[data-date="${previous}"]`)?.focus();
  });
  root.querySelector('#selection-change').addEventListener('click', () => {
    selectedIdea = null;
    saveSelection();
    renderSelection();
    render();
    focusSearch();
  });
  root.querySelector('#selection-copy').addEventListener('click', async () => {
    if (!selectedDate || !selectedIdea) return;
    const text = `Park Forum — idea to explore\nDate: ${selectedDate.label}\nTheme: ${selectedIdea.themeName}\nIdea: ${selectedIdea.title}\n${selectedIdea.text}\n\nFor discussion; this selection does not reserve the date.`;
    try {
      await navigator.clipboard.writeText(text);
      selectionStatus.textContent = 'Selection copied. Share it to start the conversation.';
    } catch {
      selectionStatus.textContent = 'Copy is unavailable in this browser. You can select and copy the date and idea text above.';
    }
  });

  if (!Array.isArray(themes) || themes.length === 0) {
    input.disabled = true;
    select.disabled = true;
    clear.hidden = true;
    status.textContent = 'The idea collection is being prepared.';
    results.hidden = true;
    empty.hidden = false;
    emptyTitle.textContent = 'More conversations to come.';
    emptyText.textContent = 'Please check back soon to explore the themes and ideas.';
    reset.hidden = true;
    return;
  }

  input.disabled = false;
  select.disabled = false;
  for (const theme of themes) {
    const option = element('option', '', theme.name);
    option.value = theme.id;
    select.append(option);
  }

  function render() {
    const query = input.value.trim();
    const filtered = Boolean(query || select.value);
    const groups = filterIdeas(themes, query, select.value);
    const count = groups.reduce((sum, group) => sum + group.ideas.length, 0);
    const fragment = document.createDocumentFragment();
    clear.hidden = input.value.length === 0;
    empty.hidden = count > 0;
    results.hidden = count === 0;
    reset.hidden = !filtered;
    status.textContent = `${count} ${count === 1 ? 'idea' : 'ideas'} ${filtered ? 'found ' : ''}across ${groups.length} ${groups.length === 1 ? 'theme' : 'themes'}`;
    emptyTitle.textContent = 'A different starting point?';
    emptyText.textContent = 'No ideas match your search. Try another word or explore all themes.';

    for (const group of groups) {
      const index = themes.findIndex(theme => theme.id === group.id);
      const details = element('details', 'topic ideas-theme');
      details.dataset.theme = group.id;
      details.open = filtered || openThemes.has(group.id);
      const summary = element('summary');
      const number = element('span', 'topic-number', String(index + 1).padStart(2, '0'));
      number.setAttribute('aria-hidden', 'true');
      const title = element('span', 'topic-title', group.name);
      const countLabel = element('span', 'idea-count', `${group.ideas.length} ${group.ideas.length === 1 ? 'idea' : 'ideas'}`);
      const toggle = element('span', 'topic-toggle', '+');
      toggle.setAttribute('aria-hidden', 'true');
      summary.append(number, title, countLabel, toggle);
      const list = element('ul', 'idea-list');
      for (const idea of group.ideas) {
        const item = element('li', 'idea-item');
        if (idea.title) item.append(element('h3', 'idea-title', idea.title));
        item.append(element('p', 'idea-text', idea.text));
        if (selectedDate) {
          const chosen = selectedIdea?.sourceRow === idea.sourceRow;
          const choose = element('button', 'idea-choose', chosen ? 'Selected ✓' : 'Explore this idea ↗');
          choose.type = 'button';
          choose.setAttribute('aria-pressed', String(chosen));
          choose.setAttribute('aria-label', `${chosen ? 'Selected' : 'Explore'} ${idea.title} for ${selectedDate.label}`);
          choose.addEventListener('click', () => {
            selectedIdea = { ...idea, themeName: group.name };
            saveSelection();
            renderSelection();
            render();
            selectionPanel.scrollIntoView({ block: 'center' });
            selectionTitle.focus({ preventScroll: true });
          });
          item.append(choose);
        }
        list.append(item);
      }
      details.append(summary, list);
      details.addEventListener('toggle', () => {
        if (!input.value.trim() && !select.value && details.isConnected) {
          if (details.open) openThemes.add(group.id);
          else openThemes.delete(group.id);
        }
      });
      fragment.append(details);
    }
    results.replaceChildren(fragment);
  }

  form.addEventListener('submit', event => event.preventDefault());
  input.addEventListener('input', render);
  input.addEventListener('search', render);
  select.addEventListener('change', render);
  clear.addEventListener('click', () => { input.value = ''; render(); input.focus(); });
  reset.addEventListener('click', () => { input.value = ''; select.value = ''; render(); input.focus(); });
  renderSelection();
  render();
}

const root = document.querySelector('#ideas-explorer');
const catalog = document.querySelector('#catalog-data');
if (root && catalog) {
  const session = savedAccess();
  if (!session) location.replace('/catalog/');
  else {
    const { ideasData, datesData } = JSON.parse(catalog.textContent);
    catalog.remove();
    initIdeas(root, ideasData, datesData);
    const leave = () => { clearAccess(); location.replace('/forum/'); };
    document.querySelector('#catalog-lock')?.addEventListener('click', leave);
    setTimeout(() => { clearAccess(); location.replace('/catalog/'); }, Math.max(0, session.expiresAt * 1000 - Date.now()));
    window.addEventListener('pageshow', event => { if (event.persisted && !savedAccess()) location.replace('/catalog/'); });
  }
}
