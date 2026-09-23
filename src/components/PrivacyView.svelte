<script>
  /** Privacy: plain-language statement of how uploaded documents are handled. */
  import { setView } from "../lib/store.svelte.js";
</script>

<h2>How we handle your files</h2>
<p class="caption">Short version: your document is processed and deleted right after. We do not keep it, read it, or share it.</p>

<button type="button" class="btn" onclick={() => setView("convert")}>← Back to the tools</button>

<div class="divider"></div>

<h3>What happens when you press Generate</h3>
<ul class="prose">
  <li>Your files are uploaded to this server for processing.</li>
  <li>The server converts, merges and stamps them, and sends the finished PDF back to your browser.</li>
  <li>The uploaded files are deleted the moment the request finishes — every time, even if something goes wrong. Nothing is stored between visits.</li>
</ul>

<h3>What we do not do</h3>
<ul class="prose">
  <li>No accounts, no sign-ins, no tracking of who uploads what.</li>
  <li>We do not read, log, or analyse the content of your documents.</li>
  <li>We do not share uploads with anyone. There is no third-party processing.</li>
  <li>We do not sell anything — this is an open source project (MIT).</li>
</ul>

<h3>Running it yourself</h3>
<p class="prose" style="margin-top:0.4rem">
  Because the whole service is open source, you can run it on your own machine or server
  (Docker included) — then nothing leaves your device at all.
</p>
<ul class="prose">
  <li>Core engine + API: <a href="https://github.com/farithadnan/palang" target="_blank" rel="noopener">github.com/farithadnan/palang</a></li>
  <li>Web app: <a href="https://github.com/farithadnan/palang-web" target="_blank" rel="noopener">github.com/farithadnan/palang-web</a></li>
</ul>

<h3>Contact</h3>
<p class="prose" style="margin-top:0.4rem">
  Questions about this page: <a href="mailto:dev@farithadnan.net">dev@farithadnan.net</a>
</p>
