import { createBrowserRouter } from "react-router-dom";

import AboutPage from "@/pages/about/AboutPage";
import DashboardPage from "@/pages/dashboard/DashboardPage";
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
    ]
  }
]);
