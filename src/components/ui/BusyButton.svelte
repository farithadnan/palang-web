<script>
  /* Generic primary action button with an inline busy state: shows a spinner
     while `busy`, so "working" is never indistinguishable from "stuck".
     Used by the Convert, Palang and Merge generate buttons. */
  let { busy = false, disabled = false, label = "", busyLabel = "", onclick = null, class: cls = "" } = $props();
</script>

<button type="button" class="btn btn-primary btn-busy {cls}" disabled={disabled || busy} onclick={onclick}>
  {#if busy}
    <span class="spinner spinner-xs" aria-hidden="true"></span>
    {busyLabel}
  {:else}
    {label}
  {/if}
</button>

<style>
  .btn-busy { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; }
</style>