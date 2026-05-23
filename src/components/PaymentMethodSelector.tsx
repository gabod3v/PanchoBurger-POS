import * as React from "react";
import { Smartphone, Coins, Banknote, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PaymentMethod } from "@/types";

interface PaymentMethodOption {
  value: PaymentMethod;
  label: string;
  icon: React.ReactNode;
}

const paymentMethods: PaymentMethodOption[] = [
  { value: "pagomovil", label: "Pagomóvil", icon: <Smartphone size={18} /> },
  { value: "efectivo_bs", label: "Efectivo Bs", icon: <Coins size={18} /> },
  { value: "efectivo_usd", label: "Efectivo $", icon: <Banknote size={18} /> },
  { value: "punto", label: "Punto", icon: <CreditCard size={18} /> },
];

export interface PaymentMethodSelectorProps {
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
  disabled?: boolean;
  className?: string;
}

function PaymentMethodSelector({
  value,
  onChange,
  disabled = false,
  className,
}: PaymentMethodSelectorProps) {
  return (
    <div className={cn("grid grid-cols-2 gap-2", className)}>
      {paymentMethods.map((pm) => {
        const isSelected = value === pm.value;
        return (
          <button
            key={pm.value}
            type="button"
            onClick={() => onChange(pm.value)}
            disabled={disabled}
            className={cn(
              "flex items-center justify-center gap-2 py-3 px-2 rounded-lg border transition-all font-medium text-sm",
              isSelected
                ? "border-2 border-foreground/80 bg-card text-foreground shadow-sm"
                : "border-border/50 text-muted-foreground hover:bg-muted/50 hover:text-foreground",
              disabled && "opacity-50 cursor-not-allowed",
            )}
          >
            {pm.icon}
            <span>{pm.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export { PaymentMethodSelector };
