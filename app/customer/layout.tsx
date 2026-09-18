import { redirect } from "next/navigation";
import Link from "next/link";
import { Compass, LayoutDashboard, MapPin, Sparkles, Ticket, User } from "lucide-react";
import { getSessionUser } from "@/lib/auth/session";
import { canAccessAdminArea, canAccessSupervisionArea } from "@/lib/auth/roles";
import { AREA_LOGIN_PATH } from "@/lib/auth/redirects";
import { MobileNav } from "@/components/layout/mobile-nav";

const CUSTOMER_NAV=[{href:"/customer/dashboard",label:"Dashboard",icon:LayoutDashboard},{href:"/search",label:"Explore trips",icon:Compass},{href:"/customer/bookings",label:"My Bookings",icon:Ticket},{href:"/customer/profile",label:"Profile",icon:User}] as const;
const CUSTOMER_MOBILE_NAV=CUSTOMER_NAV.map(({href,label})=>({href,label}));

export default async function CustomerLayout({children}:{children:React.ReactNode}) {
 const user=await getSessionUser();
 // Server-side gate for every /customer/* page. Staff accounts are sent
 // to their own area rather than being shown a customer dashboard whose
 // data (bookings, profile) does not belong to them.
 if(!user) redirect(`${AREA_LOGIN_PATH.customer}?next=/customer/dashboard`);
 if(canAccessSupervisionArea(user.accountType)) redirect("/super-admin");
 if(canAccessAdminArea(user.accountType)) redirect("/admin/dashboard");
 return <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/.12),transparent_28%),hsl(var(--background))]">
  <header className="relative flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-xl md:hidden"><Link href="/" className="flex items-center gap-2 font-bold"><span className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-primary-foreground"><MapPin className="h-4 w-4"/></span>TransitBook</Link><MobileNav links={CUSTOMER_MOBILE_NAV}/></header>
  <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-background/80 p-4 backdrop-blur-xl md:flex md:flex-col">
   <Link href="/" className="flex items-center gap-3 px-2 py-3 text-lg font-bold"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-primary to-blue-400 text-primary-foreground shadow-lg shadow-primary/20"><MapPin className="h-5 w-5"/></span>TransitBook</Link>
   <div className="mx-2 mt-5 rounded-2xl border bg-gradient-to-br from-primary/15 to-transparent p-4"><Sparkles className="h-5 w-5 text-primary"/><p className="mt-2 text-sm font-semibold">Your journey hub</p><p className="mt-1 text-xs text-muted-foreground">Discover, book and manage every trip.</p></div>
   <nav aria-label="Customer" className="mt-6 flex flex-col gap-2">{CUSTOMER_NAV.map(({href,label,icon:Icon})=><Link key={href} href={href} className="group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-muted-foreground transition hover:-translate-y-0.5 hover:bg-primary/10 hover:text-foreground"><span className="grid h-8 w-8 place-items-center rounded-lg bg-muted transition group-hover:bg-primary group-hover:text-primary-foreground"><Icon className="h-4 w-4"/></span>{label}</Link>)}</nav>
   <div className="mt-auto rounded-2xl border bg-card p-4 text-xs text-muted-foreground">Travel smarter with one place for seats, cabs and full vehicles.</div>
  </aside>
  <main className="min-h-screen md:ml-64"><div className="mx-auto max-w-7xl p-5 sm:p-8 lg:p-10">{children}</div></main>
 </div>;
}