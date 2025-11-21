import { createBrowserRouter, Navigate } from "react-router"
import { LoginPage } from "@/pages/login"
import { DashboardPage } from "@/pages/dashboard"
import { UsersPage } from "@/pages/users"
import { PropertiesPage } from "@/pages/properties"
import { SettingsPage } from "@/pages/settings"
import { PrivateLayout } from "@/components/layout/private-layout"

// Placeholder auth check - replace with actual auth logic later
const isAuthenticated = () => {
  // For now, check localStorage or a simple flag
  // In production, this would check tokens, cookies, etc.
  return localStorage.getItem("isAuthenticated") === "true"
}

// Public route wrapper
const PublicRoute = ({ children }) => {
  if (isAuthenticated()) {
    return <Navigate to="/dashboard" replace />
  }
  return children
}

// Private route wrapper
const PrivateRoute = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
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
    element: (
      <PrivateRoute>
        <PrivateLayout />
      </PrivateRoute>
    ),
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
        path: "settings",
        element: <SettingsPage />,
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/dashboard" replace />,
  },
])

