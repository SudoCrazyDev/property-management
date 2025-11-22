import { StorageClient } from "@supabase/storage-js"

// Get Supabase URL and anon key from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file"
  )
}

// Create StorageClient instance
const storageClient = new StorageClient(`${supabaseUrl}/storage/v1`, {
  apikey: supabaseAnonKey,
  Authorization: `Bearer ${supabaseAnonKey}`,
})

/**
 * Upload files to Supabase Storage
 * Files are stored in: properties/images/{year}/{month}/{filename}
 * Returns array of paths (relative paths, not full URLs)
 */
export async function uploadPropertyImages(files) {
  if (!files || files.length === 0) return []

  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const folderPath = `properties/images/${year}/${month}`

  const uploadPromises = files.map(async (file) => {
    try {
      // Generate unique filename
      const fileExt = file.name.split(".").pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `${folderPath}/${fileName}`

      // Upload to Supabase Storage using StorageClient
      const { data, error } = await storageClient.from("app_bucket").upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      })

      if (error) throw error

      // Return relative path (not full URL)
      // Format: properties/images/2024/01/filename.jpg
      return filePath
    } catch (error) {
      console.error("Error uploading file:", error)
      throw error
    }
  })

  return Promise.all(uploadPromises)
}

/**
 * Delete files from Supabase Storage
 */
export async function deletePropertyImages(paths) {
  if (!paths || paths.length === 0) return

  try {
    const { error } = await storageClient.from("app_bucket").remove(paths)

    if (error) throw error
  } catch (error) {
    console.error("Error deleting files:", error)
    throw error
  }
}

/**
 * Upload files for inspector/technician checklists
 * Files are stored in: inspector-checklists/{year}/{month}/{filename}
 * Returns array of paths (relative paths, not full URLs)
 */
export async function uploadFiles(files, folderPrefix = "") {
  if (!files || files.length === 0) return []

  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const folderPath = folderPrefix ? `${folderPrefix}/${year}/${month}` : `${year}/${month}`

  const uploadPromises = files.map(async (file) => {
    try {
      // Generate unique filename
      const fileExt = file.name.split(".").pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `${folderPath}/${fileName}`

      // Upload to Supabase Storage using StorageClient
      const { data, error } = await storageClient.from("app_bucket").upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      })

      if (error) throw error

      // Return relative path (not full URL)
      return filePath
    } catch (error) {
      console.error("Error uploading file:", error)
      throw error
    }
  })

  return Promise.all(uploadPromises)
}

/**
 * Get public URL for an image path
 * Uses environment variable for base URL
 */
export function getImageUrl(path) {
  if (!path) return null
  
  // If path already contains http/https, return as is
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path
  }

  // Get base URL from environment variable
  const baseUrl = import.meta.env.VITE_SUPABASE_URL || ""
  const storagePath = `${baseUrl}/storage/v1/object/public/app_bucket/${path}`
  
  return storagePath
}

