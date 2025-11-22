import { useState, useMemo, useEffect, useRef } from "react"
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
  Trash2,
  Loader2,
  Wifi,
  WifiOff,
  Cloud,
  CloudOff,
  Camera
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { motion, AnimatePresence } from "motion/react"
import { cn } from "@/lib/utils"
import { useJobs } from "@/hooks/use-jobs"
import { useAuth } from "@/hooks/use-auth"
import { useProperties } from "@/hooks/use-properties"
import { usePropertyLocations } from "@/hooks/use-property-locations"
import { useLocationAttributes } from "@/hooks/use-location-attributes"
import { useInspectorStatuses } from "@/hooks/use-inspector-statuses"
import { useOnlineStatus } from "@/hooks/use-online-status"
import { useDraft } from "@/hooks/use-draft"
import { storeFileOffline, deleteFileOffline } from "@/lib/draft-storage"
import { uploadQueue } from "@/lib/upload-queue"
import { supabase } from "@/lib/supabase"

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
  {
    id: 4,
    jobType: "Move Out",
    date: "2024-01-10",
    property: {
      id: 4,
      name: "House 4",
      address: "321 Elm St, Boston, MA 02101",
      locations: ["Living Room", "Kitchen"],
    },
    status: "Done",
    attributes: {
      "Living Room": [
        {
          id: 5,
          name: "Walls",
          status: "Pass",
          files: [],
        },
      ],
    },
  },
  {
    id: 5,
    jobType: "Move In",
    date: "2024-01-05",
    property: {
      id: 5,
      name: "Apartment 5",
      address: "654 Maple Dr, Seattle, WA 98101",
      locations: ["Entryway/Hallways"],
    },
    status: "For QA",
    attributes: {
      "Entryway/Hallways": [
        {
          id: 6,
          name: "Flooring",
          status: "Pass",
          files: [],
        },
      ],
    },
  },
]

function FileUploadArea({ files, onFilesChange, attributeId, uploadStatuses = {} }) {
  const { isOnline = true } = useOnlineStatus() || {}
  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)
  
  const handleFileSelect = (e) => {
    const newFiles = Array.from(e.target.files)
    if (newFiles.length > 0) {
      onFilesChange([...files, ...newFiles])
    }
    // Reset input so same file can be selected again
    if (e.target) {
      e.target.value = ""
    }
  }

  const handleCameraClick = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.click()
    }
  }

  const handleFileClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleRemoveFile = async (index) => {
    const fileToRemove = files[index]
    
    // If file has offline storage, delete it from IndexedDB
    if (fileToRemove?.offlineId) {
      try {
        const { deleteFileOffline } = await import("@/lib/draft-storage")
        await deleteFileOffline(fileToRemove.offlineId)
      } catch (error) {
        console.error("Error deleting file from IndexedDB:", error)
      }
    }
    
    // Remove from upload queue if it's queued
    if (uploadStatuses[fileToRemove?.name]?.queueId) {
      const { uploadQueue } = await import("@/lib/upload-queue")
      uploadQueue.remove(uploadStatuses[fileToRemove.name].queueId)
    }
    
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

  const getFileStatusIcon = (file) => {
    const status = uploadStatuses[file.name]
    if (!status) {
      if (!isOnline && file instanceof File) {
        return <CloudOff className="h-4 w-4 text-yellow-600" />
      }
      if (file.uploaded || typeof file === "string") {
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      }
      return null
    }

    switch (status.status) {
      case "uploading":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "pending":
        return <Cloud className="h-4 w-4 text-yellow-600" />
      default:
        return null
    }
  }

  const getFileStatusText = (file) => {
    const status = uploadStatuses[file.name]
    if (!status) {
      if (!isOnline && file instanceof File) {
        return "Waiting for connection"
      }
      if (file.uploaded || typeof file === "string") {
        return "Uploaded"
      }
      return ""
    }

    switch (status.status) {
      case "uploading":
        return `Uploading... ${status.progress || 0}%`
      case "completed":
        return "Uploaded"
      case "failed":
        return "Upload failed - will retry"
      case "pending":
        return "Queued for upload"
      default:
        return ""
    }
  }

  return (
    <div
      className="mt-2 rounded-lg border-2 border-dashed border-muted-foreground/25 p-4 md:p-6 transition-colors hover:border-primary/50 active:border-primary"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center justify-center gap-3">
        <Upload className="h-10 w-10 md:h-8 md:w-8 text-muted-foreground" />
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
          {/* Camera Button */}
          <Button
            type="button"
            variant="outline"
            className="flex-1 sm:flex-initial gap-2 h-10"
            onClick={handleCameraClick}
          >
            <Camera className="h-4 w-4" />
            <span className="text-sm">Take Photo</span>
          </Button>
          
          {/* File Upload Button */}
          <Button
            type="button"
            variant="outline"
            className="flex-1 sm:flex-initial gap-2 h-10"
            onClick={handleFileClick}
          >
            <Upload className="h-4 w-4" />
            <span className="text-sm">Choose Files</span>
          </Button>
        </div>
        
        {/* Hidden file inputs */}
        {/* Camera input - opens camera directly on mobile devices */}
        <input
          ref={cameraInputRef}
          type="file"
          className="hidden"
          onChange={handleFileSelect}
          accept="image/*"
          capture="environment"
        />
        <input
          ref={fileInputRef}
          id={`file-upload-${attributeId}`}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          accept="image/*,.pdf,.doc,.docx"
        />
        
        <p className="text-xs md:text-xs text-muted-foreground text-center">
          Images, PDF, DOC, DOCX (max 10MB each)
        </p>
        <p className="text-xs text-muted-foreground/70 text-center mt-1">
          Camera works best on mobile devices
        </p>
        {!isOnline && (
          <p className="text-xs text-yellow-600 text-center mt-1">
            <WifiOff className="h-3 w-3 inline mr-1" />
            Offline mode - files will upload when connection is restored
          </p>
        )}
      </div>
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between rounded-md bg-muted/50 p-3 md:p-2 gap-2"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {getFileStatusIcon(file) || (
                  <FileImage className="h-5 w-5 md:h-4 md:w-4 text-muted-foreground flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm md:text-sm truncate">
                    {file.name || (typeof file === "string" ? file : "File")}
                  </div>
                  {getFileStatusText(file) && (
                    <div className="text-xs text-muted-foreground">
                      {getFileStatusText(file)}
                    </div>
                  )}
                </div>
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

function AttributeCard({ attribute, locationName, onUpdate, onDelete, inspectorStatuses, jobId }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [status, setStatus] = useState(attribute.status || "")
  const [files, setFiles] = useState(attribute.files || [])
  const [fileUploadStatuses, setFileUploadStatuses] = useState({}) // Track upload status for each file
  const { isOnline = true } = useOnlineStatus() || {}

  const handleStatusChange = (newStatus) => {
    setStatus(newStatus)
    onUpdate({
      ...attribute,
      status: newStatus,
      files,
    })
  }

  const handleFilesChange = async (newFiles) => {
    // Always store files locally first (in IndexedDB), regardless of online status
    // This ensures files are saved even if connection is lost
    const processedFiles = await Promise.all(
      newFiles.map(async (file) => {
        // If it's a File object, store it offline first
        if (file instanceof File) {
          try {
            const { storeFileOffline } = await import("@/lib/draft-storage")
            const fileId = await storeFileOffline(jobId, attribute.id, file)
            return {
              ...file,
              offlineId: fileId,
              uploadStatus: "pending",
              uploaded: false, // Mark as not uploaded yet
            }
          } catch (error) {
            console.error("Error storing file offline:", error)
            return file
          }
        }
        return file
      })
    )

    setFiles(processedFiles)
    onUpdate({
      ...attribute,
      status,
      files: processedFiles,
    })

    // Don't upload automatically - files will be uploaded when user clicks "Save as Draft" or "For Technician"
  }

  const queueFileUpload = (file) => {
    const queueItemId = uploadQueue.enqueue(
      {
        file,
        fileId: file.offlineId,
        jobId,
        attributeId: attribute.id,
      },
      (progress) => {
        // Progress callback
        setFileUploadStatuses((prev) => ({
          ...prev,
          [file.name]: { status: "uploading", progress: progress.progress },
        }))
      },
      async (uploadedPath) => {
        // Complete callback
        setFileUploadStatuses((prev) => ({
          ...prev,
          [file.name]: { status: "completed", path: uploadedPath },
        }))
        
        // Delete file from IndexedDB after successful upload
        if (file.offlineId) {
          try {
            const { deleteFileOffline } = await import("@/lib/draft-storage")
            await deleteFileOffline(file.offlineId)
          } catch (error) {
            console.error("Error deleting file from IndexedDB after upload:", error)
          }
        }
        
        // Update file in files array - replace File object with path string
        const updatedFiles = files.map((f) =>
          f === file ? uploadedPath : f
        )
        setFiles(updatedFiles)
        onUpdate({
          ...attribute,
          status,
          files: updatedFiles,
        })
      },
      (error) => {
        // Error callback
        setFileUploadStatuses((prev) => ({
          ...prev,
          [file.name]: { status: "failed", error },
        }))
      }
    )

    // Track upload status
    setFileUploadStatuses((prev) => ({
      ...prev,
      [file.name]: { status: "pending", queueId: queueItemId },
    }))
  }

  // Don't auto-upload when coming back online - files will be uploaded when user saves/submits

  const getStatusIcon = (statusName) => {
    // Try to match status name to common patterns
    if (!statusName) return null
    const lowerStatus = statusName.toLowerCase()
    if (lowerStatus.includes("pass") || lowerStatus.includes("good")) {
      return <CheckCircle2 className="h-4 w-4 text-green-600" />
    }
    if (lowerStatus.includes("fail") || lowerStatus.includes("bad")) {
      return <XCircle className="h-4 w-4 text-red-600" />
    }
    if (lowerStatus.includes("attention") || lowerStatus.includes("warning")) {
      return <AlertCircle className="h-4 w-4 text-yellow-600" />
    }
    if (lowerStatus.includes("n/a") || lowerStatus.includes("not applicable")) {
      return <MinusCircle className="h-4 w-4 text-gray-400" />
    }
    return null
  }

  const getStatusColor = (statusName) => {
    if (!statusName) return "bg-muted text-muted-foreground border-border"
    const lowerStatus = statusName.toLowerCase()
    if (lowerStatus.includes("pass") || lowerStatus.includes("good")) {
      return "bg-green-100 text-green-800 border-green-300"
    }
    if (lowerStatus.includes("fail") || lowerStatus.includes("bad")) {
      return "bg-red-100 text-red-800 border-red-300"
    }
    if (lowerStatus.includes("attention") || lowerStatus.includes("warning")) {
      return "bg-yellow-100 text-yellow-800 border-yellow-300"
    }
    if (lowerStatus.includes("n/a") || lowerStatus.includes("not applicable")) {
      return "bg-gray-100 text-gray-800 border-gray-300"
    }
    return "bg-muted text-muted-foreground border-border"
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
                <div className="flex flex-wrap gap-2">
                  {inspectorStatuses.map((s) => {
                    const isSelected = status === s.name
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleStatusChange(s.name)}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 md:px-2.5 md:py-1.5 text-xs md:text-xs font-medium transition-all",
                          "hover:scale-105 active:scale-95",
                          isSelected
                            ? getStatusColor(s.name) + " shadow-sm ring-2 ring-primary/20"
                            : "bg-background text-muted-foreground border-muted-foreground/30 hover:border-primary/50 hover:text-foreground"
                        )}
                      >
                        {getStatusIcon(s.name)}
                        <span>{s.name}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
              <div>
                <label className="mb-2 md:mb-2 block text-sm md:text-sm font-medium">
                  Attachments ({files.length})
                  {!isOnline && (
                    <span className="ml-2 text-xs text-yellow-600 font-normal">
                      (Offline - files will upload when connection is restored)
                    </span>
                  )}
                </label>
                <FileUploadArea
                  files={files}
                  onFilesChange={handleFilesChange}
                  attributeId={attribute.id}
                  uploadStatuses={fileUploadStatuses}
                />
              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}

function LocationSection({ locationName, attributes, availableAttributes, onUpdate, inspectorStatuses, canAddAttributes = false, jobId }) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [showAddAttribute, setShowAddAttribute] = useState(false)
  const [newAttributeName, setNewAttributeName] = useState("")

  const handleAddAttribute = () => {
    if (!canAddAttributes) return // Prevent adding if not allowed
    
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
                  inspectorStatuses={inspectorStatuses}
                  jobId={jobId}
                />
              ))}
              {showAddAttribute ? (
                <Card className="border-dashed">
                  <CardContent className="p-4 md:p-4">
                    <div className="space-y-3">
                      <Select
                        value={newAttributeName}
                        onValueChange={setNewAttributeName}
                        disabled={!canAddAttributes}
                      >
                        <SelectTrigger className="h-11 md:h-10 text-base md:text-sm" disabled={!canAddAttributes}>
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
                          disabled={!newAttributeName || !canAddAttributes}
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
                  disabled={!canAddAttributes || unselectedAttributes.length === 0}
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

function JobCard({ job, onUpdate, onStartJob, locationAttributes, inspectorStatuses, propertyLocations, onUpdateJobStatus }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isStartingJob, setIsStartingJob] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const { isOnline = true } = useOnlineStatus() || {}
  const { saveDraft, deleteDraft } = useDraft(job.id, job)

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

  const handleStartJob = async () => {
    if (onStartJob && !isStartingJob) {
      setIsStartingJob(true)
      try {
        await onStartJob(job.id)
        // Keep the card expanded after starting
        setIsExpanded(true)
      } catch (error) {
        console.error("Error starting job:", error)
      } finally {
        setIsStartingJob(false)
      }
    }
  }

  const uploadAllFiles = async () => {
    return new Promise(async (resolve, reject) => {
      try {
        if (!isOnline) {
          reject(new Error("Offline - cannot upload files"))
          return
        }
        
        const { uploadQueue } = await import("@/lib/upload-queue")
        
        // Collect all files from all attributes that need uploading
        // Group by location and attribute for later insertion
        const filesByAttribute = new Map() // key: `${locationName}|${attributeName}`, value: { locationName, attributeName, files: [] }
        
        console.log("Collecting files from job.attributes:", job.attributes)
        
        Object.entries(job.attributes || {}).forEach(([locationName, locationAttributes]) => {
          console.log(`Processing location: ${locationName}`, locationAttributes)
          locationAttributes.forEach((attribute) => {
            const key = `${locationName}|${attribute.name}`
            if (!filesByAttribute.has(key)) {
              filesByAttribute.set(key, {
                locationName,
                attributeName: attribute.name,
                attributeId: attribute.id,
                status: attribute.status || null,
                files: [],
              })
            }
            
            if (attribute.files && attribute.files.length > 0) {
              console.log(`Processing ${attribute.files.length} files for attribute: ${attribute.name}`)
              attribute.files.forEach((file, index) => {
                console.log(`File ${index}:`, file, "Type:", typeof file, "Is File:", file instanceof File, "Has offlineId:", file?.offlineId, "Uploaded:", file?.uploaded)
                
                // Check if it's already a string (uploaded path) - highest priority
                if (typeof file === "string") {
                  console.log(`File already uploaded: ${file}`)
                  filesByAttribute.get(key).files.push({
                    path: file,
                    uploaded: true,
                  })
                }
                // Check if file has offlineId and is not uploaded (needs upload)
                // This covers both File instances and objects stored in IndexedDB
                else if (file && file.offlineId && !file.uploaded) {
                  console.log(`File needs upload: ${file.name || "unknown"} (offlineId: ${file.offlineId})`)
                  filesByAttribute.get(key).files.push({
                    file: file instanceof File ? file : null, // Will retrieve from IndexedDB if not File instance
                    fileId: file.offlineId,
                    uploaded: false,
                  })
                } else {
                  console.warn(`Skipping file - unknown format or already uploaded:`, file)
                }
              })
            }
          })
        })
        
        console.log("Files by attribute:", Array.from(filesByAttribute.entries()))
        
        // Track upload progress
      const uploadPromises = []
      const uploadedPaths = new Map() // key: `${locationName}|${attributeName}`, value: string[]
      
      filesByAttribute.forEach((attrData, key) => {
        attrData.files.forEach((fileItem) => {
          if (fileItem.uploaded) {
            // Already uploaded, add to paths
            if (!uploadedPaths.has(key)) {
              uploadedPaths.set(key, [])
            }
            uploadedPaths.get(key).push(fileItem.path)
          } else {
            // Need to upload
            const uploadPromise = new Promise((fileResolve, fileReject) => {
              uploadQueue.enqueue(
                {
                  file: fileItem.file,
                  fileId: fileItem.fileId,
                  jobId: job.id,
                  attributeId: attrData.attributeId,
                  locationName: attrData.locationName,
                  attributeName: attrData.attributeName,
                },
                () => {}, // Progress callback
                async (uploadedPath) => {
                  // Complete callback
                  if (!uploadedPaths.has(key)) {
                    uploadedPaths.set(key, [])
                  }
                  uploadedPaths.get(key).push(uploadedPath)
                  fileResolve(uploadedPath)
                },
                (error) => {
                  // Error callback
                  console.error("Error uploading file:", error)
                  fileReject(error)
                }
              )
            })
            uploadPromises.push(uploadPromise)
          }
        })
      })
      
      // If no files to upload, resolve immediately
      if (uploadPromises.length === 0) {
        resolve({
          filesByAttribute,
          uploadedPaths,
        })
        return
      }
      
      // Wait for all uploads to complete
      Promise.all(uploadPromises)
        .then(async () => {
          // Wait for queue to finish processing all items
          await uploadQueue.waitForAll()
          
          // All uploads complete, resolve with the grouped data
          resolve({
            filesByAttribute,
            uploadedPaths,
          })
        })
        .catch((error) => {
          reject(error)
        })
      } catch (error) {
        console.error("Error in uploadAllFiles:", error)
        reject(error)
      }
    })
  }

  const insertInspectorChecklists = async (uploadedData) => {
    try {
      const { supabase } = await import("@/lib/supabase")
      const { filesByAttribute, uploadedPaths } = uploadedData
      
      console.log("Inserting checklist entries. Files by attribute:", Array.from(filesByAttribute.entries()))
      console.log("Uploaded paths:", Array.from(uploadedPaths.entries()))
      
      // Create maps for ID lookups
      const locationIdMap = new Map()
      propertyLocations.forEach((loc) => {
        locationIdMap.set(loc.name, loc.id)
      })
      console.log("Location ID map:", Array.from(locationIdMap.entries()))
      
      const attributeIdMap = new Map()
      locationAttributes.forEach((attr) => {
        attributeIdMap.set(attr.name, attr.id)
      })
      console.log("Attribute ID map:", Array.from(attributeIdMap.entries()))
      
      const statusIdMap = new Map()
      inspectorStatuses.forEach((status) => {
        statusIdMap.set(status.name, status.id)
      })
      console.log("Status ID map:", Array.from(statusIdMap.entries()))
      
      // Prepare checklist entries
      const checklistEntries = []
      
      filesByAttribute.forEach((attrData, key) => {
        const locationId = locationIdMap.get(attrData.locationName)
        const attributeId = attributeIdMap.get(attrData.attributeName)
        const statusId = attrData.status ? statusIdMap.get(attrData.status) : null
        const imagePaths = uploadedPaths.get(key) || []
        
        console.log(`Processing entry - Location: ${attrData.locationName} (ID: ${locationId}), Attribute: ${attrData.attributeName} (ID: ${attributeId}), Status: ${attrData.status} (ID: ${statusId}), Images: ${imagePaths.length}`)
        
        if (!locationId || !attributeId) {
          console.warn(`Missing ID for location: ${attrData.locationName} (found: ${locationId}) or attribute: ${attrData.attributeName} (found: ${attributeId})`)
          return
        }
        
        checklistEntries.push({
          job_id: job.id,
          location_id: locationId,
          attribute_id: attributeId,
          status_id: statusId,
          images: imagePaths,
          notes: null, // Can be added later if needed
        })
      })
      
      if (checklistEntries.length === 0) {
        console.log("No checklist entries to insert")
        return
      }
      
      console.log(`Preparing to insert ${checklistEntries.length} checklist entries:`, checklistEntries)
      
      // Insert all checklist entries (use upsert to handle duplicates)
      const { data, error } = await supabase
        .from("inspector_checklists")
        .upsert(checklistEntries, {
          onConflict: "job_id,location_id,attribute_id",
        })
        .select()
      
      if (error) {
        console.error("Error inserting checklist entries:", error)
        throw error
      }
      
      console.log(`Successfully inserted ${checklistEntries.length} checklist entries:`, data)
    } catch (error) {
      console.error("Error in insertInspectorChecklists:", error)
      throw error
    }
  }

  const handleSaveAsDraft = async () => {
    try {
      // Save draft locally to IndexedDB (don't upload files yet)
      saveDraft()
      
      // Update job status to draft
      onUpdate({
        ...job,
        status: "Draft",
      })
    } catch (error) {
      console.error("Error saving draft:", error)
    }
  }

  const handleSendToTechnician = async () => {
    try {
      setIsUploading(true)
      console.log("Starting For Technician process...")
      console.log("Job attributes:", job.attributes)
      
      if (!isOnline) {
        // Offline: Save as draft and show message
        saveDraft()
        alert(
          "You are currently offline. Your work has been saved as a draft. " +
          "It will be sent to the technician when your connection is restored."
        )
        onUpdate({
          ...job,
          status: "Draft",
        })
        setIsUploading(false)
        return
      }
      
      // Upload all files and wait for completion
      console.log("Uploading files...")
      const uploadedData = await uploadAllFiles()
      console.log("Upload complete. Uploaded data:", uploadedData)
      
      // Insert into inspector_checklists after all uploads complete
      console.log("Inserting into inspector_checklists...")
      await insertInspectorChecklists(uploadedData)
      console.log("Checklist entries inserted successfully")
      
      // Update job status to "Waiting for Technician"
      console.log("Updating job status...")
      if (onUpdateJobStatus) {
        await onUpdateJobStatus(job.id, "Waiting for Technician", {
          inspectorId: job.inspectorId, // Preserve inspector_id
          technicianId: job.technicianId,
          qaId: job.qaId,
          jobTypeId: job.jobTypeId,
          date: job.date,
          propertyId: job.propertyId,
        })
      }
      
      // Delete draft after successful submission
      deleteDraft()
      
      // Update local state
      onUpdate({
        ...job,
        status: "Waiting for Technician",
      })
      
      setIsUploading(false)
      console.log("For Technician process completed successfully")
    } catch (error) {
      console.error("Error sending to technician:", error)
      console.error("Error stack:", error.stack)
      setIsUploading(false)
      alert(`Error sending to technician: ${error.message}. Your work has been saved as a draft.`)
      saveDraft()
      onUpdate({
        ...job,
        status: "Draft",
      })
    }
  }

  // Determine which buttons to show based on job status
  const showStartJobButton = job.status === "Waiting for Inspector"
  const showActionButtons = job.status === "On-Going Inspection"

  // Determine if attributes can be added based on job status
  const canAddAttributes = job.status === "On-Going Inspection"

  const jobContent = (
    <div className="space-y-4">
      {(job.property?.locations || []).map((locationName) => (
        <LocationSection
          key={locationName}
          locationName={locationName}
          attributes={job.attributes[locationName] || []}
          availableAttributes={locationAttributes.map((attr) => attr.name)}
          onUpdate={(attributes) =>
            handleLocationUpdate(locationName, attributes)
          }
          inspectorStatuses={inspectorStatuses}
          canAddAttributes={canAddAttributes}
        />
      ))}
    </div>
  )

  return (
    <>
      {/* Mobile/Tablet: Full-width Sheet */}
      <Sheet 
        open={isExpanded} 
        onOpenChange={(open) => {
          // Prevent closing while starting job
          if (!isStartingJob) {
            setIsExpanded(open)
          }
        }}
      >
        <Card className="overflow-hidden lg:hidden">
          <CardHeader
            className={cn("p-4", !isStartingJob && "cursor-pointer active:bg-accent/50")}
            onClick={() => {
              if (!isStartingJob) {
                setIsExpanded(true)
              }
            }}
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
            {showStartJobButton && (
              <Button
                type="button"
                className="w-full h-11 text-base"
                onClick={handleStartJob}
                disabled={isStartingJob}
              >
                {isStartingJob ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Starting Job...
                  </>
                ) : (
                  "Start Job"
                )}
              </Button>
            )}
            {showActionButtons && (
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
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    "For Technician"
                  )}
                </Button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop: Inline expansion */}
      <Card className="hidden lg:block overflow-hidden">
        <CardHeader
          className={cn("p-6", !isStartingJob && "cursor-pointer active:bg-accent/50")}
          onClick={() => {
            if (!isStartingJob) {
              setIsExpanded(!isExpanded)
            }
          }}
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
                {showStartJobButton && (
                  <Button
                    type="button"
                    className="w-full"
                    onClick={handleStartJob}
                    disabled={isStartingJob}
                  >
                    {isStartingJob ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Starting Job...
                      </>
                    ) : (
                      "Start Job"
                    )}
                  </Button>
                )}
                {showActionButtons && (
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
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        "For Technician"
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </>
  )
}

export function InspectorPage() {
  const { user } = useAuth()
  const { jobs, loading, updateJob, refetch } = useJobs()
  const { properties } = useProperties()
  const { propertyLocations } = usePropertyLocations()
  const { locationAttributes } = useLocationAttributes()
  const { inspectorStatuses } = useInspectorStatuses()
  const { isOnline = true, wasOffline = false } = useOnlineStatus() || {}
  
  const [activeTab, setActiveTab] = useState("available")
  const [jobAttributes, setJobAttributes] = useState({}) // Store attributes by job ID
  const [savedChecklists, setSavedChecklists] = useState({}) // Store saved checklists from DB by job ID

  // Get current inspector's ID
  const currentInspectorId = user?.id

  // Fetch inspector checklists from database
  useEffect(() => {
    if (!currentInspectorId || jobs.length === 0) return

    const fetchInspectorChecklists = async () => {
      try {
        // Get all job IDs for the current inspector
        const jobIds = jobs
          .filter((job) => job.inspectorId === currentInspectorId)
          .map((job) => job.id)

        if (jobIds.length === 0) return

        // Fetch inspector checklists for these jobs
        const { data: checklists, error } = await supabase
          .from("inspector_checklists")
          .select(`
            *,
            location:property_locations(id, name),
            attribute:location_attributes(id, name),
            status:inspector_statuses(id, name)
          `)
          .in("job_id", jobIds)

        if (error) {
          console.error("Error fetching inspector checklists:", error)
          return
        }

        // Transform checklists into the same structure as jobAttributes
        // Group by job_id, then by location, then by attribute
        const checklistsByJob = {}

        checklists?.forEach((checklist) => {
          const jobId = checklist.job_id
          const locationName = checklist.location?.name
          const attributeName = checklist.attribute?.name
          const statusName = checklist.status?.name || ""
          const images = checklist.images || []

          if (!checklistsByJob[jobId]) {
            checklistsByJob[jobId] = {}
          }

          if (!checklistsByJob[jobId][locationName]) {
            checklistsByJob[jobId][locationName] = []
          }

          // Check if attribute already exists in this location
          const existingAttributeIndex = checklistsByJob[jobId][locationName].findIndex(
            (attr) => attr.name === attributeName
          )

          if (existingAttributeIndex >= 0) {
            // Update existing attribute
            checklistsByJob[jobId][locationName][existingAttributeIndex] = {
              id: checklist.attribute_id,
              name: attributeName,
              status: statusName,
              files: images.map((imgPath) => imgPath), // Images are already paths (strings)
            }
          } else {
            // Add new attribute
            checklistsByJob[jobId][locationName].push({
              id: checklist.attribute_id,
              name: attributeName,
              status: statusName,
              files: images.map((imgPath) => imgPath), // Images are already paths (strings)
            })
          }
        })

        setSavedChecklists(checklistsByJob)
      } catch (error) {
        console.error("Error in fetchInspectorChecklists:", error)
      }
    }

    fetchInspectorChecklists()
  }, [currentInspectorId, jobs])

  // Transform jobs to include property locations and structure for JobCard
  const transformedJobs = useMemo(() => {
    if (!currentInspectorId) return []
    
    return jobs
      .filter((job) => job.inspectorId === currentInspectorId)
      .map((job) => {
        // Find the property to get its locations
        const property = properties.find((p) => p.id === job.propertyId)
        const propertyLocationNames = property?.locations?.map((loc) => loc.name) || []
        
        // Merge saved checklists with draft attributes
        // Draft attributes (from jobAttributes) take precedence for active jobs
        // Saved checklists (from savedChecklists) are used for previous jobs
        const savedAttributes = savedChecklists[job.id] || {}
        const draftAttributes = jobAttributes[job.id] || {}
        
        // For active jobs (On-Going Inspection), prefer draft attributes
        // For previous jobs, use saved checklists
        let finalAttributes = {}
        if (job.status === "On-Going Inspection") {
          // Active job: merge saved with draft (draft takes precedence)
          finalAttributes = { ...savedAttributes }
          // Merge attributes within each location
          Object.keys(draftAttributes).forEach((locationName) => {
            if (!finalAttributes[locationName]) {
              finalAttributes[locationName] = []
            }
            const savedAttrs = savedAttributes[locationName] || []
            const draftAttrs = draftAttributes[locationName] || []
            // Combine and deduplicate by attribute name (draft takes precedence)
            const mergedAttrs = [...savedAttrs]
            draftAttrs.forEach((draftAttr) => {
              const existingIndex = mergedAttrs.findIndex(
                (attr) => attr.name === draftAttr.name
              )
              if (existingIndex >= 0) {
                mergedAttrs[existingIndex] = draftAttr
              } else {
                mergedAttrs.push(draftAttr)
              }
            })
            finalAttributes[locationName] = mergedAttrs
          })
        } else {
          // Previous job: use saved checklists
          finalAttributes = savedAttributes
        }
        
        // Transform job to match JobCard expected structure
        return {
          ...job,
          property: {
            id: job.propertyId,
            name: job.property?.name || "Unknown Property",
            address: job.property?.fullAddress || job.property?.address || "",
            locations: propertyLocationNames,
          },
          attributes: finalAttributes,
        }
      })
  }, [jobs, properties, currentInspectorId, jobAttributes, savedChecklists])

  // Filter jobs by status for each tab
  const availableJobs = useMemo(() => {
    return transformedJobs.filter((job) => job.status === "Waiting for Inspector")
  }, [transformedJobs])

  const activeJobs = useMemo(() => {
    // Active Jobs: Show jobs with status "On-Going Inspection" (jobs currently being worked on)
    return transformedJobs.filter((job) => job.status === "On-Going Inspection")
  }, [transformedJobs])

  const previousJobs = useMemo(() => {
    return transformedJobs.filter((job) => 
      job.status === "Done" || 
      job.status === "For QA" || 
      job.status === "Waiting for Technician" ||
      job.status === "On-Going Technician"
    )
  }, [transformedJobs])

  const handleJobUpdate = (updatedJob) => {
    // Update the job attributes in local state
    setJobAttributes((prev) => ({
      ...prev,
      [updatedJob.id]: updatedJob.attributes || {},
    }))
  }

  const handleStartJob = async (jobId) => {
    try {
      // Find the job to get its current data
      const job = transformedJobs.find((j) => j.id === jobId)
      if (!job) return

      // Update job status to "On-Going Inspection"
      const result = await updateJob(jobId, {
        jobTypeId: job.jobTypeId,
        date: job.date,
        propertyId: job.propertyId,
        inspectorId: job.inspectorId,
        technicianId: job.technicianId || null,
        qaId: job.qaId || null,
        status: "On-Going Inspection",
        inspectedDate: job.inspectedDate || null,
        fixDate: job.fixDate || null,
      })

      if (result.success) {
        // Refetch jobs to update the UI
        await refetch()
      }
    } catch (error) {
      console.error("Error starting job:", error)
    }
  }

  const renderJobs = (jobsList) => {
    if (loading) {
      return (
        <Card>
          <CardContent className="p-12 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto" />
            <p className="mt-4 text-muted-foreground">Loading jobs...</p>
          </CardContent>
        </Card>
      )
    }

    if (jobsList.length === 0) {
      return (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">No jobs in this category.</p>
          </CardContent>
        </Card>
      )
    }

    return (
      <div className="space-y-4">
        {jobsList.map((job, index) => (
          <motion.div
            key={job.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <JobCard 
              job={job} 
              onUpdate={handleJobUpdate}
              onStartJob={handleStartJob}
              locationAttributes={locationAttributes}
              inspectorStatuses={inspectorStatuses}
              propertyLocations={propertyLocations}
              onUpdateJobStatus={async (jobId, status, additionalData = {}) => {
                const result = await updateJob(jobId, { 
                  status,
                  ...additionalData, // Include inspectorId and other fields to preserve them
                })
                if (result.success) {
                  await refetch()
                }
              }}
            />
          </motion.div>
        ))}
      </div>
    )
  }

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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Mobile/Tablet: Scrollable horizontal tabs */}
        <div className="block md:hidden overflow-x-auto -mx-4 px-4 scrollbar-hide">
          <TabsList className="inline-flex w-auto h-auto p-1.5 bg-muted/50 rounded-lg gap-1.5">
            <TabsTrigger 
              value="available"
              className="flex-shrink-0 px-4 py-2.5 text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground transition-all whitespace-nowrap"
            >
              <span>Available</span>
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                {availableJobs.length}
              </span>
            </TabsTrigger>
            <TabsTrigger 
              value="active"
              className="flex-shrink-0 px-4 py-2.5 text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground transition-all whitespace-nowrap"
            >
              <span>Active</span>
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                {activeJobs.length}
              </span>
            </TabsTrigger>
            <TabsTrigger 
              value="previous"
              className="flex-shrink-0 px-4 py-2.5 text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground transition-all whitespace-nowrap"
            >
              <span>Previous</span>
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                {previousJobs.length}
              </span>
            </TabsTrigger>
          </TabsList>
        </div>
        
        {/* Desktop: Grid layout tabs */}
        <div className="hidden md:block">
          <TabsList className="grid w-full grid-cols-3 h-10 p-1 bg-muted/50 rounded-md">
            <TabsTrigger 
              value="available"
              className="px-3 py-1.5 text-sm font-medium rounded-sm data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground transition-all"
            >
              Available Jobs
              <span className="ml-2 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                {availableJobs.length}
              </span>
            </TabsTrigger>
            <TabsTrigger 
              value="active"
              className="px-3 py-1.5 text-sm font-medium rounded-sm data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground transition-all"
            >
              Active Jobs
              <span className="ml-2 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                {activeJobs.length}
              </span>
            </TabsTrigger>
            <TabsTrigger 
              value="previous"
              className="px-3 py-1.5 text-sm font-medium rounded-sm data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground transition-all"
            >
              Previous Jobs
              <span className="ml-2 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                {previousJobs.length}
              </span>
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="available" className="mt-4 md:mt-6">
          {renderJobs(availableJobs)}
        </TabsContent>
        <TabsContent value="active" className="mt-4 md:mt-6">
          {renderJobs(activeJobs)}
        </TabsContent>
        <TabsContent value="previous" className="mt-4 md:mt-6">
          {renderJobs(previousJobs)}
        </TabsContent>
      </Tabs>
    </div>
  )
}

