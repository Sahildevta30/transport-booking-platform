import type { Metadata } from "next";
import { CheckCircle2, RotateCcw } from "lucide-react";

export const metadata: Metadata = {
  title: "Cancellation Policy",
};

// Content here must match the actual cancel_booking() / refund-webhook
// behavior exactly (see supabase/migrations/202609180007 and
// 202609190001) -- this replaced a stub that said the refund flow was
// still "finalized once the refunds domain and payment provider are
// selected", which stopped being true once that work shipped. No tiered
// refund percentages or cancellation fees are described because none
// exist in the schema -- cancellation is either a full refund of what was
// actually paid, or nothing if nothing was paid.
const POINTS = [
  "You can cancel any booking any time before the trip's scheduled departure — there is no cutoff window or cancellation fee.",
  "If you had already paid successfully, a refund for the full amount paid is initiated automatically as soon as you cancel.",
  "If you had not completed payment yet, cancelling simply releases your seat or vehicle hold with nothing to refund.",
  "Refunds are processed by Razorpay back to your original payment method. Processing time depends on your bank or card issuer once Razorpay confirms it.",
  "Once a trip has already departed, it can no longer be cancelled from your account.",
] as const;

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <RotateCcw className="h-10 w-10 text-primary" aria-hidden />
      <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
        Cancellation Policy
      </h1>
      <p className="mt-2 text-muted-foreground">
        What happens when you cancel a booking, in plain terms.
      </p>
      <ul className="mt-8 space-y-4">
        {POINTS.map((point) => (
          <li key={point} className="flex gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
            <span className="text-sm leading-6 text-foreground/90">{point}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
