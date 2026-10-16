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

function buildFromAnnotations(annotations: Annotation[]) {
  const approved = annotations.filter((a) => a.status !== "REJECTED");

  const sorted = [...approved].sort((a, b) => {
    if (Math.abs(a.y - b.y) > 0.02) return a.y - b.y;
    return a.x - b.x;
  });

  const translit = sorted.map((a) => a.transliteration).join(" ");
  const translation = sorted.map((a) => a.translation).join(" ");

  const notesList = sorted
    .filter((a) => a.notes && a.notes.trim())
    .map((a) => `• ${a.notes}`)
    .join("\n");

  return { translit, translation, notes: notesList };
}

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
  const shouldAutoPopulate =
    initialAnnotations.length > 0 &&
    !initialTransliteration.trim() &&
    !initialTranslation.trim();

  const built = shouldAutoPopulate
    ? buildFromAnnotations(initialAnnotations)
    : null;

  const [fullTranslit, setFullTranslit] = useState(
    built ? built.translit : initialTransliteration
  );
  const [fullTranslation, setFullTranslation] = useState(
    built ? built.translation : initialTranslation
  );
  const [fullApparatus, setFullApparatus] = useState(
    built && !initialApparatus.trim() ? built.notes : initialApparatus
  );

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

  function handleRegenerate() {
    const rebuilt = buildFromAnnotations(initialAnnotations);
    setFullTranslit(rebuilt.translit);
    setFullTranslation(rebuilt.translation);
    setFullApparatus(rebuilt.notes);
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
        onRegenerate={handleRegenerate}
      />
    </>
  );
}