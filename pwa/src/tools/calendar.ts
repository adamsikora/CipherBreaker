// Name Day Searcher, port of CalendarActivity.kt

import holidaysText from '../assets/holidays.txt?raw';
import { parseIntWithDefault } from '../logic/format';
import { DAYS_OF_WEEK, Holiday, parseHolidays } from '../logic/holiday';
import { h } from '../shell/dom';
import { Tool } from '../shell/router';
import { toast } from '../shell/toast';

function numberOptions(count: number): HTMLOptionElement[] {
  return ['-', ...Array.from({ length: count }, (_, i) => String(i + 1))].map(value => h('option', null, value));
}

function isValidRegex(query: string): boolean {
  try {
    new RegExp(query);
    return true;
  } catch (e) {
    return false;
  }
}

export const calendarTool: Tool = {
  path: 'calendar',
  title: 'Name Day Searcher',
  icon: 'date-range',
  mount(container) {
    // Fixed widths, so that the pickers stay put whatever is selected, in every browser
    const daySelect = h('select', { style: 'width: 5em' }, ...numberOptions(31));
    const monthSelect = h('select', { style: 'width: 5em' }, ...numberOptions(12));
    const yearBox = h('input', { type: 'number', placeholder: 'Year', value: String(new Date().getFullYear()), style: 'width: 6em' });
    const dayOfWeekSelect = h('select', { style: 'width: 5.5em' }, ...DAYS_OF_WEEK.map(day => h('option', null, day)));
    const queryBox = h('input', { type: 'text', placeholder: 'Regex', autocomplete: 'off', spellcheck: false, style: 'flex: 1; min-width: 160px' });
    const sortByNameBox = h('input', { type: 'checkbox' });
    const resultView = h('div', { class: 'mono' });

    const holidays = parseHolidays(holidaysText, parseIntWithDefault(yearBox.value));

    function updateHolidays() {
      const query = queryBox.value;
      if (!isValidRegex(query)) {
        toast('Invalid regex syntax');
        return;
      }
      const year = parseIntWithDefault(yearBox.value);
      const day = parseIntWithDefault(daySelect.value);
      const month = parseIntWithDefault(monthSelect.value);
      const dayOfWeek = dayOfWeekSelect.value;
      const sortByName = sortByNameBox.checked;
      for (const holiday of holidays) holiday.updateYear(year);
      const filtered = holidays.filter(holiday => holiday.satisfiesFilters(day, month, dayOfWeek, query));
      filtered.sort(sortByName ? Holiday.nameFirstComparator : Holiday.dateFirstComparator);
      resultView.textContent = filtered.map(holiday => holiday.toString(sortByName)).join('');
    }

    for (const control of [daySelect, monthSelect, dayOfWeekSelect, sortByNameBox]) {
      control.addEventListener('change', updateHolidays);
    }
    yearBox.addEventListener('input', updateHolidays);
    // An unfinished regex while typing is not worth a message
    queryBox.addEventListener('input', () => {
      if (isValidRegex(queryBox.value)) updateHolidays();
    });

    container.append(
      h('div', { class: 'row nowrap' },
        h('label', { class: 'fixed' }, 'Day:', daySelect),
        h('label', { class: 'fixed' }, 'Month:', monthSelect),
        h('label', { class: 'fixed' }, 'Year:', yearBox),
        h('label', { class: 'fixed' }, 'Day of Week:', dayOfWeekSelect)),
      h('div', { class: 'row' }, queryBox, h('label', { class: 'check' }, sortByNameBox, 'Sort by name')),
      resultView,
    );
    updateHolidays();
    queryBox.focus();
  },
};
