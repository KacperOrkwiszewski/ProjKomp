import { BlockData } from "./ClassBlockUtils";
import { fetchUserTimetable, addClassToTimetable, updateClassInTimetable, removeClassFromTimetable } from "../config/timetableApi";
import { JsonData } from "./JsonUtils";

function blockToJsonData(block: BlockData): JsonData {
    const normalizedColor = Number.parseInt(block.color.replace("#", ""), 16);
    const safeColor = Number.isNaN(normalizedColor) ? 0 : normalizedColor;

    return {
        info: {
            terms: [...block.terms, block.termMode],
            extra: block.extraInfo,
            name: block.text,
        },
        reference: block.reference || `block-${block.id}`,
        color: safeColor,
        start: block.col + 8,
        length: block.hourSpan,
        day: block.row
    } satisfies JsonData;
}

function isEqual(a: JsonData, b: JsonData): boolean {
    return a.color === b.color &&
           a.start === b.start &&
           a.length === b.length &&
           a.day === b.day &&
           a.info.name === b.info.name &&
           a.info.extra === b.info.extra &&
           JSON.stringify(a.info.terms) === JSON.stringify(b.info.terms);
}

export async function syncTimetableWithServer(blocks: BlockData[]): Promise<boolean> {
    const placedBlocks = blocks.filter(b => b.col >= 0 && b.row >= 0);
    const newClasses = placedBlocks.map(blockToJsonData);

    try {
        const currentServerState = await fetchUserTimetable();
        const serverUuids = new Set(Object.keys(currentServerState));
        const serverReferences = new Map<string, string>();

        for (const [uuid, serverClass] of Object.entries(currentServerState)) {
            if (serverClass.reference) {
                serverReferences.set(serverClass.reference, uuid);
            }
        }

        let stateChangedOnServer = false;

        // 1. Zaktualizuj lub dodaj nowe klasy
        for (const newClass of newClasses) {
            const ref = newClass.reference;
            if (ref && serverUuids.has(ref)) {
                // Klasa istnieje na serwerze (ref to uuid) - zróbmy diff
                const serverClass = currentServerState[ref];
                if (!isEqual(newClass, serverClass)) {
                    await updateClassInTimetable(ref, newClass);
                }
                serverUuids.delete(ref);
            } else if (ref && serverReferences.has(ref)) {
                // Klasa istnieje na serwerze (ref to np. WEEIA) - aktualizujemy używając uuid
                const uuid = serverReferences.get(ref)!;
                const serverClass = currentServerState[uuid];
                if (!isEqual(newClass, serverClass)) {
                    await updateClassInTimetable(uuid, newClass);
                }
                serverUuids.delete(uuid);
            } else {
                // Klasa nie istnieje na serwerze - została dodana lokalnie
                // (lub ma lokalną referencję typu 'block-123')
                await addClassToTimetable(newClass);
                stateChangedOnServer = true;
            }
        }

        // 2. Usuń klasy, które zniknęły
        for (const uuid of serverUuids) {
            await removeClassFromTimetable(uuid);
        }

        return stateChangedOnServer; // Jeśli true, to prawdopodobnie trzeba odświeżyć lokalny stan, by pobrać nowe UUID.
    } catch (error) {
        console.error("Failed to sync timetable with server:", error);
        return false;
    }
}
