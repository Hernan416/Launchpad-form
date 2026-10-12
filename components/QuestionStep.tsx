"use client";

import { useEffect, useRef } from "react";
import { Question } from "@/lib/types";

interface QuestionStepProps {
  question: Question;
  value: string | string[] | undefined;
  onChange: (value: string | string[]) => void;
  onSubmit: () => void;
}

export function QuestionStep({ question, value, onChange, onSubmit }: QuestionStepProps) {
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [question.id]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && question.type !== "long_text") {
      e.preventDefault();
      onSubmit();
    }
    if (e.key === "Enter" && e.metaKey) {
      onSubmit();
    }
  };

  return (
    <div className="w-full max-w-xl">
      <h2 className="font-display text-2xl font-semibold leading-snug text-brand-ink sm:text-3xl">
        {question.title}
        {question.required && <span className="ml-1 text-brand-blue">*</span>}
      </h2>
      {question.description && (
        <p className="mt-2 whitespace-pre-line text-sm text-brand-muted">{question.description}</p>
      )}

      <div className="mt-8">
        {(question.type === "short_text" ||
          question.type === "email" ||
          question.type === "phone") && (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type={question.type === "email" ? "email" : question.type === "phone" ? "tel" : "text"}
            value={(value as string) ?? ""}
            placeholder={question.placeholder ?? "Type your answer here..."}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full border-b-2 border-brand-line bg-transparent pb-3 text-lg text-brand-ink outline-none transition-colors placeholder:text-brand-muted/60 focus:border-brand-blue"
          />
        )}

        {question.type === "long_text" && (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={(value as string) ?? ""}
            placeholder={question.placeholder ?? "Type your answer here..."}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={5}
            className="w-full resize-none rounded-brand-lg border border-brand-line bg-brand-surface p-4 text-lg text-brand-ink outline-none transition-colors placeholder:text-brand-muted/60 focus:border-brand-blue"
          />
        )}

        {question.type === "single_choice" && (
          <div className="flex flex-col gap-3">
            {question.options?.map((opt, idx) => {
              const selected = value === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                  }}
                  className={`flex items-center gap-3 rounded-brand border px-4 py-3 text-left text-base transition-colors ${
                    selected
                      ? "border-brand-blue bg-brand-blue/15 text-brand-ink"
                      : "border-brand-line bg-brand-surface text-brand-ink hover:border-brand-blue/40"
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-xs font-semibold ${
                      selected ? "border-brand-blue bg-brand-blue text-white" : "border-brand-line text-brand-muted"
                    }`}
                  >
                    {String.fromCharCode(65 + idx)}
                  </span>
                  {opt.label}
                </button>
              );
            })}
          </div>
        )}

        {question.type === "multiple_choice" && (
          <div className="flex flex-col gap-3">
            {question.options?.map((opt, idx) => {
              const current = Array.isArray(value) ? value : [];
              const selected = current.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    const next = selected
                      ? current.filter((v) => v !== opt.value)
                      : [...current, opt.value];
                    onChange(next);
                  }}
                  className={`flex items-center gap-3 rounded-brand border px-4 py-3 text-left text-base transition-colors ${
                    selected
                      ? "border-brand-blue bg-brand-blue/15 text-brand-ink"
                      : "border-brand-line bg-brand-surface text-brand-ink hover:border-brand-blue/40"
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-xs font-semibold ${
                      selected ? "border-brand-blue bg-brand-blue text-white" : "border-brand-line text-brand-muted"
                    }`}
                  >
                    {String.fromCharCode(65 + idx)}
                  </span>
                  {opt.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-8 flex items-center gap-4">
        <button
          type="button"
          onClick={onSubmit}
          className="rounded-brand bg-brand-blue px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-blue-dark"
        >
          Continue
        </button>
        <span className="text-xs text-brand-muted">press Enter ↵</span>
      </div>
    </div>
  );
}
