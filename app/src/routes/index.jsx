import { createBrowserRouter, Navigate } from "react-router"
import { LoginPage } from "@/pages/login"
import { DashboardPage } from "@/pages/dashboard"
import { UsersPage } from "@/pages/users"
import { PropertiesPage } from "@/pages/properties"
import { JobsPage } from "@/pages/jobs"
import { SettingsPage } from "@/pages/settings"
import { InspectorPage } from "@/pages/inspector"
import { TechnicianPage } from "@/pages/technician"
import { PrivateLayout } from "@/components/layout/private-layout"
import { isAuthenticated } from "@/lib/auth"

// Public route wrapper
const PublicRoute = ({ children }) => {
  if (isAuthenticated()) {
    return <Navigate to="/dashboard" replace />
  }
  return children
}

export const router = createBrowserRouter([
  {
    path: "/login",
    element: (
      <PublicRoute>
        <LoginPage />
      </PublicRoute>
    ),
  },
  {
    path: "/",
    element: <PrivateLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: "dashboard",
        element: <DashboardPage />,
      },
      {
        path: "users",
        element: <UsersPage />,
      },
      {
        path: "properties",
        element: <PropertiesPage />,
      },
      {
        path: "jobs",
        element: <JobsPage />,
      },
      {
        path: "settings",
        element: <SettingsPage />,
      },
      {
        path: "inspector",
        element: <InspectorPage />,
      },
      {
        path: "technician",
        element: <TechnicianPage />,
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/dashboard" replace />,
  },
])

