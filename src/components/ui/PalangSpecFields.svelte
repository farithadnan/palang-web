<script>
  /** The palang marking fields: purpose text, colour, rotation.
   *  Presentational: spec in, patch out. */
  import Field from "./Field.svelte";

  let { spec, onChange } = $props();

  function patch(p) {
    onChange?.({ ...spec, ...p });
  }
</script>

<Field label="Purpose text">
  <input
    type="text"
    value={spec.text}
    oninput={(e) => patch({ text: e.currentTarget.value })}
    placeholder="UNTUK KEGUNAAN BANK SAHAJA"
  />
  <p class="hint">The message stamped on the bar, for example "UNTUK KEGUNAAN BANK SAHAJA" (for bank use only).</p>
</Field>

<Field label="Colour" hint="Used for the lines and the text — nothing is covered.">
  <input type="color" value={spec.color} oninput={(e) => patch({ color: e.currentTarget.value })} />
</Field>
