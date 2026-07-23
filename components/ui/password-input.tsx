"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import {
    FieldValues,
    Path,
    RegisterOptions,
    UseFormRegister,
} from "react-hook-form";

import { cn } from "@/libs/utils";
import { Input } from "@/components/ui/input";

type PasswordInputProps<TFormValues extends FieldValues> = Omit<
    React.ComponentProps<"input">,
    "name" | "type"
> & {
    name: Path<TFormValues>;
    register: UseFormRegister<TFormValues>;
    rules?: RegisterOptions<TFormValues, Path<TFormValues>>;
};

export function PasswordInput<TFormValues extends FieldValues>({
    id,
    name,
    register,
    rules,
    className,
    disabled,
    autoComplete = "new-password",
    onKeyDown,
    ...props
}: PasswordInputProps<TFormValues>) {
    const [showPassword, setShowPassword] = React.useState(false);

    const inputId = id ?? name;
    const registration = register(name, rules);

    return (
        <div className="relative w-full">
            <Input
                {...props}
                {...registration}
                id={inputId}
                type={showPassword ? "text" : "password"}
                disabled={disabled}
                autoComplete={autoComplete}
                className={cn(
                    "h-10 w-full rounded-xl pr-12",
                    "[&::-ms-reveal]:hidden [&::-ms-clear]:hidden",
                    className
                )}
                onKeyDown={onKeyDown}
            />

            <button
                type="button"
                disabled={disabled}
                className={cn(
                    "absolute inset-y-0 right-2 z-20 flex w-9 items-center justify-center",
                    "rounded-md bg-transparent p-0 text-foreground",
                    "disabled:pointer-events-none disabled:opacity-50"
                )}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => setShowPassword((previous) => !previous)}
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"}
                aria-pressed={showPassword}
            >
                {showPassword ? (
                    <EyeOff aria-hidden="true" className="size-5" />
                ) : (
                    <Eye aria-hidden="true" className="size-5" />
                )}
            </button>
        </div>
    );
}
