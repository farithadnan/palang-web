<script>
  /** The palang marking fields: purpose text + colour, one compact row.
   *  Presentational: spec in, patch out. */
  import Field from "./Field.svelte";

  let { spec, onChange } = $props();

  function patch(p) {
    onChange?.({ ...spec, ...p });
  }
</script>

<div class="row palang-fields">
  <Field label="Purpose text">
    <input
      type="text"
      value={spec.text}
      oninput={(e) => patch({ text: e.currentTarget.value })}
      placeholder="UNTUK KEGUNAAN BANK SAHAJA"
    />
  </Field>
  <Field label="Colour">
    <input type="color" value={spec.color} oninput={(e) => patch({ color: e.currentTarget.value })} />
  </Field>
</div>
<p class="hint">
  The message stamped on the bar, for example "UNTUK KEGUNAAN BANK SAHAJA" (for bank use only). The colour is used for the lines and the text — nothing is covered.
</p>
