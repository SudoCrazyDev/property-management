import { useState, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Search, Plus, Edit, Trash2, ChevronLeft, ChevronRight } from "lucide-react"
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
import { STATES, getCountiesForState, getCitiesForCounty } from "@/lib/locations"
import { ImageGallery } from "@/components/ui/image-gallery"

const PROPERTY_TYPES = ["House", "Apartment", "Condo", "Duplex", "Multi-Family", "Commercial"]
const STATUSES = ["Active", "Inactive", "Maintenance"]
// Available property locations - in production, this would come from Settings/API
const AVAILABLE_LOCATIONS = [
  "Entryway/Hallways",
  "Living Room",
  "Dining Area",
  "Kitchen",
  "Bedroom",
  "Bathroom",
  "Basement",
  "Garage",
  "Attic",
  "Laundry Room",
]

const propertySchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["House", "Apartment", "Condo", "Duplex", "Multi-Family", "Commercial"]),
  streetAddress: z.string().min(1, "Street address is required"),
  unitNumber: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zipCode: z.string().min(1, "Zip code is required"),
  county: z.string().min(1, "County is required"),
  status: z.enum(["Active", "Inactive", "Maintenance"]),
  locations: z.array(z.string()).optional().default([]),
  gallery: z.array(z.any()).optional().default([]),
})

// Mock data - replace with API call later
const mockProperties = Array.from({ length: 35 }, (_, i) => {
  const types = PROPERTY_TYPES
  const statuses = STATUSES
  const cities = ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia", "San Antonio", "San Diego"]
  const states = ["NY", "CA", "IL", "TX", "AZ", "PA", "TX", "CA"]
  
  return {
    id: i + 1,
    name: `${types[i % types.length]} ${i + 1}`,
    type: types[i % types.length],
    streetAddress: `${100 + i * 10} Main Street`,
    unitNumber: i % 3 === 0 ? `Unit ${String.fromCharCode(65 + (i % 26))}` : null,
    city: cities[i % cities.length],
    state: states[i % states.length],
    zipCode: `${10000 + i * 100}`,
    county: `${cities[i % cities.length]} County`,
    status: statuses[i % statuses.length],
    locations: AVAILABLE_LOCATIONS.slice(0, Math.floor(Math.random() * 5) + 3), // Random 3-7 locations
    gallery: [], // Empty gallery for mock data
  }
})

export function PropertiesPage() {
  const [properties] = useState(mockProperties)
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProperty, setEditingProperty] = useState(null)
  const itemsPerPage = 10

  const form = useForm({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      name: "",
      type: "House",
      streetAddress: "",
      unitNumber: "",
      city: "",
      state: "",
      zipCode: "",
      county: "",
      status: "Active",
      locations: [],
      gallery: [],
    },
  })

  const selectedState = form.watch("state")
  const selectedCounty = form.watch("county")
  
  const availableCounties = selectedState ? getCountiesForState(selectedState) : []
  const availableCities = selectedState && selectedCounty 
    ? getCitiesForCounty(selectedState, selectedCounty) 
    : []

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
        type: property.type,
        streetAddress: property.streetAddress,
        unitNumber: property.unitNumber || "",
        city: property.city,
        state: property.state,
        zipCode: property.zipCode,
        county: property.county,
        status: property.status,
        locations: property.locations || [],
        gallery: property.gallery || [],
      })
    } else {
      form.reset()
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingProperty(null)
    form.reset()
  }

  const onSubmit = (data) => {
    // Placeholder - no API yet
    console.log(editingProperty ? "Update property:" : "Create property:", data)
    handleCloseDialog()
  }

  const handleDelete = (propertyId) => {
    // Placeholder - no API yet
    console.log("Delete property:", propertyId)
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
                    <FormLabel htmlFor="type">Type</FormLabel>
                    <FormControl>
                      <Select
                        value={form.watch("type")}
                        onValueChange={(value) => {
                          form.setValue("type", value)
                          form.trigger("type")
                        }}
                      >
                        <SelectTrigger id="type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {PROPERTY_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage>
                      {form.formState.errors.type?.message}
                    </FormMessage>
                  </FormItem>
                </div>
                <FormItem>
                  <FormLabel>Property Locations</FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={AVAILABLE_LOCATIONS}
                      selected={form.watch("locations") || []}
                      onChange={(locations) => {
                        form.setValue("locations", locations)
                        form.trigger("locations")
                      }}
                      placeholder="Select property locations..."
                    />
                  </FormControl>
                  <FormMessage>
                    {form.formState.errors.locations?.message}
                  </FormMessage>
                </FormItem>
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
                <FormItem>
                  <FormLabel htmlFor="state">State</FormLabel>
                  <FormControl>
                    <Select
                      value={form.watch("state")}
                      onValueChange={(value) => {
                        form.setValue("state", value)
                        form.setValue("county", "") // Reset county when state changes
                        form.setValue("city", "") // Reset city when state changes
                        form.trigger("state")
                      }}
                    >
                      <SelectTrigger id="state">
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {STATES.map((state) => (
                          <SelectItem key={state.code} value={state.code}>
                            {state.name} ({state.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage>
                    {form.formState.errors.state?.message}
                  </FormMessage>
                </FormItem>
                <FormItem>
                  <FormLabel htmlFor="county">County</FormLabel>
                  <FormControl>
                    <Select
                      value={form.watch("county")}
                      onValueChange={(value) => {
                        form.setValue("county", value)
                        form.setValue("city", "") // Reset city when county changes
                        form.trigger("county")
                      }}
                      disabled={!selectedState || availableCounties.length === 0}
                    >
                      <SelectTrigger id="county">
                        <SelectValue placeholder={selectedState ? "Select county" : "Select state first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCounties.map((county) => (
                          <SelectItem key={county} value={county}>
                            {county}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage>
                    {form.formState.errors.county?.message}
                  </FormMessage>
                </FormItem>
                <FormItem>
                  <FormLabel htmlFor="city">City</FormLabel>
                  <FormControl>
                    <Select
                      value={form.watch("city")}
                      onValueChange={(value) => {
                        form.setValue("city", value)
                        form.trigger("city")
                      }}
                      disabled={!selectedCounty || availableCities.length === 0}
                    >
                      <SelectTrigger id="city">
                        <SelectValue placeholder={selectedCounty ? "Select city" : "Select county first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCities.map((city) => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage>
                    {form.formState.errors.city?.message}
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
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting
                      ? "Saving..."
                      : editingProperty
                      ? "Update Property"
                      : "Create Property"}
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
                  {PROPERTY_TYPES.map((type) => (
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

          <div className="mt-4 rounded-md border">
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
                            onClick={() => handleDelete(property.id)}
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

