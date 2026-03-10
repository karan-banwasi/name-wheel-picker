import { useEffect, useRef, useState, useMemo } from 'react';
import './Wheel.css';

const Wheel = ({ segments, mustSpin, prizeNumber, onStopSpinning }) => {
  const canvasRef = useRef(null);
  const [rotation, setRotation] = useState(0);
  const spinRef = useRef(null);
  
  // Design properties
  const colors = useMemo(() => {
    if (segments.length === 0) return [];
    return segments.map((_, i) => `hsl(${(i * 360) / Math.max(segments.length, 1)}, 70%, 55%)`);
  }, [segments.length]);

  // Drawing the wheel
  const drawWheel = (ctx, centerX, centerY, radius, currentRotation) => {
    // Enable High DPI Support
    const dpr = window.devicePixelRatio || 1;
    
    ctx.clearRect(0, 0, centerX * 2, centerY * 2);
    
    if (segments.length === 0) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#94a3b8';
      ctx.font = '20px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Add names to start!', centerX, centerY);
      return;
    }

    const arc = (2 * Math.PI) / segments.length;
    
    for (let i = 0; i < segments.length; i++) {
      const angle = currentRotation + i * arc;
      
      // Draw Slice
      ctx.beginPath();
      ctx.fillStyle = colors[i % colors.length];
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, angle, angle + arc, false);
      ctx.lineTo(centerX, centerY);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.1)';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // Draw Text
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(angle + arc / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#fff';
      
      // Auto scale font based on segment count
      let fontSize = segments.length > 20 ? 12 : segments.length > 10 ? 16 : 22;
      ctx.font = `bold ${fontSize}px Inter, sans-serif`;
      
      // Shadow for contrast
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      
      const textX = radius - 20;
      let text = segments[i];
      if (text.length > 15 && segments.length > 10) {
        text = text.substring(0, 12) + '...';
      }
      ctx.fillText(text, textX, 0);
      ctx.restore();
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Setup for High DPI Displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    // Set actual size in memory (scaled to account for extra pixel density)
    if (canvas.width !== rect.width * dpr) {
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    }
    
    const ctx = canvas.getContext('2d');
    
    // Normalize coordinate system to use css pixels
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const radius = Math.min(centerX, centerY) - 5;
    
    drawWheel(ctx, centerX, centerY, radius, rotation);
  }, [segments, rotation, colors]);

  // Spin Logic
  useEffect(() => {
    if (mustSpin) {
      const duration = 5000; // 5 seconds
      const startRotation = rotation;
      const arc = (2 * Math.PI) / segments.length;
      
      const prizeOffset = prizeNumber * arc;
      const spins = 10;
      const randomOffsetInsideSegment = Math.random() * arc * 0.8 + arc * 0.1; 
      
      // Calculate absolute target angle ensuring pointer points strictly inside the chosen piece
      const targetMod = ((-prizeOffset - randomOffsetInsideSegment) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
      const currentMod = (startRotation % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
      
      // Ensure positive forward spin length
      const diff = (targetMod - currentMod + 2 * Math.PI) % (2 * Math.PI);
      const targetRotation = startRotation + diff + (spins * 2 * Math.PI);
      
      let startTime = null;

      const animate = (time) => {
        if (!startTime) startTime = time;
        const elapsed = time - startTime;
        
        let t = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - t, 4); // Quartic ease out
        
        const currentRotation = startRotation + (targetRotation - startRotation) * easeOut;
        setRotation(currentRotation);
        
        if (t < 1) {
          spinRef.current = requestAnimationFrame(animate);
        } else {
          // Normalize rotation immediately after stop so it doesn't grow infinitely huge over many spins
          setRotation(currentRotation % (2 * Math.PI));
          onStopSpinning();
        }
      };
      
      spinRef.current = requestAnimationFrame(animate);
    }
    
    return () => {
      if (spinRef.current) cancelAnimationFrame(spinRef.current);
    };
  }, [mustSpin, prizeNumber, segments.length, onStopSpinning]);

  return (
    <div className="wheel-container">
      <div className="wheel-pointer"></div>
      <canvas 
        ref={canvasRef} 
        style={{ width: '100%', height: '100%', maxWidth: '600px', maxHeight: '600px' }}
        className="wheel-canvas"
      />
    </div>
  );
};

export default Wheel;
