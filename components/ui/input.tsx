import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const inputVariants = cva(
    "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
    {
        variants: {
            variant: {
                default: "",
                error: "border-destructive focus-visible:ring-destructive",
                success: "border-green-500 focus-visible:ring-green-500",
            },
            inputSize: {
                default: "h-10",
                sm: "h-9 px-2 text-xs",
                lg: "h-11 px-4",
            },
        },
        defaultVariants: {
            variant: "default",
            inputSize: "default",
        },
    }
)

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> { }

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, variant, inputSize, ...props }, ref) => {
        return (
            <input
                type={type}
                className={cn(inputVariants({ variant, inputSize, className }))}
                ref={ref}
                {...props}
            />
        )
    }
)
Input.displayName = "Input"

export { Input, inputVariants }
