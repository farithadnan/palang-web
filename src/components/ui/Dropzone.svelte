<script>
  /** Generic click-to-choose / drag-and-drop upload surface. Presentational.
   *
   *  Pass `onRequest` when the OWNER already renders a file input (one input
   *  per surface, shared by the empty and populated states); otherwise the
   *  zone renders and drives its own. */
  import Icon from "./Icon.svelte";

  let {
    id,
    accept = "",
    multiple = false,
    main = "Choose files",
    sub = "",
    icon = "upload",
    onPick,
    onRequest = null,
  } = $props();
  let input = $state(null);
  let dragging = $state(false);

  function choose() {
    if (onRequest) onRequest();
    else input?.click();
  }
</script>

<div
  class="dropzone"
  class:drag={dragging}
  onclick={choose}
  role="button"
  tabindex="0"
  aria-label={main}
  onkeydown={(e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      choose();
    }
  }}
  ondragover={(e) => {
    e.preventDefault();
    dragging = true;
  }}
  ondragleave={() => (dragging = false)}
  ondrop={(e) => {
    e.preventDefault();
    dragging = false;
    if (e.dataTransfer?.files?.length) onPick?.([...e.dataTransfer.files]);
  }}
>
  <Icon name={icon} size={34} class="dzicon" />
  <span class="dzmain">{main}</span>
  {#if sub}<span class="dzsub">{sub}</span>{/if}
  {#if !onRequest}
    <input
      {id}
      bind:this={input}
      type="file"
      {accept}
      {multiple}
      onchange={(e) => {
        if (e.currentTarget.files?.length) onPick?.([...e.currentTarget.files]);
        e.currentTarget.value = "";
      }}
    />
  {/if}
</div>
