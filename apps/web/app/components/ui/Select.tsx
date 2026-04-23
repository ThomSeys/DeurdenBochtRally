import { tv } from "tailwind-variants";
import type { SelectHTMLAttributes, ReactNode } from "react";

const field = tv({
  slots: {
    root: "flex flex-col gap-1",
    labelText: "text-sm font-medium text-gray-300",
    select:
      "w-full appearance-none rounded-lg border bg-surface-raised px-3 py-2 text-white outline-none transition-colors",
    errorText: "text-xs text-red-400",
  },
  variants: {
    invalid: {
      true: {
        select: "border-red-500/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20",
      },
      false: {
        select: "border-white/10 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20",
      },
    },
  },
  defaultVariants: { invalid: false },
});

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string;
  children: ReactNode;
}

export const Select = ({ label, error, children, ...props }: SelectProps) => {
  const s = field({ invalid: !!error });
  return (
    <label className={s.root()}>
      <span className={s.labelText()}>
        {label}
        {props.required && <span className="ml-0.5 text-orange-500">*</span>}
      </span>
      <select className={s.select()} {...props}>
        {children}
      </select>
      {error && <span className={s.errorText()}>{error}</span>}
    </label>
  );
}
