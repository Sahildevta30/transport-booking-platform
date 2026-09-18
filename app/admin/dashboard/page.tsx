import type { Metadata } from "next";
import { Activity, Bus, CalendarClock, IndianRupee } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
export const metadata: Metadata = { title: "Partner dashboard" };
export default async function Page(){
 const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser();
 const {data:memberships}=user?await supabase.from("organization_memberships").select("organization_id").eq("user_id",user.id):{data:[]};
 const orgIds=(memberships??[]).map(x=>x.organization_id);
 const {data:vehicles}=orgIds.length?await supabase.from("vehicles").select("id,status,organization_id").in("organization_id",orgIds):{data:[]};
 const vehicleIds=(vehicles??[]).map(v=>v.id);
 const {data:trips}=vehicleIds.length?await supabase.from("trips").select("id,status,vehicle_id,base_price,departure_at").in("vehicle_id",vehicleIds):{data:[]};
 const tripIds=(trips??[]).map(t=>t.id);
 const {data:bookings}=tripIds.length?await supabase.from("bookings").select("id,status,amount,trip_id").in("trip_id",tripIds):{data:[]};
 const revenue=(bookings??[]).filter(b=>b.status==="CONFIRMED"||b.status==="COMPLETED").reduce((n,b)=>n+Number(b.amount),0);
 return <div className="space-y-8"><section className="rounded-3xl border bg-gradient-to-br from-card to-muted/50 p-7 shadow-sm"><p className="text-sm font-semibold text-primary">Partner operations</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Your fleet, bookings and trips in one place.</h1><p className="mt-2 max-w-2xl text-muted-foreground">Only data belonging to your organization is shown here.</p></section>
 <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Metric icon={Bus} label="Fleet vehicles" value={(vehicles??[]).length}/><Metric icon={Activity} label="Active vehicles" value={(vehicles??[]).filter(v=>v.status==="active").length}/><Metric icon={CalendarClock} label="Scheduled trips" value={(trips??[]).filter(t=>t.status==="scheduled").length}/><Metric icon={IndianRupee} label="Booked value" value={"₹"+revenue.toFixed(0)}/></div>
 <section className="rounded-2xl border bg-card p-6 shadow-sm"><h2 className="font-semibold">Operations snapshot</h2><div className="mt-5 grid gap-4 sm:grid-cols-3"><Stat label="Bookings" value={(bookings??[]).length}/><Stat label="Confirmed" value={(bookings??[]).filter(b=>b.status==="CONFIRMED").length}/><Stat label="Trips in progress" value={(trips??[]).filter(t=>t.status==="in_progress").length}/></div></section></div>
}
function Metric({icon:Icon,label,value}:{icon:typeof Bus;label:string;value:number|string}){return <div className="rounded-2xl border bg-card p-5 shadow-sm"><Icon className="mb-4 h-5 w-5 text-primary"/><p className="text-3xl font-semibold">{value}</p><p className="mt-1 text-sm text-muted-foreground">{label}</p></div>}
function Stat({label,value}:{label:string;value:number}){return <div className="rounded-xl bg-muted/50 p-4"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-semibold">{value}</p></div>}
