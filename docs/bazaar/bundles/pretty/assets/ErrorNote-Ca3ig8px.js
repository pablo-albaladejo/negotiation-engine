import { t } from "./jsx-runtime-CU3EbJiN.js";
import { i, r, t as R } from "./Button-DIaWEsZ9.js";
import { M, f as f_1, j, u as u_1 } from "./useEvents-BpJ5PfZT.js";
const c = {
  name: `rotate-cw`,
  size: 24,
  node: [
    [
      `path`,
      {
        d: `M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8`,
        key: `1p45f6`,
      },
    ],
    [
      `path`,
      {
        d: `M21 3v5h-5`,
        key: `1q7to0`,
      },
    ],
  ],
};
c.node;
const L = i(c);
const u = {
  name: `wifi-off`,
  size: 24,
  node: [
    [
      `path`,
      {
        d: `M12 20h.01`,
        key: `zekei9`,
      },
    ],
    [
      `path`,
      {
        d: `M8.5 16.429a5 5 0 0 1 7 0`,
        key: `1bycff`,
      },
    ],
    [
      `path`,
      {
        d: `M5 12.859a10 10 0 0 1 5.17-2.69`,
        key: `1dl1wf`,
      },
    ],
    [
      `path`,
      {
        d: `M19 12.859a10 10 0 0 0-2.007-1.523`,
        key: `4k23kn`,
      },
    ],
    [
      `path`,
      {
        d: `M2 8.82a15 15 0 0 1 4.177-2.643`,
        key: `1grhjp`,
      },
    ],
    [
      `path`,
      {
        d: `M22 8.82a15 15 0 0 0-11.288-3.764`,
        key: `z3jwby`,
      },
    ],
    [
      `path`,
      {
        d: `m2 2 20 20`,
        key: `1ooewy`,
      },
    ],
  ],
};
u.node;
const d = i(u);
const f = t();
function PComponent({ error, onRetry, title, className }) {
  if (!error) {
    return null;
  }
  let p = u_1(error);
  let m = [`bad_token`, `no_token`].includes(p.error);
  let h = p.error === `network`;
  let g = m ? M : h ? d : j;
  return (
    <div
      role={`alert`}
      className={r(
        `flex items-start gap-3 rounded-xl border border-accent/35 bg-accent/8 px-4 py-3 text-sm`,
        className,
      )}
    >
      {f.jsx(g, {
        className: `mt-0.5 size-4 shrink-0 text-accent`,
        "aria-hidden": true,
      })}
      <div className={`min-w-0 flex-1`}>
        <div className={`font-semibold text-ink`}>
          {title ??
            (m
              ? `Admin token needed`
              : h
                ? `Server unreachable`
                : `Request failed`)}
        </div>
        <div className={`mt-0.5 break-words text-muted`}>
          <code
            className={`mr-1.5 rounded bg-base/70 px-1.5 py-0.5 text-[11px] text-accent`}
          >
            {p.error}
          </code>
          {p.message}
        </div>
      </div>
      {m ? (
        <R
          size={`sm`}
          variant={`secondary`}
          onClick={() => f_1(p.error === `no_token` ? `missing` : `rejected`)}
        >{`Enter token`}</R>
      ) : (
        onRetry && (
          <R
            size={`sm`}
            variant={`ghost`}
            icon=<L className={`size-3.5`} />
            onClick={onRetry}
          >{`Retry`}</R>
        )
      )}
    </div>
  );
}
export { L as n, PComponent as t };
