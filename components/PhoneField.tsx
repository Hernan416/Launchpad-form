"use client";

import type { Ref } from "react";
import PhoneInput, { type Country } from "react-phone-number-input";
import "react-phone-number-input/style.css";

interface PhoneFieldProps {
  value: string | undefined;
  onChange: (value: string) => void;
  defaultCountry?: Country;
  inputRef?: Ref<HTMLInputElement>;
}

export function PhoneField({ value, onChange, defaultCountry, inputRef }: PhoneFieldProps) {
  return (
    <PhoneInput
      international
      defaultCountry={defaultCountry ?? "US"}
      value={value}
      onChange={(next) => onChange(next ?? "")}
      placeholder="Enter phone number"
      className="launchpad-phone-input"
      numberInputProps={{ className: "launchpad-phone-input__number", ref: inputRef }}
    />
  );
}
