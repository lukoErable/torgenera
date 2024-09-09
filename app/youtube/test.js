const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const FormData = require('form-data');
const sharp = require('sharp');

const HUGGING_FACE_API_TOKEN = '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';
const TEXT_TO_IMAGE_MODEL_URL =
  'https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-dev';
const IMAGE_TO_VIDEO_MODEL_URL =
  'https://api-inference.huggingface.co/models/vdo/stable-video-diffusion-img2vid-xt-1-1';
const STABILITY_AI_API_KEY =
  'sk-HjY1nleba4t4wddCvLmPokKjrCWoxWwU59u8tTsTBmCGRQE2s'; // Replace with your actual Stability AI API key

// Step 1: Generate the image
async function generateImage(prompt) {
  try {
    const response = await axios({
      method: 'POST',
      url: TEXT_TO_IMAGE_MODEL_URL,
      headers: {
        Authorization: `Bearer ${HUGGING_FACE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      data: { inputs: prompt },
      responseType: 'arraybuffer',
    });

    const imageBuffer = response.data;
    const imagePath = `./generated_image.png`;
    await fs.writeFile(imagePath, imageBuffer);
    console.log(`Image saved as ${imagePath}`);
    return imagePath;
  } catch (error) {
    console.error(
      'Error generating image:',
      error.response ? error.response.data : error.message
    );
    throw error;
  }
}

// Step 2: Resize the image
async function resizeImage(inputPath, outputPath, width, height) {
  await sharp(inputPath)
    .resize(width, height, { fit: 'cover' })
    .toFile(outputPath);
  console.log(`Image resized to ${width}x${height}`);
}

// Step 3: Animate the generated image
async function animateImage(imagePath) {
  try {
    const resizedImagePath = './resized_image.png';
    await resizeImage(imagePath, resizedImagePath, 1024, 576);

    const data = new FormData();
    data.append(
      'image',
      await fs.readFile(resizedImagePath),
      path.basename(resizedImagePath)
    );
    data.append('seed', 0);
    data.append('cfg_scale', 1.8);
    data.append('motion_bucket_id', 127);

    const response = await axios({
      method: 'POST',
      url: 'https://api.stability.ai/v2beta/image-to-video',
      headers: {
        ...data.getHeaders(),
        Authorization: `Bearer ${STABILITY_AI_API_KEY}`,
      },
      data: data,
    });

    console.log('Generation ID:', response.data.id);
    return response.data.id;
  } catch (error) {
    console.error(
      'Error animating image:',
      error.response ? error.response.data : error.message
    );
    throw error;
  }
}

// Main function: Generate an image and animate it
async function generateAndAnimateImage() {
  try {
    const prompt = 'Beautiful scape of the space with blackholes and galaxies'; // Modify prompt as needed
    console.log('Generating image...');
    const imagePath = await generateImage(prompt);

    console.log('Animating image...');
    const generationId = await animateImage(imagePath);

    console.log('Animation complete. Generation ID:', generationId);
  } catch (error) {
    console.error('An error occurred:', error.message);
  }
}

// Execute the script
generateAndAnimateImage();
