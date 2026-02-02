import { createBrowserRouter } from "react-router-dom";

import AboutPage from "@/pages/AboutPage";
import DashboardPage from "@/pages/DashboardPage";
import RootLayout from "./layouts/RootLayout";

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
        path: "dashboard",
        element: <DashboardPage />
      }
    ]
  }
]);
