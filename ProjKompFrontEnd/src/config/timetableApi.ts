import { scheduleApiUrl } from "./scheduleApi";
import { JsonData } from "../utils/JsonUtils";

function getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem("token");
    if (!token) return {};
    return {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
    };
}

export async function fetchUserTimetable(): Promise<Record<string, JsonData>> {
    const response = await fetch(scheduleApiUrl('/timetable'), {
        headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
        throw new Error(`Failed to fetch user timetable: ${response.status}`);
    }
    
    return response.json();
}

export async function addClassToTimetable(classData: JsonData): Promise<void> {
    const response = await fetch(scheduleApiUrl('/timetable'), {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(classData)
    });
    
    if (!response.ok) {
        throw new Error(`Failed to add class: ${response.status}`);
    }
    // W specyfikacji jest 204, więc nie parsujemy JSONa
}

export async function updateClassInTimetable(id: string, classData: JsonData): Promise<void> {
    const response = await fetch(scheduleApiUrl(`/timetable/${id}`), {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(classData)
    });
    
    if (!response.ok) {
        throw new Error(`Failed to update class: ${response.status}`);
    }
}

export async function removeClassFromTimetable(id: string): Promise<void> {
    const response = await fetch(scheduleApiUrl(`/timetable/${id}`), {
        method: 'DELETE',
        headers: getAuthHeaders()
    });
    
    if (!response.ok) {
        throw new Error(`Failed to remove class: ${response.status}`);
    }
}

export async function clearUserTimetable(): Promise<void> {
    const response = await fetch(scheduleApiUrl('/timetable'), {
        method: 'DELETE',
        headers: getAuthHeaders()
    });
    
    if (!response.ok) {
        throw new Error(`Failed to clear timetable: ${response.status}`);
    }
}
