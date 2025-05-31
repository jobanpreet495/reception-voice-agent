import React, { useState } from "react";
import {
  CheckCircledIcon,
  CrossCircledIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from "@radix-ui/react-icons";
import { MedicalGuardrailResultType } from "../types";

function formatCategory(category: string): string {
  return category
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function getSeverityColor(severity?: string): string {
  switch (severity) {
    case "HIGH": return "text-red-600";
    case "MEDIUM": return "text-orange-600";
    case "LOW": return "text-yellow-600";
    default: return "text-gray-600";
  }
}

function getSeverityIcon(severity?: string) {
  switch (severity) {
    case "HIGH": return CrossCircledIcon;
    case "MEDIUM": return ExclamationTriangleIcon;
    case "LOW": return ExclamationTriangleIcon;
    default: return CheckCircledIcon;
  }
}

export function MedicalGuardrailChip({
  guardrailResult,
}: {
  guardrailResult: MedicalGuardrailResultType;
}) {
  const [expanded, setExpanded] = useState(false);

  const state =
    guardrailResult.status === "IN_PROGRESS"
      ? "PENDING"
      : guardrailResult.category === "NONE"
      ? "PASS"
      : "FLAGGED";

  let IconComponent;
  let label: string;
  let textColorClass: string;

  if (state === "PENDING") {
    IconComponent = ClockIcon;
    label = "Checking...";
    textColorClass = "text-gray-600";
  } else if (state === "PASS") {
    IconComponent = CheckCircledIcon;
    label = "Appropriate";
    textColorClass = "text-green-600";
  } else {
    IconComponent = getSeverityIcon(guardrailResult.severity);
    label = `${guardrailResult.severity || "Unknown"} Risk`;
    textColorClass = getSeverityColor(guardrailResult.severity);
  }

  return (
    <div className="text-xs">
      <div
        onClick={() => {
          if (state !== "PENDING") {
            setExpanded(!expanded);
          }
        }}
        className={`inline-flex items-center gap-1 rounded ${
          state !== "PENDING" ? "cursor-pointer" : ""
        }`}
      >
        <span className="text-blue-700">Medical Policy:</span>
        <div className={`flex items-center gap-1 ${textColorClass}`}>
          <IconComponent className="w-3 h-3" /> {label}
        </div>
      </div>
      
      {state !== "PENDING" && guardrailResult.category && guardrailResult.rationale && (
        <div
          className={`overflow-hidden transition-all duration-300 ${
            expanded ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="pt-2 text-xs space-y-1">
            <div>
              <strong>Category:</strong> {formatCategory(guardrailResult.category)}
            </div>
            <div>
              <strong>Severity:</strong> {guardrailResult.severity}
            </div>
            <div>
              <strong>Reason:</strong> {guardrailResult.rationale}
            </div>
            {guardrailResult.suggestedResponse && (
              <div className="mt-2 p-2 bg-blue-50 rounded border-l-2 border-blue-300">
                <strong>Suggested Response:</strong>
                <div className="italic text-blue-800 mt-1">
                  "{guardrailResult.suggestedResponse}"
                </div>
              </div>
            )}
            {guardrailResult.testText && (
              <blockquote className="mt-1 border-l-2 border-gray-300 pl-2 text-gray-400">
                <strong>Analyzed Text:</strong> {guardrailResult.testText}
              </blockquote>
            )}
          </div>
        </div>
      )}
    </div>
  );
}