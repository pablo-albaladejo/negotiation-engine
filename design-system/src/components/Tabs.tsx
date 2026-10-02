export interface TabItem {
  id: string;
  label: string;
}

export interface TabsProps {
  items: TabItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  /** Accessible name for the group (A10: this is a toggle group, not an ARIA tablist with tabpanels). */
  "aria-label"?: string;
}

export function Tabs({ items, selectedId, onSelect, "aria-label": ariaLabel }: TabsProps) {
  return (
    <div className="nr-tabs" role="group" {...(ariaLabel ? { "aria-label": ariaLabel } : {})}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className="nr-tab"
          aria-pressed={item.id === selectedId}
          onClick={() => onSelect(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
