<script>
  /** The palang marking fields: purpose text + colour, one compact row.
   *  Presentational: spec in, patch out. */
  import { t } from "../../lib/i18n.js";
import Field from "./Field.svelte";

  let { spec, onChange } = $props();

  function patch(p) {
    onChange?.({ ...spec, ...p });
  }
</script>

<div class="row palang-fields">
  <Field label={t("specPurpose")}>
    <input
      type="text"
      value={spec.text}
      oninput={(e) => patch({ text: e.currentTarget.value })}
      placeholder="UNTUK KEGUNAAN BANK SAHAJA"
    />
  </Field>
  <Field label={t("specColour")}>
    <input type="color" value={spec.color} oninput={(e) => patch({ color: e.currentTarget.value })} />
  </Field>
</div>
<p class="hint">
  The message stamped on the bar, for example "UNTUK KEGUNAAN BANK SAHAJA" (for bank use only). The colour is used for the lines and the text — nothing is covered.
</p>
