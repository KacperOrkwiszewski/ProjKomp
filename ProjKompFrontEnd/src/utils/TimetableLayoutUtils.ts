import { BlockData, recalculateBlockPostions, recalculateBlockSubrows, sortBlocksByPlacement } from "./ClassBlockUtils";
import { GridProps, calculateHeight, recalculateOccupiedCells } from "./TimeGridUtils";

export function getRowHeightsFromOccupiedCells(occupiedCells: number[], rows: number, cols: number) {
    return Array.from({ length: rows }, (_, row) => {
        const rowStart = row * cols;
        const rowEnd = rowStart + cols;
        const maxOccupied = Math.max(0, ...occupiedCells.slice(rowStart, rowEnd));
        return Math.max(1, maxOccupied);
    });
}

export function buildCurrentGridProps(gridProps: GridProps, rowHeights: number[]): GridProps {
    return {
        ...gridProps,
        rowHeights,
        Bin: {
            ...gridProps.Bin,
            StartPoint: {
                x: gridProps.Bin.StartPoint.x,
                y: gridProps.StartPoint.y + calculateHeight(rowHeights) * (gridProps.gridHeight / gridProps.rows),
            },
        },
    };
}

export function rebuildTimetableLayout(blocksData: BlockData[], gridProps: GridProps) {
    const sortedBlocks = sortBlocksByPlacement(blocksData);
    const occupiedCells = recalculateOccupiedCells(sortedBlocks, gridProps);
    const rowHeights = getRowHeightsFromOccupiedCells(occupiedCells, gridProps.rows, gridProps.cols);
    const currentGridProps = buildCurrentGridProps(gridProps, rowHeights);
    const positionedBlocks = recalculateBlockPostions(recalculateBlockSubrows(sortedBlocks), currentGridProps);

    return {
        blocksData: positionedBlocks,
        occupiedCells,
        rowHeights,
        currentGridProps,
    };
}