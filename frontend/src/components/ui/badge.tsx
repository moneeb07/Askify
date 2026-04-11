import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
    "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 select-none",
    {
        variants: {
            variant: {
                default:
                    "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
                secondary:
                    "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
                destructive:
                    "border-transparent bg-destructive/15 text-destructive border-destructive/30 shadow hover:bg-destructive/25",
                outline:
                    "border-border text-muted-foreground bg-background hover:bg-muted",
                success:
                    "border-transparent bg-emerald-500/15 text-emerald-600 border-emerald-500/30 dark:text-emerald-400 hover:bg-emerald-500/25",
                warning:
                    "border-transparent bg-amber-500/15 text-amber-600 border-amber-500/30 dark:text-amber-400 hover:bg-amber-500/25",
                info:
                    "border-transparent bg-blue-500/15 text-blue-600 border-blue-500/30 dark:text-blue-400 hover:bg-blue-500/25",
                processing:
                    "border-transparent bg-violet-500/15 text-violet-600 border-violet-500/30 dark:text-violet-400 hover:bg-violet-500/25",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
    dot?: boolean
}

function Badge({ className, variant, dot = false, children, ...props }: BadgeProps) {
    return (
        <div className={cn(badgeVariants({ variant }), className)} {...props}>
            {dot && (
                <span
                    className={cn(
                        "size-1.5 rounded-full shrink-0",
                        variant === "success" && "bg-emerald-500",
                        variant === "warning" && "bg-amber-500",
                        variant === "destructive" && "bg-destructive",
                        variant === "info" && "bg-blue-500",
                        variant === "processing" && "bg-violet-500 animate-pulse",
                        variant === "outline" && "bg-muted-foreground",
                        (!variant || variant === "default") && "bg-primary-foreground",
                        variant === "secondary" && "bg-secondary-foreground",
                    )}
                />
            )}
            {children}
        </div>
    )
}

export { Badge, badgeVariants }