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
import { supabase } from "@/lib/supabase"
import { getImageUrl } from "@/lib/file-upload"

// AttributeCard with side-by-side comparison of Inspector and Technician images
function AttributeCard({ attribute, locationName, inspectorChecklist, technicianChecklist }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [selectedImageType, setSelectedImageType] = useState("inspector") // "inspector" or "technician"
  const [notes, setNotes] = useState("") // Placeholder for notes
  
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

              {/* Notes Section */}
              <div className="space-y-2 border-t pt-4">
                <label className="block text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  QA Notes
                </label>
                <Textarea
                  placeholder="Add notes if you find any discrepancies or issues..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[100px]"
                />
                <p className="text-xs text-muted-foreground">
                  Note: Notes functionality is a placeholder. API integration will be added later.
                </p>
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
function LocationSection({ locationName, attributes, inspectorAttributes, technicianAttributes }) {
  const [isExpanded, setIsExpanded] = useState(true)

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
                  inspectorChecklist={{
                    status: attribute.status || attribute.inspectorStatus,
                    files: attribute.files || [],
                  }}
                  technicianChecklist={{
                    status: attribute.technicianStatus || "",
                    files: attribute.technicianFiles || [],
                  }}
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

function JobCard({ job, inspectorAttributes, technicianAttributes }) {
  const [isExpanded, setIsExpanded] = useState(false)

  const jobContent = (
    <div className="space-y-4">
      {(job.property?.locations || []).map((locationName) => (
        <LocationSection
          key={locationName}
          locationName={locationName}
          attributes={[]}
          inspectorAttributes={inspectorAttributes || {}}
          technicianAttributes={technicianAttributes || {}}
        />
      ))}
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
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </>
  )
}

export function QAPage() {
  const { user } = useAuth()
  const { jobs, loading } = useJobs()
  const { properties } = useProperties()
  const { propertyLocations } = usePropertyLocations()
  const { locationAttributes } = useLocationAttributes()
  const { inspectorStatuses } = useInspectorStatuses()
  const { technicianStatuses } = useTechnicianStatuses()
  
  const [activeTab, setActiveTab] = useState("available")
  const [inspectorChecklists, setInspectorChecklists] = useState({})
  const [technicianChecklists, setTechnicianChecklists] = useState({})

  const currentQAId = user?.id

  // Fetch inspector checklists
  useEffect(() => {
    if (!currentQAId || jobs.length === 0) return

    const fetchInspectorChecklists = async () => {
      try {
        const jobIds = jobs
          .filter((job) => job.status === "For QA")
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
  }, [currentQAId, jobs])

  // Fetch technician checklists
  useEffect(() => {
    if (!currentQAId || jobs.length === 0) return

    const fetchTechnicianChecklists = async () => {
      try {
        const jobIds = jobs
          .filter((job) => job.status === "For QA")
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
  }, [currentQAId, jobs])

  const transformedJobs = useMemo(() => {
    return jobs
      .filter((job) => job.status === "For QA")
      .map((job) => {
        const property = properties.find((p) => p.id === job.propertyId)
        const propertyLocationNames = property?.locations?.map((loc) => loc.name) || []
        
        const savedInspectorAttributes = inspectorChecklists[job.id] || {}
        const savedTechnicianAttributes = technicianChecklists[job.id] || {}
        
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
        }
      })
  }, [jobs, properties, inspectorChecklists, technicianChecklists])

  const availableJobs = useMemo(() => {
    return transformedJobs
  }, [transformedJobs])

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
          </TabsList>
        </div>
        
        <div className="hidden md:block">
          <TabsList className="grid w-full grid-cols-1 h-10 p-1 bg-muted/50 rounded-md">
            <TabsTrigger 
              value="available"
              className="px-3 py-1.5 text-sm font-medium rounded-sm data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground transition-all"
            >
              Available Jobs
              <span className="ml-2 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                {availableJobs.length}
              </span>
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="available" className="mt-4 md:mt-6">
          {renderJobs(availableJobs)}
        </TabsContent>
      </Tabs>
    </div>
  )
}
