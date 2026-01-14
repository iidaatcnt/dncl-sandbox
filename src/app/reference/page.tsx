'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
    Search,
    Book,
    Code2,
    Terminal,
    Variable,
    Repeat,
    Split,
    List,
    ChevronRight,
    ArrowLeft
} from 'lucide-react';

const REFERENCE_DATA = [
    {
        category: "変数・代入",
        items: [
            {
                name: "変数への代入",
                syntax: "変数名 = 値",
                description: "変数に値を代入します。右辺の計算結果が左辺の変数に格納されます。",
                example: "点数 = 85\n名前 = 「山田」"
            },
            {
                name: "算術演算",
                syntax: "+, -, *, /, ÷, %",
                description: "加減乗除を行います。DNCL特有の『÷』は整数の商、『%』は余りを求めます。",
                example: "商 = 10 ÷ 3  // 3\n余 = 10 % 3  // 1"
            }
        ]
    },
    {
        category: "条件分岐",
        items: [
            {
                name: "もし〜ならば",
                syntax: "もし 条件 ならば:\n    処理\nそうでなければ:\n    処理",
                description: "条件が成立するかどうかで処理を分けます。",
                example: "もし 点数 >= 80 ならば:\n    「合格」を表示する\nそうでなければ:\n    「不合格」を表示する"
            },
            {
                name: "比較演算子",
                syntax: "=, ≠, >, <, ≧, ≦",
                description: "値を比較します。全角の『≧』や『≠』も使用可能です。",
                example: "もし A ≠ B ならば:\n    ..."
            }
        ]
    },
    {
        category: "繰り返し",
        items: [
            {
                name: "順次繰り返し (for)",
                syntax: "変数 を 開始 から 終了 まで 増分 ずつ増やしながら繰り返す:",
                description: "決められた回数だけ処理を繰り返します。",
                example: "i を 1 から 10 まで 1 ずつ増やしながら繰り返す:\n    合計 = 合計 + i"
            },
            {
                name: "条件繰り返し (while)",
                syntax: "条件 が成り立つ間繰り返す:",
                description: "条件が満たされている間、処理をループします。",
                example: "x < 100 が成り立つ間繰り返す:\n    x = x * 2"
            }
        ]
    },
    {
        category: "配列",
        items: [
            {
                name: "配列の宣言・初期化",
                syntax: "配列名 = [値1, 値2, ...]",
                description: "複数の値を一つにまとめて管理します。",
                example: "A = [10, 20, 30]"
            },
            {
                name: "配列要素へのアクセス",
                syntax: "配列名[添字]",
                description: "添字（インデックス）を指定して値を取り出したり代入したりします。添字は0から始まります。",
                example: "x = A[0]\nA[1] = 100"
            }
        ]
    }
];

export default function ReferencePage() {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredData = REFERENCE_DATA.map(cat => ({
        ...cat,
        items: cat.items.filter(item =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description.includes(searchQuery)
        )
    })).filter(cat => cat.items.length > 0);

    return (
        <div className="min-h-screen bg-[#f4f7f8] text-[#2b3a4a] font-sans pb-20">
            {/* Header */}
            <header className="bg-white border-b border-[#e1e8ed] sticky top-0 z-50">
                <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link href="/" className="flex items-center gap-2 text-[#20a0d0] hover:opacity-80 transition-opacity font-black">
                            <div className="bg-[#253341] text-white p-1.5 rounded-md">
                                <span className="text-sm">P</span>
                            </div>
                            <span>DNCL Sandbox</span>
                        </Link>
                        <nav className="hidden md:flex items-center gap-6 text-sm font-bold text-[#8899a6]">
                            <Link href="/lessons" className="hover:text-[#2b3a4a] transition-colors">レッスン一覧</Link>
                            <Link href="/reference" className="text-[#2b3a4a] border-b-2 border-[#20a0d0] pb-1">リファレンス</Link>
                        </nav>
                    </div>
                </div>
            </header>

            {/* Hero */}
            <section className="bg-gradient-to-b from-white to-[#f4f7f8] border-b border-[#e1e8ed] pt-12 pb-20 px-6">
                <div className="max-w-3xl mx-auto text-center space-y-8">
                    <div className="space-y-4">
                        <h1 className="text-4xl font-black text-[#2b3a4a]">DNCL 命令文リファレンス</h1>
                        <p className="text-[#8899a6] font-bold">共通テストで使われるDNCLの書き方を網羅しています。</p>
                    </div>

                    <div className="relative max-w-xl mx-auto">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8899a6]" size={20} />
                        <input
                            type="text"
                            placeholder="知りたい命令を検索..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-white border-2 border-[#e1e8ed] rounded-2xl focus:border-[#20a0d0] outline-none transition-all shadow-sm font-bold text-sm"
                        />
                    </div>
                </div>
            </section>

            {/* Content */}
            <main className="max-w-4xl mx-auto px-6 -mt-10">
                <div className="space-y-12">
                    {filteredData.map((cat, idx) => (
                        <div key={idx} className="space-y-6">
                            <h2 className="text-xs font-black text-[#8899a6] uppercase tracking-[0.2em] flex items-center gap-3">
                                <span className="bg-[#20a0d0] w-1.5 h-1.5 rounded-full" />
                                {cat.category}
                            </h2>
                            <div className="grid gap-6">
                                {cat.items.map((item, itemIdx) => (
                                    <div key={itemIdx} className="bg-white border border-[#e1e8ed] rounded-3xl p-8 shadow-sm hover:shadow-md transition-shadow group">
                                        <div className="flex flex-col md:flex-row gap-8">
                                            <div className="flex-1 space-y-4">
                                                <h3 className="text-xl font-black text-[#2b3a4a] group-hover:text-[#20a0d0] transition-colors">{item.name}</h3>
                                                <p className="text-sm text-[#8899a6] font-bold leading-relaxed">{item.description}</p>
                                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                                    <span className="text-[10px] font-black text-[#8899a6] uppercase block mb-2 tracking-widest">Syntax</span>
                                                    <code className="text-sm font-mono text-[#2b3a4a] font-bold whitespace-pre-wrap">{item.syntax}</code>
                                                </div>
                                            </div>
                                            <div className="md:w-72 shrink-0">
                                                <div className="bg-[#253341] rounded-2xl p-5 shadow-inner h-full">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <Terminal size={12} className="text-[#00c2b0]" />
                                                        <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Code Example</span>
                                                    </div>
                                                    <pre className="text-xs font-mono text-[#00c2b0] leading-relaxed whitespace-pre-wrap">
                                                        {item.example}
                                                    </pre>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    {filteredData.length === 0 && (
                        <div className="py-20 text-center space-y-4">
                            <div className="text-4xl">🔍</div>
                            <p className="font-bold text-[#8899a6]">該当する項目が見つかりませんでした。</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Return Button */}
            <div className="fixed bottom-8 left-8">
                <Link href="/">
                    <button className="bg-white border-2 border-[#e1e8ed] p-4 rounded-full shadow-lg hover:border-[#20a0d0] hover:text-[#20a0d0] transition-all flex items-center gap-2 font-black text-xs">
                        <ArrowLeft size={18} />
                        <span className="hidden md:inline">エディタに戻る</span>
                    </button>
                </Link>
            </div>
        </div>
    );
}
