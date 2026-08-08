import { NextRequest } from 'next/server';
import { appEmitter, AppEventPayload } from '@/lib/eventEmitter';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const businessId = searchParams.get('businessId');

  if (!businessId) {
    return new Response('Missing businessId parameter', { status: 400 });
  }

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // Send initial connection ACK
      const initMsg = `data: ${JSON.stringify({ type: 'CONNECTED', timestamp: new Date().toISOString() })}\n\n`;
      controller.enqueue(encoder.encode(initMsg));

      // Event listener
      const handleEvent = (payload: AppEventPayload) => {
        if (payload.businessId === businessId) {
          const formatted = `data: ${JSON.stringify(payload)}\n\n`;
          try {
            controller.enqueue(encoder.encode(formatted));
          } catch (e) {
            console.error('[SSE] Failed to enqueue event:', e);
          }
        }
      };

      appEmitter.on('app_event', handleEvent);

      // Heartbeat ping every 15s to keep connection alive
      const interval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch (e) {
          clearInterval(interval);
        }
      }, 15000);

      // Cleanup on client disconnect
      request.signal.addEventListener('abort', () => {
        appEmitter.off('app_event', handleEvent);
        clearInterval(interval);
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
