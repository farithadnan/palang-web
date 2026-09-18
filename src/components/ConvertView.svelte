<script>
  /** Convert tab: add multiple images, edit each one's crop/enhancement individually. */
  import Field from "./ui/Field.svelte";
  import Select from "./ui/Select.svelte";
  import Checkbox from "./ui/Checkbox.svelte";
  import FilePicker from "./ui/FilePicker.svelte";
  import CropBox from "./ui/CropBox.svelte";
  import { PAGE_SIZES } from "../lib/domain.js";
  import {
    app,
    addImages,
    removeImage,
    revertImage,
    replaceImage,
    updateImage,
  } from "../lib/store.svelte.js";

  let editing = $state(null); // image id currently being edited
  let replaceInput = $state(null);

  const editingImage = $derived(app.images.find((im) => im.id === editing) ?? null);

  function pickReplace(e) {
    const file = e.currentTarget.files?.[0];
    if (file && editingImage) replaceImage(editingImage.id, file);
    e.currentTarget.value = "";
  }
</script>

<h2>Convert images to PDF</h2>
<p class="caption">Turn one or more photos or scans into a single PDF. Every image can be cropped or enhanced on its own.</p>

<FilePicker
  id="convert-files"
  accept=".jpg,.jpeg,.png,.webp,.bmp,.tif,.tiff"
  multiple
  label="Photos or scans"
  hint="You can pick several files. Each becomes one page."
  onPick={addImages}
/>

{#if app.images.length}
  <ul class="orderlist">
    {#each app.images as im (im.id)}
      <li>
        <img class="thumb" src={im.url} alt="" />
        <span class="ol-label">{im.file.name}</span>
        {#if im.crop}<span class="chip">Cropped</span>{/if}
        {#if im.enhance}<span class="chip">Enhanced</span>{/if}
        <button type="button" onclick={() => (editing = editing === im.id ? null : im.id)}>
          {editing === im.id ? "Close" : "Edit"}
        </button>
        <button type="button" disabled={!im.crop && !im.enhance} onclick={() => revertImage(im.id)}>Reset</button>
        <button type="button" onclick={() => removeImage(im.id)}>Remove</button>
      </li>
    {/each}
  </ul>
{/if}

{#if editingImage}
  {#key editingImage.crop ? JSON.stringify(editingImage.crop) : "none"}
    <section class="divider">
      <h3>Edit: {editingImage.file.name}</h3>
      <Field label="Crop" hint="Drag inside the image to choose what to keep, or drag the corners to resize.">
        <CropBox
          url={editingImage.url}
          crop={editingImage.crop}
          onChange={(c) => updateImage(editingImage.id, { crop: c })}
        />
      </Field>
      <Checkbox
        label="Improve quality"
        hint="Sharpen and boost contrast, good for scans."
        checked={editingImage.enhance}
        onChange={(v) => updateImage(editingImage.id, { enhance: v })}
      />
      <div class="actionrow">
        <button type="button" class="btn" onclick={() => revertImage(editingImage.id)}>Use full image</button>
        <button type="button" class="btn" onclick={() => replaceInput?.click()}>Replace file…</button>
        <input bind:this={replaceInput} class="hidden-input" type="file" accept="image/*" onchange={pickReplace} />
      </div>
    </section>
  {/key}
{:else if app.images.length}
  <p class="caption">Pick an image above to crop or enhance it.</p>
{/if}

<Field label="Paper size">
  <Select id="page-size" value={app.pageSize} options={PAGE_SIZES} onChange={(v) => (app.pageSize = v)} />
</Field>
