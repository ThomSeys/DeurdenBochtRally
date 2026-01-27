import { useToast } from "~/contexts/ToastContext";
import { Icon } from "~/components/Icon";

export function ToastContainer() {
  const { toasts, hideToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            rounded-lg shadow-lg p-4 flex items-start gap-3
            animate-in slide-in-from-right duration-300
            ${
              toast.type === "success"
                ? "bg-green-50 border border-green-200"
                : toast.type === "error"
                ? "bg-red-50 border border-red-200"
                : toast.type === "warning"
                ? "bg-yellow-50 border border-yellow-200"
                : "bg-blue-50 border border-blue-200"
            }
          `}
        >
          <div className="flex-shrink-0">
            {toast.type === "success" && (
              <Icon name="check-circle" className="w-5 h-5 text-green-600" />
            )}
            {toast.type === "error" && (
              <Icon name="alert-circle" className="w-5 h-5 text-red-600" />
            )}
            {toast.type === "warning" && (
              <Icon name="alert-triangle" className="w-5 h-5 text-yellow-600" />
            )}
            {toast.type === "info" && (
              <Icon name="info-circle" className="w-5 h-5 text-blue-600" />
            )}
          </div>
          
          <div className="flex-1">
            <p
              className={`text-sm font-medium ${
                toast.type === "success"
                  ? "text-green-800"
                  : toast.type === "error"
                  ? "text-red-800"
                  : toast.type === "warning"
                  ? "text-yellow-800"
                  : "text-blue-800"
              }`}
            >
              {toast.message}
            </p>
          </div>

          <button
            onClick={() => hideToast(toast.id)}
            className={`
              flex-shrink-0 rounded p-1 transition-colors
              ${
                toast.type === "success"
                  ? "hover:bg-green-100"
                  : toast.type === "error"
                  ? "hover:bg-red-100"
                  : toast.type === "warning"
                  ? "hover:bg-yellow-100"
                  : "hover:bg-blue-100"
              }
            `}
          >
            <Icon
              name="x"
              className={`w-4 h-4 ${
                toast.type === "success"
                  ? "text-green-600"
                  : toast.type === "error"
                  ? "text-red-600"
                  : toast.type === "warning"
                  ? "text-yellow-600"
                  : "text-blue-600"
              }`}
            />
          </button>
        </div>
      ))}
    </div>
  );
}
