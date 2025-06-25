import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'WebSocket connections are handled by the custom server. Start the app with: npm run dev:socket',
    socketUrl: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000'
  });
}