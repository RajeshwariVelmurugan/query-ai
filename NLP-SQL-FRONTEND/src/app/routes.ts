import { createBrowserRouter } from "react-router";
import AuthPage from "./pages/AuthPage";
import DatabaseConnectionPage from "./pages/DatabaseConnectionPage";
import DashboardLayout from "./pages/DashboardLayout";
import DashboardPage from "./pages/DashboardPage";
import AskQueryPage from "./pages/AskQueryPage";
import CacheAnalyticsPage from "./pages/CacheAnalyticsPage";
import PerformancePage from "./pages/PerformancePage";
import SettingsPage from "./pages/SettingsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: AuthPage,
  },
  {
    path: "/connect",
    Component: DatabaseConnectionPage,
  },
  {
    path: "/app",
    Component: DashboardLayout,
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
        path: "performance",
        Component: PerformancePage,
      },
      {
        path: "settings",
        Component: SettingsPage,
      },
    ],
  },
]);