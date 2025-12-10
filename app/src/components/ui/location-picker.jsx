import { useEffect, useState, useRef } from "react"
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, MapPin, Search } from "lucide-react"
import "leaflet/dist/leaflet.css"
import L from "leaflet"

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
})

// Custom marker icon - using standard Leaflet marker style
const createCustomIcon = (isDraggable = true) => {
  return L.icon({
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41]
  })
}

// Component to handle map clicks and marker
function MapClickHandler({ onLocationSelect, initialPosition }) {
  const [position, setPosition] = useState(initialPosition || null)
  const [isDragging, setIsDragging] = useState(false)
  const map = useMapEvents({
    click(e) {
      if (!isDragging) {
        const newPosition = [e.latlng.lat, e.latlng.lng]
        setPosition(newPosition)
        onLocationSelect(newPosition)
        map.setView(newPosition, map.getZoom())
      }
    },
  })

  useEffect(() => {
    if (initialPosition && initialPosition[0] && initialPosition[1]) {
      setPosition(initialPosition)
      map.setView(initialPosition, 15)
    }
  }, [initialPosition, map])

  if (!position) return null

  return (
    <Marker
      position={position}
      draggable={true}
      icon={createCustomIcon(true)}
      eventHandlers={{
        dragstart: () => setIsDragging(true),
        dragend: (e) => {
          setIsDragging(false)
          const newPosition = [e.target.getLatLng().lat, e.target.getLatLng().lng]
          setPosition(newPosition)
          onLocationSelect(newPosition)
        },
      }}
    />
  )
}

export function LocationPicker({ 
  value, 
  onChange, 
  onAddressChange,
  height = "400px" 
}) {
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false)
  const [mapCenter, setMapCenter] = useState([40.7128, -74.0060]) // Default to NYC
  const [mapZoom, setMapZoom] = useState(10)
  
  // Calculate 120% height for the map container
  const mapHeight = typeof height === "string" && height.includes("px")
    ? `${parseInt(height) * 1.2}px`
    : height

  // Initialize map center from value if provided
  useEffect(() => {
    if (value && value.latitude && value.longitude) {
      setMapCenter([value.latitude, value.longitude])
      setMapZoom(15)
    }
  }, [])

  // Reverse geocode coordinates to get address
  const reverseGeocode = async (lat, lng) => {
    setIsReverseGeocoding(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        {
          headers: {
            "User-Agent": "Property Management App"
          }
        }
      )

      if (!response.ok) {
        throw new Error("Reverse geocoding failed")
      }

      const data = await response.json()
      
      if (data && data.address) {
        const address = data.address
        const addressData = {
          streetAddress: address.road || address.house_number 
            ? `${address.house_number || ""} ${address.road || ""}`.trim()
            : address.house 
            ? address.house 
            : "",
          city: address.city || address.town || address.village || address.municipality || "",
          state: address.state_code || address.state || "",
          zipCode: address.postcode || "",
          county: address.county || address.state_district || "",
        }
        
        if (onAddressChange) {
          onAddressChange(addressData)
        }
      }
    } catch (error) {
      console.error("Error reverse geocoding:", error)
    } finally {
      setIsReverseGeocoding(false)
    }
  }

  // Geocode search query
  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`,
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
        const lat = parseFloat(data[0].lat)
        const lng = parseFloat(data[0].lon)
        const position = [lat, lng]
        
        setMapCenter(position)
        setMapZoom(15)
        
        if (onChange) {
          onChange({ latitude: lat, longitude: lng })
        }
        
        // Reverse geocode to get address
        await reverseGeocode(lat, lng)
      }
    } catch (error) {
      console.error("Error geocoding:", error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleLocationSelect = async (position) => {
    const [lat, lng] = position
    
    if (onChange) {
      onChange({ latitude: lat, longitude: lng })
    }
    
    // Reverse geocode to get address
    await reverseGeocode(lat, lng)
  }

  const currentPosition = value && value.latitude && value.longitude
    ? [value.latitude, value.longitude]
    : null

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search for an address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                handleSearch()
              }
            }}
            className="pl-10"
          />
        </div>
        <Button
          type="button"
          onClick={handleSearch}
          disabled={isSearching || !searchQuery.trim()}
        >
          {isSearching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Search"
          )}
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div style={{ height: mapHeight, position: "relative" }} className="rounded-lg overflow-hidden border">
            {isReverseGeocoding && (
              <div className="absolute top-2 left-2 z-[1000] bg-background/90 px-3 py-1.5 rounded-md text-sm flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Getting address...</span>
              </div>
            )}
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
              <MapClickHandler
                onLocationSelect={handleLocationSelect}
                initialPosition={currentPosition}
              />
            </MapContainer>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground flex items-center gap-1">
        <MapPin className="h-3 w-3" />
        Click on the map or search for an address to set the property location
      </p>
    </div>
  )
}

