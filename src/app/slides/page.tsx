'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft,
    ChevronRight,
    X,
    BookOpen,
    Zap,
    Code2,
    Database,
    Play,
    ArrowRight,
    Info,
    Layers
} from 'lucide-react';

const SLIDES = [
    {
        title: "共通テスト手順記述標準言語 (DNCL)",
        subtitle: "プログラミングの基礎と共通テスト対策",
        content: "大学入試センターが公開する仕様に基づき、共通テストで採用されているDNCL（手順記述標準言語）の基本を学習しましょう。",
        citation: {
            title: "共通テスト手順記述標準言語 (DNCL) の説明",
            author: "独立行政法人大学入試センター",
            date: "2022 年 1 月"
        },
        icon: <BookOpen className="w-12 h-12 text-[#20a0d0]" />,
        color: "from-[#20a0d0] to-[#00c2b0]"
    },
    {
        title: "1. 変数とデータ型",
        subtitle: "データの入れ物と名前のルール",
        content: "変数名は英字で始まる英数字と下線(_)。すべて大文字の変数は定数を表します。配列は大文字で始まる変数名（例: Tokuten[i]）を使用します。",
        details: [
            "単一変数: a, score, i",
            "定数: MAX_VALUE, PI",
            "配列: A[0], Tokuten[i]",
            "文字列: 「 」または \" \" で囲む"
        ],
        code: "点数 ← 85\n名前 ← 「山田」\n定数 MAX ← 100",
        icon: <Zap className="w-12 h-12 text-yellow-500" />
    },
    {
        title: "2. 演算子",
        subtitle: "計算と条件の比較",
        content: "算術演算、比較演算、論理演算を使いこなしましょう。特に「÷」と「/」の違いに注意が必要です。",
        details: [
            "算術: +, -, ×, / (実数商), ÷ (整数商), % (余り)",
            "比較: =, ≠, >, <, ≧, ≦",
            "論理: かつ, または, でない"
        ],
        code: "商 ← 7 ÷ 2  // 3になります\nあまり ← 7 % 2 // 1になります\n判定 ← (点数 ≧ 80) かつ (出席 ≧ 10)",
        icon: <Layers className="w-12 h-12 text-purple-500" />
    },
    {
        title: "3. 条件分岐 (もし〜ならば)",
        subtitle: "状況に応じた処理の切り替え",
        content: "条件が成立するかどうかで実行する処理を選びます。多方向の分岐も可能です。",
        code: "もし 点数 ≧ 80 ならば\n|  「合格」を表示する\nそうでなくもし 点数 ≧ 60 ならば\n|  「追試」を表示する\nそうでなければ\n|  「不合格」を表示する\nを実行する",
        icon: <Code2 className="w-12 h-12 text-pink-500" />
    },
    {
        title: "4. 繰り返し (ループ)",
        subtitle: "効率的な処理の自動化",
        content: "決まった回数繰り返す「順次繰り返し」と、条件を満たす間続ける「条件繰り返し」があります。",
        details: [
            "順次: 変数を開始から終了まで増分ずつ",
            "前判定: 条件の間、繰り返す",
            "後判定: 条件になるまで繰り返す"
        ],
        code: "i を 1 から 10 まで 1 ずつ増やしながら、\n|  合計 ← 合計 + i\nを繰り返す",
        icon: <Play className="w-12 h-12 text-green-500" />
    },
    {
        title: "5. 配列の操作",
        subtitle: "大量のデータをまとめて扱う",
        content: "配列は添字（インデックス）を使って複数のデータにアクセスします。一括代入などの特殊な記法もあります。",
        code: "Tokuten ← {87, 45, 72} // 一括代入\nTokuten[0] を表示する // 87が表示される\nTokuten のすべての要素に 0 を代入する",
        icon: <Database className="w-12 h-12 text-amber-500" />
    },
    {
        title: "学習を始めましょう！",
        subtitle: "演習ページでコードを書いてみよう",
        content: "スライドで学んだ基本を活かして、実際にプログラムを動かしてみましょう。エラーを恐れず挑戦することが上達の近道です。",
        icon: <ArrowRight className="w-12 h-12 text-[#20a0d0]" />,
        isFinal: true
    }
];

export default function SlidesPage() {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [direction, setDirection] = useState(0);

    const nextSlide = () => {
        if (currentSlide < SLIDES.length - 1) {
            setDirection(1);
            setCurrentSlide(prev => prev + 1);
        }
    };

    const prevSlide = () => {
        if (currentSlide > 0) {
            setDirection(-1);
            setCurrentSlide(prev => prev - 1);
        }
    };

    const goToSlide = (index: number) => {
        if (index === currentSlide) return;
        setDirection(index > currentSlide ? 1 : -1);
        setCurrentSlide(index);
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') nextSlide();
            if (e.key === 'ArrowLeft') prevSlide();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentSlide]);

    const slide = SLIDES[currentSlide];

    return (
        <div className="h-screen w-screen bg-[#1b2937] flex flex-col items-center justify-center p-6 overflow-hidden select-none">
            {/* Top Bar */}
            <div className="absolute top-0 left-0 right-0 h-16 px-8 flex items-center justify-between z-50 bg-black/20 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="bg-[#20a0d0] p-1.5 rounded-lg">
                        <BookOpen size={18} className="text-white" />
                    </div>
                    <span className="text-white/80 font-black text-xs uppercase tracking-widest">DNCL Learning Kit</span>
                </div>
                <div className="flex items-center gap-6">
                    <div className="flex gap-1.5 p-1 bg-white/5 rounded-full">
                        {SLIDES.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => goToSlide(i)}
                                className={`h-1.5 rounded-full transition-all duration-300 hover:bg-white/40 ${i === currentSlide ? 'w-10 bg-[#20a0d0]' : 'w-2 bg-white/20'}`}
                                title={`Page ${i + 1}`}
                            />
                        ))}
                    </div>
                    <Link href="/lessons">
                        <button className="bg-white/10 hover:bg-white/20 transition-colors p-2 rounded-full text-white">
                            <X size={20} />
                        </button>
                    </Link>
                </div>
            </div>

            {/* Slide Container */}
            <div className="relative w-full max-w-5xl aspect-video bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col">
                <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                        key={currentSlide}
                        custom={direction}
                        variants={{
                            enter: (direction: number) => ({ x: direction > 0 ? 1000 : -1000, opacity: 0 }),
                            center: { x: 0, opacity: 1 },
                            exit: (direction: number) => ({ x: direction < 0 ? 1000 : -1000, opacity: 0 })
                        }}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="flex-1 flex"
                    >
                        {/* Left Side: Content */}
                        <div className="flex-1 p-16 flex flex-col justify-center gap-6">
                            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center shadow-inner mb-2 border border-slate-100">
                                {slide.icon}
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-xs font-black text-[#20a0d0] uppercase tracking-widest">{slide.subtitle}</h2>
                                <h1 className="text-4xl font-black text-[#253341] leading-tight">{slide.title}</h1>
                            </div>
                            <p className="text-lg text-[#8899a6] font-bold leading-relaxed max-w-lg">
                                {slide.content}
                            </p>

                            {slide.details && (
                                <div className="grid grid-cols-2 gap-4 mt-4">
                                    {slide.details.map((detail, i) => (
                                        <div key={i} className="flex items-center gap-2 text-xs font-black text-[#253341]">
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#20a0d0]" />
                                            {detail}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {slide.isFinal && (
                                <Link href="/lessons">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="mt-8 px-8 py-4 bg-[#20a0d0] text-white rounded-2xl font-black text-base shadow-lg shadow-[#20a0d0/20] flex items-center gap-3 w-fit"
                                    >
                                        レッスン一覧に戻る <ArrowRight size={20} />
                                    </motion.button>
                                </Link>
                            )}

                            {(slide as any).citation && (
                                <div className="mt-auto pt-8 border-t border-slate-100 flex flex-col gap-1">
                                    <div className="flex items-center gap-2 text-[10px] font-black text-[#20a0d0] uppercase tracking-wider">
                                        <Info size={12} />
                                        Source Reference
                                    </div>
                                    <div className="text-[11px] font-bold text-[#8899a6] leading-relaxed">
                                        {(slide as any).citation.title}<br />
                                        {(slide as any).citation.author}（{(slide as any).citation.date}）
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right Side: Visual/Code */}
                        <div className={`w-[45%] flex items-center justify-center bg-slate-50 border-l border-slate-100 p-12 overflow-hidden`}>
                            {slide.code ? (
                                <div className="w-full bg-[#1b2937] rounded-3xl p-8 shadow-2xl relative">
                                    <div className="flex gap-2 mb-6">
                                        <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                                        <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                                        <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                                    </div>
                                    <pre className="font-mono text-base leading-loose text-[#00c2b0]">
                                        {slide.code.split('\n').map((line, i) => (
                                            <div key={i} className="flex gap-4">
                                                <span className="text-white/20 text-xs mt-1 w-4">{i + 1}</span>
                                                <span>{line}</span>
                                            </div>
                                        ))}
                                    </pre>
                                    <div className="absolute bottom-6 right-8 text-white/10">
                                        <Code2 size={48} />
                                    </div>
                                </div>
                            ) : (
                                <div className={`w-64 h-64 rounded-full bg-gradient-to-br ${slide.color || 'from-slate-200 to-slate-100'} flex items-center justify-center shadow-xl p-8 animate-pulse`}>
                                    {React.cloneElement(slide.icon as React.ReactElement<{ className?: string }>, { className: 'w-32 h-32 text-white' })}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Navigation Buttons */}
                <div className="absolute bottom-12 left-12 right-12 flex justify-between pointer-events-none">
                    <button
                        onClick={prevSlide}
                        disabled={currentSlide === 0}
                        className={`pointer-events-auto w-14 h-14 rounded-full bg-white border-2 border-slate-100 flex items-center justify-center text-[#253341] shadow-lg transition-all ${currentSlide === 0 ? 'opacity-0 cursor-default' : 'hover:scale-110 active:scale-95 hover:border-[#20a0d0] hover:text-[#20a0d0]'}`}
                    >
                        <ChevronLeft size={24} />
                    </button>

                    <button
                        onClick={nextSlide}
                        disabled={currentSlide === SLIDES.length - 1}
                        className={`pointer-events-auto w-14 h-14 rounded-full bg-[#253341] flex items-center justify-center text-white shadow-lg transition-all ${currentSlide === SLIDES.length - 1 ? 'opacity-0 cursor-default' : 'hover:scale-110 active:scale-95 bg-[#20a0d0]'}`}
                    >
                        <ChevronRight size={24} />
                    </button>
                </div>
            </div>

            {/* Footer Instructions */}
            <div className="mt-8 flex items-center gap-8">
                <div className="flex items-center gap-2 text-white/40 text-[10px] font-black tracking-widest uppercase">
                    <Info size={14} />
                    Keyboard arrows to navigate
                </div>
                <div className="h-4 w-[1px] bg-white/10" />
                <div className="text-white/60 text-xs font-bold">
                    Page {currentSlide + 1} of {SLIDES.length}
                </div>
            </div>

            {/* Decorative BG elements */}
            <div className="fixed -top-24 -right-24 w-96 h-96 bg-[#20a0d0]/5 rounded-full blur-3xl pointer-events-none" />
            <div className="fixed -bottom-24 -left-24 w-96 h-96 bg-[#00c2b0]/5 rounded-full blur-3xl pointer-events-none" />
        </div>
    );
}
