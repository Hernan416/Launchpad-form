import { Question } from "@/lib/types";

export const FORM_V2_TITLE = "Form 2";

/**
 * Placeholder — replace with the real questions for Form 2.
 * The "name" question is used to label the Drive folder for each response.
 */
export const formV2Questions: Question[] = [
  {
    id: "name",
    type: "short_text",
    title: "What is your full name?",
    required: true,
  },
  {
    id: "company",
    type: "short_text",
    title: "What is your company name?",
    required: true,
  },
  {
    id: "interest",
    type: "single_choice",
    title: "What are you most interested in?",
    required: true,
    options: [
      { value: "product", label: "Product" },
      { value: "services", label: "Services" },
      { value: "partnership", label: "Strategic partnership" },
    ],
  },
];
