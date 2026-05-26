"use client";

import React, { useRef, useEffect } from "react";

interface OtpInputGroupProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
}

export function OtpInputGroup({
  value,
  onChange,
  length = 6,
}: OtpInputGroupProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus first input on mount
    inputsRef.current[0]?.focus();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number,
  ) => {
    const val = e.target.value;
    const numericVal = val.replace(/\D/g, "");

    // Create current array from value or pad it
    const newOtp = Array.from({ length }, (_, i) => value[i] || "");

    if (numericVal === "") {
      newOtp[index] = "";
      onChange(newOtp.join(""));
      return;
    }

    // Set value of current box (last typed digit)
    newOtp[index] = numericVal[numericVal.length - 1];
    onChange(newOtp.join(""));

    // Auto focus next box if we typed something
    if (index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (e.key === "Backspace") {
      const newOtp = Array.from({ length }, (_, i) => value[i] || "");

      if (!newOtp[index]) {
        // If current box is empty, go to previous box and clear its content
        if (index > 0) {
          inputsRef.current[index - 1]?.focus();
          newOtp[index - 1] = "";
          onChange(newOtp.join(""));
        }
      } else {
        // Clear current box content
        newOtp[index] = "";
        onChange(newOtp.join(""));
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, length);

    onChange(pastedData);

    // Auto-focus appropriate input box after pasting
    const targetFocusIndex = Math.min(pastedData.length, length - 1);
    inputsRef.current[targetFocusIndex]?.focus();
  };

  return (
    <div className="flex justify-center items-center gap-2 max-w-[320px] mx-auto my-2">
      {Array.from({ length }).map((_, index) => {
        const char = value[index] || "";
        return (
          <input
            key={index}
            ref={(el) => {
              inputsRef.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={char}
            onChange={(e) => handleChange(e, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            onPaste={index === 0 ? handlePaste : undefined}
            className="w-10 h-12 text-center text-lg font-mono font-bold rounded-xl border border-border/40 bg-secondary/35 text-foreground focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all select-all"
          />
        );
      })}
    </div>
  );
}
