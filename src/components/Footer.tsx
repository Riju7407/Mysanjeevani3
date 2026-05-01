'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-16">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-8 mb-8">
          {/* About Section */}
          <div className="lg:col-span-2">
            <h3 className="text-lg font-bold mb-4 text-emerald-400">MySanjeevni</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              India's trusted healthcare platform providing medicines, health products, and wellness solutions.
            </p>
            <div className="flex gap-3 mt-4">
              <a href="https://www.instagram.com/mysanjeevni21_/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-500 transition-colors">
                <span className="sr-only">Instagram</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill="none" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z" fill="none" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="17" cy="7" r="1" fill="currentColor"/>
                </svg>
              </a>
              <a href="https://wa.me/9555753336" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-green-500 transition-colors">
                <span className="sr-only">WhatsApp</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 22c-5.523 0-10-4.477-10-10S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" fill="#25D366"/>
                  <path d="M12.021 18.381c-3.52 0-6.381-2.861-6.381-6.381 0-3.52 2.861-6.381 6.381-6.381 3.52 0 6.381 2.861 6.381 6.381 0 3.52-2.861 6.381-6.381 6.381zm0-11.601c-2.862 0-5.22 2.358-5.22 5.22s2.358 5.22 5.22 5.22 5.22-2.358 5.22-5.22-2.358-5.22-5.22-5.22z" fill="#25D366"/>
                  <path d="M15.572 13.944c-.19-.095-1.124-.555-1.298-.618-.174-.063-.3-.095-.427.095-.127.19-.491.617-.601.745-.11.127-.221.143-.411.048-.19-.095-.803-.296-.534-1.18.191-.511.512-.826 1.019-.968.506-.143 1.354-.222 2.032.555.678.777.222 1.544-.063 1.815-.286.27-.77.429-1.127.329z" fill="white"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="text-sm font-bold mb-4 text-gray-200">COMPANY</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link href="/about" className="hover:text-white">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/careers" className="hover:text-white">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/press" className="hover:text-white">
                  Press
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-white">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-sm font-bold mb-4 text-gray-200">CUSTOMER SERVICE</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link href="/help" className="hover:text-white">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/track" className="hover:text-white">
                  Track Order
                </Link>
              </li>
              <li>
                <Link href="/returns" className="hover:text-white">
                  Returns
                </Link>
              </li>
            </ul>
          </div>

          {/* Policies */}
          <div>
            <h4 className="text-sm font-bold mb-4 text-gray-200">POLICIES</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link href="/privacy" className="hover:text-white">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/disclaimer" className="hover:text-white">
                  Disclaimer
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="hover:text-white">
                  Shipping Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Information */}
          <div>
            <h4 className="text-sm font-bold mb-4 text-gray-200">CONTACT US</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <a href="mailto:MYSANJEEVNI3693@GMAIL.COM" className="hover:text-white break-all">
                  MYSANJEEVNI3693@GMAIL.COM
                </a>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <a href="tel:9289996241" className="hover:text-white">
                  9289996241
                </a>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="break-words">L-2/51 A, New Mahavir Nagar, Opp. Kangra Niketan, New Delhi-110018</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Footer */}
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3 text-center md:text-left">
            <p className="text-gray-400 text-sm break-words">
              © 2026 MySanjeevni. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
