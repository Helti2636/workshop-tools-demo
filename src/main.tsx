import { createRoot } from "react-dom/client";
import App from "./App";
import "./demo.css";

// No StrictMode on purpose: its double-run of effects in development would
// start the self-playing video mode twice.
createRoot(document.getElementById("root")!).render(<App />);
