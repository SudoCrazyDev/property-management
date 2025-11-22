import { useState, useEffect } from "react"
import { X, Upload, Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { motion } from "motion/react"
import { getImageUrl } from "@/lib/file-upload"

export function ImageGallery({ value = [], onChange, maxImages = 10 }) {
  // value can be array of:
  // - File objects with preview URLs (for new uploads)
  // - Path strings (for existing images from database)
  const [previews, setPreviews] = useState([])

  // Initialize previews from value prop
  useEffect(() => {
    if (value && value.length > 0) {
      const initializedPreviews = value.map((item) => {
        // If it's already a preview object (has id, url, file)
        if (item.id && item.url) {
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
        // If it's a path string (from database)
        if (typeof item === "string") {
          return {
            id: item,
            url: getImageUrl(item),
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
    const files = Array.from(e.target.files)
    const remainingSlots = maxImages - previews.length
    
    if (files.length > remainingSlots) {
      alert(`You can only upload ${remainingSlots} more image(s)`)
      return
    }

    const newFiles = files.slice(0, remainingSlots)
    
    newFiles.forEach((file) => {
      if (!file.type.startsWith("image/")) {
        alert(`${file.name} is not an image file`)
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        const newPreview = {
          id: Date.now() + Math.random(),
          url: reader.result,
          file: file,
          name: file.name,
          isNew: true,
        }
        const updatedPreviews = [...previews, newPreview]
        setPreviews(updatedPreviews)
        // Return both file objects and existing paths
        const returnValue = updatedPreviews.map((preview) => {
          if (preview.file) {
            return preview // Return preview object with file for new uploads
          }
          return preview.path || preview.id // Return path for existing images
        })
        onChange(returnValue)
      }
      reader.readAsDataURL(file)
    })

    // Reset input
    e.target.value = ""
  }

  const handleRemove = (id) => {
    const updatedPreviews = previews.filter((preview) => preview.id !== id)
    setPreviews(updatedPreviews)
    // Return both file objects (for new uploads) and paths (for existing images)
    const returnValue = updatedPreviews.map((preview) => {
      if (preview.file) {
        return preview // Return file object for new uploads
      }
      return preview.path || preview.id // Return path for existing images
    })
    onChange(returnValue)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    const files = Array.from(e.dataTransfer.files)
    const remainingSlots = maxImages - previews.length
    
    if (files.length > remainingSlots) {
      alert(`You can only upload ${remainingSlots} more image(s)`)
      return
    }

    const imageFiles = files.filter(file => file.type.startsWith("image/"))
    const newFiles = imageFiles.slice(0, remainingSlots)
    
    newFiles.forEach((file) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const newPreview = {
          id: Date.now() + Math.random(),
          url: reader.result,
          file: file,
          name: file.name,
          isNew: true,
        }
        const updatedPreviews = [...previews, newPreview]
        setPreviews(updatedPreviews)
        // Return both file objects and existing paths
        const returnValue = updatedPreviews.map((preview) => {
          if (preview.file) {
            return preview // Return preview object with file for new uploads
          }
          return preview.path || preview.id // Return path for existing images
        })
        onChange(returnValue)
      }
      reader.readAsDataURL(file)
    })
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-6 transition-colors",
          previews.length < maxImages
            ? "border-primary/50 hover:border-primary cursor-pointer"
            : "border-muted cursor-not-allowed opacity-50"
        )}
      >
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          disabled={previews.length >= maxImages}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          <Upload className="h-8 w-8 text-muted-foreground" />
          <div className="text-sm">
            <span className="font-medium text-primary">Click to upload</span> or drag and drop
          </div>
          <p className="text-xs text-muted-foreground">
            PNG, JPG, GIF up to 10MB (max {maxImages} images)
          </p>
          {previews.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {previews.length} of {maxImages} images uploaded
            </p>
          )}
        </div>
      </div>

      {previews.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {previews.map((preview) => (
            <motion.div
              key={preview.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative group aspect-square rounded-lg overflow-hidden border bg-muted"
            >
              <img
                src={preview.url}
                alt={preview.name}
                className="w-full h-full object-cover"
              />
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleRemove(preview.id)}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4" />
              </motion.button>
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-2 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                {preview.name}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {previews.length === 0 && (
        <div className="flex items-center justify-center p-8 border border-dashed rounded-lg bg-muted/50">
          <div className="text-center">
            <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No images uploaded yet</p>
          </div>
        </div>
      )}
    </div>
  )
}

