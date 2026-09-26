<script>
  /** Toast host: renders the toast service queue. Mounted once by the shell.
   *  Green + tick for success, red + alert for failure, icon-only dismiss. */
  import Icon from "./Icon.svelte";
  import { t } from "../../lib/i18n.js";
  import { toasts, dismissToast } from "../../lib/toast.svelte.js";
</script>

<div class="toastwrap" role="status" aria-live="polite">
  {#each toasts as item (item.id)}
    <div class="toast" class:err={item.kind === "error"}>
      <Icon name={item.kind === "error" ? "alert" : "check"} size={18} />
      <span class="toast-text">{item.text}</span>
      <button
        type="button"
        class="toast-x"
        aria-label={t("resultHide")}
        onclick={() => dismissToast(item.id)}
      >
        <Icon name="x" size={14} />
      </button>
    </div>
  {/each}
</div>
