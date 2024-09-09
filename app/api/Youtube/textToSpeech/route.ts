import { HfInference } from '@huggingface/inference';
import { NextRequest, NextResponse } from 'next/server';

const inference = new HfInference('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');

export async function POST(req: NextRequest) {
  const { text } = await req.json();

  try {
    const response = await inference.textToSpeech({
      model: 'facebook/mms-tts-eng',
      inputs: text,
    });

    if (!response) {
      throw new Error('No response received from the text-to-speech API');
    }

    const arrayBuffer = await response.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Length': arrayBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
}
