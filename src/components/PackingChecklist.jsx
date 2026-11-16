import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Plus,
  Trash2,
} from "lucide-react";
import useLocalStorage from "../hooks/useLocalStorage";
import {
  addNode,
  applyTemplate,
  countLeaves,
  removeNode,
  templates,
  toggleNode,
} from "../utils/checklist";
import { KEYS } from "../utils/tripData";

export function ProgressBar({ done, total, label }) {
  const percent = total ? Math.round((done / total) * 100) : 0;

  return (
    <div className="check-progress">
      <div
        className="progress-track"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
      >
        <div className="progress-fill" style={{ width: `${percent}%` }} />
      </div>
      <span>{percent}%</span>
    </div>
  );
}

function ChecklistNode({ node, depth, onToggle, onAdd, onDelete }) {
  const [open, setOpen] = useState(true);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");

  const children = node.children ?? [];
  const hasChildren = children.length > 0;
  const progress = countLeaves([node]);

  const submit = (event) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    onAdd(node.id, text);
    setDraft("");
    setOpen(true);
  };

  const remove = () => {
    if (hasChildren && !window.confirm(`Delete "${node.text}" and its sub-items?`)) {
      return;
    }
    onDelete(node.id);
  };

  return (
    <li className="check-node">
      <div className="check-row">
        {hasChildren ? (
          <button
            type="button"
            className="check-icon-button"
            aria-label={open ? `Collapse ${node.text}` : `Expand ${node.text}`}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        ) : (
          <span className="check-spacer" />
        )}

        <label className={`check-label ${node.done ? "done" : ""}`}>
          <input
            type="checkbox"
            checked={node.done}
            ref={(element) => {
              if (element) {
                element.indeterminate =
                  hasChildren && !node.done && progress.done > 0;
              }
            }}
            onChange={() => onToggle(node.id)}
          />
          <span>{node.text}</span>
        </label>

        {hasChildren && (
          <span className="check-count">
            {progress.done}/{progress.total}
          </span>
        )}

        {depth < 2 && (
          <button
            type="button"
            className="check-icon-button"
            aria-label={`Add sub-item to ${node.text}`}
            onClick={() => setAdding((value) => !value)}
          >
            <Plus size={16} />
          </button>
        )}

        <button
          type="button"
          className="check-icon-button danger"
          aria-label={`Delete ${node.text}`}
          onClick={remove}
        >
          <Trash2 size={16} />
        </button>
      </div>

      {depth === 0 && hasChildren && (
        <ProgressBar
          done={progress.done}
          total={progress.total}
          label={`${node.text} progress`}
        />
      )}

      {adding && (
        <form className="check-add-inline" onSubmit={submit}>
          <input
            autoFocus
            value={draft}
            maxLength={120}
            placeholder="Sub-item name"
            aria-label={`New sub-item for ${node.text}`}
            onChange={(event) => setDraft(event.target.value)}
          />
          <button type="submit" className="check-small-button">
            Add
          </button>
        </form>
      )}

      {hasChildren && open && (
        <ul className="check-children">
          {children.map((child) => (
            <ChecklistNode
              key={child.id}
              node={child}
              depth={depth + 1}
              onToggle={onToggle}
              onAdd={onAdd}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function PackingChecklist() {
  const [items, setItems] = useLocalStorage(KEYS.checklist, []);
  const [draft, setDraft] = useState("");

  const overall = countLeaves(items);

  const addTopLevel = (event) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setItems((current) => addNode(current, null, text));
    setDraft("");
  };

  const clearAll = () => {
    if (window.confirm("Remove every item from the packing list?")) {
      setItems([]);
    }
  };

  return (
    <section className="checklist-section">
      <div className="section-heading">
        <div>
          <span className="section-label">GET READY</span>
          <h2>Packing checklist</h2>
        </div>
      </div>

      <div className="budget-panel">
        <div className="check-templates">
          <strong>Start from a template</strong>
          <div className="check-template-buttons">
            {templates.map((template) => (
              <button
                key={template.id}
                type="button"
                className="check-small-button outline"
                onClick={() =>
                  setItems((current) => applyTemplate(current, template))
                }
              >
                {template.name}
              </button>
            ))}
          </div>
        </div>

        {items.length > 0 && (
          <div className="check-overall">
            <div className="check-overall-heading">
              <strong>Overall progress</strong>
              <span>
                {overall.done} of {overall.total} packed
              </span>
            </div>
            <ProgressBar
              done={overall.done}
              total={overall.total}
              label="Overall packing progress"
            />
          </div>
        )}

        <form className="check-add" onSubmit={addTopLevel}>
          <input
            value={draft}
            maxLength={120}
            placeholder="Add an item or a group (for example: Medicines)"
            aria-label="New checklist item"
            onChange={(event) => setDraft(event.target.value)}
          />
          <button type="submit" className="check-small-button">
            <Plus size={15} /> Add
          </button>
        </form>

        {items.length === 0 ? (
          <div className="empty-state">
            <ClipboardList size={30} />
            <strong>Your packing list is empty</strong>
            <p>
              Pick a template above or add your first item. Use the + button on
              an item to nest sub-items under it.
            </p>
          </div>
        ) : (
          <>
            <ul className="check-list">
              {items.map((node) => (
                <ChecklistNode
                  key={node.id}
                  node={node}
                  depth={0}
                  onToggle={(id) => setItems((current) => toggleNode(current, id))}
                  onAdd={(parentId, text) =>
                    setItems((current) => addNode(current, parentId, text))
                  }
                  onDelete={(id) =>
                    setItems((current) => removeNode(current, id))
                  }
                />
              ))}
            </ul>

            <button type="button" className="check-clear" onClick={clearAll}>
              Clear list
            </button>
          </>
        )}
      </div>
    </section>
  );
}
