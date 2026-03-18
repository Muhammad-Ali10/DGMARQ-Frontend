import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Dialog({
  ...props
}) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({
  ...props
}) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({
  ...props
}) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({
  ...props
}) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({
  className,
  ...props
}) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm",
        className
      )}
      {...props} />
  );
}

const dialogContentSizeClasses = {
  sm: "sm:max-w-[560px]",
  md: "sm:max-w-[720px]",
  lg: "sm:max-w-[960px]",
};

function DialogContent({
  className,
  children,
  showCloseButton = true,
  size = "md",
  ...props
}) {
  const sizeClass = typeof size === "string" && dialogContentSizeClasses[size]
    ? dialogContentSizeClasses[size]
    : dialogContentSizeClasses.md;
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-top-[2%] data-[state=open]:slide-in-from-top-[2%]",
          "fixed top-[50%] left-[50%] z-[100] w-full max-w-[calc(100%-1.5rem)] translate-x-[-50%] translate-y-[-50%]",
          "rounded-2xl border border-white/[0.08] bg-[#0a1a3a] shadow-2xl shadow-black/40",
          "px-0 py-0 duration-200 outline-none max-h-[90vh] overflow-hidden flex flex-col",
          sizeClass,
          className
        )}
        {...props}>
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] text-gray-400 transition-all hover:bg-white/[0.12] hover:text-white focus:outline-none focus:ring-2 focus:ring-accent/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4">
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

function DialogHeader({
  className,
  ...props
}) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-1.5 px-6 pt-6 pb-4 border-b border-white/[0.06] shrink-0", className)}
      {...props} />
  );
}

function DialogFooter({
  className,
  ...props
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center border-t border-white/[0.06] px-6 py-4 shrink-0 bg-white/[0.02]",
        className
      )}
      {...props} />
  );
}

function DialogBody({
  className,
  ...props
}) {
  return (
    <div
      data-slot="dialog-body"
      className={cn("overflow-y-auto flex-1 min-h-0 px-6 py-4", className)}
      {...props} />
  );
}

function DialogTitle({
  className,
  ...props
}) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-lg leading-none font-semibold text-white", className)}
      {...props} />
  );
}

function DialogDescription({
  className,
  ...props
}) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-sm text-gray-400 mt-1", className)}
      {...props} />
  );
}

export {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
