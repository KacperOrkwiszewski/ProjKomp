import { getCellIndex, getCellPosition, GridProps } from "./TimeGridUtils";


export type BlockData = {
    id: number;
    col: number;
    row: number;
    subrow: number;
    x: number;
    y: number;
    hourSpan: number;
    color: string;
    text: string;
    note: string;
    extraInfo: string;
    terms: number[];
    termMode: "x1" | "x2";
    reference: string;
    activeDates: string[];
};

export function sortBlocksByPlacement(blocksData: BlockData[]) {
    return [...blocksData].sort((a, b) => {
        if (a.col === b.col) {
            return b.hourSpan - a.hourSpan;
        }

        return a.col - b.col;
    });
}

export function isOverlapping(blockA: BlockData, blockB: BlockData) {
    if (blockA.row !== blockB.row || blockA.col == -1) {
        return false;
    }
    const aStart = blockA.col;
    const aEnd = blockA.col + blockA.hourSpan;
    const bStart = blockB.col;
    const bEnd = blockB.col + blockB.hourSpan;

    return aStart < bEnd && bStart < aEnd;
}

export function removeBlock(blocksData: BlockData[],blockID:number){
    let newBlocksData = [...blocksData];
    const index = blocksData.findIndex(block => block.id == blockID);
    if (index < 0){
        return blocksData;
    }
    newBlocksData.splice(index,1);
    return newBlocksData;
}

export function updateBlockPosition(blocksData: BlockData[], blockId: number, newX: number, newY: number, gridProps: GridProps) {
    const cellIndex = getCellIndex(newX, newY, gridProps);
    
    return blocksData.map(block => {
        if (block.id === blockId) {
            return { ...block, col: cellIndex.col, row: cellIndex.row };
        }
        return block;
    });
}

export function recalculateBlockPostions(blocksData: BlockData[], gridProps: GridProps) {
    return blocksData.map(block => {
        const cellPosition = getCellPosition(block.row, block.col, gridProps);
        return { ...block, x: cellPosition.x, y: cellPosition.y + (block.subrow * gridProps.gridHeight / gridProps.rows) };
    });
}

export function recalculateBlockSubrows(blocksData: BlockData[]) {
    let newBlocksData = blocksData.map(block => ({ ...block, subrow: 0 }));
    
    for (let i = 0; i < newBlocksData.length; i++) {
        const block = newBlocksData[i];
        for (let j = 0; j < newBlocksData.length; j++) {
            if (i <= j) continue;
            const otherBlock = newBlocksData[j];

            if (isOverlapping(block, otherBlock) && block.subrow == otherBlock.subrow) {
                block.subrow = findFirstAvailableSubrow(newBlocksData, block.row, block.col, block.hourSpan);
            }
        }
    }
    return newBlocksData;
}

export function findFirstAvailableSubrow(blocksData: BlockData[], targetRow: number, targetCol: number, hourSpan: number) {
    let subrow = 0;
    while (true) {
        const overlapping = blocksData.some(block => {
            if (block.row !== targetRow || block.subrow !== subrow) return false;
            const blockStart = block.col;
            const blockEnd = block.col + block.hourSpan;
            const targetStart = targetCol;
            const targetEnd = targetCol + hourSpan;
            return targetStart < blockEnd && blockStart < targetEnd;
        });
        if (!overlapping) return subrow;
        subrow++;
    }
}

export const getGridSnappedPosition = (x: number, y: number, hourSpan: number, gridProps: GridProps) => {
        const cellIndex = getCellIndex(x,y,gridProps);
        const overhang = Math.max(cellIndex.col + hourSpan - gridProps.cols, 0);
    cellIndex.col = Math.max(0, cellIndex.col - overhang);
        const cellPos = getCellPosition(cellIndex.row, cellIndex.col, gridProps);
        return cellPos;
    };

export function findAvailableIndex(blocksData: BlockData[]){
    const indexes = blocksData.map(block=>block.id);
    let i = 0;
    while (indexes.includes(i)){
        i++;
    }
    return i;
}