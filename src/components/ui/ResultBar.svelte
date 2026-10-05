<script>
  /** Result row: the file the user just produced. Answers "where did my file
   *  go?" inside the app — name, size, save-again, and handoff to the next
   *  tool so the output never has to be re-added by hand. */
  import { t } from "../../lib/i18n/index.js";
  import Icon from "./Icon.svelte";
  import {
    app,
    saveResult,
    clearResult,
    humanSize,
    sendResultTo,
    flash,
  } from "../../lib/state/store.svelte.js";
  import { goto } from "../../lib/util/router.js";
  import { isNativeApp } from "../../lib/util/save.js";

  const HINT = isNativeApp() ? "resultHintApp" : "resultHint";
  const meta = $derived(
    [humanSize(app.result?.size), t(HINT)].filter(Boolean).join(" · ")
  );

  function send(target) {
    if (!sendResultTo(target)) return;
    flash("ok", t(target === "palang" ? "sentStamp" : "sentMerge"));
    goto(target);
  }
</script>

{#if app.result}
  <div class="resultbar">
    <span class="rb-icon" aria-hidden="true"><Icon name="download" size={20} /></span>
    <span class="rb-text">
      <b title={app.result.name}>{app.result.name}</b>
      <small>{meta}</small>
    </span>
    <span class="rb-actions">
      {#if app.result.mode !== "palang"}
        <button type="button" class="btn btn-sm" onclick={() => send("palang")}>{t("sendStamp")}</button>
      {/if}
      {#if app.result.mode !== "merge"}
        <button type="button" class="btn btn-sm" onclick={() => send("merge")}>{t("sendMerge")}</button>
      {/if}
      <button type="button" class="btn btn-sm" onclick={() => void saveResult()}>{t("resultSave")}</button>
      <button type="button" class="iconbtn rb-x" aria-label={t("resultHide")} onclick={clearResult}>
        <Icon name="x" size={16} />
      </button>
    </span>
  </div>
{/if}

<style>
  .resultbar {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.7rem;
    margin-top: 0.9rem;
    padding: 0.7rem 0.85rem;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: color-mix(in srgb, var(--accent) 8%, transparent);
  }
  .rb-icon { color: var(--accent); display: flex; }
  .rb-text { flex: 1; min-width: 0; display: flex; flex-direction: column; }
  .rb-text b { font-size: var(--fs-btn); font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .rb-text small { color: var(--muted); font-size: var(--fs-note); }
  .rb-actions { display: inline-flex; align-items: center; flex-wrap: wrap; justify-content: flex-end; gap: 0.4rem; }
  .rb-x { width: var(--ctrl-h); height: var(--ctrl-h); min-height: var(--ctrl-h); }
</style>
