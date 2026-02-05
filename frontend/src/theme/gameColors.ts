/**
 * Single source of truth for all game-related colors.
 * Used by: BoardGrid, GameScreen (fleet legend), ShipPlacement, AiGameScreen,
 * and sunk-cell animation in CSS. No hardcoded hex values in components.
 */
export const GAME_COLORS = {
  /** Base ship color (boards + fleet legend) */
  ship: "#D4A373",
  /** Hit cell (same on player board, opponent board, legend) */
  hit: "#e08a3d",
  /** Hit cell text/icon (e.g. white dot) */
  hitText: "#ffffff",
  /** Miss cell background */
  miss: "rgba(33, 68, 52, 0.2)",
  /** Miss cell border */
  missBorder: "rgba(33, 68, 52, 0.3)",
  /** Miss dot (small circle) fill */
  missDot: "rgba(14, 165, 233, 0.4)",
  /** Miss dot border */
  missDotBorder: "rgba(14, 165, 233, 0.3)",
  /** Sunk ship (boards + fleet legend; unified) */
  sunk: "#3E2F20",
  /** Sunk cell border */
  sunkBorder: "#44403c",
  /** Sunk cell text/icon */
  sunkText: "#a8a29e",
  /** Grid line between cells */
  gridLine: "rgba(30, 61, 47, 0.25)",
  /** Placement preview – valid drop */
  previewValid: "rgba(34, 197, 94, 0.35)",
  /** Placement preview – valid drop border */
  previewValidBorder: "rgba(34, 197, 94, 0.6)",
  /** Placement preview – invalid drop */
  previewInvalid: "rgba(239, 68, 68, 0.35)",
  /** Placement preview – invalid drop border */
  previewInvalidBorder: "rgba(239, 68, 68, 0.6)",
  /** Placement – overlap / invalid placed ship warning (amber) */
  placementWarning: "rgba(245, 158, 11, 0.2)",
  placementWarningBorder: "rgba(245, 158, 11, 0.5)",
  /** Placement – current ship highlight (accent) */
  previewActive: "rgba(224, 138, 61, 0.25)",
  /** Placement – current ship highlight border */
  previewActiveBorder: "rgba(224, 138, 61, 0.6)",
  /** Hover on attack cell (clickable) */
  hover: "rgba(224, 138, 61, 0.2)",
  /** Hover border on attack cell */
  hoverBorder: "rgba(224, 138, 61, 0.5)",
  /** Disabled cell (e.g. not your turn) */
  disabledOpacity: 0.7,
  /** Empty / unknown cell background (boards) */
  emptyCell: "rgba(245, 239, 228, 0.9)",
  /** Labels, titles, headings (board titles, “Your board”, etc.) */
  label: "#1E3D2F",
  /** Result screen – winner heading */
  resultWinner: "#1E3D2F",
  /** Result screen – loser heading (muted) */
  resultLoser: "#57534e",
  /** Primary button (e.g. Confirm placement, Start Game) */
  buttonPrimary: "#1E3D2F",
  buttonPrimaryHover: "#2A523F",
  /** Secondary button (e.g. Randomize fleet) */
  buttonSecondary: "#8B6F47",
  buttonSecondaryHover: "rgba(139, 111, 71, 0.1)",
  /** Rotation rejected / error text */
  rotationRejected: "#ef4444",
  rotationRejectedBg: "rgba(239, 68, 68, 0.15)",
  rotationRejectedBorder: "#ef4444",
  /** Sunk animation – fire phase gradient start */
  sunkFireStart: "#c2410c",
  /** Sunk animation – fire phase gradient mid */
  sunkFireMid: "#ea580c",
  /** Sunk animation – fire phase gradient end */
  sunkFireEnd: "#f97316",
  /** Sunk animation – fire phase border */
  sunkFireBorder: "#9a3412",
  /** Sunk animation – fire phase shadow */
  sunkFireShadow: "rgba(251, 146, 60, 0.5)",
  /** Sunk animation – burned phase gradient start */
  sunkBurnedStart: "#292524",
  /** Sunk animation – burned phase gradient end */
  sunkBurnedEnd: "#1c1917",
  /** Sunk animation – burned phase border */
  sunkBurnedBorder: "#44403c",
  /** Sunk animation – burned phase text */
  sunkBurnedText: "#a8a29e"
} as const;

export type GameColors = typeof GAME_COLORS;
