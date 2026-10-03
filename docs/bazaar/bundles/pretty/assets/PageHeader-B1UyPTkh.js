import { t } from "./jsx-runtime-CU3EbJiN.js";
import { r } from "./Button-DIaWEsZ9.js";
const n = t();
function RComponent({ title, eyebrow, subtitle, actions, className }) {
  return (
    <header
      className={r(
        `mb-6 flex flex-wrap items-end justify-between gap-4`,
        className,
      )}
    >
      <div className={`min-w-0`}>
        {eyebrow && (
          <div className={`eyebrow mb-1.5 text-gold/90`}>{eyebrow}</div>
        )}
        <h1 className={`text-4xl text-ink md:text-5xl`}>{title}</h1>
        {subtitle && (
          <p className={`mt-2 max-w-2xl text-sm text-muted`}>{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className={`flex flex-wrap items-center gap-2`}>{actions}</div>
      )}
    </header>
  );
}
export { RComponent as t };
