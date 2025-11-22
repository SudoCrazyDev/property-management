import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus, Edit, Trash2, Loader2 } from "lucide-react"
import { useRoles } from "@/hooks/use-roles"
import { usePropertyTypes } from "@/hooks/use-property-types"
import { usePropertyLocations } from "@/hooks/use-property-locations"
import { useLocationAttributes } from "@/hooks/use-location-attributes"
import { useJobTypes } from "@/hooks/use-job-types"
import { useInspectorStatuses } from "@/hooks/use-inspector-statuses"
import { useTechnicianStatuses } from "@/hooks/use-technician-statuses"
import { useToast } from "@/hooks/use-toast"
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
  Form,
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { motion } from "motion/react"

const roleSchema = z.object({
  name: z.string().min(1, "Role name is required"),
})

const propertyTypeSchema = z.object({
  name: z.string().min(1, "Property type name is required"),
})

const propertyLocationSchema = z.object({
  name: z.string().min(1, "Property location name is required"),
})

const propertyLocationAttributeSchema = z.object({
  name: z.string().min(1, "Attribute name is required"),
})

const jobTypeSchema = z.object({
  name: z.string().min(1, "Job type name is required"),
})

const inspectorAttributeStatusSchema = z.object({
  name: z.string().min(1, "Status name is required"),
})

const technicianAttributeStatusSchema = z.object({
  name: z.string().min(1, "Status name is required"),
})

// Mock data - replace with API calls later
const initialRoles = ["Admin", "QA", "Tenant", "Inspector", "Technician"]
const initialPropertyTypes = ["House", "Apartment", "Condo", "Duplex", "Multi-Family", "Commercial"]
const initialPropertyLocations = [
  "Entryway/Hallways",
  "Living Room",
  "Dining Area",
  "Kitchen",
]
const initialPropertyLocationAttributes = [
  "Walls",
  "Baseboards and Trim",
  "Flooring",
  "Doors",
  "Windows",
  "Blinds/Shades",
  "Light Fixtures",
  "Electrical Outlets",
  "HVAC Vents",
]
const initialJobTypes = ["Move In", "Move Out"]
const initialInspectorAttributeStatuses = ["Pass", "Fail", "N/A", "Needs Attention"]
const initialTechnicianAttributeStatuses = ["Fixed", "Not Fixed", "N/A", "Pending"]

function RolesTab() {
  const { roles, loading, error, createRole, updateRole, deleteRole } = useRoles()
  const { toast } = useToast()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingRole, setEditingRole] = useState(null)
  const [roleToDelete, setRoleToDelete] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const form = useForm({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: "",
    },
  })

  const handleOpenDialog = (role = null) => {
    setEditingRole(role)
    if (role) {
      form.reset({ name: role.name })
    } else {
      form.reset()
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingRole(null)
    form.reset()
  }

  const onSubmit = async (data) => {
    setIsSubmitting(true)
    try {
      if (editingRole) {
        const result = await updateRole(editingRole.id, data.name)
        if (result.success) {
          toast({
            title: "Success",
            description: `Role "${data.name}" has been updated successfully.`,
            variant: "success",
          })
          handleCloseDialog()
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to update role. Please try again.",
            variant: "destructive",
          })
        }
      } else {
        const result = await createRole(data.name)
        if (result.success) {
          toast({
            title: "Success",
            description: `Role "${data.name}" has been created successfully.`,
            variant: "success",
          })
          handleCloseDialog()
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to create role. Please try again.",
            variant: "destructive",
          })
        }
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteClick = (role) => {
    setRoleToDelete(role)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!roleToDelete) return

    setIsDeleting(true)
    try {
      const result = await deleteRole(roleToDelete.id)
      if (result.success) {
        toast({
          title: "Success",
          description: `Role "${roleToDelete.name}" has been deleted successfully.`,
          variant: "success",
        })
        setIsDeleteDialogOpen(false)
        setRoleToDelete(null)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete role. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false)
    setRoleToDelete(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Roles</h2>
          <p className="text-muted-foreground">
            Manage user roles in the system
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Role
              </Button>
            </motion.div>
          </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingRole ? "Edit Role" : "Create New Role"}
            </DialogTitle>
            <DialogDescription>
              {editingRole
                ? "Update the role name below."
                : "Enter a name for the new role."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormItem>
                <FormLabel htmlFor="roleName">Role Name</FormLabel>
                <FormControl>
                  <Input
                    id="roleName"
                    placeholder="e.g., Manager"
                    {...form.register("name")}
                  />
                </FormControl>
                <FormMessage>
                  {form.formState.errors.name?.message}
                </FormMessage>
              </FormItem>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseDialog}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {editingRole ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    editingRole ? "Update" : "Create"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role Name</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="h-24 text-center">
                        No roles found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    roles.map((role) => (
                      <TableRow key={role.id}>
                        <TableCell className="font-medium">{role.name}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDialog(role)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(role)}
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Role</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{roleToDelete?.name}"? This action cannot be undone.
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
    </div>
  )
}

function PropertyTypesTab() {
  const { propertyTypes, loading, error, createPropertyType, updatePropertyType, deletePropertyType } = usePropertyTypes()
  const { toast } = useToast()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingType, setEditingType] = useState(null)
  const [typeToDelete, setTypeToDelete] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const form = useForm({
    resolver: zodResolver(propertyTypeSchema),
    defaultValues: {
      name: "",
    },
  })

  const handleOpenDialog = (type = null) => {
    setEditingType(type)
    if (type) {
      form.reset({ name: type.name })
    } else {
      form.reset()
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingType(null)
    form.reset()
  }

  const onSubmit = async (data) => {
    setIsSubmitting(true)
    try {
      if (editingType) {
        const result = await updatePropertyType(editingType.id, data.name)
        if (result.success) {
          toast({
            title: "Success",
            description: `Property type "${data.name}" has been updated successfully.`,
            variant: "success",
          })
          handleCloseDialog()
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to update property type. Please try again.",
            variant: "destructive",
          })
        }
      } else {
        const result = await createPropertyType(data.name)
        if (result.success) {
          toast({
            title: "Success",
            description: `Property type "${data.name}" has been created successfully.`,
            variant: "success",
          })
          handleCloseDialog()
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to create property type. Please try again.",
            variant: "destructive",
          })
        }
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteClick = (type) => {
    setTypeToDelete(type)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!typeToDelete) return

    setIsDeleting(true)
    try {
      const result = await deletePropertyType(typeToDelete.id)
      if (result.success) {
        toast({
          title: "Success",
          description: `Property type "${typeToDelete.name}" has been deleted successfully.`,
          variant: "success",
        })
        setIsDeleteDialogOpen(false)
        setTypeToDelete(null)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete property type. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false)
    setTypeToDelete(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Property Types</h2>
          <p className="text-muted-foreground">
            Manage property types in the system
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Property Type
              </Button>
            </motion.div>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingType ? "Edit Property Type" : "Create New Property Type"}
              </DialogTitle>
              <DialogDescription>
                {editingType
                  ? "Update the property type name below."
                  : "Enter a name for the new property type."}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormItem>
                  <FormLabel htmlFor="typeName">Property Type Name</FormLabel>
                  <FormControl>
                    <Input
                      id="typeName"
                      placeholder="e.g., Studio"
                      {...form.register("name")}
                    />
                  </FormControl>
                  <FormMessage>
                    {form.formState.errors.name?.message}
                  </FormMessage>
                </FormItem>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseDialog}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {editingType ? "Updating..." : "Creating..."}
                      </>
                    ) : (
                      editingType ? "Update" : "Create"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property Type Name</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {propertyTypes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="h-24 text-center">
                        No property types found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    propertyTypes.map((type) => (
                      <TableRow key={type.id}>
                        <TableCell className="font-medium">{type.name}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDialog(type)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(type)}
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Property Type</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{typeToDelete?.name}"? This action cannot be undone.
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
    </div>
  )
}

function PropertyLocationsTab() {
  const { propertyLocations, loading, error, createPropertyLocation, updatePropertyLocation, deletePropertyLocation } = usePropertyLocations()
  const { toast } = useToast()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState(null)
  const [locationToDelete, setLocationToDelete] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const form = useForm({
    resolver: zodResolver(propertyLocationSchema),
    defaultValues: {
      name: "",
    },
  })

  const handleOpenDialog = (location = null) => {
    setEditingLocation(location)
    if (location) {
      form.reset({ name: location.name })
    } else {
      form.reset()
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingLocation(null)
    form.reset()
  }

  const onSubmit = async (data) => {
    setIsSubmitting(true)
    try {
      if (editingLocation) {
        const result = await updatePropertyLocation(editingLocation.id, data.name)
        if (result.success) {
          toast({
            title: "Success",
            description: `Property location "${data.name}" has been updated successfully.`,
            variant: "success",
          })
          handleCloseDialog()
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to update property location. Please try again.",
            variant: "destructive",
          })
        }
      } else {
        const result = await createPropertyLocation(data.name)
        if (result.success) {
          toast({
            title: "Success",
            description: `Property location "${data.name}" has been created successfully.`,
            variant: "success",
          })
          handleCloseDialog()
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to create property location. Please try again.",
            variant: "destructive",
          })
        }
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteClick = (location) => {
    setLocationToDelete(location)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!locationToDelete) return

    setIsDeleting(true)
    try {
      const result = await deletePropertyLocation(locationToDelete.id)
      if (result.success) {
        toast({
          title: "Success",
          description: `Property location "${locationToDelete.name}" has been deleted successfully.`,
          variant: "success",
        })
        setIsDeleteDialogOpen(false)
        setLocationToDelete(null)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete property location. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false)
    setLocationToDelete(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Property Locations</h2>
          <p className="text-muted-foreground">
            Manage available property location types. These can be assigned to individual properties.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Location
              </Button>
            </motion.div>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingLocation ? "Edit Property Location" : "Create New Property Location"}
              </DialogTitle>
              <DialogDescription>
                {editingLocation
                  ? "Update the property location name below."
                  : "Enter a name for the new property location type."}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormItem>
                  <FormLabel htmlFor="locationName">Location Name</FormLabel>
                  <FormControl>
                    <Input
                      id="locationName"
                      placeholder="e.g., Bedroom"
                      {...form.register("name")}
                    />
                  </FormControl>
                  <FormMessage>
                    {form.formState.errors.name?.message}
                  </FormMessage>
                </FormItem>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseDialog}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {editingLocation ? "Updating..." : "Creating..."}
                      </>
                    ) : (
                      editingLocation ? "Update" : "Create"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Location Name</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {propertyLocations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="h-24 text-center">
                        No locations found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    propertyLocations.map((location) => (
                      <TableRow key={location.id}>
                        <TableCell className="font-medium">{location.name}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDialog(location)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(location)}
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Property Location</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{locationToDelete?.name}"? This action cannot be undone.
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
    </div>
  )
}

function PropertyLocationAttributesTab() {
  const { locationAttributes, loading, error, createLocationAttribute, updateLocationAttribute, deleteLocationAttribute } = useLocationAttributes()
  const { toast } = useToast()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingAttribute, setEditingAttribute] = useState(null)
  const [attributeToDelete, setAttributeToDelete] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const form = useForm({
    resolver: zodResolver(propertyLocationAttributeSchema),
    defaultValues: {
      name: "",
    },
  })

  const handleOpenDialog = (attribute = null) => {
    setEditingAttribute(attribute)
    if (attribute) {
      form.reset({ name: attribute.name })
    } else {
      form.reset()
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingAttribute(null)
    form.reset()
  }

  const onSubmit = async (data) => {
    setIsSubmitting(true)
    try {
      if (editingAttribute) {
        const result = await updateLocationAttribute(editingAttribute.id, data.name)
        if (result.success) {
          toast({
            title: "Success",
            description: `Location attribute "${data.name}" has been updated successfully.`,
            variant: "success",
          })
          handleCloseDialog()
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to update location attribute. Please try again.",
            variant: "destructive",
          })
        }
      } else {
        const result = await createLocationAttribute(data.name)
        if (result.success) {
          toast({
            title: "Success",
            description: `Location attribute "${data.name}" has been created successfully.`,
            variant: "success",
          })
          handleCloseDialog()
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to create location attribute. Please try again.",
            variant: "destructive",
          })
        }
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteClick = (attribute) => {
    setAttributeToDelete(attribute)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!attributeToDelete) return

    setIsDeleting(true)
    try {
      const result = await deleteLocationAttribute(attributeToDelete.id)
      if (result.success) {
        toast({
          title: "Success",
          description: `Location attribute "${attributeToDelete.name}" has been deleted successfully.`,
          variant: "success",
        })
        setIsDeleteDialogOpen(false)
        setAttributeToDelete(null)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete location attribute. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false)
    setAttributeToDelete(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Property Location Attributes</h2>
          <p className="text-muted-foreground">
            Manage available attribute types. These will be assigned to specific locations during inspections.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Attribute
              </Button>
            </motion.div>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingAttribute ? "Edit Attribute" : "Create New Attribute"}
              </DialogTitle>
              <DialogDescription>
                {editingAttribute
                  ? "Update the attribute name below."
                  : "Enter a name for the new attribute."}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormItem>
                  <FormLabel htmlFor="attributeName">Attribute Name</FormLabel>
                  <FormControl>
                    <Input
                      id="attributeName"
                      placeholder="e.g., Ceiling"
                      {...form.register("name")}
                    />
                  </FormControl>
                  <FormMessage>
                    {form.formState.errors.name?.message}
                  </FormMessage>
                </FormItem>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseDialog}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {editingAttribute ? "Updating..." : "Creating..."}
                      </>
                    ) : (
                      editingAttribute ? "Update" : "Create"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Attribute Name</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {locationAttributes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="h-24 text-center">
                        No attributes found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    locationAttributes.map((attribute) => (
                      <TableRow key={attribute.id}>
                        <TableCell className="font-medium">{attribute.name}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDialog(attribute)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(attribute)}
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Location Attribute</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{attributeToDelete?.name}"? This action cannot be undone.
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
    </div>
  )
}

function JobTypesTab() {
  const { jobTypes, loading, error, createJobType, updateJobType, deleteJobType } = useJobTypes()
  const { toast } = useToast()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingJobType, setEditingJobType] = useState(null)
  const [jobTypeToDelete, setJobTypeToDelete] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const form = useForm({
    resolver: zodResolver(jobTypeSchema),
    defaultValues: {
      name: "",
    },
  })

  const handleOpenDialog = (jobType = null) => {
    setEditingJobType(jobType)
    if (jobType) {
      form.reset({ name: jobType.name })
    } else {
      form.reset()
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingJobType(null)
    form.reset()
  }

  const onSubmit = async (data) => {
    setIsSubmitting(true)
    try {
      if (editingJobType) {
        const result = await updateJobType(editingJobType.id, data.name)
        if (result.success) {
          toast({
            title: "Success",
            description: `Job type "${data.name}" has been updated successfully.`,
            variant: "success",
          })
          handleCloseDialog()
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to update job type. Please try again.",
            variant: "destructive",
          })
        }
      } else {
        const result = await createJobType(data.name)
        if (result.success) {
          toast({
            title: "Success",
            description: `Job type "${data.name}" has been created successfully.`,
            variant: "success",
          })
          handleCloseDialog()
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to create job type. Please try again.",
            variant: "destructive",
          })
        }
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteClick = (jobType) => {
    setJobTypeToDelete(jobType)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!jobTypeToDelete) return

    setIsDeleting(true)
    try {
      const result = await deleteJobType(jobTypeToDelete.id)
      if (result.success) {
        toast({
          title: "Success",
          description: `Job type "${jobTypeToDelete.name}" has been deleted successfully.`,
          variant: "success",
        })
        setIsDeleteDialogOpen(false)
        setJobTypeToDelete(null)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete job type. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false)
    setJobTypeToDelete(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Job Types</h2>
          <p className="text-muted-foreground">
            Manage job types in the system
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Job Type
              </Button>
            </motion.div>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingJobType ? "Edit Job Type" : "Create New Job Type"}
              </DialogTitle>
              <DialogDescription>
                {editingJobType
                  ? "Update the job type name below."
                  : "Enter a name for the new job type."}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormItem>
                  <FormLabel htmlFor="jobTypeName">Job Type Name</FormLabel>
                  <FormControl>
                    <Input
                      id="jobTypeName"
                      placeholder="e.g., Maintenance"
                      {...form.register("name")}
                    />
                  </FormControl>
                  <FormMessage>
                    {form.formState.errors.name?.message}
                  </FormMessage>
                </FormItem>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseDialog}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {editingJobType ? "Updating..." : "Creating..."}
                      </>
                    ) : (
                      editingJobType ? "Update" : "Create"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job Type Name</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobTypes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="h-24 text-center">
                        No job types found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    jobTypes.map((jobType) => (
                      <TableRow key={jobType.id}>
                        <TableCell className="font-medium">{jobType.name}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDialog(jobType)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(jobType)}
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Job Type</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{jobTypeToDelete?.name}"? This action cannot be undone.
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
    </div>
  )
}

function InspectorAttributeStatusesTab() {
  const { inspectorStatuses, loading, error, createInspectorStatus, updateInspectorStatus, deleteInspectorStatus } = useInspectorStatuses()
  const { toast } = useToast()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingStatus, setEditingStatus] = useState(null)
  const [statusToDelete, setStatusToDelete] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const form = useForm({
    resolver: zodResolver(inspectorAttributeStatusSchema),
    defaultValues: {
      name: "",
    },
  })

  const handleOpenDialog = (status = null) => {
    setEditingStatus(status)
    if (status) {
      form.reset({ name: status.name })
    } else {
      form.reset()
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingStatus(null)
    form.reset()
  }

  const onSubmit = async (data) => {
    setIsSubmitting(true)
    try {
      if (editingStatus) {
        const result = await updateInspectorStatus(editingStatus.id, data.name)
        if (result.success) {
          toast({
            title: "Success",
            description: `Inspector status "${data.name}" has been updated successfully.`,
            variant: "success",
          })
          handleCloseDialog()
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to update inspector status. Please try again.",
            variant: "destructive",
          })
        }
      } else {
        const result = await createInspectorStatus(data.name)
        if (result.success) {
          toast({
            title: "Success",
            description: `Inspector status "${data.name}" has been created successfully.`,
            variant: "success",
          })
          handleCloseDialog()
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to create inspector status. Please try again.",
            variant: "destructive",
          })
        }
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteClick = (status) => {
    setStatusToDelete(status)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!statusToDelete) return

    setIsDeleting(true)
    try {
      const result = await deleteInspectorStatus(statusToDelete.id)
      if (result.success) {
        toast({
          title: "Success",
          description: `Inspector status "${statusToDelete.name}" has been deleted successfully.`,
          variant: "success",
        })
        setIsDeleteDialogOpen(false)
        setStatusToDelete(null)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete inspector status. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false)
    setStatusToDelete(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Inspector Attribute Statuses</h2>
          <p className="text-muted-foreground">
            Manage statuses for inspector attributes
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Status
              </Button>
            </motion.div>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingStatus ? "Edit Status" : "Create New Status"}
              </DialogTitle>
              <DialogDescription>
                {editingStatus
                  ? "Update the status name below."
                  : "Enter a name for the new status."}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormItem>
                  <FormLabel htmlFor="statusName">Status Name</FormLabel>
                  <FormControl>
                    <Input
                      id="statusName"
                      placeholder="e.g., Excellent"
                      {...form.register("name")}
                    />
                  </FormControl>
                  <FormMessage>
                    {form.formState.errors.name?.message}
                  </FormMessage>
                </FormItem>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseDialog}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting
                      ? "Saving..."
                      : editingStatus
                      ? "Update Status"
                      : "Create Status"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status Name</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inspectorStatuses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="h-24 text-center">
                        No statuses found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    inspectorStatuses.map((status) => (
                      <TableRow key={status.id}>
                        <TableCell className="font-medium">{status.name}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDialog(status)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(status)}
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Inspector Status</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{statusToDelete?.name}"? This action cannot be undone.
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
    </div>
  )
}

function TechnicianAttributeStatusesTab() {
  const { technicianStatuses, loading, error, createTechnicianStatus, updateTechnicianStatus, deleteTechnicianStatus } = useTechnicianStatuses()
  const { toast } = useToast()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingStatus, setEditingStatus] = useState(null)
  const [statusToDelete, setStatusToDelete] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const form = useForm({
    resolver: zodResolver(technicianAttributeStatusSchema),
    defaultValues: {
      name: "",
    },
  })

  const handleOpenDialog = (status = null) => {
    setEditingStatus(status)
    if (status) {
      form.reset({ name: status.name })
    } else {
      form.reset()
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingStatus(null)
    form.reset()
  }

  const onSubmit = async (data) => {
    setIsSubmitting(true)
    try {
      if (editingStatus) {
        const result = await updateTechnicianStatus(editingStatus.id, data.name)
        if (result.success) {
          toast({
            title: "Success",
            description: `Technician status "${data.name}" has been updated successfully.`,
            variant: "success",
          })
          handleCloseDialog()
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to update technician status. Please try again.",
            variant: "destructive",
          })
        }
      } else {
        const result = await createTechnicianStatus(data.name)
        if (result.success) {
          toast({
            title: "Success",
            description: `Technician status "${data.name}" has been created successfully.`,
            variant: "success",
          })
          handleCloseDialog()
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to create technician status. Please try again.",
            variant: "destructive",
          })
        }
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteClick = (status) => {
    setStatusToDelete(status)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!statusToDelete) return

    setIsDeleting(true)
    try {
      const result = await deleteTechnicianStatus(statusToDelete.id)
      if (result.success) {
        toast({
          title: "Success",
          description: `Technician status "${statusToDelete.name}" has been deleted successfully.`,
          variant: "success",
        })
        setIsDeleteDialogOpen(false)
        setStatusToDelete(null)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete technician status. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false)
    setStatusToDelete(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Technician Attribute Statuses</h2>
          <p className="text-muted-foreground">
            Manage statuses for technician attributes
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Status
              </Button>
            </motion.div>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingStatus ? "Edit Status" : "Create New Status"}
              </DialogTitle>
              <DialogDescription>
                {editingStatus
                  ? "Update the status name below."
                  : "Enter a name for the new status."}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormItem>
                  <FormLabel htmlFor="statusName">Status Name</FormLabel>
                  <FormControl>
                    <Input
                      id="statusName"
                      placeholder="e.g., Completed"
                      {...form.register("name")}
                    />
                  </FormControl>
                  <FormMessage>
                    {form.formState.errors.name?.message}
                  </FormMessage>
                </FormItem>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseDialog}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {editingStatus ? "Updating..." : "Creating..."}
                      </>
                    ) : (
                      editingStatus ? "Update" : "Create"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status Name</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {technicianStatuses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="h-24 text-center">
                        No statuses found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    technicianStatuses.map((status) => (
                      <TableRow key={status.id}>
                        <TableCell className="font-medium">{status.name}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDialog(status)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(status)}
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Technician Status</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{statusToDelete?.name}"? This action cannot be undone.
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
    </div>
  )
}

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState("roles")

  const settingsCategories = [
    {
      title: "User Management",
      items: [
        { id: "roles", label: "Roles", component: <RolesTab /> },
      ],
    },
    {
      title: "Property Management",
      items: [
        { id: "property-types", label: "Property Types", component: <PropertyTypesTab /> },
        { id: "property-locations", label: "Property Locations", component: <PropertyLocationsTab /> },
        { id: "location-attributes", label: "Location Attributes", component: <PropertyLocationAttributesTab /> },
      ],
    },
    {
      title: "Job Management",
      items: [
        { id: "job-types", label: "Job Types", component: <JobTypesTab /> },
        { id: "inspector-statuses", label: "Inspector Statuses", component: <InspectorAttributeStatusesTab /> },
        { id: "technician-statuses", label: "Technician Statuses", component: <TechnicianAttributeStatusesTab /> },
      ],
    },
  ]

  const activeComponent = settingsCategories
    .flatMap((cat) => cat.items)
    .find((item) => item.id === activeTab)?.component

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage system settings and configurations
        </p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Navigation */}
        <aside className="w-64 flex-shrink-0">
          <nav className="space-y-6">
            {settingsCategories.map((category, categoryIndex) => (
              <div key={categoryIndex}>
                <h3 className="mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  {category.title}
                </h3>
                <ul className="space-y-1">
                  {category.items.map((item) => (
                    <li key={item.id}>
                      <button
                        onClick={() => setActiveTab(item.id)}
                        className={`
                          w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors
                          ${
                            activeTab === item.id
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                          }
                        `}
                      >
                        {item.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {activeComponent}
        </div>
      </div>
    </motion.div>
  )
}

