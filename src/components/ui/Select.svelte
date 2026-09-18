<script>
  /** Generic select: options [{v,l}] -> controlled value + onChange. */
  let { id, options = [], value, onChange, class: cls = "" } = $props();
</script>

<select {id} class={cls} value={value}
  onchange={(e) => onChange?.(e.currentTarget.value)}>
  {#each options as opt (opt.v)}
    <option value={opt.v}>{opt.l}</option>
  {/each}
</select>
