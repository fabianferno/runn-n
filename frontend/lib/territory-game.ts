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

export interface GridClickData {
  id: string;
  owner: string;
  ownerName: string;
  color: string;
  coordinates: { lng: number; lat: number };
}

export class TerritoryGame {
  private map: mapboxgl.Map;
  private territories: Map<string, string>;
  private resolution: number;
  private players: Record<string, Player>;
  private hoveredHex: string | null = null;
  private initialized: boolean = false;
  private minZoomLevel: number = 12;
  private isGridVisible: boolean = false;
  private onGridClickCallback?: (data: GridClickData) => void;
  private currentPopup: mapboxgl.Popup | null = null; // Track current popup

  // Drawing state
  private drawingPath: string[] = []; // Store hex IDs in drawing order
  private isDrawingMode: boolean = false;
  private drawingSourceId: string = "drawing-path";
  private drawingLayerId: string = "drawing-path-layer";

  // Event handler references
  private clickHandler?: (e: mapboxgl.MapMouseEvent) => void;
  private mousemoveHandler?: (e: mapboxgl.MapMouseEvent) => void;
  private mouseleaveHandler?: () => void;
  private zoomEndHandler?: () => void;
  private moveEndHandler?: () => void;

  constructor(
    map: mapboxgl.Map,
    resolution: number = 11,
    minZoomLevel: number = 12,
    onGridClick?: (data: GridClickData) => void
  ) {
    this.map = map;
    this.territories = new Map();
    this.resolution = resolution;
    this.minZoomLevel = minZoomLevel;
    this.onGridClickCallback = onGridClick;
    this.players = {
      player1: { color: "#FF6B6B", name: "Red Team" },
      player2: { color: "#4ECDC4", name: "Blue Team" },
      player3: { color: "#95E1D3", name: "Green Team" },
      neutral: { color: "#E8E8E8", name: "Neutral" },
    };

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

    this.zoomEndHandler = () => {
      const currentZoom = this.map.getZoom();

      if (currentZoom >= this.minZoomLevel && !this.isGridVisible) {
        this.showGrid();
      } else if (currentZoom < this.minZoomLevel && this.isGridVisible) {
        this.hideGrid();
      }
    };

    this.moveEndHandler = () => {
      if (this.isGridVisible) {
        this.expandGrid();
      }
    };

    this.map.on("zoomend", this.zoomEndHandler);
    this.map.on("moveend", this.moveEndHandler);

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
      if (this.clickHandler) {
        this.map.off("click", "territory-fill", this.clickHandler);
      }
      if (this.mousemoveHandler) {
        this.map.off("mousemove", "territory-fill", this.mousemoveHandler);
      }
      if (this.mouseleaveHandler) {
        this.map.off("mouseleave", "territory-fill", this.mouseleaveHandler);
      }

      if (this.map.getLayer("territory-hover")) {
        this.map.removeLayer("territory-hover");
      }
      if (this.map.getLayer("territory-outline")) {
        this.map.removeLayer("territory-outline");
      }
      if (this.map.getLayer("territory-fill")) {
        this.map.removeLayer("territory-fill");
      }
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

      const bounds = this.map.getBounds();
      if (!bounds) {
        throw new Error("Map bounds not available");
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
          hexagons = h3.polygonToCells(bbox, 11, true);
        } else if (typeof (h3 as any).polyfill === "function") {
          hexagons = (h3 as any).polyfill(bbox, 11, true);
        } else {
          throw new Error("H3 library not properly imported");
        }
      } catch (error) {
        console.error("H3 Error:", error);
        hexagons = this.generateFallbackGrid(bounds);
      }

      console.log(`Generated ${hexagons.length} hexagons for viewport`);

      hexagons.forEach((hex) => {
        this.territories.set(hex, "neutral");
      });

      if (this.map.getSource("territories")) {
        this.map.removeLayer("territory-hover");
        this.map.removeLayer("territory-outline");
        this.map.removeLayer("territory-fill");
        this.map.removeSource("territories");
      }

      this.map.addSource("territories", {
        type: "geojson",
        data: this.generateGeoJSON(),
      });

      this.map.addLayer({
        id: "territory-fill",
        type: "fill",
        source: "territories",
        paint: {
          "fill-color": ["get", "color"],
          "fill-opacity": 0.3,
        },
      });

      this.map.addLayer({
        id: "territory-outline",
        type: "line",
        source: "territories",
        paint: {
          "line-color": "#ffffff",
          "line-width": 1,
          "line-opacity": 0.3,
        },
      });

      this.map.addLayer({
        id: "territory-hover",
        type: "line",
        source: "territories",
        paint: {
          "line-color": "#000000",
          "line-width": 1,
          "line-opacity": 0.3,
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
        "fill-opacity": 0.3,
      },
    });

    this.map.addLayer({
      id: "territory-outline",
      type: "line",
      source: "territories",
      paint: {
        "line-color": "#ffffff",
        "line-width": 1,
        "line-opacity": 0.3,
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
          const owner = feature.properties.owner;
          const ownerName = feature.properties.name;
          const color = feature.properties.color;

          // Add to drawing path
          if (!this.drawingPath.includes(hex)) {
            this.drawingPath.push(hex);
            console.log(`Drawing path: ${this.drawingPath.length} hexes`);

            // Update visual feedback for drawing path
            this.updateDrawingPath();

            // Check if loop is formed
            const loopDetected = this.detectLoop();
            if (loopDetected) {
              console.log("Loop detected! Filling polygon...");
              this.fillLoop("player1");
              this.clearDrawingPath();
            }
          }

          const gridData: GridClickData = {
            id: hex,
            owner: owner,
            ownerName: ownerName,
            color: color,
            coordinates: { lng: e.lngLat.lng, lat: e.lngLat.lat },
          };

          // Close any existing popup
          if (this.currentPopup) {
            this.currentPopup.remove();
          }

          // Create popup with close button
          const popup = new mapboxgl.Popup({
            closeButton: true,
            closeOnClick: true, // Changed from false to true
            maxWidth: "300px",
          })
            .setLngLat(e.lngLat)
            .setHTML(
              `
              <div style="padding: 10px; min-width: 200px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                  <h3 style="margin: 0; font-size: 16px; border-bottom: 2px solid ${color};">
                    Territory Info
                  </h3>
                </div>
                <div style="margin-bottom: 8px;">
                  <strong>ID:</strong> 
                  <code style="background: #f0f0f0; padding: 2px 6px; border-radius: 3px; font-size: 11px; display: block; margin-top: 4px; word-break: break-all;">
                    ${hex}
                  </code>
                </div>
                <div style="margin-bottom: 8px;">
                  <strong>Owner:</strong> 
                  <span style="color: ${color}; font-weight: bold;">${ownerName}</span>
                </div>
                <div style="margin-bottom: 8px;">
                  <strong>Status:</strong> ${
                    owner === "neutral" ? "🔓 Unclaimed" : "🔒 Claimed"
                  }
                </div>
                <div style="margin-bottom: 8px;">
                  <strong>Drawing:</strong> ${
                    this.drawingPath.length
                  } hexes selected
                </div>
                <div style="margin-bottom: 8px;">
                  <strong>Coordinates:</strong><br/>
                  <small>Lng: ${e.lngLat.lng.toFixed(6)}<br/>
                  Lat: ${e.lngLat.lat.toFixed(6)}</small>
                </div>
                <div style="display: flex; gap: 5px; margin-top: 10px;">
                  <button 
                    onclick="navigator.clipboard.writeText('${hex}'); this.textContent = 'Copied!'; setTimeout(() => this.textContent = 'Copy ID', 2000);" 
                    style="
                      flex: 1;
                      padding: 5px 10px;
                      background: ${color};
                      color: white;
                      border: none;
                      border-radius: 4px;
                      cursor: pointer;
                      font-size: 12px;
                    "
                  >
                    Copy ID
                  </button>
                  <button 
                    id="clear-path-btn-${hex}"
                    style="
                      flex: 1;
                      padding: 5px 10px;
                      background: #666;
                      color: white;
                      border: none;
                      border-radius: 4px;
                      cursor: pointer;
                      font-size: 12px;
                    "
                  >
                    Clear Path
                  </button>
                </div>
              </div>
            `
            )
            .addTo(this.map);

          // Store reference to current popup
          this.currentPopup = popup;

          // Add event listener for clear path button after popup is added to DOM
          setTimeout(() => {
            const clearBtn = document.getElementById(`clear-path-btn-${hex}`);
            if (clearBtn) {
              clearBtn.addEventListener("click", () => {
                this.clearDrawingPath();
                if (this.currentPopup) {
                  this.currentPopup.remove();
                }
              });
            }
          }, 0);

          // Capture the territory
          this.captureTerritory(hex, "player1");

          if (this.onGridClickCallback) {
            this.onGridClickCallback(gridData);
          }
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
        if (feature && feature.id) {
          // Check if feature has an id
          if (this.hoveredHex !== null && this.hoveredHex !== feature.id) {
            // Only update if it's a different hex
            try {
              this.map.setFeatureState(
                { source: "territories", id: this.hoveredHex },
                { hover: false }
              );
            } catch (error) {
              console.warn("Error resetting hover state:", error);
            }
          }

          this.hoveredHex = feature.id as string;

          try {
            this.map.setFeatureState(
              { source: "territories", id: this.hoveredHex },
              { hover: true }
            );
          } catch (error) {
            console.warn("Error setting hover state:", error);
          }
        }
      }
    };

    this.mouseleaveHandler = () => {
      this.map.getCanvas().style.cursor = "";
      if (this.hoveredHex !== null) {
        try {
          this.map.setFeatureState(
            { source: "territories", id: this.hoveredHex },
            { hover: false }
          );
        } catch (error) {
          console.warn("Error clearing hover state:", error);
        }
      }
      this.hoveredHex = null;
    };

    this.map.on("click", "territory-fill", this.clickHandler);
    this.map.on("mousemove", "territory-fill", this.mousemoveHandler);
    this.map.on("mouseleave", "territory-fill", this.mouseleaveHandler);
  }

  /**
   * Update visual feedback for drawing path
   */
  private updateDrawingPath() {
    if (this.drawingPath.length === 0) return;

    const coordinates = this.drawingPath.map((hex) => {
      const center = h3.cellToLatLng(hex);
      return [center[1], center[0]]; // [lng, lat]
    });

    // Add source if it doesn't exist
    if (!this.map.getSource(this.drawingSourceId)) {
      this.map.addSource(this.drawingSourceId, {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: coordinates,
          },
        },
      });

      this.map.addLayer({
        id: this.drawingLayerId,
        type: "line",
        source: this.drawingSourceId,
        paint: {
          "line-color": "#FF6B6B",
          "line-width": 4,
          "line-dasharray": [2, 2],
        },
      });
    } else {
      // Update existing source
      (
        this.map.getSource(this.drawingSourceId) as mapboxgl.GeoJSONSource
      ).setData({
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: coordinates,
        },
      });
    }
  }

  /**
   * Detect if the drawing path forms a closed loop
   */
  private detectLoop(): boolean {
    if (this.drawingPath.length < 4) return false; // Need at least 4 hexes to form a loop

    const lastHex = this.drawingPath[this.drawingPath.length - 1];
    const firstHex = this.drawingPath[0];

    // Check if last hex is adjacent to first hex
    try {
      const neighbors = h3.gridDisk(lastHex, 1);
      return neighbors.includes(firstHex);
    } catch (error) {
      console.error("Error detecting loop:", error);
      return false;
    }
  }
  /**
   * Set territory ownership (for loading from backend or immediate updates)
   */
  public setTerritory(hexId: string, userId: string, color: string): void {
    this.territories.set(hexId, userId);

    const feature = this.hexToFeature(hexId, userId, color);
    if (!feature) {
      console.warn("Could not create feature for hex:", hexId);
      return;
    }

    const source = this.map.getSource("territories") as mapboxgl.GeoJSONSource;
    if (!source) {
      console.warn("Territories source not found");
      return;
    }

    try {
      // Get existing data
      const existingData = (source as any)._data || {
        type: "FeatureCollection",
        features: [],
      };
      const features = existingData.features || [];

      // Remove existing feature with same hex ID
      const filteredFeatures = features.filter(
        (f: any) => f.properties?.hex !== hexId
      );

      // Add new feature
      filteredFeatures.push(feature);

      // Update source
      source.setData({
        type: "FeatureCollection",
        features: filteredFeatures,
      });

      console.log(`✅ Set territory ${hexId} for user ${userId}`);
    } catch (error) {
      console.error("Error setting territory:", error);
    }
  }

  /**
   * Helper method to convert hex to GeoJSON feature
   */
  private hexToFeature(hexId: string, userId: string, color: string): any {
    try {
      const boundary = h3.cellToBoundary(hexId, true);

      return {
        type: "Feature",
        properties: {
          hex: hexId,
          owner: userId,
          color: color,
        },
        geometry: {
          type: "Polygon",
          coordinates: [boundary],
        },
      };
    } catch (error) {
      console.error("Error creating feature for hex:", hexId, error);
      return null;
    }
  }
  /**
   * Fill the loop formed by drawing path
   */
  private fillLoop(player: string) {
    if (this.drawingPath.length < 3) return;

    try {
      // Get coordinates of the path
      const coordinates = this.drawingPath.map((hex) => {
        const center = h3.cellToLatLng(hex);
        return [center[1], center[0]]; // [lng, lat]
      });

      // Close the loop
      coordinates.push(coordinates[0]);

      // Create polygon
      const polygon = [coordinates];

      // Fill all hexagons within the polygon
      const filledHexes = h3.polygonToCells(polygon, this.resolution, true);

      console.log(`Filling ${filledHexes.length} hexagons in the loop`);

      // Assign all filled hexagons to the player
      filledHexes.forEach((hex) => {
        this.territories.set(hex, player);
      });

      // Update the map
      this.updateMap();
    } catch (error) {
      console.error("Error filling loop:", error);
    }
  }

  /**
   * Clear the drawing path
   */
  clearDrawingPath() {
    this.drawingPath = [];

    // Remove drawing path layer and source
    if (this.map.getLayer(this.drawingLayerId)) {
      this.map.removeLayer(this.drawingLayerId);
    }
    if (this.map.getSource(this.drawingSourceId)) {
      this.map.removeSource(this.drawingSourceId);
    }

    console.log("Drawing path cleared");
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
      // Close any open popup
      if (this.currentPopup) {
        this.currentPopup.remove();
        this.currentPopup = null;
      }

      // Clear drawing path
      this.clearDrawingPath();

      if (this.zoomEndHandler) {
        this.map.off("zoomend", this.zoomEndHandler);
      }
      if (this.moveEndHandler) {
        this.map.off("moveend", this.moveEndHandler);
      }

      if (this.isGridVisible) {
        this.hideGrid();
      }

      this.territories.clear();
    } catch (error) {
      console.error("Error during cleanup:", error);
    }
  }
}
