import { BlockData } from "./ClassBlockUtils";
import { getNewBlockPosition } from "./NewBlockUtils";


export type CellPos = {
    row: number;
    col: number;
};

export type BinData = {
    StartPoint: { x: number; y: number };
    height: number;
    width: number;
}

export type GridProps = {
    rows: number;
    cols: number;
    gridHeight: number;
    gridWidth: number;
    rowHeights: number[];
    StartPoint: { x: number; y: number };
    Bin: BinData;
};

export function recalculateOccupiedCells(blocksData: BlockData[], gridProps: GridProps) {
    const newOccupied = Array(gridProps.rows * gridProps.cols).fill(0);
    blocksData.forEach(block => {
        if (block.col == -1 || block.row == -1) {
            return;
        }

        for (let i = 0; i < block.hourSpan; i++) {
            const index = block.row * gridProps.cols + block.col + i;
            newOccupied[index] += 1;
        }
    });

    return newOccupied;
}

export function recalculateRowHeights(blocksData: BlockData[],gridProps: GridProps) {
    let rowHeights = Array(gridProps.rows).fill(1);
    blocksData.forEach(block => {
        rowHeights[block.row] = Math.max(rowHeights[block.row], block.subrow + 1);
    });
    return rowHeights;
}


export function getCellIndex(x: number, y: number, gridProps: GridProps) {
    let row = 0;
    let col;
    let sumY = 0;
    const cellSize = { x: gridProps.gridWidth / gridProps.cols, y: gridProps.gridHeight / gridProps.rows };
    // Coordinates are anchored to the inner edge of the grid border.
    y -= gridProps.StartPoint.y + 1;
    x -= gridProps.StartPoint.x + 1;
    for (let i = 0; i < gridProps.rowHeights.length; i++) {
        sumY += gridProps.rowHeights[i]*cellSize.y;
        if (y < sumY) {
            break;
        }
        row ++;
    }
    if (row >= gridProps.rows){
         row = gridProps.rows - 1;
        };
    col = Math.max(0, Math.min(Math.floor(x / cellSize.x), gridProps.cols - 1));
    return {row, col};
}
export function calculateHeight(rowheights: number[]) {
    return rowheights.reduce((sum, height) => sum + height, 0);
}
//todo: implement blocks bin
export function isBinArea(x:number,y:number,gridProps:GridProps){
    const binStartPoint = gridProps.Bin.StartPoint;
    const binDim = {x:gridProps.Bin.width, y:gridProps.Bin.height}
    if(x > binStartPoint.x && x < binStartPoint.x + binDim.x){
        if(y > binStartPoint.y && y < binStartPoint.y + binDim.y){
            return true;
        }
    }
    return false;
}

export function getRowHeightsFromOccupiedCells(occupiedCells: number[], rows: number, cols: number) {
    return Array.from({ length: rows }, (_, row) => {
        const rowStart = row * cols;
        const rowEnd = rowStart + cols;
        const maxOccupied = Math.max(0, ...occupiedCells.slice(rowStart, rowEnd));
        return Math.max(1, maxOccupied);
    });
}

export function getCellPosition(row: number, col: number, gridProps: GridProps) {
    const cellSize = { x: gridProps.gridWidth / gridProps.cols, y: gridProps.gridHeight / gridProps.rows };
    let y = 0;
    let x = col * cellSize.x;
    
    if (row == -1 ||col == -1){ // blank block
        return { x: getNewBlockPosition(gridProps.Bin).x, y: getNewBlockPosition(gridProps.Bin).y };
    }

    for (let i = 0; i < row; i++) {
        y += gridProps.rowHeights[i]*cellSize.y;
    }
    // Place blocks at the same inner grid origin used by getCellIndex.
    return { x: gridProps.StartPoint.x + x + 1, y: gridProps.StartPoint.y + y + 1 };
}