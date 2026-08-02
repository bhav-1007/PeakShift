# PeakShift
 
**Making labor as flexible as demand itself.**
 
PeakShift is a full-stack marketplace that connects businesses facing short, predictable demand spikes — a dinner rush at a cloud kitchen, a weekend crowd at a retail store, a multiplex on release night — with verified workers looking for flexible, short-duration shifts (2–4 hours).
 
🔗 **Live app:** [peakshift-rnho.onrender.com](https://peakshift-rnho.onrender.com/)
 
---
 
## The Problem
 
Peak-hour demand is predictable but temporary. Businesses either overstaff permanently (wasted cost) or understaff during rushes (lost revenue, poor service). Meanwhile, a large pool of workers want short, flexible shifts but have no structured way to find them nearby. PeakShift is the matching layer between the two.
 
## Product Walkthrough
 
1. **Create a shift** — A business posts role, location, pay rate, timing, and headcount for a demand spike.
2. **Match verified workers** — Workers discover nearby shifts filtered by location, pay, and skill tags.
3. **Complete the shift and get reviewed** — Once the shift wraps, workers can leave and receive reviews that build trust for future matches.
**Live listings today** span cloud kitchens, cafes, retail stores, pharmacies, multiplex cinemas, and event crews — all in the ₹140–180/hr range, concentrated in Bengaluru, Mumbai, Pune, Delhi NCR, and Kolkata.
 
## Key Features
 
| Feature | Implementation |
|---|---|
| Location-aware listings | Geo-coordinates per listing (`geometry`), searchable by market/city |
| Search & filter | Full-text-style search across role/business/location + price range filtering, server-side pagination |
| Auth | Session-based auth with Passport.js local strategy; passwords hashed and salted via `passport-local-mongoose` |
| Persistent sessions | Sessions stored in MongoDB (`connect-mongo`), surviving server restarts — not just in-memory |
| Image uploads | Listing photos uploaded directly to Cloudinary via Multer, no local disk storage (production-safe for ephemeral hosts) |
| Server-side validation | Joi schemas validate all listing/review/booking payloads before they touch the database |
| Reviews & trust | Workers can leave reviews on completed shifts, feeding into a trust/history signal |
| Bookings | Workers claim open shifts; businesses track fill status |
| Robust error handling | Centralized Express error middleware + custom `ExpressError` class + `wrapAsync` to eliminate repetitive try/catch in async routes |
 
## Architecture
 
```
PeakShift/
├── app.js                 # App bootstrap: middleware, session/auth config, route mounting
├── controllers/           # Business logic, separated from routing
├── models/                # Mongoose schemas — User, Listing, Review, Booking
├── routes/                # Express routers (listings, reviews, bookings, dashboard, users)
├── views/                 # EJS templates with shared layout (ejs-mate)
├── public/                # Static assets
└── utils/                 # ExpressError, wrapAsync — shared error-handling utilities
```
 
**Design decisions worth noting:**
- **MVC-style separation** — routes stay thin; logic lives in controllers, keeping route files readable as the app grows.
- **Async error handling without repetition** — a `wrapAsync` higher-order function wraps every async route handler, forwarding rejected promises to Express's error middleware instead of requiring try/catch in every controller.
- **Stateless-friendly image handling** — using Cloudinary (not local disk) means the app can run on ephemeral/restart-prone hosting (Render free tier) without losing uploaded images.
- **Database-backed sessions** — chosen over in-memory sessions specifically because Render's free tier spins down idle instances; in-memory sessions would log every user out on every cold start.
## Tech Stack
 
**Backend:** Node.js · Express 5 · MongoDB · Mongoose
**Auth:** Passport.js (local strategy) · passport-local-mongoose · express-session · connect-mongo
**Views:** EJS · ejs-mate · Bootstrap 5
**Media:** Cloudinary · Multer
**Validation:** Joi
**Deployment:** Render (Node web service) · MongoDB Atlas
 
## Running Locally
 
```bash
git clone <repo-url>
cd PeakShift
npm install
```
 
Create a `.env` file:
```env
ATLAS_URL=your_mongodb_connection_string
SESSION_SECRET=your_session_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_KEY=your_api_key
CLOUDINARY_SECRET=your_api_secret
```
 
```bash
npm start
```
App runs at `http://127.0.0.1:8080`.
