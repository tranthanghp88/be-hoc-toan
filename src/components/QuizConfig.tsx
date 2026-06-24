import { useState } from 'react';
import { motion } from 'motion/react';
import { MathOperator, QuizConfig as QuizConfigType } from '../types';
import MathMascot from './MathMascot';
import { Play, Sparkles, BookOpen, Printer } from 'lucide-react';

interface QuizConfigProps {
  onStart: (config: QuizConfigType, mode?: 'playing' | 'a4_sheet') => void;
}

export default function QuizConfig({ onStart }: QuizConfigProps) {
  const [totalQuestions, setTotalQuestions] = useState<number>(10);
  const [operator, setOperator] = useState<MathOperator>('cong');
  const [selectedTables, setSelectedTables] = useState<number[]>([2, 3, 4, 5, 6, 7, 8, 9]);

  // Cấu hình nâng cao cho phép cộng
  const [congRange, setCongRange] = useState<'20' | '100'>('100');
  const [congTypes, setCongTypes] = useState<('khong_nho' | 'co_nho')[]>(['khong_nho', 'co_nho']);

  // Cấu hình nâng cao cho phép trừ
  const [truRange, setTruRange] = useState<'20' | '100'>('100');
  const [truTypes, setTruTypes] = useState<('khong_muon' | 'co_muon')[]>(['khong_muon', 'co_muon']);

  // Cấu hình nâng cao mới cho Lời văn và Hỗn hợp toàn bộ
  const [selectedWordProblemOps, setSelectedWordProblemOps] = useState<('cong' | 'tru' | 'nhan' | 'chia')[]>(['cong', 'tru', 'nhan', 'chia']);
  const [selectedQuizDangs, setSelectedQuizDangs] = useState<('cong' | 'tru' | 'nhan' | 'chia' | 'dong_ho' | 'doi_don_vi' | 'toan_loi_van' | 'so_sanh_so' | 'day_so' | 'ngay_thang')[]>(['cong', 'tru', 'nhan', 'chia', 'dong_ho', 'doi_don_vi', 'toan_loi_van', 'so_sanh_so', 'day_so', 'ngay_thang']);

  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  const toggleCongType = (type: 'khong_nho' | 'co_nho') => {
    setCongTypes(prev => {
      if (prev.includes(type)) {
        const next = prev.filter(x => x !== type);
        return next.length === 0 ? ['khong_nho', 'co_nho'] : next;
      } else {
        return [...prev, type];
      }
    });
  };

  const toggleTruType = (type: 'khong_muon' | 'co_muon') => {
    setTruTypes(prev => {
      if (prev.includes(type)) {
        const next = prev.filter(x => x !== type);
        return next.length === 0 ? ['khong_muon', 'co_muon'] : next;
      } else {
        return [...prev, type];
      }
    });
  };

  const toggleTable = (num: number) => {
    if (selectedTables.includes(num)) {
      setSelectedTables(prev => prev.filter(x => x !== num));
    } else {
      setSelectedTables(prev => [...prev, num]);
    }
  };

  const toggleWordProblemOp = (op: 'cong' | 'tru' | 'nhan' | 'chia') => {
    setSelectedWordProblemOps(prev => {
      const next = prev.includes(op) ? prev.filter(x => x !== op) : [...prev, op];
      return next.length === 0 ? [op] : next;
    });
  };

  const toggleQuizDang = (dang: typeof selectedQuizDangs[number]) => {
    setSelectedQuizDangs(prev => {
      const next = prev.includes(dang) ? prev.filter(x => x !== dang) : [...prev, dang];
      return next.length === 0 ? [dang] : next;
    });
  };

  const isAllSelected = selectedTables.length === 8 && [2, 3, 4, 5, 6, 7, 8, 9].every(x => selectedTables.includes(x));

  const toggleAllTables = () => {
    if (isAllSelected) {
      setSelectedTables([]);
    } else {
      setSelectedTables([2, 3, 4, 5, 6, 7, 8, 9]);
    }
  };

  const basicOperatorOptions = [
    {
      value: 'cong' as const,
      label: 'Phép Cộng',
      symbol: '+',
      desc: 'Cộng phạm vi 100',
      bg: 'bg-rose-50 hover:bg-rose-100',
      text: 'text-rose-500',
      border: 'border-rose-200'
    },
    {
      value: 'tru' as const,
      label: 'Phép Trừ',
      symbol: '-',
      desc: 'Trừ phạm vi 100',
      bg: 'bg-indigo-50 hover:bg-indigo-100',
      text: 'text-indigo-500',
      border: 'border-indigo-200'
    },
    {
      value: 'nhan' as const,
      label: 'Phép Nhân',
      symbol: '×',
      desc: 'Bảng cửu chương 2–9',
      bg: 'bg-amber-50 hover:bg-amber-100',
      text: 'text-amber-500',
      border: 'border-amber-200'
    },
    {
      value: 'chia' as const,
      label: 'Phép Chia',
      symbol: '÷',
      desc: 'Chia hết các bảng 2–9',
      bg: 'bg-emerald-50 hover:bg-emerald-100',
      text: 'text-emerald-500',
      border: 'border-emerald-200'
    },
    {
      value: 'hon_hop' as const,
      label: 'Hỗn Hợp Phép Tính',
      symbol: '?',
      desc: 'Hỗn hợp phép tính',
      bg: 'bg-purple-50 hover:bg-purple-100',
      text: 'text-purple-500',
      border: 'border-purple-200'
    },
  ];

  const advancedOperatorOptions = [
    {
      value: 'xem_dong_ho' as const,
      label: 'Xem Đồng Hồ',
      symbol: '🕒',
      desc: 'Tập xem giờ đúng',
      bg: 'bg-cyan-50 hover:bg-cyan-100',
      text: 'text-cyan-500',
      border: 'border-cyan-200'
    },
    {
      value: 'doi_don_vi' as const,
      label: 'Đổi Đơn Vị',
      symbol: '📏',
      desc: 'Độ dài, khối lượng, giờ',
      bg: 'bg-teal-50 hover:bg-teal-100',
      text: 'text-teal-500',
      border: 'border-teal-200'
    },
    {
      value: 'toan_loi_van' as const,
      label: 'Toán Lời Văn',
      symbol: '📖',
      desc: 'Đọc hiểu & giải toán',
      bg: 'bg-orange-50 hover:bg-orange-100',
      text: 'text-orange-500',
      border: 'border-orange-200'
    },
    {
      value: 'so_sanh_so' as const,
      label: 'So Sánh Số',
      symbol: '🔍',
      desc: 'Điền dấu >, <, =',
      bg: 'bg-blue-50 hover:bg-blue-100',
      text: 'text-blue-500',
      border: 'border-blue-200'
    },
    {
      value: 'day_so' as const,
      label: 'Dãy Số',
      symbol: '🔢',
      desc: 'Quy luật tăng giảm đều',
      bg: 'bg-violet-50 hover:bg-violet-100',
      text: 'text-violet-500',
      border: 'border-violet-200'
    },
    {
      value: 'ngay_thang' as const,
      label: 'Ngày Tháng',
      symbol: '📅',
      desc: 'Ngày, tuần, tháng, năm',
      bg: 'bg-yellow-50 hover:bg-yellow-100',
      text: 'text-yellow-600',
      border: 'border-yellow-200'
    },
    {
      value: 'hon_hop_toan_bo' as const,
      label: 'Hỗn Hợp Toàn Bộ',
      symbol: '🎲',
      desc: 'Tất cả các dạng bài',
      bg: 'bg-emerald-50 hover:bg-emerald-100',
      text: 'text-emerald-600',
      border: 'border-emerald-200'
    },
  ];

  const handleStart = () => {
    const tablesToUse = selectedTables.length === 0 ? [2, 3, 4, 5, 6, 7, 8, 9] : selectedTables;
    const finalCongTypes = congTypes.length === 0 ? ['khong_nho', 'co_nho'] : congTypes;
    const finalTruTypes = truTypes.length === 0 ? ['khong_muon', 'co_muon'] : truTypes;

    onStart({
      totalQuestions,
      operator,
      selectedTables: tablesToUse,
      congRange,
      congTypes: finalCongTypes,
      truRange,
      truTypes: finalTruTypes,
      selectedQuizDangs,
      selectedWordProblemOps
    }, 'playing');
  };

  const handlePrintSheet = () => {
    const tablesToUse = selectedTables.length === 0 ? [2, 3, 4, 5, 6, 7, 8, 9] : selectedTables;
    const finalCongTypes = congTypes.length === 0 ? ['khong_nho', 'co_nho'] : congTypes;
    const finalTruTypes = truTypes.length === 0 ? ['khong_muon', 'co_muon'] : truTypes;

    // Để đồng bộ, sao chép cấu hình luyện tập hiện tại sang PDF
    const mappedPdfDangs = selectedQuizDangs.map(dang => {
      if (dang === 'cong' || dang === 'tru' || dang === 'nhan' || dang === 'chia') {
        return 'phep_tinh' as const;
      }
      if (dang === 'dong_ho') return 'dong_ho' as const;
      return dang as any;
    });
    // Lọc bỏ trùng lặp 'phep_tinh'
    const uniquePdfDangs = Array.from(new Set(mappedPdfDangs)) as ('phep_tinh' | 'dong_ho' | 'doi_don_vi' | 'toan_loi_van' | 'so_sanh_so' | 'day_so' | 'ngay_thang')[];

    onStart({
      totalQuestions,
      operator,
      selectedTables: tablesToUse,
      congRange,
      congTypes: finalCongTypes,
      truRange,
      truTypes: finalTruTypes,
      selectedQuizDangs,
      selectedPdfDangs: uniquePdfDangs.length > 0 ? uniquePdfDangs : undefined,
      selectedWordProblemOps
    }, 'a4_sheet');
  };

  const showTablesSelector = 
    operator === 'nhan' || 
    operator === 'chia' || 
    operator === 'hon_hop' || 
    (operator === 'hon_hop_toan_bo' && (selectedQuizDangs.includes('nhan') || selectedQuizDangs.includes('chia')));
  
  const showAdditionSelector = 
    operator === 'cong' || 
    operator === 'hon_hop' || 
    (operator === 'hon_hop_toan_bo' && selectedQuizDangs.includes('cong'));
  
  const showSubtractionSelector = 
    operator === 'tru' || 
    operator === 'hon_hop' || 
    (operator === 'hon_hop_toan_bo' && selectedQuizDangs.includes('tru'));

  const showWordProblemSelector = 
    operator === 'toan_loi_van' || 
    (operator === 'hon_hop_toan_bo' && selectedQuizDangs.includes('toan_loi_van'));

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8">
      {/* Khối Mascot & Tiêu đề chính */}
      <div className="flex flex-col items-center mb-10 text-center relative">
        <div className="absolute top-0 left-10 text-yellow-400 animate-bounce delay-100 opacity-60">
          <Sparkles className="w-8 h-8" />
        </div>
        <div className="absolute top-4 right-10 text-pink-400 animate-pulse opacity-60">
          <BookOpen className="w-6 h-6" />
        </div>
        
        {/* Mascot BiBi */}
        <div className="mb-4">
          <MathMascot state="idle" />
        </div>

        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-extrabold text-blue-600 tracking-tight font-sans mt-4"
        >
          Bé Học Toán
        </motion.h1>
        <p className="text-slate-500 mt-2 text-sm md:text-base font-medium">
          Học toán lớp 3 thật vui • Không cần in giấy • Làm trực tiếp cực dễ!
        </p>
      </div>

      {/* Cấu hình chính */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border-4 border-blue-100 space-y-8"
        id="config-card"
      >
        {/* 1. Chọn số câu hỏi */}
        <div className="space-y-3">
          <label className="block text-slate-700 font-bold text-lg md:text-xl text-center md:text-left">
            🎯 Chọn số câu hỏi bé muốn làm:
          </label>
          <div className="grid grid-cols-3 gap-3 md:gap-4">
            {[10, 20, 50].map((num) => (
              <button
                key={num}
                type="button"
                id={`btn-question-count-${num}`}
                onClick={() => setTotalQuestions(num)}
                className={`py-3 px-4 rounded-2xl text-center font-bold text-lg transition-all duration-300 transform active:scale-95 cursor-pointer flex flex-col items-center justify-center border-3 ${
                  totalQuestions === num
                    ? 'bg-blue-500 text-white border-blue-600 shadow-lg shadow-blue-200 scale-[1.03]'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="text-xl md:text-2xl">{num}</span>
                <span className="text-xs md:text-sm font-normal mt-0.5">Câu hỏi</span>
              </button>
            ))}
          </div>
        </div>

        {/* 2. Chọn dạng toán */}
        <div className="space-y-4">
          <label className="block text-slate-700 font-bold text-lg md:text-xl text-center md:text-left mb-1">
            ⚡ Chọn dạng toán bé muốn luyện tập:
          </label>
          
          {/* Nhóm cơ bản */}
          <div className="space-y-2">
            <span className="text-xs font-black text-rose-500 uppercase tracking-widest block border-b border-rose-100 pb-1">📌 Nhóm Cơ Bản:</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {basicOperatorOptions.map((opt) => {
                const isSelected = operator === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    id={`btn-operator-${opt.value}`}
                    onClick={() => setOperator(opt.value)}
                    className={`p-3 rounded-2xl border-3 flex flex-col justify-between items-center transition-all duration-300 transform active:scale-95 text-center cursor-pointer min-h-[145px] ${
                      isSelected
                        ? 'bg-blue-500 text-white border-blue-600 shadow-lg shadow-blue-200 scale-[1.03]'
                        : `bg-white text-slate-700 hover:bg-slate-50 border-slate-200`
                    }`}
                  >
                    <div className="h-12 flex items-center justify-center w-full">
                      <span
                        className={`w-12 h-12 rounded-full flex items-center justify-center font-extrabold text-2xl shadow-inner ${
                          isSelected ? 'bg-white text-blue-600' : `${opt.bg} ${opt.text}`
                        }`}
                      >
                        {opt.symbol}
                      </span>
                    </div>
                    <div className="min-h-[48px] flex flex-col items-center justify-center w-full mt-2">
                      <span className="font-bold text-sm md:text-base leading-tight">{opt.label}</span>
                      <span
                        className={`text-2xs md:text-xs leading-tight font-medium mt-0.5 ${
                          isSelected ? 'text-blue-100' : 'text-slate-400'
                        }`}
                      >
                        {opt.desc}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Nhóm nâng cao */}
          <div className="space-y-2 pt-2">
            <span className="text-xs font-black text-indigo-500 uppercase tracking-widest block border-b border-indigo-100 pb-1">🚀 Nhóm Nâng Cao:</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {advancedOperatorOptions.map((opt) => {
                const isSelected = operator === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    id={`btn-operator-${opt.value}`}
                    onClick={() => setOperator(opt.value)}
                    className={`p-3 rounded-2xl border-3 flex flex-col justify-between items-center transition-all duration-300 transform active:scale-95 text-center cursor-pointer min-h-[145px] ${
                      isSelected
                        ? 'bg-blue-500 text-white border-blue-600 shadow-lg shadow-blue-200 scale-[1.03]'
                        : `bg-white text-slate-700 hover:bg-slate-50 border-slate-200`
                    }`}
                  >
                    <div className="h-12 flex items-center justify-center w-full">
                      <span
                        className={`w-12 h-12 rounded-full flex items-center justify-center font-extrabold text-2xl shadow-inner ${
                          isSelected ? 'bg-white text-blue-600' : `${opt.bg} ${opt.text}`
                        }`}
                      >
                        {opt.symbol}
                      </span>
                    </div>
                    <div className="min-h-[48px] flex flex-col items-center justify-center w-full mt-2">
                      <span className="font-bold text-sm md:text-base leading-tight">{opt.label}</span>
                      <span
                        className={`text-2xs md:text-xs leading-tight font-medium mt-0.5 ${
                          isSelected ? 'text-blue-100' : 'text-slate-400'
                        }`}
                      >
                        {opt.desc}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Cấu hình nâng cao đóng/mở */}
        <div className="border-t-2 border-slate-100 pt-4">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`w-full py-3.5 px-5 rounded-2xl font-bold text-sm md:text-base border-2 transition-all flex items-center justify-center gap-2 cursor-pointer ${
              showAdvanced
                ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            {showAdvanced ? '🔼 Ẩn cài đặt chi tiết cho Phụ huynh' : '⚙️ Hiện cài đặt chi tiết cho Phụ huynh'}
          </button>
        </div>

        {showAdvanced && (
          <div className="space-y-6">
            {/* Lọc dạng bài Hỗn hợp toàn bộ */}
            {operator === 'hon_hop_toan_bo' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 pt-2"
                id="mixed-all-selector"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-lg">🎲</span>
                  <h3 className="text-slate-800 font-extrabold text-lg md:text-xl uppercase tracking-wider">
                    Chọn các dạng bài muốn bao gồm trong Hỗn Hợp Toàn Bộ:
                  </h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 bg-emerald-50/50 rounded-2xl p-5 border-2 border-emerald-100">
                  {[
                    { value: 'cong' as const, label: 'Phép Cộng' },
                    { value: 'tru' as const, label: 'Phép Trừ' },
                    { value: 'nhan' as const, label: 'Phép Nhân' },
                    { value: 'chia' as const, label: 'Phép Chia' },
                    { value: 'dong_ho' as const, label: 'Xem Đồng Hồ' },
                    { value: 'doi_don_vi' as const, label: 'Đổi Đơn Vị' },
                    { value: 'toan_loi_van' as const, label: 'Toán Lời Văn' },
                    { value: 'so_sanh_so' as const, label: 'So Sánh Số' },
                    { value: 'day_so' as const, label: 'Dãy Số' },
                    { value: 'ngay_thang' as const, label: 'Ngày Tháng 📅' }
                  ].map(dang => {
                    const isChecked = selectedQuizDangs.includes(dang.value);
                    return (
                      <button
                        key={dang.value}
                        type="button"
                        onClick={() => toggleQuizDang(dang.value)}
                        className={`py-3 px-2 rounded-2xl font-bold text-sm border-2 text-center transition-all cursor-pointer transform active:scale-95 ${
                          isChecked
                            ? 'bg-emerald-500 text-white border-emerald-600 shadow-md shadow-emerald-100'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {dang.label}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Phép toán cho Toán lời văn */}
            {showWordProblemSelector && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 pt-2"
                id="word-problem-ops-selector"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-lg">📖</span>
                  <h3 className="text-slate-800 font-extrabold text-lg md:text-xl uppercase tracking-wider">
                    Phép toán cho Toán Lời Văn:
                  </h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-orange-50/50 rounded-2xl p-5 border-2 border-orange-100">
                  {[
                    { value: 'cong' as const, label: 'Cộng' },
                    { value: 'tru' as const, label: 'Trừ' },
                    { value: 'nhan' as const, label: 'Nhân' },
                    { value: 'chia' as const, label: 'Chia' }
                  ].map(op => {
                    const isChecked = selectedWordProblemOps.includes(op.value);
                    return (
                      <button
                        key={op.value}
                        type="button"
                        onClick={() => toggleWordProblemOp(op.value)}
                        className={`py-3 px-2 rounded-2xl font-bold text-sm border-2 text-center transition-all cursor-pointer transform active:scale-95 ${
                          isChecked
                            ? 'bg-orange-500 text-white border-orange-600 shadow-md shadow-orange-100'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {op.label}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {showTablesSelector && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 pt-2"
                id="multiplication-tables-selector"
              >
                <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
                  <label className="block text-slate-700 font-bold text-lg md:text-xl text-center md:text-left">
                    📖 Chọn bảng cửu chương muốn ôn tập:
                  </label>
                  <button
                    type="button"
                    id="btn-select-all-tables"
                    onClick={toggleAllTables}
                    className={`px-4 py-1.5 border-2 rounded-full font-black text-xs md:text-sm transition-all cursor-pointer active:scale-95 ${
                      isAllSelected
                        ? 'bg-red-50 hover:bg-red-100 border-red-200 text-red-700'
                        : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700'
                    }`}
                  >
                    {isAllSelected ? '🟥 Bỏ chọn tất cả' : '🟩 Chọn tất cả'}
                  </button>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2.5">
                  {[2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
                    const isChecked = selectedTables.includes(num);
                    return (
                      <button
                        key={num}
                        type="button"
                        id={`btn-table-chip-${num}`}
                        onClick={() => toggleTable(num)}
                        className={`py-3 px-2 rounded-2xl font-bold text-base md:text-lg border-2 text-center transition-all cursor-pointer transform active:scale-95 ${
                          isChecked
                            ? 'bg-indigo-500 text-white border-indigo-600 shadow-md shadow-indigo-100 scale-[1.05]'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        Bảng {num}
                      </button>
                    );
                  })}
                </div>
                
                <p className="text-slate-400 text-xs text-center font-medium">
                  * Mẹo: Bé có thể chọn một hoặc nhiều bảng cùng lúc để luyện tập kết hợp nhé!
                </p>
              </motion.div>
            )}

            {showAdditionSelector && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 pt-2"
                id="addition-difficulty-selector"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-lg">+</span>
                  <h3 className="text-slate-800 font-extrabold text-lg md:text-xl uppercase tracking-wider">
                    Cấu hình Phép Cộng
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-rose-50/50 rounded-2xl p-5 border-2 border-rose-100">
                  {/* Phạm vi số */}
                  <div className="space-y-3">
                    <span className="block text-slate-700 font-bold text-sm md:text-base">
                      Phạm vi số:
                    </span>
                    <div className="flex flex-col gap-2">
                      <label className="flex items-center gap-2.5 cursor-pointer text-slate-600 font-semibold select-none">
                        <input
                           type="radio"
                           name="congRange"
                           value="20"
                           checked={congRange === '20'}
                           onChange={() => setCongRange('20')}
                           className="w-5 h-5 text-rose-500 border-gray-300 focus:ring-rose-400 cursor-pointer"
                        />
                        <span>Trong phạm vi 20</span>
                      </label>
                      <label className="flex items-center gap-2.5 cursor-pointer text-slate-600 font-semibold select-none">
                        <input
                           type="radio"
                           name="congRange"
                           value="100"
                           checked={congRange === '100'}
                           onChange={() => setCongRange('100')}
                           className="w-5 h-5 text-rose-500 border-gray-300 focus:ring-rose-400 cursor-pointer"
                        />
                        <span>Trong phạm vi 100</span>
                      </label>
                    </div>
                  </div>

                  {/* Kiểu tính */}
                  <div className="space-y-3">
                    <span className="block text-slate-700 font-bold text-sm md:text-base">
                      Kiểu tính:
                    </span>
                    <div className="flex flex-col gap-2">
                      <label className="flex items-center gap-2.5 cursor-pointer text-slate-600 font-semibold select-none">
                        <input
                           type="checkbox"
                           checked={congTypes.includes('khong_nho')}
                           onChange={() => toggleCongType('khong_nho')}
                           className="w-5 h-5 rounded text-rose-500 border-gray-300 focus:ring-rose-400 cursor-pointer"
                        />
                        <span>Không nhớ</span>
                      </label>
                      <label className="flex items-center gap-2.5 cursor-pointer text-slate-600 font-semibold select-none">
                        <input
                           type="checkbox"
                           checked={congTypes.includes('co_nho')}
                           onChange={() => toggleCongType('co_nho')}
                           className="w-5 h-5 rounded text-rose-500 border-gray-300 focus:ring-rose-400 cursor-pointer"
                        />
                        <span>Có nhớ</span>
                      </label>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {showSubtractionSelector && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 pt-2"
                id="subtraction-difficulty-selector"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg">-</span>
                  <h3 className="text-slate-800 font-extrabold text-lg md:text-xl uppercase tracking-wider">
                    Cấu hình Phép Trừ
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-indigo-50/50 rounded-2xl p-5 border-2 border-indigo-100">
                  {/* Phạm vi số */}
                  <div className="space-y-3">
                    <span className="block text-slate-700 font-bold text-sm md:text-base">
                      Phạm vi số:
                    </span>
                    <div className="flex flex-col gap-2">
                      <label className="flex items-center gap-2.5 cursor-pointer text-slate-600 font-semibold select-none">
                        <input
                           type="radio"
                           name="truRange"
                           value="20"
                           checked={truRange === '20'}
                           onChange={() => setTruRange('20')}
                           className="w-5 h-5 text-indigo-500 border-gray-300 focus:ring-indigo-400 cursor-pointer"
                        />
                        <span>Trong phạm vi 20</span>
                      </label>
                      <label className="flex items-center gap-2.5 cursor-pointer text-slate-600 font-semibold select-none">
                        <input
                           type="radio"
                           name="truRange"
                           value="100"
                           checked={truRange === '100'}
                           onChange={() => setTruRange('100')}
                           className="w-5 h-5 text-indigo-500 border-gray-300 focus:ring-indigo-400 cursor-pointer"
                        />
                        <span>Trong phạm vi 100</span>
                      </label>
                    </div>
                  </div>

                  {/* Kiểu tính */}
                  <div className="space-y-3">
                    <span className="block text-slate-700 font-bold text-sm md:text-base">
                      Kiểu tính:
                    </span>
                    <div className="flex flex-col gap-2">
                      <label className="flex items-center gap-2.5 cursor-pointer text-slate-600 font-semibold select-none">
                        <input
                           type="checkbox"
                           checked={truTypes.includes('khong_muon')}
                           onChange={() => toggleTruType('khong_muon')}
                           className="w-5 h-5 rounded text-indigo-500 border-gray-300 focus:ring-indigo-400 cursor-pointer"
                        />
                        <span>Không mượn</span>
                      </label>
                      <label className="flex items-center gap-2.5 cursor-pointer text-slate-600 font-semibold select-none">
                        <input
                           type="checkbox"
                           checked={truTypes.includes('co_muon')}
                           onChange={() => toggleTruType('co_muon')}
                           className="w-5 h-5 rounded text-indigo-500 border-gray-300 focus:ring-indigo-400 cursor-pointer"
                        />
                        <span>Có mượn</span>
                      </label>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* 3. Nút hành động */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <motion.div
            className="flex-1"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <button
              type="button"
              id="btn-start-quiz"
              onClick={handleStart}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black text-lg md:text-xl py-4 px-5 rounded-3xl shadow-xl shadow-orange-100 border-b-6 border-orange-700 transition-all cursor-pointer flex items-center justify-center gap-2.5"
            >
              <Play className="w-5.5 h-5.5 fill-white" />
              BẮT ĐẦU LUYỆN TẬP
            </button>
          </motion.div>

          <motion.div
            className="flex-1"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <button
              type="button"
              id="btn-print-a4-sheet"
              onClick={handlePrintSheet}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg md:text-xl py-4 px-5 rounded-3xl shadow-xl shadow-indigo-100 border-b-6 border-indigo-800 transition-all cursor-pointer flex items-center justify-center gap-2.5"
            >
              <Printer className="w-5.5 h-5.5" />
              IN PHIẾU BÀI TẬP A4
            </button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
