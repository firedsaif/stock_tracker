'use client'

import { useState } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Slides up from the bottom on phones, centred card on larger screens. */
export function Sheet({
  title,
  trigger,
  triggerClassName,
  triggerLabel,
  children,
}: {
  title: string
  trigger: React.ReactNode
  triggerClassName?: string
  triggerLabel?: string
  children: (close: () => void) => React.ReactNode
}) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger className={triggerClassName} aria-label={triggerLabel}>
        {trigger}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-ink/30 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Popup
          className={cn(
            'fixed z-50 flex max-h-[92dvh] w-full flex-col bg-sheet text-ink shadow-2xl outline-none transition-all duration-200',
            'inset-x-0 bottom-0 rounded-t-2xl pb-[env(safe-area-inset-bottom)] data-ending-style:translate-y-full data-starting-style:translate-y-full',
            'sm:inset-x-auto sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl sm:pb-0',
            'sm:data-ending-style:-translate-y-[45%] sm:data-ending-style:opacity-0 sm:data-starting-style:-translate-y-[45%] sm:data-starting-style:opacity-0'
          )}
        >
          <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-rule-strong sm:hidden" aria-hidden />
          <div className="flex items-center justify-between border-b border-rule px-5 pt-3 pb-3 sm:pt-4">
            <Dialog.Title className="font-condensed text-xl font-semibold tracking-tight">{title}</Dialog.Title>
            <Dialog.Close className="-mr-2 rounded-md p-2 text-ink-soft hover:bg-paper hover:text-ink" aria-label="Close">
              <X className="size-5" />
            </Dialog.Close>
          </div>
          <div className="overflow-y-auto px-5 py-5">{children(() => setOpen(false))}</div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
