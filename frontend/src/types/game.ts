export type SinkingPhase = "fire" | "burned";

export interface SinkingAnimation {
  phase: SinkingPhase;
  cells: Array<{ x: number; y: number }>;
  board: "own" | "opponent";
}
