<script>
  /** App shell: shared top bar (home <-> app, language, theme), sidebar
   *  (desktop) / tabs (mobile), view switching with hash routes, toast,
   *  consent and footer. The landing page owns the home view; the privacy
   *  section lives on the landing (single source, no separate view). */
  import { onMount } from "svelte";
  import Icon from "./components/ui/Icon.svelte";
  import Topbar from "./components/ui/Topbar.svelte";
  import Landing from "./components/Landing.svelte";
  import ConvertView from "./components/ConvertView.svelte";
  import PalangView from "./components/PalangView.svelte";
  import MergeView from "./components/MergeView.svelte";
  import { app, applyUpdate, checkForUpdate, dismissUpdate, setConsent } from "./lib/store.svelte.js";
  import { installNetworkLog } from "./lib/network-log.js";
  import { t } from "./lib/i18n.js";

  const TOOLS = [
    { id: "convert", label: () => t("convert"), icon: "convert" },
    { id: "palang", label: () => t("palang"), icon: "palang" },
    { id: "merge", label: () => t("merge"), icon: "merge" },
  ];
  const HASH_TO_VIEW = {
    "": "home",
    home: "home",
    convert: "convert",
    palang: "palang",
    merge: "merge",
    // The standalone privacy view was folded into the landing section.
    privacy: "home",
  };

  function readHash() {
    const hash = (typeof location !== "undefined" ? location.hash : "").replace(/^#\/?/, "");
    return HASH_TO_VIEW[hash] ?? "home";
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

  function goHomePrivacy() {
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
  <Topbar context="app" />

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
        <div class="sidegroup">
          <button type="button" class="sidefoot" onclick={goHomePrivacy}>
            <Icon name="shield" size={17} />
            {t("privacy")}
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
            {tool.label()}
          </button>
        {/each}
      </div>

      {#if !app.consented}
        <section class="consent">
          <p>
            <strong>{t("consentBefore")}</strong> {t("consentBody")}{" "}
            <button type="button" class="link" onclick={goHomePrivacy}>
              {t("privacy")}
            </button>
          </p>
          <label class="checkline">
            <input type="checkbox" onchange={(e) => setConsent(e.currentTarget.checked)} />
            <span>{t("consentAgree")}</span>
          </label>
        </section>
      {/if}

      {#if view === "convert"}
        <ConvertView />
      {:else if view === "palang"}
        <PalangView />
      {:else if view === "merge"}
        <MergeView />
      {/if}
    </div>
  </div>

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
      <a class="link" href="https://github.com/farithadnan/palang" target="_blank" rel="noopener">{t("coreEngine")}</a>
      <span class="footdot">·</span>
      <a class="link" href="https://github.com/farithadnan/palang-web" target="_blank" rel="noopener">{t("webApp")}</a>
    </div>
  </footer>
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

{#if netOpen}
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
