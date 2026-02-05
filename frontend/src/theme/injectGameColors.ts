import { GAME_COLORS } from "./gameColors";

/**
 * Injects game colors as CSS custom properties so that index.css
 * (e.g. .cell-sunk-fire, .cell-sunk-burned) can use them without hardcoding hex.
 */
export function injectGameColors(): void {
  const root = document.documentElement;
  root.style.setProperty("--game-sunk-fire-start", GAME_COLORS.sunkFireStart);
  root.style.setProperty("--game-sunk-fire-mid", GAME_COLORS.sunkFireMid);
  root.style.setProperty("--game-sunk-fire-end", GAME_COLORS.sunkFireEnd);
  root.style.setProperty("--game-sunk-fire-border", GAME_COLORS.sunkFireBorder);
  root.style.setProperty("--game-sunk-fire-shadow", GAME_COLORS.sunkFireShadow);
  root.style.setProperty("--game-sunk-burned-start", GAME_COLORS.sunkBurnedStart);
  root.style.setProperty("--game-sunk-burned-end", GAME_COLORS.sunkBurnedEnd);
  root.style.setProperty("--game-sunk-burned-border", GAME_COLORS.sunkBurnedBorder);
  root.style.setProperty("--game-sunk-burned-text", GAME_COLORS.sunkBurnedText);
  root.style.setProperty("--game-hover", GAME_COLORS.hover);
  root.style.setProperty("--game-hover-border", GAME_COLORS.hoverBorder);
}
