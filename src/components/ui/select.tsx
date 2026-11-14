import type { ComponentProps } from "react";
import { cn } from "./cn";
import { fieldControl } from "./input";

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cn(fieldControl, "h-10 pr-8", className)} {...props} />;
}
