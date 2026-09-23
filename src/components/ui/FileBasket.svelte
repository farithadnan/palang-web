<script>
  /** Generic file basket shared by Convert and Palang: empty dropzone ↔ gallery
   *  of chosen files with a dashed "add" tile, per-file remove, optional edit
   *  icon, and an optional paper-aspect frame around thumbnails. */
  import Icon from "./Icon.svelte";
  import Dropzone from "./Dropzone.svelte";

  let {
    id,
    accept = "",
    multiple = false,
    main = "Choose files",
    sub = "",
    icon = "upload",
    items = [], // {id, url?, name, filter?, icon?}
    editable = false,
    frameAspect = "", // e.g. "595/842" — thumbnails shown in the chosen paper shape
    onRemove,
    onItem,
    onPick,
  } = $props();

  let input;
  const count = $derived(items.length);
</script>

{#if !count}
  <Dropzone {id} {accept} {multiple} {main} {sub} {icon} {onPick} />
{:else}
  <div class="gbar">
    <span class="caption">
      <strong>{count}</strong> file{count > 1 ? "s" : ""}
    </span>
  </div>

  <div class="gallery">
    {#each items as item (item.id)}
      <div class="gitem">
        {#if onRemove}
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
          style={frameAspect ? "aspect-ratio:" + frameAspect : ""}
          onclick={() => onItem?.(item.id)}
          aria-label={item.name}
        >
          {#if item.url}
            <img
              src={item.url}
              alt={item.name}
              style={(frameAspect ? "object-fit:contain;" : "") + (item.filter && item.filter !== "none" ? "filter:" + item.filter : "")}
              loading="lazy"
            />
          {:else}
            <span class="gfileicon"><Icon name={item.icon || "file"} size={26} /></span>
          {/if}
        </button>
        {#if editable && onItem}
          <button
            type="button"
            class="gedit"
            aria-label={"Edit " + item.name}
            onclick={() => onItem(item.id)}
          >
            <Icon name="pencil" size={13} />
          </button>
        {/if}
      </div>
    {/each}
    {#if onPick}
      <button type="button" class="gtile-add" aria-label="Add more files" onclick={() => input?.click()}>
        <Icon name="plus" size={22} />
        <span>Add</span>
      </button>
    {/if}
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
