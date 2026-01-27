import { Link, useMatches, Form } from 'react-router';
import { useState, useEffect } from 'react';
import { NotificationBell } from './NotificationBell';
import { Icon } from '~/components/Icon';
import { EmergencySOSButton } from './EmergencySOSButton';

export default function Header({ transparent, fixed }: { transparent?: boolean; fixed?: boolean }) {
  const matches = useMatches();
  const rootMatch = matches.find(m => m.id === 'root');
  const user = (rootMatch?.data as any)?.user;
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 250);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isClient]);

  const isTransparent = transparent && !isScrolled && isClient;

  return (
    <header className={`${isTransparent ? 'bg-transparent backdrop-blur-lg border-b border-white/10' : 'bg-primary-600 shadow-lg'} ${fixed ? 'fixed' : 'sticky'} top-0 left-0 right-0 z-[1100] transition-all duration-300`}>
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
            <img src="/logo.svg" alt="Deur Den Bocht Logo" className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0" style={{ filter: 'brightness(0) invert(1)' }} />
            <div className={`${isTransparent ? 'text-white' : 'text-white'}`}>
              <div className={`font-bold text-sm sm:text-lg tracking-wide uppercase whitespace-nowrap ${isTransparent ? 'drop-shadow-lg' : ''}`}>Deur Den Bocht</div>
              <div className={`text-xs leading-tight uppercase whitespace-nowrap ${isTransparent ? 'text-white/90 drop-shadow-lg' : 'text-primary-100'}`}>Rally</div>
            </div>
          </Link>

          {/* Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              to="/"
              className={`text-sm font-semibold uppercase tracking-wide transition-colors ${isTransparent ? 'text-white drop-shadow-md hover:text-primary-100' : 'text-white hover:text-primary-100'}`}
            >
              Home
            </Link>
            <Link
              to="/about"
              className={`text-sm font-semibold uppercase tracking-wide transition-colors ${isTransparent ? 'text-white drop-shadow-md hover:text-primary-100' : 'text-white hover:text-primary-100'}`}
            >
              Over het event
            </Link>
            {user ? (
              <>
                <NotificationBell isTransparent={isTransparent} />
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className={`flex items-center space-x-2 text-sm font-semibold uppercase tracking-wide transition-colors ${isTransparent ? 'text-white drop-shadow-md hover:text-primary-100' : 'text-white hover:text-primary-100'}`}
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
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-sm shadow-lg py-2 z-50">
                      {user.route_preference !== 'complete_route' && (
                        <Link
                          to="/rally"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 font-semibold border-b-2 border-primary-200"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <Icon name="target" className="w-4 h-4" />
                          Rally Zones
                        </Link>
                      )}
                      <Link
                        to="/live-map"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Icon name="map" className="w-4 h-4" />
                        Live Kaart
                      </Link>
                      <Link
                        to="/dashboard"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Icon name="chart" className="w-4 h-4" />
                        Dashboard
                      </Link>
                      <button
                        className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left border-t"
                        onClick={() => {
                          setUserMenuOpen(false);
                          const event = new CustomEvent('trigger-emergency-sos');
                          window.dispatchEvent(event);
                        }}
                      >
                        <Icon name="alert-triangle" className="w-4 h-4" />
                        Noodknop
                      </button>
                      {user.is_admin && (
                        <Link
                          to="/admin"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-t"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <Icon name="shield" className="w-4 h-4" />
                          Admin
                        </Link>
                      )}
                      <Form method="post" action="/logout">
                        <button
                          type="submit"
                          className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <Icon name="door" className="w-4 h-4" />
                          Uitloggen
                        </button>
                      </Form>
                    </div>
                  </>
                )}
                </div>
              </>
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

          {/* Mobile menu button and notification bell */}
          <div className="md:hidden flex items-center gap-2">
            <NotificationBell isTransparent={isTransparent} />
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
                className="flex items-center gap-2 text-white hover:text-primary-100 text-sm font-semibold uppercase tracking-wide transition-colors px-4 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Icon name="home" className="w-4 h-4" />
                Home
              </Link>
              <Link
                to="/about"
                className="flex items-center gap-2 text-white hover:text-primary-100 text-sm font-semibold uppercase tracking-wide transition-colors px-4 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Icon name="info" className="w-4 h-4" />
                Over het event
              </Link>
              {user ? (
                <>
                  {user.route_preference !== 'complete_route' && (
                    <Link
                      to="/rally"
                      className="flex items-center gap-2 text-white hover:text-primary-100 text-sm font-semibold uppercase tracking-wide transition-colors px-4 py-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Icon name="target" className="w-4 h-4" />
                      Rally Zones
                    </Link>
                  )}
                  <Link
                    to="/live-map"
                    className="flex items-center gap-2 text-white hover:text-primary-100 text-sm font-semibold uppercase tracking-wide transition-colors px-4 py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Icon name="map" className="w-4 h-4" />
                    Live Kaart
                  </Link>
                  <Link
                    to="/dashboard"
                    className="flex items-center gap-2 text-white hover:text-primary-100 text-sm font-semibold uppercase tracking-wide transition-colors px-4 py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Icon name="chart" className="w-4 h-4" />
                    Dashboard
                  </Link>
                  <button
                    className="flex items-center gap-2 text-red-200 hover:text-red-100 text-sm font-semibold uppercase tracking-wide transition-colors px-4 py-2 w-full text-left border-t border-primary-700 pt-3"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      const event = new CustomEvent('trigger-emergency-sos');
                      window.dispatchEvent(event);
                    }}
                  >
                    <Icon name="alert-triangle" className="w-4 h-4" />
                    Noodknop
                  </button>
                  {user.is_admin && (
                    <Link
                      to="/admin"
                      className="mt-2 flex items-center gap-2 text-white hover:text-primary-100 text-sm font-semibold uppercase tracking-wide transition-colors px-4 py-2 pt-4 border-t border-primary-700"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Icon name="shield" className="w-4 h-4" />
                      Admin
                    </Link>
                  )}
                  <Form method="post" action="/logout" className="border-t border-primary-700 pt-3">
                    <button
                      type="submit"
                      className="flex items-center gap-2 text-white hover:text-primary-100 text-sm font-semibold uppercase tracking-wide transition-colors px-4 py-2 w-full text-left"
                    >
                      <Icon name="door" className="w-4 h-4" />
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
