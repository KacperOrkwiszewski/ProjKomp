import React, { useRef, useState } from "react";
import { GridProps } from "../utils/TimeGridUtils";
import { motion, AnimatePresence } from "framer-motion";
import { 
  springTransition,
  layoutTransitionConfig,
  binPanelVariants,
  PANEL_ANIMATE_PRESENCE_MODE,
} from "../utils/MotionUtils";

type TimetableGridProps = GridProps & {
  showBin?: boolean;
  dayLabels?: Array<{
    label: string;
    termNumber?: string;
  } | null>;
};

const TimetableGrid: React.FC<TimetableGridProps> = ({ rows, cols, gridHeight, gridWidth, rowHeights, StartPoint, Bin, showBin = true, dayLabels = [] }) => {
  
  
  const cellSize = { x: gridWidth / cols, y: gridHeight / rows };
  const weekdays = ["PON", "WT", "ŚR", "CZW", "PT"];
  const formatTime = (hour: number, minute: number) => `${hour}:${String(minute).padStart(2, "0")}`;
 const hours = Array.from({ length: cols }, (_, index) => {
    const startHour = 8 + index;
    const endHour = 9 + index;
    return (
      <div className="timetable-hour-content">
        <div>{formatTime(startHour, 15)}</div>
        <div>{formatTime(endHour, 0)}</div>
      </div>
    );
  });
  
  const dayRows = weekdays.map((day, index) => ({
    day,
    index,
    heightPx: Math.max(0, rowHeights[index] * cellSize.y),
  }));
  
  const visibleGridHeight = dayRows.reduce((sum, row) => sum + row.heightPx, 0);
  const headerHeight = Math.max(24, Math.round(cellSize.y * 0.65));
  
  // CSS Grid template: first row = header, first col = days, rest = grid cells
  const gridTemplateRows = `${headerHeight}px ${dayRows.map((row) => `${row.heightPx}px`).join(" ")}`;
  const gridTemplateColumns = `5rem repeat(${cols}, ${cellSize.x}px)`;

  return (
    <div className="timetable-unified-containertwo">
    <motion.div
      layout
      transition={layoutTransitionConfig}
      className="timetable-unified-container"
      style={{
        display: "grid",
        gridTemplateRows: gridTemplateRows,
        gridTemplateColumns: gridTemplateColumns,
        gap: 0,
      }}
    >
      {/* Top-left corner (empty cell) */}
      <div className="timetable-corner-cell" />

      {/* Top row: Hour headers */}
      {hours.map((hour, hourIndex) => (
          <div className ='timetable-hour-header-container'>
            <div 
              key={`header-${hour}`} 
              className={`timetable-hour-header ${hourIndex === cols - 1 ? 'timetable-hour-header--last' : ''}`}
            >
              {hour}
            </div>
          </div>
      ))}

      {/* Left column: Day headers + Grid cells */}
      {dayRows.map((row, rowIndex) => (
        <React.Fragment key={`row-${row.day}`}>
          {/* Day header for this row */}
          <div className="timetable-day-header-wrapper">
            <div className="timetable-day-header-container">
              <div className={`timetable-day-header ${rowIndex === rows - 1 ? 'timetable-day-header--last' : ''}`}>
                <div>{row.day}</div>
                {dayLabels[rowIndex] && (
                  <div className="timetable-day-header__term">
                    <span className="timetable-day-header__term-label">{dayLabels[rowIndex]?.label}</span>
                    {dayLabels[rowIndex]?.termNumber && (
                      <span className="timetable-day-header__term-number">{dayLabels[rowIndex]?.termNumber}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Grid cells for this row */}
          {Array.from({ length: cols }).map((_, colIndex) => {
            const isLastCol = colIndex === cols - 1;
            const isLastRow = rowIndex === rows - 1;
            const cellClasses = [
              'timetable-cell',
              isLastCol ? 'timetable-cell--last-col' : '',
              isLastRow ? 'timetable-cell--last-row' : '',
            ].filter(Boolean).join(' ');
            
            return (
              <div 
                key={`cell-${row.day}-${colIndex}`} 
                className={cellClasses}
              />
            );
          })}
        </React.Fragment>
      ))}
    </motion.div>
    </div>
  );
};


export default TimetableGrid;