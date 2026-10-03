"use client";

import Image from "next/image";
import { useId, useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { cn } from "@/lib/cn";
import { IMAGE_TYPES, MAX_IMAGE_BYTES, resizeImage } from "@/lib/images";
import { FieldError } from "./Form";

const MAX_PHOTOS = 6;

/** Several product photos. Each is resized in the browser; the first one is the cover. */
export function PhotosInput({ name, label, hint, defaultValue = [] }: { name: string; label: string; hint?: string; defaultValue?: string[] }) {
  const { t } = useI18n();
  const id = useId();
  const file = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<string[]>(defaultValue);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string>();
  const [dragging, setDragging] = useState(false);

  async function add(files: FileList | null) {
    if (!files?.length) return;
    setProblem(undefined);
    const room = MAX_PHOTOS - photos.length;
    const picked = Array.from(files).slice(0, room);
    if (picked.some((f) => !IMAGE_TYPES.includes(f.type))) setProblem(t("forms.errors.imageType"));
    else if (picked.some((f) => f.size > MAX_IMAGE_BYTES)) setProblem(t("forms.errors.imageTooBig"));
    const ok = picked.filter((f) => IMAGE_TYPES.includes(f.type) && f.size <= MAX_IMAGE_BYTES);
    setBusy(true);
    try {
      const resized = await Promise.all(ok.map((f) => resizeImage(f, 1200)));
      setPhotos((p) => [...p, ...resized].slice(0, MAX_PHOTOS));
    } catch {
      setProblem(t("forms.errors.imageType"));
    } finally {
      setBusy(false);
      if (file.current) file.current.value = "";
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <span id={`${id}-label`} className="font-medium">
        {label}
      </span>
      {photos.map((src, i) => (
        <input key={i} type="hidden" name={name} value={src} />
      ))}
      <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {photos.map((src, i) => (
          <li key={i} className="relative aspect-square overflow-hidden rounded-[var(--radius-md)] bg-surface">
            <Image src={src} alt="" fill unoptimized className="object-cover" />
            {i === 0 && <span className="absolute start-1.5 top-1.5 rounded-full bg-black/55 px-2 text-caption text-white">{t("images.cover")}</span>}
            <button
              type="button"
              onClick={() => setPhotos((p) => p.filter((_, j) => j !== i))}
              aria-label={t("images.removeNumbered", { n: i + 1 })}
              className="absolute end-1.5 top-1.5 grid size-7 place-items-center rounded-full bg-black/55 text-white hover:bg-black/70"
            >
              <X aria-hidden className="size-4" />
            </button>
          </li>
        ))}
        {photos.length < MAX_PHOTOS && (
          <li>
            <label
              htmlFor={id}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                add(e.dataTransfer.files);
              }}
              className={cn(
                "grid aspect-square cursor-pointer place-items-center rounded-[var(--radius-md)] border border-dashed bg-surface text-text-muted transition-colors duration-[120ms] hover:border-primary hover:text-primary focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary",
                dragging ? "border-primary bg-primary-soft text-primary" : "border-border",
              )}
            >
              {busy ? <Loader2 aria-label={t("images.processing")} className="size-6 animate-spin" /> : <ImagePlus aria-hidden className="size-6" strokeWidth={1.5} />}
              <span className="sr-only">{t("images.upload")}</span>
              <input ref={file} id={id} type="file" multiple accept={IMAGE_TYPES.join(",")} aria-labelledby={`${id}-label`} className="sr-only" onChange={(e) => add(e.target.files)} />
            </label>
          </li>
        )}
      </ul>
      {problem ? <FieldError>{problem}</FieldError> : hint ? <p className="text-small text-text-muted">{hint}</p> : null}
    </div>
  );
}
