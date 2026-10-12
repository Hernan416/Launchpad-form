import { IntroContent } from "@/components/TypeformRunner";
import { Question } from "@/lib/types";

export const FORM_V1_TITLE = "LaunchPad Intake Form";

export const FORM_V1_INTRO: IntroContent = {
  eyebrow: "3-Step System",
  title: "Let's build your campaign",
  description:
    "The answers you provide on this intake form are incredibly important for us to build and launch a strong campaign for you. We'll ask for your contact information as well as questions about your business and customer journey.",
  estimatedTime: "Please set aside roughly 45 minutes to complete this form.",
  cta: "Start",
};

const YES_NO_OPTIONS = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

export const formV1Questions: Question[] = [
  {
    id: "name",
    type: "short_text",
    title: "What is your full name?",
    required: true,
  },
  {
    id: "email",
    type: "email",
    title: "What is your email address?",
    required: true,
  },
  {
    id: "phone",
    type: "phone",
    title: "What is your phone number that can receive text messages?",
    required: true,
  },
  {
    id: "website",
    type: "short_text",
    title: "What is your company website?",
    required: true,
  },
  {
    id: "customer_journey",
    type: "long_text",
    title:
      "Walk us through exactly what happens after a homeowner reaches out — from that first contact all the way to you getting paid. Just tell it like a story.",
    description:
      "To make sure we've got the full picture, try to mention:\n" +
      "• Do you go out for an in-person inspection first?\n" +
      "• Do you give the quote on the spot, or send it after?\n" +
      "• How do they pay for the roof replacement? (Deposits, finance, etc.)\n" +
      "• How far are you willing to drive to do an inspection?",
    required: true,
  },
  {
    id: "ad_budget",
    type: "short_text",
    title: "What's your monthly ad budget?",
    description: "Most clients start between $2,000–$5,000 for best results.",
    placeholder: "e.g. $2,000–$5,000",
    required: true,
  },
  {
    id: "differentiators",
    type: "long_text",
    title: "What can you offer to stand out from competitors?",
    description:
      "Examples:\n" +
      "• Discount (e.g. $500 off, 10% off)\n" +
      "• Freebie / bonus (e.g. free inspection, 150ft free gutter with a new roof, free upgrade from 30-yr to 40-yr shingles)\n" +
      "• Guarantee (workmanship warranty, satisfaction guarantee)\n" +
      "• Licensed/Insured",
    required: true,
  },
  {
    id: "facebook_login",
    type: "single_choice",
    title: "Can you log in to your Facebook account?",
    required: true,
    options: [
      { value: "yes", label: "Yes" },
      { value: "no_will_confirm", label: "No, but I will make sure I can before the onboarding call" },
    ],
  },
  {
    id: "incorporation_docs",
    type: "single_choice",
    title:
      "Do you have the original PDF copy of your incorporation documents / registered business documents?",
    required: true,
    options: YES_NO_OPTIONS,
  },
  {
    id: "facebook_business_page",
    type: "single_choice",
    title: "Do you have a Facebook business page?",
    required: true,
    options: YES_NO_OPTIONS,
  },
  {
    id: "facebook_ad_account",
    type: "single_choice",
    title: "Do you have an existing Facebook ad account?",
    required: true,
    options: YES_NO_OPTIONS,
  },
];
