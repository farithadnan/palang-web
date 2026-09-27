<script>
  /** Small "?" help affordance: click toggles a short explanation (so it works
   *  on touch); the same text is the hover title on desktop. Generic — pass
   *  the text and an accessible label. */
  let { text = "", label = "Help" } = $props();
  let open = $state(false);
</script>

<span class="help">
  <button
    type="button"
    class="helpbtn"
    aria-label={label}
    aria-expanded={open}
    title={text}
    onclick={() => (open = !open)}
  >?</button>
  {#if open}
    <div class="helptip" role="status">{text}</div>
  {/if}
</span>

<style>
  .help { position: relative; display: inline-flex; }
  .helpbtn {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 1px solid var(--line-strong);
    background: var(--panel);
    color: var(--muted);
    font: inherit;
    font-weight: 700;
    font-size: 0.85rem;
    line-height: 1;
    cursor: pointer;
  }
  .helpbtn:hover,
  .helpbtn[aria-expanded="true"] { color: var(--accent); border-color: var(--accent); }
  .helptip {
    position: absolute;
    top: calc(100% + 0.5rem);
    right: 0;
    z-index: 30;
    width: min(20rem, 78vw);
    background: var(--panel);
    color: var(--text);
    border: 1px solid var(--line);
    border-radius: 10px;
    box-shadow: var(--shadow);
    padding: 0.7rem 0.85rem;
    font-size: 0.85rem;
    font-weight: 400;
    line-height: 1.5;
    text-align: left;
  }
</style>
