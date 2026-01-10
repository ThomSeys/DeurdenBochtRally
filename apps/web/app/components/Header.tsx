import { Link, useLocation, Form } from '@remix-run/react';
import { useState, useEffect, useRef } from 'react';
import type { Database } from '~/lib/database.types';

type Participant = Database['public']['Tables']['participants']['Row'];

interface HeaderProps {
  user?: Participant | null;
}

export function Header({ user }: HeaderProps) {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
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
            <Link
              to="/contact"
              className={`font-black uppercase text-base xl:text-lg tracking-wide transition-all duration-200 pb-1 border-b-4 ${
                location.pathname === '/contact' 
                  ? 'text-white border-white' 
                  : 'text-brand-100 border-transparent hover:text-white hover:border-white'
              }`}
            >
              Contact
            </Link>
            
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="relative flex items-center space-x-3 bg-white text-brand-600 font-black uppercase text-base px-8 py-4 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 overflow-hidden group"
                >
                  <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out"></span>
                  <span className="relative z-10">{user.first_name}</span>
                  <svg
                    className={`w-5 h-5 transition-all duration-300 relative z-10 ${isUserMenuOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-2xl border-4 border-brand-600 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                    <Link
                      to="/dashboard"
                      className="block px-6 py-4 text-brand-600 font-black uppercase text-sm hover:bg-brand-50 hover:translate-x-1 transition-all duration-200 border-b-2 border-brand-100"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      📊 Dashboard
                    </Link>
                    <Link
                      to="/rally"
                      className="block px-6 py-4 text-brand-600 font-black uppercase text-sm hover:bg-brand-50 hover:translate-x-1 transition-all duration-200 border-b-2 border-brand-100"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      🏁 Rally Zones
                    </Link>
                    <Form method="post" action="/logout">
                      <button
                        type="submit"
                        className="w-full text-left px-6 py-4 text-red-600 font-black uppercase text-sm hover:bg-red-50 hover:translate-x-1 transition-all duration-200"
                      >
                        🚪 Uitloggen
                      </button>
                    </Form>
                  </div>
                )}
              </div>
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
                  className="relative bg-white text-brand-600 font-black uppercase text-base px-8 py-4 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 overflow-hidden group"
                >
                  <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out"></span>
                  <span className="relative z-10">Inschrijven</span>
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
              <Link
                to="/contact"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`font-black uppercase text-lg tracking-wide transition-all duration-200 py-3 border-l-4 pl-4 ${
                  location.pathname === '/contact' 
                    ? 'text-white border-white bg-brand-700' 
                    : 'text-brand-100 border-transparent hover:text-white hover:border-white hover:bg-brand-700'
                }`}
              >
                Contact
              </Link>
              
              {user ? (
                <>
                  <div className="pt-4 pb-2 px-4 border-t-2 border-brand-500">
                    <div className="text-white font-black uppercase text-sm tracking-wider mb-2">
                      👤 {user.first_name} {user.last_name}
                    </div>
                  </div>
                  <Link
                    to="/dashboard"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`font-black uppercase text-lg tracking-wide transition-all duration-200 py-3 border-l-4 pl-4 ${
                      location.pathname.startsWith('/dashboard') 
                        ? 'text-white border-white bg-brand-700' 
                        : 'text-brand-100 border-transparent hover:text-white hover:border-white hover:bg-brand-700'
                    }`}
                  >
                    📊 Dashboard
                  </Link>
                  <Link
                    to="/rally"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`font-black uppercase text-lg tracking-wide transition-all duration-200 py-3 border-l-4 pl-4 ${
                      location.pathname === '/rally' 
                        ? 'text-white border-white bg-brand-700' 
                        : 'text-brand-100 border-transparent hover:text-white hover:border-white hover:bg-brand-700'
                    }`}
                  >
                    🏁 Rally Zones
                  </Link>
                  <Form method="post" action="/logout">
                    <button
                      type="submit"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="w-full bg-white text-brand-600 font-black uppercase text-base px-6 py-4 hover:bg-brand-50 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 text-center mx-4 mt-2"
                    >
                      🚪 Uitloggen
                    </button>
                  </Form>
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
                    className="bg-white text-brand-600 font-black uppercase text-base px-6 py-4 hover:bg-brand-50 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 text-center mx-4"
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
