import { createBrowserRouter } from "react-router-dom";
import Dashboard from "../pages/DashboardPage/Dashboard";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Dashboard />,
  },
]);
