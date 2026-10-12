import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getGoogleAuthClient } from "@/lib/google/auth";
import { createRespondentFolder } from "@/lib/google/drive";
import { createResponseDoc } from "@/lib/google/docs";

export const runtime = "nodejs";

const payloadSchema = z.object({
  formSlug: z.enum(["v1", "v2"]),
  formTitle: z.string().min(1),
  respondentLabel: z.string().min(1),
  answers: z.record(z.union([z.string(), z.array(z.string())])),
  questions: z.array(
    z.object({
      id: z.string(),
      type: z.enum([
        "short_text",
        "long_text",
        "email",
        "phone",
        "single_choice",
        "multiple_choice",
      ]),
      title: z.string(),
      description: z.string().optional(),
      placeholder: z.string().optional(),
      required: z.boolean().optional(),
      options: z
        .array(z.object({ value: z.string(), label: z.string() }))
        .optional(),
    })
  ),
});

export async function POST(req: NextRequest, { params }: { params: { form: string } }) {
  if (params.form !== "v1" && params.form !== "v2") {
    return NextResponse.json({ error: "Formulario no válido" }, { status: 404 });
  }

  const json = await req.json().catch(() => null);
  const parsed = payloadSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: "Datos de formulario inválidos" }, { status: 400 });
  }

  const { formTitle, respondentLabel, answers, questions } = parsed.data;

  try {
    const auth = getGoogleAuthClient();
    const { folderId } = await createRespondentFolder(auth, respondentLabel);
    const { documentLink } = await createResponseDoc(
      auth,
      folderId,
      formTitle,
      respondentLabel,
      questions,
      answers
    );

    return NextResponse.json({ ok: true, documentLink });
  } catch (error) {
    console.error("Error al procesar el envío del formulario:", error);
    return NextResponse.json(
      { error: "No se pudo guardar el formulario. Intenta de nuevo más tarde." },
      { status: 500 }
    );
  }
}
