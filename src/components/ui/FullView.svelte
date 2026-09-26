<script>
  /** Full-page media viewer (Samsung-style): image fills the screen, a
   *  scrollable thumbnail carousel sits mid-bottom, and a pill toolbar below
   *  it offers crop / enhance / delete. Icons only, no labels. */
  import { t } from "../../lib/i18n.js";
  import Icon from "./Icon.svelte";

  let {
    items = [], // {id, url?, name, filter?}
    start = 0,
    onClose,
    onDelete,
    onCrop,
    onEnhance,
  } = $props();

  let active = $state(start);
  let stripEl;
  let comparing = $state(false); // hold the enhance pill to see the original
  let holdTimer = 0;

  const item = $derived(items[active] ?? null);

  $effect(() => {
    if (!item) return;
    // Keep the active thumbnail visible in the strip.
    const el = stripEl?.querySelector(`[data-idx="${active}"]`);
    el?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  });

  function del() {
    if (!item) return;
    const id = item.id;
    const last = items.length - 1;
    if (!confirm(t("cvRemoveConfirm"))) return;
    onDelete?.(id);
    if (items.length <= 1) onClose?.();
    else if (active >= last) active = last - 1;
  }

  // Hold the enhance pill: show the ORIGINAL while held (compare), release
  // without firing; a quick tap toggles enhance as before.
  function enDown() {
    holdTimer = setTimeout(() => (comparing = true), 350);
  }
  function enUp() {
    clearTimeout(holdTimer);
    if (comparing) comparing = false; // release after a compare: keep state
  }
  function enTap() {
    if (comparing) return;
    onEnhance?.(item.id);
  }

  const stageFilter = $derived(
    comparing ? "none" : item?.filter && item.filter !== "none" ? item.filter : "none"
  );
</script>

<div class="fview" role="dialog" aria-modal="true" aria-label={item?.name ?? ""}>
  <div class="fview-top">
    <button type="button" class="iconbtn" aria-label={t("close")} onclick={onClose}>
      <Icon name="x" size={22} />
    </button>
    <span class="fview-name">{item?.name ?? ""}</span>
    <span style="width:2.2rem"></span>
  </div>

  <div class="fview-stage">
    {#if item?.url}
      <img
        src={item.url}
        alt={item.name}
        draggable="false"
        style={stageFilter !== "none" ? "filter:" + stageFilter : ""}
      />
    {:else}
      <span class="gfileicon"><Icon name={item?.icon || "file"} size={48} /></span>
    {/if}
  </div>

  <div class="fview-strip" bind:this={stripEl} aria-label={t("menu")}>
    {#each items as it, i (it.id)}
      <button
        type="button"
        class="fstrip-thumb"
        class:on={i === active}
        data-idx={i}
        aria-label={it.name}
        onclick={() => (active = i)}
      >
        {#if it.url}
          <img src={it.url} alt="" draggable="false" />
        {:else}
          <Icon name={it.icon || "file"} size={18} />
        {/if}
      </button>
    {/each}
  </div>

  <div class="fview-pill">
    <button type="button" class="fpill-btn" aria-label={t("viewCrop")} onclick={() => onCrop?.(item.id)}>
      <Icon name="crop" size={20} />
    </button>
    <button
      type="button"
      class="fpill-btn"
      aria-label={t("viewEnhance")}
      onclick={enTap}
      onpointerdown={enDown}
      onpointerup={enUp}
      onpointercancel={enUp}
      onpointerleave={enUp}
      style={comparing ? "opacity:.6" : ""}
    >
      <Icon name="sun" size={20} />
    </button>
    <button type="button" class="fpill-btn fpill-del" aria-label={t("delete")} onclick={del}>
      <Icon name="trash" size={20} />
    </button>
  </div>
</div>

<style>
  .fview {
    position: fixed;
    inset: 0;
    z-index: 60;
    background: var(--bg, #111);
    display: flex;
    flex-direction: column;
    color: var(--text);
  }
  .fview-top {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.6rem 0.9rem;
    border-bottom: 1px solid var(--line);
    background: var(--panel);
  }
  .fview-name {
    flex: 1;
    font-size: var(--fs-body);
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .fview-stage {
    flex: 1;
    min-height: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem;
    background: var(--bg, #111);
  }
  .fview-stage img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    border-radius: 6px;
  }
  .fview-strip {
    display: flex;
    gap: 0.5rem;
    overflow-x: auto;
    padding: 0.7rem 1rem;
    background: var(--panel);
    /* mid-bottom placement */
    margin: 0 0 0.9rem;
  }
  .fstrip-thumb {
    flex: 0 0 auto;
    width: 3.4rem;
    height: 4.2rem;
    border-radius: 8px;
    border: 2px solid transparent;
    overflow: hidden;
    padding: 0;
    background: var(--line);
  }
  .fstrip-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .fstrip-thumb.on { border-color: var(--accent); }
  .fview-pill {
    align-self: center;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.3rem;
    max-width: calc(100vw - 2rem);
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: 999px;
    padding: 0.3rem;
    margin-bottom: 1.4rem;
    box-shadow: var(--shadow);
  }
  .fpill-btn {
    width: 2.7rem;
    height: 2.7rem;
    border-radius: 50%;
    border: 0;
    background: transparent;
    color: var(--text);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .fpill-del { color: #e5533d; }
</style>
