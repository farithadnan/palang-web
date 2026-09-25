<script>
  /** Developer guide — a dedicated page (full-site builds only, route #/docs).
   *  Everything a developer needs: repos, local dev, build variants, config,
   *  Docker, static hosting, and the EXE/APK publishing pipeline. */
  import { t } from "../lib/i18n.js";

  const REPOS = [
    {
      name: "palang-web",
      url: "https://github.com/farithadnan/palang-web",
      role: () => t("docRepo"),
    },
  ];

  const VARIANTS = [
    { id: "full", cmd: "npm run build", what: () => t("docVarFull") },
    { id: "app", cmd: "npm run build:app", what: () => t("docVarApp") },
  ];
</script>

<section class="panel docs" style="max-width: 46rem">
  <h2>{t("docTitle")}</h2>

  <h3>{t("docRepos")}</h3>
  <ul>
    {#each REPOS as r (r.name)}
      <li>
        <a class="link" href={r.url} target="_blank" rel="noopener">{r.name}</a>
        — {r.role()}
      </li>
    {/each}
  </ul>

  <h3>{t("docDev")}</h3>
  <pre class="ld-code">git clone https://github.com/farithadnan/palang-web
cd palang-web
npm install
npm run dev            # local editor, in-browser engine, no server needed</pre>

  <h3>{t("docVariants")}</h3>
  <table class="ld-table">
    <thead><tr><th></th><th>{t("docRun")}</th><th>{t("docShips")}</th></tr></thead>
    <tbody>
      {#each VARIANTS as v (v.id)}
        <tr>
          <td><code>{v.id}</code></td>
          <td><code>{v.cmd}</code></td>
          <td>{v.what()}</td>
        </tr>
      {/each}
    </tbody>
  </table>

  <h3>{t("docConfig")}</h3>
  <p>{t("docConfigBody")}</p>
  <pre class="ld-code"># .env.local — personal / environment overrides (never committed)
VITE_HOST_URL=https://staging.example.com</pre>
  <p>{t("docMode")}</p>
  <p>{t("docLimits")}</p>

  <h3>{t("docEngine")}</h3>
  <ul>
    <li>{t("docEngineA")}</li>
    <li>{t("docEngineB")}</li>
    <li>{t("docEngineC")}</li>
  </ul>

  <h3>{t("docDocker")}</h3>
  <p>{t("docDockerBody")}</p>
  <pre class="ld-code">cd palang-web
docker compose up --build   # app + engine on http://localhost:8000</pre>
  <p>{t("docDockerLimits")}</p>

  <h3>{t("docHosting")}</h3>
  <p>{t("docHostingBody")}</p>

  <h3>{t("docPackaging")}</h3>
  <p>{t("docPackBody")}</p>
  <pre class="ld-code">git tag v0.2.8 && git push --tags</pre>
  <ul>
    <li>{t("docPackExe")}</li>
    <li>{t("docPackApk")}</li>
  </ul>
  <p>{t("docPlaySign")}</p>

  <h3>{t("docCi")}</h3>
  <p>{t("docCiBody")}</p>
</section>

<style>
  .docs h3 { margin-top: 2rem; }
  .docs li { margin: 0.3rem 0; }
  .ld-table { border-collapse: collapse; width: 100%; margin: 0.6rem 0; }
  .ld-table th, .ld-table td { border: 1px solid var(--border, #555); padding: 0.45rem 0.6rem; text-align: left; }
  .ld-code { overflow-x: auto; }
</style>
