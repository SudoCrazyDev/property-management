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
import { MultiSelect } from "@/components/ui/multi-select"
import { motion } from "motion/react"
import { ImageGallery } from "@/components/ui/image-gallery"
import { LocationPicker } from "@/components/ui/location-picker"
import { useProperties } from "@/hooks/use-properties"
import { usePropertyTypes } from "@/hooks/use-property-types"
import { usePropertyLocations } from "@/hooks/use-property-locations"
import { useToast } from "@/hooks/use-toast"

const STATUSES = ["Active", "Inactive", "Maintenance"]

const propertySchema = z.object({
  name: z.string().min(1, "Name is required"),
  typeId: z.string().min(1, "Type is required"),
  streetAddress: z.string().min(1, "Street address is required"),
  unitNumber: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zipCode: z.string().min(1, "Zip code is required"),
  county: z.string().min(1, "County is required"),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  status: z.enum(["Active", "Inactive", "Maintenance"]),
  locationIds: z.array(z.string()).optional().default([]),
  gallery: z.array(z.any()).optional().default([]),
})

export function PropertiesPage() {
  const { properties, loading, error, createProperty, updateProperty, deleteProperty } = useProperties()
  const { propertyTypes } = usePropertyTypes()
  const { propertyLocations } = usePropertyLocations()
  const { toast } = useToast()
  
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingProperty, setEditingProperty] = useState(null)
  const [propertyToDelete, setPropertyToDelete] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const itemsPerPage = 10

  const form = useForm({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      name: "",
      typeId: "",
      streetAddress: "",
      unitNumber: "",
      city: "",
      state: "",
      zipCode: "",
      county: "",
      latitude: undefined,
      longitude: undefined,
      status: "Active",
      locationIds: [],
      gallery: [],
    },
  })

  const filteredProperties = useMemo(() => {
    return properties.filter((property) => {
      const matchesSearch =
        searchQuery === "" ||
        property.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.streetAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.zipCode.includes(searchQuery)
      const matchesType = typeFilter === "all" || property.type === typeFilter
      const matchesStatus = statusFilter === "all" || property.status === statusFilter
      return matchesSearch && matchesType && matchesStatus
    })
  }, [properties, searchQuery, typeFilter, statusFilter])

  // Get unique property types for filter dropdown
  const availableTypes = useMemo(() => {
    return Array.from(new Set(properties.map((p) => p.type))).filter(Boolean)
  }, [properties])

  const paginatedProperties = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredProperties.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredProperties, currentPage])

  const totalPages = Math.ceil(filteredProperties.length / itemsPerPage)

  const handleOpenDialog = (property = null) => {
    setEditingProperty(property)
    if (property) {
      form.reset({
        name: property.name,
        typeId: property.typeId,
        streetAddress: property.streetAddress,
        unitNumber: property.unitNumber || "",
        city: property.city,
        state: property.state,
        zipCode: property.zipCode,
        county: property.county,
        latitude: property.latitude,
        longitude: property.longitude,
        status: property.status,
        locationIds: property.locations?.map((loc) => loc.id) || [],
        gallery: property.gallery || [],
      })
    } else {
      form.reset({
        name: "",
        typeId: "",
        streetAddress: "",
        unitNumber: "",
        city: "",
        state: "",
        zipCode: "",
        county: "",
        latitude: undefined,
        longitude: undefined,
        status: "Active",
        locationIds: [],
        gallery: [],
      })
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingProperty(null)
    form.reset()
  }

  const onSubmit = async (data) => {
    setIsSubmitting(true)
    try {
      // Separate new files from existing paths
      const galleryValue = form.watch("gallery") || []
      const newFiles = galleryValue.filter((item) => item instanceof File || (item && item.file))
      const existingPaths = galleryValue.filter((item) => typeof item === "string" && !item.file)

      // Extract File objects from preview objects
      const filesToUpload = newFiles.map((item) => (item.file ? item.file : item)).filter((item) => item instanceof File)

      const propertyData = {
        name: data.name,
        typeId: data.typeId,
        streetAddress: data.streetAddress,
        unitNumber: data.unitNumber || null,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        county: data.county,
        latitude: data.latitude,
        longitude: data.longitude,
        status: data.status,
        locationIds: data.locationIds || [],
      }

      if (editingProperty) {
        // Determine which images to delete (existing paths not in current gallery)
        const originalPaths = editingProperty.gallery || []
        const imagesToDelete = originalPaths.filter((path) => !existingPaths.includes(path))

        const result = await updateProperty(
          editingProperty.id,
          propertyData,
          filesToUpload,
          imagesToDelete
        )

        if (result.success) {
          toast({
            title: "Success",
            description: `Property "${data.name}" has been updated successfully.`,
            variant: "success",
          })
          handleCloseDialog()
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to update property. Please try again.",
            variant: "destructive",
          })
        }
      } else {
        const result = await createProperty(propertyData, filesToUpload)

        if (result.success) {
          toast({
            title: "Success",
            description: `Property "${data.name}" has been created successfully.`,
            variant: "success",
          })
          handleCloseDialog()
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to create property. Please try again.",
            variant: "destructive",
          })
        }
      }
    } catch (err) {
      toast({
        title: "Error",
        description: err.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteClick = (property) => {
    setPropertyToDelete(property)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!propertyToDelete) return

    setIsDeleting(true)
    try {
      const result = await deleteProperty(propertyToDelete.id)
      if (result.success) {
        toast({
          title: "Success",
          description: `Property "${propertyToDelete.name}" has been deleted successfully.`,
          variant: "success",
        })
        setIsDeleteDialogOpen(false)
        setPropertyToDelete(null)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete property. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false)
    setPropertyToDelete(null)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "Active":
        return "bg-green-500/10 text-green-700 dark:text-green-400"
      case "Inactive":
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400"
      case "Maintenance":
        return "bg-orange-500/10 text-orange-700 dark:text-orange-400"
      default:
        return "bg-primary/10 text-primary"
    }
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
          <h1 className="text-3xl font-bold tracking-tight">Properties</h1>
          <p className="text-muted-foreground">
            Manage properties and their details
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
                Add Property
              </Button>
            </motion.div>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProperty ? "Edit Property" : "Create New Property"}
              </DialogTitle>
              <DialogDescription>
                {editingProperty
                  ? "Update property information below."
                  : "Fill in the details to create a new property."}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormItem>
                    <FormLabel htmlFor="name">Name</FormLabel>
                    <FormControl>
                      <Input
                        id="name"
                        placeholder="Property Name"
                        {...form.register("name")}
                      />
                    </FormControl>
                    <FormMessage>
                      {form.formState.errors.name?.message}
                    </FormMessage>
                  </FormItem>
                  <FormItem>
                    <FormLabel htmlFor="typeId">Type</FormLabel>
                    <FormControl>
                      <Select
                        value={form.watch("typeId")}
                        onValueChange={(value) => {
                          form.setValue("typeId", value)
                          form.trigger("typeId")
                        }}
                      >
                        <SelectTrigger id="typeId">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {propertyTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage>
                      {form.formState.errors.typeId?.message}
                    </FormMessage>
                  </FormItem>
                </div>
                <FormItem>
                  <FormLabel>Property Locations</FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={propertyLocations.map((loc) => ({ value: loc.id, label: loc.name }))}
                      selected={form.watch("locationIds") || []}
                      onChange={(locationIds) => {
                        form.setValue("locationIds", locationIds)
                        form.trigger("locationIds")
                      }}
                      placeholder="Select property locations..."
                    />
                  </FormControl>
                  <FormMessage>
                    {form.formState.errors.locationIds?.message}
                  </FormMessage>
                </FormItem>
                <FormItem>
                  <FormLabel>Property Location</FormLabel>
                  <FormControl>
                    <LocationPicker
                      value={{
                        latitude: form.watch("latitude"),
                        longitude: form.watch("longitude"),
                      }}
                      onChange={(coords) => {
                        if (coords.latitude && coords.longitude) {
                          form.setValue("latitude", coords.latitude)
                          form.setValue("longitude", coords.longitude)
                          form.trigger("latitude")
                          form.trigger("longitude")
                        }
                      }}
                      onAddressChange={(addressData) => {
                        // Auto-populate address fields from reverse geocoding
                        if (addressData.streetAddress) {
                          form.setValue("streetAddress", addressData.streetAddress)
                        }
                        if (addressData.city) {
                          form.setValue("city", addressData.city)
                        }
                        if (addressData.state) {
                          form.setValue("state", addressData.state)
                        }
                        if (addressData.zipCode) {
                          form.setValue("zipCode", addressData.zipCode)
                        }
                        if (addressData.county) {
                          form.setValue("county", addressData.county)
                        }
                      }}
                      height="400px"
                    />
                  </FormControl>
                  <FormMessage>
                    {form.formState.errors.latitude?.message || form.formState.errors.longitude?.message}
                  </FormMessage>
                </FormItem>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Address Details</h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        // Geocode from address fields to map
                        const streetAddress = form.watch("streetAddress")
                        const city = form.watch("city")
                        const state = form.watch("state")
                        const zipCode = form.watch("zipCode")
                        
                        if (!streetAddress && !city) {
                          return
                        }
                        
                        const addressQuery = [
                          streetAddress,
                          city,
                          state,
                          zipCode
                        ].filter(Boolean).join(", ")
                        
                        try {
                          const response = await fetch(
                            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressQuery)}&limit=1`,
                            {
                              headers: {
                                "User-Agent": "Property Management App"
                              }
                            }
                          )
                          
                          if (response.ok) {
                            const data = await response.json()
                            if (data && data.length > 0) {
                              const lat = parseFloat(data[0].lat)
                              const lng = parseFloat(data[0].lon)
                              form.setValue("latitude", lat)
                              form.setValue("longitude", lng)
                              form.trigger("latitude")
                              form.trigger("longitude")
                            }
                          }
                        } catch (error) {
                          console.error("Error geocoding address:", error)
                        }
                      }}
                    >
                      <Search className="mr-2 h-4 w-4" />
                      Find on Map
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormItem>
                      <FormLabel htmlFor="streetAddress">Street Address</FormLabel>
                      <FormControl>
                        <Input
                          id="streetAddress"
                          placeholder="123 Main Street"
                          {...form.register("streetAddress")}
                        />
                      </FormControl>
                      <FormMessage>
                        {form.formState.errors.streetAddress?.message}
                      </FormMessage>
                    </FormItem>
                    <FormItem>
                      <FormLabel htmlFor="unitNumber">Unit Number (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          id="unitNumber"
                          placeholder="Unit A, Apt 2B, etc."
                          {...form.register("unitNumber")}
                        />
                      </FormControl>
                      <FormMessage>
                        {form.formState.errors.unitNumber?.message}
                      </FormMessage>
                    </FormItem>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <FormItem>
                      <FormLabel htmlFor="city">City</FormLabel>
                      <FormControl>
                        <Input
                          id="city"
                          placeholder="City"
                          {...form.register("city")}
                        />
                      </FormControl>
                      <FormMessage>
                        {form.formState.errors.city?.message}
                      </FormMessage>
                    </FormItem>
                    <FormItem>
                      <FormLabel htmlFor="state">State</FormLabel>
                      <FormControl>
                        <Input
                          id="state"
                          placeholder="State"
                          {...form.register("state")}
                        />
                      </FormControl>
                      <FormMessage>
                        {form.formState.errors.state?.message}
                      </FormMessage>
                    </FormItem>
                    <FormItem>
                      <FormLabel htmlFor="zipCode">Zip Code</FormLabel>
                      <FormControl>
                        <Input
                          id="zipCode"
                          placeholder="10001"
                          {...form.register("zipCode")}
                        />
                      </FormControl>
                      <FormMessage>
                        {form.formState.errors.zipCode?.message}
                      </FormMessage>
                    </FormItem>
                  </div>
                  <FormItem>
                    <FormLabel htmlFor="county">County</FormLabel>
                    <FormControl>
                      <Input
                        id="county"
                        placeholder="County"
                        {...form.register("county")}
                      />
                    </FormControl>
                    <FormMessage>
                      {form.formState.errors.county?.message}
                    </FormMessage>
                  </FormItem>
                </div>
                <FormItem>
                  <FormLabel htmlFor="status">Status</FormLabel>
                  <FormControl>
                    <Select
                      value={form.watch("status")}
                      onValueChange={(value) => {
                        form.setValue("status", value)
                        form.trigger("status")
                      }}
                    >
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage>
                    {form.formState.errors.status?.message}
                  </FormMessage>
                </FormItem>
                <FormItem>
                  <FormLabel>Gallery</FormLabel>
                  <FormControl>
                    <ImageGallery
                      value={form.watch("gallery") || []}
                      onChange={(gallery) => {
                        form.setValue("gallery", gallery)
                        form.trigger("gallery")
                      }}
                      maxImages={10}
                    />
                  </FormControl>
                  <FormMessage>
                    {form.formState.errors.gallery?.message}
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
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {editingProperty ? "Updating..." : "Creating..."}
                      </>
                    ) : (
                      editingProperty ? "Update Property" : "Create Property"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 items-center gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search properties..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="pl-9"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {availableTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-muted-foreground">
              Showing {filteredProperties.length} propert{filteredProperties.length !== 1 ? "ies" : "y"}
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="mt-4 rounded-md border">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>Zip Code</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedProperties.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center">
                        No properties found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedProperties.map((property) => (
                      <TableRow key={property.id}>
                        <TableCell className="font-medium">
                          {property.name}
                        </TableCell>
                        <TableCell>
                          <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                            {property.type}
                          </span>
                        </TableCell>
                        <TableCell>
                          {property.streetAddress}
                          {property.unitNumber && (
                            <span className="text-muted-foreground">, {property.unitNumber}</span>
                          )}
                        </TableCell>
                        <TableCell>{property.city}</TableCell>
                        <TableCell>{property.state}</TableCell>
                        <TableCell>{property.zipCode}</TableCell>
                        <TableCell>
                          <span className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(property.status)}`}>
                            {property.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDialog(property)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(property)}
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

