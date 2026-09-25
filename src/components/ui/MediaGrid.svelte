<script>
  /** Generic media gallery with Samsung-style selection:
   *  single tap = open an item, LONG-PRESS = selection mode (per-item radio
   *  overlays, top selection bar with select-all + count + cancel, floating
   *  delete pill), plus an add tile. Shared by Convert and Palang. */
  import { t } from "../../lib/i18n.js";
  import Icon from "./Icon.svelte";

  let {
    items = [], // {id, url?, name, filter?, icon?}
    frameAspect = "", // paper-shape hint (object-fit: contain) when set
    selectable = true,
    onOpen,
    onRemove,
    onAdd,
  } = $props();

  let selecting = $state(false);
  let selected = $state([]); // ids, immutable updates for reactivity
  let pressTimer = $state(0);
  let pressId = $state(null);
  let longPress = $state(false); // release after a long-press must not toggle

  function cancelPress() {
    clearTimeout(pressTimer);
    pressId = null;
    longPress = false;
  }

  function down(e, id) {
    cancelPress();
    pressId = id;
    pressTimer = setTimeout(() => {
      if (!selecting) selecting = true;
      if (!selected.includes(id)) selected = [...selected, id];
      longPress = true;
    }, 450);
    e.preventDefault();
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

  function move() {
    cancelPress();
  }

  function cancelSelection() {
    selecting = false;
    selected = [];
  }

  function toggleAll() {
    if (selected.length === items.length) selected = [];
    else selected = items.map((i) => i.id);
  }

  function bulkRemove() {
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

<div class="mgrid" class:selecting>
  {#each items as item (item.id)}
    <button
      type="button"
      class="mtile"
      class:sel={selected.includes(item.id)}
      style={frameAspect ? "aspect-ratio:" + frameAspect : ""}
      aria-label={item.name}
      aria-pressed={selecting ? selected.includes(item.id) : undefined}
      onpointerdown={(e) => down(e, item.id)}
      onpointerup={() => up(item.id)}
      onpointermove={move}
      onpointerleave={move}
      oncontextmenu={(e) => e.preventDefault()}
    >
      {#if selectable}
        <span class="mradio" class:on={selected.includes(item.id)} aria-hidden="true"></span>
      {/if}
      {#if item.url}
        <img
          src={item.url}
          alt={item.name}
          style={(frameAspect ? "object-fit:contain;" : "object-fit:cover;") + (item.filter && item.filter !== "none" ? "filter:" + item.filter : "")}
          loading="lazy"
          draggable="false"
        />
      {:else}
        <span class="gfileicon"><Icon name={item.icon || "file"} size={26} /></span>
      {/if}
      <span class="mname">{item.name}</span>
    </button>
  {/each}
  {#if onAdd}
    <button type="button" class="mtile mtile-add" aria-label={t("basketAddMore")} onclick={onAdd}>
      <Icon name="plus" size={26} />
      <span class="mname">{t("basketAdd")}</span>
    </button>
  {/if}
</div>

{#if selecting}
  <div class="mselbar" role="toolbar" aria-label={t("menu")}>
    <button type="button" class="msel-all" onclick={toggleAll} aria-pressed={selected.length === items.length}>
      <span class="mradio" class:on={selected.length === items.length} aria-hidden="true"></span>
      {t("selSelectAll")}
    </button>
    <span class="msel-count">{t("selCount", { n: selected.length })}</span>
    <button type="button" class="msel-cancel link" onclick={cancelSelection}>{t("cancel")}</button>
  </div>
  <div class="mselpill">
    <button type="button" class="msel-del" disabled={!selected.length} onclick={bulkRemove} aria-label={t("delete")}>
      <Icon name="x" size={18} />
      {t("delete")}
    </button>
  </div>
{/if}

<style>
  .mgrid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 0.55rem;
    margin-top: 0.4rem;
  }
  @media (max-width: 640px) {
    .mgrid { grid-template-columns: repeat(3, 1fr); gap: 0.4rem; }
  }
  .mtile {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    padding: 0.35rem;
    border: 1px solid var(--line);
    background: var(--panel);
    border-radius: 12px;
    overflow: hidden;
    touch-action: none;
    cursor: pointer;
    user-select: none;
    -webkit-user-select: none;
  }
  .mtile img {
    width: 100%;
    aspect-ratio: 4 / 3;
    border-radius: 8px;
    background: var(--line);
    pointer-events: none;
  }
  .mtile.sel { border-color: var(--accent); }
  .mname {
    font-size: 0.72rem;
    color: var(--muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: center;
  }
  .mtile-add {
    align-items: center;
    justify-content: center;
    min-height: 6.5rem;
    border-style: dashed;
    gap: 0.2rem;
    color: var(--accent);
  }
  .gfileicon { padding: 1rem 0; text-align: center; color: var(--muted); }

  /* selection overlays */
  .mradio {
    position: absolute;
    top: 0.55rem;
    left: 0.55rem;
    width: 1.15rem;
    height: 1.15rem;
    border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, 0.9);
    background: rgba(0, 0, 0, 0.35);
    display: none;
    z-index: 2;
  }
  .mgrid.selecting .mradio { display: block; }
  .mradio.on { background: var(--accent); border-color: var(--accent); }
  .mselbar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 40;
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.7rem 1rem;
    background: var(--panel);
    border-bottom: 1px solid var(--line);
  }
  .mselbar .mradio { position: static; display: block; }
  .msel-all { display: flex; align-items: center; gap: 0.5rem; background: none; border: 0; color: var(--text); font-size: 0.95rem; }
  .msel-count { flex: 1; font-size: 0.95rem; }
  .mselpill {
    position: fixed;
    bottom: 5.2rem;
    left: 50%;
    transform: translateX(-50%);
    z-index: 40;
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: 999px;
    padding: 0.35rem;
    box-shadow: var(--shadow);
  }
  .msel-del {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    background: none;
    border: 0;
    color: #e5533d;
    padding: 0.45rem 0.9rem;
    font-size: 0.95rem;
  }
  .msel-del:disabled { opacity: 0.4; }
</style>
