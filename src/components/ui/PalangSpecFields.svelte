<script>
  /** The palang marking fields: purpose text + colour, one compact row.
   *  Presentational: spec in, patch out. A small preset dropdown covers the
   *  common official phrases — one tap, no typing. */
  import { t } from "../../lib/i18n.js";
  import Field from "./Field.svelte";

  let { spec, onChange } = $props();

  // The short list of official-purpose phrases people actually stamp. These
  // are document stamps (Malay by nature) — not UI copy, so no i18n table.
  const PRESETS = [
    "UNTUK KEGUNAAN BANK SAHAJA",
    "UNTUK KEGUNAAN RASMI",
    "UNTUK KEGUNAAN KERAJAAN SAHAJA",
    "UNTUK KEGUNAAN SWASTA SAHAJA",
  ];

  function patch(p) {
    onChange?.({ ...spec, ...p });
  }
</script>

<div class="row palang-fields">
  <Field label={t("specPurpose")}>
    <div class="purpose-row">
      <select
        aria-label={t("presetLabel")}
        value={PRESETS.includes(spec.text) ? spec.text : ""}
        onchange={(e) => {
          const v = e.currentTarget.value;
          if (v) patch({ text: v });
        }}
      >
        <option value="">{t("presetPlaceholder")}</option>
        {#each PRESETS as p (p)}
          <option value={p}>{p}</option>
        {/each}
      </select>
      <input
        type="text"
        class="purpose-input"
        value={spec.text}
        oninput={(e) => patch({ text: e.currentTarget.value })}
        placeholder="UNTUK KEGUNAAN BANK SAHAJA"
      />
    </div>
  </Field>
  <Field label={t("specColour")}>
    <input type="color" value={spec.color} oninput={(e) => patch({ color: e.currentTarget.value })} />
  </Field>
</div>

<style>
  .purpose-row {
    display: flex;
    gap: 0.5rem;
    width: 100%;
  }
  .purpose-row select {
    max-width: 11rem;
  }
  .purpose-input {
    flex: 1;
    min-width: 0;
  }
</style>
