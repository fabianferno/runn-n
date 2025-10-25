import mongoose from "mongoose";
import { connectDatabase } from "../config/database";
import { PathService } from "../services/path.service";
import { RegionService } from "../services/region.service";
import { H3Service } from "../services/h3.service";
import { PathModel } from "../models/path.model";
import { RegionModel } from "../models/region.model";
import { User } from "../types";

// Define distinct neighborhoods/areas in Chennai for each runner - clustered closer together
const RUNNER_TERRITORIES = [
  {
    // Marina Beach area - morning beach runner
    center: { lat: 13.0499, lng: 80.2825 },
    radius: 0.008,
    preferredDirections: ['north-south', 'coastal']
  },
  {
    // Anna Nagar - residential runner
    center: { lat: 13.0850, lng: 80.2101 },
    radius: 0.007,
    preferredDirections: ['grid', 'square']
  },
  {
    // T Nagar - urban runner
    center: { lat: 13.0418, lng: 80.2341 },
    radius: 0.006,
    preferredDirections: ['east-west', 'linear']
  },
  {
    // Adyar - riverside runner
    center: { lat: 13.0067, lng: 80.2574 },
    radius: 0.007,
    preferredDirections: ['north-south', 'meandering']
  },
  {
    // Mylapore - temple area runner
    center: { lat: 13.0339, lng: 80.2619 },
    radius: 0.006,
    preferredDirections: ['circular', 'grid']
  },
  {
    // Velachery - IT corridor runner
    center: { lat: 12.9819, lng: 80.2208 },
    radius: 0.007,
    preferredDirections: ['linear', 'east-west']
  },
  {
    // Tambaram - suburban runner
    center: { lat: 12.9249, lng: 80.1275 },
    radius: 0.008,
    preferredDirections: ['grid', 'north-south']
  },
  {
    // Chromepet - railway area runner
    center: { lat: 12.9514, lng: 80.1414 },
    radius: 0.006,
    preferredDirections: ['linear', 'meandering']
  },
  {
    // Pallavaram - airport area runner
    center: { lat: 12.9675, lng: 80.1503 },
    radius: 0.007,
    preferredDirections: ['circular', 'coastal']
  },
  {
    // Guindy - park area runner
    center: { lat: 13.0067, lng: 80.2208 },
    radius: 0.005,
    preferredDirections: ['circular', 'meandering']
  },
  {
    // Saidapet - bridge area runner
    center: { lat: 13.0208, lng: 80.2208 },
    radius: 0.005,
    preferredDirections: ['linear', 'north-south']
  },
  {
    // Thiruvanmiyur - beach area runner
    center: { lat: 12.9819, lng: 80.2574 },
    radius: 0.006,
    preferredDirections: ['coastal', 'circular']
  },
  {
    // Perungudi - marshland runner
    center: { lat: 12.9675, lng: 80.2414 },
    radius: 0.006,
    preferredDirections: ['meandering', 'linear']
  },
  {
    // OMR - IT highway runner
    center: { lat: 12.9249, lng: 80.2414 },
    radius: 0.008,
    preferredDirections: ['linear', 'east-west']
  },
  {
    // ECR - coastal road runner
    center: { lat: 12.9249, lng: 80.2574 },
    radius: 0.007,
    preferredDirections: ['coastal', 'north-south']
  },
  {
    // Nungambakkam - commercial area runner
    center: { lat: 13.0622, lng: 80.2313 },
    radius: 0.006,
    preferredDirections: ['linear', 'east-west']
  },
  {
    // Choolaimedu - residential runner
    center: { lat: 13.0569, lng: 80.2425 },
    radius: 0.006,
    preferredDirections: ['grid', 'circular']
  },
  {
    // Egmore - heritage area runner
    center: { lat: 13.0843, lng: 80.2705 },
    radius: 0.005,
    preferredDirections: ['meandering', 'north-south']
  },
  {
    // Kilpauk - medical area runner
    center: { lat: 13.0814, lng: 80.2414 },
    radius: 0.006,
    preferredDirections: ['linear', 'grid']
  },
  {
    // Chetpet - lake area runner
    center: { lat: 13.0708, lng: 80.2414 },
    radius: 0.005,
    preferredDirections: ['circular', 'coastal']
  },
  {
    // Royapuram - port area runner
    center: { lat: 13.1089, lng: 80.2908 },
    radius: 0.006,
    preferredDirections: ['coastal', 'linear']
  },
  {
    // Washermanpet - market area runner
    center: { lat: 13.1089, lng: 80.2705 },
    radius: 0.005,
    preferredDirections: ['meandering', 'east-west']
  },
  {
    // Tondiarpet - industrial runner
    center: { lat: 13.1208, lng: 80.2705 },
    radius: 0.007,
    preferredDirections: ['linear', 'north-south']
  },
  {
    // Ambattur - industrial area runner
    center: { lat: 13.1089, lng: 80.1503 },
    radius: 0.007,
    preferredDirections: ['grid', 'linear']
  },
  {
    // Avadi - defense area runner
    center: { lat: 13.1208, lng: 80.1008 },
    radius: 0.008,
    preferredDirections: ['circular', 'meandering']
  },
  {
    // Thiruvallur - temple town runner (moved closer)
    center: { lat: 13.1000, lng: 80.0000 },
    radius: 0.008,
    preferredDirections: ['circular', 'grid']
  },
  {
    // Ponneri - rural runner (moved closer)
    center: { lat: 13.2000, lng: 80.1500 },
    radius: 0.009,
    preferredDirections: ['meandering', 'linear']
  },
  {
    // Gummidipoondi - industrial runner (moved closer)
    center: { lat: 13.2500, lng: 80.1000 },
    radius: 0.008,
    preferredDirections: ['linear', 'east-west']
  },
  {
    // Sriperumbudur - IT corridor runner (moved closer)
    center: { lat: 12.9800, lng: 80.0000 },
    radius: 0.008,
    preferredDirections: ['grid', 'linear']
  }
];

// 30 runners with wallet addresses as IDs only
const RUNNERS: User[] = [
  {
    _id: "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b",
    color: "#FF4444", // Bright Red
    stats: {
      totalHexes: 0,
      totalRegions: 0,
      largestCapture: 0,
      totalCaptures: 0,
      lastActive: Date.now(),
    },
    activeRegions: [],
    createdAt: Date.now(),
  },
  {
    _id: "0x2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c",
    color: "#00AA88", // Teal Green
    stats: {
      totalHexes: 0,
      totalRegions: 0,
      largestCapture: 0,
      totalCaptures: 0,
      lastActive: Date.now(),
    },
    activeRegions: [],
    createdAt: Date.now(),
  },
  {
    _id: "0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d",
    color: "#0088FF", // Bright Blue
    stats: {
      totalHexes: 0,
      totalRegions: 0,
      largestCapture: 0,
      totalCaptures: 0,
      lastActive: Date.now(),
    },
    activeRegions: [],
    createdAt: Date.now(),
  },
  {
    _id: "0x4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e",
    color: "#FF8800", // Orange
    stats: {
      totalHexes: 0,
      totalRegions: 0,
      largestCapture: 0,
      totalCaptures: 0,
      lastActive: Date.now(),
    },
    activeRegions: [],
    createdAt: Date.now(),
  },
  {
    _id: "0x5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f",
    color: "#AA44AA", // Purple
    stats: {
      totalHexes: 0,
      totalRegions: 0,
      largestCapture: 0,
      totalCaptures: 0,
      lastActive: Date.now(),
    },
    activeRegions: [],
    createdAt: Date.now(),
  },
  {
    _id: "0x6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a",
    color: "#00FF00", // Bright Green
    stats: {
      totalHexes: 0,
      totalRegions: 0,
      largestCapture: 0,
      totalCaptures: 0,
      lastActive: Date.now(),
    },
    activeRegions: [],
    createdAt: Date.now(),
  },
  {
    _id: "0x7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b",
    color: "#FF00FF", // Magenta
    stats: {
      totalHexes: 0,
      totalRegions: 0,
      largestCapture: 0,
      totalCaptures: 0,
      lastActive: Date.now(),
    },
    activeRegions: [],
    createdAt: Date.now(),
  },
  {
    _id: "0x8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c",
    color: "#00FFFF", // Cyan
    stats: {
      totalHexes: 0,
      totalRegions: 0,
      largestCapture: 0,
      totalCaptures: 0,
      lastActive: Date.now(),
    },
    activeRegions: [],
    createdAt: Date.now(),
  },
  {
    _id: "0x9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d",
    color: "#FFFF00", // Yellow
    stats: {
      totalHexes: 0,
      totalRegions: 0,
      largestCapture: 0,
      totalCaptures: 0,
      lastActive: Date.now(),
    },
    activeRegions: [],
    createdAt: Date.now(),
  },
  {
    _id: "0x0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e",
    color: "#FF6600", // Dark Orange
    stats: {
      totalHexes: 0,
      totalRegions: 0,
      largestCapture: 0,
      totalCaptures: 0,
      lastActive: Date.now(),
    },
    activeRegions: [],
    createdAt: Date.now(),
  },
  {
    _id: "0x1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f",
    color: "#6600FF", // Indigo
    stats: {
      totalHexes: 0,
      totalRegions: 0,
      largestCapture: 0,
      totalCaptures: 0,
      lastActive: Date.now(),
    },
    activeRegions: [],
    createdAt: Date.now(),
  },
  {
    _id: "0x2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a",
    color: "#00FF66", // Lime Green
    stats: {
      totalHexes: 0,
      totalRegions: 0,
      largestCapture: 0,
      totalCaptures: 0,
      lastActive: Date.now(),
    },
    activeRegions: [],
    createdAt: Date.now(),
  },
  {
    _id: "0x3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b",
    color: "#FF0066", // Hot Pink
    stats: {
      totalHexes: 0,
      totalRegions: 0,
      largestCapture: 0,
      totalCaptures: 0,
      lastActive: Date.now(),
    },
    activeRegions: [],
    createdAt: Date.now(),
  },
  {
    _id: "0x4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c",
    color: "#0066FF", // Royal Blue
    stats: {
      totalHexes: 0,
      totalRegions: 0,
      largestCapture: 0,
      totalCaptures: 0,
      lastActive: Date.now(),
    },
    activeRegions: [],
    createdAt: Date.now(),
  },
  {
    _id: "0x5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d",
    color: "#66FF00", // Bright Lime
    stats: {
      totalHexes: 0,
      totalRegions: 0,
      largestCapture: 0,
      totalCaptures: 0,
      lastActive: Date.now(),
    },
    activeRegions: [],
    createdAt: Date.now(),
  },
  {
    _id: "0x6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e",
    color: "#FF3366", // Rose Red
    stats: {
      totalHexes: 0,
      totalRegions: 0,
      largestCapture: 0,
      totalCaptures: 0,
      lastActive: Date.now(),
    },
    activeRegions: [],
    createdAt: Date.now(),
  },
  {
    _id: "0x7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f",
    color: "#3366FF", // Electric Blue
    stats: {
      totalHexes: 0,
      totalRegions: 0,
      largestCapture: 0,
      totalCaptures: 0,
      lastActive: Date.now(),
    },
    activeRegions: [],
    createdAt: Date.now(),
  },
  {
    _id: "0x8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a",
    color: "#FF6633", // Coral Orange
    stats: {
      totalHexes: 0,
      totalRegions: 0,
      largestCapture: 0,
      totalCaptures: 0,
      lastActive: Date.now(),
    },
    activeRegions: [],
    createdAt: Date.now(),
  },
  {
    _id: "0x9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b",
    color: "#6633FF", // Violet
    stats: {
      totalHexes: 0,
      totalRegions: 0,
      largestCapture: 0,
      totalCaptures: 0,
      lastActive: Date.now(),
    },
    activeRegions: [],
    createdAt: Date.now(),
  },
  {
    _id: "0xa0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c",
    color: "#33FF66", // Spring Green
    stats: {
      totalHexes: 0,
      totalRegions: 0,
      largestCapture: 0,
      totalCaptures: 0,
      lastActive: Date.now(),
    },
    activeRegions: [],
    createdAt: Date.now(),
  },
  {
    _id: "0xb1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d",
    color: "#FF33CC", // Hot Magenta
    stats: {
      totalHexes: 0,
      totalRegions: 0,
      largestCapture: 0,
      totalCaptures: 0,
      lastActive: Date.now(),
    },
    activeRegions: [],
    createdAt: Date.now(),
  },
  {
    _id: "0xc2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e",
    color: "#33CCFF", // Sky Blue
    stats: {
      totalHexes: 0,
      totalRegions: 0,
      largestCapture: 0,
      totalCaptures: 0,
      lastActive: Date.now(),
    },
    activeRegions: [],
    createdAt: Date.now(),
  },
  {
    _id: "0xd3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f",
    color: "#CCFF33", // Lime Yellow
    stats: {
      totalHexes: 0,
      totalRegions: 0,
      largestCapture: 0,
      totalCaptures: 0,
      lastActive: Date.now(),
    },
    activeRegions: [],
    createdAt: Date.now(),
  },
  {
    _id: "0xe4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a",
    color: "#CC33FF", // Electric Purple
    stats: {
      totalHexes: 0,
      totalRegions: 0,
      largestCapture: 0,
      totalCaptures: 0,
      lastActive: Date.now(),
    },
    activeRegions: [],
    createdAt: Date.now(),
  },
  {
    _id: "0xf5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b",
    color: "#FFCC33", // Golden Yellow
    stats: {
      totalHexes: 0,
      totalRegions: 0,
      largestCapture: 0,
      totalCaptures: 0,
      lastActive: Date.now(),
    },
    activeRegions: [],
    createdAt: Date.now(),
  },
  {
    _id: "0x5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c",
    color: "#33FFCC", // Turquoise
    stats: {
      totalHexes: 0,
      totalRegions: 0,
      largestCapture: 0,
      totalCaptures: 0,
      lastActive: Date.now(),
    },
    activeRegions: [],
    createdAt: Date.now(),
  },
  {
    _id: "0xa6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d",
    color: "#FF9933", // Orange Red
    stats: {
      totalHexes: 0,
      totalRegions: 0,
      largestCapture: 0,
      totalCaptures: 0,
      lastActive: Date.now(),
    },
    activeRegions: [],
    createdAt: Date.now(),
  },
  {
    _id: "0xb7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e",
    color: "#9933FF", // Deep Purple
    stats: {
      totalHexes: 0,
      totalRegions: 0,
      largestCapture: 0,
      totalCaptures: 0,
      lastActive: Date.now(),
    },
    activeRegions: [],
    createdAt: Date.now(),
  },
  {
    _id: "0xc8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f",
    color: "#33FF99", // Mint Green
    stats: {
      totalHexes: 0,
      totalRegions: 0,
      largestCapture: 0,
      totalCaptures: 0,
      lastActive: Date.now(),
    },
    activeRegions: [],
    createdAt: Date.now(),
  },
];

// Generate realistic running patterns based on territory and preferences
function generateRealisticPaths(): { [userId: string]: [number, number][][] } {
  const paths: { [userId: string]: [number, number][][] } = {};
  
  RUNNERS.forEach((runner, index) => {
    paths[runner._id] = [];
    const territory = RUNNER_TERRITORIES[index];
    
    // Each runner has 2-4 regular routes they run
    const numRoutes = 2 + Math.floor(Math.random() * 3);
    
    for (let route = 0; route < numRoutes; route++) {
      const path: [number, number][] = [];
      
      // Start point within their territory
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * territory.radius * 0.7;
      const startLat = territory.center.lat + Math.cos(angle) * distance;
      const startLng = territory.center.lng + Math.sin(angle) * distance;
      
      path.push([startLat, startLng]);
      
      // Route length varies: 40-90 points (3-7km equivalent)
      const numPoints = 40 + Math.floor(Math.random() * 51);
      let currentLat = startLat;
      let currentLng = startLng;
      
      // Determine route pattern based on preferences
      const pattern = territory.preferredDirections[
        Math.floor(Math.random() * territory.preferredDirections.length)
      ];
      
      // Generate path based on pattern
      for (let i = 1; i < numPoints; i++) {
        let stepLat = 0;
        let stepLng = 0;
        
        switch (pattern) {
          case 'north-south':
            stepLat = (Math.random() - 0.3) * 0.0008; // Bias north
            stepLng = (Math.random() - 0.5) * 0.0003;
            break;
          case 'east-west':
            stepLat = (Math.random() - 0.5) * 0.0003;
            stepLng = (Math.random() - 0.3) * 0.0008; // Bias east
            break;
          case 'coastal':
            // Follow coastline-like pattern
            stepLat = Math.sin(i * 0.1) * 0.0004 + (Math.random() - 0.5) * 0.0002;
            stepLng = (Math.random() - 0.4) * 0.0008;
            break;
          case 'circular':
            // Circular route
            const circleAngle = (i / numPoints) * Math.PI * 2;
            stepLat = Math.cos(circleAngle) * 0.0005;
            stepLng = Math.sin(circleAngle) * 0.0005;
            break;
          case 'grid':
            // Grid-like pattern (turn corners)
            if (i % 15 === 0) {
              stepLat = (Math.random() > 0.5 ? 1 : -1) * 0.0006;
              stepLng = (Math.random() - 0.5) * 0.0002;
            } else {
              stepLat = (Math.random() - 0.5) * 0.0002;
              stepLng = (Math.random() > 0.5 ? 1 : -1) * 0.0006;
            }
            break;
          case 'meandering':
            // Natural meandering path
            stepLat = Math.sin(i * 0.2) * 0.0004 + (Math.random() - 0.5) * 0.0003;
            stepLng = Math.cos(i * 0.15) * 0.0004 + (Math.random() - 0.5) * 0.0003;
            break;
          default:
            // Linear with slight variation
            stepLat = (Math.random() - 0.4) * 0.0006;
            stepLng = (Math.random() - 0.5) * 0.0004;
        }
        
        currentLat += stepLat;
        currentLng += stepLng;
        
        // Keep within territory bounds
        const distFromCenter = Math.sqrt(
          Math.pow(currentLat - territory.center.lat, 2) + 
          Math.pow(currentLng - territory.center.lng, 2)
        );
        
        if (distFromCenter > territory.radius) {
          // Bounce back toward center
          currentLat += (territory.center.lat - currentLat) * 0.1;
          currentLng += (territory.center.lng - currentLng) * 0.1;
        }
        
        path.push([currentLat, currentLng]);
      }
      
      // Some routes are loops (60% chance)
      if (Math.random() > 0.4) {
        // Add points to close the loop naturally
        const pointsToClose = 5;
        for (let i = 0; i < pointsToClose; i++) {
          const t = (i + 1) / pointsToClose;
          const closingLat = currentLat + (startLat - currentLat) * t;
          const closingLng = currentLng + (startLng - currentLng) * t;
          path.push([closingLat, closingLng]);
        }
      }
      
      paths[runner._id].push(path);
    }
  });
  
  return paths;
}

// Generate occasional single hex captures (stopping points)
function generateSingleHexCaptures(): { [userId: string]: [number, number][][] } {
  const captures: { [userId: string]: [number, number][][] } = {};
  
  RUNNERS.forEach((runner, index) => {
    captures[runner._id] = [];
    const territory = RUNNER_TERRITORIES[index];
    
    // 2-4 single point captures per runner (landmarks, rest spots)
    const numCaptures = 2 + Math.floor(Math.random() * 3);
    
    for (let i = 0; i < numCaptures; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * territory.radius * 0.8;
      const lat = territory.center.lat + Math.cos(angle) * distance;
      const lng = territory.center.lng + Math.sin(angle) * distance;
      
      captures[runner._id].push([[lat, lng]]);
    }
  });
  
  return captures;
}

async function populateDatabase() {
  try {
    console.log("🚀 Starting realistic Chennai running data population...");
    console.log("👥 30 runners across diverse Chennai neighborhoods including Nungambakkam & Choolaimedu");
    
    await connectDatabase();
    
    console.log("🧹 Clearing existing data...");
    await PathModel.deleteMany({});
    await RegionModel.deleteMany({});
    
    console.log("🏃 Generating realistic running paths...");
    const runningPaths = generateRealisticPaths();
    const singleHexCaptures = generateSingleHexCaptures();
    
    console.log("🗺️  Processing paths by territory...");
    for (const [userId, paths] of Object.entries(runningPaths)) {
      const runner = RUNNERS.find(r => r._id === userId);
      if (!runner) continue;
      
      const runnerIndex = RUNNERS.indexOf(runner);
      const territory = RUNNER_TERRITORIES[runnerIndex];
      
      console.log(`\n${runner._id.slice(0, 10)}... (${territory.preferredDirections.join(', ')} patterns)`);
      console.log(`  Territory: ${territory.center.lat.toFixed(4)}, ${territory.center.lng.toFixed(4)}`);
      
      for (const path of paths) {
        try {
          const result = await PathService.processPath({
            user: userId,
            color: runner.color,
            path: path,
            options: {
              autoClose: true,
              minLoopSize: 3,
            },
          });
          
          console.log(`  ✅ ${result.pathType}: ${result.hexesCaptured} hexes`);
          
          runner.stats.totalHexes += result.hexesCaptured;
          runner.stats.totalCaptures += 1;
          runner.stats.largestCapture = Math.max(runner.stats.largestCapture, result.hexesCaptured);
          runner.stats.lastActive = Date.now();
          
          result.regionsAffected.forEach(regionId => {
            if (!runner.activeRegions.includes(regionId)) {
              runner.activeRegions.push(regionId);
              runner.stats.totalRegions += 1;
            }
          });
          
        } catch (error) {
          console.error(`  ❌ Error:`, error);
        }
      }
    }
    
    console.log("\n📍 Processing landmark captures...");
    for (const [userId, captures] of Object.entries(singleHexCaptures)) {
      const runner = RUNNERS.find(r => r._id === userId);
      if (!runner) continue;
      
      for (const capture of captures) {
        try {
          const result = await PathService.processPath({
            user: userId,
            color: runner.color,
            path: capture,
            options: {
              autoClose: false,
            },
          });
          
          runner.stats.totalHexes += result.hexesCaptured;
          runner.stats.totalCaptures += 1;
          
          result.regionsAffected.forEach(regionId => {
            if (!runner.activeRegions.includes(regionId)) {
              runner.activeRegions.push(regionId);
              runner.stats.totalRegions += 1;
            }
          });
          
        } catch (error) {
          console.error(`  ❌ Error for ${runner._id.slice(0, 10)}...:`, error);
        }
      }
    }
    
    console.log("\n" + "=".repeat(60));
    console.log("📊 FINAL STATISTICS");
    console.log("=".repeat(60));
    
    RUNNERS.forEach((runner, index) => {
      const territory = RUNNER_TERRITORIES[index];
      console.log(`\n${runner._id}`);
      console.log(`  Color: ${runner.color}`);
      console.log(`  Territory: ${territory.center.lat.toFixed(4)}, ${territory.center.lng.toFixed(4)}`);
      console.log(`  Pattern: ${territory.preferredDirections.join(', ')}`);
      console.log(`  Hexes Captured: ${runner.stats.totalHexes}`);
      console.log(`  Routes Completed: ${runner.stats.totalCaptures}`);
      console.log(`  Largest Run: ${runner.stats.largestCapture} hexes`);
      console.log(`  Active Regions: ${runner.stats.totalRegions}`);
    });
    
    const totalPaths = await PathModel.countDocuments();
    const totalRegions = await RegionModel.countDocuments();
    
    console.log("\n" + "=".repeat(60));
    console.log(`📈 Database: ${totalPaths} paths, ${totalRegions} regions`);
    console.log("=".repeat(60));
    console.log("\n✅ Realistic running data populated successfully!");
    
  } catch (error) {
    console.error("❌ Error populating database:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Database disconnected");
  }
}

if (require.main === module) {
  populateDatabase();
}

export { populateDatabase, RUNNERS, RUNNER_TERRITORIES };