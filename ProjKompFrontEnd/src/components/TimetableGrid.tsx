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
  const [isDragOverBin, setIsDragOverBin] = useState(false);
  const binRef = useRef<HTMLDivElement | null>(null);
  const cellSize = { x: gridWidth / cols, y: gridHeight / rows };
  const weekdays = ["PON", "WT", "ŚR", "CZW", "PT"];
  const formatTime = (hour: number, minute: number) => `${hour}:${String(minute).padStart(2, "0")}`;
  const hours = Array.from({ length: cols }, (_, index) => {
    const startHour = 8 + index;
    const endHour = 9 + index;
    return `${formatTime(startHour, 15)} - ${formatTime(endHour, 0)}`;
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
  const gridTemplateColumns = `50px repeat(${cols}, ${cellSize.x}px)`;

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

  return (
    <motion.div
      layout
      transition={layoutTransitionConfig}
      className="timetable-unified-container"
      style={{
        display: "grid",
        gridTemplateRows: gridTemplateRows,
        gridTemplateColumns: gridTemplateColumns,
        gap: 0,
        width: `${50 + gridWidth}px`,
        height: `${headerHeight + visibleGridHeight}px`,
      }}
    >
      {/* Top-left corner (empty cell) */}
      <div className="timetable-corner-cell" />

      {/* Top row: Hour headers */}
      {hours.map((hour, hourIndex) => (
        <div 
          key={`header-${hour}`} 
          className={`timetable-hour-header ${hourIndex === cols - 1 ? 'timetable-hour-header--last' : ''}`}
        >
          {hour}
        </div>
      ))}

      {/* Left column: Day headers + Grid cells */}
      {dayRows.map((row, rowIndex) => (
        <React.Fragment key={`row-${row.day}`}>
          {/* Day header for this row */}
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

      {showBin && (
        <AnimatePresence initial={false} mode={PANEL_ANIMATE_PRESENCE_MODE}>
          <motion.div
            layout
            variants={binPanelVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            ref={binRef}
            className={`editbar-bin ${isDragOverBin ? "is-drag-over" : ""}`.trim()}
            style={{
              position: "absolute",
              width: Bin.width,
              height: Bin.height,
              left: Bin.StartPoint.x,
              top: Bin.StartPoint.y,
            }}
            onDragOver={handleBinDragOver}
            onDragLeave={handleBinDragLeave}
            onDrop={handleBinDrop}
          >
            <span className="editbar-bin-icon">🗑️</span>
            <span className="editbar-bin-title">Kosz</span>
            <span className="editbar-bin-subtitle">upuść blok, aby usunąć</span>
          </motion.div>
        </AnimatePresence>
      )}
    </motion.div>
  );
};


export default TimetableGrid;