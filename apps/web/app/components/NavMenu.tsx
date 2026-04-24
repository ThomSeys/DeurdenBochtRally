import { Form, Link, NavLink } from "react-router";
import { tv } from "tailwind-variants";
import { usePopover } from "~/hooks/usePopover";
import { Icon } from "~/components/ui/Icons";

export type NavItem = { to: string; label: string; end?: boolean };

type NavMenuProps = {
  items: NavItem[];
  user?: { email?: string; displayName?: string };
  isAdmin?: boolean;
  extraLinks?: NavItem[];
};

const navLink = tv({
    base: "flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
    variants: {
        active: {
            true: "bg-orange-500/10 text-orange-400",
            false: "text-gray-300 hover:bg-white/5 hover:text-white",
        },
    },
    defaultVariants: { active: false },
});


export const NavMenu = ({ items, user, isAdmin = false, extraLinks }: NavMenuProps) => {
  const { open, setOpen, ref: containerRef } = usePopover();

  const close = () => setOpen(false);

  const navLinkClass  = navLink;

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Open menu"
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex h-9 w-9 items-center justify-center text-gray-400 transition-colors hover:bg-white/5 hover:text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-surface rounded-full border border-white/10"
      >
        <Icon name="menu" />
      </button>

      {/* Popover */}
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-white/10 bg-surface-card p-1 shadow-2xl"
        >
          {/* Nav links */}
          <nav className="flex flex-col">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={close}
                className={({ isActive }) => navLinkClass({ active: isActive })}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Extra links (e.g. ← Back to app) */}
          {extraLinks && extraLinks.length > 0 && (
            <>
              <div className="my-1 border-t border-white/10" />
              <nav className="flex flex-col">
                {extraLinks.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={close}
                    className={({ isActive }) => navLinkClass({ active: isActive })}
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>
            </>
          )}

          {/* User section */}
          {user ? (
            <>
              <div className="my-1 border-t border-white/10" />

              {(user.displayName || user.email) && (
                <div className="px-3 py-2">
                  {user.displayName && (
                    <p className="text-sm font-semibold text-white">{user.displayName}</p>
                  )}
                  {user.email && (
                    <p className="mt-0.5 truncate text-xs text-gray-500">{user.email}</p>
                  )}
                </div>
              )}

              <NavLink to="/profile" onClick={close} className={({ isActive }) => navLinkClass({ active: isActive })}>
                Profile
              </NavLink>

              {isAdmin && (
                <NavLink to="/admin" onClick={close} className={({ isActive }) => navLinkClass({ active: isActive })}>
                  Admin panel
                </NavLink>
              )}

              <div className="my-1 border-t border-white/10" />

              <Form method="post" action="/logout">
                <button
                  type="submit"
                  className="flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
                >
                  <Icon name="log-out" className="mr-2 h-4 w-4" />
                  Log out
                </button>
              </Form>
            </>
          ) : (
            /* Guest section */
            <>
              <div className="my-1 border-t border-white/10" />
              <Link
                to="/register"
                onClick={close}
                className="flex w-full items-center justify-center rounded-lg bg-orange-500 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-600"
              >
                Register
              </Link>
              <Link
                to="/login"
                onClick={close}
                className="mt-1 flex w-full items-center justify-center rounded-lg px-3 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-white/5 hover:text-white"
              >
                Log in
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
};
