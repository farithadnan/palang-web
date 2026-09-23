<script>
  /** Templates tab: create, edit and delete presets straight from the UI. */
  import { onMount } from "svelte";
  import Field from "./ui/Field.svelte";
  import PalangSpecFields from "./ui/PalangSpecFields.svelte";
  import { app, savePreset, deletePreset, loadPresets, flash } from "../lib/store.svelte.js";
  import { buildPalangSpec, presetDefaultSpec, presetSpecFromDoc } from "../lib/domain.js";

  let editingName = $state(null); // preset name being edited (null = closed)
  let form = $state({ name: "", description: "", spec: presetDefaultSpec() });

  function openNew() {
    editingName = "";
    form = { name: "", description: "", spec: presetDefaultSpec() };
  }

  function openEdit(doc) {
    editingName = doc.name;
    form = {
      name: doc.name,
      description: doc.description || "",
      spec: presetSpecFromDoc(doc),
    };
  }

  function close() {
    editingName = null;
  }

  async function save() {
    const name = form.name.trim();
    if (!/^[a-z0-9_-]+$/.test(name)) {
      flash("error", "Template names can only use letters, numbers, dashes and underscores.");
      return;
    }
    try {
      await savePreset({
        name,
        description: form.description.trim(),
        palang: [buildPalangSpec(form.spec, true)],
      });
      flash("ok", editingName === "" || editingName === null ? "Template saved." : "Template updated.");
      close();
    } catch (err) {
      flash("error", err.message);
    }
  }

  async function remove(name) {
    if (!confirm("Delete the template \"" + name + "\"? This cannot be undone.")) return;
    try {
      await deletePreset(name);
      flash("ok", "Template deleted.");
    } catch (err) {
      flash("error", err.message);
    }
  }

  onMount(() => {
    void loadPresets();
  });
</script>

<div class="panel">
  <h2>Templates</h2>
<p class="caption">
  Templates (called presets in the documentation) are ready-made markings for common uses. Create your own here and they appear in one click anywhere on this site.
</p>

<div class="actionrow">
  <button type="button" class="btn btn-primary" onclick={openNew}>New template</button>
</div>

{#if editingName !== null}
  <section class="divider">
    <h3>{editingName ? "Edit template: " + editingName : "New template"}</h3>
    <Field label="Name">
      <input type="text" value={form.name} oninput={(e) => (form.name = e.currentTarget.value)} placeholder="e.g. school, clinic" />
    </Field>
    <Field label="Description">
      <input type="text" value={form.description} oninput={(e) => (form.description = e.currentTarget.value)} placeholder="What is this template for?" />
    </Field>
    <PalangSpecFields spec={form.spec} showGeometry={true} onChange={(patch) => (form.spec = patch)} />
    <div class="actionrow">
      <button type="button" class="btn btn-primary" onclick={save}>Save template</button>
      <button type="button" class="btn" onclick={close}>Cancel</button>
    </div>
  </section>
{/if}

{#if app.presets.length}
  <ul class="orderlist">
    {#each app.presets as doc (doc.name)}
      <li>
        <span class="ol-label">
          <strong>{doc.name}</strong>
          {#if doc.description}<span class="ol-sub"> — {doc.description}</span>{/if}
        </span>
        <span class="chip chip-plain">{doc.palang.length} marking{doc.palang.length > 1 ? "s" : ""}</span>
        <button type="button" onclick={() => openEdit(doc)}>Edit</button>
        <button type="button" onclick={() => remove(doc.name)}>Delete</button>
      </li>
    {/each}
  </ul>
{:else}
  <p class="caption">No templates yet. Create one to reuse your favourite markings.</p>
{/if}
</div>
