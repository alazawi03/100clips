"use client";

import { useId, useRef, useState } from "react";
import { FileText, Upload, X } from "lucide-react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { DOCUMENT_TYPES, MAX_DOCUMENT_BYTES } from "@/lib/images";
import { FieldError } from "./Form";

type FileInputProps = {
  /** The picked file is sent under this name; a file already saved is kept through `${name}Keep`. */
  name: string;
  label: string;
  hint?: string;
  /** Name of the file already saved, if any. */
  defaultName?: string;
  error?: string;
};

/** One document (PDF or image), sent as is with the form. Shows the file's name once picked. */
export function FileInput({ name, label, hint, defaultName, error }: FileInputProps) {
  const { t } = useI18n();
  const id = useId();
  const file = useRef<HTMLInputElement>(null);
  const [picked, setPicked] = useState<string>();
  const [kept, setKept] = useState(defaultName ?? "");
  const [problem, setProblem] = useState<string>();
  const shown = problem ?? error;
  const current = picked ?? kept;

  function pick(f: File | undefined) {
    setProblem(undefined);
    if (!f) return setPicked(undefined);
    const bad = !DOCUMENT_TYPES.includes(f.type) ? "forms.errors.fileType" : f.size > MAX_DOCUMENT_BYTES ? "forms.errors.fileTooBig" : undefined;
    if (bad) {
      setProblem(t(bad));
      setPicked(undefined);
      if (file.current) file.current.value = "";
      return;
    }
    setPicked(f.name);
  }

  function remove() {
    setPicked(undefined);
    setKept("");
    if (file.current) file.current.value = "";
  }

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <span id={`${id}-label`} className="font-medium">
        {label}
      </span>
      <input type="hidden" name={`${name}Keep`} value={picked ? "" : kept} />
      <div className="flex flex-wrap items-center gap-2">
        {current && (
          <span className="inline-flex h-10 min-w-0 max-w-full items-center gap-2 rounded-[var(--radius-md)] border border-border px-3 text-small">
            <FileText aria-hidden className="size-4 shrink-0 text-text-muted" />
            <bdi className="truncate">{current}</bdi>
          </span>
        )}
        <label
          htmlFor={id}
          className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-[var(--radius-md)] bg-surface px-4 font-medium hover:bg-border focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary"
        >
          <Upload aria-hidden className="size-4" />
          {current ? t("files.replace") : t("files.upload")}
          <input
            ref={file}
            id={id}
            name={name}
            type="file"
            accept={DOCUMENT_TYPES.join(",")}
            aria-labelledby={`${id}-label`}
            aria-invalid={shown ? true : undefined}
            className="sr-only"
            onChange={(e) => pick(e.target.files?.[0])}
          />
        </label>
        {current && (
          <button type="button" onClick={remove} className="inline-flex h-10 items-center gap-1 rounded-[var(--radius-md)] px-3 text-error hover:bg-error-soft">
            <X aria-hidden className="size-4" />
            {t("files.remove")}
          </button>
        )}
      </div>
      {shown ? <FieldError>{shown}</FieldError> : hint ? <p className="text-small text-text-muted">{hint}</p> : null}
    </div>
  );
}
