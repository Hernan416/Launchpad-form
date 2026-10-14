import { TypeformRunner } from "@/components/TypeformRunner";
import { getAppConfig } from "@/lib/google/config-store";
import { getVisitorCountry } from "@/lib/geo";

export default async function FormV2Page() {
  const config = await getAppConfig();

  return (
    <TypeformRunner
      formSlug="v2"
      formTitle={config.v2.title}
      questions={config.v2.questions}
      intro={config.v2.intro}
      defaultCountry={getVisitorCountry()}
    />
  );
}
