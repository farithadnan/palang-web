/**
 * Read the chosen files from a file input, then reset it.
 *
 * THE SNAPSHOT IS THE POINT: `input.files` is a LIVE FileList. Clearing the
 * input's value synchronously (which we must do, so picking the same file again
 * still fires `change`) detaches the File objects in a WebView, and the caller
 * then adds nothing — reported as "can't upload any files" on Convert and Merge
 * simultaneously, because both fed the live list straight into the store.
 *
 * Also exported here: ACCEPT strings that carry MIME TYPES as well as
 * extensions. Android's file chooser maps `accept` onto an intent MIME filter;
 * an extension-only list can resolve to no filter at all, which shows a chooser
 * with nothing selectable.
 */
export const ACCEPT = {
  images: "image/jpeg,image/png,image/webp,image/bmp,image/tiff,image/gif,.jpg,.jpeg,.png,.webp,.bmp,.tif,.tiff",
  pdfAndImages:
    "application/pdf,image/jpeg,image/png,image/webp,image/bmp,image/tiff,image/gif,.pdf,.jpg,.jpeg,.png,.webp,.bmp,.tif,.tiff",
  pdf: "application/pdf,.pdf",
};

export function takeFiles(input) {
  const files = [...(input.files ?? [])];
  input.value = "";
  return files;
}
