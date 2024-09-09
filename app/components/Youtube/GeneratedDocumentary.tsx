import { FC } from 'react';
import { ChapterContent } from '../../utils/types';
interface GeneratedDocumentaryProps {
  chapters: [string, string][];
  chapterContent: ChapterContent;
  images: string[];
}

export const GeneratedDocumentary: FC<GeneratedDocumentaryProps> = ({
  chapters,
  chapterContent,
  images,
}) => {
  return (
    <div className="space-y-8">
      {chapters.map(([id, title], index) => (
        <div
          key={id}
          className="relative bg-base-200 p-6 rounded-xl shadow-lg overflow-hidden"
          style={{
            minHeight: '300px', // Ajustez cette valeur selon vos besoins
          }}
        >
          {images[index] && (
            <div
              className="absolute inset-0 bg-cover bg-center z-0"
              style={{
                backgroundImage: `url(${images[index]})`,
                opacity: 0.8, // Ajustez cette valeur pour changer l'opacité de l'image de fond
              }}
            />
          )}
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-4">{title}</h2>
            <p className="mb-4">{chapterContent[id]}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
