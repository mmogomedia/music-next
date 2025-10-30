import { NextResponse } from 'next/server';
import { aiService } from '@/lib/ai/ai-service';

export async function GET() {
  try {
    const availableProviders = aiService.getAvailableProviders();
    
    return NextResponse.json({
      providers: availableProviders,
      count: availableProviders.length,
    });
  } catch (error) {
    console.error('Error fetching AI providers:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch providers' },
      { status: 500 }
    );
  }
}

