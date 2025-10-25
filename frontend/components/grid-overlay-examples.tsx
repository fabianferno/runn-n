// Examples of MapComponent with grid overlay configurations

import { MapComponent } from "./map-component";

// Example 1: Basic 20x20m grid with random colors
export function BasicGridExample() {
  return (
    <MapComponent
      showGridOverlay={true}
      gridSize={20} // 20 meters
      mapStyle="mapbox://styles/mapbox/outdoors-v12"
      showCoordinates={true}
    />
  );
}

// Example 2: Larger grid cells (50x50m)
export function LargeGridExample() {
  return (
    <MapComponent
      showGridOverlay={true}
      gridSize={50} // 50 meters
      mapStyle="mapbox://styles/mapbox/satellite-v9"
      showCoordinates={true}
    />
  );
}

// Example 3: Small grid cells (10x10m) for detailed territory tracking
export function DetailedGridExample() {
  return (
    <MapComponent
      showGridOverlay={true}
      gridSize={10} // 10 meters
      mapStyle="mapbox://styles/mapbox/streets-v12"
      useCurrentLocation={true}
      showCoordinates={true}
    />
  );
}

// Example 4: Grid overlay with all features
export function FullFeaturedGridExample() {
  return (
    <MapComponent
      showGridOverlay={true}
      gridSize={20}
      mapStyle="mapbox://styles/mapbox/outdoors-v12"
      useCurrentLocation={true}
      hideBuildingLabels={true}
      hidePoiLabels={true}
      showCoordinates={true}
      onMapLoad={() => {
        console.log("Map with grid overlay loaded");
      }}
      onLocationFound={(lng, lat) => {
        console.log("User location for grid tracking:", { lng, lat });
      }}
    />
  );
}

// Example 5: No grid overlay (default)
export function NoGridExample() {
  return (
    <MapComponent
      showGridOverlay={false} // or omit this prop
      mapStyle="mapbox://styles/mapbox/streets-v12"
      showCoordinates={true}
    />
  );
}



