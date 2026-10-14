"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AppConfig,
  FormConfig,
  FormSlug,
  IntroContent,
  Question,
  QuestionOption,
  QuestionType,
} from "@/lib/types";

const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: "short_text", label: "Short text" },
  { value: "long_text", label: "Long text" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "single_choice", label: "Single choice" },
  { value: "multiple_choice", label: "Multiple choice" },
];

const LOAD_BEARING_IDS = new Set(["name", "company_name"]);

function cloneConfig(config: AppConfig): AppConfig {
  return JSON.parse(JSON.stringify(config));
}

function blankQuestion(): Question {
  return {
    id: `question_${Date.now()}`,
    type: "short_text",
    title: "New question",
    required: false,
  };
}

function blankOption(): QuestionOption {
  return { value: "", label: "" };
}

export function AdminPanel({ initialConfig }: { initialConfig: AppConfig }) {
  const router = useRouter();
  const [config, setConfig] = useState<AppConfig>(initialConfig);
  const [activeForm, setActiveForm] = useState<FormSlug>("v1");
  const [saving, setSaving] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "success" | "error">("idle");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const formConfig = config[activeForm];

  const duplicateIds = useMemo(() => {
    const seen = new Set<string>();
    const dupes = new Set<string>();
    for (const q of formConfig.questions) {
      if (seen.has(q.id)) dupes.add(q.id);
      seen.add(q.id);
    }
    return dupes;
  }, [formConfig.questions]);

  function updateFormConfig(patch: Partial<FormConfig>) {
    setConfig((prev) => ({ ...prev, [activeForm]: { ...prev[activeForm], ...patch } }));
  }

  function updateIntro(patch: Partial<IntroContent>) {
    updateFormConfig({ intro: { ...formConfig.intro, ...patch } });
  }

  function updateQuestion(index: number, patch: Partial<Question>) {
    const questions = formConfig.questions.slice();
    questions[index] = { ...questions[index], ...patch };
    updateFormConfig({ questions });
  }

  function moveQuestion(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= formConfig.questions.length) return;
    const questions = formConfig.questions.slice();
    [questions[index], questions[target]] = [questions[target], questions[index]];
    updateFormConfig({ questions });
  }

  function addQuestion() {
    updateFormConfig({ questions: [...formConfig.questions, blankQuestion()] });
  }

  function removeQuestion(index: number) {
    const q = formConfig.questions[index];
    const confirmed = window.confirm(
      `Delete question "${q.title || q.id}"? This cannot be undone once you save.`
    );
    if (!confirmed) return;
    const questions = formConfig.questions.slice();
    questions.splice(index, 1);
    updateFormConfig({ questions });
  }

  function updateOptions(qIndex: number, options: QuestionOption[]) {
    updateQuestion(qIndex, { options });
  }

  function addOption(qIndex: number) {
    const options = (formConfig.questions[qIndex].options ?? []).concat(blankOption());
    updateOptions(qIndex, options);
  }

  function updateOption(qIndex: number, oIndex: number, patch: Partial<QuestionOption>) {
    const options = (formConfig.questions[qIndex].options ?? []).slice();
    options[oIndex] = { ...options[oIndex], ...patch };
    updateOptions(qIndex, options);
  }

  function removeOption(qIndex: number, oIndex: number) {
    const options = (formConfig.questions[qIndex].options ?? []).slice();
    options.splice(oIndex, 1);
    updateOptions(qIndex, options);
  }

  function moveOption(qIndex: number, oIndex: number, direction: -1 | 1) {
    const options = (formConfig.questions[qIndex].options ?? []).slice();
    const target = oIndex + direction;
    if (target < 0 || target >= options.length) return;
    [options[oIndex], options[target]] = [options[target], options[oIndex]];
    updateOptions(qIndex, options);
  }

  async function handleSave() {
    if (duplicateIds.size > 0) {
      setSaveState("error");
      setSaveMessage(`Duplicate question IDs: ${Array.from(duplicateIds).join(", ")}. Fix before saving.`);
      return;
    }
    if (formConfig.questions.some((q) => !q.id.trim())) {
      setSaveState("error");
      setSaveMessage("Every question needs a non-empty ID.");
      return;
    }

    setSaving(true);
    setSaveState("idle");
    setSaveMessage(null);

    try {
      const res = await fetch("/api/admin/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || "Save failed.");
      }

      setSaveState("success");
      setSaveMessage("Saved. Changes are live on the public form now.");
    } catch (err) {
      setSaveState("error");
      setSaveMessage(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } finally {
      router.push("/admin/login");
      router.refresh();
    }
  }

  function handleDiscard() {
    const confirmed = window.confirm("Discard all unsaved changes and reload the last saved config?");
    if (!confirmed) return;
    setConfig(cloneConfig(initialConfig));
    setSaveState("idle");
    setSaveMessage(null);
  }

  return (
    <div className="min-h-screen bg-brand-bg pb-24 text-brand-ink">
      <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-brand-line bg-brand-bg/95 px-6 py-4 backdrop-blur">
        <div>
          <h1 className="font-display text-lg font-bold">LaunchPad Admin</h1>
          <p className="text-xs text-brand-muted">Edit the live content of /v1 and /v2</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleDiscard}
            className="rounded-brand border border-brand-line px-4 py-2 text-sm font-medium text-brand-muted transition-colors hover:text-brand-ink"
          >
            Discard changes
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-brand bg-brand-blue px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-blue-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="rounded-brand border border-brand-line px-4 py-2 text-sm font-medium text-brand-muted transition-colors hover:text-brand-ink"
          >
            Log out
          </button>
        </div>
      </header>

      {saveMessage && (
        <div
          className={`mx-6 mt-4 rounded-brand border px-4 py-3 text-sm ${
            saveState === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-red-500/30 bg-red-500/10 text-red-300"
          }`}
        >
          {saveMessage}
        </div>
      )}

      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="mb-8 flex gap-2 rounded-brand border border-brand-line bg-brand-surface p-1">
          {(["v1", "v2"] as FormSlug[]).map((slug) => (
            <button
              key={slug}
              type="button"
              onClick={() => setActiveForm(slug)}
              className={`flex-1 rounded-brand px-4 py-2 text-sm font-semibold transition-colors ${
                activeForm === slug
                  ? "bg-brand-blue text-white"
                  : "text-brand-muted hover:text-brand-ink"
              }`}
            >
              {slug === "v1" ? "Form 1 (v1)" : "Form 2 (v2)"}
            </button>
          ))}
        </div>

        <Section title="Form settings">
          <Field label="Form title">
            <TextInput
              value={formConfig.title}
              onChange={(value) => updateFormConfig({ title: value })}
            />
          </Field>
        </Section>

        <Section title="Intro screen">
          <Field label="Eyebrow (small label above the title)">
            <TextInput
              value={formConfig.intro.eyebrow ?? ""}
              onChange={(value) => updateIntro({ eyebrow: value })}
            />
          </Field>
          <Field label="Title">
            <TextInput
              value={formConfig.intro.title}
              onChange={(value) => updateIntro({ title: value })}
            />
          </Field>
          <Field label="Description">
            <TextArea
              value={formConfig.intro.description}
              onChange={(value) => updateIntro({ description: value })}
              rows={3}
            />
          </Field>
          <Field label="Estimated time (optional)">
            <TextInput
              value={formConfig.intro.estimatedTime ?? ""}
              onChange={(value) => updateIntro({ estimatedTime: value })}
              placeholder="e.g. Takes about 5 minutes"
            />
          </Field>
          <Field label="CTA button label">
            <TextInput
              value={formConfig.intro.cta ?? ""}
              onChange={(value) => updateIntro({ cta: value })}
              placeholder="Start"
            />
          </Field>
        </Section>

        <Section title={`Questions (${formConfig.questions.length})`}>
          <div className="flex flex-col gap-4">
            {formConfig.questions.map((question, index) => (
              <QuestionCard
                key={index}
                question={question}
                index={index}
                total={formConfig.questions.length}
                isDuplicateId={duplicateIds.has(question.id)}
                onChange={(patch) => updateQuestion(index, patch)}
                onMove={(direction) => moveQuestion(index, direction)}
                onRemove={() => removeQuestion(index)}
                onAddOption={() => addOption(index)}
                onUpdateOption={(oIndex, patch) => updateOption(index, oIndex, patch)}
                onRemoveOption={(oIndex) => removeOption(index, oIndex)}
                onMoveOption={(oIndex, direction) => moveOption(index, oIndex, direction)}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={addQuestion}
            className="mt-4 w-full rounded-brand border border-dashed border-brand-line px-4 py-3 text-sm font-semibold text-brand-muted transition-colors hover:border-brand-blue hover:text-brand-ink"
          >
            + Add question
          </button>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="mb-4 font-display text-base font-bold text-brand-ink">{title}</h2>
      <div className="rounded-brand-lg border border-brand-line bg-brand-surface p-5">
        {children}
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 last:mb-0">
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-brand-muted">
        {label}
      </label>
      {children}
    </div>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-brand border border-brand-line bg-brand-bg px-3 py-2 text-sm text-brand-ink outline-none transition-colors placeholder:text-brand-muted/50 focus:border-brand-blue"
    />
  );
}

function TextArea({
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      className="w-full resize-y rounded-brand border border-brand-line bg-brand-bg px-3 py-2 text-sm text-brand-ink outline-none transition-colors placeholder:text-brand-muted/50 focus:border-brand-blue"
    />
  );
}

function QuestionCard({
  question,
  index,
  total,
  isDuplicateId,
  onChange,
  onMove,
  onRemove,
  onAddOption,
  onUpdateOption,
  onRemoveOption,
  onMoveOption,
}: {
  question: Question;
  index: number;
  total: number;
  isDuplicateId: boolean;
  onChange: (patch: Partial<Question>) => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
  onAddOption: () => void;
  onUpdateOption: (oIndex: number, patch: Partial<QuestionOption>) => void;
  onRemoveOption: (oIndex: number) => void;
  onMoveOption: (oIndex: number, direction: -1 | 1) => void;
}) {
  const hasOptions = question.type === "single_choice" || question.type === "multiple_choice";
  const isLoadBearing = LOAD_BEARING_IDS.has(question.id);

  return (
    <div className="rounded-brand border border-brand-line bg-brand-bg p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold text-brand-muted">Question {index + 1}</span>
        <div className="flex items-center gap-1.5">
          <IconButton label="Move up" onClick={() => onMove(-1)} disabled={index === 0}>
            ↑
          </IconButton>
          <IconButton label="Move down" onClick={() => onMove(1)} disabled={index === total - 1}>
            ↓
          </IconButton>
          <IconButton label="Delete question" onClick={onRemove} danger>
            ✕
          </IconButton>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="ID">
          <TextInput value={question.id} onChange={(value) => onChange({ id: value })} />
          {isLoadBearing && (
            <p className="mt-1 text-xs text-brand-yellow">
              ⚠ Load-bearing ID — the submit route reads <code>answers[&quot;{question.id}&quot;]</code> to
              build the Drive folder name. Renaming it will break folder naming unless you also
              update app/api/submit/[form]/route.ts.
            </p>
          )}
          {isDuplicateId && (
            <p className="mt-1 text-xs text-red-400">Duplicate ID — must be unique within this form.</p>
          )}
        </Field>

        <Field label="Type">
          <select
            value={question.type}
            onChange={(e) => onChange({ type: e.target.value as QuestionType })}
            className="w-full rounded-brand border border-brand-line bg-brand-bg px-3 py-2 text-sm text-brand-ink outline-none transition-colors focus:border-brand-blue"
          >
            {QUESTION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="mt-3">
        <Field label="Title">
          <TextInput value={question.title} onChange={(value) => onChange({ title: value })} />
        </Field>
      </div>

      <div className="mt-3">
        <Field label="Description (optional, shown as hint text below the title)">
          <TextArea
            value={question.description ?? ""}
            onChange={(value) => onChange({ description: value })}
            rows={3}
          />
        </Field>
      </div>

      {!hasOptions && (
        <div className="mt-3">
          <Field label="Placeholder (optional)">
            <TextInput
              value={question.placeholder ?? ""}
              onChange={(value) => onChange({ placeholder: value })}
            />
          </Field>
        </div>
      )}

      <div className="mt-3 flex items-center gap-2">
        <input
          type="checkbox"
          id={`required-${index}`}
          checked={Boolean(question.required)}
          onChange={(e) => onChange({ required: e.target.checked })}
          className="h-4 w-4 rounded border-brand-line bg-brand-bg accent-brand-blue"
        />
        <label htmlFor={`required-${index}`} className="text-sm text-brand-ink">
          Required
        </label>
      </div>

      {hasOptions && (
        <div className="mt-4 border-t border-brand-line pt-4">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-brand-muted">
            Options
          </span>
          <div className="flex flex-col gap-2">
            {(question.options ?? []).map((opt, oIndex) => (
              <div key={oIndex} className="flex items-center gap-2">
                <input
                  type="text"
                  value={opt.value}
                  placeholder="value"
                  onChange={(e) => onUpdateOption(oIndex, { value: e.target.value })}
                  className="w-1/3 rounded-brand border border-brand-line bg-brand-bg px-3 py-2 text-sm text-brand-ink outline-none transition-colors placeholder:text-brand-muted/50 focus:border-brand-blue"
                />
                <input
                  type="text"
                  value={opt.label}
                  placeholder="label shown to the user"
                  onChange={(e) => onUpdateOption(oIndex, { label: e.target.value })}
                  className="flex-1 rounded-brand border border-brand-line bg-brand-bg px-3 py-2 text-sm text-brand-ink outline-none transition-colors placeholder:text-brand-muted/50 focus:border-brand-blue"
                />
                <IconButton
                  label="Move option up"
                  onClick={() => onMoveOption(oIndex, -1)}
                  disabled={oIndex === 0}
                >
                  ↑
                </IconButton>
                <IconButton
                  label="Move option down"
                  onClick={() => onMoveOption(oIndex, 1)}
                  disabled={oIndex === (question.options?.length ?? 1) - 1}
                >
                  ↓
                </IconButton>
                <IconButton label="Remove option" onClick={() => onRemoveOption(oIndex)} danger>
                  ✕
                </IconButton>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={onAddOption}
            className="mt-3 rounded-brand border border-dashed border-brand-line px-3 py-1.5 text-xs font-semibold text-brand-muted transition-colors hover:border-brand-blue hover:text-brand-ink"
          >
            + Add option
          </button>
        </div>
      )}
    </div>
  );
}

function IconButton({
  children,
  label,
  onClick,
  disabled,
  danger,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={`flex h-7 w-7 items-center justify-center rounded border text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${
        danger
          ? "border-red-500/30 text-red-400 hover:bg-red-500/10"
          : "border-brand-line text-brand-muted hover:text-brand-ink"
      }`}
    >
      {children}
    </button>
  );
}
