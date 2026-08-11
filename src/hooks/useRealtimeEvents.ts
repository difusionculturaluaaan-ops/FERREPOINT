'use client';

import { useEffect, useRef } from 'react';
import { AppEventPayload } from '@/lib/eventEmitter';

export function useRealtimeEvents(
 businessId: string,
 onEvent: (event: AppEventPayload) => void
) {
 const onEventRef = useRef(onEvent);

 useEffect(() => {
 onEventRef.current = onEvent;
 }, [onEvent]);

 useEffect(() => {
 if (!businessId) return;

 console.log('[useRealtimeEvents] Connecting SSE for business:', businessId);
 const eventSource = new EventSource(`/api/events?businessId=${encodeURIComponent(businessId)}`);

 eventSource.onmessage = (e) => {
 try {
 const payload: AppEventPayload = JSON.parse(e.data);
 if (payload.type !== 'CONNECTED') {
 console.log('[useRealtimeEvents] Event received:', payload);
 if (onEventRef.current) {
 onEventRef.current(payload);
 }
 }
 } catch (err) {
 console.error('[useRealtimeEvents] Error parsing event data:', err);
 }
 };

 eventSource.onerror = (err) => {
 console.warn('[useRealtimeEvents] EventSource error, reconnecting...', err);
 };

 return () => {
 console.log('[useRealtimeEvents] Closing EventSource');
 eventSource.close();
 };
 }, [businessId]);
}
