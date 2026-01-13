import { Link, useMatches, Form } from 'react-router';
import { useState } from 'react';

export default function Header() {
  const matches = useMatches();
  const rootMatch = matches.find(m => m.id === 'root');
  const user = (rootMatch?.data as any)?.user;
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-primary-600 shadow-lg sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="bg-white rounded-full p-2 w-12 h-12 flex items-center justify-center">
              <span className="text-2xl">🏍</span>
            </div>
            <div className="text-white">
              <div className="font-bold text-xl tracking-wide uppercase">Deur Den Bocht</div>
              <div className="text-xs text-primary-100 uppercase">Den Bochtenkoning Rally</div>
            </div>
          </Link>

          {/* Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className="text-white hover:text-primary-100 text-sm font-semibold uppercase tracking-wide transition-colors"
            >
              Home
            </Link>
            <Link
              to="/about"
              className="text-white hover:text-primary-100 text-sm font-semibold uppercase tracking-wide transition-colors"
            >
              Over het event
            </Link>
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 text-white hover:text-primary-100 text-sm font-semibold uppercase tracking-wide transition-colors"
                >
                  <span>{user.first_name}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
                      <Link
                        to="/rally"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Rally Zones
                      </Link>
                      <Link
                        to="/live-map"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        🗺️ Live Kaart
                      </Link>
                      <Link
                        to="/dashboard"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Dashboard
                      </Link>
                      {user.is_admin && (
                        <Link
                          to="/admin"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-t"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          Admin
                        </Link>
                      )}
                      <Form method="post" action="/logout">
                        <button
                          type="submit"
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Uitloggen
                        </button>
                      </Form>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-white hover:text-primary-100 text-sm font-semibold uppercase tracking-wide transition-colors"
                >
                  Inloggen
                </Link>
                <Link
                  to="/registration"
                  className="bg-white text-primary-600 hover:bg-primary-50 px-6 py-2.5 rounded font-bold uppercase tracking-wide text-sm transition-colors shadow-md"
                >
                  Inschrijven
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-white p-2"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-primary-700">
            <div className="flex flex-col space-y-3">
              <Link
                to="/"
                className="text-white hover:text-primary-100 text-sm font-semibold uppercase tracking-wide transition-colors px-4 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/about"
                className="text-white hover:text-primary-100 text-sm font-semibold uppercase tracking-wide transition-colors px-4 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Over het event
              </Link>
              {user ? (
                <>
                  <Link
                    to="/rally"
                    className="text-white hover:text-primary-100 text-sm font-semibold uppercase tracking-wide transition-colors px-4 py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Rally Zones
                  </Link>
                  <Link
                    to="/live-map"
                    className="text-white hover:text-primary-100 text-sm font-semibold uppercase tracking-wide transition-colors px-4 py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    🗺️ Live Kaart
                  </Link>
                  <Link
                    to="/dashboard"
                    className="text-white hover:text-primary-100 text-sm font-semibold uppercase tracking-wide transition-colors px-4 py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  {user.is_admin && (
                    <Link
                      to="/admin"
                      className="text-white hover:text-primary-100 text-sm font-semibold uppercase tracking-wide transition-colors px-4 py-2 border-t border-primary-700"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Admin
                    </Link>
                  )}
                  <Form method="post" action="/logout" className="border-t border-primary-700 pt-3">
                    <button
                      type="submit"
                      className="text-white hover:text-primary-100 text-sm font-semibold uppercase tracking-wide transition-colors px-4 py-2 w-full text-left"
                    >
                      Uitloggen
                    </button>
                  </Form>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-white hover:text-primary-100 text-sm font-semibold uppercase tracking-wide transition-colors px-4 py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Inloggen
                  </Link>
                  <Link
                    to="/registration"
                    className="bg-white text-primary-600 hover:bg-primary-50 mx-4 px-6 py-2.5 rounded font-bold uppercase tracking-wide text-sm transition-colors shadow-md text-center"
                    onClick={() => setMobileMenuOpen(false)}
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
