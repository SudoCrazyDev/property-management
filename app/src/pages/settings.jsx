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
  const [attributes] = useState(initialPropertyLocationAttributes)
  const [locationAttributes, setLocationAttributes] = useState({
    "Entryway/Hallways": ["Walls", "Baseboards and Trim", "Flooring", "Doors", "Light Fixtures"],
    "Living Room": ["Walls", "Baseboards and Trim", "Flooring", "Windows", "Blinds/Shades", "Light Fixtures"],
    "Dining Area": ["Walls", "Baseboards and Trim", "Flooring", "Windows", "Light Fixtures"],
    "Kitchen": ["Walls", "Baseboards and Trim", "Flooring", "Doors", "Windows", "Light Fixtures", "Electrical Outlets", "HVAC Vents"],
  })
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isAttributeDialogOpen, setIsAttributeDialogOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState(null)
  const [selectedLocationForAttributes, setSelectedLocationForAttributes] = useState(null)

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

  const handleOpenAttributeDialog = (location) => {
    setSelectedLocationForAttributes(location)
    setIsAttributeDialogOpen(true)
  }

  const handleCloseAttributeDialog = () => {
    setIsAttributeDialogOpen(false)
    setSelectedLocationForAttributes(null)
  }

  const onSubmit = (data) => {
    // Placeholder - no API yet
    if (editingLocation) {
      const oldName = editingLocation
      const newName = data.name
      // Update location name and migrate attributes
      if (locationAttributes[oldName]) {
        setLocationAttributes((prev) => {
          const updated = { ...prev }
          updated[newName] = updated[oldName]
          delete updated[oldName]
          return updated
        })
      }
      setLocations(locations.map((l) => (l === editingLocation ? data.name : l)))
    } else {
      setLocations([...locations, data.name])
      setLocationAttributes((prev) => ({
        ...prev,
        [data.name]: [],
      }))
    }
    handleCloseDialog()
  }

  const handleDelete = (location) => {
    // Placeholder - no API yet
    setLocations(locations.filter((l) => l !== location))
    setLocationAttributes((prev) => {
      const updated = { ...prev }
      delete updated[location]
      return updated
    })
  }

  const handleUpdateAttributes = (selectedAttributes) => {
    if (selectedLocationForAttributes) {
      setLocationAttributes((prev) => ({
        ...prev,
        [selectedLocationForAttributes]: selectedAttributes,
      }))
    }
    handleCloseAttributeDialog()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Property Locations</h2>
          <p className="text-muted-foreground">
            Manage property locations and their attributes
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
                  : "Enter a name for the new property location."}
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
                  <TableHead>Attributes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {locations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                      No locations found.
                    </TableCell>
                  </TableRow>
                ) : (
                  locations.map((location) => (
                    <TableRow key={location}>
                      <TableCell className="font-medium">{location}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(locationAttributes[location] || []).length > 0 ? (
                            (locationAttributes[location] || []).map((attr) => (
                              <span
                                key={attr}
                                className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
                              >
                                {attr}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-muted-foreground">No attributes</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenAttributeDialog(location)}
                          >
                            Manage Attributes
                          </Button>
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

      {/* Manage Attributes Dialog */}
      <Dialog open={isAttributeDialogOpen} onOpenChange={setIsAttributeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Attributes for {selectedLocationForAttributes}</DialogTitle>
            <DialogDescription>
              Select the attributes that belong to this location.
            </DialogDescription>
          </DialogHeader>
          <ManageAttributesDialog
            location={selectedLocationForAttributes}
            allAttributes={attributes}
            selectedAttributes={locationAttributes[selectedLocationForAttributes] || []}
            onSave={handleUpdateAttributes}
            onClose={handleCloseAttributeDialog}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ManageAttributesDialog({ location, allAttributes, selectedAttributes, onSave, onClose }) {
  const [selected, setSelected] = useState(selectedAttributes || [])

  const handleToggle = (attribute) => {
    setSelected((prev) =>
      prev.includes(attribute)
        ? prev.filter((a) => a !== attribute)
        : [...prev, attribute]
    )
  }

  const handleSave = () => {
    onSave(selected)
  }

  return (
    <div className="space-y-4">
      <div className="max-h-64 overflow-y-auto space-y-2">
        {allAttributes.map((attribute) => (
          <label
            key={attribute}
            className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent cursor-pointer"
          >
            <input
              type="checkbox"
              checked={selected.includes(attribute)}
              onChange={() => handleToggle(attribute)}
              className="rounded border-gray-300"
            />
            <span className="text-sm">{attribute}</span>
          </label>
        ))}
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave}>Save Attributes</Button>
      </DialogFooter>
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
            Manage attributes that can be assigned to property locations
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

export function SettingsPage() {
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

      <Tabs defaultValue="roles" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="property-types">Property Types</TabsTrigger>
          <TabsTrigger value="property-locations">Property Locations</TabsTrigger>
          <TabsTrigger value="location-attributes">Location Attributes</TabsTrigger>
          <TabsTrigger value="job-types">Job Types</TabsTrigger>
        </TabsList>
        <TabsContent value="roles">
          <RolesTab />
        </TabsContent>
        <TabsContent value="property-types">
          <PropertyTypesTab />
        </TabsContent>
        <TabsContent value="property-locations">
          <PropertyLocationsTab />
        </TabsContent>
        <TabsContent value="location-attributes">
          <PropertyLocationAttributesTab />
        </TabsContent>
        <TabsContent value="job-types">
          <JobTypesTab />
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}

