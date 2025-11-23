import { useState, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Search, Plus, Edit, Trash2, ChevronLeft, ChevronRight, ClipboardCheck, FileCheck, Loader2 } from "lucide-react"
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { motion } from "motion/react"
import { useJobs } from "@/hooks/use-jobs"
import { useJobTypes } from "@/hooks/use-job-types"
import { useProperties } from "@/hooks/use-properties"
import { useUsers } from "@/hooks/use-users"
import { useToast } from "@/hooks/use-toast"

const JOB_STATUSES = [
  "In-Review",
  "Waiting for Inspector",
  "On-Going Inspection",
  "Waiting for Technician",
  "On-Going Technician",
  "For QA",
  "On-Going QA",
  "Done",
]

const jobSchema = z.object({
  jobTypeId: z.string().min(1, "Job type is required"),
  date: z.string().min(1, "Date is required"),
  propertyId: z.string().min(1, "Property is required"),
  inspectorId: z.string().optional(),
  inspectedDate: z.string().optional(),
  technicianId: z.string().optional(),
  fixDate: z.string().optional(),
})

export function JobsPage() {
  const { jobs, loading, error, createJob, updateJob, deleteJob } = useJobs()
  const { jobTypes } = useJobTypes()
  const { properties } = useProperties()
  const { users } = useUsers()
  const { toast } = useToast()
  
  const [searchQuery, setSearchQuery] = useState("")
  const [jobTypeFilter, setJobTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingJob, setEditingJob] = useState(null)
  const [jobToDelete, setJobToDelete] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const itemsPerPage = 10

  // Filter users by role
  const inspectors = useMemo(() => {
    return users.filter((user) => user.role === "Inspector")
  }, [users])

  const technicians = useMemo(() => {
    return users.filter((user) => user.role === "Technician")
  }, [users])

  const qas = useMemo(() => {
    return users.filter((user) => user.role === "QA")
  }, [users])

  // Get unique job types for filter
  const availableJobTypes = useMemo(() => {
    return Array.from(new Set(jobs.map((job) => job.jobType))).filter(Boolean)
  }, [jobs])

  const form = useForm({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      jobTypeId: "",
      date: "",
      propertyId: "",
      inspectorId: "",
      inspectedDate: "",
      technicianId: "",
      fixDate: "",
    },
  })

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchesSearch =
        searchQuery === "" ||
        job.jobType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.property?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.inspector?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.technician?.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesJobType = jobTypeFilter === "all" || job.jobType === jobTypeFilter
      const matchesStatus = statusFilter === "all" || job.status === statusFilter
      return matchesSearch && matchesJobType && matchesStatus
    })
  }, [jobs, searchQuery, jobTypeFilter, statusFilter])

  const paginatedJobs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredJobs.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredJobs, currentPage])

  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage)

  const handleOpenDialog = (job = null) => {
    setEditingJob(job)
    if (job) {
      form.reset({
        jobTypeId: job.jobTypeId,
        date: job.date,
        propertyId: job.propertyId,
        inspectorId: job.inspectorId || "",
        inspectedDate: job.inspectedDate || "",
        technicianId: job.technicianId || "",
        fixDate: job.fixDate || "",
      })
    } else {
      form.reset({
        jobTypeId: "",
        date: "",
        propertyId: "",
        inspectorId: "",
        inspectedDate: "",
        technicianId: "",
        fixDate: "",
      })
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingJob(null)
    form.reset()
  }

  const onSubmit = async (data) => {
    setIsSubmitting(true)
    try {
      // Convert empty strings and "none" to null
      const inspectorId = data.inspectorId && data.inspectorId !== "" && data.inspectorId !== "none" ? data.inspectorId : null
      const technicianId = data.technicianId && data.technicianId !== "" && data.technicianId !== "none" ? data.technicianId : null
      
      const jobData = {
        jobTypeId: data.jobTypeId,
        date: data.date,
        propertyId: data.propertyId,
        inspectorId: inspectorId,
        technicianId: technicianId,
        inspectedDate: data.inspectedDate || null,
        fixDate: data.fixDate || null,
        status: editingJob?.status || "In-Review",
      }
      
      console.log("Submitting job data:", jobData) // Debug log

      if (editingJob) {
        const result = await updateJob(editingJob.id, jobData)
        if (result.success) {
          toast({
            title: "Success",
            description: "Job has been updated successfully.",
            variant: "success",
          })
          handleCloseDialog()
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to update job. Please try again.",
            variant: "destructive",
          })
        }
      } else {
        const result = await createJob(jobData)
        if (result.success) {
          toast({
            title: "Success",
            description: "Job has been created successfully.",
            variant: "success",
          })
          handleCloseDialog()
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to create job. Please try again.",
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

  const handleDeleteClick = (job) => {
    setJobToDelete(job)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!jobToDelete) return

    setIsDeleting(true)
    try {
      const result = await deleteJob(jobToDelete.id)
      if (result.success) {
        toast({
          title: "Success",
          description: "Job has been deleted successfully.",
          variant: "success",
        })
        setIsDeleteDialogOpen(false)
        setJobToDelete(null)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete job. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false)
    setJobToDelete(null)
  }

  const handleTechnicianChecklist = (job) => {
    // Placeholder - no API yet
    console.log("Open Technician Checklist for job:", job.id)
  }

  const handleInspectorChecklist = (job) => {
    // Placeholder - no API yet
    console.log("Open Inspector Checklist for job:", job.id)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "Done":
        return "bg-green-500/10 text-green-700 dark:text-green-400"
      case "For QA":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400"
      case "On-Going Inspection":
      case "On-Going Technician":
      case "On-Going QA":
        return "bg-orange-500/10 text-orange-700 dark:text-orange-400"
      case "Waiting for Inspector":
      case "Waiting for Technician":
        return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
      case "In-Review":
        return "bg-purple-500/10 text-purple-700 dark:text-purple-400"
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
          <h1 className="text-3xl font-bold tracking-tight">Jobs</h1>
          <p className="text-muted-foreground">
            Manage inspection jobs and assignments
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
                Add Job
              </Button>
            </motion.div>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingJob ? "Edit Job" : "Create New Job"}
              </DialogTitle>
              <DialogDescription>
                {editingJob
                  ? "Update job information below."
                  : "Fill in the details to create a new job."}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormItem>
                    <FormLabel htmlFor="jobTypeId">Job Type</FormLabel>
                    <FormControl>
                      <Select
                        value={form.watch("jobTypeId")}
                        onValueChange={(value) => {
                          form.setValue("jobTypeId", value)
                          form.trigger("jobTypeId")
                        }}
                      >
                        <SelectTrigger id="jobTypeId">
                          <SelectValue placeholder="Select job type" />
                        </SelectTrigger>
                        <SelectContent>
                          {jobTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage>
                      {form.formState.errors.jobTypeId?.message}
                    </FormMessage>
                  </FormItem>
                  <FormItem>
                    <FormLabel htmlFor="date">Date</FormLabel>
                    <FormControl>
                      <Input
                        id="date"
                        type="date"
                        {...form.register("date")}
                      />
                    </FormControl>
                    <FormMessage>
                      {form.formState.errors.date?.message}
                    </FormMessage>
                  </FormItem>
                </div>
                <FormItem>
                  <FormLabel htmlFor="propertyId">Property</FormLabel>
                  <FormControl>
                    <Select
                      value={form.watch("propertyId")}
                      onValueChange={(value) => {
                        form.setValue("propertyId", value)
                        form.trigger("propertyId")
                      }}
                    >
                      <SelectTrigger id="propertyId">
                        <SelectValue placeholder="Select property" />
                      </SelectTrigger>
                      <SelectContent>
                        {properties.map((property) => (
                          <SelectItem key={property.id} value={property.id}>
                            {property.name} - {property.streetAddress}
                            {property.unitNumber && `, ${property.unitNumber}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage>
                    {form.formState.errors.propertyId?.message}
                  </FormMessage>
                </FormItem>
                <FormItem>
                  <FormLabel htmlFor="inspectorId">Inspector (Optional)</FormLabel>
                  <FormControl>
                    <Select
                      value={form.watch("inspectorId") || undefined}
                      onValueChange={(value) => {
                        form.setValue("inspectorId", value === "none" ? "" : value)
                        form.trigger("inspectorId")
                      }}
                    >
                      <SelectTrigger id="inspectorId">
                        <SelectValue placeholder="Select inspector (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {inspectors.map((inspector) => (
                          <SelectItem key={inspector.id} value={inspector.id}>
                            {inspector.firstName} {inspector.lastName} ({inspector.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage>
                    {form.formState.errors.inspectorId?.message}
                  </FormMessage>
                </FormItem>
                <FormItem>
                  <FormLabel htmlFor="inspectedDate">Inspected Date (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      id="inspectedDate"
                      type="date"
                      {...form.register("inspectedDate")}
                    />
                  </FormControl>
                  <FormMessage>
                    {form.formState.errors.inspectedDate?.message}
                  </FormMessage>
                </FormItem>
                <FormItem>
                  <FormLabel htmlFor="technicianId">Technician (Optional)</FormLabel>
                  <FormControl>
                    <Select
                      value={form.watch("technicianId") || undefined}
                      onValueChange={(value) => {
                        form.setValue("technicianId", value === "none" ? "" : value)
                        form.trigger("technicianId")
                      }}
                    >
                      <SelectTrigger id="technicianId">
                        <SelectValue placeholder="Select technician (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {technicians.map((technician) => (
                          <SelectItem key={technician.id} value={technician.id}>
                            {technician.firstName} {technician.lastName} ({technician.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage>
                    {form.formState.errors.technicianId?.message}
                  </FormMessage>
                </FormItem>
                <FormItem>
                  <FormLabel htmlFor="fixDate">Fix Date (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      id="fixDate"
                      type="date"
                      {...form.register("fixDate")}
                    />
                  </FormControl>
                  <FormMessage>
                    {form.formState.errors.fixDate?.message}
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
                        {editingJob ? "Updating..." : "Creating..."}
                      </>
                    ) : (
                      editingJob ? "Update Job" : "Create Job"
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
                  placeholder="Search jobs..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="pl-9"
                />
              </div>
              <Select value={jobTypeFilter} onValueChange={setJobTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {availableJobTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-muted-foreground">
              Showing {filteredJobs.length} job{filteredJobs.length !== 1 ? "s" : ""}
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
                    <TableHead>Job Type</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Inspector</TableHead>
                    <TableHead>Technician</TableHead>
                    <TableHead>QA</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedJobs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        No jobs found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedJobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell>
                          <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                            {job.jobType}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium">
                          {job.property?.name || "N/A"}
                          {job.property?.fullAddress && (
                            <div className="text-xs text-muted-foreground">
                              {job.property.fullAddress}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {job.inspector ? (
                            <>
                              {job.inspector.name}
                              <div className="text-xs text-muted-foreground">
                                {job.inspector.email}
                              </div>
                            </>
                          ) : (
                            <span className="text-muted-foreground">Not assigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {job.technician ? (
                            <>
                              {job.technician.name}
                              <div className="text-xs text-muted-foreground">
                                {job.technician.email}
                              </div>
                            </>
                          ) : (
                            <span className="text-muted-foreground">Not assigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {job.qa ? (
                            <>
                              {job.qa.name}
                              <div className="text-xs text-muted-foreground">
                                {job.qa.email}
                              </div>
                            </>
                          ) : (
                            <span className="text-muted-foreground">Not assigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(job.status)}`}>
                            {job.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <TooltipProvider>
                            <div className="flex justify-end gap-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleTechnicianChecklist(job)}
                                  >
                                    <ClipboardCheck className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Technician Checklist</p>
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleInspectorChecklist(job)}
                                  >
                                    <FileCheck className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Inspector Checklist</p>
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleOpenDialog(job)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Edit Job</p>
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteClick(job)}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Delete Job</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </TooltipProvider>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Job</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this job? This action cannot be undone.
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
    </motion.div>
  )
}

