<script>
  /** Generic modal dialog: closes on overlay click or the Cancel path in children. */
  let { title = "", onClose, children } = $props();
</script>

<div
  class="modal-overlay"
  role="presentation"
  onkeydown={(e) => {
    if (e.key === "Escape") onClose?.();
  }}
  onclick={(e) => {
    if (e.target === e.currentTarget) onClose?.();
  }}
>
  <div class="modal" role="dialog" aria-modal="true" aria-label={title}>
    {#if title}<h3>{title}</h3>{/if}
    {#if children}{@render children()}{/if}
  </div>
</div>
