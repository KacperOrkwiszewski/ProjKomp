import { apiUrl } from "./api";
import { JsonData } from "../utils/JsonUtils";

export async function fetchUserTimetable(): Promise<Record<string, JsonData>> {
    const response = await fetch(apiUrl('/api/timetable'), {
        credentials: 'include',
    });
    
    if (!response.ok) {
        throw new Error(`Failed to fetch user timetable: ${response.status}`);
    }
    
    return response.json();
}

function toAscii(str: string): string {
    if (!str) return "";
    return str
        .replace(/ł/g, "l")
        .replace(/Ł/g, "L")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\x00-\x7F]/g, ""); // Strip any remaining non-ASCII chars
}

function sanitizeForBackend(classData: JsonData): any {
    return {
        ...classData,
        info: {
            ...classData.info,
            name: toAscii(classData.info.name).substring(0, 64),
            extra: toAscii(classData.info.extra).substring(0, 256),
            terms: classData.info.terms.filter(t => typeof t === 'number').sort((a, b) => (a as number) - (b as number)),
            lecture: false // Add required 'lecture' property for Rust backend
        }
    };
}

export async function addClassToTimetable(classData: JsonData): Promise<void> {
    const payload = sanitizeForBackend(classData);
    const response = await fetch(apiUrl('/api/timetable'), {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
        throw new Error(`Failed to add class: ${response.status}`);
    }
    // W specyfikacji jest 204, więc nie parsujemy JSONa
}

export async function updateClassInTimetable(id: string, classData: JsonData): Promise<void> {
    const payload = sanitizeForBackend(classData);
    const response = await fetch(apiUrl(`/api/timetable/${id}`), {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
        throw new Error(`Failed to update class: ${response.status}`);
    }
}

export async function removeClassFromTimetable(id: string): Promise<void> {
    const response = await fetch(apiUrl(`/api/timetable/${id}`), {
        method: 'DELETE',
        credentials: 'include',
    });
    
    if (!response.ok) {
        if (response.status === 404) {
            // Ignore 404 - the class is already removed or didn't exist
            return;
        }
        throw new Error(`Failed to remove class: ${response.status}`);
    }
}

export async function clearUserTimetable(): Promise<void> {
    const response = await fetch(apiUrl('/api/timetable'), {
        method: 'DELETE',
        credentials: 'include',
    });
    
    if (!response.ok) {
        throw new Error(`Failed to clear timetable: ${response.status}`);
    }
}
