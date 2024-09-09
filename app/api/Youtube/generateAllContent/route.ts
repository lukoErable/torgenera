import { HfInference } from '@huggingface/inference';
import { NextRequest, NextResponse } from 'next/server';

const hf = new HfInference('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');

export async function POST(req: NextRequest) {
  const { topic, chapters, model } = await req.json();

  try {
    const content: Record<string, string> = {};

    for (const [chapter, title] of Object.entries(chapters)) {
      const prompt = `Write a short paragraph for "${title}" in a documentary or a story about ${topic}`;

      const response = await hf.textGeneration({
        model: model,
        inputs: prompt,
        parameters: {
          max_new_tokens: 300,
          return_full_text: false,
        },
      });

      content[chapter] = response.generated_text;
    }

    return NextResponse.json({ content });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
}
