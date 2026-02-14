import React, { useEffect, useState } from 'react';

export const FluidBackground = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      setMousePos({ x, y });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div style={{ 
      position: 'fixed', 
      inset: 0, 
      zIndex: -2, 
      background: '#000510', // 这里的底色要和 body 一致
      overflow: 'hidden',
    }}>
      {/* 这里的 filter 调整是关键：移除 contrast(30) */}
      <div style={{ 
        width: '100%', 
        height: '100%',
        filter: 'blur(80px)', 
        opacity: 0.6,
        transform: `translate(${mousePos.x}px, ${mousePos.y}px)`,
        transition: 'transform 0.4s ease-out'
      }}>
        {/* 调亮了蓝色，并使用了更柔和的径向渐变 */}
        <div style={{
          position: 'absolute', width: '100vw', height: '100vw',
          background: 'radial-gradient(circle, rgba(0, 85, 255, 0.4) 0%, transparent 60%)',
          top: '-10%', left: '-10%',
        }}></div>

        <div style={{
          position: 'absolute', width: '90vw', height: '90vw',
          background: 'radial-gradient(circle, rgba(50, 0, 255, 0.3) 0%, transparent 60%)',
          bottom: '-10%', right: '-5%',
        }}></div>
      </div>
      
      {/* 噪点层移动到这里，确保它在最上方提供质感 */}
      <div className="noise-layer" style={{ opacity: 0.03 }} />
    </div>
  );
};