import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { TriangleAlert } from "lucide-react";

// Accessible confirmation dialog built on the native <dialog> element
const ConfirmDialog = ({ open, message, confirmLabel, onConfirm, onCancel }) => {
  const { t } = useTranslation();
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
      className="m-auto w-[min(92vw,26rem)] rounded-2xl border border-gray-100 p-0 shadow-2xl backdrop:bg-tea-900/40 backdrop:backdrop-blur-sm"
    >
      <div className="p-6">
        <div className="flex items-start gap-3">
          <span className="rounded-full bg-clay-50 p-2 text-clay-600">
            <TriangleAlert className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="pt-1 text-sm leading-relaxed text-gray-700">{message}</p>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-xl bg-clay-500 px-4 py-2 text-sm font-semibold text-white hover:bg-clay-600"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
};

export default ConfirmDialog;
