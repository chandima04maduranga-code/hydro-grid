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
      className="m-auto w-[min(92vw,26rem)] rounded-lg border border-gray-200 p-0 shadow-md backdrop:bg-gray-900/40"
    >
      <div className="p-6">
        <div className="flex items-start gap-3">
          <span className="rounded-full bg-red-50 p-2 text-red-600">
            <TriangleAlert className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="pt-1 text-sm leading-relaxed text-gray-700">{message}</p>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary"
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="btn bg-red-600 text-white hover:bg-red-700"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
};

export default ConfirmDialog;
