<script>
  /** App shell: shared top bar (home <-> app, language, theme), sidebar
   *  (desktop) / tabs (mobile), view switching with hash routes, toast,
   *  consent and footer. The landing page owns the home view; the privacy
   *  section lives on the landing (single source, no separate view). */
  import { onMount } from "svelte";
  import Icon from "./components/ui/Icon.svelte";
  import Topbar from "./components/ui/Topbar.svelte";
  import Landing from "$landing"; // variant switch: stub in app-only builds
  import DevDocs from "./components/DevDocs.svelte"; // full-site builds only (#/docs)
  import AboutView from "./components/AboutView.svelte";
  import ConvertView from "./components/ConvertView.svelte";
  import PalangView from "./components/PalangView.svelte";
  import MergeView from "./components/MergeView.svelte";
  import { app, applyUpdate, checkForUpdate, dismissUpdate } from "./lib/store.svelte.js";
  import { installNetworkLog } from "./lib/network-log.js";
  import { loadLimits } from "./lib/config.js";
  import { t } from "./lib/i18n.js";

  const TOOLS = [
    { id: "convert", label: () => t("convertLabel"), icon: "convert" },
    { id: "palang", label: () => t("palang"), icon: "palang" },
    { id: "merge", label: () => t("mergeLabel"), icon: "merge" },
    { id: "about", label: () => t("about"), icon: "info" },
  ];
  const HASH_TO_VIEW = {
    "": "home",
    home: "home",
    convert: "convert",
    palang: "palang",
    merge: "merge",
    about: "about",
    docs: "docs",
    // The standalone privacy view was folded into the landing section.
    privacy: "home",
  };

  const HAS_LANDING = import.meta.env.MODE !== "app";

  function readHash() {
    const hash = (typeof location !== "undefined" ? location.hash : "").replace(/^#\/?/, "");
    const v = HASH_TO_VIEW[hash] ?? "home";
    // App-only builds: the home route IS the tool, and there is no docs page.
    // No landing page, no entry modal - users open the app and land straight
    // in Convert.
    if (!HAS_LANDING && (v === "home" || v === "docs")) return "convert";
    return v;
  }

  let view = $state(readHash());
  let netOpen = $state(false);

  $effect(() => {
    app.view = view;
    if (typeof history !== "undefined") history.replaceState(null, "", "#/" + view);
  });

  $effect(() => {
    document.documentElement.dataset.theme = app.theme;
    document.documentElement.lang = app.lang;
  });

  // The privacy proof: every request the app makes is recorded and visible
  // in the Network activity panel — processing documents adds nothing.
  installNetworkLog((entry) => {
    entry.seq = (app.network.at(-1)?.seq ?? 0) + 1;
    app.network.push(entry);
  });
  // Operator flag: limits.json on the host overrides the compiled caps.
  // Runs after the wrapper is installed, so the request is visible in the
  // Network activity panel (it is a static app file, like version.json).
  void loadLimits();

  function goHomePrivacy() {
    // App-only builds have no landing page to scroll to: the privacy evidence
    // IS the network activity panel, so the link opens it instead.
    if (!HAS_LANDING) {
      netOpen = true;
      return;
    }
    location.hash = "#/home";
    // Wait for the landing to render, then bring the privacy section in.
    setTimeout(() => {
      document.querySelector(".landing #privacy")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 200);
  }

  onMount(() => {
    window.addEventListener("hashchange", () => {
      const v = readHash();
      if (v !== view) view = v;
    });
    void checkForUpdate();
    const onShow = () => void checkForUpdate();
    document.addEventListener("visibilitychange", onShow);
    return () => document.removeEventListener("visibilitychange", onShow);
  });
</script>

<div class="app">
  {#if app.update}
    <div class="update-banner" role="status">
      <span>{t("updateAvailable", { version: app.update.version })}</span>
      <div class="update-banner-actions">
        <button type="button" class="btn btn-sm btn-primary" onclick={applyUpdate}>{t("updateNow")}</button>
        <button type="button" class="btn btn-sm" onclick={dismissUpdate}>{t("later")}</button>
      </div>
    </div>
  {/if}
  {#if view === "home"}
    <Landing />
  {:else}
  <Topbar context="app" homeTo={HAS_LANDING ? "home" : null}>
    {#snippet children()}
      {#if HAS_LANDING}
        <a href="#home" onclick={(e) => { e.preventDefault(); goHomePrivacy(); }}>{t("privacy")}</a>
      {:else}
        <a href="#/about">{t("about")}</a>
      {/if}
    {/snippet}
  </Topbar>

  <div class="app-main">
    <aside class="side">
      <nav aria-label={t("menu")}>
        {#each TOOLS as tool (tool.id)}
          <button
            type="button"
            class="tool"
            class:active={view === tool.id}
            onclick={() => (view = tool.id)}
          >
            <Icon name={tool.icon} size={19} />
            {tool.label()}
          </button>
        {/each}
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
            {tool.label()}
          </button>
        {/each}
      </div>

    {#if view === "convert"}
        <ConvertView />
      {:else if view === "palang"}
        <PalangView />
      {:else if view === "merge"}
        <MergeView />
      {:else if view === "about"}
        <AboutView />
      {:else if view === "docs"}
        <DevDocs />
      {/if}
    </div>
  </div>

  {#if HAS_LANDING}
  <footer class="sitefoot">
    <div class="wrap">
      <button type="button" class="link" onclick={() => (netOpen = !netOpen)} aria-expanded={netOpen}>
        {t("networkActivity")}
      </button>
      <span class="footdot">·</span>
      <button type="button" class="link" onclick={goHomePrivacy}>{t("privacy")}</button>
      <span class="footdot">·</span>
      <span>{t("mitLicense")}</span>
      <span class="footdot">·</span>
      <a class="link" href="https://github.com/farithadnan/palang-web" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:0.35rem">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.27-.01-1.17-.02-2.12-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.75 2.69 1.25 3.34.95.1-.74.4-1.25.72-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.67.41.35.77 1.05.77 2.12 0 1.53-.01 2.76-.01 3.14 0 .31.21.68.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z"/></svg>
        Palang
      </a>
    </div>
  </footer>
  {/if}
  {/if}
</div>

{#if view !== "home"}
<div class="tabs tabs-bottom" aria-label={t("menu")}>
  {#each TOOLS as tool (tool.id)}
    <button
      type="button"
      class="tabbtn"
      class:active={view === tool.id}
      aria-current={view === tool.id ? "page" : undefined}
      onclick={() => (view = tool.id)}
    >
      <Icon name={tool.icon} size={20} />
      {tool.label()}
    </button>
  {/each}
</div>
{/if}

{#if netOpen && HAS_LANDING}
  <aside class="netpanel" role="region" aria-label={t("networkActivity")}>
    <div class="netpanel-head">
      <b>{t("networkActivity")}</b>
      <button
        type="button"
        class="iconbtn"
        aria-label="Close"
        onclick={() => (netOpen = false)}
      >
        <Icon name="x" size={16} />
      </button>
    </div>
    <p class="caption">{t("networkIntro")}</p>
    {#if !app.network.length}
      <p class="net-empty">{t("noRequestsYet")}</p>
    {:else}
      <ul class="net-list">
        {#each app.network as e (e.seq)}
          <li>
            <span class="net-method">{e.method}</span>
            <span class="net-url">{e.url}</span>
            <span class="net-status" class:err={e.error}>{e.status === 0 ? "ERR" : e.status}</span>
          </li>
        {/each}
      </ul>
    {/if}
  </aside>
{/if}

{#if app.message}
  <div class="toast" class:error={app.message.kind === "error"} role="status">
    {app.message.text}
  </div>
{/if}
