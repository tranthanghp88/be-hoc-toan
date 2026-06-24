import { useState, useEffect } from 'react';
import { QuizConfig as QuizConfigType, Question } from '../types';
import { RefreshCw, ArrowLeft, Printer, CheckSquare, Square, FileText, Download } from 'lucide-react';
import { generateQuestions } from '../utils/mathGenerator';

interface A4WorksheetProps {
  config: QuizConfigType;
  questions: Question[];
  onBack: () => void;
  onRefresh: () => void;
}

// Memory cache for Vietnamese Unicode fonts (Roboto) to prevent multiple fetches
let cachedRegularFont: string | null = null;
let cachedBoldFont: string | null = null;

// Convert a fetched TTF blob to base64
const fetchFontAsBase64 = async (url: string): Promise<string> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch font from ${url}`);
  const blob = await res.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Strips Vietnamese accents as a safe offline fallback
const removeVietnameseTones = (str: string): string => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/â/g, 'a')
    .replace(/Â/g, 'A')
    .replace(/ă/g, 'a')
    .replace(/Ă/g, 'A')
    .replace(/ê/g, 'e')
    .replace(/Ê/g, 'E')
    .replace(/ô/g, 'o')
    .replace(/Ô/g, 'O')
    .replace(/ơ/g, 'o')
    .replace(/Ơ/g, 'O')
    .replace(/ư/g, 'u')
    .replace(/Ư/g, 'U');
};

const sanitizeText = (str: string, useUnicode: boolean): string => {
  if (useUnicode) return str;
  return removeVietnameseTones(str);
};

// Helper component for clock preview in HTML
function PreviewClock({ hour }: { hour: number }) {
  const angle = hour * 30;
  const ticks = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <svg width="54" height="54" viewBox="0 0 100 100" className="select-none inline-block border-2 border-slate-700 rounded-full bg-white print:border-black">
      <circle cx="50" cy="50" r="45" stroke="#475569" strokeWidth="3" fill="#ffffff" />
      <circle cx="50" cy="50" r="4" fill="#1e293b" />
      
      {ticks.map(t => {
        const rad = (t * 30 * Math.PI) / 180;
        const xTickStart = 50 + 36 * Math.sin(rad);
        const yTickStart = 50 - 36 * Math.cos(rad);
        const xTickEnd = 50 + 42 * Math.sin(rad);
        const yTickEnd = 50 - 42 * Math.cos(rad);
        
        return (
          <line key={t} x1={xTickStart} y1={yTickStart} x2={xTickEnd} y2={yTickEnd} stroke="#64748b" strokeWidth="2.5" />
        );
      })}
      
      {/* Numbers 12, 3, 6, 9 */}
      <text x="50" y="24" fontSize="12" fontWeight="900" textAnchor="middle" fill="#334155">12</text>
      <text x="50" y="86" fontSize="12" fontWeight="900" textAnchor="middle" fill="#334155">6</text>
      <text x="80" y="54" fontSize="12" fontWeight="900" textAnchor="middle" fill="#334155">3</text>
      <text x="20" y="54" fontSize="12" fontWeight="900" textAnchor="middle" fill="#334155">9</text>
      
      {/* Kim Giờ */}
      <line
        x1="50"
        y1="50"
        x2={50 + 20 * Math.sin((angle * Math.PI) / 180)}
        y2={50 - 20 * Math.cos((angle * Math.PI) / 180)}
        stroke="#1e293b"
        strokeWidth="6"
        strokeLinecap="round"
      />
      
      {/* Kim Phút */}
      <line
        x1="50"
        y1="50"
        x2="50"
        y2="15"
        stroke="#ef4444"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Vector clock drawing helper for jsPDF
const drawPdfClock = (doc: any, cx: number, cy: number, r: number, hour: number) => {
  // Outer circle
  doc.setLineWidth(0.3);
  doc.setDrawColor(70, 80, 95);
  doc.circle(cx, cy, r);
  
  // Center dot
  doc.setFillColor(30, 41, 59);
  doc.circle(cx, cy, 0.5, 'F');
  
  // Numbers 12, 3, 6, 9
  doc.setFontSize(6.5);
  doc.text('12', cx, cy - r + 2.0, { align: 'center' });
  doc.text('6', cx, cy + r - 0.5, { align: 'center' });
  doc.text('3', cx + r - 1.8, cy + 0.8, { align: 'center' });
  doc.text('9', cx - r + 1.2, cy + 0.8, { align: 'center' });
  
  // Hour hand
  const angle = hour * 30;
  const radH = (angle * Math.PI) / 180;
  const hLength = r * 0.5;
  const hx = cx + hLength * Math.sin(radH);
  const hy = cy - hLength * Math.cos(radH);
  doc.setLineWidth(0.7);
  doc.setDrawColor(30, 41, 59);
  doc.line(cx, cy, hx, hy);
  
  // Minute hand
  const mLength = r * 0.75;
  const mx = cx;
  const my = cy - mLength;
  doc.setLineWidth(0.35);
  doc.setDrawColor(220, 38, 38);
  doc.line(cx, cy, mx, my);
  doc.setDrawColor(0, 0, 0); // Reset
};

export default function A4Worksheet({ config, questions: initialQuestions, onBack, onRefresh }: A4WorksheetProps) {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [showAnswers, setShowAnswers] = useState<boolean>(false);
  const [studentName, setStudentName] = useState<string>('');
  const [studentClass, setStudentClass] = useState<string>('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [isGeneratingAnsPdf, setIsGeneratingAnsPdf] = useState<boolean>(false);

  // Mảng lưu trữ các dạng bài được chọn để in/PDF
  const [selectedPdfDangs, setSelectedPdfDangs] = useState<('phep_tinh' | 'dong_ho' | 'doi_don_vi' | 'toan_loi_van' | 'so_sanh_so' | 'day_so' | 'ngay_thang')[]>(() => {
    if (config.selectedPdfDangs && config.selectedPdfDangs.length > 0) {
      return config.selectedPdfDangs;
    }
    if (config.operator === 'hon_hop') {
      return ['phep_tinh', 'dong_ho', 'doi_don_vi', 'toan_loi_van', 'so_sanh_so', 'day_so', 'ngay_thang'];
    }
    if (config.operator === 'hon_hop_toan_bo') {
      return ['phep_tinh', 'dong_ho', 'doi_don_vi', 'toan_loi_van', 'so_sanh_so', 'day_so', 'ngay_thang'];
    }
    const mapOperatorToDang: Record<string, 'phep_tinh' | 'dong_ho' | 'doi_don_vi' | 'toan_loi_van' | 'so_sanh_so' | 'day_so' | 'ngay_thang'> = {
      xem_dong_ho: 'dong_ho',
      doi_don_vi: 'doi_don_vi',
      toan_loi_van: 'toan_loi_van',
      so_sanh_so: 'so_sanh_so',
      day_so: 'day_so',
      ngay_thang: 'ngay_thang',
    };
    return [mapOperatorToDang[config.operator] || 'phep_tinh'];
  });

  useEffect(() => {
    setQuestions(initialQuestions);
  }, [initialQuestions]);

  const handleRegenerate = () => {
    const updatedConfig = { ...config, selectedPdfDangs };
    const generated = generateQuestions(config.totalQuestions, config.operator, config.selectedTables, updatedConfig);
    setQuestions(generated);
  };

  const handleToggleDang = (dang: 'phep_tinh' | 'dong_ho' | 'doi_don_vi' | 'toan_loi_van' | 'so_sanh_so' | 'day_so' | 'ngay_thang') => {
    const nextDangs = selectedPdfDangs.includes(dang)
      ? selectedPdfDangs.filter(x => x !== dang)
      : [...selectedPdfDangs, dang];
    
    const finalDangs = nextDangs.length === 0 ? [dang] : nextDangs;
    setSelectedPdfDangs(finalDangs);
    
    const updatedConfig = { ...config, selectedPdfDangs: finalDangs };
    const generated = generateQuestions(config.totalQuestions, config.operator, config.selectedTables, updatedConfig);
    setQuestions(generated);
  };

  const handlePrint = () => {
    window.print();
  };

  // Get Vietnamese title based on operator and selections
  const getWorksheetTitle = () => {
    if (selectedPdfDangs.length > 1) {
      return 'PHIẾU BÀI TẬP ÔN TẬP TOÁN HỖN HỢP LỚP 3';
    }
    const singleDang = selectedPdfDangs[0];
    switch (singleDang) {
      case 'dong_ho':
        return 'PHIẾU BÀI TẬP: XEM ĐỒNG HỒ LỚP 3';
      case 'doi_don_vi':
        return 'PHIẾU BÀI TẬP: ĐỔI ĐƠN VỊ LỚP 3';
      case 'toan_loi_van':
        return 'PHIẾU BÀI TẬP: TOÁN LỜI VĂN LỚP 3';
      case 'so_sanh_so':
        return 'PHIẾU BÀI TẬP: SO SÁNH SỐ LỚP 3';
      case 'day_so':
        return 'PHIẾU BÀI TẬP: DÃY SỐ TOÁN LỚP 3';
      case 'ngay_thang':
        return 'PHIẾU BÀI TẬP: NGÀY THÁNG TOÁN LỚP 3';
      case 'phep_tinh':
      default:
        switch (config.operator) {
          case 'cong': return 'PHIẾU BÀI TẬP: PHÉP CỘNG TOÁN LỚP 3';
          case 'tru': return 'PHIẾU BÀI TẬP: PHÉP TRỪ TOÁN LỚP 3';
          case 'nhan': return 'PHIẾU BÀI TẬP: PHÉP NHÂN LỚP 3';
          case 'chia': return 'PHIẾU BÀI TẬP: PHÉP CHIA LỚP 3';
          default: return 'PHIẾU BÀI TẬP: CÁC PHÉP TÍNH LỚP 3';
        }
    }
  };

  // Generate real PDF worksheet using jsPDF
  const generatePdf = async (isAnswerSheet: boolean) => {
    if (!questions || questions.length === 0) {
      alert('Vui lòng tạo phiếu bài tập trước khi xuất PDF.');
      return;
    }

    const setGenerating = isAnswerSheet ? setIsGeneratingAnsPdf : setIsGeneratingPdf;
    setGenerating(true);

    try {
      const { jsPDF } = await import('jspdf');
      
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      let regularFont = 'helvetica';
      let boldFont = 'helvetica';
      let useUnicode = false;

      // Try loading beautiful Roboto Unicode font for proper Vietnamese diacritics
      try {
        if (!cachedRegularFont) {
          cachedRegularFont = await fetchFontAsBase64('https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf');
        }
        if (!cachedBoldFont) {
          cachedBoldFont = await fetchFontAsBase64('https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Medium.ttf');
        }

        if (cachedRegularFont && cachedBoldFont) {
          doc.addFileToVFS('Roboto-Regular.ttf', cachedRegularFont);
          doc.addFont('Roboto-Regular.ttf', 'Roboto-Regular', 'normal');
          doc.addFileToVFS('Roboto-Bold.ttf', cachedBoldFont);
          doc.addFont('Roboto-Bold.ttf', 'Roboto-Bold', 'bold');

          regularFont = 'Roboto-Regular';
          boldFont = 'Roboto-Bold';
          useUnicode = true;
        }
      } catch (err) {
        console.warn('Could not load Unicode fonts, falling back to Helvetica:', err);
        regularFont = 'helvetica';
        boldFont = 'helvetica';
        useUnicode = false;
      }

      const sanitize = (text: string) => sanitizeText(text, useUnicode);

      // Helper function to draw header on a page
      const drawHeader = (pageNumber: number) => {
        doc.setFont(boldFont, 'bold');
        doc.setFontSize(11);
        const nameVal = studentName ? studentName : '___________________________';
        const classVal = studentClass ? `    Lớp: ${studentClass}` : '';
        const ansSuffix = isAnswerSheet ? '  (ĐÁP ÁN)' : '';
        const titleText = getWorksheetTitle();
        
        // Print Worksheet Title
        doc.text(sanitize(titleText + ansSuffix), 15, 12);
        
        // Print Name, Class & Score line
        doc.setFontSize(10.5);
        const headerLine = `Học và tên: ${nameVal}${classVal}    Điểm số: ______ / ${config.totalQuestions}`;
        doc.text(sanitize(headerLine), 15, 18);

        // Thin separation line
        doc.setLineWidth(0.3);
        doc.setDrawColor(150, 150, 150);
        doc.line(15, 20, 195, 20);
      };

      // Draw initial page header
      drawHeader(1);

      // MATH QUESTIONS IN A 2-COLUMN GRID (with dynamic height & full-width support)
      let leftY = 26;
      let rightY = 26;
      const pageHeightLimit = 276; // Safe printing bottom limit on A4

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        
        // Calculate height and check if it's full-width
        let isFullWidth = false;
        let questionHeight = 12; // Default Y spacing for standard lines
        
        if (q.operator === 'Lời văn') {
          isFullWidth = true;
          const textWidth = 160;
          const lines = doc.splitTextToSize(sanitize(q.wordProblemText || ''), textWidth);
          questionHeight = lines.length * 5.5 + 11; // text lines + spacing + answer line
        } else if (q.operator === 'Đồng hồ') {
          questionHeight = 22; // Clock drawing + spacing takes 22mm
        } else if (q.operator === 'Ngày tháng') {
          const isFeb = q.text.includes('Tháng 2') || q.text.includes('tháng 2');
          const ansString = isAnswerSheet ? (isFeb ? ' [ 28 hoặc 29 ngày ]' : ` [ ${q.correctAnswer} ]`) : ' [        ]';
          const qText = q.text + ansString;
          const lines = doc.splitTextToSize(sanitize(qText), 75);
          questionHeight = lines.length * 5 + 6;
        } else {
          questionHeight = 12;
        }

        // Layout placement
        if (isFullWidth) {
          let currentMaxY = Math.max(leftY, rightY);
          
          // Page overflow check
          if (currentMaxY + questionHeight > pageHeightLimit) {
            doc.addPage();
            drawHeader(doc.getNumberOfPages());
            leftY = 26;
            rightY = 26;
            currentMaxY = 26;
          }
          
          // Render Word Problem
          // "Câu X:" prefix
          doc.setFont(boldFont, 'bold');
          doc.setFontSize(10);
          doc.text(sanitize(`Câu ${i + 1}:`), 15, currentMaxY + 4);
          
          // Paragraph body (wrapped)
          const textWidth = 160;
          const lines = doc.splitTextToSize(sanitize(q.wordProblemText || ''), textWidth);
          doc.setFont(regularFont, 'normal');
          doc.setFontSize(10.5);
          lines.forEach((line: string, idx: number) => {
            doc.text(line, 28, currentMaxY + 4 + idx * 5.5);
          });
          
          // Answer space
          const answerY = currentMaxY + 4 + lines.length * 5.5 + 2;
          doc.setFont(boldFont, 'bold');
          const ansText = isAnswerSheet ? `Đáp án: [  ${q.correctAnswer}  ]` : 'Đáp án: [          ]';
          doc.text(sanitize(ansText), 28, answerY);
          
          // Align columns
          const endY = currentMaxY + questionHeight;
          leftY = endY;
          rightY = endY;
          
        } else {
          // Column question
          // Use shorter column
          let useCol2 = leftY > rightY;
          let colX = useCol2 ? 110 : 15;
          let colY = useCol2 ? rightY : leftY;
          
          // Page overflow check
          if (colY + questionHeight > pageHeightLimit) {
            doc.addPage();
            drawHeader(doc.getNumberOfPages());
            leftY = 26;
            rightY = 26;
            useCol2 = false;
            colX = 15;
            colY = 26;
          }
          
          // Render based on type
          if (q.operator === 'Đồng hồ') {
            doc.setFont(boldFont, 'bold');
            doc.setFontSize(10);
            doc.text(sanitize(`Câu ${i + 1}:`), colX, colY + 5);
            
            const centerX = colX + 22;
            const centerY = colY + 10;
            const radius = 8;
            
            // Draw SVG clock into PDF using vector shapes
            drawPdfClock(doc, centerX, centerY, radius, q.hour || 12);
            
            // Label and placeholder
            doc.setFont(regularFont, 'normal');
            doc.setFontSize(10);
            doc.text(sanitize('Đồng hồ chỉ:'), colX + 35, colY + 7);
            
            doc.setFont(boldFont, 'bold');
            const ansText = isAnswerSheet ? `[  ${q.correctAnswer}  ] giờ` : '[        ] giờ';
            doc.text(sanitize(ansText), colX + 35, colY + 13);
            
          } else if (q.operator === 'So sánh') {
            doc.setFont(boldFont, 'bold');
            doc.setFontSize(10);
            doc.text(sanitize(`Câu ${i + 1}:`), colX, colY + 5);
            
            doc.setFont(regularFont, 'normal');
            doc.setFontSize(11);
            
            const boxStr = isAnswerSheet ? `[  ${q.correctAnswer}  ]` : '[       ]';
            const formulaStr = `${q.compLeft}   ${boxStr}   ${q.compRight}`;
            doc.text(sanitize(formulaStr), colX + 16, colY + 5);
            
          } else if (q.operator === 'Dãy số') {
            doc.setFont(boldFont, 'bold');
            doc.setFontSize(10);
            doc.text(sanitize(`Câu ${i + 1}:`), colX, colY + 5);
            
            doc.setFont(regularFont, 'normal');
            doc.setFontSize(11);
            
            const seqStr = q.sequence?.map((num, idx) => 
              idx === q.missingIndex 
                ? (isAnswerSheet ? `[ ${q.correctAnswer} ]` : '[      ]') 
                : String(num)
            ).join('  ') || '';
            
            doc.text(sanitize(seqStr), colX + 16, colY + 5);
            
          } else if (q.operator === 'Đổi đơn vị') {
            doc.setFont(boldFont, 'bold');
            doc.setFontSize(10);
            doc.text(sanitize(`Câu ${i + 1}:`), colX, colY + 5);
            
            doc.setFont(regularFont, 'normal');
            doc.setFontSize(11);
            
            const boxStr = isAnswerSheet ? `[  ${q.correctAnswer}  ]` : '[        ]';
            const formulaStr = `${q.num1} ${q.fromUnit} = ${boxStr} ${q.toUnit}`;
            doc.text(sanitize(formulaStr), colX + 16, colY + 5);
            
          } else if (q.operator === 'Ngày tháng') {
            doc.setFont(boldFont, 'bold');
            doc.setFontSize(10);
            doc.text(sanitize(`Câu ${i + 1}:`), colX, colY + 5);
            
            doc.setFont(regularFont, 'normal');
            doc.setFontSize(10);
            
            const isFeb = q.text.includes('Tháng 2') || q.text.includes('tháng 2');
            const ansString = isAnswerSheet 
              ? (isFeb ? ' [ 28 hoặc 29 ngày ]' : ` [ ${q.correctAnswer} ]`) 
              : ' [        ]';
            
            const qText = q.text + ansString;
            const lines = doc.splitTextToSize(sanitize(qText), 75);
            lines.forEach((line: string, idx: number) => {
              doc.text(line, colX + 16, colY + 5 + idx * 5);
            });
            
          } else {
            // Basic math operations
            doc.setFont(boldFont, 'bold');
            doc.setFontSize(10);
            doc.text(sanitize(`Câu ${i + 1}:`), colX, colY + 5);
            
            doc.setFont(regularFont, 'normal');
            doc.setFontSize(11.5);
            
            const originalResult = q.operatorSymbol === '+' ? q.num1 + q.num2
              : q.operatorSymbol === '-' ? q.num1 - q.num2
              : q.operatorSymbol === '×' ? q.num1 * q.num2
              : q.num1 / q.num2;

            let questionFormula = '';
            if (q.isMissingNumber && q.missingPosition === 'left') {
              questionFormula = isAnswerSheet
                ? `[ ${q.correctAnswer} ] ${q.operatorSymbol} ${q.num2} = ${originalResult}`
                : `[      ] ${q.operatorSymbol} ${q.num2} = ${originalResult}`;
            } else if (q.isMissingNumber && q.missingPosition === 'right') {
              questionFormula = isAnswerSheet
                ? `${q.num1} ${q.operatorSymbol} [ ${q.correctAnswer} ] = ${originalResult}`
                : `${q.num1} ${q.operatorSymbol} [      ] = ${originalResult}`;
            } else {
              questionFormula = isAnswerSheet
                ? `${q.num1} ${q.operatorSymbol} ${q.num2} = [ ${q.correctAnswer} ]`
                : `${q.num1} ${q.operatorSymbol} ${q.num2} = [      ]`;
            }
            
            doc.text(sanitize(questionFormula), colX + 16, colY + 5);
          }
          
          // Update height of the column used
          if (useCol2) {
            rightY = colY + questionHeight;
          } else {
            leftY = colY + questionHeight;
          }
        }
      }

      // Add elegant page number footer on each page (using post-processing)
      const totalPages = doc.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setFont(regularFont, 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(140, 140, 140);
        
        const footerText = sanitize(`Trang ${p} / ${totalPages}  •  Bé Học Toán Lớp 3`);
        doc.text(footerText, 105, 287, { align: 'center' });
      }

      // Save PDF document
      const filename = isAnswerSheet
        ? 'dap-an-phieu-bai-tap-toan-lop-3.pdf'
        : 'phieu-bai-tap-toan-lop-3.pdf';
      
      doc.save(filename);

    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Đã xảy ra lỗi khi tạo file PDF. Vui lòng thử lại.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-4 md:py-8">
      {/* 1. KHU VỰC ĐIỀU KHIỂN (Ẩn khi in nhờ lớp print:hidden) */}
      <div className="bg-white rounded-3xl p-6 shadow-xl border-2 border-indigo-50 mb-8 print:hidden" id="worksheet-controls">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <h2 className="text-xl md:text-2xl font-black text-slate-800 flex items-center gap-2">
              <FileText className="w-6 h-6 text-indigo-500" />
              Chế độ Phiếu Bài Tập A4
            </h2>
            <p className="text-slate-500 text-xs md:text-sm">
              Đề bài tự động tạo <span className="font-bold text-indigo-600">{config.totalQuestions} câu hỏi</span> ngẫu nhiên không trùng lặp, sẵn sàng để in hoặc xuất file PDF.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <button
              onClick={onBack}
              id="btn-worksheet-back"
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-2xl flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Quay lại
            </button>
            <button
              onClick={handleRegenerate}
              id="btn-worksheet-regenerate"
              className="px-4 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 font-bold text-sm rounded-2xl flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" /> Đổi đề mới
            </button>
            
            <button
              onClick={() => generatePdf(false)}
              disabled={isGeneratingPdf || isGeneratingAnsPdf}
              id="btn-worksheet-export-pdf"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-black text-sm rounded-2xl flex items-center gap-2 shadow-md shadow-indigo-100 transition-all cursor-pointer"
            >
              {isGeneratingPdf ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Đang tạo PDF...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" /> Xuất PDF
                </>
              )}
            </button>

            <button
              onClick={() => generatePdf(true)}
              disabled={isGeneratingPdf || isGeneratingAnsPdf}
              id="btn-worksheet-export-pdf-ans"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-black text-sm rounded-2xl flex items-center gap-2 shadow-md shadow-emerald-100 transition-all cursor-pointer"
            >
              {isGeneratingAnsPdf ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Đang tạo đáp án...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" /> Xuất PDF đáp án
                </>
              )}
            </button>

            <button
              onClick={handlePrint}
              id="btn-worksheet-print-browser"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-sm rounded-2xl flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" /> In trực tiếp
            </button>
          </div>
        </div>

        {/* Trộn nhiều dạng bài */}
        <div className="mt-6 pt-6 border-t-2 border-slate-50 space-y-3">
          <label className="block text-xs font-black text-slate-500 uppercase tracking-wider">
            Chọn các dạng bài muốn trộn vào phiếu bài tập:
          </label>
          <div className="flex flex-wrap gap-2.5">
            {[
              { id: 'phep_tinh', label: 'Phép tính (+, -, ×, ÷)' },
              { id: 'dong_ho', label: 'Xem đồng hồ 🕒' },
              { id: 'doi_don_vi', label: 'Đổi đơn vị 📏' },
              { id: 'toan_loi_van', label: 'Toán lời văn 📖' },
              { id: 'so_sanh_so', label: 'So sánh số 🔍' },
              { id: 'day_so', label: 'Dãy số 🔢' },
              { id: 'ngay_thang', label: 'Ngày tháng 📅' },
            ].map(item => {
              const isChecked = selectedPdfDangs.includes(item.id as any);
              return (
                <button
                  key={item.id}
                  onClick={() => handleToggleDang(item.id as any)}
                  className={`px-3.5 py-1.5 rounded-xl border-2 font-bold text-xs md:text-sm transition-all flex items-center gap-1.5 cursor-pointer ${
                    isChecked
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {isChecked ? <CheckSquare className="w-4 h-4 text-indigo-600" /> : <Square className="w-4 h-4 text-slate-300" />}
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Điền nhanh thông tin học sinh */}
        <div className="mt-6 pt-6 border-t-2 border-slate-50 grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Họ và tên học sinh:</label>
            <input
              type="text"
              id="input-student-name"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="Nhập tên của bé..."
              className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 focus:bg-white transition-all font-medium"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider font-sans">Lớp:</label>
            <input
              type="text"
              id="input-student-class"
              value={studentClass}
              onChange={(e) => setStudentClass(e.target.value)}
              placeholder="Ví dụ: 3A"
              className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 focus:bg-white transition-all font-medium"
            />
          </div>
          <div>
            <button
              onClick={() => setShowAnswers(!showAnswers)}
              id="btn-toggle-preview-answers"
              className={`w-full py-2 px-4 rounded-xl font-bold text-xs md:text-sm border-2 transition-all flex items-center justify-center gap-2 cursor-pointer ${
                showAnswers
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {showAnswers ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
              {showAnswers ? 'Đang hiện đáp án mẫu' : 'Hiện đáp án mẫu để chấm'}
            </button>
          </div>
        </div>
      </div>

      {/* 2. VÙNG TRANG IN GIẤY A4 CHUẨN */}
      <div 
        className="bg-white text-black p-8 md:p-12 border border-slate-200 rounded-3xl shadow-lg print:border-0 print:shadow-none print:p-0 font-sans mx-auto"
        id="a4-print-sheet"
        style={{ minHeight: '297mm', maxWidth: '210mm' }}
      >
        {/* Header phiếu bài tập */}
        <div className="border-b-2 border-slate-800 pb-3 mb-6">
          <h1 className="text-xl font-extrabold text-slate-800 text-center mb-4 tracking-wide print:text-black">
            {getWorksheetTitle()} {showAnswers && <span className="text-emerald-600 font-black">(ĐÁP ÁN)</span>}
          </h1>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-sm font-bold text-slate-800 print:text-black">
            <div className="flex-grow">
              Họ và tên: <span className="font-extrabold text-blue-700 print:text-black border-b border-dashed border-slate-400 inline-block min-w-[240px] pb-0.5">{studentName || '______________________'}</span>
              {studentClass && <span className="ml-4">Lớp: <span className="font-extrabold text-blue-700 print:text-black border-b border-dashed border-slate-400 inline-block min-w-[60px] pb-0.5 text-center">{studentClass}</span></span>}
            </div>
            <div className="shrink-0 text-right print:text-left">
              Điểm số: <span className="text-slate-400 print:text-black font-extrabold border-b border-dashed border-slate-400 inline-block min-w-[100px] pb-0.5">______ / {config.totalQuestions}</span>
            </div>
          </div>
        </div>

        {/* Grid hiển thị các câu hỏi */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6 pt-4 text-lg font-black text-slate-800 print:text-black">
          {questions.map((q, index) => {
            const originalResult = q.operatorSymbol === '+' ? q.num1 + q.num2
              : q.operatorSymbol === '-' ? q.num1 - q.num2
              : q.operatorSymbol === '×' ? q.num1 * q.num2
              : q.num1 / q.num2;

            // 1. Dạng xem đồng hồ
            if (q.operator === 'Đồng hồ') {
              return (
                <div key={q.id} className="flex items-center gap-3 py-1 px-2 border-b border-dashed border-slate-100 min-h-[70px]">
                  <span className="text-sm font-bold text-slate-400 print:text-black w-10 shrink-0">
                    Câu {index + 1}:
                  </span>
                  <div className="shrink-0 scale-95">
                    <PreviewClock hour={q.hour || 12} />
                  </div>
                  <div className="flex flex-col gap-0.5 justify-center">
                    <span className="text-xs font-bold text-slate-400 print:text-black">Đồng hồ chỉ:</span>
                    <span className="text-base font-black">
                      <span className={`inline-block border-2 border-slate-800 rounded-lg w-14 h-9 text-center leading-8 ${showAnswers ? 'text-indigo-600 print:text-black bg-indigo-50/50' : 'text-transparent'}`}>
                        {q.correctAnswer}
                      </span>
                      <span className="ml-1 text-slate-600 print:text-black font-bold">giờ</span>
                    </span>
                  </div>
                </div>
              );
            }

            // 2. Dạng toán lời văn (Spans full columns)
            if (q.operator === 'Lời văn') {
              return (
                <div key={q.id} className="sm:col-span-2 flex flex-col gap-2 py-3 px-2 border-b border-dashed border-slate-100">
                  <div className="flex items-start gap-2">
                    <span className="text-sm font-bold text-slate-400 print:text-black w-10 shrink-0 mt-0.5">
                      Câu {index + 1}:
                    </span>
                    <p className="text-base font-bold text-slate-700 print:text-black leading-relaxed">
                      {q.wordProblemText}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pl-12">
                    <span className="text-sm font-bold text-slate-400 print:text-black">Đáp án:</span>
                    <span className={`inline-block border-2 border-slate-800 rounded-lg w-24 h-9 text-center leading-8 font-black ${showAnswers ? 'text-indigo-600 print:text-black bg-indigo-50/50' : 'text-transparent'}`}>
                      {q.correctAnswer}
                    </span>
                  </div>
                </div>
              );
            }

            // 3. Dạng so sánh số
            if (q.operator === 'So sánh') {
              return (
                <div key={q.id} className="flex items-center gap-1 py-1 px-2 border-b border-dashed border-slate-100">
                  <span className="text-sm font-bold text-slate-400 print:text-black w-10 shrink-0">
                    Câu {index + 1}:
                  </span>
                  <div className="flex items-center gap-2 text-base font-black text-slate-800 print:text-black flex-grow">
                    <span>{q.compLeft}</span>
                    <span className={`inline-block border-2 border-dashed border-slate-400 rounded-lg w-12 h-9 text-center leading-8 font-black ${showAnswers ? 'border-solid border-slate-800 text-indigo-600 print:text-black bg-indigo-50/50' : 'text-transparent'}`}>
                      {q.correctAnswer}
                    </span>
                    <span>{q.compRight}</span>
                  </div>
                </div>
              );
            }

            // 4. Dạng dãy số
            if (q.operator === 'Dãy số') {
              return (
                <div key={q.id} className="flex items-center gap-1 py-1 px-2 border-b border-dashed border-slate-100">
                  <span className="text-sm font-bold text-slate-400 print:text-black w-10 shrink-0">
                    Câu {index + 1}:
                  </span>
                  <div className="flex items-center gap-2 text-base font-black text-slate-800 print:text-black flex-grow">
                    {q.sequence?.map((num, idx) => {
                      if (idx === q.missingIndex) {
                        return (
                          <span key={idx} className={`inline-block border-2 border-slate-800 rounded-lg w-14 h-9 text-center leading-8 font-black ${showAnswers ? 'text-indigo-600 print:text-black bg-indigo-50/50' : 'text-transparent'}`}>
                            {q.correctAnswer}
                          </span>
                        );
                      }
                      return <span key={idx} className="text-slate-600 print:text-black">{num}</span>;
                    })}
                  </div>
                </div>
              );
            }

            // 5. Dạng đổi đơn vị
            if (q.operator === 'Đổi đơn vị') {
              return (
                <div key={q.id} className="flex items-center gap-1 py-1 px-2 border-b border-dashed border-slate-100">
                  <span className="text-sm font-bold text-slate-400 print:text-black w-10 shrink-0">
                    Câu {index + 1}:
                  </span>
                  <div className="flex items-center gap-2 text-base font-black text-slate-800 print:text-black flex-grow">
                    <span>{q.num1} {q.fromUnit}</span>
                    <span className="text-slate-400">=</span>
                    <span className={`inline-block border-2 border-slate-800 rounded-lg w-20 h-9 text-center leading-8 font-black ${showAnswers ? 'text-indigo-600 print:text-black bg-indigo-50/50' : 'text-transparent'}`}>
                      {q.correctAnswer}
                    </span>
                    <span className="text-slate-600 print:text-black font-bold">{q.toUnit}</span>
                  </div>
                </div>
              );
            }

            // 5.5. Dạng ngày tháng
            if (q.operator === 'Ngày tháng') {
              const isFeb = q.text.includes('Tháng 2') || q.text.includes('tháng 2');
              const ansDisplay = isFeb ? '28 hoặc 29 ngày' : q.correctAnswer;
              return (
                <div key={q.id} className="flex items-center gap-1 py-1 px-2 border-b border-dashed border-slate-100 min-h-[50px]">
                  <span className="text-sm font-bold text-slate-400 print:text-black w-10 shrink-0">
                    Câu {index + 1}:
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5 text-base font-bold text-slate-700 print:text-black flex-grow">
                    <span>{q.text}</span>
                    <span className={`inline-block border-2 border-slate-800 rounded-lg px-2 h-9 text-center leading-8 font-black ${showAnswers ? 'text-indigo-600 print:text-black bg-indigo-50/50 font-sans text-sm' : 'text-transparent min-w-[50px]'}`}>
                      {ansDisplay}
                    </span>
                  </div>
                </div>
              );
            }

            // 6. Nhóm các phép tính cơ bản
            return (
              <div key={q.id} className="flex items-center gap-1 py-1 px-2 border-b border-dashed border-slate-100">
                <span className="text-sm font-bold text-slate-400 print:text-black w-10 shrink-0">
                  Câu {index + 1}:
                </span>
                
                <div className="flex items-center gap-2 flex-grow">
                  {q.isMissingNumber && q.missingPosition === 'left' ? (
                    <>
                      <span className={`inline-block border-2 border-slate-800 rounded-lg w-14 h-9 text-center leading-8 font-black ${showAnswers ? 'text-indigo-600 print:text-black bg-indigo-50/50' : 'text-transparent'}`}>
                        {q.correctAnswer}
                      </span>
                      <span className="text-blue-600 print:text-black font-bold">{q.operatorSymbol}</span>
                      <span>{q.num2}</span>
                      <span className="text-slate-400">=</span>
                      <span>{originalResult}</span>
                    </>
                  ) : q.isMissingNumber && q.missingPosition === 'right' ? (
                    <>
                      <span>{q.num1}</span>
                      <span className="text-blue-600 print:text-black font-bold">{q.operatorSymbol}</span>
                      <span className={`inline-block border-2 border-slate-800 rounded-lg w-14 h-9 text-center leading-8 font-black ${showAnswers ? 'text-indigo-600 print:text-black bg-indigo-50/50' : 'text-transparent'}`}>
                        {q.correctAnswer}
                      </span>
                      <span className="text-slate-400">=</span>
                      <span>{originalResult}</span>
                    </>
                  ) : (
                    <>
                      <span>{q.num1}</span>
                      <span className="text-blue-600 print:text-black font-bold">{q.operatorSymbol}</span>
                      <span>{q.num2}</span>
                      <span className="text-slate-400">=</span>
                      <span className={`inline-block border-2 border-slate-800 rounded-lg w-14 h-9 text-center leading-8 font-black ${showAnswers ? 'text-indigo-600 print:text-black bg-indigo-50/50' : 'text-transparent'}`}>
                        {q.correctAnswer}
                      </span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Hết nội dung */}
        <div className="mt-12 pt-4 border-t border-slate-100 text-center text-xs font-bold text-slate-300 print:text-slate-400">
          - Hết nội dung -
        </div>
      </div>
      
      {/* 3. ĐIỀU CHỈNH CSS ĐỂ IN THẬT HOÀN HẢO */}
      <style>{`
        @media print {
          body {
            background-color: white !important;
            color: black !important;
          }
          header, footer, nav, aside, #app-header, #app-footer, #worksheet-controls {
            display: none !important;
          }
          #app-wrapper, main {
            background: none !important;
            padding: 0 !important;
            margin: 0 !important;
            min-height: auto !important;
          }
          #a4-print-sheet {
            border: 0 !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 auto !important;
            width: 100% !important;
            max-width: 100% !important;
            min-height: auto !important;
          }
        }
      `}</style>
    </div>
  );
}
