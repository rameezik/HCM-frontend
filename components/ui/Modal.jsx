"use client";

import Button from "@/components/ui/Button";

export default function Modal({ children, onClose, open, title }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4">
      <section
        aria-labelledby="modal-title"
        aria-modal="true"
        className="w-full max-w-lg rounded-md border border-white/15 bg-[#0A0A0A] p-6 text-white shadow-2xl"
        role="dialog"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold" id="modal-title">{title}</h2>
          <Button aria-label="Close dialog" onClick={onClose} variant="secondary">
            Close
          </Button>
        </div>
        {children}
      </section>
    </div>
  );
}