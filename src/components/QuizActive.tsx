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

const removeAccents = (str: string): string => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
};

const normalizeDayOfWeek = (str: string): string => {
  let s = str.trim().toLowerCase().replace(/\s+/g, '');
  s = removeAccents(s);
  if (s === 'chunhat' || s === 'cn') return 'chunhat';
  if (s === 'thuhai' || s === 'thu2' || s === '2') return 'thuhai';
  if (s === 'thuba' || s === 'thu3' || s === '3') return 'thuba';
  if (s === 'thutu' || s === 'thu4' || s === '4') return 'thutu';
  if (s === 'thunam' || s === 'thu5' || s === '5') return 'thunam';
  if (s === 'thusau' || s === 'thu6' || s === '6') return 'thusau';
  if (s === 'thubay' || s === 'thu7' || s === '7') return 'thubay';
  return s;
};

// Component vẽ mặt đồng hồ kim động bằng SVG
function SvgClock({ hour }: { hour: number }) {
  const angle = hour * 30; // 30 độ mỗi giờ (360 / 12)
  const ticks = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <svg width="100%" height="100%" viewBox="0 0 100 100" className="select-none">
      {/* Viền ngoài đồng hồ */}
      <circle cx="50" cy="50" r="45" stroke="#475569" strokeWidth="2.5" fill="#ffffff" />
      {/* Tâm đồng hồ */}
      <circle cx="50" cy="50" r="3" fill="#1e293b" />
      
      {/* Vạch chia giờ & Số giờ */}
      {ticks.map(t => {
        const rad = (t * 30 * Math.PI) / 180;
        const xTickStart = 50 + 38 * Math.sin(rad);
        const yTickStart = 50 - 38 * Math.cos(rad);
        const xTickEnd = 50 + 42 * Math.sin(rad);
        const yTickEnd = 50 - 42 * Math.cos(rad);
        
        const xText = 50 + 31 * Math.sin(rad);
        const yText = 50 - 31 * Math.cos(rad) + 2.5; // lệch nhẹ để căn giữa dọc chữ
        
        return (
          <g key={t}>
            {/* Vạch giờ */}
            <line x1={xTickStart} y1={yTickStart} x2={xTickEnd} y2={yTickEnd} stroke="#64748b" strokeWidth="1.2" />
            {/* Chữ số giờ */}
            <text x={xText} y={yText} fontSize="8.5" fontWeight="900" textAnchor="middle" fill="#334155" fontFamily="sans-serif">
              {t}
            </text>
          </g>
        );
      })}
      
      {/* Kim Giờ (Ngắn và dày hơn) */}
      <line
        x1="50"
        y1="50"
        x2={50 + 22 * Math.sin((angle * Math.PI) / 180)}
        y2={50 - 22 * Math.cos((angle * Math.PI) / 180)}
        stroke="#1e293b"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      
      {/* Kim Phút (Dài và mỏng hơn, luôn chỉ 12 ở giờ đúng) */}
      <line
        x1="50"
        y1="50"
        x2="50"
        y2="18"
        stroke="#ef4444"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

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
  const [userAnswers, setUserAnswers] = useState<(number | string)[]>([]);
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
    
    // Đảm bảo focus lập tức và liên tiếp ở các mốc thời gian khác nhau để bảo toàn focus
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
      if (currentQuestion.operator === 'So sánh') {
        // Chỉ lưu 1 ký tự duy nhất cho dấu so sánh
        setInputValue(val);
      } else {
        // Giới hạn nhập tối đa 4 chữ số thích hợp lớp 3
        if (inputValue.length < 4) {
          setInputValue(prev => prev + val);
        }
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

  const updateGameStateAndNextQuestion = (updatedAnswers: (number | string)[]) => {
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

    let isAnsCorrect = false;
    let updatedAnswers: (number | string)[] = [];

    const correctVal = currentQuestion.correctAnswer;

    if (currentQuestion.operator === 'So sánh') {
      isAnsCorrect = inputValue.trim() === String(correctVal).trim();
      updatedAnswers = [...userAnswers, inputValue];
    } else if (currentQuestion.operator === 'Đồng hồ') {
      const cleanInput = inputValue.trim().toLowerCase();
      const correctHour = Number(correctVal);
      isAnsCorrect = 
        cleanInput === String(correctHour) ||
        cleanInput === `${correctHour} giờ` ||
        cleanInput === `${correctHour}gio` ||
        cleanInput === `${correctHour}h` ||
        cleanInput === `${correctHour}:00` ||
        cleanInput === `0${correctHour}:00`;
      updatedAnswers = [...userAnswers, inputValue];
    } else if (currentQuestion.operator === 'Ngày tháng') {
      const cleanInput = inputValue.trim().toLowerCase();
      // Câu hỏi về Tháng 2 chấp nhận: 28, 29, 28 hoặc 29, 28/29
      if (currentQuestion.text.includes('Tháng 2') || currentQuestion.text.includes('tháng 2')) {
        const accepted = [
          '28', '29', '28 hoặc 29', '28/29', '28 hoac 29',
          '28 ngày', '29 ngày', '28 hoặc 29 ngày', '28/29 ngày', '28 hoac 29 ngay',
          '28ngay', '29ngay', '28hoac29ngay', '28/29ngay'
        ];
        isAnsCorrect = accepted.some(ans => cleanInput.replace(/\s+/g, '') === ans.replace(/\s+/g, ''));
      } else {
        const normInput = normalizeDayOfWeek(cleanInput);
        const normCorrect = normalizeDayOfWeek(String(correctVal));
        isAnsCorrect = 
          normInput === normCorrect ||
          cleanInput === String(correctVal).toLowerCase() ||
          cleanInput === `${String(correctVal).toLowerCase()} ngày` ||
          cleanInput === `${String(correctVal).toLowerCase()} tháng` ||
          cleanInput.replace(/\s+/g, '') === String(correctVal).toLowerCase().replace(/\s+/g, '');
      }
      updatedAnswers = [...userAnswers, inputValue];
    } else {
      const answerNum = parseInt(inputValue, 10);
      isAnsCorrect = answerNum === Number(correctVal);
      updatedAnswers = [...userAnswers, answerNum];
    }

    setUserAnswers(updatedAnswers);
    
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
        
        let correctDisplay = String(correctVal);
        if (currentQuestion.operator === 'Đồng hồ') {
          correctDisplay = `${correctVal} giờ`;
        } else if (currentQuestion.operator === 'Đổi đơn vị') {
          correctDisplay = `${currentQuestion.num1} ${currentQuestion.fromUnit} = [ ${correctVal} ] ${currentQuestion.toUnit}`;
        } else if (currentQuestion.operator === 'So sánh') {
          correctDisplay = `${currentQuestion.compLeft} [ ${correctVal} ] ${currentQuestion.compRight}`;
        } else if (currentQuestion.operator === 'Dãy số') {
          correctDisplay = `Số thích hợp là [ ${correctVal} ]`;
        } else if (currentQuestion.operator === 'Ngày tháng') {
          if (currentQuestion.text.includes('Tháng 2') || currentQuestion.text.includes('tháng 2')) {
            correctDisplay = '28 hoặc 29 ngày';
          } else if (typeof correctVal === 'number') {
            correctDisplay = `Số thích hợp là [ ${correctVal} ]`;
          } else {
            correctDisplay = `Đáp án là [ ${correctVal} ]`;
          }
        } else if (['Cộng', 'Trừ', 'Nhân', 'Chia'].includes(currentQuestion.operator)) {
          let opSym = '+';
          if (currentQuestion.operator === 'Trừ') opSym = '-';
          else if (currentQuestion.operator === 'Nhân') opSym = '×';
          else if (currentQuestion.operator === 'Chia') opSym = '÷';

          const val1 = currentQuestion.num1;
          const val2 = currentQuestion.num2;
          let resultVal = val1 + val2;
          if (currentQuestion.operator === 'Trừ') resultVal = val1 - val2;
          else if (currentQuestion.operator === 'Nhân') resultVal = val1 * val2;
          else if (currentQuestion.operator === 'Chia') resultVal = val1 / val2;

          if (currentQuestion.isMissingNumber) {
            if (currentQuestion.missingPosition === 'left') {
              correctDisplay = `[ ${val1} ] ${opSym} ${val2} = ${resultVal}`;
            } else if (currentQuestion.missingPosition === 'right') {
              correctDisplay = `${val1} ${opSym} [ ${val2} ] = ${resultVal}`;
            } else {
              correctDisplay = `${val1} ${opSym} ${val2} = [ ${resultVal} ]`;
            }
          } else {
            correctDisplay = `${val1} ${opSym} ${val2} = [ ${correctVal} ]`;
          }
        }
        
        setFeedback(`Không sao đâu con! Đáp án đúng là: ${correctDisplay}`);
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
            <span>Dạng bài: {currentQuestion.operator}</span>
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
              LỚP 3 • {currentQuestion.operator.toUpperCase()}
            </div>

            {/* Phép tính toán / Dạng bài tập */}
            {(() => {
              // Cấu hình linh hoạt loại input
              const isDateTextAns = currentQuestion.operator === 'Ngày tháng' && typeof currentQuestion.correctAnswer === 'string' && currentQuestion.correctAnswer.includes('thứ');
              
              // Định nghĩa ô nhập liệu chuẩn
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
                    pattern={isDateTextAns || currentQuestion.operator === 'So sánh' ? undefined : "[0-9]*"}
                    id={`math-answer-input-${currentQuestion.id}`}
                    inputMode={isDateTextAns || currentQuestion.operator === 'So sánh' ? undefined : "numeric"}
                    value={inputValue}
                    disabled={isChecked}
                    autoFocus
                    onChange={(e) => {
                      if (currentQuestion.operator === 'So sánh') {
                        const val = e.target.value;
                        if (['>', '<', '='].includes(val) || val === '') {
                          setInputValue(val);
                        }
                      } else if (currentQuestion.operator === 'Ngày tháng') {
                        // Cho phép nhập chữ bất kỳ tối đa 20 ký tự (vd: "thứ Năm", "28 ngày")
                        if (e.target.value.length <= 20) {
                          setInputValue(e.target.value);
                        }
                      } else {
                        const cleanVal = e.target.value.replace(/[^0-9]/g, '');
                        if (cleanVal.length <= 4) {
                          setInputValue(cleanVal);
                        }
                      }
                    }}
                    placeholder="?"
                    className={`w-20 sm:w-28 md:w-36 lg:w-44 text-center font-sans font-black text-2xl sm:text-3xl md:text-4xl lg:text-5xl bg-slate-100 border-3 md:border-4 border-slate-300 rounded-2xl md:rounded-3xl py-1 md:py-2 px-1 text-slate-800 placeholder-slate-300 focus:outline-none focus:border-blue-500 focus:bg-white transition-all ${
                      isChecked
                        ? isCorrect
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-400'
                          : 'bg-rose-50 text-rose-600 border-rose-400'
                        : ''
                    } ${isDateTextAns ? 'w-48 sm:w-56 md:w-64 text-xl sm:text-2xl py-2 px-2' : ''}`}
                  />
                </div>
              );

              // 1. Dạng Xem đồng hồ
              if (currentQuestion.operator === 'Đồng hồ') {
                return (
                  <div className="flex flex-col items-center gap-4 py-2 w-full">
                    <div className="w-48 h-48 md:w-56 md:h-56 shrink-0 bg-slate-50 rounded-full p-2 border-2 border-slate-200 shadow-inner">
                      <SvgClock hour={currentQuestion.hour || 12} />
                    </div>
                    <p className="text-lg md:text-xl font-bold text-slate-600 font-sans text-center mt-2">
                      Đồng hồ đang chỉ mấy giờ?
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      {inputElement}
                      <span className="text-xl md:text-2xl font-black text-slate-600 font-sans">giờ</span>
                    </div>
                  </div>
                );
              }

              // 2. Dạng Đổi đơn vị
              if (currentQuestion.operator === 'Đổi đơn vị') {
                return (
                  <div className="w-full py-4 flex justify-center">
                    <div className="text-2xl sm:text-4xl md:text-5xl font-sans font-black text-slate-800 tracking-normal text-center flex items-center justify-center gap-2 sm:gap-3 whitespace-nowrap flex-nowrap">
                      <span>{currentQuestion.num1} {currentQuestion.fromUnit}</span>
                      <span className="text-blue-500 font-bold">=</span>
                      {inputElement}
                      <span>{currentQuestion.toUnit}</span>
                    </div>
                  </div>
                );
              }

              // 3. Dạng Toán lời văn
              if (currentQuestion.operator === 'Lời văn') {
                return (
                  <div className="flex flex-col items-center gap-6 py-4 w-full max-w-xl">
                    <div className="bg-slate-50 border-2 border-slate-100 rounded-3xl p-5 md:p-6 shadow-inner w-full text-center">
                      <p className="text-lg md:text-xl font-bold text-slate-700 font-sans leading-relaxed">
                        {currentQuestion.wordProblemText}
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-lg md:text-xl font-black text-slate-500 font-sans">Đáp án:</span>
                      {inputElement}
                    </div>
                  </div>
                );
              }

              // 4. Dạng So sánh số
              if (currentQuestion.operator === 'So sánh') {
                return (
                  <div className="w-full py-4 flex justify-center">
                    <div className="text-3xl sm:text-5xl md:text-6xl font-sans font-black text-slate-800 tracking-normal text-center flex items-center justify-center gap-3 sm:gap-4 whitespace-nowrap flex-nowrap">
                      <span>{currentQuestion.compLeft}</span>
                      <div className="mx-1 relative inline-block">
                        <div
                          className={`w-20 sm:w-28 md:w-36 lg:w-44 h-16 sm:h-20 md:h-24 flex items-center justify-center text-center font-sans font-black text-3xl sm:text-4xl md:text-5xl lg:text-6xl bg-slate-100 border-3 md:border-4 border-dashed border-slate-300 rounded-2xl md:rounded-3xl text-indigo-600 transition-all ${
                            isChecked
                              ? isCorrect
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-400 border-solid'
                                : 'bg-rose-50 text-rose-600 border-rose-400 border-solid'
                              : 'bg-indigo-50/50 border-indigo-200'
                          }`}
                        >
                          {inputValue || '?'}
                        </div>
                      </div>
                      <span>{currentQuestion.compRight}</span>
                    </div>
                  </div>
                );
              }

              // 5. Dạng Dãy số
              if (currentQuestion.operator === 'Dãy số') {
                return (
                  <div className="w-full py-4 flex justify-center">
                    <div className="text-3xl sm:text-4xl md:text-5xl font-sans font-black text-slate-800 tracking-normal text-center flex items-center justify-center gap-3 sm:gap-4 whitespace-nowrap flex-wrap">
                      {currentQuestion.sequence?.map((num, idx) => {
                        if (idx === currentQuestion.missingIndex) {
                          return <div key={idx}>{inputElement}</div>;
                        }
                        return <span key={idx} className="text-slate-600">{num}</span>;
                      })}
                    </div>
                  </div>
                );
              }

              // 5.5. Dạng Ngày tháng
              if (currentQuestion.operator === 'Ngày tháng') {
                return (
                  <div className="flex flex-col items-center gap-6 py-4 w-full max-w-xl">
                    <div className="bg-slate-50 border-2 border-slate-100 rounded-3xl p-5 md:p-6 shadow-inner w-full text-center">
                      <p className="text-xl md:text-2xl font-bold text-slate-700 font-sans leading-relaxed">
                        {currentQuestion.text}
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-lg md:text-xl font-black text-slate-500 font-sans">Đáp án:</span>
                      {inputElement}
                    </div>
                  </div>
                );
              }

              // 6. Nhóm phép tính cơ bản
              const originalResult = currentQuestion.operatorSymbol === '+' ? currentQuestion.num1 + currentQuestion.num2
                : currentQuestion.operatorSymbol === '-' ? currentQuestion.num1 - currentQuestion.num2
                : currentQuestion.operatorSymbol === '×' ? currentQuestion.num1 * currentQuestion.num2
                : currentQuestion.num1 / currentQuestion.num2;

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

            {/* Khối Bàn Phím Dành Cho Dấu So Sánh / Hoặc Số */}
            {currentQuestion.operator === 'So sánh' ? (
              <div className="w-full max-w-sm mt-4 grid grid-cols-3 gap-3" id="virtual-keypad-comp">
                {['>', '<', '='].map((sign) => (
                  <button
                    key={sign}
                    type="button"
                    id={`btn-keypad-sign-${sign}`}
                    disabled={isChecked}
                    onClick={() => handleKeypadPress(sign)}
                    className="py-5 bg-indigo-50 hover:bg-indigo-100 active:scale-95 disabled:opacity-50 disabled:pointer-events-none rounded-2xl border-2 border-indigo-200 font-sans font-black text-3xl md:text-4xl text-indigo-700 shadow-md cursor-pointer transition-transform flex items-center justify-center"
                  >
                    {sign}
                  </button>
                ))}
              </div>
            ) : currentQuestion.operator === 'Ngày tháng' && typeof currentQuestion.correctAnswer === 'string' && currentQuestion.correctAnswer.includes('thứ') ? (
              <div className="text-center text-slate-400 text-xs py-4 font-semibold font-sans">
                * Mẹo: Bé hãy gõ tên thứ bằng bàn phím thiết bị nhé!
              </div>
            ) : (
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
            )}

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
