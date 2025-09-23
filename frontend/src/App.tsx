import "./App.css";

import CssBaseline from "@mui/material/CssBaseline";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { useEffect, useState } from "react";
import { getCollectionsMetadata } from "./utils/jam-api";
import useApi from "./utils/useApi";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
});

interface LayoutProps {
  content: React.ReactNode;
}

const Layout = (props: LayoutProps) => {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <div className="mx-8">
        <h1 className="font-bold text-xl border-b p-2 mb-4 text-left">
          Harmonic Jam
        </h1>
        {props.content}
      </div>
    </ThemeProvider>)
}

function App() {
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>();
  const { data: collectionResponse, error, loading } = useApi(() => getCollectionsMetadata());

  useEffect(() => {
    setSelectedCollectionId(collectionResponse?.[0]?.id);
  }, [collectionResponse]);

  useEffect(() => {
    if (selectedCollectionId) {
      window.history.pushState({}, "", `?collection=${selectedCollectionId}`);
    }
  }, [selectedCollectionId]);

  if (loading) {
    return <Layout
      content={<p>loading</p>}
    />
  }

  if (error) {
    return <Layout
      content={<p>error</p>}
    />
  }


  return (
    <Layout
      content={<p>data</p>}
    />
  );
}

export default App;
