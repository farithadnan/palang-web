<script>
  /** Shared palang marking form fields used by the Palang tab (canvas geometry)
   *  and the Templates editor (select geometry). Presentational: spec in, patch out. */
  import Field from "./Field.svelte";
  import Select from "./Select.svelte";

  let { spec, onChange, showGeometry = true } = $props();

  function patch(p) {
    onChange?.({ ...spec, ...p });
  }

  // Brace-bearing strings must live in JS (Svelte interpolates {..} in attributes).
  const SECOND_HINT =
    "A second line under the purpose text. {date} becomes today's date, {ref} becomes the reference.";
  const SECOND_PLACEHOLDER = "Dijana pada {date}";

  const styleHint = $derived(
    spec.style === "lines"
      ? "Lines only: transparent, nothing is covered — the colour is used for the lines and the text."
      : spec.style === "solid"
        ? "Solid: a dense bar that fully covers what's underneath, like a black marker line."
        : "See-through: a shaded bar you can still read through."
  );

  const POSITION_OPTIONS = [
    { v: "top", l: "Top of the page" },
    { v: "center", l: "Middle" },
    { v: "bottom", l: "Bottom" },
  ];
  const HORIZ_OPTIONS = [
    { v: "left", l: "Left" },
    { v: "center", l: "Centre" },
    { v: "right", l: "Right" },
  ];
  const THICK_OPTIONS = [
    { v: "thin", l: "Thin" },
    { v: "normal", l: "Normal" },
    { v: "thick", l: "Thick" },
  ];
  const WIDTH_OPTIONS = [
    { v: "narrow", l: "Narrow" },
    { v: "normal", l: "Normal" },
    { v: "wide", l: "Wide" },
  ];
  const STYLE_OPTIONS = [
    { v: "lines", l: "Lines only (transparent, follows the text)" },
    { v: "solid", l: "Filled bar, solid" },
    { v: "see-through", l: "Filled bar, see-through" },
  ];
  const PAGES_OPTIONS = [
    { v: "all", l: "All pages" },
    { v: "odd", l: "Odd pages only" },
    { v: "even", l: "Even pages only" },
    { v: "custom", l: "Specific pages…" },
  ];
</script>

<Field label="What to add">
  <div class="seg">
    <button type="button" class:active={spec.mode === "band"} onclick={() => patch({ mode: "band" })}>
      Full-width bar
    </button>
    <button type="button" class:active={spec.mode === "region"} onclick={() => patch({ mode: "region" })}>
      Cover a section
    </button>
  </div>
</Field>

{#if spec.mode === "band"}
  <Field label="Purpose text">
    <input
      type="text"
      value={spec.text}
      oninput={(e) => patch({ text: e.currentTarget.value })}
      placeholder="UNTUK KEGUNAAN BANK SAHAJA"
    />
    <p class="hint">The message stamped on the bar, for example "UNTUK KEGUNAAN BANK SAHAJA" (for bank use only).</p>
  </Field>
  <Field label="Second line (optional)" hint={SECOND_HINT}>
    <input
      type="text"
      value={spec.second}
      oninput={(e) => patch({ second: e.currentTarget.value })}
      placeholder={SECOND_PLACEHOLDER}
    />
  </Field>
  <Field label="Reference (optional)">
    <input
      type="text"
      value={spec.ref}
      oninput={(e) => patch({ ref: e.currentTarget.value })}
      placeholder="MOHON-2026"
    />
  </Field>
{:else}
  <Field label="Label (optional)" hint="Leave empty for a plain cover with no text.">
    <input
      type="text"
      value={spec.text}
      oninput={(e) => patch({ text: e.currentTarget.value })}
      placeholder="UNTUK KEGUNAAN BANK SAHAJA"
    />
  </Field>
{/if}

{#if showGeometry}
  {#if spec.mode === "band"}
    <div class="row">
      <Field label="Bar position">
        <Select value={spec.anchor} options={POSITION_OPTIONS} onChange={(v) => patch({ anchor: v })} />
      </Field>
      <Field label="Bar thickness">
        <Select value={spec.thickness} options={THICK_OPTIONS} onChange={(v) => patch({ thickness: v })} />
      </Field>
    </div>
  {:else}
    <div class="row">
      <Field label="Position, top to bottom">
        <Select value={spec.anchor} options={POSITION_OPTIONS} onChange={(v) => patch({ anchor: v })} />
      </Field>
      <Field label="Position, left to right">
        <Select value={spec.horiz} options={HORIZ_OPTIONS} onChange={(v) => patch({ horiz: v })} />
      </Field>
    </div>
    <div class="row">
      <Field label="Area width">
        <Select value={spec.width} options={WIDTH_OPTIONS} onChange={(v) => patch({ width: v })} />
      </Field>
      <Field label="Area thickness">
        <Select value={spec.thickness} options={THICK_OPTIONS} onChange={(v) => patch({ thickness: v })} />
      </Field>
    </div>
    <p class="hint">Sizes are tuned for A4 pages.</p>
  {/if}
{/if}

{#if !showGeometry}
  {#if spec.mode === "band"}
    <Field label="Bar height" hint="Drag the marking on the preview to move it; drag the bottom handle to resize.">
      <div class="caption">{spec.heightPt ?? 48} pt</div>
    </Field>
  {:else}
    <Field label="Marking size" hint="Drag the marking's corner handle on the preview to resize.">
      <div class="caption">
        Width: {spec.widthPt ?? 180} pt · Height: {spec.heightPt ?? 28} pt
      </div>
    </Field>
  {/if}
{/if}

<div class="row">
  <Field label="Colour" hint={styleHint}>
    <input type="color" value={spec.color} oninput={(e) => patch({ color: e.currentTarget.value })} />
  </Field>
  <Field label="Style">
    <Select
      value={spec.style}
      options={spec.mode === "region" ? STYLE_OPTIONS.filter((o) => o.v !== "lines") : STYLE_OPTIONS}
      onChange={(v) => patch({ style: v })}
    />
  </Field>
</div>

<Field label="Apply to">
  <Select value={spec.pages} options={PAGES_OPTIONS} onChange={(v) => patch({ pages: v })} />
  {#if spec.pages === "custom"}
    <input
      type="text"
      placeholder="e.g. 1, 3, 5-8"
      value={spec.pagesCustom}
      oninput={(e) => patch({ pagesCustom: e.currentTarget.value })}
      aria-label="Specific page numbers"
    />
  {/if}
</Field>
