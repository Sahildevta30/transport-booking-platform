import type {SupabaseClient} from "@supabase/supabase-js";
import type {Database,Json} from "@/types/database";

export const ANALYTICS_EVENTS=["search_performed","route_viewed","trip_viewed","vehicle_viewed","seat_selected","booking_started","booking_abandoned","booking_completed","booking_cancelled","recommendation_viewed","recommendation_clicked"] as const;
export type AnalyticsEvent=(typeof ANALYTICS_EVENTS)[number];
export interface AnalyticsPayload{event:AnalyticsEvent;properties?:Record<string,Json>;sessionId?:string;}

/** Records only allow-listed product events. Never include secrets, credentials, payment data or sensitive free text in properties. */
export async function trackEvent(supabase:SupabaseClient<Database>,payload:AnalyticsPayload):Promise<void>{
 const {data:{user}}=await supabase.auth.getUser();
 const {error}=await supabase.from("analytics_events").insert({event_type:payload.event,user_id:user?.id??null,session_id:payload.sessionId??null,properties:payload.properties??{}});
 if(error&&process.env.NODE_ENV==="development") console.debug("[analytics:error]",payload.event,error.code);
}
