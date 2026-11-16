export const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

export const makeItem = (text, children = []) => ({
  id: uid(),
  text,
  done: false,
  children,
});

// A parent is done only when every child is done.
export function normalize(items) {
  return items.map((node) => {
    const children = normalize(node.children ?? []);
    const done = children.length
      ? children.every((child) => child.done)
      : Boolean(node.done);
    return { ...node, children, done };
  });
}

export function updateNode(items, id, change) {
  return items.map((node) =>
    node.id === id
      ? change(node)
      : { ...node, children: updateNode(node.children ?? [], id, change) }
  );
}

export function removeNode(items, id) {
  return items
    .filter((node) => node.id !== id)
    .map((node) => ({ ...node, children: removeNode(node.children ?? [], id) }));
}

function setDoneDeep(node, done) {
  return {
    ...node,
    done,
    children: (node.children ?? []).map((child) => setDoneDeep(child, done)),
  };
}

export const toggleNode = (items, id) =>
  normalize(updateNode(items, id, (node) => setDoneDeep(node, !node.done)));

export function addNode(items, parentId, text) {
  const item = makeItem(text);

  if (!parentId) return normalize([...items, item]);

  return normalize(
    updateNode(items, parentId, (node) => ({
      ...node,
      children: [...(node.children ?? []), item],
    }))
  );
}

// Progress is counted on the leaf items so groups do not count twice.
export function countLeaves(items) {
  let done = 0;
  let total = 0;

  const walk = (list) =>
    list.forEach((node) => {
      if (node.children?.length) {
        walk(node.children);
      } else {
        total += 1;
        if (node.done) done += 1;
      }
    });

  walk(items);
  return { done, total };
}

export const templates = [
  {
    id: "beach",
    name: "Beach getaway",
    groups: [
      { text: "Documents", items: ["ID / passport", "Booking confirmations", "Travel insurance"] },
      { text: "Clothing", items: ["Swimwear", "Light cotton clothes", "Sandals", "Hat and sunglasses"] },
      { text: "Toiletries", items: ["Sunscreen", "Toothbrush and paste", "After-sun lotion"] },
      { text: "Electronics", items: ["Phone charger", "Power bank", "Waterproof pouch"] },
    ],
  },
  {
    id: "mountain",
    name: "Mountain trek",
    groups: [
      { text: "Documents", items: ["ID / passport", "Permits", "Emergency contacts"] },
      { text: "Clothing", items: ["Thermal layers", "Waterproof jacket", "Trekking shoes", "Warm socks", "Gloves and cap"] },
      { text: "Gear", items: ["Backpack", "Water bottle", "Headlamp", "First-aid kit"] },
      { text: "Electronics", items: ["Phone charger", "Power bank"] },
    ],
  },
  {
    id: "city",
    name: "City break",
    groups: [
      { text: "Documents", items: ["ID / passport", "Tickets", "Hotel booking"] },
      { text: "Clothing", items: ["Comfortable walking shoes", "Day outfits", "Light jacket"] },
      { text: "Essentials", items: ["Daypack", "Reusable water bottle", "Cash and cards"] },
      { text: "Electronics", items: ["Phone charger", "Power bank", "Earphones"] },
    ],
  },
];

// Adds a template's groups. Groups that already exist are merged, so applying
// a template twice never creates duplicates.
export function applyTemplate(items, template) {
  let next = [...items];

  template.groups.forEach((group) => {
    const existing = next.find(
      (node) => node.text.toLowerCase() === group.text.toLowerCase()
    );

    if (existing) {
      const have = new Set(
        (existing.children ?? []).map((child) => child.text.toLowerCase())
      );
      const extra = group.items
        .filter((text) => !have.has(text.toLowerCase()))
        .map((text) => makeItem(text));

      next = next.map((node) =>
        node === existing
          ? { ...node, children: [...(node.children ?? []), ...extra] }
          : node
      );
    } else {
      next.push(makeItem(group.text, group.items.map((text) => makeItem(text))));
    }
  });

  return normalize(next);
}
