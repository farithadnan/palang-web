<script>
  /** Generic file basket shared by Convert and Palang: empty dropzone ↔ gallery
   *  of chosen files, per-file remove, add-more, optional bulk select. */
  import Icon from "./Icon.svelte";
  import Dropzone from "./Dropzone.svelte";

  let {
    id,
    accept = "",
    multiple = false,
    main = "Choose files",
    sub = "",
    icon = "upload",
    items = [], // {id, url?, name, chips?, icon?}
    selecting = false,
    selected = [], // ids
    onToggleSelect,
    onExitSelect,
    onDeleteSelected,
    removable = false,
    onRemove,
    onItem,
    onPick,
  } = $props();

  let input;
  const count = $derived(items.length);
  const editedOn = $derived(items.reduce((n, it) => n + (it.chips?.length ? 1 : 0), 0));
</script>

{#if !count}
  <Dropzone {id} {accept} {multiple} {main} {sub} {icon} {onPick} />
{:else}
  <div class="gbar">
    <span class="caption">
      <strong>{count}</strong> file{count > 1 ? "s" : ""}
      {#if editedOn}<span> · <strong>{editedOn}</strong> edited</span>{/if}
    </span>
    <span class="gbar-actions">
      {#if selecting && onDeleteSelected}
        <button type="button" class="btn btn-danger" disabled={!selected.length} onclick={onDeleteSelected}>
          Delete ({selected.length})
        </button>
        <button type="button" class="btn" onclick={onExitSelect}>Cancel</button>
      {:else if onToggleSelect}
        <button type="button" class="btn btn-sm" onclick={() => onToggleSelect()}>Select…</button>
      {/if}
    </span>
  </div>

  <div class="gallery">
    {#each items as item (item.id)}
      <div class="gitem" class:selected={selected.includes(item.id)}>
        {#if selecting && onToggleSelect}
          <label class="gcheck" aria-label={"Select " + item.name}>
            <input
              type="checkbox"
              checked={selected.includes(item.id)}
              onchange={() => onToggleSelect(item.id)}
            />
          </label>
        {:else if removable && onRemove}
          <button
            type="button"
            class="gremove"
            aria-label={"Remove " + item.name}
            onclick={() => onRemove(item.id)}
          >
            ✕
          </button>
        {/if}
        <button
          type="button"
          class="gthumb"
          onclick={() => (selecting ? onToggleSelect?.(item.id) : onItem?.(item.id))}
          aria-label={item.name}
        >
          {#if item.url}
            <img src={item.url} alt={item.name} loading="lazy" />
          {:else}
            <span class="gfileicon"><Icon name={item.icon || "file"} size={26} /></span>
          {/if}
        </button>
        {#if item.chips?.length}
          <span class="gchips">
            {#each item.chips as chip (chip)}
              <span class="chip">{chip}</span>
            {/each}
          </span>
        {/if}
      </div>
    {/each}
  </div>

  <div class="actionrow">
    <button type="button" class="btn btn-sm" onclick={() => input?.click()}>Add more</button>
  </div>
  <input
    bind:this={input}
    class="hidden-input"
    id={id + "-more"}
    type="file"
    {accept}
    {multiple}
    onchange={(e) => {
      if (e.currentTarget.files?.length) onPick?.(e.currentTarget.files);
      e.currentTarget.value = "";
    }}
  />
{/if}
