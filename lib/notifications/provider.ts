export type NotificationChannel="EMAIL"|"SMS"|"WHATSAPP";
export interface SendNotificationInput{recipient:string;title:string;message:string;}
export interface SendNotificationResult{providerMessageId:string;}
export interface NotificationProvider{readonly name:string;readonly channel:NotificationChannel;send(input:SendNotificationInput):Promise<SendNotificationResult>;}

/**
 * External delivery adapters are intentionally not implemented here.
 * A real provider must be configured with server-only credentials before
 * EMAIL, SMS, or WHATSAPP notifications can be marked as SENT.
 */
