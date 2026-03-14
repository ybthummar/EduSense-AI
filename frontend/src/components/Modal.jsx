import { useState } from 'react'
import { X } from 'lucide-react'

export default function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${maxWidth} mx-4 glass-card p-6 animate-fade-in`}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-surface-100">{title}</h3>
          <button
            onClick={onClose}
            className="text-surface-500 hover:text-surface-200 transition-colors cursor-pointer p-1 rounded-lg hover:bg-surface-800/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', danger = false }) {
  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-sm">
      <p className="text-surface-400 text-sm mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <button onClick={onClose} className="btn-secondary text-sm cursor-pointer">Cancel</button>
        <button onClick={onConfirm} className={`${danger ? 'btn-danger' : 'btn-primary'} text-sm cursor-pointer`}>{confirmText}</button>
      </div>
    </Modal>
  )
}
