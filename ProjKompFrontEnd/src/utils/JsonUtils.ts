import { BlockData } from "./ClassBlockUtils";
import { GridProps, getCellPosition } from "./TimeGridUtils";
import { getGroupDataFromStorage, saveGroupDataToStorage } from "./GroupManager";
import { scheduleApiUrl } from "../config/scheduleApi";

export type JsonData = {
    info: {
        terms: Array<number | "x1" | "x2">,
        extra: string,
        name: string,
    },
    reference: string,
    color: number,
    start: number,
    length: number,
    day: number
};

export type JsonRoot = {
    name: string;
    classes: JsonData[];
};

const LOCAL_STORAGE_KEY = "projkomp.timetable.json";
const DEFAULT_TIMETABLE_NAME = "Lokalny plan";

function normalizeTerms(terms: unknown): number[] {
    if (!Array.isArray(terms)) {
        return [];
    }

    const validTerms = terms
        .filter((term): term is number => Number.isInteger(term) && term >= 1 && term <= 15)
        .sort((a, b) => a - b);

    return [...new Set(validTerms)];
}

function normalizeTermMode(terms: unknown): "x1" | "x2" {
    if (!Array.isArray(terms)) {
        return "x1";
    }

    return terms.includes("x2") ? "x2" : "x1";
}

export function jsonToBlockData(json: JsonData, gridProps: GridProps): BlockData {
    const col = json.start - 8;
    const row = json.day;
    const position = getCellPosition(row, col, gridProps);
    const result: BlockData = {
        id: 0,
        col,
        row,
        subrow: 0,
        x: position.x,
        y: position.y,
        hourSpan: json.length,
        color: "#" + json.color.toString(16).padStart(6, "0"),
        text: json.info.name,
        note: "",
        extraInfo: json.info.extra,
        terms: normalizeTerms(json.info.terms),
        termMode: normalizeTermMode(json.info.terms),
        reference: json.reference,
        activeDates: []
    };
    return result;
}

function parseJsonRoot(value: string | null): JsonRoot | null {
    if (!value) {
        return null;
    }

    try {
        const parsed = JSON.parse(value);
        if (!Array.isArray(parsed?.classes)) {
            return null;
        }

        return {
            name: typeof parsed.name === "string" ? parsed.name : DEFAULT_TIMETABLE_NAME,
            classes: parsed.classes as JsonData[]
        };
    } catch {
        return null;
    }
}

function getLocalRoot(): JsonRoot | null {
    if (typeof window === "undefined") {
        return null;
    }

    return parseJsonRoot(window.localStorage.getItem(LOCAL_STORAGE_KEY));
}

export async function loadJsonRoot(isAnonymous: boolean = false): Promise<JsonRoot> {
    const localRoot = getLocalRoot();
    if (localRoot) {
        return localRoot;
    }

    // Jeśli anonimowy, nie próbuj API
    if (isAnonymous) {
        const fallback: JsonRoot = {
            name: DEFAULT_TIMETABLE_NAME,
            classes: []
        };
        return fallback;
    }

    try {
        const response = await fetch(scheduleApiUrl('/semester/faculties'));
        if (!response.ok) {
            throw new Error(`Nie udalo sie wczytac danych planu zajec (HTTP ${response.status}).`);
        }

        const data = await response.json();
        const loaded = data?.WEEIA[105];

        const fromFile: JsonRoot = {
            name: typeof loaded?.name === "string" ? loaded.name : DEFAULT_TIMETABLE_NAME,
            classes: Array.isArray(loaded?.classes) ? loaded.classes : []
        };

        saveJsonRoot(fromFile);
        return fromFile;
    } catch (error) {
        console.error('Failed to load schedule data:', error);
        const fallback: JsonRoot = {
            name: DEFAULT_TIMETABLE_NAME,
            classes: []
        };
        return fallback;
    }
}

/**
 * Ładuje dane grupy - najpierw localStorage, jeśli nie ma to pobiera z API
 * @param groupId - ID grupy do pobrania
 * @param isAnonymous - jeśli true, tylko localStorage (bez API)
 * @returns JsonRoot z danymi grupy
 */
export async function loadJsonRootForGroup(groupId: string, isAnonymous: boolean = false): Promise<JsonRoot> {
    // 1. Sprawdzić localStorage
    const localRoot = getGroupDataFromStorage(groupId);
    if (localRoot) {
        return localRoot;
    }

    // 2. Jeśli anonimowy, zwróć pusty plan (nie ma dostępu do API)
    if (isAnonymous) {
        const fallback: JsonRoot = {
            name: `Grupa ${groupId}`,
            classes: []
        };
        return fallback;
    }

    // 3. Jeśli zalogowany i nie ma w localStorage, pobierz z API
    try {
        const response = await fetch(scheduleApiUrl('/semester/faculties'));
        if (!response.ok) {
            throw new Error(`Grupa ${groupId} nie znaleziona`);
        }

        const data = await response.json();
        const groupData = data?.WEEIA?.[Number(groupId)];

        if (!groupData) {
            throw new Error(`Grupa ${groupId} nie znaleziona`);
        }

        const fromApi: JsonRoot = {
            name: typeof groupData?.name === "string" ? groupData.name : `Grupa ${groupId}`,
            classes: Array.isArray(groupData?.classes) ? groupData.classes : []
        };

        // 4. Zapisz do localStorage dla przyszłości
        saveGroupDataToStorage(groupId, fromApi);
        return fromApi;
    } catch (error) {
        // Jeśli błąd, zwróć pusty plan
        const fallback: JsonRoot = {
            name: `Grupa ${groupId}`,
            classes: []
        };
        return fallback;
    }
}


export function saveJsonRoot(root: JsonRoot) {
    if (typeof window === "undefined") {
        return;
    }

    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(root));
}

export function clearSavedJsonRoot() {
    if (typeof window === "undefined") {
        return;
    }

    window.localStorage.removeItem(LOCAL_STORAGE_KEY);
}

export function saveBlocksAsJson(blocks: BlockData[], timetableName = DEFAULT_TIMETABLE_NAME) {
    const placedBlocks = blocks.filter(block => block.col >= 0 && block.row >= 0);

    const classes = placedBlocks.map((block) => {
        const normalizedColor = Number.parseInt(block.color.replace("#", ""), 16);
        const safeColor = Number.isNaN(normalizedColor) ? 0 : normalizedColor;
        const fallbackReference = `block-${block.id}`;

        return {
            info: {
                terms: [...block.terms, block.termMode],
                extra: block.extraInfo,
                name: block.text,
            },
            reference: block.reference || fallbackReference,
            color: safeColor,
            start: block.col + 8,
            length: block.hourSpan,
            day: block.row
        } satisfies JsonData;
    });

    saveJsonRoot({
        name: timetableName,
        classes
    });
}

/**
 * Zapisuje bloki jako JSON dla konkretnej grupy do localStorage
 * @param groupId - ID grupy
 * @param blocks - Bloki do zapisania
 * @param timetableName - Nazwa planu (opcjonalne)
 */
export function saveBlocksAsJsonForGroup(groupId: string, blocks: BlockData[], timetableName = DEFAULT_TIMETABLE_NAME) {
    const placedBlocks = blocks.filter(block => block.col >= 0 && block.row >= 0);

    const classes = placedBlocks.map((block) => {
        const normalizedColor = Number.parseInt(block.color.replace("#", ""), 16);
        const safeColor = Number.isNaN(normalizedColor) ? 0 : normalizedColor;
        const fallbackReference = `block-${block.id}`;

        return {
            info: {
                terms: [...block.terms, block.termMode],
                extra: block.extraInfo,
                name: block.text,
            },
            reference: block.reference || fallbackReference,
            color: safeColor,
            start: block.col + 8,
            length: block.hourSpan,
            day: block.row
        } satisfies JsonData;
    });

    saveGroupDataToStorage(groupId, {
        name: timetableName,
        classes
    });
}
