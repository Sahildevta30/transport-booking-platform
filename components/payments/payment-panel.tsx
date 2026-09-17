"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function PaymentPanel({bookingId,amount}:{bookingId:string;amount:number}){
  const [busy,setBusy]=useState(false); const [message,setMessage]=useState<string|null>(null);
  async function start(){setBusy(true);setMessage(null);try{
    const supabase=createClient();
    const {data,error}=await supabase.rpc("start_payment",{p_booking_id:bookingId,p_provider:"MANUAL"});
    if(error) throw error;
    setMessage(`Payment request ${String(data).slice(0,8).toUpperCase()} created. Online gateway will activate after provider credentials are configured.`);
  }catch(e){setMessage(e instanceof Error?e.message:"Could not start payment.");}finally{setBusy(false)}}
  return <section className="rounded-xl border bg-card p-6"><h2 className="text-xl font-semibold">Payment</h2><p className="mt-2 text-sm text-muted-foreground">Payable amount: ₹{Number(amount).toFixed(2)}</p><Button className="mt-4" disabled={busy} onClick={start}>{busy?"Preparing payment…":"Proceed to payment"}</Button>{message?<p className="mt-3 text-sm" role="status">{message}</p>:null}</section>
}
