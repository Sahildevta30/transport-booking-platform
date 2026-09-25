import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { RazorpayProvider } from "@/lib/payments/razorpay";
import { razorpayCheckoutEnabled } from "@/lib/payments/availability";

export async function POST(request: Request) {
  if (!razorpayCheckoutEnabled()) return NextResponse.json({ error: "Online payment is not enabled" }, { status: 503 });
  try {
    const { bookingId } = (await request.json()) as { bookingId?: string };
    if (!bookingId) return NextResponse.json({ error: "Booking is required" }, { status: 400 });
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { data: booking } = await supabase.from("bookings").select("id,user_id,amount,status").eq("id", bookingId).eq("user_id", user.id).maybeSingle();
    if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    if (booking.status !== "PENDING") return NextResponse.json({ error: "Booking is not payable" }, { status: 409 });
    const amount = Math.round(Number(booking.amount) * 100);
    if (!Number.isSafeInteger(amount) || amount <= 0) return NextResponse.json({ error: "Invalid booking amount" }, { status: 409 });
    const { data: paymentId, error: startError } = await supabase.rpc("start_payment", { p_booking_id: booking.id, p_provider: "RAZORPAY" });
    if (startError || !paymentId) return NextResponse.json({ error: "Payment is already active or could not be started" }, { status: 409 });
    try {
      const provider = new RazorpayProvider();
      const payment = await provider.createPayment({ bookingId: booking.id, amountInSmallestUnit: amount, currency: "INR", customerId: user.id });
      const admin = createAdminClient();
      const { error: persistError } = await admin.from("payments").update({ provider_order_id: payment.providerReferenceId, status: "PROCESSING", updated_at: new Date().toISOString() }).eq("id", paymentId).eq("user_id", user.id);
      if (persistError) throw new Error("Unable to persist provider order");
      return NextResponse.json({ orderId: payment.providerReferenceId, keyId: process.env.RAZORPAY_KEY_ID, amount, currency: "INR" });
    } catch (error) {
      const admin = createAdminClient();
      await admin.from("payments").update({ status: "FAILED", failure_message: error instanceof Error ? error.message.slice(0,500) : "Unable to create provider order", updated_at: new Date().toISOString() }).eq("id", paymentId).eq("user_id", user.id);
      throw error;
    }
  } catch { return NextResponse.json({ error: "Unable to start payment" }, { status: 500 }); }
}
