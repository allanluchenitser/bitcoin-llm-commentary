import ReactDOM from "react-dom/client";

import { StrictMode } from "react";
import { router } from "./router";

import './index.css'
import { RouterProvider } from "react-router-dom";

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
)
