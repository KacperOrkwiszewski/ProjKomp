import { jsPDF } from "jspdf";
import { BlockData, isOverlapping } from "./ClassBlockUtils";
import "../assets/TitilliumWeb-Bold-normal.js";
import "../assets/TitilliumWeb-Regular-normal.js";

// A4 dimensions in points (landscape)
var PAGE_WIDTH = 1000;
var PAGE_HEIGHT = 1000;
const MARGIN = 4;


// global
const fontSize: number = 9;
const captionFontSize = 14;
const captionOffset = 25
const borderWidth: number = 1.5;
const blockPadding = 3;
const lineGap = 2;
const minRowHeight = 50;
const columnGap = 8; // padding between columns
const colWidth = 60;
const hoursHeight = 20
const daysWidth = 30
const topLineMargin = 4
//palette
var pageColor: string = "#ffffff"
var extraColor: string = "#555555"
var blockBackgroundColor: string = "#ffffff";
var gridColor: string = "#000000"
var fontColor: string = "#000000";

function setTheme(mode:boolean){
  if (mode){
    extraColor = "#555555"
    pageColor= "#ffffff"
    blockBackgroundColor = "#ffffff";
    gridColor = "#000000"
    fontColor = "#000000";
  }else{
    extraColor = "#D9D9D9"
    pageColor= "#2a2a2a"
    blockBackgroundColor = "#2a2a2a";
    gridColor = "#d9d9d9"
    fontColor = "#f3f4f6";
  }
}


// sort before drawing
function sortBlocks(blocks: BlockData[]): BlockData[] {
  return [...blocks].sort((a, b) => {
    if (a.row !== b.row) return a.row - b.row;
    if (a.col !== b.col) return a.col - b.col;
    return a.subrow - b.subrow;
  });
}

// generate terms header
function formatTerms(block: BlockData): string {
  const terms = [...block.terms].sort((a, b) => a - b);
  const isRange = (arr: number[], expected: number[]) =>
    arr.length === expected.length &&
    arr.every((v, i) => v === expected[i]);
  const odd1to15 = [1, 3, 5, 7, 9, 11, 13, 15];
  const even1to15 = [2, 4, 6, 8, 10, 12, 14];

  let body = "";
  if (isRange(terms, odd1to15)) {
    return "nparz";
  } else if (isRange(terms, even1to15)) {
    return "parz";
  } else {
    const ranges: string[] = [];
    let start = terms[0];
    let prev = terms[0];
    for (let i = 1; i <= terms.length; i++) {
      const curr = terms[i];
      if (curr === prev + 1) {
        prev = curr;
        continue;
      }
      if (start === prev) {
        ranges.push(`${start}`);
      } else {
        ranges.push(`${start}-${prev}`);
      }
      start = curr;
      prev = curr;
    }
    body = ranges.join(",");
  }
  return `t ${body}`;
}

// darker shade for terms header
function shadeColor(color: string, percent: number): string {
  const num = parseInt(color.replace("#", ""), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + percent));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + percent));
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + percent));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function drawBlock(
  doc: jsPDF,
  block: BlockData,
  x: number,
  y: number,
  width: number
): number {
  let cursorY = y + 2;
  doc.setFontSize(fontSize);

  // calculate deach dimension
  const termsText = formatTerms(block);
  const termsHeight = doc.getTextDimensions(termsText, { maxWidth: width - blockPadding * 2 }).h;
  const termsBlockHeight = termsHeight;
  const preTermsCursorY = cursorY;
  const postTermsCursorY = cursorY + termsBlockHeight + lineGap;

  const classText = block.text;
  const textHeight = doc.getTextDimensions(classText, { maxWidth: width - blockPadding * 2 }).h;
  const textBlockHeight = Math.max(textHeight, 10);
  const postNameCursorY =postTermsCursorY + textBlockHeight + lineGap + fontSize;

  const extraText = block.extraInfo;
  const extraHeight = doc.getTextDimensions(extraText, { maxWidth: width - blockPadding * 2 }).h;
  const extraBlockHeight = extraHeight;
  const postExtraCursorY = postNameCursorY + extraBlockHeight - fontSize/2

  //background
  doc.setFillColor(blockBackgroundColor);
  doc.rect(x, y, width, postExtraCursorY - y,"F");

  // terms
  doc.setFont("TitilliumWeb-Bold");
  const darkBg = shadeColor(blockBackgroundColor, -12);
  doc.setFillColor(darkBg);
  doc.rect(x, preTermsCursorY, width, termsBlockHeight, "F");
  doc.setTextColor(fontColor);
  doc.text(termsText, x + blockPadding, preTermsCursorY + termsBlockHeight / 2 + termsHeight / 3, { maxWidth: width - blockPadding * 2 });
  doc.setFont("TitilliumWeb-Regular");

  // class name
  doc.setTextColor(fontColor);
  doc.text(classText, x + blockPadding, postTermsCursorY + fontSize, { maxWidth: width - blockPadding * 2 });

  // additional information
  doc.setTextColor(extraColor);
  doc.text(extraText, x + blockPadding, postNameCursorY, { maxWidth: width - blockPadding * 2 });

  // border
  doc.setDrawColor(block.color);
  doc.setLineWidth(borderWidth);
  doc.rect(x, y, width, postExtraCursorY - y);

  return postExtraCursorY;
}

// draw a row of classes
function drawRow(
  doc: jsPDF,
  x: number,
  y: number,
  blocks: BlockData[],
  rowNumber: number
): number {
  const rowBlocks = blocks
    .filter(b => b.row === rowNumber)
    .sort((a, b) => a.subrow - b.subrow);

  const placed: BlockData[] = [];
  let globalMaxY = y;

  for (const block of rowBlocks) {
    const colX = x + block.col * (colWidth + columnGap) + columnGap/2;
    const blockWidth = colWidth * block.hourSpan + columnGap * (block.hourSpan -1);

    let startY = y;

    // determine block y based on overlaps
    for (const other of placed) {
      if (isOverlapping(block, other)) {
        const otherEndY = (other as any).__endY;
        startY = Math.max(startY, otherEndY + blockPadding);
      }
    }
    const endY = drawBlock(doc, block, colX, startY, blockWidth);
    (block as any).__endY = endY;
    placed.push(block);
    globalMaxY = Math.max(globalMaxY, endY);
  }

  return globalMaxY;
}
function drawLine(
  doc:jsPDF,
  y:number,
  x:number,
  horizontal:boolean
){
    if (horizontal){
      doc.setDrawColor(gridColor)
      doc.setLineWidth(0.5);
      doc.line(x, y, x+ 12 * (colWidth + columnGap), y);
    }else{
      doc.setDrawColor(gridColor)
      doc.setLineWidth(0.5);
      doc.line(x, y, x, PAGE_HEIGHT - MARGIN);
    }
}

function drawHours(
  doc: jsPDF,
  startX: number,
  startY: number
){

  // darker background
  doc.setFillColor(shadeColor(blockBackgroundColor, -12))
  doc.rect(startX, startY + topLineMargin,(colWidth + columnGap)*12,hoursHeight - topLineMargin,"F");

  drawLine(doc,startY,startX,true);
  startY += topLineMargin
  drawLine(doc,startY,startX,true);
  doc.setFontSize(7);
  doc.setTextColor(fontColor);
  
  for(let col = 0; col <= 12; col++){
    const cellX = startX + col * (colWidth + columnGap);
    drawLine(doc,startY,cellX,false);
    
    // Draw hour labels
    if (col <12){
    const hourLabel = `${8 + col}:15`;
    doc.text(hourLabel, cellX + 2, startY + hoursHeight / 2,{align: "left"});
    }
    if (col < 12){
    const hourLabel2 = `${9 + col}:00`;
    doc.text(hourLabel2, cellX + colWidth +columnGap -2, startY + hoursHeight / 2,{align: "right"});
    }
  }
}

function drawDays(
  doc: jsPDF,
  startX: number,
  startY: number,
  linesY: number[],
  fullWeek: boolean
){


  const dayNames = fullWeek 
    ? ["Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota", "Niedziela"]
    : ["Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek"];
  
  const numDays = fullWeek ? 7 : 5;

  drawLine(doc, startY, startX, false);
  drawLine(doc, startY, startX, true);

  // Draw day names rotated -90 degrees
  doc.setFontSize(8);
  doc.setTextColor(fontColor);
  for (let day = 0; day < numDays; day++) {
    const dayY = linesY[day];
    const nextDayY = linesY[day + 1];
    const cellHeight = nextDayY - dayY;
    // Draw horizontal line at row boundary
    if (day < linesY.length - 1) {
      drawLine(doc, nextDayY, startX, true);
    }

    // Calculate text width for proper centering
    const textWidth = doc.getTextDimensions(dayNames[day]).w;
    const textHeight = doc.getTextDimensions(dayNames[day]).h;
    const text = dayNames[day];
    const dim = doc.getTextDimensions(text);

    // scam cell center
    const cellCenterX = startX + daysWidth / 2;
    const cellCenterY = dayY + cellHeight / 2;

    const x = cellCenterX - dim.h / 2 + textHeight/2;
    const y = cellCenterY + dim.w / 2;

    doc.text(text, x, y, { angle: 90 });
    }
}

// draw each row of classes
function drawRowsGrid(
  doc: jsPDF,
  startX: number,
  startY: number,
  blocks: BlockData[],
  fullWeek : boolean,
  caption:string
): { endY: number;} {

  doc.setFont("TitilliumWeb-Bold");
  // Draw caption at top center
  doc.setFontSize(captionFontSize);
  doc.setTextColor(fontColor);
  doc.text(caption, PAGE_WIDTH / 2, MARGIN + 2 + captionFontSize, { align: "center" });
  startY += captionOffset
  doc.setFont("TitilliumWeb-Regular");

  // darker background for days
  doc.setFillColor(shadeColor(blockBackgroundColor, -12))
  doc.rect(MARGIN, MARGIN + topLineMargin + captionOffset,daysWidth,PAGE_HEIGHT-MARGIN*2-topLineMargin - captionOffset,"F");

  drawLine(doc,startY,startX,true);
  drawLine(doc,startY+topLineMargin,startX,true);
  drawLine(doc,startY+topLineMargin,startX,false);
  var days = 7
  if (!fullWeek){
    days = 5
  }  
  startX += daysWidth
  drawHours(doc,startX,startY)
  startY += hoursHeight

  let currentY = startY + blockPadding;
  let lineMarks = [startY]
  let finalY = 0

  drawLine(doc,startY,startX,true);
  for (let row = 0; row <= days-1; row++) {
    const rowBlocks = blocks.filter(b => b.row === row);

    let rowHeight: number;
    if (rowBlocks.length === 0) {
      rowHeight = minRowHeight;
      currentY += rowHeight;
      drawLine(doc,currentY,startX,true);
      lineMarks.push(currentY)
      currentY += blockPadding;
      continue;
    }
    const startY = currentY;
    const endY = drawRow(doc, startX, startY, blocks, row);
    const computedHeight = endY - startY;
    rowHeight = Math.max(minRowHeight, computedHeight);

    drawLine(doc,endY + blockPadding,startX,true);
    lineMarks.push(endY + blockPadding)
    finalY = endY + blockPadding
    currentY = startY + rowHeight + blockPadding *2;
  }
  drawDays(doc,startX - daysWidth,startY,lineMarks,fullWeek)
  return { endY: finalY + MARGIN};
}

function testPdf(
  blocks: BlockData[],
  fullWeek:boolean,
  caption:string
){
  const doc = new jsPDF({
        orientation: "landscape",
        unit: "pt",
        format: "a4"
      });
  const gridResult = drawRowsGrid(doc, MARGIN, MARGIN, blocks,fullWeek,caption);
  PAGE_HEIGHT = gridResult.endY
  PAGE_WIDTH = (colWidth+columnGap) * 12 + daysWidth + MARGIN * 2
}

// generate document
export function generatePdf(
  blocks: BlockData[],
  outputPath: string,
  fullWeek: boolean = true,
  dark : boolean,
  caption: string = 'Plan zajec'
): Promise<void> {
  return new Promise((resolve, reject) => {
    // determine size
    setTheme(!dark);
    testPdf(blocks,fullWeek,caption)
    try {
      const doc = new jsPDF({
      orientation: "landscape",
      unit: "pt",
      format: [PAGE_WIDTH, PAGE_HEIGHT]
      });
      
      
      doc.setFillColor(pageColor);
      doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, "F");

      // Draw content
      drawRowsGrid(doc, MARGIN, MARGIN, blocks,fullWeek,caption);


      // For browser download
      const pdfBlob = doc.output("blob");
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = outputPath || "plan-zajec.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      resolve();
    } catch (err) {
      reject(err);
    }
  });
}