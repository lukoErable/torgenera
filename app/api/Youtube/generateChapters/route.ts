import { HfInference } from '@huggingface/inference';
import { NextRequest, NextResponse } from 'next/server';

const inference = new HfInference('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');

export async function POST(req: NextRequest) {
  const { topic, model } = await req.json();

  try {
    const prompt = `Generate a paragraph title for a documentary or a story about ${topic}. Respond with a JSON object with short titles. do not put Explanation on the response json. I want to use this promt to develop each parts later`;

    const response = await inference.chatCompletion({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 100,
    });

    const generatedText = response.choices[0]?.message?.content || '';

    if (!generatedText.trim()) {
      return NextResponse.json(
        { error: 'No content generated' },
        { status: 500 }
      );
    }

    let chapters: Record<string, string>;
    try {
      chapters = JSON.parse(generatedText);
    } catch (error) {
      chapters = { 'Chapter 1': generatedText.trim() };
    }

    return NextResponse.json({ chapters });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Request processing failed' },
      { status: 500 }
    );
  }
}
