import { useState, useRef, useEffect } from "react"
import { X, Upload, Camera, Image as ImageIcon, ZoomIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { motion } from "motion/react"

export function PunchlistRoomRow({ 
  row, 
  onChange, 
  onRemove, 
  isReadOnly = false,
  showProofOfCompletion = false,
  onProofOfCompletionChange 
}) {
  const [imagePreview, setImagePreview] = useState(row.image || null)
  const [proofPreview, setProofPreview] = useState(row.proofOfCompletion || null)
  const [lightboxImage, setLightboxImage] = useState(null)
  const imageInputRef = useRef(null)
  const cameraInputRef = useRef(null)
  const proofInputRef = useRef(null)
  const proofCameraInputRef = useRef(null)

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const preview = {
          id: Date.now(),
          url: reader.result,
          file: file,
          name: file.name,
        }
        setImagePreview(preview)
        onChange({ ...row, image: preview })
      }
      reader.readAsDataURL(file)
    }
    e.target.value = ""
  }

  const handleProofSelect = (e) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const preview = {
          id: Date.now(),
          url: reader.result,
          file: file,
          name: file.name,
        }
        setProofPreview(preview)
        if (onProofOfCompletionChange) {
          onProofOfCompletionChange({ ...row, proofOfCompletion: preview })
        }
      }
      reader.readAsDataURL(file)
    }
    e.target.value = ""
  }

  const handleNoteChange = (note) => {
    onChange({ ...row, note })
  }

  const handleRemoveImage = () => {
    setImagePreview(null)
    onChange({ ...row, image: null })
  }

  const handleRemoveProof = () => {
    setProofPreview(null)
    if (onProofOfCompletionChange) {
      onProofOfCompletionChange({ ...row, proofOfCompletion: null })
    }
  }

  // Initialize previews from existing data
  useEffect(() => {
    if (row.image && typeof row.image === 'string') {
      setImagePreview({ id: row.image, url: row.image, name: row.image.split('/').pop() })
    } else if (row.image && row.image.url) {
      setImagePreview(row.image)
    } else if (!row.image) {
      setImagePreview(null)
    }
    if (row.proofOfCompletion && typeof row.proofOfCompletion === 'string') {
      setProofPreview({ id: row.proofOfCompletion, url: row.proofOfCompletion, name: row.proofOfCompletion.split('/').pop() })
    } else if (row.proofOfCompletion && row.proofOfCompletion.url) {
      setProofPreview(row.proofOfCompletion)
    } else if (!row.proofOfCompletion) {
      setProofPreview(null)
    }
  }, [row.image, row.proofOfCompletion])

  return (
    <div className="space-y-3 p-4 border rounded-lg bg-card">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Image Column */}
        <div className="md:col-span-3">
          {imagePreview ? (
            <div className="relative h-full min-h-[120px] rounded-lg overflow-hidden border bg-muted group cursor-pointer" onClick={() => setLightboxImage(imagePreview)}>
              <img
                src={imagePreview.url}
                alt={imagePreview.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              {!isReadOnly && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemoveImage()
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ) : (
            !isReadOnly && (
              <div className="h-full min-h-[120px] border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 bg-muted/50">
                <div className="flex flex-col gap-2 w-full px-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => cameraInputRef.current?.click()}
                    className="w-full"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Camera
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => imageInputRef.current?.click()}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </Button>
                </div>
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </div>
            )
          )}
        </div>

        {/* Note Column */}
        <div className={showProofOfCompletion ? "md:col-span-5" : "md:col-span-9"}>
          <Textarea
            value={row.note || ""}
            onChange={(e) => handleNoteChange(e.target.value)}
            placeholder="Enter note..."
            disabled={isReadOnly}
            className="w-full h-full min-h-[120px] resize-none"
          />
        </div>

        {/* Proof of Completion Column (only on public view) */}
        {showProofOfCompletion && (
          <div className="md:col-span-4">
            {proofPreview ? (
              <div className="relative h-full min-h-[120px] rounded-lg overflow-hidden border bg-muted group cursor-pointer" onClick={() => setLightboxImage(proofPreview)}>
                <img
                  src={proofPreview.url}
                  alt={proofPreview.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemoveProof()
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="h-full min-h-[120px] border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 bg-muted/50">
                <div className="flex flex-col gap-2 w-full px-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => proofCameraInputRef.current?.click()}
                    className="w-full"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Take Photo
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => proofInputRef.current?.click()}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </Button>
                </div>
                <input
                  ref={proofCameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleProofSelect}
                  className="hidden"
                />
                <input
                  ref={proofInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleProofSelect}
                  className="hidden"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Row Button */}
      {!isReadOnly && onRemove && (
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={onRemove}
          className="w-full"
        >
          <X className="h-4 w-4 mr-2" />
          Delete Row
        </Button>
      )}

      {/* Lightbox Dialog */}
      <Dialog open={!!lightboxImage} onOpenChange={(open) => !open && setLightboxImage(null)}>
        <DialogContent className="max-w-7xl w-full p-0 bg-black/95 border-none">
          {lightboxImage && (
            <div className="relative w-full h-[90vh] flex items-center justify-center p-4">
              <img
                src={lightboxImage.url}
                alt={lightboxImage.name || 'Image'}
                className="max-w-full max-h-full object-contain"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 text-white hover:bg-white/20"
                onClick={() => setLightboxImage(null)}
              >
                <X className="h-6 w-6" />
              </Button>
              {lightboxImage.name && (
                <div className="absolute bottom-4 left-4 right-4 text-center">
                  <p className="text-white text-sm bg-black/60 px-4 py-2 rounded-md inline-block">
                    {lightboxImage.name}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

