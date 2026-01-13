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
  ArrowRight
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
    code: `合計 = 0
n = 10
i を 1 から n まで 1 ずつ増やしながら繰り返す:
    合計 = 合計 + i
    「i = 」, i, 「 : 合計 = 」, 合計 を表示する`
  },
  {
    name: "最大値を求める",
    description: "配列の中から一番大きな値を見つけ出す、実戦的なアルゴリズムです。",
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
    description: "隣り合う要素を比較して入れ替える、有名な並び替えアルゴリズムです。",
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

  const getExprValue = (e: string, vars: Record<string, number>, arrays: Record<string, number[]>) => {
    let p = e.trim();
    // Handle array access: A[i], L[j+1]
    p = p.replace(/([a-zA-Zあ-んア-ン一-龠]+)\[(.*?)\]/g, (match, arrName, idxExpr) => {
      const idx = getExprValue(idxExpr, vars, arrays);
      return arrays[arrName] ? (arrays[arrName][idx] ?? 0).toString() : '0';
    });
    // Replace variables
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

        // 1. Array Assignment: A = [1, 2, 3]
        const arrMatch = line.match(/^([a-zA-Zあ-んア-ン一-龠]+)\s*=\s*\[(.*?)\]$/);
        if (arrMatch) {
          const arrName = arrMatch[1];
          const parts = arrMatch[2].split(',').map(p => getExprValue(p, vars, arrays));
          arrays[arrName] = parts;
          addState(i, `配列「${arrName}」を値 [${parts.join(', ')}] で初期化しました。`);
          i++; continue;
        }

        // 2. Index Assignment: L[j] = val
        const idxAssignMatch = line.match(/^([a-zA-Zあ-んア-ン一-龠]+)\[(.*?)\]\s*=\s*(.+)$/);
        if (idxAssignMatch) {
          const arrName = idxAssignMatch[1];
          const idx = getExprValue(idxAssignMatch[2], vars, arrays);
          const val = getExprValue(idxAssignMatch[3], vars, arrays);
          if (arrays[arrName]) {
            arrays[arrName][idx] = val;
            addState(i, `配列 ${arrName} の ${idx} 番目を ${val} に書き換えました。`);
          }
          i++; continue;
        }

        // 3. Normal Assignment: 合計 = 0
        const assignMatch = line.match(/^([a-zA-Zあ-んア-ン一-龠]+)\s*=\s*(.+)$/);
        if (assignMatch && !line.includes('繰り返す') && !line.includes('ならば') && !line.includes('そうでなければ')) {
          const varName = assignMatch[1];
          vars[varName] = getExprValue(assignMatch[2], vars, arrays);
          addState(i, `変数 ${varName} に新しい値 ${vars[varName]} を覚えさせました。`);
          i++; continue;
        }

        // 4. Loop: i を 1 から n まで 1 ずつ増やしながら繰り返す:
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
                addState(rowIdx, "計算した結果を下のコンソールに表示しました。");
              } else if (bLine.match(/^([a-zA-Zあ-んア-ン一-龠]+)\[(.*?)\]\s*=\s*(.+)$/)) {
                const m = bLine.match(/^([a-zA-Zあ-んア-ン一-龠]+)\[(.*?)\]\s*=\s*(.+)$/);
                if (m) { arrays[m[1]][getExprValue(m[2], vars, arrays)] = getExprValue(m[3], vars, arrays); addState(rowIdx, "ループ内で配列の値を更新しました。"); }
              } else if (bLine.includes('=')) {
                const m = bLine.match(/^([a-zA-Zあ-んア-ン一-龠]+)\s*=\s*(.+)$/);
                if (m) { vars[m[1]] = getExprValue(m[2], vars, arrays); addState(rowIdx, "ループ内で変数の値を更新しました。"); }
              }
            }
          }
          i = bIdx; continue;
        }

        // 5. If: もし ... ならば:
        const ifMatch = line.match(/^もし\s*(.+)\s*ならば:$/);
        if (ifMatch) {
          const result = getExprValue(ifMatch[1], vars, arrays);
          addState(i, `条件をチェックしています。判定は「${result ? 'YES' : 'NO'}」でした。`);

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
              addState(t, "条件に合った処理として画面に表示しました。");
            } else if (row.includes('=')) {
              const m = row.match(/^([a-zA-Zあ-んア-ン一-龠]+)(.*)\s*=\s*(.+)$/);
              if (m) {
                if (m[2].includes('[')) arrays[m[1]][getExprValue(m[2].slice(1, -1), vars, arrays)] = getExprValue(m[3], vars, arrays);
                else vars[m[1]] = getExprValue(m[3], vars, arrays);
                addState(t, "条件に合ったので値を更新しました。");
              }
            }
          }
          i = currIdx; continue;
        }

        // 6. Global Print
        if (line.includes('を表示する')) {
          logs.push(line.replace('を表示する', '').split(',').map(p => {
            const part = p.trim();
            return (part.startsWith('「') && part.endsWith('」')) ? part.slice(1, -1) : getExprValue(part, vars, arrays).toString();
          }).join(''));
          addState(i, "メッセージを画面に表示しました。");
        }

        i++;
      }
      addState(lines.length - 1, "すべての処理が正常に完了しました！お疲れ様でした。");
      setSteps(states);
      setCurrentIdx(0);
    } catch (e) {
      setError("コードの中に間違いがあるようです。インデントや書き方を確認してください。");
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
    <div className="min-h-screen bg-[#faf9f6] text-slate-800 font-sans selection:bg-indigo-100 paper-texture">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <GraduationCap className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="font-black text-xl tracking-tight text-slate-900">DNCL サンドボックス</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Digital Textbook Studio</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={runCode} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-sm transition-all shadow-xl shadow-indigo-100 flex items-center gap-2 group">
              <Play size={16} className="fill-current" /> 実行して学ぶ
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <a href="https://github.com/iidaatcnt/dncl-sandbox" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-slate-900 transition-colors">
              <Github size={20} />
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Step 1: Library & Editor */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          <section className="glass-panel p-8 rounded-[2.5rem] bg-indigo-50/30 border-indigo-100 shadow-sm">
            <div className="flex flex-col gap-1 mb-6">
              <div className="step-indicator">Step 01</div>
              <h2 className="text-lg font-black text-slate-900">プログラムを選ぶ</h2>
              <p className="text-xs text-slate-500 font-medium">まずは定番のアルゴリズムから試してみましょう。</p>
            </div>
            <div className="space-y-3">
              {PRESETS.map(p => (
                <button
                  key={p.name}
                  onClick={() => { setCode(p.code); reset(); }}
                  className={`w-full text-left p-4 rounded-2xl border transition-all flex flex-col gap-1 group ${code === p.code ? 'bg-white border-indigo-200 shadow-md' : 'bg-transparent border-slate-100 hover:border-indigo-100 hover:bg-white/50'}`}
                >
                  <span className={`text-sm font-bold ${code === p.code ? 'text-indigo-600' : 'text-slate-700'}`}>{p.name}</span>
                  <span className="text-[10px] text-slate-400 font-medium leading-relaxed">{p.description}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="glass-panel p-8 rounded-[2.5rem] flex-1 flex flex-col gap-6 bg-white shadow-xl relative overflow-hidden">
            <div className="flex flex-col gap-1">
              <div className="step-indicator">Step 02</div>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-slate-900">コードを自由に書く</h2>
                <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-lg">
                  <Save size={12} className="text-emerald-500" />
                  <span className="text-[9px] font-black text-emerald-600 uppercase">Auto-Save</span>
                </div>
              </div>
            </div>
            <div className="flex-1 relative">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full h-full bg-slate-50 rounded-2xl border border-slate-100 p-8 font-mono text-[14px] leading-relaxed text-slate-800 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-200 transition-all resize-none shadow-inner"
                spellCheck={false}
              />
              <div className="absolute top-4 right-6 opacity-40 text-[8px] font-black text-slate-400 uppercase tracking-widest pointer-events-none font-mono">DNCL Compiler</div>
            </div>
            {error && (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-3">
                <Info size={16} className="text-rose-500 shrink-0 mt-0.5" />
                <p className="text-[11px] font-bold text-rose-600 leading-relaxed uppercase tracking-wider">{error}</p>
              </div>
            )}
          </section>
        </div>

        {/* Step 3: Simulation */}
        <div className="lg:col-span-5 flex flex-col gap-8">
          <section className="glass-panel p-10 rounded-[3rem] h-full flex flex-col gap-8 overflow-hidden bg-white shadow-2xl relative">
            <div className="flex flex-col gap-1">
              <div className="step-indicator">Step 03</div>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-slate-900">動きを観察する</h2>
                <div className="px-3 py-1 bg-slate-100 rounded-full font-mono text-[10px] text-slate-500 font-bold">
                  現在：{step.line || 0} 行目
                </div>
              </div>
            </div>

            <div className="flex-1 flex flex-col gap-8">
              <div className="bg-indigo-50/50 rounded-3xl p-8 border border-indigo-100/50 relative overflow-hidden flex flex-col gap-6">
                <div className="flex items-center gap-2 opacity-50">
                  <Zap size={16} className="text-indigo-600 fill-current" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-600">今の処理の説明</span>
                </div>
                <p className="text-xl font-black text-slate-900 leading-tight">
                  {step.description || "「実行ボタン」を押して、シミュレーションを始めましょう！"}
                </p>
                {isPlaying && (
                  <motion.div
                    animate={{ opacity: [0.1, 0.3, 0.1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="absolute right-8 top-8"
                  >
                    <Cpu size={32} className="text-indigo-200" />
                  </motion.div>
                )}
              </div>

              <div className="flex-1 flex flex-col gap-4">
                <div className="flex items-center gap-2 opacity-50 px-2">
                  <Terminal size={16} className="text-emerald-600" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-600">画面への出力（結果）</span>
                </div>
                <div className="bg-slate-900 rounded-3xl p-8 h-48 font-mono text-xs text-emerald-400 leading-loose flex flex-col-reverse overflow-auto shadow-2xl">
                  {step.output.slice().reverse().map((line, i) => (
                    <div key={i} className="flex gap-4"><span className="opacity-30">❯</span>{line}</div>
                  ))}
                  {step.output.length === 0 && <span className="opacity-20 italic">まだ何も表示されていません</span>}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6 pt-6 border-t border-slate-100">
              <div className="flex items-center gap-3">
                <button onClick={() => setIsPlaying(!isPlaying)} className={`w-16 h-16 rounded-3xl flex items-center justify-center transition-all shadow-xl ${isPlaying ? 'bg-amber-100 text-amber-700 ring-4 ring-amber-50' : 'bg-indigo-600 text-white shadow-indigo-200'}`}>
                  {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
                </button>
                <button onClick={reset} className="p-4 bg-slate-100 rounded-2xl text-slate-400 hover:text-slate-900 transition-colors" title="リセット"><RotateCcw size={20} /></button>
              </div>
              <div className="flex-1">
                <div className="flex justify-between text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
                  <span>実行スピード調整</span>
                  <span className="text-indigo-600">{(speed / 10).toFixed(0)}%</span>
                </div>
                <input type="range" min="100" max="980" value={speed} onChange={(e) => setSpeed(parseInt(e.target.value))} className="w-full h-1.5 bg-slate-100 rounded-full appearance-none accent-indigo-600 cursor-pointer" />
              </div>
            </div>
             section>
        </div>

        {/* Step 4: Memory Map */}
        <div className="lg:col-span-3 flex flex-col gap-8">
          <section className="glass-panel p-10 rounded-[3.5rem] shadow-xl flex flex-col h-full gap-8 bg-white border-slate-100">
            <div className="flex flex-col gap-1">
              <div className="step-indicator">Step 04</div>
              <h2 className="text-lg font-black text-slate-900">頭の中をのぞく</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Computed Memory Map</p>
            </div>

            <div className="space-y-8 flex-1 overflow-auto scrollbar-hide">
              {/* Array Viewer */}
              {Object.entries(step.arrays).map(([name, arr]) => (
                <div key={name} className="space-y-4">
                  <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase">
                    <span>配列：{name}</span>
                    <span className="text-indigo-200">要素数：{arr.length}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {arr.map((val, idx) => (
                      <motion.div
                        key={idx}
                        animate={{ scale: isPlaying ? [1, 1.05, 1] : 1 }}
                        className="w-12 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col items-center justify-center gap-1 shadow-sm"
                      >
                        <span className="text-[9px] font-bold text-slate-300">{idx}</span>
                        <span className="text-sm font-black text-slate-900">{val}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Scalar Variables */}
              <div className="space-y-3">
                {Object.entries(step.variables).map(([name, val]) => (
                  <div key={name} className="p-6 bg-slate-50 border border-slate-100 rounded-[2.5rem] flex items-center justify-between shadow-sm group hover:bg-white hover:border-indigo-100 transition-all">
                    <div>
                      <div className="text-[11px] font-black text-slate-400 uppercase mb-0.5">{name}</div>
                      <div className="text-[8px] text-indigo-400/50 font-bold uppercase">Basic Integer</div>
                    </div>
                    <div className="text-2xl font-black text-indigo-600 tabular-nums px-4 py-1">
                      {val}
                    </div>
                  </div>
                ))}
              </div>

              {Object.keys(step.variables).length === 0 && Object.keys(step.arrays).length === 0 && (
                <div className="flex flex-col items-center justify-center gap-6 py-20 opacity-20 text-slate-400">
                  <Settings2 size={48} strokeWidth={1} />
                  <p className="text-[10px] font-black uppercase text-center px-10 tracking-[0.2em] leading-loose">
                    実行するとここに変数の状況が表示されます
                  </p>
                </div>
              )}
            </div>

            <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 relative overflow-hidden">
              <div className="flex items-center gap-3 mb-4">
                <Info size={16} className="text-indigo-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">学習のヒント</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed font-bold">
                コンピュータは1つずつ順番に命令をこなします。右の「変数の値」がどう変わるかに注目してくださいね！
              </p>
            </div>
          </section>
        </div>
      </main>

      <footer className="mt-20 border-t border-slate-100 py-16 text-center">
        <div className="flex flex-col items-center gap-6">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.8em]">DNCL Sandbox // Future Architecture Project</p>
        </div>
      </footer>

      <style jsx global>{`
        .glass-panel {
          backdrop-filter: blur(16px);
        }
        .paper-texture {
            background-color: #faf9f6;
            background-image: radial-gradient(#e5e7eb 0.5px, transparent 0.5px);
            background-size: 24px 24px;
        }
      `}</style>
    </div>
  );
}
