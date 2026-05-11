import { BlockData } from "./ClassBlockUtils";
import { BinData } from "./TimeGridUtils";

import { findAvailableIndex } from "../utils/ClassBlockUtils";

export function SpawnNewBlock(blocksData:BlockData[],bin :BinData){
    console.log("spawning new block in bin area:", bin);
    console.log("current blocks data:", blocksData);
    let newBlocksData = [...blocksData];
    const newBlock: BlockData = {
        id: findAvailableIndex(blocksData),
        col: -1,
        row: -1,
        subrow: 0,
        x: getNewBlockPosition(bin).x,
        y: getNewBlockPosition(bin).y,
        hourSpan: 2,
        color: "gray",
        text: "NEW CLASS",
        note: "",
        extraInfo: "",
        terms: [],
        termMode: "x1",
        reference: "",
        activeDates: []
    };
    newBlocksData.push(newBlock);
    console.log("new blocks data:", newBlocksData);
    return newBlocksData;
}

export function isNewBlockPresent(blocksData:BlockData[]){
    if(blocksData.map(block=>block.col).includes(-1)){
        return true;
    }
    return false;
}

export function getNewBlockPosition(bin: BinData){
    return { x: bin.StartPoint.x - 140, y: bin.StartPoint.y + 20};
}