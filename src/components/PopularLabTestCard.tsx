'use client';

import React from 'react';

interface PopularLabTestCardProps {
  test: {
    _id: string | number;
    name?: string;
    testName?: string;
    category?: string;
    price: number;
    mrp?: number;
    image?: string;
    icon?: string;
    rating?: number;
    reviews?: number;
    description?: string;
    shortDescription?: string;
    stock?: number;
    currencySymbol?: '₹' | '$';
    displayPrice?: number;
    displayMrp?: number;
  };
  onBook?: () => void;
  onAddToCart?: () => void;
  isCompact?: boolean;
  showDiscount?: boolean;
}

export default function PopularLabTestCard({
  test,
  onBook,
  onAddToCart,
  isCompact = true,
  showDiscount = true,
}: PopularLabTestCardProps) {
  const testName = test.testName || test.name || 'Lab Test';
  const displayPrice = test.displayPrice ?? test.price;
  const displayMrp = test.displayMrp ?? test.mrp;
  const discount =
    displayMrp && displayMrp > displayPrice
      ? Math.round(((displayMrp - displayPrice) / displayMrp) * 100)
      : 0;

  return (
    <div
      className={`group relative bg-white rounded-xl border border-slate-200 hover:border-violet-300 hover:shadow-lg transition duration-300 overflow-hidden h-full flex flex-col`}
    >
      {/* Image Section */}
      <div className={`relative bg-gradient-to-br from-violet-50 to-fuchsia-50 overflow-hidden group-hover:bg-gradient-to-br group-hover:from-violet-100 group-hover:to-fuchsia-100 transition ${
        isCompact ? 'h-32' : 'h-40'
      }`}>
        {test.image ? (
          <img
            src={test.image}
            alt={testName}
            className={`h-full w-full object-contain group-hover:scale-105 transition duration-300 ${
              isCompact ? 'p-2' : 'p-3'
            }`}
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-4xl">
            {test.icon || '🧪'}
          </div>
        )}

        {/* Popular Badge */}
        <div className="absolute top-2 right-2 inline-flex items-center gap-1 bg-violet-600 text-white px-2 py-1 rounded-full text-xs font-bold">
          ⭐ Popular
        </div>

        {/* Discount Badge */}
        {showDiscount && discount > 0 && (
          <div className="absolute bottom-2 left-2 inline-flex bg-emerald-600 text-white px-2 py-1 rounded-lg text-xs font-bold">
            {discount}% OFF
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className={`flex flex-col flex-1 ${isCompact ? 'p-3' : 'p-4'}`}>
        {/* Category */}
        <p
          className={`font-semibold text-violet-600 uppercase tracking-wide mb-1 ${
            isCompact ? 'text-xs' : 'text-[11px]'
          }`}
        >
          {test.category || 'Health Check'}
        </p>

        {/* Test Name */}
        <h3
          className={`font-bold text-slate-900 line-clamp-2 mb-2 ${
            isCompact ? 'text-xs min-h-8' : 'text-sm min-h-10'
          }`}
        >
          {testName}
        </h3>

        {/* Description */}
        {(test.description || test.shortDescription) && (
          <p
            className={`text-slate-600 mb-2 line-clamp-2 ${
              isCompact ? 'text-[10px]' : 'text-xs'
            }`}
          >
            {test.description || test.shortDescription}
          </p>
        )}

        {/* Rating */}
        {test.rating && (
          <div className="flex items-center gap-1 mb-2">
            <span className="text-amber-500">⭐</span>
            <span className={`font-semibold text-slate-900 ${isCompact ? 'text-xs' : 'text-sm'}`}>
              {Number(test.rating).toFixed(1)}
            </span>
            {test.reviews && (
              <span className={`text-slate-500 ${isCompact ? 'text-xs' : 'text-xs'}`}>
                ({test.reviews} reviews)
              </span>
            )}
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Price Section */}
        <div className={`flex items-end justify-between mb-3 ${isCompact ? 'mb-2' : ''}`}>
          <div className="flex items-baseline gap-2">
            <span
              className={`font-black text-slate-900 ${
                isCompact ? 'text-base' : 'text-lg'
              }`}
            >
              {test.currencySymbol || '₹'}
              {displayPrice}
            </span>
            {displayMrp && displayMrp > displayPrice && (
              <span className="text-xs text-slate-400 line-through">
                {test.currencySymbol || '₹'}
                {displayMrp}
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {onAddToCart && (
            <button
              onClick={onAddToCart}
              className="flex-1 px-3 py-2 bg-violet-50 text-violet-600 rounded-lg font-semibold text-xs hover:bg-violet-100 transition border border-violet-200"
            >
              Add Cart
            </button>
          )}
          {onBook && (
            <button
              onClick={onBook}
              className="flex-1 px-3 py-2 bg-violet-600 text-white rounded-lg font-semibold text-xs hover:bg-violet-700 transition"
            >
              Book Now
            </button>
          )}
          {!onBook && !onAddToCart && (
            <button className="flex-1 px-3 py-2 bg-violet-600 text-white rounded-lg font-semibold text-xs hover:bg-violet-700 transition">
              Learn More
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
