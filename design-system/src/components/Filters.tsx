export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterCheckbox {
  key: string;
  label: string;
  checked: boolean;
}

export interface FiltersProps {
  rivalOptions: FilterOption[];
  rival: string;
  onRivalChange: (value: string) => void;
  roleOptions: FilterOption[];
  role: string;
  onRoleChange: (value: string) => void;
  resultOptions: FilterOption[];
  result: string;
  onResultChange: (value: string) => void;
  checkboxes: FilterCheckbox[];
  onCheckboxChange: (key: string, checked: boolean) => void;
}

export function Filters({
  rivalOptions,
  rival,
  onRivalChange,
  roleOptions,
  role,
  onRoleChange,
  resultOptions,
  result,
  onResultChange,
  checkboxes,
  onCheckboxChange,
}: FiltersProps) {
  return (
    <div className="nr-filters">
      <label className="nr-filter-field">
        <span className="nr-muted nr-filter-label">Opponent</span>
        <select
          className="nr-filter-select"
          value={rival}
          onChange={(event) => onRivalChange(event.target.value)}
        >
          {rivalOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <div className="nr-filter-field">
        <span className="nr-muted nr-filter-label">Role</span>
        <div className="nr-tabs" role="group" aria-label="Role">
          {roleOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className="nr-tab"
              aria-pressed={option.value === role}
              onClick={() => onRoleChange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <div className="nr-filter-field">
        <span className="nr-muted nr-filter-label">Outcome</span>
        <div className="nr-tabs" role="group" aria-label="Outcome">
          {resultOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className="nr-tab"
              aria-pressed={option.value === result}
              onClick={() => onResultChange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <div className="nr-filter-checkboxes">
        {checkboxes.map((checkbox) => (
          <label key={checkbox.key} className="nr-filter-checkbox">
            <input
              type="checkbox"
              checked={checkbox.checked}
              onChange={(event) => onCheckboxChange(checkbox.key, event.target.checked)}
            />
            {checkbox.label}
          </label>
        ))}
      </div>
    </div>
  );
}
