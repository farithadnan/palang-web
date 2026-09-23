<script>
  /** Templates tab: read-only built-in markings (Use) plus device-local user
   *  templates that survive a refresh. New templates are created from the
   *  Palang tab ("Save marking as template"). */
  import { onMount } from "svelte";
  import Field from "./ui/Field.svelte";
  import PalangSpecFields from "./ui/PalangSpecFields.svelte";
  import {
    app,
    loadPresets,
    applyPreset,
    applyLocalTemplate,
    deleteLocalTemplate,
    saveLocalTemplate,
    setView,
    flash,
  } from "../lib/store.svelte.js";
  import { defaultSpec } from "../lib/domain.js";

  let editingId = $state(null); // local template id being edited
  let form = $state({ name: "", spec: defaultSpec() });

  function openEdit(tpl) {
    editingId = tpl.id;
    form = { name: tpl.name, spec: { ...tpl.spec } };
  }

  function closeEdit() {
    editingId = null;
  }

  function saveEdit() {
    if (saveLocalTemplate(form.name, "")) closeEdit();
  }

  function remove(id, name) {
    if (!confirm('Delete the template "' + name + '"? This cannot be undone.')) return;
    deleteLocalTemplate(id);
    flash("ok", "Template deleted.");
  }

  onMount(() => {
    void loadPresets();
  });
</script>

<div class="panel">
  <h2>Templates</h2>
  <p class="desc">
    Ready-made markings you can reuse. Built-in ones ship with the app. Your own templates are saved on this device, so they stay after a refresh — apply one and you land on the document with the marking loaded.
  </p>

  {#if editingId !== null}
    <div class="divider"></div>
    <h3>Edit template</h3>
    <Field label="Name">
      <input type="text" value={form.name} oninput={(e) => (form.name = e.currentTarget.value)} placeholder="e.g. school, clinic" />
    </Field>
    <PalangSpecFields spec={form.spec} showGeometry={false} onChange={(patch) => (form.spec = patch)} />
    <div class="actionrow">
      <button type="button" class="btn btn-primary" onclick={saveEdit}>Save template</button>
      <button type="button" class="btn" onclick={closeEdit}>Cancel</button>
    </div>
  {:else}
    <div class="actionrow">
      <button type="button" class="btn btn-primary" onclick={() => setView("palang")}>
        Create a template — set up a marking on the Palang tab, then tap “Save marking as template”
      </button>
    </div>
  {/if}

  <div class="divider"></div>

  <h3>My templates ({app.templates.length})</h3>
  {#if app.templates.length}
    <ul class="orderlist">
      {#each app.templates as tpl (tpl.id)}
        <li>
          <span class="ol-label"><strong>{tpl.name}</strong></span>
          <button type="button" onclick={() => applyLocalTemplate(tpl.id)}>Use</button>
          <button type="button" onclick={() => openEdit(tpl)}>Edit</button>
          <button type="button" onclick={() => remove(tpl.id, tpl.name)}>Delete</button>
        </li>
      {/each}
    </ul>
  {:else}
    <p class="caption">None yet. Set up a marking on the Palang tab and tap “Save marking as template”.</p>
  {/if}

  <div class="divider"></div>

  <h3>Built-in</h3>
  {#if app.presets.length}
    <ul class="orderlist">
      {#each app.presets as doc (doc.name)}
        <li>
          <span class="ol-label">
            <strong>{doc.name}</strong>
            {#if doc.description}<span class="ol-sub"> — {doc.description}</span>{/if}
          </span>
          <button type="button" onclick={() => applyPreset(doc)}>Use</button>
        </li>
      {/each}
    </ul>
  {:else}
    <p class="caption">Loading…</p>
  {/if}
</div>
