import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, Search, Ticket, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Dashboard" };

export default async function CustomerDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/customer/dashboard");

  const [{ data: profile }, { data: bookings }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
    supabase.from("bookings").select("id,status,amount,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
  ]);

  const rows = bookings ?? [];
  const active = rows.filter((b) => !["COMPLETED", "CANCELLED"].includes(String(b.status))).length;
  const bookedValue = rows.reduce((sum, b) => sum + Number(b.amount ?? 0), 0);
  const name = profile?.full_name?.trim() || user.email?.split("@")[0] || "Traveller";

  return <div className="space-y-8">
    <section className="overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/10 via-card to-card p-7 shadow-sm sm:p-10">
      <p className="text-sm font-medium text-primary">Customer dashboard</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Welcome back, {name}</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">Search transport, manage your reservations and keep your upcoming travel in one place.</p>
      <div className="mt-6 flex flex-wrap gap-3"><Button asChild><Link href="/search"><Search className="mr-2 h-4 w-4"/>Search trips</Link></Button><Button asChild variant="outline"><Link href="/customer/bookings"><Ticket className="mr-2 h-4 w-4"/>My bookings</Link></Button></div>
    </section>
    <section className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-2xl border bg-card p-5"><Ticket className="h-5 w-5 text-primary"/><p className="mt-4 text-3xl font-semibold">{rows.length}</p><p className="text-sm text-muted-foreground">Recent bookings</p></div>
      <div className="rounded-2xl border bg-card p-5"><CalendarDays className="h-5 w-5 text-primary"/><p className="mt-4 text-3xl font-semibold">{active}</p><p className="text-sm text-muted-foreground">Active / upcoming</p></div>
      <div className="rounded-2xl border bg-card p-5"><Wallet className="h-5 w-5 text-primary"/><p className="mt-4 text-3xl font-semibold">₹{bookedValue.toFixed(0)}</p><p className="text-sm text-muted-foreground">Recent booked value</p></div>
    </section>
    <section><div className="mb-4 flex items-center justify-between"><div><h2 className="text-xl font-semibold">Recent bookings</h2><p className="text-sm text-muted-foreground">Your latest reservations and their current status.</p></div><Button asChild variant="ghost"><Link href="/customer/bookings">View all</Link></Button></div>
    {!rows.length ? <div className="rounded-2xl border border-dashed p-10 text-center"><Ticket className="mx-auto h-8 w-8 text-muted-foreground"/><p className="mt-3 font-medium">No bookings yet</p><p className="mt-1 text-sm text-muted-foreground">Your first reservation will appear here.</p><Button asChild className="mt-5"><Link href="/search">Find a trip</Link></Button></div> :
    <div className="grid gap-3">{rows.map((b)=><Link key={b.id} href={`/customer/bookings/${b.id}`} className="flex items-center justify-between rounded-2xl border bg-card p-5 transition hover:bg-muted/40"><div><p className="font-medium">Booking {b.id.slice(0,8).toUpperCase()}</p><p className="text-sm text-muted-foreground">{new Date(b.created_at).toLocaleDateString()} · {b.status}</p></div><p className="font-semibold">₹{Number(b.amount).toFixed(2)}</p></Link>)}</div>}
    </section>
  </div>;
}
