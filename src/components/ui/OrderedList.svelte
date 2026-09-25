<script>
  /** Generic ordered list: items [{id,label,sub,first,last}] + move/remove callbacks. */
  let { items = [], onMove, onRemove, onSelect, empty = t("olEmpty") } = $props();
</script>

{#if items.length}
  <ol class="orderlist">
    {#each items as item (item.id)}
      <li>
        <button type="button" class="ol-pick" onclick={() => onSelect?.(item.id)}>
          <span class="ol-label">{item.label}</span>
          {#if item.sub && item.sub !== true}<span class="ol-sub">{item.sub}</span>{/if}
        </button>
        <button type="button" disabled={item.first} onclick={() => onMove?.(item.id, -1)} aria-label={t("olUp") + ": " + item.label}>↑</button>
        <button type="button" disabled={item.last} onclick={() => onMove?.(item.id, 1)} aria-label={t("olDown") + ": " + item.label}>↓</button>
        <button type="button" onclick={() => onRemove?.(item.id)} aria-label={t("olRemove") + ": " + item.label}>✕</button>
      </li>
    {/each}
  </ol>
{:else if empty}
  <p class="caption">{empty}</p>
{/if}
