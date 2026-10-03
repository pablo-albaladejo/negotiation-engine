import { i, n, t } from "./jsx-runtime.js";
import { t as R } from "./Button.js";
import { t as I } from "./ErrorNote.js";
import { a as A } from "./index.js";
const o = i(n(), 1);
const s = t();
function CComponent({
  open,
  onClose,
  title,
  children,
  confirmLabel = `Confirm`,
  tone = `primary`,
  onConfirm,
  disabled,
  size = `sm`,
}) {
  let [m, setM] = o.useState(false);
  let [g, setG] = o.useState(null);
  let v = () => {
    if (!m) {
      setG(null);
      onClose();
    }
  };
  return (
    <A
      open={open}
      onClose={v}
      size={size}
      title={title}
      footer=<>
        <R variant={`ghost`} onClick={v} disabled={m}>{`Cancel`}</R>
        <R
          variant={tone === `danger` ? `danger` : `primary`}
          onClick={async () => {
            setM(true);
            setG(null);
            try {
              await onConfirm();
              setM(false);
              onClose();
            } catch (error) {
              setM(false);
              setG(error);
            }
          }}
          loading={m}
          disabled={disabled}
        >
          {confirmLabel}
        </R>
      </>
    >
      <div className={`flex flex-col gap-3 pb-1 text-sm text-muted`}>
        {children}
        {g ? <I error={g} /> : null}
      </div>
    </A>
  );
}
export { CComponent as t };
