import { useState } from "react"
import { 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  X, 
  Upload, 
  FileImage, 
  CheckCircle2,
  XCircle,
  AlertCircle,
  MinusCircle,
  Trash2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { motion, AnimatePresence } from "motion/react"
import { cn } from "@/lib/utils"

// Mock data - replace with API calls later
const INSPECTOR_ID = 1 // Current inspector ID
const INSPECTOR_STATUSES = ["Pass", "Fail", "N/A", "Needs Attention"]
const AVAILABLE_LOCATION_ATTRIBUTES = [
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

// Mock jobs assigned to inspector
const mockJobs = [
  {
    id: 1,
    jobType: "Move In",
    date: "2024-01-15",
    property: {
      id: 1,
      name: "House 1",
      address: "123 Main St, New York, NY 10001",
      locations: ["Entryway/Hallways", "Living Room", "Kitchen"],
    },
    status: "On-Going Inspection",
    attributes: {
      "Entryway/Hallways": [
        {
          id: 1,
          name: "Walls",
          status: "Pass",
          files: [],
        },
        {
          id: 2,
          name: "Flooring",
          status: "Needs Attention",
          files: ["file1.jpg", "file2.jpg"],
        },
      ],
      "Living Room": [
        {
          id: 3,
          name: "Walls",
          status: "",
          files: [],
        },
      ],
      "Kitchen": [],
    },
  },
  {
    id: 2,
    jobType: "Move Out",
    date: "2024-01-20",
    property: {
      id: 2,
      name: "Apartment 2",
      address: "456 Oak Ave, Los Angeles, CA 90001",
      locations: ["Living Room", "Kitchen", "Bedroom"],
    },
    status: "Waiting for Inspector",
    attributes: {},
  },
  {
    id: 3,
    jobType: "Move In",
    date: "2024-01-25",
    property: {
      id: 3,
      name: "Condo 3",
      address: "789 Pine Rd, Chicago, IL 60601",
      locations: ["Entryway/Hallways", "Kitchen"],
    },
    status: "On-Going Inspection",
    attributes: {
      "Entryway/Hallways": [
        {
          id: 4,
          name: "Doors",
          status: "Fail",
          files: ["file3.jpg"],
        },
      ],
    },
  },
]

function FileUploadArea({ files, onFilesChange, attributeId }) {
  const handleFileSelect = (e) => {
    const newFiles = Array.from(e.target.files)
    onFilesChange([...files, ...newFiles])
  }

  const handleRemoveFile = (index) => {
    onFilesChange(files.filter((_, i) => i !== index))
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const newFiles = Array.from(e.dataTransfer.files)
    onFilesChange([...files, ...newFiles])
  }

  return (
    <div
      className="mt-2 rounded-lg border-2 border-dashed border-muted-foreground/25 p-4 md:p-6 transition-colors hover:border-primary/50 active:border-primary"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center justify-center gap-3">
        <Upload className="h-10 w-10 md:h-8 md:w-8 text-muted-foreground" />
        <div className="text-center">
          <label
            htmlFor={`file-upload-${attributeId}`}
            className="cursor-pointer text-base md:text-sm font-medium text-primary hover:underline active:opacity-80"
          >
            Tap to upload
          </label>
          <span className="hidden md:inline text-sm text-muted-foreground"> or drag and drop</span>
        </div>
        <input
          id={`file-upload-${attributeId}`}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          accept="image/*,.pdf,.doc,.docx"
          capture="environment"
        />
        <p className="text-xs md:text-xs text-muted-foreground text-center">
          Images, PDF, DOC, DOCX (max 10MB each)
        </p>
      </div>
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between rounded-md bg-muted/50 p-3 md:p-2 gap-2"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <FileImage className="h-5 w-5 md:h-4 md:w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm md:text-sm truncate">
                  {file.name || (typeof file === "string" ? file : "File")}
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveFile(index)}
                className="h-8 w-8 md:h-6 md:w-6 p-0 flex-shrink-0"
              >
                <X className="h-5 w-5 md:h-4 md:w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function AttributeCard({ attribute, locationName, onUpdate, onDelete }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [status, setStatus] = useState(attribute.status || "")
  const [files, setFiles] = useState(attribute.files || [])

  const handleStatusChange = (newStatus) => {
    setStatus(newStatus)
    onUpdate({
      ...attribute,
      status: newStatus,
      files,
    })
  }

  const handleFilesChange = (newFiles) => {
    setFiles(newFiles)
    onUpdate({
      ...attribute,
      status,
      files: newFiles,
    })
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "Pass":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case "Fail":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "Needs Attention":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      case "N/A":
        return <MinusCircle className="h-4 w-4 text-gray-400" />
      default:
        return null
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "Pass":
        return "bg-green-100 text-green-800 border-green-300"
      case "Fail":
        return "bg-red-100 text-red-800 border-red-300"
      case "Needs Attention":
        return "bg-yellow-100 text-yellow-800 border-yellow-300"
      case "N/A":
        return "bg-gray-100 text-gray-800 border-gray-300"
      default:
        return "bg-muted text-muted-foreground border-border"
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader
        className="p-4 md:p-4"
      >
        <div className="flex items-center justify-between gap-2">
          <div 
            className="flex items-center gap-2 md:gap-3 min-w-0 flex-1 cursor-pointer active:bg-accent/50 -m-2 p-2 rounded"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronDown className="h-5 w-5 md:h-4 md:w-4 text-muted-foreground flex-shrink-0" />
            ) : (
              <ChevronRight className="h-5 w-5 md:h-4 md:w-4 text-muted-foreground flex-shrink-0" />
            )}
            <CardTitle className="text-base md:text-base font-medium truncate">{attribute.name}</CardTitle>
            {status && <span className="flex-shrink-0">{getStatusIcon(status)}</span>}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {status ? (
              <span
                className={cn(
                  "rounded-full border px-3 py-1.5 md:px-2 md:py-1 text-xs font-medium",
                  getStatusColor(status)
                )}
              >
                {status}
              </span>
            ) : (
              <span className="rounded-full border border-muted-foreground/30 bg-muted/50 text-muted-foreground px-3 py-1.5 md:px-2 md:py-1 text-xs font-medium">
                No Status
              </span>
            )}
            {onDelete && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete()
                }}
                className="h-8 w-8 md:h-6 md:w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-5 w-5 md:h-4 md:w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CardContent className="space-y-4 p-4 md:p-4 pt-0">
              <div>
                <label className="mb-2 md:mb-2 block text-sm md:text-sm font-medium">
                  Status
                </label>
                <Select value={status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="h-11 md:h-10 text-base md:text-sm">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {INSPECTOR_STATUSES.map((s) => (
                      <SelectItem key={s} value={s} className="text-base md:text-sm py-3 md:py-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(s)}
                          {s}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-2 md:mb-2 block text-sm md:text-sm font-medium">
                  Attachments ({files.length})
                </label>
                <FileUploadArea
                  files={files}
                  onFilesChange={handleFilesChange}
                  attributeId={attribute.id}
                />
              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}

function LocationSection({ locationName, attributes, availableAttributes, onUpdate }) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [showAddAttribute, setShowAddAttribute] = useState(false)
  const [newAttributeName, setNewAttributeName] = useState("")

  const handleAddAttribute = () => {
    if (newAttributeName && !attributes.find((a) => a.name === newAttributeName)) {
      const newAttribute = {
        id: Date.now(),
        name: newAttributeName,
        status: "",
        files: [],
      }
      onUpdate([...attributes, newAttribute])
      setNewAttributeName("")
      setShowAddAttribute(false)
    }
  }

  const handleUpdateAttribute = (updatedAttribute) => {
    onUpdate(
      attributes.map((a) =>
        a.id === updatedAttribute.id ? updatedAttribute : a
      )
    )
  }

  const handleRemoveAttribute = (attributeId) => {
    onUpdate(attributes.filter((a) => a.id !== attributeId))
  }

  const unselectedAttributes = availableAttributes.filter(
    (attr) => !attributes.find((a) => a.name === attr)
  )

  return (
    <Card className="overflow-hidden">
      <CardHeader
        className="cursor-pointer p-4 md:p-4 active:bg-accent/50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
            {isExpanded ? (
              <ChevronDown className="h-5 w-5 md:h-5 md:w-5 text-muted-foreground flex-shrink-0" />
            ) : (
              <ChevronRight className="h-5 w-5 md:h-5 md:w-5 text-muted-foreground flex-shrink-0" />
            )}
            <CardTitle className="text-lg md:text-lg truncate">{locationName}</CardTitle>
            <span className="text-sm md:text-sm text-muted-foreground flex-shrink-0">
              ({attributes.length})
            </span>
          </div>
        </div>
      </CardHeader>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CardContent className="space-y-3 p-4 md:p-4 pt-0">
              {attributes.map((attribute) => (
                <AttributeCard
                  key={attribute.id}
                  attribute={attribute}
                  locationName={locationName}
                  onUpdate={handleUpdateAttribute}
                  onDelete={() => handleRemoveAttribute(attribute.id)}
                />
              ))}
              {showAddAttribute ? (
                <Card className="border-dashed">
                  <CardContent className="p-4 md:p-4">
                    <div className="space-y-3">
                      <Select
                        value={newAttributeName}
                        onValueChange={setNewAttributeName}
                      >
                        <SelectTrigger className="h-11 md:h-10 text-base md:text-sm">
                          <SelectValue placeholder="Select attribute" />
                        </SelectTrigger>
                        <SelectContent>
                          {unselectedAttributes.map((attr) => (
                            <SelectItem key={attr} value={attr} className="text-base md:text-sm py-3 md:py-2">
                              {attr}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="default"
                          className="h-11 md:h-9 text-base md:text-sm flex-1"
                          onClick={handleAddAttribute}
                          disabled={!newAttributeName}
                        >
                          Add
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="default"
                          className="h-11 md:h-9 text-base md:text-sm flex-1"
                          onClick={() => {
                            setShowAddAttribute(false)
                            setNewAttributeName("")
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-dashed h-11 md:h-9 text-base md:text-sm"
                  onClick={() => setShowAddAttribute(true)}
                  disabled={unselectedAttributes.length === 0}
                >
                  <Plus className="mr-2 h-5 w-5 md:h-4 md:w-4" />
                  Add Attribute
                </Button>
              )}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}

function JobCard({ job, onUpdate }) {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleLocationUpdate = (locationName, attributes) => {
    const updatedAttributes = {
      ...job.attributes,
      [locationName]: attributes,
    }
    onUpdate({
      ...job,
      attributes: updatedAttributes,
    })
  }

  const handleSaveAsDraft = () => {
    // Placeholder - replace with API call later
    console.log("Saving as draft:", job)
    // Update job status to draft or similar
    onUpdate({
      ...job,
      status: "Draft",
    })
  }

  const handleSendToTechnician = () => {
    // Placeholder - replace with API call later
    console.log("Sending to technician:", job)
    // Update job status to waiting for technician
    onUpdate({
      ...job,
      status: "Waiting for Technician",
    })
  }

  const jobContent = (
    <div className="space-y-4">
      {job.property.locations.map((locationName) => (
        <LocationSection
          key={locationName}
          locationName={locationName}
          attributes={job.attributes[locationName] || []}
          availableAttributes={AVAILABLE_LOCATION_ATTRIBUTES}
          onUpdate={(attributes) =>
            handleLocationUpdate(locationName, attributes)
          }
        />
      ))}
    </div>
  )

  return (
    <>
      {/* Mobile/Tablet: Full-width Sheet */}
      <Sheet open={isExpanded} onOpenChange={setIsExpanded}>
        <Card className="overflow-hidden lg:hidden">
          <CardHeader
            className="cursor-pointer p-4 active:bg-accent/50"
            onClick={() => setIsExpanded(true)}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <CardTitle className="text-lg truncate">{job.property.name}</CardTitle>
                </div>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                  {job.property.address}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
                    {job.jobType}
                  </span>
                  <span className="rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground">
                    {job.status}
                  </span>
                  <span className="rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground">
                    {job.date}
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>
        <SheetContent side="bottom" className="h-[90vh] w-full p-0 flex flex-col">
          <div className="sticky top-0 z-10 bg-background border-b p-4 flex-shrink-0">
            <SheetHeader>
              <SheetTitle className="text-xl">{job.property.name}</SheetTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {job.property.address}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
                  {job.jobType}
                </span>
                <span className="rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground">
                  {job.status}
                </span>
                <span className="rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground">
                  {job.date}
                </span>
              </div>
            </SheetHeader>
          </div>
          <div className="flex-1 overflow-y-auto p-4 min-h-0">
            {jobContent}
          </div>
          <div className="sticky bottom-0 z-10 border-t bg-background p-4 flex-shrink-0">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-11 text-base"
                onClick={handleSaveAsDraft}
              >
                Save as Draft
              </Button>
              <Button
                type="button"
                className="flex-1 h-11 text-base"
                onClick={handleSendToTechnician}
              >
                For Technician
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop: Inline expansion */}
      <Card className="hidden lg:block overflow-hidden">
        <CardHeader
          className="cursor-pointer p-6 active:bg-accent/50"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                {isExpanded ? (
                  <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                )}
                <CardTitle className="text-xl truncate">{job.property.name}</CardTitle>
              </div>
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                {job.property.address}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  {job.jobType}
                </span>
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                  {job.status}
                </span>
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                  {job.date}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <CardContent className="space-y-4 p-6 pt-0 max-h-[70vh] overflow-y-auto">
                {jobContent}
              </CardContent>
              <div className="border-t bg-background p-6 pt-0">
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={handleSaveAsDraft}
                  >
                    Save as Draft
                  </Button>
                  <Button
                    type="button"
                    className="flex-1"
                    onClick={handleSendToTechnician}
                  >
                    For Technician
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </>
  )
}

export function InspectorPage() {
  const [jobs, setJobs] = useState(mockJobs)

  const handleJobUpdate = (updatedJob) => {
    setJobs(jobs.map((j) => (j.id === updatedJob.id ? updatedJob : j)))
  }

  const assignedJobs = jobs.filter((job) => job.status === "On-Going Inspection" || job.status === "Waiting for Inspector")

  return (
    <div className="container mx-auto space-y-4 md:space-y-6 p-4 md:p-6 max-w-7xl">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl md:text-3xl font-bold">Inspector Dashboard</h1>
        <p className="mt-2 text-sm md:text-base text-muted-foreground">
          Manage inspections and add location attributes for assigned jobs
        </p>
      </motion.div>

      {assignedJobs.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">No jobs assigned at the moment.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {assignedJobs.map((job, index) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <JobCard job={job} onUpdate={handleJobUpdate} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

