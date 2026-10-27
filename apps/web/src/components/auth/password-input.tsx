"use client";

import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import * as React from "react";

import { Input } from "@/components/ui/input";
import { cn } from "cn";

export function PasswordInput({
  className,
  ...props
}: Omit<React.ComponentProps<"input">, "type">) {
  const [visible, setVisible] = React.useState(false);

  return (
    <div className="relative">
      <Input
        {...props}
        type={visible ? "text" : "password"}
        className={cn(
          "h-[42px] rounded-[4px] border-[#9e9e9e] bg-white pl-10 pr-10 text-fs placeholder:text-muted-foreground md:text-fs",
          className,
        )}
      />
      <LockKeyhole
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 grid w-[42px] place-items-center rounded-r-lg text-label outline-none transition-colors hover:text-strong focus-visible:text-brand focus-visible:ring-3 focus-visible:ring-ring/30"
      >
        {visible ? (
          <EyeOff className="size-4" aria-hidden="true" />
        ) : (
          <Eye className="size-4" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}

