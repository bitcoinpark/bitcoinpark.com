export const normalize = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim();

export function filterIdeas(themes, query = '', selectedTheme = '') {
  const terms = normalize(query).split(' ').filter(Boolean);
  return themes.filter(theme => !selectedTheme || theme.id === selectedTheme)
    .map(theme => ({ ...theme, ideas: theme.ideas.filter(idea => {
      const text = normalize(`${theme.name} ${idea.title || ''} ${idea.text}`);
      const words = text.split(/[^\p{L}\p{N}]+/u);
      return terms.every(term => term.length <= 2 ? words.includes(term) : text.includes(term));
    }) })).filter(theme => theme.ideas.length > 0);
}

export function filterDates(dates, query = '') {
  const text = normalize(query);
  if (!text) return dates;
  const numeric = text.match(/^(\d{1,2})[/-](\d{1,2})(?:[/-](\d{4}))?$/);
  if (numeric) return dates.filter(date => {
    const [year, month, day] = date.date.split('-').map(Number);
    return month === Number(numeric[1]) && day === Number(numeric[2]) && (!numeric[3] || year === Number(numeric[3]));
  });
  const terms = text.split(/[\s,]+/).filter(Boolean);
  return dates.filter(date => {
    const label = normalize(`${date.label} ${date.monthDay} ${date.date}`);
    return terms.every(term => label.includes(term));
  });
}
