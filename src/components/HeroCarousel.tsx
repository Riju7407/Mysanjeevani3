'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

interface HeroSlide {
  id: number;
  image: string;
  href: string;
}

const formatHeroImage = (url: string) => {
  if (!url.includes('res.cloudinary.com') || !url.includes('/upload/')) {
    return url;
  }
  return url.replace('/upload/', '/upload/f_auto,q_auto,w_2000,c_limit/');
};

const HERO_SLIDES: HeroSlide[] = [
  { id: 1, image: '/l1.png', href: '/lab-tests' },
  { id: 2, image: '/a1.png', href: '/medicines?category=sexual%20wellness' },
  { id: 3, image: '/w1.png', href: '/doctor-consultation' },
  { id: 4, image: '/d1.png', href: '/ayurveda' },
  { id: 5, image: '/h1.png', href: '/homeopathy' },
];

const HeroCarousel: React.FC = () => {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSlideClick = (href: string) => {
    router.push(href);
  };

  const settings = {
    dots: false,
    infinite: true,
    speed: 800,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 4000,
    arrows: false,
    pauseOnHover: true,
    swipe: false,
    touchMove: false,
    accessibility: false,
  };

  if (!isMounted) {
    return <div className="relative h-full w-full overflow-hidden rounded-2xl bg-white" />;
  }

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl bg-white">
      <Slider {...settings}>
        {HERO_SLIDES.map((slide) => (
          <div key={slide.id} className="relative h-full w-full">
            <img
              src={formatHeroImage(slide.image)}
              alt="Hero image"
              className="block h-56 w-full object-cover object-center"
              draggable={false}
            />
            <button
              onClick={() => handleSlideClick(slide.href)}
              onTouchEnd={() => handleSlideClick(slide.href)}
              className="absolute inset-0 w-full h-full bg-transparent cursor-pointer hover:opacity-90 transition-opacity"
              tabIndex={-1}
              style={{ zIndex: 10, border: 'none', padding: 0 }}
            />
          </div>
        ))}
      </Slider>

      {/* Custom Dots Styling */}
      <style>{`
        * {
          -webkit-tap-highlight-color: transparent !important;
        }

        .slick-slide,
        .slick-slide div,
        .slick-slide img,
        .slick-slider,
        .slick-track,
        .slick-list {
          outline: 0 !important;
          outline: none !important;
          -moz-outline: none !important;
          border: none !important;
          box-shadow: none !important;
          -webkit-appearance: none !important;
          -webkit-box-shadow: none !important;
        }

        .slick-slide:focus,
        .slick-slide > div:focus,
        .slick-slide:active,
        .slick-slide > div:active,
        .slick-slide.slick-active,
        .slick-slide.slick-active > div {
          outline: 0 !important;
          outline: none !important;
          border: none !important;
          box-shadow: none !important;
        }

        button:focus {
          outline: none !important;
        }

        .slick-dots {
          position: absolute !important;
          bottom: 10px !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
          display: flex !important;
          gap: 7px !important;
          justify-content: center !important;
          z-index: 15 !important;
          list-style: none !important;
        }

        .slick-dots li {
          display: flex !important;
        }

        .slick-dots li button {
          padding: 0 !important;
          width: 10px !important;
          height: 10px !important;
          border-radius: 50% !important;
          background: rgba(100, 116, 139, 0.6) !important;
          border: none !important;
          cursor: pointer !important;
          transition: all 0.3s ease !important;
        }

        .slick-dots li button:hover {
          background: rgba(71, 85, 105, 0.8) !important;
        }

        .slick-dots li.slick-active button {
          background: #0f172a !important;
          width: 28px !important;
          border-radius: 5px !important;
        }

        .slick-slider {
          height: 100% !important;
          width: 100% !important;
          overflow: hidden !important;
        }

        .slick-track {
          height: 100% !important;
          display: flex !important;
          overflow: hidden !important;
        }

        .slick-slide {
          height: 100% !important;
          width: 100% !important;
          display: flex !important;
          overflow: hidden !important;
          padding: 0 !important;
        }

        .slick-slide > div {
          width: 100% !important;
          height: 100% !important;
          display: flex !important;
          flex: 1 !important;
          overflow: hidden !important;
        }
      `}</style>
    </div>
  );
};

export default HeroCarousel;
