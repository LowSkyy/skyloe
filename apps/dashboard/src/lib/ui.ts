export const inputClass =
  "w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring transition-colors";

export const cardClass = "rounded-xl border border-border bg-card text-card-foreground";

export const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none cursor-pointer";

export const buttonSize = {
  sm: "px-3 py-1.5",
  md: "px-4 py-2",
};

export const buttonVariant = {
  primary: "bg-primary text-primary-foreground hover:opacity-90",
  accent: "bg-accent text-accent-foreground hover:opacity-90",
  outline: "border border-border bg-transparent hover:bg-muted",
  ghost: "bg-transparent hover:bg-muted",
  destructive: "bg-destructive text-destructive-foreground hover:opacity-90",
};

export function buttonClass(variant: keyof typeof buttonVariant = "primary", size: keyof typeof buttonSize = "md") {
  return `${buttonBase} ${buttonVariant[variant]} ${buttonSize[size]}`;
}

export const labelClass = "flex flex-col gap-1 text-sm";
export const checkboxRowClass = "flex items-center gap-2 text-sm";
export const sectionTitleClass = "text-lg font-semibold";
export const sectionDescriptionClass = "mt-1 text-sm text-muted-foreground";
