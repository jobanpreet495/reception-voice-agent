// "use client";

// import { useRef } from "react";
// import {
//   ServerEvent,
//   SessionStatus,
//   AgentConfig,
// } from "@/app/types";
// import { useTranscript } from "@/app/contexts/TranscriptContext";
// import { useEvent } from "@/app/contexts/EventContext";

// export interface UseHandleServerEventParams {
//   setSessionStatus: (status: SessionStatus) => void;
//   selectedAgentName: string;
//   selectedAgentConfigSet: AgentConfig[] | null;
//   sendClientEvent: (eventObj: any, eventNameSuffix?: string) => void;
//   setSelectedAgentName: (name: string) => void;
//   shouldForceResponse?: boolean;
//   setIsOutputAudioBufferActive: (active: boolean) => void;
// }

// export function useHandleServerEvent({
//   setSessionStatus,
//   selectedAgentName,
//   selectedAgentConfigSet,
//   sendClientEvent,
//   setSelectedAgentName,
//   setIsOutputAudioBufferActive,
// }: UseHandleServerEventParams) {
//   const {
//     transcriptItems,
//     addTranscriptBreadcrumb,
//     addTranscriptMessage,
//     updateTranscriptMessage,
//     updateTranscriptItem,
//   } = useTranscript();

//   const { logServerEvent } = useEvent();

//   const handleFunctionCall = async (functionCallParams: {
//     name: string;
//     call_id?: string;
//     arguments: string;
//   }) => {
//     const args = JSON.parse(functionCallParams.arguments);
//     const currentAgent = selectedAgentConfigSet?.find(
//       (a) => a.name === selectedAgentName
//     );

//     addTranscriptBreadcrumb(`function call: ${functionCallParams.name}`, args);

//     if (currentAgent?.toolLogic?.[functionCallParams.name]) {
//       const fn = currentAgent.toolLogic[functionCallParams.name];
//       const fnResult = await fn(args, transcriptItems, addTranscriptBreadcrumb);
//       addTranscriptBreadcrumb(
//         `function call result: ${functionCallParams.name}`,
//         fnResult
//       );

//       sendClientEvent({
//         type: "conversation.item.create",
//         item: {
//           type: "function_call_output",
//           call_id: functionCallParams.call_id,
//           output: JSON.stringify(fnResult),
//         },
//       });
//       sendClientEvent({ type: "response.create" });
//     } else {
//       const simulatedResult = { result: true };
//       addTranscriptBreadcrumb(
//         `function call fallback: ${functionCallParams.name}`,
//         simulatedResult
//       );

//       sendClientEvent({
//         type: "conversation.item.create",
//         item: {
//           type: "function_call_output",
//           call_id: functionCallParams.call_id,
//           output: JSON.stringify(simulatedResult),
//         },
//       });
//       sendClientEvent({ type: "response.create" });
//     }
//   };

//   const handleServerEvent = (serverEvent: ServerEvent) => {
//     logServerEvent(serverEvent);

//     switch (serverEvent.type) {
//       case "session.created": {
//         if (serverEvent.session?.id) {
//           setSessionStatus("CONNECTED");
//           addTranscriptBreadcrumb(
//             `session.id: ${
//               serverEvent.session.id
//             }\nStarted at: ${new Date().toLocaleString()}`
//           );
//         }
//         break;
//       }

//       case "output_audio_buffer.started": {
//         setIsOutputAudioBufferActive(true);
//         break;
//       }
//       case "output_audio_buffer.stopped": {
//         setIsOutputAudioBufferActive(false);
//         break;
//       }

//       case "conversation.item.created": {
//         let text =
//           serverEvent.item?.content?.[0]?.text ||
//           serverEvent.item?.content?.[0]?.transcript ||
//           "";
//         const role = serverEvent.item?.role as "user" | "assistant";
//         const itemId = serverEvent.item?.id;

//         if (itemId && transcriptItems.some((item) => item.itemId === itemId)) {
//           break;
//         }

//         if (itemId && role) {
//           if (role === "user" && !text) {
//             text = "[Transcribing...]";
//           }
//           addTranscriptMessage(itemId, role, text);
//         }
//         break;
//       }

//       case "conversation.item.input_audio_transcription.completed": {
//         const itemId = serverEvent.item_id;
//         const finalTranscript =
//           !serverEvent.transcript || serverEvent.transcript === "\n"
//             ? "[inaudible]"
//             : serverEvent.transcript;
//         if (itemId) {
//           updateTranscriptMessage(itemId, finalTranscript, false);
//         }
//         break;
//       }

//       case "response.audio_transcript.delta": {
//         const itemId = serverEvent.item_id;
//         const deltaText = serverEvent.delta || "";
//         if (itemId) {
//           updateTranscriptMessage(itemId, deltaText, true);
//         }
//         break;
//       }

//       case "response.done": {
//         if (serverEvent.response?.output) {
//           serverEvent.response.output.forEach((outputItem) => {
//             if (
//               outputItem.type === "function_call" &&
//               outputItem.name &&
//               outputItem.arguments
//             ) {
//               handleFunctionCall({
//                 name: outputItem.name,
//                 call_id: outputItem.call_id,
//                 arguments: outputItem.arguments,
//               });
//             }
//           });
//         }
//         break;
//       }

//       case "response.output_item.done": {
//         const itemId = serverEvent.item?.id;
//         if (itemId) {
//           updateTranscriptItem(itemId, { status: "DONE" });
//         }
//         break;
//       }

//       default:
//         break;
//     }
//   };

//   const handleServerEventRef = useRef(handleServerEvent);
//   handleServerEventRef.current = handleServerEvent;

//   return handleServerEventRef;
// }







"use client";

import { useRef } from "react";
import {
  ServerEvent,
  SessionStatus,
  AgentConfig,
  MedicalGuardrailResultType,
} from "@/app/types";
import { useTranscript } from "@/app/contexts/TranscriptContext";
import { useEvent } from "@/app/contexts/EventContext";
import { runMedicalGuardrailClassifier } from "@/app/lib/medicalGuardrails";

export interface UseHandleServerEventParams {
  setSessionStatus: (status: SessionStatus) => void;
  selectedAgentName: string;
  selectedAgentConfigSet: AgentConfig[] | null;
  sendClientEvent: (eventObj: any, eventNameSuffix?: string) => void;
  setSelectedAgentName: (name: string) => void;
  shouldForceResponse?: boolean;
  setIsOutputAudioBufferActive: (active: boolean) => void;
}

export function useHandleServerEvent({
  setSessionStatus,
  selectedAgentName,
  selectedAgentConfigSet,
  sendClientEvent,
  setSelectedAgentName,
  setIsOutputAudioBufferActive,
}: UseHandleServerEventParams) {
  const {
    transcriptItems,
    addTranscriptBreadcrumb,
    addTranscriptMessage,
    updateTranscriptMessage,
    updateTranscriptItem,
  } = useTranscript();

  const { logServerEvent } = useEvent();

  const assistantDeltasRef = useRef<{ [itemId: string]: string }>({});

  async function processMedicalGuardrail(itemId: string, text: string, role: "user" | "assistant") {
    try {
      // Set initial state
      updateTranscriptItem(itemId, {
        guardrailResult: {
          status: "IN_PROGRESS",
          testText: text,
        }
      });

      const result = await runMedicalGuardrailClassifier(text);
      
      const currentItem = transcriptItems.find((item) => item.itemId === itemId);
      if ((currentItem?.guardrailResult?.testText?.length ?? 0) > text.length) {
        // Skip if we already have a more complete result
        return;
      }

      const newGuardrailResult: MedicalGuardrailResultType = {
        status: "DONE",
        testText: text,
        category: result.category,
        rationale: result.rationale,
        severity: result.severity,
        shouldIntervene: result.shouldIntervene,
        suggestedResponse: result.suggestedResponse,
      };

      updateTranscriptItem(itemId, { guardrailResult: newGuardrailResult });

      // If high severity violation detected for assistant responses, potentially intervene
      if (role === "assistant" && result.shouldIntervene && result.severity === "HIGH") {
        console.warn("High severity medical policy violation detected:", result);
        addTranscriptBreadcrumb("🚨 Medical Policy Violation Detected", result);
        
        // Optionally, you could interrupt the response here
        // sendClientEvent({ type: "response.cancel" }, "(medical policy violation)");
      }

    } catch (error) {
      console.warn("Medical guardrail processing failed:", error);
      updateTranscriptItem(itemId, {
        guardrailResult: {
          status: "DONE",
          testText: text,
          category: "NONE",
          rationale: "Guardrail processing failed",
        }
      });
    }
  }

  const handleFunctionCall = async (functionCallParams: {
    name: string;
    call_id?: string;
    arguments: string;
  }) => {
    const args = JSON.parse(functionCallParams.arguments);
    const currentAgent = selectedAgentConfigSet?.find(
      (a) => a.name === selectedAgentName
    );

    addTranscriptBreadcrumb(`function call: ${functionCallParams.name}`, args);

    if (currentAgent?.toolLogic?.[functionCallParams.name]) {
      const fn = currentAgent.toolLogic[functionCallParams.name];
      const fnResult = await fn(args, transcriptItems, addTranscriptBreadcrumb);
      addTranscriptBreadcrumb(
        `function call result: ${functionCallParams.name}`,
        fnResult
      );

      sendClientEvent({
        type: "conversation.item.create",
        item: {
          type: "function_call_output",
          call_id: functionCallParams.call_id,
          output: JSON.stringify(fnResult),
        },
      });
      sendClientEvent({ type: "response.create" });
    } else {
      const simulatedResult = { result: true };
      addTranscriptBreadcrumb(
        `function call fallback: ${functionCallParams.name}`,
        simulatedResult
      );

      sendClientEvent({
        type: "conversation.item.create",
        item: {
          type: "function_call_output",
          call_id: functionCallParams.call_id,
          output: JSON.stringify(simulatedResult),
        },
      });
      sendClientEvent({ type: "response.create" });
    }
  };

  const handleServerEvent = (serverEvent: ServerEvent) => {
    logServerEvent(serverEvent);

    switch (serverEvent.type) {
      case "session.created": {
        if (serverEvent.session?.id) {
          setSessionStatus("CONNECTED");
          addTranscriptBreadcrumb(
            `session.id: ${
              serverEvent.session.id
            }\nStarted at: ${new Date().toLocaleString()}`
          );
        }
        break;
      }

      case "output_audio_buffer.started": {
        setIsOutputAudioBufferActive(true);
        break;
      }
      case "output_audio_buffer.stopped": {
        setIsOutputAudioBufferActive(false);
        break;
      }

      case "conversation.item.created": {
        let text =
          serverEvent.item?.content?.[0]?.text ||
          serverEvent.item?.content?.[0]?.transcript ||
          "";
        const role = serverEvent.item?.role as "user" | "assistant";
        const itemId = serverEvent.item?.id;

        if (itemId && transcriptItems.some((item) => item.itemId === itemId)) {
          break;
        }

        if (itemId && role) {
          if (role === "user" && !text) {
            text = "[Transcribing...]";
          }
          addTranscriptMessage(itemId, role, text);
          
          // Run guardrail check for user input
          if (role === "user" && text && text !== "[Transcribing...]") {
            processMedicalGuardrail(itemId, text, role);
          }
        }
        break;
      }

      case "conversation.item.input_audio_transcription.completed": {
        const itemId = serverEvent.item_id;
        const finalTranscript =
          !serverEvent.transcript || serverEvent.transcript === "\n"
            ? "[inaudible]"
            : serverEvent.transcript;
        if (itemId) {
          updateTranscriptMessage(itemId, finalTranscript, false);
          
          // Run guardrail check on final user transcript
          if (finalTranscript && finalTranscript !== "[inaudible]") {
            processMedicalGuardrail(itemId, finalTranscript, "user");
          }
        }
        break;
      }

      case "response.audio_transcript.delta": {
        const itemId = serverEvent.item_id;
        const deltaText = serverEvent.delta || "";
        if (itemId) {
          updateTranscriptMessage(itemId, deltaText, true);

          // Accumulate deltas for assistant responses
          if (!assistantDeltasRef.current[itemId]) {
            assistantDeltasRef.current[itemId] = "";
          }
          assistantDeltasRef.current[itemId] += deltaText;
          const accumulated = assistantDeltasRef.current[itemId];
          const wordCount = accumulated.trim().split(" ").length;

          // Run guardrail check every 10 words for assistant responses
          if (wordCount > 0 && wordCount % 10 === 0) {
            processMedicalGuardrail(itemId, accumulated, "assistant");
          }
        }
        break;
      }

      case "response.done": {
        if (serverEvent.response?.output) {
          serverEvent.response.output.forEach((outputItem) => {
            if (
              outputItem.type === "function_call" &&
              outputItem.name &&
              outputItem.arguments
            ) {
              handleFunctionCall({
                name: outputItem.name,
                call_id: outputItem.call_id,
                arguments: outputItem.arguments,
              });
            }
            if (
              outputItem.type === "message" &&
              outputItem.role === "assistant"
            ) {
              const itemId = outputItem.id;
              const text = outputItem.content[0]?.transcript;
              if (text) {
                // Final guardrail check for complete assistant message
                processMedicalGuardrail(itemId, text, "assistant");
              }
            }
          });
        }
        break;
      }

      case "response.output_item.done": {
        const itemId = serverEvent.item?.id;
        if (itemId) {
          updateTranscriptItem(itemId, { status: "DONE" });
        }
        break;
      }

      default:
        break;
    }
  };

  const handleServerEventRef = useRef(handleServerEvent);
  handleServerEventRef.current = handleServerEvent;

  return handleServerEventRef;
}