import { createBrowserRouter } from "react-router-dom";
import Dashboard from "../pages/DashboardPage/Dashboard";
import ArtifactsPage from "../pages/ArtifactsPage/ArtifactsPage";
import AppShell from "./AppShell";

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      {
        path: "/",
        element: <Dashboard />,
      },
      {
        path: "/artifacts",
        element: <ArtifactsPage />,
      },
    ],
  },
]);
