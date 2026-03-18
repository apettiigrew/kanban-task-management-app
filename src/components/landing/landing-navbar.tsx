"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, LayoutDashboard } from "lucide-react";

interface NavLink {
  label: string;
  href: string;
}

const NAV_LINKS: NavLink[] = [
  // { label: "Features", href: "#features" }
];

export function LandingNavbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleToggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);
  const handleCloseMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="flex items-center gap-2 text-blue-700 font-bold text-xl"
              aria-label="Kanban home"
            >
              <LayoutDashboard className="w-6 h-6" aria-hidden="true" />
              <span>Kanban</span>
            </Link>

            <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-700 hover:text-slate-900 px-4 py-2 rounded-md transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="text-sm font-medium bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-md transition-colors"
            >
              Sign up — it&apos;s free
            </Link>
          </div>

          <button
            className="md:hidden p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            onClick={handleToggleMobileMenu}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Menu className="w-5 h-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 pb-4 pt-2">
          <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-slate-600 hover:text-slate-900 py-2 px-2 rounded-md hover:bg-slate-50 transition-colors"
                onClick={handleCloseMobileMenu}
              >
                {link.label}
              </Link>
            ))}
            <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-slate-100">
              <Link
                href="/login"
                className="text-sm font-medium text-slate-700 hover:text-slate-900 py-2 px-2 rounded-md hover:bg-slate-50 transition-colors text-center"
                onClick={handleCloseMobileMenu}
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="text-sm font-medium bg-blue-700 hover:bg-blue-800 text-white py-2 px-4 rounded-md transition-colors text-center"
                onClick={handleCloseMobileMenu}
              >
                Sign up — it&apos;s free
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
