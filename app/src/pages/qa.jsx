import { useState, useMemo, useEffect } from "react"
import { 
  ChevronDown, 
  ChevronRight, 
  CheckCircle2,
  XCircle,
  AlertCircle,
  MinusCircle,
  Loader2,
  FileText
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
import { Textarea } from "@/components/ui/textarea"
import { motion, AnimatePresence } from "motion/react"
import { cn } from "@/lib/utils"
import { useJobs } from "@/hooks/use-jobs"
import { useAuth } from "@/hooks/use-auth"
import { useProperties } from "@/hooks/use-properties"
import { usePropertyLocations } from "@/hooks/use-property-locations"
import { useLocationAttributes } from "@/hooks/use-location-attributes"
import { useInspectorStatuses } from "@/hooks/use-inspector-statuses"
import { useTechnicianStatuses } from "@/hooks/use-technician-statuses"
import { useQAStatuses } from "@/hooks/use-qa-statuses"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { getImageUrl } from "@/lib/file-upload"

// AttributeCard with side-by-side comparison of Inspector and Technician images
function AttributeCard({ 
  attribute, 
  locationName, 
  inspectorChecklist, 
  technicianChecklist,
  qaChecklist,
  qaStatuses,
  locationId,
  attributeId,
  jobId,
  onUpdateQAChecklist
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [selectedImageType, setSelectedImageType] = useState("inspector") // "inspector" or "technician"
  const [notes, setNotes] = useState(qaChecklist?.notes || "")
  const [qaStatus, setQAStatus] = useState(qaChecklist?.status || "")
  
  // Sync notes and status when qaChecklist changes
  useEffect(() => {
    setNotes(qaChecklist?.notes || "")
    setQAStatus(qaChecklist?.status || "")
  }, [qaChecklist])
  
  const inspectorStatus = inspectorChecklist?.status || ""
  const inspectorImages = inspectorChecklist?.files || []
  const technicianStatus = technicianChecklist?.status || ""
  const technicianImages = technicianChecklist?.files || []

  const handleImageClick = (index, type) => {
    setSelectedImageIndex(index)
    setSelectedImageType(type)
    setLightboxOpen(true)
  }

  const handlePreviousImage = () => {
    const images = selectedImageType === "inspector" ? inspectorImages : technicianImages
    setSelectedImageIndex((prev) => 
      prev > 0 ? prev - 1 : images.length - 1
    )
  }

  const handleNextImage = () => {
    const images = selectedImageType === "inspector" ? inspectorImages : technicianImages
    setSelectedImageIndex((prev) => 
      prev < images.length - 1 ? prev + 1 : 0
    )
  }

  const getStatusIcon = (statusName) => {
    if (!statusName) return null
    const lowerStatus = statusName.toLowerCase()
    if (lowerStatus.includes("pass") || lowerStatus.includes("good") || (lowerStatus.includes("fix") && !lowerStatus.includes("not"))) {
      return <CheckCircle2 className="h-4 w-4 text-green-600" />
    }
    if (lowerStatus.includes("fail") || lowerStatus.includes("bad") || lowerStatus.includes("not fix")) {
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
    if (lowerStatus.includes("pass") || lowerStatus.includes("good") || (lowerStatus.includes("fix") && !lowerStatus.includes("not"))) {
      return "bg-green-100 text-green-800 border-green-300"
    }
    if (lowerStatus.includes("fail") || lowerStatus.includes("bad") || lowerStatus.includes("not fix")) {
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

  const handleStatusChange = (statusName, statusId) => {
    setQAStatus(statusName)
    // Update local state only, don't save to DB yet
    if (onUpdateQAChecklist) {
      onUpdateQAChecklist(jobId, locationId, attributeId, statusId, notes)
    }
  }

  const handleNotesChange = (newNotes) => {
    setNotes(newNotes)
    // Update local state only, don't save to DB yet
    if (onUpdateQAChecklist) {
      const statusId = qaStatuses.find(s => s.name === qaStatus)?.id || null
      onUpdateQAChecklist(jobId, locationId, attributeId, statusId, newNotes)
    }
  }

  const currentImages = selectedImageType === "inspector" ? inspectorImages : technicianImages

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
            {technicianStatus && (
              <span
                className={cn(
                  "rounded-full border px-2 py-1 text-xs font-medium flex items-center gap-1",
                  getStatusColor(technicianStatus)
                )}
                title={`Technician: ${technicianStatus}`}
              >
                {getStatusIcon(technicianStatus)}
                <span className="hidden sm:inline">Tech:</span>
                <span>{technicianStatus}</span>
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
              {/* Two-column layout: Inspector | Technician */}
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
                  {inspectorImages.length > 0 ? (
                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Inspector Images ({inspectorImages.length})
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {inspectorImages.map((imagePath, idx) => (
                          <div
                            key={idx}
                            className="relative aspect-square rounded-md overflow-hidden border border-muted cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => handleImageClick(idx, "inspector")}
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
                  ) : (
                    <div className="rounded-md border border-muted-foreground/30 bg-muted/50 p-3">
                      <span className="text-sm text-muted-foreground">No images</span>
                    </div>
                  )}
                </div>

                {/* Right Column: Technician Checklist */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium">
                    Technician Checklist
                  </label>
                  
                  {/* Technician Status */}
                  {technicianStatus && (
                    <div className={cn(
                      "flex items-center gap-2 rounded-md border p-3",
                      getStatusColor(technicianStatus)
                    )}>
                      {getStatusIcon(technicianStatus)}
                      <span className="text-sm font-medium">
                        {technicianStatus}
                      </span>
                    </div>
                  )}
                  {!technicianStatus && (
                    <div className="flex items-center gap-2 rounded-md border border-muted-foreground/30 bg-muted/50 p-3">
                      <span className="text-sm text-muted-foreground">No Status</span>
                    </div>
                  )}

                  {/* Technician Gallery */}
                  {technicianImages.length > 0 ? (
                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Technician Images ({technicianImages.length})
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {technicianImages.map((imagePath, idx) => (
                          <div
                            key={idx}
                            className="relative aspect-square rounded-md overflow-hidden border border-muted cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => handleImageClick(idx, "technician")}
                          >
                            <img
                              src={typeof imagePath === "string" ? getImageUrl(imagePath) : URL.createObjectURL(imagePath)}
                              alt={`Technician image ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-md border border-muted-foreground/30 bg-muted/50 p-3">
                      <span className="text-sm text-muted-foreground">No images</span>
                    </div>
                  )}
                </div>
              </div>

              {/* QA Status and Notes Section */}
              <div className="space-y-4 border-t pt-4">
                {/* QA Status Selection */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium">
                    QA Status
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {qaStatuses.map((status) => (
                      <button
                        key={status.id}
                        type="button"
                        onClick={() => handleStatusChange(status.name, status.id)}
                        className={cn(
                          "px-4 py-2 rounded-full border text-sm font-medium transition-all",
                          qaStatus === status.name
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background hover:bg-accent border-border"
                        )}
                      >
                        {status.name}
                      </button>
                    ))}
                    {qaStatus && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange("", null)}
                        className="px-4 py-2 rounded-full border text-sm font-medium transition-all bg-background hover:bg-accent border-border text-muted-foreground"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Notes Section */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    QA Notes
                  </label>
                  <Textarea
                    placeholder="Add notes if you find any discrepancies or issues..."
                    value={notes}
                    onChange={(e) => handleNotesChange(e.target.value)}
                    className="min-h-[100px]"
                  />
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
            <DialogTitle>{selectedImageType === "inspector" ? "Inspector" : "Technician"} Image</DialogTitle>
          </DialogHeader>
          {currentImages.length > 0 && (
            <div className="relative">
              <img
                src={
                  typeof currentImages[selectedImageIndex] === "string"
                    ? getImageUrl(currentImages[selectedImageIndex])
                    : URL.createObjectURL(currentImages[selectedImageIndex])
                }
                alt={`${selectedImageType} image ${selectedImageIndex + 1}`}
                className="w-full h-auto max-h-[80vh] object-contain"
              />
              
              {/* Navigation buttons */}
              {currentImages.length > 1 && (
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
              {currentImages.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-black/50 text-white text-sm">
                  {selectedImageIndex + 1} / {currentImages.length}
                </div>
              )}
              
              {/* Image type indicator */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-black/50 text-white text-sm capitalize">
                {selectedImageType}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}

// LocationSection - shows attributes with inspector and technician checklists
function LocationSection({ 
  locationName, 
  attributes, 
  inspectorAttributes, 
  technicianAttributes,
  qaAttributes,
  qaStatuses,
  locationId,
  jobId,
  onUpdateQAChecklist
}) {
  const [isExpanded, setIsExpanded] = useState(true)

  // Merge inspector and technician attributes
  const mergedAttributes = useMemo(() => {
    const inspector = (inspectorAttributes && inspectorAttributes[locationName]) || []
    const technician = (technicianAttributes && technicianAttributes[locationName]) || []
    const qa = (qaAttributes && qaAttributes[locationName]) || []
    
    return inspector.map((inspAttr) => {
      const techAttr = technician.find((t) => t.id === inspAttr.id || t.name === inspAttr.name)
      const qaAttr = qa.find((q) => q.id === inspAttr.id || q.name === inspAttr.name)
      return {
        ...inspAttr,
        ...techAttr,
        ...qaAttr,
        id: inspAttr.id || techAttr?.id || qaAttr?.id,
      }
    })
  }, [inspectorAttributes, technicianAttributes, qaAttributes, locationName])

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
                  inspectorChecklist={{
                    status: attribute.status || attribute.inspectorStatus,
                    files: attribute.files || [],
                  }}
                  technicianChecklist={{
                    status: attribute.technicianStatus || "",
                    files: attribute.technicianFiles || [],
                  }}
                  qaChecklist={{
                    status: attribute.qaStatus || "",
                    notes: attribute.qaNotes || "",
                  }}
                  qaStatuses={qaStatuses}
                  locationId={locationId}
                  attributeId={attribute.id}
                  jobId={jobId}
                  onUpdateQAChecklist={onUpdateQAChecklist}
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

function JobCard({ 
  job, 
  inspectorAttributes, 
  technicianAttributes,
  qaAttributes,
  qaStatuses,
  propertyLocations,
  onStartJob, 
  showStartJobButton, 
  isStartingJob,
  onUpdateQAChecklist,
  onMarkDone,
  isMarkingDone
}) {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleStartJob = async () => {
    if (onStartJob && !isStartingJob) {
      await onStartJob(job.id)
      setIsExpanded(true)
    }
  }

  const handleMarkDone = async () => {
    if (onMarkDone && !isMarkingDone) {
      await onMarkDone(job.id)
    }
  }

  const showDoneButton = !showStartJobButton && job.status === "On-Going QA"

  const jobContent = (
    <div className="space-y-4">
      {(job.property?.locations || []).map((locationName) => {
        const location = propertyLocations?.find(loc => loc.name === locationName)
        return (
          <LocationSection
            key={locationName}
            locationName={locationName}
            attributes={[]}
            inspectorAttributes={inspectorAttributes || {}}
            technicianAttributes={technicianAttributes || {}}
            qaAttributes={qaAttributes || {}}
            qaStatuses={qaStatuses || []}
            locationId={location?.id}
            jobId={job.id}
            onUpdateQAChecklist={onUpdateQAChecklist}
          />
        )
      })}
    </div>
  )

  return (
    <>
      {/* Mobile/Tablet: Full-width Sheet */}
      <Sheet 
        open={isExpanded} 
        onOpenChange={setIsExpanded}
      >
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
          {(showStartJobButton || showDoneButton) && (
            <div className="sticky bottom-0 border-t bg-background p-4 flex-shrink-0">
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
              {showDoneButton && (
                <Button
                  type="button"
                  className="w-full"
                  onClick={handleMarkDone}
                  disabled={isMarkingDone}
                >
                  {isMarkingDone ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Marking as Done...
                    </>
                  ) : (
                    "Done"
                  )}
                </Button>
              )}
            </div>
          )}
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
              {(showStartJobButton || showDoneButton) && (
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
                  {showDoneButton && (
                    <Button
                      type="button"
                      className="w-full"
                      onClick={handleMarkDone}
                      disabled={isMarkingDone}
                    >
                      {isMarkingDone ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Marking as Done...
                        </>
                      ) : (
                        "Done"
                      )}
                    </Button>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </>
  )
}

export function QAPage() {
  const { user } = useAuth()
  const { jobs, loading, updateJob, refetch } = useJobs()
  const { properties } = useProperties()
  const { propertyLocations } = usePropertyLocations()
  const { locationAttributes } = useLocationAttributes()
  const { inspectorStatuses } = useInspectorStatuses()
  const { technicianStatuses } = useTechnicianStatuses()
  const { qaStatuses } = useQAStatuses()
  const { toast } = useToast()
  
  const [activeTab, setActiveTab] = useState("available")
  const [inspectorChecklists, setInspectorChecklists] = useState({})
  const [technicianChecklists, setTechnicianChecklists] = useState({})
  const [qaChecklists, setQAChecklists] = useState({})
  const [isStartingJob, setIsStartingJob] = useState(false)
  const [isMarkingDone, setIsMarkingDone] = useState(false)

  const currentQAId = user?.id

  // Fetch inspector checklists
  useEffect(() => {
    if (jobs.length === 0) return

    const fetchInspectorChecklists = async () => {
      try {
        // Fetch checklists for all "For QA" and "On-Going QA" jobs
        const jobIds = jobs
          .filter((job) => job.status === "For QA" || job.status === "On-Going QA")
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
  }, [jobs])

  // Fetch technician checklists
  useEffect(() => {
    if (jobs.length === 0) return

    const fetchTechnicianChecklists = async () => {
      try {
        // Fetch checklists for all "For QA" and "On-Going QA" jobs
        const jobIds = jobs
          .filter((job) => job.status === "For QA" || job.status === "On-Going QA")
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
  }, [jobs])

  // Fetch QA checklists
  useEffect(() => {
    if (jobs.length === 0) return

    const fetchQAChecklists = async () => {
      try {
        const jobIds = jobs
          .filter((job) => job.status === "For QA" || job.status === "On-Going QA")
          .map((job) => job.id)

        if (jobIds.length === 0) return

        const { data: checklists, error } = await supabase
          .from("qa_checklists")
          .select(`
            *,
            location:property_locations(id, name),
            attribute:location_attributes(id, name),
            status:qa_statuses(id, name)
          `)
          .in("job_id", jobIds)

        if (error) {
          console.error("Error fetching QA checklists:", error)
          return
        }

        const checklistsByJob = {}
        checklists?.forEach((checklist) => {
          const jobId = checklist.job_id
          const locationName = checklist.location?.name
          const attributeName = checklist.attribute?.name
          const statusName = checklist.status?.name || ""
          const notes = checklist.notes || ""

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
              qaStatus: statusName,
              qaNotes: notes,
            }
          } else {
            checklistsByJob[jobId][locationName].push({
              id: checklist.attribute_id,
              name: attributeName,
              qaStatus: statusName,
              qaNotes: notes,
            })
          }
        })

        setQAChecklists(checklistsByJob)
      } catch (error) {
        console.error("Error in fetchQAChecklists:", error)
      }
    }

    fetchQAChecklists()
  }, [jobs])

  // Local state to store QA checklist changes (not saved to DB until "Done" is clicked)
  const [localQAChecklists, setLocalQAChecklists] = useState({})

  const handleUpdateQAChecklist = (jobId, locationId, attributeId, statusId, notes) => {
    // Update local state only, don't save to DB yet
    const location = propertyLocations.find(loc => loc.id === locationId)
    const attribute = locationAttributes.find(attr => attr.id === attributeId)
    const status = qaStatuses.find(s => s.id === statusId)
    
    setLocalQAChecklists((prev) => {
      const updated = { ...prev }
      
      if (!updated[jobId]) {
        updated[jobId] = {}
      }
      if (!updated[jobId][location?.name]) {
        updated[jobId][location?.name] = []
      }
      
      const locationAttrs = updated[jobId][location?.name] || []
      const existingIndex = locationAttrs.findIndex(attr => attr.id === attributeId)
      
      if (existingIndex >= 0) {
        locationAttrs[existingIndex] = {
          ...locationAttrs[existingIndex],
          id: attributeId,
          name: attribute?.name || "",
          qaStatus: status?.name || "",
          qaNotes: notes || "",
          locationId,
          statusId,
        }
      } else {
        locationAttrs.push({
          id: attributeId,
          name: attribute?.name || "",
          qaStatus: status?.name || "",
          qaNotes: notes || "",
          locationId,
          statusId,
        })
      }
      
      updated[jobId][location?.name] = locationAttrs
      return updated
    })
  }

  const transformedJobs = useMemo(() => {
    // Include all jobs with status "For QA" or "On-Going QA" or "Done" (for previous jobs)
    return jobs
      .filter((job) => job.status === "For QA" || job.status === "On-Going QA" || job.status === "Done")
      .map((job) => {
        const property = properties.find((p) => p.id === job.propertyId)
        const propertyLocationNames = property?.locations?.map((loc) => loc.name) || []
        
        const savedInspectorAttributes = inspectorChecklists[job.id] || {}
        const savedTechnicianAttributes = technicianChecklists[job.id] || {}
        const savedQAAttributes = qaChecklists[job.id] || {}
        const localQAAttributes = localQAChecklists[job.id] || {}
        
        // Merge saved QA attributes with local changes (local takes precedence)
        const mergedQAAttributes = { ...savedQAAttributes }
        Object.keys(localQAAttributes).forEach((locationName) => {
          if (!mergedQAAttributes[locationName]) {
            mergedQAAttributes[locationName] = []
          }
          const localAttrs = localQAAttributes[locationName] || []
          const savedAttrs = savedQAAttributes[locationName] || []
          
          // Merge local and saved attributes (local takes precedence)
          const merged = [...savedAttrs]
          localAttrs.forEach((localAttr) => {
            const existingIndex = merged.findIndex(attr => attr.id === localAttr.id)
            if (existingIndex >= 0) {
              merged[existingIndex] = { ...merged[existingIndex], ...localAttr }
            } else {
              merged.push(localAttr)
            }
          })
          mergedQAAttributes[locationName] = merged
        })
        
        return {
          ...job,
          property: {
            id: job.propertyId,
            name: job.property?.name || "Unknown Property",
            address: job.property?.fullAddress || job.property?.address || "",
            locations: propertyLocationNames,
          },
          inspectorAttributes: savedInspectorAttributes,
          technicianAttributes: savedTechnicianAttributes,
          qaAttributes: mergedQAAttributes,
        }
      })
  }, [jobs, properties, inspectorChecklists, technicianChecklists, qaChecklists, localQAChecklists])

  // Filter jobs by status for each tab
  const availableJobs = useMemo(() => {
    // Available Jobs: Show all jobs with status "For QA" regardless of assigned QA
    return transformedJobs.filter((job) => job.status === "For QA")
  }, [transformedJobs])

  const activeJobs = useMemo(() => {
    // Active Jobs: Show jobs with status "On-Going QA" assigned to the current QA user
    return transformedJobs.filter((job) => 
      job.status === "On-Going QA" && job.qaId === currentQAId
    )
  }, [transformedJobs, currentQAId])

  const previousJobs = useMemo(() => {
    // Previous Jobs: Show completed jobs (status "Done") assigned to the current QA user
    return transformedJobs.filter((job) => 
      job.status === "Done" && job.qaId === currentQAId
    )
  }, [transformedJobs, currentQAId])

  const handleStartJob = async (jobId) => {
    try {
      setIsStartingJob(true)
      // Find the job to get its current data
      const job = transformedJobs.find((j) => j.id === jobId)
      if (!job) return

      // Update job: assign current QA user and set status to "On-Going QA"
      const result = await updateJob(jobId, {
        jobTypeId: job.jobTypeId,
        date: job.date,
        propertyId: job.propertyId,
        inspectorId: job.inspectorId || null,
        technicianId: job.technicianId || null,
        qaId: currentQAId, // Assign current QA user
        status: "On-Going QA",
        inspectedDate: job.inspectedDate || null,
        fixDate: job.fixDate || null,
      })

      if (result.success) {
        // Refetch jobs to update the UI
        await refetch()
      }
    } catch (error) {
      console.error("Error starting job:", error)
    } finally {
      setIsStartingJob(false)
    }
  }

  const handleMarkDone = async (jobId) => {
    try {
      setIsMarkingDone(true)
      // Find the job to get its current data
      const job = transformedJobs.find((j) => j.id === jobId)
      if (!job) return

      // Get all QA checklist entries for this job from local state
      const jobQAChecklists = localQAChecklists[jobId] || {}
      const checklistEntries = []

      // Collect all QA checklist entries
      Object.keys(jobQAChecklists).forEach((locationName) => {
        const attributes = jobQAChecklists[locationName] || []
        attributes.forEach((attr) => {
          if (attr.locationId && attr.id && (attr.statusId || attr.qaNotes)) {
            checklistEntries.push({
              job_id: jobId,
              location_id: attr.locationId,
              attribute_id: attr.id,
              status_id: attr.statusId || null,
              notes: attr.qaNotes || null,
            })
          }
        })
      })

      // Insert all QA checklist entries at once
      if (checklistEntries.length > 0) {
        const { error: insertError } = await supabase
          .from("qa_checklists")
          .upsert(checklistEntries, {
            onConflict: "job_id,location_id,attribute_id",
          })

        if (insertError) {
          throw insertError
        }
      }

      // Update job status to "Done"
      const result = await updateJob(jobId, {
        jobTypeId: job.jobTypeId,
        date: job.date,
        propertyId: job.propertyId,
        inspectorId: job.inspectorId || null,
        technicianId: job.technicianId || null,
        qaId: job.qaId || currentQAId,
        status: "Done",
        inspectedDate: job.inspectedDate || null,
        fixDate: job.fixDate || null,
      })

      if (result.success) {
        // Clear local QA checklists for this job
        setLocalQAChecklists((prev) => {
          const updated = { ...prev }
          delete updated[jobId]
          return updated
        })

        // Refetch jobs to update the UI
        await refetch()
        toast({
          title: "Success",
          description: "Job has been marked as Done and QA checklist has been saved.",
          variant: "success",
        })
      }
    } catch (error) {
      console.error("Error marking job as done:", error)
      toast({
        title: "Error",
        description: "Failed to mark job as Done. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsMarkingDone(false)
    }
  }

  const renderJobs = (jobsList, showStartButton = false) => {
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
            <p className="text-muted-foreground">No jobs available for QA review.</p>
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
              inspectorAttributes={job.inspectorAttributes}
              technicianAttributes={job.technicianAttributes}
              qaAttributes={job.qaAttributes}
              qaStatuses={qaStatuses}
              propertyLocations={propertyLocations}
              onStartJob={handleStartJob}
              showStartJobButton={showStartButton}
              isStartingJob={isStartingJob}
              onUpdateQAChecklist={handleUpdateQAChecklist}
              onMarkDone={handleMarkDone}
              isMarkingDone={isMarkingDone}
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
        <h1 className="text-2xl md:text-3xl font-bold">QA Dashboard</h1>
        <p className="mt-2 text-sm md:text-base text-muted-foreground">
          Review and compare inspector and technician checklist images. Add notes for any discrepancies found.
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
          {renderJobs(availableJobs, true)}
        </TabsContent>
        <TabsContent value="active" className="mt-4 md:mt-6">
          {renderJobs(activeJobs, false)}
        </TabsContent>
        <TabsContent value="previous" className="mt-4 md:mt-6">
          {renderJobs(previousJobs, false)}
        </TabsContent>
      </Tabs>
    </div>
  )
}
