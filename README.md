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
| Login & signup | Session-based auth with Passport.js local strategy; passwords hashed and salted via `passport-local-mongoose` |
| Location-aware listings | Geo-coordinates per listing (`geometry`), searchable by market/city |
| Search & filter | Search across role/business/location + price range filtering, server-side pagination |
| Shift scheduling | Each listing carries a specific shift date, start time, and end time, not just a vague availability window |
| Shift requests & acceptance | Workers request open shifts; businesses accept/manage fill status via bookings |
| Reviews | Workers can leave reviews on completed shifts, feeding into a trust/history signal |
| Watchlist | Workers can save listings to a wishlist to revisit later instead of re-searching |
| Dashboard | Centralized view for a user to track their own listings, bookings, and activity |
| Trash (soft delete) | Listings are archived (`deleted` / `deletedAt`) rather than hard-deleted, and can be restored from a dedicated trash view |
| Persistent sessions | Sessions stored in MongoDB (`connect-mongo`), surviving server restarts — not just in-memory |
| Image uploads | Listing photos uploaded directly to Cloudinary via Multer, no local disk storage (production-safe for ephemeral hosts) |
| Server-side validation | Joi schemas validate all listing/review/booking payloads before they touch the database |
| Robust error handling | Centralized Express error middleware + custom `ExpressError` class + `wrapAsync` to eliminate repetitive try/catch in async routes |
 
## Architecture
 
```
PeakShift/
├── app.js                     # App bootstrap: middleware, session/auth config, route mounting
├── cloudConfig.js               # Cloudinary + Multer storage configuration
├── middleware.js                 # Shared route middleware (auth checks, ownership checks, etc.)
├── schema.js                      # Joi validation schemas
├── routes/
│   ├── listing.js                  # Listing routes → controllers/listings.js
│   ├── booking.js                   # Booking routes → controllers/bookings.js
│   ├── review.js                     # Review routes → controllers/review.js
│   ├── dashboard.js                   # Dashboard routes → controllers/dashboard.js
│   └── user.js                         # Auth routes → controllers/user.js
├── controllers/
│   ├── listings.js                 # Listing CRUD, search/filter, wishlist, trash logic
│   ├── bookings.js                  # Shift booking request & management logic
│   ├── review.js                     # Review creation/deletion logic
│   ├── dashboard.js                   # Dashboard aggregation logic
│   ├── user.js                         # Signup, login, logout logic
│   └── home.js                          # Landing page logic
├── models/                     # Mongoose schemas — User, Listing, Review, Booking
├── init/
│   ├── data.js                     # Seed data for local/demo database
│   └── index.js                     # Seed script entry point
├── views/
│   ├── listings/                   # index, show, new, edit, my, trash, wishlist
│   ├── bookings/                     # my, new
│   ├── dashboard/                     # index
│   ├── users/                          # login, signup
│   ├── includes/                        # navbar, footer, flash partials
│   ├── layouts/                          # boilerplate layout (ejs-mate)
│   ├── home.ejs
│   └── error.ejs
├── utils/
│   ├── ExpressError.js           # Custom error class
│   ├── wrapAsync.js                # Async route wrapper
│   └── geocode.js                    # Converts listing location text into map coordinates
└── public/                     # Static CSS/JS assets
```
 
**Design decisions worth noting:**
- **Routes stay thin** — routing files only wire up HTTP verbs and paths; all business logic lives in `controllers/`, keeping each layer easy to reason about independently.
- **Async error handling without repetition** — a `wrapAsync` higher-order function wraps every async controller, forwarding rejected promises to Express's error middleware instead of requiring try/catch everywhere.
- **Server-side geocoding** — listing locations are converted to map coordinates via a dedicated `geocode.js` utility, keeping that logic out of controllers.
- **Stateless-friendly image handling** — using Cloudinary (not local disk) means the app can run on ephemeral/restart-prone hosting (Render free tier) without losing uploaded images.
- **Database-backed sessions** — chosen over in-memory sessions specifically because Render's free tier spins down idle instances; in-memory sessions would log every user out on every cold start.
- **Soft delete over hard delete** — listings are archived (`deleted` / `deletedAt`) and recoverable from a trash view, instead of being permanently removed on deletion.
- **Seeded, reproducible data** — an `init/` script seeds realistic demo listings, so the app is fully explorable without manual data entry.
## Tech Stack
 
| Layer | Technologies |
|---|---|
| Backend | Node.js · Express 5 · MongoDB · Mongoose |
| Auth | Passport.js (local strategy) · passport-local-mongoose · express-session · connect-mongo |
| Views | EJS · ejs-mate · Bootstrap 5 |
| Media | Cloudinary · Multer |
| Validation | Joi |
| Deployment | Render (Node web service) · MongoDB Atlas |
 
