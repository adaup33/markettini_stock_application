import { NextResponse } from 'next/server';
import { connectToDb } from '@/database/mongoose';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const startedAt = new Date().toISOString();
  try {
    const mongooseInstance = await connectToDb();
    const readyState = mongooseInstance?.connection?.readyState;

    return NextResponse.json(
      {
        ok: true,
        message: 'Database connection successful',
        readyState, // 1 = connected, 2 = connecting, 0 = disconnected, 3 = disconnecting
        nodeEnv: process.env.NODE_ENV,
        serverTime: new Date().toISOString(),
        startedAt,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Database connection failed',
        error: error?.message ?? 'Unknown error',
        nodeEnv: process.env.NODE_ENV,
        serverTime: new Date().toISOString(),
        startedAt,
      },
      { status: 500 }
    );
  }
}
