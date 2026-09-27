<script>
  /** A tool view's header: the view title on the left; on the right an optional
   *  "?" help affordance and the view's own Add action. The add button used to
   *  live in the top bar, where it was disconnected from the view it fed and
   *  dead on About and Settings. */
  import Icon from "./Icon.svelte";
  import HelpTip from "./HelpTip.svelte";
  import { t } from "../../lib/i18n.js";

  let { title = "", help = "", onAdd = null, addLabel = "" } = $props();
</script>

<header class="toolhead">
  <h2>{title}</h2>
  <div class="head-actions">
    {#if help}
      <HelpTip text={help} label={t("helpTitle")} />
    {/if}
    {#if onAdd}
      <button type="button" class="btn btn-sm btn-add" onclick={onAdd}>
        <Icon name="plus" size={18} />
        <span>{addLabel}</span>
      </button>
    {/if}
  </div>
</header>

<style>
  .toolhead {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    border-bottom: 1px solid var(--line);
    padding-bottom: 0.7rem;
    margin-bottom: 1rem;
  }
  .toolhead h2 {
    border: 0;
    padding: 0;
    margin: 0;
    font-size: var(--fs-title);
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .head-actions { display: flex; align-items: center; gap: 0.5rem; flex: none; }
  @media (max-width: 420px) {
    .btn-add span { display: none; } /* icon-only when the title needs the room */
    .btn-add { padding: 0 0.7rem; }
  }
</style>
