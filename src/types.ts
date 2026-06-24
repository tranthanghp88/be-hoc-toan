export type MathOperator = 
  | 'cong' 
  | 'tru' 
  | 'nhan' 
  | 'chia' 
  | 'hon_hop'
  | 'xem_dong_ho'
  | 'doi_don_vi'
  | 'toan_loi_van'
  | 'so_sanh_so'
  | 'day_so'
  | 'ngay_thang'
  | 'hon_hop_toan_bo';

export interface Question {
  id: number;
  num1: number;
  num2: number;
  operator: 'Cộng' | 'Trừ' | 'Nhân' | 'Chia' | 'Đồng hồ' | 'Đổi đơn vị' | 'Lời văn' | 'So sánh' | 'Dãy số' | 'Ngày tháng';
  operatorSymbol: '+' | '-' | '×' | '÷' | '' | '□';
  correctAnswer: number | string;
  text: string;
  isMissingNumber?: boolean;
  missingPosition?: 'left' | 'right' | 'answer';
  
  // Các trường mở rộng cho dạng bài mới
  hour?: number;
  unitType?: 'do_dai' | 'khoi_luong' | 'thoi_gian';
  fromUnit?: string;
  toUnit?: string;
  wordProblemText?: string;
  compLeft?: number;
  compRight?: number;
  sequence?: number[];
  missingIndex?: number;
}

export interface QuizConfig {
  totalQuestions: number; // 10, 20, 50
  operator: MathOperator;
  selectedTables?: number[]; // [2, 3, 4, 5, 6, 7, 8, 9]
  // Advanced configuration for addition
  congRange?: '20' | '100';
  congTypes?: ('khong_nho' | 'co_nho')[];
  // Advanced configuration for subtraction
  truRange?: '20' | '100';
  truTypes?: ('khong_muon' | 'co_muon')[];
  
  // Cấu hình nâng cao mới
  selectedUnits?: ('do_dai' | 'khoi_luong' | 'thoi_gian')[];
  selectedQuizDangs?: ('cong' | 'tru' | 'nhan' | 'chia' | 'dong_ho' | 'doi_don_vi' | 'toan_loi_van' | 'so_sanh_so' | 'day_so' | 'ngay_thang')[];
  selectedPdfDangs?: ('phep_tinh' | 'dong_ho' | 'doi_don_vi' | 'toan_loi_van' | 'so_sanh_so' | 'day_so' | 'ngay_thang')[];
  selectedWordProblemOps?: ('cong' | 'tru' | 'nhan' | 'chia')[];
}

export interface QuizHistory {
  question: Question;
  userAnswers: (number | string)[];
  isCorrect: boolean;
  shownAnswer: boolean;
}

export interface AppState {
  stage: 'welcome' | 'playing' | 'result' | 'a4_sheet';
  config: QuizConfig;
  questions: Question[];
  currentIndex: number;
  correctCount: number;
  history: QuizHistory[];
}
