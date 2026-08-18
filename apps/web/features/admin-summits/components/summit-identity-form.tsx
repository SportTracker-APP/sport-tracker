"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { useUpdateAdminSummit } from "@/hooks/use-admin-summits";
import type { AdminSummitDetail } from "@/lib/admin-summits";
import {
  adminSummitIdentitySchema,
  type AdminSummitIdentityForm as AdminSummitIdentityFormValue,
} from "../admin-summit.schema";
import { getApiErrorMessage } from "../admin-summit-utils";
import styles from "../admin-summits.module.css";

type SummitIdentityFormProps = {
  summit: AdminSummitDetail;
  onFeedback: (message: string, tone: "success" | "error") => void;
};

export function SummitIdentityForm({
  summit,
  onFeedback,
}: SummitIdentityFormProps) {
  const updateMutation = useUpdateAdminSummit(summit.id);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<AdminSummitIdentityFormValue>({
    resolver: zodResolver(adminSummitIdentitySchema),
    defaultValues: {
      name: summit.name,
      aliasesText: summit.aliases.join(", "),
      altitude: summit.altitude,
      latitude: summit.latitude,
      longitude: summit.longitude,
      difficulty: summit.difficulty,
      type: summit.type,
    },
  });

  useEffect(() => {
    reset({
      name: summit.name,
      aliasesText: summit.aliases.join(", "),
      altitude: summit.altitude,
      latitude: summit.latitude,
      longitude: summit.longitude,
      difficulty: summit.difficulty,
      type: summit.type,
    });
  }, [reset, summit]);

  const submit = handleSubmit(async (values) => {
    try {
      await updateMutation.mutateAsync({
        name: values.name,
        aliases: values.aliasesText
          .split(",")
          .map((alias) => alias.trim())
          .filter(Boolean),
        altitude: values.altitude,
        latitude: values.latitude,
        longitude: values.longitude,
        difficulty: values.difficulty,
        type: values.type,
      });
      onFeedback("Informations du sommet enregistrées.", "success");
    } catch (error) {
      onFeedback(getApiErrorMessage(error), "error");
    }
  });

  return (
    <form className={styles.identityForm} onSubmit={submit}>
      <div className={styles.formGrid}>
        <label className={styles.fieldGroup}>
          <span>Nom</span>
          <input {...register("name")} aria-invalid={Boolean(errors.name)} />
          {errors.name && <small>{errors.name.message}</small>}
        </label>

        <label className={styles.fieldGroup}>
          <span>Identifiant / slug</span>
          <input value={summit.id} disabled />
          <small>Immuable dans ce MVP.</small>
        </label>

        <label className={`${styles.fieldGroup} ${styles.fieldWide}`}>
          <span>Alias, séparés par des virgules</span>
          <input
            {...register("aliasesText")}
            placeholder="Nom local, variante"
          />
          {errors.aliasesText && <small>{errors.aliasesText.message}</small>}
        </label>

        <label className={styles.fieldGroup}>
          <span>Altitude (m)</span>
          <input
            type="number"
            inputMode="numeric"
            {...register("altitude", { valueAsNumber: true })}
          />
          {errors.altitude && <small>{errors.altitude.message}</small>}
        </label>

        <label className={styles.fieldGroup}>
          <span>Type</span>
          <input {...register("type")} />
          {errors.type && <small>{errors.type.message}</small>}
        </label>

        <label className={styles.fieldGroup}>
          <span>Latitude</span>
          <input
            type="number"
            inputMode="decimal"
            step="any"
            {...register("latitude", { valueAsNumber: true })}
          />
          {errors.latitude && <small>{errors.latitude.message}</small>}
        </label>

        <label className={styles.fieldGroup}>
          <span>Longitude</span>
          <input
            type="number"
            inputMode="decimal"
            step="any"
            {...register("longitude", { valueAsNumber: true })}
          />
          {errors.longitude && <small>{errors.longitude.message}</small>}
        </label>

        <label className={`${styles.fieldGroup} ${styles.fieldWide}`}>
          <span>Difficulté</span>
          <input {...register("difficulty")} />
          {errors.difficulty && <small>{errors.difficulty.message}</small>}
        </label>
      </div>

      <div className={styles.formActions}>
        <button
          type="submit"
          className={styles.primaryButton}
          disabled={!isDirty || updateMutation.isPending}
        >
          <Save />
          {updateMutation.isPending ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}
