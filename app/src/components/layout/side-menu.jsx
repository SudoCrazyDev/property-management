import { LayoutDashboard, Building2, UserCog, Users, Settings, LogOut, Briefcase, ClipboardCheck, Wrench, CheckSquare, Map } from "lucide-react"
import { Link, useLocation, useNavigate } from "react-router"
import { cn } from "@/lib/utils"
import { motion } from "motion/react"
import { useAuth } from "@/hooks/use-auth"

const allMenuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
    roles: ["Admin", "Inspector", "Technician", "QA"], // All roles can see Dashboard
  },
  {
    title: "Properties",
    icon: Building2,
    href: "/properties",
    roles: ["Admin"], // Only Admin can see Properties
  },
  {
    title: "Users",
    icon: UserCog,
    href: "/users",
    roles: ["Admin"], // Only Admin can see Users
  },
  {
    title: "Tenants",
    icon: Users,
    href: "/tenants",
    roles: ["Admin"], // Only Admin can see Tenants
  },
  {
    title: "Jobs",
    icon: Briefcase,
    href: "/jobs",
    roles: ["Admin"], // Only Admin can see Jobs
  },
  {
    title: "Inspector",
    icon: ClipboardCheck,
    href: "/inspector",
    roles: ["Admin", "Inspector"], // Admin and Inspector can see Inspector menu
  },
  {
    title: "Technician",
    icon: Wrench,
    href: "/technician",
    roles: ["Admin", "Technician"], // Admin and Technician can see Technician menu
  },
  {
    title: "QA",
    icon: CheckSquare,
    href: "/qa",
    roles: ["Admin", "QA"], // Admin and QA can see QA menu
  },
  {
    title: "Mapping",
    icon: Map,
    href: "/maps",
    roles: ["Admin"], // Only Admin can see Mapping
  },
  {
    title: "Settings",
    icon: Settings,
    href: "/settings",
    roles: ["Admin"], // Only Admin can see Settings
  },
]

export function SideMenu({ onLinkClick }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  // Get user role
  const userRole = user?.roles?.name || null

  // Filter menu items based on user role
  const menuItems = allMenuItems.filter((item) => {
    // Admin sees all menus
    if (userRole === "Admin") {
      return true
    }
    // Other roles only see menus that include their role
    return item.roles.includes(userRole)
  })

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  const handleLinkClick = () => {
    if (onLinkClick) {
      onLinkClick()
    }
  }

  return (
    <aside className="flex h-full w-full flex-col border-r bg-card">
      <div className="flex h-full flex-col gap-2 p-4">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex h-14 items-center border-b px-4"
        >
          <h2 className="text-lg font-semibold">Menu</h2>
        </motion.div>
        <nav className="flex-1 space-y-1 px-2">
          {menuItems.map((item, index) => {
            const Icon = item.icon
            const isActive = location.pathname === item.href
            return (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  to={item.href}
                  onClick={handleLinkClick}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.title}
                </Link>
              </motion.div>
            )
          })}
        </nav>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="border-t pt-2"
        >
          <motion.button
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              handleLogout()
              handleLinkClick()
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </motion.button>
        </motion.div>
      </div>
    </aside>
  )
}
