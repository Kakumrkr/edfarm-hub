import type { ComponentProps } from "react";
import { cn } from "./cn";
import { fieldControl } from "./input";

export function Textarea({ className, rows = 4, ...props }: ComponentProps<"textarea">) {
  return <textarea rows={rows} className={cn(fieldControl, "leading-relaxed", className)} {...props} />;
}
