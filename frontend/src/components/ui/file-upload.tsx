"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { FileText, UploadCloud, X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"

export type UploadFile = {
    uid: string
    name: string
    size?: number
    type?: string
    status?: "uploading" | "done" | "error"
    percent?: number
    file?: File
}

export type CustomRequestOptions = {
    file: File
    onSuccess: () => void
    onError: (err: Error) => void
    onProgress?: (percent: number) => void
}

interface FileUploadProps {
    multiple?: boolean
    accept?: string
    fileList?: UploadFile[]
    maxCount?: number
    onChange?: (files: UploadFile[]) => void
    customRequest?: (options: CustomRequestOptions) => void
    disabled?: boolean
    tip?: string
    className?: string
}

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function FileUpload({
    multiple = false,
    accept,
    fileList = [],
    maxCount = 1,
    onChange,
    customRequest,
    disabled = false,
    tip,
    className,
}: FileUploadProps) {
    const inputRef = React.useRef<HTMLInputElement>(null)
    const [isDragging, setIsDragging] = React.useState(false)

    const handleFiles = (files: FileList | null) => {
        if (!files || disabled) return

        const newFiles = Array.from(files).slice(0, maxCount - fileList.length)
        if (newFiles.length === 0) return

        const uploadFiles: UploadFile[] = newFiles.map((file) => ({
            uid: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            name: file.name,
            size: file.size,
            type: file.type,
            status: "uploading" as const,
            percent: 0,
            file,
        }))

        const updated = multiple
            ? [...fileList, ...uploadFiles].slice(0, maxCount)
            : uploadFiles.slice(0, 1)

        onChange?.(updated)

        uploadFiles.forEach((uf) => {
            if (!customRequest || !uf.file) return

            customRequest({
                file: uf.file,
                onSuccess: () => {
                    onChange?.(
                        updated.map((f) =>
                            f.uid === uf.uid ? { ...f, status: "done", percent: 100 } : f
                        )
                    )
                },
                onError: () => {
                    onChange?.(
                        updated.map((f) =>
                            f.uid === uf.uid ? { ...f, status: "error" } : f
                        )
                    )
                },
                onProgress: (percent) => {
                    onChange?.(
                        updated.map((f) =>
                            f.uid === uf.uid ? { ...f, percent } : f
                        )
                    )
                },
            })
        })
    }

    const handleRemove = (uid: string) => {
        onChange?.(fileList.filter((f) => f.uid !== uid))
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        if (disabled) return
        handleFiles(e.dataTransfer.files)
    }

    const isMaxReached = fileList.length >= maxCount

    return (
        <div className={cn("w-full space-y-3", className)}>
            {/* Drop Zone */}
            <div
                onClick={() => !disabled && !isMaxReached && inputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); if (!disabled && !isMaxReached) setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={cn(
                    "relative flex flex-col items-center justify-center gap-3",
                    "rounded-xl border-2 border-dashed px-6 py-10 text-center",
                    "transition-all duration-200 cursor-pointer select-none",
                    // idle
                    "border-border bg-muted/30 hover:bg-muted/60 hover:border-primary/40",
                    // dragging
                    isDragging && "border-primary bg-primary/5 scale-[1.01] shadow-md shadow-primary/10",
                    // disabled or max reached
                    (disabled || isMaxReached) && "opacity-50 cursor-not-allowed pointer-events-none",
                )}
            >
                {/* Animated upload icon */}
                <div className={cn(
                    "flex items-center justify-center rounded-full bg-muted p-3 ring-4 ring-muted",
                    "transition-transform duration-200",
                    isDragging && "scale-110 ring-primary/20 bg-primary/10",
                )}>
                    <UploadCloud className={cn(
                        "h-6 w-6 text-muted-foreground transition-colors",
                        isDragging && "text-primary"
                    )} />
                </div>

                <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                        {isDragging ? "Drop to upload" : (
                            <>
                                <span className="text-primary underline underline-offset-2">Click to upload</span>
                                {" "}or drag & drop
                            </>
                        )}
                    </p>
                    {tip && (
                        <p className="text-xs text-muted-foreground">{tip}</p>
                    )}
                    {maxCount > 1 && (
                        <p className="text-xs text-muted-foreground">
                            {fileList.length}/{maxCount} files
                        </p>
                    )}
                </div>

                <input
                    ref={inputRef}
                    type="file"
                    className="hidden"
                    multiple={multiple}
                    accept={accept}
                    disabled={disabled || isMaxReached}
                    onChange={(e) => handleFiles(e.target.files)}
                />
            </div>

            {/* File List */}
            {fileList.length > 0 && (
                <ul className="space-y-2">
                    {fileList.map((file) => (
                        <li
                            key={file.uid}
                            className={cn(
                                "group flex items-center gap-3 rounded-lg border bg-muted/20 px-3 py-2.5",
                                "transition-colors duration-150",
                                file.status === "error" && "border-destructive/30 bg-destructive/5",
                                file.status === "done" && "border-emerald-500/20 bg-emerald-500/5",
                            )}
                        >
                            {/* File icon */}
                            <div className={cn(
                                "flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
                                file.status === "error" ? "bg-destructive/10" : "bg-background border border-border",
                            )}>
                                <FileText className={cn(
                                    "h-4 w-4",
                                    file.status === "error" ? "text-destructive" : "text-muted-foreground",
                                )} />
                            </div>

                            {/* File info */}
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-foreground leading-tight">
                                    {file.name}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    {file.size !== undefined && (
                                        <span className="text-xs text-muted-foreground">
                                            {formatBytes(file.size)}
                                        </span>
                                    )}
                                    {file.status === "uploading" && (
                                        <span className="text-xs text-primary">
                                            {file.percent ?? 0}%
                                        </span>
                                    )}
                                    {file.status === "error" && (
                                        <span className="text-xs text-destructive">Upload failed</span>
                                    )}
                                </div>

                                {/* Progress bar */}
                                {file.status === "uploading" && (
                                    <div className="mt-1.5 h-1 w-full rounded-full bg-muted overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-primary transition-all duration-300"
                                            style={{ width: `${file.percent ?? 0}%` }}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Status icon */}
                            <div className="shrink-0">
                                {file.status === "uploading" && (
                                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                )}
                                {file.status === "done" && (
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                )}
                                {file.status === "error" && (
                                    <AlertCircle className="h-4 w-4 text-destructive" />
                                )}
                            </div>

                            {/* Remove button */}
                            {!disabled && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleRemove(file.uid) }}
                                    className={cn(
                                        "shrink-0 rounded-md p-1 opacity-0 group-hover:opacity-100",
                                        "text-muted-foreground hover:text-foreground hover:bg-muted",
                                        "transition-all duration-150 focus:outline-none focus:opacity-100",
                                    )}
                                >
                                    <X className="h-3.5 w-3.5" />
                                    <span className="sr-only">Remove</span>
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}

export { FileUpload }