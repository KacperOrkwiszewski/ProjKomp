import { useEffect, useRef, useState } from "react";
import { GridProps } from "../utils/TimeGridUtils";
import { loadJsonRootForGroup, jsonToBlockData } from "../utils/JsonUtils";
import { validateTermsData, mergeGroupSchedules } from "../utils/ScheduleDataUtils";

type ScheduleDataState = {
  timetableName: string;
  classes: any[];
  terms: string[];
  isLoading: boolean;
  error: string | null;
};

const INITIAL_STATE: ScheduleDataState = {
  timetableName: "Scalony plan",
  classes: [],
  terms: [],
  isLoading: false,
  error: null,
};

export function useMultiGroupScheduleData(groupIds: string[], gridProps: GridProps) {
  const [state, setState] = useState<ScheduleDataState>(INITIAL_STATE);
  const initialGridPropsRef = useRef(gridProps);

  useEffect(() => {
    if (!groupIds || groupIds.length === 0) {
      setState({ ...INITIAL_STATE });
      return;
    }

    let cancelled = false;

    async function loadAll() {
      try {
        const termsResponse = await fetch("/terms.json");
        if (!termsResponse.ok) {
          throw new Error(`Nie udalo sie wczytac terms.json (HTTP ${termsResponse.status}).`);
        }
        const rawTerms = await termsResponse.json();
        const terms = validateTermsData(rawTerms);

        const loads = await Promise.all(groupIds.map((groupId) => loadJsonRootForGroup(groupId)));

        const groups = loads.map((jsonRoot, index) => ({
          groupId: groupIds[index],
          blocks: (jsonRoot.classes || []).map((j: any, idx: number) => ({ ...jsonToBlockData(j, initialGridPropsRef.current), id: idx })),
          name: jsonRoot.name ?? `Grupa ${groupIds[index]}`,
        }));

        if (cancelled) return;

        const merged = mergeGroupSchedules(groups.map((g) => ({ groupId: g.groupId, blocks: g.blocks })), terms);
        const timetableName = groups.map((g) => g.name).join(", ");

        setState({ timetableName, classes: merged, terms, isLoading: false, error: null });
      } catch (error) {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : "Nie udalo sie wczytac danych kilku grup.";
        console.error(message);
        setState({ ...INITIAL_STATE, isLoading: false, error: message });
      }
    }

    setState((s) => ({ ...s, isLoading: true }));
    loadAll();

    return () => {
      cancelled = true;
    };
  }, [JSON.stringify(groupIds || []), gridProps]);

  return state;
}
