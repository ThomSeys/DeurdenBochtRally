import { Link, useLocation } from '@remix-run/react';
import { useState } from 'react';
import type { Database } from '~/lib/database.types';

type Participant = Database['public']['Tables']['participants']['Row'];

interface HeaderProps {
  user?: Participant | null;
}

export function Header({ user }: HeaderProps) {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  return (
    <header className="bg-brand-600 shadow-xl sticky top-0 z-50">
      <nav className="container-custom">
        <div className="flex items-center justify-between h-24 md:h-28">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 md:space-x-4 group">
            <div className="bg-white rounded-full p-3 md:p-4 shadow-lg group-hover:scale-110 transition-transform">
              <span className="text-3xl md:text-4xl">🏍</span>
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-display font-black text-white uppercase leading-none">
                DEUR DEN BOCHT
              </h1>
              <p className="text-xs md:text-sm text-brand-100 uppercase tracking-wider font-bold -mt-1">
                Den Bochtenkoning Rally
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8 xl:gap-10">
            <Link
              to="/"
              className={`font-black uppercase text-base xl:text-lg tracking-wide transition-all duration-200 pb-1 border-b-4 ${
                location.pathname === '/' 
                  ? 'text-white border-white' 
                  : 'text-brand-100 border-transparent hover:text-white hover:border-white'
              }`}
            >
              Home
            </Link>
            <Link
              to="/about"
              className={`font-black uppercase text-base xl:text-lg tracking-wide transition-all duration-200 pb-1 border-b-4 ${
                location.pathname === '/about' 
                  ? 'text-white border-white' 
                  : 'text-brand-100 border-transparent hover:text-white hover:border-white'
              }`}
            >
              Over het Event
            </Link>
            
            {user ? (
              <>
                <Link
                  to="/rally"
                  className={`font-black uppercase text-base xl:text-lg tracking-wide transition-all duration-200 pb-1 border-b-4 ${
                    location.pathname === '/rally' 
                      ? 'text-white border-white' 
                      : 'text-brand-100 border-transparent hover:text-white hover:border-white'
                  }`}
                >
                  Rally Zones
                </Link>
                <Link
                  to="/dashboard"
                  className={`font-black uppercase text-base xl:text-lg tracking-wide transition-all duration-200 pb-1 border-b-4 ${
                    location.pathname.startsWith('/dashboard') 
                      ? 'text-white border-white' 
                      : 'text-brand-100 border-transparent hover:text-white hover:border-white'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/logout"
                  className="bg-white text-brand-600 font-black uppercase text-base px-8 py-4 hover:bg-brand-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Uitloggen
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className={`font-black uppercase text-base xl:text-lg tracking-wide transition-all duration-200 pb-1 border-b-4 ${
                    location.pathname === '/login'
                      ? 'text-white border-white' 
                      : 'text-brand-100 border-transparent hover:text-white hover:border-white'
                  }`}
                >
                  Inloggen
                </Link>
                <Link
                  to="/registration"
                  className="bg-white text-brand-600 font-black uppercase text-base px-8 py-4 hover:bg-brand-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Inschrijven
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-white"
            aria-label="Toggle menu"
          >
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="lg:hidden pb-6">
            <div className="flex flex-col space-y-4">
              <Link
                to="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`font-black uppercase text-lg tracking-wide transition-all duration-200 py-3 border-l-4 pl-4 ${
                  location.pathname === '/' 
                    ? 'text-white border-white bg-brand-700' 
                    : 'text-brand-100 border-transparent hover:text-white hover:border-white hover:bg-brand-700'
                }`}
              >
                Home
              </Link>
              <Link
                to="/about"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`font-black uppercase text-lg tracking-wide transition-all duration-200 py-3 border-l-4 pl-4 ${
                  location.pathname === '/about' 
                    ? 'text-white border-white bg-brand-700' 
                    : 'text-brand-100 border-transparent hover:text-white hover:border-white hover:bg-brand-700'
                }`}
              >
                Over het Event
              </Link>
              
              {user ? (
                <>
                  <Link
                    to="/rally"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`font-black uppercase text-lg tracking-wide transition-all duration-200 py-3 border-l-4 pl-4 ${
                      location.pathname === '/rally' 
                        ? 'text-white border-white bg-brand-700' 
                        : 'text-brand-100 border-transparent hover:text-white hover:border-white hover:bg-brand-700'
                    }`}
                  >
                    Rally Zones
                  </Link>
                  <Link
                    to="/dashboard"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`font-black uppercase text-lg tracking-wide transition-all duration-200 py-3 border-l-4 pl-4 ${
                      location.pathname.startsWith('/dashboard') 
                        ? 'text-white border-white bg-brand-700' 
                        : 'text-brand-100 border-transparent hover:text-white hover:border-white hover:bg-brand-700'
                    }`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/logout"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="bg-white text-brand-600 font-black uppercase text-base px-6 py-4 hover:bg-brand-50 transition-all duration-200 shadow-lg text-center mx-4"
                  >
                    Uitloggen
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`font-black uppercase text-lg tracking-wide transition-all duration-200 py-3 border-l-4 pl-4 ${
                      location.pathname === '/login'
                        ? 'text-white border-white bg-brand-700' 
                        : 'text-brand-100 border-transparent hover:text-white hover:border-white hover:bg-brand-700'
                    }`}
                  >
                    Inloggen
                  </Link>
                  <Link
                    to="/registration"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="bg-white text-brand-600 font-black uppercase text-base px-6 py-4 hover:bg-brand-50 transition-all duration-200 shadow-lg text-center mx-4"
                  >
                    Inschrijven
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
