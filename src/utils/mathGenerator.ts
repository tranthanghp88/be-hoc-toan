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
  // Chọn ngẫu nhiên dạng toán nếu là dạng Hỗn hợp phép tính thông thường
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
  let operator: 'Cộng' | 'Trừ' | 'Nhân' | 'Chia' | 'Đồng hồ' | 'Đổi đơn vị' | 'Lời văn' | 'So sánh' | 'Dãy số' | 'Ngày tháng' = 'Cộng';
  let operatorSymbol: '+' | '-' | '×' | '÷' | '' | '□' = '+';
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
      const selectedTable = tables[Math.floor(Math.random() * tables.length)];
      num1 = selectedTable;
      num2 = Math.floor(Math.random() * 9) + 1;
      originalResult = num1 * num2;
      break;
    }
    case 'chia': {
      operator = 'Chia';
      operatorSymbol = '÷';
      const divisor = tables[Math.floor(Math.random() * tables.length)];
      const quotient = Math.floor(Math.random() * 9) + 1;
      const dividend = divisor * quotient;
      
      num1 = dividend;
      num2 = divisor;
      originalResult = quotient;
      break;
    }
    case 'xem_dong_ho': {
      const hour = Math.floor(Math.random() * 12) + 1;
      return {
        id,
        num1: hour,
        num2: 0,
        operator: 'Đồng hồ',
        operatorSymbol: '',
        correctAnswer: hour,
        text: `Đồng hồ chỉ mấy giờ?`,
        hour
      };
    }
    case 'doi_don_vi': {
      const unitGroups: ('do_dai' | 'khoi_luong' | 'thoi_gian')[] = 
        config?.selectedUnits && config.selectedUnits.length > 0 
          ? config.selectedUnits 
          : ['do_dai', 'khoi_luong', 'thoi_gian'];
      const selectedGroup = unitGroups[Math.floor(Math.random() * unitGroups.length)];
      
      const X = Math.floor(Math.random() * 9) + 1; // 1 đến 9
      let template;
      
      if (selectedGroup === 'do_dai') {
        const templates = [
          { fromVal: X, fromUnit: 'm', toVal: X * 100, toUnit: 'cm' },
          { fromVal: X * 100, fromUnit: 'cm', toVal: X, toUnit: 'm' },
          { fromVal: X, fromUnit: 'dm', toVal: X * 10, toUnit: 'cm' },
          { fromVal: X * 10, fromUnit: 'cm', toVal: X, toUnit: 'dm' }
        ];
        template = templates[Math.floor(Math.random() * templates.length)];
      } else if (selectedGroup === 'khoi_luong') {
        const templates = [
          { fromVal: X, fromUnit: 'kg', toVal: X * 1000, toUnit: 'g' },
          { fromVal: X * 1000, fromUnit: 'g', toVal: X, toUnit: 'kg' }
        ];
        template = templates[Math.floor(Math.random() * templates.length)];
      } else {
        // thoi_gian
        const times = [1, 2, 3, 5, 10];
        const selectedTime = times[Math.floor(Math.random() * times.length)];
        const templates = [
          { fromVal: selectedTime, fromUnit: 'giờ', toVal: selectedTime * 60, toUnit: 'phút' },
          { fromVal: selectedTime * 60, fromUnit: 'phút', toVal: selectedTime, toUnit: 'giờ' }
        ];
        template = templates[Math.floor(Math.random() * templates.length)];
      }
      
      return {
        id,
        num1: template.fromVal,
        num2: template.toVal,
        operator: 'Đổi đơn vị',
        operatorSymbol: '',
        correctAnswer: template.toVal,
        text: `${template.fromVal} ${template.fromUnit} = [   ] ${template.toUnit}`,
        unitType: selectedGroup,
        fromUnit: template.fromUnit,
        toUnit: template.toUnit
      };
    }
    case 'toan_loi_van': {
      const allowedOps = config?.selectedWordProblemOps && config.selectedWordProblemOps.length > 0
        ? config.selectedWordProblemOps
        : ['cong', 'tru', 'nhan', 'chia'];
      const chosenOp = allowedOps[Math.floor(Math.random() * allowedOps.length)];

      const contexts = ['tao', 'cam', 'bi', 'but', 'vo', 'ga', 'vit', 'hoa'];
      const context = contexts[Math.floor(Math.random() * contexts.length)];
      const names = ['Lan', 'Hoa', 'Nam', 'Minh', 'An'];
      const name = names[Math.floor(Math.random() * names.length)];
      
      let X = 0;
      let Y = 0;
      let problemText = '';
      let correctAnswer = 0;
      
      if (chosenOp === 'cong') {
        X = Math.floor(Math.random() * 19) + 2; // 2 đến 20
        Y = Math.floor(Math.random() * 19) + 2; // 2 đến 20
        correctAnswer = X + Y;
        
        switch (context) {
          case 'tao': problemText = `${name} có ${X} quả táo. Mẹ cho thêm ${Y} quả. Hỏi ${name} có tất cả bao nhiêu quả táo?`; break;
          case 'cam': problemText = `${name} có ${X} quả cam. Bố mua thêm ${Y} quả. Hỏi ${name} có tất cả bao nhiêu quả cam?`; break;
          case 'bi': problemText = `${name} có ${X} viên bi. Bạn cho thêm ${Y} viên. Hỏi ${name} có tất cả bao nhiêu viên bi?`; break;
          case 'but': problemText = `${name} có ${X} bút chì. Chị tặng thêm ${Y} bút. Hỏi ${name} có tất cả bao nhiêu bút chì?`; break;
          case 'vo': problemText = `${name} có ${X} quyển vở. Mẹ mua thêm ${Y} quyển. Hỏi ${name} có tất cả bao nhiêu quyển vở?`; break;
          case 'ga': problemText = `Nhà bà có ${X} con gà. Nhà ông mua thêm ${Y} con. Hỏi cả nhà có tất cả bao nhiêu con gà?`; break;
          case 'vit': problemText = `Có ${X} con vịt ở dưới ao. Có thêm ${Y} con vịt bơi xuống. Hỏi có tất cả bao nhiêu con vịt dưới ao?`; break;
          case 'hoa':
          default:
            problemText = `Trong vườn có ${X} bông hoa. Bé trồng thêm ${Y} bông. Hỏi trong vườn có tất cả bao nhiêu bông hoa?`; break;
        }
      } else if (chosenOp === 'tru') {
        X = Math.floor(Math.random() * 25) + 6; // 6 đến 30
        Y = Math.floor(Math.random() * (X - 2)) + 1; // 1 đến X-1
        correctAnswer = X - Y;
        
        switch (context) {
          case 'tao': problemText = `${name} có ${X} quả táo. ${name} ăn mất ${Y} quả. Hỏi ${name} còn lại bao nhiêu quả táo?`; break;
          case 'cam': problemText = `${name} có ${X} quả cam. ${name} cho bạn ${Y} quả. Hỏi ${name} còn lại bao nhiêu quả cam?`; break;
          case 'bi': problemText = `${name} có ${X} viên bi. ${name} làm mất ${Y} viên. Hỏi ${name} còn lại bao nhiêu viên bi?`; break;
          case 'but': problemText = `${name} có ${X} bút chì. ${name} tặng bạn ${Y} bút. Hỏi ${name} còn lại bao nhiêu bút chì?`; break;
          case 'vo': problemText = `${name} có ${X} quyển vở. ${name} đã dùng hết ${Y} quyển. Hỏi ${name} còn lại bao nhiêu quyển vở?`; break;
          case 'ga': problemText = `Nhà bà có ${X} con gà. Bà bán đi ${Y} con. Hỏi nhà bà còn lại bao nhiêu con gà?`; break;
          case 'vit': problemText = `Có ${X} con vịt ở trên bờ. Có ${Y} con bơi xuống ao. Hỏi trên bờ còn lại bao nhiêu con vịt?`; break;
          case 'hoa':
          default:
            problemText = `Bé hái ${X} bông hoa trong vườn. Bé tặng mẹ ${Y} bông. Hỏi bé còn lại bao nhiêu bông hoa?`; break;
        }
      } else if (chosenOp === 'nhan') {
        X = Math.floor(Math.random() * 8) + 2; // 2 đến 9
        Y = Math.floor(Math.random() * 8) + 2; // 2 đến 9
        correctAnswer = X * Y;
        
        switch (context) {
          case 'tao': problemText = `Mỗi đĩa có ${X} quả táo. ${name} xếp đều vào ${Y} đĩa. Hỏi ${name} có tất cả bao nhiêu quả táo?`; break;
          case 'cam': problemText = `Mỗi hộp có ${X} quả cam. Bố mua ${Y} hộp. Hỏi bố mua tất cả bao nhiêu quả cam?`; break;
          case 'bi': problemText = `Mỗi túi có ${X} viên bi. ${name} có ${Y} túi. Hỏi ${name} có tất cả bao nhiêu viên bi?`; break;
          case 'but': problemText = `Mỗi hộp có ${X} chiếc bút. ${name} có ${Y} hộp. Hỏi ${name} có tất cả bao nhiêu chiếc bút?`; break;
          case 'vo': problemText = `Mỗi tập có ${X} quyển vở. Mẹ mua ${Y} tập. Hỏi mẹ mua tất cả bao nhiêu quyển vở?`; break;
          case 'ga': problemText = `Mỗi chuồng có ${X} con gà. Nhà bà có ${Y} chuồng. Hỏi nhà bà có tất cả bao nhiêu con gà?`; break;
          case 'vit': problemText = `Mỗi đàn có ${X} con vịt. Có ${Y} đàn vịt. Hỏi có tất cả bao nhiêu con vịt?`; break;
          case 'hoa':
          default:
            problemText = `Mỗi lọ có ${X} bông hoa. Bé cắm đều vào ${Y} lọ. Hỏi bé cắm tất cả bao nhiêu bông hoa?`; break;
        }
      } else {
        // chia
        const ans = Math.floor(Math.random() * 8) + 2; // 2 đến 9
        Y = Math.floor(Math.random() * 8) + 2; // 2 đến 9 (số chia)
        X = ans * Y; // số bị chia
        correctAnswer = ans;
        
        switch (context) {
          case 'tao': problemText = `Có ${X} quả táo, xếp đều vào ${Y} chiếc đĩa. Hỏi mỗi đĩa có bao nhiêu quả táo?`; break;
          case 'cam': problemText = `Có ${X} quả cam, chia đều cho ${Y} bạn. Hỏi mỗi bạn được bao nhiêu quả cam?`; break;
          case 'bi': problemText = `Có ${X} viên bi, đựng đều trong ${Y} chiếc túi. Hỏi mỗi túi có bao nhiêu viên bi?`; break;
          case 'but': problemText = `Có ${X} chiếc bút, chia đều cho ${Y} bạn. Hỏi mỗi bạn được bao nhiêu chiếc bút?`; break;
          case 'vo': problemText = `Có ${X} quyển vở, xếp đều vào ${Y} ngăn sách. Hỏi mỗi ngăn có bao nhiêu quyển vở?`; break;
          case 'ga': problemText = `Có ${X} con gà, chia đều vào ${Y} chiếc chuồng. Hỏi mỗi chuồng có bao nhiêu con gà?`; break;
          case 'vit': problemText = `Có ${X} con vịt, chia đều vào ${Y} chiếc ao. Hỏi mỗi chiếc ao có bao nhiêu con vịt?`; break;
          case 'hoa':
          default:
            problemText = `Có ${X} bông hoa, cắm đều vào ${Y} chiếc lọ. Hỏi mỗi lọ có bao nhiêu bông hoa?`; break;
        }
      }
      
      return {
        id,
        num1: X,
        num2: Y,
        operator: 'Lời văn',
        operatorSymbol: '',
        correctAnswer,
        text: problemText,
        wordProblemText: problemText
      };
    }
    case 'so_sanh_so': {
      const compLeft = Math.floor(Math.random() * 99) + 1; // 1 đến 99
      let compRight = 0;
      let correctAnswer: '>' | '<' | '=' = '=';
      
      const randType = Math.random();
      if (randType < 0.20 || compLeft === 1) {
        compRight = compLeft;
        correctAnswer = '=';
      } else if (randType < 0.60) {
        // left > right
        compRight = Math.floor(Math.random() * (compLeft - 1)) + 1;
        correctAnswer = '>';
      } else {
        // left < right
        compRight = Math.floor(Math.random() * (99 - compLeft)) + compLeft + 1;
        correctAnswer = '<';
      }
      
      return {
        id,
        num1: compLeft,
        num2: compRight,
        operator: 'So sánh',
        operatorSymbol: '□',
        correctAnswer,
        text: `${compLeft} □ ${compRight}`,
        compLeft,
        compRight
      };
    }
    case 'day_so': {
      const steps = [1, 2, 3, 5, 10, -1, -2, -3, -5, -10];
      const d = steps[Math.floor(Math.random() * steps.length)];
      let start = 0;
      
      if (d > 0) {
        start = Math.floor(Math.random() * 50) + 1;
      } else {
        start = Math.floor(Math.random() * (99 - Math.abs(d) * 5)) + Math.abs(d) * 5 + 1;
      }
      
      const sequence = [start, start + d, start + 2 * d, start + 3 * d, start + 4 * d];
      const missingIndex = Math.floor(Math.random() * 3) + 2; // index 2, 3, hoặc 4
      const correctAnswer = sequence[missingIndex];
      
      const text = sequence.map((x, i) => i === missingIndex ? '__' : String(x)).join(' ');
      
      return {
        id,
        num1: start,
        num2: d,
        operator: 'Dãy số',
        operatorSymbol: '',
        correctAnswer,
        text,
        sequence,
        missingIndex
      };
    }
    case 'ngay_thang': {
      const daysOfWeek = ['thứ Hai', 'thứ Ba', 'thứ Tư', 'thứ Năm', 'thứ Sáu', 'thứ Bảy', 'Chủ nhật'];
      const randType = Math.floor(Math.random() * 6); // 6 dạng câu hỏi Ngày tháng
      
      let text = '';
      let correctAnswer: string | number = '';
      
      if (randType === 0) {
        text = 'Một tuần có bao nhiêu ngày?';
        correctAnswer = 7;
      } else if (randType === 1) {
        text = 'Một năm có bao nhiêu tháng?';
        correctAnswer = 12;
      } else if (randType === 2) {
        // Tránh tháng 2 (đưa vào dạng 4 riêng biệt)
        const months = [1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
        const m = months[Math.floor(Math.random() * months.length)];
        const months31 = [1, 3, 5, 7, 8, 10, 12];
        const days = months31.includes(m) ? 31 : 30;
        
        text = `Tháng ${m} có bao nhiêu ngày?`;
        correctAnswer = days;
      } else if (randType === 3) {
        text = 'Tháng 2 có bao nhiêu ngày?';
        correctAnswer = '28 hoặc 29';
      } else if (randType === 4) {
        // Hôm nay là thứ X. Y ngày nữa là thứ mấy?
        const startIdx = Math.floor(Math.random() * 7);
        const y = Math.floor(Math.random() * 4) + 1; // 1 đến 4 ngày nữa
        const targetIdx = (startIdx + y) % 7;
        
        text = `Hôm nay là ${daysOfWeek[startIdx]}. ${y} ngày nữa là thứ mấy?`;
        correctAnswer = daysOfWeek[targetIdx];
      } else {
        // Hôm nay là thứ X. Y ngày trước là thứ mấy?
        const startIdx = Math.floor(Math.random() * 7);
        const y = Math.floor(Math.random() * 4) + 1; // 1 đến 4 ngày trước
        const targetIdx = (startIdx - y + 7) % 7;
        
        text = `Hôm nay là ${daysOfWeek[startIdx]}. ${y} ngày trước là thứ mấy?`;
        correctAnswer = daysOfWeek[targetIdx];
      }
      
      return {
        id,
        num1: randType,
        num2: 0,
        operator: 'Ngày tháng',
        operatorSymbol: '',
        correctAnswer,
        text
      };
    }
    default:
      break;
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

  // Xác định danh sách các dạng toán cần phân bổ
  let activeDangs: string[] = [];
  if (type === 'hon_hop_toan_bo') {
    if (config?.selectedQuizDangs && config.selectedQuizDangs.length > 0) {
      activeDangs = config.selectedQuizDangs;
    } else {
      activeDangs = ['cong', 'tru', 'nhan', 'chia', 'dong_ho', 'doi_don_vi', 'toan_loi_van', 'so_sanh_so', 'day_so', 'ngay_thang'];
    }
  } else if (config?.selectedPdfDangs && config.selectedPdfDangs.length > 0) {
    activeDangs = config.selectedPdfDangs;
  }

  for (let i = 0; i < count; i++) {
    let qType: MathOperator = type;
    
    // Phân bổ theo lượt (round-robin)
    if (activeDangs.length > 0) {
      const currentDang = activeDangs[i % activeDangs.length];
      if (currentDang === 'phep_tinh') {
        const basicTypes: MathOperator[] = ['cong', 'tru', 'nhan', 'chia'];
        qType = basicTypes[Math.floor(Math.random() * basicTypes.length)];
      } else if (currentDang === 'cong') {
        qType = 'cong';
      } else if (currentDang === 'tru') {
        qType = 'tru';
      } else if (currentDang === 'nhan') {
        qType = 'nhan';
      } else if (currentDang === 'chia') {
        qType = 'chia';
      } else if (currentDang === 'dong_ho') {
        qType = 'xem_dong_ho';
      } else if (currentDang === 'doi_don_vi') {
        qType = 'doi_don_vi';
      } else if (currentDang === 'toan_loi_van') {
        qType = 'toan_loi_van';
      } else if (currentDang === 'so_sanh_so') {
        qType = 'so_sanh_so';
      } else if (currentDang === 'day_so') {
        qType = 'day_so';
      } else if (currentDang === 'ngay_thang') {
        qType = 'ngay_thang';
      }
    }

    let q: Question | null = null;
    let attempts = 0;
    
    while (attempts < 500) {
      const candidate = generateQuestion(i + 1, qType, selectedTables, config);
      let eqKey = '';
      if (candidate.operator === 'Cộng' || candidate.operator === 'Trừ' || candidate.operator === 'Nhân' || candidate.operator === 'Chia') {
        eqKey = `${candidate.num1}_${candidate.operatorSymbol}_${candidate.num2}`;
      } else {
        eqKey = candidate.text;
      }
      
      if (!seenEquations.has(eqKey)) {
        seenEquations.add(eqKey);
        q = candidate;
        break;
      }
      attempts++;
    }
    
    if (!q) {
      q = generateQuestion(i + 1, qType, selectedTables, config);
    }
    
    questions.push(q);
  }
  return questions;
}
