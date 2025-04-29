import { Input as InputPrimitive } from "../ui/input";
import { Label } from "../ui/label";
import { cn } from "@/lib/utils"; 

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: "primary" | "secondary";
  label?: string;
}

export function Input({ 
  className, 
  variant = "primary", 
  label,
  ...props 
}: InputProps) {
  return (
    <div className="relative">
      {label && (
        <Label className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-gradgo-900 dark:text-zinc-100">
          {label}
        </Label>
      )}
      <InputPrimitive
        className={cn(
          "border-2",
          variant === "primary" && "bg-gradgo-50 dark:bg-gradgo-900 border-none text-gradgo-900 dark:text-white placeholder:text-zinc-500",
          variant === "secondary" && "border-[var(--color-gradgo-200)] bg-[var(--color-gradgo-700)]",
          className
        )}
        {...props}
      />
    </div>
  );
}
