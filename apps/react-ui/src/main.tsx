import ReactDOM from "react-dom/client";

import { StrictMode } from "react";
import { router } from "./router";

import './index.css'
import { RouterProvider } from "react-router-dom";

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('Root element not found');
}

ReactDOM.createRoot(rootEl).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
)
