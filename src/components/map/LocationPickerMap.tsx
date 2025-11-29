import { useMemo } from "react";
import {
  GoogleMap,
  Marker,
  useJsApiLoader,
} from "@react-google-maps/api";

type LocationPickerMapProps = {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number, address?: string) => void;
};

const containerStyle: google.maps.MapOptions["mapContainer"] & {
  width: string;
  height: string;
} = {
  width: "100%",
  height: "280px",
};

const defaultCenter = { lat: 10.762622, lng: 106.660172 }; // VD: HCM

const LocationPickerMap = ({ lat, lng, onChange }: LocationPickerMapProps) => {
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string,
    libraries: ["places"],
  });

  const center = useMemo(
    () => (lat != null && lng != null ? { lat, lng } : defaultCenter),
    [lat, lng]
  );

  const handleClick = async (e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;

    const newLat = e.latLng.lat();
    const newLng = e.latLng.lng();

    let address: string | undefined;

    // Reverse geocode để lấy địa chỉ (optional)
    try {
      const geocoder = new google.maps.Geocoder();
      const result = await geocoder.geocode({
        location: { lat: newLat, lng: newLng },
      });
      if (result.results && result.results[0]) {
        address = result.results[0].formatted_address;
      }
    } catch (err) {
      console.error("Geocoding failed", err);
    }

    onChange(newLat, newLng, address);
  };

  if (!isLoaded) {
    return (
      <div className="flex h-[280px] items-center justify-center text-sm text-gray-500">
        Loading map...
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={15}
      onClick={handleClick}
      options={{
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
      }}
    >
      {lat != null && lng != null && <Marker position={{ lat, lng }} />}
    </GoogleMap>
  );
};

export default LocationPickerMap;
