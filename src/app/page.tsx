'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  RotateCcw,
  Github,
  Terminal,
  Code2,
  Zap,
  GraduationCap,
  Cpu,
  Settings2,
  Edit3,
  CpuIcon,
  Pause,
  Book,
  Save,
  ChevronRight,
  LayoutGrid
} from 'lucide-react';

// --- DNCL Interpreter Core ---
interface VMState {
  line: number;
  variables: Record<string, number>;
  arrays: Record<string, number[]>;
  output: string[];
  description: string;
}

const PRESETS = [
  {
    name: "基本の合計",
    code: `合計 = 0
n = 10
i を 1 から n まで 1 ずつ増やしながら繰り返す:
    合計 = 合計 + i
    「i = 」, i, 「 : 合計 = 」, 合計 を表示する`
  },
  {
    name: "最大値を求める",
    code: `A = [12, 45, 23, 67, 31]
最大 = A[0]
i を 1 から 4 まで 1 ずつ増やしながら繰り返す:
    もし A[i] > 最大 ならば:
        最大 = A[i]
        「新しい最大値Found: 」, 最大 を表示する
「最終的な最大値は 」, 最大 を表示する`
  },
  {
    name: "バブルソート (実験用)",
    code: `L = [5, 2, 8, 1, 9]
n = 5
i を 0 から n - 2 まで 1 ずつ増やしながら繰り返す:
    j を 0 から n - i - 2 まで 1 ずつ増やしながら繰り返す:
        もし L[j] > L[j + 1] ならば:
            tmp = L[j]
            L[j] = L[j + 1]
            L[j + 1] = tmp
            「データを入れ替えました」を表示する`
  }
];

export default function DNCLSandbox() {
  const [code, setCode] = useState(PRESETS[0].code);
  const [steps, setSteps] = useState<VMState[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(800);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem('dncl-sandbox-code');
    if (saved) setCode(saved);
  }, []);

  // Save to local storage
  useEffect(() => {
    localStorage.setItem('dncl-sandbox-code', code);
  }, [code]);

  const compileAndRun = useCallback((rawCode: string) => {
    const lines = rawCode.split('\n'); // Keep original for indentation
    const states: VMState[] = [];
    let vars: Record<string, number> = {};
    let arrays: Record<string, number[]> = {};
    let logs: string[] = [];

    const addState = (lineIdx: number, desc: string) => {
      states.push({
        line: lineIdx + 1,
        variables: { ...vars },
        arrays: JSON.parse(JSON.stringify(arrays)),
        output: [...logs],
        description: desc
      });
    };

    const getExprValue = (e: string) => {
      let p = e.trim();
      // Handle array access: A[i], L[j+1]
      p = p.replace(/([a-zA-Zあ-んア-ン一-龠]+)\[(.*?)\]/g, (match, arrName, idxExpr) => {
        const idx = getExprValue(idxExpr);
        return arrays[arrName] ? (arrays[arrName][idx] ?? 0).toString() : '0';
      });
      // Replace variables
      const vNames = Object.keys(vars).sort((a, b) => b.length - a.length);
      vNames.forEach(v => p = p.replace(new RegExp(`\\b${v}\\b`, 'g'), vars[v].toString()));
      try { return Function(`"use strict"; return (${p})`)(); } catch { return 0; }
    };

    try {
      setError(null);
      let i = 0;
      while (i < lines.length) {
        const lineRaw = lines[i];
        const line = lineRaw.trim();
        if (!line || line.startsWith('//') || line.startsWith('#')) { i++; continue; }

        // 1. Array Assignment: A = [1, 2, 3]
        const arrMatch = line.match(/^([a-zA-Zあ-んア-ン一-龠]+)\s*=\s*\[(.*?)\]$/);
        if (arrMatch) {
          const arrName = arrMatch[1];
          const parts = arrMatch[2].split(',').map(p => getExprValue(p));
          arrays[arrName] = parts;
          addState(i, `配列 ${arrName} を初期化。初期値: [${parts.join(', ')}]`);
          i++; continue;
        }

        // 2. Index Assignment: L[j] = val
        const idxAssignMatch = line.match(/^([a-zA-Zあ-んア-ン一-龠]+)\[(.*?)\]\s*=\s*(.+)$/);
        if (idxAssignMatch) {
          const arrName = idxAssignMatch[1];
          const idx = getExprValue(idxAssignMatch[2]);
          const val = getExprValue(idxAssignMatch[3]);
          if (arrays[arrName]) {
            arrays[arrName][idx] = val;
            addState(i, `${arrName} の要素 [${idx}] を ${val} に更新しました。`);
          }
          i++; continue;
        }

        // 3. Normal Assignment: 合計 = 0
        const assignMatch = line.match(/^([a-zA-Zあ-んア-ン一-龠]+)\s*=\s*(.+)$/);
        if (assignMatch && !line.includes('繰り返す') && !line.includes('ならば') && !line.includes('そうでなければ')) {
          const varName = assignMatch[1];
          vars[varName] = getExprValue(assignMatch[2]);
          addState(i, `変数 ${varName} に ${vars[varName]} をセット。`);
          i++; continue;
        }

        // 4. Loop: i を 1 から n まで 1 ずつ増やしながら繰り返す:
        const loopMatch = line.match(/^([a-zA-Zあ-んア-ン一-龠]+)\s*を\s*(.+)\s*から\s*(.+)\s*まで\s*(.+)\s*ずつ増やしながら繰り返す:$/);
        if (loopMatch) {
          const counter = loopMatch[1];
          const start = getExprValue(loopMatch[2]);
          const end = getExprValue(loopMatch[3]);
          const stepSize = getExprValue(loopMatch[4]);

          // Block identification by indent
          const block: number[] = [];
          let bIdx = i + 1;
          const baseIndent = lines[i].match(/^\s*/)?.[0].length || 0;
          while (bIdx < lines.length) {
            const row = lines[bIdx];
            if (row.trim() === '') { bIdx++; continue; }
            const rowIndent = row.match(/^\s*/)?.[0].length || 0;
            if (rowIndent > baseIndent) {
              block.push(bIdx);
              bIdx++;
            } else break;
          }

          for (let val = start; val <= end; val += stepSize) {
            vars[counter] = val;
            addState(i, `繰り返し: ${counter} = ${val}`);
            for (const rowIdx of block) {
              const bLine = lines[rowIdx].trim();
              // Recursive-like execution for block lines
              if (bLine.includes('を表示する')) {
                const content = bLine.replace('を表示する', '').split(',').map(part => {
                  const p = part.trim();
                  if (p.startsWith('「') && p.endsWith('」')) return p.slice(1, -1);
                  return getExprValue(p).toString();
                }).join('');
                logs.push(content);
                addState(rowIdx, "画面に出力。");
              } else if (bLine.includes('[') && bLine.includes(']=')) {
                const m = bLine.match(/^([a-zA-Zあ-んア-ン一-龠]+)\[(.*?)\]\s*=\s*(.+)$/);
                if (m) { arrays[m[1]][getExprValue(m[2])] = getExprValue(m[3]); addState(rowIdx, "配列更新。"); }
              } else if (bLine.includes('=')) {
                const m = bLine.match(/^([a-zA-Zあ-んア-ン一-龠]+)\s*=\s*(.+)$/);
                if (m) { vars[m[1]] = getExprValue(m[2]); addState(rowIdx, "変数更新。"); }
              }
            }
          }
          i = bIdx; continue;
        }

        // 5. If: もし ... ならば:
        const ifMatch = line.match(/^もし\s*(.+)\s*ならば:$/);
        if (ifMatch) {
          const result = getExprValue(ifMatch[1]);
          addState(i, `判断: ${ifMatch[1]} -> ${result ? 'YES' : 'NO'}`);

          let thenBlock: number[] = [];
          let elseBlock: number[] = [];
          const baseIndent = lines[i].match(/^\s*/)?.[0].length || 0;

          let currIdx = i + 1;
          while (currIdx < lines.length) {
            const row = lines[currIdx];
            if (row.trim() === '') { currIdx++; continue; }
            const rowIndent = row.match(/^\s*/)?.[0].length || 0;
            if (rowIndent > baseIndent) { thenBlock.push(currIdx); currIdx++; } else break;
          }
          if (currIdx < lines.length && lines[currIdx].trim() === 'そうでなければ:') {
            currIdx++;
            while (currIdx < lines.length) {
              const row = lines[currIdx];
              if (row.trim() === '') { currIdx++; continue; }
              const rowIndent = row.match(/^\s*/)?.[0].length || 0;
              if (rowIndent > baseIndent) { elseBlock.push(currIdx); currIdx++; } else break;
            }
          }

          const target = result ? thenBlock : elseBlock;
          for (const t of target) {
            const row = lines[t].trim();
            if (row.includes('を表示する')) {
              logs.push(row.replace('を表示する', '').split(',').map(p => {
                const part = p.trim();
                return (part.startsWith('「') && part.endsWith('」')) ? part.slice(1, -1) : getExprValue(part).toString();
              }).join(''));
              addState(t, "出力。");
            } else if (row.includes('=')) {
              const m = row.match(/^([a-zA-Zあ-んア-ン一-龠]+)(.*)\s*=\s*(.+)$/);
              if (m) {
                if (m[2].includes('[')) arrays[m[1]][getExprValue(m[2].slice(1, -1))] = getExprValue(m[3]);
                else vars[m[1]] = getExprValue(m[3]);
                addState(t, "更新。");
              }
            }
          }
          i = currIdx; continue;
        }

        // 6. Global Print
        if (line.includes('を表示する')) {
          logs.push(line.replace('を表示する', '').split(',').map(p => {
            const part = p.trim();
            return (part.startsWith('「') && part.endsWith('」')) ? part.slice(1, -1) : getExprValue(part).toString();
          }).join(''));
          addState(i, "メッセージ表示。");
        }

        i++;
      }
      addState(lines.length - 1, "すべてのプロセスを終了しました。");
      setSteps(states);
      setCurrentIdx(0);
    } catch (e) {
      setError("Runtime Error: 構文またはインデントが不正です。");
      console.error(e);
    }
  }, []);

  const runCode = () => { compileAndRun(code); setIsPlaying(true); };
  const reset = useCallback(() => { setCurrentIdx(0); setIsPlaying(false); }, []);

  useEffect(() => {
    if (isPlaying && currentIdx < steps.length - 1) {
      timerRef.current = setInterval(() => {
        setCurrentIdx(prev => {
          if (prev >= steps.length - 1) { setIsPlaying(false); return prev; }
          return prev + 1;
        });
      }, 1001 - speed);
    } else if (timerRef.current) clearInterval(timerRef.current);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPlaying, currentIdx, steps.length, speed]);

  const step = steps[currentIdx] || { line: 0, variables: {}, arrays: {}, output: [], description: '' };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 font-sans selection:bg-indigo-500/30">
      <header className="border-b border-white/5 bg-slate-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <CpuIcon className="text-slate-950 w-5 h-5" />
            </div>
            <h1 className="font-black italic tracking-tighter text-xl uppercase tracking-widest text-indigo-400">DNCL_Sandbox_Studio</h1>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={runCode} className="px-6 py-2 bg-indigo-500 hover:bg-indigo-400 text-slate-950 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2">
              <Zap size={14} className="fill-current" /> Initialize Sandbox
            </button>
            <a href="https://github.com/iidaatcnt/dncl-sandbox" target="_blank" rel="noreferrer" className="text-slate-600 hover:text-white transition-colors">
              <Github size={20} />
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-8 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Col: Library & Code */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          <div className="glass-panel p-8 rounded-[2.5rem] bg-indigo-500/5 border-indigo-500/10">
            <div className="flex items-center gap-3 mb-6">
              <Book className="text-indigo-400 w-4 h-4" />
              <h2 className="font-black text-[10px] uppercase tracking-widest text-slate-400">Presets_Library</h2>
            </div>
            <div className="space-y-3">
              {PRESETS.map(p => (
                <button
                  key={p.name}
                  onClick={() => { setCode(p.code); reset(); }}
                  className="w-full text-left p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all text-xs font-bold text-slate-300 flex items-center justify-between group"
                >
                  {p.name}
                  <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-indigo-400" />
                </button>
              ))}
            </div>
          </div>

          <div className="glass-panel p-8 rounded-[3rem] flex-1 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Edit3 size={16} className="text-slate-500" />
                <h2 className="font-black text-[10px] uppercase tracking-widest text-slate-400">Sandbox_Editor</h2>
              </div>
              <div className="flex items-center gap-2">
                <Save size={12} className="text-emerald-500" />
                <span className="text-[8px] mono font-bold text-slate-600 uppercase">Cloud Sync Ready</span>
              </div>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="flex-1 bg-black/40 rounded-3xl border border-white/5 p-8 font-mono text-[13px] leading-relaxed text-indigo-100 outline-none focus:border-indigo-500/20 transition-all resize-none shadow-inner scrollbar-hide"
              spellCheck={false}
            />
          </div>
        </div>

        {/* Center Col: Trace & Output */}
        <div className="lg:col-span-5 flex flex-col gap-8">
          <div className="glass-panel p-10 rounded-[3.5rem] h-full flex flex-col gap-8 overflow-hidden relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Cpu className="text-indigo-400 w-5 h-5" />
                <h2 className="font-black text-[10px] uppercase tracking-widest text-slate-400">Logic_Pipeline_Trace</h2>
              </div>
              <div className="px-3 py-1 bg-white/5 rounded-full border border-white/5 mono text-[9px] text-slate-500">
                PC_PTR: {step.line || 0}
              </div>
            </div>

            <div className="flex-1 bg-black/40 rounded-[2.5rem] border border-white/5 p-8 flex flex-col gap-8 shadow-inner overflow-hidden">
              <div className="flex-1 flex flex-col gap-4 overflow-auto scrollbar-hide px-4">
                <div className="flex items-center gap-2 opacity-30">
                  <Zap size={14} className="text-indigo-400" />
                  <span className="text-[10px] font-black uppercase tracking-wider">Simulation Insight</span>
                </div>
                <p className="text-xl font-black text-slate-100 leading-tight">
                  {step.description || "シミュレートを開始してください。"}
                </p>
              </div>

              <div className="pt-8 border-t border-white/5">
                <div className="flex items-center gap-3 mb-4 opacity-50">
                  <Terminal className="text-emerald-400 w-4 h-4" />
                  <h3 className="text-[10px] font-black uppercase text-slate-500">I/O_Virtual_Stream</h3>
                </div>
                <div className="bg-slate-950/80 rounded-2xl border border-white/5 p-6 h-40 font-mono text-xs text-emerald-400/80 leading-loose flex flex-col-reverse overflow-auto scrollbar-hide shadow-inner">
                  {step.output.slice().reverse().map((line, i) => (
                    <div key={i} className="flex gap-4"><span className="opacity-20 pointer-events-none">#</span>{line}</div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-8 px-4">
              <div className="flex items-center gap-2">
                <button onClick={() => setIsPlaying(!isPlaying)} className={`w-16 h-16 rounded-3xl flex items-center justify-center transition-all ${isPlaying ? 'bg-amber-500 text-slate-950 ring-4 ring-amber-500/20' : 'bg-indigo-600 text-white shadow-2xl shadow-indigo-500/30'}`}>
                  {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
                </button>
                <button onClick={reset} className="p-4 bg-slate-800 rounded-2xl text-slate-400 hover:text-white transition-colors"><RotateCcw size={20} /></button>
              </div>
              <div className="flex-1">
                <div className="flex justify-between text-[8px] mono text-slate-600 mb-2 uppercase font-black tracking-widest">
                  <span>Engine Frequency</span>
                  <span className="text-indigo-400">{speed}kHz</span>
                </div>
                <input type="range" min="100" max="980" value={speed} onChange={(e) => setSpeed(parseInt(e.target.value))} className="w-full h-1 bg-slate-800 rounded-full appearance-none accent-indigo-500 cursor-pointer" />
              </div>
            </div>

            {isPlaying && (
              <motion.div
                animate={{ opacity: [0.05, 0.1, 0.05] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent"
              />
            )}
          </div>
        </div>

        {/* Right Col: Memory & Stats */}
        <div className="lg:col-span-3 flex flex-col gap-8">
          <div className="glass-panel p-10 rounded-[3.5rem] shadow-2xl flex flex-col h-full gap-8">
            <div className="flex items-center gap-3">
              <LayoutGrid className="text-indigo-400 w-5 h-5" />
              <h2 className="font-black text-[10px] uppercase tracking-widest text-slate-400">Virtual_Memory_Map</h2>
            </div>

            <div className="space-y-8 flex-1 overflow-auto scrollbar-hide px-1">
              {/* Array Section */}
              {Object.entries(step.arrays).map(([name, arr]) => (
                <div key={name} className="space-y-4">
                  <div className="flex items-center justify-between text-[9px] mono font-black text-slate-600 uppercase">
                    <span>[ARRAY] {name}</span>
                    <span className="text-indigo-400/50">L:{arr.length}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {arr.map((val, idx) => (
                      <motion.div
                        key={idx}
                        layout
                        className="w-10 h-14 bg-white/5 border border-white/5 rounded-xl flex flex-col items-center justify-center gap-1 group hover:border-indigo-500/30 transition-all shadow-sm"
                      >
                        <span className="text-[8px] mono text-slate-600 font-bold">{idx}</span>
                        <span className="text-xs font-black text-white">{val}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Scalar Section */}
              <div className="space-y-3">
                {Object.entries(step.variables).map(([name, val]) => (
                  <div key={name} className="p-6 bg-white/5 border border-white/5 rounded-[2.5rem] flex items-center justify-between group hover:bg-white/10 transition-all">
                    <div>
                      <div className="text-[10px] mono text-slate-500 font-black uppercase mb-0.5">{name}</div>
                      <div className="text-[8px] text-indigo-400/30">REGISTER_X64</div>
                    </div>
                    <div className="text-xl font-black text-white px-5 py-1.5 bg-indigo-500/10 rounded-2xl border border-indigo-500/10">
                      {val}
                    </div>
                  </div>
                ))}
              </div>

              {Object.keys(step.variables).length === 0 && Object.keys(step.arrays).length === 0 && (
                <div className="flex flex-col items-center justify-center gap-6 py-20 opacity-20 bg-slate-900/40 rounded-[2.5rem] border border-dashed border-white/5">
                  <Settings2 size={40} className="animate-spin-slow" strokeWidth={1} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-center px-8">Awaiting Execution Context</span>
                </div>
              )}
            </div>

            <div className="p-8 bg-indigo-500/5 rounded-[2.5rem] border border-indigo-500/10 shadow-inner">
              <div className="flex items-center gap-3 mb-4">
                <GraduationCap size={16} className="text-indigo-400" />
                <span className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">Sandbox Pro-Tip</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                配列は `A = [1, 2, 3]` の形式で定義してください。ループや条件分岐内での計算もリアルタイムにこのマップへ反映されます。
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-20 border-t border-white/5 py-16 text-center opacity-40">
        <div className="flex flex-col items-center gap-6">
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
          <p className="text-[9px] mono uppercase tracking-[1.2em]">dncl_sandbox_studio // creative_informatics_series_2026</p>
        </div>
      </footer>

      <style jsx global>{`
        .glass-panel {
          background: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.03);
          box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.5);
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 12s linear infinite;
        }
      `}</style>
    </div>
  );
}
