/**
 * Minimal i18n: the translations live in en.json / ms.json (one file per
 * language, so they are easy to edit and diff), read through a language
 * source bound by the store (see __bindLang). Templates read t() during
 * render, so reading the reactive lang through the getter keeps re-rendering
 * working on switch. Missing keys fall back to the English value, so a key
 * left untranslated never renders garbage.
 *
 * Deliberately imports NOTHING from the store: the store imports t() from
 * here for its toasts, so i18n must stay cycle-free (a store <-> i18n cycle
 * breaks in the bundled module order with "t is not defined" at boot).
 */
import en from "./en.json";
import ms from "./ms.json";

const DICT = { en, ms };

let langOf = () => "ms";

export function __bindLang(get) {
  langOf = get;
}

export function t(key, vars) {
  const table = DICT[langOf()] ?? DICT.en;
  let text = table[key] ?? DICT.en[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) text = text.replaceAll(`{${k}}`, String(v));
  }
  return text;
}

/** The language to switch to next (toggle button shows the target). */
export function nextLang() {
  // Must read the bound getter: i18n deliberately imports NOTHING from the
  // store (a store <-> i18n cycle breaks at boot). Reading `app` here was a
  // ReferenceError that killed the language toggle.
  return langOf() === "en" ? "ms" : "en";
}
