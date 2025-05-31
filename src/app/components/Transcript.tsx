// "use-client";

// import React, { useEffect, useRef, useState } from "react";
// import ReactMarkdown from "react-markdown";
// import { TranscriptItem } from "@/app/types";
// import Image from "next/image";
// import { useTranscript } from "@/app/contexts/TranscriptContext";
// import { DownloadIcon, ClipboardCopyIcon } from "@radix-ui/react-icons";

// export interface TranscriptProps {
//   userText: string;
//   setUserText: (val: string) => void;
//   onSendMessage: () => void;
//   canSend: boolean;
//   downloadRecording: () => void;
// }

// function Transcript({
//   userText,
//   setUserText,
//   onSendMessage,
//   canSend,
//   downloadRecording,
// }: TranscriptProps) {
//   const { transcriptItems, toggleTranscriptItemExpand } = useTranscript();
//   const transcriptRef = useRef<HTMLDivElement | null>(null);
//   const [prevLogs, setPrevLogs] = useState<TranscriptItem[]>([]);
//   const [justCopied, setJustCopied] = useState(false);
//   const inputRef = useRef<HTMLInputElement | null>(null);

//   function scrollToBottom() {
//     if (transcriptRef.current) {
//       transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
//     }
//   }

//   useEffect(() => {
//     const hasNewMessage = transcriptItems.length > prevLogs.length;
//     const hasUpdatedMessage = transcriptItems.some((newItem, index) => {
//       const oldItem = prevLogs[index];
//       return (
//         oldItem &&
//         (newItem.title !== oldItem.title || newItem.data !== oldItem.data)
//       );
//     });

//     if (hasNewMessage || hasUpdatedMessage) {
//       scrollToBottom();
//     }

//     setPrevLogs(transcriptItems);
//   }, [transcriptItems]);

//   useEffect(() => {
//     if (canSend && inputRef.current) {
//       inputRef.current.focus();
//     }
//   }, [canSend]);

//   const handleCopyTranscript = async () => {
//     if (!transcriptRef.current) return;
//     try {
//       await navigator.clipboard.writeText(transcriptRef.current.innerText);
//       setJustCopied(true);
//       setTimeout(() => setJustCopied(false), 1500);
//     } catch (error) {
//       console.error("Failed to copy transcript:", error);
//     }
//   };

//   return (
//     <div className="flex flex-col flex-1 bg-white min-h-0 rounded-xl shadow-lg border border-blue-100">
//       <div className="flex flex-col flex-1 min-h-0">
//         <div className="flex items-center justify-between px-6 py-4 sticky top-0 z-10 text-base border-b border-blue-100 bg-gradient-to-r from-blue-50 to-green-50 rounded-t-xl">
//           <div className="flex items-center">
//             <span className="font-semibold text-blue-800">Conversation with Emma</span>
//             <span className="ml-2 text-sm text-gray-600">(Medical Receptionist)</span>
//           </div>
//           <div className="flex gap-x-2">
//             <button
//               onClick={handleCopyTranscript}
//               className="w-24 text-sm px-3 py-1 rounded-md bg-blue-100 hover:bg-blue-200 text-blue-700 flex items-center justify-center gap-x-1 transition-colors"
//             >
//               <ClipboardCopyIcon />
//               {justCopied ? "Copied!" : "Copy"}
//             </button>
//             <button
//               onClick={downloadRecording}
//               className="w-40 text-sm px-3 py-1 rounded-md bg-green-100 hover:bg-green-200 text-green-700 flex items-center justify-center gap-x-1 transition-colors"
//             >
//               <DownloadIcon />
//               <span>Download Audio</span>
//             </button>
//           </div>
//         </div>

//         {/* Transcript Content */}
//         <div
//           ref={transcriptRef}
//           className="overflow-auto p-6 flex flex-col gap-y-4 h-full bg-gradient-to-b from-white to-blue-50"
//         >
//           {transcriptItems.map((item) => {
//             const {
//               itemId,
//               type,
//               role,
//               data,
//               expanded,
//               timestamp,
//               title = "",
//               isHidden,
//             } = item;

//             if (isHidden) {
//               return null;
//             }

//             if (type === "MESSAGE") {
//               const isUser = role === "user";
//               const containerClasses = `flex justify-end flex-col ${
//                 isUser ? "items-end" : "items-start"
//               }`;
//               const bubbleBase = `max-w-lg p-4 shadow-sm ${
//                 isUser 
//                   ? "bg-blue-600 text-white" 
//                   : "bg-white text-gray-800 border border-green-200"
//               }`;
//               const isBracketedMessage =
//                 title.startsWith("[") && title.endsWith("]");
//               const messageStyle = isBracketedMessage
//                 ? "italic text-gray-400"
//                 : "";
//               const displayTitle = isBracketedMessage
//                 ? title.slice(1, -1)
//                 : title;

//               return (
//                 <div key={itemId} className={containerClasses}>
//                   <div className="max-w-lg">
//                     <div className={`${bubbleBase} rounded-xl`}>
//                       <div
//                         className={`text-xs mb-2 ${
//                           isUser ? "text-blue-200" : "text-gray-500"
//                         } font-mono`}
//                       >
//                         {timestamp} {!isUser && "• Emma (Reception)"}
//                       </div>
//                       <div className={`whitespace-pre-wrap ${messageStyle}`}>
//                         <ReactMarkdown>{displayTitle}</ReactMarkdown>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               );
//             } else if (type === "BREADCRUMB") {
//               return (
//                 <div
//                   key={itemId}
//                   className="flex flex-col justify-start items-start text-gray-500 text-sm"
//                 >
//                   <span className="text-xs font-mono text-gray-400">{timestamp}</span>
//                   <div
//                     className={`whitespace-pre-wrap flex items-center font-mono text-sm text-blue-700 ${
//                       data ? "cursor-pointer" : ""
//                     }`}
//                     onClick={() => data && toggleTranscriptItemExpand(itemId)}
//                   >
//                     {data && (
//                       <span
//                         className={`text-blue-400 mr-1 transform transition-transform duration-200 select-none font-mono ${
//                           expanded ? "rotate-90" : "rotate-0"
//                         }`}
//                       >
//                         ▶
//                       </span>
//                     )}
//                     {title}
//                   </div>
//                   {expanded && data && (
//                     <div className="text-gray-800 text-left">
//                       <pre className="border-l-2 ml-1 border-blue-200 whitespace-pre-wrap break-words font-mono text-xs mb-2 mt-2 pl-2 bg-blue-50 p-2 rounded">
//                         {JSON.stringify(data, null, 2)}
//                       </pre>
//                     </div>
//                   )}
//                 </div>
//               );
//             } else {
//               return (
//                 <div
//                   key={itemId}
//                   className="flex justify-center text-gray-500 text-sm italic font-mono"
//                 >
//                   Unknown item type: {type}{" "}
//                   <span className="ml-2 text-xs">{timestamp}</span>
//                 </div>
//               );
//             }
//           })}
//         </div>
//       </div>

//       <div className="p-4 flex items-center gap-x-2 flex-shrink-0 border-t border-blue-100 bg-gradient-to-r from-blue-50 to-green-50">
//         <input
//           ref={inputRef}
//           type="text"
//           value={userText}
//           onChange={(e) => setUserText(e.target.value)}
//           onKeyDown={(e) => {
//             if (e.key === "Enter" && canSend) {
//               onSendMessage();
//             }
//           }}
//           className="flex-1 px-4 py-3 focus:outline-none border border-blue-200 rounded-lg focus:border-blue-400 transition-colors"
//           placeholder="Type your message to Emma..."
//         />
//         <button
//           onClick={onSendMessage}
//           disabled={!canSend || !userText.trim()}
//           className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
//         >
//           <Image src="arrow.svg" alt="Send" width={20} height={20} />
//         </button>
//       </div>
//     </div>
//   );
// }

// export default Transcript;







"use-client";

import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { TranscriptItem } from "@/app/types";
import Image from "next/image";
import { useTranscript } from "@/app/contexts/TranscriptContext";
import { DownloadIcon, ClipboardCopyIcon } from "@radix-ui/react-icons";
import { MedicalGuardrailChip } from "./MedicalGuardrailChip";

export interface TranscriptProps {
  userText: string;
  setUserText: (val: string) => void;
  onSendMessage: () => void;
  canSend: boolean;
  downloadRecording: () => void;
}

function Transcript({
  userText,
  setUserText,
  onSendMessage,
  canSend,
  downloadRecording,
}: TranscriptProps) {
  const { transcriptItems, toggleTranscriptItemExpand } = useTranscript();
  const transcriptRef = useRef<HTMLDivElement | null>(null);
  const [prevLogs, setPrevLogs] = useState<TranscriptItem[]>([]);
  const [justCopied, setJustCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  function scrollToBottom() {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }

  useEffect(() => {
    const hasNewMessage = transcriptItems.length > prevLogs.length;
    const hasUpdatedMessage = transcriptItems.some((newItem, index) => {
      const oldItem = prevLogs[index];
      return (
        oldItem &&
        (newItem.title !== oldItem.title || newItem.data !== oldItem.data)
      );
    });

    if (hasNewMessage || hasUpdatedMessage) {
      scrollToBottom();
    }

    setPrevLogs(transcriptItems);
  }, [transcriptItems]);

  useEffect(() => {
    if (canSend && inputRef.current) {
      inputRef.current.focus();
    }
  }, [canSend]);

  const handleCopyTranscript = async () => {
    if (!transcriptRef.current) return;
    try {
      await navigator.clipboard.writeText(transcriptRef.current.innerText);
      setJustCopied(true);
      setTimeout(() => setJustCopied(false), 1500);
    } catch (error) {
      console.error("Failed to copy transcript:", error);
    }
  };

  return (
    <div className="flex flex-col flex-1 bg-white min-h-0 rounded-xl shadow-lg border border-blue-100">
      <div className="flex flex-col flex-1 min-h-0">
        <div className="flex items-center justify-between px-6 py-4 sticky top-0 z-10 text-base border-b border-blue-100 bg-gradient-to-r from-blue-50 to-green-50 rounded-t-xl">
          <div className="flex items-center">
            <span className="font-semibold text-blue-800">Conversation with Emma</span>
            <span className="ml-2 text-sm text-gray-600">(Medical Receptionist)</span>
          </div>
          <div className="flex gap-x-2">
            <button
              onClick={handleCopyTranscript}
              className="w-24 text-sm px-3 py-1 rounded-md bg-blue-100 hover:bg-blue-200 text-blue-700 flex items-center justify-center gap-x-1 transition-colors"
            >
              <ClipboardCopyIcon />
              {justCopied ? "Copied!" : "Copy"}
            </button>
            <button
              onClick={downloadRecording}
              className="w-40 text-sm px-3 py-1 rounded-md bg-green-100 hover:bg-green-200 text-green-700 flex items-center justify-center gap-x-1 transition-colors"
            >
              <DownloadIcon />
              <span>Download Audio</span>
            </button>
          </div>
        </div>

        {/* Transcript Content */}
        <div
          ref={transcriptRef}
          className="overflow-auto p-6 flex flex-col gap-y-4 h-full bg-gradient-to-b from-white to-blue-50"
        >
          {transcriptItems.map((item) => {
            const {
              itemId,
              type,
              role,
              data,
              expanded,
              timestamp,
              title = "",
              isHidden,
              guardrailResult,
            } = item;

            if (isHidden) {
              return null;
            }

            if (type === "MESSAGE") {
              const isUser = role === "user";
              const containerClasses = `flex justify-end flex-col ${
                isUser ? "items-end" : "items-start"
              }`;
              const bubbleBase = `max-w-lg p-4 shadow-sm ${
                isUser 
                  ? "bg-blue-600 text-white" 
                  : "bg-white text-gray-800 border border-green-200"
              }`;
              const isBracketedMessage =
                title.startsWith("[") && title.endsWith("]");
              const messageStyle = isBracketedMessage
                ? "italic text-gray-400"
                : "";
              const displayTitle = isBracketedMessage
                ? title.slice(1, -1)
                : title;

              return (
                <div key={itemId} className={containerClasses}>
                  <div className="max-w-lg">
                    <div
                      className={`${bubbleBase} rounded-xl ${
                        guardrailResult ? "" : "rounded-b-xl"
                      }`}
                    >
                      <div
                        className={`text-xs mb-2 ${
                          isUser ? "text-blue-200" : "text-gray-500"
                        } font-mono`}
                      >
                        {timestamp} {!isUser && "• Emma (Reception)"}
                      </div>
                      <div className={`whitespace-pre-wrap ${messageStyle}`}>
                        <ReactMarkdown>{displayTitle}</ReactMarkdown>
                      </div>
                    </div>
                    {guardrailResult && (
                      <div className="bg-blue-50 px-3 py-2 rounded-b-xl border-t border-blue-200">
                        <MedicalGuardrailChip guardrailResult={guardrailResult} />
                      </div>
                    )}
                  </div>
                </div>
              );
            } else if (type === "BREADCRUMB") {
              return (
                <div
                  key={itemId}
                  className="flex flex-col justify-start items-start text-gray-500 text-sm"
                >
                  <span className="text-xs font-mono text-gray-400">{timestamp}</span>
                  <div
                    className={`whitespace-pre-wrap flex items-center font-mono text-sm text-blue-700 ${
                      data ? "cursor-pointer" : ""
                    }`}
                    onClick={() => data && toggleTranscriptItemExpand(itemId)}
                  >
                    {data && (
                      <span
                        className={`text-blue-400 mr-1 transform transition-transform duration-200 select-none font-mono ${
                          expanded ? "rotate-90" : "rotate-0"
                        }`}
                      >
                        ▶
                      </span>
                    )}
                    {title}
                  </div>
                  {expanded && data && (
                    <div className="text-gray-800 text-left">
                      <pre className="border-l-2 ml-1 border-blue-200 whitespace-pre-wrap break-words font-mono text-xs mb-2 mt-2 pl-2 bg-blue-50 p-2 rounded">
                        {JSON.stringify(data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            } else {
              return (
                <div
                  key={itemId}
                  className="flex justify-center text-gray-500 text-sm italic font-mono"
                >
                  Unknown item type: {type}{" "}
                  <span className="ml-2 text-xs">{timestamp}</span>
                </div>
              );
            }
          })}
        </div>
      </div>

      <div className="p-4 flex items-center gap-x-2 flex-shrink-0 border-t border-blue-100 bg-gradient-to-r from-blue-50 to-green-50">
        <input
          ref={inputRef}
          type="text"
          value={userText}
          onChange={(e) => setUserText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && canSend) {
              onSendMessage();
            }
          }}
          className="flex-1 px-4 py-3 focus:outline-none border border-blue-200 rounded-lg focus:border-blue-400 transition-colors"
          placeholder="Type your message to Emma..."
        />
        <button
          onClick={onSendMessage}
          disabled={!canSend || !userText.trim()}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
        >
          <Image src="arrow.svg" alt="Send" width={20} height={20} />
        </button>
      </div>
    </div>
  );
}

export default Transcript;

