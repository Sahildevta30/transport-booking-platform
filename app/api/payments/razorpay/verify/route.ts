import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyRazorpayPaymentSignature } from "@/lib/payments/razorpay";

export async function POST(request:Request){
 try{
  const body=(await request.json()) as {bookingId?:string;razorpay_order_id?:string;razorpay_payment_id?:string;razorpay_signature?:string};
  if(!body.bookingId||!body.razorpay_order_id||!body.razorpay_payment_id||!body.razorpay_signature)return NextResponse.json({error:"Invalid payment response"},{status:400});
  const supabase=await createClient();const{data:{user}}=await supabase.auth.getUser();if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
  const{data:booking}=await supabase.from("bookings").select("id,user_id").eq("id",body.bookingId).eq("user_id",user.id).maybeSingle();if(!booking)return NextResponse.json({error:"Booking not found"},{status:404});
  const{data:payment}=await supabase.from("payments").select("id,provider_order_id").eq("booking_id",body.bookingId).eq("user_id",user.id).eq("provider","RAZORPAY").eq("provider_order_id",body.razorpay_order_id).maybeSingle();
  if(!payment)return NextResponse.json({error:"Payment order does not belong to this booking"},{status:400});
  if(!verifyRazorpayPaymentSignature(body.razorpay_order_id,body.razorpay_payment_id,body.razorpay_signature))return NextResponse.json({error:"Payment verification failed"},{status:400});
  return NextResponse.json({verified:true,paymentId:body.razorpay_payment_id});
 }catch{return NextResponse.json({error:"Unable to verify payment"},{status:500});}
}
