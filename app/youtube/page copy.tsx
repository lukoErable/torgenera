'use client';

import React, { FC, useCallback, useMemo, useRef, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ErrorFallback } from '../components/ErrorFallback';
import { GeneratedDocumentary } from '../components/Youtube/GeneratedDocumentary';
import LoadingButton from '../components/Youtube/LoadingButton';
import { ModelSelect } from '../components/Youtube/ModelSelect';
import TopicSelector from '../components/Youtube/TopicSelector';
import { models, ttsModels } from '../utils/constants';
import { Chapter, ChapterContent } from '../utils/types';

const YouTube: FC = () => {
  const [topic, setTopic] = useState<string>('');
  const [chapters, setChapters] = useState<Chapter>({});
  const [chapterContent, setChapterContent] = useState<ChapterContent>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [model, setModel] = useState<string>(
    'mistralai/Mixtral-8x7B-Instruct-v0.1'
  );
  const [ttsModel, setTtsModel] = useState<string>('coqui/XTTS-v2');
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fetchWithRetry = async (
    url: string,
    options: RequestInit,
    retries = 3
  ) => {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, options);
        if (!response.ok)
          throw new Error(`Request failed: ${response.statusText}`);
        return response;
      } catch (error) {
        if (i === retries - 1) throw error;
      }
    }
  };

  const handleTopicSelect = (selectedTopic: string) => {
    setTopic(selectedTopic);
  };

  const handleGenerateAll = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setIsLoading(true);

      try {
        interface ChaptersResponse {
          chapters: Chapter;
        }

        interface ContentResponse {
          content: ChapterContent;
        }

        // Fetch chapters
        const chaptersRes = await fetchWithRetry(
          '/api/Youtube/generateChapters',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ topic, model }),
          }
        );

        if (!chaptersRes || !chaptersRes.ok) {
          throw new Error('Failed to generate chapters');
        }

        const chaptersData: ChaptersResponse = await chaptersRes.json();
        setChapters(chaptersData.chapters);

        // Fetch content
        const contentRes = await fetchWithRetry(
          '/api/Youtube/generateAllContent',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              topic,
              chapters: chaptersData.chapters,
              model,
            }),
          }
        );

        if (!contentRes || !contentRes.ok) {
          throw new Error('Failed to generate content');
        }

        const contentData: ContentResponse = await contentRes.json();
        setChapterContent(contentData.content);

        // Fetch audio
        const audioRes = await fetchWithRetry('/api/Youtube/textToSpeech', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: Object.values(contentData.content).join(' '),
            model: ttsModel,
          }),
        });

        if (!audioRes || !audioRes.ok) {
          throw new Error('Failed to generate audio');
        }

        const audioBlob = await audioRes.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioSrc(audioUrl);

        // Generate images for each chapter
        const imagesRes = await fetchWithRetry('/api/Youtube/generateImages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: contentData.content }),
        });

        if (!imagesRes || !imagesRes.ok) {
          throw new Error('Failed to generate images');
        }

        const imagesData = await imagesRes.json();
        setImages(imagesData.images);

        toast.success('Documentary and images generated successfully!');
      } catch (error) {
        console.error('Error:', error);
        toast.error(
          `Failed to generate documentary and images: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        );
      } finally {
        setIsLoading(false);
      }
    },
    [topic, model, ttsModel]
  );

  const chapterEntries = useMemo(() => Object.entries(chapters), [chapters]);

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <main className="min-h-screen bg-base-100 p-4 lg:p-8">
        <div className="container mx-auto">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-grow lg:w-3/4">
              <form
                onSubmit={handleGenerateAll}
                className="bg-base-200 p-6 rounded-xl shadow-lg mb-8"
              >
                <h2 className="text-2xl font-bold mb-6 text-center text-primary">
                  Generate Documentary
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="w-full">
                    <label className="label">
                      <span className="label-text">AI Model</span>
                    </label>
                    <ModelSelect
                      label=""
                      value={model}
                      options={models}
                      onChange={setModel}
                    />
                  </div>
                  <div className="w-full">
                    <label className="label">
                      <span className="label-text">TTS Model</span>
                    </label>
                    <ModelSelect
                      label=""
                      value={ttsModel}
                      options={ttsModels}
                      onChange={setTtsModel}
                    />
                  </div>
                  <div className="w-full md:col-span-2">
                    <label className="label">
                      <span className="label-text">Topic</span>
                    </label>
                    <input
                      id="topic"
                      type="text"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="Enter your topic here..."
                      className="input input-bordered w-full"
                    />
                  </div>
                  <div className="w-full md:col-span-2">
                    <LoadingButton
                      type="submit"
                      isLoading={isLoading}
                      label="Generate Documentary"
                      className="btn btn-primary w-full"
                    />
                  </div>
                </div>
              </form>

              {chapterEntries.length > 0 && (
                <div className="bg-base-200 p-6 rounded-xl shadow-lg mb-8">
                  <h2 className="text-2xl font-bold mb-6 text-center text-primary">
                    Generated Content
                  </h2>
                  <GeneratedDocumentary
                    chapters={chapterEntries}
                    chapterContent={chapterContent}
                    images={images}
                  />
                </div>
              )}

              {audioSrc && (
                <div className="bg-base-200 p-6 rounded-xl shadow-lg">
                  <h2 className="text-2xl font-bold mb-6 text-center text-primary">
                    Audio Narration
                  </h2>
                  <audio
                    ref={audioRef}
                    src={audioSrc}
                    controls
                    className="w-full"
                  />
                </div>
              )}
            </div>

            <div className="lg:w-1/4">
              <div className="sticky top-8">
                <TopicSelector onTopicSelect={handleTopicSelect} />
              </div>
            </div>
          </div>
        </div>
        <ToastContainer position="bottom-right" theme="colored" />
      </main>
    </ErrorBoundary>
  );
};

export default YouTube;
