/* Data service: the only module that talks to the palang API. No UI. */

const API = (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) || "";

async function detail(res) {
  try {
    const body = await res.json();
    if (typeof body.detail === "string" && body.detail) return body.detail;
  } catch {
    /* keep the generic message */
  }
  return "Something went wrong. Please check your files and try again.";
}

export async function getJSON(path) {
  const res = await fetch(API + path);
  if (!res.ok) throw new Error(await detail(res));
  return res.json();
}

export async function postJSON(path, body) {
  const res = await fetch(API + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await detail(res));
  return res.json();
}

export async function del(path) {
  const res = await fetch(API + path, { method: "DELETE" });
  if (!res.ok) throw new Error(await detail(res));
  return res.json();
}

function formFrom(files, fields) {
  const fd = new FormData();
  for (const file of files) fd.append("files", file, file.name);
  if (fields) {
    for (const [key, value] of Object.entries(fields)) fd.append(key, value);
  }
  return fd;
}

/** POST files (+ form fields) to /api/process, returning the PDF blob. */
export async function upload(files, fields) {
  const res = await fetch(API + "/api/process", { method: "POST", body: formFrom(files, fields) });
  if (!res.ok) throw new Error(await detail(res));
  return res.blob();
}

/** POST files to /api/preview, returning rendered pages. */
export async function preview(files) {
  const res = await fetch(API + "/api/preview", { method: "POST", body: formFrom(files) });
  if (!res.ok) throw new Error(await detail(res));
  return res.json();
}
