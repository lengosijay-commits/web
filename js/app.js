import { recordService } from "./data.js";

const STATUSES = ["Pending", "In progress", "Completed"];
const $ = id => document.getElementById(id);
const form = $("record-form"), body = $("record-body"), msg = $("message"), details = $("details");
let editingId = null;
let timer;

function showMessage(text, type) {
  msg.textContent = text;
  msg.className = "message " + type;
  msg.hidden = false;
  clearTimeout(timer);
  if (type === "success") timer = setTimeout(() => (msg.hidden = true), 4000);
}

function validate(r) {
  const title = r.title.trim(), category = r.category.trim(), description = r.description.trim();
  if (title.length < 3 || title.length > 80) return "Title must be 3 to 80 characters.";
  if (category.length < 2 || category.length > 40) return "Category must be 2 to 40 characters.";
  if (description.length < 5 || description.length > 300) return "Description must be 5 to 300 characters.";
  if (!STATUSES.includes(r.status)) return "Choose a valid status.";
  return "";
}

function cell(text) {
  const td = document.createElement("td");
  td.textContent = text;
  return td;
}

function actionButton(label, cls, handler) {
  const b = document.createElement("button");
  b.type = "button";
  b.textContent = label;
  if (cls) b.className = cls;
  b.addEventListener("click", handler);
  return b;
}

async function render() {
  const all = await recordService.list();
  const q = $("search").value.trim().toLowerCase();
  const status = $("filter").value;
  const shown = all.filter(r => r.title.toLowerCase().includes(q) && (!status || r.status === status));

  body.replaceChildren();
  $("count").textContent = `Showing ${shown.length} of ${all.length} records`;

  if (shown.length === 0) {
    const tr = document.createElement("tr");
    const td = cell(all.length === 0 ? "No records yet. Add your first request above." : "No records match your search or filter.");
    td.colSpan = 5;
    tr.append(td);
    body.append(tr);
    return;
  }

  for (const r of shown) {
    const tr = document.createElement("tr");
    const statusTd = document.createElement("td");
    const badge = document.createElement("span");
    badge.className = "badge " + (r.status === "In progress" ? "progress" : r.status.toLowerCase());
    badge.textContent = r.status;
    statusTd.append(badge);

    const actions = document.createElement("td");
    actions.className = "row-actions";
    actions.append(
      actionButton("View", "secondary", () => viewRecord(r.id)),
      actionButton("Edit", "secondary", () => startEdit(r.id)),
      actionButton("Delete", "danger", () => deleteRecord(r.id, r.title))
    );
    tr.append(cell(r.id), cell(r.title), cell(r.category), statusTd, actions);
    body.append(tr);
  }
}

async function viewRecord(id) {
  try {
    const r = await recordService.get(id);
    details.replaceChildren();
    const h = document.createElement("h3");
    h.textContent = `Request #${r.id}: ${r.title}`;
    details.append(h);
    for (const [label, value] of [["Category", r.category], ["Status", r.status], ["Description", r.description]]) {
      const p = document.createElement("p");
      const strong = document.createElement("strong");
      strong.textContent = label + ": ";
      p.append(strong, document.createTextNode(value));
      details.append(p);
    }
    details.append(actionButton("Close", "secondary", () => (details.hidden = true)));
    details.hidden = false;
    details.focus();
  } catch (e) {
    showMessage(e.message, "error");
  }
}

async function startEdit(id) {
  try {
    const r = await recordService.get(id);
    editingId = r.id;
    form.title.value = r.title;
    form.category.value = r.category;
    form.description.value = r.description;
    form.status.value = r.status;
    $("form-title").textContent = `Edit request #${r.id}`;
    $("save-btn").textContent = "Save changes";
    $("cancel-btn").hidden = false;
    form.scrollIntoView({ behavior: "smooth" });
    form.title.focus();
  } catch (e) {
    showMessage(e.message, "error");
  }
}

function resetForm() {
  editingId = null;
  form.reset();
  $("form-title").textContent = "Add a request";
  $("save-btn").textContent = "Add request";
  $("cancel-btn").hidden = true;
}

async function deleteRecord(id, title) {
  if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
  try {
    const result = await recordService.remove(id);
    if (editingId === id) resetForm();
    details.hidden = true;
    showMessage(result.message, "success");
    await render();
  } catch (e) {
    showMessage(e.message, "error");
  }
}

form.addEventListener("submit", async event => {
  event.preventDefault();
  const data = {
    title: form.title.value,
    category: form.category.value,
    description: form.description.value,
    status: form.status.value
  };
  const problem = validate(data);
  if (problem) return showMessage(problem, "error");
  try {
    if (editingId === null) {
      const created = await recordService.create(data);
      showMessage(`Request #${created.id} added.`, "success");
    } else {
      await recordService.update(editingId, data);
      showMessage(`Request #${editingId} updated.`, "success");
    }
    resetForm();
    await render();
  } catch (e) {
    showMessage(e.message, "error");
  }
});

$("cancel-btn").addEventListener("click", () => {
  resetForm();
  showMessage("Edit cancelled.", "success");
});
$("search").addEventListener("input", render);
$("filter").addEventListener("change", render);

render();
