"use client";

export function ConfirmDialog({
  open,
  title,
  text,
  confirmLabel = "Confirm",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  text: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/25 px-5 backdrop-blur-sm">
      <div className="surface w-full max-w-md p-5">
        <p className="text-lg font-black">{title}</p>
        <p className="mt-2 text-sm text-slate-300">{text}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="button secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
