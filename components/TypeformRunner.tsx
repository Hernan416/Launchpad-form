"use client";

import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { Country } from "react-phone-number-input";
import { Answers, FormSlug, IntroContent, Question } from "@/lib/types";
import { ProgressBar } from "@/components/ProgressBar";
import { QuestionStep } from "@/components/QuestionStep";
import { LaunchPadLogo } from "@/components/LaunchPadLogo";
import { BookingCalendar } from "@/components/BookingCalendar";
import { isValidEmail, isValidPhone } from "@/lib/validation";

type Status =
  | "intro"
  | "intro_details"
  | "running"
  | "submitting"
  | "booking_prompt"
  | "booking"
  | "done"
  | "error";

export type { IntroContent };

export function TypeformRunner({
  formSlug,
  formTitle,
  questions,
  intro,
  defaultCountry,
}: {
  formSlug: FormSlug;
  formTitle: string;
  questions: Question[];
  intro?: IntroContent;
  defaultCountry?: Country;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [status, setStatus] = useState<Status>(intro ? "intro" : "running");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isSubmittingRef = useRef(false);

  const currentQuestion = questions[stepIndex];
  const isLastStep = stepIndex === questions.length - 1;

  const canAdvance = useMemo(() => {
    const value = answers[currentQuestion?.id];
    const hasValue = Array.isArray(value) ? value.length > 0 : Boolean(value && value.trim().length > 0);

    if (!hasValue) return !currentQuestion?.required;

    if (currentQuestion.type === "email" && typeof value === "string") {
      return isValidEmail(value);
    }
    if (currentQuestion.type === "phone" && typeof value === "string") {
      return isValidPhone(value);
    }

    return true;
  }, [answers, currentQuestion]);

  const handleChange = (value: string | string[]) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
  };

  const handleSubmitForm = async () => {
    setStatus("submitting");
    setErrorMessage(null);

    const respondentLabel =
      (answers["name"] as string) || (answers["company_name"] as string) || "Unnamed response";

    try {
      const res = await fetch(`/api/submit/${formSlug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formSlug,
          formTitle,
          respondentLabel,
          answers,
          questions,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || "We couldn't submit your form.");
      }

      setStatus("booking_prompt");
    } catch (err) {
      isSubmittingRef.current = false;
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  const handleAdvance = () => {
    if (!canAdvance) return;
    if (isLastStep) {
      if (isSubmittingRef.current) return;
      isSubmittingRef.current = true;
      void handleSubmitForm();
    } else {
      setStepIndex((i) => Math.min(i + 1, questions.length - 1));
    }
  };

  const handleBack = () => {
    setStepIndex((i) => Math.max(i - 1, 0));
  };

  if (status === "intro" && intro) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-brand-bg px-6 text-center">
        <LaunchPadLogo className="h-10 w-auto" />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex max-w-xl flex-col items-center gap-4"
        >
          {intro.eyebrow && (
            <span className="text-xs font-bold uppercase tracking-wide text-brand-yellow">
              {intro.eyebrow}
            </span>
          )}
          <h1 className="font-display text-3xl font-bold text-brand-ink sm:text-4xl">
            {intro.title}
          </h1>
          <button
            type="button"
            onClick={() => setStatus("intro_details")}
            className="mt-4 rounded-brand bg-brand-blue px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-blue-dark"
          >
            {intro.cta ?? "Start"}
          </button>
        </motion.div>
      </div>
    );
  }

  if (status === "intro_details" && intro) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-brand-bg px-6 text-center">
        <LaunchPadLogo className="h-10 w-auto" />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex max-w-xl flex-col items-center gap-4"
        >
          <p className="text-brand-muted">{intro.description}</p>
          {intro.estimatedTime && (
            <p className="text-sm text-brand-muted/80">⏱ {intro.estimatedTime}</p>
          )}
          <button
            type="button"
            onClick={() => setStatus("running")}
            className="mt-4 rounded-brand bg-brand-blue px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-blue-dark"
          >
            Next
          </button>
        </motion.div>
      </div>
    );
  }

  if (status === "booking_prompt") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-brand-bg px-6 text-center">
        <LaunchPadLogo className="h-10 w-auto" />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="flex max-w-md flex-col items-center gap-4"
        >
          <h1 className="font-display text-3xl font-bold text-brand-ink">You&apos;re all set!</h1>
          <p className="text-brand-muted">
            Your answers were received. The last step is scheduling your onboarding call so we
            can kick things off.
          </p>
          <div className="mt-2 flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => setStatus("booking")}
              className="rounded-brand bg-brand-blue px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-blue-dark"
            >
              Schedule My Onboarding Call
            </button>
            <button
              type="button"
              onClick={() => setStatus("done")}
              className="text-sm font-medium text-brand-muted underline transition-colors hover:text-brand-ink"
            >
              I&apos;ve already booked my onboarding call
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (status === "booking") {
    return (
      <div className="flex min-h-screen flex-col items-center gap-6 bg-brand-bg px-6 py-10 text-center">
        <LaunchPadLogo className="h-10 w-auto" />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex w-full max-w-5xl flex-col items-center gap-4"
        >
          <h1 className="font-display text-2xl font-bold text-brand-ink sm:text-3xl">
            Pick a time for your onboarding call
          </h1>
          <BookingCalendar />
          <button
            type="button"
            onClick={() => setStatus("done")}
            className="text-sm font-medium text-white underline transition-opacity hover:opacity-80"
          >
            I&apos;ll do this later
          </button>
        </motion.div>
      </div>
    );
  }

  if (status === "done") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-brand-bg px-6 text-center">
        <LaunchPadLogo className="h-10 w-auto" />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center gap-3"
        >
          <h1 className="font-display text-3xl font-bold text-brand-ink">Thank you!</h1>
          <p className="max-w-md text-brand-muted">
            Your answers were received. Our team will be in touch with you shortly.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-brand-bg">
      <ProgressBar current={stepIndex} total={questions.length} />

      <header className="flex justify-center pt-8">
        <LaunchPadLogo className="h-8 w-auto" />
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-10">
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="w-full flex justify-center"
        >
          <QuestionStep
            question={currentQuestion}
            value={answers[currentQuestion.id]}
            onChange={handleChange}
            onSubmit={handleAdvance}
            onBack={stepIndex > 0 ? handleBack : undefined}
            defaultCountry={defaultCountry}
          />
        </motion.div>
      </main>

      {status === "submitting" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-brand border border-brand-line bg-brand-surface px-6 py-3 text-sm font-medium text-brand-ink">
            <span className="h-2 w-2 animate-ping rounded-full bg-brand-blue" />
            Submitting your answers...
          </div>
        </div>
      )}

      {status === "error" && errorMessage && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-brand border border-red-500/30 bg-red-500/10 px-5 py-3 text-sm text-red-300">
          {errorMessage}
        </div>
      )}

      <footer className="pb-6 text-center text-xs text-brand-muted">
        {stepIndex + 1} / {questions.length}
      </footer>
    </div>
  );
}
