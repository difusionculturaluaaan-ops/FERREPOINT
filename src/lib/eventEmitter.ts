import { EventEmitter } from 'events';

// Global singleton instance for event bus
declare global {
 var __ferrepoint_emitter: EventEmitter | undefined;
}

export const appEmitter = global.__ferrepoint_emitter || new EventEmitter();
appEmitter.setMaxListeners(100);

if (process.env.NODE_ENV !== 'production') {
 global.__ferrepoint_emitter = appEmitter;
}

export interface AppEventPayload {
 type: 'ORDER_CREATED' | 'ORDER_PAID' | 'SURTIDO_UPDATED' | 'DELIVERY_UPDATED' | 'CONNECTED';
 businessId: string;
 locationId?: string;
 data: any;
 timestamp: string;
}

export function broadcastAppEvent(event: AppEventPayload) {
 try {
 console.log(`[EventEmitter] Broadcasting event ${event.type} for business ${event.businessId}`);
 appEmitter.emit('app_event', event);
 } catch (err) {
 console.error('[EventEmitter] Broadcast error:', err);
 }
}
