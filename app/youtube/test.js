const leonardoai = require('@api/leonardoai');

// Set your API key
leonardoai.auth('YOUR_API_KEY');

async function generateAndAnimateImage() {
  try {
    // Step 1: Generate the image
    console.log('Generating image...');
    const imageGeneration = await leonardoai.createGeneration({
      prompt:
        'Beautiful portrait of a space explorer with galaxies in the background, vertical format for TikTok',
      modelId: 'ac614f96-1082-45bf-be9d-757f2d31c174',
      width: 512,
      height: 768,
      num_images: 1,
      public: false,
    });

    console.log(
      'Image generation started. Generation ID:',
      imageGeneration.data.sdGenerationJob.generationId
    );

    // Wait for the image to be generated
    await new Promise((resolve) => setTimeout(resolve, 30000));

    // Step 2: Get the generated image
    const generatedImage = await leonardoai.getGeneration({
      id: imageGeneration.data.sdGenerationJob.generationId,
    });

    const imageUrl =
      generatedImage.data.generations_by_pk.generated_images[0].url;
    console.log('Image generated. URL:', imageUrl);

    // Step 3: Animate the generated image
    console.log('Animating image...');
    const animationGeneration = await leonardoai.createSVDMotionGeneration({
      imageUrl: imageUrl,
      isInitImage: true,
      motionStrength: 5,
    });

    console.log(
      'Animation started. Motion Generation ID:',
      animationGeneration.data.motionSvdGenerationJob.generationId
    );

    // Wait for the video to be generated
    await new Promise((resolve) => setTimeout(resolve, 60000));

    // Step 4: Get the animated video
    const animatedVideo = await leonardoai.getGeneration({
      id: animationGeneration.data.motionSvdGenerationJob.generationId,
    });

    const videoUrl =
      animatedVideo.data.generations_by_pk.generated_images[0].url;
    console.log('Animation complete. Video URL:', videoUrl);
  } catch (error) {
    console.error('An error occurred:', error.message);
  }
}

// Execute the script
generateAndAnimateImage();
