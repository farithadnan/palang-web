<script>
  /** Generic inline alert. kind: "ok" | "error". */
  let { kind = "ok", children } = $props();
</script>

<div class="alert alert-{kind}" role="status">
  {#if children}{@render children()}{/if}
</div>
