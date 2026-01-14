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
  ChevronLeft,
  BookOpen,
  Eye,
  CheckCircle2,
  HelpCircle
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
    id: 1,
    name: "基本の合計",
    task_title: "順次処理と繰り返し",
    instruction: "1から10までの合計を計算して表示してみましょう。変数『合計』を活用してください。",
    steps: [
      { text: "変数『合計』を 0 で初期化する", code: "合計 = 0" },
      { text: "1から10まで、1ずつ増やす繰り返しを作る", code: "i を 1 から 10 まで 1 ずつ増やしながら繰り返す:" },
      { text: "繰り返しの中で、合計に i を足していく", code: "    合計 = 合計 + i" }
    ],
    code: `合計 = 0
n = 10
i を 1 から n まで 1 ずつ増やしながら繰り返す:
    合計 = 合計 + i
    「i = 」, i, 「 : 合計 = 」, 合計 を表示する`
  },
  {
    id: 2,
    name: "最大値を求める",
    task_title: "配列と条件分岐",
    instruction: "配列Aの中から最も大きい値を探しましょう。初期値をA[0]とするのがコツです。",
    steps: [
      { text: "配列 A を宣言する", code: "A = [12, 45, 23, 67, 31]" },
      { text: "変数『最大』に A[0] を代入する", code: "最大 = A[0]" },
      { text: "条件分岐『もし A[i] > 最大 ならば』を使う", code: "もし A[i] > 最大 ならば:" }
    ],
    code: `A = [12, 45, 23, 67, 31]
最大 = A[0]
i を 1 から 4 まで 1 ずつ増やしながら繰り返す:
    もし A[i] > 最大 ならば:
        最大 = A[i]
        「新しい最大値Found: 」, 最大 を表示する
「最終的な最大値は 」, 最大 を表示する`
  },
  {
    id: 3,
    name: "バブルソート",
    task_title: "二重ループと要素交換",
    instruction: "隣り合う要素を比較して入れ替えることで、配列を小さい順に並べ替えます。",
    steps: [
      { text: "二重の繰り返し構造を作る", code: "j を 0 から ... 繰り返す:" },
      { text: "一時保管用の変数『tmp』を使って値を交換する", code: "tmp = L[j]\nL[j] = L[j+1]\nL[j+1] = tmp" }
    ],
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

export default function DNCLProgateStudio() {
  const [selectedPreset, setSelectedPreset] = useState(PRESETS[0]);
  const [code, setCode] = useState(PRESETS[0].code);
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
          addState(i, `配列「${arrName}」を準備しました。`);
          i++; continue;
        }

        const idxAssignMatch = line.match(/^([a-zA-Zあ-んア-ン一-龠]+)\[(.*?)\]\s*=\s*(.+)$/);
        if (idxAssignMatch) {
          const arrName = idxAssignMatch[1];
          const idx = getExprValue(idxAssignMatch[2], vars, arrays);
          const val = getExprValue(idxAssignMatch[3], vars, arrays);
          if (arrays[arrName]) {
            arrays[arrName][idx] = val;
            addState(i, `${arrName} の ${idx} 番目の値を書き換えました。`);
          }
          i++; continue;
        }

        const assignMatch = line.match(/^([a-zA-Zあ-んア-ン一-龠]+)\s*=\s*(.+)$/);
        if (assignMatch && !line.includes('繰り返す') && !line.includes('ならば') && !line.includes('そうでなければ')) {
          const varName = assignMatch[1];
          vars[varName] = getExprValue(assignMatch[2], vars, arrays);
          addState(i, `${varName} に新しい値を入れました。`);
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
            addState(i, `繰り返し（${counter} = ${val}）を実行中です。`);
            for (const rowIdx of block) {
              const bLine = lines[rowIdx].trim();
              if (bLine.includes('を表示する')) {
                const content = bLine.replace('を表示する', '').split(',').map(part => {
                  const p = part.trim();
                  if (p.startsWith('「') && p.endsWith('」')) return p.slice(1, -1);
                  return getExprValue(p, vars, arrays).toString();
                }).join('');
                logs.push(content);
                addState(rowIdx, "コンソールに表示しました。");
              } else if (bLine.match(/^([a-zA-Zあ-んア-ン一-龠]+)\[(.*?)\]\s*=\s*(.+)$/)) {
                const m = bLine.match(/^([a-zA-Zあ-んア-ン一-龠]+)\[(.*?)\]\s*=\s*(.+)$/);
                if (m) { arrays[m[1]][getExprValue(m[2], vars, arrays)] = getExprValue(m[3], vars, arrays); addState(rowIdx, "配列の値を更新しました。"); }
              } else if (bLine.includes('=')) {
                const m = bLine.match(/^([a-zA-Zあ-んア-ン一-龠]+)\s*=\s*(.+)$/);
                if (m) { vars[m[1]] = getExprValue(m[2], vars, arrays); addState(rowIdx, "変数の値を更新しました。"); }
              }
            }
          }
          i = bIdx; continue;
        }

        const ifMatch = line.match(/^もし\s*(.+)\s*ならば:$/);
        if (ifMatch) {
          const result = getExprValue(ifMatch[1], vars, arrays);
          addState(i, `「もし」の条件を確認中... (${result ? 'Yes' : 'No'})`);

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
              addState(t, "コンソールの表示を更新しました。");
            } else if (row.includes('=')) {
              const m = row.match(/^([a-zA-Zあ-んア-ン一-龠]+)(.*)\s*=\s*(.+)$/);
              if (m) {
                if (m[2].includes('[')) arrays[m[1]][getExprValue(m[2].slice(1, -1), vars, arrays)] = getExprValue(m[3], vars, arrays);
                else vars[m[1]] = getExprValue(m[3], vars, arrays);
                addState(t, "値をセットしました。");
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
          addState(i, "コンソールに出力しました。");
        }
        i++;
      }
      addState(lines.length - 1, "すべての処理が終了しました。");
      setSteps(states);
      setCurrentIdx(0);
    } catch (e) {
      setError("構文エラー：書き方を確認してください。");
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
      <header className="h-12 bg-white border-b border-[#e1e8ed] flex items-center justify-between px-4 shrink-0 transition-all z-50">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-[#253341] text-white px-2 py-1 rounded cursor-pointer">
            <span className="font-black text-xs">P</span>
          </div>
          <div className="h-4 w-[1px] bg-[#e1e8ed] mx-1" />
          <nav className="flex items-center gap-2 text-[11px] font-bold text-[#8899a6]">
            <span>共通テスト：情報I 演習</span>
            <ChevronRight size={14} />
            <span>アルゴリズムとプログラミング</span>
            <ChevronRight size={14} />
            <div className="relative group">
              <span className="text-[#2b3a4a] cursor-pointer flex items-center gap-1">
                {selectedPreset.id}. {selectedPreset.name}
                <ChevronRight size={12} className="rotate-90 opacity-40" />
              </span>
              {/* Dropdown would go here */}
            </div>
          </nav>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-indigo-200 border border-white overflow-hidden shadow-sm">
              <img src="https://avatars.githubusercontent.com/u/1?v=4" alt="user" className="w-full h-full grayscale opacity-70" />
            </div>
            <span className="text-[10px] font-black text-[#8899a6]">miidacnt(Lv.7)</span>
          </div>
          <LayoutGrid size={18} className="text-[#8899a6] cursor-pointer" />
          <div className="w-4 h-4 bg-[#2b3a4a] rounded-sm" />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">

        {/* Left: Instructions (Progate Sidebar) */}
        <aside className="w-[300px] bg-white border-r border-[#e1e8ed] flex flex-col shrink-0 overflow-y-auto scrollbar-hide">
          <div className="p-5 border-b border-[#e1e8ed] flex items-center gap-2 font-black text-xs text-[#2b3a4a]">
            <BookOpen size={16} />
            手順
          </div>
          <div className="p-5">
            <div className="task-card">
              <div className="task-card-header">
                <Code2 size={12} />
                program.dncl
              </div>
              <p className="text-xs font-bold leading-relaxed mb-4 text-[#2b3a4a]">
                『{selectedPreset.task_title}』に挑戦しましょう。<br /><br />
                {selectedPreset.instruction}
              </p>
              <div className="space-y-3">
                {selectedPreset.steps.map((s, idx) => (
                  <div key={idx} className="flex gap-2 items-start group">
                    <div className="w-4 h-4 rounded border border-[#e1e8ed] flex items-center justify-center shrink-0 mt-0.5 group-hover:border-[#20a0d0]">
                      {idx === 0 && <div className="w-2 h-2 bg-[#20a0d0] rounded-sm" />}
                    </div>
                    <span className="text-[11px] font-medium text-[#2b3a4a]">{s.text}</span>
                  </div>
                ))}
              </div>
              <button className="mt-6 w-full py-2.5 bg-[#20a0d0] text-white rounded font-bold text-[11px] flex items-center justify-center gap-2 hover:bg-[#1c8cb8] transition-colors">
                <Play size={14} className="fill-current" /> スライドで確認
              </button>
            </div>

            {/* Sub Card */}
            <div className="task-card">
              <div className="task-card-header" style={{ background: '#fff9e6', color: '#ff9d22' }}>
                <Info size={12} />
                ヒント
              </div>
              <p className="text-[10px] font-medium leading-relaxed text-[#8899a6]">
                DNCLではインデント（行頭の空白）が重要です。繰り返しの処理は少し右にずらして書きましょう。
              </p>
              <button className="mt-4 w-full py-2 bg-[#ff9d22] text-white rounded font-bold text-[10px] opacity-90">
                ヒントを見る
              </button>
            </div>
          </div>
        </aside>

        {/* Center: Editor (Progate Dark Editor) */}
        <section className="flex-1 flex flex-col shrink-0 min-w-0">
          <div className="editor-tabs">
            <div className="editor-tab active">program.dncl</div>
            <div className="editor-tab">references.txt</div>
            <div className="flex-1" />
            <div className="w-10 h-full flex items-center justify-center text-[#8899a6] border-l border-[#101921]">
              <Settings2 size={14} />
            </div>
          </div>

          <div className="flex-1 bg-[#253341] relative flex overflow-hidden">
            {/* Line Numbers simulating editor */}
            <div className="w-10 bg-[#1b2937] text-[#4d5b69] font-mono text-[11px] py-4 text-center shrink-0 leading-loose">
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} className={currentIdx < steps.length && steps[currentIdx].line === i + 1 ? 'text-[#20a0d0] bg-[#101921]' : ''}>
                  {i + 1}
                </div>
              ))}
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="flex-1 bg-transparent p-4 font-mono text-[14px] leading-loose text-[#ffffffc0] outline-none resize-none caret-[#20a0d0]"
              spellCheck={false}
              autoFocus
            />

            {/* Highlight Execution Line */}
            {isPlaying && step.line > 0 && (
              <div
                className="absolute left-10 right-0 bg-[#2b3a4a]/5 pointer-events-none"
                style={{ top: `${(step.line - 1) * 28 + 16}px`, height: '28px', borderLeft: '2px solid #20a0d0', background: 'rgba(32, 160, 208, 0.05)' }}
              />
            )}
          </div>

          <div className="editor-footer">
            <button onClick={reset} className="text-[#8899a6] text-[11px] font-bold flex items-center gap-1.5 hover:text-white transition-colors">
              <RotateCcw size={14} /> リセット
            </button>
            <button className="text-[#8899a6] text-[11px] font-bold flex items-center gap-1.5 hover:text-white transition-colors">
              <Eye size={14} /> 答えを見る
            </button>
            <div className="flex-1" />
            <button
              onClick={runCode}
              className="px-8 py-2.5 bg-[#00c2b0] hover:bg-[#00ad9d] text-white rounded font-black text-xs transition-all active:scale-95 shadow-[0_4px_0_0_#008c7e]"
            >
              できた！
            </button>
          </div>
        </section>

        {/* Right: Preview & Memory (Progate Result Panels) */}
        <aside className="w-[350px] bg-white border-l border-[#e1e8ed] flex flex-col shrink-0 overflow-hidden">

          {/* Top Half: Preview (Console Output) */}
          <div className="h-1/2 flex flex-col border-b border-[#e1e8ed]">
            <div className="px-4 h-9 flex items-center justify-between bg-white border-b border-[#f4f7f8]">
              <div className="flex items-center gap-2 text-[10px] font-black text-[#2b3a4a] opacity-80">
                <Terminal size={12} className="text-[#8899a6]" />
                プレビュー
              </div>
              <ExternalLink size={12} className="text-[#8899a6]" />
            </div>
            <div className="flex-1 p-6 font-sans text-sm leading-relaxed text-[#2b3a4a] overflow-y-auto">
              <div className="flex flex-col gap-2">
                {step.output.map((line, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="text-[#20a0d0]">•</span>
                    {line}
                  </div>
                ))}
                {step.output.length === 0 && <div className="text-[#8899a6] italic font-medium">ロジックを実行するとここに結果が表示されます</div>}
              </div>
            </div>
          </div>

          {/* Bottom Half: Memory Map (Success Sample/Memory) */}
          <div className="h-1/2 flex flex-col bg-[#fcfdfe]">
            <div className="px-4 h-9 flex items-center justify-between bg-white border-b border-[#f4f7f8]">
              <div className="flex items-center gap-2 text-[10px] font-black text-[#2b3a4a] opacity-80">
                <CpuIcon size={12} className="text-[#8899a6]" />
                内部ステート（メモリ）
              </div>
              <ExternalLink size={12} className="text-[#8899a6]" />
            </div>
            <div className="flex-1 p-6 overflow-y-auto scrollbar-hide space-y-6">
              <div className="bg-white border border-[#e1e8ed] p-4 rounded-lg shadow-sm">
                <span className="text-[10px] font-black text-[#8899a6] uppercase tracking-widest block mb-1">Runtime Status</span>
                <div className="text-[11px] font-bold text-[#2b3a4a] leading-relaxed">
                  {step.description || "実行を開始してください。"}
                </div>
              </div>

              {/* Memory View */}
              <div className="space-y-4">
                {Object.entries(step.arrays).map(([name, arr]) => (
                  <div key={name}>
                    <span className="text-[9px] font-black text-[#8899a6] uppercase tracking-tighter block mb-1.5">{name}[]</span>
                    <div className="flex flex-wrap gap-1">
                      {arr.map((v, i) => (
                        <div key={i} className="w-7 h-9 bg-white border border-[#e1e8ed] rounded flex flex-col items-center justify-center">
                          <span className="text-[7px] font-bold text-[#cbd5e1]">{i}</span>
                          <span className="text-[9px] font-black text-[#2b3a4a]">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {Object.entries(step.variables).map(([name, val]) => (
                  <div key={name} className="flex items-center justify-between p-2 border-b border-[#f4f7f8]">
                    <span className="text-[10px] font-black text-[#8899a6]">{name}</span>
                    <span className="text-sm font-black text-[#20a0d0] tabular-nums">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </main>

      {/* Footer: Slide & Progress */}
      <footer className="h-14 bg-white border-t border-[#e1e8ed] flex items-center justify-between px-6 shrink-0 z-50">
        <button className="bg-[#20a0d0] hover:bg-[#1c8cb8] text-white px-5 py-2 rounded text-[11px] font-black flex items-center gap-2 transition-all shadow-sm">
          <BookOpen size={14} /> スライドを見る
        </button>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="progress-bar-container">
              <div className="progress-bar-fill" style={{ width: `${(selectedPreset.id / PRESETS.length) * 100}%` }} />
            </div>
            <span className="text-[11px] font-black text-[#8899a6]">
              {selectedPreset.id} / {PRESETS.length} クリア
            </span>
          </div>
          <div className="h-4 w-[1px] bg-[#e1e8ed]" />
          <button className="text-[11px] font-black text-[#20a0d0] hover:underline transition-all">
            アプリでも復習してしっかり学びを身につけよう
          </button>
          <div className="h-10 w-44 bg-[#ff6a7a] rounded-md flex items-center justify-center text-white gap-2 font-black text-[11px] shadow-sm cursor-pointer">
            <HelpCircle size={14} /> よくある質問
          </div>
        </div>
      </footer>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        ::-moz-selection { background: #20a0d033; }
        ::selection { background: #20a0d033; }
      `}</style>
    </div>
  );
}
