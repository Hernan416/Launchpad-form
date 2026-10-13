import { docs_v1, drive_v3, google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { Answers, Question } from "@/lib/types";

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

  const doc = await docsApi.documents.create({
    requestBody: {
      title: `${formTitle} — ${respondentLabel}`,
    },
  });

  const documentId = doc.data.documentId;
  if (!documentId) {
    throw new Error("No se pudo crear el documento de Google Docs");
  }

  await moveFileToFolder(driveApi, documentId, folderId);
  await writeDocContent(docsApi, documentId, formTitle, respondentLabel, questions, answers);

  return {
    documentId,
    documentLink: `https://docs.google.com/document/d/${documentId}/edit`,
  };
}

async function moveFileToFolder(driveApi: drive_v3.Drive, fileId: string, folderId: string) {
  const file = await driveApi.files.get({ fileId, fields: "parents" });
  const previousParents = (file.data.parents ?? []).join(",");

  await driveApi.files.update({
    fileId,
    addParents: folderId,
    removeParents: previousParents,
    fields: "id, parents",
  });
}

async function writeDocContent(
  docsApi: docs_v1.Docs,
  documentId: string,
  formTitle: string,
  respondentLabel: string,
  questions: Question[],
  answers: Answers
) {
  const lines: { text: string; style: "TITLE" | "HEADING_2" | "NORMAL_TEXT" }[] = [];

  lines.push({ text: formTitle, style: "TITLE" });
  lines.push({
    text: `Submitted by: ${respondentLabel} — ${new Date().toLocaleString("en-US")}`,
    style: "NORMAL_TEXT",
  });

  for (const question of questions) {
    lines.push({ text: question.title, style: "HEADING_2" });
    lines.push({ text: formatAnswer(question, answers), style: "NORMAL_TEXT" });
  }

  const requests: docs_v1.Schema$Request[] = [];
  let cursor = 1;
  const paragraphRanges: { start: number; end: number; style: "TITLE" | "HEADING_2" | "NORMAL_TEXT" }[] = [];

  for (const line of lines) {
    const text = `${line.text}\n`;
    requests.push({
      insertText: {
        location: { index: cursor },
        text,
      },
    });
    paragraphRanges.push({ start: cursor, end: cursor + text.length - 1, style: line.style });
    cursor += text.length;
  }

  for (const range of paragraphRanges) {
    requests.push({
      updateParagraphStyle: {
        range: { startIndex: range.start, endIndex: range.end },
        paragraphStyle: { namedStyleType: range.style },
        fields: "namedStyleType",
      },
    });
  }

  await docsApi.documents.batchUpdate({
    documentId,
    requestBody: { requests },
  });
}
