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
  private minZoomLevel: number = 12; // Minimum zoom level to show grid
  private isGridVisible: boolean = false;

  // Event handler references
  private clickHandler?: (e: mapboxgl.MapMouseEvent) => void;
  private mousemoveHandler?: (e: mapboxgl.MapMouseEvent) => void;
  private mouseleaveHandler?: () => void;
  private zoomEndHandler?: () => void;
  private moveEndHandler?: () => void;

  constructor(
    map: mapboxgl.Map,
    resolution: number = 11,
    minZoomLevel: number = 12
  ) {
    this.map = map;
    this.territories = new Map();
    this.resolution = resolution;
    this.minZoomLevel = minZoomLevel;
    this.players = {
      player1: { color: "#FF6B6B", name: "Red Team" },
      player2: { color: "#4ECDC4", name: "Blue Team" },
      player3: { color: "#95E1D3", name: "Green Team" },
      neutral: { color: "#E8E8E8", name: "Neutral" },
    };

    // Wait for map to be ready
    if (this.map.isStyleLoaded()) {
      this.initializeListeners();
    } else {
      this.map.once("load", () => {
        this.initializeListeners();
      });
    }
  }

  initializeListeners() {
    console.log("Setting up zoom listeners...");

    // Set up zoom listener
    this.zoomEndHandler = () => {
      const currentZoom = this.map.getZoom();
      console.log("Current zoom:", currentZoom);

      if (currentZoom >= this.minZoomLevel && !this.isGridVisible) {
        // Zoom level is sufficient, show the grid
        this.showGrid();
      } else if (currentZoom < this.minZoomLevel && this.isGridVisible) {
        // Zoom level too low, hide the grid
        this.hideGrid();
      }
    };

    // Set up move listener (only active when grid is visible)
    this.moveEndHandler = () => {
      if (this.isGridVisible) {
        this.expandGrid();
      }
    };

    this.map.on("zoomend", this.zoomEndHandler);
    this.map.on("moveend", this.moveEndHandler);

    // Check initial zoom level
    const initialZoom = this.map.getZoom();
    if (initialZoom >= this.minZoomLevel) {
      this.showGrid();
    }
  }

  showGrid() {
    if (this.isGridVisible) return;

    console.log("Showing grid...");
    this.isGridVisible = true;
    this.initializeMap();
  }

  hideGrid() {
    if (!this.isGridVisible) return;

    console.log("Hiding grid...");
    this.isGridVisible = false;

    try {
      // Remove event listeners
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
      console.error("Error hiding grid:", error);
    }
  }

  initializeMap() {
    if (this.initialized) {
      console.warn("Territory game already initialized");
      return;
    }

    try {
      console.log("Initializing territory game...");

      // Generate initial grid for visible area only
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
        hexagons = this.generateFallbackGrid(bounds);
      }

      console.log(`Generated ${hexagons.length} hexagons for viewport`);

      // Initialize all as neutral
      hexagons.forEach((hex) => {
        this.territories.set(hex, "neutral");
      });

      // Check if source already exists
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
      this.createFallbackGrid();
    }
  }

  generateFallbackGrid(bounds: mapboxgl.LngLatBounds): string[] {
    try {
      const center = bounds.getCenter();
      const centerHex = h3.latLngToCell(
        center.lat,
        center.lng,
        this.resolution
      );

      const hexagons = [centerHex];
      for (let k = 1; k <= 5; k++) {
        const ring = h3.gridDisk(centerHex, k);
        hexagons.push(...ring);
      }

      return hexagons;
    } catch (error) {
      console.error("Error generating fallback grid:", error);
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

    const gridSize = 0.01;
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

    if (this.map.getSource("territories")) {
      this.map.removeLayer("territory-outline");
      this.map.removeLayer("territory-fill");
      this.map.removeSource("territories");
    }

    this.map.addSource("territories", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: features,
      },
    });

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

    this.map.on("click", "territory-fill", this.clickHandler);
    this.map.on("mousemove", "territory-fill", this.mousemoveHandler);
    this.map.on("mouseleave", "territory-fill", this.mouseleaveHandler);
  }

  captureTerritory(hex: string, player: string) {
    this.territories.set(hex, player);
    this.updateMap();
    this.onTerritoryCapture({ hex, player });
  }

  updateTerritories(updates: TerritoryCapture[]) {
    updates.forEach(({ hex, player }) => {
      this.territories.set(hex, player);
    });
    this.updateMap();
  }

  updateMap() {
    const source = this.map.getSource("territories");
    if (source && source.type === "geojson") {
      (source as mapboxgl.GeoJSONSource).setData(this.generateGeoJSON());
    }
  }

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

  expandGrid() {
    if (!this.initialized || !this.isGridVisible) {
      return;
    }

    try {
      const bounds = this.map.getBounds();
      if (!bounds) {
        return;
      }

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
        console.log(
          `Added ${hexagons.length - this.territories.size} new hexagons`
        );
        this.updateMap();
      }
    } catch (error) {
      console.error("Error expanding grid with H3:", error);
    }
  }

  onTerritoryCapture(data: TerritoryCapture) {
    console.log("Territory captured:", data);
  }

  destroy() {
    try {
      // Remove zoom and move listeners
      if (this.zoomEndHandler) {
        this.map.off("zoomend", this.zoomEndHandler);
      }
      if (this.moveEndHandler) {
        this.map.off("moveend", this.moveEndHandler);
      }

      // Hide grid (will clean up layers and interactions)
      if (this.isGridVisible) {
        this.hideGrid();
      }

      this.territories.clear();
    } catch (error) {
      console.error("Error during cleanup:", error);
    }
  }
}
