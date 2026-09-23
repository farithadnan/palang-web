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
  import PrivacyView from "./components/PrivacyView.svelte";
  import { app, generate, setConsent } from "./lib/store.svelte.js";

    const TABS = [
      { id: "convert", label: "Convert" },
      { id: "palang", label: "Palang" },
      { id: "merge", label: "Merge" },
      { id: "presets", label: "Templates" },
    ];
    const HASH_TO_VIEW = {
      "": "convert",
      convert: "convert",
      palang: "palang",
      merge: "merge",
      presets: "presets",
      privacy: "privacy",
    };

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

  {#if view !== "privacy"}
    {#if !app.consented}
      <section class="consent">
        <p>
          <strong>Before you upload:</strong> your document is sent to this server, processed, and
          deleted right after. It is not stored, logged or shared.{" "}
          <button type="button" class="link" onclick={() => (view = "privacy")}>How we handle your files</button>
        </p>
        <label class="checkline">
          <input type="checkbox" onchange={(e) => setConsent(e.currentTarget.checked)} />
          <span>I understand and agree</span>
        </label>
      </section>
    {/if}
  {/if}

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
  {:else if view === "privacy"}
    <PrivacyView />
  {/if}

  <footer>
    <p>
      <button type="button" class="link" onclick={() => (view = "privacy")}>Privacy</button> ·
      <a href="https://github.com/farithadnan/palang" target="_blank" rel="noopener">Source (MIT)</a> ·
      Palang is an open source tool — run it yourself via Docker if you'd rather nothing leave your device.
    </p>
  </footer>
</main>

<Tabs items={TABS} value={view} onPick={(id) => (view = id)} variant="bottom" />
