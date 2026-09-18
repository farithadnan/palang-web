<script>
  /** Generic file picker: emits the chosen FileList, then clears so re-picks fire. */
  let { id, accept = "", multiple = false, label = "", hint = "", onPick } = $props();
</script>

<div class="field">
  {#if label}<label class="flabel" for={id}>{label}</label>{/if}
  <input
    {id}
    type="file"
    {accept}
    {multiple}
    onchange={(e) => {
      if (e.currentTarget.files?.length) onPick?.([...e.currentTarget.files]);
      e.currentTarget.value = "";
    }}
  />
  {#if hint}<p class="hint">{hint}</p>{/if}
</div>
