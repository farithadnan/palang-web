<script>
  /** Two variants, one source (the Vite mode decides):
   *
   *  - site (`npm run build`, mode production): the public site. The tools
   *    ship as the EXE and APK builds, so tool routes are not served here.
   *    Clean paths: /, /install, /privacy, /features/<id>, /docs.
   *  - app (`vite build --mode app`): the tools only, with the installed-app
   *    chrome (topbar add button, About, Settings). Hash routes: #/convert.
   *    The whole site graph is aliased to a stub and never enters this bundle. */
  import { onMount } from "svelte";
  import ToolIcon from "./components/ui/Icon.svelte";
  import ToastHost from "./components/ui/Toast.svelte";
  import Topbar from "./components/ui/Topbar.svelte";
  import Landing from "$landing"; // the whole public site, or a stub
  import AboutView from "./components/AboutView.svelte";
  import SettingsView from "./components/SettingsView.svelte";
  import ConvertView from "./components/ConvertView.svelte";
  import PalangView from "./components/PalangView.svelte";
  import MergeView from "./components/MergeView.svelte";
  import { app, applyUpdate, checkForUpdate, dismissUpdate } from "./lib/store.svelte.js";
  import { loadLimits } from "./lib/config.js";
  import { t } from "./lib/i18n.js";
  import { route, goto, subscribe } from "./lib/router.js";

  const TOOLS = [
    { id: "convert", label: () => t("convertLabel"), icon: "convert" },
    { id: "palang", label: () => t("palang"), icon: "palang" },
    { id: "merge", label: () => t("mergeLabel"), icon: "merge" },
    { id: "about", label: () => t("about"), icon: "info" },
    { id: "settings", label: () => t("settings"), icon: "sliders" },
  ];

  const HAS_LANDING = import.meta.env.MODE !== "app";

  /** Site routes (served in site builds only) → view name. */
  const SITE_ROUTES = { "": "home", install: "install", privacy: "privacy", docs: "docs" };
  const SITE_VIEWS = new Set(["home", "install", "privacy", "feature", "docs"]);
  const APP_ROUTES = new Set(TOOLS.map((x) => x.id));

  let current = $state(route());

  const isFeature = $derived(current.startsWith("features/"));
  const featureId = $derived(isFeature ? current.slice("features/".length) || "convert" : "convert");

  const view = $derived(
    isFeature
      ? HAS_LANDING
        ? "feature"
        : "convert"
      : HAS_LANDING
        ? SITE_ROUTES[current] ?? "home"
        : APP_ROUTES.has(current)
          ? current
          : "convert",
  );

  const isSiteView = $derived(SITE_VIEWS.has(view));

  // Canonicalise the URL: an unknown path, or a tool route on the site build,
  // resolves to the right default without a reload.
  $effect(() => {
    if (HAS_LANDING && !isSiteView) goto("", { replace: true });
    else if (!HAS_LANDING && isSiteView) goto("convert", { replace: true });
  });

  $effect(() => {
    app.view = view;
  });

  $effect(() => {
    document.documentElement.dataset.theme = app.theme;
    document.documentElement.lang = app.lang;
  });

  // Operator flag: limits.json on the host overrides the compiled caps.
  void loadLimits();

  onMount(() => {
    const off = subscribe((r) => (current = r));
    void checkForUpdate();
    const onShow = () => void checkForUpdate();
    document.addEventListener("visibilitychange", onShow);
    return () => {
      off();
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

  {#if isSiteView}
    <Landing page={view} feature={featureId} />
  {:else}
    <Topbar context="app" homeTo={null} />

    <div class="app-main">
      <aside class="side">
        <div class="side-label">{t("menu")}</div>
        <nav aria-label={t("menu")}>
          {#each TOOLS as tool (tool.id)}
            <button
              type="button"
              class="tool"
              class:active={view === tool.id}
              onclick={() => goto(tool.id)}
            >
              <ToolIcon name={tool.icon} size={19} />
              {tool.label()}
            </button>
          {/each}
        </nav>
      </aside>

      <main class="app-body">
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
      </main>
    </div>
  {/if}
</div>

{#if !isSiteView}
  <nav class="tabs tabs-bottom" aria-label={t("menu")}>
    {#each TOOLS as tool (tool.id)}
      <button
        type="button"
        class="tabbtn"
        class:active={view === tool.id}
        aria-current={view === tool.id ? "page" : undefined}
        onclick={() => goto(tool.id)}
      >
        <ToolIcon name={tool.icon} size={20} />
        {tool.label()}
      </button>
    {/each}
  </nav>
{/if}

<ToastHost />
