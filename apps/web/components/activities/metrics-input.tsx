"use client";

import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
} from "react";

import styles from "./create-activity-form.module.css";

type MetricsInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  unit?: string;
  error?: string;
  hint?: string;
};

export const MetricsInput = forwardRef<
  HTMLInputElement,
  MetricsInputProps
>(function MetricsInput(
  {
    label,
    unit,
    error,
    hint,
    className,
    id,
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;
  const describedBy = [
    hint ? hintId : null,
    error ? errorId : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={styles.field}>
      <label htmlFor={inputId} className={styles.fieldLabel}>
        {label}
      </label>

      <div className={styles.inputShell}>
        <input
          {...props}
          ref={ref}
          id={inputId}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy || undefined}
          className={[
            styles.input,
            unit ? styles.inputWithUnit : "",
            className ?? "",
          ]
            .filter(Boolean)
            .join(" ")}
        />

        {unit ? (
          <span className={styles.inputUnit} aria-hidden="true">
            {unit}
          </span>
        ) : null}
      </div>

      {hint ? (
        <p id={hintId} className={styles.fieldHint}>
          {hint}
        </p>
      ) : null}

      {error ? (
        <p id={errorId} className={styles.fieldError}>
          {error}
        </p>
      ) : null}
    </div>
  );
});
