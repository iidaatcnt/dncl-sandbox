'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    BookOpen,
    ChevronRight,
    Star,
    Lock,
    CheckCircle2,
    Layout,
    ArrowLeft,
    GraduationCap,
    Zap,
    Code2,
    Database
} from 'lucide-react';
import { PRESETS } from '../../constants/lessons';

export default function LessonsPage() {
    const categories = Array.from(new Set(PRESETS.map(p => p.category)));

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
                            <Link href="/lessons" className="text-[#2b3a4a] border-b-2 border-[#20a0d0] pb-1">レッスン一覧</Link>
                            <Link href="/reference" className="hover:text-[#2b3a4a] transition-colors">リファレンス</Link>
                        </nav>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full">
                            <Star size={14} className="text-yellow-500 fill-yellow-500" />
                            <span className="text-xs font-black">1,240 XP</span>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-[#20a0d0] border-2 border-white shadow-sm flex items-center justify-center text-white font-black text-xs">
                            M
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="bg-white border-b border-[#e1e8ed] py-12 px-6">
                <div className="max-w-5xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-[#20a0d0] font-black text-xs uppercase tracking-widest">
                                <GraduationCap size={16} />
                                Course Path
                            </div>
                            <h1 className="text-3xl md:text-4xl font-black text-[#2b3a4a]">共通テスト：情報I 対策コース</h1>
                            <p className="text-[#8899a6] font-bold max-w-xl leading-relaxed">
                                DNCL（共通テスト手順記述標準言語）を基礎から応用まで、インタラクティブに学習します。
                                アルゴリズムの思考力を養い、本番で確実に得点を取れる実力を身につけましょう。
                            </p>
                        </div>
                        <div className="bg-[#ebf6f7] p-6 rounded-2xl border border-[#20a0d033] flex flex-col items-center justify-center min-w-[200px]">
                            <div className="relative w-20 h-20 mb-3">
                                <svg className="w-full h-full" viewBox="0 0 36 36">
                                    <path
                                        className="stroke-[#e1e8ed]"
                                        strokeDasharray="100, 100"
                                        strokeWidth="3"
                                        fill="none"
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    />
                                    <path
                                        className="stroke-[#5ed291]"
                                        strokeDasharray="40, 100"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        fill="none"
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center text-lg font-black text-[#2b3a4a]">
                                    40%
                                </div>
                            </div>
                            <span className="text-[10px] font-black text-[#8899a6] uppercase tracking-wider">Progress</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Categories & Lessons */}
            <main className="max-w-5xl mx-auto px-6 py-12 space-y-16">
                {categories.map((category, catIdx) => (
                    <div key={category} className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-[#e1e8ed] flex items-center justify-center text-[#20a0d0]">
                                {category === '基本' && <Zap size={20} className="fill-current" />}
                                {category === '制御構文' && <Layout size={20} />}
                                {category === 'データ構造' && <Database size={20} />}
                                {category === 'アルゴリズム' && <Code2 size={20} />}
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-[#2b3a4a]">{category}</h2>
                                <p className="text-xs font-bold text-[#8899a6]">Step {catIdx + 1}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {PRESETS.filter(p => p.category === category).map((lesson, idx) => (
                                <motion.div
                                    key={lesson.id}
                                    whileHover={{ y: -4 }}
                                    className="bg-white border border-[#e1e8ed] rounded-2xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                                >
                                    <Link href={`/?id=${lesson.id}`}>
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="space-y-1">
                                                <span className="text-[10px] font-black text-[#8899a6] uppercase tracking-widest">Lesson {lesson.id}</span>
                                                <h3 className="text-base font-black text-[#2b3a4a] group-hover:text-[#20a0d0] transition-colors">{lesson.name}</h3>
                                            </div>
                                            <div className="flex gap-0.5">
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        size={12}
                                                        className={`${i < lesson.difficulty ? 'text-yellow-400 fill-yellow-400' : 'text-[#e1e8ed]'}`}
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        <p className="text-xs text-[#8899a6] font-bold line-clamp-2 mb-6 h-8">
                                            {lesson.instruction}
                                        </p>

                                        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 size={16} className="text-[#5ed291]" />
                                                <span className="text-[10px] font-black text-[#5ed291] uppercase">Completed</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-[#20a0d0] font-black text-[10px] uppercase">
                                                Start <ChevronRight size={14} />
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                ))}
            </main>

            {/* Footer Decoration */}
            <div className="max-w-5xl mx-auto px-6 opacity-30 pointer-events-none">
                <div className="h-px bg-gradient-to-r from-transparent via-[#e1e8ed] to-transparent w-full" />
            </div>
        </div>
    );
}
