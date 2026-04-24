import { Form, NavLink } from "react-router";
import { tv } from "tailwind-variants";
import { usePopover } from "~/hooks/usePopover";
import { Icon } from "~/components/ui/Icons";

type UserMenuProps = {
  email?: string;
  displayName?: string;
  isAdmin?: boolean;
};

const userMenuStyles = tv({
    slots: {
        base: "flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-orange-500/10 text-orange-400 ring-1 ring-orange-500/20 transition-colors hover:bg-orange-500/20 hover:ring-orange-500/40",
        menuItem: "flex w-full items-center rounded-lg px-3 py-2 text-sm transition-colors"
    },
    variants: {
        active: {
            true: {
                menuItem: "bg-orange-500/10 text-orange-400",
            },
            false: {
                menuItem: "text-gray-300 hover:bg-white/5 hover:text-white",
            },
        },
    },
    defaultVariants: { 
        active: false    
    }
});

export function UserMenu({ email, displayName, isAdmin = false }: UserMenuProps) {
  const { open, setOpen, ref } = usePopover();

  const label = displayName || email || "Account";

  const { base, menuItem } = userMenuStyles();

  return (
    <div className="relative" ref={ref}>
        <div
          role="menu"
          className="bg-surface-card p-1 shadow-2xl"
        >
          {/* Identity */}
          <div className="border-b border-white/5 px-3 py-2.5 mb-1">
            <p className="truncate text-sm font-medium text-white">{label}</p>
            {displayName && email && (
              <p className="truncate text-xs text-gray-500">{email}</p>
            )}
          </div>

          <NavLink
            to="/profile"
            onClick={() => setOpen(false)}
            role="menuitem"
            className={({ isActive }) => menuItem({ active: isActive })}
          >
            Profile
          </NavLink>

          {isAdmin && (
            <NavLink
              to="/admin"
              onClick={() => setOpen(false)}
              role="menuitem"
              className={({ isActive }) => menuItem({ active: isActive })}
            >
              Admin
            </NavLink>
          )}

          <Form action="/logout" method="post">
            <button
              type="submit"
              role="menuitem"
              className={menuItem()}
            >
              Logout
            </button>
          </Form>
        </div>
      
    </div>
  );
}
