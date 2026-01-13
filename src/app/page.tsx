'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Play,
  Pause,
  RotateCcw,
  StepForward,
  StepBack,
  Github,
  Terminal,
  Variable,
  Code2,
  Zap,
  Lightbulb,
  GraduationCap,
  History,
  Cpu,
  BrainCircuit,
  Settings2
} from 'lucide-react';

// --- Types ---
interface State {
  line: number;
  variables: Record<string, any>;
  output: string[];
  description: string;
}

// --- Sample Program (DNCL Specification) ---
/*
合計 = 0
i を 1 から 5 まで 1 ずつ増やしながら繰り返す:
    合計 = 合計 + i
    「i は 」, i, 「 合計は 」, 合計 を表示する
*/

const SAMPLE_CODE = [
  "合計 = 0",
  "i を 1 から 5 まで 1 ずつ増やしながら繰り返す:",
  "    合計 = 合計 + i",
  "    「i = 」, i, 「 : 合計 = 」, 合計 を表示する",
  "もし 合計 > 10 ならば:",
  "    「10を超えました」を表示する",
  "そうでなければ:",
  "    「10以下です」を表示する"
];

const generateSteps = (): State[] => {
  const steps: State[] = [];
  let vars: Record<string, any> = { 合計: 0, i: 0 };
  let logs: string[] = [];

  // Step 0: Init
  steps.push({ line: 0, variables: { ...vars }, output: [...logs], description: "変数を初期化します。" });

  // Line 1: 合計 = 0
  vars.合計 = 0;
  steps.push({ line: 1, variables: { ...vars }, output: [...logs], description: "『合計』に0を代入します。" });

  // Line 2: Loop Start
  for (let val = 1; val <= 5; val++) {
    vars.i = val;
    steps.push({ line: 2, variables: { ...vars }, output: [...logs], description: `繰り返し: i = ${val} として開始します。` });

    // Line 3: 合計 = 合計 + i
    vars.合計 += vars.i;
    steps.push({ line: 3, variables: { ...vars }, output: [...logs], description: `合計に i (${vars.i}) を足します。` });

    // Line 4: 表示する
    logs.push(`i = ${vars.i} : 合計 = ${vars.合計}`);
    steps.push({ line: 4, variables: { ...vars }, output: [...logs], description: "計算結果を画面に表示します。" });
  }

  // Line 5: もし
  steps.push({ line: 5, variables: { ...vars }, output: [...logs], description: "条件判定: 合計が10より大きいか調べます。" });
  if (vars.合計 > 10) {
    // Line 6
    logs.push("10を超えました");
    steps.push({ line: 6, variables: { ...vars }, output: [...logs], description: "条件成立: メッセージを表示します。" });
  } else {
    // Line 8
    logs.push("10以下です");
    steps.push({ line: 8, variables: { ...vars }, output: [...logs], description: "条件不成立: メッセージを表示します。" });
  }

  return steps;
};

export default function DNCLStudio() {
  const [steps, setSteps] = useState<State[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(800);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setSteps(generateSteps());
  }, []);

  const reset = useCallback(() => {
    setCurrentIdx(0);
    setIsPlaying(false);
  }, []);

  const stepForward = useCallback(() => setCurrentIdx(prev => Math.min(prev + 1, steps.length - 1)), [steps.length]);
  const stepBackward = useCallback(() => setCurrentIdx(prev => Math.max(prev - 1, 0)), []);

  useEffect(() => {
    if (isPlaying && currentIdx < steps.length - 1) {
      timerRef.current = setInterval(() => {
        setCurrentIdx(prev => {
          if (prev >= steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1001 - speed);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPlaying, currentIdx, steps.length, speed]);

  const step = steps[currentIdx] || { line: 0, variables: {}, output: [], description: '' };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 font-sans selection:bg-indigo-500/30">
      {/* Header */}
      <header className="border-b border-white/5 bg-slate-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <GraduationCap className="text-slate-950 w-5 h-5" />
            </div>
            <h1 className="font-black italic tracking-tighter text-xl uppercase tracking-widest text-indigo-400">DNCL_Studio</h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-4 text-[10px] mono uppercase text-slate-500 font-black tracking-widest">
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-indigo-400 animate-pulse' : 'bg-slate-800'}`} />
                {isPlaying ? 'Executing' : 'Standby'}
              </div>
            </div>
            <a href="https://github.com/iidaatcnt/dncl-studio" target="_blank" rel="noreferrer" className="text-slate-600 hover:text-white transition-colors">
              <Github size={20} />
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left: Code & Console */}
        <div className="lg:col-span-7 flex flex-col gap-8">

          <div className="glass-panel rounded-[2.5rem] p-10 flex flex-col gap-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Code2 className="text-indigo-400 w-5 h-5" />
                <h2 className="font-black text-[10px] uppercase tracking-widest text-slate-400">Source_Program // DNCL</h2>
              </div>
              <div className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-black text-indigo-400 uppercase tracking-widest">
                共通テスト：情報I 仕様
              </div>
            </div>

            <div className="relative bg-black/40 rounded-3xl border border-white/5 p-8 font-mono text-[13px] leading-relaxed overflow-hidden">
              {SAMPLE_CODE.map((text, i) => {
                const lineNum = i + 1;
                const isActive = step.line === lineNum;
                return (
                  <div key={i} className={`flex gap-6 transition-all duration-300 ${isActive ? 'bg-indigo-500/10 -mx-8 px-8 border-l-4 border-indigo-500 text-indigo-100 font-bold' : 'text-slate-500'}`}>
                    <span className="w-6 text-right opacity-30 select-none">{lineNum}</span>
                    <pre className="whitespace-pre-wrap">{text}</pre>
                  </div>
                );
              })}
              {/* Highlight Pulse */}
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-indigo-500/5 to-transparent h-20 blur-xl opacity-20" />
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <Terminal className="text-emerald-400 w-4 h-4" />
                <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Execution_Result</h3>
              </div>
              <div className="bg-slate-950/80 rounded-2xl border border-white/5 p-6 min-h-[120px] font-mono text-xs text-emerald-400/90 leading-loose flex flex-col-reverse justify-end overflow-auto h-40 scrollbar-hide">
                {step.output.slice().reverse().map((line, i) => (
                  <div key={i} className="flex gap-4">
                    <span className="opacity-30">❯</span>
                    <span>{line}</span>
                  </div>
                ))}
                {step.output.length === 0 && <span className="opacity-20 italic">出力待ち...</span>}
              </div>
            </div>
          </div>

          <div className="glass-panel p-8 rounded-[2.5rem] flex flex-col gap-8">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex items-center gap-2">
                <button onClick={stepBackward} className="p-4 bg-slate-800 rounded-2xl hover:bg-slate-700 transition-colors text-slate-400"><StepBack size={20} /></button>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-20 h-20 bg-indigo-600 text-white rounded-[2rem] flex items-center justify-center hover:bg-indigo-400 transition-all active:scale-95 shadow-xl shadow-indigo-500/20"
                >
                  {isPlaying ? <Pause fill="currentColor" size={24} /> : <Play fill="currentColor" size={24} className="ml-1" />}
                </button>
                <button onClick={stepForward} className="p-4 bg-slate-800 rounded-2xl hover:bg-slate-700 transition-colors text-slate-400"><StepForward size={20} /></button>
                <button onClick={reset} className="p-4 bg-slate-800 rounded-2xl hover:bg-slate-700 transition-colors text-slate-400 ml-4"><RotateCcw size={20} /></button>
              </div>

              <div className="flex-1 w-full">
                <div className="flex items-center justify-between mono text-[10px] text-slate-500 uppercase font-black tracking-widest mb-3 px-1">
                  <span>Execution Speed</span>
                  <span className="text-indigo-400">{speed}ms</span>
                </div>
                <input type="range" min="100" max="980" value={speed} onChange={(e) => setSpeed(parseInt(e.target.value))} className="w-full appearance-none bg-slate-800 h-1.5 rounded-full accent-indigo-500 cursor-pointer" />
              </div>
            </div>

            <div className="p-6 bg-indigo-500/5 rounded-2xl border border-indigo-500/10 flex gap-4">
              <div className="mt-1 p-2 bg-indigo-500/10 rounded-xl shrink-0">
                <Zap size={16} className="text-indigo-400" />
              </div>
              <p className="text-sm text-slate-400 leading-relaxed font-medium italic">
                {step.description || "実行を開始すると、アルゴリズムの挙動がここに詳しく表示されます。"}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Variable Map & Concepts */}
        <div className="lg:col-span-5 flex flex-col gap-8">

          <div className="glass-panel p-10 rounded-[3rem] shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <Cpu size={120} className="text-indigo-500" />
            </div>

            <div className="flex items-center gap-3 mb-10">
              <Variable className="text-indigo-400 w-5 h-5" />
              <h2 className="font-black text-[10px] uppercase tracking-widest text-slate-400">Memory_Status</h2>
            </div>

            <div className="flex flex-col gap-4">
              {Object.entries(step.variables).map(([key, val]) => (
                <motion.div
                  key={key}
                  layout
                  className="flex items-center justify-between p-6 bg-white/5 border border-white/5 rounded-3xl"
                >
                  <div className="flex flex-col">
                    <span className="text-[10px] mono text-slate-600 font-bold uppercase tracking-widest mb-1">{key}</span>
                    <span className="text-[9px] text-indigo-400/50 font-black">INTEGER</span>
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={val}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-2xl font-black text-white px-6 py-2 bg-indigo-500/10 rounded-2xl border border-indigo-500/20"
                    >
                      {val}
                    </motion.div>
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>

            <div className="mt-12 p-8 bg-black/40 rounded-[2rem] border border-white/5">
              <div className="flex items-center gap-2 mb-4">
                <Settings2 size={16} className="text-slate-600" />
                <span className="text-[9px] mono font-black text-slate-500 uppercase tracking-widest">Logic Insight</span>
              </div>
              <div className="flex gap-4">
                <div className="flex-1 text-center p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="text-[10px] text-slate-600 mb-1">LOOP</div>
                  <div className="text-xs font-black text-indigo-400">{step.variables.i} / 5</div>
                </div>
                <div className="flex-1 text-center p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="text-[10px] text-slate-600 mb-1">BRANCH</div>
                  <div className="text-xs font-black text-emerald-400">{step.variables.合計 > 10 ? 'True' : 'False'}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel p-10 rounded-[3rem] shadow-2xl">
            <div className="flex items-center gap-3 mb-8">
              <Lightbulb className="text-amber-400 w-5 h-5" />
              <h2 className="font-black text-xs uppercase tracking-[0.2em] text-slate-400">Concept_Guide</h2>
            </div>
            <div className="p-6 bg-black/40 rounded-3xl border border-white/5 mb-8">
              <h3 className="text-indigo-400 font-black mb-3 text-sm italic">DNCLとは？</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                「大学入学共通テスト手順記述標準言語」の略称。特定のプログラミング言語に依存せず、アルゴリズムの論理構成を学ぶために設計されました。
                日本語に近い記述ながら、厳密な論理構造を持っています。
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3 group">
                <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                  <Zap size={14} />
                </div>
                <span className="text-[10px] mono font-black text-slate-500 uppercase tracking-widest">配列の処理をマスター</span>
              </div>
              <div className="flex items-center gap-3 group">
                <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                  <Zap size={14} />
                </div>
                <span className="text-[10px] mono font-black text-slate-500 uppercase tracking-widest">関数の再帰をイメージ</span>
              </div>
            </div>
          </div>

        </div>
      </main>

      <footer className="mt-20 border-t border-white/5 py-20 bg-slate-950/50">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-6">
          <BrainCircuit className="text-slate-800 w-12 h-12" />
          <p className="text-[8px] mono text-slate-700 uppercase tracking-[0.8em]">DNCL_Studio // Future_Education_Lab</p>
        </div>
      </footer>
    </div>
  );
}
