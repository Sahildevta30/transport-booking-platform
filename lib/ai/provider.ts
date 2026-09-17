export interface NaturalLanguageSearchIntent{origin?:string;destination?:string;date?:string;time?:string;passengerCount?:number;maxBudget?:number;currency?:string;vehicleTypePreference?:string;bookingMode?:"SEAT_BOOKING"|"FULL_VEHICLE_BOOKING";}
export interface RecommendationContext{userId?:string;originId?:string;destinationId?:string;tripIds:string[];}
export interface TripRecommendation{tripId:string;reason:string;}
export interface AiProvider{readonly name:string;parseSearchIntent(rawQuery:string):Promise<NaturalLanguageSearchIntent>;recommendTrips(context:RecommendationContext):Promise<TripRecommendation[]>;}

/** AI is advisory only: availability, fares, seats, trips, bookings and payments always come from the real application engines/database. */
export const unimplementedAiProvider:AiProvider={name:"unimplemented",async parseSearchIntent(){throw new Error("AI provider is not configured. Use structured search.");},async recommendTrips(){throw new Error("AI provider is not configured. Recommendations are unavailable.");}};
