<script>
  /** Generic ordered list: items [{id,label,sub,first,last}] + move/remove callbacks. */
  let { items = [], onMove, onRemove, onSelect, empty = "Nothing here yet." } = $props();
</script>

{#if items.length}
  <ol class="orderlist">
    {#each items as item (item.id)}
      <li>
        <button type="button" class="ol-pick" onclick={() => onSelect?.(item.id)}>
          <span class="ol-label">
            {#if item.sub && item.sub !== true}<span class="ol-sub">{item.sub}</span>{/if}
            {item.label}
          </span>
        </button>
        <button type="button" disabled={item.first} onclick={() => onMove?.(item.id, -1)} aria-label={"Move up: " + item.label}>↑</button>
        <button type="button" disabled={item.last} onclick={() => onMove?.(item.id, 1)} aria-label={"Move down: " + item.label}>↓</button>
        <button type="button" onclick={() => onRemove?.(item.id)} aria-label={"Remove: " + item.label}>✕</button>
      </li>
    {/each}
  </ol>
{:else if empty}
  <p class="caption">{empty}</p>
{/if}
