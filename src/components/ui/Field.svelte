<script>
  /** Generic labelled form block: optional label + hint around slotted content. */
  let { label = "", hint = "", children } = $props();
</script>

<div class="field">
  {#if label}<span class="flabel">{label}</span>{/if}
  {#if children}{@render children()}{/if}
  {#if hint}<p class="hint">{hint}</p>{/if}
</div>
