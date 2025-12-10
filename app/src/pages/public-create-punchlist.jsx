import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Save, Loader2, Calendar, User, MapPin, Plus, X, CheckCircle2, Copy, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EditableHeading } from "@/components/ui/editable-heading"
import { PunchlistRoomRow } from "@/components/ui/punchlist-room-row"
import { motion } from "motion/react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { createAdminPunchlist } from "@/lib/api"

// Predefined room list
const ROOM_OPTIONS = [
  "Entryway/Hallways",
  "Living Room",
  "Dining Area",
  "Kitchen",
  "Primary Bedroom",
  "Bedroom 2",
  "Bedroom 3",
  "Bedroom 4",
  "Primary Bathroom",
  "Bathroom 2",
  "Bathroom 3",
  "Laundry Room",
  "Garage",
  "Exterior",
  "Outdoor Shed",
  "General System"
]

const punchlistFormSchema = z.object({
  address: z.string().min(1, "Address is required"),
  date: z.string().min(1, "Date is required"),
  assignedTechnician: z.string().optional(),
  rooms: z.array(z.object({
    roomName: z.string(),
    rows: z.array(z.object({
      image: z.any().optional(),
      note: z.string().optional(),
    })),
  })).optional().default([]),
})

export function PublicCreatePunchlistPage() {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [publicUrl, setPublicUrl] = useState(null)

  const form = useForm({
    resolver: zodResolver(punchlistFormSchema),
    defaultValues: {
      address: "",
      date: new Date().toISOString().split("T")[0],
      assignedTechnician: "",
      rooms: [],
    },
  })

  const rooms = form.watch("rooms") || []

  const addRoom = () => {
    const currentRooms = form.getValues("rooms") || []
    form.setValue("rooms", [
      ...currentRooms,
      {
        roomName: "",
        rows: [],
      },
    ])
  }

  const removeRoom = (roomIndex) => {
    const currentRooms = form.getValues("rooms") || []
    form.setValue("rooms", currentRooms.filter((_, i) => i !== roomIndex))
  }

  const updateRoom = (roomIndex, updates) => {
    const currentRooms = form.getValues("rooms") || []
    const updatedRooms = [...currentRooms]
    updatedRooms[roomIndex] = { ...updatedRooms[roomIndex], ...updates }
    form.setValue("rooms", updatedRooms)
  }

  const addRowToRoom = (roomIndex) => {
    const currentRooms = form.getValues("rooms") || []
    const updatedRooms = [...currentRooms]
    if (!updatedRooms[roomIndex].rows) {
      updatedRooms[roomIndex].rows = []
    }
    updatedRooms[roomIndex].rows.push({
      image: null,
      note: "",
    })
    form.setValue("rooms", updatedRooms)
  }

  const removeRowFromRoom = (roomIndex, rowIndex) => {
    const currentRooms = form.getValues("rooms") || []
    const updatedRooms = [...currentRooms]
    updatedRooms[roomIndex].rows = updatedRooms[roomIndex].rows.filter((_, i) => i !== rowIndex)
    form.setValue("rooms", updatedRooms)
  }

  const updateRowInRoom = (roomIndex, rowIndex, updates) => {
    const currentRooms = form.getValues("rooms") || []
    const updatedRooms = [...currentRooms]
    updatedRooms[roomIndex].rows[rowIndex] = {
      ...updatedRooms[roomIndex].rows[rowIndex],
      ...updates,
    }
    form.setValue("rooms", updatedRooms)
  }

  const copyToClipboard = (url) => {
    navigator.clipboard.writeText(url)
    toast({
      title: "Copied!",
      description: "Public URL has been copied to clipboard.",
      variant: "success",
    })
  }

  const onSubmit = async (data) => {
    setIsSubmitting(true)
    setPublicUrl(null)
    try {
      // Prepare FormData for API (to handle file uploads)
      const formData = new FormData()
      formData.append('address', data.address)
      formData.append('date', data.date)
      if (data.assignedTechnician) {
        formData.append('assigned_technician', data.assignedTechnician)
      }

      // Append rooms data with files
      data.rooms.forEach((room, roomIndex) => {
        formData.append(`rooms[${roomIndex}][room_name]`, room.roomName)
        
        room.rows.forEach((row, rowIndex) => {
          // Append note
          formData.append(`rooms[${roomIndex}][rows][${rowIndex}][note]`, row.note || "")
          
          // Append image file if exists
          if (row.image?.file) {
            formData.append(`rooms[${roomIndex}][rows][${rowIndex}][image]`, row.image.file)
          }
        })
      })

      const response = await createAdminPunchlist(formData)

      if (response.success && response.public_url) {
        setPublicUrl(response.public_url)

        toast({
          title: "Success",
          description: "Admin Punchlist form has been saved successfully. Public URL generated!",
          variant: "success",
        })

        // Reset form after successful submission
        form.reset({
          address: "",
          date: new Date().toISOString().split("T")[0],
          assignedTechnician: "",
          rooms: [],
        })
      } else {
        throw new Error(response.message || "Failed to create form")
      }
    } catch (error) {
      console.error("Error saving punchlist form:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to save punchlist form. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-background p-4 md:p-6 lg:p-8"
    >
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Create Admin Punchlist</h1>
          <p className="text-muted-foreground mt-1">
            Fill out the form below to create a new admin punchlist. Anyone with the public URL can view and add proof of completion.
          </p>
        </div>

        {/* Public URL Display */}
        {publicUrl && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border-2 border-green-500/20 bg-green-500/10 p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <h3 className="font-semibold text-green-700 dark:text-green-400">
                    Form Saved Successfully!
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Share this public URL to allow others to view and add proof of completion:
                </p>
                <div className="p-2 bg-background rounded-md border">
                  <code className="text-sm break-all block">{publicUrl}</code>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(publicUrl)}
                    className="w-full sm:w-auto"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(publicUrl, '_blank')}
                    className="w-full sm:w-auto"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open
                  </Button>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setPublicUrl(null)}
                className="shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Required Information Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  Required Information
                </CardTitle>
                <CardDescription>
                  Please fill in all required fields to proceed
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Address Field - Editable Heading */}
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    Address *
                  </FormLabel>
                  <FormControl>
                    <EditableHeading
                      value={form.watch("address")}
                      onChange={(value) => form.setValue("address", value)}
                      placeholder="Enter address..."
                      className={cn(
                        form.formState.errors.address && "text-destructive"
                      )}
                    />
                  </FormControl>
                  <FormDescription>
                    Click on the address to edit it
                  </FormDescription>
                  <FormMessage>
                    {form.formState.errors.address?.message}
                  </FormMessage>
                </FormItem>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Date Field */}
                  <FormItem>
                    <FormLabel htmlFor="date" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      Date *
                    </FormLabel>
                    <FormControl>
                      <Input
                        id="date"
                        type="date"
                        {...form.register("date")}
                        className={cn(
                          form.formState.errors.date && "border-destructive"
                        )}
                      />
                    </FormControl>
                    <FormDescription>
                      Select the date for this punchlist
                    </FormDescription>
                    <FormMessage>
                      {form.formState.errors.date?.message}
                    </FormMessage>
                  </FormItem>

                  {/* Assigned Technician Field */}
                  <FormItem>
                    <FormLabel htmlFor="assignedTechnician" className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      Assigned Technician
                    </FormLabel>
                    <FormControl>
                      <Input
                        id="assignedTechnician"
                        type="text"
                        placeholder="Enter technician name (optional)"
                        {...form.register("assignedTechnician")}
                      />
                    </FormControl>
                    <FormDescription>
                      Name of the assigned technician (optional)
                    </FormDescription>
                    <FormMessage>
                      {form.formState.errors.assignedTechnician?.message}
                    </FormMessage>
                  </FormItem>
                </div>
              </CardContent>
            </Card>

            {/* Rooms Section */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                      Rooms
                    </CardTitle>
                    <CardDescription>
                      Add rooms and their punchlist items
                    </CardDescription>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addRoom}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Room
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {rooms.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No rooms added yet. Click "Add Room" to get started.</p>
                  </div>
                ) : (
                  rooms.map((room, roomIndex) => (
                    <div key={roomIndex} className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <Select
                            value={room.roomName || ""}
                            onValueChange={(value) =>
                              updateRoom(roomIndex, { roomName: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a room" />
                            </SelectTrigger>
                            <SelectContent>
                              {ROOM_OPTIONS.map((roomOption) => (
                                <SelectItem key={roomOption} value={roomOption}>
                                  {roomOption}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeRoom(roomIndex)}
                          className="text-destructive hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      {room.roomName && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">Rows</p>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addRowToRoom(roomIndex)}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Row
                            </Button>
                          </div>

                          {room.rows && room.rows.length > 0 ? (
                            room.rows.map((row, rowIndex) => (
                              <PunchlistRoomRow
                                key={rowIndex}
                                row={row}
                                onChange={(updatedRow) =>
                                  updateRowInRoom(roomIndex, rowIndex, updatedRow)
                                }
                                onRemove={() => removeRowFromRoom(roomIndex, rowIndex)}
                                isReadOnly={false}
                                showProofOfCompletion={false}
                              />
                            ))
                          ) : (
                            <div className="text-center py-4 text-muted-foreground text-sm">
                              No rows added yet. Click "Add Row" to add items.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Submit Button Section */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  size="lg"
                  className="w-full"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving Form...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Form
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </form>
        </Form>
      </div>
    </motion.div>
  )
}

