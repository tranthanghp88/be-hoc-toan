export type MathOperator = 'cong' | 'tru' | 'nhan' | 'chia' | 'hon_hop';

export interface Question {
  id: number;
  num1: number;
  num2: number;
  operator: 'Cộng' | 'Trừ' | 'Nhân' | 'Chia';
  operatorSymbol: '+' | '-' | '×' | '÷';
  correctAnswer: number;
  text: string;
  isMissingNumber?: boolean;
  missingPosition?: 'left' | 'right' | 'answer';
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
}

export interface QuizHistory {
  question: Question;
  userAnswers: number[];
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
