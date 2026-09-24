<script>
  /** Shared top bar for the landing page AND the app shell — one uniform bar:
   *  brand (→ home), optional section links (landing, desktop), then the
   *  action cluster: Open app (landing) / Home (app), language, theme, and a
   *  collapsible menu on mobile that folds the links + the Open app button. */
  import { app, setLang, setTheme } from "../../lib/store.svelte.js";
  import { nextLang, t } from "../../lib/i18n.js";
  import Icon from "./Icon.svelte";

  let { context = "landing", children } = $props();
  let open = $state(false);

  function go(view) {
    location.hash = "#/" + view;
  }
  function goHome() {
    go("home");
  }
</script>

<header class="topbar">
  <div class="topbar-inner">
    <a class="brand" href="#/home" onclick={(e) => { e.preventDefault(); goHome(); }}>
      <span class="brand-mark" aria-hidden="true"></span>
      <b>Palang</b>
    </a>
    <nav class="tb-links" aria-label={t("menu")}>
      {@render children?.()}
    </nav>
    <div class="tb-actions">
      {#if context === "landing"}
        <button type="button" class="btn btn-sm btn-primary tb-open" onclick={() => go("convert")}>
          {t("openApp")}
        </button>
      {:else}
        <button type="button" class="btn btn-sm tb-home" onclick={goHome}>
          <Icon name="home" size={16} />
          <span>{t("home")}</span>
        </button>
      {/if}
      <button
        type="button"
        class="iconbtn tb-lang"
        aria-label={t("switchLang")}
        onclick={() => setLang(nextLang())}
      >
        {app.lang === "en" ? "BM" : "EN"}
      </button>
      <button
        type="button"
        class="iconbtn"
        aria-label={t("switchTheme")}
        onclick={() => setTheme(app.theme === "dark" ? "light" : "dark")}
      >
        <Icon name={app.theme === "dark" ? "sun" : "moon"} size={18} />
      </button>
      <button
        type="button"
        class="iconbtn tb-burger"
        aria-label={t("menu")}
        aria-expanded={open}
        onclick={() => (open = !open)}
      >
        <Icon name={open ? "x" : "menu"} size={20} />
      </button>
    </div>
  </div>
  {#if open}
    <div
      class="tb-menu"
      role="menu"
      tabindex="-1"
      onclick={() => (open = false)}
      onkeydown={(e) => { if (e.key === "Escape") open = false; }}
    >
      {@render children?.()}
      {#if context === "landing"}
        <button type="button" class="btn btn-primary tb-menu-cta" onclick={() => go("convert")}>
          {t("openApp")}
        </button>
      {/if}
    </div>
  {/if}
</header>
