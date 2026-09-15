# Booking domain

Owns seat booking and whole-vehicle booking logic: seat locking/inventory, booking state transitions, and passenger management. Will consume lib/vehicles, lib/routes, and lib/pricing rather than duplicating their logic.

Nothing here is implemented yet — this module exists so Phase 2 has a clear
home to build in, without restructuring the app around it later.
