import { useState, useMemo, useEffect, useRef } from "react"
import { 
  ChevronDown, 
  ChevronRight, 
  X, 
  Upload, 
  FileImage, 
  CheckCircle2,
  XCircle,
  AlertCircle,
  MinusCircle,
  Loader2,
  WifiOff,
  Cloud,
  CloudOff,
  Camera
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { motion, AnimatePresence } from "motion/react"
import { cn } from "@/lib/utils"
import { useJobs } from "@/hooks/use-jobs"
import { useAuth } from "@/hooks/use-auth"
import { useProperties } from "@/hooks/use-properties"
import { usePropertyLocations } from "@/hooks/use-property-locations"
import { useLocationAttributes } from "@/hooks/use-location-attributes"
import { useInspectorStatuses } from "@/hooks/use-inspector-statuses"
import { useTechnicianStatuses } from "@/hooks/use-technician-statuses"
import { useOnlineStatus } from "@/hooks/use-online-status"
import { useDraft } from "@/hooks/use-draft"
import { storeFileOffline, deleteFileOffline } from "@/lib/draft-storage"
import { uploadQueue } from "@/lib/upload-queue"
import { supabase } from "@/lib/supabase"
import { uploadFiles } from "@/lib/file-upload"
import { getImageUrl } from "@/lib/file-upload"

// FileUploadArea component (same as Inspector page)
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
    
    if (fileToRemove?.offlineId) {
      try {
        await deleteFileOffline(fileToRemove.offlineId)
      } catch (error) {
        console.error("Error deleting file from IndexedDB:", error)
      }
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
          <Button
            type="button"
            variant="outline"
            className="flex-1 sm:flex-initial gap-2 h-10"
            onClick={handleCameraClick}
          >
            <Camera className="h-4 w-4" />
            <span className="text-sm">Take Photo</span>
          </Button>
          
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

// AttributeCard with two columns: Inspector Checklist | Technician Status + Upload
function AttributeCard({ attribute, locationName, onUpdate, inspectorChecklist, technicianChecklist, technicianStatuses, jobId }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [status, setStatus] = useState(technicianChecklist?.status || "")
  const [files, setFiles] = useState(technicianChecklist?.files || [])
  const [fileUploadStatuses, setFileUploadStatuses] = useState({})
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const isAddingFilesRef = useRef(false)
  const { isOnline = true } = useOnlineStatus() || {}
  
  const inspectorStatus = inspectorChecklist?.status || ""
  const inspectorImages = inspectorChecklist?.files || []

  // Sync files when technicianChecklist changes (but only on initial load)
  // Don't sync if user is actively adding files
  useEffect(() => {
    if (isAddingFilesRef.current) {
      return
    }
    
    if (technicianChecklist?.files) {
      const currentFilesCount = files.length
      const checklistFilesCount = technicianChecklist.files.length
      
      // Only sync if checklist has more files (from database) or if local is empty
      if (currentFilesCount === 0 || (checklistFilesCount > currentFilesCount && checklistFilesCount > 0)) {
        const filesEqual = JSON.stringify(technicianChecklist.files) === JSON.stringify(files)
        if (!filesEqual) {
          setFiles(technicianChecklist.files)
        }
      }
    }
  }, [technicianChecklist?.files]) // Note: files dependency removed to avoid infinite loop

  // Sync status when technicianChecklist changes
  useEffect(() => {
    if (technicianChecklist?.status !== undefined) {
      setStatus(technicianChecklist.status)
    }
  }, [technicianChecklist?.status])

  const handleImageClick = (index) => {
    setSelectedImageIndex(index)
    setLightboxOpen(true)
  }

  const handlePreviousImage = () => {
    setSelectedImageIndex((prev) => 
      prev > 0 ? prev - 1 : inspectorImages.length - 1
    )
  }

  const handleNextImage = () => {
    setSelectedImageIndex((prev) => 
      prev < inspectorImages.length - 1 ? prev + 1 : 0
    )
  }

  const handleStatusChange = (newStatus) => {
    setStatus(newStatus)
    onUpdate({
      ...attribute,
      technicianStatus: newStatus,
      technicianFiles: files,
    })
  }

  const handleFilesChange = async (newFiles) => {
    // Separate existing files (already processed) from new files (File instances)
    const existingFiles = []
    const filesToProcess = []
    
    newFiles.forEach(file => {
      // If it's a string, it's already uploaded
      if (typeof file === "string") {
        existingFiles.push(file)
      }
      // If it has offlineId, it's already processed
      else if (file && file.offlineId) {
        existingFiles.push(file)
      }
      // If it's a File instance without offlineId, it needs processing
      else if (file instanceof File) {
        filesToProcess.push(file)
      }
      // Otherwise, keep it as-is (might be an object with other properties)
      else {
        existingFiles.push(file)
      }
    })
    
    // Only process new File instances
    const processedNewFiles = await Promise.all(
      filesToProcess.map(async (file) => {
        try {
          const fileId = await storeFileOffline(jobId, attribute.id, file)
          
          // Create a file-like object that preserves File properties
          // We need to explicitly preserve File properties as spreading doesn't work well with File objects
          const processedFile = {
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: file.lastModified,
            offlineId: fileId,
            uploadStatus: "pending",
            uploaded: false,
            // Keep reference to original File for potential future use
            _file: file,
          }
          
          return processedFile
        } catch (error) {
          console.error("Error storing file offline:", error)
          return file
        }
      })
    )

    // Combine existing files with newly processed files
    const allFiles = [...existingFiles, ...processedNewFiles]

    // Mark that we're adding files to prevent useEffect from overwriting
    isAddingFilesRef.current = true
    setFiles(allFiles)
    
    const updatedAttribute = {
      ...attribute,
      technicianStatus: status,
      technicianFiles: allFiles,
    }
    onUpdate(updatedAttribute)
    
    // Reset the flag after a brief delay to allow useEffect to work normally again
    setTimeout(() => {
      isAddingFilesRef.current = false
    }, 500)
  }

  const getStatusIcon = (statusName) => {
    if (!statusName) return null
    const lowerStatus = statusName.toLowerCase()
    if (lowerStatus.includes("fix") && !lowerStatus.includes("not")) {
      return <CheckCircle2 className="h-4 w-4 text-green-600" />
    }
    if (lowerStatus.includes("fail") || lowerStatus.includes("not fix")) {
      return <XCircle className="h-4 w-4 text-red-600" />
    }
    if (lowerStatus.includes("attention") || lowerStatus.includes("warning") || lowerStatus.includes("pending")) {
      return <AlertCircle className="h-4 w-4 text-yellow-600" />
    }
    if (lowerStatus.includes("n/a") || lowerStatus.includes("not applicable") || lowerStatus.includes("pass")) {
      return lowerStatus.includes("pass") ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <MinusCircle className="h-4 w-4 text-gray-400" />
    }
    return null
  }

  const getStatusColor = (statusName) => {
    if (!statusName) return "bg-muted text-muted-foreground border-border"
    const lowerStatus = statusName.toLowerCase()
    if (lowerStatus.includes("fix") && !lowerStatus.includes("not")) {
      return "bg-green-100 text-green-800 border-green-300"
    }
    if (lowerStatus.includes("fail") || lowerStatus.includes("not fix")) {
      return "bg-red-100 text-red-800 border-red-300"
    }
    if (lowerStatus.includes("attention") || lowerStatus.includes("warning") || lowerStatus.includes("pending")) {
      return "bg-yellow-100 text-yellow-800 border-yellow-300"
    }
    if (lowerStatus.includes("n/a") || lowerStatus.includes("not applicable") || lowerStatus.includes("pass")) {
      return lowerStatus.includes("pass") ? "bg-green-100 text-green-800 border-green-300" : "bg-gray-100 text-gray-800 border-gray-300"
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
            {inspectorStatus && (
              <span
                className={cn(
                  "rounded-full border px-2 py-1 text-xs font-medium flex items-center gap-1",
                  getStatusColor(inspectorStatus)
                )}
                title={`Inspector: ${inspectorStatus}`}
              >
                {getStatusIcon(inspectorStatus)}
                <span className="hidden sm:inline">Insp:</span>
                <span>{inspectorStatus}</span>
              </span>
            )}
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
              {/* Two-column layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left Column: Inspector Checklist */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium">
                    Inspector Checklist
                  </label>
                  
                  {/* Inspector Status */}
                  {inspectorStatus && (
                    <div className={cn(
                      "flex items-center gap-2 rounded-md border p-3",
                      getStatusColor(inspectorStatus)
                    )}>
                      {getStatusIcon(inspectorStatus)}
                      <span className="text-sm font-medium">
                        {inspectorStatus}
                      </span>
                    </div>
                  )}
                  {!inspectorStatus && (
                    <div className="flex items-center gap-2 rounded-md border border-muted-foreground/30 bg-muted/50 p-3">
                      <span className="text-sm text-muted-foreground">No Status</span>
                    </div>
                  )}

                  {/* Inspector Gallery */}
                  {inspectorImages.length > 0 && (
                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Inspector Images ({inspectorImages.length})
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {inspectorImages.map((imagePath, idx) => (
                          <div
                            key={idx}
                            className="relative aspect-square rounded-md overflow-hidden border border-muted cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => handleImageClick(idx)}
                          >
                            <img
                              src={typeof imagePath === "string" ? getImageUrl(imagePath) : URL.createObjectURL(imagePath)}
                              alt={`Inspector image ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column: Technician Status + Upload */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium">
                    Technician Status
                  </label>
                  
                  {/* Technician Status Chips */}
                  <div className="flex flex-wrap gap-2">
                    {technicianStatuses.map((s) => {
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

                  {/* Technician File Upload */}
                  <div>
                    <label className="mb-2 block text-sm font-medium">
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
                </div>
              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lightbox Dialog */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl w-full p-0 bg-black/95 border-none">
          <DialogHeader className="sr-only">
            <DialogTitle>Inspector Image</DialogTitle>
          </DialogHeader>
          {inspectorImages.length > 0 && (
            <div className="relative">
              <img
                src={
                  typeof inspectorImages[selectedImageIndex] === "string"
                    ? getImageUrl(inspectorImages[selectedImageIndex])
                    : URL.createObjectURL(inspectorImages[selectedImageIndex])
                }
                alt={`Inspector image ${selectedImageIndex + 1}`}
                className="w-full h-auto max-h-[80vh] object-contain"
              />
              
              {/* Navigation buttons */}
              {inspectorImages.length > 1 && (
                <>
                  <button
                    onClick={handlePreviousImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                    aria-label="Previous image"
                  >
                    <ChevronRight className="h-6 w-6 rotate-180" />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}
              
              {/* Image counter */}
              {inspectorImages.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-black/50 text-white text-sm">
                  {selectedImageIndex + 1} / {inspectorImages.length}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}

// LocationSection - no Add Attribute button, only shows inspector's attributes
function LocationSection({ locationName, inspectorAttributes, technicianAttributes, onUpdate, technicianStatuses, jobId }) {
  const [isExpanded, setIsExpanded] = useState(true)

  const handleUpdateAttribute = (updatedAttribute) => {
    const currentLocationAttrs = technicianAttributes[locationName] || []
    const existingIndex = currentLocationAttrs.findIndex(
      (attr) => attr.id === updatedAttribute.id || attr.name === updatedAttribute.name
    )
    
    let updatedLocationAttrs
    if (existingIndex >= 0) {
      // Update existing attribute
      updatedLocationAttrs = currentLocationAttrs.map((attr, idx) =>
        idx === existingIndex ? updatedAttribute : attr
      )
    } else {
      // Add new attribute if it doesn't exist
      updatedLocationAttrs = [...currentLocationAttrs, updatedAttribute]
    }
    
    const updatedTechnicianAttributes = {
      ...technicianAttributes,
      [locationName]: updatedLocationAttrs,
    }
    
    onUpdate(updatedTechnicianAttributes)
  }

  // Merge inspector and technician attributes
  const mergedAttributes = useMemo(() => {
    const inspector = inspectorAttributes[locationName] || []
    const technician = technicianAttributes[locationName] || []
    
    return inspector.map((inspAttr) => {
      const techAttr = technician.find((t) => t.id === inspAttr.id || t.name === inspAttr.name)
      return {
        ...inspAttr,
        ...techAttr,
        id: inspAttr.id || techAttr?.id,
      }
    })
  }, [inspectorAttributes, technicianAttributes, locationName])

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
              ({mergedAttributes.length})
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
              {mergedAttributes.map((attribute) => (
                <AttributeCard
                  key={attribute.id || attribute.name}
                  attribute={attribute}
                  locationName={locationName}
                  onUpdate={handleUpdateAttribute}
                  inspectorChecklist={{
                    status: attribute.status || attribute.inspectorStatus,
                    files: attribute.files || [],
                  }}
                  technicianChecklist={{
                    status: attribute.technicianStatus || "",
                    files: attribute.technicianFiles || [],
                  }}
                  technicianStatuses={technicianStatuses}
                  jobId={jobId}
                />
              ))}
              {mergedAttributes.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No attributes found for this location
                </p>
              )}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}

function JobCard({ job, onUpdate, onStartJob, technicianStatuses, propertyLocations, locationAttributes, onUpdateJobStatus }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isStartingJob, setIsStartingJob] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [currentJob, setCurrentJob] = useState(job)
  const { isOnline = true } = useOnlineStatus() || {}
  const { saveDraft, deleteDraft } = useDraft(job.id, job)

  // Keep currentJob in sync with job prop
  useEffect(() => {
    setCurrentJob(job)
  }, [job])

  const handleLocationUpdate = (technicianAttributes) => {
    const updatedAttributes = {
      ...currentJob.technicianAttributes,
      ...technicianAttributes,
    }
    const updatedJob = {
      ...currentJob,
      technicianAttributes: updatedAttributes,
    }
    setCurrentJob(updatedJob)
    onUpdate(updatedJob)
  }

  const handleStartJob = async () => {
    if (onStartJob && !isStartingJob) {
      setIsStartingJob(true)
      try {
        await onStartJob(job.id)
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
        // Use currentJob to ensure we have the latest state
        const jobToUse = currentJob
        
        const filesByAttribute = new Map() // key: `${locationName}|${attributeName}`
        
        Object.keys(jobToUse.technicianAttributes || {}).forEach((locationName) => {
          const attributes = jobToUse.technicianAttributes[locationName] || []
          
          attributes.forEach((attribute) => {
            const key = `${locationName}|${attribute.name}`
            filesByAttribute.set(key, {
              locationName,
              attributeName: attribute.name,
              attributeId: attribute.id,
              status: attribute.technicianStatus || "",
              files: [],
            })
            
            // Process files
            const techFiles = attribute.technicianFiles || []
            
            techFiles.forEach((file, index) => {
              // Check if it's already a string (uploaded path) - highest priority
              if (typeof file === "string") {
                filesByAttribute.get(key).files.push({
                  path: file,
                  uploaded: true,
                })
              }
              // Check if file has offlineId and is not uploaded (needs upload)
              else if (file && file.offlineId && !file.uploaded) {
                filesByAttribute.get(key).files.push({
                  file: file instanceof File ? file : null, // Will retrieve from IndexedDB if not File instance
                  fileId: file.offlineId,
                  uploaded: false,
                })
              }
              // Handle File instances that might not have offlineId yet (shouldn't happen, but handle it)
              else if (file instanceof File) {
                // Store offline first, then upload
                storeFileOffline(currentJob.id, attribute.id, file).then((fileId) => {
                  filesByAttribute.get(key).files.push({
                    file: file,
                    fileId: fileId,
                    uploaded: false,
                  })
                }).catch((error) => {
                  console.error("Error storing file offline:", error)
                })
              } else {
                console.warn(`Skipping file - unknown format:`, file)
              }
            })
          })
        })

        const uploadPromises = []
        const uploadedPaths = new Map()
        
        filesByAttribute.forEach((attrData, key) => {
          attrData.files.forEach((fileItem) => {
            if (fileItem.uploaded) {
              if (!uploadedPaths.has(key)) {
                uploadedPaths.set(key, [])
              }
              uploadedPaths.get(key).push(fileItem.path)
            } else {
              // Need to upload - use upload queue
              const uploadPromise = new Promise((fileResolve, fileReject) => {
                uploadQueue.enqueue(
                  {
                    file: fileItem.file,
                    fileId: fileItem.fileId,
                    jobId: currentJob.id,
                    attributeId: attrData.attributeId,
                    folderPrefix: "technician-checklists", // Add folder prefix for upload queue
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
        
        // Re-process to catch any files we might have missed and create upload promises for them
        filesByAttribute.forEach((attrData, key) => {
          const [locationName, attributeName] = key.split("|")
          const locationAttrs = currentJob.technicianAttributes[locationName] || []
          const attr = locationAttrs.find(a => a.name === attributeName)
          
          if (attr && attr.technicianFiles && attr.technicianFiles.length > 0) {
            attr.technicianFiles.forEach((file) => {
              // Check if this file is already processed
              const alreadyProcessed = attrData.files.some(f => 
                (f.uploaded && typeof file === "string" && f.path === file) ||
                (!f.uploaded && file?.offlineId && f.fileId === file.offlineId)
              )
              
              if (!alreadyProcessed) {
                if (typeof file === "string") {
                  // Already uploaded
                  attrData.files.push({ path: file, uploaded: true })
                  if (!uploadedPaths.has(key)) {
                    uploadedPaths.set(key, [])
                  }
                  uploadedPaths.get(key).push(file)
                } else if (file && file.offlineId && !file.uploaded) {
                  // Needs upload
                  attrData.files.push({
                    file: file instanceof File ? file : null,
                    fileId: file.offlineId,
                    uploaded: false,
                  })
                  
                  // Create upload promise for this file using upload queue
                  const uploadPromise = new Promise((fileResolve, fileReject) => {
                    uploadQueue.enqueue(
                      {
                        file: file instanceof File ? file : null,
                        fileId: file.offlineId,
                        jobId: currentJob.id,
                        attributeId: attrData.attributeId,
                        folderPrefix: "technician-checklists", // Add folder prefix for upload queue
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
              }
            })
          }
        })
        
        if (uploadPromises.length === 0) {
          resolve({ filesByAttribute, uploadedPaths })
          return
        }
        
        Promise.all(uploadPromises)
          .then(async () => {
            await uploadQueue.waitForAll()
            resolve({ filesByAttribute, uploadedPaths })
          })
          .catch((error) => {
            console.error("Error in upload promises:", error)
            reject(error)
          })
      } catch (error) {
        console.error("Error in uploadAllFiles:", error)
        reject(error)
      }
    })
  }

  const insertTechnicianChecklists = async (uploadedData) => {
    try {
      const { filesByAttribute, uploadedPaths } = uploadedData
      
      const locationIdMap = new Map()
      propertyLocations.forEach((loc) => {
        locationIdMap.set(loc.name, loc.id)
      })
      
      const attributeIdMap = new Map()
      locationAttributes.forEach((attr) => {
        attributeIdMap.set(attr.name, attr.id)
      })
      
      const statusIdMap = new Map()
      technicianStatuses.forEach((status) => {
        statusIdMap.set(status.name, status.id)
      })
      
      const checklistEntries = []
      
      filesByAttribute.forEach((attrData, key) => {
        const locationId = locationIdMap.get(attrData.locationName)
        const attributeId = attributeIdMap.get(attrData.attributeName)
        const statusId = attrData.status ? statusIdMap.get(attrData.status) : null
        const imagePaths = uploadedPaths.get(key) || []
        
        if (!locationId || !attributeId) {
          console.warn(`Missing ID for location: ${attrData.locationName} (found: ${locationId}) or attribute: ${attrData.attributeName} (found: ${attributeId})`)
          return
        }
        
        // Create entry for all attributes in filesByAttribute (they have technician data)
        checklistEntries.push({
          job_id: currentJob.id,
          location_id: locationId,
          attribute_id: attributeId,
          status_id: statusId,
          images: imagePaths,
          notes: null,
        })
      })
      
      if (checklistEntries.length === 0) {
        // Create entries even if no images, as long as there's a status or any data in filesByAttribute
        filesByAttribute.forEach((attrData, key) => {
          const locationId = locationIdMap.get(attrData.locationName)
          const attributeId = attributeIdMap.get(attrData.attributeName)
          const statusId = attrData.status ? statusIdMap.get(attrData.status) : null
          
          if (locationId && attributeId && (statusId || attrData.files.length > 0)) {
            checklistEntries.push({
              job_id: currentJob.id,
              location_id: locationId,
              attribute_id: attributeId,
              status_id: statusId,
              images: uploadedPaths.get(key) || [],
              notes: null,
            })
          }
        })
        
        if (checklistEntries.length === 0) {
          return
        }
      }
      
      const { data, error } = await supabase
        .from("technician_checklists")
        .upsert(checklistEntries, {
          onConflict: "job_id,location_id,attribute_id",
        })
        .select()
      
      if (error) {
        console.error("Error inserting checklist entries:", error)
        throw error
      }
    } catch (error) {
      console.error("Error in insertTechnicianChecklists:", error)
      throw error
    }
  }

  const handleSaveAsDraft = async () => {
    try {
      saveDraft()
      onUpdate({
        ...job,
        status: "Draft",
      })
    } catch (error) {
      console.error("Error saving draft:", error)
    }
  }

  const handleSendToQA = async () => {
    try {
      setIsUploading(true)
      
      if (!isOnline) {
        saveDraft()
        alert(
          "You are currently offline. Your work has been saved as a draft. " +
          "It will be sent to QA when your connection is restored."
        )
        onUpdate({
          ...job,
          status: "Draft",
        })
        setIsUploading(false)
        return
      }
      
      const uploadedData = await uploadAllFiles()
      
      if (!uploadedData || !uploadedData.filesByAttribute) {
        throw new Error("No files data returned from uploadAllFiles")
      }
      
      await insertTechnicianChecklists(uploadedData)
      
      if (onUpdateJobStatus) {
        await onUpdateJobStatus(job.id, "For QA", {
          technicianId: job.technicianId,
          inspectorId: job.inspectorId,
          qaId: job.qaId,
          jobTypeId: job.jobTypeId,
          date: job.date,
          propertyId: job.propertyId,
        })
      }
      
      deleteDraft()
      
      const updatedJob = {
        ...currentJob,
        status: "For QA",
      }
      setCurrentJob(updatedJob)
      onUpdate(updatedJob)
      
      setIsUploading(false)
    } catch (error) {
      console.error("Error sending to QA:", error)
      setIsUploading(false)
      alert(`Error sending to QA: ${error.message}. Your work has been saved as a draft.`)
      saveDraft()
      const draftJob = {
        ...currentJob,
        status: "Draft",
      }
      setCurrentJob(draftJob)
      onUpdate(draftJob)
    }
  }

  const showStartJobButton = job.status === "Waiting for Technician"
  const showActionButtons = job.status === "On-Going Technician"

  const jobContent = (
    <div className="space-y-4">
      {(job.property?.locations || []).map((locationName) => (
        <LocationSection
          key={locationName}
          locationName={locationName}
          inspectorAttributes={job.inspectorAttributes || {}}
          technicianAttributes={job.technicianAttributes || {}}
          onUpdate={handleLocationUpdate}
          technicianStatuses={technicianStatuses}
          jobId={job.id}
        />
      ))}
    </div>
  )

  return (
    <>
      <Sheet 
        open={isExpanded} 
        onOpenChange={(open) => {
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
        <SheetContent 
          side="bottom" 
          className="h-[90vh] w-full p-0 flex flex-col"
          style={{
            animation: "slide-in-from-bottom 0.3s ease-out",
          }}
        >
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
                  onClick={handleSendToQA}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    "For QA"
                  )}
                </Button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

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
                      onClick={handleSendToQA}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        "For QA"
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

export function TechnicianPage() {
  const { user } = useAuth()
  const { jobs, loading, updateJob, refetch } = useJobs()
  const { properties } = useProperties()
  const { propertyLocations } = usePropertyLocations()
  const { locationAttributes } = useLocationAttributes()
  const { inspectorStatuses } = useInspectorStatuses()
  const { technicianStatuses } = useTechnicianStatuses()
  const { isOnline = true } = useOnlineStatus() || {}
  
  const [activeTab, setActiveTab] = useState("available")
  const [technicianAttributes, setTechnicianAttributes] = useState({})
  const [inspectorChecklists, setInspectorChecklists] = useState({})
  const [technicianChecklists, setTechnicianChecklists] = useState({})

  const currentTechnicianId = user?.id

  // Fetch inspector checklists
  useEffect(() => {
    if (!currentTechnicianId || jobs.length === 0) return

    const fetchInspectorChecklists = async () => {
      try {
        const jobIds = jobs
          .filter((job) => job.technicianId === currentTechnicianId)
          .map((job) => job.id)

        if (jobIds.length === 0) return

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

          const existingIndex = checklistsByJob[jobId][locationName].findIndex(
            (attr) => attr.name === attributeName
          )

          if (existingIndex >= 0) {
            checklistsByJob[jobId][locationName][existingIndex] = {
              id: checklist.attribute_id,
              name: attributeName,
              status: statusName,
              files: images.map((imgPath) => imgPath),
            }
          } else {
            checklistsByJob[jobId][locationName].push({
              id: checklist.attribute_id,
              name: attributeName,
              status: statusName,
              files: images.map((imgPath) => imgPath),
            })
          }
        })

        setInspectorChecklists(checklistsByJob)
      } catch (error) {
        console.error("Error in fetchInspectorChecklists:", error)
      }
    }

    fetchInspectorChecklists()
  }, [currentTechnicianId, jobs])

  // Fetch technician checklists
  useEffect(() => {
    if (!currentTechnicianId || jobs.length === 0) return

    const fetchTechnicianChecklists = async () => {
      try {
        const jobIds = jobs
          .filter((job) => job.technicianId === currentTechnicianId)
          .map((job) => job.id)

        if (jobIds.length === 0) return

        const { data: checklists, error } = await supabase
          .from("technician_checklists")
          .select(`
            *,
            location:property_locations(id, name),
            attribute:location_attributes(id, name),
            status:technician_statuses(id, name)
          `)
          .in("job_id", jobIds)

        if (error) {
          console.error("Error fetching technician checklists:", error)
          return
        }

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

          const existingIndex = checklistsByJob[jobId][locationName].findIndex(
            (attr) => attr.name === attributeName
          )

          if (existingIndex >= 0) {
            checklistsByJob[jobId][locationName][existingIndex] = {
              id: checklist.attribute_id,
              name: attributeName,
              technicianStatus: statusName,
              technicianFiles: images.map((imgPath) => imgPath),
            }
          } else {
            checklistsByJob[jobId][locationName].push({
              id: checklist.attribute_id,
              name: attributeName,
              technicianStatus: statusName,
              technicianFiles: images.map((imgPath) => imgPath),
            })
          }
        })

        setTechnicianChecklists(checklistsByJob)
      } catch (error) {
        console.error("Error in fetchTechnicianChecklists:", error)
      }
    }

    fetchTechnicianChecklists()
  }, [currentTechnicianId, jobs])

  const transformedJobs = useMemo(() => {
    if (!currentTechnicianId) return []
    
    return jobs
      .filter((job) => job.technicianId === currentTechnicianId)
      .map((job) => {
        const property = properties.find((p) => p.id === job.propertyId)
        const propertyLocationNames = property?.locations?.map((loc) => loc.name) || []
        
        const savedInspectorAttributes = inspectorChecklists[job.id] || {}
        const savedTechnicianAttributes = technicianChecklists[job.id] || {}
        const draftTechnicianAttributes = technicianAttributes[job.id] || {}
        
        let finalTechnicianAttributes = {}
        if (job.status === "On-Going Technician") {
          finalTechnicianAttributes = { ...savedTechnicianAttributes, ...draftTechnicianAttributes }
        } else {
          finalTechnicianAttributes = savedTechnicianAttributes
        }
        
        return {
          ...job,
          property: {
            id: job.propertyId,
            name: job.property?.name || "Unknown Property",
            address: job.property?.fullAddress || job.property?.address || "",
            locations: propertyLocationNames,
          },
          inspectorAttributes: savedInspectorAttributes,
          technicianAttributes: finalTechnicianAttributes,
        }
      })
  }, [jobs, properties, currentTechnicianId, inspectorChecklists, technicianChecklists, technicianAttributes])

  const availableJobs = useMemo(() => {
    return transformedJobs.filter((job) => job.status === "Waiting for Technician")
  }, [transformedJobs])

  const activeJobs = useMemo(() => {
    return transformedJobs.filter((job) => job.status === "On-Going Technician")
  }, [transformedJobs])

  const previousJobs = useMemo(() => {
    return transformedJobs.filter((job) => 
      job.status === "Done" || 
      job.status === "For QA" ||
      job.status === "On-Going Inspector" ||
      job.status === "Waiting for Technician" && job.technicianAttributes && Object.keys(job.technicianAttributes).length > 0
    )
  }, [transformedJobs])

  const handleJobUpdate = (updatedJob) => {
    setTechnicianAttributes((prev) => ({
      ...prev,
      [updatedJob.id]: updatedJob.technicianAttributes || {},
    }))
  }

  const handleStartJob = async (jobId) => {
    try {
      const job = transformedJobs.find((j) => j.id === jobId)
      if (!job) return

      const result = await updateJob(jobId, {
        jobTypeId: job.jobTypeId,
        date: job.date,
        propertyId: job.propertyId,
        inspectorId: job.inspectorId,
        technicianId: job.technicianId,
        qaId: job.qaId,
        status: "On-Going Technician",
      })

      if (result.success) {
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
              technicianStatuses={technicianStatuses}
              propertyLocations={propertyLocations}
              locationAttributes={locationAttributes}
              onUpdateJobStatus={async (jobId, status, additionalData = {}) => {
                const result = await updateJob(jobId, { 
                  status,
                  ...additionalData,
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
        <h1 className="text-2xl md:text-3xl font-bold">Technician Dashboard</h1>
        <p className="mt-2 text-sm md:text-base text-muted-foreground">
          Manage repairs and add technician attributes for assigned jobs
        </p>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
        
        <div className="hidden md:block">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="available">
              Available Jobs ({availableJobs.length})
            </TabsTrigger>
            <TabsTrigger value="active">
              Active Jobs ({activeJobs.length})
            </TabsTrigger>
            <TabsTrigger value="previous">
              Previous Jobs ({previousJobs.length})
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
