import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const GRID_COLS = 6;
export const GRID_ROWS = 10;
export const INITIAL_ROWS = 4;
export const MAX_TARGET = 30;
export const MIN_TARGET = 10;

export type GameMode = 'classic' | 'time';

export interface Block {
  id: string;
  value: number;
  row: number;
  col: number;
  isRemoving?: boolean;
}

export interface GameState {
  grid: Block[];
  target: number;
  score: number;
  selectedIds: string[];
  status: 'start' | 'playing' | 'gameover';
  mode: GameMode;
  timeLeft: number;
  level: number;
}
