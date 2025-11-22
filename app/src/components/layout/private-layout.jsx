import { Outlet, useLocation, Navigate } from "react-router"
import { Navbar } from "./navbar"
import { SideMenu } from "./side-menu"
import { isAuthenticated } from "@/lib/auth"

export function PrivateLayout() {
  const location = useLocation()
  
  // Redirect to login if not authenticated
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }
  
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar - hidden on tablet and mobile */}
      <div className="hidden lg:block">
        <SideMenu />
      </div>
      
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto bg-background p-6">
          <Outlet key={location.pathname} />
        </main>
      </div>
    </div>
  )
}
