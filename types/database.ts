export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type AccountType = "CUSTOMER" | "ADMIN" | "STAFF";
type BookingMode = "SEAT_BOOKING" | "FULL_VEHICLE_BOOKING" | "BOTH";
type VehicleStatus = "active" | "maintenance" | "inactive";

type Table<Row, Insert = Partial<Row>, Update = Partial<Insert>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      profiles: Table<
        { id: string; account_type: AccountType; full_name: string | null; phone: string | null; created_at: string; updated_at: string },
        { id: string; account_type?: AccountType; full_name?: string | null; phone?: string | null; created_at?: string; updated_at?: string }
      >;
      organizations: Table<
        { id: string; name: string; created_at: string; updated_at: string },
        { id?: string; name: string; created_at?: string; updated_at?: string }
      >;
      vehicle_types: Table<
        { id: string; name: string; booking_mode: BookingMode; created_at: string; updated_at: string },
        { id?: string; name: string; booking_mode: BookingMode; created_at?: string; updated_at?: string }
      >;
      vehicles: Table<
        { id: string; organization_id: string; vehicle_type_id: string; label: string; registration_number: string; seat_capacity: number | null; status: VehicleStatus; created_at: string; updated_at: string },
        { id?: string; organization_id: string; vehicle_type_id: string; label: string; registration_number: string; seat_capacity?: number | null; status?: VehicleStatus; created_at?: string; updated_at?: string }
      >;
      vehicle_seats: Table<
        { id: string; vehicle_id: string; seat_number: string; seat_type: string | null; created_at: string; updated_at: string },
        { id?: string; vehicle_id: string; seat_number: string; seat_type?: string | null; created_at?: string; updated_at?: string }
      >;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      account_type: AccountType;
      booking_mode: BookingMode;
      vehicle_status: VehicleStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}
