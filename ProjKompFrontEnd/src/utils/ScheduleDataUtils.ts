import { BlockData } from "./ClassBlockUtils";

export type ScheduledBlockData = BlockData;

function isValidTermNumber(term: number) {
  return Number.isInteger(term) && term >= 1 && term <= 15;
}

export function validateTermsData(terms: unknown): string[] {
  if (!Array.isArray(terms)) {
    const message = "Nieprawidlowy format terms.json: oczekiwana jest tablica 75 unikalnych dat.";
    console.error(message);
    throw new Error(message);
  }

  if (terms.length !== 75) {
    const message = `Nieprawidlowy format terms.json: oczekiwano 75 elementow, otrzymano ${terms.length}.`;
    console.error(message);
    throw new Error(message);
  }

  if (!terms.every((term) => typeof term === "string")) {
    const message = "Nieprawidlowy format terms.json: wszystkie pozycje musza byc lancuchami znakow.";
    console.error(message);
    throw new Error(message);
  }

  const uniqueCount = new Set(terms).size;
  if (uniqueCount !== 75) {
    const message = `Nieprawidlowy format terms.json: oczekiwano 75 unikalnych dat, otrzymano ${uniqueCount}.`;
    console.error(message);
    throw new Error(message);
  }

  return terms;
}

export function buildActiveDates(termsSelection: number[], day: number, terms: string[]): string[] {
  if (!Number.isInteger(day) || day < 0 || day > 4) {
    return [];
  }

  const activeDates: string[] = [];

  for (const term of termsSelection) {
    if (!isValidTermNumber(term)) {
      continue;
    }

    const termIndex = (term - 1) * 5 + day;
    const date = terms[termIndex];

    if (typeof date === "string") {
      activeDates.push(date);
    }
  }

  return [...new Set(activeDates)];
}

export function attachActiveDates(block: BlockData, terms: string[]): ScheduledBlockData {
  return {
    ...block,
    activeDates: buildActiveDates(block.terms, block.row, terms),
  };
}

export function refreshScheduledBlocks(blocks: BlockData[], terms: string[]): ScheduledBlockData[] {
  return blocks.map((block) => attachActiveDates(block, terms));
}

export function filterClassesForWeek(blocks: ScheduledBlockData[], weekDates: string[]): ScheduledBlockData[] {
  if (weekDates.length === 0) {
    return [];
  }

  const weekDateSet = new Set(weekDates);
  return blocks.filter((block) => block.activeDates.some((date) => weekDateSet.has(date)));
}

export function mapClassesToWeekDisplayRows(blocks: ScheduledBlockData[], weekDates: string[]): ScheduledBlockData[] {
  if (weekDates.length === 0) {
    return [];
  }

  const dateToRow = new Map(weekDates.map((date, index) => [date, index] as const));

  return blocks.flatMap((block) => {
    const displayRow = block.activeDates
      .map((date) => dateToRow.get(date))
      .find((rowIndex): rowIndex is number => typeof rowIndex === "number");

    if (typeof displayRow !== "number") {
      return [];
    }

    return [{ ...block, row: displayRow }];
  });
}

export function groupClassesByDay(blocks: ScheduledBlockData[], weekDates: string[]): ScheduledBlockData[][] {
  const filteredBlocks = filterClassesForWeek(blocks, weekDates);

  return Array.from({ length: 5 }, (_, dayIndex) => filteredBlocks.filter((block) => block.row === dayIndex));
}