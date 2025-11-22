import { RouterProvider } from "react-router"
import { router } from "./routes"
import { Toaster } from "@/components/ui/toaster"

function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster />
    </>
  )
}

export default App
