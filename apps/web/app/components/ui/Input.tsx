import { tv } from "tailwind-variants";
import type { InputHTMLAttributes } from "react";

const field = tv({
  slots: {
    root: "flex flex-col gap-1",
    labelText: "text-sm font-medium text-gray-300",
    input:
      "w-full rounded-lg border bg-surface-raised px-3 py-2 text-white placeholder-gray-500 outline-none transition-colors",
    errorText: "text-xs text-red-400",
  },
  variants: {
    invalid: {
      true: {
        input: "border-red-500/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20",
      },
      false: {
        input: "border-white/10 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20",
      },
    },
  },
  defaultVariants: { invalid: false },
});

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
}

export const Input = ({ label, error, ...props }: InputProps) => {
  const s = field({ invalid: !!error });
  return (
    <label className={s.root()}>
      <span className={s.labelText()}>
        {label}
        {props.required && <span className="ml-0.5 text-orange-500">*</span>}
      </span>
      <input className={s.input()} {...props} />
      {error && <span className={s.errorText()}>{error}</span>}
    </label>
  );
}
