Run-n is a gamified running app experience. Built as a nextjs web app. Capture territories by running.
# **Demo Flow: User Story**
- User signs in using their wallet  
- User lands a home page  
  - Home page is a map UI  
  - Bottom nav has three main action buttons  
    - START  
      - Starts streaming coordinates to the yellow state clearnet  
    - STOP  
      - Settle the channel state on-chain  
      - Settle the datacoin capture events and mint them datacoin if valid through LLM validation  
    - MINE (get data coin flow)  
      - Select one of the quests  
      - Take a picture  
      - Submit zktls \+ picture proof to mint a datacoin for that quest  
      - Emit the datacoin capture event  
  - Map contains the following:  
    - pointers of all the active players in the game \- also inactive but last logged in users.   
    - all the territories captured previously \- one color per player \- user mercator planes for coloring the map territories  
    - pointers for each valid datacoin mined at places  
- User opens leaderboard page  
  - Shows aggregate of all the runners and their territories captured  
- User opens quests page  
  - Display quests  
  - Create a quest

# **2 — Components**

Frontend

* React Web \+ Mapbox GL. Shows map, own position, nearby runners, tile overlay, capture animation, leaderboards.  
* Yellow Network WebSocket client for realtime channels.  
* Local client smoothing, batching of GPS to reduce noise.

Realtime layer

* Yellow Network WebSocket channels used for position streaming and low-latency events.

Lighthouse SDK integration (server-side)

* Package the dataset metadata \+ evidence \+ signed attestation, call Lighthouse SDK to mint/issue datacoin / record dataset provenance. Store Lighthouse references in Mongo. 

* Mint-on-accept: Mint a datacoin per accepted submission at acceptance time via Lighthouse.     
  Acceptance model:  
* Auto-accept rules: accuracy threshold, photo hash checks, mapHash match, continuity checks. Immediate issuance. datacoins for campaigns.

Authoritative game server

* [Node.js](http://Node.js) service that receives position events (via Yellow or direct WS), computes tile, decides captures, writes state, publishes events.

API / Persistence

* Mongo GeoJSON for authoritative persistent state of tiles, captures, historical queries.  
* In-memory store for ephemeral state, locking, fast leaderboard sorted sets, rate limits.

* Composability:  
* Datacoin metadata includes `questId`, `datasetId`, and verifiable attestation (zktls) so apps and marketplaces can filter by quest, build derivative quests, or bundle   

# **3 — Grid math: mapping lat/lon to a 10m x 10m tile**

Do not use lat/lon floored directly. Project to meters with Web Mercator or UTM.

Simplest robust approach:

1. Convert lat/lon to WebMercator meters (EPSG:3857).  
2. TileX \= floor(x\_meters / 10); TileY \= floor(y\_meters / 10).  
3. TileID \= TILE\_{zoomless}*{TileX}*{TileY} or encode as `zxy` string.

Pseudocode:

// assume lat, lon in degrees  
function latLonToTileId(lat, lon) {  
  const R\_MAJOR \= 6378137;  
  const x \= R\_MAJOR \* lon \* Math.PI / 180;  
  const y \= R\_MAJOR \* Math.log(Math.tan((90 \+ lat) \* Math.PI / 360));  
  const tileX \= Math.floor(x / 10);  
  const tileY \= Math.floor(y / 10);  
  return \`${tileX}\_${tileY}\`;  
}

Notes:

* Use double precision. This yields fixed 10m squares in projected meters.  
* Edge cases near poles are irrelevant for a running app mostly in populated areas.  
  Alternative: use S2 or Uber H3 grid for nice indexing. H3 levels do not produce exact 10m squares but are convenient. For exact 10m you need metric projection.

# **4 — Capture rules (MVP)**

* When server receives user entering tile T:  
  * If tile has no owner: atomically assign owner \= user, timestamp \= now.  
  * If tile has owner: ignore.  
* Tie breaker: first writer wins.    
* Capture event includes distance travelled  

   
---

# **Single-channel (keep-it-simple) model — one channel type per geographic bucket**

Instead of juggling *region channels*, *presence channels*, *user channels*, etc., keep it to **one Yellow state channel per geographic bucket** and use a couple of small event types inside it. That gives you simple subscription logic and still leverages Yellow’s snapshot \+ event features.

**Channel name**  
 `region:bx:{bx}:by:{by}`

* `bx` \= bucket X, `by` \= bucket Y (see bucket math below).

* One channel covers a square area (suggest start with 1km × 1km buckets \= 100 × 100 tiles if a tile \= 10m).

**What lives in the channel**

* An authoritative **state snapshot** (small): current claimed tiles in the bucket \+ recent datasets (optional) \+ a short leaderboard summary.

* A short **event stream** of deltas: tile captures, presence heartbeats, dataset-issued notifications.

* Clients subscribe to the channel and get the latest snapshot immediately (fast re-sync), then the event stream for changes.

Why this is nice:

* Simple subscription model (subscribe/unsubscribe only to region channels).

* New clients get an immediate, authoritative snapshot without replaying lots of deltas.

* Presence and small events piggyback on the same channel (fewer channels to manage).

* You still get Yellow’s retention \+ session guarantees for reconnects. ([Yellow Network](https://docs.yellow.org/api-reference/?utm_source=chatgpt.com))

---

# **Bucket math (very short)**

* Convert lat/lon to WebMercator meters, then tileX \= floor(x / 10), tileY \= floor(y / 10).

* BucketX \= floor(tileX / 100), BucketY \= floor(tileY / 100).  
   That means each bucket covers 100×100 tiles \= 1,000m × 1,000m if tile \= 10m. Tweak `100` to 50 or 200 later.

---

# **Event types (all published to the single channel)**

All messages include `eventId` and `ts` (ISO string). Keep payloads tiny: no images — put large data on S3/IPFS and include an object hash/URL only.

1. **region.snapshot** — authoritative snapshot (published periodically, e.g. on subscribe and every 3–10s)

{  
  "type":"region.snapshot",  
  "bx":123, "by":456,  
  "tiles": \[  
    { "tileId":"12345\_67890", "ownerId":"u\_9", "capturedAt":"2025-10-22T10:30:02Z" },  
    ...  
  \],  
  "leaderboard": \[{ "userId":"u\_9","score":120 }, ...\],  
  "ts":"..."  
}

2. **tile.captured** — delta: someone captured a tile

{  
  "type":"tile.captured",  
  "tileId":"12345\_67895",  
  "ownerId":"u\_123",  
  "capturedAt":"2025-10-22T10:34:15Z"  
}

3. **presence.heartbeat** — ephemeral runner heartbeat (lightweight; TTL handled client-side)

{  
  "type":"presence.heartbeat",  
  "userId":"u\_123",  
  "lat":12.9716,  
  "lon":77.5946,  
  "speed":3.2,  
  "ts":"2025-10-22T10:34:12Z"  
}

4. **leaderboard.snapshot** — occasional (every 5–30s) compact top-k

{ "type":"leaderboard.snapshot","top":\[{"userId":"u\_9","score":120},...\],"ts":"..." }

---

# **Client subscription & behaviour (simple)**

1. **Compute bucket set** for current viewport (include a 1-bucket margin to avoid churning when panning). Subscribe to `region:bx:{bx}:by:{by}` for each bucket in that set.

2. **On subscribe** Yellow returns the latest `region.snapshot` (or you fetch it from your REST API). Apply the snapshot to local state (claimed tiles \+ leaderboard).

3. **Listen** to events on the channel and apply deltas:

   * `tile.captured` → color tile, update owner, show capture animation

   * `presence.heartbeat` → update moving markers for nearby runners (smooth them)

   * `leaderboard.snapshot` → show updated top-k

4. **Publish client actions to server** (do NOT directly publish authoritative events from client to the channel). For example:

   * Client sends `pos.update` or `capture.request` to your backend API/WS (server is authoritative).

   * Server validates/persists and then publishes `tile.captured` into the region channel.

5. **Reconnect**: if connection drops, resubscribe to same buckets; Yellow will provide the latest snapshot (fast resync).

---

# **Server behaviour (simple, authoritative)**

* Accept `pos.update` / `capture.request` from clients (HTTP or server-facing Yellow channel).

* Compute tileId and attempt Mongo insert with unique index on `tileId` (first-writer wins). If insert succeeds, publish `tile.captured` to the appropriate `region:bx:by` channel. If it fails (duplicate key), return owner info to client.

* Periodically (every 3–10s) publish `region.snapshot` for hot buckets — this keeps late joiners consistent.

* Publish `presence.heartbeat` events only if you want server-managed presence; otherwise clients can publish heartbeats to the same region channel if your Yellow permissions allow (but prefer server-publish for authoritative deltas like tile.captured).  
   

---

# **Example timeline (concrete)**

1. App subscribes to `region:bx:123:by:456` → receives `region.snapshot` with 200 tiles owned.

2. User runs and crosses into tile `12345_67895`. Client sends `POST /capture` to server with lat/lon.

3. Server computes tile, inserts into `tiles` collection (unique index). Insert succeeds.

4. Server publishes:

   * `tile.captured { tileId:"12345_67895", ownerId:"u_123", capturedAt:... }` on `region:bx:123:by:456`

   * later server publishes `leaderboard.snapshot` to same channel

5. All subscribed clients receive tile.captured and animate tile claiming in \<100ms.  
  


# **6 — Data model (simplified)**

SQL tables

`users`:

* id (pk), display\_name, avatar\_url, created\_at

`tiles`:

* tile\_id varchar pk  
* owner\_id fk users  
* lat double, lon double (centroid)  
* captured\_at timestamp  
* capture\_session\_id nullable

`captures`: history entries

* id pk  
* tile\_id fk  
* user\_id fk  
* ts  
* source\_run\_id nullable

`runs`:

* id pk  
* user\_id fk  
* start\_ts, end\_ts  
* gps\_trace (optional polyline), distance\_m, duration\_s

`leaderboard_snapshots`:

* id, snapshot\_ts, top\_users jsonb  
    

# **9 — Mapbox integration**

* Frontend uses Mapbox GL for vector rendering.

* For tile overlay: (a) render tile grid polygons client-side using the same lat/lon \-\> tile conversion; (b) color tiles by owner id hash. Only render tiles in viewport plus margin.

* For many tiles, use server tiled vector source: server returns polygon vector tiles or GeoJSON for viewport. Simpler MVP: query server for captured tiles in viewport bounding box and render them as small rectangles.

* Show nearby runners as animated markers. Use WebSocket presence messages.

 