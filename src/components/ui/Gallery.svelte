<script>
  /** Generic image gallery grid. items: [{id, url, name, chips: [], selected}].
   *  selectable: overlay checkboxes for bulk actions. Presentational. */
  let { items = [], selectable = false, onPick, onToggleSelect, empty = "" } = $props();
</script>

{#if items.length}
  <div class="gallery">
    {#each items as item (item.id)}
      <div class="gitem" class:selected={item.selected}>
        {#if selectable}
          <label class="gcheck" aria-label={"Select " + item.name}>
            <input
              type="checkbox"
              checked={item.selected}
              onchange={() => onToggleSelect?.(item.id)}
            />
          </label>
        {/if}
        <button type="button" class="gthumb" onclick={() => onPick?.(item.id)} aria-label={item.name}>
          <img src={item.url} alt={item.name} loading="lazy" />
        </button>
        {#if item.chips.length}
          <span class="gchips">
            {#each item.chips as chip (chip)}
              <span class="chip">{chip}</span>
            {/each}
          </span>
        {/if}
      </div>
    {/each}
  </div>
{:else if empty}
  <p class="caption">{empty}</p>
{/if}
