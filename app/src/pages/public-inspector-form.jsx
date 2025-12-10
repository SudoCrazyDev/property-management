import { useState, useEffect } from "react"
import { useParams } from "react-router"
import { Calendar, User, MapPin, FileText, Video, Image as ImageIcon, Loader2, CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ImageGallery } from "@/components/ui/image-gallery"
import { VideoGallery } from "@/components/ui/video-gallery"
import { NotesList } from "@/components/ui/notes-list"
import { motion } from "motion/react"
import { useToast } from "@/hooks/use-toast"
import { 
  getPublicInspectorForm, 
  updatePublicFormNotes, 
  uploadPublicFormVideos, 
  uploadPublicFormImages 
} from "@/lib/api"

export function PublicInspectorFormPage() {
  const { slug } = useParams()
  const { toast } = useToast()
  const [formData, setFormData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Fetch form data by slug
  useEffect(() => {
    const fetchFormData = async () => {
      try {
        setLoading(true)
        const response = await getPublicInspectorForm(slug)
        
        if (response.success && response.data) {
          setFormData({
            id: response.data.id,
            date: response.data.date,
            uploader: response.data.uploader,
            projectAddress: response.data.project_address,
            notes: response.data.notes || [],
            // Extract file_path from video objects, or use the object if it's already a string
            videos: (response.data.videos || []).map(video => 
              typeof video === 'string' ? video : (video.file_path || video.url || video)
            ),
            // Extract file_path from image objects, or use the object if it's already a string
            images: (response.data.images || []).map(image => 
              typeof image === 'string' ? image : (image.file_path || image.url || image)
            ),
          })
        } else {
          throw new Error("Failed to load form data")
        }
      } catch (error) {
        console.error("Error fetching form:", error)
        toast({
          title: "Error",
          description: error.message || "Failed to load form data. Please check the URL.",
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

  // Save updates to form
  const handleSave = async (type, data) => {
    setIsSaving(true)
    try {
      let response
      
      if (type === 'notes') {
        // Update notes
        response = await updatePublicFormNotes(slug, data)
        if (response.success) {
          setFormData(prev => ({
            ...prev,
            notes: response.data || data
          }))
        }
      } else if (type === 'videos') {
        // Filter out File objects for upload
        const filesToUpload = data.filter(item => item instanceof File)
        if (filesToUpload.length > 0) {
          response = await uploadPublicFormVideos(slug, filesToUpload)
          if (response.success) {
            // Merge existing videos with new ones
            const existingVideos = formData?.videos?.filter(v => typeof v === 'string' || (v && v.id)) || []
            const newVideos = (response.data || []).map(video => 
              typeof video === 'string' ? video : (video.file_path || video.url || video)
            )
            setFormData(prev => ({
              ...prev,
              videos: [...existingVideos, ...newVideos]
            }))
          }
        } else {
          // Just update local state if no new files
          setFormData(prev => ({
            ...prev,
            videos: data
          }))
        }
      } else if (type === 'images') {
        // Filter out File objects for upload
        const filesToUpload = data.filter(item => item instanceof File || (item && item.file))
        const actualFiles = filesToUpload.map(item => item.file || item).filter(item => item instanceof File)
        
        if (actualFiles.length > 0) {
          response = await uploadPublicFormImages(slug, actualFiles)
          if (response.success) {
            // Merge existing images with new ones
            const existingImages = formData?.images?.filter(img => typeof img === 'string' || (img && img.id)) || []
            const newImages = (response.data || []).map(image => 
              typeof image === 'string' ? image : (image.file_path || image.url || image)
            )
            setFormData(prev => ({
              ...prev,
              images: [...existingImages, ...newImages]
            }))
          }
        } else {
          // Just update local state if no new files
          setFormData(prev => ({
            ...prev,
            images: data
          }))
        }
      }
      
      if (response && response.success) {
        toast({
          title: "Saved",
          description: `${type.charAt(0).toUpperCase() + type.slice(1)} saved successfully.`,
          variant: "success",
        })
      }
    } catch (error) {
      console.error(`Error saving ${type}:`, error)
      toast({
        title: "Error",
        description: error.message || `Failed to save ${type}. Please try again.`,
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
          <p className="text-muted-foreground">Loading form...</p>
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
              <p className="text-lg font-semibold">Form Not Found</p>
              <p className="text-sm text-muted-foreground">
                The form you're looking for doesn't exist or has been removed.
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
          <h1 className="text-3xl font-bold tracking-tight">Inspector Form</h1>
          <p className="text-muted-foreground">
            Public view - Add notes, videos, or images to this form
          </p>
        </div>

        {/* Form Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Form Information
            </CardTitle>
            <CardDescription>
              View the form details below
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Uploader</p>
                  <p className="text-sm text-muted-foreground">
                    {formData.uploader?.name || formData.uploader?.email || "N/A"}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Project Address</p>
                <p className="text-sm text-muted-foreground">
                  {formData.projectAddress}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes Section */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-muted-foreground" />
              Notes
            </CardTitle>
            <CardDescription>
              Add notes or observations about this project
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NotesList
              value={formData.notes || []}
              onChange={(notes) => handleSave('notes', notes)}
            />
          </CardContent>
        </Card>

        {/* Videos Section */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Video className="h-5 w-5 text-muted-foreground" />
              Videos
            </CardTitle>
            <CardDescription>
              Upload video files related to this project (max 20 videos)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <VideoGallery
              value={formData.videos || []}
              onChange={(videos) => handleSave('videos', videos)}
              maxVideos={20}
            />
          </CardContent>
        </Card>

        {/* Images Section */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ImageIcon className="h-5 w-5 text-muted-foreground" />
              Images
            </CardTitle>
            <CardDescription>
              Upload images related to this project (max 20 images)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ImageGallery
              value={formData.images || []}
              onChange={(images) => handleSave('images', images)}
              maxImages={20}
            />
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center space-y-2 py-4">
          {isSaving && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Saving changes...</span>
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            This is a public form. Anyone with this link can view and add content.
          </p>
        </div>
      </div>
    </motion.div>
  )
}

