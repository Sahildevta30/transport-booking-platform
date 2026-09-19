import { ArrowRightLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Submits a plain GET to /search with exactly the query params that page
 * already reads (from, to, date, passengers) — see
 * app/(public)/search/page.tsx. No JavaScript required for the search
 * itself; this works with JS disabled.
 */
export function RouteSearchForm() {
  return (
    <form
      action="/search"
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_auto_1fr_170px_120px_auto] lg:items-end"
    >
      <div className="space-y-1.5">
        <Label htmlFor="from" className="text-xs font-semibold text-muted-foreground">
          From
        </Label>
        <Input id="from" name="from" placeholder="Departure city" aria-label="From" required />
      </div>

      <div className="hidden items-center justify-center pb-2.5 lg:flex" aria-hidden>
        <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="to" className="text-xs font-semibold text-muted-foreground">
          To
        </Label>
        <Input id="to" name="to" placeholder="Destination city" aria-label="To" required />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="date" className="text-xs font-semibold text-muted-foreground">
          Date
        </Label>
        <Input id="date" name="date" type="date" aria-label="Travel date" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="passengers" className="text-xs font-semibold text-muted-foreground">
          Travellers
        </Label>
        <Input
          id="passengers"
          name="passengers"
          type="number"
          min={1}
          max={50}
          defaultValue={1}
          aria-label="Number of travellers"
        />
      </div>

      <Button type="submit" size="lg" className="w-full gap-2 lg:w-auto">
        <Search className="h-4 w-4" />
        Search
      </Button>
    </form>
  );
}
