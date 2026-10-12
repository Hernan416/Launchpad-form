import { TypeformRunner } from "@/components/TypeformRunner";
import { FORM_V2_TITLE, formV2Questions } from "@/lib/questions/v2";

export default function FormV2Page() {
  return (
    <TypeformRunner formSlug="v2" formTitle={FORM_V2_TITLE} questions={formV2Questions} />
  );
}
