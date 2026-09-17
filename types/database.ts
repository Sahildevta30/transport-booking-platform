export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type AccountType = "CUSTOMER" | "ADMIN" | "STAFF";
type BookingMode = "SEAT_BOOKING" | "FULL_VEHICLE_BOOKING" | "BOTH";
type VehicleStatus = "active" | "maintenance" | "inactive";
type TripStatus = "scheduled" | "in_progress" | "completed" | "cancelled";

type Table<Row, Insert = Partial<Row>, Update = Partial<Insert>> = { Row: Row; Insert: Insert; Update: Update; Relationships: [] };

export interface Database {
  public: {
    Tables: {
      profiles: Table<{ id: string; account_type: AccountType; full_name: string | null; phone: string | null; created_at: string; updated_at: string }, { id: string; account_type?: AccountType; full_name?: string | null; phone?: string | null; created_at?: string; updated_at?: string }>;
      organizations: Table<{ id: string; name: string; created_at: string; updated_at: string }, { id?: string; name: string; created_at?: string; updated_at?: string }>;
      vehicle_types: Table<{ id: string; name: string; booking_mode: BookingMode; created_at: string }, { id?: string; name: string; booking_mode: BookingMode; created_at?: string }>;
      vehicles: Table<{ id: string; organization_id: string; vehicle_type_id: string; registration_number: string; label: string; seat_capacity: number | null; status: VehicleStatus; created_at: string; updated_at: string }, { id?: string; organization_id: string; vehicle_type_id: string; registration_number: string; label: string; seat_capacity?: number | null; status?: VehicleStatus; created_at?: string; updated_at?: string }>;
      vehicle_seats: Table<{ id: string; vehicle_id: string; seat_number: string; seat_type: string | null; created_at: string }, { id?: string; vehicle_id: string; seat_number: string; seat_type?: string | null; created_at?: string }>;
      locations: Table<{ id: string; name: string; city: string | null; state: string | null; latitude: number | null; longitude: number | null; created_at: string }, { id?: string; name: string; city?: string | null; state?: string | null; latitude?: number | null; longitude?: number | null; created_at?: string }>;
      routes: Table<{ id: string; organization_id: string; origin_location_id: string; destination_location_id: string; name: string; distance_km: number | null; created_at: string; updated_at: string }, { id?: string; organization_id: string; origin_location_id: string; destination_location_id: string; name: string; distance_km?: number | null; created_at?: string; updated_at?: string }>;
      route_stops: Table<{ id: string; route_id: string; location_id: string; stop_order: number; is_pickup: boolean; is_drop: boolean; created_at: string }, { id?: string; route_id: string; location_id: string; stop_order: number; is_pickup?: boolean; is_drop?: boolean; created_at?: string }>;
      trips: Table<{ id: string; route_id: string; vehicle_id: string; departure_at: string; arrival_at: string | null; status: TripStatus; base_price: number; created_at: string; updated_at: string }, { id?: string; route_id: string; vehicle_id: string; departure_at: string; arrival_at?: string | null; status?: TripStatus; base_price: number; created_at?: string; updated_at?: string }>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: { account_type: AccountType; booking_mode: BookingMode; vehicle_status: VehicleStatus; trip_status: TripStatus };
    CompositeTypes: Record<string, never>;
  };
}
