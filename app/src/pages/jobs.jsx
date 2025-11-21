import { useState, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Search, Plus, Edit, Trash2, ChevronLeft, ChevronRight, ClipboardCheck, FileCheck } from "lucide-react"
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

const jobSchema = z.object({
  jobType: z.string().min(1, "Job type is required"),
  date: z.string().min(1, "Date is required"),
  property: z.string().min(1, "Property is required"),
  inspector: z.string().min(1, "Inspector is required"),
  inspectedDate: z.string().optional(),
  technician: z.string().min(1, "Technician is required"),
  fixDate: z.string().optional(),
})

// Mock data - replace with API calls later
const mockJobTypes = ["Move In", "Move Out"]
const mockProperties = [
  { id: 1, name: "House 1", address: "123 Main St" },
  { id: 2, name: "Apartment 2", address: "456 Oak Ave" },
  { id: 3, name: "Condo 3", address: "789 Pine Rd" },
  { id: 4, name: "Duplex 4", address: "321 Elm St" },
  { id: 5, name: "House 5", address: "654 Maple Dr" },
]

const mockInspectors = [
  { id: 1, name: "John Inspector", email: "john@example.com" },
  { id: 2, name: "Jane Inspector", email: "jane@example.com" },
  { id: 3, name: "Bob Inspector", email: "bob@example.com" },
]

const mockTechnicians = [
  { id: 1, name: "Mike Technician", email: "mike@example.com" },
  { id: 2, name: "Sarah Technician", email: "sarah@example.com" },
  { id: 3, name: "Tom Technician", email: "tom@example.com" },
]

const mockQAs = [
  { id: 1, name: "Alice QA", email: "alice@example.com" },
  { id: 2, name: "David QA", email: "david@example.com" },
  { id: 3, name: "Emma QA", email: "emma@example.com" },
]

const JOB_STATUSES = [
  "In-Review",
  "Waiting for Inspector",
  "On-Going Inspection",
  "Waiting for Technician",
  "On-Going Technician",
  "For QA",
  "Done",
]

const mockJobs = Array.from({ length: 25 }, (_, i) => ({
  id: i + 1,
  jobType: mockJobTypes[i % mockJobTypes.length],
  date: new Date(2024, i % 12, (i % 28) + 1).toISOString().split("T")[0],
  property: mockProperties[i % mockProperties.length],
  inspector: mockInspectors[i % mockInspectors.length],
  inspectedDate: i % 3 === 0 ? new Date(2024, i % 12, (i % 28) + 2).toISOString().split("T")[0] : null,
  status: JOB_STATUSES[i % JOB_STATUSES.length],
  technician: mockTechnicians[i % mockTechnicians.length],
  qa: mockQAs[i % mockQAs.length],
}))

export function JobsPage() {
  const [jobs] = useState(mockJobs)
  const [searchQuery, setSearchQuery] = useState("")
  const [jobTypeFilter, setJobTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingJob, setEditingJob] = useState(null)
  const itemsPerPage = 10

  const form = useForm({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      jobType: "",
      date: "",
      property: "",
      inspector: "",
      inspectedDate: "",
    },
  })

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchesSearch =
        searchQuery === "" ||
        job.jobType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.property.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.inspector.name.toLowerCase().includes(searchQuery.toLowerCase())
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
        jobType: job.jobType,
        date: job.date,
        property: job.property.id.toString(),
        inspector: job.inspector.id.toString(),
        inspectedDate: job.inspectedDate || "",
        technician: job.technician?.id.toString() || "",
        fixDate: job.fixDate || "",
      })
    } else {
      form.reset()
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingJob(null)
    form.reset()
  }

  const onSubmit = (data) => {
    // Placeholder - no API yet
    console.log(editingJob ? "Update job:" : "Create job:", data)
    handleCloseDialog()
  }

  const handleDelete = (jobId) => {
    // Placeholder - no API yet
    console.log("Delete job:", jobId)
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
                    <FormLabel htmlFor="jobType">Job Type</FormLabel>
                    <FormControl>
                      <Select
                        value={form.watch("jobType")}
                        onValueChange={(value) => {
                          form.setValue("jobType", value)
                          form.trigger("jobType")
                        }}
                      >
                        <SelectTrigger id="jobType">
                          <SelectValue placeholder="Select job type" />
                        </SelectTrigger>
                        <SelectContent>
                          {mockJobTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage>
                      {form.formState.errors.jobType?.message}
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
                  <FormLabel htmlFor="property">Property</FormLabel>
                  <FormControl>
                    <Select
                      value={form.watch("property")}
                      onValueChange={(value) => {
                        form.setValue("property", value)
                        form.trigger("property")
                      }}
                    >
                      <SelectTrigger id="property">
                        <SelectValue placeholder="Select property" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockProperties.map((property) => (
                          <SelectItem key={property.id} value={property.id.toString()}>
                            {property.name} - {property.address}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage>
                    {form.formState.errors.property?.message}
                  </FormMessage>
                </FormItem>
                <FormItem>
                  <FormLabel htmlFor="inspector">Inspector</FormLabel>
                  <FormControl>
                    <Select
                      value={form.watch("inspector")}
                      onValueChange={(value) => {
                        form.setValue("inspector", value)
                        form.trigger("inspector")
                      }}
                    >
                      <SelectTrigger id="inspector">
                        <SelectValue placeholder="Select inspector" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockInspectors.map((inspector) => (
                          <SelectItem key={inspector.id} value={inspector.id.toString()}>
                            {inspector.name} ({inspector.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage>
                    {form.formState.errors.inspector?.message}
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
                  <FormLabel htmlFor="technician">Technician</FormLabel>
                  <FormControl>
                    <Select
                      value={form.watch("technician")}
                      onValueChange={(value) => {
                        form.setValue("technician", value)
                        form.trigger("technician")
                      }}
                    >
                      <SelectTrigger id="technician">
                        <SelectValue placeholder="Select technician" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockTechnicians.map((technician) => (
                          <SelectItem key={technician.id} value={technician.id.toString()}>
                            {technician.name} ({technician.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage>
                    {form.formState.errors.technician?.message}
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
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting
                      ? "Saving..."
                      : editingJob
                      ? "Update Job"
                      : "Create Job"}
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
                  {mockJobTypes.map((type) => (
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

          <div className="mt-4 rounded-md border">
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
                        {job.property.name}
                        <div className="text-xs text-muted-foreground">
                          {job.property.address}
                        </div>
                      </TableCell>
                      <TableCell>
                        {job.inspector.name}
                        <div className="text-xs text-muted-foreground">
                          {job.inspector.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        {job.technician.name}
                        <div className="text-xs text-muted-foreground">
                          {job.technician.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        {job.qa.name}
                        <div className="text-xs text-muted-foreground">
                          {job.qa.email}
                        </div>
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
                                  onClick={() => handleDelete(job.id)}
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

