import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppState, QuizConfig as QuizConfigType, QuizHistory } from './types';
import { generateQuestions } from './utils/mathGenerator';
import QuizConfig from './components/QuizConfig';
import QuizActive from './components/QuizActive';
import QuizSummary from './components/QuizSummary';
import A4Worksheet from './components/A4Worksheet';
import { Sparkles, Trophy, HelpCircle, Heart } from 'lucide-react';
import { isSoundEnabled, setSoundEnabled, playVictorySound } from './utils/audioService';

export default function App() {
  const [soundOn, setSoundOn] = useState<boolean>(isSoundEnabled());
  const [state, setState] = useState<AppState>({
    stage: 'welcome',
    config: {
      totalQuestions: 10,
      operator: 'cong'
    },
    questions: [],
    currentIndex: 0,
    correctCount: 0,
    history: []
  });

  const handleToggleSound = () => {
    const nextVal = !soundOn;
    setSoundOn(nextVal);
    setSoundEnabled(nextVal);
  };

  const handleStartQuiz = (newConfig: QuizConfigType, mode?: 'playing' | 'a4_sheet') => {
    const generated = generateQuestions(newConfig.totalQuestions, newConfig.operator, newConfig.selectedTables, newConfig);
    setState({
      stage: mode || 'playing',
      config: newConfig,
      questions: generated,
      currentIndex: 0,
      correctCount: 0,
      history: []
    });
  };

  const handleAnswerSubmit = (historyItem: QuizHistory, isCorrect: boolean) => {
    setState(prev => {
      const updatedHistory = [...prev.history, historyItem];
      const updatedCorrectCount = isCorrect ? prev.correctCount + 1 : prev.correctCount;
      const isLastQuestion = prev.currentIndex + 1 >= prev.config.totalQuestions;

      if (isLastQuestion) {
        // Trì hoãn nhẹ phát âm chiến thắng để đồng bộ với màn hình kết quả chuyển động
        setTimeout(() => {
          playVictorySound();
        }, 150);
      }

      return {
        ...prev,
        correctCount: updatedCorrectCount,
        history: updatedHistory,
        currentIndex: isLastQuestion ? prev.currentIndex : prev.currentIndex + 1,
        stage: isLastQuestion ? 'result' : 'playing'
      };
    });
  };

  const handleResetQuiz = () => {
    setState({
      stage: 'welcome',
      config: {
        totalQuestions: 10,
        operator: 'cong'
      },
      questions: [],
      currentIndex: 0,
      correctCount: 0,
      history: []
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-indigo-50 to-emerald-50 text-slate-800 flex flex-col justify-between overflow-x-hidden relative" id="app-wrapper">
      
      {/* 1. Mây trôi decor dễ thương ở nền (Pure Styled Vectors) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30 select-none z-0">
        <motion.div
          animate={{ x: ['-10%', '110%'] }}
          transition={{ repeat: Infinity, duration: 40, ease: 'linear' }}
          className="absolute top-10 w-24 h-8 bg-white rounded-full filter blur-xs"
        />
        <motion.div
          animate={{ x: ['110%', '-10%'] }}
          transition={{ repeat: Infinity, duration: 55, ease: 'linear' }}
          className="absolute top-48 right-10 w-36 h-10 bg-white rounded-full filter blur-3xs"
        />
        <motion.div
          animate={{ x: ['-20%', '120%'] }}
          transition={{ repeat: Infinity, duration: 60, ease: 'linear' }}
          className="absolute bottom-32 left-1/4 w-32 h-10 bg-white rounded-full filter blur-xs"
        />
      </div>

      {/* 2. Thanh tiêu đề đầu trang cố định, sạch đẹp */}
      <header className="bg-white/80 backdrop-blur-md border-b-2 border-slate-100 py-3.5 px-4 sticky top-0 z-40 shadow-xs" id="app-header">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer select-none" onClick={handleResetQuiz}>
            <span className="w-9 h-9 rounded-xl bg-blue-500 flex items-center justify-center font-sans font-black text-white text-xl shadow-md cursor-pointer">
              ✏️
            </span>
            <span className="font-sans font-black text-lg md:text-xl text-blue-600 tracking-tight">
              Bé Học Toán
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <button
              onClick={handleToggleSound}
              id="btn-toggle-sound"
              className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all cursor-pointer font-sans font-bold border ${
                soundOn
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
              }`}
            >
              {soundOn ? '🔊 Âm thanh' : '🔇 Tắt âm'}
            </button>
            <span className="hidden xs:inline-flex bg-amber-100 hover:bg-amber-200 text-amber-800 px-3 py-1.5 rounded-full items-center gap-1 transition-all">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              Luyện Trí Tuệ
            </span>
            <span className="hidden sm:inline bg-purple-50 text-purple-700 px-3 py-1.5 rounded-full">
              Lớp 3 Thân Yêu
            </span>
          </div>
        </div>
      </header>

      {/* 3. Phần thân hiển thị giao diện tùy thuộc vào Stage */}
      <main className="flex-grow flex items-center justify-center relative z-10 py-6">
        <AnimatePresence mode="wait">
          {state.stage === 'welcome' && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              <QuizConfig onStart={handleStartQuiz} />
            </motion.div>
          )}

          {state.stage === 'playing' && (
            <motion.div
              key="playing"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              <QuizActive
                config={state.config}
                questions={state.questions}
                currentIndex={state.currentIndex}
                correctCount={state.correctCount}
                onAnswerSubmit={handleAnswerSubmit}
                onFinish={() => setState(prev => ({ ...prev, stage: 'result' }))}
              />
            </motion.div>
          )}

          {state.stage === 'result' && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              <QuizSummary
                config={state.config}
                history={state.history}
                correctCount={state.correctCount}
                onReset={handleResetQuiz}
              />
            </motion.div>
          )}

          {state.stage === 'a4_sheet' && (
            <motion.div
              key="a4_sheet"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              <A4Worksheet
                config={state.config}
                questions={state.questions}
                onBack={handleResetQuiz}
                onRefresh={() => {
                  const generated = generateQuestions(state.config.totalQuestions, state.config.operator, state.config.selectedTables, state.config);
                  setState(prev => ({ ...prev, questions: generated }));
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* 4. Chân trang (Footer) đơn giản, ấm áp */}
      <footer className="py-4 text-center text-xs text-slate-400 font-medium border-t border-slate-100 bg-white/40 backdrop-blur-xs relative z-10" id="app-footer">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center px-4 gap-2">
          <p>© 2026 Bé Học Toán • Nuôi Dưỡng Tư Duy Độc Lập</p>
          <p className="flex items-center gap-1 text-slate-400 text-2xs md:text-xs">
            Dành tặng các con học sinh với tất cả tình yêu thương
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 animate-pulse inline" />
          </p>
        </div>
      </footer>
    </div>
  );
}
