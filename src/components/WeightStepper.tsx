import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface WeightStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  step?: number;
  quickAdd?: number[];
}

export default function WeightStepper({
  value,
  onChange,
  min = 0,
  step = 0.01,
  quickAdd = [0.25, 0.5, 1],
}: WeightStepperProps) {
  const handleQuickAdd = (amount: number) => {
    const next = Math.max(min, +(value + amount).toFixed(3));
    onChange(next);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val) && val >= min) {
      onChange(val);
    } else if (e.target.value === '' || val < min) {
      onChange(min);
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-1">
        {quickAdd.map((amount) => (
          <Button
            key={amount}
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-[11px] px-2 font-bold rounded-md border-border/60"
            onClick={() => handleQuickAdd(amount)}
          >
            +{amount.toFixed(2).replace(/\.?0+$/, '')} kg
          </Button>
        ))}
      </div>
      <Input
        type="number"
        step={step}
        min={min}
        value={value || ''}
        onChange={handleInputChange}
        className="w-20 h-7 text-xs font-bold text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">kg</span>
    </div>
  );
}
