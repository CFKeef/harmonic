import { createContext, useContext } from "react";

export const CollectionContext = createContext<
  | {
      value: string;
      setValue: (id: string) => void;
    }
  | undefined
>(undefined);

export const useCollectionId = () => {
  const context = useContext(CollectionContext);

  if (!context) {
    throw new Error("useCollectionId must be used within a CollectionProvider");
  }

  return context;
};
