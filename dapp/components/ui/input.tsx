import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        "flex h-12 w-full rounded-2xl border border-white/10 bg-black/40 px-4 text-sm text-white placeholder:text-zinc-500 shadow-[0_0_0_1px_rgba(0,255,148,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00FF94]/50",
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Input.displayName = "Input";

export { Input };
