/**
 * Single Icon component. Pass `name` to select which icon to render.
 * Size is controlled via `className` — default is `h-5 w-5`.
 *
 * Usage:
 *   <Icon name="menu" />
 *   <Icon name="log-out" className="h-4 w-4" />
 */

import type { ReactNode } from "react";

export type IconName =
  | "menu"
  | "x"
  | "log-out"
  | "user"
  | "route"
  | "flag"
  | "fork"
  | "users"
  | "trophy"
  | "chevron-down";

type IconDef = { strokeWidth: number; children: ReactNode };

const icons: Record<IconName, IconDef> = {
  menu: {
    strokeWidth: 2,
    children: (
      <>
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </>
    ),
  },
  x: {
    strokeWidth: 2,
    children: (
      <>
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </>
    ),
  },
  "log-out": {
    strokeWidth: 1.8,
    children: (
      <>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </>
    ),
  },
  user: {
    strokeWidth: 1.8,
    children: (
      <>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </>
    ),
  },
  route: {
    strokeWidth: 1.8,
    children: (
      <>
        <circle cx="6" cy="19" r="3" />
        <circle cx="18" cy="5" r="3" />
        <path d="M12 19h4.5a3.5 3.5 0 0 0 0-7h-8a3.5 3.5 0 0 1 0-7H12" />
      </>
    ),
  },
  flag: {
    strokeWidth: 1.8,
    children: (
      <>
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
        <line x1="4" y1="22" x2="4" y2="15" />
      </>
    ),
  },
  fork: {
    strokeWidth: 1.8,
    children: (
      <>
        <path d="M16 3h5v5" />
        <path d="M8 3H3v5" />
        <path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3" />
        <path d="m15 9 6-6" />
      </>
    ),
  },
  users: {
    strokeWidth: 1.8,
    children: (
      <>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
  },
  trophy: {
    strokeWidth: 1.8,
    children: (
      <>
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
        <path d="M4 22h16" />
        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
      </>
    ),
  },
  "chevron-down": {
    strokeWidth: 2,
    children: <polyline points="6 9 12 15 18 9" />,
  },
};

type IconProps = {
  name: IconName;
  className?: string;
};

export const Icon = ({ name, className = "h-5 w-5" }: IconProps) => {
  const icon = icons[name];
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={icon.strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {icon.children}
    </svg>
  );
};
