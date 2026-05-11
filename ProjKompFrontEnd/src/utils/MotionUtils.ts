/**
 * MotionUtils.ts
 * Re-export ze skonsolidowanej konfiguracji Framer Motion w MotionConfig.ts
 * 
 * UWAGA: Ten plik jest utrzymywany dla backward compatibility.
 * Nowy kod powinien importować bezpośrednio z MotionConfig.ts
 */

// Re-export wszystkie warianty i konfiguracje z MotionConfig
export {
  // Transitions
  springTransition,
  quickSpringTransition,
  layoutTransitionConfig,
  springTransitionConfig,
  quickSpringTransitionConfig,
  delicateSpringTransitionConfig,
  quickTransitionConfig,
  // Easing & Duration
  LAYOUT_EASE,
  LAYOUT_DURATION,
  // Variants
  surfaceContainerVariants,
  rightPanelVariants,
  rightPanelVariantsScaleIn,
  binPanelVariants,
  blockItemVariants,
  blockListVariants,
  gridContainerVariants,
  weekendRowVariants,
  // Micro-interactions
  hoverTapScale,
  hoverTapScaleGentle,
  // AnimatePresence modes
  PANEL_ANIMATE_PRESENCE_MODE,
  LIST_ANIMATE_PRESENCE_MODE,
  // Helpers
  getTransitionConfig,
  type TransitionType,
} from "./MotionConfig";
