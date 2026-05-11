import { JsonRoot } from "./JsonUtils";

const STORAGE_PREFIX = "projkomp";
const TIMETABLE_KEY = (groupId: string) => `${STORAGE_PREFIX}.timetable.json.${groupId}`;
const ACTIVE_GROUP_KEY = `${STORAGE_PREFIX}.active_group_id`;
const SELECTED_GROUPS_KEY = `${STORAGE_PREFIX}.selected_group_ids`;

/**
 * Pobiera dane grupy z localStorage
 */
export function getGroupDataFromStorage(groupId: string): JsonRoot | null {
    if (typeof window === "undefined") {
        return null;
    }

    const key = TIMETABLE_KEY(groupId);
    const stored = window.localStorage.getItem(key);

    if (!stored) {
        return null;
    }

    try {
        const parsed = JSON.parse(stored);
        if (!Array.isArray(parsed?.classes)) {
            return null;
        }

        return {
            name: typeof parsed.name === "string" ? parsed.name : `Grupa ${groupId}`,
            classes: parsed.classes,
        };
    } catch {
        return null;
    }
}

/**
 * Zapisuje dane grupy do localStorage
 */
export function saveGroupDataToStorage(groupId: string, data: JsonRoot) {
    if (typeof window === "undefined") {
        return;
    }

    const key = TIMETABLE_KEY(groupId);
    window.localStorage.setItem(key, JSON.stringify(data));
}

/**
 * Usuwa dane grupy z localStorage
 */
export function removeGroupDataFromStorage(groupId: string) {
    if (typeof window === "undefined") {
        return;
    }

    const key = TIMETABLE_KEY(groupId);
    window.localStorage.removeItem(key);
}

/**
 * Pobiera ID aktualnie aktywnej grupy
 */
export function getActiveGroupId(): string | null {
    if (typeof window === "undefined") {
        return null;
    }

    return window.localStorage.getItem(ACTIVE_GROUP_KEY);
}

/**
 * Ustawia aktywną grupę
 */
export function setActiveGroupId(groupId: string) {
    if (typeof window === "undefined") {
        return;
    }

    window.localStorage.setItem(ACTIVE_GROUP_KEY, groupId);
}

/**
 * Pobiera listę ID grup wybranych przez użytkownika
 */
export function getSelectedGroupIds(): string[] {
    if (typeof window === "undefined") {
        return [];
    }

    const stored = window.localStorage.getItem(SELECTED_GROUPS_KEY);

    if (!stored) {
        return [];
    }

    try {
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

/**
 * Ustawia listę wybranych grup
 */
export function setSelectedGroupIds(groupIds: string[]) {
    if (typeof window === "undefined") {
        return;
    }

    window.localStorage.setItem(SELECTED_GROUPS_KEY, JSON.stringify(groupIds));
}

/**
 * Dodaje grupę do listy wybranych
 */
export function addGroupToSelection(groupId: string) {
    const current = getSelectedGroupIds();
    if (!current.includes(groupId)) {
        setSelectedGroupIds([...current, groupId]);
    }
}

/**
 * Usuwa grupę z listy wybranych
 */
export function removeGroupFromSelection(groupId: string) {
    const current = getSelectedGroupIds();
    const filtered = current.filter(id => id !== groupId);
    setSelectedGroupIds(filtered);
}

/**
 * Czyści wszystkie dane grupy z localStorage i listy wybranych
 */
export function clearGroupData(groupId: string) {
    removeGroupDataFromStorage(groupId);
    removeGroupFromSelection(groupId);

    // Jeśli to była aktywna grupa, wyczyść
    if (getActiveGroupId() === groupId) {
        if (typeof window !== "undefined") {
            window.localStorage.removeItem(ACTIVE_GROUP_KEY);
        }
    }
}
