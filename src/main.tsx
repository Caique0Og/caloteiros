import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initEmailJs } from '@/lib/emailjs';
initEmailJs();

createRoot(document.getElementById("root")!).render(<App />);
