import { t } from "./jsx-runtime.js";
import { r as r_1 } from "./Button.js";
import { t as N } from "./bot.js";
import { n as R, t as I } from "./shield-alert.js";
import { t as A } from "./gift.js";
import { j as O1 } from "./useEvents.js";
import { t as S1 } from "./lightbulb.js";
import { E, j as L, v, y } from "./index.js";
const f = t();
function PComponent({
  side,
  who,
  avatar,
  text,
  meta,
  children,
  tone = side === `left` ? `persona` : `team`,
  className,
}) {
  return (
    <div
      className={r_1(
        `flex gap-2.5`,
        side === `right` && `flex-row-reverse`,
        className,
      )}
    >
      <div className={`mt-0.5 shrink-0`}>{avatar}</div>
      <div
        className={r_1(
          `flex min-w-0 max-w-[88%] flex-col gap-1.5`,
          side === `right` && `items-end`,
        )}
      >
        <div
          className={r_1(
            `flex items-baseline gap-2 text-[11px]`,
            side === `right` && `flex-row-reverse`,
          )}
        >
          <span className={`font-semibold text-ink/90`}>{who}</span>
          {meta && <span className={`font-mono text-faint`}>{meta}</span>}
        </div>
        <div
          className={r_1(
            `whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed`,
            tone === `persona` &&
              `rounded-tl-md border border-line-strong bg-raised text-ink`,
            tone === `team` &&
              `rounded-tr-md border border-info/30 bg-info/12 text-ink`,
            tone === `system` && `border border-dashed border-line text-muted`,
          )}
        >
          {text || (
            <span
              className={`italic text-faint`}
            >{`(no words — structure only)`}</span>
          )}
        </div>
        {children && (
          <div
            className={r_1(
              `flex w-full flex-col gap-1.5`,
              side === `right` && `items-end`,
            )}
          >
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
const m = {
  greet: `border-gold/40 bg-gold/12 text-gold`,
  counter: `border-info/40 bg-info/12 text-info`,
  accept: `border-good/40 bg-good/12 text-good`,
  walk: `border-warn/40 bg-warn/12 text-warn`,
  refuse: `border-accent/40 bg-accent/12 text-accent`,
  cooloff: `border-accent/40 bg-accent/12 text-accent`,
  menu: `border-line-strong bg-raised text-ink`,
};
function HComponent({ action }) {
  return (
    <span
      className={r_1(
        `inline-flex h-5 items-center rounded-full border px-2 text-[10px] font-bold uppercase tracking-wider`,
        m[action] ?? m.menu,
      )}
    >
      {action}
    </span>
  );
}
function GComponent({ d, symbol }) {
  let { limit, open, target, price } = d;
  if (
    limit === undefined ||
    open === undefined ||
    limit === null ||
    open === null
  ) {
    return null;
  }
  let o = Math.min(limit, open, price ?? limit, target ?? limit);
  let s = Math.max(limit, open, price ?? open, target ?? open) - o || 1;
  let c = (e) => `${((e - o) / s) * 100}%`;
  let l = d.role !== `buyer`;
  return (
    <div className={`mt-1`}>
      <div className={`relative h-2 rounded-full bg-line`}>
        <div
          className={`absolute inset-y-0 rounded-full`}
          style={{
            left: c(Math.min(limit, open)),
            right: `${100 - ((Math.max(limit, open) - o) / s) * 100}%`,
            background: l
              ? `linear-gradient(90deg, rgb(255 90 95 / 0.55), rgb(255 196 77 / 0.55))`
              : `linear-gradient(90deg, rgb(255 196 77 / 0.55), rgb(255 90 95 / 0.55))`,
          }}
        />
        {target != null && (
          <span
            className={`absolute top-1/2 h-3.5 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded bg-ink/70`}
            style={{
              left: c(target),
            }}
            title={`target ${y(target, 1)}`}
          />
        )}
        {price != null && (
          <span
            className={`absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-panel bg-gold`}
            style={{
              left: c(price),
            }}
            title={`price ${price}`}
          />
        )}
      </div>
      <div
        className={`mt-1 flex justify-between font-mono text-[10px] text-faint`}
      >
        <span>
          {l ? `floor` : `open`}
          {` `}
          {v(l ? limit : open, {
            symbol,
            decimals: 1,
          })}
        </span>
        <span>
          {l ? `open` : `ceiling`}
          {` `}
          {v(l ? open : limit, {
            symbol,
            decimals: 1,
          })}
        </span>
      </div>
    </div>
  );
}
export function n({
  decision,
  verdict,
  hints,
  hintText,
  egg,
  gift,
  trap,
  trapLine,
  warn,
  provider,
  error,
  rejected,
  personaVersion,
  symbol = `P`,
  className,
}) {
  let d = decision ?? undefined;
  return (
    <div
      className={r_1(
        `w-full rounded-xl border border-line bg-base/70 p-3 text-xs`,
        className,
      )}
    >
      {d && (d.action || d.price !== undefined) && (
        <div>
          <div className={`flex flex-wrap items-center gap-2`}>
            <span className={`eyebrow text-faint`}>{`code decided`}</span>
            {d.action && <HComponent action={d.action} />}
            {d.price !== undefined && d.price !== null && (
              <span className={`font-display-num text-lg text-gold`}>
                {v(d.price, {
                  symbol,
                })}
              </span>
            )}
            {d.round !== undefined && (
              <span className={`font-mono text-[11px] text-muted`}>
                {`round `}
                {d.round}
              </span>
            )}
            {d.role && (
              <span className={`font-mono text-[11px] text-faint`}>
                {`as `}
                {d.role}
              </span>
            )}
          </div>
          {d.reason && (
            <div className={`mt-1 text-muted`}>
              {Array.isArray(d.reason) ? d.reason.join(`, `) : d.reason}
            </div>
          )}
          <div className={`mt-2 grid grid-cols-4 gap-2 font-mono text-[11px]`}>
            {[`open`, `target`, `limit`, `book`].map((e) => (
              <div key={e} className={`rounded-md bg-panel px-2 py-1`}>
                <div
                  className={`text-[9px] uppercase tracking-wider text-faint`}
                >
                  {e === `limit`
                    ? d.role === `buyer`
                      ? `ceiling`
                      : `floor`
                    : e}
                </div>
                <div className={`text-ink`}>
                  {d[e] === undefined || d[e] === null ? `—` : y(d[e], 1)}
                </div>
              </div>
            ))}
          </div>
          <GComponent d={d} symbol={symbol} />
        </div>
      )}
      {verdict && Object.keys(verdict).length > 0 && (
        <div className={r_1(d && `mt-3 border-t border-line pt-2.5`)}>
          <VComponent verdict={verdict} />
        </div>
      )}
      {(hints?.length || egg || gift || trap || warn) && (
        <div
          className={`mt-2.5 flex flex-col gap-1.5 border-t border-line pt-2.5`}
        >
          {hints?.map((e) => (
            <div key={e} className={`flex items-start gap-1.5 text-info`}>
              <S1 className={`mt-0.5 size-3.5 shrink-0`} aria-hidden />
              <span>
                <span className={`font-mono font-semibold`}>
                  {`hint `}
                  {e}
                </span>
                {hintText?.(e) && (
                  <span className={`text-muted`}>
                    {` — `}
                    {hintText(e)}
                  </span>
                )}
              </span>
            </div>
          ))}
          {egg && (
            <div className={`flex items-start gap-1.5 text-gold`}>
              <R className={`mt-0.5 size-3.5 shrink-0`} aria-hidden />
              <span>
                <span className={`font-mono font-semibold`}>
                  {`egg `}
                  {egg.id ?? ``}
                </span>
                <span className={`text-muted`}>
                  {` — `}
                  {egg.reply}
                </span>
              </span>
            </div>
          )}
          {gift && (
            <div className={`flex items-start gap-1.5 text-gold`}>
              <A className={`mt-0.5 size-3.5 shrink-0`} aria-hidden />
              <span>
                {`gift: `}
                {gift}
              </span>
            </div>
          )}
          {trap && (
            <div className={`flex items-start gap-1.5 text-accent`}>
              <E className={`mt-0.5 size-3.5 shrink-0`} aria-hidden />
              <span>
                {`trick `}
                <span className={`font-mono font-semibold`}>{trap}</span>
                {trapLine && (
                  <span className={`text-muted`}>
                    {` — “`}
                    {trapLine}
                    {`”`}
                  </span>
                )}
                {trap === `switch` && (
                  <span
                    className={`text-muted`}
                  >{` — the offer names a lesser card than the words`}</span>
                )}
              </span>
            </div>
          )}
          {warn && (
            <div className={`flex items-start gap-1.5 text-warn`}>
              <O1 className={`mt-0.5 size-3.5 shrink-0`} aria-hidden />
              <span>{`warned the team (a strike counted)`}</span>
            </div>
          )}
        </div>
      )}
      {(provider || personaVersion) && (
        <div
          className={`mt-2.5 flex flex-wrap items-center gap-2 border-t border-line pt-2 text-[11px] text-faint`}
        >
          <N className={`size-3.5`} aria-hidden />
          <span
            className={r_1(
              `font-mono`,
              provider?.startsWith(`template(`) && `text-warn`,
            )}
          >
            {provider ?? `provider ?`}
          </span>
          {personaVersion !== undefined && (
            <span className={`font-mono`}>
              {`· persona v`}
              {personaVersion}
            </span>
          )}
          {error && (
            <span className={`text-accent`}>
              {`· `}
              {error}
            </span>
          )}
        </div>
      )}
      {rejected ? (
        <details className={`mt-1.5 text-[11px] text-muted`}>
          <summary
            className={`cursor-pointer text-warn`}
          >{`discarded LLM line (it named another number)`}</summary>
          <div className={`mt-1 rounded bg-panel px-2 py-1 italic`}>
            {String(rejected)}
          </div>
        </details>
      ) : null}
    </div>
  );
}
function VComponent({ verdict, label = `judge on the team` }) {
  let r = verdict.politeness ?? 0;
  let a = [`injection`, `abuse`, `false_claim`, `spam`].filter(
    (t) => verdict[t],
  );
  return (
    <div className={`flex flex-wrap items-center gap-2`}>
      <span className={`eyebrow text-faint`}>{label}</span>
      <span
        className={`inline-flex items-center gap-1`}
        title={`politeness ${r} of 3`}
      >
        <L className={`size-3 text-good`} aria-hidden />
        {[0, 1, 2].map((e) => (
          <span
            key={e}
            className={r_1(
              `size-2 rounded-full`,
              e < r ? `bg-good` : `bg-line-strong`,
            )}
          />
        ))}
        <span className={`ml-0.5 font-mono text-[11px] text-muted`}>
          {r}
          {`/3`}
        </span>
      </span>
      {a.map((e) => (
        <span
          key={e}
          className={`inline-flex h-5 items-center gap-1 rounded-full border border-accent/40 bg-accent/12 px-2 text-[10px] font-bold uppercase tracking-wider text-accent`}
        >
          <I className={`size-3`} aria-hidden />
          {e.replace(`_`, ` `)}
        </span>
      ))}
      {!a.length && (
        <span className={`text-[11px] text-good/80`}>{`clean`}</span>
      )}
      {verdict.tags?.map((e) => (
        <span
          key={e}
          className={`rounded bg-raised px-1.5 py-0.5 font-mono text-[10px] text-muted`}
        >
          {e}
        </span>
      ))}
    </div>
  );
}
export { VComponent as r, PComponent as t };
