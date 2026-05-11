import { startOfWeek, endOfWeek, addDays, subDays, format, parse } from "date-fns";
import { pl } from "date-fns/locale";

/**
 * Pobiera poniedziałek i piątek (koniec dnia roboczego) dla danego tygodnia
 * @param date - data w danym tygodniu
 * @returns obiekt z datami poniedziałku i piątku
 */
export function getWeekRange(date: Date) {
  const monday = startOfWeek(date, { weekStartsOn: 1 }); // 1 = poniedziałek
  const friday = endOfWeek(date, { weekStartsOn: 1 }); // piątek zamiast niedzieli
  
  return {
    monday,
    friday: subDays(friday, 2), // piątek zamiast niedzieli (endOfWeek zwraca niedzielę)
  };
}

/**
 * Zwraca sformatowany string zakresu tygodnia bez zer wiodących
 * Format: "DD.MM - DD.MM" lub "D.MM - D.MM"
 * @param date - data w danym tygodniu
 * @returns sformatowany string
 */
export function getWeekRangeString(date: Date): string {
  const { monday, friday } = getWeekRange(date);

  // Format bez zer wiodących: d.MM
  const mondayFormatted = format(monday, "d.MM", { locale: pl });
  const fridayFormatted = format(friday, "d.MM", { locale: pl });

  return `${mondayFormatted} - ${fridayFormatted}`;
}

/**
 * Zwraca datę tygodnia poprzedniego (7 dni wstecz)
 * @param date - aktualna data
 * @returns data z poprzedniego tygodnia
 */
export function getPreviousWeek(date: Date): Date {
  return subDays(date, 7);
}

/**
 * Zwraca datę tygodnia następnego (7 dni do przodu)
 * @param date - aktualna data
 * @returns data z następnego tygodnia
 */
export function getNextWeek(date: Date): Date {
  return addDays(date, 7);
}

/**
 * Zwraca bieżącą datę (dziś)
 * @returns dzisiejsza data
 */
export function getTodayDate(): Date {
  return new Date();
}

export function getWeekDateStrings(date: Date): string[] {
  const { monday } = getWeekRange(date);

  return Array.from({ length: 5 }, (_, index) => format(addDays(monday, index), "dd.MM.yyyy", { locale: pl }));
}

export function getTermDateStrings(termIndex: number, terms: string[]): string[] {
  const start = termIndex * 5;
  return terms.slice(start, start + 5);
}

export function findTermIndexForDate(dateString: string, terms: string[]): number {
  const exactIndex = terms.indexOf(dateString);
  if (exactIndex === -1) {
    return 0;
  }

  return Math.floor(exactIndex / 5);
}

export function getTermLabel(termIndex: number): string {
  return `Termin ${termIndex + 1}`;
}

export function formatScheduleDate(date: Date): string {
  return format(date, "dd.MM.yyyy", { locale: pl });
}

export function formatScheduleDateString(dateString: string): string {
  const parsed = parse(dateString, "dd.MM.yyyy", new Date());
  return format(parsed, "dd.MM.yyyy", { locale: pl });
}

export function parseScheduleDate(dateString: string): Date {
  return parse(dateString, "dd.MM.yyyy", new Date());
}
