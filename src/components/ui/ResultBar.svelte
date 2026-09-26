<script>
  /** Result row: the file the user just produced. Answers "where did my file
   *  go?" inside the app — name, size, and a save-again button. */
  import { t } from "../../lib/i18n.js";
  import Icon from "./Icon.svelte";
  import { app, saveResult, clearResult, humanSize } from "../../lib/store.svelte.js";
  import { isNativeApp } from "../../lib/save.js";

  const HINT = isNativeApp() ? "resultHintApp" : "resultHint";
  const meta = $derived(
    [humanSize(app.result?.size), t(HINT)].filter(Boolean).join(" · ")
  );
</script>

{#if app.result}
  <div class="resultbar">
    <span class="rb-icon" aria-hidden="true"><Icon name="download" size={20} /></span>
    <span class="rb-text">
      <b title={app.result.name}>{app.result.name}</b>
      <small>{meta}</small>
    </span>
    <button type="button" class="btn btn-sm" onclick={() => void saveResult()}>{t("resultSave")}</button>
    <button type="button" class="iconbtn rb-x" aria-label={t("resultHide")} onclick={clearResult}>
      <Icon name="x" size={16} />
    </button>
  </div>
{/if}

<style>
  .resultbar {
    display: flex;
    align-items: center;
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
  .rb-x { width: 2rem; height: 2rem; min-height: 0; }
</style>
