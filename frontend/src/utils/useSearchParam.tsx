import { useCallback, useState } from "react";

export const useSearchParam = (key: string) => {
  const [value, setValue] = useState(() =>
    new URLSearchParams(window.location.search).get(key),
  );

  const updateValue = useCallback(
    (nextValue?: string) => {
      const next = new URL(window.location.href);
      if (nextValue) {
        next.searchParams.set(key, nextValue);
      } else {
        next.searchParams.delete(key);
      }
      window.history.replaceState({}, "", next.toString());
      setValue(nextValue ?? null);
    },
    [key],
  );

  return { value, setValue: updateValue };
};
