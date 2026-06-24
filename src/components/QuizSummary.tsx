import { motion } from 'motion/react';
import { QuizConfig as QuizConfigType, QuizHistory } from '../types';
import MathMascot from './MathMascot';
import { RefreshCw, Award, ThumbsUp, Calendar, BookOpen, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

interface QuizSummaryProps {
  config: QuizConfigType;
  history: QuizHistory[];
  correctCount: number;
  onReset: () => void;
}

export default function QuizSummary({ config, history, correctCount, onReset }: QuizSummaryProps) {
  const total = config.totalQuestions;
  const percentage = Math.round((correctCount / total) * 100);

  // Lấy lời khen & trạng thái mascot tương xứng với điểm số
  let praise = '';
  let subPraise = '';
  let mascotState: 'winner' | 'correct' | 'idle' | 'wrong' = 'idle';
  let badgeColor = '';

  if (percentage >= 90) {
    praise = 'XUẤT SẮC! 🏆';
    subPraise = 'Bé tính toán siêu đẳng vượt trội luôn chuẩn bị nhận huy chương vàng nha!';
    mascotState = 'winner';
    badgeColor = 'bg-amber-100 text-amber-700 border-amber-300';
  } else if (percentage >= 70) {
    praise = 'RẤT TỐT! 🌟';
    subPraise = 'Bé làm bài cực giỏi luôn, rèn luyện tiếp để đạt điểm tuyệt đối nhé!';
    mascotState = 'correct';
    badgeColor = 'bg-blue-100 text-blue-700 border-blue-300';
  } else if (percentage >= 50) {
    praise = 'CỐ THÊM CHÚT NỮA NHÉ! 💪';
    subPraise = 'Chúc mừng con đã hoàn thành! Chỉ cần cẩn thận hơn chút nữa là tuyệt hảo.';
    mascotState = 'idle';
    badgeColor = 'bg-emerald-100 text-emerald-700 border-emerald-300';
  } else {
    praise = 'KHÔNG SAO, MÌNH LUYỆN LẠI NHÉ! ❤️';
    subPraise = 'Đừng nản lòng nhé! Trí tuệ lớn lên từ những bài luyện tập. Thử lại nào con yêu!';
    mascotState = 'wrong';
    badgeColor = 'bg-slate-100 text-slate-700 border-slate-300';
  }

  // Thời gian hoàn thiện bài kiểm tra tiện ghi nhớ
  const formattedDate = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6 md:py-10 space-y-8">
      {/* Khối chúc mừng sinh động */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 100 }}
        className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border-4 border-amber-100 flex flex-col items-center text-center"
      >
        {/* Mascot BiBi chúc mừng */}
        <div className="mb-4">
          <MathMascot state={mascotState} />
        </div>

        {/* Lời khen khổng lồ */}
        <motion.h2 
          className="text-2xl md:text-4xl font-extrabold text-blue-600 mt-6 font-sans tracking-wide"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 2.5 }}
        >
          {praise}
        </motion.h2>
        <p className="text-slate-500 font-medium text-sm md:text-base max-w-md mt-2">
          {subPraise}
        </p>

        {/* Bảng báo cáo điểm số bento bắt mắt */}
        <div className="grid grid-cols-2 gap-4 w-full max-w-md mt-8">
          {/* Cột 1: Câu đúng */}
          <div className="bg-emerald-50 border-3 border-emerald-100 rounded-2xl p-4 flex flex-col items-center">
            <span className="text-emerald-500 font-black text-3xl md:text-4xl">{correctCount} / {total}</span>
            <span className="text-emerald-700 font-bold text-xs mt-1">Câu trả lời đúng</span>
          </div>

          {/* Cột 2: Phần trăm */}
          <div className="bg-indigo-50 border-3 border-indigo-100 rounded-2xl p-4 flex flex-col items-center">
            <span className="text-indigo-500 font-black text-3xl md:text-4xl">{percentage}%</span>
            <span className="text-indigo-700 font-bold text-xs mt-1">Điểm số đạt được</span>
          </div>
        </div>

        {/* Thông tin ngày hoàn tất */}
        <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-400 font-medium">
          <Calendar className="w-3.5 h-3.5" />
          <span>Hoàn thành lúc: {formattedDate}</span>
        </div>

        {/* Nút Làm bài mới nổi bật */}
        <div className="w-full max-w-sm mt-8">
          <button
            type="button"
            id="btn-restart-quiz"
            onClick={onReset}
            className="w-full bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-black text-lg md:text-xl py-4 px-6 rounded-3xl shadow-lg border-b-6 border-orange-700 transition-all cursor-pointer flex items-center justify-center gap-3 font-sans"
          >
            <RefreshCw className="w-5 h-5 animate-spin-slow" />
            LÀM LUYỆN BÀI MỚI
          </button>
        </div>
      </motion.div>

      {/* Nhật ký đáp án chi tiết học hỏi (Dành cho Bé xem lại & Phụ huynh chấm bài) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-3xl p-6 md:p-8 shadow-lg border-2 border-slate-100"
      >
        <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-3">
          <BookOpen className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg md:text-xl font-extrabold text-slate-800 font-sans">
            Xem lại bài làm chi tiết
          </h3>
        </div>

        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2" id="history-list">
          {history.map((item, index) => {
            const lastSubmittedValue = item.userAnswers[item.userAnswers.length - 1];
            return (
              <div
                key={index}
                className={`p-4 rounded-2xl border-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 transition-all ${
                  item.isCorrect
                    ? 'bg-emerald-50/50 border-emerald-100'
                    : 'bg-rose-50/50 border-rose-100'
                }`}
              >
                {/* Phép tính câu số mấy */}
                <div className="flex items-start gap-3">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    item.isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                  }`}>
                    {index + 1}
                  </span>
                  
                  <div>
                    <div className="font-sans font-black text-lg text-slate-700 flex items-center gap-1.5 flex-wrap">
                      {(() => {
                        const q = item.question;
                        
                        if (q.operator === 'Đồng hồ') {
                          return (
                            <>
                              <span>Đồng hồ chỉ:</span>
                              <span className="text-indigo-600 font-extrabold bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-xl shadow-sm mx-1">
                                {q.correctAnswer}
                              </span>
                              <span>giờ</span>
                            </>
                          );
                        }
                        
                        if (q.operator === 'Đổi đơn vị') {
                          return (
                            <>
                              <span>{q.num1} {q.fromUnit}</span>
                              <span className="text-blue-500">=</span>
                              <span className="text-indigo-600 font-extrabold bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-xl shadow-sm mx-1">
                                {q.correctAnswer}
                              </span>
                              <span>{q.toUnit}</span>
                            </>
                          );
                        }
                        
                        if (q.operator === 'Lời văn') {
                          return (
                            <div className="text-sm font-semibold text-slate-600 max-w-md line-clamp-2">
                              {q.wordProblemText} ➔ <span className="text-indigo-600 font-extrabold bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-lg shadow-sm">{q.correctAnswer}</span>
                            </div>
                          );
                        }
                        
                        if (q.operator === 'So sánh') {
                          return (
                            <>
                              <span>{q.compLeft}</span>
                              <span className="text-indigo-600 font-extrabold bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-xl shadow-sm mx-1">
                                {q.correctAnswer}
                              </span>
                              <span>{q.compRight}</span>
                            </>
                          );
                        }
                        
                        if (q.operator === 'Dãy số') {
                          return (
                            <div className="flex items-center gap-1.5">
                              {q.sequence?.map((num, idx) => {
                                if (idx === q.missingIndex) {
                                  return (
                                    <span key={idx} className="text-indigo-600 font-extrabold bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-lg shadow-sm">
                                      {q.correctAnswer}
                                    </span>
                                  );
                                }
                                return <span key={idx}>{num}</span>;
                              })}
                            </div>
                          );
                        }
                        
                        if (q.operator === 'Ngày tháng') {
                          const isFeb = q.text.includes('Tháng 2') || q.text.includes('tháng 2');
                          const ansDisplay = isFeb ? '28 hoặc 29 ngày' : q.correctAnswer;
                          return (
                            <div className="text-sm font-semibold text-slate-600 max-w-md">
                              {q.text} ➔ <span className="text-indigo-600 font-extrabold bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-lg shadow-sm font-sans">{ansDisplay}</span>
                            </div>
                          );
                        }

                        // Nhóm cơ bản
                        const originalResult = q.operatorSymbol === '+' ? q.num1 + q.num2
                          : q.operatorSymbol === '-' ? q.num1 - q.num2
                          : q.operatorSymbol === '×' ? q.num1 * q.num2
                          : q.num1 / q.num2;
                        
                        if (q.isMissingNumber && q.missingPosition === 'left') {
                          return (
                            <>
                              <span className="text-indigo-600 font-extrabold bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-xl shadow-sm">
                                {q.correctAnswer}
                              </span>
                              <span className="text-blue-500">{q.operatorSymbol}</span>
                              <span>{q.num2}</span>
                              <span className="text-slate-400">=</span>
                              <span>{originalResult}</span>
                            </>
                          );
                        } else if (q.isMissingNumber && q.missingPosition === 'right') {
                          return (
                            <>
                              <span>{q.num1}</span>
                              <span className="text-blue-500">{q.operatorSymbol}</span>
                              <span className="text-indigo-600 font-extrabold bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-xl shadow-sm">
                                {q.correctAnswer}
                              </span>
                              <span className="text-slate-400">=</span>
                              <span>{originalResult}</span>
                            </>
                          );
                        } else {
                          return (
                            <>
                              <span>{q.num1}</span>
                              <span className="text-blue-500">{q.operatorSymbol}</span>
                              <span>{q.num2}</span>
                              <span className="text-slate-400">=</span>
                              <span className="text-indigo-600 font-extrabold bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-xl shadow-sm">
                                {q.correctAnswer}
                              </span>
                            </>
                          );
                        }
                      })()}
                    </div>
                    <div className="text-xs text-slate-400 font-medium mt-0.5">
                      Phép tính tương tác: {item.question.operator}
                    </div>
                  </div>
                </div>

                {/* Kết quả chi tiết lượt làm */}
                <div className="text-sm font-medium w-full sm:w-auto text-right flex sm:flex-col items-end justify-between sm:justify-center border-t sm:border-t-0 border-slate-100 mt-2 sm:mt-0 pt-2 sm:pt-0">
                  <div className="flex items-center gap-1.5">
                    {item.isCorrect ? (
                      <span className="text-emerald-600 font-black inline-flex items-center gap-1 text-sm md:text-base">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        Chính xác
                      </span>
                    ) : (
                      <span className="text-rose-600 font-black inline-flex items-center gap-1 text-sm md:text-base">
                        <XCircle className="w-4 h-4 text-rose-500" strokeWidth={2.5} />
                        Chưa chính xác
                      </span>
                    )}
                  </div>
                  
                  <div className="text-xs text-slate-500 mt-1 font-sans">
                    Bé trả lời: <span className="font-bold text-slate-700">{item.userAnswers.join(' ➔ ') || '_'}</span> {item.userAnswers.length > 1 && `(${item.userAnswers.length} lần tính)`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
