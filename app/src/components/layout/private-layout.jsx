import { Outlet } from "react-router"
import { Navbar } from "./navbar"
import { SideMenu } from "./side-menu"

export function PrivateLayout() {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar - hidden on tablet and mobile */}
      <div className="hidden lg:block">
        <SideMenu />
      </div>
      
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto bg-background p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
