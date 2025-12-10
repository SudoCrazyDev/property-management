import { useState, useEffect, useRef } from "react"
import { X, Upload, Video } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { motion } from "motion/react"

export function VideoGallery({ value = [], onChange, maxVideos = 10 }) {
  // value can be array of:
  // - File objects with preview URLs (for new uploads)
  // - Path strings (for existing videos from database)
  const [previews, setPreviews] = useState([])
  const fileInputRef = useRef(null)

  // Initialize previews from value prop
  useEffect(() => {
    if (value && value.length > 0) {
      const initializedPreviews = value.map((item) => {
        // If it's already a preview object (has id, url, file)
        if (item && item.id && item.url) {
          return item
        }
        // If it's a file object
        if (item instanceof File) {
          return {
            id: Date.now() + Math.random(),
            url: URL.createObjectURL(item),
            file: item,
            name: item.name,
            isNew: true,
          }
        }
        // If it's an object with file_path (from API)
        if (item && typeof item === "object" && item.file_path) {
          return {
            id: item.id || item.file_path,
            url: item.file_path, // Use file_path as URL
            path: item.file_path,
            name: item.file_name || item.file_path.split("/").pop(),
            isExisting: true,
          }
        }
        // If it's a path string (from database)
        if (typeof item === "string") {
          return {
            id: item,
            url: item, // For videos, path might be full URL or path
            path: item,
            name: item.split("/").pop(),
            isExisting: true,
          }
        }
        return null
      }).filter(Boolean)
      setPreviews(initializedPreviews)
    } else {
      setPreviews([])
    }
  }, [value])

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || [])
    
    // Filter for video files only
    const videoFiles = files.filter(file => file.type.startsWith('video/'))
    
    if (videoFiles.length === 0) {
      return
    }

    if (previews.length + videoFiles.length > maxVideos) {
      alert(`Maximum ${maxVideos} videos allowed`)
      return
    }

    const newPreviews = videoFiles.map((file) => ({
      id: Date.now() + Math.random() + file.name,
      url: URL.createObjectURL(file),
      file: file,
      name: file.name,
      isNew: true,
    }))

    const updatedPreviews = [...previews, ...newPreviews]
    setPreviews(updatedPreviews)
    
    // Call onChange with files/paths
    const updatedValue = updatedPreviews.map((preview) => {
      if (preview.isNew && preview.file) {
        return preview.file
      }
      return preview.path || preview.url
    })
    onChange(updatedValue)

    // Reset input
    e.target.value = ""
  }

  const handleRemove = (id) => {
    const previewToRemove = previews.find((p) => p.id === id)
    
    // Revoke object URL if it's a new file
    if (previewToRemove?.isNew && previewToRemove?.url) {
      URL.revokeObjectURL(previewToRemove.url)
    }

    const updatedPreviews = previews.filter((p) => p.id !== id)
    setPreviews(updatedPreviews)
    
    // Call onChange with updated files/paths
    const updatedValue = updatedPreviews.map((preview) => {
      if (preview.isNew && preview.file) {
        return preview.file
      }
      return preview.path || preview.url
    })
    onChange(updatedValue)
  }

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      previews.forEach((preview) => {
        if (preview.isNew && preview.url) {
          URL.revokeObjectURL(preview.url)
        }
      })
    }
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Videos</p>
          <p className="text-xs text-muted-foreground">
            {previews.length} / {maxVideos} videos
          </p>
        </div>
        {previews.length < maxVideos && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mr-2 h-4 w-4" />
              Add Videos
            </Button>
          </>
        )}
      </div>

      {previews.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {previews.map((preview) => (
            <motion.div
              key={preview.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative group rounded-lg border overflow-hidden bg-card"
            >
              <div className="aspect-video bg-muted flex items-center justify-center">
                {preview.isNew || preview.url ? (
                  <video
                    src={preview.url}
                    className="w-full h-full object-cover"
                    controls
                  />
                ) : (
                  <Video className="h-12 w-12 text-muted-foreground" />
                )}
              </div>
              <div className="p-2">
                <p className="text-xs font-medium truncate" title={preview.name}>
                  {preview.name}
                </p>
              </div>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleRemove(preview.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </motion.div>
          ))}
        </div>
      )}

      {previews.length === 0 && (
        <div className="border-2 border-dashed rounded-lg p-8 text-center">
          <Video className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground mb-2">No videos uploaded</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload Videos
          </Button>
        </div>
      )}
    </div>
  )
}

