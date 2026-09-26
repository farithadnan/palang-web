<script>
  /** Two variants, one source (the Vite mode decides):
   *
   *  - web (`vite build`, mode production): the public SITE only. The tools
   *    ship as the EXE and APK builds, so the tool routes are deliberately not
   *    served here. Routes: home, features/<id>, install, privacy, docs.
   *  - app (`vite build --mode app`): the TOOLS only, with the installed-app
   *    chrome (topbar add button, About, Settings). The landing graph is
   *    aliased to a stub, so it never enters this bundle. */
  import { onMount } from "svelte";
  import Icon from "./components/ui/Icon.svelte";
  import ToastHost from "./components/ui/Toast.svelte";
  import Topbar from "./components/ui/Topbar.svelte";
  import Landing from "$landing"; // the whole public site, or a stub
  import AboutView from "./components/AboutView.svelte";
  import SettingsView from "./components/SettingsView.svelte";
  import ConvertView from "./components/ConvertView.svelte";
  import PalangView from "./components/PalangView.svelte";
  import MergeView from "./components/MergeView.svelte";
  import { app, applyUpdate, checkForUpdate, dismissUpdate, requestAdd } from "./lib/store.svelte.js";
  import { loadLimits } from "./lib/config.js";
  import { t } from "./lib/i18n.js";

  const TOOLS = [
    { id: "convert", label: () => t("convertLabel"), icon: "convert" },
    { id: "palang", label: () => t("palang"), icon: "palang" },
    { id: "merge", label: () => t("mergeLabel"), icon: "merge" },
    { id: "about", label: () => t("about"), icon: "info" },
    { id: "settings", label: () => t("settings"), icon: "sliders" },
  ];

  const HAS_LANDING = import.meta.env.MODE !== "app";

  /** Routes owned by the public site (only exist in web builds). */
  const SITE_VIEWS = new Set(["home", "install", "privacy", "feature", "docs"]);
  const HASH_TO_VIEW = {
    "": "home",
    home: "home",
    install: "install",
    privacy: "privacy",
    docs: "docs",
    convert: "convert",
    palang: "palang",
    merge: "merge",
    about: "about",
    settings: "settings",
  };

  let featureId = $state("convert");

  function readHash() {
    const hash = (typeof location !== "undefined" ? location.hash : "").replace(/^#\/?/, "");
    if (hash.startsWith("features/")) {
      featureId = hash.slice("features/".length) || "convert";
      return "feature";
    }
    const v = HASH_TO_VIEW[hash] ?? "home";
    if (HAS_LANDING) return SITE_VIEWS.has(v) ? v : "home"; // web: site pages only
    return SITE_VIEWS.has(v) ? "convert" : v; // app: tools only
  }

  let view = $state(readHash());

  /** The canonical hash for a view — feature pages carry their id, so a
   *  refresh lands on the same page instead of falling back to convert. */
  function hashFor(v, feature) {
    return v === "feature" ? "#/features/" + feature : "#/" + v;
  }

  $effect(() => {
    app.view = view;
    if (typeof history !== "undefined") history.replaceState(null, "", hashFor(view, featureId));
  });

  $effect(() => {
    document.documentElement.dataset.theme = app.theme;
    document.documentElement.lang = app.lang;
  });

  // Operator flag: limits.json on the host overrides the compiled caps.
  void loadLimits();

  onMount(() => {
    window.addEventListener("hashchange", () => {
      const v = readHash();
      if (v !== view) view = v;
    });
    void checkForUpdate();
    const onShow = () => void checkForUpdate();
    document.addEventListener("visibilitychange", onShow);
    return () => {
      document.removeEventListener("visibilitychange", onShow);
    };
  });

  // Auto update check cadence (Settings page): daily / weekly / off.
  $effect(() => {
    const perFreq = { daily: 24 * 3600 * 1000, weekly: 7 * 24 * 3600 * 1000, never: 0 };
    const ms = perFreq[app.updateFreq] ?? 0;
    if (!ms) return;
    const id = setInterval(() => void checkForUpdate(), ms);
    return () => clearInterval(id);
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

  {#if SITE_VIEWS.has(view)}
    <Landing page={view} feature={featureId} />
  {:else}
    <Topbar context="app" homeTo={null} onAdd={requestAdd} />

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
        {:else if view === "settings"}
          <SettingsView />
        {/if}
      </div>
    </div>
  {/if}
</div>

{#if !SITE_VIEWS.has(view)}
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

<ToastHost />
