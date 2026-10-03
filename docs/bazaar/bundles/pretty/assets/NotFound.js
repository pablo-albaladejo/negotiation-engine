import { t } from "./jsx-runtime.js";
import { n } from "./Button.js";
import { t as N } from "./EmptyState.js";
import { H } from "./index.js";
const i = t();
function AComponent() {
  return (
    <N
      title={`Nothing on this stall`}
      hint={`That page does not exist. The leaderboard is always open.`}
      action=<H
        to={`/`}
        className={n(`secondary`)}
      >{`Back to the leaderboard`}</H>
    />
  );
}
export { AComponent as default };
