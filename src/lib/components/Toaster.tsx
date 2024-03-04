"use client"

import { useToast } from "~lib/utils"
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "./Shadcn"


export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider swipeDirection="up" duration={2000}>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription className="text-center font-medium text-green-600 mr-3">{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}