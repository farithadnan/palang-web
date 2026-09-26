<script>
  /** The site's outbound actions, as icon buttons (GitHub logo + report an
   *  issue). Shared by the pages that used to repeat the same two text links
   *  and a "MIT License · Palang" line that the footer already states. */
  import Icon from "../ui/Icon.svelte";
  import { t } from "../../lib/i18n.js";
  import { GITHUB_URL, ISSUES_URL } from "../../lib/links.js";
</script>

<div class="site-links">
  <a
    class="iconbtn"
    href={GITHUB_URL}
    target="_blank"
    rel="noopener"
    title="GitHub"
    aria-label={t("viewGitHub")}
  >
    <Icon name="github" size={20} />
  </a>
  <a
    class="iconbtn"
    href={ISSUES_URL}
    target="_blank"
    rel="noopener"
    title={t("privacyContact")}
    aria-label={t("privacyContact")}
  >
    <Icon name="bug" size={20} />
  </a>
</div>

<style>
  .site-links {
    display: flex;
    gap: 0.6rem;
    margin-top: 2.5rem;
  }
</style>
