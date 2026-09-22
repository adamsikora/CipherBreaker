import { describe, expect, it } from 'vitest';
import { Holiday, parseHolidays } from '../src/logic/holiday';

describe('Holiday', () => {
  it('follows the year with the day of week', () => {
    const holiday = new Holiday(2024, 12, 24, 'Adam');
    expect(holiday.toString(false)).toBe('24. 12. (Ut)  Adam\n');
    holiday.updateYear(2025);
    expect(holiday.toString(false)).toBe('24. 12. (St)  Adam\n');
  });

  it('pads the date and orders by the flag', () => {
    const holiday = new Holiday(2025, 1, 2, 'Karina');
    expect(holiday.toString(false)).toBe(' 2.  1. (Ct)  Karina\n');
    expect(holiday.toString(true)).toBe('Karina   2.  1. (Ct)\n');
  });

  it('matches everything with empty filters', () => {
    expect(new Holiday(2025, 12, 26, 'Štěpán').satisfiesFilters(0, 0, '-', '')).toBe(true);
  });

  it('requires date filters to match', () => {
    const holiday = new Holiday(2025, 12, 26, 'Štěpán'); // Friday
    expect(holiday.satisfiesFilters(26, 0, '-', '')).toBe(true);
    expect(holiday.satisfiesFilters(0, 12, '-', '')).toBe(true);
    expect(holiday.satisfiesFilters(26, 12, 'Pa', '')).toBe(true);
    expect(holiday.satisfiesFilters(25, 0, '-', '')).toBe(false);
    expect(holiday.satisfiesFilters(0, 11, '-', '')).toBe(false);
    expect(holiday.satisfiesFilters(0, 0, 'So', '')).toBe(false);
  });

  it('matches the query with and without diacritics', () => {
    const holiday = new Holiday(2025, 12, 26, 'Štěpán');
    expect(holiday.satisfiesFilters(0, 0, '-', 'stepan')).toBe(true);
    expect(holiday.satisfiesFilters(0, 0, '-', 'štěpán')).toBe(true);
    expect(holiday.satisfiesFilters(0, 0, '-', 'Stepan')).toBe(true);
    expect(holiday.satisfiesFilters(0, 0, '-', 'epa')).toBe(true);
    expect(holiday.satisfiesFilters(0, 0, '-', 'stefan')).toBe(false);
  });

  it('takes the query as a regex', () => {
    const holiday = new Holiday(2025, 12, 24, 'Adam');
    expect(holiday.satisfiesFilters(0, 0, '-', '^ad')).toBe(true);
    expect(holiday.satisfiesFilters(0, 0, '-', 'a.a')).toBe(true);
    expect(holiday.satisfiesFilters(0, 0, '-', '^dam')).toBe(false);
  });

  it('sorts by month, day and name with the date first comparator', () => {
    const eva = new Holiday(2025, 12, 24, 'Eva');
    const adam = new Holiday(2025, 12, 24, 'Adam');
    const barbora = new Holiday(2025, 12, 4, 'Barbora');
    const ondrej = new Holiday(2025, 11, 30, 'Ondřej');
    expect([eva, adam, barbora, ondrej].sort(Holiday.dateFirstComparator)).toEqual([ondrej, barbora, adam, eva]);
  });

  it('uses the Czech alphabet with the name first comparator', () => {
    const dana = new Holiday(2025, 12, 11, 'Dana');
    const cestmir = new Holiday(2025, 1, 8, 'Čestmír');
    const cyril = new Holiday(2025, 7, 5, 'Cyril');
    const petrJune = new Holiday(2025, 6, 29, 'Petr');
    const petrFebruary = new Holiday(2025, 2, 22, 'Petr');
    expect([petrJune, dana, cestmir, petrFebruary, cyril].sort(Holiday.nameFirstComparator))
      .toEqual([cyril, cestmir, dana, petrFebruary, petrJune]);
  });
});

describe('parseHolidays', () => {
  it('reads day, month and name of every line', () => {
    const holidays = parseHolidays('01-01:(sv) Nový rok\n02-01:Karina\n\n', 2025);
    expect(holidays.map(h => [h.day, h.month, h.name])).toEqual([[1, 1, '(sv) Nový rok'], [2, 1, 'Karina']]);
  });
});
