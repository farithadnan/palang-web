<script>
  /** Generic tab bar. variant: "top" (desktop) | "bottom" (mobile fixed). */
  let { items = [], value, onPick, variant = "top" } = $props();
</script>

<div class="tabs tabs-{variant}" role="tablist" aria-label="Tools">
  {#each items as item (item.id)}
    <button
      type="button"
      role="tab"
      aria-selected={value === item.id}
      class="tabbtn"
      class:active={value === item.id}
      onclick={() => onPick?.(item.id)}
    >
      {item.label}
    </button>
  {/each}
</div>
