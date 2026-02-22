/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  RotateCcw, 
  Play, 
  Timer, 
  Zap, 
  AlertCircle,
  ChevronRight,
  Pause
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  cn, 
  GRID_COLS, 
  GRID_ROWS, 
  INITIAL_ROWS, 
  MAX_TARGET, 
  MIN_TARGET, 
  type Block, 
  type GameMode, 
  type GameState 
} from './types';

const generateId = () => Math.random().toString(36).substring(2, 9);

const getRandomValue = () => Math.floor(Math.random() * 9) + 1;

const generateTarget = () => Math.floor(Math.random() * (MAX_TARGET - MIN_TARGET + 1)) + MIN_TARGET;

export default function App() {
  const [state, setState] = useState<GameState>({
    grid: [],
    target: generateTarget(),
    score: 0,
    selectedIds: [],
    status: 'start',
    mode: 'classic',
    timeLeft: 10,
    level: 1,
  });

  const [highScore, setHighScore] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load high score
  useEffect(() => {
    const saved = localStorage.getItem('sum_eliminate_highscore');
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  // Save high score
  useEffect(() => {
    if (state.score > highScore) {
      setHighScore(state.score);
      localStorage.setItem('sum_eliminate_highscore', state.score.toString());
    }
  }, [state.score, highScore]);

  const initGame = (mode: GameMode) => {
    const initialGrid: Block[] = [];
    for (let r = 0; r < INITIAL_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        initialGrid.push({
          id: generateId(),
          value: getRandomValue(),
          row: GRID_ROWS - 1 - r,
          col: c,
        });
      }
    }
    setState({
      grid: initialGrid,
      target: generateTarget(),
      score: 0,
      selectedIds: [],
      status: 'playing',
      mode,
      timeLeft: mode === 'time' ? 10 : 0,
      level: 1,
    });
  };

  const addRow = useCallback(() => {
    setState(prev => {
      if (prev.status !== 'playing') return prev;
      
      // Check if any block is at the top row (row 0)
      const isFull = prev.grid.some(b => b.row === 0);
      if (isFull) {
        return { ...prev, status: 'gameover' };
      }

      const newGrid = prev.grid.map(b => ({ ...b, row: b.row - 1 }));
      for (let c = 0; c < GRID_COLS; c++) {
        newGrid.push({
          id: generateId(),
          value: getRandomValue(),
          row: GRID_ROWS - 1,
          col: c,
        });
      }
      
      const nextTime = Math.max(3, 10 - Math.floor(prev.level / 10));
      return { 
        ...prev, 
        grid: newGrid, 
        timeLeft: prev.mode === 'time' ? nextTime : 0 
      };
    });
  }, []);

  // Timer logic for Time Mode
  useEffect(() => {
    if (state.status === 'playing' && state.mode === 'time') {
      timerRef.current = setInterval(() => {
        setState(prev => {
          if (prev.timeLeft <= 1) {
            // Time's up, add row
            return { ...prev, timeLeft: 0 }; // Trigger addRow via another effect or just here
          }
          return { ...prev, timeLeft: prev.timeLeft - 1 };
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state.status, state.mode]);

  // Handle time out
  useEffect(() => {
    if (state.mode === 'time' && state.timeLeft === 0 && state.status === 'playing') {
      addRow();
    }
  }, [state.timeLeft, state.mode, state.status, addRow]);

  const handleBlockClick = (id: string) => {
    if (state.status !== 'playing') return;

    setState(prev => {
      const isSelected = prev.selectedIds.includes(id);
      let newSelectedIds: string[];

      if (isSelected) {
        newSelectedIds = prev.selectedIds.filter(sid => sid !== id);
      } else {
        newSelectedIds = [...prev.selectedIds, id];
      }

      const currentSum = newSelectedIds.reduce((sum, sid) => {
        const block = prev.grid.find(b => b.id === sid);
        return sum + (block?.value || 0);
      }, 0);

      if (currentSum === prev.target) {
        // Success!
        confetti({
          particleCount: 40,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#34d399', '#6ee7b7']
        });

        const remainingGrid = prev.grid.filter(b => !newSelectedIds.includes(b.id));
        
        // In classic mode, add a row after success
        if (prev.mode === 'classic') {
          // We'll use a timeout or a state update to handle the row addition after animation
          setTimeout(() => addRow(), 300);
        }

        return {
          ...prev,
          grid: remainingGrid,
          score: prev.score + currentSum * newSelectedIds.length,
          selectedIds: [],
          target: generateTarget(),
          level: prev.level + 1,
          timeLeft: prev.mode === 'time' ? Math.max(5, 10 - Math.floor(prev.level / 5)) : 0
        };
      }

      if (currentSum > prev.target) {
        // Exceeded target, reset selection
        return { ...prev, selectedIds: [] };
      }

      return { ...prev, selectedIds: newSelectedIds };
    });
  };

  const currentSum = state.selectedIds.reduce((sum, id) => {
    const block = state.grid.find(b => b.id === id);
    return sum + (block?.value || 0);
  }, 0);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-neutral-950">
      {/* Game Header */}
      <div className="w-full max-w-md mb-6 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setState(s => ({ ...s, status: 'start' }))}
              className="p-2 bg-emerald-500/20 rounded-lg hover:bg-emerald-500/30 transition-colors"
            >
              <Zap className="w-5 h-5 text-emerald-400" />
            </button>
            <div>
              <h1 className="text-xl font-bold font-display tracking-tight">数字消除</h1>
              <p className="text-xs text-neutral-500 uppercase tracking-widest">{state.mode === 'classic' ? '经典模式' : '极速模式'}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-neutral-500 uppercase font-medium">最高分</p>
              <p className="text-xl font-mono font-bold text-emerald-400">{highScore}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="glass-panel p-4 flex flex-col items-center justify-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="text-xs text-neutral-500 uppercase mb-1 font-semibold">目标值</span>
            <span className="text-4xl font-display font-bold text-white">{state.target}</span>
          </div>
          <div className="glass-panel p-4 flex flex-col items-center justify-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="text-xs text-neutral-500 uppercase mb-1 font-semibold">当前总和</span>
            <motion.span 
              animate={currentSum > state.target ? { x: [0, -10, 10, -10, 10, 0] } : {}}
              className={cn(
                "text-4xl font-display font-bold transition-colors",
                currentSum > state.target ? "text-red-400" : "text-blue-400"
              )}
            >
              {currentSum}
            </motion.span>
          </div>
        </div>

        {state.mode === 'time' && state.status === 'playing' && (
          <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-amber-500"
              initial={{ width: '100%' }}
              animate={{ width: `${(state.timeLeft / (Math.max(5, 10 - Math.floor(state.level / 5)))) * 100}%` }}
              transition={{ duration: 1, ease: "linear" }}
            />
          </div>
        )}
      </div>

      {/* Game Board */}
      <div className="relative w-full max-w-md aspect-[6/10] glass-panel p-2 bg-neutral-900/50">
        <div className="game-grid h-full w-full relative">
          {/* Background Grid Lines */}
          <div className="absolute inset-0 grid grid-cols-6 grid-rows-10 pointer-events-none opacity-20">
            {Array.from({ length: 60 }).map((_, i) => (
              <div key={i} className="border-[0.5px] border-neutral-700" />
            ))}
          </div>

          <AnimatePresence>
            {state.grid.map((block) => (
              <motion.button
                key={block.id}
                layoutId={block.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: 1, 
                  opacity: 1,
                  gridRowStart: block.row + 1,
                  gridColumnStart: block.col + 1,
                }}
                exit={{ scale: 0, opacity: 0 }}
                onClick={() => handleBlockClick(block.id)}
                className={cn(
                  "w-full h-full flex items-center justify-center rounded-lg text-xl font-bold font-mono transition-all duration-200 shadow-lg",
                  state.selectedIds.includes(block.id)
                    ? "bg-emerald-500 text-white scale-95 ring-4 ring-emerald-500/30 z-10"
                    : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700 active:scale-90"
                )}
                style={{
                  gridRow: block.row + 1,
                  gridColumn: block.col + 1,
                }}
              >
                {block.value}
              </motion.button>
            ))}
          </AnimatePresence>
        </div>

        {/* Overlays */}
        <AnimatePresence>
          {state.status === 'start' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-neutral-950/90 backdrop-blur-sm rounded-2xl p-8 text-center"
            >
              <Trophy className="w-16 h-16 text-emerald-400 mb-4" />
              <h2 className="text-3xl font-display font-bold mb-2">数字消除</h2>
              <p className="text-neutral-400 mb-8 text-sm">
                选择数字使其总和等于目标值。不要让方块堆积到顶部！
              </p>
              <div className="flex flex-col w-full gap-3">
                <button 
                  onClick={() => initGame('classic')}
                  className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors group"
                >
                  <Play className="w-5 h-5 fill-current" />
                  经典模式
                  <ChevronRight className="w-4 h-4 ml-auto mr-2 group-hover:translate-x-1 transition-transform" />
                </button>
                <button 
                  onClick={() => initGame('time')}
                  className="w-full py-4 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors group border border-white/10"
                >
                  <Timer className="w-5 h-5" />
                  极速挑战
                  <ChevronRight className="w-4 h-4 ml-auto mr-2 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          )}

          {state.status === 'gameover' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-red-950/90 backdrop-blur-md rounded-2xl p-8 text-center"
            >
              <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
              <h2 className="text-4xl font-display font-bold mb-2">游戏结束</h2>
              <div className="mb-8">
                <p className="text-red-200/60 uppercase text-xs tracking-widest font-bold mb-1">最终得分</p>
                <p className="text-5xl font-mono font-bold text-white">{state.score}</p>
              </div>
              <button 
                onClick={() => setState(s => ({ ...s, status: 'start' }))}
                className="w-full py-4 bg-white text-neutral-950 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-neutral-200 transition-colors"
              >
                <RotateCcw className="w-5 h-5" />
                再试一次
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Stats */}
      <div className="w-full max-w-md mt-6 flex justify-between items-center px-2">
        <div className="flex flex-col">
          <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">得分</span>
          <span className="text-2xl font-mono font-bold text-white">{state.score}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">等级</span>
          <span className="text-2xl font-mono font-bold text-white">{state.level}</span>
        </div>
      </div>
    </div>
  );
}
