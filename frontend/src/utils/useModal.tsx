import { createContext, useContext } from "react";

type ModalContext = {
  ref: React.RefObject<HTMLDivElement>;
};

export const ModalContext = createContext<ModalContext | undefined>(undefined);

export const useModal = () => {
  const context = useContext(ModalContext);

  if (!context) {
    throw new Error("useModal must be used within a ModalProvider");
  }

  return context;
};
