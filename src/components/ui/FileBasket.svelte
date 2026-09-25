<script>
  /** Generic file basket: empty dropzone or a long-press-selection gallery
   *  (MediaGrid) with an add tile. Shared by Convert, Palang and Merge. */
  import { t } from "../../lib/i18n.js";
  import Dropzone from "./Dropzone.svelte";
  import MediaGrid from "./MediaGrid.svelte";

  let {
    id,
    accept = "",
    multiple = false,
    main = t("basketChoose"),
    sub = "",
    icon = "upload",
    items = [], // {id, url?, name, filter?, icon?}
    frameAspect = "", // e.g. "595/842" — thumbnails shown in the chosen paper shape
    requestAddTick = 0, // topbar "+" drives the picker from outside
    onRemove,
    onItem,
    onPick,
  } = $props();

  let input;
  const count = $derived(items.length);

  $effect(() => {
    if (requestAddTick) input?.click();
  });
</script>

{#if !count}
  <Dropzone {id} {accept} {multiple} {main} {sub} {icon} {onPick} />
{:else}
  <MediaGrid
    {items}
    {frameAspect}
    onOpen={onItem}
    onRemove={onRemove}
  />

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
