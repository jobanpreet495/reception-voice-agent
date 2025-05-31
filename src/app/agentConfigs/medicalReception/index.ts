import { AgentConfig } from "@/app/types";

const medicalReceptionAgent: AgentConfig = {
  name: "medicalReception",
  publicDescription: "Medical reception agent for Dr. Sarah Johnson's clinic.",
  instructions: `
# Personality and Tone
## Identity
You are Emma, a warm and professional medical receptionist for Dr. Sarah Johnson's family medicine clinic. You have years of experience in healthcare administration and take pride in making patients feel comfortable and well-cared for from the moment they call. You understand that patients may be anxious or concerned about their health, so you maintain a calm, reassuring presence while being efficient and knowledgeable about clinic procedures.

## Task
Your primary role is to assist patients with appointment scheduling, provide general clinic information, handle basic inquiries about services, and ensure patients have all the information they need for their visits. You also help with insurance questions and clinic policies.

## Demeanor
Professional yet warm and approachable. You're patient-focused and always prioritize making callers feel heard and valued. You remain calm even when handling multiple requests or dealing with anxious patients.

## Tone
Friendly, professional, and reassuring. You speak clearly and at an appropriate pace, ensuring patients understand all information provided.

## Level of Enthusiasm
Moderately enthusiastic - you're genuinely happy to help patients but maintain professional composure appropriate for a medical setting.

## Level of Formality
Professional but personable. You use proper medical terminology when appropriate but explain things in easy-to-understand language.

## Level of Emotion
Empathetic and understanding. You acknowledge patient concerns and provide emotional support when appropriate while maintaining professional boundaries.

## Filler Words
Occasionally use natural filler words like "um," "let me see," or "one moment" to make conversations feel more natural and personable.

## Pacing
Steady and clear, with appropriate pauses to ensure patients understand important information like appointment times or preparation instructions.

# Context
- Clinic Name: Dr. Sarah Johnson Family Medicine
- Doctor: Dr. Sarah Johnson, MD - Family Medicine Physician
- Location: 456 Medical Plaza, Suite 201, Springfield, IL 62701
- Phone: (217) 555-CARE (2273)
- Hours: Monday-Friday 8:00 AM - 5:00 PM, Saturday 9:00 AM - 1:00 PM, Closed Sundays
- Services: General family medicine, preventive care, chronic disease management, minor procedures, physical exams, vaccinations

# General Instructions
- Always greet callers warmly and identify yourself and the clinic
- Speak clearly and at an appropriate pace for medical information
- Ask for spelling confirmation for names and important details
- Be patient with elderly callers or those who may need extra time
- Maintain HIPAA compliance - never discuss specific patient information without proper verification
- For medical emergencies, direct patients to call 911 or go to the emergency room immediately
- Always confirm appointment details by repeating them back to the patient

# Greeting Examples
- "Good morning, Dr. Johnson's office, this is Emma. How may I help you today?"
- "Thank you for calling Dr. Sarah Johnson Family Medicine, this is Emma speaking. How can I assist you?"

# Common Scenarios to Handle
- Appointment scheduling and rescheduling
- New patient registration information
- Insurance verification questions
- Prescription refill requests (direct to appropriate process)
- General clinic information
- Directions to the clinic
- Preparation instructions for appointments
- Billing inquiries (basic information only)

# What I Cannot Do
- Provide medical advice or diagnose conditions
- Discuss specific patient medical information without verification
- Prescribe medications
- Override doctor's medical decisions
- Access detailed medical records during calls
- Make medical recommendations

# Emergency Protocol
If a patient describes emergency symptoms, immediately direct them to:
- Call 911 for life-threatening emergencies
- Go to the nearest emergency room
- Contact emergency services
Do not attempt to provide medical guidance for emergencies.

# IMPORTANT: Medical Reception Boundaries
You are STRICTLY a medical receptionist. You must NEVER:
- Provide medical advice, diagnosis, or treatment recommendations
- Discuss specific medications, dosages, or prescriptions
- Share confidential patient information
- Answer medical questions beyond basic clinic information
- Discuss topics unrelated to medical reception duties

If asked about medical matters, respond with: "I'm not able to provide medical advice. Please speak with Dr. Johnson during your appointment about any medical concerns."

For emergencies, immediately direct to: "If this is a medical emergency, please hang up and call 911 or go to your nearest emergency room immediately."


# Sample Responses
For appointment requests: "I'd be happy to schedule an appointment for you. Let me check Dr. Johnson's availability. What type of visit are you looking for?"

For new patients: "Welcome to our practice! For new patients, we'll need to get some basic information and insurance details. The appointment will include time to complete paperwork, so we typically schedule 30 minutes for new patient visits."

For prescription refills: "For prescription refills, I'll need to take down your information and the medication details. The doctor will review this and we'll contact your pharmacy within 24-48 hours."

For insurance questions: "I can help verify your insurance coverage. Could you please provide me with your insurance card information?"
`,
  tools: [
    {
      type: "function",
      name: "checkAvailability",
      description: "Check available appointment slots for scheduling",
      parameters: {
        type: "object",
        properties: {
          preferredDate: {
            type: "string",
            description: "Patient's preferred date for appointment"
          },
          appointmentType: {
            type: "string", 
            enum: ["routine", "physical", "follow-up", "urgent"],
            description: "Type of appointment needed"
          }
        },
        required: ["appointmentType"],
        additionalProperties: false
      }
    },
    {
      type: "function", 
      name: "scheduleAppointment",
      description: "Schedule a new appointment for a patient",
      parameters: {
        type: "object",
        properties: {
          patientName: {
            type: "string",
            description: "Full name of the patient"
          },
          phoneNumber: {
            type: "string", 
            description: "Patient's contact phone number"
          },
          appointmentDate: {
            type: "string",
            description: "Scheduled appointment date and time"
          },
          appointmentType: {
            type: "string",
            enum: ["routine", "physical", "follow-up", "urgent"],
            description: "Type of appointment"
          },
          reason: {
            type: "string",
            description: "Brief reason for the visit"
          }
        },
        required: ["patientName", "phoneNumber", "appointmentDate", "appointmentType"],
        additionalProperties: false
      }
    },
    {
      type: "function",
      name: "getClinicInfo", 
      description: "Retrieve general clinic information like hours, location, services",
      parameters: {
        type: "object",
        properties: {
          infoType: {
            type: "string",
            enum: ["hours", "location", "services", "insurance", "directions"],
            description: "Type of clinic information requested"
          }
        },
        required: ["infoType"],
        additionalProperties: false
      }
    }
  ],
  toolLogic: {
    checkAvailability: ({ preferredDate, appointmentType }) => {
      console.log(`[toolLogic] checking availability for ${appointmentType} on ${preferredDate || 'any date'}`);
      
      // Simulate available slots
      const availableSlots = [
        "Tomorrow at 2:30 PM",
        "Thursday at 10:15 AM", 
        "Friday at 3:45 PM",
        "Next Monday at 9:30 AM",
        "Next Tuesday at 1:15 PM"
      ];
      
      return {
        availableSlots: appointmentType === "urgent" ? availableSlots.slice(0, 2) : availableSlots,
        message: appointmentType === "urgent" ? 
          "For urgent appointments, I have some earlier options available." :
          "Here are our available appointment times."
      };
    },
    
    scheduleAppointment: ({ patientName, phoneNumber, appointmentDate, appointmentType, reason }) => {
      console.log(`[toolLogic] scheduling appointment for ${patientName}`);
      
      // Generate appointment confirmation
      const confirmationNumber = `APT-${Date.now().toString().slice(-6)}`;
      
      return {
        success: true,
        confirmationNumber,
        appointmentDetails: {
          patient: patientName,
          phone: phoneNumber,
          dateTime: appointmentDate,
          type: appointmentType,
          reason: reason || "General consultation",
          doctor: "Dr. Sarah Johnson"
        },
        instructions: appointmentType === "physical" ? 
          "Please arrive 15 minutes early to complete forms. Fast for 8 hours before appointment if lab work is needed." :
          "Please arrive 10 minutes early. Bring your insurance card and current medications list."
      };
    },
    
    getClinicInfo: ({ infoType }) => {
      console.log(`[toolLogic] getting clinic info for ${infoType}`);
      
      const clinicInfo = {
        hours: {
          regular: "Monday through Friday: 8:00 AM to 5:00 PM",
          weekend: "Saturday: 9:00 AM to 1:00 PM", 
          closed: "Closed Sundays and major holidays"
        },
        location: {
          address: "456 Medical Plaza, Suite 201, Springfield, IL 62701",
          parking: "Free parking available in the medical plaza lot",
          accessibility: "Wheelchair accessible with elevator access"
        },
        services: [
          "Annual physical exams",
          "Preventive care and screenings", 
          "Chronic disease management",
          "Minor procedures and treatments",
          "Vaccinations and immunizations",
          "Family medicine consultations"
        ],
        insurance: [
          "Most major insurance plans accepted",
          "Medicare and Medicaid accepted", 
          "Please call to verify your specific plan",
          "Self-pay options available"
        ],
        directions: {
          fromNorth: "Take I-55 South to Exit 98B, turn right on Medical Plaza Drive",
          fromSouth: "Take I-55 North to Exit 98A, turn left on Medical Plaza Drive", 
          parking: "Enter the medical plaza and follow signs to Building 456"
        }
      };
      
      return clinicInfo[infoType] || "Information not available";
    }
  }
};

const agents = [medicalReceptionAgent];

export default agents;