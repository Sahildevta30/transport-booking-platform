# AI Architecture

## Principle

AI assists; it never becomes the source of truth. It never has
uncontrolled direct database access, and it never invents availability,
price, vehicle, booking, or payment status.

## Intended flow (not implemented in Phase 1)

```
User (free text, possibly mixed-language)
  │  e.g. "Mujhe Friday ko Rourkela se Bhubaneswar jaana hai,
  │        4 log hain aur ₹1000 ke andar chahiye."
  ▼
AI Service (lib/ai/provider.ts → AiProvider.parseSearchIntent)
  │  extracts: { origin, destination, date, passengerCount, maxBudget }
  ▼
Real search engine (lib/routes/, lib/vehicles/, lib/pricing/)
  │  checks real routes, real schedules, real availability, real pricing
  ▼
Search results shown to user (grounded in real data only)
```

The `AiProvider` interface's single method returns *structured intent*,
never a result set. `unimplementedAiProvider` (the current placeholder)
throws rather than fabricating fields — a stub that fails loudly is
safer than one that quietly returns made-up data.

## Provider abstraction

`lib/ai/provider.ts` is written against an interface, not a specific
vendor SDK, so the app isn't hard-coded to one AI provider. Swapping
providers later means implementing `AiProvider` again, not rewriting
every call site.

## Future capabilities (roadmap, not built yet)

Smart search, personalized recommendations, user behavior analysis,
route/vehicle recommendations, demand forecasting, vehicle utilization
prediction, cancellation prediction, and natural-language search all
build on this same boundary. The `recommendations` and `ai_insights`
tables in the domain model (see
[domain model](../database/domain-model.md)) exist as placeholders for
this future work — no code writes to them yet.

## What Phase 1 deliberately does not do

No natural-language search is implemented. No recommendations are
generated, fake or otherwise. No AI provider is called from any code
path yet.
