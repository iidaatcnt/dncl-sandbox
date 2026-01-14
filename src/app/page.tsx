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
  LayoutGrid,
  Info,
  ArrowRight,
  ExternalLink,
  ChevronLeft
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
    description: "1からnまでの数を順番に足していく、最も基本的なロジックです。",
    goal: "変数の初期化、繰り返し、そして足し算の基本をマスターしましょう。",
    code: `合計 = 0
n = 10
i を 1 から n まで 1 ずつ増やしながら繰り返す:
    合計 = 合計 + i
    「i = 」, i, 「 : 合計 = 」, 合計 を表示する`
  },
  {
    name: "最大値を求める",
    description: "配列の中から一番大きな値を見つけ出す、実戦的なアルゴリズムです。",
    goal: "配列（データの集まり）から条件に合うものを探す方法を学びます。",
    code: `A = [12, 45, 23, 67, 31]
最大 = A[0]
i を 1 から 4 まで 1 ずつ増やしながら繰り返す:
    もし A[i] > 最大 ならば:
        最大 = A[i]
        「新しい最大値Found: 」, 最大 を表示する
「最終的な最大値は 」, 最大 を表示する`
  },
  {
    name: "バブルソート (並び替え)",
    description: "隣り合う要素を比較して入れ替える、有名な並び替えアルゴリズムです。",
    goal: "要素の入れ替えができるようになり、データが整列されていく様子を観察しましょう。",
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
  const [selectedPreset, setSelectedPreset] = useState(PRESETS[0]);
  const [code, setCode] = useState(PRESETS[0].code);
  const [steps, setSteps] = useState<VMState[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(800);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('dncl-sandbox-code');
    if (saved) setCode(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem('dncl-sandbox-code', code);
  }, [code]);

  const getExprValue = (e: string, vars: Record<string, number>, arrays: Record<string, number[]>) => {
    let p = e.trim();
    p = p.replace(/([a-zA-Zあ-んア-ン一-龠]+)\[(.*?)\]/g, (match, arrName, idxExpr) => {
      const idx = getExprValue(idxExpr, vars, arrays);
      return arrays[arrName] ? (arrays[arrName][idx] ?? 0).toString() : '0';
    });
    const vNames = Object.keys(vars).sort((a, b) => b.length - a.length);
    vNames.forEach(v => p = p.replace(new RegExp(`\\b${v}\\b`, 'g'), vars[v].toString()));
    try { return Function(`"use strict"; return (${p})`)(); } catch { return 0; }
  };

  const compileAndRun = useCallback((rawCode: string) => {
    const lines = rawCode.split('\n');
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

    try {
      setError(null);
      let i = 0;
      while (i < lines.length) {
        const lineRaw = lines[i];
        const line = lineRaw.trim();
        if (!line || line.startsWith('//') || line.startsWith('#')) { i++; continue; }

        const arrMatch = line.match(/^([a-zA-Zあ-んア-ン一-龠]+)\s*=\s*\[(.*?)\]$/);
        if (arrMatch) {
          const arrName = arrMatch[1];
          const parts = arrMatch[2].split(',').map(p => getExprValue(p, vars, arrays));
          arrays[arrName] = parts;
          addState(i, `配列「${arrName}」を値 [${parts.join(', ')}] で初期化しました。`);
          i++; continue;
        }

        const idxAssignMatch = line.match(/^([a-zA-Zあ-んア-ン一-龠]+)\[(.*?)\]\s*=\s*(.+)$/);
        if (idxAssignMatch) {
          const arrName = idxAssignMatch[1];
          const idx = getExprValue(idxAssignMatch[2], vars, arrays);
          const val = getExprValue(idxAssignMatch[3], vars, arrays);
          if (arrays[arrName]) {
            arrays[arrName][idx] = val;
            addState(i, `${arrName}の${idx}番目を${val}に書き換えました。`);
          }
          i++; continue;
        }

        const assignMatch = line.match(/^([a-zA-Zあ-んア-ン一-龠]+)\s*=\s*(.+)$/);
        if (assignMatch && !line.includes('繰り返す') && !line.includes('ならば') && !line.includes('そうでなければ')) {
          const varName = assignMatch[1];
          vars[varName] = getExprValue(assignMatch[2], vars, arrays);
          addState(i, `変数 ${varName} に新しい値 ${vars[varName]} をセットしました。`);
          i++; continue;
        }

        const loopMatch = line.match(/^([a-zA-Zあ-んア-ン一-龠]+)\s*を\s*(.+)\s*から\s*(.+)\s*まで\s*(.+)\s*ずつ増やしながら繰り返す:$/);
        if (loopMatch) {
          const counter = loopMatch[1];
          const start = getExprValue(loopMatch[2], vars, arrays);
          const end = getExprValue(loopMatch[3], vars, arrays);
          const stepSize = getExprValue(loopMatch[4], vars, arrays);

          const block: number[] = [];
          let bIdx = i + 1;
          const baseIndent = lines[i].match(/^\s*/)?.[0].length || 0;
          while (bIdx < lines.length) {
            const row = lines[bIdx];
            if (row.trim() === '') { bIdx++; continue; }
            const rowIndent = row.match(/^\s*/)?.[0].length || 0;
            if (rowIndent > baseIndent) { block.push(bIdx); bIdx++; } else break;
          }

          for (let val = start; val <= end; val += stepSize) {
            vars[counter] = val;
            addState(i, `繰り返し（ループ）中。現在は ${counter} = ${val} です。`);
            for (const rowIdx of block) {
              const bLine = lines[rowIdx].trim();
              if (bLine.includes('を表示する')) {
                const content = bLine.replace('を表示する', '').split(',').map(part => {
                  const p = part.trim();
                  if (p.startsWith('「') && p.endsWith('」')) return p.slice(1, -1);
                  return getExprValue(p, vars, arrays).toString();
                }).join('');
                logs.push(content);
                addState(rowIdx, "コンソールに出力しました。");
              } else if (bLine.match(/^([a-zA-Zあ-んア-ン一-龠]+)\[(.*?)\]\s*=\s*(.+)$/)) {
                const m = bLine.match(/^([a-zA-Zあ-んア-ン一-龠]+)\[(.*?)\]\s*=\s*(.+)$/);
                if (m) { arrays[m[1]][getExprValue(m[2], vars, arrays)] = getExprValue(m[3], vars, arrays); addState(rowIdx, "配列を更新。"); }
              } else if (bLine.includes('=')) {
                const m = bLine.match(/^([a-zA-Zあ-んア-ン一-龠]+)\s*=\s*(.+)$/);
                if (m) { vars[m[1]] = getExprValue(m[2], vars, arrays); addState(rowIdx, "変数更新。"); }
              }
            }
          }
          i = bIdx; continue;
        }

        const ifMatch = line.match(/^もし\s*(.+)\s*ならば:$/);
        if (ifMatch) {
          const result = getExprValue(ifMatch[1], vars, arrays);
          addState(i, `条件をチェック：「${result ? '成立' : '不成立'}」`);

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
                return (part.startsWith('「') && part.endsWith('」')) ? part.slice(1, -1) : getExprValue(part, vars, arrays).toString();
              }).join(''));
              addState(t, "出力を実行。");
            } else if (row.includes('=')) {
              const m = row.match(/^([a-zA-Zあ-んア-ン一-龠]+)(.*)\s*=\s*(.+)$/);
              if (m) {
                if (m[2].includes('[')) arrays[m[1]][getExprValue(m[2].slice(1, -1), vars, arrays)] = getExprValue(m[3], vars, arrays);
                else vars[m[1]] = getExprValue(m[3], vars, arrays);
                addState(t, "値を更新。");
              }
            }
          }
          i = currIdx; continue;
        }

        if (line.includes('を表示する')) {
          logs.push(line.replace('を表示する', '').split(',').map(p => {
            const part = p.trim();
            return (part.startsWith('「') && part.endsWith('」')) ? part.slice(1, -1) : getExprValue(part, vars, arrays).toString();
          }).join(''));
          addState(i, "表示を実行。");
        }
        i++;
      }
      addState(lines.length - 1, "すべての処理が正常に完了しました！");
      setSteps(states);
      setCurrentIdx(0);
    } catch (e) {
      setError("コードの実行中にエラーが発生しました。");
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
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans selection:bg-indigo-100 paper-texture flex flex-col overflow-hidden">
      {/* Header - Progate Style */}
      <header className="h-14 border-b border-slate-200 bg-white/95 backdrop-blur-md flex items-center justify-between px-4 z-50 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-100">
              <GraduationCap className="text-white w-5 h-5" />
            </div>
            <h1 className="font-bold text-sm tracking-tight text-slate-900 hidden sm:block">DNCL Sandbox Studio</h1>
          </div>
          <div className="h-4 w-px bg-slate-200" />
          <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 overflow-hidden">
            <span className="truncate max-w-[150px]">{selectedPreset.name}</span>
            <ChevronRight size={14} className="opacity-30" />
            <span className="text-indigo-600 truncate">演習セッション</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-6 mr-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">
            <span>Lessons</span>
            <span>Study Map</span>
            <span>Dashboard</span>
          </div>
          <button onClick={runCode} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs transition-all shadow-sm flex items-center gap-2 uppercase tracking-wider active:scale-95">
            <Play size={14} className="fill-current" /> Run Logic
          </button>
          <a href="https://github.com/iidaatcnt/dncl-sandbox" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-slate-900 transition-colors">
            <Github size={18} />
          </a>
        </div>
      </header>

      {/* Main Content - Progate 3-Column Layout */}
      <main className="flex-1 flex overflow-hidden">

        {/* Left Column: Lesson/Instructions (3/12) */}
        <aside className="w-[300px] xl:w-[350px] bg-white border-r border-slate-200 flex flex-col shrink-0">
          <div className="p-6 overflow-y-auto flex-1 scrollbar-hide">
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-2 text-indigo-600 font-black text-[10px] uppercase tracking-widest">
                <Book size={14} />
                <span>Goal Info</span>
              </div>
              <h2 className="text-lg font-black text-slate-900 mb-3">{selectedPreset.name}</h2>
              <p className="text-xs text-slate-600 leading-relaxed font-medium mb-4">
                {selectedPreset.goal}
              </p>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 italic text-[11px] text-slate-500 font-medium">
                「{selectedPreset.description}」
              </div>
            </div>

            <div className="mb-8 pt-8 border-t border-slate-100">
              <div className="flex items-center gap-2 mb-4 text-slate-400 font-black text-[10px] uppercase tracking-widest">
                <LayoutGrid size={14} />
                <span>Select Lesson</span>
              </div>
              <div className="space-y-2">
                {PRESETS.map(p => (
                  <button
                    key={p.name}
                    onClick={() => {
                      setSelectedPreset(p);
                      setCode(p.code);
                      reset();
                    }}
                    className={`w-full text-left p-3 rounded-xl border text-[11px] font-bold transition-all flex items-center justify-between group ${selectedPreset.name === p.name ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'}`}
                  >
                    <span className="truncate">{p.name}</span>
                    <ChevronRight size={14} className={`${selectedPreset.name === p.name ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-all`} />
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-8 border-t border-slate-100">
              <div className="flex items-center gap-2 mb-4 text-amber-600 font-black text-[10px] uppercase tracking-widest leading-none">
                <Info size={14} />
                <span>Reference Guide</span>
              </div>
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-white border border-slate-100">
                  <span className="text-[10px] font-black uppercase text-indigo-400">Assignment</span>
                  <code className="text-xs font-mono bg-slate-50 px-2 py-0.5 rounded text-slate-700">合計 = 0</code>
                </div>
                <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-white border border-slate-100">
                  <span className="text-[10px] font-black uppercase text-indigo-400">Loop</span>
                  <code className="text-xs font-mono bg-slate-50 px-2 py-0.5 rounded text-slate-700 leading-relaxed overflow-hidden">i を 1 から 10 まで<br />1 ずつ増やしながら繰り返す:</code>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-slate-100 bg-slate-50/50">
            <div className="flex items-center justify-between px-2">
              <button className="text-[10px] font-black text-slate-400 transition-colors hover:text-slate-600 flex items-center gap-1">
                <ChevronLeft size={12} /> BACK
              </button>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[9px] font-black text-slate-500">READY</span>
              </div>
              <button className="text-[10px] font-black text-indigo-600 transition-colors hover:text-indigo-800 flex items-center gap-1">
                NEXT <ChevronRight size={12} />
              </button>
            </div>
          </div>
        </aside>

        {/* Center Column: Editor (Main Focus) */}
        <section className="flex-1 bg-white flex flex-col shadow-[inset_1px_0_0_0_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="h-10 border-b border-slate-100 flex items-center justify-between px-6 bg-slate-50/30">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <Code2 size={13} className="text-indigo-500" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">program.dncl</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-100">
              <Save size={10} className="text-emerald-500" />
              <span>Auto-Saving in Cloud</span>
            </div>
          </div>

          <div className="flex-1 relative p-6 bg-indigo-50/10">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full h-full bg-white rounded-2xl border border-slate-200 p-8 font-mono text-[14px] leading-loose text-slate-800 outline-none focus:border-indigo-300 transition-all resize-none shadow-sm"
              spellCheck={false}
              placeholder="ここに DNCL コードを入力してください..."
            />
            {error && (
              <div className="absolute bottom-10 left-10 right-10 p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3 shadow-lg">
                <Info size={16} className="text-rose-500" />
                <span className="text-xs font-bold text-rose-700">{error}</span>
              </div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="h-20 border-t border-slate-200 bg-white flex items-center px-8 gap-8">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-md ${isPlaying ? 'bg-amber-100 text-amber-700' : 'bg-indigo-600 text-white shadow-indigo-100 active:scale-95'}`}
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
              </button>
              <button onClick={reset} className="p-3 bg-slate-100 rounded-xl text-slate-400 hover:text-slate-900 transition-colors" title="リセット"><RotateCcw size={18} /></button>
            </div>
            <div className="flex-1 max-w-[300px]">
              <div className="flex justify-between text-[9px] font-black text-slate-400 mb-2 uppercase tracking-widest px-1">
                <span>Performance Speed</span>
                <span className="text-indigo-500">{speed}ms</span>
              </div>
              <input type="range" min="100" max="980" value={speed} onChange={(e) => setSpeed(parseInt(e.target.value))} className="w-full h-1 bg-slate-100 rounded-full appearance-none accent-indigo-600 cursor-pointer" />
            </div>
          </div>
        </section>

        {/* Right Column: Runtime Status & Output (3/12 or collapsible) */}
        <aside className="w-[350px] bg-slate-50 border-l border-slate-200 flex flex-col overflow-hidden">

          {/* Output Panel (Bottom half ideally, but here top section) */}
          <div className="flex-1 flex flex-col p-6 overflow-hidden">
            <div className="flex items-center gap-2 mb-4">
              <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-black uppercase">Console</span>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Output_Log</h3>
            </div>
            <div className="flex-1 bg-slate-900 rounded-2xl p-6 font-mono text-[11px] text-emerald-400/90 leading-loose flex flex-col-reverse overflow-y-auto shadow-2xl scrollbar-hide">
              {step.output.slice().reverse().map((line, i) => (
                <div key={i} className="flex gap-3"><span className="opacity-20">#</span>{line}</div>
              ))}
              {step.output.length === 0 && <span className="opacity-20 italic">Awaiting output stream...</span>}
            </div>
          </div>

          {/* Logic Explanation Panel */}
          <div className="p-6 pt-0 shrink-0">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
              <div className="flex items-center gap-2 opacity-60">
                <Zap size={14} className="text-indigo-600" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Line Insight</span>
              </div>
              <p className="text-xs font-bold text-slate-800 leading-snug">
                {step.description || "実行を開始してロジックを確認してください。"}
              </p>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-black">
                <span className="text-slate-400">LINE TRACK</span>
                <span className="text-indigo-600">{step.line || 0} / {code.split('\n').length}</span>
              </div>
            </div>
          </div>

          {/* Memory Visualizer Panel */}
          <div className="p-6 pt-0 overflow-y-auto scrollbar-hide flex-1">
            <div className="flex items-center gap-2 mb-4">
              <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-black uppercase">Runtime</span>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Memory_Explorer</h3>
            </div>

            <div className="space-y-6">
              {/* Arrays */}
              {Object.entries(step.arrays).map(([name, arr]) => (
                <div key={name} className="space-y-3">
                  <div className="flex items-center justify-between text-[9px] font-black text-slate-500 px-1 uppercase">
                    <span>{name}[]</span>
                    <span className="opacity-40">{arr.length} Items</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {arr.map((val, idx) => (
                      <div key={idx} className="w-8 h-10 bg-white border border-slate-100 rounded-lg flex flex-col items-center justify-center shadow-sm">
                        <span className="text-[8px] font-bold text-slate-300">{idx}</span>
                        <span className="text-[10px] font-black text-slate-700">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Scalars */}
              <div className="space-y-2">
                {Object.entries(step.variables).map(([name, val]) => (
                  <div key={name} className="p-4 bg-white border border-slate-100 rounded-xl flex items-center justify-between group hover:border-indigo-100 transition-all shadow-sm">
                    <span className="text-[10px] font-black text-slate-500 uppercase">{name}</span>
                    <span className="text-sm font-black text-indigo-600 tabular-nums">
                      {val}
                    </span>
                  </div>
                ))}
                {Object.keys(step.variables).length === 0 && Object.keys(step.arrays).length === 0 && (
                  <div className="py-8 flex flex-col items-center justify-center gap-4 opacity-20 text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                    <Cpu size={24} />
                    <span className="text-[9px] font-black text-center">Memory Empty</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </aside>
      </main>

      <style jsx global>{`
        .paper-texture {
            background-color: #f8fafc;
            background-image: radial-gradient(#cbd5e1 0.4px, transparent 0.4px);
            background-size: 20px 20px;
        }
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        textarea::placeholder {
            color: #cbd5e1;
            font-weight: 500;
        }
      `}</style>
    </div >
  );
}
