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
  ExternalLink
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
    description: "変数と繰り返しの基本。1からnまで足し算します。",
    code: `合計 = 0
n = 10
i を 1 から n まで 1 ずつ増やしながら繰り返す:
    合計 = 合計 + i
    「i = 」, i, 「 : 合計 = 」, 合計 を表示する`
  },
  {
    name: "最大値を求める",
    description: "配列（リスト）の中から最も大きい数字を見つけます。",
    code: `A = [12, 45, 23, 67, 31]
最大 = A[0]
i を 1 から 4 まで 1 ずつ増やしながら繰り返す:
    もし A[i] > 最大 ならば:
        最大 = A[i]
        「新しい最大値を見つけました: 」, 最大 を表示する
「最終的な最大値は 」, 最大 を表示する`
  },
  {
    name: "バブルソート (並び替え)",
    description: "数字を小さい順に並べ替えるアルゴリズムの王道です。",
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
          addState(i, `配列「${arrName}」を [${parts.join(', ')}] で作成しました。`);
          i++; continue;
        }

        const idxAssignMatch = line.match(/^([a-zA-Zあ-んア-ン一-龠]+)\[(.*?)\]\s*=\s*(.+)$/);
        if (idxAssignMatch) {
          const arrName = idxAssignMatch[1];
          const idx = getExprValue(idxAssignMatch[2], vars, arrays);
          const val = getExprValue(idxAssignMatch[3], vars, arrays);
          if (arrays[arrName]) {
            arrays[arrName][idx] = val;
            addState(i, `${arrName}の${idx}番目を${val}に変更しました。`);
          }
          i++; continue;
        }

        const assignMatch = line.match(/^([a-zA-Zあ-んア-ン一-龠]+)\s*=\s*(.+)$/);
        if (assignMatch && !line.includes('繰り返す') && !line.includes('ならば') && !line.includes('そうでなければ')) {
          const varName = assignMatch[1];
          vars[varName] = getExprValue(assignMatch[2], vars, arrays);
          addState(i, `${varName} に ${vars[varName]} を代入しました。`);
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
            addState(i, `繰り返し（${counter}=${val}）を実行します。`);
            for (const rowIdx of block) {
              const bLine = lines[rowIdx].trim();
              if (bLine.includes('を表示する')) {
                const content = bLine.replace('を表示する', '').split(',').map(part => {
                  const p = part.trim();
                  if (p.startsWith('「') && p.endsWith('」')) return p.slice(1, -1);
                  return getExprValue(p, vars, arrays).toString();
                }).join('');
                logs.push(content);
                addState(rowIdx, "画面への出力を実行しました。");
              } else if (bLine.match(/^([a-zA-Zあ-んア-ン一-龠]+)\[(.*?)\]\s*=\s*(.+)$/)) {
                const m = bLine.match(/^([a-zA-Zあ-んア-ン一-龠]+)\[(.*?)\]\s*=\s*(.+)$/);
                if (m) { arrays[m[1]][getExprValue(m[2], vars, arrays)] = getExprValue(m[3], vars, arrays); addState(rowIdx, "配列の値を変更しました。"); }
              } else if (bLine.includes('=')) {
                const m = bLine.match(/^([a-zA-Zあ-んア-ン一-龠]+)\s*=\s*(.+)$/);
                if (m) { vars[m[1]] = getExprValue(m[2], vars, arrays); addState(rowIdx, "変数の値を変更しました。"); }
              }
            }
          }
          i = bIdx; continue;
        }

        const ifMatch = line.match(/^もし\s*(.+)\s*ならば:$/);
        if (ifMatch) {
          const result = getExprValue(ifMatch[1], vars, arrays);
          addState(i, `条件判定（${ifMatch[1]}）は「${result ? '成立' : '不成立'}」でした。`);

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
              addState(t, "画面への出力を実行しました。");
            } else if (row.includes('=')) {
              const m = row.match(/^([a-zA-Zあ-んア-ン一-龠]+)(.*)\s*=\s*(.+)$/);
              if (m) {
                if (m[2].includes('[')) arrays[m[1]][getExprValue(m[2].slice(1, -1), vars, arrays)] = getExprValue(m[3], vars, arrays);
                else vars[m[1]] = getExprValue(m[3], vars, arrays);
                addState(t, "値を更新しました。");
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
          addState(i, "画面への出力を実行しました。");
        }
        i++;
      }
      addState(lines.length - 1, "プログラムの実行が完了しました！");
      setSteps(states);
      setCurrentIdx(0);
    } catch (e) {
      setError("コードの実行中にエラーが発生しました。書き方を確認してください。");
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
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans paper-texture">
      {/* Navbar */}
      <nav className="border-b border-slate-200 bg-white/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
              <GraduationCap className="text-white w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-base text-slate-900 leading-none">DNCL サンドボックス</h1>
              <p className="text-[10px] text-slate-500 font-semibold mt-1">Digital Learning Interface</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={runCode} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm transition-all shadow-sm flex items-center gap-2">
              <Play size={16} className="fill-current" /> 実行する
            </button>
            <div className="h-6 w-px bg-slate-200" />
            <a href="https://github.com/iidaatcnt/dncl-sandbox" target="_blank" rel="noreferrer" className="text-slate-500 hover:text-slate-900 transition-colors p-2">
              <Github size={20} />
            </a>
          </div>
        </div>
      </nav>

      <main className="max-w-[1400px] mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Library & Editor */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold">LIBRARY</span>
              <h2 className="text-sm font-bold text-slate-900">プログラムを選ぶ</h2>
            </div>
            <div className="space-y-2">
              {PRESETS.map(p => (
                <button
                  key={p.name}
                  onClick={() => { setCode(p.code); reset(); }}
                  className={`w-full text-left p-4 rounded-xl border transition-all flex flex-col gap-1 ${code === p.code ? 'bg-blue-50/50 border-blue-200 ring-1 ring-blue-200' : 'bg-white border-slate-100 hover:bg-slate-50'}`}
                >
                  <span className={`text-sm font-bold ${code === p.code ? 'text-blue-700' : 'text-slate-700'}`}>{p.name}</span>
                  <span className="text-[10px] text-slate-500 font-medium leading-relaxed">{p.description}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex-1 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold">EDITOR</span>
                <h2 className="text-sm font-bold text-slate-900">コードを編集する</h2>
              </div>
              {/* Auto-save hint */}
              <div className="flex items-center gap-1.5 opacity-40">
                <Save size={12} className="text-emerald-600" />
                <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">SAVED</span>
              </div>
            </div>
            <div className="flex-1 min-h-[400px] relative">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full h-full bg-slate-50 rounded-xl border border-slate-200 p-6 font-mono text-[13px] leading-relaxed text-slate-700 outline-none focus:border-blue-300 transition-all resize-none"
                spellCheck={false}
              />
            </div>
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg flex items-start gap-2.5">
                <Info size={14} className="text-rose-500 shrink-0 mt-0.5" />
                <p className="text-[10px] font-bold text-rose-700 leading-relaxed">{error}</p>
              </div>
            )}
          </section>
        </div>

        {/* Center Side: Simulation */}
        <div className="lg:col-span-5 flex flex-col gap-8">
          <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex-1 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold">SIMULATION</span>
                <h2 className="text-sm font-bold text-slate-900">動作をチェックする</h2>
              </div>
              <div className="px-2 py-0.5 bg-slate-100 rounded text-[9px] font-mono text-slate-500 font-bold">
                LINE_{step.line || 0}
              </div>
            </div>

            <div className="flex-1 flex flex-col gap-6">
              <div className="bg-blue-50/30 border border-blue-100 rounded-2xl p-6 min-h-[140px] flex flex-col gap-4">
                <div className="flex items-center gap-2 opacity-60">
                  <Zap size={14} className="text-blue-600" />
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">EXPLANATION</span>
                </div>
                <p className="text-lg font-bold text-slate-800 leading-tight">
                  {step.description || "「実行ボタン」を押して学習を始めましょう。"}
                </p>
              </div>

              <div className="flex-1 flex flex-col gap-3">
                <div className="flex items-center gap-2 opacity-60 px-1">
                  <Terminal size={14} className="text-emerald-600" />
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">CONSONLE OUTPUT</span>
                </div>
                <div className="bg-slate-900 rounded-2xl p-6 h-48 font-mono text-xs text-emerald-400 leading-loose flex flex-col-reverse overflow-auto">
                  {step.output.slice().reverse().map((line, i) => (
                    <div key={i} className="flex gap-4"><span className="opacity-30">❯</span>{line}</div>
                  ))}
                  {step.output.length === 0 && <span className="opacity-20 italic">出力待ち...</span>}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex items-center gap-6">
              <div className="flex items-center gap-2">
                <button onClick={() => setIsPlaying(!isPlaying)} className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-sm ${isPlaying ? 'bg-amber-100 text-amber-700' : 'bg-blue-600 text-white'}`}>
                  {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-1" />}
                </button>
                <button onClick={reset} className="p-3 bg-slate-100 rounded-xl text-slate-400 hover:text-slate-900 transition-colors"><RotateCcw size={20} /></button>
              </div>
              <div className="flex-1">
                <div className="flex justify-between text-[9px] font-bold text-slate-400 mb-2 uppercase tracking-widest">
                  <span>SPEED</span>
                  <span className="text-blue-600">{speed}ms</span>
                </div>
                <input type="range" min="100" max="980" value={speed} onChange={(e) => setSpeed(parseInt(e.target.value))} className="w-full h-1 bg-slate-100 rounded-full appearance-none accent-blue-600 cursor-pointer" />
              </div>
            </div>
          </section>
        </div>

        {/* Right Side: Memory Map */}
        <div className="lg:col-span-3 flex flex-col gap-8">
          <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex-1 flex flex-col gap-6">
            <div className="flex items-center gap-2">
              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold">MEMORY</span>
              <h2 className="text-sm font-bold text-slate-900">変数の状況</h2>
            </div>

            <div className="flex-1 overflow-auto space-y-8 pr-1">
              {/* Arrays */}
              {Object.entries(step.arrays).map(([name, arr]) => (
                <div key={name} className="space-y-3">
                  <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase">
                    <span>配列：{name}</span>
                    <span className="text-blue-300">SIZE:{arr.length}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {arr.map((val, idx) => (
                      <div key={idx} className="w-10 h-14 bg-slate-50 border border-slate-200 rounded-lg flex flex-col items-center justify-center gap-1">
                        <span className="text-[8px] font-bold text-slate-300">{idx}</span>
                        <span className="text-xs font-bold text-slate-900">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Scalars */}
              <div className="space-y-2.5">
                {Object.entries(step.variables).map(([name, val]) => (
                  <div key={name} className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between group hover:border-blue-100 transition-all">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">{name}</div>
                      <div className="text-[8px] text-blue-400/50 font-bold uppercase tracking-tight">INT_X64</div>
                    </div>
                    <div className="text-xl font-bold text-blue-600 tabular-nums">
                      {val}
                    </div>
                  </div>
                ))}
              </div>

              {Object.keys(step.variables).length === 0 && Object.keys(step.arrays).length === 0 && (
                <div className="flex flex-col items-center justify-center gap-4 py-16 opacity-20 text-slate-400">
                  <Settings2 size={32} strokeWidth={1.5} />
                  <p className="text-[9px] font-bold uppercase text-center px-6 tracking-widest leading-loose">
                    実行中にここに計算結果が表示されます
                  </p>
                </div>
              )}
            </div>

            <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <Info size={14} className="text-blue-500" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600">HINT</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed font-medium capitalize">
                配列 `A = [1, 2, 3]` のように宣言すると、メモリの内容を視覚的に追跡できます。
              </p>
            </div>
          </section>
        </div>
      </main>

      <footer className="max-w-[1400px] mx-auto px-6 py-12 border-t border-slate-200 flex flex-col items-center gap-4">
        <div className="flex items-center gap-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          <a href="#" className="hover:text-slate-900 transition-colors flex items-center gap-1.5">DOCUMENT <ExternalLink size={10} /></a>
          <a href="#" className="hover:text-slate-900 transition-colors flex items-center gap-1.5">GITHUB <ExternalLink size={10} /></a>
          <a href="#" className="hover:text-slate-900 transition-colors flex items-center gap-1.5">LICENSE <ExternalLink size={10} /></a>
        </div>
        <p className="text-[9px] font-medium text-slate-300 uppercase tracking-[0.5em]">© 2026 DNCL Sandbox // Shiroi Programming School</p>
      </footer>
    </div>
  );
}
