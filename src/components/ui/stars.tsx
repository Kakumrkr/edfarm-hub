import { Star } from "lucide-react";
import { cn } from "./cn";

export function Stars({ value, className }: { value: number; className?: string }) {
  const rounded = Math.round(value);
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} role="img" aria-label={`${value.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          aria-hidden
          className={cn("size-4", n <= rounded ? "fill-amber-400 text-amber-400" : "fill-stone-200 text-stone-200")}
        />
      ))}
    </span>
  );
}

/**
 * 1 to 5 star radio input without client JS. DOM order is 5..1 shown reversed, so the
 * `.stars-input` rule in globals.css lights the chosen/hovered star and every star before it.
 */
export function StarsInput({ name = "rating", defaultValue }: { name?: string; defaultValue?: number }) {
  return (
    <fieldset>
      <legend className="sr-only">Rating, 1 to 5 stars (optional)</legend>
      <div className="stars-input flex flex-row-reverse justify-end gap-1">
        {[5, 4, 3, 2, 1].map((n) => (
          <label key={n} className="cursor-pointer rounded has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-emerald-600">
            <input type="radio" name={name} value={n} defaultChecked={defaultValue === n} className="sr-only" />
            <Star aria-hidden className="size-7 fill-stone-200 text-stone-300 transition-colors" />
            <span className="sr-only">{n === 1 ? "1 star" : `${n} stars`}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
