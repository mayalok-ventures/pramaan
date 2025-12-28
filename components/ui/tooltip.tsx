"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface TooltipContextValue {
    open: boolean
    setOpen: React.Dispatch<React.SetStateAction<boolean>>
    delayDuration: number
}

const TooltipContext = React.createContext<TooltipContextValue | null>(null)

interface TooltipProviderProps {
    children: React.ReactNode
    delayDuration?: number
}

const TooltipProvider: React.FC<TooltipProviderProps> = ({
    children,
    delayDuration = 200,
}) => {
    return <>{children}</>
}
TooltipProvider.displayName = "TooltipProvider"

interface TooltipProps {
    children: React.ReactNode
    delayDuration?: number
}

const Tooltip: React.FC<TooltipProps> = ({ children, delayDuration = 200 }) => {
    const [open, setOpen] = React.useState(false)

    return (
        <TooltipContext.Provider value={{ open, setOpen, delayDuration }}>
            <div className="relative inline-block">{children}</div>
        </TooltipContext.Provider>
    )
}
Tooltip.displayName = "Tooltip"

interface TooltipTriggerProps extends React.HTMLAttributes<HTMLDivElement> {
    asChild?: boolean
}

const TooltipTrigger = React.forwardRef<HTMLDivElement, TooltipTriggerProps>(
    ({ className, children, asChild, ...props }, ref) => {
        const context = React.useContext(TooltipContext)
        if (!context) throw new Error("TooltipTrigger must be used within a Tooltip")

        const { setOpen, delayDuration } = context
        const timeoutRef = React.useRef<NodeJS.Timeout>()

        const handleMouseEnter = () => {
            timeoutRef.current = setTimeout(() => setOpen(true), delayDuration)
        }

        const handleMouseLeave = () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
            setOpen(false)
        }

        return (
            <div
                ref={ref}
                className={cn("inline-block", className)}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onFocus={() => setOpen(true)}
                onBlur={() => setOpen(false)}
                {...props}
            >
                {children}
            </div>
        )
    }
)
TooltipTrigger.displayName = "TooltipTrigger"

interface TooltipContentProps extends React.HTMLAttributes<HTMLDivElement> {
    side?: "top" | "bottom" | "left" | "right"
    sideOffset?: number
}

const TooltipContent = React.forwardRef<HTMLDivElement, TooltipContentProps>(
    ({ className, side = "top", sideOffset = 4, children, ...props }, ref) => {
        const context = React.useContext(TooltipContext)
        if (!context) throw new Error("TooltipContent must be used within a Tooltip")

        const { open } = context

        if (!open) return null

        const positionClasses = {
            top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
            bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
            left: "right-full top-1/2 -translate-y-1/2 mr-2",
            right: "left-full top-1/2 -translate-y-1/2 ml-2",
        }

        return (
            <div
                ref={ref}
                role="tooltip"
                className={cn(
                    "absolute z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95",
                    positionClasses[side],
                    className
                )}
                style={{ marginTop: side === "bottom" ? sideOffset : undefined }}
                {...props}
            >
                {children}
            </div>
        )
    }
)
TooltipContent.displayName = "TooltipContent"

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
