import { createBrowserRouter } from "react-router";
import AuthPage from "./pages/AuthPage";
import DatabaseConnectionPage from "./pages/DatabaseConnectionPage";
import DashboardLayout from "./pages/DashboardLayout";
import DashboardPage from "./pages/DashboardPage";
import AskQueryPage from "./pages/AskQueryPage";
import CacheAnalyticsPage from "./pages/CacheAnalyticsPage";
import InsightsPage from "./pages/InsightsPage";
import SettingsPage from "./pages/SettingsPage";
import ProtectedRoute from "./components/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: AuthPage,
  },
  {
    path: "/connect",
    element: (
      <ProtectedRoute>
        <DatabaseConnectionPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/app",
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        Component: DashboardPage,
      },
      {
        path: "query",
        Component: AskQueryPage,
      },
      {
        path: "cache",
        Component: CacheAnalyticsPage,
      },
      {
        path: "insights",
        Component: InsightsPage,
      },
      {
        path: "settings",
        Component: SettingsPage,
      },
    ],
  },
]);