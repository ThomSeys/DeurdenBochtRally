import { useEffect } from "react";
import { useOptionalModal } from "~/contexts/ModalContext";
import { Icon } from "~/components/Icon";

export function ModalContainer() {
  const modalContext = useOptionalModal();
  if (!modalContext) return null;

  const { modals, closeModal } = modalContext;

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && modals.length > 0) {
        const topModal = modals[modals.length - 1];
        if (topModal.closeOnEscape) {
          closeModal(topModal.id);
        }
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [modals, closeModal]);

  if (modals.length === 0) return null;

  return (
    <>
      {/* modals */}
      {modals.map((modal, index) => (
        <div
          key={modal.id}
          className="fixed inset-0 z-[1100] flex items-center justify-center p-4"
          style={{ zIndex: 1100 + index }}
        >
          {/* Backdrop */}
          <div
            className={modal.variant === "lightbox" ? "absolute inset-0 bg-black/90 animate-in fade-in duration-200" : "absolute inset-0 bg-black/50 animate-in fade-in duration-200"}
            onClick={() => {
              if (modal.closeOnBackdrop) {
                closeModal(modal.id);
              }
            }}
          />

          {/* Modal */}
          <div
            className={
              modal.variant === "lightbox"
                ? "relative w-full max-w-4xl"
                : "relative bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200"
            }
          >
            {/* Header */}
            {modal.variant !== "lightbox" && modal.title && (
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  {modal.title}
                </h2>
                <button
                  onClick={() => closeModal(modal.id)}
                  className="rounded p-1 hover:bg-gray-100 transition-colors"
                >
                  <Icon name="x" className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            )}

            {/* Content */}
            <div
              className={
                modal.variant === "lightbox"
                  ? ""
                  : "overflow-y-auto max-h-[calc(90vh-8rem)]"
              }
            >
              {modal.content}
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
