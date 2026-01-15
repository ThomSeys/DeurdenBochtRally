import { Link, useMatches } from 'react-router';
import { useState, useEffect } from 'react';
import { Icon } from './Icon';

export default function RallySubmissionFAB() {
  const matches = useMatches();
  const rootMatch = matches.find(m => m.id === 'root');
  const user = (rootMatch?.data as any)?.user;
  const [showFAB, setShowFAB] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Don't show FAB on the rally submission page itself
  const isOnRallySubmissionPage = matches.some(m => m.pathname === '/dashboard/rally-submission');
  const isOnRallyPage = matches.some(m => m.pathname === '/live-map');

  useEffect(() => {
    // Small delay before showing FAB
    const timer = setTimeout(() => setShowFAB(true), 500);
    
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timer);
    };
  }, []);

  // Don't show FAB if user is not logged in
  if (!user) {
    return null;
  }

  // Don't show FAB on the rally submission page itself
  if (isOnRallySubmissionPage) {
    return null;
  }

  return (
    <>
      {showFAB && (
        <Link
          to="/dashboard/rally-submission"
          className={`fixed ${isOnRallyPage ? 'bottom-4 right-24' : 'bottom-6 right-8'} z-40 flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-primary-600 to-primary-700 text-white shadow-lg hover:shadow-2xl transition-all duration-300 ${
            isScrolled ? 'bottom-8 opacity-100' : 'bottom-6 opacity-90 hover:opacity-100'
          }`}
          title="Rally Codes Indienen"
          aria-label="Rally Codes Indienen"
        >
          <Icon name="flag" className="w-8 h-8" />
        </Link>
      )}
    </>
  );
}
