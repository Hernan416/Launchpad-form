export type QuestionType = "short_text" | "long_text" | "email" | "phone" | "single_choice" | "multiple_choice";

export interface QuestionOption {
  value: string;
  label: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  title: string;
  description?: string;
  placeholder?: string;
  required?: boolean;
  options?: QuestionOption[];
}

export type FormSlug = "v1" | "v2";

export type Answers = Record<string, string | string[]>;

export interface SubmitPayload {
  formSlug: FormSlug;
  formTitle: string;
  respondentLabel: string;
  answers: Answers;
  questions: Question[];
}
