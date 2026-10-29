import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filterDates, filterIdeas } from '../../forum/catalog-filters.mjs';
const dates = [
  { date: '2026-12-15', label: 'Tuesday, December 15, 2026', monthDay: 'Dec 15' },
  { date: '2027-07-16', label: 'Friday, July 16, 2027', monthDay: 'Jul 16' },
  { date: '2027-06-16', label: 'Wednesday, June 16, 2027', monthDay: 'Jun 16' }
];
test('dates can be found by month, day, year, weekday, ISO date, or month/day', () => {
  assert.equal(filterDates(dates).length, 3);
  for (const query of ['July', 'jul 16', 'Friday', '2027-07-16', '7/16', '07/16/2027']) assert.deepEqual(filterDates(dates, query), [dates[1]]);
  assert.deepEqual(filterDates(dates, 'December 2026'), [dates[0]]);
  assert.equal(filterDates(dates, '2027').length, 2);
  assert.equal(filterDates(dates, '7/16/2026').length, 0);
  assert.equal(filterDates(dates, 'August').length, 0);
});
test('idea search combines theme filtering with all search words and preserves short-word matching', () => {
  const themes = [{ id: 'tech', name: 'Technology', ideas: [{ title: 'Machines That Pay', text: 'AI agents using Lightning' }, { title: 'Railways', text: 'New infrastructure' }] }, { id: 'energy', name: 'Energy', ideas: [{ title: 'Power', text: 'New infrastructure' }] }];
  assert.equal(filterIdeas(themes, 'AI')[0].ideas.length, 1);
  assert.equal(filterIdeas(themes, 'agents Lightning')[0].ideas[0].title, 'Machines That Pay');
  assert.deepEqual(filterIdeas(themes, 'infrastructure', 'energy').map(t => t.id), ['energy']);
  assert.equal(filterIdeas(themes, 'missing').length, 0);
});
