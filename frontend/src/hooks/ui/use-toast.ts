"use client"

import * as React from "react"

const TOAST_LIMIT = 5
const TOAST_REMOVE_DELAY = 4000

type ToastVariant = "default" | "destructive" | "success" | "warning" | "info"

export type Toast = {
    id: string
    title?: React.ReactNode
    description?: React.ReactNode
    variant?: ToastVariant
    duration?: number
    action?: React.ReactNode
}

type ToastAction =
    | { type: "ADD_TOAST"; toast: Toast }
    | { type: "REMOVE_TOAST"; toastId: string }
    | { type: "DISMISS_TOAST"; toastId: string }

type ToastState = {
    toasts: Toast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

let memoryState: ToastState = { toasts: [] }
const listeners: Array<(state: ToastState) => void> = []

function dispatch(action: ToastAction) {
    memoryState = reducer(memoryState, action)
    listeners.forEach((listener) => listener(memoryState))
}

function reducer(state: ToastState, action: ToastAction): ToastState {
    switch (action.type) {
        case "ADD_TOAST":
            return {
                ...state,
                toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
            }
        case "DISMISS_TOAST": {
            const { toastId } = action
            if (!toastTimeouts.has(toastId)) {
                const timeout = setTimeout(() => {
                    toastTimeouts.delete(toastId)
                    dispatch({ type: "REMOVE_TOAST", toastId })
                }, TOAST_REMOVE_DELAY)
                toastTimeouts.set(toastId, timeout)
            }
            return state
        }
        case "REMOVE_TOAST":
            return {
                ...state,
                toasts: state.toasts.filter((t) => t.id !== action.toastId),
            }
    }
}

function genId() {
    return Math.random().toString(36).substring(2, 9)
}

type ToastOptions = Omit<Toast, "id">

function toast(options: ToastOptions) {
    const id = genId()
    const duration = options.duration ?? TOAST_REMOVE_DELAY

    dispatch({ type: "ADD_TOAST", toast: { ...options, id } })

    const timeout = setTimeout(() => {
        dispatch({ type: "DISMISS_TOAST", toastId: id })
    }, duration)

    toastTimeouts.set(id, timeout)

    return {
        id,
        dismiss: () => dispatch({ type: "DISMISS_TOAST", toastId: id }),
    }
}

toast.success = (options: Omit<ToastOptions, "variant">) =>
    toast({ ...options, variant: "success" })

toast.error = (options: Omit<ToastOptions, "variant">) =>
    toast({ ...options, variant: "destructive" })

toast.warning = (options: Omit<ToastOptions, "variant">) =>
    toast({ ...options, variant: "warning" })

toast.info = (options: Omit<ToastOptions, "variant">) =>
    toast({ ...options, variant: "info" })

function useToast() {
    const [state, setState] = React.useState<ToastState>(memoryState)

    React.useEffect(() => {
        listeners.push(setState)
        return () => {
            const index = listeners.indexOf(setState)
            if (index > -1) listeners.splice(index, 1)
        }
    }, [])

    return {
        toasts: state.toasts,
        toast,
        dismiss: (toastId: string) =>
            dispatch({ type: "DISMISS_TOAST", toastId }),
    }
}

export { useToast, toast }