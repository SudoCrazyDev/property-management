import { Outlet, useLocation, Navigate } from "react-router"
import { useState, useEffect } from "react"
import { Navbar } from "./navbar"
import { SideMenu } from "./side-menu"
import { isAuthenticated } from "@/lib/auth"
import { useOnlineStatus } from "@/hooks/use-online-status"
import { motion, AnimatePresence } from "motion/react"
import { Wifi, WifiOff } from "lucide-react"

export function PrivateLayout() {
  const location = useLocation()
  const { isOnline = true, wasOffline = false } = useOnlineStatus() || {}
  const [showConnectionRestored, setShowConnectionRestored] = useState(false)
  
  // Redirect to login if not authenticated
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }

  // Show "connection restored" message when coming back online
  useEffect(() => {
    if (wasOffline && isOnline) {
      setShowConnectionRestored(true)
      // Auto-hide after 3 seconds with slide-up animation
      const timer = setTimeout(() => {
        setShowConnectionRestored(false)
      }, 3000)
      return () => clearTimeout(timer)
    } else if (!isOnline) {
      setShowConnectionRestored(false)
    }
  }, [wasOffline, isOnline])
  
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar - hidden on tablet and mobile */}
      <div className="hidden lg:block">
        <SideMenu />
      </div>
      
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Connection Status Notification Banner */}
        <AnimatePresence mode="wait">
          {!isOnline && (
            <motion.div
              key="offline"
              initial={{ opacity: 0, y: -100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -100 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 border-b border-yellow-600 shadow-lg"
            >
              <div className="container mx-auto px-4 py-3 flex items-center gap-3">
                <WifiOff className="h-5 w-5 text-yellow-900 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-yellow-900">
                    You're currently offline
                  </p>
                  <p className="text-xs text-yellow-800 mt-0.5">
                    Your work is being saved locally. Files will upload automatically when your connection is restored.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
          
          {showConnectionRestored && isOnline && (
            <motion.div
              key="online"
              initial={{ opacity: 0, y: -100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -100 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              className="fixed top-0 left-0 right-0 z-50 bg-green-500 border-b border-green-600 shadow-lg"
            >
              <div className="container mx-auto px-4 py-3 flex items-center gap-3">
                <Wifi className="h-5 w-5 text-green-900 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-green-900">
                    Connection restored
                  </p>
                  <p className="text-xs text-green-800 mt-0.5">
                    Uploading queued files...
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="flex flex-1 flex-col overflow-hidden">
          <Navbar hasNotification={!isOnline || showConnectionRestored} />
          <main className="flex-1 overflow-y-auto bg-background p-6">
            <Outlet key={location.pathname} />
          </main>
        </div>
      </div>
    </div>
  )
}
