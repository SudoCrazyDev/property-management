/**
 * Temporary Admin Setup Page
 * 
 * This page helps you create the initial admin user.
 * Remove or protect this route after setup is complete.
 * 
 * Access: /admin-setup
 */

import { useState } from "react"
import { createAdminUser, checkAdminUser } from "@/lib/create-admin-user"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { motion } from "motion/react"

export function AdminSetupPage() {
  const [email, setEmail] = useState("admin@example.com")
  const [password, setPassword] = useState("Admin123!")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [checking, setChecking] = useState(false)
  const [adminStatus, setAdminStatus] = useState(null)

  const handleCheck = async () => {
    setChecking(true)
    try {
      const status = await checkAdminUser()
      setAdminStatus(status)
    } catch (error) {
      setAdminStatus({ error: error.message })
    } finally {
      setChecking(false)
    }
  }

  const handleCreate = async () => {
    setLoading(true)
    setResult(null)
    try {
      const response = await createAdminUser(email, password)
      setResult({
        success: true,
        message: response.message,
        email: response.email,
      })
    } catch (error) {
      setResult({
        success: false,
        message: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto max-w-2xl p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <Card>
          <CardHeader>
            <CardTitle>Admin User Setup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Admin123!"
              />
              <p className="text-xs text-muted-foreground">
                ⚠️ Change this password after first login!
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleCreate}
                disabled={loading || !email || !password}
                className="flex-1"
              >
                {loading ? "Creating..." : "Create Admin User"}
              </Button>
              <Button
                onClick={handleCheck}
                disabled={checking}
                variant="outline"
              >
                {checking ? "Checking..." : "Check Status"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {adminStatus && (
          <Card>
            <CardHeader>
              <CardTitle>Admin User Status</CardTitle>
            </CardHeader>
            <CardContent>
              {adminStatus.error ? (
                <p className="text-destructive">Error: {adminStatus.error}</p>
              ) : (
                <div className="space-y-2">
                  <p>
                    <strong>Exists:</strong> {adminStatus.exists ? "✅ Yes" : "❌ No"}
                  </p>
                  <p>
                    <strong>Has Auth:</strong> {adminStatus.hasAuth ? "✅ Yes" : "❌ No"}
                  </p>
                  {adminStatus.user && (
                    <div className="mt-4 space-y-1 text-sm">
                      <p><strong>Name:</strong> {adminStatus.user.first_name} {adminStatus.user.last_name}</p>
                      <p><strong>Email:</strong> {adminStatus.user.email}</p>
                      <p><strong>Role:</strong> {adminStatus.user.roles?.name}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {result && (
          <Card>
            <CardHeader>
              <CardTitle>{result.success ? "✅ Success" : "❌ Error"}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{result.message}</p>
              {result.success && result.email && (
                <div className="mt-4 space-y-1 text-sm">
                  <p><strong>Email:</strong> {result.email}</p>
                  <p className="text-muted-foreground">
                    You can now log in with these credentials.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <p className="text-sm text-yellow-800">
              <strong>⚠️ Security Note:</strong> Remove or protect this route after setup is complete.
              This page should not be accessible in production.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

