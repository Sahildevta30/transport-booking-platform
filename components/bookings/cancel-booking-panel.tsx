"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function CancelBookingPanel({bookingId}:{bookingId:string}){
  const router=useRouter();
  const [reason,setReason]=useState("");
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState<string|null>(null);
  async function cancel(){
    if(!window.confirm("Cancel this booking? Released seats may become available to other customers."))return;
    setBusy(true);setMessage(null);
    try{
      const supabase=createClient();
      const {data,error}=await supabase.rpc("cancel_booking",{p_booking_id:bookingId,p_reason:reason.trim()||undefined});
      if(error)throw error;
      setMessage(data==="REFUND_PENDING"?"Booking cancelled. Refund is pending.":"Booking cancelled successfully.");
      router.refresh();
    }catch(e){setMessage(e instanceof Error?e.message:"Could not cancel booking.");}
    finally{setBusy(false);}
  }
  return <section className="rounded-xl border bg-card p-6"><h2 className="text-xl font-semibold">Cancel booking</h2><p className="mt-2 text-sm text-muted-foreground">Cancellation is allowed only before departure. If a successful payment exists, the booking moves to refund pending.</p><label className="mt-4 block text-sm font-medium" htmlFor="cancel-reason">Reason (optional)</label><textarea id="cancel-reason" className="mt-2 min-h-24 w-full rounded-md border bg-background p-3 text-sm" value={reason} maxLength={500} onChange={e=>setReason(e.target.value)} placeholder="Tell us why you are cancelling"/><Button className="mt-4" variant="destructive" disabled={busy} onClick={cancel}>{busy?"Cancelling…":"Cancel booking"}</Button>{message?<p className="mt-3 text-sm" role="status">{message}</p>:null}</section>;
}
