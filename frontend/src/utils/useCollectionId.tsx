import { useState } from "react";

export const useCollectionId = (): {
    selectedCollectionId?: string
    setSelectedCollectionId: (id?: string) => void
} => {
    const [selectedCollectionId, setSelectedCollectionId] = useState<string>();

    const handleSelect = (id: string | undefined): void => {
        setSelectedCollectionId(id)

        if (selectedCollectionId) {
            window.history.pushState({}, "", `?collection=${selectedCollectionId}`);
        }
    }

    return {
        selectedCollectionId,
        setSelectedCollectionId: handleSelect
    }
}