import { useState, useEffect } from "react"
import { useParams } from "react-router"
import { Calendar, User, MapPin, Loader2, CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EditableHeading } from "@/components/ui/editable-heading"
import { PunchlistRoomRow } from "@/components/ui/punchlist-room-row"
import { motion } from "motion/react"
import { useToast } from "@/hooks/use-toast"
import { getPublicAdminPunchlist, uploadProofOfCompletion } from "@/lib/api"

export function PublicPunchlistPage() {
  const { slug } = useParams()
  const { toast } = useToast()
  const [formData, setFormData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const fetchFormData = async () => {
      try {
        setLoading(true)
        const response = await getPublicAdminPunchlist(slug)
        
        if (response.success && response.data) {
          setFormData({
            id: response.data.id,
            address: response.data.address,
            date: response.data.date,
            assignedTechnician: response.data.assigned_technician,
            rooms: response.data.rooms || [],
          })
        } else {
          throw new Error("Failed to load form data")
        }
      } catch (error) {
        console.error("Error fetching punchlist:", error)
        toast({
          title: "Error",
          description: error.message || "Failed to load punchlist data. Please check the URL.",
          variant: "destructive",
        })
        setFormData(null)
      } finally {
        setLoading(false)
      }
    }

    if (slug) {
      fetchFormData()
    }
  }, [slug, toast])

  const handleProofOfCompletionChange = async (roomId, rowId, proofImage) => {
    if (!proofImage?.file) {
      return
    }

    setIsSaving(true)
    try {
      const response = await uploadProofOfCompletion(slug, roomId, rowId, proofImage.file)
      
      if (response.success) {
        // Update local state
        setFormData(prev => {
          const updatedRooms = prev.rooms.map(room => {
            if (room.id === roomId) {
              const updatedRows = room.rows.map(row => {
                if (row.id === rowId) {
                  return {
                    ...row,
                    proofOfCompletion: response.data.proof_of_completion_image_path || proofImage.url
                  }
                }
                return row
              })
              return { ...room, rows: updatedRows }
            }
            return room
          })
          return { ...prev, rooms: updatedRooms }
        })

        toast({
          title: "Saved",
          description: "Proof of completion uploaded successfully.",
          variant: "success",
        })
      }
    } catch (error) {
      console.error("Error uploading proof of completion:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to upload proof of completion. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading punchlist...</p>
        </div>
      </div>
    )
  }

  if (!formData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <p className="text-lg font-semibold">Punchlist Not Found</p>
              <p className="text-sm text-muted-foreground">
                The punchlist you're looking for doesn't exist or has been removed.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-background p-4 md:p-6 lg:p-8"
    >
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2 pb-6 border-b">
          <h1 className="text-3xl font-bold tracking-tight">Admin Punchlist</h1>
          <p className="text-muted-foreground">
            Public view - Add proof of completion for each item
          </p>
        </div>

        {/* Saving Indicator */}
        {isSaving && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-primary text-primary-foreground px-4 py-2 rounded-md shadow-lg flex items-center gap-2"
          >
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Saving changes...</span>
          </motion.div>
        )}

        {/* Form Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Form Information
            </CardTitle>
            <CardDescription>
              View the punchlist details below
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Address - Read-only display */}
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">Address</p>
                <EditableHeading
                  value={formData.address}
                  onChange={() => {}} // Disabled in public view
                  className="pointer-events-none opacity-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Date</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(formData.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              {formData.assignedTechnician && (
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Assigned Technician</p>
                    <p className="text-sm text-muted-foreground">
                      {formData.assignedTechnician}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Rooms Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              Rooms
            </CardTitle>
            <CardDescription>
              View punchlist items and add proof of completion
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {formData.rooms && formData.rooms.length > 0 ? (
              formData.rooms.map((room, roomIndex) => (
                <div key={room.id || roomIndex} className="border rounded-lg p-4 space-y-4">
                  <h3 className="text-lg font-semibold">{room.room_name}</h3>
                  
                  {room.rows && room.rows.length > 0 ? (
                    <div className="space-y-4">
                      {room.rows.map((row, rowIndex) => (
                        <PunchlistRoomRow
                          key={row.id || rowIndex}
                          row={{
                            image: (row.image_path && row.image_path.trim() !== '') ? row.image_path : null,
                            note: row.note || "",
                            proofOfCompletion: (row.proof_of_completion_image_path && row.proof_of_completion_image_path.trim() !== '') ? row.proof_of_completion_image_path : null,
                          }}
                          onChange={() => {}} // Disabled in public view
                          isReadOnly={true}
                          showProofOfCompletion={true}
                          onProofOfCompletionChange={(updatedRow) => {
                            handleProofOfCompletionChange(room.id || roomIndex, row.id || rowIndex, updatedRow.proofOfCompletion)
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      No items in this room.
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No rooms added to this punchlist.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center space-y-2 py-4">
          <p className="text-sm text-muted-foreground">
            This is a public punchlist. You can add proof of completion photos for each item.
          </p>
        </div>
      </div>
    </motion.div>
  )
}

