import "./App.css";

import CssBaseline from "@mui/material/CssBaseline";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { CollectionsPage } from "./components/CollectionsPage";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
});

function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <div className="mx-8">
        <h1 className="font-bold text-xl border-b p-2 mb-4 text-left">
          Harmonic Jam
        </h1>
        <CollectionsPage />
      </div>
    </ThemeProvider>
  )
}

export default App;
