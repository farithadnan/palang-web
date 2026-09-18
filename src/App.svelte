<script>
  /** App shell: header + generate action, tab navigation (top desktop / bottom mobile),
   *  view switching with hash routes, and the shared message banner. */
  import { onMount } from "svelte";
  import Tabs from "./components/ui/Tabs.svelte";
  import Alert from "./components/ui/Alert.svelte";
  import ConvertView from "./components/ConvertView.svelte";
  import PalangView from "./components/PalangView.svelte";
  import MergeView from "./components/MergeView.svelte";
  import PresetsView from "./components/PresetsView.svelte";
  import { app, generate } from "./lib/store.svelte.js";

  const TABS = [
    { id: "convert", label: "Convert" },
    { id: "palang", label: "Palang" },
    { id: "merge", label: "Merge" },
    { id: "presets", label: "Templates" },
  ];
  const HASH_TO_VIEW = { "": "convert", convert: "convert", palang: "palang", merge: "merge", presets: "presets" };

  function readHash() {
    const hash = (typeof location !== "undefined" ? location.hash : "").replace(/^#\/?/, "");
    return HASH_TO_VIEW[hash] ?? "convert";
  }

  let view = $state(readHash());

  $effect(() => {
    app.view = view;
    if (typeof history !== "undefined") history.replaceState(null, "", "#/" + view);
  });

  onMount(() => {
    window.addEventListener("hashchange", () => {
      const v = readHash();
      if (v !== view) view = v;
    });
  });

  const summary = $derived(
    (() => {
      const parts = [];
      if (app.images.length) {
        parts.push(app.images.length + " image" + (app.images.length === 1 ? "" : "s"));
      }
      const docs = app.pdfs.length + app.previewFiles.length;
      if (docs) parts.push(docs + " file" + (docs === 1 ? "" : "s"));
      if (app.spec.armed) parts.push("palang");
      return parts.join(" + ");
    })()
  );
</script>

<header class="stick">
  <div>
    <h1>Palang</h1>
    <p class="sub">Prepare documents for sharing — stamp a purpose marking so personal data can't be misused.</p>
  </div>
  <div class="rt">
    <span class="caption">{summary}</span>
    <button type="button" class="btn btn-primary" disabled={app.busy || !summary} onclick={generate}>
      {app.busy ? "Working…" : "Generate PDF"}
    </button>
  </div>
</header>

<main>
  <Tabs items={TABS} value={view} onPick={(id) => (view = id)} variant="top" />

  {#if app.message}
    <Alert kind={app.message.kind}>{app.message.text}</Alert>
  {/if}

  {#if view === "convert"}
    <ConvertView />
  {:else if view === "palang"}
    <PalangView />
  {:else if view === "merge"}
    <MergeView />
  {:else if view === "presets"}
    <PresetsView />
  {/if}

  <footer>
    <p>Palang is open source (MIT). Programmers can also use the command line and the REST API directly.</p>
  </footer>
</main>

<Tabs items={TABS} value={view} onPick={(id) => (view = id)} variant="bottom" />
