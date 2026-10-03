import { i, n, t } from "./jsx-runtime.js";
import { r } from "./Button.js";
import { J } from "./index.js";
const __vite__mapDeps = (
  i,
  m = __vite__mapDeps,
  d = m.f || (m.f = ["assets/YamlEditorImpl.js", "assets/jsx-runtime.js"]),
) => i.map((i) => d[i]);
const a = i(n(), 1);
const o = t();
const S = a.lazy(() =>
  J(() => import(`./YamlEditorImpl.js`), __vite__mapDeps([0, 1])),
);
function CComponent(e) {
  return (
    <div
      className={r(
        `overflow-hidden rounded-xl border border-line bg-base/80`,
        e.className,
      )}
    >
      <a.Suspense
        fallback=<pre
          className={`overflow-auto px-4 py-3 font-mono text-[13px] leading-relaxed text-muted`}
          style={{
            height: e.height ?? `480px`,
          }}
        >
          {e.value}
        </pre>
      >
        <S {...e} className={undefined} />
      </a.Suspense>
    </div>
  );
}
export { CComponent as t };
