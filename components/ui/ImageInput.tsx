"use client";

import Image from "next/image";
import { useId, useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { cn } from "@/lib/cn";
import { IMAGE_TYPES, MAX_IMAGE_BYTES, resizeImage } from "@/lib/images";
import { FieldError } from "./Form";

type ImageInputProps = {
  /** Form field name; the image is submitted as a URL in a hidden input. */
  name: string;
  label: string;
  hint?: string;
  defaultValue?: string;
  shape: "square" | "wide";
  error?: string;
};

/** One image (logo, cover). Click or drop a file; it is resized in the browser and previewed. */
export function ImageInput({ name, label, hint, defaultValue, shape, error }: ImageInputProps) {
  const { t } = useI18n();
  const id = useId();
  const file = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(defaultValue ?? "");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string>();
  const [dragging, setDragging] = useState(false);
  const shown = problem ?? error;

  async function pick(f: File | undefined) {
    if (!f) return;
    setProblem(undefined);
    if (!IMAGE_TYPES.includes(f.type)) return setProblem(t("forms.errors.imageType"));
    if (f.size > MAX_IMAGE_BYTES) return setProblem(t("forms.errors.imageTooBig"));
    setBusy(true);
    try {
      setValue(await resizeImage(f, shape === "square" ? 512 : 1600));
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
      <input type="hidden" name={name} value={value} />
      <div className={cn("flex gap-4", shape === "square" ? "items-center" : "flex-col")}>
        {/* The preview is a click and drop target too, not just the button. */}
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
            pick(e.dataTransfer.files?.[0]);
          }}
          className={cn(
            "relative grid shrink-0 cursor-pointer place-items-center overflow-hidden border border-dashed bg-surface text-text-muted transition-colors duration-[120ms] hover:border-primary hover:text-primary",
            shape === "square" ? "size-24 rounded-[var(--radius-lg)]" : "aspect-[3/1] w-full rounded-[var(--radius-lg)]",
            dragging ? "border-primary bg-primary-soft text-primary" : shown ? "border-error" : "border-border",
          )}
        >
          <span className="sr-only">{value ? t("images.replace") : t("images.upload")}</span>
          {busy ? (
            <Loader2 aria-label={t("images.processing")} className="size-6 animate-spin" />
          ) : value ? (
            <Image src={value} alt="" fill unoptimized className="object-cover" />
          ) : (
            <ImagePlus aria-hidden className="size-7" strokeWidth={1.5} />
          )}
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <label
            htmlFor={id}
            className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-[var(--radius-md)] bg-surface px-4 font-medium hover:bg-border focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary"
          >
            {value ? t("images.replace") : t("images.upload")}
            <input
              ref={file}
              id={id}
              type="file"
              accept={IMAGE_TYPES.join(",")}
              aria-labelledby={`${id}-label`}
              aria-invalid={shown ? true : undefined}
              className="sr-only"
              onChange={(e) => pick(e.target.files?.[0])}
            />
          </label>
          {value && (
            <button type="button" onClick={() => setValue("")} className="inline-flex h-10 items-center gap-1 rounded-[var(--radius-md)] px-3 text-error hover:bg-error-soft">
              <X aria-hidden className="size-4" />
              {t("images.remove")}
            </button>
          )}
        </div>
      </div>
      {shown ? <FieldError>{shown}</FieldError> : hint ? <p className="text-small text-text-muted">{hint}</p> : null}
    </div>
  );
}
