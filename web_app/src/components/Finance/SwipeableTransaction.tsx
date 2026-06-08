import React, { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';

interface SwipeableTransactionProps {
  onDelete: () => void;
  children: React.ReactNode;
}

export default function SwipeableTransaction({ onDelete, children }: SwipeableTransactionProps) {
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  const threshold = 80;

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return;
    const x = e.touches[0].clientX;
    const diff = x - startX;
    
    // Only allow left swipe
    if (diff < 0) {
      setCurrentX(Math.max(diff, -100)); // Cap at -100px
    } else if (isOpen) {
      // Allow closing swipe
      setCurrentX(Math.max(-threshold + diff, -threshold));
      if (diff > 50) setIsOpen(false);
    }
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);
    if (currentX < -(threshold / 2)) {
      setIsOpen(true);
      setCurrentX(-threshold);
    } else {
      setIsOpen(false);
      setCurrentX(0);
    }
  };

  // Reset if clicked outside
  useEffect(() => {
    const handleClick = () => {
      if (isOpen) {
        setIsOpen(false);
        setCurrentX(0);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [isOpen]);

  return (
    <div className="relative overflow-hidden rounded-2xl w-full mb-3" onClick={(e) => e.stopPropagation()}>
      {/* Background action (Delete) */}
      <div className="absolute inset-0 bg-red-500/20 flex justify-end items-center px-4 border border-red-500/30 rounded-2xl">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
            setIsOpen(false);
            setCurrentX(0);
          }}
          className="w-10 h-10 bg-red-500 hover:bg-red-600 flex items-center justify-center rounded-xl text-white shadow-[0_0_15px_rgba(239,68,68,0.5)] transition-colors cursor-pointer"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* Foreground content */}
      <div 
        className="relative z-10 w-full transition-transform duration-200 ease-out rounded-2xl bg-[#141A28] border border-white/5"
        style={{ 
          transform: `translateX(${isOpen ? -threshold : currentX}px)`,
          transition: isSwiping ? 'none' : 'transform 0.2s ease-out' 
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}
