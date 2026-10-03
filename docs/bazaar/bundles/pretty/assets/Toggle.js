import { i as i_1, n, t } from "./jsx-runtime.js";
import { r } from "./Button.js";
const i = i_1(n(), 1);
const a = t();
const o = {
  good: `bg-good`,
  gold: `bg-gold`,
  accent: `bg-accent`,
};
function SComponent({
  checked,
  onChange,
  label: label_1,
  description,
  disabled,
  size = `md`,
  tone = `good`,
  className,
}) {
  let f = i.useId();
  let p = size === `sm` ? `h-5 w-9` : `h-6 w-11`;
  let m = size === `sm` ? `size-4` : `size-5`;
  let h = size === `sm` ? `translate-x-4` : `translate-x-5`;
  return (
    <div
      className={r(
        `flex items-start gap-3`,
        disabled && `opacity-50`,
        className,
      )}
    >
      <button
        id={f}
        type={`button`}
        role={`switch`}
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={r(
          `relative inline-flex shrink-0 items-center rounded-full border border-transparent p-0.5 transition-colors duration-200`,
          p,
          checked ? o[tone] : `bg-line-strong`,
        )}
      >
        <span
          aria-hidden
          className={r(
            `rounded-full bg-ink shadow-[0_1px_4px_rgb(0_0_0/0.5)] transition-transform duration-200`,
            m,
            checked ? h : `translate-x-0`,
          )}
        />
      </button>
      {(label_1 || description) && (
        <label htmlFor={f} className={`min-w-0 cursor-pointer select-none`}>
          {label_1 && (
            <div className={`text-sm font-semibold text-ink`}>{label_1}</div>
          )}
          {description && (
            <div className={`text-xs text-muted`}>{description}</div>
          )}
        </label>
      )}
    </div>
  );
}
export { SComponent as t };
