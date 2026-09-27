<script>
  /** The app's single confirmation dialog, driven by the confirm service.
   *  Any action can `await ask({...})`; this renders the one open prompt. */
  import { onMount } from "svelte";
  import { confirmState, resolveConfirm } from "../../lib/state/confirm.svelte.js";
  import { t } from "../../lib/i18n/index.js";

  onMount(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && confirmState.open) resolveConfirm(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
</script>

{#if confirmState.open}
  <div class="confirm-overlay" role="presentation">
    <button
      type="button"
      class="confirm-backdrop"
      aria-label={t("cancel")}
      onclick={() => resolveConfirm(false)}
    ></button>
    <div class="confirm-box" role="alertdialog" aria-modal="true" aria-label={confirmState.title}>
      <h3>{confirmState.title}</h3>
      {#if confirmState.body}
        <p>{confirmState.body}</p>
      {/if}
      <div class="confirm-actions">
        <button type="button" class="btn" onclick={() => resolveConfirm(false)}>
          {confirmState.cancelLabel || t("cancel")}
        </button>
        <button
          type="button"
          class="btn"
          class:confirm-danger={confirmState.danger}
          class:btn-primary={!confirmState.danger}
          onclick={() => resolveConfirm(true)}
        >
          {confirmState.confirmLabel || t("cfConfirm")}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .confirm-overlay {
    position: fixed;
    inset: 0;
    z-index: 90;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
  }
  .confirm-backdrop {
    position: absolute;
    inset: 0;
    border: 0;
    padding: 0;
    background: rgb(0 0 0 / 0.45);
    cursor: default;
  }
  .confirm-box {
    position: relative;
    z-index: 1;
    width: min(24rem, 100%);
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: 14px;
    box-shadow: var(--shadow);
    padding: 1.2rem;
  }
  .confirm-box h3 { margin: 0 0 0.4rem; font-size: var(--fs-title); }
  .confirm-box p { margin: 0 0 0.4rem; color: var(--muted); font-size: var(--fs-body); line-height: 1.5; }
  .confirm-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    margin-top: 1rem;
  }
  .confirm-actions .btn { min-width: 5rem; justify-content: center; }
  .btn.confirm-danger {
    background: var(--bad);
    border-color: var(--bad);
    color: #ffffff;
  }
</style>
