import { useState, useEffect } from 'react';

export default function ClientOnly({ children, className }: { children: React.ReactNode; className?: string }) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return null;
  }

  return <div className={className} suppressHydrationWarning>{children}</div>;
}
