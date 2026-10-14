import { IntroContent } from "@/components/TypeformRunner";
import { Question } from "@/lib/types";

export const FORM_V2_TITLE = "LaunchPad Intake Form — SDR Only";

export const FORM_V2_INTRO: IntroContent = {
  eyebrow: "SDR Only System",
  title: "Welcome to LaunchPad",
  description:
    "The answers you provide on this intake form are incredibly important for us to build and launch a strong campaign for you. We will ask you for contact information as well as questions on your business and customer journey.",
  cta: "Start",
};

export const formV2Questions: Question[] = [
  {
    id: "name",
    type: "short_text",
    title: "What is your full name?",
    required: true,
  },
  {
    id: "company_name",
    type: "short_text",
    title: "What is your company name?",
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
    id: "office_address",
    type: "short_text",
    title: "What is your office address?",
    required: true,
  },
  {
    id: "customer_journey",
    type: "long_text",
    title:
      "Walk us through exactly what happens after a homeowner reaches out — from that first contact all the way to you getting paid.",
    description:
      "Make sure you mention:\n" +
      "• Do you go out for an in-person inspection first?\n" +
      "• Do you give the quote on the spot, or send it after?\n" +
      "• How do they pay for the roof replacement? (Deposits, finance, etc)\n" +
      "• How far are you willing to drive to do an inspection?",
    required: true,
  },
  {
    id: "drive_distance",
    type: "short_text",
    title: "How far are you willing to drive to do an inspection?",
    required: true,
  },
  {
    id: "lead_sources",
    type: "long_text",
    title: "List all the sources of your inbound leads",
    description: "e.g. Facebook ads, Google ads, website, etc.",
    required: true,
  },
  {
    id: "lead_storage",
    type: "long_text",
    title: "List the places where your leads are stored",
    description: "e.g. Jobber CRM, Roofr CRM, etc.",
    required: true,
  },
  {
    id: "incorporation_docs",
    type: "single_choice",
    title:
      "Do you have the original PDF copy of your incorporation documents / registered business documents?",
    required: true,
    options: [
      { value: "yes", label: "Yes" },
      { value: "no_will_bring", label: "No, but I will bring it ready for onboarding" },
    ],
  },
  {
    id: "zoom_app",
    type: "single_choice",
    title: "Do you have the full Zoom Application downloaded on your computer?",
    description: "Download it here: https://zoom.us/download",
    required: true,
    options: [
      { value: "yes", label: "Yes" },
      { value: "no_will_download", label: "No, but I will download it after I submit this form" },
    ],
  },
];
