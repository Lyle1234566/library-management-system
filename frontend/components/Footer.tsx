'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { MouseEvent } from 'react';

export default function Footer() {
  const pathname = usePathname();

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleQuickLinkClick = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (pathname !== href) {
      return;
    }

    event.preventDefault();
    scrollToTop();
  };

  return (
    <footer className="border-t border-line bg-[linear-gradient(180deg,rgba(255,255,255,0.72)_0%,rgba(237,245,255,0.94)_100%)] text-ink">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="mb-4 flex items-center space-x-2">
              <div className="relative h-14 w-14 overflow-hidden rounded-xl border border-line bg-white">
                <Image
                  src="/logo%20lib.png"
                  alt="SCSIT Digital Library logo"
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              </div>
              <span className="text-xl font-semibold">SCSIT Digital Library</span>
            </div>
            <p className="max-w-md text-ink-muted">
              A comprehensive library management system designed to streamline book
              management, user tracking, and borrowing processes for modern libraries.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/books"
                  onClick={(event) => handleQuickLinkClick(event, '/books')}
                  className="text-ink-muted transition-colors hover:text-[color:var(--accent-strong)]"
                >
                  Browse Books
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  onClick={(event) => handleQuickLinkClick(event, '/about')}
                  className="text-ink-muted transition-colors hover:text-[color:var(--accent-strong)]"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/features"
                  onClick={(event) => handleQuickLinkClick(event, '/features')}
                  className="text-ink-muted transition-colors hover:text-[color:var(--accent-strong)]"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  onClick={(event) => handleQuickLinkClick(event, '/contact')}
                  className="text-ink-muted transition-colors hover:text-[color:var(--accent-strong)]"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  onClick={(event) => handleQuickLinkClick(event, '/faq')}
                  className="text-ink-muted transition-colors hover:text-[color:var(--accent-strong)]"
                >
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-2 text-ink-muted">
              <li className="flex items-start space-x-2">
                <svg
                  className="mt-0.5 h-5 w-5 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <span className="break-all">SalazarLibrary@gmail.com</span>
              </li>
              <li className="flex items-start space-x-2">
                <svg
                  className="mt-0.5 h-5 w-5 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                <span>+63 9696123641</span>
              </li>
              <li className="flex items-start space-x-2">
                <svg
                  className="mt-0.5 h-5 w-5 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span className="text-sm leading-6">211 Natalio B. Bacalso Ave, Cebu City, 6000 Cebu</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-line pt-8 md:flex-row md:items-center">
          <p className="text-sm text-ink-muted">
            (c) {new Date().getFullYear()} SCSIT Digital Library. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <Link
              href="/privacy"
              className="text-sm text-ink-muted transition-colors hover:text-[color:var(--accent-strong)]"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-sm text-ink-muted transition-colors hover:text-[color:var(--accent-strong)]"
            >
              Terms of Service
            </Link>
            <button
              onClick={scrollToTop}
              className="flex items-center gap-2 text-sm text-ink-muted transition-all hover:scale-105 hover:text-[color:var(--accent-strong)]"
              aria-label="Scroll to top"
            >
              <span>Back to Top</span>
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 10l7-7m0 0l7 7m-7-7v18"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
