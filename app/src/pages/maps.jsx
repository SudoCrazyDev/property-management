import { useEffect, useState, useMemo } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Search, MapPin, Briefcase, Building2 } from "lucide-react"
import { useProperties } from "@/hooks/use-properties"
import { useJobs } from "@/hooks/use-jobs"
import { useToast } from "@/hooks/use-toast"
import "leaflet/dist/leaflet.css"
import L from "leaflet"

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
})

// Component to handle map bounds updates
function MapBoundsUpdater({ bounds, skip }) {
  const map = useMap()
  
  useEffect(() => {
    if (!skip && bounds && bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [bounds, map, skip])
  
  return null
}

// Component to handle map center and zoom updates
function MapViewUpdater({ center, zoom }) {
  const map = useMap()
  
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, zoom || 15, {
        animate: true,
        duration: 0.5
      })
    }
  }, [center, zoom, map])
  
  return null
}

// Property Mapping Component
function PropertyMapping() {
  const { properties, loading: propertiesLoading } = useProperties()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [propertyCoordinates, setPropertyCoordinates] = useState(new Map())
  const [geocodingLoading, setGeocodingLoading] = useState(false)
  const [mapCenter, setMapCenter] = useState([40.7128, -74.0060])
  const [mapZoom, setMapZoom] = useState(10)
  const [selectedPropertyId, setSelectedPropertyId] = useState(null)

  // Filter properties
  const filteredProperties = useMemo(() => {
    return properties.filter((property) => {
      const matchesSearch =
        searchQuery === "" ||
        property.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.streetAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.zipCode.includes(searchQuery)
      const matchesStatus = statusFilter === "all" || property.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [properties, searchQuery, statusFilter])

  // Reset selected property when filters change
  useEffect(() => {
    setSelectedPropertyId(null)
  }, [searchQuery, statusFilter])

  // Geocode addresses using Nominatim
  const geocodeAddress = async (property) => {
    // Use stored coordinates if available
    if (property.latitude && property.longitude) {
      return [property.latitude, property.longitude]
    }
    
    const address = `${property.streetAddress}, ${property.city}, ${property.state} ${property.zipCode}`
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
        {
          headers: {
            "User-Agent": "Property Management App"
          }
        }
      )
      
      if (!response.ok) {
        throw new Error("Geocoding failed")
      }
      
      const data = await response.json()
      
      if (data && data.length > 0) {
        return [parseFloat(data[0].lat), parseFloat(data[0].lon)]
      }
      
      return null
    } catch (error) {
      console.error(`Error geocoding ${address}:`, error)
      return null
    }
  }

  // Geocode all filtered properties
  useEffect(() => {
    const geocodeProperties = async () => {
      if (filteredProperties.length === 0) return
      
      const propertiesToGeocode = filteredProperties.filter(
        (property) => !propertyCoordinates.has(property.id)
      )
      
      if (propertiesToGeocode.length === 0) {
        const coords = Array.from(propertyCoordinates.values())
        if (coords.length > 0) {
          const avgLat = coords.reduce((sum, [lat]) => sum + lat, 0) / coords.length
          const avgLon = coords.reduce((sum, [, lon]) => sum + lon, 0) / coords.length
          setMapCenter([avgLat, avgLon])
          setMapZoom(coords.length === 1 ? 15 : 12)
        }
        return
      }
      
      setGeocodingLoading(true)
      const coordinates = new Map(propertyCoordinates)
      
      for (const property of propertiesToGeocode) {
        const coords = await geocodeAddress(property)
        if (coords) {
          coordinates.set(property.id, coords)
        }
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
      
      setPropertyCoordinates(coordinates)
      setGeocodingLoading(false)
      
      if (coordinates.size > 0) {
        const coordsArray = Array.from(coordinates.values())
        const avgLat = coordsArray.reduce((sum, [lat]) => sum + lat, 0) / coordsArray.length
        const avgLon = coordsArray.reduce((sum, [, lon]) => sum + lon, 0) / coordsArray.length
        setMapCenter([avgLat, avgLon])
        setMapZoom(coordinates.size === 1 ? 15 : 12)
      }
    }
    
    geocodeProperties()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredProperties.map(p => p.id).join(",")])

  const markerBounds = useMemo(() => {
    const coords = Array.from(propertyCoordinates.values())
    if (coords.length === 0) return null
    return coords.map(([lat, lon]) => [lat, lon])
  }, [propertyCoordinates])

  const availableStatuses = useMemo(() => {
    return Array.from(new Set(properties.map((p) => p.status))).filter(Boolean)
  }, [properties])

  return (
    <div className="flex-1 flex gap-4 min-h-0">
      <Card className="w-96 flex flex-col overflow-hidden">
        <CardContent className="flex-1 flex flex-col gap-4 p-4 min-h-0">
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search properties..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {availableStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {geocodingLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Geocoding addresses...</span>
              </div>
            )}
            {!geocodingLoading && propertyCoordinates.size > 0 && (
              <p className="text-sm text-muted-foreground">
                {propertyCoordinates.size} properties found
              </p>
            )}
          </div>

          <div className="flex-1 flex flex-col min-h-0">
            <h3 className="text-sm font-semibold mb-3">
              Properties ({filteredProperties.length})
            </h3>
            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {filteredProperties.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No properties found
                </p>
              ) : (
                filteredProperties.map((property) => {
                  const coords = propertyCoordinates.get(property.id)
                  const hasCoords = !!coords
                  return (
                    <div
                      key={property.id}
                      className={cn(
                        "p-3 border rounded-lg text-sm transition-colors",
                        hasCoords
                          ? "hover:bg-accent cursor-pointer"
                          : "opacity-60 cursor-not-allowed",
                        selectedPropertyId === property.id && "bg-primary/10 border-primary"
                      )}
                      onClick={() => {
                        if (coords) {
                          setSelectedPropertyId(property.id)
                          setMapCenter(coords)
                          setMapZoom(15)
                        }
                      }}
                    >
                      <p className="font-medium mb-1">{property.name}</p>
                      <p className="text-xs text-muted-foreground mb-1">
                        <MapPin className="inline h-3 w-3 mr-1" />
                        {property.streetAddress}
                        {property.unitNumber && `, ${property.unitNumber}`}
                      </p>
                      <p className="text-xs text-muted-foreground mb-2">
                        {property.city}, {property.state} {property.zipCode}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs">
                          <span className="font-medium">Type:</span> {property.type}
                        </span>
                        <span
                          className={cn(
                            "text-xs px-2 py-0.5 rounded",
                            property.status === "Active"
                              ? "bg-green-100 text-green-800"
                              : property.status === "Inactive"
                              ? "bg-gray-100 text-gray-800"
                              : "bg-orange-100 text-orange-800"
                          )}
                        >
                          {property.status}
                        </span>
                      </div>
                      {!coords && (
                        <p className="text-xs text-orange-500 mt-2">Geocoding...</p>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardContent className="flex-1 p-0 min-h-0">
          <div className="h-full rounded-lg overflow-hidden">
            {propertiesLoading || geocodingLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <MapContainer
                center={mapCenter}
                zoom={mapZoom}
                style={{ height: "100%", width: "100%" }}
                scrollWheelZoom={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapViewUpdater center={mapCenter} zoom={mapZoom} />
                {markerBounds && <MapBoundsUpdater bounds={markerBounds} skip={!!selectedPropertyId} />}
                
                {filteredProperties.map((property) => {
                  const coords = propertyCoordinates.get(property.id)
                  if (!coords) return null
                  
                  return (
                    <Marker key={property.id} position={coords}>
                      <Popup>
                        <div className="p-2">
                          <h3 className="font-semibold text-sm mb-1">{property.name}</h3>
                          <p className="text-xs text-muted-foreground mb-1">
                            <MapPin className="inline h-3 w-3 mr-1" />
                            {property.streetAddress}
                            {property.unitNumber && `, ${property.unitNumber}`}
                          </p>
                          <p className="text-xs text-muted-foreground mb-1">
                            {property.city}, {property.state} {property.zipCode}
                          </p>
                          <p className="text-xs">
                            <span className="font-medium">Type:</span> {property.type}
                          </p>
                          <p className="text-xs">
                            <span className="font-medium">Status:</span> {property.status}
                          </p>
                        </div>
                      </Popup>
                    </Marker>
                  )
                })}
              </MapContainer>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Job Mapping Component
function JobMapping() {
  const { jobs, loading: jobsLoading } = useJobs()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [jobCoordinates, setJobCoordinates] = useState(new Map())
  const [geocodingLoading, setGeocodingLoading] = useState(false)
  const [mapCenter, setMapCenter] = useState([40.7128, -74.0060])
  const [mapZoom, setMapZoom] = useState(10)
  const [selectedJobId, setSelectedJobId] = useState(null)

  // Filter jobs
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchesSearch =
        searchQuery === "" ||
        job.property?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.property?.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.jobType?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === "all" || job.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [jobs, searchQuery, statusFilter])

  useEffect(() => {
    setSelectedJobId(null)
  }, [searchQuery, statusFilter])

  // Geocode job addresses
  const geocodeJobAddress = async (job) => {
    // Use stored coordinates if available
    if (job.property?.latitude && job.property?.longitude) {
      return [job.property.latitude, job.property.longitude]
    }
    
    if (!job.property?.fullAddress) return null
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(job.property.fullAddress)}&limit=1`,
        {
          headers: {
            "User-Agent": "Property Management App"
          }
        }
      )
      
      if (!response.ok) {
        throw new Error("Geocoding failed")
      }
      
      const data = await response.json()
      
      if (data && data.length > 0) {
        return [parseFloat(data[0].lat), parseFloat(data[0].lon)]
      }
      
      return null
    } catch (error) {
      console.error(`Error geocoding ${job.property.fullAddress}:`, error)
      return null
    }
  }

  // Geocode all filtered jobs
  useEffect(() => {
    const geocodeJobs = async () => {
      if (filteredJobs.length === 0) return
      
      const jobsToGeocode = filteredJobs.filter(
        (job) => !jobCoordinates.has(job.id)
      )
      
      if (jobsToGeocode.length === 0) {
        const coords = Array.from(jobCoordinates.values())
        if (coords.length > 0) {
          const avgLat = coords.reduce((sum, [lat]) => sum + lat, 0) / coords.length
          const avgLon = coords.reduce((sum, [, lon]) => sum + lon, 0) / coords.length
          setMapCenter([avgLat, avgLon])
          setMapZoom(coords.length === 1 ? 15 : 12)
        }
        return
      }
      
      setGeocodingLoading(true)
      const coordinates = new Map(jobCoordinates)
      
      for (const job of jobsToGeocode) {
        const coords = await geocodeJobAddress(job)
        if (coords) {
          coordinates.set(job.id, coords)
        }
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
      
      setJobCoordinates(coordinates)
      setGeocodingLoading(false)
      
      if (coordinates.size > 0) {
        const coordsArray = Array.from(coordinates.values())
        const avgLat = coordsArray.reduce((sum, [lat]) => sum + lat, 0) / coordsArray.length
        const avgLon = coordsArray.reduce((sum, [, lon]) => sum + lon, 0) / coordsArray.length
        setMapCenter([avgLat, avgLon])
        setMapZoom(coordinates.size === 1 ? 15 : 12)
      }
    }
    
    geocodeJobs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredJobs.map(j => j.id).join(",")])

  const markerBounds = useMemo(() => {
    const coords = Array.from(jobCoordinates.values())
    if (coords.length === 0) return null
    return coords.map(([lat, lon]) => [lat, lon])
  }, [jobCoordinates])

  const availableStatuses = useMemo(() => {
    return Array.from(new Set(jobs.map((j) => j.status))).filter(Boolean)
  }, [jobs])

  return (
    <div className="flex-1 flex gap-4 min-h-0">
      <Card className="w-96 flex flex-col overflow-hidden">
        <CardContent className="flex-1 flex flex-col gap-4 p-4 min-h-0">
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search jobs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {availableStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {geocodingLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Geocoding addresses...</span>
              </div>
            )}
            {!geocodingLoading && jobCoordinates.size > 0 && (
              <p className="text-sm text-muted-foreground">
                {jobCoordinates.size} jobs found
              </p>
            )}
          </div>

          <div className="flex-1 flex flex-col min-h-0">
            <h3 className="text-sm font-semibold mb-3">
              Jobs ({filteredJobs.length})
            </h3>
            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {filteredJobs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No jobs found
                </p>
              ) : (
                filteredJobs.map((job) => {
                  const coords = jobCoordinates.get(job.id)
                  const hasCoords = !!coords
                  return (
                    <div
                      key={job.id}
                      className={cn(
                        "p-3 border rounded-lg text-sm transition-colors",
                        hasCoords
                          ? "hover:bg-accent cursor-pointer"
                          : "opacity-60 cursor-not-allowed",
                        selectedJobId === job.id && "bg-primary/10 border-primary"
                      )}
                      onClick={() => {
                        if (coords) {
                          setSelectedJobId(job.id)
                          setMapCenter(coords)
                          setMapZoom(15)
                        }
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        <p className="font-medium">{job.jobType}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">
                        <Building2 className="inline h-3 w-3 mr-1" />
                        {job.property?.name || "Unknown Property"}
                      </p>
                      <p className="text-xs text-muted-foreground mb-2">
                        <MapPin className="inline h-3 w-3 mr-1" />
                        {job.property?.address || "No address"}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs">
                          <span className="font-medium">Date:</span> {new Date(job.date).toLocaleDateString()}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                          {job.status}
                        </span>
                      </div>
                      {!coords && (
                        <p className="text-xs text-orange-500 mt-2">Geocoding...</p>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardContent className="flex-1 p-0 min-h-0">
          <div className="h-full rounded-lg overflow-hidden">
            {jobsLoading || geocodingLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <MapContainer
                center={mapCenter}
                zoom={mapZoom}
                style={{ height: "100%", width: "100%" }}
                scrollWheelZoom={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapViewUpdater center={mapCenter} zoom={mapZoom} />
                {markerBounds && <MapBoundsUpdater bounds={markerBounds} skip={!!selectedJobId} />}
                
                {filteredJobs.map((job) => {
                  const coords = jobCoordinates.get(job.id)
                  if (!coords) return null
                  
                  return (
                    <Marker key={job.id} position={coords}>
                      <Popup>
                        <div className="p-2">
                          <h3 className="font-semibold text-sm mb-1">{job.jobType}</h3>
                          <p className="text-xs text-muted-foreground mb-1">
                            <Building2 className="inline h-3 w-3 mr-1" />
                            {job.property?.name || "Unknown Property"}
                          </p>
                          <p className="text-xs text-muted-foreground mb-1">
                            <MapPin className="inline h-3 w-3 mr-1" />
                            {job.property?.fullAddress || "No address"}
                          </p>
                          <p className="text-xs mb-1">
                            <span className="font-medium">Date:</span> {new Date(job.date).toLocaleDateString()}
                          </p>
                          <p className="text-xs">
                            <span className="font-medium">Status:</span> {job.status}
                          </p>
                        </div>
                      </Popup>
                    </Marker>
                  )
                })}
              </MapContainer>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function MapsPage() {
  const [activeTab, setActiveTab] = useState("properties")

  return (
    <div className="flex h-full flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mapping</h1>
          <p className="text-muted-foreground">View properties and jobs on an interactive map</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <TabsList className="w-fit">
          <TabsTrigger value="properties">
            <Building2 className="h-4 w-4 mr-2" />
            Property Mapping
          </TabsTrigger>
          <TabsTrigger value="jobs">
            <Briefcase className="h-4 w-4 mr-2" />
            Job Mapping
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="properties" className="flex-1 flex flex-col min-h-0 mt-4">
          <PropertyMapping />
        </TabsContent>
        
        <TabsContent value="jobs" className="flex-1 flex flex-col min-h-0 mt-4">
          <JobMapping />
        </TabsContent>
      </Tabs>
    </div>
  )
}
