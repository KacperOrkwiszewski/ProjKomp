import React, { useEffect, useMemo, useRef, useState } from "react";
import TimetableGrid from "./TimetableGrid";
import ClassBlock from "./ClassBlock";
import GroupSelector from "./GroupSelector";
import { BlockData, getGridSnappedPosition, updateBlockPosition, removeBlock, recalculateBlockPostions, recalculateBlockSubrows, sortBlocksByPlacement } from "../utils/ClassBlockUtils";
import { recalculateOccupiedCells, GridProps, isBinArea, getCellIndex, getCellPosition, getRowHeightsFromOccupiedCells } from "../utils/TimeGridUtils";
import { clearSavedJsonRoot, saveBlocksAsJson, saveBlocksAsJsonForGroup } from "../utils/JsonUtils";
import { getNewBlockPosition, SpawnNewBlock } from "../utils/NewBlockUtils";
import { isNewBlockPresent } from "../utils/NewBlockUtils";
import EditBar from "./EditBar";
import { buildCurrentGridProps } from "../utils/TimetableLayoutUtils";
import { getWeekDateStrings, getWeekRangeString, getPreviousWeek, getNextWeek, getTodayDate } from "../utils/CalendarUtils";
import { scheduleApiUrl } from "../config/scheduleApi";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { InputSwitch } from "primereact/inputswitch";
import { ThemeMode } from "../utils/ThemeUtils";
import { AnimatePresence, motion } from "framer-motion";
import { 
  blockItemVariants, 
  blockListVariants, 
  springTransition,
  layoutTransitionConfig,
  rightPanelVariants,
  binPanelVariants,
  PANEL_ANIMATE_PRESENCE_MODE,
  LIST_ANIMATE_PRESENCE_MODE,
} from "../utils/MotionUtils";
import { useScheduleData } from "../hooks/useScheduleData";
import { useMultiGroupScheduleData } from "../hooks/useMultiGroupScheduleData";
import { filterClassesForWeek, mapClassesToWeekDisplayRows, refreshScheduledBlocks, buildActiveDates } from "../utils/ScheduleDataUtils";
import { generatePdf } from "../utils/ExportUtils";
import { getSelectedGroupIds, setSelectedGroupIds, getActiveGroupId, setActiveGroupId } from "../utils/GroupManager";
import { cloneBlockData } from "../utils/EditBarUtils";
import footerLogo from "../assets/logo-pl.png";
import robotImage from "../assets/robot.png";
import type { GroupInfo } from "./GroupSelector";

type TimetableProps = {
  gridProps: GridProps;
    theme: ThemeMode;
  onEditBarVisibilityChange?: (isVisible: boolean) => void;
  //todo: add initial blocks data as prop
};

const areNumberArraysEqual = (left: number[], right: number[]) => {
    if (left.length !== right.length) {
        return false;
    }

    for (let index = 0; index < left.length; index += 1) {
        if (left[index] !== right[index]) {
            return false;
        }
    }

    return true;
};

const areBlocksLayoutEqual = (left: BlockData[], right: BlockData[]) => {
    if (left.length !== right.length) {
        return false;
    }

    for (let index = 0; index < left.length; index += 1) {
        const previous = left[index];
        const next = right[index];

        if (
            previous.id !== next.id ||
            previous.row !== next.row ||
            previous.col !== next.col ||
            previous.subrow !== next.subrow ||
            previous.x !== next.x ||
            previous.y !== next.y
        ) {
            return false;
        }
    }

    return true;
};

const areStringArraysEqual = (left: string[], right: string[]) => {
    if (left.length !== right.length) {
        return false;
    }

    for (let index = 0; index < left.length; index += 1) {
        if (left[index] !== right[index]) {
            return false;
        }
    }

    return true;
};

const areBlocksDataEqual = (left: BlockData[], right: BlockData[]) => {
    if (left.length !== right.length) {
        return false;
    }

    for (let index = 0; index < left.length; index += 1) {
        const previous = left[index];
        const next = right[index];

        if (
            previous.id !== next.id ||
            previous.col !== next.col ||
            previous.row !== next.row ||
            previous.subrow !== next.subrow ||
            previous.x !== next.x ||
            previous.y !== next.y ||
            previous.hourSpan !== next.hourSpan ||
            previous.color !== next.color ||
            previous.text !== next.text ||
            previous.note !== next.note ||
            previous.extraInfo !== next.extraInfo ||
            previous.reference !== next.reference ||
            previous.termMode !== next.termMode ||
            !areNumberArraysEqual(previous.terms, next.terms) ||
            !areStringArraysEqual(previous.activeDates, next.activeDates)
        ) {
            return false;
        }
    }

    return true;
};

const cloneBlocksSnapshot = (blocks: BlockData[]) => blocks.map((block) => cloneBlockData(block)).filter((block): block is BlockData => block !== null);

type HistoryStacks = {
    past: BlockData[][];
    future: BlockData[][];
};

const Timetable: React.FC<TimetableProps> = ({ gridProps, theme, onEditBarVisibilityChange }) => {
    const { rows, cols, gridHeight, gridWidth } = gridProps;
    const cellSize = { x: gridWidth / cols, y: gridHeight / rows };
    const [rowHeights, setRowHeights] = useState(Array(rows).fill(1));
    const [blocksData, setBlocksData] = useState<BlockData[]>([]);
    const [occupiedCells, setOccupiedCells] = useState<number[]>(Array(rows * cols).fill(0));
    const [selectedBlockId, setSelectedBlockId] = useState<number | null>(null);
    const [currentDate, setCurrentDate] = useState<Date>(getTodayDate());
    const originalBlocksRef = useRef<BlockData[]>([]);
    const toast = useRef<Toast>(null);

    //bin
    const [isDragOverBin, setIsDragOverBin] = useState(false);
    const binRef = useRef<HTMLDivElement | null>(null);

    function remToPx(rem: number) {
        return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
    }

    const handleBinDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragOverBin(true);
      };
    
      const handleBinDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
        if (event.target === binRef.current) {
          setIsDragOverBin(false);
        }
      };
    
      const handleBinDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragOverBin(false);
      };

    // Grupy - state
    const [selectedGroups, setSelectedGroupsState] = useState<GroupInfo[]>([]);
    const [activeGroupId, setActiveGroupIdState] = useState<string | null>(null);
    const [showGroupSelector, setShowGroupSelector] = useState(false);
    const selectedGroupIds = useMemo(() => selectedGroups.map((group) => group.id), [selectedGroups]);

    const selectedBlock = blocksData.find(b => b.id === selectedBlockId);
    const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(true);
    const [editingSubject, setEditingSubject] = useState<string | null>(null);
    const [isEditModeEnabled, setIsEditModeEnabled] = useState(false);
    const boardRef = useRef<HTMLDivElement | null>(null);
    const blocksDataRef = useRef<BlockData[]>([]);
    const historyStacksRef = useRef<Map<string, HistoryStacks>>(new Map());
    const [, setHistoryVersion] = useState(0);
    const [boardContentWidth, setBoardContentWidth] = useState(gridWidth + remToPx(5));
    const responsiveGridWidth = Math.max(1, boardContentWidth - remToPx(5));
    const singleSchedule = useScheduleData(activeGroupId, gridProps);
    const multiSchedule = useMultiGroupScheduleData(selectedGroupIds, gridProps);

    const usedSchedule = (!isEditModeEnabled && selectedGroupIds.length > 1) ? multiSchedule : singleSchedule;
    const { classes: scheduleClasses, terms: scheduleTerms, isLoading: scheduleIsLoading, error: scheduleError } = usedSchedule;
    const historyGroupKey = activeGroupId ?? "__default__";
    const currentHistory = historyStacksRef.current.get(historyGroupKey);
    const canUndo = (currentHistory?.past.length ?? 0) > 0;
    const canRedo = (currentHistory?.future.length ?? 0) > 0;

    const getHistoryStacks = (groupKey: string) => {
        let stacks = historyStacksRef.current.get(groupKey);

        if (!stacks) {
            stacks = {
                past: [],
                future: [],
            };
            historyStacksRef.current.set(groupKey, stacks);
        }

        return stacks;
    };

    const bumpHistoryVersion = () => {
        setHistoryVersion((previous) => previous + 1);
    };

    // Załaduj grupy z localStorage przy mount
    useEffect(() => {
        const selectedIds = getSelectedGroupIds();
        const activeId = getActiveGroupId();

        const loadSelectedGroupNames = async () => {
            if (selectedIds.length === 0) {
                setSelectedGroupsState([]);
                setActiveGroupIdState(null);
                return;
            }

            try {
                const response = await fetch(scheduleApiUrl('/semester/faculties'));
                if (!response.ok) {
                    throw new Error(`Nie udało się pobrać grup (HTTP ${response.status})`);
                }

                const data = await response.json();
                const weeiaGroups = data?.WEEIA ?? {};

                const resolvedGroups = selectedIds.map((groupId) => {
                    const groupData = weeiaGroups?.[Number(groupId)];
                    return {
                        id: groupId,
                        name: typeof groupData?.name === "string" ? groupData.name : `Grupa ${groupId}`,
                    };
                });

                setSelectedGroupsState(resolvedGroups);

                if (activeId && selectedIds.includes(activeId)) {
                    setActiveGroupIdState(activeId);
                } else {
                    setActiveGroupIdState(selectedIds[0] ?? null);
                }
            } catch {
                const fallbackGroups = selectedIds.map((groupId) => ({
                    id: groupId,
                    name: `Grupa ${groupId}`,
                }));

                setSelectedGroupsState(fallbackGroups);
                if (activeId && selectedIds.includes(activeId)) {
                    setActiveGroupIdState(activeId);
                } else {
                    setActiveGroupIdState(selectedIds[0] ?? null);
                }
            }
        };

        loadSelectedGroupNames();
    }, []);
    
    // PDF export dialog state
    const [showPdfDialog, setShowPdfDialog] = useState(false);
    const [pdfSource, setPdfSource] = useState<"week" | "edit">("week");
    const [pdfCaption, setPdfCaption] = useState("Plan zajęć");
    const [pdfDarkMode, setPdfDarkMode] = useState(false);
    const [pdfFullWeek, setPdfFullWeek] = useState(false);
    const weekDates = useMemo(() => getWeekDateStrings(currentDate), [currentDate]);
    const dayLabels = useMemo(() => weekDates.map((dateString) => {
        const exactIndex = scheduleTerms.indexOf(dateString);
        if (exactIndex === -1) {
            return null;
        }

        const termNumber = Math.floor(exactIndex / 5) + 1;
        return {
            label: "Termin",
            termNumber: String(termNumber),
        };
    }), [scheduleTerms, weekDates]);
    const currentGridProps = useMemo(() => buildCurrentGridProps(gridProps, rowHeights), [gridProps, rowHeights]);
    const responsiveGridProps = useMemo(() => ({
        ...currentGridProps,
        StartPoint:{
            x:  5 * parseFloat(getComputedStyle(document.documentElement).fontSize),
            y: currentGridProps.StartPoint.y
        },
        gridWidth: responsiveGridWidth,
        Bin: {
            ...currentGridProps.Bin,
            StartPoint: {
                x: responsiveGridWidth/5,

                y: rowHeights.reduce((sum, h) => sum + h, 0) *cellSize.y + cellSize.y + remToPx(2),
            },
        },
    }), [currentGridProps, responsiveGridWidth]);
    const weekDisplayBlocks = useMemo(() => {
        const weekFilteredBlocks = filterClassesForWeek(blocksData, weekDates);
        return mapClassesToWeekDisplayRows(weekFilteredBlocks, weekDates);
    }, [blocksData, weekDates]);

    const weekViewPlacedBlocks = useMemo(
        () => recalculateBlockSubrows(sortBlocksByPlacement(weekDisplayBlocks)),
        [weekDisplayBlocks],
    );

    const editModePlacedBlocks = useMemo(
        () => recalculateBlockSubrows(sortBlocksByPlacement(blocksData.filter((block) => block.col >= 0 && block.row >= 0))),
        [blocksData],
    );

    const blocksForLayout = isEditModeEnabled ? editModePlacedBlocks : weekViewPlacedBlocks;

    const positionedBlocks = useMemo(() => blocksForLayout.map((block) => {
        const position = getCellPosition(block.row, block.col, responsiveGridProps);
        return {
            ...block,
            x: position.x,
            y: position.y + (block.subrow * responsiveGridProps.gridHeight / responsiveGridProps.rows),
        };
    }), [blocksForLayout, responsiveGridProps]);

    const visibleBlocks = useMemo(() => {
        const newBlocks = blocksData.filter((block) => block.col === -1 && block.row === -1);

        if (!isEditModeEnabled) {
            return positionedBlocks;
        }

        return [...positionedBlocks, ...newBlocks];
    }, [blocksData, isEditModeEnabled, positionedBlocks]);

    useEffect(() => {
        onEditBarVisibilityChange?.(selectedBlockId !== null);
    }, [onEditBarVisibilityChange, selectedBlockId]);

    useEffect(() => {
        if (!isEditModeEnabled) {
            setSelectedBlockId(null);
            setEditingSubject(null);
        }
    }, [isEditModeEnabled]);

    useEffect(() => {
        if (selectedBlockId === null) {
            return;
        }

        const handleOutsideClick = (event: MouseEvent) => {
            const target = event.target as HTMLElement | null;
            if (!target) {
                return;
            }

            if (
                target.closest(".tt-right-panel") ||
                target.closest(".tt-class-block") ||
                target.closest(".p-colorpicker-panel") ||
                target.closest(".p-connected-overlay")
            ) {
                return;
            }

            setSelectedBlockId(null);
        };

        document.addEventListener("mousedown", handleOutsideClick);

        return () => document.removeEventListener("mousedown", handleOutsideClick);
    }, [selectedBlockId]);

    useEffect(() => {
        const nextRowHeights = getRowHeightsFromOccupiedCells(occupiedCells, rows, cols);
        setRowHeights((previousRowHeights) => (
            areNumberArraysEqual(previousRowHeights, nextRowHeights) ? previousRowHeights : nextRowHeights
        ));
    }, [occupiedCells, rows, cols]);

    useEffect(() => {
        const nextOccupiedCells = recalculateOccupiedCells(blocksForLayout, responsiveGridProps);
        setOccupiedCells((previousOccupiedCells) => (
            areNumberArraysEqual(previousOccupiedCells, nextOccupiedCells) ? previousOccupiedCells : nextOccupiedCells
        ));
    }, [blocksForLayout, responsiveGridProps]);

    useEffect(() => {
        blocksDataRef.current = blocksData;
    }, [blocksData]);

    useEffect(() => {
        const element = boardRef.current;
        if (!element) {
            return;
        }

        const updateBoardWidth = () => {
            setBoardContentWidth((previousWidth) => {
                const nextWidth = Math.max(1, element.clientWidth);
                return nextWidth === previousWidth ? previousWidth : nextWidth;
            });
        };

        updateBoardWidth();

        if (typeof ResizeObserver === "undefined") {
            window.addEventListener("resize", updateBoardWidth);
            return () => window.removeEventListener("resize", updateBoardWidth);
        }

        const observer = new ResizeObserver(updateBoardWidth);
        observer.observe(element);

        return () => observer.disconnect();
    }, [gridWidth]);

    useEffect(() => {
        setBlocksData((previousBlocks) => {
            const nextBlocks = recalculateBlockPostions(
                recalculateBlockSubrows(sortBlocksByPlacement(previousBlocks)),
                responsiveGridProps,
            );

            return areBlocksLayoutEqual(previousBlocks, nextBlocks) ? previousBlocks : nextBlocks;
        });
    }, [responsiveGridProps]);

    useEffect(() => {
        if (scheduleIsLoading) {
            return;
        }

        if (scheduleError) {
            applyBlocksState([], { persist: false, recordHistory: false });
            return;
        }

        const blocksWithBin = SpawnNewBlock(refreshScheduledBlocks(scheduleClasses, scheduleTerms), responsiveGridProps.Bin);
        if (originalBlocksRef.current.length === 0) {
            originalBlocksRef.current = blocksWithBin;
        }
        applyBlocksState(blocksWithBin, { persist: false, recordHistory: false });
    }, [scheduleIsLoading, scheduleClasses, scheduleTerms, scheduleError]);

    const applyBlocksState = (nextBlocks: BlockData[], options?: { persist?: boolean; recordHistory?: boolean }) => {
        const persist = options?.persist ?? true;
        const recordHistory = options?.recordHistory ?? true;
        const sortedBlocks = sortBlocksByPlacement(nextBlocks);

        if (recordHistory && !areBlocksDataEqual(blocksDataRef.current, sortedBlocks)) {
            const history = getHistoryStacks(historyGroupKey);
            history.past.push(cloneBlocksSnapshot(blocksDataRef.current));
            history.future = [];
            bumpHistoryVersion();
        }

        setBlocksData(sortedBlocks);

        if (selectedBlockId !== null && !sortedBlocks.some((block) => block.id === selectedBlockId)) {
            setSelectedBlockId(null);
        }

        if (persist) {
            // Jeśli bloki posiadają pole sourceGroupId, zapisz osobno dla każdej grupy
            const groupsMap = new Map<string, BlockData[]>();
            for (const b of sortedBlocks) {
                if (b.sourceGroupId) {
                    const arr = groupsMap.get(b.sourceGroupId) ?? [];
                    arr.push(b);
                    groupsMap.set(b.sourceGroupId, arr);
                }
            }

            if (groupsMap.size > 0) {
                groupsMap.forEach((blocks, groupId) => saveBlocksAsJsonForGroup(groupId, blocks));
            } else {
                // Fallback: save for activeGroup or global
                if (activeGroupId) {
                    saveBlocksAsJsonForGroup(activeGroupId, sortedBlocks);
                } else {
                    saveBlocksAsJson(sortedBlocks);
                }
            }
        }

        return sortedBlocks;
    };

    const handleEditBlock = (updatedBlock: BlockData, options?: { silent?: boolean }) => {
        const currentBlocks = blocksDataRef.current;
        
        // Recalculate activeDates when terms change so week view reflects edits
            const blockWithUpdatedDates = {
                ...updatedBlock,
            activeDates: buildActiveDates(updatedBlock.terms, updatedBlock.row, scheduleTerms),
            };
        
        const nextBlocks = sortBlocksByPlacement(
            currentBlocks.map(b => (b.id === blockWithUpdatedDates.id ? blockWithUpdatedDates : b))
        );

        applyBlocksState(nextBlocks);

        if (!options?.silent) {
            toast.current?.show({
                severity: "success",
                summary: "Zapisano",
                detail: `Zaktualizowano blok: ${blockWithUpdatedDates.text}`,
                life: 1400,
            });
        }
    };

    const deleteBlockById = (blockId: number) => {
        let nextBlocks = removeBlock(blocksDataRef.current, blockId);
        if (!isNewBlockPresent(nextBlocks)) {
            nextBlocks = SpawnNewBlock(nextBlocks, responsiveGridProps.Bin);
        }

        applyBlocksState(nextBlocks);
        setSelectedBlockId(null);

        toast.current?.show({
            severity: "warn",
            summary: "Usunieto blok",
            detail: `Blok #${blockId} zostal usuniety.`,
            life: 1500,
        });
    };

    const handleDeleteRequest = (blockId: number) => {
        confirmDialog({
            message: "Czy na pewno chcesz usunac ten blok?",
            header: "Potwierdz usuniecie",
            icon: "pi pi-exclamation-triangle",
            acceptClassName: "p-button-danger",
            accept: () => deleteBlockById(blockId),
        });
    };

    const handlePreviousWeek = () => {
        setCurrentDate((previous) => getPreviousWeek(previous));
    };

    const handleNextWeek = () => {
        setCurrentDate((previous) => getNextWeek(previous));
    };

    const handleReloadData = () => {
        clearSavedJsonRoot();
        window.location.reload();
    };
    const handleUndo= () => {
        const history = getHistoryStacks(historyGroupKey);
        const previousState = history.past.pop();

        if (!previousState) {
            toast.current?.show({
                severity: "info",
                summary: "Brak zmian",
                detail: "Nie ma czego cofnąć.",
                life: 1200,
            });
            return;
        }

        history.future.push(cloneBlocksSnapshot(blocksDataRef.current));
        bumpHistoryVersion();
        applyBlocksState(previousState, { recordHistory: false });

        toast.current?.show({
            severity: "info",
            summary: "Cofnięto zmianę",
            detail: "Przywrócono poprzedni stan planu.",
            life: 1200,
        });
    };
    const handleRedo= () => {
        const history = getHistoryStacks(historyGroupKey);
        const nextState = history.future.pop();

        if (!nextState) {
            toast.current?.show({
                severity: "info",
                summary: "Brak zmian",
                detail: "Nie ma czego przywrócić.",
                life: 1200,
            });
            return;
        }

        history.past.push(cloneBlocksSnapshot(blocksDataRef.current));
        bumpHistoryVersion();
        applyBlocksState(nextState, { recordHistory: false });

        toast.current?.show({
            severity: "info",
            summary: "Przywrócono zmianę",
            detail: "Wrócono do kolejnego stanu planu.",
            life: 1200,
        });
    };

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (!isEditModeEnabled) {
                return;
            }

            const target = event.target as HTMLElement | null;
            const isEditableField = Boolean(
                target && (
                    target.closest("input") ||
                    target.closest("textarea") ||
                    target.isContentEditable
                )
            );

            if (isEditableField) {
                return;
            }

            const key = event.key.toLowerCase();

            if (key === "delete") {
                if (selectedBlockId === null) {
                    return;
                }

                event.preventDefault();
                handleDeleteRequest(selectedBlockId);
                return;
            }

            if (!event.ctrlKey && !event.metaKey) {
                return;
            }

            if (key === "z") {
                event.preventDefault();
                handleUndo();
                return;
            }

            if (key === "y") {
                event.preventDefault();
                handleRedo();
                return;
            }
        };

        document.addEventListener("keydown", handleKeyDown);

        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [handleDeleteRequest, handleRedo, handleUndo, isEditModeEnabled, selectedBlockId]);

    // Handlery dla grup
    const handleAddGroups = (newGroups: GroupInfo[]) => {
        const updated = Array.from(new Set([...selectedGroups.map((group) => group.id), ...newGroups.map((group) => group.id)]))
            .map((groupId) => {
                const existing = selectedGroups.find((group) => group.id === groupId);
                if (existing) {
                    return existing;
                }

                const incoming = newGroups.find((group) => group.id === groupId);
                return incoming ?? { id: groupId, name: `Grupa ${groupId}` };
            });

        setSelectedGroupsState(updated);
        setSelectedGroupIds(updated.map((group) => group.id));

        // Ustaw pierwszą nową grupę jako aktywną
        if (newGroups.length > 0 && !activeGroupId) {
            setActiveGroupIdState(newGroups[0].id);
            setActiveGroupId(newGroups[0].id);
        }
    };

    const handleRemoveGroup = (groupId: string) => {
        const updated = selectedGroups.filter(group => group.id !== groupId);
        setSelectedGroupsState(updated);
        setSelectedGroupIds(updated.map((group) => group.id));

        // Jeśli usuwamy aktywną grupę, switch na inną
        if (activeGroupId === groupId) {
            const nextActive = updated.length > 0 ? updated[0].id : null;
            setActiveGroupIdState(nextActive);
            if (nextActive) {
                setActiveGroupId(nextActive);
            }
        }
    };

    const handleSwitchGroup = (groupId: string) => {
        setActiveGroupIdState(groupId);
        setActiveGroupId(groupId);
    };

    const handleDownloadPdf = async () => {
        let blocksToExport: BlockData[];
        
        if (pdfSource === "edit") {
            // Use all blocks from edit mode
            blocksToExport = blocksData.filter((block) => block.col >= 0 && block.row >= 0);
        } else {
            // Use blocks for current week
            blocksToExport = filterClassesForWeek(blocksData, weekDates);
        }

        if (blocksToExport.length === 0) {
            toast.current?.show({
                severity: "warn",
                summary: "Brak danych",
                detail: "Brak bloków do wyeksportowania.",
                life: 2000,
            });
            return;
        }

        try {
            await generatePdf(blocksToExport, "plan-zajec.pdf", pdfFullWeek, pdfDarkMode, pdfCaption);
            setShowPdfDialog(false);
            toast.current?.show({
                severity: "success",
                summary: "Eksport zakończony",
                detail: "PDF został pobrany.",
                life: 1500,
            });
        } catch (error) {
            toast.current?.show({
                severity: "error",
                summary: "Błąd eksportu",
                detail: "Nie udało się wygenerować PDF.",
                life: 2000,
            });
        }
    };

    const handleRestoreBlockFromDisk = (blockId: number) => {
        const originalBlock = originalBlocksRef.current.find((block) => block.id === blockId);
        if (!originalBlock) {
            toast.current?.show({
                severity: "warn",
                summary: "Brak danych z dysku",
                detail: `Nie udało się przywrócić bloku #${blockId}.`,
                life: 1500,
            });
            return;
        }
        if (originalBlock.col == -1) {
                    toast.current?.show({
                        severity: "warn",
                        summary: "Nie można przywrócić bloku",
                        detail: `Blok #${blockId} jest nowym blokiem`,
                        life: 1500,
                    });
                    return;
                }

        const nextBlocks = sortBlocksByPlacement(
            blocksDataRef.current.map((block) => (block.id === blockId ? originalBlock : block))
        );

        applyBlocksState(nextBlocks);

        toast.current?.show({
            severity: "success",
            summary: "Przywrócono z dysku",
            detail: `Blok #${blockId} został przywrócony.`,
            life: 1500,
        });
    };

    //block handlers

    const handleBlockPickup = (blockId: number, hourSpan: number) => {
        if (!isEditModeEnabled) {
            return;
        }

        const block = blocksDataRef.current.find(b => b.id === blockId);
        if (!block) return;
        if ((block.col == -1 || block.row == -1)){
            return
        }

        if (selectedGroupIds.length > 1) {
            if (!editingSubject) {
                setEditingSubject(block.text);
                toast.current?.show({ severity: "info", summary: "Edycja", detail: `Wybrano przedmiot: ${block.text}`, life: 1500 });
            } else if (block.text !== editingSubject) {
                toast.current?.show({ severity: "warn", summary: "Inny przedmiot", detail: `Edycja ograniczona do: ${editingSubject}`, life: 1800 });
                return;
            }
        }

        setSelectedBlockId(blockId);
    }

    const handleHideEditBar = () => {
        setSelectedBlockId(null);
    };

    const handleBlockDrop = (blockId: number, newX: number, newY: number, hourSpan: number, dragGridProps: GridProps = responsiveGridProps,cursorX:number,cursorY:number) => {
        if (!isEditModeEnabled) {
            return { x: newX, y: newY };
        }

        const currentBlock = blocksDataRef.current.find((b) => b.id === blockId);
        if (!currentBlock) {
            return { x: newX, y: newY };
        }
        if (selectedGroupIds.length > 1 && editingSubject && currentBlock.text !== editingSubject) {
            toast.current?.show({ severity: "warn", summary: "Inny przedmiot", detail: `Edycja ograniczona do: ${editingSubject}`, life: 1400 });
            // return to original position
            return getCellPosition(currentBlock.row, currentBlock.col, dragGridProps);
        }

        // Compute block visual size and use its center for bin-hit testing.
        const cellSizeForDrag = { x: dragGridProps.gridWidth / dragGridProps.cols, y: dragGridProps.gridHeight / dragGridProps.rows };
        const BLOCK_WIDTH_ADJUST = -4;
        const BLOCK_HEIGHT_ADJUST = -4;
        const blockWidth = Math.max(1, Math.round(cellSizeForDrag.x * hourSpan) + BLOCK_WIDTH_ADJUST);
        const blockHeight = Math.max(1, Math.round(cellSizeForDrag.y) + BLOCK_HEIGHT_ADJUST);
        const centerX = newX + blockWidth / 2;
        const centerY = newY + blockHeight / 2;

        // Check if block is dropped in bin area below calendar (use center point)
        const binRect = binRef.current?.getBoundingClientRect();
        const gridRect = boardRef.current?.getBoundingClientRect();

        if (binRect && gridRect) {
            console.log('binbin binrect',binRect.left,binRect.top,binRect.bottom,binRect.right)
            console.log('binbin cursor',cursorX,cursorY)
            const isInsideBin =
                cursorX >= binRect.left &&
                cursorX <= binRect.right &&
                cursorY >= binRect.top &&
                cursorY <= binRect.bottom;
            if (isInsideBin) {
                let newData = removeBlock(blocksDataRef.current, blockId);
                if (!isNewBlockPresent(newData)) {
                    newData = SpawnNewBlock(newData, dragGridProps.Bin);
                }
                applyBlocksState(newData);
                setSelectedBlockId(null);
                toast.current?.show({
                    severity: "info",
                    summary: "Przeniesiono do kosza",
                    detail: `Blok #${blockId} usunięty.`,
                    life: 1200,
                });
                return {
                    x: getNewBlockPosition(dragGridProps.Bin).x,
                    y: getNewBlockPosition(dragGridProps.Bin).y,
                };
            }
        }

        // Removed ambiguous "dropped on right side" heuristic; explicit element-rect or bottom bin used above.
        console.log("cell index its me 1")
        const targetIndex = getCellIndex(newX, newY + cellSize.y / 2, dragGridProps);
        const snappedCol = Math.max(0, Math.min(targetIndex.col, dragGridProps.cols - hourSpan));

        if (currentBlock && currentBlock.row === targetIndex.row && currentBlock.col === snappedCol) {
            return getCellPosition(currentBlock.row, currentBlock.col, dragGridProps);
        }
        targetIndex.col = snappedCol
        const snappedPos = getGridSnappedPosition(newX, newY + cellSize.y/2, hourSpan, dragGridProps);
        console.log('cell index im problem :)')
        const newBlocksData = updateBlockPosition(blocksDataRef.current, blockId, targetIndex).map((block) => {
            if (block.id !== blockId) {
                return block;
            }

            return {
                ...block,
                activeDates: buildActiveDates(block.terms, targetIndex.row, scheduleTerms),
            };
        });
        let recalculatedBlocks = sortBlocksByPlacement(newBlocksData);
        if(!isNewBlockPresent(recalculatedBlocks)){
            recalculatedBlocks = SpawnNewBlock(recalculatedBlocks,dragGridProps.Bin);
            recalculatedBlocks = recalculateBlockPostions(recalculatedBlocks, dragGridProps);
        }
        applyBlocksState(recalculatedBlocks);
        
        setSelectedBlockId(blockId);
        return snappedPos;
    }

    const placedBlocksCount = visibleBlocks.filter(block => block.col !== -1 && block.row !== -1).length;

    return (
        <div className="tt-layout" style={{ position: "relative" }}>
        <ConfirmDialog />
        <Toast ref={toast} position="top-right" />

        <motion.div 
          layout 
          transition={layoutTransitionConfig} 
          className={`tt-surface ${selectedBlockId !== null ? "tt-surface--editbar-open" : "tt-surface--editbar-hidden"}`}
        >
                    <motion.section
                        layout
                        transition={layoutTransitionConfig}
                        className="tt-left-panel"
                    >
                <div className="tt-prompt-row">
                    <img src={robotImage} className="tt-prompt-robot" alt="Robot" />
                    <InputText placeholder="Wpisz prompt" className="tt-prompt-input" />
                    <Button icon="pi pi-send" rounded text className="tt-icon-btn" />
                </div>

                <div className="tt-plan-row">
                    <span>tryb edycji</span>
                    <label className="tt-mail-toggle" aria-label="Tryb edycji">
                        <input
                            type="checkbox"
                            checked={isEditModeEnabled}
                            onChange={(event) => {
                                const wants = event.target.checked;
                                setIsEditModeEnabled(wants);

                                if (wants) {
                                    // entering edit mode: clear previously selected subject
                                    setEditingSubject(null);
                                    if (selectedGroupIds.length > 1) {
                                        toast.current?.show({
                                            severity: "info",
                                            summary: "Wybierz przedmiot",
                                            detail: "Kliknij blok, by wybrać przedmiot do edycji.",
                                            life: 2500,
                                        });
                                    }
                                }
                            }}
                        />
                        <span className="tt-mail-toggle-track" aria-hidden="true">
                            <span className="tt-mail-toggle-thumb" />
                        </span>
                    </label>
                </div>

                <div className="tt-plan-row">
                    <span>powiadomienia e-mail</span>
                    <label className="tt-mail-toggle" aria-label="Powiadomienia e-mail">
                        <input
                            type="checkbox"
                            checked={emailNotificationsEnabled}
                            onChange={(event) => setEmailNotificationsEnabled(event.target.checked)}
                        />
                        <span className="tt-mail-toggle-track" aria-hidden="true">
                            <span className="tt-mail-toggle-thumb" />
                        </span>
                    </label>
                </div>

                <div className="tt-plan-row tt-plan-tags-row">
                    <span>plany:</span>
                    {selectedGroups.map((group) => (
                        <span 
                            key={group.id} 
                            className={`tt-plan-chip ${activeGroupId === group.id ? "tt-plan-chip--active" : ""}`}
                            onClick={() => handleSwitchGroup(group.id)}
                        >
                            {group.name}
                            <button 
                                className="tt-chip-close-btn" 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveGroup(group.id);
                                }}
                                aria-label={`Usuń grupę ${group.name}`}
                            >
                                ×
                            </button>
                        </span>
                    ))}
                    <Button 
                        icon="pi pi-plus" 
                        text 
                        rounded 
                        className="add-group-button" 
                        onClick={() => setShowGroupSelector(true)}
                    />
                    <div className="tt-plan-row-spacer" />
                    {isEditModeEnabled && (
                    <div className="buttones">
                    <Button icon="pi pi-arrow-left" rounded outlined className="tt-icon-btn tt-undo-btn" onClick={handleUndo} disabled={!canUndo} />
                    <Button icon="pi pi-arrow-right" rounded outlined className="tt-icon-btn tt-redo-btn" onClick={handleRedo} disabled={!canRedo} />
                    <Button icon="pi pi-refresh" rounded outlined className="tt-icon-btn tt-refresh-btn" onClick={handleReloadData} />
                    </div>)}
                </div>

                <motion.div
                    ref={boardRef}
                    layout
                    transition={layoutTransitionConfig}
                    className={`tt-board ${isEditModeEnabled ? "tt-board--edit-mode" : ""}`}
                    style={{ position: "relative", width: "100%", minWidth: 0 }}
                >
                    
                    <TimetableGrid
                        rows={rows}
                        cols={cols}
                        gridHeight={gridHeight}
                        gridWidth={responsiveGridProps.gridWidth}
                        rowHeights={rowHeights}
                        StartPoint={responsiveGridProps.StartPoint}
                        Bin={responsiveGridProps.Bin}
                        showBin={isEditModeEnabled}
                        dayLabels={isEditModeEnabled ? [] : dayLabels}
                    />
                    <motion.div
                        className="tt-block-layer"
                        variants={blockListVariants}
                        initial={false}
                        animate="animate"
                    >
                        <AnimatePresence mode={LIST_ANIMATE_PRESENCE_MODE} initial={false}>
                            {visibleBlocks.map((block) => {
                                const isNewClassBlock = block.col === -1 && block.row === -1;

                                if (isNewClassBlock && !isEditModeEnabled) {
                                    return null;
                                }

                                return (
                                    <ClassBlock
                                        gridProps={responsiveGridProps}
                                        handlePickup={handleBlockPickup}
                                        handleDrop={handleBlockDrop}
                                        isEditModeEnabled={isEditModeEnabled}
                                        key={block.id}
                                        theme={theme}
                                        blockData={block}
                                        variants={blockItemVariants}
                                    />
                                );
                            })}
                            
                        
                        </AnimatePresence>
                    </motion.div>
                </motion.div>

                
                {!isEditModeEnabled && (
                    <div className="tt-bottom-row">
                        <div className="tt-bottom-nav">
                            <Button icon="pi pi-chevron-left" rounded outlined className="tt-nav-btn" aria-label="Poprzedni tydzień" onClick={handlePreviousWeek} />
                            <span className="tt-date-pill">{getWeekRangeString(currentDate)}</span>
                            <Button icon="pi pi-chevron-right" rounded outlined className="tt-nav-btn" aria-label="Następny tydzień" onClick={handleNextWeek} />
                        </div>

                        <Button label="pobierz pdf" icon="pi pi-download" className="tt-download-btn" onClick={() => setShowPdfDialog(true)} />
                    </div>
                )}
                {isEditModeEnabled && (
                            <div className="tt-bin-wrapper">
                    <AnimatePresence initial={false} mode={PANEL_ANIMATE_PRESENCE_MODE}>
                    <motion.div
                        layout
                        variants={binPanelVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        ref={binRef}
                        className={`editbar-bin ${isDragOverBin ? "is-drag-over" : ""}`.trim()}
                        onDragOver={handleBinDragOver}
                        onDragLeave={handleBinDragLeave}
                        onDrop={handleBinDrop}
                        style={{ height: `${cellSize.y + remToPx(2)}px`,
                                width: `${responsiveGridProps.gridWidth/3}px`,
                                }}
                    >
                        <i className="pi pi-trash editbar-bin-icon"></i>
                        <span className="editbar-bin-title">Kosz</span>
                        <span className="editbar-bin-subtitle">upuść blok, aby usunąć</span>
                    </motion.div>
                    
                    </AnimatePresence>
                    
                    </div>
                )}
                {isEditModeEnabled && <div className="tt-active-count">Aktywne bloki: {placedBlocksCount}</div>}
                    {scheduleError && <div className="tt-active-count">Błąd danych: {scheduleError}</div>}
            </motion.section>
            
                    

            <AnimatePresence initial={false} mode={PANEL_ANIMATE_PRESENCE_MODE}>
                {isEditModeEnabled && (
                    <motion.aside
                        layout
                        variants={rightPanelVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        style={{ originX: 1, originY: 0.5 }}
                        className="tt-right-panel"
                    >
                        <EditBar
                            blockData={selectedBlock}
                            onSave={handleEditBlock}
                            onHide={handleHideEditBar}
                            onRestoreFromDisk={handleRestoreBlockFromDisk}
                        />
                    </motion.aside>
                )}
            </AnimatePresence>

            <GroupSelector
                visible={showGroupSelector}
                onHide={() => setShowGroupSelector(false)}
                onGroupsSelected={handleAddGroups}
                selectedGroupIds={selectedGroupIds}
            />

            <Dialog
                header="Eksportuj do PDF"
                visible={showPdfDialog}
                onHide={() => setShowPdfDialog(false)}
                className="pdf-export-modal"
                maskClassName="pdf-export-modal-mask"
                modal
            >
                <div className="pdf-export-dialog">
                    <div className="pdf-export-field">
                        <label>Źródło danych:</label>
                        <Dropdown
                            value={pdfSource}
                            options={[
                                { label: "Bieżący tydzień", value: "week" },
                                { label: "Tryb edycji (cały plan)", value: "edit" }
                            ]}
                            onChange={(e) => setPdfSource(e.value)}
                            placeholder="Wybierz źródło"
                            panelClassName="pdf-export-dropdown-panel"
                        />
                    </div>

                    <div className="pdf-export-field">
                        <label>Nagłówek:</label>
                        <InputText
                            value={pdfCaption}
                            onChange={(e) => setPdfCaption(e.target.value)}
                            placeholder="Wpisz nagłówek"
                        />
                    </div>

                    <div className="pdf-export-field">
                        <label>Tryb ciemny:</label>
                        <InputSwitch
                            checked={pdfDarkMode}
                            onChange={(e) => setPdfDarkMode(e.value)}
                        />
                    </div>

                    <div className="pdf-export-field">
                        <label>Cały tydzień (7 dni):</label>
                        <InputSwitch
                            checked={pdfFullWeek}
                            onChange={(e) => setPdfFullWeek(e.value)}
                        />
                    </div>

                    <div className="pdf-export-actions">
                        <Button
                            label="Pobierz PDF"
                            icon="pi pi-download"
                            onClick={handleDownloadPdf}
                        />
                        <Button
                            label="Anuluj"
                            icon="pi pi-times"
                            className="p-button-secondary"
                            onClick={() => setShowPdfDialog(false)}
                        />
                    </div>
                </div>
            </Dialog>
        </motion.div>
        </div>
    );
};

export default Timetable;
