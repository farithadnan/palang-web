<script>
  /** Generic click-to-choose / drag-and-drop upload zone. Presentational. */
  import Icon from "./Icon.svelte";

  let { id, accept = "", multiple = false, main = "Choose files", sub = "", icon = "upload", onPick } = $props();
  let input;
  let dragging = $state(false);
</script>

<div
  class="dropzone"
  class:drag={dragging}
  onclick={() => input?.click()}
  role="button"
  tabindex="0"
  aria-label={main}
  onkeydown={(e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      input?.click();
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
</div>
