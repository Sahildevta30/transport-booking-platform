import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { RazorpayProvider } from "@/lib/payments/razorpay";

type RazorpayWebhook={event?:string;payload?:{payment?:{entity?:{id?:string;order_id?:string;status?:string;error_code?:string;error_description?:string}};refund?:{entity?:{id?:string;payment_id?:string;status?:string}}}};

export async function POST(request: Request) {
  const rawBody=await request.text();
  const signature=request.headers.get("x-razorpay-signature")??"";
  const provider=new RazorpayProvider();
  if(!provider.verifyWebhookSignature(rawBody,signature))return NextResponse.json({error:"Invalid signature"},{status:400});
  let event:RazorpayWebhook;try{event=JSON.parse(rawBody) as RazorpayWebhook;}catch{return NextResponse.json({error:"Invalid payload"},{status:400});}
  const eventId=request.headers.get("x-razorpay-event-id")??`${event.event??"unknown"}:${signature.slice(0,32)}`;
  const paymentEntity=event.payload?.payment?.entity;const refundEntity=event.payload?.refund?.entity;
  const orderId=paymentEntity?.order_id;
  const admin=createAdminClient();
  let paymentId:string|null=null;
  if(orderId){const {data}=await admin.from("payments").select("id").eq("provider","RAZORPAY").eq("provider_order_id",orderId).maybeSingle();paymentId=data?.id??null;}
  if(!paymentId&&refundEntity?.payment_id){const {data}=await admin.from("payments").select("id").eq("provider","RAZORPAY").eq("provider_payment_id",refundEntity.payment_id).maybeSingle();paymentId=data?.id??null;}
  const {error:eventError}=await admin.from("payment_events").insert({payment_id:paymentId,provider:"RAZORPAY",provider_event_id:eventId,event_type:event.event??"unknown",payload:event as never,processed_at:null});
  if(eventError){if(eventError.code==="23505")return NextResponse.json({ok:true,duplicate:true});return NextResponse.json({error:"Unable to record event"},{status:500});}
  if(paymentId){const now=new Date().toISOString();if(event.event==="payment.captured"&&paymentEntity?.id){await admin.from("payments").update({provider_payment_id:paymentEntity.id,status:"SUCCESS",paid_at:now,failure_code:null,failure_message:null,updated_at:now}).eq("id",paymentId);}else if(event.event==="payment.failed"){await admin.from("payments").update({provider_payment_id:paymentEntity?.id??null,status:"FAILED",failure_code:paymentEntity?.error_code??null,failure_message:paymentEntity?.error_description?.slice(0,500)??"Payment failed",updated_at:now}).eq("id",paymentId);}else if(event.event==="refund.processed"){await admin.from("payments").update({status:"REFUNDED",updated_at:now}).eq("id",paymentId);}else if(event.event==="refund.failed"){await admin.from("payments").update({status:"REFUND_PENDING",updated_at:now}).eq("id",paymentId);}await admin.from("payment_events").update({processed_at:now}).eq("provider","RAZORPAY").eq("provider_event_id",eventId);}
  return NextResponse.json({ok:true});
}
