const GHL_API_BASE = "https://services.leadconnectorhq.com";
const GHL_API_VERSION = "2021-07-28";

// This is a fixed, shared "notification" contact — intake submissions never
// create or touch a real contact. We just stamp this one contact's custom
// fields with the latest submission and re-fire the workflow below, whose
// Internal Notification step reads those fields back out via merge tags.
const NOTIFICATION_CONTACT_ID = "99w5QOfTVC0URbotTjln";
const INTAKE_WORKFLOW_ID = "40585887-8ff5-4085-b888-8ea4775be494";

const CUSTOM_FIELD_IDS = {
  clientName: "BRbvXVzZbuhc6erm5Ape", // Intake - Client Name
  companyName: "xWuJSLJE2a3e67cL10VU", // Intake - Company Name
  driveLink: "XlgzeYijmzNB5L8kg5Ld", // Intake - Drive Link
};

function getGhlToken(): string {
  const token = process.env.GHL_PRIVATE_TOKEN;
  if (!token) {
    throw new Error("Missing environment variable GHL_PRIVATE_TOKEN");
  }
  return token;
}

async function ghlRequest(path: string, init: RequestInit): Promise<void> {
  const res = await fetch(`${GHL_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getGhlToken()}`,
      Version: GHL_API_VERSION,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`GHL API ${path} failed: ${res.status} ${body}`);
  }
}

/**
 * Stamps the shared notification contact with this submission's details and
 * re-fires the intake workflow so its Internal Notification step picks up
 * the fresh values. Never creates or assigns a real contact.
 */
export async function notifyIntakeSubmission(details: {
  clientName: string;
  companyName: string;
  driveLink: string;
}): Promise<void> {
  await ghlRequest(`/contacts/${NOTIFICATION_CONTACT_ID}`, {
    method: "PUT",
    body: JSON.stringify({
      customFields: [
        { id: CUSTOM_FIELD_IDS.clientName, value: details.clientName },
        { id: CUSTOM_FIELD_IDS.companyName, value: details.companyName },
        { id: CUSTOM_FIELD_IDS.driveLink, value: details.driveLink },
      ],
    }),
  });

  await ghlRequest(`/contacts/${NOTIFICATION_CONTACT_ID}/workflow/${INTAKE_WORKFLOW_ID}`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}
