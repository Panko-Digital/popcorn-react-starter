/**
 * CollectionMap
 *
 * Renders a Google Map with markers for records that contain geopoint fields.
 * Uses @vis.gl/react-google-maps for a lightweight, modern React wrapper.
 *
 * Requires VITE_GOOGLE_MAPS_API_KEY to be set in your .env file.
 *
 * @example
 * ```tsx
 * <CollectionMap
 *   records={records}
 *   geopointField="location"
 *   titleField="name"
 * />
 * ```
 */

import { useMemo, useState, useCallback } from "react";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  useMap,
} from "@vis.gl/react-google-maps";
import { MapPin } from "lucide-react";

const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

interface GeoPoint {
  lat: number;
  lng: number;
}

interface CollectionMapProps {
  /** Records containing geopoint data */
  records: Record<string, any>[];
  /** The field ID that contains the geopoint { lat, lng } */
  geopointField: string;
  /** Optional field ID to use as marker label */
  titleField?: string;
  /** Optional field ID for additional info shown in the popup */
  descriptionField?: string;
  /** Map height */
  height?: string;
  className?: string;
}

export function CollectionMap({
  records,
  geopointField,
  titleField,
  descriptionField,
  height = "400px",
  className = "",
}: CollectionMapProps) {
  // Extract records with valid geopoints
  const markers = useMemo(() => {
    return records
      .map((record, index) => {
        const geo = record[geopointField];
        if (!geo) return null;

        let lat: number | null = null;
        let lng: number | null = null;

        // Handle different geopoint formats
        if (
          typeof geo === "object" &&
          geo.lat !== undefined &&
          geo.lng !== undefined
        ) {
          lat = Number(geo.lat);
          lng = Number(geo.lng);
        } else if (typeof geo === "string") {
          // Try "lat,lng" format
          const parts = geo.split(",").map((s: string) => parseFloat(s.trim()));
          if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            lat = parts[0];
            lng = parts[1];
          }
        }

        if (lat === null || lng === null || isNaN(lat) || isNaN(lng))
          return null;

        return {
          id: record.id || `marker-${index}`,
          position: { lat, lng } as GeoPoint,
          title: titleField
            ? String(record[titleField] || "")
            : `Location ${index + 1}`,
          description: descriptionField
            ? String(record[descriptionField] || "")
            : undefined,
        };
      })
      .filter(Boolean) as Array<{
      id: string;
      position: GeoPoint;
      title: string;
      description?: string;
    }>;
  }, [records, geopointField, titleField, descriptionField]);

  // Calculate map center from markers
  const center = useMemo(() => {
    if (markers.length === 0) return { lat: -33.8688, lng: 151.2093 }; // Default: Sydney
    const avgLat =
      markers.reduce((sum, m) => sum + m.position.lat, 0) / markers.length;
    const avgLng =
      markers.reduce((sum, m) => sum + m.position.lng, 0) / markers.length;
    return { lat: avgLat, lng: avgLng };
  }, [markers]);

  if (!MAPS_API_KEY) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 rounded-lg border border-gray-200 ${className}`}
        style={{ height }}
      >
        <div className="text-center text-gray-500 px-4">
          <MapPin className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm font-medium">Map requires configuration</p>
          <p className="text-xs mt-1">
            Set{" "}
            <code className="bg-gray-200 px-1 rounded">
              VITE_GOOGLE_MAPS_API_KEY
            </code>{" "}
            in your .env file
          </p>
        </div>
      </div>
    );
  }

  if (markers.length === 0) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 rounded-lg border border-gray-200 ${className}`}
        style={{ height }}
      >
        <p className="text-sm text-gray-500">No locations to display on map.</p>
      </div>
    );
  }

  return (
    <div
      className={`rounded-lg overflow-hidden border border-gray-200 ${className}`}
      style={{ height }}
    >
      <APIProvider apiKey={MAPS_API_KEY}>
        <Map
          defaultCenter={center}
          defaultZoom={markers.length === 1 ? 14 : 10}
          gestureHandling="cooperative"
          mapId="enhanced-collection-map"
          className="w-full h-full"
        >
          <MapMarkers markers={markers} />
        </Map>
      </APIProvider>
    </div>
  );
}

// ─── Map Markers with Info Windows ────────────────────────────────────────────

function MapMarkers({
  markers,
}: {
  markers: Array<{
    id: string;
    position: GeoPoint;
    title: string;
    description?: string;
  }>;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const map = useMap();

  const handleMarkerClick = useCallback(
    (marker: (typeof markers)[0]) => {
      setSelectedId(marker.id);
      map?.panTo(marker.position);
    },
    [map],
  );

  const selectedMarker = markers.find((m) => m.id === selectedId);

  return (
    <>
      {markers.map((marker) => (
        <AdvancedMarker
          key={marker.id}
          position={marker.position}
          title={marker.title}
          onClick={() => handleMarkerClick(marker)}
        />
      ))}

      {selectedMarker && (
        <InfoWindow
          position={selectedMarker.position}
          onCloseClick={() => setSelectedId(null)}
        >
          <div className="p-1 max-w-[200px]">
            <h4 className="font-semibold text-sm text-gray-900">
              {selectedMarker.title}
            </h4>
            {selectedMarker.description && (
              <p className="text-xs text-gray-600 mt-1">
                {selectedMarker.description}
              </p>
            )}
          </div>
        </InfoWindow>
      )}
    </>
  );
}
