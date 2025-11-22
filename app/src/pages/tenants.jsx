import { useState, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Search, Plus, Edit, Trash2, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Card, CardContent } from "@/components/ui/card"
import { motion } from "motion/react"
import { useUsers } from "@/hooks/use-users"
import { useRoles } from "@/hooks/use-roles"
import { useToast } from "@/hooks/use-toast"

// Default password hash for new users
const DEFAULT_PASSWORD_HASH = "$2y$10$J2W0FU07eXDe5Bue5f1FFeNicr1Su/boAeKXqPhXO6.El7Aw9K1NW"

const tenantSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
  phoneNumber: z.string().optional(),
  birthday: z.string().optional(),
  gender: z.string().optional(),
})

export function TenantsPage() {
  const { users, loading, error, createUser, updateUser, deleteUser } = useUsers()
  const { roles, loading: rolesLoading } = useRoles()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [userToDelete, setUserToDelete] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const itemsPerPage = 10

  // Get Tenant role ID
  const tenantRoleId = useMemo(() => {
    const tenantRole = roles.find((role) => role.name === "Tenant")
    return tenantRole?.id || null
  }, [roles])

  const form = useForm({
    resolver: zodResolver(tenantSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      birthday: "",
      gender: "",
    },
  })

  // Filter users to only show tenants
  const tenants = useMemo(() => {
    return users.filter((user) => user.role === "Tenant")
  }, [users])

  const filteredTenants = useMemo(() => {
    return tenants.filter((tenant) => {
      const matchesSearch =
        searchQuery === "" ||
        `${tenant.firstName || ""} ${tenant.lastName || ""}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tenant.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tenant.phoneNumber?.includes(searchQuery)
      return matchesSearch
    })
  }, [tenants, searchQuery])

  const paginatedTenants = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredTenants.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredTenants, currentPage])

  const totalPages = Math.ceil(filteredTenants.length / itemsPerPage)

  const handleOpenDialog = (user = null) => {
    setEditingUser(user)
    if (user) {
      form.reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phoneNumber: user.phoneNumber || "",
        birthday: user.birthday ? user.birthday.split("T")[0] : "",
        gender: user.gender || "",
      })
    } else {
      form.reset({
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        birthday: "",
        gender: "",
      })
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingUser(null)
    form.reset()
  }

  const onSubmit = async (data) => {
    if (!tenantRoleId) {
      toast({
        title: "Error",
        description: "Tenant role not found. Please try again later.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const userData = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phoneNumber: data.phoneNumber || null,
        birthday: data.birthday || null,
        gender: data.gender || null,
        roleId: editingUser ? editingUser.roleId : tenantRoleId, // Use existing roleId for edits, tenantRoleId for new
      }

      // Use default password hash for new tenants
      if (!editingUser) {
        userData.passwordHash = DEFAULT_PASSWORD_HASH
      }

      if (editingUser) {
        // Update existing tenant
        const result = await updateUser(editingUser.id, userData)
        if (result.success) {
          toast({
            title: "Success",
            description: `Tenant "${data.firstName} ${data.lastName}" has been updated successfully.`,
            variant: "success",
          })
          handleCloseDialog()
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to update tenant. Please try again.",
            variant: "destructive",
          })
        }
      } else {
        // Create new tenant
        const result = await createUser(userData)
        if (result.success) {
          toast({
            title: "Success",
            description: `Tenant "${data.firstName} ${data.lastName}" has been created successfully.`,
            variant: "success",
          })
          handleCloseDialog()
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to create tenant. Please try again.",
            variant: "destructive",
          })
        }
      }
    } catch (err) {
      console.error("Error submitting form:", err)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteClick = (user) => {
    setUserToDelete(user)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return

    setIsDeleting(true)
    try {
      const result = await deleteUser(userToDelete.id)
      if (result.success) {
        toast({
          title: "Success",
          description: `Tenant "${userToDelete.firstName} ${userToDelete.lastName}" has been deleted successfully.`,
          variant: "success",
        })
        setIsDeleteDialogOpen(false)
        setUserToDelete(null)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete tenant. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false)
    setUserToDelete(null)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tenants</h1>
          <p className="text-muted-foreground">
            Manage tenants in the system
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button onClick={() => handleOpenDialog()} disabled={!tenantRoleId || rolesLoading}>
                <Plus className="mr-2 h-4 w-4" />
                Add Tenant
              </Button>
            </motion.div>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingUser ? "Edit Tenant" : "Create New Tenant"}
              </DialogTitle>
              <DialogDescription>
                {editingUser
                  ? "Update tenant information below."
                  : "Fill in the details to create a new tenant. A default password will be assigned."}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormItem>
                    <FormLabel htmlFor="firstName">First Name</FormLabel>
                    <FormControl>
                      <Input
                        id="firstName"
                        placeholder="John"
                        {...form.register("firstName")}
                      />
                    </FormControl>
                    <FormMessage>
                      {form.formState.errors.firstName?.message}
                    </FormMessage>
                  </FormItem>
                  <FormItem>
                    <FormLabel htmlFor="lastName">Last Name</FormLabel>
                    <FormControl>
                      <Input
                        id="lastName"
                        placeholder="Doe"
                        {...form.register("lastName")}
                      />
                    </FormControl>
                    <FormMessage>
                      {form.formState.errors.lastName?.message}
                    </FormMessage>
                  </FormItem>
                </div>
                <FormItem>
                  <FormLabel htmlFor="email">Email Address</FormLabel>
                  <FormControl>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john.doe@example.com"
                      {...form.register("email")}
                    />
                  </FormControl>
                  <FormMessage>
                    {form.formState.errors.email?.message}
                  </FormMessage>
                </FormItem>
                <FormItem>
                  <FormLabel htmlFor="phoneNumber">Phone Number</FormLabel>
                  <FormControl>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      {...form.register("phoneNumber")}
                    />
                  </FormControl>
                  <FormMessage>
                    {form.formState.errors.phoneNumber?.message}
                  </FormMessage>
                </FormItem>
                <div className="grid grid-cols-2 gap-4">
                  <FormItem>
                    <FormLabel htmlFor="birthday">Birthday</FormLabel>
                    <FormControl>
                      <Input
                        id="birthday"
                        type="date"
                        {...form.register("birthday")}
                      />
                    </FormControl>
                    <FormMessage>
                      {form.formState.errors.birthday?.message}
                    </FormMessage>
                  </FormItem>
                  <FormItem>
                    <FormLabel htmlFor="gender">Gender</FormLabel>
                    <FormControl>
                      <Select
                        value={form.watch("gender")}
                        onValueChange={(value) => {
                          form.setValue("gender", value)
                          form.trigger("gender")
                        }}
                      >
                        <SelectTrigger id="gender">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage>
                      {form.formState.errors.gender?.message}
                    </FormMessage>
                  </FormItem>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseDialog}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting || !tenantRoleId}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {editingUser ? "Updating..." : "Creating..."}
                      </>
                    ) : editingUser ? (
                      "Update Tenant"
                    ) : (
                      "Create Tenant"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Tenant</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{userToDelete?.firstName} {userToDelete?.lastName}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleDeleteCancel}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 items-center gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search tenants..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Showing {filteredTenants.length} tenant{filteredTenants.length !== 1 ? "s" : ""}
            </div>
          </div>

          <div className="mt-4 rounded-md border">
            {loading ? (
              <div className="flex items-center justify-center h-24">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Birthday</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTenants.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        No tenants found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedTenants.map((tenant) => (
                      <TableRow key={tenant.id}>
                        <TableCell className="font-medium">
                          {tenant.firstName} {tenant.lastName}
                        </TableCell>
                        <TableCell>{tenant.email}</TableCell>
                        <TableCell>{tenant.phoneNumber || "-"}</TableCell>
                        <TableCell>
                          {tenant.birthday
                            ? new Date(tenant.birthday).toLocaleDateString()
                            : "-"}
                        </TableCell>
                        <TableCell>{tenant.gender || "-"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDialog(tenant)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(tenant)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

