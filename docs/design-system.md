# TransitBook design system & capability audit

Written at the start of the dedicated frontend phase (main @ 96fb3ea). Two
purposes: (1) record the design decisions so later pages stay consistent
instead of drifting page-by-page, (2) record exactly what the backend can
and cannot support, so the frontend never fabricates a feature the schema
doesn't back.

## 1. What the backend actually supports (source of truth: `types/database.ts`,
`supabase/migrations/`)

**Booking models that exist:**
- Route/intercity booking: `routes` (fixed `origin_location_id` →
  `destination_location_id`) → `trips` (one scheduled departure on a route +
  vehicle, with `base_price`) → `bookings` with `booking_mode` of
  `SEAT_BOOKING` or `FULL_VEHICLE`.
- Seat booking: `vehicle_seats`, `seat_locks` (TTL-based holds),
  `booking_seats`. Fully implemented with concurrency-safe RPCs
  (`acquire_seat_locks`, `release_seat_locks`, `create_seat_booking`).
- Full-vehicle booking: `create_full_vehicle_booking` — no seat map, books
  the whole vehicle capacity for one party.

**Booking models that do NOT exist — confirmed absent from every table:**
- **Rentals of any kind** (self-drive car/bike with a pickup location and a
  separate return date/time). There is no `pickup_location`, no
  `return_at`/`return_date`, no per-day/per-hour rate, no "self-drive" flag
  anywhere in the schema. A trip is always a scheduled point-to-point
  departure, never an open-ended rental period.
- **Vehicle category taxonomy** (e.g. a fixed "Cab / Bike / Bus / Tempo
  Traveller" enum). `vehicle_types` has exactly two fields: `name` (free
  text a partner types in, e.g. "Sedan", "Volvo AC Sleeper") and
  `booking_mode` (`SEAT_BOOKING` | `FULL_VEHICLE`). There is no controlled
  vocabulary a search filter could reliably match against.
- **Amenities / AC / ratings / reviews / discounts as a general concept.**
  The only real discount-shaped field anywhere is
  `supervision_overview().discount_amount`, which is a computed
  `base_price − booking amount` for Super Admin's own view, not a stored
  promotional field usable on customer-facing cards.
- **Operator/brand display beyond the organization name.** `organizations`
  has only `id`, `name`, timestamps.

**What this means for the frontend (binding for every phase below):**
- The homepage/search booking-mode switch may only offer what the backend
  can serve: **Route / Intercity search**. A "Rental" tab is architected
  in the UI (so it's a one-place change to enable later) but is rendered
  as a clearly-labeled "Coming soon" state, never a working form that
  posts to nowhere. This is a documented product gap, not an oversight.
- "Cabs / Bikes / Buses / Travellers" cannot be real filters against
  today's schema. The header/hero categorize by **`booking_mode`** (Seat
  vs Full Vehicle) plus a **free-text vehicle-type search term** passed to
  `/search`, matched against `vehicle_types.name` — both are real,
  queryable fields. Category labels that imply a taxonomy the database
  can't back are not used as if they were guaranteed filters.
- No star ratings, review counts, "X% off", or "popular" badges are
  rendered anywhere, per the no-fabrication requirement — there is
  nothing in the schema to back any of them honestly.

## 2. Visual design system

**Palette** (`app/globals.css`): deep teal-blue primary (`--primary`,
`hsl(200 98% 24%)`) for trust/booking-confirmed actions, warm coral accent
(`--accent`, `hsl(14 88% 58%)`) for price emphasis and primary CTAs — a
deliberate departure from the indigo-and-amber shadcn default so the
product doesn't read as an unstyled template. Warm off-white background
(`hsl(40 33% 98%)`) instead of pure white, closer to how Airbnb-style
marketplaces avoid a stark/clinical feel.

**Typography**: `@fontsource-variable/manrope`, self-hosted (no Google
Fonts network fetch — keeps the previous system-font choice's offline-safe
property while giving the marketplace a distinctive display face). Variable
font, so headings can use heavier weights without a second file.
`letter-spacing: -0.02em` on `h1`–`h3` for a tighter, more premium
headline feel.

**Tokens added beyond the original shadcn set:**
- `--gradient-hero` / `.bg-gradient-hero` — the one place a strong gradient
  is allowed (hero sections), not sprinkled across every card.
- `--gradient-accent` / `.bg-gradient-accent` — reserved for a small number
  of high-emphasis CTAs, not general decoration.
- `--shadow-elevated` / `.shadow-elevated` and `--shadow-card` /
  `.shadow-card` — two elevation levels instead of ad-hoc `shadow-sm`
  everywhere, for a consistent depth hierarchy between resting cards and
  elevated/hovered ones.
- `--mode-seat` / `--mode-full-vehicle` (`--color-mode-seat` /
  `--color-mode-full-vehicle` as Tailwind utilities) — one fixed color per
  booking mode, used consistently anywhere seat-vs-full-vehicle status is
  shown (search results, seat map legend, booking summary), so the same
  color always means the same thing across the product instead of being
  re-decided per page.
- `--radius` raised to `1rem` (from `0.625rem`) with an added `--radius-xl`
  step, for the rounder, softer geometry the brief asks for.

**What NOT to do** (explicit anti-goals from the product brief, kept here
so later phases don't drift): no rainbow/neon combinations, no stacking
multiple gradients or glass/blur effects on the same element, no decorative
UI with no function, no fabricated ratings/discounts/availability/"popular"
claims, no admin-dashboard card style bleeding into customer-facing pages.

## 3. Component reuse policy

Existing shadcn primitives (`components/ui/{button,card,badge,input,label}`)
are kept and extended, not replaced — they already correctly read the
token system above. New marketplace-specific components (search form,
result cards, seat map, mode switch) are built as their own components in
`components/marketplace/` (customer-facing) so they stay clearly separated
from `components/ui/` (low-level primitives) and `components/admin/`
(operational, deliberately different visual language per the partner/admin
requirement).
