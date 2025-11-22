import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus, Edit, Trash2 } from "lucide-react"
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
  const [roles, setRoles] = useState(initialRoles)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRole, setEditingRole] = useState(null)

  const form = useForm({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: "",
    },
  })

  const handleOpenDialog = (role = null) => {
    setEditingRole(role)
    if (role) {
      form.reset({ name: role })
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

  const onSubmit = (data) => {
    // Placeholder - no API yet
    if (editingRole) {
      setRoles(roles.map((r) => (r === editingRole ? data.name : r)))
    } else {
      setRoles([...roles, data.name])
    }
    handleCloseDialog()
  }

  const handleDelete = (role) => {
    // Placeholder - no API yet
    setRoles(roles.filter((r) => r !== role))
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
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting
                      ? "Saving..."
                      : editingRole
                      ? "Update Role"
                      : "Create Role"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
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
                    <TableRow key={role}>
                      <TableCell className="font-medium">{role}</TableCell>
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
                            onClick={() => handleDelete(role)}
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
        </CardContent>
      </Card>
    </div>
  )
}

function PropertyTypesTab() {
  const [propertyTypes, setPropertyTypes] = useState(initialPropertyTypes)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingType, setEditingType] = useState(null)

  const form = useForm({
    resolver: zodResolver(propertyTypeSchema),
    defaultValues: {
      name: "",
    },
  })

  const handleOpenDialog = (type = null) => {
    setEditingType(type)
    if (type) {
      form.reset({ name: type })
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

  const onSubmit = (data) => {
    // Placeholder - no API yet
    if (editingType) {
      setPropertyTypes(
        propertyTypes.map((t) => (t === editingType ? data.name : t))
      )
    } else {
      setPropertyTypes([...propertyTypes, data.name])
    }
    handleCloseDialog()
  }

  const handleDelete = (type) => {
    // Placeholder - no API yet
    setPropertyTypes(propertyTypes.filter((t) => t !== type))
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
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting
                      ? "Saving..."
                      : editingType
                      ? "Update Property Type"
                      : "Create Property Type"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
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
                    <TableRow key={type}>
                      <TableCell className="font-medium">{type}</TableCell>
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
                            onClick={() => handleDelete(type)}
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
        </CardContent>
      </Card>
    </div>
  )
}

function PropertyLocationsTab() {
  const [locations, setLocations] = useState(initialPropertyLocations)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState(null)

  const form = useForm({
    resolver: zodResolver(propertyLocationSchema),
    defaultValues: {
      name: "",
    },
  })

  const handleOpenDialog = (location = null) => {
    setEditingLocation(location)
    if (location) {
      form.reset({ name: location })
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

  const onSubmit = (data) => {
    // Placeholder - no API yet
    if (editingLocation) {
      setLocations(locations.map((l) => (l === editingLocation ? data.name : l)))
    } else {
      setLocations([...locations, data.name])
    }
    handleCloseDialog()
  }

  const handleDelete = (location) => {
    // Placeholder - no API yet
    setLocations(locations.filter((l) => l !== location))
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
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting
                      ? "Saving..."
                      : editingLocation
                      ? "Update Location"
                      : "Create Location"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Location Name</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {locations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="h-24 text-center">
                      No locations found.
                    </TableCell>
                  </TableRow>
                ) : (
                  locations.map((location) => (
                    <TableRow key={location}>
                      <TableCell className="font-medium">{location}</TableCell>
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
                            onClick={() => handleDelete(location)}
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
        </CardContent>
      </Card>
    </div>
  )
}

function PropertyLocationAttributesTab() {
  const [attributes, setAttributes] = useState(initialPropertyLocationAttributes)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAttribute, setEditingAttribute] = useState(null)

  const form = useForm({
    resolver: zodResolver(propertyLocationAttributeSchema),
    defaultValues: {
      name: "",
    },
  })

  const handleOpenDialog = (attribute = null) => {
    setEditingAttribute(attribute)
    if (attribute) {
      form.reset({ name: attribute })
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

  const onSubmit = (data) => {
    // Placeholder - no API yet
    if (editingAttribute) {
      setAttributes(
        attributes.map((a) => (a === editingAttribute ? data.name : a))
      )
    } else {
      setAttributes([...attributes, data.name])
    }
    handleCloseDialog()
  }

  const handleDelete = (attribute) => {
    // Placeholder - no API yet
    setAttributes(attributes.filter((a) => a !== attribute))
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
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting
                      ? "Saving..."
                      : editingAttribute
                      ? "Update Attribute"
                      : "Create Attribute"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Attribute Name</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attributes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="h-24 text-center">
                      No attributes found.
                    </TableCell>
                  </TableRow>
                ) : (
                  attributes.map((attribute) => (
                    <TableRow key={attribute}>
                      <TableCell className="font-medium">{attribute}</TableCell>
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
                            onClick={() => handleDelete(attribute)}
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
        </CardContent>
      </Card>
    </div>
  )
}

function JobTypesTab() {
  const [jobTypes, setJobTypes] = useState(initialJobTypes)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingJobType, setEditingJobType] = useState(null)

  const form = useForm({
    resolver: zodResolver(jobTypeSchema),
    defaultValues: {
      name: "",
    },
  })

  const handleOpenDialog = (jobType = null) => {
    setEditingJobType(jobType)
    if (jobType) {
      form.reset({ name: jobType })
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

  const onSubmit = (data) => {
    // Placeholder - no API yet
    if (editingJobType) {
      setJobTypes(
        jobTypes.map((jt) => (jt === editingJobType ? data.name : jt))
      )
    } else {
      setJobTypes([...jobTypes, data.name])
    }
    handleCloseDialog()
  }

  const handleDelete = (jobType) => {
    // Placeholder - no API yet
    setJobTypes(jobTypes.filter((jt) => jt !== jobType))
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
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting
                      ? "Saving..."
                      : editingJobType
                      ? "Update Job Type"
                      : "Create Job Type"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
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
                    <TableRow key={jobType}>
                      <TableCell className="font-medium">{jobType}</TableCell>
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
                            onClick={() => handleDelete(jobType)}
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
        </CardContent>
      </Card>
    </div>
  )
}

function InspectorAttributeStatusesTab() {
  const [statuses, setStatuses] = useState(initialInspectorAttributeStatuses)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingStatus, setEditingStatus] = useState(null)

  const form = useForm({
    resolver: zodResolver(inspectorAttributeStatusSchema),
    defaultValues: {
      name: "",
    },
  })

  const handleOpenDialog = (status = null) => {
    setEditingStatus(status)
    if (status) {
      form.reset({ name: status })
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

  const onSubmit = (data) => {
    // Placeholder - no API yet
    if (editingStatus) {
      setStatuses(
        statuses.map((s) => (s === editingStatus ? data.name : s))
      )
    } else {
      setStatuses([...statuses, data.name])
    }
    handleCloseDialog()
  }

  const handleDelete = (status) => {
    // Placeholder - no API yet
    setStatuses(statuses.filter((s) => s !== status))
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

      <Card>
        <CardContent className="pt-6">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status Name</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statuses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="h-24 text-center">
                      No statuses found.
                    </TableCell>
                  </TableRow>
                ) : (
                  statuses.map((status) => (
                    <TableRow key={status}>
                      <TableCell className="font-medium">{status}</TableCell>
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
                            onClick={() => handleDelete(status)}
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
        </CardContent>
      </Card>
    </div>
  )
}

function TechnicianAttributeStatusesTab() {
  const [statuses, setStatuses] = useState(initialTechnicianAttributeStatuses)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingStatus, setEditingStatus] = useState(null)

  const form = useForm({
    resolver: zodResolver(technicianAttributeStatusSchema),
    defaultValues: {
      name: "",
    },
  })

  const handleOpenDialog = (status = null) => {
    setEditingStatus(status)
    if (status) {
      form.reset({ name: status })
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

  const onSubmit = (data) => {
    // Placeholder - no API yet
    if (editingStatus) {
      setStatuses(
        statuses.map((s) => (s === editingStatus ? data.name : s))
      )
    } else {
      setStatuses([...statuses, data.name])
    }
    handleCloseDialog()
  }

  const handleDelete = (status) => {
    // Placeholder - no API yet
    setStatuses(statuses.filter((s) => s !== status))
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

      <Card>
        <CardContent className="pt-6">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status Name</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statuses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="h-24 text-center">
                      No statuses found.
                    </TableCell>
                  </TableRow>
                ) : (
                  statuses.map((status) => (
                    <TableRow key={status}>
                      <TableCell className="font-medium">{status}</TableCell>
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
                            onClick={() => handleDelete(status)}
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
        </CardContent>
      </Card>
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

