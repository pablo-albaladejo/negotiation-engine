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
  /** "group" renders a div with role="group" and aria-pressed (default, backward compatible);
      "nav" renders a nav element with aria-current="page" on the selected item. */
  variant?: "group" | "nav";
}

export function Tabs({ items, selectedId, onSelect, "aria-label": ariaLabel, variant = "group" }: TabsProps) {
  if (variant === "nav") {
    return (
      <nav className="nr-tabs" {...(ariaLabel ? { "aria-label": ariaLabel } : {})}>
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className="nr-tab"
            aria-current={item.id === selectedId ? "page" : undefined}
            onClick={() => onSelect(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>
    );
  }

  // default "group" variant
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
