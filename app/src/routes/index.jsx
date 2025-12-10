import { createBrowserRouter, Navigate } from "react-router"
import { LoginPage } from "@/pages/login"
import { DashboardPage } from "@/pages/dashboard"
import { UsersPage } from "@/pages/users"
import { TenantsPage } from "@/pages/tenants"
import { PropertiesPage } from "@/pages/properties"
import { JobsPage } from "@/pages/jobs"
import { SettingsPage } from "@/pages/settings"
import { InspectorPage } from "@/pages/inspector"
import { InspectorFormPage } from "@/pages/inspector-form"
import { PublicInspectorFormPage } from "@/pages/public-inspector-form"
import { PublicCreateFormPage } from "@/pages/public-create-form"
import { PublicCreatePunchlistPage } from "@/pages/public-create-punchlist"
import { PublicPunchlistPage } from "@/pages/public-punchlist"
import { TechnicianPage } from "@/pages/technician"
import { QAPage } from "@/pages/qa"
import { MapsPage } from "@/pages/maps"
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
    path: "/public/form/:slug",
    element: <PublicInspectorFormPage />,
  },
  {
    path: "/public/create-form",
    element: <PublicCreateFormPage />,
  },
  {
    path: "/public/create-punchlist",
    element: <PublicCreatePunchlistPage />,
  },
  {
    path: "/public/punchlist/:slug",
    element: <PublicPunchlistPage />,
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
        path: "tenants",
        element: <TenantsPage />,
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
        path: "inspector-form",
        element: <InspectorFormPage />,
      },
      {
        path: "technician",
        element: <TechnicianPage />,
      },
      {
        path: "qa",
        element: <QAPage />,
      },
      {
        path: "maps",
        element: <MapsPage />,
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/dashboard" replace />,
  },
])

