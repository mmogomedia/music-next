'use client';

import { useEffect, useState } from 'react';

export default function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const update = () => {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      setProgress(
        docHeight > 0 ? Math.min(100, (scrollTop / docHeight) * 100) : 0
      );
    };
    window.addEventListener('scroll', update, { passive: true });
    update();
    return () => window.removeEventListener('scroll', update);
  }, []);

  return (
    <div className='fixed top-0 left-0 right-0 z-50 h-0.5 bg-transparent'>
      <div
        className='h-full bg-gradient-to-r from-blue-500 via-purple-500 to-purple-600 transition-[width] duration-100 ease-out'
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
