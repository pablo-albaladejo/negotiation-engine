import { i as i_1, n, t } from "./jsx-runtime-CU3EbJiN.js";
import { r } from "./Button-DIaWEsZ9.js";
const i = i_1(n(), 1);
const a = t();
function OComponent({
  value,
  onChange,
  onCommit,
  min = 0,
  max = 100,
  step = 1,
  label: label_1,
  format = (e) => String(e),
  marks,
  color,
  disabled,
  hideValue,
  className,
}) {
  let g = i.useId();
  let _ = max > min ? ((value - min) / (max - min)) * 100 : 0;
  let v = (e) => onCommit?.(Number(e.currentTarget.value));
  return (
    <div className={r(`w-full`, className)}>
      {(label_1 || !hideValue) && (
        <div className={`mb-1 flex items-baseline justify-between gap-3`}>
          {label_1 ? (
            <label htmlFor={g} className={`eyebrow`}>
              {label_1}
            </label>
          ) : (
            <span />
          )}
          {!hideValue && (
            <span className={`font-display-num text-xl text-ink`}>
              {format(value)}
            </span>
          )}
        </div>
      )}
      <input
        id={g}
        type={`range`}
        className={`bz-range`}
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.currentTarget.value))}
        onPointerUp={v}
        onKeyUp={v}
        aria-valuetext={format(value)}
        style={{
          "--pct": `${_}%`,
          ...(color
            ? {
                "--fill": color,
              }
            : {}),
        }}
      />
      {marks && marks.length > 0 && (
        <div
          className={`relative mt-0.5 h-4 text-[10px] font-semibold text-faint`}
        >
          {marks.map((i) => {
            let c = max > min ? ((i - min) / (max - min)) * 100 : 0;
            return (
              <button
                key={i}
                type={`button`}
                disabled={disabled}
                onClick={() => {
                  onChange(i);
                  onCommit?.(i);
                }}
                className={r(
                  `absolute -translate-x-1/2 hover:text-ink`,
                  i === value && `text-gold`,
                )}
                style={{
                  left: `calc(${c}% + ${(0.5 - c / 100) * 20}px)`,
                }}
              >
                {format(i)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
export { OComponent as t };
