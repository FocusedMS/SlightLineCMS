import React, { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from './Button'

export type ModalProps = {
  open: boolean
  title?: string
  children?: React.ReactNode
  onClose: () => void
  onConfirm?: () => void
  confirmLabel?: string
  danger?: boolean
  disabled?: boolean
}

export const Modal: React.FC<ModalProps> = ({
  open,
  title,
  children,
  onClose,
  onConfirm,
  confirmLabel = 'Confirm',
  danger = false,
  disabled = false
}) => {
  const modalRef = useRef<HTMLDivElement>(null)

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return
      
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'Enter' && onConfirm && !disabled) {
        onConfirm()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose, onConfirm, disabled])

  // Focus trap
  useEffect(() => {
    if (open && modalRef.current) {
      // Focus the modal when it opens
      modalRef.current.focus()
    }
  }, [open])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <motion.div 
          className="fixed inset-0 z-[60] grid place-items-center bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="w-[96%] max-w-md rounded-[18px] border border-slate-200/50 dark:border-white/10 bg-white/95 dark:bg-slate-900/95 backdrop-blur shadow-2xl"
            onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'modal-title' : undefined}
            tabIndex={-1}
          >
            <div className="p-6">
              {title && (
                <h3 id="modal-title" className="text-xl font-semibold text-slate-800 dark:text-white mb-4">
                  {title}
                </h3>
              )}
              {children && (
                <div className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6">
                  {children}
                </div>
              )}
              <div className="flex justify-end gap-3">
                <Button 
                  variant="ghost" 
                  onClick={onClose} 
                  className="px-4 py-2"
                  disabled={disabled}
                >
                  Cancel
                </Button>
                {onConfirm && (
                  <Button 
                    variant={danger ? 'outline' : 'primary'} 
                    onClick={onConfirm}
                    disabled={disabled}
                    className={danger ? 'text-rose-600 dark:text-rose-400 border-rose-300/50 dark:border-rose-500/50 hover:bg-rose-50 dark:hover:bg-rose-500/10' : ''}
                  >
                    {confirmLabel}
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default Modal

