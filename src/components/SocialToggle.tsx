'use client';

import { useState, useEffect } from 'react';

export default function SocialToggle() {
  const [isVisible, setIsVisible] = useState(true);
  const [scrollPosition, setScrollPosition] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const footer = document.querySelector('footer');
      if (!footer) return;

      const footerRect = footer.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Hide when scrolled to footer area
      if (footerRect.top < windowHeight) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      setScrollPosition(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      className={`fixed right-4 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-4 transition-all duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      style={{ maxWidth: '60px' }}
    >
      {/* Instagram Button */}
      <a
        href="https://www.instagram.com/mysanjeevni21_/"
        target="_blank"
        rel="noopener noreferrer"
        className="group w-14 h-14 rounded-full shadow-xl transition-all duration-300 hover:scale-110 hover:shadow-2xl flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, #fbbf24 0%, #ec4899 50%, #ef4444 100%)',
          backdropFilter: 'blur(10px)',
        }}
        title="Follow on Instagram"
        aria-label="Instagram"
      >
        {/* Official Instagram Logo */}
        <svg
          className="w-7 h-7 text-white transition-transform group-hover:rotate-12"
          fill="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.266.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073z"/>
          <path d="M12 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zm0 10.162a4 4 0 110-8 4 4 0 010 8z"/>
          <circle cx="18.406" cy="5.595" r="1.44"/>
        </svg>
      </a>

      {/* WhatsApp Button */}
      <a
        href="https://wa.me/919555753336?text=Hi%20I%20am%20interested%20in%20MySanjeevni%20products%20and%20services"
        target="_blank"
        rel="noopener noreferrer"
        className="group w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full text-white shadow-xl transition-all duration-300 hover:scale-110 hover:shadow-2xl flex items-center justify-center"
        title="Chat on WhatsApp"
        aria-label="WhatsApp"
      >
        {/* Official WhatsApp Logo */}
        <svg
          className="w-7 h-7 text-white transition-transform group-hover:-rotate-12"
          fill="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M19.05 4.91C17.18 3.03 14.69 2 12.04 2 6.58 2 2.13 6.45 2.13 11.91c0 2.09.55 4.14 1.6 5.96L2 22l6.26-1.64c1.74.96 3.7 1.47 5.78 1.47 5.45 0 9.9-4.45 9.9-9.91 0-2.65-1.04-5.14-2.9-7.01zm-7.01 15.24c-1.81 0-3.59-.49-5.16-1.41l-.37-.22-3.83 1 1.01-3.7-.24-.38C3.68 15.35 3.2 13.7 3.2 11.91c0-4.64 3.78-8.42 8.42-8.42 2.25 0 4.37.88 5.96 2.47 1.59 1.59 2.47 3.71 2.47 5.96 0 4.63-3.78 8.42-8.42 8.42zm4.59-6.35c-.25-.12-1.48-.73-1.71-.81-.23-.09-.4-.09-.56.09-.16.17-.62.81-.76.97-.14.16-.29.18-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.39.11-.51.11-.1.25-.26.37-.39.12-.13.17-.22.26-.37.09-.15.04-.28-.02-.39-.06-.11-.56-1.35-.77-1.84-.2-.48-.41-.41-.56-.42-.14 0-.3-.01-.46-.01-.16 0-.41.06-.63.31-.22.25-.84.82-.84 2.01 0 1.18.86 2.33 1 2.49.13.16 1.86 2.84 4.5 3.98.63.27 1.12.43 1.5.55.63.2 1.2.17 1.65.1.5-.08 1.54-.63 1.76-1.24.21-.61.21-1.13.15-1.24-.07-.11-.23-.18-.48-.3z"/>
        </svg>
      </a>

      {/* Tooltip Background - Optional subtle background */}
      <div
        className="absolute -inset-2 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-xl -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        aria-hidden="true"
      />
    </div>
  );
}
