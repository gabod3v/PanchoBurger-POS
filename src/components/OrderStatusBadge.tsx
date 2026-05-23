import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/types";

const orderStatusBadgeVariants = cva("", {
  variants: {
    status: {
      pending: "bg-warning/10 text-warning border-warning/20",
      ready: "bg-info/10 text-info border-info/20",
      completed: "bg-success/10 text-success border-success/20",
    },
  },
  defaultVariants: {
    status: "pending",
  },
});

export interface OrderStatusBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof orderStatusBadgeVariants> {
  status: OrderStatus;
}

const statusLabels: Record<OrderStatus, string> = {
  pending: "Pendiente",
  ready: "Listo",
  completed: "Completado",
};

function OrderStatusBadge({ status, className, ...props }: OrderStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(orderStatusBadgeVariants({ status }), className)}
      {...props}
    >
      {statusLabels[status]}
    </Badge>
  );
}

export { OrderStatusBadge, orderStatusBadgeVariants };
