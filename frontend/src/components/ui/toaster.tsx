"use client"

import * as React from "react"
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast, type Toast } from "@/hooks/ui/use-toast"

const variantStyles: Record<NonNullable<Toast["variant"]>, string> = {
    default:
        "bg-background border-border text-foreground",
    destructive:
        "bg-destructive/10 border-destructive/30 text-destructive dark:text-red-400",
    success:
        "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400",
    warning:
        "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400",
    info:
        "bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400",
}

const variantIcons: Record<NonNullable<Toast["variant"]>, React.ReactNode> = {
    default: null,
    destructive: <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />,
    success: <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />,
    warning: <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />,
    info: <Info className="h-4 w-4 shrink-0 mt-0.5" />,
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
    const variant = toast.variant ?? "default"

    return (
        <div
            className={cn(
                "group pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-lg border p-4 shadow-lg",
                "animate-in slide-in-from-right-5 fade-in-0 duration-300",
                variantStyles[variant]
            )}
        >
            {variantIcons[variant]}
            <div className="flex-1 min-w-0">
                {toast.title && (
                    <p className="text-sm font-semibold leading-snug">{toast.title}</p>
                )}
                {toast.description && (
                    <p className={cn("text-xs leading-relaxed opacity-80", toast.title && "mt-0.5")}>
                        {toast.description}
                    </p>
                )}
                {toast.action && <div className="mt-2">{toast.action}</div>}
            </div>
            <button
                onClick={onDismiss}
                className="shrink-0 rounded-md p-0.5 opacity-50 hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-ring"
            >
                <X className="h-3.5 w-3.5" />
                <span className="sr-only">Close</span>
            </button>
        </div>
    )
}

function Toaster() {
    const { toasts, dismiss } = useToast()

    return (
        <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
            {toasts.map((t) => (
                <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
            ))}
        </div>
    )
}

export { Toaster }