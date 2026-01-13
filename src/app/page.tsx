'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  RotateCcw,
  Github,
  Terminal,
  Variable,
  Code2,
  Zap,
  GraduationCap,
  Cpu,
  Settings2,
  Edit3,
  CpuIcon,
  Pause
} from 'lucide-react';

// --- DNCL Interpreter Core ---
interface VMState {
  line: number;
  variables: Record<string, number>;
  output: string[];
  description: string;
}

const INITIAL_CODE = `合計 = 0
n = 5
i を 1 から n まで 1 ずつ増やしながら繰り返す:
    合計 = 合計 + i
    「i = 」, i, 「 : 合計 = 」, 合計 を表示する
もし 合計 > 10 ならば:
    「10を超えました」を表示する
そうでなければ:
    「10以下です」を表示する`;

export default function DNCLStudio() {
  const [code, setCode] = useState(INITIAL_CODE);
  const [steps, setSteps] = useState<VMState[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(800);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // --- The Compiler/Interpreter Engine ---
  const compileAndRun = useCallback((rawCode: string) => {
    const lines = rawCode.split('\n').map(l => l.trimEnd()); // Keep leading spaces for block detection
    const states: VMState[] = [];
    let vars: Record<string, number> = {};
    let logs: string[] = [];

    const addState = (lineIdx: number, desc: string) => {
      states.push({
        line: lineIdx + 1,
        variables: { ...vars },
        output: [...logs],
        description: desc
      });
    };

    try {
      setError(null);
      let i = 0;
      while (i < lines.length) {
        const line = lines[i].trim();
        if (!line || line.startsWith('//') || line.startsWith('#')) { i++; continue; }

        // 1. Assignment: 合計 = 0
        const assignMatch = line.match(/^([a-zA-Zあ-んア-ン一-龠]+)\s*=\s*(.+)$/);
        if (assignMatch && !line.includes('繰り返す') && !line.includes('ならば') && !line.includes('そうでなければ')) {
          const varName = assignMatch[1];
          let expr = assignMatch[2];

          // Simple expression evaluator
          const evalValue = (e: string) => {
            let processed = e;
            // Sort variable names by length descending to avoid partial matches (e.g., 'i' matching in 'i_val')
            const varNames = Object.keys(vars).sort((a, b) => b.length - a.length);
            varNames.forEach(v => {
              processed = processed.replace(new RegExp(`\\b${v}\\b`, 'g'), vars[v].toString());
            });
            try {
              // Basic math evaluation safely
              return Function(`"use strict"; return (${processed})`)();
            } catch { return 0; }
          };
          vars[varName] = evalValue(expr);
          addState(i, `変数 ${varName} に ${vars[varName]} を代入しました。`);
        }

        // 2. Loop: i を 1 から n まで 1 ずつ増やしながら繰り返す:
        const loopMatch = line.match(/^([a-zA-Zあ-んア-ン一-龠]+)\s*を\s*(.+)\s*から\s*(.+)\s*まで\s*(.+)\s*ずつ増やしながら繰り返す:$/);
        if (loopMatch) {
          const counter = loopMatch[1];
          const startExpr = loopMatch[2];
          const endExpr = loopMatch[3];
          const stepExpr = loopMatch[4];

          const evalExpr = (e: string) => {
            let p = e.trim();
            const varNames = Object.keys(vars).sort((a, b) => b.length - a.length);
            varNames.forEach(v => p = p.replace(new RegExp(`\\b${v}\\b`, 'g'), vars[v].toString()));
            try { return Function(`"use strict"; return (${p})`)(); } catch { return 0; }
          };

          const start = evalExpr(startExpr);
          const end = evalExpr(endExpr);
          const stepSize = evalExpr(stepExpr);

          const loopStartLine = i;

          // Identify block
          const blockLines: { idx: number, content: string }[] = [];
          let bodyIdx = i + 1;
          while (bodyIdx < lines.length && (lines[bodyIdx].startsWith('    ') || lines[bodyIdx].startsWith('\t') || lines[bodyIdx].trim() === '')) {
            if (lines[bodyIdx].trim() !== '') {
              blockLines.push({ idx: bodyIdx, content: lines[bodyIdx].trim() });
            }
            bodyIdx++;
          }

          for (let val = start; val <= end; val += stepSize) {
            vars[counter] = val;
            addState(loopStartLine, `繰り返し開始: ${counter} = ${val}`);

            for (const bl of blockLines) {
              const bLine = bl.content;
              if (bLine.includes('を表示する')) {
                const content = bLine.replace('を表示する', '').split(',').map(part => {
                  const p = part.trim();
                  if (p.startsWith('「') && p.endsWith('」')) return p.slice(1, -1);
                  const varNames = Object.keys(vars).sort((a, b) => b.length - a.length);
                  let processed = p;
                  varNames.forEach(v => processed = processed.replace(new RegExp(`\\b${v}\\b`, 'g'), vars[v].toString()));
                  try { return Function(`"use strict"; return (${processed})`)(); } catch { return p; }
                }).join('');
                logs.push(content);
                addState(bl.idx, "計算結果を出力しました。");
              } else if (bLine.match(/^([a-zA-Zあ-んア-ン一-龠]+)\s*=\s*(.+)$/)) {
                const bAssign = bLine.match(/^([a-zA-Zあ-んア-ン一-龠]+)\s*=\s*(.+)$/);
                if (bAssign) {
                  let proc = bAssign[2];
                  const varNames = Object.keys(vars).sort((a, b) => b.length - a.length);
                  varNames.forEach(v => proc = proc.replace(new RegExp(`\\b${v}\\b`, 'g'), vars[v].toString()));
                  vars[bAssign[1]] = Function(`"use strict"; return (${proc})`)();
                  addState(bl.idx, `${bAssign[1]} を更新しました。`);
                }
              }
            }
          }
          i = bodyIdx - 1; // Move pointer to end of block
        }

        // 3. Condition: もし 合計 > 10 ならば:
        const ifMatch = line.match(/^もし\s*(.+)\s*ならば:$/);
        if (ifMatch) {
          let cond = ifMatch[1];
          const varNames = Object.keys(vars).sort((a, b) => b.length - a.length);
          varNames.forEach(v => cond = cond.replace(new RegExp(`\\b${v}\\b`, 'g'), vars[v].toString()));
          const result = Function(`"use strict"; return (${cond})`)();
          addState(i, `条件判定: ${ifMatch[1]} は ${result ? '成立' : '不成立'} です。`);

          // Identify blocks
          let thenBlock: number[] = [];
          let elseBlock: number[] = [];
          let currIdx = i + 1;
          while (currIdx < lines.length && (lines[currIdx].startsWith('    ') || lines[currIdx].trim() === '')) {
            if (lines[currIdx].trim()) thenBlock.push(currIdx);
            currIdx++;
          }

          let hasElse = false;
          if (currIdx < lines.length && lines[currIdx].trim() === 'そうでなければ:') {
            hasElse = true;
            const elseHeaderIdx = currIdx;
            currIdx++;
            while (currIdx < lines.length && (lines[currIdx].startsWith('    ') || lines[currIdx].trim() === '')) {
              if (lines[currIdx].trim()) elseBlock.push(currIdx);
              currIdx++;
            }
          }

          const targetLines = result ? thenBlock : elseBlock;
          for (const tIdx of targetLines) {
            const tLine = lines[tIdx].trim();
            if (tLine.includes('を表示する')) {
              const content = tLine.replace('を表示する', '').split(',').map(part => {
                const p = part.trim();
                if (p.startsWith('「') && p.endsWith('」')) return p.slice(1, -1);
                const vn = Object.keys(vars).sort((a, b) => b.length - a.length);
                let processed = p;
                vn.forEach(v => processed = processed.replace(new RegExp(`\\b${v}\\b`, 'g'), vars[v].toString()));
                try { return Function(`"use strict"; return (${processed})`)(); } catch { return p; }
              }).join('');
              logs.push(content);
              addState(tIdx, "メッセージを出力しました。");
            }
          }
          i = currIdx - 1;
        }

        // 4. Print: 「...」 を表示する
        if (line.includes('を表示する') && !line.startsWith('    ')) {
          const content = line.replace('を表示する', '').split(',').map(part => {
            const p = part.trim();
            if (p.startsWith('「') && p.endsWith('」')) return p.slice(1, -1);
            const varNames = Object.keys(vars).sort((a, b) => b.length - a.length);
            let processed = p;
            varNames.forEach(v => processed = processed.replace(new RegExp(`\\b${v}\\b`, 'g'), vars[v].toString()));
            try { return Function(`"use strict"; return (${processed})`)(); } catch { return p; }
          }).join('');
          logs.push(content);
          addState(i, "メッセージを出力しました。");
        }

        i++;
      }

      addState(lines.length - 1, "実行が終了しました。");
      setSteps(states);
      setCurrentIdx(0);
    } catch (e) {
      console.error(e);
      setError("構文解析エラー: DNCLの記述、特に行頭のスペース（インデント）を確認してください。");
      setSteps([]);
    }
  }, []);

  const runCode = () => {
    compileAndRun(code);
    setIsPlaying(true);
  };

  const reset = useCallback(() => {
    setCurrentIdx(0);
    setIsPlaying(false);
  }, []);

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
      <header className="border-b border-white/5 bg-slate-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <GraduationCap className="text-slate-950 w-5 h-5" />
            </div>
            <h1 className="font-black italic tracking-tighter text-xl uppercase tracking-widest text-indigo-400">DNCL_Studio</h1>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={runCode} className="px-6 py-2 bg-indigo-500 hover:bg-indigo-400 text-slate-950 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20">
              <Zap size={14} className="fill-current" /> Run Logic
            </button>
            <a href="https://github.com/iidaatcnt/dncl-studio" target="_blank" rel="noreferrer" className="text-slate-600 hover:text-white transition-colors">
              <Github size={20} />
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left: Input Editor */}
        <div className="lg:col-span-7 flex flex-col gap-8">
          <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-10 flex flex-col gap-8 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-slate-400">
                <Edit3 size={18} />
                <h2 className="font-black text-[10px] uppercase tracking-[0.2em]">Academic_Editor_Core</h2>
              </div>
              {error && <span className="text-rose-400 text-[10px] font-black animate-pulse">!! {error}</span>}
            </div>

            <div className="relative group">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="DNCLプログラムを入力してください..."
                className="w-full h-[400px] bg-black/60 rounded-3xl border border-white/10 p-10 font-mono text-[14px] leading-relaxed text-indigo-100 outline-none focus:border-indigo-500/30 transition-all resize-none shadow-inner scrollbar-hide"
                spellCheck={false}
              />
              <div className="absolute top-4 right-6 opacity-20 text-[8px] mono font-black text-slate-500 uppercase tracking-widest">Compiler Input</div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <Terminal className="text-emerald-400 w-4 h-4" />
                <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Memory_Bus_Output</h3>
              </div>
              <div className="bg-black/80 rounded-2xl border border-white/5 p-6 min-h-[140px] font-mono text-xs text-emerald-400/90 leading-loose flex flex-col-reverse justify-end overflow-auto h-48 scrollbar-hide shadow-inner">
                {step.output.slice().reverse().map((line, i) => (
                  <div key={i} className="flex gap-4">
                    <span className="opacity-30">❯</span>
                    <span>{line}</span>
                  </div>
                ))}
                {!isPlaying && step.output.length === 0 && <span className="opacity-20 italic">実行ボタンを押してください...</span>}
              </div>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-white/5 p-8 rounded-[3rem] flex items-center gap-10 shadow-xl">
            <div className="flex items-center gap-2">
              <button onClick={() => setIsPlaying(!isPlaying)} className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${isPlaying ? 'bg-amber-500 text-slate-950' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 active:scale-95'}`}>
                {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
              </button>
              <button onClick={reset} className="p-4 bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"><RotateCcw size={20} /></button>
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-[9px] mono text-slate-500 mb-2 uppercase font-black tracking-widest">
                <span>CPU Frequency</span>
                <span className="text-indigo-400">x{(speed / 100).toFixed(1)}</span>
              </div>
              <input type="range" min="100" max="980" value={speed} onChange={(e) => setSpeed(parseInt(e.target.value))} className="w-full h-1.5 bg-slate-800 rounded-full appearance-none accent-indigo-500 cursor-pointer" />
            </div>
          </div>
        </div>

        {/* Right: Runtime Visualizer */}
        <div className="lg:col-span-5 flex flex-col gap-8">
          <div className="bg-slate-900/60 backdrop-blur-2xl p-10 rounded-[3rem] border border-white/5 shadow-2xl relative overflow-hidden h-[fit-content]">
            <div className="flex items-center gap-3 mb-10">
              <CpuIcon className="text-indigo-400 w-5 h-5" />
              <h2 className="font-black text-[10px] uppercase tracking-widest text-slate-400">Runtime_Variable_Stack</h2>
            </div>

            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {Object.entries(step.variables).map(([name, val]) => (
                  <motion.div
                    key={name}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-6 bg-white/5 rounded-3xl border border-white/5 flex items-center justify-between group hover:bg-white/10 transition-colors"
                  >
                    <div>
                      <div className="text-[10px] mono text-slate-500 font-black uppercase mb-1 tracking-widest">{name}</div>
                      <div className="text-[8px] text-indigo-400/50">INT64_STD_CORE</div>
                    </div>
                    <div className="text-2xl font-black text-white tabular-nums px-4 py-1 bg-indigo-500/10 rounded-xl border border-indigo-500/10">
                      {val}
                    </div>
                  </motion.div>
                ))}
                {Object.keys(step.variables).length === 0 && (
                  <div className="py-12 text-center opacity-20 italic text-sm">変数未割り当て</div>
                )}
              </AnimatePresence>
            </div>

            <div className="mt-12 p-8 bg-indigo-500/5 border border-indigo-500/10 rounded-[2rem] min-h-[140px] flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Settings2 size={16} className="text-indigo-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Execution_Context</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed italic font-medium">
                {step.description || "シミュレーション待機中..."}
              </p>
              {step.line > 0 && (
                <div className="pt-4 mt-2 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[10px] mono text-slate-600 font-black">PC (Program Counter)</span>
                  <span className="text-indigo-400 font-black mono text-xs">LINE_{step.line}</span>
                </div>
              )}
            </div>

            {isPlaying && (
              <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none">
                <Cpu size={120} className="text-indigo-500 animate-[spin_12s_linear_infinite]" />
              </div>
            )}
          </div>

          <div className="bg-indigo-500/10 border border-indigo-500/20 p-8 rounded-[2.5rem]">
            <div className="flex items-center gap-3 mb-6">
              <Zap className="text-amber-400 w-5 h-5 fill-current" />
              <h2 className="font-black text-[10px] uppercase tracking-widest text-indigo-300">Quick_Guide</h2>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed font-bold">
              DNCLは共通テストのための「標準的な記法」です。
              <br />・代入は「=`」
              <br />・繰り返しは「`を...から...まで...増やしながら繰り返す:」
              <br />・ブロック内のインデント（行頭のスペース）を忘れずに！
            </p>
          </div>
        </div>
      </main>

      <footer className="mt-20 border-t border-white/5 py-12 text-center opacity-20">
        <p className="text-[8px] mono uppercase tracking-[1em]">dncl_studio // future_informatics_I_v2</p>
      </footer>
    </div>
  );
}
