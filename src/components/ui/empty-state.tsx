import { Inbox, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  icon: Icon = Inbox,
  title,
  children,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-stone-300 bg-white/60 px-6 py-10 text-center">
      <div className="mb-3 grid size-10 place-items-center rounded-full bg-stone-100 text-stone-500">
        <Icon className="size-5" aria-hidden />
      </div>
      <p className="font-medium text-stone-900">{title}</p>
      {children && <div className="mt-1 max-w-sm text-sm text-stone-500">{children}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
