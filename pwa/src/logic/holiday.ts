// A name day or holiday of the Czech calendar. Port of Holiday.kt

// Indexed by Date.getDay(), which starts with Sunday
const DAY_OF_WEEK_LIST = ['Ne', 'Po', 'Ut', 'St', 'Ct', 'Pa', 'So'];
export const DAYS_OF_WEEK = ['-', 'Po', 'Ut', 'St', 'Ct', 'Pa', 'So', 'Ne'];

const collator = new Intl.Collator('cs');

export class Holiday {
  private dayOfWeek = '';

  constructor(year: number, readonly month: number, readonly day: number, readonly name: string) {
    this.updateYear(year);
  }

  updateYear(year: number): void {
    // Set apart from the constructor, which would take a year below 100 for the 1900s
    const date = new Date(0);
    date.setFullYear(year, this.month - 1, this.day);
    this.dayOfWeek = DAY_OF_WEEK_LIST[date.getDay()];
  }

  toString(nameFirst: boolean): string {
    const date = `${String(this.day).padStart(2)}. ${String(this.month).padStart(2)}. (${this.dayOfWeek})`;
    return nameFirst ? `${this.name}  ${date}\n` : `${date}  ${this.name}\n`;
  }

  /** Query is a regex, or a substring, matched regardless of case and diacritics. */
  satisfiesFilters(day: number, month: number, dayOfWeek: string, query: string): boolean {
    const normalizedName = this.name.normalize('NFD').replace(/[^\x00-\x7F]/g, '');
    return (day === 0 || day === this.day) && (month === 0 || month === this.month)
      && (dayOfWeek === '-' || dayOfWeek === this.dayOfWeek)
      && (query === '' || tryMatch(this.name, query) || tryMatch(normalizedName, query));
  }

  static dateFirstComparator(h1: Holiday, h2: Holiday): number {
    return h1.month - h2.month || h1.day - h2.day || collator.compare(h1.name, h2.name);
  }

  static nameFirstComparator(h1: Holiday, h2: Holiday): number {
    return collator.compare(h1.name, h2.name) || h1.month - h2.month || h1.day - h2.day;
  }
}

function tryMatch(name: string, query: string): boolean {
  const test = name.toLowerCase();
  return new RegExp(query).test(test) || test.includes(query.toLowerCase());
}

/** Parses lines of holidays.txt, `D-M:name` each, skipping lines that are not of that form. */
export function parseHolidays(text: string, year: number): Holiday[] {
  const holidays: Holiday[] = [];
  for (const line of text.split('\n')) {
    const match = /^(\d+)-(\d+):(.+)$/.exec(line.trim());
    if (match) holidays.push(new Holiday(year, parseInt(match[2], 10), parseInt(match[1], 10), match[3]));
  }
  return holidays;
}
