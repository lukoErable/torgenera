import axios from 'axios';
import { NextRequest, NextResponse } from 'next/server';

const apiKey = process.env.LEONARDO_API_KEY;
const authorization = `Bearer ${apiKey}`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt } = body;

    if (!prompt) {
      console.log('pas de promnt');
    }

    const generationPayload = {
      height: 512,
      width: 512,
      modelId: '6bef9f1b-29cb-40c7-b9df-32b51c1f67d3',
      prompt,
    };

    const generationResponse = await axios.post(
      'https://cloud.leonardo.ai/api/rest/v1/generations',
      generationPayload,
      {
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          authorization,
        },
      }
    );
    console.log(generationResponse);

    if (generationResponse.status !== 200) {
      throw new Error(
        `Failed to generate images: ${generationResponse.statusText}`
      );
    }

    const images = generationResponse.data.generations_by_pk.images;
    return NextResponse.json({ images });
  } catch (error) {
    console.error('Error generating images:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
