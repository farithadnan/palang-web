<script>
  /** Code block for the site: monospace panel, a Copy button, and a light
   *  shell highlight (comments, flags, command). The site had plain <pre>
   *  text: unreadable, uncopyable. */
  import { t } from "../../lib/i18n.js";

  let { code = "", label = "" } = $props();

  let copied = $state(false);
  let preEl;

  /** Tokenise ONE line into {text, cls} pieces. Shell-ish: a leading # is a
   *  comment, -flags and the first word of a command are picked out. */
  function tokens(line) {
    const trimmed = line.trimStart();
    const indent = line.slice(0, line.length - trimmed.length);
    if (trimmed.startsWith("#")) return [{ text: line, cls: "c-comment" }];

    const out = [];
    if (indent) out.push({ text: indent, cls: "" });
    const words = trimmed.split(/(\s+)/);
    let first = true;
    for (const w of words) {
      if (/^\s+$/.test(w)) out.push({ text: w, cls: "" });
      else if (first) {
        out.push({ text: w, cls: "c-cmd" });
        first = false;
      } else if (w.startsWith("-")) out.push({ text: w, cls: "c-flag" });
      else out.push({ text: w, cls: "c-arg" });
    }
    return out;
  }

  const lines = $derived(String(code).replace(/\s+$/, "").split("\n"));

  async function copy() {
    const text = String(code).replace(/\s+$/, "");
    try {
      await navigator.clipboard.writeText(text);
      copied = true;
      setTimeout(() => (copied = false), 1600);
    } catch {
      // Clipboard blocked (older webview, no permission): select it instead so
      // the user can copy with the keyboard.
      const range = document.createRange();
      range.selectNodeContents(preEl);
      const sel = getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }
</script>

<div class="codeblock">
  <div class="cb-head">
    {#if label}<span class="cb-label">{label}</span>{:else}<span></span>{/if}
    <button type="button" class="cb-copy" onclick={copy} aria-live="polite">
      {copied ? t("codeCopied") : t("codeCopy")}
    </button>
  </div>
  <pre bind:this={preEl}><code>{#each lines as line, i (i)}{#each tokens(line) as tk, j (j)}<span class={tk.cls}>{tk.text}</span>{/each}{#if i < lines.length - 1}
{/if}{/each}</code></pre>
</div>

<style>
  .codeblock {
    margin: 0.4rem 0 2rem;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--panel);
    overflow: hidden;
  }
  .cb-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.4rem 0.5rem 0.4rem 0.9rem;
    border-bottom: 1px solid var(--line);
  }
  .cb-label { font-size: 0.8125rem; color: var(--muted); font-weight: 600; }
  .cb-copy {
    border: 1px solid var(--line);
    border-radius: 8px;
    background: transparent;
    color: var(--muted);
    font: inherit;
    font-size: 0.8125rem;
    font-weight: 600;
    padding: 0.15rem 0.6rem;
    cursor: pointer;
  }
  .cb-copy:hover { color: var(--text); border-color: var(--line-strong); }
  pre {
    margin: 0;
    padding: 0.9rem 1rem;
    overflow-x: auto;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 0.8125rem;
    line-height: 1.7;
    color: var(--text);
  }
  :global(.c-comment) { color: var(--muted); font-style: italic; }
  :global(.c-cmd) { color: var(--accent); font-weight: 600; }
  :global(.c-flag) { color: #b06f00; }
  [data-theme="dark"] :global(.c-flag) { color: #d8a657; }
  :global(.c-arg) { color: var(--text); }
</style>
