<script>
  /** One segmented control: a single rounded container whose options are the
   *  segments (rather than separate pills). Generic — props in, change out.
   *  Used by Settings for language, theme and update cadence. */
  let { options = [], value = null, onchange = null, label = "" } = $props();
</script>

<div class="segmented" role="group" aria-label={label}>
  {#each options as opt (opt.id)}
    <button
      type="button"
      class="segbtn"
      class:on={value === opt.id}
      aria-pressed={value === opt.id}
      onclick={() => onchange?.(opt.id)}
    >
      {opt.label}
    </button>
  {/each}
</div>

<style>
  .segmented {
    display: flex;
    width: 100%;
    border: 1px solid var(--line);
    border-radius: 999px;
    overflow: hidden;
    background: var(--panel);
  }
  .segbtn {
    flex: 1;
    min-width: 0;
    min-height: 42px;
    padding: 0.45rem 0.8rem;
    border: 0;
    border-left: 1px solid var(--line);
    background: transparent;
    color: var(--muted);
    font: inherit;
    font-weight: 600;
    font-size: var(--fs-btn);
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .segbtn:first-child { border-left: 0; }
  .segbtn:hover { color: var(--text); }
  .segbtn.on { background: var(--accent); color: #ffffff; }
  [data-theme="dark"] .segbtn.on { color: #081018; }
</style>
