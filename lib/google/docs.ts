import { docs_v1, google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { Answers, Question } from "@/lib/types";

// LaunchPad brand accents — darker, more subdued tones for a printable
// white-page document (the bright on-screen brand colors read as too
// loud/washed out on paper).
const TITLE_BLACK = hexToRgb("#111111");
const BRAND_BLUE_DARK = hexToRgb("#0A2E5C");
const BRAND_GOLD_DARK = hexToRgb("#8A6D00");
const MUTED_GRAY = hexToRgb("#6B7280");
const ANSWER_TEXT = hexToRgb("#1F2937");
const ANSWER_BG = hexToRgb("#F4F6F9");

function hexToRgb(hex: string): { red: number; green: number; blue: number } {
  const clean = hex.replace("#", "");
  return {
    red: parseInt(clean.slice(0, 2), 16) / 255,
    green: parseInt(clean.slice(2, 4), 16) / 255,
    blue: parseInt(clean.slice(4, 6), 16) / 255,
  };
}

function pt(magnitude: number): docs_v1.Schema$Dimension {
  return { magnitude, unit: "PT" };
}

function color(rgb: { red: number; green: number; blue: number }): docs_v1.Schema$OptionalColor {
  return { color: { rgbColor: rgb } };
}

function formatAnswer(question: Question, answers: Answers): string {
  const value = answers[question.id];
  if (value === undefined || value === null || value === "") return "No answer";

  if (Array.isArray(value)) {
    if (value.length === 0) return "No answer";
    const labels = value.map((v) => question.options?.find((o) => o.value === v)?.label ?? v);
    return labels.join(", ");
  }

  if (question.options) {
    return question.options.find((o) => o.value === value)?.label ?? value;
  }

  return value;
}

export async function createResponseDoc(
  auth: OAuth2Client,
  folderId: string,
  formTitle: string,
  respondentLabel: string,
  questions: Question[],
  answers: Answers
) {
  const docsApi = google.docs({ version: "v1", auth });
  const driveApi = google.drive({ version: "v3", auth });

  // Created directly inside the destination folder via the Drive API —
  // Docs API's own `documents.create` always lands in "My Drive" root,
  // which would require a separate get-parents + move round trip.
  const file = await driveApi.files.create({
    requestBody: {
      name: `${formTitle} — ${respondentLabel}`,
      mimeType: "application/vnd.google-apps.document",
      parents: [folderId],
    },
    fields: "id",
    supportsAllDrives: true,
  });

  const documentId = file.data.id;
  if (!documentId) {
    throw new Error("Could not create the Google Doc");
  }

  await writeDocContent(docsApi, documentId, formTitle, respondentLabel, questions, answers);

  return {
    documentId,
    documentLink: `https://docs.google.com/document/d/${documentId}/edit`,
  };
}

interface Block {
  text: string;
  paragraphStyle: docs_v1.Schema$ParagraphStyle;
  paragraphFields: string;
  textStyle?: docs_v1.Schema$TextStyle;
  textFields?: string;
}

async function writeDocContent(
  docsApi: docs_v1.Docs,
  documentId: string,
  formTitle: string,
  respondentLabel: string,
  questions: Question[],
  answers: Answers
) {
  const submittedAt = new Date().toLocaleString("en-US", {
    dateStyle: "long",
    timeStyle: "short",
  });

  const blocks: Block[] = [];

  // --- Header -------------------------------------------------------
  blocks.push({
    text: formTitle,
    paragraphStyle: {
      namedStyleType: "TITLE",
      spaceAbove: pt(0),
      spaceBelow: pt(4),
    },
    paragraphFields: "namedStyleType,spaceAbove,spaceBelow",
    textStyle: {
      bold: true,
      fontSize: pt(26),
      foregroundColor: color(TITLE_BLACK),
    },
    textFields: "bold,fontSize,foregroundColor",
  });

  blocks.push({
    text: `Submitted by ${respondentLabel}  •  ${submittedAt}`,
    paragraphStyle: {
      namedStyleType: "NORMAL_TEXT",
      spaceBelow: pt(20),
      borderBottom: {
        color: color(BRAND_GOLD_DARK),
        width: pt(2.25),
        padding: pt(8),
        dashStyle: "SOLID",
      },
    },
    paragraphFields: "namedStyleType,spaceBelow,borderBottom",
    textStyle: {
      italic: true,
      fontSize: pt(10.5),
      foregroundColor: color(MUTED_GRAY),
    },
    textFields: "italic,fontSize,foregroundColor",
  });

  // --- Question / answer pairs --------------------------------------
  for (const question of questions) {
    blocks.push({
      text: question.title,
      paragraphStyle: {
        namedStyleType: "HEADING_3",
        spaceAbove: pt(18),
        spaceBelow: pt(6),
      },
      paragraphFields: "namedStyleType,spaceAbove,spaceBelow",
      textStyle: {
        bold: true,
        fontSize: pt(12.5),
        foregroundColor: color(BRAND_BLUE_DARK),
      },
      textFields: "bold,fontSize,foregroundColor",
    });

    blocks.push({
      text: formatAnswer(question, answers),
      paragraphStyle: {
        namedStyleType: "NORMAL_TEXT",
        spaceBelow: pt(10),
        shading: {
          backgroundColor: color(ANSWER_BG),
        },
        borderLeft: {
          color: color(BRAND_GOLD_DARK),
          width: pt(3),
          padding: pt(10),
          dashStyle: "SOLID",
        },
      },
      paragraphFields: "namedStyleType,spaceBelow,shading,borderLeft",
      textStyle: {
        fontSize: pt(11),
        foregroundColor: color(ANSWER_TEXT),
      },
      textFields: "fontSize,foregroundColor",
    });
  }

  // --- Build requests -------------------------------------------------
  const requests: docs_v1.Schema$Request[] = [];
  let cursor = 1;
  const ranges: { start: number; end: number; block: Block }[] = [];

  for (const block of blocks) {
    const text = `${block.text}\n`;
    requests.push({
      insertText: {
        location: { index: cursor },
        text,
      },
    });
    ranges.push({ start: cursor, end: cursor + text.length - 1, block });
    cursor += text.length;
  }

  for (const { start, end, block } of ranges) {
    requests.push({
      updateParagraphStyle: {
        range: { startIndex: start, endIndex: end },
        paragraphStyle: block.paragraphStyle,
        fields: block.paragraphFields,
      },
    });

    if (block.textStyle && block.textFields) {
      requests.push({
        updateTextStyle: {
          range: { startIndex: start, endIndex: end },
          textStyle: block.textStyle,
          fields: block.textFields,
        },
      });
    }
  }

  await docsApi.documents.batchUpdate({
    documentId,
    requestBody: { requests },
  });
}
