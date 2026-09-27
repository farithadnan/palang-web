<script>
  /** Generic media gallery with Samsung-style selection:
   *  single tap = open an item, LONG-PRESS = selection mode (per-item radio
   *  overlays, top selection bar with select-all + count + cancel, floating
   *  delete pill). Shared by Convert and Palang.
   *
   *  Gesture rules learned the hard way:
   *  - a press is only cancelled after the finger MOVES past a threshold; any
   *    pointermove cancelled it before, so a long-press with 2px of jitter
   *    never armed and a tap with jitter did nothing at all.
   *  - the released-tap path is gated on the long-press flag set by the timer,
   *    or the up event toggles the just-selected item back off. */
  import { t } from "../../lib/i18n.js";
  import { ask } from "../../lib/confirm.svelte.js";
  import Icon from "./Icon.svelte";

  let {
    items = [], // {id, url?, name, filter?, icon?}
    frameAspect = "", // paper-shape hint (object-fit: contain) when set
    selectable = true,
    onOpen,
    onRemove,
  } = $props();

  const MOVE_SLOP = 12; // px of finger drift still counted as a press

  let selecting = $state(false);
  let selected = $state([]); // ids, immutable updates for reactivity
  let pressTimer = 0;
  let pressId = $state(null);
  let longPress = $state(false); // release after a long-press must not toggle
  let downX = 0;
  let downY = 0;

  function cancelPress() {
    clearTimeout(pressTimer);
    pressTimer = 0;
    pressId = null;
    longPress = false;
  }

  function down(e, id) {
    cancelPress();
    pressId = id;
    downX = e.clientX;
    downY = e.clientY;
    // Capture the pointer so release/move always reach this tile even if the
    // finger drifts, or the browser would otherwise retarget/cancel the event.
    e.currentTarget.setPointerCapture?.(e.pointerId);
    pressTimer = setTimeout(() => {
      if (!selecting) selecting = true;
      if (!selected.includes(id)) selected = [...selected, id];
      longPress = true;
    }, 450);
  }

  function up(id) {
    clearTimeout(pressTimer);
    pressTimer = 0;
    if (!pressId) return;
    const wasLong = longPress;
    pressId = null;
    longPress = false;
    if (wasLong) return; // selection already handled by the timer
    if (selecting) {
      selected = selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id];
    } else {
      onOpen?.(id);
    }
  }

  /** Only a real drag cancels the press (scrolling the gallery, not a tap). */
  function move(e) {
    if (!pressId) return;
    if (Math.hypot(e.clientX - downX, e.clientY - downY) > MOVE_SLOP) cancelPress();
  }

  function cancelSelection() {
    selecting = false;
    selected = [];
  }

  function toggleAll() {
    if (selected.length === items.length) selected = [];
    else selected = items.map((i) => i.id);
  }

  async function bulkRemove() {
    if (!selected.length) return;
    const ok = await ask({
      title: t("cfDeleteImagesTitle", { n: selected.length }),
      body: t("cfDeleteImagesBody"),
      confirmLabel: t("delete"),
      danger: true,
    });
    if (!ok) return;
    for (const id of selected) onRemove?.(id);
    cancelSelection();
  }

  $effect(() => {
    // Prune selection when items disappear (even outside bulk remove).
    if (selected.some((id) => !items.some((i) => i.id === id))) {
      selected = selected.filter((id) => items.some((i) => i.id === id));
    }
  });
</script>

{#if selectable && items.length}
  <div class="mhead">
    <span class="mcount">{t("itemCount", { n: items.length })}</span>
    {#if !selecting}
      <button type="button" class="mselect" onclick={() => (selecting = true)}>{t("select")}</button>
    {/if}
  </div>
{/if}

<div class="mgrid" class:selecting>
  {#each items as item (item.id)}
    <button
      type="button"
      class="mtile"
      class:sel={selected.includes(item.id)}
      class:paper={!!frameAspect}
      style={frameAspect ? "aspect-ratio:" + frameAspect : ""}
      aria-label={item.name}
      aria-pressed={selecting ? selected.includes(item.id) : undefined}
      onpointerdown={(e) => down(e, item.id)}
      onpointerup={() => up(item.id)}
      onpointermove={move}
      onpointercancel={cancelPress}
      oncontextmenu={(e) => e.preventDefault()}
    >
      {#if selectable}
        <span class="mradio" class:on={selected.includes(item.id)} aria-hidden="true"></span>
      {/if}
      {#if item.url}
        <img
          src={item.url}
          alt={item.name}
          style={(frameAspect ? "object-fit:contain;" : "object-fit:contain;") + (item.filter && item.filter !== "none" ? "filter:" + item.filter : "")}
          loading="lazy"
          draggable="false"
        />
      {:else}
        <span class="gfileicon"><Icon name={item.icon || "file"} size={30} /></span>
      {/if}
    </button>
  {/each}
</div>

{#if selecting}
  <div class="mselbar" role="toolbar" aria-label={t("menu")}>
    <button type="button" class="iconbtn" aria-label={t("cancel")} title={t("cancel")} onclick={cancelSelection}>
      <Icon name="x" size={20} />
    </button>
    <span class="msel-count">{t("selCount", { n: selected.length })}</span>
    <button
      type="button"
      class="btn btn-sm"
      onclick={toggleAll}
      aria-pressed={selected.length === items.length}
    >
      <span class="mradio" class:on={selected.length === items.length} aria-hidden="true"></span>
      {t("selSelectAll")}
    </button>
    <button
      type="button"
      class="iconbtn msel-deld"
      aria-label={t("delete")}
      title={t("delete")}
      disabled={!selected.length}
      onclick={bulkRemove}
    >
      <Icon name="trash" size={20} />
    </button>
  </div>
{/if}

<style>
  .mhead {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin: 0.2rem 0 0.6rem;
  }
  .mcount { color: var(--muted); font-size: var(--fs-note); }
  .mselect {
    background: none;
    border: 0;
    color: var(--accent);
    font: inherit;
    font-weight: 600;
    cursor: pointer;
    padding: 0.3rem 0.2rem;
  }
  .mgrid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 0.7rem;
    margin-top: 0.4rem;
  }
  /* Two big tiles per row on a phone — the image is the point of the view. */
  @media (max-width: 700px) {
    .mgrid { grid-template-columns: repeat(2, 1fr); gap: 0.5rem; }
  }
  .mtile {
    position: relative;
    display: block;
    padding: 0;
    border: 1px solid var(--line);
    background: color-mix(in srgb, var(--muted) 6%, transparent);
    border-radius: 12px;
    overflow: hidden;
    touch-action: pan-y; /* vertical scroll still works; a still hold arms select */
    cursor: pointer;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
    -webkit-user-drag: none;
  }
  .mtile img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: contain;
  }
  /* Natural shape (page size = fit): the tile takes the photo's own ratio. */
  .mtile:not(.paper) img { height: auto; }
  .mtile.sel { border-color: var(--accent); }

  .gfileicon { display: flex; align-items: center; justify-content: center; padding: 2.2rem 0; color: var(--muted); }

  /* Selection overlay: a normal radio — white circle, blue dot when picked. */
  .mradio {
    position: absolute;
    top: 0.5rem;
    left: 0.5rem;
    width: 1.3rem;
    height: 1.3rem;
    border-radius: 50%;
    border: 1px solid rgba(0, 0, 0, 0.25);
    background: #ffffff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.35);
    display: none;
    z-index: 2;
  }
  .mgrid.selecting .mradio { display: block; }
  .mradio.on::after {
    content: "";
    position: absolute;
    inset: 0.22rem;
    border-radius: 50%;
    background: #1a73e8;
  }
  .mselbar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 40;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.55rem 0.8rem;
    background: var(--panel);
    border-bottom: 1px solid var(--line);
    flex-wrap: wrap;
  }
  .mselbar .mradio { position: relative; display: block; top: 0; left: 0; }
  .mselbar .btn { display: inline-flex; align-items: center; gap: 0.35rem; }
  .msel-count { flex: 1; font-size: var(--fs-body); color: var(--muted); min-width: 4rem; }
  .msel-deld { color: var(--bad); border-color: color-mix(in srgb, var(--bad) 40%, transparent); }
  .msel-deld:disabled { opacity: 0.5; cursor: default; }
</style>
