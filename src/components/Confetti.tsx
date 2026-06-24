import { useEffect, useState } from 'react';
import { motion } from 'motion/react';

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  angle: number;
  speed: number;
}

interface ConfettiProps {
  pieces?: number;
}

export default function Confetti({ pieces = 50 }: ConfettiProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const colors = ['#FBBF24', '#34D399', '#60A5FA', '#F472B6', '#A78BFA', '#F59E0B', '#10B981'];
    
    // Tạo mẩu pháo giấy và ngôi sao lung linh nổ ra từ giữa màn hình
    const newParticles: Particle[] = Array.from({ length: pieces }).map((_, i) => {
      const angle = Math.random() * 360;
      const speed = Math.random() * 18 + 8; // Tốc độ bắn cao hơn khi nhiều hạt
      const size = Math.random() * 20 + 8; // Kích cỡ
      return {
        id: i,
        x: window.innerWidth / 2,
        y: window.innerHeight / 2 - 50,
        color: colors[Math.floor(Math.random() * colors.length)],
        size,
        angle,
        speed,
      };
    });
    
    setParticles(newParticles);
    
    const timer = setTimeout(() => {
      setParticles([]);
    }, 2800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((p) => {
        const rad = (p.angle * Math.PI) / 180;
        // Quỹ đạo hình cánh hoa / tia nắng bắn xa
        const targetX = Math.cos(rad) * p.speed * 25;
        // Trọng lực kéo hạt giấy rơi xuống theo thời gian
        const targetY = Math.sin(rad) * p.speed * 25 + 300; 

        return (
          <motion.div
            key={p.id}
            initial={{ x: p.x, y: p.y, scale: 0.1, opacity: 1, rotate: 0 }}
            animate={{
              x: p.x + targetX,
              y: p.y + targetY,
              scale: [0.5, 1.2, 0.9, 0],
              opacity: [1, 1, 0.8, 0],
              rotate: p.angle + Math.random() * 1000,
            }}
            transition={{ duration: 2.5, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              borderRadius: p.id % 3 === 0 ? '50%' : p.id % 3 === 1 ? '4px' : '0px',
              // Đối với p.id chia hết cho 3 dư 2, ta tạo hình Ngôi sao 5 cánh bằng clip-path
              clipPath: p.id % 3 === 2 
                ? 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' 
                : undefined,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          />
        );
      })}
    </div>
  );
}
