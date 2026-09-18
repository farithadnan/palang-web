<script>
  /** Generic checkbox row with optional hint. */
  let { label = "", hint = "", checked, onChange } = $props();
</script>

<label class="checkline">
  <input type="checkbox" checked={checked} onchange={(e) => onChange?.(e.currentTarget.checked)} />
  <span>
    {label}
    {#if hint}<span class="hint">{hint}</span>{/if}
  </span>
</label>
