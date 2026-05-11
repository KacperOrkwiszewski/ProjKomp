import { useState, useEffect } from "react";
import { BlockData } from "../utils/ClassBlockUtils";
import { GridProps } from "../utils/TimeGridUtils";
import { getClassDisplayColor, ThemeMode } from "../utils/ThemeUtils";
import { motion, Variants } from "framer-motion";
import { 
  blockItemVariants, 
  springTransitionConfig,
  quickSpringTransitionConfig,
  layoutTransitionConfig,
  hoverTapScaleGentle,
} from "../utils/MotionUtils";

type BlockProps = {
  handleDrop: (blockId: number, x: number, y: number, hourSpan: number, gridProps: GridProps) => {x: number, y: number};
  handlePickup: (blockId: number, hourSpan: number) => void;
  blockData: BlockData;
  gridProps: GridProps;
  theme: ThemeMode;
  isEditModeEnabled: boolean;
  variants?: Variants;
};

export default function Block({
  blockData: { id: blockId, col, row, x, y, hourSpan, color, text, extraInfo },
  gridProps,
  handleDrop,
  handlePickup,
  theme,
  isEditModeEnabled,
  variants,

}: BlockProps) {
  const VISUAL_OFFSET_X = 1;
  const VISUAL_OFFSET_Y = 1;
  const BLOCK_WIDTH_ADJUST = -4;
  const BLOCK_HEIGHT_ADJUST = -4;
  const isNewClassBlock = col === -1 && row === -1;
  const [position, setPosition] = useState({ x: x, y: y });
  const [isDragging, setIsDragging] = useState(false);
  const { gridWidth, gridHeight, cols, rows } = gridProps;
  const cellSize = { x: gridWidth /cols, y: gridHeight / rows };
  const classDisplayColor = getClassDisplayColor(color, theme);
  
  const blockWidth = Math.max(1, Math.round(cellSize.x * hourSpan) + BLOCK_WIDTH_ADJUST);
  const blockHeight = Math.max(1, Math.round(cellSize.y) + BLOCK_HEIGHT_ADJUST);

  useEffect(() => {
    if (!isDragging) {
      setPosition({ x, y });
    }
  }, [x, y, isDragging]);

  if (isNewClassBlock && !isEditModeEnabled) {
    return null;
  }

  const renderLeftOffset = isNewClassBlock ? Math.round(blockWidth * 0.45) : 0;
  const renderTopOffset = isNewClassBlock ? Math.round(blockHeight * 0.25) : 0;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isEditModeEnabled) {
      return;
    }

    const startX = e.pageX - position.x;
    const startY = e.pageY - position.y;
    const dragThreshold = 5;
    let didDrag = false;

    const handleMouseMove = (e: MouseEvent) => {
      const nextX = e.pageX - startX;
      const nextY = e.pageY - startY;

      if (!didDrag) {
        const movedEnough = Math.abs(nextX - position.x) >= dragThreshold || Math.abs(nextY - position.y) >= dragThreshold;
        if (!movedEnough) {
          return;
        }

        didDrag = true;
        setIsDragging(true);
      }

      setPosition({
        x: nextX,
        y: nextY,
      });
    };
    const handleMouseUp = (e: MouseEvent) => {
      const finalX = e.pageX - startX;
      const finalY = e.pageY - startY;

      if (!didDrag) {
        handlePickup(blockId, hourSpan);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        return;
      }

      setIsDragging(false);
      handlePickup(blockId, hourSpan);
      setPosition(handleDrop(blockId, finalX, finalY, hourSpan, gridProps));
      

      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <motion.div
      layout="position"
      transition={isDragging ? { duration: 0 } : layoutTransitionConfig}
      variants={variants ?? blockItemVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      whileHover={!isDragging && isEditModeEnabled ? { scale: 1.02 } : undefined}
      whileTap={!isDragging && isEditModeEnabled ? { scale: 0.98 } : undefined}
      onMouseDown={handleMouseDown}
      className="tt-class-block"
      style={{
        position: "absolute",
        width: blockWidth,
        height: blockHeight,
        backgroundColor: classDisplayColor,
        color: "#ffffff",
        textShadow: "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        left: Math.round(position.x) + VISUAL_OFFSET_X - renderLeftOffset,
        top: Math.round(position.y) + VISUAL_OFFSET_Y - renderTopOffset,
        cursor: isEditModeEnabled ? (isDragging ? "grabbing" : "grab") : "default",
        pointerEvents: isDragging ? "none" : "auto",
        borderRadius: 0,
        userSelect: "none",
        boxShadow: isDragging ? "var(--class-shadow-drag)" : "var(--class-shadow-rest)",
        transition: isDragging
          ? "none"
          : "left 240ms ease, top 240ms ease, width 240ms ease, height 240ms ease, box-shadow 200ms ease, filter 200ms ease",
        fontSize: "11px",
        fontWeight: 600,
        letterSpacing: "0.2px",
        textAlign: "center",
        padding: "6px 10px",
        filter: isDragging ? "brightness(1.06)" : "none",
        overflow: "hidden",
      }}
      >
      <span>{text}</span>
        {extraInfo ? <small className="tt-class-sub">{extraInfo}</small> : null}
    </motion.div>
  );
}