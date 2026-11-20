const KEY = "maintenance-demo-v1";

const SEED = [
  { id: 1, title: "Broken classroom light", category: "Electrical", description: "The light in Room B12 does not switch on.", status: "Pending" },
  { id: 2, title: "Leaking tap in washroom", category: "Plumbing", description: "The tap in the ground floor washroom drips all day.", status: "In progress" },
  { id: 3, title: "Broken lecture chair", category: "Furniture", description: "Chair in Lecture Hall 2 has a cracked leg.", status: "Pending" },
  { id: 4, title: "Flickering corridor lamp", category: "Electrical", description: "The lamp outside the library flickers at night.", status: "Completed" },
  { id: 5, title: "Blocked sink in lab", category: "Plumbing", description: "Sink in Chemistry Lab 1 drains very slowly.", status: "In progress" },
  { id: 6, title: "Damaged desk surface", category: "Furniture", description: "Desk 14 in Room A3 has a loose, splintered top.", status: "Pending" },
  { id: 7, title: "Socket not working", category: "Electrical", description: "Wall socket near the projector gives no power.", status: "Completed" },
  { id: 8, title: "Burst pipe near hostel", category: "Plumbing", description: "Water is leaking from a pipe beside Hostel Block C.", status: "Pending" }
];

function load() {
  const saved = localStorage.getItem(KEY);
  if (saved === null) {
    localStorage.setItem(KEY, JSON.stringify(SEED));
    return structuredClone(SEED);
  }
  try {
    const data = JSON.parse(saved);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function save(records) {
  localStorage.setItem(KEY, JSON.stringify(records));
}

function clean(r) {
  return {
    title: String(r.title).trim(),
    category: String(r.category).trim(),
    description: String(r.description).trim(),
    status: r.status
  };
}

export const recordService = {
  async list() {
    return load();
  },
  async get(id) {
    const record = load().find(r => r.id === Number(id));
    if (!record) throw new Error("Record not found.");
    return record;
  },
  async create(record) {
    const records = load();
    const id = records.reduce((max, r) => Math.max(max, r.id), 0) + 1;
    const created = { id, ...clean(record) };
    records.push(created);
    save(records);
    return created;
  },
  async update(id, record) {
    const records = load();
    const index = records.findIndex(r => r.id === Number(id));
    if (index === -1) throw new Error("Record not found.");
    records[index] = { id: records[index].id, ...clean(record) };
    save(records);
    return records[index];
  },
  async remove(id) {
    const records = load();
    const index = records.findIndex(r => r.id === Number(id));
    if (index === -1) throw new Error("Record not found.");
    records.splice(index, 1);
    save(records);
    return { message: "Record deleted." };
  }
};
