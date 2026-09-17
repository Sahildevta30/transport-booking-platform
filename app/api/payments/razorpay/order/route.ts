import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { RazorpayProvider } from "@/lib/payments/razorpay";

export async function POST(request: Request) {
  try {
    const { bookingId } = (await request.json()) as { bookingId?: string };
    if (!bookingId) return NextResponse.json({ error: "Booking is required" }, { status: 400 });
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { data: booking } = await supabase.from("bookings").select("id,user_id,total_amount,status").eq("id", bookingId).eq("user_id", user.id).maybeSingle();
    if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    if (booking.status === "CANCELLED") return NextResponse.json({ error: "Cancelled booking cannot be paid" }, { status: 409 });
    const amount = Math.round(Number(booking.total_amount) * 100);
    if (!Number.isSafeInteger(amount) || amount <= 0) return NextResponse.json({ error: "Invalid booking amount" }, { status: 409 });
    const provider = new RazorpayProvider();
    const payment = await provider.createPayment({ bookingId: booking.id, amountInSmallestUnit: amount, currency: "INR", customerId: user.id });
    return NextResponse.json({ orderId: payment.providerReferenceId, keyId: process.env.RAZORPAY_KEY_ID, amount, currency: "INR" });
  } catch { return NextResponse.json({ error: "Unable to start payment" }, { status: 500 }); }
}
