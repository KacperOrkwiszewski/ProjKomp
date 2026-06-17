import { useEffect, useRef, useState } from "react";
import { GridProps } from "../utils/TimeGridUtils";
import { jsonToBlockData, loadJsonRootForGroup } from "../utils/JsonUtils";
import { refreshScheduledBlocks, validateTermsData, ScheduledBlockData } from "../utils/ScheduleDataUtils";
import { useAuth } from "../auth/AuthContext";

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
  const { isAuthenticated } = useAuth();
  const isAnonymous = !isAuthenticated;

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
        let jsonRootResponse;
        let termsResponse;

        if (!isAnonymous) {
          try {
            const { fetchUserTimetable } = await import("../config/timetableApi");
            const userTimetable = await fetchUserTimetable();
            const classesArray = Object.entries(userTimetable).map(([uuid, classData]) => ({
              ...classData,
              reference: uuid
            }));
            
            jsonRootResponse = {
              name: "Twój plan",
              classes: classesArray
            };
            termsResponse = await fetch("/terms.json");
          } catch (err) {
            console.error("Failed to load user customized plan, falling back to group", err);
            [jsonRootResponse, termsResponse] = await Promise.all([
              loadJsonRootForGroup(groupId!, isAnonymous),
              fetch("/terms.json"),
            ]);
          }
        } else {
          [jsonRootResponse, termsResponse] = await Promise.all([
            loadJsonRootForGroup(groupId!, isAnonymous),
            fetch("/terms.json"),
          ]);
        }

        if (!termsResponse.ok) {
          throw new Error(`Nie udalo sie wczytac terms.json (HTTP ${termsResponse.status}).`);
        }

        const rawTerms = await termsResponse.json();
        const terms = validateTermsData(rawTerms);
        const classes = refreshScheduledBlocks(
          jsonRootResponse.classes.map((jsonItem: any, index: number) => ({
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
  }, [groupId, isAnonymous]);

  return state;
}