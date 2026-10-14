import { TypeformRunner } from "@/components/TypeformRunner";
import { getAppConfig } from "@/lib/google/config-store";
import { getVisitorCountry } from "@/lib/geo";

export default async function FormV1Page() {
  const config = await getAppConfig();

  return (
    <TypeformRunner
      formSlug="v1"
      formTitle={config.v1.title}
      questions={config.v1.questions}
      intro={config.v1.intro}
      defaultCountry={getVisitorCountry()}
    />
  );
}
