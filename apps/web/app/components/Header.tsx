import { Link, useMatches, Form, useFetcher } from 'react-router';
import { useState, useEffect } from 'react';
import { NotificationBell } from './NotificationBell';
import { Icon } from '~/components/Icon';
import { EmergencySOSButton } from './EmergencySOSButton';
import LiveTrackingToggle from './LiveTrackingToggle';
import { useFeatureFlags } from '~/contexts/FeatureFlagsContext';
import { startMasterTour } from './MasterTour';

type AdminMenuStats = {
  urgent: {
    emergencySOSCount: number;
    pendingChallengesCount: number;
  };
  stats: {
    totalParticipants: number;
    checkedInParticipants: number;
    paidParticipants: number;
  };
  teasers: {
    pendingScansCount: number;
    fallbackReviewCount: number;
    pendingPhotosCount: number;
    pendingStoriesCount: number;
    activeBuddyGroupsCount: number;
    totalAchievementsCount: number;
    totalAlbumsCount: number;
    totalSOSCount: number;
    totalChallengesCount: number;
    totalStoriesCount: number;
    totalRevenue: number;
    openZonesCount: number;
    totalZonesCount: number;
    activeMarkersCount: number;
    totalMarkersCount: number;
  };
};

// Admin Menu with flyout submenu categories
function AdminMenuSection({ onClose, stats }: { onClose: () => void; stats?: AdminMenuStats }) {
  const [submenuOpen, setSubmenuOpen] = useState<string | null>(null);

  const adminCategories = {
    urgent: {
      title: 'Kritiek & Live',
      icon: 'alert-triangle',
      color: 'text-red-600 hover:bg-red-50',
      items: [
        { to: '/admin/emergency-alerts', label: 'Nood SOS', icon: 'alert-triangle' },
        { to: '/admin/check-in', label: 'Check-in', icon: 'check' },
        { to: '/admin/zone-control', label: 'Zone Control', icon: 'target' },
        { to: '/admin/manual-scan', label: 'Manual Scan', icon: 'document' },
        { to: '/admin/event-dashboard', label: 'Event Dashboard', icon: 'activity' },
      ]
    },
    moderation: {
      title: 'Moderatie & Validatie',
      icon: 'check-square',
      color: 'text-blue-600 hover:bg-blue-50',
      items: [
        { to: '/admin/pending-scans', label: 'Manual Validatie', icon: 'search' },
        { to: '/admin/fallback-review', label: 'Fallback Review', icon: 'clipboard' },
        { to: '/admin/challenges', label: 'Route Challenges', icon: 'check-square' },
        { to: '/admin/gallery', label: 'Foto Goedkeuring', icon: 'camera' },
        { to: '/admin/blog', label: 'Ride Stories', icon: 'book-open' },
      ]
    },
    management: {
      title: 'Beheer & Content',
      icon: 'folder',
      color: 'text-purple-600 hover:bg-purple-50',
      items: [
        { to: '/admin/event-markers', label: 'Event Markers', icon: 'map' },
        { to: '/admin/participants', label: 'Deelnemers', icon: 'users' },
        { to: '/admin/photo-albums', label: 'Event Albums', icon: 'folder' },
        { to: '/admin/emergency-contact-dashboard', label: 'Emergency Contacts', icon: 'phone' },
        { to: '/admin/event-checklist', label: 'Event Checklist', icon: 'check-square' },
      ]
    },
    engagement: {
      title: 'Communicatie & Gamification',
      icon: 'bell',
      color: 'text-orange-600 hover:bg-orange-50',
      items: [
        { to: '/admin/push-notifications', label: 'Push Notifications', icon: 'bell' },
        { to: '/admin/buddy-stats', label: 'Naftgenoten', icon: 'users' },
        { to: '/admin/achievements', label: 'Achievements', icon: 'award' },
      ]
    },
    system: {
      title: 'Rapporten & Systeem',
      icon: 'settings',
      color: 'text-gray-600 hover:bg-gray-50',
      items: [
        { to: '/admin/financial-report', label: 'Financieel Rapport', icon: 'dollar-sign' },
        { to: '/admin/settings', label: 'Settings', icon: 'settings' },
        { to: '/admin/logs', label: 'System Logs', icon: 'document-text' },
        { to: '/admin/prepare-edition', label: 'Nieuwe Editie', icon: 'refresh' },
      ]
    }
  };

  const toneClasses: Record<string, string> = {
    red: 'bg-red-100 text-red-700',
    orange: 'bg-orange-100 text-orange-700',
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
    gray: 'bg-gray-100 text-gray-700',
    purple: 'bg-purple-100 text-purple-700',
  };

  const renderBadge = (
    value: string | number | null | undefined,
    tone: keyof typeof toneClasses,
    always?: boolean
  ) => {
    if (value == null || (value === 0 && !always)) return null;

    return (
      <span className={`ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full ${toneClasses[tone]}`}>
        {value}
      </span>
    );
  };

  const badges: Record<string, ReturnType<typeof renderBadge>> = {
    '/admin/emergency-alerts': renderBadge(
      stats?.teasers?.totalSOSCount,
      (stats?.urgent?.emergencySOSCount || 0) > 0 ? 'red' : 'gray'
    ),
    '/admin/check-in': renderBadge(
      stats ? `${stats.stats.checkedInParticipants}/${stats.stats.totalParticipants}` : undefined,
      'blue',
      true
    ),
    '/admin/zone-control': renderBadge(
      stats ? `${stats.teasers.openZonesCount}/${stats.teasers.totalZonesCount}` : undefined,
      'blue',
      true
    ),
    '/admin/pending-scans': renderBadge(stats?.teasers?.pendingScansCount, 'orange'),
    '/admin/fallback-review': renderBadge(stats?.teasers?.fallbackReviewCount, 'orange'),
    '/admin/challenges': renderBadge(stats?.teasers?.totalChallengesCount, 'orange'),
    '/admin/gallery': renderBadge(stats?.teasers?.pendingPhotosCount, 'purple'),
    '/admin/blog': renderBadge(stats?.teasers?.totalStoriesCount, 'orange'),
    '/admin/event-markers': renderBadge(
      stats ? `${stats.teasers.activeMarkersCount}/${stats.teasers.totalMarkersCount}` : undefined,
      'blue',
      true
    ),
    '/admin/participants': renderBadge(stats?.stats?.totalParticipants, 'blue', true),
    '/admin/photo-albums': renderBadge(stats?.teasers?.totalAlbumsCount, 'gray'),
    '/admin/buddy-stats': renderBadge(stats?.teasers?.activeBuddyGroupsCount, 'purple'),
    '/admin/achievements': renderBadge(stats?.teasers?.totalAchievementsCount, 'purple'),
    '/admin/financial-report': renderBadge(
      stats ? `€${stats.teasers.totalRevenue.toLocaleString('nl-BE')}` : undefined,
      'green',
      true
    ),
  };

  return (
    <>
      {/* Main Admin Dashboard Link */}
      <Link
        to="/admin"
        className="flex items-center gap-3 px-4 py-3 text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors font-bold"
        onClick={onClose}
      >
        <Icon name="shield" className="w-5 h-5" />
        <span>Admin Dashboard</span>
      </Link>

      {/* Category Navigation */}
      <div className="mt-3 space-y-1">
        {Object.entries(adminCategories).map(([key, category]) => (
          <div key={key} className="relative">
            <button
              onClick={() => setSubmenuOpen(submenuOpen === key ? null : key)}
              className={`w-full flex items-center justify-between px-4 py-3 ${category.color} rounded-lg transition-colors font-medium text-left`}
            >
              <span className="flex items-center gap-2 text-sm">
                <Icon name={category.icon} className="w-4 h-4" />
                <span>{category.title}</span>
              </span>
              <svg
                className={`w-4 h-4 transition-transform ${submenuOpen === key ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Submenu Items */}
            {submenuOpen === key && (
              <div className="mt-1 ml-4 space-y-1 border-l-2 border-gray-200 pl-3">
                {category.items.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="flex items-center justify-between gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                    onClick={onClose}
                  >
                    <span className="flex items-center gap-2">
                      <Icon name={item.icon} className="w-4 h-4" />
                      <span>{item.label}</span>
                    </span>
                    {badges[item.to]}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

export default function Header({ transparent, fixed }: { transparent?: boolean; fixed?: boolean }) {
  const matches = useMatches();
  const rootMatch = matches.find(m => m.id === 'root');
  const user = (rootMatch?.data as any)?.user;
  const eventDate = (rootMatch?.data as any)?.eventDate || '2026-05-16';
  const { isEnabled } = useFeatureFlags();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const adminMenuStatsFetcher = useFetcher<AdminMenuStats>();
  const [isClient, setIsClient] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Feature flags
  const rallyZonesEnabled = isEnabled('rally-zones-enabled');
  const liveMapEnabled = isEnabled('live-map-enabled');
  const adminDashboardEnabled = isEnabled('admin-dashboard-enabled');
  const emergencySosEnabled = isEnabled('emergency-sos-enabled');
  const onboardingTourEnabled = isEnabled('onboarding-tour-enabled');

  // Check if live map should be visible (event day or admin)
  const isEventDay = new Date().toISOString().split('T')[0] === eventDate;
  const showLiveMap = liveMapEnabled && (isEventDay || user?.is_admin);

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

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (userMenuOpen || mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [userMenuOpen, mobileMenuOpen]);

  useEffect(() => {
    if (!user?.is_admin || !adminDashboardEnabled) return;
    if (!userMenuOpen && !mobileMenuOpen) return;

    adminMenuStatsFetcher.load('/api/admin-menu-stats');
  }, [userMenuOpen, mobileMenuOpen, user?.is_admin, adminDashboardEnabled]);

  const isTransparent = transparent && !isScrolled && isClient;

  return (
    <header className={`${isTransparent ? 'bg-transparent backdrop-blur-lg border-b border-white/10' : 'bg-gradient-to-tr from-primary-900 via-primary-600 to-primary-400'} ${fixed ? 'fixed' : 'sticky'} top-0 left-0 right-0 z-[1100] transition-all duration-300`}>
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
            <img src="/logo.svg" alt="Deur Den Bocht Logo" className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0" style={{ filter: 'brightness(0) invert(1)' }} />
            <div className={`${isTransparent ? 'text-white' : 'text-white'}`}>
              <div className={`font-bold text-sm sm:text-lg tracking-wide uppercase whitespace-nowrap ${isTransparent ? 'drop-shadow-lg' : ''}`}>Deur den Bocht</div>
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
                <div className="flex items-center gap-4">
                  <LiveTrackingToggle userId={user.id} isTransparent={isTransparent} />
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
      </nav>

      {/* Desktop User Menu Flyout */}
      <>
        <div
          className={`fixed inset-0 z-[1100] transition-opacity duration-300 ${userMenuOpen && user ? 'opacity-100' : 'opacity-0 pointer-events-none'} ${isTransparent ? 'bg-black/40 backdrop-blur-md h-[100vh]' : 'bg-black/30 backdrop-blur-sm'}`}
          onClick={() => setUserMenuOpen(false)}
        />
        {user && (
          <div className={`fixed top-0 right-0 h-screen w-80 shadow-2xl z-[1110] transform transition-transform duration-300 ease-out ${userMenuOpen ? 'translate-x-0' : 'translate-x-full'} bg-white`}>
            <div className="h-full flex flex-col bg-white">
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
                  {rallyZonesEnabled && user.route_preference !== 'scenic' && (
                    <Link
                      to="/rally"
                      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-primary-50 hover:text-primary-700 rounded-lg transition-colors font-medium"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <Icon name="target" className="w-5 h-5" />
                      <span>Rally Zones</span>
                    </Link>
                  )}
                  {showLiveMap && (
                    <Link
                      to="/live-map"
                      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-primary-50 hover:text-primary-700 rounded-lg transition-colors font-medium"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <Icon name="map" className="w-5 h-5" />
                      <span>Live Kaart</span>
                    </Link>
                  )}
                  <Link
                    to="/dashboard"
                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-primary-50 hover:text-primary-700 rounded-lg transition-colors font-medium"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <Icon name="chart" className="w-5 h-5" />
                    <span>Dashboard</span>
                  </Link>
                  <Link
                    to="/dashboard/profile-edit"
                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-primary-50 hover:text-primary-700 rounded-lg transition-colors font-medium"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <Icon name="user" className="w-5 h-5" />
                    <span>Mijn Profiel</span>
                  </Link>
                  
                  <Link
                    to="/dashboard/riding-buddies"
                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-primary-50 hover:text-primary-700 rounded-lg transition-colors font-medium"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <Icon name="users" className="w-5 h-5" />
                    <span>Naftgenoten</span>
                  </Link>
                  
                  {/* Help / Tour Button */}
                  {onboardingTourEnabled && (
                    <button
                      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-primary-50 hover:text-primary-700 rounded-lg transition-colors font-medium w-full text-left"
                      onClick={() => {
                        setUserMenuOpen(false);
                        startMasterTour();
                      }}
                    >
                      <Icon name="info" className="w-5 h-5" />
                      <span>Rondleiding</span>
                    </button>
                  )}
                </div>

                {/* Emergency Button */}
                {emergencySosEnabled && (
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
                )}

                {/* Admin Link */}
                {user.is_admin && adminDashboardEnabled && (
                  <div className="px-2 mt-4 pt-4 border-t border-gray-200">
                    <AdminMenuSection onClose={() => setUserMenuOpen(false)} stats={adminMenuStatsFetcher.data} />
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
          className={`fixed inset-0 z-[1100] md:hidden transition-opacity duration-300 ${mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'} ${isTransparent ? 'bg-black/40 backdrop-blur-md' : 'bg-black/30 backdrop-blur-sm'}`}
          onClick={() => setMobileMenuOpen(false)}
        />
        <div className={`fixed top-0 right-0 h-screen w-80 max-w-[85vw] shadow-2xl z-[1110] transform transition-transform duration-300 ease-out md:hidden ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'} bg-white`}>
            <div className="h-full flex flex-col bg-white">
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
                      {rallyZonesEnabled && user.route_preference !== 'scenic' && (
                        <Link
                          to="/rally"
                          className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-primary-50 hover:text-primary-700 rounded-lg transition-colors font-medium"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Icon name="target" className="w-5 h-5" />
                          <span>Rally Zones</span>
                        </Link>
                      )}
                      {showLiveMap && (
                        <>
                        <Link
                          to="/live-map"
                          className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-primary-50 hover:text-primary-700 rounded-lg transition-colors font-medium"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Icon name="map" className="w-5 h-5" />
                          <span>Live Kaart</span>
                        </Link>
                        <>{user && (
                          <div className="px-4">
                            <LiveTrackingToggle userId={user.id} isTransparent={false} />
                          </div>
                        )}</>
                        </>
                      )}
                      <Link
                        to="/dashboard"
                        className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-primary-50 hover:text-primary-700 rounded-lg transition-colors font-medium"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Icon name="chart" className="w-5 h-5" />
                        <span>Dashboard</span>
                      </Link>
                      <Link
                        to="/dashboard/profile-edit"
                        className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-primary-50 hover:text-primary-700 rounded-lg transition-colors font-medium"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Icon name="user" className="w-5 h-5" />
                        <span>Mijn Profiel</span>
                      </Link>
                      
                      <Link
                        to="/dashboard/riding-buddies"
                        className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-primary-50 hover:text-primary-700 rounded-lg transition-colors font-medium"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Icon name="users" className="w-5 h-5" />
                        <span>Naftgenoten</span>
                      </Link>
                      
                      {/* Help / Tour Button */}
                      {onboardingTourEnabled && (
                        <button
                          className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-primary-50 hover:text-primary-700 rounded-lg transition-colors font-medium w-full text-left"
                          onClick={() => {
                            setMobileMenuOpen(false);
                            startMasterTour();
                          }}
                        >
                          <Icon name="info" className="w-5 h-5" />
                          <span>Rondleiding</span>
                        </button>
                      )}

                      {/* Emergency Button */}
                      {emergencySosEnabled && (
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
                      )}

                      {/* Admin Link */}
                      {user.is_admin && adminDashboardEnabled && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <AdminMenuSection onClose={() => setMobileMenuOpen(false)} stats={adminMenuStatsFetcher.data} />
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
