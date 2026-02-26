import { createBrowserRouter } from "react-router-dom";
import Dashboard from "../pages/DashboardPage/Dashboard";
import ArtifactsPage from "../pages/ArtifactsPage/ArtifactsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Dashboard />,
  },
  {
    path: "/artifacts",
    element: <ArtifactsPage />,
  },
]);
