import { useEffect, useRef, useState } from "react";
import { GridProps } from "../utils/TimeGridUtils";
import { jsonToBlockData, loadJsonRootForGroup } from "../utils/JsonUtils";
import { refreshScheduledBlocks, validateTermsData, ScheduledBlockData } from "../utils/ScheduleDataUtils";

type ScheduleDataState = {
  timetableName: string;
  classes: ScheduledBlockData[];
  terms: string[];
  isLoading: boolean;
  error: string | null;
};

const INITIAL_STATE: ScheduleDataState = {
  timetableName: "Lokalny plan",
  classes: [],
  terms: [],
  isLoading: true,
  error: null,
};

export function useScheduleData(groupId: string | null, gridProps: GridProps) {
  const [state, setState] = useState<ScheduleDataState>(INITIAL_STATE);
  const initialGridPropsRef = useRef(gridProps);

  useEffect(() => {
    if (!groupId) {
      setState({
        timetableName: INITIAL_STATE.timetableName,
        classes: [],
        terms: [],
        isLoading: false,
        error: null,
      });
      return;
    }

    let cancelled = false;

    async function loadScheduleData() {
      try {
        const [jsonRootResponse, termsResponse] = await Promise.all([
          loadJsonRootForGroup(groupId),
          fetch("/terms.json"),
        ]);

        if (!termsResponse.ok) {
          throw new Error(`Nie udalo sie wczytac terms.json (HTTP ${termsResponse.status}).`);
        }

        const rawTerms = await termsResponse.json();
        const terms = validateTermsData(rawTerms);
        const classes = refreshScheduledBlocks(
          jsonRootResponse.classes.map((jsonItem, index) => ({
            ...jsonToBlockData(jsonItem, initialGridPropsRef.current),
            id: index,
          })),
          terms,
        );

        if (cancelled) {
          return;
        }

        setState({
          timetableName: jsonRootResponse.name,
          classes,
          terms,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        if (cancelled) {
          return;
        }

        const message = error instanceof Error ? error.message : "Nie udalo sie wczytac danych planu zajec.";
        console.error(message);
        setState({
          timetableName: INITIAL_STATE.timetableName,
          classes: [],
          terms: [],
          isLoading: false,
          error: message,
        });
      }
    }

    loadScheduleData();

    return () => {
      cancelled = true;
    };
  }, [groupId]);

  return state;
}