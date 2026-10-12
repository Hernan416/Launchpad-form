import { TypeformRunner } from "@/components/TypeformRunner";
import { FORM_V1_INTRO, FORM_V1_TITLE, formV1Questions } from "@/lib/questions/v1";

export default function FormV1Page() {
  return (
    <TypeformRunner
      formSlug="v1"
      formTitle={FORM_V1_TITLE}
      questions={formV1Questions}
      intro={FORM_V1_INTRO}
    />
  );
}
