import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Save, Loader2, Calendar, User, MapPin, FileText, Video, Image as ImageIcon, CheckCircle2, Copy, ExternalLink, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Form,
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ImageGallery } from "@/components/ui/image-gallery"
import { VideoGallery } from "@/components/ui/video-gallery"
import { NotesList } from "@/components/ui/notes-list"
import { motion } from "motion/react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { createInspectorForm, uploadPublicFormVideos, uploadPublicFormImages } from "@/lib/api"

const inspectorFormSchema = z.object({
  date: z.string().min(1, "Date is required"),
  uploaderId: z.string().min(1, "Uploader name is required"),
  projectAddress: z.string().min(1, "Project address is required"),
  notes: z.array(z.string()).optional().default([]),
  videos: z.array(z.any()).optional().default([]),
  images: z.array(z.any()).optional().default([]),
})

export function PublicCreateFormPage() {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [publicUrl, setPublicUrl] = useState(null)

  const form = useForm({
    resolver: zodResolver(inspectorFormSchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      uploaderId: "",
      projectAddress: "",
      notes: [],
      videos: [],
      images: [],
    },
  })

  // Copy public URL to clipboard
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
      // Call Laravel API to create inspector form
      const response = await createInspectorForm({
        date: data.date,
        uploaderId: data.uploaderId,
        projectAddress: data.projectAddress,
        notes: data.notes || [],
        videos: [],
        images: [],
      })

      if (response.success && response.public_url) {
        const publicSlug = response.public_url.split('/').pop()
        
        // Upload videos if any
        const videoFiles = (data.videos || [])
          .map(item => item instanceof File ? item : (item?.file || null))
          .filter(item => item instanceof File)
        
        if (videoFiles.length > 0 && publicSlug) {
          try {
            await uploadPublicFormVideos(publicSlug, videoFiles)
            toast({
              title: "Videos Uploaded",
              description: `${videoFiles.length} video(s) uploaded successfully.`,
              variant: "success",
            })
          } catch (error) {
            console.error("Error uploading videos:", error)
            toast({
              title: "Warning",
              description: "Form saved but some videos failed to upload. You can upload them via the public URL.",
              variant: "default",
            })
          }
        }

        // Upload images if any
        const imageFiles = (data.images || [])
          .map(item => item instanceof File ? item : (item?.file || item))
          .filter(item => item instanceof File)
        
        if (imageFiles.length > 0 && publicSlug) {
          try {
            await uploadPublicFormImages(publicSlug, imageFiles)
            toast({
              title: "Images Uploaded",
              description: `${imageFiles.length} image(s) uploaded successfully.`,
              variant: "success",
            })
          } catch (error) {
            console.error("Error uploading images:", error)
            toast({
              title: "Warning",
              description: "Form saved but some images failed to upload. You can upload them via the public URL.",
              variant: "default",
            })
          }
        }

        setPublicUrl(response.public_url)

        toast({
          title: "Success",
          description: "Inspector form has been saved successfully. Public URL generated!",
          variant: "success",
        })

        // Reset form after successful submission
        form.reset({
          date: new Date().toISOString().split("T")[0],
          uploaderId: "",
          projectAddress: "",
          notes: [],
          videos: [],
          images: [],
        })
      } else {
        throw new Error(response.message || "Failed to create form")
      }
    } catch (error) {
      console.error("Error saving inspector form:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to save inspector form. Please try again.",
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
          <h1 className="text-3xl font-bold tracking-tight">Create Inspector Form</h1>
          <p className="text-muted-foreground mt-1">
            Fill out the form below to create a new inspector form. Anyone with the public URL can view and contribute.
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
                  Share this public URL to allow others to view and add notes, videos, or images:
                </p>
                {/* URL on its own row */}
                <div className="p-2 bg-background rounded-md border">
                  <code className="text-sm break-all block">{publicUrl}</code>
                </div>
                {/* Buttons below URL */}
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
                      Select the date for this inspection
                    </FormDescription>
                    <FormMessage>
                      {form.formState.errors.date?.message}
                    </FormMessage>
                  </FormItem>

                  {/* Uploader Name Field - Editable for public form */}
                  <FormItem>
                    <FormLabel htmlFor="uploaderName" className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      Uploader's Name *
                    </FormLabel>
                    <FormControl>
                      <Input
                        id="uploaderName"
                        type="text"
                        placeholder="Enter your name"
                        {...form.register("uploaderId")}
                        className={cn(
                          form.formState.errors.uploaderId && "border-destructive"
                        )}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter the name of the person creating this form
                    </FormDescription>
                    <FormMessage>
                      {form.formState.errors.uploaderId?.message}
                    </FormMessage>
                  </FormItem>
                </div>

                {/* Project Address Field */}
                <FormItem>
                  <FormLabel htmlFor="projectAddress" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    Project Address *
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      id="projectAddress"
                      placeholder="Enter the project address"
                      rows={3}
                      {...form.register("projectAddress")}
                      className={cn(
                        form.formState.errors.projectAddress && "border-destructive"
                      )}
                    />
                  </FormControl>
                  <FormDescription>
                    The physical address of the property being inspected
                  </FormDescription>
                  <FormMessage>
                    {form.formState.errors.projectAddress?.message}
                  </FormMessage>
                </FormItem>
              </CardContent>
            </Card>

            {/* Optional Information Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-sm font-medium text-muted-foreground px-3">
                  Optional Information
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>

              {/* Notes Section */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    Notes
                  </CardTitle>
                  <CardDescription>
                    Add any additional notes or observations about the project
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FormItem>
                    <FormControl>
                      <NotesList
                        value={form.watch("notes") || []}
                        onChange={(notes) => {
                          form.setValue("notes", notes)
                          form.trigger("notes")
                        }}
                      />
                    </FormControl>
                    <FormMessage>
                      {form.formState.errors.notes?.message}
                    </FormMessage>
                  </FormItem>
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
                    Upload relevant video clips of the property
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FormItem>
                    <FormControl>
                      <VideoGallery
                        value={form.watch("videos") || []}
                        onChange={(videos) => {
                          form.setValue("videos", videos)
                          form.trigger("videos")
                        }}
                        maxVideos={20}
                      />
                    </FormControl>
                    <FormMessage>
                      {form.formState.errors.videos?.message}
                    </FormMessage>
                  </FormItem>
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
                    Upload relevant images of the property
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FormItem>
                    <FormControl>
                      <ImageGallery
                        value={form.watch("images") || []}
                        onChange={(images) => {
                          form.setValue("images", images)
                          form.trigger("images")
                        }}
                        maxImages={20}
                      />
                    </FormControl>
                    <FormMessage>
                      {form.formState.errors.images?.message}
                    </FormMessage>
                  </FormItem>
                </CardContent>
              </Card>
            </div>

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

