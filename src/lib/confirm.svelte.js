/* Promise-based confirm service: any action can `await ask({...})` and get a
 * boolean. ONE dialog is rendered by App (see ConfirmDialog.svelte), so the
 * app never stacks confirmations and every prompt looks the same. */

export const confirmState = $state({
  open: false,
  title: "",
  body: "",
  confirmLabel: "",
  cancelLabel: "",
  danger: false,
});

let resolver = null;

/** Show a confirmation. Resolves true when confirmed, false otherwise. */
export function ask({ title = "", body = "", confirmLabel = "", cancelLabel = "", danger = false } = {}) {
  resolver?.(false); // a second prompt supersedes an unanswered first one
  confirmState.open = true;
  confirmState.title = title;
  confirmState.body = body;
  confirmState.confirmLabel = confirmLabel;
  confirmState.cancelLabel = cancelLabel;
  confirmState.danger = danger;
  return new Promise((resolve) => {
    resolver = resolve;
  });
}

export function resolveConfirm(ok) {
  confirmState.open = false;
  const r = resolver;
  resolver = null;
  r?.(ok);
}
