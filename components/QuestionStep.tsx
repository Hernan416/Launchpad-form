"use client";

import { useEffect, useRef } from "react";
import type { Country } from "react-phone-number-input";
import { Question } from "@/lib/types";
import { PhoneField } from "@/components/PhoneField";
import { isValidEmail, isValidPhone } from "@/lib/validation";

interface QuestionStepProps {
  question: Question;
  value: string | string[] | undefined;
  onChange: (value: string | string[]) => void;
  onSubmit: () => void;
  onBack?: () => void;
  defaultCountry?: Country;
}

const URL_PATTERN = /(https?:\/\/[^\s]+)/g;

function renderWithLinks(text: string) {
  return text.split(URL_PATTERN).map((part, i) =>
    /^https?:\/\//.test(part) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="text-brand-blue underline hover:text-brand-blue-dark"
      >
        {part}
      </a>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

export function QuestionStep({
  question,
  value,
  onChange,
  onSubmit,
  onBack,
  defaultCountry,
}: QuestionStepProps) {
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const backButtonRef = useRef<HTMLButtonElement>(null);

  const stringValue = typeof value === "string" ? value : "";
  const showEmailError = question.type === "email" && stringValue.length > 0 && !isValidEmail(stringValue);
  const showPhoneError = question.type === "phone" && stringValue.length > 0 && !isValidPhone(stringValue);

  useEffect(() => {
    inputRef.current?.focus();
  }, [question.id]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;
      if (document.activeElement === backButtonRef.current) return;
      const tag = (document.activeElement?.tagName || "").toLowerCase();
      if (tag === "textarea") {
        if (e.metaKey || e.ctrlKey) {
          e.preventDefault();
          onSubmit();
        }
        return;
      }
      if (e.shiftKey) return;
      e.preventDefault();
      onSubmit();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onSubmit]);

  return (
    <div className="w-full max-w-xl">
      <h2 className="font-display text-2xl font-semibold leading-snug text-brand-ink sm:text-3xl">
        {question.title}
        {question.required && <span className="ml-1 text-brand-blue">*</span>}
      </h2>
      {question.description && (
        <p className="mt-2 whitespace-pre-line text-sm text-brand-muted">
          {renderWithLinks(question.description)}
        </p>
      )}

      <div className="mt-8">
        {(question.type === "short_text" || question.type === "email") && (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type={question.type === "email" ? "email" : "text"}
            value={(value as string) ?? ""}
            placeholder={question.placeholder ?? "Type your answer here..."}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full border-b-2 bg-transparent pb-3 text-lg text-brand-ink outline-none transition-colors placeholder:text-brand-muted/60 ${
              showEmailError ? "border-red-500" : "border-brand-line focus:border-brand-blue"
            }`}
          />
        )}
        {showEmailError && (
          <p className="mt-2 text-sm text-red-400">Please enter a valid email address.</p>
        )}

        {question.type === "phone" && (
          <PhoneField
            inputRef={inputRef as React.Ref<HTMLInputElement>}
            value={(value as string) ?? ""}
            onChange={(next) => onChange(next)}
            defaultCountry={defaultCountry}
          />
        )}
        {showPhoneError && (
          <p className="mt-2 text-sm text-red-400">Please enter a valid phone number.</p>
        )}

        {question.type === "long_text" && (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={(value as string) ?? ""}
            placeholder={question.placeholder ?? "Type your answer here..."}
            onChange={(e) => onChange(e.target.value)}
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

      <div className="mt-8 flex items-center gap-3">
        {onBack && (
          <button
            ref={backButtonRef}
            type="button"
            onClick={onBack}
            className="rounded-brand border border-brand-line px-5 py-3 text-sm font-semibold text-brand-ink transition-colors hover:bg-brand-surface"
          >
            Back
          </button>
        )}
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
