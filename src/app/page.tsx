'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
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
  ChevronLeft,
  BookOpen,
  Eye,
  CheckCircle2,
  HelpCircle,
  Hash
} from 'lucide-react';

import { PRESETS, Lesson } from '../constants/lessons';

// --- DNCL Interpreter Core ---
interface VMState {
  line: number;
  variables: Record<string, number>;
  arrays: Record<string, number[]>;
  output: string[];
  description: string;
}

function DNCLProgateStudio() {
  const searchParams = useSearchParams();
  const lessonId = searchParams.get('id');

  const [selectedPreset, setSelectedPreset] = useState<Lesson>(PRESETS[0]);
  const [code, setCode] = useState(PRESETS[0].code);

  useEffect(() => {
    if (lessonId) {
      const found = PRESETS.find(p => p.id === parseInt(lessonId));
      if (found) {
        setSelectedPreset(found);
        setCode(found.code);
      }
    }
  }, [lessonId]);
  const [steps, setSteps] = useState<VMState[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(850);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('dncl-sandbox-code');
    if (saved) setCode(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem('dncl-sandbox-code', code);
  }, [code, selectedPreset]);

  // --- Revised Evaluator for DNCL Specifications ---
  const getExprValue = (e: string, vars: Record<string, number>, arrays: Record<string, number[]>) => {
    let p = e.trim();

    // 1. Comparison & Logic Normalization
    p = p.replace(/≧/g, ' >= ');
    p = p.replace(/≦/g, ' <= ');
    p = p.replace(/≠/g, ' !== ');
    p = p.replace(/ かつ /g, ' && ');
    p = p.replace(/ または /g, ' || ');
    p = p.replace(/ でない/g, ' ! ');

    // 2. Arithmetic Normalization
    p = p.replace(/÷/g, ' / '); // We will handle floor later by wrap
    p = p.replace(/％/g, ' % ');
    p = p.replace(/＋/g, ' + ');
    p = p.replace(/－/g, ' - ');
    p = p.replace(/＊/g, ' * ');

    // 3. Array Access: A[i]
    p = p.replace(/([a-zA-Zあ-んア-ン一-龠]+)\[(.*?)\]/g, (match, arrName, idxExpr) => {
      const idx = getExprValue(idxExpr, vars, arrays);
      return arrays[arrName] ? (arrays[arrName][idx] ?? 0).toString() : '0';
    });

    // 4. Variables replacement
    const vNames = Object.keys(vars).sort((a, b) => b.length - a.length);
    vNames.forEach(v => {
      // Use word boundary for safety
      p = p.replace(new RegExp(`\\b${v}\\b`, 'g'), vars[v].toString());
    });

    // Handle "÷" special case: in DNCL, "÷" usually means integer division
    // If we replaced ÷ with /, let's wrap it in Math.floor if it's meant to be integer division
    // However, the standard says " / " for real division and " ÷ " for integer.
    if (e.includes('÷')) {
      try {
        return Math.floor(Function(`"use strict"; return (${p})`)());
      } catch { return 0; }
    }

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

    const findBlockEnd = (startIndex: number, baseIndent: number) => {
      let bIdx = startIndex + 1;
      const blockLines: number[] = [];
      while (bIdx < lines.length) {
        const row = lines[bIdx];
        if (row.trim() === '') { bIdx++; continue; }
        const rowIndent = row.match(/^\s*/)?.[0].length || 0;
        if (rowIndent > baseIndent) {
          blockLines.push(bIdx);
          bIdx++;
        } else {
          break;
        }
      }
      return { blockLines, nextIndex: bIdx };
    };

    try {
      setError(null);
      let i = 0;
      const MAX_STEPS = 5000; // Prevention of infinite loops
      let stepCount = 0;

      while (i < lines.length && stepCount < MAX_STEPS) {
        stepCount++;
        const lineRaw = lines[i];
        const line = lineRaw.trim();
        if (!line || line.startsWith('//') || line.startsWith('#')) { i++; continue; }

        // 1. Array Assignment: A = [1, 2, 3]
        const arrMatch = line.match(/^([a-zA-Zあ-んア-ン一-龠]+)\s*=\s*\[(.*?)\]$/);
        if (arrMatch) {
          const arrName = arrMatch[1];
          const parts = arrMatch[2].split(',').map(p => getExprValue(p, vars, arrays));
          arrays[arrName] = parts;
          addState(i, `配列「${arrName}」を値 [${parts.join(', ')}] で作成しました。`);
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
            addState(i, `${arrName} の ${idx} 番目の箱に ${val} を入れました。`);
          }
          i++; continue;
        }

        // 3. Loop: For
        const loopMatch = line.match(/^([a-zA-Zあ-んア-ン一-龠]+)\s*を\s*(.+)\s*から\s*(.+)\s*まで\s*(.+)\s*ずつ増やしながら繰り返す:$/);
        if (loopMatch) {
          const counter = loopMatch[1];
          const start = getExprValue(loopMatch[2], vars, arrays);
          const end = getExprValue(loopMatch[3], vars, arrays);
          const stepSize = getExprValue(loopMatch[4], vars, arrays);

          const baseIndent = lines[i].match(/^\s*/)?.[0].length || 0;
          const { blockLines, nextIndex } = findBlockEnd(i, baseIndent);

          for (let val = start; val <= end; val += stepSize) {
            vars[counter] = val;
            addState(i, `繰り返し中（${counter} = ${val}）。次の命令に進みます。`);
            // Here for simplicity, we process the block lines one by one in the simulation
            for (const rowIdx of blockLines) {
              const bLine = lines[rowIdx].trim();
              processLine(bLine, rowIdx);
            }
          }
          i = nextIndex; continue;
        }

        // 4. Loop: While
        const whileMatch = line.match(/^(.+)\s*が成り立つ間繰り返す:$/);
        if (whileMatch) {
          const condStr = whileMatch[1];
          const baseIndent = lines[i].match(/^\s*/)?.[0].length || 0;
          const { blockLines, nextIndex } = findBlockEnd(i, baseIndent);

          while (getExprValue(condStr, vars, arrays)) {
            addState(i, `条件「${condStr}」が成り立つので、中を実行します。`);
            for (const rowIdx of blockLines) {
              processLine(lines[rowIdx].trim(), rowIdx);
            }
            if (stepCount++ > MAX_STEPS) break;
          }
          addState(i, `条件が成り立たなくなったので、繰り返しを抜けます。`);
          i = nextIndex; continue;
        }

        // 5. If
        const ifMatch = line.match(/^もし\s*(.+)\s*ならば:$/);
        if (ifMatch) {
          const result = getExprValue(ifMatch[1], vars, arrays);
          addState(i, `もし「${ifMatch[1]}」・・・判定は ${result ? '成立' : '不成立'} です。`);

          const baseIndent = lines[i].match(/^\s*/)?.[0].length || 0;
          const { blockLines: thenBlock, nextIndex: nextAfterThen } = findBlockEnd(i, baseIndent);

          let elseBlock: number[] = [];
          let nextToJump = nextAfterThen;
          if (nextAfterThen < lines.length && lines[nextAfterThen].trim() === 'そうでなければ:') {
            const { blockLines: eb, nextIndex: nextAfterElse } = findBlockEnd(nextAfterThen, baseIndent);
            elseBlock = eb;
            nextToJump = nextAfterElse;
          }

          const target = result ? thenBlock : elseBlock;
          for (const t of target) {
            processLine(lines[t].trim(), t);
          }
          i = nextToJump; continue;
        }

        // 6. Assignment or Output
        processLine(line, i);
        i++;
      }

      function processLine(l: string, idx: number) {
        if (l.includes('を表示する')) {
          const parts = l.replace('を表示する', '').split(',').map(p => {
            const part = p.trim();
            if (part.startsWith('「') && part.endsWith('」')) return part.slice(1, -1);
            return getExprValue(part, vars, arrays).toString();
          });
          logs.push(parts.join(''));
          addState(idx, `画面に「${parts.join('')}」と表示しました。`);
        } else if (l.includes('=') && !l.includes('もし') && !l.includes('繰り返す')) {
          const m = l.match(/^([a-zA-Zあ-んア-ン一-龠]+)\s*=\s*(.+)$/);
          if (m) {
            vars[m[1]] = getExprValue(m[2], vars, arrays);
            addState(idx, `${m[1]} の値を ${vars[m[1]]} に更新しました。`);
          }
        } else if (l.match(/^([a-zA-Zあ-んア-ン一-龠]+)\[(.*?)\]\s*=\s*(.+)$/)) {
          // Secondary check for nested assignments
          const m = l.match(/^([a-zA-Zあ-んア-ン一-龠]+)\[(.*?)\]\s*=\s*(.+)$/);
          if (m) {
            const arrName = m[1];
            const arrIdx = getExprValue(m[2], vars, arrays);
            const val = getExprValue(m[3], vars, arrays);
            arrays[arrName][arrIdx] = val;
            addState(idx, `${arrName}[${arrIdx}] を ${val} に書き換えました。`);
          }
        }
      }

      addState(lines.length - 1, "すべてのプログラムが完了しました！");
      setSteps(states);
      setCurrentIdx(0);
    } catch (e) {
      setError("エラー：プログラムの解釈に失敗しました。書き方を見直してください。");
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
    <div className="h-screen bg-[#f4f7f8] text-[#2b3a4a] flex flex-col overflow-hidden font-sans">
      {/* Header */}
      <header className="h-12 bg-white border-b border-[#e1e8ed] flex items-center justify-between px-4 shrink-0 z-50">
        <div className="flex items-center gap-3">
          <Link href="/lessons" className="flex items-center gap-1.5 bg-[#253341] text-white px-2 py-1 rounded cursor-pointer active:scale-95 transition-transform">
            <span className="font-black text-xs">P</span>
          </Link>
          <div className="h-4 w-[1px] bg-[#e1e8ed] mx-1" />
          <nav className="flex items-center gap-4 text-[11px] font-bold text-[#8899a6]">
            <Link href="/lessons" className="hover:text-[#2b3a4a] transition-colors">共通テスト：情報I 対策</Link>
            <ChevronRight size={12} className="opacity-40" />
            <Link href="/reference" className="hover:text-[#2b3a4a] transition-colors">リファレンス</Link>
            <ChevronRight size={12} className="opacity-40" />
            <div className="text-[#2b3a4a] border-b border-[#20a0d0] pb-0.5">
              {selectedPreset.name}
            </div>
          </nav>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-slate-200 border border-white overflow-hidden shadow-sm flex items-center justify-center">
              <Hash size={12} className="text-slate-400" />
            </div>
            <span className="text-[10px] font-black text-[#2b3a4a]">miidacnt(Lv.7)</span>
          </div>
          <Link href="/lessons">
            <LayoutGrid size={18} className="text-[#8899a6] hover:text-[#20a0d0] cursor-pointer transition-colors" />
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">

        {/* Left: Instructions */}
        <aside className="w-[300px] xl:w-[340px] bg-white border-r border-[#e1e8ed] flex flex-col shrink-0 overflow-y-auto scrollbar-hide">
          <div className="p-4 border-b border-[#e1e8ed] flex items-center justify-between font-black text-[11px] text-[#2b3a4a] bg-slate-50/50">
            <div className="flex items-center gap-2">
              <BookOpen size={16} className="text-[#20a0d0]" />
              手順
            </div>
            <span className="bg-[#20a0d0] text-white px-1.5 py-0.5 rounded-[2px] text-[9px]">DNCL v2.0</span>
          </div>
          <div className="p-5">
            <div className="task-card">
              <div className="task-card-header">
                <Code2 size={12} />
                MISSION #{selectedPreset.id}
              </div>
              <p className="text-xs font-bold leading-relaxed mb-6 text-[#2b3a4a]">
                『{selectedPreset.task_title}』<br /><br />
                {selectedPreset.instruction}
              </p>
              <div className="space-y-4">
                {selectedPreset.steps.map((s, idx) => (
                  <div key={idx} className="flex gap-3 items-start group">
                    <div className="w-5 h-5 rounded-full border-2 border-[#e1e8ed] flex items-center justify-center shrink-0 mt-0.5 group-hover:border-[#20a0d0] transition-colors">
                      <span className="text-[9px] font-black text-[#8899a6] group-hover:text-[#20a0d0]">{idx + 1}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] font-bold text-[#2b3a4a]">{s.text}</span>
                      <code className="text-[9px] font-mono text-[#8899a6] bg-slate-50 px-1 py-0.5 rounded">{s.code}</code>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={runCode}
                className="mt-8 w-full py-3 bg-[#20a0d0] text-white rounded font-black text-xs flex items-center justify-center gap-2 hover:bg-[#1c8cb8] transition-all shadow-md active:scale-[0.98]"
              >
                <Play size={14} className="fill-current" /> プログラムを実行
              </button>
            </div>

            <div className="mt-8 space-y-2">
              <div className="text-[10px] font-black text-[#8899a6] uppercase tracking-widest pl-1 mb-2">Lesson Map</div>
              <div className="grid grid-cols-2 gap-2">
                {PRESETS.map(p => (
                  <button
                    key={p.id}
                    onClick={() => { setSelectedPreset(p); setCode(p.code); reset(); }}
                    className={`h-10 rounded border text-[10px] font-black transition-all ${selectedPreset.id === p.id ? 'bg-[#20a0d0] border-[#20a0d0] text-white shadow-inner' : 'bg-white border-[#e1e8ed] text-[#8899a6] hover:border-[#20a0d0] hover:text-[#20a0d0]'}`}
                  >
                    Challenge {p.id}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Center: Editor */}
        <section className="flex-1 flex flex-col shrink-0 min-w-0">
          <div className="editor-tabs">
            <div className="editor-tab active flex gap-2">
              <Hash size={12} className="opacity-50" /> program.dncl
            </div>
            <div className="editor-tab">references.txt</div>
            <div className="flex-1" />
            <div className="flex items-center gap-4 px-4">
              <div className="flex items-center gap-1.5 opacity-40">
                <Save size={12} className="text-[#00c2b0]" />
                <span className="text-[9px] font-black text-white">AUTO-SAVE</span>
              </div>
              <Settings2 size={14} className="text-[#8899a6]" />
            </div>
          </div>

          <div className="flex-1 bg-[#253341] relative flex overflow-hidden">
            <div className="w-12 bg-[#1b2937] text-[#4d5b69] font-mono text-[11px] py-4 text-center shrink-0 leading-loose border-r border-[#101921]">
              {Array.from({ length: 25 }).map((_, i) => (
                <div key={i} className={currentIdx < steps.length && steps[currentIdx].line === i + 1 ? 'text-[#20a0d0] bg-[#101921] font-bold' : ''}>
                  {String(i + 1).padStart(2, '0')}
                </div>
              ))}
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="flex-1 bg-transparent p-6 font-mono text-[15px] leading-relaxed text-[#ffffff] outline-none resize-none caret-[#20a0d0] selection:bg-[#20a0d033]"
              spellCheck={false}
            />

            {isPlaying && step.line > 0 && (
              <div
                className="absolute left-12 right-0 bg-[#20a0d0]/5 pointer-events-none transition-all duration-150"
                style={{ top: `${(step.line - 1) * 25.5 + 24}px`, height: '24px', borderLeft: '3px solid #00c2b0' }}
              />
            )}
          </div>

          <div className="editor-footer">
            <button onClick={reset} className="text-[#8899a6] text-[11px] font-black flex items-center gap-2 hover:text-white transition-colors uppercase">
              <RotateCcw size={14} /> Reset
            </button>
            <button className="text-[#8899a6] text-[11px] font-black flex items-center gap-2 hover:text-white transition-colors uppercase">
              <Eye size={14} /> Answer
            </button>
            <div className="flex-1" />
            <button
              onClick={runCode}
              className="px-10 py-2.5 bg-[#00c2b0] hover:bg-[#00daba] text-white rounded font-black text-xs transition-all active:scale-95 shadow-[0_4px_0_0_#008c7e]"
            >
              できた！
            </button>
          </div>
        </section>

        {/* Right: Preview & Memory */}
        <aside className="w-[340px] bg-white border-l border-[#e1e8ed] flex flex-col shrink-0 overflow-hidden">

          <div className="h-1/2 flex flex-col border-b border-[#e1e8ed]">
            <div className="px-4 h-9 flex items-center justify-between bg-slate-50 border-b border-[#e1e8ed]">
              <div className="flex items-center gap-2 text-[10px] font-black text-[#2b3a4a]">
                <Terminal size={12} className="text-[#20a0d0]" />
                実行プレビュー
              </div>
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
            </div>
            <div className="flex-1 p-6 font-mono text-xs leading-relaxed text-[#2b3a4a] overflow-y-auto bg-white">
              <div className="flex flex-col gap-2">
                {step.output.map((line, i) => (
                  <div key={i} className="flex gap-3 border-l-2 border-emerald-100 pl-3">
                    <span className="text-[#8899a6] opacity-30 select-none">#</span>
                    {line}
                  </div>
                ))}
                {step.output.length === 0 && <div className="text-[#cbd5e1] italic">出力メッセージを待機中...</div>}
              </div>
            </div>
          </div>

          <div className="h-1/2 flex flex-col">
            <div className="px-4 h-9 flex items-center justify-between bg-slate-50 border-b border-[#e1e8ed]">
              <div className="flex items-center gap-2 text-[10px] font-black text-[#2b3a4a]">
                <CpuIcon size={12} className="text-[#20a0d0]" />
                内部メモリスナップショット
              </div>
            </div>
            <div className="flex-1 p-5 overflow-y-auto scrollbar-hide space-y-6">
              <div className="bg-[#ebf6f7] border border-[#20a0d033] p-4 rounded-lg">
                <span className="text-[9px] font-black text-[#20a0d0] uppercase tracking-widest block mb-1.5 underline decoration-2">SIMULATION INSIGHT</span>
                <div className="text-[11px] font-bold text-[#2b3a4a] leading-relaxed">
                  {step.description || "実行ボタンを押すと、ここに行ごとの解説が表示されます。"}
                </div>
              </div>

              <div className="space-y-5">
                {Object.entries(step.arrays).map(([name, arr]) => (
                  <div key={name} className="animate-in fade-in slide-in-from-right-2 duration-300">
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-[10px] font-black text-[#2b3a4a]">{name}</span>
                      <span className="text-[8px] font-bold text-[#8899a6]">ARRAY({arr.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {arr.map((v, i) => (
                        <div key={i} className="w-8 h-10 bg-white border border-[#e1e8ed] rounded-md flex flex-col items-center justify-center shadow-sm relative overflow-hidden group">
                          <span className="text-[7px] font-bold text-[#8899a6] opacity-50 absolute top-0.5">{i}</span>
                          <span className="text-[10px] font-black text-[#2b3a4a] mt-1">{v}</span>
                          <div className="absolute inset-0 bg-[#20a0d011] opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(step.variables).map(([name, val]) => (
                    <div key={name} className="p-3 border border-[#e1e8ed] rounded-lg bg-white flex flex-col gap-1 shadow-sm hover:border-[#20a0d033] transition-colors">
                      <span className="text-[9px] font-black text-[#8899a6] uppercase tracking-tighter">{name}</span>
                      <span className="text-sm font-black text-[#20a0d0] tabular-nums">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </aside>
      </main>

      {/* Footer */}
      <footer className="h-12 bg-white border-t border-[#e1e8ed] flex items-center justify-between px-6 shrink-0 z-50">
        <button className="bg-[#20a0d0] hover:bg-[#1c8cb8] text-white px-5 py-2 rounded font-black text-[10px] flex items-center gap-2 transition-all shadow-md active:scale-95">
          <BookOpen size={14} /> スライドで学習する
        </button>

        <div className="flex items-center gap-8">
          <div className="flex items-center gap-4">
            <div className="w-32 h-2 bg-[#e1e8ed] rounded-full overflow-hidden">
              <div className="h-full bg-[#5ed291] transition-all duration-500" style={{ width: `${(selectedPreset.id / PRESETS.length) * 100}%` }} />
            </div>
            <span className="text-[10px] font-black text-[#8899a6] tracking-tighter">
              {selectedPreset.id} / {PRESETS.length} レッスン完了
            </span>
          </div>
          <div className="h-4 w-[1px] bg-[#e1e8ed]" />
          <button className="text-[10px] font-black text-[#20a0d0] hover:underline">復習して身につける</button>
          <div className="h-12 w-48 bg-[#ff6a7a] flex items-center justify-center text-white gap-2 font-black text-[11px] shadow-[inset_0_-4px_0_0_#e55f6d] cursor-pointer hover:bg-[#ff7b8a] transition-colors">
            <HelpCircle size={14} /> よくある質問
          </div>
        </div>
      </footer>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .paper-texture {
            background-color: #f4f7f8;
            background-image: radial-gradient(#d1dce5 0.6px, transparent 0.6px);
            background-size: 24px 24px;
        }
      `}</style>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DNCLProgateStudio />
    </Suspense>
  );
}
