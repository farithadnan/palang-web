<script>
  /** Session tab: what was produced THIS run — counts plus recent outputs you
   *  can re-save. In memory only, so it is cleared when the app closes. */
  import { t } from "../../lib/i18n/index.js";
  import Icon from "../ui/Icon.svelte";
  import {
    app,
    humanSize,
    saveOutput,
    sendOutputTo,
    clearSession,
    flash,
  } from "../../lib/state/store.svelte.js";
  import { goto } from "../../lib/util/router.js";

  const MODES = [
    { id: "prepare", label: () => t("sessionPrepared") },
    { id: "convert", label: () => t("sessionConverted") },
    { id: "palang", label: () => t("sessionStamped") },
    { id: "merge", label: () => t("sessionMerged") },
  ];

  function fmtTime(ms) {
    const d = new Date(ms);
    const p = (n) => String(n).padStart(2, "0");
    return `${p(d.getDate())}/${p(d.getMonth() + 1)} · ${p(d.getHours())}:${p(d.getMinutes())}`;
  }

  function send(out, target) {
    if (!sendOutputTo(out, target)) return;
    flash("ok", t(target === "palang" ? "sentStamp" : "sentMerge"));
    goto(target);
  }
</script>

<section class="panel flat session">
  <h2>{t("sessionTitle")}</h2>
  <p class="sess-intro">{t("sessionIntro")}</p>

  <div class="sess-stats">
    {#each MODES as m (m.id)}
      <div class="sess-stat">
        <span class="sess-n">{app.session.counts[m.id] ?? 0}</span>
        <span class="sess-l">{m.label()}</span>
      </div>
    {/each}
  </div>

  <div class="sess-head">
    <h3 class="sess-group">{t("sessionOutputs")}</h3>
    {#if app.session.outputs.length}
      <button type="button" class="link" onclick={clearSession}>{t("sessionClear")}</button>
    {/if}
  </div>

  {#if app.session.outputs.length}
    <ul class="sess-list">
      {#each app.session.outputs as out (out.id)}
        <li>
          <span class="sess-icon" aria-hidden="true"><Icon name="file" size={18} /></span>
          <span class="sess-meta">
            <span class="sess-name" title={out.name}>{out.name}</span>
            <span class="sess-sub">{humanSize(out.size)} · {fmtTime(out.at)}</span>
          </span>
          <span class="sess-actions">
            <button
              type="button"
              class="iconbtn"
              aria-label={t("sendStamp")}
              title={t("sendStamp")}
              onclick={() => send(out, "palang")}
            >
              <Icon name="palang" size={18} />
            </button>
            <button
              type="button"
              class="iconbtn"
              aria-label={t("sendMerge")}
              title={t("sendMerge")}
              onclick={() => send(out, "merge")}
            >
              <Icon name="merge" size={18} />
            </button>
            <button type="button" class="btn btn-sm" onclick={() => saveOutput(out)}>
              {t("sessionResave")}
            </button>
          </span>
        </li>
      {/each}
    </ul>
  {:else}
    <p class="caption">{t("sessionEmpty")}</p>
  {/if}
</section>

<style>
  .sess-intro {
    margin: 0 0 1rem;
    font-size: var(--fs-note);
    color: var(--muted);
    line-height: 1.5;
  }
  .sess-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(5.5rem, 1fr));
    gap: 0.6rem;
    margin-bottom: 1.4rem;
  }
  .sess-stat {
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: 12px;
    padding: 0.8rem 0.6rem;
    text-align: center;
  }
  .sess-n { display: block; font-size: 1.5rem; font-weight: 700; }
  .sess-l { display: block; font-size: var(--fs-note); color: var(--muted); }
  .sess-head { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
  .sess-group {
    margin: 0;
    font-size: var(--fs-label);
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .sess-list {
    list-style: none;
    margin: 0.6rem 0 0;
    padding: 0;
    border-top: 1px solid var(--line);
  }
  .sess-list li {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    padding: 0.6rem 0;
    border-bottom: 1px solid var(--line);
  }
  .sess-icon { color: var(--muted); flex: none; display: inline-flex; }
  .sess-meta { flex: 1; min-width: 0; display: flex; flex-direction: column; }
  .sess-name { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
  .sess-sub { font-size: var(--fs-note); color: var(--muted); }
  .sess-actions { display: inline-flex; align-items: center; gap: 0.3rem; flex: none; }
</style>
