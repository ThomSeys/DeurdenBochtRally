import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export interface ModalConfig {
  id: string;
  title?: string;
  content: ReactNode;
  variant?: "default" | "lightbox";
  onClose?: () => void;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
}

interface ModalContextType {
  modals: ModalConfig[];
  openModal: (config: Omit<ModalConfig, "id">) => string;
  closeModal: (id: string) => void;
  closeAllModals: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [modals, setModals] = useState<ModalConfig[]>([]);

  const openModal = useCallback((config: Omit<ModalConfig, "id">) => {
    const id = `modal-${Date.now()}-${Math.random()}`;
    const modalConfig: ModalConfig = {
      id,
      closeOnBackdrop: true,
      closeOnEscape: true,
      ...config,
    };

    setModals((prev) => [...prev, modalConfig]);
    return id;
  }, []);

  const closeModal = useCallback((id: string) => {
    setModals((prev) => {
      const modal = prev.find((m) => m.id === id);
      if (modal?.onClose) {
        modal.onClose();
      }
      return prev.filter((m) => m.id !== id);
    });
  }, []);

  const closeAllModals = useCallback(() => {
    modals.forEach((modal) => {
      if (modal.onClose) {
        modal.onClose();
      }
    });
    setModals([]);
  }, [modals]);

  return (
    <ModalContext.Provider value={{ modals, openModal, closeModal, closeAllModals }}>
      {children}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
}

export function useOptionalModal() {
  return useContext(ModalContext);
}
