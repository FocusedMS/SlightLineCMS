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
            className="w-[96%] max-w-md rounded-[18px] border border-white/10 bg-bg-raised shadow-card"
            onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
          >
            <div className="p-5">
              <h3 className="text-lg font-semibold text-white">{title}</h3>
              {children && <div className="mt-2 text-text-dim">{children}</div>}
              <div className="mt-4 flex justify-end gap-2">
                <Button variant="ghost" onClick={onClose}>Cancel</Button>
                {onConfirm && (
                  <Button variant={danger ? 'danger' : 'primary'} onClick={() => { onConfirm(); onClose() }}>{confirmLabel}</Button>
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

