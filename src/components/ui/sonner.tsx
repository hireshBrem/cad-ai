"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      position="bottom-right"
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4 text-emerald-400" />,
        info: <InfoIcon className="size-4 text-blue-400" />,
        warning: <TriangleAlertIcon className="size-4 text-amber-400" />,
        error: <OctagonXIcon className="size-4 text-red-400" />,
        loading: <Loader2Icon className="size-4 text-gray-400 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "#1e293b",
          "--normal-text": "#f3f4f6",
          "--normal-border": "#374151",
          "--normal-border-radius": "0.75rem",
          "--success-bg": "#064e3b",
          "--success-text": "#ecfdf5",
          "--success-border": "#10b981",
          "--error-bg": "#7f1d1d",
          "--error-text": "#fee2e2",
          "--error-border": "#ef4444",
          "--warning-bg": "#78350f",
          "--warning-text": "#fefce8",
          "--warning-border": "#eab308",
          "--info-bg": "#0c4a6e",
          "--info-text": "#ecf0f1",
          "--info-border": "#3b82f6",
        } as React.CSSProperties
      }
      toastOptions={{
        className: "min-h-14 pl-4 pr-3 py-3 rounded-lg flex items-center gap-3 group relative",
        style: {
          padding: "12px 16px",
          fontSize: "14px",
          fontWeight: "500",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
