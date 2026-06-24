import { motion } from 'motion/react';

interface MathMascotProps {
  state: 'idle' | 'correct' | 'thinking' | 'wrong' | 'winner';
  className?: string;
}

export default function MathMascot({ state, className = '' }: MathMascotProps) {
  // Biểu cảm khuôn mặt dải rộng từ Idle, Correct, Wrong đến Winner
  const eyeVariants = {
    idle: { scaleY: 1, d: "M 0 0" }, // standard eyes
    correct: { scaleY: 1 },
    thinking: { scaleY: 0.8 },
    wrong: { scaleY: 1 },
    winner: { scaleY: 1 },
  };

  const antennaVariants = {
    idle: { scale: [1, 1.15, 1], transition: { repeat: Infinity, duration: 2, ease: "easeInOut" } },
    correct: { scale: [1, 1.4, 1], transition: { repeat: Infinity, duration: 0.6, ease: "easeInOut" } },
    wrong: { scale: [1, 0.9, 1], transition: { repeat: 1, duration: 0.8 } },
    winner: { scale: [1, 1.3, 1], transition: { repeat: Infinity, duration: 0.4 } }
  };

  const bodyBobbing = {
    idle: {
      y: [0, -6, 0],
      transition: { repeat: Infinity, duration: 4, ease: "easeInOut" }
    },
    correct: {
      y: [0, -25, 0, -15, 0],
      transition: { duration: 0.8, ease: "easeOut" }
    },
    wrong: {
      x: [0, -8, 8, -6, 6, 0],
      transition: { duration: 0.5 }
    },
    thinking: {
      rotate: [0, -2, 2, -2, 0],
      y: [0, -3, 0],
      transition: { repeat: Infinity, duration: 3, ease: "easeInOut" }
    },
    winner: {
      y: [0, -18, 0],
      rotate: [0, -5, 5, -5, 5, 0],
      transition: { repeat: Infinity, duration: 1.5, ease: "easeInOut" }
    }
  };

  return (
    <div className={`relative flex flex-col items-center justify-center select-none ${className}`}>
      {/* Bong bóng hội thoại tương tác của Mascot */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        key={state}
        className="absolute -top-16 bg-white border-2 border-amber-200 text-slate-700 font-medium px-4 py-2 rounded-2xl shadow-md text-sm md:text-base whitespace-nowrap z-10 font-sans"
      >
        {state === 'idle' && "Chào bạn nhỏ! Cùng chơi toán nhé! 👋"}
        {state === 'thinking' && "Bé đang suy nghĩ câu này à? 🤔"}
        {state === 'correct' && "Quá xuất sắc! Giỏi quá ta! 🎉🌟"}
        {state === 'wrong' && "Chưa đúng rồi, bé thử lại xem sao? 💪🏼"}
        {state === 'winner' && "Oa! Bé giỏi thần sầu luôn! 🏆✨"}
        
        {/* Mũi tên bong bóng */}
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white border-r-2 border-b-2 border-amber-200 rotate-45" />
      </motion.div>

      {/* Robot BiBi SVG chính */}
      <motion.svg
        viewBox="0 0 160 180"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        animate={state}
        variants={bodyBobbing}
        className="w-full h-full cursor-pointer max-w-[160px] max-h-[180px]"
      >
        {/* Anten phát sáng */}
        <g id="antenna">
          <motion.circle
            cx="80"
            cy="15"
            r="10"
            fill={state === 'correct' || state === 'winner' ? '#FBBF24' : state === 'wrong' ? '#EF4444' : '#34D399'}
            animate={state}
            variants={antennaVariants}
            className="filter drop-shadow-[0_0_8px_rgba(52,211,153,0.7)]"
          />
          <rect x="77" y="22" width="6" height="15" rx="3" fill="#94A3B8" />
        </g>

        {/* Đôi Tai Nghe Nhỏ */}
        <rect x="23" y="60" width="10" height="25" rx="5" fill="#64748B" />
        <rect x="127" y="60" width="10" height="25" rx="5" fill="#64748B" />

        {/* Cái Đầu Tròn */}
        <rect x="28" y="35" width="104" height="85" rx="28" fill="#E2E8F0" stroke="#64748B" strokeWidth="4" />
        {/* Phần kính bảo vệ màn hình */}
        <rect x="38" y="47" width="84" height="52" rx="16" fill="#1E293B" />

        {/* Đôi Mắt Biểu Cảm */}
        {state === 'correct' || state === 'winner' ? (
          // Mắt cười híp tít vui vẻ
          <g id="eyes-happy">
            <path d="M 48 70 Q 56 58 64 70" stroke="#34D399" strokeWidth="5" strokeLinecap="round" fill="none" />
            <path d="M 96 70 Q 104 58 112 70" stroke="#34D399" strokeWidth="5" strokeLinecap="round" fill="none" />
          </g>
        ) : state === 'wrong' ? (
          // Mắt ngạc nhiên/buồn nhẹ dễ thương
          <g id="eyes-wrong">
            <path d="M 50 68 L 60 74" stroke="#F87171" strokeWidth="5" strokeLinecap="round" />
            <path d="M 60 68 L 50 74" stroke="#F87171" strokeWidth="5" strokeLinecap="round" />
            <path d="M 100 68 L 110 74" stroke="#F87171" strokeWidth="5" strokeLinecap="round" />
            <path d="M 110 68 L 100 74" stroke="#F87171" strokeWidth="5" strokeLinecap="round" />
          </g>
        ) : state === 'thinking' ? (
          // Mắt suy nghĩ nghiêng chéo
          <g id="eyes-thinking">
            <circle cx="56" cy="72" r="6" fill="#60A5FA" />
            <circle cx="104" cy="68" r="6" fill="#60A5FA" />
            <path d="M 50 58 L 62 62" stroke="#94A3B8" strokeWidth="3" strokeLinecap="round" />
            <path d="M 110 56 L 98 58" stroke="#94A3B8" strokeWidth="3" strokeLinecap="round" />
          </g>
        ) : (
          // Mắt chớp nháy bình thường (idle)
          <g id="eyes-idle">
            <motion.ellipse
              cx="56"
              cy="70"
              rx="7"
              ry="7"
              fill="#34D399"
              animate={{ ry: [7, 1, 7, 7, 7, 1, 7] }}
              transition={{ repeat: Infinity, duration: 4 }}
            />
            <motion.ellipse
              cx="104"
              cy="70"
              rx="7"
              ry="7"
              fill="#34D399"
              animate={{ ry: [7, 1, 7, 7, 7, 1, 7] }}
              transition={{ repeat: Infinity, duration: 4 }}
            />
          </g>
        )}

        {/* Má Hồng Thẹn Thùng */}
        <circle cx="46" cy="88" r="6" fill="#F472B6" fillOpacity="0.6" />
        <circle cx="114" cy="88" r="6" fill="#F472B6" fillOpacity="0.6" />

        {/* Miệng siêu cute */}
        {state === 'correct' || state === 'winner' ? (
          <path d="M 72 84 Q 80 94 88 84" stroke="#34D399" strokeWidth="4" strokeLinecap="round" fill="none" />
        ) : state === 'wrong' ? (
          <path d="M 74 88 Q 80 82 86 88" stroke="#F87171" strokeWidth="4" strokeLinecap="round" fill="none" />
        ) : state === 'thinking' ? (
          <line x1="75" y1="85" x2="85" y2="85" stroke="#60A5FA" strokeWidth="4" strokeLinecap="round" />
        ) : (
          <path d="M 74 84 Q 80 90 86 84" stroke="#34D399" strokeWidth="4" strokeLinecap="round" fill="none" />
        )}

        {/* Cổ kết nối */}
        <rect x="70" y="116" width="20" height="10" fill="#94A3B8" rx="2" />

        {/* Thân mình tròn */}
        <path d="M 45 125 H 115 L 125 175 H 35 L 45 125 Z" fill="#3B82F6" stroke="#1D4ED8" strokeWidth="4" />
        {/* Nút bấm ở ngực sáng */}
        <circle cx="80" cy="148" r="10" fill="#FEE2E2" />
        <motion.polygon
          points="80,141 83,147 89,148 84,152 86,158 80,154 74,158 76,152 71,148 77,147"
          fill="#EF4444"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        />

        {/* Tay robot */}
        <g id="arms">
          {/* Tay Trái */}
          <motion.path
            d="M 33 135 C 15 135 10 150 15 160"
            stroke="#94A3B8"
            strokeWidth="8"
            strokeLinecap="round"
            animate={state === 'correct' || state === 'winner' ? { rotate: [0, 40, 0] } : {}}
            transition={{ repeat: Infinity, duration: 0.5 }}
          />
          {/* Tay Phải */}
          <motion.path
            d="M 127 135 C 145 135 150 150 145 160"
            stroke="#94A3B8"
            strokeWidth="8"
            strokeLinecap="round"
            animate={state === 'correct' || state === 'winner' ? { rotate: [0, -40, 0] } : state === 'wrong' ? { y: [0, -5, 0] } : {}}
            transition={{ repeat: Infinity, duration: 0.5 }}
          />
        </g>
      </motion.svg>
    </div>
  );
}
