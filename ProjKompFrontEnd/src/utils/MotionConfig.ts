/**
 * MotionConfig.ts
 * Centralna konfiguracja animacji Framer Motion dla aplikacji "Wirtualny Plan Zajęć"
 * 
 * Motion Design System:
 * - Smooth cubic-bezier easing dla głównych zmian layoutu
 * - Spring transitions dla naturalnych interakcji
 * - Konsekwentne timings dla spójności wizualnej
 */

import { Transition, Variants } from "framer-motion";

/**
 * Główne easing curve stosowane do wszystkich zmian layoutu
 * cubic-bezier(0.2, 0.8, 0.2, 1) - smooth, professional feel
 */
export const LAYOUT_EASE = [0.2, 0.8, 0.2, 1] as const;

/**
 * Standard duration dla głównych przejść layoutu (ms)
 */
export const LAYOUT_DURATION = 0.35;

/**
 * Konfiguracja przejścia dla głównych zmian layoutu
 * Używane dla: siatki kalendarza, rozmiaru paneli, przejść stanów
 */
export const layoutTransitionConfig: Transition = {
  type: "tween",
  ease: LAYOUT_EASE,
  duration: LAYOUT_DURATION,
};

/**
 * Spring transition dla naturalnych, elastycznych animacji
 * Używane dla: pojawiania się elementów, mikro-interakcji
 */
export const springTransitionConfig: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
  mass: 1,
};

/**
 * Szybszy spring dla responsywnych interakcji
 * Używane dla: hover/tap effects, szybkie feedbacki
 */
export const quickSpringTransitionConfig: Transition = {
  type: "spring",
  stiffness: 360,
  damping: 26,
  mass: 0.8,
};

/**
 * Powolny spring dla delikatnych, eleganckich przejść
 * Używane dla: slideOut paneli, opóźnione animacje
 */
export const delicateSpringTransitionConfig: Transition = {
  type: "spring",
  stiffness: 200,
  damping: 40,
  mass: 1.2,
};

/**
 * Szybkie przejście dla UI feedbacku (np. toast, alerts)
 */
export const quickTransitionConfig: Transition = {
  type: "tween",
  ease: LAYOUT_EASE,
  duration: 0.2,
};

/**
 * ============================================
 * CONTAINER / LAYOUT VARIANTS
 * ============================================
 */

/**
 * Warianty dla głównego kontenera (tt-surface)
 * Obsługuje przejścia między stanami View 1, View 2, View 3
 */
export const surfaceContainerVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: layoutTransitionConfig,
  },
  exit: {
    opacity: 0,
    transition: layoutTransitionConfig,
  },
};

/**
 * ============================================
 * PANEL ANIMATIONS
 * ============================================
 */

/**
 * Prawy panel (szczegóły zajęcia) - wysuwanie z prawej strony
 * View 3: wjeżdża z prawej (x: "100%"), wyjeżdża w prawo (x: "100%")
 */
export const rightPanelVariants: Variants = {
  initial: {
    x: "100%",
    opacity: 0,
    scaleX: 0.96,
  },
  animate: {
    x: 0,
    opacity: 1,
    scaleX: 1,
    transition: {
      ...layoutTransitionConfig,
      delay: 0.05,
    },
  },
  exit: {
    x: 0,
    opacity: 0,
    scaleX: 0.96,
    transition: {
      ...layoutTransitionConfig,
      delay: 0,
    },
  },
};

/**
 * Alternatywny wariant dla prawego panelu z scale effect (bardziej elegancki)
 */
export const rightPanelVariantsScaleIn: Variants = {
  initial: {
    x: "100%",
    opacity: 0,
    scaleX: 0.96,
  },
  animate: {
    x: 0,
    opacity: 1,
    scaleX: 1,
    transition: layoutTransitionConfig,
  },
  exit: {
    x: 0,
    opacity: 0,
    scaleX: 0.96,
    transition: layoutTransitionConfig,
  },
};

/**
 * Bin/Kosz (dolny panel w View 2) - wysuwanie z dołu
 * Wjeżdża z y: 50 do y: 0
 */
export const binPanelVariants: Variants = {
  initial: {
    y: 50,
    opacity: 0,
    scaleY: 0.85,
  },
  animate: {
    y: 0,
    opacity: 1,
    scaleY: 1,
    transition: {
      ...layoutTransitionConfig,
      delay: 0.1,
    },
  },
  exit: {
    y: 50,
    opacity: 0,
    scaleY: 0.85,
    transition: {
      ...layoutTransitionConfig,
      delay: 0,
    },
  },
};

/**
 * ============================================
 * BLOCK / ITEM ANIMATIONS
 * ============================================
 */

/**
 * Warianty dla pojedynczego bloku zajęć
 * Obsługuje pojawianie się, hover, tap, active state
 */
export const blockItemVariants: Variants = {
  initial: {
    opacity: 0,
    x: -12,
    scale: 0.95,
  },
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: springTransitionConfig,
  },
  exit: {
    opacity: 0,
    x: -12,
    scale: 0.95,
    transition: quickSpringTransitionConfig,
  },
  hover: {
    scale: 1.02,
    transition: quickSpringTransitionConfig,
  },
  tap: {
    scale: 0.98,
    transition: quickSpringTransitionConfig,
  },
  active: {
    boxShadow: "0 0 0 2px var(--accent-primary), 0 4px 12px rgba(0, 0, 0, 0.15)",
    transition: layoutTransitionConfig,
  },
};

/**
 * Warianty dla listy bloków - stagger effect
 */
export const blockListVariants: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.045,
      delayChildren: 0.06,
    },
  },
  exit: {
    transition: {
      staggerChildren: 0.025,
      staggerDirection: -1,
    },
  },
};

/**
 * ============================================
 * GRID / LAYOUT VARIANTS
 * ============================================
 */

/**
 * Warianty dla siatki kalendarza
 * Obsługuje płynne przejścia przy zmianie rozmiaru i layoutu
 */
export const gridContainerVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: layoutTransitionConfig,
  },
};

/**
 * Warianty dla rzędu weekendu (większa wysokość)
 */
export const weekendRowVariants: Variants = {
  initial: {
    scaleY: 0,
    opacity: 0,
  },
  animate: {
    scaleY: 1,
    opacity: 1,
    transition: { ...layoutTransitionConfig, duration: 0.4 },
  },
  exit: {
    scaleY: 0,
    opacity: 0,
    transition: { ...layoutTransitionConfig, duration: 0.3 },
  },
};

/**
 * ============================================
 * INTERACTIVE MICRO-INTERACTIONS
 * ============================================
 */

/**
 * Standardowy hover + tap effect dla przycisków
 */
export const hoverTapScale = {
  whileHover: { scale: 1.05 },
  whileTap: { scale: 0.95 },
  transition: quickSpringTransitionConfig,
} as const;

/**
 * Delikatny hover effect dla kafelków (mniejszy skok)
 */
export const hoverTapScaleGentle = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.98 },
  transition: quickSpringTransitionConfig,
} as const;

/**
 * ============================================
 * ANIMATE PRESENCE CONFIGURATIONS
 * ============================================
 */

/**
 * Tryb AnimatePresence dla paneli bocznych
 * mode="popLayout" - layout animation, potem exit animation
 * mode="wait" - czeka na exit przed wejściem nowego
 */
export const PANEL_ANIMATE_PRESENCE_MODE = "popLayout" as const;

/**
 * Konfiguracja dla pojawiania się listy elementów
 */
export const LIST_ANIMATE_PRESENCE_MODE = "popLayout" as const;

/**
 * ============================================
 * HELPER: Transition Config Selector
 * Wybiera odpowiednią konfigurację na podstawie typu animacji
 * ============================================
 */

export type TransitionType = 
  | "layout" 
  | "spring" 
  | "springQuick" 
  | "springDelicate"
  | "quickTween";

export function getTransitionConfig(type: TransitionType): Transition {
  const configs: Record<TransitionType, Transition> = {
    layout: layoutTransitionConfig,
    spring: springTransitionConfig,
    springQuick: quickSpringTransitionConfig,
    springDelicate: delicateSpringTransitionConfig,
    quickTween: quickTransitionConfig,
  };
  return configs[type];
}

/**
 * ============================================
 * EXPORT BACKWARD COMPATIBILITY
 * Eksportuj stare nazwy dla kompatybilności z istniejącym kodem
 * ============================================
 */

export const springTransition = springTransitionConfig;
export const quickSpringTransition = quickSpringTransitionConfig;
