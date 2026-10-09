"use client";

import { useState } from "react";
import AnnotationCanvas from "@/components/annotation-canvas";
import FullTextEditor from "./full-text-editor";

type Annotation = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  transliteration: string;
  translation: string;
  notes: string | null;
  pegonText: string | null;
  status: string;
};

export default function WorkArea({
  pageId,
  imageUrl,
  imageWidth,
  imageHeight,
  initialAnnotations,
  initialTransliteration,
  initialTranslation,
  initialApparatus,
}: {
  pageId: string;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  initialAnnotations: Annotation[];
  initialTransliteration: string;
  initialTranslation: string;
  initialApparatus: string;
}) {
  const [fullTranslit, setFullTranslit] = useState(initialTransliteration);
  const [fullTranslation, setFullTranslation] = useState(initialTranslation);
  const [fullApparatus, setFullApparatus] = useState(initialApparatus);

  function handleAnnotationCreated(ann: {
    transliteration: string;
    translation: string;
    notes: string;
  }) {
    setFullTranslit((prev) => {
      const trimmed = prev.trim();
      return trimmed
        ? `${trimmed} ${ann.transliteration}`
        : ann.transliteration;
    });
    setFullTranslation((prev) => {
      const trimmed = prev.trim();
      return trimmed ? `${trimmed} ${ann.translation}` : ann.translation;
    });
    if (ann.notes && ann.notes.trim()) {
      setFullApparatus((prev) => {
        const trimmed = prev.trim();
        return trimmed ? `${trimmed}\n• ${ann.notes}` : `• ${ann.notes}`;
      });
    }
  }

  return (
    <>
      <AnnotationCanvas
        pageId={pageId}
        imageUrl={imageUrl}
        imageWidth={imageWidth}
        imageHeight={imageHeight}
        initialAnnotations={initialAnnotations}
        onAnnotationCreated={handleAnnotationCreated}
      />

      <FullTextEditor
        pageId={pageId}
        value={fullTranslit}
        onChange={setFullTranslit}
        translationValue={fullTranslation}
        onTranslationChange={setFullTranslation}
        apparatusValue={fullApparatus}
        onApparatusChange={setFullApparatus}
      />
    </>
  );
}