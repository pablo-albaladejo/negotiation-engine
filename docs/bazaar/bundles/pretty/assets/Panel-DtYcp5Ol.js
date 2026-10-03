import { t } from "./jsx-runtime-CU3EbJiN.js";
import { r as r_1 } from "./Button-DIaWEsZ9.js";
import { d as N } from "./index-B_RfsMCE.js";
const r = t();
const i = {
  default: `bg-panel border-line shadow-[var(--shadow-panel)]`,
  raised: `bg-raised border-line-strong shadow-[var(--shadow-lift)]`,
  inset: `bg-base/70 border-line shadow-[inset_0_2px_12px_rgb(0_0_0/0.35)]`,
  ghost: `bg-transparent border-line`,
};
function AComponent({
  title,
  subtitle,
  eyebrow,
  actions,
  tone = `default`,
  padded = true,
  live,
  className,
  bodyClassName,
  children,
  ...rest
}) {
  let h = title || subtitle || eyebrow || actions;
  return (
    <section
      className={r_1(`rounded-[var(--radius-card)] border`, i[tone], className)}
      {...rest}
    >
      {h && (
        <header
          className={r_1(
            `flex items-start justify-between gap-3`,
            padded ? `px-5 pt-4` : `px-4 pt-3`,
            !children && `pb-4`,
          )}
        >
          <div className={`min-w-0`}>
            {eyebrow && <div className={`eyebrow mb-1`}>{eyebrow}</div>}
            {title && (
              <h3 className={`flex items-center gap-2 text-lg text-ink`}>
                {live && <N />}
                <span className={`truncate`}>{title}</span>
              </h3>
            )}
            {subtitle && (
              <p className={`mt-0.5 text-xs text-muted`}>{subtitle}</p>
            )}
          </div>
          {actions && (
            <div className={`flex shrink-0 items-center gap-2`}>{actions}</div>
          )}
        </header>
      )}
      {children != null && (
        <div
          className={r_1(
            padded ? (h ? `px-5 pb-5 pt-3` : `p-5`) : ``,
            bodyClassName,
          )}
        >
          {children}
        </div>
      )}
    </section>
  );
}
export { AComponent as t };
