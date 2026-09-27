<script>
  /** Developer guide (/docs). Same shape as the other site pages: ruled
   *  section headings, plain notes, and real code blocks with a copy button.
   *  The CI section is gone (a list of trivia), and the EXE/APK story is two
   *  rows instead of a run-on bullet list. */
  import Code from "./site/Code.svelte";
  import Icon from "./ui/Icon.svelte";
  import { t } from "../lib/i18n.js";
  import { GITHUB_URL } from "../lib/links.js";
  import { href } from "../lib/router.js";

  const VARIANTS = [
    { id: "site", dev: "npm run dev", build: "npm run build", what: () => t("docVarFull") },
    { id: "app", dev: "npm run dev:app", build: "npm run build:app", what: () => t("docVarApp") },
  ];

  const CLONE = `git clone https://github.com/farithadnan/palang-web
cd palang-web
npm install
npm run dev       # the public site
npm run dev:app   # the tools the EXE and APK run`;

  const DOCKER = `docker compose up --build`;

  const RELEASE = `npm version patch   # or minor / major
git push --follow-tags`;
</script>

<svelte:head>
  <title>{t("docTitle")} | Palang</title>
</svelte:head>

<article class="site-page docs">
  <a class="site-back" href={href("")}>← {t("backHome")}</a>
  <h1>{t("docTitle")}</h1>
  <p class="site-lede">{t("docLede")}</p>

  <h2 class="site-h2">{t("docRepos")}</h2>
  <ul class="site-rows">
    <li>
      <span class="site-row-main">
        <b>palang-web</b>
        <span>{t("docRepo")}</span>
      </span>
      <a class="iconbtn" href={GITHUB_URL} target="_blank" rel="noopener" aria-label="GitHub">
        <Icon name="github" size={20} />
      </a>
    </li>
  </ul>

  <h2 class="site-h2">{t("docDev")}</h2>
  <Code code={CLONE} label="sh" />

  <h2 class="site-h2">{t("docVariants")}</h2>
  <ul class="site-rows">
    {#each VARIANTS as v (v.id)}
      <li>
        <span class="site-row-main">
          <b><code>{v.id}</code></b>
          <span>{v.what()}</span>
        </span>
        <span class="cmd-chips">
          <code class="cmd-chip">{v.dev}</code>
          <code class="cmd-chip">{v.build}</code>
        </span>
      </li>
    {/each}
  </ul>

  <h2 class="site-h2">{t("docConfig")}</h2>
  <p class="site-note">{t("docConfigBody")}</p>
  <p class="site-note">{t("docLimits")}</p>

  <h2 class="site-h2">{t("docEngine")}</h2>
  <ul class="site-points">
    <li><Icon name="check" size={18} /> <span>{t("docEngineA")}</span></li>
    <li><Icon name="check" size={18} /> <span>{t("docEngineB")}</span></li>
    <li><Icon name="check" size={18} /> <span>{t("docEngineC")}</span></li>
  </ul>

  <h2 class="site-h2">{t("docDocker")}</h2>
  <p class="site-note">{t("docDockerBody")}</p>
  <Code code={DOCKER} label="sh" />
  <p class="site-note">{t("docDockerLimits")}</p>

  <h2 class="site-h2">{t("docHosting")}</h2>
  <p class="site-note">{t("docHostingBody")}</p>
  <p class="site-note">{t("docPublishingBody")}</p>

  <h2 class="site-h2">{t("docPackaging")}</h2>
  <p class="site-note">{t("docPackBody")}</p>
  <Code code={RELEASE} label="sh" />
  <ul class="site-rows">
    <li>
      <span class="site-row-main">
        <b>{t("docPackWin")}</b>
        <span>{t("docPackWinBody")}</span>
      </span>
    </li>
    <li>
      <span class="site-row-main">
        <b>{t("docPackApk")}</b>
        <span>{t("docPackApkBody")}</span>
      </span>
    </li>
  </ul>
  <p class="site-note">{t("docPackSign")}</p>
</article>

<style>
  .docs h1 { margin-bottom: 0.6rem; }
  .docs li { margin: 0; }
  .cmd-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
    justify-content: flex-end;
  }
  .cmd-chip {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 0.8125rem;
    color: var(--muted);
    background: color-mix(in srgb, var(--muted) 10%, transparent);
    border-radius: 8px;
    padding: 0.25rem 0.5rem;
    flex: 0 0 auto;
  }
</style>
