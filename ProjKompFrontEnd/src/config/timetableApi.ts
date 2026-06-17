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

export async function addClassToTimetable(classData: JsonData): Promise<void> {
    const response = await fetch(apiUrl('/api/timetable'), {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(classData)
    });
    
    if (!response.ok) {
        throw new Error(`Failed to add class: ${response.status}`);
    }
    // W specyfikacji jest 204, więc nie parsujemy JSONa
}

export async function updateClassInTimetable(id: string, classData: JsonData): Promise<void> {
    const response = await fetch(apiUrl(`/api/timetable/${id}`), {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(classData)
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
