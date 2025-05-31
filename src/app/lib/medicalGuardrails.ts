import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";

// Define guardrail categories specific to medical reception
export const MEDICAL_GUARDRAIL_CATEGORIES = [
  "MEDICAL_ADVICE",           // Providing medical advice or diagnosis
  "PRESCRIPTION_HANDLING",    // Discussing prescriptions inappropriately
  "CONFIDENTIAL_INFO",        // Sharing confidential patient information
  "EMERGENCY_MISHANDLING",    // Not properly directing emergencies
  "OFF_TOPIC",               // Discussing non-medical reception topics
  "INAPPROPRIATE_SCHEDULING", // Scheduling inappropriate appointments
  "NONE",                    // Content is appropriate
] as const;

export type MedicalGuardrailCategory = (typeof MEDICAL_GUARDRAIL_CATEGORIES)[number];

export const MedicalGuardrailCategoryZod = z.enum([...MEDICAL_GUARDRAIL_CATEGORIES]);

export const MedicalGuardrailOutputZod = z.object({
  category: MedicalGuardrailCategoryZod,
  rationale: z.string(),
  severity: z.enum(["LOW", "MEDIUM", "HIGH"]),
  shouldIntervene: z.boolean(),
  suggestedResponse: z.string().optional(),
});

export type MedicalGuardrailOutput = z.infer<typeof MedicalGuardrailOutputZod>;

export async function runMedicalGuardrailClassifier(message: string): Promise<MedicalGuardrailOutput> {
  const messages = [
    {
      role: "user",
      content: `You are an expert medical compliance officer tasked with ensuring a medical reception AI agent stays within appropriate boundaries. Analyze the provided message and classify it according to medical reception policies.

<clinic_context>
- Clinic: Dr. Sarah Johnson Family Medicine
- Agent Role: Medical Receptionist (Emma)
- Allowed Functions: Appointment scheduling, clinic information, basic administrative tasks
- Prohibited: Medical advice, diagnosis, prescription discussions, sharing patient info
</clinic_context>

<message_to_analyze>
${message}
</message_to_analyze>

<guardrail_categories>
- MEDICAL_ADVICE: Providing medical advice, diagnosis, treatment recommendations, or medical opinions
- PRESCRIPTION_HANDLING: Discussing specific medications, dosages, or prescription-related medical information
- CONFIDENTIAL_INFO: Sharing or requesting specific patient medical information or confidential details
- EMERGENCY_MISHANDLING: Failing to properly direct emergencies to appropriate emergency services
- OFF_TOPIC: Discussing topics unrelated to medical reception duties (politics, personal opinions, non-medical topics)
- INAPPROPRIATE_SCHEDULING: Attempting to schedule procedures/services not offered by the clinic
- NONE: Content is appropriate for a medical receptionist
</guardrail_categories>

<severity_levels>
- HIGH: Immediate intervention required (medical advice, emergencies, confidential info)
- MEDIUM: Should be redirected but not critical (off-topic, inappropriate scheduling)
- LOW: Minor boundary issue, gentle correction needed
</severity_levels>

Analyze the message and provide a classification with reasoning. If intervention is needed, suggest an appropriate redirect response that maintains the receptionist persona.`,
    },
  ];

  const response = await fetch("/api/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages,
      response_format: zodResponseFormat(MedicalGuardrailOutputZod, "medical_guardrail_format"),
    }),
  });

  if (!response.ok) {
    console.warn("Server returned an error:", response);
    return Promise.reject("Error with runMedicalGuardrailClassifier.");
  }

  const data = await response.json();

  try {
    const parsedContent = JSON.parse(data.choices[0].message.content);
    const output = MedicalGuardrailOutputZod.parse(parsedContent);
    return output;
  } catch (error) {
    console.error("Error parsing medical guardrail output:", error);
    return Promise.reject("Failed to parse medical guardrail output.");
  }
}