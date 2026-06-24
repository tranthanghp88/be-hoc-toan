import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Question, QuizConfig as QuizConfigType, QuizHistory } from '../types';
import MathMascot from './MathMascot';
import Confetti from './Confetti';
import { Check, ArrowRight, Delete, RotateCcw, Award, Star } from 'lucide-react';
import { playCorrectSound, playWrongSound, playStreakSound } from '../utils/audioService';

interface QuizActiveProps {
  config: QuizConfigType;
  questions: Question[];
  currentIndex: number;
  correctCount: number;
  onAnswerSubmit: (historyItem: QuizHistory, isFullyCorrect: boolean) => void;
  onFinish: () => void;
}

const CONGRATS_MESSAGES = [
  "Bé giỏi quá! ✨",
  "Xuất sắc luôn bé ơi! 🏆",
  "Chính xác! Bé siêu thật đấy! 🌟",
  "Tuyệt vời quá con ơi! ❤️",
  "Đúng rồi! Đáng yêu quá! 🎉"
];

const TRY_AGAIN_MESSAGES = [
  "Chưa đúng rồi, bé suy nghĩ lại nhé! 😉",
  "Gần đúng rồi con ơi, thử tính kỹ lại chút nha! 💪",
  "Bé thử làm lại lần nữa xem sao nhé! ⚡",
  "Tính lại xíu thôi là đúng rồi con nè!"
];

export default function QuizActive({
  config,
  questions,
  currentIndex,
  correctCount,
  onAnswerSubmit,
  onFinish
}: QuizActiveProps) {
  const currentQuestion = questions[currentIndex];
  
  const [inputValue, setInputValue] = useState<string>('');
  const [isChecked, setIsChecked] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [attempts, setAttempts] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<string>('');
  const [mascotState, setMascotState] = useState<'idle' | 'correct' | 'thinking' | 'wrong' | 'winner'>('idle');
  
  // Streak States
  const [streak, setStreak] = useState<number>(0);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const autoAdvanceTimerRef = useRef<any>(null);

  // Focus ô nhập đáp án khi thay đổi câu hỏi
  useEffect(() => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
    setInputValue('');
    setIsChecked(false);
    setIsCorrect(false);
    setAttempts(0);
    setUserAnswers([]);
    setFeedback('');
    setMascotState('idle');
    
    // Đảm bảo focus lập tức và liên tiếp ở các mốc thời gian khác nhau để bảo toàn focus kể cả khi đang có animation chuyển trang
    const focusTimes = [10, 50, 150, 300, 500];
    const timers = focusTimes.map(ms => setTimeout(() => {
      const activeInput = document.getElementById(`math-answer-input-${currentQuestion.id}`) as HTMLInputElement | null;
      if (activeInput) {
        activeInput.focus();
      } else if (inputRef.current) {
        inputRef.current.focus();
      }
    }, ms));

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [currentIndex, currentQuestion.id]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
      }
    };
  }, []);

  // Nhận diện suy nghĩ của bé khi đang gõ số
  useEffect(() => {
    if (inputValue !== '' && !isChecked) {
      setMascotState('thinking');
    } else if (inputValue === '' && !isChecked) {
      setMascotState('idle');
    }
  }, [inputValue, isChecked]);

  // Xử lý khi nhấn nút Trên bàn phím số ảo
  const handleKeypadPress = (val: string) => {
    if (isChecked && val !== 'enter') return;

    if (val === 'clear') {
      setInputValue('');
    } else if (val === 'backspace') {
      setInputValue(prev => prev.slice(0, -1));
    } else if (val === 'enter') {
      if (inputValue === '') return;
      handleCheck();
    } else {
      // Giới hạn nhập tối đa 4 chữ số thích hợp lớp 3
      if (inputValue.length < 4) {
        setInputValue(prev => prev + val);
      }
    }
    
    const activeInput = document.getElementById(`math-answer-input-${currentQuestion.id}`) as HTMLInputElement | null;
    if (activeInput) {
      activeInput.focus();
    } else if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Lắng nghe sự kiện bàn phím vật lý thực tế
  useEffect(() => {
    const handlePhysicalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (isChecked) {
          handleNextQuestion();
        } else if (inputValue !== '') {
          handleCheck();
        }
      }
    };
    window.addEventListener('keydown', handlePhysicalKeyDown);
    return () => window.removeEventListener('keydown', handlePhysicalKeyDown);
  }, [inputValue, isChecked, attempts, userAnswers, isCorrect, streak]);

  const updateGameStateAndNextQuestion = (updatedAnswers: number[]) => {
    // Reset các state câu hỏi hiện tại ngay lập tức để người chơi gõ tiếp câu mới không bị trễ
    setInputValue('');
    setIsChecked(false);
    setIsCorrect(false);
    setAttempts(0);
    setUserAnswers([]);
    setFeedback('');
    setMascotState('idle');

    const historyItem: QuizHistory = {
      question: currentQuestion,
      userAnswers: updatedAnswers,
      isCorrect: true,
      shownAnswer: false
    };
    
    onAnswerSubmit(historyItem, true);
  };

  const handleCheck = () => {
    if (inputValue === '' || isChecked) return;

    const answerNum = parseInt(inputValue, 10);
    const updatedAnswers = [...userAnswers, answerNum];
    setUserAnswers(updatedAnswers);
    
    const correctVal = currentQuestion.correctAnswer;
    const isAnsCorrect = answerNum === correctVal;
    
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    if (isAnsCorrect) {
      // Trả lời đúng!
      const newStreak = streak + 1;
      setStreak(newStreak);
      setIsCorrect(true);
      setIsChecked(true);

      const isMilestone = newStreak === 3 || newStreak % 5 === 0;

      if (isMilestone) {
        setMascotState('winner');
        playStreakSound();
        setFeedback(`🔥 Tuyệt đỉnh! Bé đã đúng liên tiếp ${newStreak} câu! 🏆✨`);

        // Mốc streak lớn: Chờ 2000ms rồi tự động chuyển
        autoAdvanceTimerRef.current = setTimeout(() => {
          updateGameStateAndNextQuestion(updatedAnswers);
        }, 2000);
      } else {
        setMascotState('correct');
        playCorrectSound();

        const randomCongrats = CONGRATS_MESSAGES[Math.floor(Math.random() * CONGRATS_MESSAGES.length)];
        setFeedback(randomCongrats);

        // Trả lời đúng thường: Chờ 400ms rồi tự động chuyển câu mới
        autoAdvanceTimerRef.current = setTimeout(() => {
          updateGameStateAndNextQuestion(updatedAnswers);
        }, 400);
      }
    } else {
      // Trả lời sai
      setStreak(0); // Reset streak về 0 ngay khi làm sai
      playWrongSound();
      if (newAttempts >= 2) {
        // Hết lượt thử thứ 2 -> Hiện đáp án đúng để bé học hỏi, không phạt tiêu cực
        setIsCorrect(false);
        setIsChecked(true);
        setMascotState('wrong');
        const originalResult = currentQuestion.operatorSymbol === '+' ? currentQuestion.num1 + currentQuestion.num2
          : currentQuestion.operatorSymbol === '-' ? currentQuestion.num1 - currentQuestion.num2
          : currentQuestion.operatorSymbol === '×' ? currentQuestion.num1 * currentQuestion.num2
          : currentQuestion.num1 / currentQuestion.num2;
        setFeedback(`Không sao đâu con! Phép tính đúng là: ${currentQuestion.num1} ${currentQuestion.operatorSymbol} ${currentQuestion.num2} = ${originalResult}`);
      } else {
        // Còn lượt thử lại (lượt 1)
        setMascotState('wrong');
        const randomTryAgain = TRY_AGAIN_MESSAGES[Math.floor(Math.random() * TRY_AGAIN_MESSAGES.length)];
        setFeedback(randomTryAgain);
        setInputValue(''); // Xóa để bé nhập lại dễ dàng hơn
        setTimeout(() => {
          const activeInput = document.getElementById(`math-answer-input-${currentQuestion.id}`) as HTMLInputElement | null;
          if (activeInput) {
            activeInput.focus();
          } else if (inputRef.current) {
            inputRef.current.focus();
          }
        }, 80);
      }
    }
  };

  const handleNextQuestion = () => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }

    const historyItem: QuizHistory = {
      question: currentQuestion,
      userAnswers,
      isCorrect,
      shownAnswer: attempts >= 2 && !isCorrect
    };

    onAnswerSubmit(historyItem, isCorrect);
  };

  // Phần trăm tiến hành làm bài để vẽ thanh tiến trình
  const progressPercent = ((currentIndex) / config.totalQuestions) * 100;
  // Phần trăm hiện tại bao gồm cả câu hiện tại đang làm
  const answeredPercent = ((currentIndex + 1) / config.totalQuestions) * 100;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-4 md:py-8 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
      {/* CỘT TRÁI (3/12): Chứa Mascot đồng hành & Thống kê điểm */}
      <div className="md:col-span-3 flex flex-row md:flex-col items-center justify-between md:justify-start bg-white rounded-3xl p-3.5 md:p-5 border-4 border-amber-100 shadow-md gap-4 md:space-y-4">
        {/* Mascot Wrapper */}
        <div className="w-16 h-18 sm:w-20 sm:h-22 md:w-full md:h-auto shrink-0 flex items-center justify-center relative">
          <MathMascot state={mascotState} className="w-full h-full animate-bounce-slow" />
        </div>
        
        {/* Điểm số */}
        <div className="flex-grow md:w-full bg-slate-50 rounded-2xl p-2.5 md:p-4 border-2 border-slate-100 text-center flex flex-row md:flex-col justify-around items-center md:items-stretch gap-2.5">
          <div className="flex flex-col items-center justify-center md:block">
            <div className="text-2xs text-slate-400 font-bold uppercase tracking-wider md:hidden">Đúng</div>
            <div className="text-xl md:text-2xl font-black text-emerald-500 flex items-center justify-center gap-1 mt-0.5 md:mt-0">
              <Star className="w-4 h-4 md:w-5 md:h-5 fill-emerald-400 text-emerald-500" />
              {correctCount}
            </div>
            <div className="hidden md:block text-xs text-slate-500 font-medium">Đúng</div>
          </div>
          
          <div className="h-6 md:h-auto w-[2px] md:w-auto bg-slate-200 md:border-t md:border-slate-200/60 my-0.5 md:my-0 shrink-0" />
          
          <div className="flex flex-col items-center justify-center md:block">
            <div className="text-2xs text-slate-400 font-bold uppercase tracking-wider md:hidden font-sans">Đã làm</div>
            <div className="text-xl md:text-2xl font-black text-blue-500 mt-0.5 md:mt-0">
              {currentIndex} / {config.totalQuestions}
            </div>
            <div className="hidden md:block text-xs text-slate-500 font-medium font-sans">Đã làm</div>
          </div>

          {streak > 0 && (
            <>
              <div className="h-6 md:h-auto w-[2px] md:hidden bg-slate-200 shrink-0" />
              <div className="md:pt-2.5 md:border-t md:border-slate-200/60 flex items-center justify-center gap-1.5 text-amber-600 font-bold text-xs md:text-sm shrink-0">
                <span className="hidden xs:inline">🔥 Chuỗi:</span>
                <span className="inline xs:hidden font-sans">🔥</span>
                <span className="bg-amber-100 text-amber-800 px-2 md:px-2.5 py-0.5 rounded-full text-2xs md:text-xs font-black">
                  {streak}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* CỘT PHẢI (9/12): Khối bài học tương tác làm toán chính */}
      <div className="md:col-span-9 flex flex-col space-y-4">
        {/* Thanh tiến trình phía trên cực bắt mắt */}
        <div className="bg-white rounded-2xl p-4 border-2 border-slate-100 shadow-sm">
          <div className="flex justify-between items-center text-sm font-bold text-slate-600 mb-2">
            <span>Bài ôn tập: {config.operator === 'cong' ? 'Phép Cộng ➕' : config.operator === 'tru' ? 'Phép Trừ ➖' : config.operator === 'nhan' ? 'Phép Nhân ✖️' : config.operator === 'chia' ? 'Phép Chia ➗' : 'Hỗn Hợp 🌠'}</span>
            <span className="text-blue-600">Câu {currentIndex + 1} của {config.totalQuestions}</span>
          </div>
          {/* Thanh progress bar bo góc đẹp */}
          <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden relative">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${answeredPercent}%` }}
              transition={{ type: "spring", stiffness: 80 }}
              className="h-full bg-gradient-to-r from-blue-400 to-emerald-400 rounded-full"
            />
          </div>
        </div>

        {/* Khung câu hỏi toán học khổng lồ */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ 
              opacity: 1, 
              x: 0,
              scale: isCorrect ? [1, 1.03, 1] : 1,
              rotate: 0
            }}
            transition={{ duration: 0.4 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border-4 border-indigo-100 flex flex-col items-center w-full"
            id="question-card"
          >
            {/* Nhãn loại phép tính đầy hào hứng */}
            <div className="bg-indigo-50 border-2 border-indigo-200 text-indigo-700 text-xs md:text-sm font-black px-4 py-1.5 rounded-full mb-6 flex items-center gap-1.5 shadow-sm">
              <Award className="w-4 h-4 text-indigo-500" />
              LỚP 3 • PHÉP {currentQuestion.operator.toUpperCase()}
            </div>

            {/* Phép tính toán */}
            {(() => {
              const originalResult = currentQuestion.operatorSymbol === '+' ? currentQuestion.num1 + currentQuestion.num2
                : currentQuestion.operatorSymbol === '-' ? currentQuestion.num1 - currentQuestion.num2
                : currentQuestion.operatorSymbol === '×' ? currentQuestion.num1 * currentQuestion.num2
                : currentQuestion.num1 / currentQuestion.num2;

              const inputElement = (
                <div className="relative inline-block mx-1">
                  <input
                    ref={(el) => {
                      // @ts-ignore
                      inputRef.current = el;
                      if (el && !isChecked) {
                        el.focus();
                      }
                    }}
                    key={`math-answer-input-key-${currentQuestion.id}`}
                    type="text"
                    pattern="[0-9]*"
                    id={`math-answer-input-${currentQuestion.id}`}
                    inputMode="numeric"
                    value={inputValue}
                    disabled={isChecked}
                    autoFocus
                    onChange={(e) => {
                      const cleanVal = e.target.value.replace(/[^0-9]/g, '');
                      if (cleanVal.length <= 4) {
                        setInputValue(cleanVal);
                      }
                    }}
                    placeholder="?"
                    className={`w-20 sm:w-28 md:w-36 lg:w-44 text-center font-sans font-black text-3xl sm:text-4xl md:text-5xl lg:text-6xl bg-slate-100 border-3 md:border-4 border-slate-300 rounded-2xl md:rounded-3xl py-1 md:py-2 px-1 text-slate-800 placeholder-slate-300 focus:outline-none focus:border-blue-500 focus:bg-white transition-all ${
                      isChecked
                        ? isCorrect
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-400'
                          : 'bg-rose-50 text-rose-600 border-rose-400'
                        : ''
                    }`}
                  />
                </div>
              );

              return (
                <div className="w-full overflow-x-auto md:overflow-x-visible py-4 flex justify-center">
                  <div className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-sans font-black text-slate-800 tracking-normal text-center flex items-center justify-center gap-1.5 sm:gap-3 md:gap-4 whitespace-nowrap flex-nowrap">
                    {currentQuestion.isMissingNumber && currentQuestion.missingPosition === 'left' ? (
                      <>
                        {inputElement}
                        <span className="text-blue-500 font-bold">{currentQuestion.operatorSymbol}</span>
                        <span>{currentQuestion.num2}</span>
                        <span className="text-slate-400">=</span>
                        <span>{originalResult}</span>
                      </>
                    ) : currentQuestion.isMissingNumber && currentQuestion.missingPosition === 'right' ? (
                      <>
                        <span>{currentQuestion.num1}</span>
                        <span className="text-blue-500 font-bold">{currentQuestion.operatorSymbol}</span>
                        {inputElement}
                        <span className="text-slate-400">=</span>
                        <span>{originalResult}</span>
                      </>
                    ) : (
                      <>
                        <span>{currentQuestion.num1}</span>
                        <span className="text-blue-500 font-bold">{currentQuestion.operatorSymbol}</span>
                        <span>{currentQuestion.num2}</span>
                        <span className="text-slate-400">=</span>
                        {inputElement}
                      </>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Lớp phản hồi (Feedback) */}
            <AnimatePresence>
              {feedback && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className={`text-center font-bold text-base md:text-lg px-4 py-2.5 rounded-2xl border-2 my-4 w-full max-w-md ${
                    isCorrect
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 text-emerald-800'
                      : attempts >= 2
                        ? 'bg-yellow-50 text-yellow-800 border-yellow-200'
                        : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}
                >
                  {feedback}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Khối Bàn Phím Số Ảo trực quan cho Con */}
            <div className="w-full max-w-sm mt-4 grid grid-cols-3 gap-2.5" id="virtual-keypad">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  type="button"
                  id={`btn-keypad-${num}`}
                  disabled={isChecked}
                  onClick={() => handleKeypadPress(num.toString())}
                  className="py-3.5 bg-slate-50 hover:bg-slate-100 active:scale-95 disabled:opacity-50 disabled:pointer-events-none rounded-xl border border-slate-200 font-sans font-bold text-xl md:text-2xl text-slate-700 shadow-sm cursor-pointer transition-transform"
                >
                  {num}
                </button>
              ))}
              
              {/* Nút Xoá Tất cả */}
              <button
                type="button"
                id="btn-keypad-clear"
                disabled={isChecked}
                onClick={() => handleKeypadPress('clear')}
                className="py-3.5 bg-amber-50 hover:bg-amber-100 active:scale-95 disabled:opacity-50 disabled:pointer-events-none rounded-xl border border-amber-200 text-amber-600 font-bold text-center inline-flex items-center justify-center gap-1 cursor-pointer transition-transform text-sm md:text-base font-sans"
              >
                <RotateCcw className="w-4 h-4 md:w-5 md:h-5" />
                Xoá
              </button>

              {/* Số 0 */}
              <button
                type="button"
                id="btn-keypad-0"
                disabled={isChecked}
                onClick={() => handleKeypadPress('0')}
                className="py-3.5 bg-slate-50 hover:bg-slate-100 active:scale-95 disabled:opacity-50 disabled:pointer-events-none rounded-xl border border-slate-200 font-sans font-bold text-xl md:text-2xl text-slate-700 shadow-sm cursor-pointer transition-transform"
              >
                0
              </button>

              {/* Nút Xoá 1 số */}
              <button
                type="button"
                id="btn-keypad-backspace"
                disabled={isChecked}
                onClick={() => handleKeypadPress('backspace')}
                className="py-3.5 bg-rose-50 hover:bg-rose-100 active:scale-95 disabled:opacity-50 disabled:pointer-events-none rounded-xl border border-rose-200 text-rose-500 font-bold inline-flex items-center justify-center cursor-pointer transition-transform text-sm md:text-base font-sans"
              >
                <Delete className="w-4 h-4 md:w-5 md:h-5 mr-1" />
                Xoá lùi
              </button>
            </div>

            {/* Các Nút Điều Khiển */}
            <div className="w-full max-w-sm mt-6 pt-2 border-t border-slate-100 flex gap-4">
              {!isChecked ? (
                <button
                  type="button"
                  id="btn-check-answer"
                  onClick={handleCheck}
                  disabled={inputValue === ''}
                  className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-4 px-6 rounded-2xl shadow-md border-b-4 border-blue-700 transition-all flex items-center justify-center gap-2 cursor-pointer text-base md:text-lg font-sans"
                >
                  <Check className="w-5 h-5 stroke-3" />
                  KIỂM TRA
                </button>
              ) : (
                <button
                  type="button"
                  id="btn-next-question"
                  onClick={handleNextQuestion}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-4 px-6 rounded-2xl shadow-md border-b-4 border-emerald-700 transition-all flex items-center justify-center gap-2 cursor-pointer text-base md:text-lg animate-pulse font-sans"
                >
                  CÂU TIẾP THEO
                  <ArrowRight className="w-5 h-5 stroke-3" />
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
