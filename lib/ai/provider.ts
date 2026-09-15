/**
 * AI service boundary (see docs/architecture/ai-architecture.md).
 *
 * Nothing in this file calls a real model yet — Phase 1 only establishes
 * the shape so future AI features (smart search, recommendations, demand
 * forecasting) plug in without restructuring the app.
 *
 * The non-negotiable rule this interface encodes: AI never talks to the
 * database directly, and it never invents availability, price, vehicle,
 * booking, or payment status. It extracts structured intent; the real
 * search/booking/pricing engines are the only source of truth for actual
 * data. See the parse → real-engine flow below.
 */

export interface NaturalLanguageSearchIntent {
  origin?: string;
  destination?: string;
  date?: string; // ISO 8601
  passengerCount?: number;
  maxBudget?: number;
  currency?: string;
  vehicleTypePreference?: string;
}

export interface AiProvider {
  readonly name: string;
  /**
   * Extracts structured search parameters from free-text input (e.g. mixed
   * Hindi/English queries like the example in the Phase 1 brief). Returns
   * best-effort structured fields only — never a search result. The
   * caller is responsible for running those fields through the real
   * search engine (routes, schedules, availability, pricing).
   */
  parseSearchIntent(rawQuery: string): Promise<NaturalLanguageSearchIntent>;
}

/**
 * No-op placeholder so call sites can be wired up without a live provider.
 * Throws rather than returning fabricated data — a stub that "succeeds"
 * with made-up fields would be worse than one that fails loudly.
 */
export const unimplementedAiProvider: AiProvider = {
  name: "unimplemented",
  async parseSearchIntent() {
    throw new Error(
      "AI natural-language search is not implemented yet (planned for a post-Phase-1 milestone). Use the structured search form instead.",
    );
  },
};
