<script>
  /** App shell: header (brand + theme toggle), sidebar (desktop) / tabs (mobile),
   *  view switching with hash routes, toast, consent and footer. */
  import { onMount } from "svelte";
  import Icon from "./components/ui/Icon.svelte";
  import ConvertView from "./components/ConvertView.svelte";
  import PalangView from "./components/PalangView.svelte";
  import MergeView from "./components/MergeView.svelte";
  import PrivacyView from "./components/PrivacyView.svelte";
  import { app, checkForUpdate, applyUpdate, dismissUpdate, setConsent, setTheme } from "./lib/store.svelte.js";

  const TOOLS = [
    { id: "convert", label: "Convert", icon: "convert" },
    { id: "palang", label: "Palang", icon: "palang" },
    { id: "merge", label: "Merge", icon: "merge" },
  ];
  const HASH_TO_VIEW = {
    "": "convert",
    convert: "convert",
    palang: "palang",
    merge: "merge",
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

  $effect(() => {
    document.documentElement.dataset.theme = app.theme;
  });

  onMount(() => {
    window.addEventListener("hashchange", () => {
      const v = readHash();
      if (v !== view) view = v;
    });
    void checkForUpdate();
    // Re-check when the tab regains focus, so a published update surfaces
    // without a manual refresh.
    const onShow = () => void checkForUpdate();
    document.addEventListener("visibilitychange", onShow);
    return () => document.removeEventListener("visibilitychange", onShow);
  });
</script>

<div class="app">
  {#if app.update}
    <div class="update-banner" role="status">
      <span>A new version (v{app.update.version}) is available.</span>
      <div class="update-banner-actions">
        <button type="button" class="btn btn-sm btn-primary" onclick={applyUpdate}>Update now</button>
        <button type="button" class="btn btn-sm" onclick={dismissUpdate}>Later</button>
      </div>
    </div>
  {/if}
  <header class="topbar">
    <div class="topbar-inner">
      <div class="brand">
        <b>Palang</b>
        <span>prepare documents for sharing</span>
      </div>
      <button
        type="button"
        class="iconbtn"
        aria-label={app.theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        onclick={() => setTheme(app.theme === "dark" ? "light" : "dark")}
      >
        <Icon name={app.theme === "dark" ? "sun" : "moon"} size={20} />
      </button>
    </div>
  </header>

  <div class="app-main">
    <aside class="side">
      <nav aria-label="Tools">
        {#each TOOLS as tool (tool.id)}
          <button
            type="button"
            class="tool"
            class:active={view === tool.id}
            onclick={() => (view = tool.id)}
          >
            <Icon name={tool.icon} size={19} />
            {tool.label}
          </button>
        {/each}
        <div class="sidegroup">
          <button type="button" class="sidefoot" onclick={() => (view = "privacy")}>
            <Icon name="info" size={17} />
            Privacy
          </button>
        </div>
      </nav>
    </aside>

    <div class="app-body">
      <div class="tabs tabs-top">
        {#each TOOLS as tool (tool.id)}
          <button
            type="button"
            class="tabbtn"
            class:active={view === tool.id}
            onclick={() => (view = tool.id)}
          >
            <Icon name={tool.icon} size={18} />
            {tool.label}
          </button>
        {/each}
      </div>

      {#if view !== "privacy" && !app.consented}
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

      {#if view === "convert"}
        <ConvertView />
      {:else if view === "palang"}
        <PalangView />
      {:else if view === "merge"}
        <MergeView />
      {:else if view === "privacy"}
        <PrivacyView />
      {/if}
    </div>
  </div>

  <footer class="sitefoot">
    <div class="wrap">
      <button type="button" class="link" onclick={() => (view = "privacy")}>Privacy</button>
      <span class="footdot">·</span>
      <span>MIT License</span>
      <span class="footdot">·</span>
      <a class="link" href="https://github.com/farithadnan/palang" target="_blank" rel="noopener">Core engine</a>
      <span class="footdot">·</span>
      <a class="link" href="https://github.com/farithadnan/palang-web" target="_blank" rel="noopener">Web app</a>
    </div>
  </footer>
</div>

<div class="tabs tabs-bottom" aria-label="Tools">
  {#each TOOLS as tool (tool.id)}
    <button
      type="button"
      class="tabbtn"
      class:active={view === tool.id}
      aria-current={view === tool.id ? "page" : undefined}
      onclick={() => (view = tool.id)}
    >
      <Icon name={tool.icon} size={20} />
      {tool.label}
    </button>
  {/each}
</div>

{#if app.message}
  <div class="toast" class:error={app.message.kind === "error"} role="status">
    {app.message.text}
  </div>
{/if}
