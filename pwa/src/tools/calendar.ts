// Name Days, port of CalendarActivity.kt

import holidaysText from '../assets/holidays.txt?raw';
import { parseIntWithDefault } from '../logic/format';
import { DAYS_OF_WEEK, Holiday, parseHolidays } from '../logic/holiday';
import { queryBox as makeQueryBox } from '../components/query-box';
import { h } from '../shell/dom';
import { fixedTopLayout } from '../shell/layout';
import { Tool } from '../shell/router';
import { loadState, saveState } from '../shell/storage';
import { toast } from '../shell/toast';

// Saved filters; the year is not among them, it starts as the current one every time
interface State {
  day: string;
  month: string;
  dayOfWeek: string;
  query: string;
  sortByName: boolean;
}

const STATE_KEY = 'calendar';
const DEFAULT_STATE: State = { day: '-', month: '-', dayOfWeek: '-', query: '', sortByName: false };

/** Selects the option with the value when there is one, an unknown value is left alone */
function selectValue(select: HTMLSelectElement, value: string): void {
  if ([...select.options].some(option => option.value === value)) select.value = value;
}

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
  title: 'Name Days',
  icon: 'date-range',
  mount(container) {
    // Fixed widths, so that the pickers stay put whatever is selected, in every browser
    const daySelect = h('select', { style: 'width: 5em' }, ...numberOptions(31));
    const monthSelect = h('select', { style: 'width: 5em' }, ...numberOptions(12));
    const yearBox = h('input', { type: 'search', inputmode: 'numeric', placeholder: 'Year', value: String(new Date().getFullYear()), style: 'width: 6em' });
    const dayOfWeekSelect = h('select', { style: 'width: 5.5em' }, ...DAYS_OF_WEEK.map(day => h('option', null, day)));
    const queryBox = makeQueryBox('Regex', 'flex: 1; min-width: 160px', () => updateHolidays());
    const sortByNameBox = h('input', { type: 'checkbox' });
    const resultView = h('div', { class: 'mono' });

    const state = loadState(STATE_KEY, DEFAULT_STATE);
    const save = () => saveState(STATE_KEY, {
      day: daySelect.value, month: monthSelect.value, dayOfWeek: dayOfWeekSelect.value, query: queryBox.value,
      sortByName: sortByNameBox.checked,
    } satisfies State);

    const holidays = parseHolidays(holidaysText, parseIntWithDefault(yearBox.value));

    function updateHolidays() {
      save();
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

    /** Puts in a saved state, an example or the defaults; the year is the current one either way */
    function applyState(s: State) {
      selectValue(daySelect, s.day);
      selectValue(monthSelect, s.month);
      selectValue(dayOfWeekSelect, s.dayOfWeek);
      queryBox.value = s.query;
      sortByNameBox.checked = s.sortByName;
      yearBox.value = String(new Date().getFullYear());
      updateHolidays();
    }

    for (const control of [daySelect, monthSelect, dayOfWeekSelect, sortByNameBox]) {
      control.addEventListener('change', updateHolidays);
    }
    yearBox.addEventListener('input', updateHolidays);
    // An unfinished regex while typing is not worth a message
    queryBox.addEventListener('input', () => {
      if (isValidRegex(queryBox.value)) updateHolidays();
    });

    const unmountLayout = fixedTopLayout(container, [
      h('div', { class: 'row nowrap' },
        h('label', { class: 'fixed' }, 'Day:', daySelect),
        h('label', { class: 'fixed' }, 'Month:', monthSelect),
        h('label', { class: 'fixed' }, 'Year:', yearBox),
        h('label', { class: 'fixed' }, 'Day of Week:', dayOfWeekSelect)),
      h('div', { class: 'row' }, queryBox, h('label', { class: 'check' }, sortByNameBox, 'Sort by name')),
    ], [resultView]);
    applyState(state);
    queryBox.focus();
    return {
      unmount() {
        save();
        unmountLayout();
      },
      reset: () => applyState(DEFAULT_STATE),
      examples: [
        { name: 'Name days in December', apply: () => applyState({ ...DEFAULT_STATE, month: '12' }) },
        { name: 'Every Petr and Pavel, by name', apply: () => applyState({ ...DEFAULT_STATE, query: 'petr|pavel', sortByName: true }) },
        { name: 'Sundays in January', apply: () => applyState({ ...DEFAULT_STATE, month: '1', dayOfWeek: 'Ne' }) },
      ],
    };
  },
};
