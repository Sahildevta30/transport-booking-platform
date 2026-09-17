import { Button } from "@/components/ui/button";

export function PaymentPanel({amount}:{bookingId:string;amount:number}){
  return <section className="rounded-xl border bg-card p-6"><h2 className="text-xl font-semibold">Payment</h2><p className="mt-2 text-sm text-muted-foreground">Payable amount: ₹{Number(amount).toFixed(2)}</p><p className="mt-4 rounded-lg border border-dashed p-4 text-sm text-muted-foreground" role="status">Online payment is not enabled yet. Your booking remains pending until a real payment provider is configured.</p><Button className="mt-4" disabled>Online payment unavailable</Button></section>;
}
