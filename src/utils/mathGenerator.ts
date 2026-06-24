import { MathOperator, Question, QuizConfig } from '../types';

function isNoCarryAddition(num1: number, num2: number): boolean {
  const digits1 = String(num1).split('').reverse().map(Number);
  const digits2 = String(num2).split('').reverse().map(Number);
  const maxLength = Math.max(digits1.length, digits2.length);
  for (let i = 0; i < maxLength; i++) {
    if ((digits1[i] || 0) + (digits2[i] || 0) > 9) {
      return false;
    }
  }
  return true;
}

function isNoBorrowSubtraction(num1: number, num2: number): boolean {
  const digits1 = String(num1).split('').reverse().map(Number);
  const digits2 = String(num2).split('').reverse().map(Number);
  const maxLength = Math.max(digits1.length, digits2.length);
  for (let i = 0; i < maxLength; i++) {
    if ((digits1[i] || 0) < (digits2[i] || 0)) {
      return false;
    }
  }
  return true;
}

export function generateQuestion(
  id: number,
  type: MathOperator,
  selectedTables?: number[],
  config?: QuizConfig
): Question {
  // Chọn ngẫu nhiên dạng toán nếu là dạng Hỗn hợp
  let actualType = type;
  if (type === 'hon_hop') {
    const types: MathOperator[] = ['cong', 'tru', 'nhan', 'chia'];
    actualType = types[Math.floor(Math.random() * types.length)];
  }

  // Khởi tạo danh sách các bảng cửu chương được chọn (mặc định là từ 2 đến 9)
  const tables = (selectedTables && selectedTables.length > 0) 
    ? selectedTables 
    : [2, 3, 4, 5, 6, 7, 8, 9];

  let num1 = 0;
  let num2 = 0;
  let operator: 'Cộng' | 'Trừ' | 'Nhân' | 'Chia' = 'Cộng';
  let operatorSymbol: '+' | '-' | '×' | '÷' = '+';
  let originalResult = 0; // Kết quả gốc của phép tính

  switch (actualType) {
    case 'cong': {
      operator = 'Cộng';
      operatorSymbol = '+';
      const range = config?.congRange || '100';
      const maxSum = range === '20' ? 20 : 100;
      const allowedTypes = (config?.congTypes && config.congTypes.length > 0)
        ? config.congTypes
        : ['khong_nho', 'co_nho'];

      let found = false;
      let attempts = 0;
      while (!found && attempts < 500) {
        // Sinh số từ 1 đến maxSum-1
        const n1 = Math.floor(Math.random() * (maxSum - 2)) + 2;
        const n2 = Math.floor(Math.random() * (maxSum - n1)) + 1;
        
        const noCarry = isNoCarryAddition(n1, n2);
        const fitsKhongNho = allowedTypes.includes('khong_nho') && noCarry;
        const fitsCoNho = allowedTypes.includes('co_nho') && !noCarry;
        
        if (fitsKhongNho || fitsCoNho) {
          num1 = n1;
          num2 = n2;
          found = true;
        }
        attempts++;
      }

      // Fallback nếu không tìm thấy sau 500 lần (đảm bảo không bị lặp vô hạn)
      if (!found) {
        num1 = Math.floor(Math.random() * (maxSum - 2)) + 2;
        num2 = Math.floor(Math.random() * (maxSum - num1)) + 1;
      }
      originalResult = num1 + num2;
      break;
    }
    case 'tru': {
      operator = 'Trừ';
      operatorSymbol = '-';
      const range = config?.truRange || '100';
      const maxVal = range === '20' ? 20 : 100;
      const allowedTypes = (config?.truTypes && config.truTypes.length > 0)
        ? config.truTypes
        : ['khong_muon', 'co_muon'];

      let found = false;
      let attempts = 0;
      while (!found && attempts < 500) {
        // Sinh n1 từ 2 đến maxVal, n2 từ 1 đến n1 - 1
        const n1 = Math.floor(Math.random() * (maxVal - 1)) + 2;
        const n2 = Math.floor(Math.random() * (n1 - 1)) + 1;
        
        const noBorrow = isNoBorrowSubtraction(n1, n2);
        const fitsKhongMuon = allowedTypes.includes('khong_muon') && noBorrow;
        const fitsCoMuon = allowedTypes.includes('co_muon') && !noBorrow;
        
        if (fitsKhongMuon || fitsCoMuon) {
          num1 = n1;
          num2 = n2;
          found = true;
        }
        attempts++;
      }

      if (!found) {
        num1 = Math.floor(Math.random() * (maxVal - 1)) + 2;
        num2 = Math.floor(Math.random() * (num1 - 1)) + 1;
      }
      originalResult = num1 - num2;
      break;
    }
    case 'nhan': {
      operator = 'Nhân';
      operatorSymbol = '×';
      // Nhân theo bảng cửu chương được chọn
      const selectedTable = tables[Math.floor(Math.random() * tables.length)];
      num1 = selectedTable;
      num2 = Math.floor(Math.random() * 9) + 1; // n từ 1 đến 9
      originalResult = num1 * num2;
      break;
    }
    case 'chia': {
      operator = 'Chia';
      operatorSymbol = '÷';
      // Chia hết theo bảng cửu chương được chọn (không tạo phép chia lẻ)
      const divisor = tables[Math.floor(Math.random() * tables.length)];
      const quotient = Math.floor(Math.random() * 9) + 1; // 1 đến 9
      const dividend = divisor * quotient;
      
      num1 = dividend; // Số bị chia
      num2 = divisor;  // Số chia
      originalResult = quotient;
      break;
    }
  }

  // Quyết định xem có phải dạng điền số còn thiếu hay không (50% cơ hội)
  const rand = Math.random();
  let missingPosition: 'left' | 'right' | 'answer' = 'answer';
  let isMissingNumber = false;

  if (rand < 0.25) {
    missingPosition = 'left';
    isMissingNumber = true;
  } else if (rand < 0.50) {
    missingPosition = 'right';
    isMissingNumber = true;
  }

  // Gán đáp án đúng dựa trên vị trí ô trống cần điền
  let correctAnswer = originalResult;
  if (missingPosition === 'left') {
    correctAnswer = num1;
  } else if (missingPosition === 'right') {
    correctAnswer = num2;
  }

  // Tạo text hiển thị cho phụ huynh và nhật ký bài làm đầy đủ
  const fullEquationText = `${num1} ${operatorSymbol} ${num2} = ${originalResult}`;

  return {
    id,
    num1,
    num2,
    operator,
    operatorSymbol,
    correctAnswer,
    isMissingNumber,
    missingPosition,
    text: fullEquationText
  };
}

export function generateQuestions(
  count: number,
  type: MathOperator,
  selectedTables?: number[],
  config?: QuizConfig
): Question[] {
  const questions: Question[] = [];
  const seenEquations = new Set<string>();

  for (let i = 0; i < count; i++) {
    let q: Question | null = null;
    let attempts = 0;
    
    while (attempts < 500) {
      const candidate = generateQuestion(i + 1, type, selectedTables, config);
      // Khóa định danh độc nhất cho phép tính (num1 operator num2) để bảo đảm tuyệt đối không trùng lặp
      const eqKey = `${candidate.num1}_${candidate.operatorSymbol}_${candidate.num2}`;
      
      if (!seenEquations.has(eqKey)) {
        seenEquations.add(eqKey);
        q = candidate;
        break;
      }
      attempts++;
    }
    
    if (!q) {
      q = generateQuestion(i + 1, type, selectedTables, config);
    }
    
    questions.push(q);
  }
  return questions;
}
