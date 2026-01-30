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
    <header className={`${isTransparent ? 'bg-transparent backdrop-blur-lg border-b border-white/10' : 'bg-gradient-to-tr from-primary-900 via-primary-600 to-primary-400'} ${fixed ? 'fixed' : 'sticky'} top-0 left-0 right-0 z-[1100] transition-all duration-300`}>
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
            <img src="/logo.svg" alt="Deur Den Bocht Logo" className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0" style={{ filter: 'brightness(0) invert(1)' }} />
            <div className={`${isTransparent ? 'text-white' : 'text-white'}`}>
              <div className={`font-bold text-sm sm:text-lg tracking-wide uppercase whitespace-nowrap ${isTransparent ? 'drop-shadow-lg' : ''}`}>Den Bochtenkoning</div>
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
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className={`flex items-center space-x-2 text-sm font-semibold uppercase tracking-wide transition-colors ${isTransparent ? 'text-white drop-shadow-md hover:text-primary-100' : 'text-white hover:text-primary-100'}`}
                >
                  <span>{user.first_name}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
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
      </nav>

      {/* Desktop User Menu Flyout */}
      <>
        <div
          className={`fixed inset-0 bg-black/30 backdrop-blur-sm z-[1100] transition-opacity duration-300 ${userMenuOpen && user ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          onClick={() => setUserMenuOpen(false)}
        />
        {user && (
          <div className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-[1110] transform transition-transform duration-300 ease-out ${userMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <Icon name="user" className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{user.first_name} {user.last_name}</h3>
                    <p className="text-gray-500 text-sm">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setUserMenuOpen(false)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <Icon name="x" className="w-6 h-6" />
                </button>
              </div>

              {/* Navigation */}
              <div className="flex-1 overflow-y-auto py-4">
                <div className="px-2 space-y-1">
                  {user.route_preference !== 'scenic' && (
                    <Link
                      to="/rally"
                      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-primary-50 hover:text-primary-700 rounded-lg transition-colors font-medium"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <Icon name="target" className="w-5 h-5" />
                      <span>Rally Zones</span>
                    </Link>
                  )}
                  <Link
                    to="/live-map"
                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-primary-50 hover:text-primary-700 rounded-lg transition-colors font-medium"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <Icon name="map" className="w-5 h-5" />
                    <span>Live Kaart</span>
                  </Link>
                  <Link
                    to="/dashboard"
                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-primary-50 hover:text-primary-700 rounded-lg transition-colors font-medium"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <Icon name="chart" className="w-5 h-5" />
                    <span>Dashboard</span>
                  </Link>
                </div>

                {/* Emergency Button */}
                <div className="px-2 mt-4 pt-4 border-t border-gray-200">
                  <button
                    className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium w-full"
                    onClick={() => {
                      setUserMenuOpen(false);
                      const event = new CustomEvent('trigger-emergency-sos');
                      window.dispatchEvent(event);
                    }}
                  >
                    <Icon name="alert-triangle" className="w-5 h-5" />
                    <span>Noodknop</span>
                  </button>
                </div>

                {/* Admin Link */}
                {user.is_admin && (
                  <div className="px-2 mt-2">
                    <Link
                      to="/admin"
                      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-amber-50 hover:text-amber-700 rounded-lg transition-colors font-medium"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <Icon name="shield" className="w-5 h-5" />
                      <span>Admin Panel</span>
                    </Link>
                  </div>
                )}
              </div>

              {/* Footer / Logout */}
              <div className="border-t border-gray-200 p-4">
                <Form method="post" action="/logout">
                  <button
                    type="submit"
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                  >
                    <Icon name="door" className="w-5 h-5" />
                    <span>Uitloggen</span>
                  </button>
                </Form>
              </div>
            </div>
          </div>
        )}
      </>

      {/* Mobile Menu Flyout */}
      <>
        <div
          className={`fixed inset-0 bg-black/30 backdrop-blur-sm z-[1100] md:hidden transition-opacity duration-300 ${mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          onClick={() => setMobileMenuOpen(false)}
        />
        <div className={`fixed top-0 right-0 h-[100vh] w-80 max-w-[85vw] bg-white shadow-2xl z-[1110] transform transition-transform duration-300 ease-out md:hidden ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="bg-gradient-to-br from-primary-600 to-primary-700 border-b border-gray-200 p-6 flex items-center justify-between">
                {user ? (
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                      <Icon name="user" className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">{user.first_name}</h3>
                      <p className="text-primary-100 text-sm">{user.email}</p>
                    </div>
                  </div>
                ) : (
                  <h3 className="font-bold text-gray-900 text-lg">Menu</h3>
                )}
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <Icon name="x" className="w-6 h-6" />
                </button>
              </div>

              {/* Navigation */}
              <div className="flex-1 overflow-y-auto py-4">
                <div className="px-2 space-y-1">
                  <Link
                    to="/"
                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-primary-50 hover:text-primary-700 rounded-lg transition-colors font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Icon name="home" className="w-5 h-5" />
                    <span>Home</span>
                  </Link>
                  <Link
                    to="/about"
                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-primary-50 hover:text-primary-700 rounded-lg transition-colors font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Icon name="info" className="w-5 h-5" />
                    <span>Over het event</span>
                  </Link>

                  {user ? (
                    <>
                      <div className="my-4 border-t border-gray-200" />
                      {user.route_preference !== 'scenic' && (
                        <Link
                          to="/rally"
                          className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-primary-50 hover:text-primary-700 rounded-lg transition-colors font-medium"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Icon name="target" className="w-5 h-5" />
                          <span>Rally Zones</span>
                        </Link>
                      )}
                      <Link
                        to="/live-map"
                        className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-primary-50 hover:text-primary-700 rounded-lg transition-colors font-medium"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Icon name="map" className="w-5 h-5" />
                        <span>Live Kaart</span>
                      </Link>
                      <Link
                        to="/dashboard"
                        className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-primary-50 hover:text-primary-700 rounded-lg transition-colors font-medium"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Icon name="chart" className="w-5 h-5" />
                        <span>Dashboard</span>
                      </Link>

                      {/* Emergency Button */}
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <button
                          className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium w-full"
                          onClick={() => {
                            setMobileMenuOpen(false);
                            const event = new CustomEvent('trigger-emergency-sos');
                            window.dispatchEvent(event);
                          }}
                        >
                          <Icon name="alert-triangle" className="w-5 h-5" />
                          <span>Noodknop</span>
                        </button>
                      </div>

                      {/* Admin Link */}
                      {user.is_admin && (
                        <div className="mt-2">
                          <Link
                            to="/admin"
                            className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-amber-50 hover:text-amber-700 rounded-lg transition-colors font-medium"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <Icon name="shield" className="w-5 h-5" />
                            <span>Admin Panel</span>
                          </Link>
                        </div>
                      )}
                    </>
                  ) : null}
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-gray-200 p-4">
                {user ? (
                  <Form method="post" action="/logout">
                    <button
                      type="submit"
                      className="flex items-center justify-center gap-2 w-full px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                    >
                      <Icon name="door" className="w-5 h-5" />
                      <span>Uitloggen</span>
                    </button>
                  </Form>
                ) : (
                  <div className="space-y-2">
                    <Link
                      to="/login"
                      className="flex items-center justify-center w-full px-4 py-3 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors font-semibold border-2 border-primary-600"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Inloggen
                    </Link>
                    <Link
                      to="/registration"
                      className="flex items-center justify-center w-full px-4 py-3 bg-primary-600 text-white hover:bg-primary-700 rounded-lg transition-colors font-bold shadow-md"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Inschrijven
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
    </header>
  );
}
