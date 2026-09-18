<script>
  /** Merge tab: combine PDFs into one, in a user-chosen order. */
  import FilePicker from "./ui/FilePicker.svelte";
  import OrderedList from "./ui/OrderedList.svelte";
  import { app, addPdfs, movePdf, removePdf } from "../lib/store.svelte.js";

  const items = $derived(
    app.pdfs.map((p, i) => ({
      id: p.id,
      label: p.file.name,
      sub: (p.file.size / 1024).toFixed(0) + " KB",
      first: i === 0,
      last: i === app.pdfs.length - 1,
    }))
  );
</script>

<h2>Merge PDFs</h2>
<p class="caption">Combine several PDFs into one, in the order you choose.</p>

<FilePicker
  id="merge-files"
  accept=".pdf"
  multiple
  label="PDFs to combine"
  hint="Choose the files, then use the up and down buttons to set the order."
  onPick={addPdfs}
/>

<OrderedList
  items={items}
  onMove={movePdf}
  onRemove={removePdf}
  empty="No PDFs chosen yet."
/>
