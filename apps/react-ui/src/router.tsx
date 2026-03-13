import { createBrowserRouter } from "react-router-dom";

import RootLayout from "./layouts/RootLayout";

import AboutPage from "@/pages/about/AboutPage";
import DashboardPage from "@/pages/dashboard/DashboardPage";
import SandBoxPage from "./pages/sandbox/SandBoxPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <DashboardPage />
      },
      {
        path: "about",
        element: <AboutPage />
      },
      {
        path: "sandbox",
        element: <SandBoxPage />
      }
    ]
  }
]);
