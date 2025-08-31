import React from 'react'
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
}

export const Modal: React.FC<ModalProps> = ({ open, title = 'Confirm', children, onClose, onConfirm, confirmLabel = 'Confirm', danger }) => {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[60] grid place-items-center bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="w-[96%] max-w-md rounded-[18px] border border-slate-200/50 dark:border-white/10 bg-white/95 dark:bg-slate-900/95 backdrop-blur shadow-2xl"
            onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
          >
            <div className="p-6">
              <h3 className="text-xl font-semibold text-slate-800 dark:text-white">{title}</h3>
              {children && <div className="mt-3 text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{children}</div>}
              <div className="mt-6 flex justify-end gap-3">
                <Button variant="ghost" onClick={onClose} className="px-4 py-2">Cancel</Button>
                {onConfirm && (
                  <Button 
                    variant={danger ? 'outline' : 'primary'} 
                    onClick={() => { onConfirm(); onClose() }}
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

