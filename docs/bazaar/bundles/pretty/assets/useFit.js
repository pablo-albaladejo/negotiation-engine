import { i as i_1, n } from "./jsx-runtime.js";
import { i as i_2 } from "./Button.js";
const r = {
  name: `star`,
  size: 24,
  node: [
    [
      `path`,
      {
        d: `M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z`,
        key: `r04s7s`,
      },
    ],
  ],
};
r.node;
const i = i_2(r);
const a = i_1(n(), 1);
function useO(e) {
  let t = `(min-width: ${e}px)`;
  let [n, setN] = a.useState(
    () => typeof window < `u` && window.matchMedia(t).matches,
  );
  a.useEffect(() => {
    let e = window.matchMedia(t);
    let n = () => setN(e.matches);
    n();
    e.addEventListener(`change`, n);
    return () => e.removeEventListener(`change`, n);
  }, [t]);
  return n;
}
function useS(e, { rowPx, gapPx = 0, reservePx = 0, max, active }) {
  let [c, setC] = a.useState(max);
  a.useLayoutEffect(() => {
    let e_current = e.current;
    if (!e_current || !active) {
      setC(max);
      return;
    }
    let a = () => {
      let e = e_current.clientHeight - reservePx;
      setC(
        e > 0
          ? Math.max(
              1,
              Math.min(max, Math.floor((e + gapPx) / (rowPx + gapPx))),
            )
          : max,
      );
    };
    a();
    let c = new ResizeObserver(a);
    c.observe(e_current);
    return () => c.disconnect();
  }, [e, rowPx, gapPx, reservePx, max, active]);
  return c;
}
export { useO as n, i as r, useS as t };
