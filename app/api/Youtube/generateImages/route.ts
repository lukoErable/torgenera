import { HfInference } from '@huggingface/inference';
import { NextRequest, NextResponse } from 'next/server';

const inference = new HfInference(process.env.HUGGINGFACE_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { content }: { content: Record<string, string> } = await req.json();
    console.log(content);

    const generatedImageSequences = await Promise.all(
      Object.values(content).map(async (chapterText: string) => {
        const basePrompt = `Highly detailed, professional quality, photorealistic, 8k resolution, sharp focus, intricate details, vibrant colors: ${chapterText.slice(
          0,
          150
        )}`;

        // Générer une séquence de 5 images légèrement différentes
        const imageSequence = await Promise.all(
          Array(5)
            .fill(null)
            .map(async (_, index) => {
              const enhancedPrompt = `${basePrompt} Frame ${
                index + 1
              } of a subtle animation sequence.`;

              const result = await inference.textToImage({
                model: 'stabilityai/stable-diffusion-xl-base-1.0',
                inputs: enhancedPrompt,
              });
              const base64Image = Buffer.from(
                await result.arrayBuffer()
              ).toString('base64');
              return `data:image/jpeg;base64,${base64Image}`;
            })
        );

        return imageSequence;
      })
    );

    return NextResponse.json(
      { imageSequences: generatedImageSequences },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error generating image sequences:', error);
    return NextResponse.json(
      {
        message: 'Error generating image sequences',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
