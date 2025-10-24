import * as h3 from "h3-js";
import mapboxgl from "mapbox-gl";

export interface Player {
  color: string;
  name: string;
}

export interface TerritoryCapture {
  hex: string;
  player: string;
}

export class TerritoryGame {
  private map: mapboxgl.Map;
  private territories: Map<string, string>;
  private resolution: number;
  private players: Record<string, Player>;
  private hoveredHex: string | null = null;
  private initialized: boolean = false;

  // Add event handler references
  private clickHandler?: (e: mapboxgl.MapMouseEvent) => void;
  private mousemoveHandler?: (e: mapboxgl.MapMouseEvent) => void;
  private mouseleaveHandler?: () => void;

  constructor(map: mapboxgl.Map, resolution: number = 11) {
    this.map = map;
    this.territories = new Map();
    this.resolution = resolution;
    this.players = {
      player1: { color: "#FF6B6B", name: "Red Team" },
      player2: { color: "#4ECDC4", name: "Blue Team" },
      player3: { color: "#95E1D3", name: "Green Team" },
      neutral: { color: "#E8E8E8", name: "Neutral" },
    };

    // Wait for map to be ready before initializing
    if (this.map.isStyleLoaded()) {
      this.initializeMap();
    } else {
      this.map.once("load", () => {
        this.initializeMap();
      });
    }
  }

  initializeMap() {
    if (this.initialized) {
      console.warn("Territory game already initialized");
      return;
    }

    try {
      console.log("Initializing territory game...");

      // Generate initial grid for visible area
      const bounds = this.map.getBounds();
      if (!bounds) {
        throw new Error("Map bounds not available");
      }

      // Create a proper polygon array for H3
      const bbox = [
        [
          [bounds.getWest(), bounds.getSouth()],
          [bounds.getEast(), bounds.getSouth()],
          [bounds.getEast(), bounds.getNorth()],
          [bounds.getWest(), bounds.getNorth()],
          [bounds.getWest(), bounds.getSouth()],
        ],
      ];

      // H3 v4.x uses polygonToCells, v3.x uses polyfill
      let hexagons: string[];

      try {
        // Try H3 v4 API
        if (typeof h3.polygonToCells === "function") {
          hexagons = h3.polygonToCells(bbox, this.resolution, true);
        }
        // Fallback to H3 v3 API
        else if (typeof (h3 as any).polyfill === "function") {
          hexagons = (h3 as any).polyfill(bbox, this.resolution, true);
        } else {
          throw new Error("H3 library not properly imported");
        }
      } catch (error) {
        console.error("H3 Error:", error);
        // Fallback: generate a small grid manually
        hexagons = this.generateFallbackGrid(bounds);
      }

      console.log("Generated hexagons:", hexagons.length);

      // Initialize all as neutral
      hexagons.forEach((hex) => {
        this.territories.set(hex, "neutral");
      });

      // Check if source already exists (in case of re-initialization)
      if (this.map.getSource("territories")) {
        this.map.removeLayer("territory-hover");
        this.map.removeLayer("territory-outline");
        this.map.removeLayer("territory-fill");
        this.map.removeSource("territories");
      }

      // Add source and layers
      this.map.addSource("territories", {
        type: "geojson",
        data: this.generateGeoJSON(),
      });

      // Fill layer for territory colors
      this.map.addLayer({
        id: "territory-fill",
        type: "fill",
        source: "territories",
        paint: {
          "fill-color": ["get", "color"],
          "fill-opacity": 0.6,
        },
      });

      // Outline layer for hex borders
      this.map.addLayer({
        id: "territory-outline",
        type: "line",
        source: "territories",
        paint: {
          "line-color": "#ffffff",
          "line-width": 1,
          "line-opacity": 0.8,
        },
      });

      // Hover effect layer
      this.map.addLayer({
        id: "territory-hover",
        type: "line",
        source: "territories",
        paint: {
          "line-color": "#000000",
          "line-width": 3,
          "line-opacity": 0,
        },
      });

      this.setupInteractions();
      this.initialized = true;
      console.log("Territory game initialized successfully");
    } catch (error) {
      console.error("Error initializing territory game:", error);
      // Fallback: create a simple grid without H3
      this.createFallbackGrid();
    }
  }

  // Fallback method if H3 has issues
  generateFallbackGrid(bounds: mapboxgl.LngLatBounds): string[] {
    try {
      const center = bounds.getCenter();
      const centerHex = h3.latLngToCell(
        center.lat,
        center.lng,
        this.resolution
      );

      // Get ring of hexagons around center
      const hexagons = [centerHex];
      for (let k = 1; k <= 5; k++) {
        const ring = h3.gridDisk(centerHex, k);
        hexagons.push(...ring);
      }

      return hexagons;
    } catch (error) {
      console.error("Error generating fallback grid:", error);
      // Ultimate fallback: return empty array
      return [];
    }
  }

  createFallbackGrid() {
    console.log("Creating fallback grid without H3...");

    if (this.initialized) {
      console.warn("Territory game already initialized");
      return;
    }

    const bounds = this.map.getBounds();
    if (!bounds) {
      console.error("No map bounds available for fallback grid");
      return;
    }

    // Create a simple square grid as fallback
    const gridSize = 0.01; // degrees
    const features = [];

    for (let lng = bounds.getWest(); lng < bounds.getEast(); lng += gridSize) {
      for (
        let lat = bounds.getSouth();
        lat < bounds.getNorth();
        lat += gridSize
      ) {
        const id = `${lng.toFixed(4)}_${lat.toFixed(4)}`;
        this.territories.set(id, "neutral");

        features.push({
          type: "Feature" as const,
          id: id,
          properties: {
            h3_id: id,
            owner: "neutral",
            color: this.players.neutral.color,
            name: this.players.neutral.name,
          },
          geometry: {
            type: "Polygon" as const,
            coordinates: [
              [
                [lng, lat],
                [lng + gridSize, lat],
                [lng + gridSize, lat + gridSize],
                [lng, lat + gridSize],
                [lng, lat],
              ],
            ],
          },
        });
      }
    }

    // Check if source already exists
    if (this.map.getSource("territories")) {
      this.map.removeLayer("territory-outline");
      this.map.removeLayer("territory-fill");
      this.map.removeSource("territories");
    }

    // Add source and layers
    this.map.addSource("territories", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: features,
      },
    });

    // Add layers (same as H3 version)
    this.map.addLayer({
      id: "territory-fill",
      type: "fill",
      source: "territories",
      paint: {
        "fill-color": ["get", "color"],
        "fill-opacity": 0.6,
      },
    });

    this.map.addLayer({
      id: "territory-outline",
      type: "line",
      source: "territories",
      paint: {
        "line-color": "#ffffff",
        "line-width": 1,
        "line-opacity": 0.8,
      },
    });

    this.setupInteractions();
    this.initialized = true;
  }

  generateGeoJSON() {
    const features: any[] = [];

    this.territories.forEach((owner, hex) => {
      // H3 v4 uses cellToBoundary, v3 uses h3ToGeoBoundary
      let boundary;

      try {
        if (typeof h3.cellToBoundary === "function") {
          boundary = h3.cellToBoundary(hex, true);
        } else if (typeof (h3 as any).h3ToGeoBoundary === "function") {
          boundary = (h3 as any).h3ToGeoBoundary(hex, true);
        } else {
          console.error("No H3 boundary function available");
          return;
        }
      } catch (error) {
        console.error("Error getting hex boundary:", error);
        return;
      }

      features.push({
        type: "Feature" as const,
        id: hex,
        properties: {
          h3_id: hex,
          owner: owner,
          color: this.players[owner].color,
          name: this.players[owner].name,
        },
        geometry: {
          type: "Polygon" as const,
          coordinates: [boundary],
        },
      });
    });

    return {
      type: "FeatureCollection" as const,
      features: features,
    };
  }

  setupInteractions() {
    // Store handler references
    this.clickHandler = (
      e: mapboxgl.MapMouseEvent & {
        features?: mapboxgl.MapboxGeoJSONFeature[];
      }
    ) => {
      if (e.features && e.features.length > 0) {
        const feature = e.features[0];
        if (feature && feature.properties) {
          const hex = feature.properties.h3_id;
          this.captureTerritory(hex, "player1");
        }
      }
    };

    this.mousemoveHandler = (
      e: mapboxgl.MapMouseEvent & {
        features?: mapboxgl.MapboxGeoJSONFeature[];
      }
    ) => {
      this.map.getCanvas().style.cursor = "pointer";

      if (e.features && e.features.length > 0) {
        const feature = e.features[0];
        if (feature) {
          if (this.hoveredHex !== null) {
            this.map.setFeatureState(
              { source: "territories", id: this.hoveredHex },
              { hover: false }
            );
          }

          this.hoveredHex = feature.id as string;

          this.map.setFeatureState(
            { source: "territories", id: this.hoveredHex },
            { hover: true }
          );
        }
      }
    };

    this.mouseleaveHandler = () => {
      this.map.getCanvas().style.cursor = "";
      if (this.hoveredHex !== null) {
        this.map.setFeatureState(
          { source: "territories", id: this.hoveredHex },
          { hover: false }
        );
      }
      this.hoveredHex = null;
    };

    // Add event listeners
    this.map.on("click", "territory-fill", this.clickHandler);
    this.map.on("mousemove", "territory-fill", this.mousemoveHandler);
    this.map.on("mouseleave", "territory-fill", this.mouseleaveHandler);
  }
  // Capture a territory
  captureTerritory(hex: string, player: string) {
    this.territories.set(hex, player);
    this.updateMap();

    // Emit event for multiplayer sync (WebSocket, Firebase, etc.)
    this.onTerritoryCapture({ hex, player });
  }

  // Update multiple territories at once (for network updates)
  updateTerritories(updates: TerritoryCapture[]) {
    updates.forEach(({ hex, player }) => {
      this.territories.set(hex, player);
    });
    this.updateMap();
  }

  // Refresh the map
  updateMap() {
    const source = this.map.getSource("territories");
    if (source && source.type === "geojson") {
      (source as mapboxgl.GeoJSONSource).setData(this.generateGeoJSON());
    }
  }

  // Get territory stats
  getStats() {
    const stats: Record<string, number> = {};
    Object.keys(this.players).forEach((player) => {
      stats[player] = 0;
    });

    this.territories.forEach((owner) => {
      stats[owner]++;
    });

    return stats;
  }

  // Expand grid dynamically when map moves
  expandGrid() {
    if (!this.initialized) {
      console.warn("Cannot expand grid before initialization");
      return;
    }

    try {
      const bounds = this.map.getBounds();
      if (!bounds) {
        console.warn("Map bounds not available for grid expansion");
        return;
      }

      // Create a proper polygon array for H3
      const bbox = [
        [
          [bounds.getWest(), bounds.getSouth()],
          [bounds.getEast(), bounds.getSouth()],
          [bounds.getEast(), bounds.getNorth()],
          [bounds.getWest(), bounds.getNorth()],
          [bounds.getWest(), bounds.getSouth()],
        ],
      ];

      let hexagons: string[];

      try {
        if (typeof h3.polygonToCells === "function") {
          hexagons = h3.polygonToCells(bbox, this.resolution, true);
        } else if (typeof (h3 as any).polyfill === "function") {
          hexagons = (h3 as any).polyfill(bbox, this.resolution, true);
        } else {
          throw new Error("H3 library not properly imported");
        }
      } catch (error) {
        console.error("H3 Error in expandGrid:", error);
        hexagons = this.generateFallbackGrid(bounds);
      }

      let newHexes = false;
      hexagons.forEach((hex) => {
        if (!this.territories.has(hex)) {
          this.territories.set(hex, "neutral");
          newHexes = true;
        }
      });

      if (newHexes) {
        this.updateMap();
      }
    } catch (error) {
      console.error("Error expanding grid with H3:", error);
      this.expandFallbackGrid();
    }
  }

  expandFallbackGrid() {
    const bounds = this.map.getBounds();
    if (!bounds) {
      console.warn("No map bounds available for fallback grid expansion");
      return;
    }

    const gridSize = 0.01;
    let newHexes = false;

    // FIX: Add 'let' declaration for 'lat'
    for (let lng = bounds.getWest(); lng < bounds.getEast(); lng += gridSize) {
      for (
        let lat = bounds.getSouth(); // <-- Added 'let' here
        lat < bounds.getNorth();
        lat += gridSize
      ) {
        const id = `${lng.toFixed(4)}_${lat.toFixed(4)}`;
        if (!this.territories.has(id)) {
          this.territories.set(id, "neutral");
          newHexes = true;
        }
      }
    }

    if (newHexes) {
      this.updateMap();
    }
  }
  // Callback for multiplayer sync
  onTerritoryCapture(data: TerritoryCapture) {
    // Implement your WebSocket/Firebase logic here
    console.log("Territory captured:", data);
  }

  // Clean up event listeners
  // Clean up event listeners
  destroy() {
    if (!this.initialized) return;

    try {
      // Remove event listeners with proper handler references
      if (this.clickHandler) {
        this.map.off("click", "territory-fill", this.clickHandler);
      }
      if (this.mousemoveHandler) {
        this.map.off("mousemove", "territory-fill", this.mousemoveHandler);
      }
      if (this.mouseleaveHandler) {
        this.map.off("mouseleave", "territory-fill", this.mouseleaveHandler);
      }

      // Remove layers
      if (this.map.getLayer("territory-hover")) {
        this.map.removeLayer("territory-hover");
      }
      if (this.map.getLayer("territory-outline")) {
        this.map.removeLayer("territory-outline");
      }
      if (this.map.getLayer("territory-fill")) {
        this.map.removeLayer("territory-fill");
      }

      // Remove source
      if (this.map.getSource("territories")) {
        this.map.removeSource("territories");
      }

      this.initialized = false;
    } catch (error) {
      console.error("Error during cleanup:", error);
    }
  }
}
