import "./App.css";

import CssBaseline from "@mui/material/CssBaseline";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { CollectionsPage } from "./components/CollectionsPage";
import { ModalContext } from "./utils/useModal";
import { useRef } from "react";
import { SnackbarProvider, enqueueSnackbar } from "notistack";

import {
  QueryClient,
  QueryClientProvider,
  QueryCache,
  MutationCache,
} from "@tanstack/react-query";

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      if ("message" in error && typeof error.message === "string") {
        enqueueSnackbar(error.message, {
          variant: "error",
        });
      }
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      if ("message" in error && typeof error.message === "string") {
        enqueueSnackbar(error.message, {
          variant: "error",
        });
      }
    },
  }),
});

const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
});

function App() {
  const modalRef = useRef<HTMLDivElement>(null);

  return (
    <ThemeProvider theme={darkTheme}>
      <SnackbarProvider>
        <QueryClientProvider client={queryClient}>
          <CssBaseline />
          <ModalContext.Provider value={{ ref: modalRef }}>
            <>
              <div className="mx-8">
                <div className="flex justify-between border-b p-2 mb-4 ">
                  <h1 className="font-bold text-xl text-left">Harmonic Jam</h1>
                </div>
                <CollectionsPage />
              </div>
              <div ref={modalRef} />
            </>
          </ModalContext.Provider>
        </QueryClientProvider>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default App;
