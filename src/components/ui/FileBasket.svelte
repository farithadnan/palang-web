<script>
  /** Generic file basket: empty dropzone or a long-press-selection gallery
   *  (MediaGrid). Shared by Convert and Palang.
   *
   *  ONE file input lives here for BOTH states (the Dropzone is a surface, not
   *  a second picker), so the topbar "+" has a single, predictable target. */
  import { t } from "../../lib/i18n.js";
  import { takeFiles } from "../../lib/pick.js";
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

  let input = $state(null);
  const count = $derived(items.length);

  // Open the picker ONLY when the counter CHANGES. Firing whenever it is
  // non-zero made every mount re-open the file chooser by itself: navigating
  // between tabs (with files already added), and the empty-state -> gallery
  // swap right after the first file landed.
  let handledTick = 0;
  $effect(() => {
    const tick = requestAddTick;
    if (!tick || tick === handledTick) return;
    handledTick = tick;
    input?.click();
  });
</script>

<input
  bind:this={input}
  class="hidden-input"
  id={id + "-more"}
  type="file"
  {accept}
  {multiple}
  onchange={(e) => {
    const picked = takeFiles(e.currentTarget);
    if (picked.length) onPick?.(picked);
  }}
/>

{#if !count}
  <Dropzone {icon} {main} {sub} onPick={onPick} onRequest={() => input?.click()} />
{:else}
  <MediaGrid
    {items}
    {frameAspect}
    onOpen={onItem}
    onRemove={onRemove}
  />
{/if}
