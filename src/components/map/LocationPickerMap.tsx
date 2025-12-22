import { useEffect, useMemo, useState, useCallback } from "react";
import { GoogleMap, Marker } from "@react-google-maps/api";

type LocationPickerMapProps = {
  isLoaded: boolean;
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number, address?: string) => void;
};

const containerStyle = {
  width: "100%",
  height: "280px",
};

const defaultCenter = { lat: 10.762622, lng: 106.660172 }; // HCM fallback

const LocationPickerMap = ({ isLoaded, lat, lng, onChange }: LocationPickerMapProps) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const center = useMemo(
    () => (lat != null && lng != null ? { lat, lng } : defaultCenter),
    [lat, lng]
  );

  // Pan map mỗi khi lat/lng đổi (do click map hoặc do search address)
  useEffect(() => {
    if (!map) return;
    if (lat == null || lng == null) return;

    map.panTo({ lat, lng });
    // map.setZoom(15); // nếu bạn muốn luôn zoom về 15 khi đổi vị trí
  }, [map, lat, lng]);

  // Reverse geocode helper
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    try {
      const geocoder = new google.maps.Geocoder();
      const res = await geocoder.geocode({ location: { lat, lng } });
      return res.results?.[0]?.formatted_address;
    } catch (e) {
      console.error("Reverse geocode failed", e);
      return undefined;
    }
  }, []);

  // Khi vừa mở lên: nếu chưa có lat/lng thì lấy vị trí hiện tại
  useEffect(() => {
    if (!isLoaded) return;
    if (lat != null && lng != null) return; // đã có rồi thì thôi
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const newLat = pos.coords.latitude;
        const newLng = pos.coords.longitude;

        const address = await reverseGeocode(newLat, newLng);
        onChange(newLat, newLng, address);
      },
      (err) => {
        console.warn("Geolocation denied/failed:", err);
        // fallback: giữ defaultCenter, không làm gì thêm
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded]);

  const handleClick = async (e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;

    const newLat = e.latLng.lat();
    const newLng = e.latLng.lng();
    const address = await reverseGeocode(newLat, newLng);

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
      onLoad={(m) => setMap(m)}
      onUnmount={() => setMap(null)}
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
