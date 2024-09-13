import { NextResponse } from 'next/server';

interface VideoData {
  desc: string;
  coverURL: string;
  videoURL: string;
  percent: number;
}

interface GenerateResponse {
  statusInfo: {
    code: number;
    httpCode: number;
    message: string;
    serviceTime: number;
    requestID: string;
    debugInfo: string;
    serverAlert: number;
  };
}

interface CheckResponse {
  data?: {
    videos?: Array<{
      status: number;
      percent: number;
      coverURL: string;
      videoURL: string;
      desc: string;
    }>;
  };
}

export async function getToken() {
  const url =
    'https://hailuoai.com/v1/api/user/renewal?device_platform=web&app_id=3001&version_code=22201&uuid=1771246e-8039-4eb8-af24-3f301779b199&device_id=290341031152783364&os_name=Windows&browser_name=chrome&device_memory=8&cpu_core_num=12&browser_language=fr-FR&browser_platform=Win32&screen_width=1920&screen_height=1080&unix=1726078842000';
  const response = await fetch(url);
  console.log(response);
}

const baseUrl = 'https://hailuoai.com/api/multimodal';
const commonParams =
  'device_platform=web&app_id=3001&version_code=22201&uuid=4d7046ca-3b57-4097-8cdd-98287c4d4ce7&device_id=289712212800757760&os_name=Windows&browser_name=chrome&device_memory=8&cpu_core_num=12&browser_language=fr-FR&browser_platform=Win32&screen_width=1920&screen_height=1080';

const headers = {
  baggage:
    'sentry-environment=production,sentry-release=vNiXnO9R7RJf9JXK4DX3d,sentry-public_key=6cf106db5c7b7262eae7cc6b411c776a,sentry-trace_id=d2d713e59bde43ea8f66529e79cc5f2f,sentry-sample_rate=1,sentry-sampled=true',
  'content-type': 'application/json',
  token:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3MjkzODQ5MTksInVzZXIiOnsiaWQiOiIyODk3MTIyMTM1MTM4MDE3MjkiLCJuYW1lIjoi5bCP6J665bi9MTcyOSIsImF2YXRhciI6Imh0dHBzOi8vY2RuLnlpbmdzaGktYWkuY29tL3Byb2QvdXNlcl9hdmF0YXIvMTcwNjI2NzU0NDM4OTgyMDgwMS0xNzMxOTQ1NzA2Njg5NjU4OTZvdmVyc2l6ZS5wbmciLCJkZXZpY2VJRCI6IjI4OTcxMjIxMjgwMDc1Nzc2MCIsImlzQW5vbnltb3VzIjp0cnVlfX0.XcI1Hng-ceMQYJ7vQI93sh-TUQBKEUbpSLGaCgDrKsI',
  yy: 'edb7ee467c628ea4b0195d2ce6b4ba34',
};

async function generateAndCheckVideo(
  prompt: string
): Promise<VideoData | null> {
  try {
    // Step 1: Generate video
    const generateUrl = `${baseUrl}/generate/video?${commonParams}&unix=${Date.now()}`;
    console.log('Generating video with description:', prompt);

    const generateResponse = await fetch(generateUrl, {
      method: 'POST',
      headers: headers,
      body: prompt,
    });

    if (!generateResponse.ok) {
      throw new Error(`HTTP error! status: ${generateResponse.status}`);
    }

    const generateData: GenerateResponse = await generateResponse.json();
    console.log(
      'Video generation response:',
      JSON.stringify(generateData, null, 2)
    );

    if (generateData.statusInfo?.requestID) {
      const videoId = generateData.statusInfo.requestID;
      console.log('process w video ID : ', videoId);

      const checkUrl = `${baseUrl}/video/processing?idList=${videoId}&${commonParams}&unix=${Date.now()}`;

      const checkProcessingState = async (): Promise<VideoData | null> => {
        const checkResponse = await fetch(checkUrl, {
          method: 'GET',
          headers: headers,
        });

        if (!checkResponse.ok) {
          throw new Error(`HTTP error! status: ${checkResponse.status}`);
        }

        const checkData: CheckResponse = await checkResponse.json();
        console.log('Processing state:', JSON.stringify(checkData, null, 2));

        if (checkData.data?.videos?.[0]) {
          const videoData = checkData.data.videos[0];
          console.log('Video data:', JSON.stringify(videoData, null, 2));

          if (
            videoData.status === 2 &&
            videoData.percent === 100 &&
            videoData.coverURL &&
            videoData.videoURL
          ) {
            console.log('Video processing completed');
            return {
              desc: videoData.desc,
              coverURL: videoData.coverURL,
              videoURL: videoData.videoURL,
              percent: videoData.percent,
            };
          } else {
            console.log(
              `Video still processing (status: ${videoData.status}, percent: ${videoData.percent}), checking again in 5 seconds...`
            );
            await new Promise((resolve) => setTimeout(resolve, 5000));
            return checkProcessingState();
          }
        } else {
          console.log(
            'Unexpected response structure, checking again in 5 seconds...'
          );
          await new Promise((resolve) => setTimeout(resolve, 5000));
          return checkProcessingState();
        }
      };

      // Start checking processing state
      return await checkProcessingState();
    } else {
      throw new Error('Failed to get video ID from generation response');
    }
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Received request body:', body);

    const { prompt, speechDuration } = body;

    if (!prompt || !speechDuration) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Prompt:', prompt);
    console.log('Speech Duration:', speechDuration);

    if (typeof speechDuration !== 'number' || isNaN(speechDuration)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Valid speech duration is required',
        },
        { status: 400 }
      );
    }

    // Generate the video clip
    const videoData = await generateAndCheckVideo(prompt.speech);
    if (!videoData) {
      throw new Error('Failed to generate video');
    }

    return NextResponse.json({
      success: true,
      videoData,
    });
  } catch (error) {
    console.error('Error in POST request:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Server error',
      },
      { status: 500 }
    );
  }
}
