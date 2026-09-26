/**
 * ONE save path for three shells.
 *
 * WHY: a blob-URL <a download> is silently DROPPED by the Android WebView —
 * no error, no file, so a user who just stamped a document cannot find it
 * anywhere. The same is true of an install-time sandbox on Windows. Each shell
 * therefore gets a real save:
 *
 *   Android (Capacitor)  write the bytes to the app's cache, then open the
 *                        system share sheet — permission-free and lets the user
 *                        put the file in Drive, Files, WhatsApp, anywhere.
 *   Windows (Tauri)      native Save-as dialog, then write to the chosen path.
 *   Browser              the plain anchor download (unchanged).
 *
 * The native modules are imported LAZILY, so the public site bundle never
 * carries them and a missing plugin degrades to the browser path instead of
 * breaking the download.
 *
 * Returns "saved" | "shared" | "downloaded" | "cancelled".
 */
const NATIVE = {
  capacitor: () => !!globalThis.Capacitor?.isNativePlatform?.(),
  tauri: () => typeof window !== "undefined" && "__TAURI_INTERNALS__" in window,
};

/** base64 in chunks: a 50 MB PDF through String.fromCharCode(...bytes) alone
 *  blows the call stack. */
function toBase64(bytes) {
  const chunk = 0x8000;
  let bin = "";
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

function anchorDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

async function saveViaCapacitor(blob, filename) {
  const { Filesystem, Directory } = await import("@capacitor/filesystem");
  const { Share } = await import("@capacitor/share");
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const file = await Filesystem.writeFile({
    path: filename,
    data: toBase64(bytes),
    directory: Directory.Cache,
    recursive: true,
  });
  await Share.share({ title: filename, url: file.uri });
  return "shared";
}

async function saveViaTauri(blob, filename) {
  const { save } = await import("@tauri-apps/plugin-dialog");
  const path = await save({
    defaultPath: filename,
    filters: [{ name: "PDF", extensions: ["pdf"] }],
  });
  if (!path) return "cancelled";
  const { writeFile } = await import("@tauri-apps/plugin-fs");
  await writeFile(path, new Uint8Array(await blob.arrayBuffer()));
  return "saved";
}

/** True inside the packaged EXE/APK (drives platform-specific copy). */
export function isNativeApp() {
  return NATIVE.tauri() || NATIVE.capacitor();
}

export async function saveDocument(blob, filename) {
  if (NATIVE.tauri()) {
    try {
      return await saveViaTauri(blob, filename);
    } catch (err) {
      console.warn("native save failed, falling back to a download:", err);
    }
  }
  if (NATIVE.capacitor()) {
    try {
      return await saveViaCapacitor(blob, filename);
    } catch (err) {
      console.warn("share failed, falling back to a download:", err);
    }
  }
  anchorDownload(blob, filename);
  return "downloaded";
}
