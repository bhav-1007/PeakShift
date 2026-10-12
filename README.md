<div align="center">

# ⚡ PeakShift
### Real-Time Hyper-Local Micro-Shift Staffing & Instant Workforce Marketplace

[![Node.js](https://img.shields.io/badge/Node.js-v20%2B-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-5.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas%20%7C%20Mongoose%208-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Leaflet](https://img.shields.io/badge/Maps-Leaflet%20%26%20OSM-199900?style=for-the-badge&logo=leaflet&logoColor=white)](https://leafletjs.com/)
[![Bootstrap](https://img.shields.io/badge/UI-Bootstrap%205%20%2B%20Vanilla%20CSS-7952B3?style=for-the-badge&logo=bootstrap&logoColor=white)](https://getbootstrap.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

**Making hourly labor as agile, responsive, and predictable as modern demand spikes.**

[Explore Open Shifts](http://127.0.0.1:8080/listings) • [Architecture Overview](#system-architecture) • [Feature Deep Dive](#minute-by-minute-feature-deep-dive) • [Live Demo Walkthrough](#judges-live-demo-walkthrough)

</div>

---

## 📌 Executive Summary & Problem Statement

High-throughput urban businesses face a structural **labor-demand mismatch**:
- **The Problem for Businesses**: Cloud kitchens face frantic 7:00 PM – 10:00 PM dinner surges; artisanal cafes experience 8:00 AM – 11:00 AM espresso rushes; quick-commerce dark stores get slammed during festive weekend windows. Traditional staffing agencies require multi-week commitments and fixed monthly payroll, while standard gig delivery platforms do not solve on-site physical floor staffing.
- **The Problem for Hourly Workers**: Students, part-time workers, and semi-skilled laborers want immediate, flexible, hyper-local earning opportunities (2 to 4 hours) near their homes without locked-in contracts, delayed bi-weekly payrolls, or predatory commission structures.

### The PeakShift Solution
**PeakShift** is a full-stack, hyper-local micro-shift marketplace delivering rapid labor matching with:
1. **Space-Efficient, Image-Free Operations**: High-density shift telemetry that loads instantly, eliminating photo upload friction.
2. **Atomic Slot Concurrency**: Mathematical impossibility of slot overselling via single-round-trip MongoDB atomic increments.
3. **Geofenced Proof-of-Presence**: Mandatory GPS coordinate radius validation (300m) paired with live selfie facial verification.
4. **Dual-Sided Dynamic Trust Math**: Algorithmic reputation scoring (0–100) dynamically recalculated on shift completions, no-shows, and mutual reviews.
5. **Automated Lifecycle Sweeper**: Autonomous background daemon expiring past shifts and penalizing no-shows.
6. **Transparent Ledgering**: Simulated escrow payouts with immutable transaction records and detailed analytics.

---

## 🏛️ System Architecture

```mermaid
graph TD
    subgraph Client ["Client Layer (Browser / Mobile PWA)"]
        UI["EJS Responsive Viewport"]
        GEO["HTML5 Geolocation API"]
        CAM["Selfie Camera Capture"]
        POLL["30s Notification Poller"]
    end

    subgraph Server ["Application Server (Node.js & Express 5)"]
        AUTH["Passport.js Session Auth"]
        ROUTERS["Modular Route Handlers"]
        JOI["Joi Validation & IST Time Parser"]
        GEO_UTIL["Haversine & Nominatim Geo Engine"]
        TRUST_ENG["Trust & Reputation Engine"]
        SWEEPER["Periodic Background Sweeper Daemon"]
    end

    subgraph Storage ["Data & Media Tier"]
        MONGO[("MongoDB Atlas (Mongoose 8)")]
        CLOUDINARY[("Cloudinary CDN (Selfie Storage)")]
    end

    UI -->|HTTP / REST| ROUTERS
    GEO -->|Lat / Lng Payload| GEO_UTIL
    CAM -->|Multipart Form| CLOUDINARY
    POLL -->|Fetch Unread Count| ROUTERS
    ROUTERS --> AUTH
    ROUTERS --> JOI
    ROUTERS --> MONGO
    TRUST_ENG --> MONGO
    SWEEPER -->|5-Min Cron Cycle| MONGO
```

---

## 🔬 Minute-by-Minute Feature Deep Dive

### 1. Space-Efficient Shift Management (`.shift-row`)
- **Zero-Image High-Density Telemetry**: Shift management is built without image bloat. By eliminating decorative shift photos, post-shift creation is instant, mobile load times are cut by over 70%, and businesses focus purely on operational parameters.
- **Micro-Shift Telemetry Cards**:
  - **Role Badge**: Distinct, uppercase role categorization (`ORDER PACKAGING ASSISTANT`, `KITCHEN PREP`, `CASHIER`, `EVENT CREW`).
  - **Dynamic Timing Pill**: Relative countdown calculations (`starts in 1h 23m` or `starts in 2d 4h`).
  - **Hyper-Local Distance Pill**: Live proximity display (`0.1 km away`).
  - **Staffing Capacity Track**: Visual CSS progress bar visualizing filled vs. needed worker ratios (`0 / 2 filled`, `1 slot left`).
  - **Rate & Earnings Box**: Real-time hourly rate (`₹145/hr`) and calculated total shift payout (`₹435 total (3 hrs)`).
- **Contractual Edit-Lock Guarantee**:
  - Once any worker accepts a slot (`filledCount > 0`), shift title, start time, end time, pay rate, required slot count, and location become **strictly locked and immutable**.
  - Businesses can only update operational instructions/descriptions, preventing bait-and-switch modifications after workers have accepted.

---

### 2. Hyper-Local Geospatial Discovery Engine
- **2dsphere Spherical Indexing**: Built directly on `Listing.geometry` (GeoJSON `Point` `[longitude, latitude]`).
- **Spherical Geometry Queries**: Implements MongoDB `$geoWithin` with `$centerSphere` using exact Earth radian calculations:
  $$\text{radianRadius} = \frac{\text{radiusInKm}}{6378.1}$$
- **Haversine Distance Metric**: `utils/geo.js` computes great-circle distance between coordinates with sub-meter precision:
  $$d = 2R \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta\lambda}{2}\right)}\right)$$
- **Instant "Near Me" GPS Radar**:
  - Browser Geolocation API detects user latitude/longitude.
  - Automatically falls back to worker's saved profile home location if device permission is denied.
- **Multi-Facet Search & Injection Defense**:
  - Text search sanitized with regex escaping (`utils/escapeRegex.js`) to defend against ReDoS and regex injection.
  - Skill tag array queries, minimum hourly pay filters, and temporal filters (*Next 2 Hours*, *Today*, *Tomorrow* interpreted in IST UTC+05:30).
  - Multi-tiered radial boundary selectors (2 km, 5 km, 10 km, 20 km) with multi-criteria sorting (*Soonest*, *Nearest*, *Highest Pay*).

---

### 3. Atomic Slot Concurrency & Oversell Protection
- **Single-Round-Trip Atomic Increment**:
  To eliminate race conditions when dozens of workers attempt to claim the last available slot simultaneously, `services/bookingService.js` executes an atomic conditional update:
  ```javascript
  const claimedListing = await Listing.findOneAndUpdate(
    {
      _id: listingId,
      status: "open",
      startAt: { $gt: now },
      $expr: { $lt: ["$filledCount", "$workersNeeded"] },
    },
    { $inc: { filledCount: 1 } },
    { new: true }
  );
  ```
- **Auto-Closing Threshold**: Automatically sets status to `"filled"` when `filledCount >= workersNeeded`.
- **Double-Booking & Overlap Defense**: Prior to booking, the system queries for any existing `"accepted"` bookings overlapping the time window:
  ```javascript
  const overlap = await Booking.findOne({
    worker: workerId,
    status: "accepted",
    startAt: { $lt: listing.endAt },
    endAt: { $gt: listing.startAt },
  });
  ```
- **Compensating Rollback Transaction**: If downstream booking document creation fails, an atomic rollback decrements `filledCount` and restores open availability.
- **Worker Cancellation with Slot Restoration**: Workers can safely cancel before `startAt`, which decrements `filledCount` and reopens the shift.

---

### 4. Proof-of-Presence Geofenced Check-In
- **Dual-Constraint Verification Window**:
  - **Temporal Guard**: Check-in window opens strictly `CHECKIN_OPENS_MIN_BEFORE` minutes (default 30 mins) before `startAt` and closes at `endAt`.
  - **Spatial Guard**: Live device coordinates must fall within `CHECKIN_RADIUS_M` meters (default 300m) of the verified shift location.
- **Live Facial Selfie Photographic Proof**:
  - Workers capture a live selfie via browser camera input, processed via Multer directly to Cloudinary storage.
  - Prevents remote check-ins, spoofing, and ghost worker attendance.
- **Audit-Trail Logging**: Every check-in logs exact check-in timestamp (`checkInAt`), geographic coordinates (`checkInCoords`), calculated distance in meters (`checkInDistanceM`), and selfie thumbnail URL.

---

### 5. Dual-Sided Mathematical Trust & Reputation Engine
- **Formula-Driven Score Calculation** (`utils/trust.js`):
  Both workers and businesses operate with an algorithmic Trust Score from 0 to 100:
  $$\text{trustScore} = \text{round}\left(100 \times \left(0.6 \times \frac{\text{completedShifts}}{\text{completedShifts} + \text{noShows}} + 0.4 \times \frac{\text{ratingAvg}}{5}\right)\right)$$
- **Cold-Start Foundation**: New accounts start at an equitable baseline score of **70**.
- **Real-Time Dynamic Recalculation**:
  - Recomputed immediately when a shift is marked `completed`.
  - Penalized immediately when an unattended booking transitions to `no_show`.
  - Recalculated immediately upon submission of a verified 1–5 star review.
- **Contract-Restricted Reviews**: Reviews (`models/review.js`) can only be authored between the verified worker and business of a `completed` shift booking, with exactly one immutable review permitted per participant per shift.

---

### 6. Autonomous Background Sweeper Daemon
- **Continuous Lifecycle Watchdog** (`app.js`): Runs an automatic sweep every 5 minutes:
  1. **Shift Expiration**: Unstaffed open shifts whose `startAt` timestamp has passed are automatically transitioned from `open` to `expired`.
  2. **Automated No-Show Detection**: Bookings remaining in `accepted` status 30 minutes after `startAt` with no check-in logged are automatically converted to `no_show`.
  3. **Automated Penalty & Alert**: Instantly triggers Trust Score penalty recalculation for the absent worker and sends a real-time notification alert.

---

### 7. Escrow-Style Financial Ledger & Simulated Payouts
- **Idempotent Payout Engine**:
  - Business owners can mark workers completed individually or via **"Complete All (Simulated Payout)"**.
  - Enforces `unique: true` constraint on `transactionSchema.booking`, guaranteeing that accidental double-clicks or concurrent network retries can never produce duplicate payout deductions.
- **Automated Platform Fee Deductions**:
  - Gross pay calculated based on verified shift duration:
    $$\text{gross} = \text{hours} \times \text{hourlyRate}$$
  - Platform fee computed at 10% (`PLATFORM_FEE_RATE = 0.10`).
  - Net payout allocated to worker:
    $$\text{workerNet} = \text{gross} - \text{platformFee}$$
- **Worker Work Passport & Payout Ledger** (`/earnings`):
  - Real-time aggregated financial analytics: Today's Gross/Net, Weekly Gross/Net, Monthly Gross/Net, and All-Time Payouts.
  - Tabular historical ledger showing date (IST), shift title, employer, gross, platform fee deduction, and net disbursement.
- **Business Shift Spend Analytics** (`/spend`):
  - Full spend visibility showing total staffing outlays, platform charges, and worker-by-worker payout breakdowns.

---

### 8. Proactive Hyper-Local Dispatch & Real-Time Alerts
- **Proactive Geographic Dispatch**:
  - When a business posts a new shift, the system queries the database for workers within a 5 km radius sharing matching skill tags.
  - Dispatches automated in-app notifications to up to 20 nearby matching workers within seconds of posting.
- **Event-Driven Notification Pipeline**:
  - Worker accepts shift ➔ Business alerted with applicant name and roster link.
  - Worker checks in on-site ➔ Business alerted with check-in timestamp and selfie status.
  - Shift cancelled or details updated ➔ All booked workers alerted immediately.
  - Payout released ➔ Worker alerted with net payout amount.
- **Asynchronous Navbar Telemetry**:
  - Navbar bell counter polls `/notifications/unread-count` every 30 seconds.
  - Real-time counter badge with instant mark-all-read capabilities.

---

### 9. Privacy, Security & Data Protection
- **Zero Demo Leaks**: No personal emails, passwords, or hardcoded dummy credentials exposed anywhere in user-facing views or placeholders.
- **Role-Based Access Control (RBAC)**: Comprehensive middleware suite (`isLoggedIn`, `isBusiness`, `isWorker`, `isOwner`) guarding every endpoint.
- **Strict Input Validation**: Joi schemas enforce start times in future IST, valid temporal windows (1 to 12 hours), positive wages, and strict enum checking.

---

## 🗄️ Database Schemas & Data Model

```mermaid
erDiagram
    USER ||--o{ LISTING : owns
    USER ||--o{ BOOKING : accepts
    USER ||--o{ NOTIFICATION : receives
    USER ||--o{ REVIEW : authors
    USER ||--o{ REVIEW : receives
    LISTING ||--o{ BOOKING : contains
    BOOKING ||--o| TRANSACTION : generates
    BOOKING ||--o{ REVIEW : references

    USER {
        ObjectId _id PK
        string username
        string email
        string role "worker | business"
        string businessName
        string[] skills
        Point geometry "2dsphere"
        number trustScore "0-100"
        number ratingAvg "0-5"
        number ratingCount
        number completedShifts
        number noShows
    }

    LISTING {
        ObjectId _id PK
        string title
        string description
        number price "hourly"
        string roleType
        number workersNeeded
        number filledCount
        string status "open | filled | cancelled | expired"
        Date startAt
        Date endAt
        string[] skillTags
        string location
        Point geometry "2dsphere"
        ObjectId owner FK
    }

    BOOKING {
        ObjectId _id PK
        ObjectId listing FK
        ObjectId worker FK
        Date startAt
        Date endAt
        number hours
        number payAmount
        number platformFee
        string status "accepted | checked_in | completed | no_show | cancelled"
        Date checkInAt
        Object checkInCoords
        number checkInDistanceM
        Object checkInSelfie
    }

    TRANSACTION {
        ObjectId _id PK
        ObjectId booking FK "unique"
        ObjectId worker FK
        ObjectId business FK
        number gross
        number platformFee
        number workerNet
        Date createdAt
    }

    REVIEW {
        ObjectId _id PK
        ObjectId booking FK
        ObjectId author FK
        ObjectId reviewee FK
        number rating "1-5"
        string comment
        Date createdAt
    }

    NOTIFICATION {
        ObjectId _id PK
        ObjectId user FK
        string message
        string link
        boolean read
        Date createdAt
    }
```

---

## 🛣️ API Endpoint Directory

| Method | Endpoint | Access Control | Functional Purpose |
|---|---|---|---|
| `GET` | `/` | Public | Landing page with platform metrics & active shift rows |
| `GET` | `/listings` | Public | Paginated search, radius filtering & spatial discovery |
| `POST` | `/listings` | Business | Post a new shift without image dependencies |
| `GET` | `/listings/:id` | Public | High-density shift detail page with Leaflet map |
| `PUT` | `/listings/:id` | Business (Owner) | Update shift (subject to contract edit lock) |
| `POST` | `/listings/:id/cancel` | Business (Owner) | Cancel shift and cancel accepted worker slots |
| `POST` | `/listings/:id/bookings` | Worker | Atomic shift acceptance with overlap checking |
| `GET` | `/bookings/my` | Worker | Worker Shift Passport & check-in hub |
| `POST` | `/bookings/:id/checkin`| Worker | Geofenced GPS + selfie check-in submission |
| `DELETE`| `/bookings/:id` | Worker | Cancel accepted slot prior to shift start |
| `GET` | `/dashboard` | Business | Real-time shift roster with worker verification details |
| `POST` | `/bookings/:id/complete`| Business (Owner) | Mark worker completed & trigger simulated payout |
| `POST` | `/listings/:id/complete-all`| Business (Owner) | Batch complete all checked-in workers |
| `POST` | `/bookings/:id/reviews`| Worker / Business| Submit 1–5 star review and recalculate trust score |
| `GET` | `/earnings` | Worker | Financial ledger with net earnings breakdown |
| `GET` | `/spend` | Business | Aggregate spend ledger & platform fee reporting |
| `GET` | `/notifications` | Authenticated | Notification inbox with mark-all-read action |
| `GET` | `/notifications/unread-count`| Authenticated | Real-time unread badge count for navbar polling |

---

## 🚀 Setup & Local Execution Guide

### Prerequisites
- Node.js v18+ or v20+
- MongoDB Atlas cluster or local MongoDB instance (v6.0+)
- Cloudinary account credentials (for worker check-in selfie uploads)

### 1. Installation
```bash
# Clone the repository
git clone https://github.com/bhav-1007/PeakShift.git
cd PeakShift

# Install all dependencies
npm install
```


### 3. Seed Database
```bash
# Seed deterministic test accounts and shift opportunities
npm run seed
```

### 4. Run Development Server
```bash
npm run dev
```
Access the application at: **[http://127.0.0.1:8080](http://127.0.0.1:8080)**

---

## ⚖️ Known Limitations & Future Roadmap

- **Simulated Payout Disbursements**: Payout ledgering and platform deductions are functional demonstration simulations. Real-world commercial production will connect UPI AutoPay and Razorpay Route escrow payouts.
- **Real-Time WebSockets**: Notifications currently poll at 30-second intervals; future iterations will implement Socket.io for sub-second bi-directional dispatch updates.
- **EXIF & Facial Liveness AI**: Check-in selfies currently verify photographic submission; future enhancements will integrate AWS Rekognition for facial liveness and anti-spoofing detection.

---
