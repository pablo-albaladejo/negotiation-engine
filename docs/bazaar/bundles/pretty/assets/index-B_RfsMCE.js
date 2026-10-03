import { i as i_1, n as n_1, r, t } from "./jsx-runtime-CU3EbJiN.js";
import { i, r as r_2, t as O1 } from "./Button-DIaWEsZ9.js";
import {
  M,
  T as T_1,
  a as L1,
  c,
  d,
  j as F1,
  l,
  m,
  n as n_2,
  p,
  s,
  u,
  v,
} from "./useEvents-BpJ5PfZT.js";
import { t as B1 } from "./x-DW9JnTdX.js";
const __vite__mapDeps = (
  i,
  m = __vite__mapDeps,
  d = m.f ||
    (m.f = [
      "assets/BigScreen-CIAu_gkJ.js",
      "assets/jsx-runtime-CU3EbJiN.js",
      "assets/Cromo-BD7ZopIA.js",
      "assets/Button-DIaWEsZ9.js",
      "assets/useEvents-BpJ5PfZT.js",
      "assets/Cromo-BCOGwktI.css",
      "assets/award-n-Uno7d2.js",
      "assets/EventLine-Bsrbkjwf.js",
      "assets/shield-alert-D37rzUV0.js",
      "assets/handshake-BOxgdx9P.js",
      "assets/lock-open-BaFFRJ5V.js",
      "assets/package-BroSsHdu.js",
      "assets/catalog-C4CNN-Mb.js",
      "assets/names-CpRLV58L.js",
      "assets/RarityBadge-Boc23U-c.js",
      "assets/flag-C1WRHPw8.js",
      "assets/gift-By9eZ4Hi.js",
      "assets/EmptyState-BxhxbZPA.js",
      "assets/landmark-BpFVg3Xk.js",
      "assets/lock-Cv7BB2xm.js",
      "assets/LiveFeed-0LVmhUn1.js",
      "assets/radio-DXXmGeQs.js",
      "assets/Pesetas-MTmNUFPf.js",
      "assets/Pesetas-CJ3OOTbK.css",
      "assets/ErrorNote-Ca3ig8px.js",
      "assets/snowflake-CGy1yW7K.js",
      "assets/useFit-Bn5ih_nt.js",
      "assets/sun-DUfPPlse.js",
      "assets/x-DW9JnTdX.js",
      "assets/LevelBadge-BVpKP7Tt.js",
      "assets/PersonaAvatar-pfo-WxM7.js",
      "assets/Catalogue-B7zHP7rb.js",
      "assets/KPI-BYUa0IMS.js",
      "assets/Sparkline-0X5dHX-k.js",
      "assets/PackCard-uJX1JC15.js",
      "assets/PageHeader-B1UyPTkh.js",
      "assets/PersonaGallery-DvtlR2Yh.js",
      "assets/chevron-right-BmhxKtEk.js",
      "assets/ControlRoom-BPiPQhN5.js",
      "assets/bot-CKsSsSHQ.js",
      "assets/coins-6zHKk2gn.js",
      "assets/eye-off-Bio-uKSw.js",
      "assets/eye-NDS9hpL0.js",
      "assets/play-D48fnXtj.js",
      "assets/shield-check-BJyN87B7.js",
      "assets/Panel-DtYcp5Ol.js",
      "assets/Slider-DkN35m-_.js",
      "assets/Tabs-BcELG-Ib.js",
      "assets/Toggle-B3ShqYPV.js",
      "assets/ConfirmDialog-BXsjZ_gi.js",
      "assets/hooks-BX-dyw4g.js",
      "assets/PersonaList-D1blR-q3.js",
      "assets/arrow-right-aSvo4Cqf.js",
      "assets/lightbulb-CwYDVA-a.js",
      "assets/plus-CPWkkkzl.js",
      "assets/util-CFqlaVVI.js",
      "assets/unlock-enldWC1V.js",
      "assets/PersonaEditor-CY0YsfDU.js",
      "assets/arrow-up-ebU7lgQM.js",
      "assets/chevron-down-CljYlySm.js",
      "assets/IconBtn-DqxaqU6z.js",
      "assets/octagon-alert-BjoVpPvz.js",
      "assets/YamlEditor-BWHd2FPU.js",
      "assets/Conversation-qXKH7jXc.js",
      "assets/OfferView-C4dF4qTy.js",
      "assets/Teams-TPp3tDwD.js",
      "assets/Insights-CZNFWMow.js",
      "assets/Venues-By_ioigg.js",
      "assets/trending-up-GTAaCDx-.js",
      "assets/Duels--ctbgHOp.js",
      "assets/Bench-CQD-tuQh.js",
      "assets/Threads-Bm_ipLV8.js",
      "assets/search-LtN31357.js",
      "assets/CardsAdmin-BXwbvoPk.js",
      "assets/Events-BtvMjJi8.js",
      "assets/Styleguide-0WmY8aCf.js",
      "assets/NotFound-avGWl0I-.js",
    ]),
) => i.map((i) => d[i]);
(() => {
  let relList = document.createElement(`link`).relList;
  if (relList && relList.supports && relList.supports(`modulepreload`)) {
    return;
  }
  for (let e of document.querySelectorAll(`link[rel="modulepreload"]`)) {
    n(e);
  }
  new MutationObserver((e) => {
    for (let t of e) {
      if (t.type === `childList`) {
        for (let e of t.addedNodes) {
          if (e.tagName === `LINK` && e.rel === `modulepreload`) {
            n(e);
          }
        }
      }
    }
  }).observe(document, {
    childList: true,
    subtree: true,
  });
  function t(e) {
    let t = {};
    if (e.integrity) {
      t.integrity = e.integrity;
    }
    if (e.referrerPolicy) {
      t.referrerPolicy = e.referrerPolicy;
    }
    t.credentials =
      e.crossOrigin === `use-credentials`
        ? `include`
        : e.crossOrigin === `anonymous`
          ? `omit`
          : `same-origin`;
    return t;
  }
  function n(e) {
    if (e.ep) {
      return;
    }
    e.ep = true;
    let n = t(e);
    fetch(e.href, n);
  }
})();
const x = r((e) => {
  function t(e, t) {
    let e_length = e.length;
    e.push(t);
    a: while (e_length > 0) {
      const r = (e_length - 1) >>> 1;
      const a = e[r];
      if (i(a, t) > 0) {
        e[r] = t;
        e[e_length] = a;
        e_length = r;
      } else {
        break a;
      }
    }
  }
  function n(e) {
    if (e.length === 0) {
      return null;
    }
    return e[0];
  }
  function r(e) {
    if (e.length === 0) {
      return null;
    }
    const t = e[0];
    const n = e.pop();
    if (n !== t) {
      e[0] = n;
      a: for (let r = 0, a = e.length, o = a >>> 1; r < o;) {
        const s = 2 * (r + 1) - 1;
        const c = e[s];
        const l = s + 1;
        const u = e[l];
        if (i(c, n) < 0) {
          if (l < a && i(u, c) < 0) {
            e[r] = u;
            e[l] = n;
            r = l;
          } else {
            e[r] = c;
            e[s] = n;
            r = s;
          }
        } else if (l < a && i(u, n) < 0) {
          e[r] = u;
          e[l] = n;
          r = l;
        } else {
          break a;
        }
      }
    }
    return t;
  }
  function i(e, t) {
    const n = e.sortIndex - t.sortIndex;
    if (n === 0) {
      return e.id - t.id;
    }
    return n;
  }
  if (typeof performance == `object` && typeof performance.now == `function`) {
    var a = performance;
    e.unstable_now = () => a.now();
  } else {
    var o = Date;
    var s = o.now();
    e.unstable_now = () => o.now() - s;
  }
  var c = [];
  var l = [];
  var u = 1;
  var d = null;
  var f = 3;
  var p = false;
  var m = false;
  var h = false;
  var g = typeof setTimeout == `function` ? setTimeout : null;
  var _ = typeof clearTimeout == `function` ? clearTimeout : null;
  var v = typeof setImmediate < `u` ? setImmediate : null;
  if (
    typeof navigator < `u` &&
    navigator.scheduling !== undefined &&
    navigator.scheduling.isInputPending !== undefined
  ) {
    navigator.scheduling.isInputPending.bind(navigator.scheduling);
  }
  function y(e) {
    for (let i = n(l); i !== null;) {
      if (i.callback === null) {
        r(l);
      } else if (i.startTime <= e) {
        r(l);
        i.sortIndex = i.expirationTime;
        t(c, i);
      } else {
        break;
      }
      i = n(l);
    }
  }
  function b(e) {
    h = false;
    y(e);
    if (!m) {
      if (n(c) !== null) {
        m = true;
        ne(x);
      } else {
        const t = n(l);
        if (t !== null) {
          A(b, t.startTime - e);
        }
      }
    }
  }
  function x(t, i) {
    m = false;
    if (h) {
      h = false;
      _(w);
      w = -1;
    }
    p = true;
    const a = f;
    try {
      y(i);
      for (d = n(c); d !== null && (!(d.expirationTime > i) || (t && !D()));) {
        const o = d.callback;
        if (typeof o == `function`) {
          d.callback = null;
          f = d.priorityLevel;
          const s = o(d.expirationTime <= i);
          i = e.unstable_now();
          if (typeof s == `function`) {
            d.callback = s;
          } else if (d === n(c)) {
            r(c);
          }
          y(i);
        } else {
          r(c);
        }
        d = n(c);
      }
      if (d !== null) var u = true;
      else {
        const g = n(l);
        if (g !== null) {
          A(b, g.startTime - i);
        }
        u = false;
      }
      return u;
    } finally {
      d = null;
      f = a;
      p = false;
    }
  }
  var S = false;
  var C = null;
  var w = -1;
  var T = 5;
  var E = -1;
  function D() {
    return !(e.unstable_now() - E < T);
  }
  function O() {
    if (C !== null) {
      const t = e.unstable_now();
      E = t;
      let n = true;
      try {
        n = C(true, t);
      } finally {
        if (n) {
          k();
        } else {
          S = false;
          C = null;
        }
      }
    } else {
      S = false;
    }
  }
  var k;
  if (typeof v == `function`) {
    k = () => {
      v(O);
    };
  } else if (typeof MessageChannel < `u`) {
    var ee = new MessageChannel();
    var te = ee.port2;
    ee.port1.onmessage = O;
    k = () => {
      te.postMessage(null);
    };
  } else {
    k = () => {
      g(O, 0);
    };
  }
  function ne(e) {
    C = e;
    if (!S) {
      S = true;
      k();
    }
  }
  function A(t, n) {
    w = g(() => {
      t(e.unstable_now());
    }, n);
  }
  e.unstable_IdlePriority = 5;
  e.unstable_ImmediatePriority = 1;
  e.unstable_LowPriority = 4;
  e.unstable_NormalPriority = 3;
  e.unstable_Profiling = null;
  e.unstable_UserBlockingPriority = 2;
  e.unstable_cancelCallback = (e) => {
    e.callback = null;
  };
  e.unstable_continueExecution = () => {
    if (!(m || p)) {
      m = true;
      ne(x);
    }
  };
  e.unstable_forceFrameRate = (e) => {
    if (e < 0 || e > 125) {
      console.error(
        `forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported`,
      );
    } else {
      T = e > 0 ? Math.floor(1000 / e) : 5;
    }
  };
  e.unstable_getCurrentPriorityLevel = () => f;
  e.unstable_getFirstCallbackNode = () => n(c);
  e.unstable_next = (e) => {
    switch (f) {
      case 1:
      case 2:
      case 3:
        var t = 3;
        break;
      default:
        t = f;
    }
    const n = f;
    f = t;
    try {
      return e();
    } finally {
      f = n;
    }
  };
  e.unstable_pauseExecution = () => {};
  e.unstable_requestPaint = () => {};
  e.unstable_runWithPriority = (e, t) => {
    switch (e) {
      case 1:
      case 2:
      case 3:
      case 4:
      case 5:
        break;
      default:
        e = 3;
    }
    const n = f;
    f = e;
    try {
      return t();
    } finally {
      f = n;
    }
  };
  e.unstable_scheduleCallback = (priorityLevel, callback, startTime) => {
    const o = e.unstable_now();
    if (typeof startTime == `object` && startTime) {
      startTime = startTime.delay;
      startTime =
        typeof startTime == `number` && startTime > 0 ? o + startTime : o;
    } else {
      startTime = o;
    }
    switch (priorityLevel) {
      case 1:
        var expirationTime = -1;
        break;
      case 2:
        expirationTime = 250;
        break;
      case 5:
        expirationTime = 1073741823;
        break;
      case 4:
        expirationTime = 10000;
        break;
      default:
        expirationTime = 5000;
    }
    expirationTime = startTime + expirationTime;
    priorityLevel = {
      id: u++,
      callback,
      priorityLevel,
      startTime,
      expirationTime,
      sortIndex: -1,
    };
    if (startTime > o) {
      priorityLevel.sortIndex = startTime;
      t(l, priorityLevel);
      if (n(c) === null && priorityLevel === n(l)) {
        if (h) {
          _(w);
          w = -1;
        } else {
          h = true;
        }
        A(b, startTime - o);
      }
    } else {
      priorityLevel.sortIndex = expirationTime;
      t(c, priorityLevel);
      if (!(m || p)) {
        m = true;
        ne(x);
      }
    }
    return priorityLevel;
  };
  e.unstable_shouldYield = D;
  e.unstable_wrapCallback = (e) => {
    const t = f;
    return function () {
      const n = f;
      f = t;
      try {
        return e.apply(this, arguments);
      } finally {
        f = n;
      }
    };
  };
});
const S = r((e, t) => {
  t.exports = x();
});
const C = r((e) => {
  var n = n_1();
  var r = S();
  function i(e) {
    let t = `https://reactjs.org/docs/error-decoder.html?invariant=` + e;
    for (let n = 1; n < arguments.length; n++) {
      t += `&args[]=` + encodeURIComponent(arguments[n]);
    }
    return (
      `Minified React error #` +
      e +
      `; visit ` +
      t +
      ` for the full message or use the non-minified dev environment for full errors and additional helpful warnings.`
    );
  }
  var a = new Set();
  var o = {};
  function s(e, t) {
    c(e, t);
    c(e + `Capture`, t);
  }
  function c(e, t) {
    o[e] = t;
    for (e = 0; e < t.length; e++) {
      a.add(t[e]);
    }
  }
  var l =
    typeof window < `u` &&
    window.document !== undefined &&
    window.document.createElement !== undefined;
  var hasOwnProperty = Object.prototype.hasOwnProperty;
  var d =
    /^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/;
  var f = {};
  var p = {};
  function m(e) {
    if (hasOwnProperty.call(p, e)) {
      return true;
    }
    if (hasOwnProperty.call(f, e)) {
      return false;
    }
    if (d.test(e)) {
      return (p[e] = true);
    }
    return ((f[e] = true), false);
  }
  function h(e, t, n, r) {
    if (n !== null && n.type === 0) {
      return false;
    }
    switch (typeof t) {
      case `function`:
      case `symbol`:
        return true;
      case `boolean`:
        if (r) {
          return false;
        }
        if (n === null) {
          return (
            (e = e.toLowerCase().slice(0, 5)),
            e !== `data-` && e !== `aria-`
          );
        }
        return !n.acceptsBooleans;
      default:
        return false;
    }
  }
  function g(e, t, n, r) {
    if (t == null || h(e, t, n, r)) {
      return true;
    }
    if (r) {
      return false;
    }
    if (n !== null) {
      switch (n.type) {
        case 3:
          return !t;
        case 4:
          return t === false;
        case 5:
          return isNaN(t);
        case 6:
          return isNaN(t) || t < 1;
      }
    }
    return false;
  }
  function _(e, t, n, r, i, a, o) {
    this.acceptsBooleans = t === 2 || t === 3 || t === 4;
    this.attributeName = r;
    this.attributeNamespace = i;
    this.mustUseProperty = n;
    this.propertyName = e;
    this.type = t;
    this.sanitizeURL = a;
    this.removeEmptyString = o;
  }
  var v = {};
  `children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style`
    .split(` `)
    .forEach((e) => {
      v[e] = new _(e, 0, false, e, null, false, false);
    });
  [
    [`acceptCharset`, `accept-charset`],
    [`className`, `class`],
    [`htmlFor`, `for`],
    [`httpEquiv`, `http-equiv`],
  ].forEach((e) => {
    const t = e[0];
    v[t] = new _(t, 1, false, e[1], null, false, false);
  });
  [`contentEditable`, `draggable`, `spellCheck`, `value`].forEach((e) => {
    v[e] = new _(e, 2, false, e.toLowerCase(), null, false, false);
  });
  [
    `autoReverse`,
    `externalResourcesRequired`,
    `focusable`,
    `preserveAlpha`,
  ].forEach((e) => {
    v[e] = new _(e, 2, false, e, null, false, false);
  });
  `allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture disableRemotePlayback formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope`
    .split(` `)
    .forEach((e) => {
      v[e] = new _(e, 3, false, e.toLowerCase(), null, false, false);
    });
  [`checked`, `multiple`, `muted`, `selected`].forEach((e) => {
    v[e] = new _(e, 3, true, e, null, false, false);
  });
  [`capture`, `download`].forEach((e) => {
    v[e] = new _(e, 4, false, e, null, false, false);
  });
  [`cols`, `rows`, `size`, `span`].forEach((e) => {
    v[e] = new _(e, 6, false, e, null, false, false);
  });
  [`rowSpan`, `start`].forEach((e) => {
    v[e] = new _(e, 5, false, e.toLowerCase(), null, false, false);
  });
  var y = /[\-:]([a-z])/g;
  function b(e) {
    return e[1].toUpperCase();
  }
  `accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height`
    .split(` `)
    .forEach((e) => {
      const t = e.replace(y, b);
      v[t] = new _(t, 1, false, e, null, false, false);
    });
  `xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type`
    .split(` `)
    .forEach((e) => {
      const t = e.replace(y, b);
      v[t] = new _(
        t,
        1,
        false,
        e,
        `http://www.w3.org/1999/xlink`,
        false,
        false,
      );
    });
  [`xml:base`, `xml:lang`, `xml:space`].forEach((e) => {
    const t = e.replace(y, b);
    v[t] = new _(
      t,
      1,
      false,
      e,
      `http://www.w3.org/XML/1998/namespace`,
      false,
      false,
    );
  });
  [`tabIndex`, `crossOrigin`].forEach((e) => {
    v[e] = new _(e, 1, false, e.toLowerCase(), null, false, false);
  });
  v.xlinkHref = new _(
    `xlinkHref`,
    1,
    false,
    `xlink:href`,
    `http://www.w3.org/1999/xlink`,
    true,
    false,
  );
  [`src`, `href`, `action`, `formAction`].forEach((e) => {
    v[e] = new _(e, 1, false, e.toLowerCase(), null, true, true);
  });
  function x(e, t, n, r) {
    let i = v.hasOwnProperty(t) ? v[t] : null;
    (i === null
      ? r ||
        !(t.length > 2) ||
        (t[0] !== `o` && t[0] !== `O`) ||
        (t[1] !== `n` && t[1] !== `N`)
      : i.type !== 0) &&
      (g(t, n, i, r) && (n = null),
      r || i === null
        ? m(t) &&
          (n === null ? e.removeAttribute(t) : e.setAttribute(t, `` + n))
        : i.mustUseProperty
          ? (e[i.propertyName] = n === null ? i.type !== 3 && `` : n)
          : ((t = i.attributeName),
            (r = i.attributeNamespace),
            n === null
              ? e.removeAttribute(t)
              : ((i = i.type),
                (n = i === 3 || (i === 4 && n === true) ? `` : `` + n),
                r ? e.setAttributeNS(r, t, n) : e.setAttribute(t, n))));
  }
  var n___SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED =
    n.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
  var w = Symbol.for(`react.element`);
  var T = Symbol.for(`react.portal`);
  var E = Symbol.for(`react.fragment`);
  var D = Symbol.for(`react.strict_mode`);
  var O = Symbol.for(`react.profiler`);
  var k = Symbol.for(`react.provider`);
  var ee = Symbol.for(`react.context`);
  var te = Symbol.for(`react.forward_ref`);
  var ne = Symbol.for(`react.suspense`);
  var A = Symbol.for(`react.suspense_list`);
  var re = Symbol.for(`react.memo`);
  var j = Symbol.for(`react.lazy`);
  var ie = Symbol.for(`react.offscreen`);
  var Symbol_iterator = Symbol.iterator;
  function oe(e) {
    if (typeof e != `object` || !e) {
      return null;
    }
    return (
      (e = (Symbol_iterator && e[Symbol_iterator]) || e[`@@iterator`]),
      typeof e == `function` ? e : null
    );
  }
  var Object_assign = Object.assign;
  var se;
  function ce(e) {
    if (se === undefined) {
      try {
        throw Error();
      } catch (error) {
        const t = error.stack.trim().match(/\n( *(at )?)/);
        se = (t && t[1]) || ``;
      }
    }
    return (
      `
` +
      se +
      e
    );
  }
  var le = false;
  function N(e, t) {
    if (!e || le) {
      return ``;
    }
    le = true;
    Error.prepareStackTrace = undefined;
    try {
      if (t) {
        t = function () {
          throw Error();
        };
        Object.defineProperty(t.prototype, "props", {
          set() {
            throw Error();
          },
        });
        if (typeof Reflect == `object` && Reflect.construct) {
          try {
            Reflect.construct(t, []);
          } catch (error) {
            var r = error;
          }
          Reflect.construct(e, [], t);
        } else {
          try {
            t.call();
          } catch (error) {
            r = error;
          }
          e.call(t.prototype);
        }
      } else {
        try {
          throw Error();
        } catch (error) {
          r = error;
        }
        e();
      }
    } catch (error) {
      if (error && r && typeof error.stack == `string`) {
        for (
          var i = error.stack.split(`
`),
            a = r.stack.split(`
`),
            o = i.length - 1,
            s = a.length - 1;
          o >= 1 && s >= 0 && i[o] !== a[s];
        ) {
          s--;
        }
        for (; o >= 1 && s >= 0; o--, s--) {
          if (i[o] !== a[s]) {
            if (o !== 1 || s !== 1) {
              do {
                o--;
                s--;
                if (s < 0 || i[o] !== a[s]) {
                  let c =
                    `
` + i[o].replace(` at new `, ` at `);
                  if (e.displayName && c.includes(`<anonymous>`)) {
                    c = c.replace(`<anonymous>`, e.displayName);
                  }
                  return c;
                }
              } while (o >= 1 && s >= 0);
            }
            break;
          }
        }
      }
    } finally {
      le = false;
      Error.prepareStackTrace = Error.prepareStackTrace;
    }
    if ((e = e ? e.displayName || e.name : ``)) {
      return ce(e);
    }
    return ``;
  }
  function ue(e) {
    switch (e.tag) {
      case 5:
        return ce(e.type);
      case 16:
        return ce(`Lazy`);
      case 13:
        return ce(`Suspense`);
      case 19:
        return ce(`SuspenseList`);
      case 0:
      case 2:
      case 15:
        e = N(e.type, false);
        return e;
      case 11:
        e = N(e.type.render, false);
        return e;
      case 1:
        e = N(e.type, true);
        return e;
      default:
        return ``;
    }
  }
  function de(e) {
    if (e == null) {
      return null;
    }
    if (typeof e == `function`) {
      return e.displayName || e.name || null;
    }
    if (typeof e == `string`) {
      return e;
    }
    switch (e) {
      case E:
        return `Fragment`;
      case T:
        return `Portal`;
      case O:
        return `Profiler`;
      case D:
        return `StrictMode`;
      case ne:
        return `Suspense`;
      case A:
        return `SuspenseList`;
    }
    if (typeof e == `object`) {
      switch (e.$$typeof) {
        case ee:
          return (e.displayName || `Context`) + `.Consumer`;
        case k:
          return (e._context.displayName || `Context`) + `.Provider`;
        case te:
          var t = e.render;
          e = e.displayName;
          e ||=
            ((e = t.displayName || t.name || ``),
            e === `` ? `ForwardRef` : `ForwardRef(` + e + `)`);
          return e;
        case re:
          t = e.displayName || null;
          if (t === null) {
            return de(e.type) || `Memo`;
          }
          return t;
        case j:
          t = e._payload;
          e = e._init;
          try {
            return de(e(t));
          } catch {}
      }
    }
    return null;
  }
  function fe(e) {
    const e_type = e.type;
    switch (e.tag) {
      case 24:
        return `Cache`;
      case 9:
        return (e_type.displayName || `Context`) + `.Consumer`;
      case 10:
        return (e_type._context.displayName || `Context`) + `.Provider`;
      case 18:
        return `DehydratedFragment`;
      case 11:
        e = e_type.render;
        e = e.displayName || e.name || ``;
        return (
          e_type.displayName ||
          (e === `` ? `ForwardRef` : `ForwardRef(` + e + `)`)
        );
      case 7:
        return `Fragment`;
      case 5:
        return e_type;
      case 4:
        return `Portal`;
      case 3:
        return `Root`;
      case 6:
        return `Text`;
      case 16:
        return de(e_type);
      case 8:
        if (e_type === D) {
          return `StrictMode`;
        }
        return `Mode`;
      case 22:
        return `Offscreen`;
      case 12:
        return `Profiler`;
      case 21:
        return `Scope`;
      case 13:
        return `Suspense`;
      case 19:
        return `SuspenseList`;
      case 25:
        return `TracingMarker`;
      case 1:
      case 0:
      case 17:
      case 2:
      case 14:
      case 15:
        if (typeof e_type == `function`) {
          return e_type.displayName || e_type.name || null;
        }
        if (typeof e_type == `string`) {
          return e_type;
        }
    }
    return null;
  }
  function pe(e) {
    switch (typeof e) {
      case `boolean`:
      case `number`:
      case `string`:
      case `undefined`:
        return e;
      case `object`:
        return e;
      default:
        return ``;
    }
  }
  function me(e) {
    const e_type = e.type;
    return (
      (e = e.nodeName) &&
      e.toLowerCase() === `input` &&
      (e_type === `checkbox` || e_type === `radio`)
    );
  }
  function he(e) {
    const t = me(e) ? `checked` : `value`;
    const n = Object.getOwnPropertyDescriptor(e.constructor.prototype, t);
    let r = `` + e[t];
    if (
      !e.hasOwnProperty(t) &&
      n !== undefined &&
      typeof n.get == `function` &&
      typeof n.set == `function`
    ) {
      const { get, set } = n;
      Object.defineProperty(e, t, {
        configurable: true,
        get() {
          return get.call(this);
        },
        set(e) {
          r = `` + e;
          set.call(this, e);
        },
      });
      Object.defineProperty(e, t, {
        enumerable: n.enumerable,
      });
      return {
        getValue() {
          return r;
        },
        setValue(e) {
          r = `` + e;
        },
        stopTracking() {
          e._valueTracker = null;
          delete e[t];
        },
      };
    }
  }
  function ge(e) {
    e._valueTracker ||= he(e);
  }
  function _e(e) {
    if (!e) {
      return false;
    }
    const e__valueTracker = e._valueTracker;
    if (!e__valueTracker) {
      return true;
    }
    const n = e__valueTracker.getValue();
    let r = ``;
    if (e) {
      r = me(e) ? (e.checked ? `true` : `false`) : e.value;
    }
    e = r;
    return e !== n && (e__valueTracker.setValue(e), true);
  }
  function ve(e) {
    e ||= typeof document < `u` ? document : undefined;
    if (e === undefined) {
      return null;
    }
    try {
      return e.activeElement || e.body;
    } catch {
      return e.body;
    }
  }
  function ye(e, t) {
    const t_checked = t.checked;
    return Object_assign({}, t, {
      defaultChecked: undefined,
      defaultValue: undefined,
      value: undefined,
      checked: t_checked ?? e._wrapperState.initialChecked,
    });
  }
  function be(e, t) {
    let initialValue = t.defaultValue ?? ``;
    const initialChecked = t.checked ?? t.defaultChecked;
    initialValue = pe(t.value ?? initialValue);
    e._wrapperState = {
      initialChecked,
      initialValue,
      controlled:
        t.type === `checkbox` || t.type === `radio`
          ? t.checked != null
          : t.value != null,
    };
  }
  function xe(e, t) {
    t = t.checked;
    if (t != null) {
      x(e, `checked`, t, false);
    }
  }
  function Se(e, t) {
    xe(e, t);
    const n = pe(t.value);
    const t_type = t.type;
    if (n != null) {
      t_type === `number`
        ? ((n === 0 && e.value === ``) || e.value != n) && (e.value = `` + n)
        : e.value !== `` + n && (e.value = `` + n);
    } else if (t_type === `submit` || t_type === `reset`) {
      e.removeAttribute(`value`);
      return;
    }
    if (t.hasOwnProperty(`value`)) {
      we(e, t.type, n);
    } else if (t.hasOwnProperty(`defaultValue`)) {
      we(e, t.type, pe(t.defaultValue));
    }
    if (t.checked == null && t.defaultChecked != null) {
      e.defaultChecked = !!t.defaultChecked;
    }
  }
  function Ce(e, t, n) {
    if (t.hasOwnProperty(`value`) || t.hasOwnProperty(`defaultValue`)) {
      const r = t.type;
      if (!(
        (r !== `submit` && r !== `reset`) ||
        (t.value !== undefined && t.value !== null)
      )) {
        return;
      }
      t = `` + e._wrapperState.initialValue;
      if (!(n || t === e.value)) {
        e.value = t;
      }
      e.defaultValue = t;
    }
    n = e.name;
    if (n !== ``) {
      e.name = ``;
    }
    e.defaultChecked = !!e._wrapperState.initialChecked;
    if (n !== ``) {
      e.name = n;
    }
  }
  function we(e, t, n) {
    (t !== `number` || ve(e.ownerDocument) !== e) &&
      (n == null
        ? (e.defaultValue = `` + e._wrapperState.initialValue)
        : e.defaultValue !== `` + n && (e.defaultValue = `` + n));
  }
  var Array_isArray = Array.isArray;
  function Ee(e, t, n, r) {
    e = e.options;
    if (t) {
      t = {};
      for (var i = 0; i < n.length; i++) {
        t[`$` + n[i]] = true;
      }
      for (n = 0; n < e.length; n++) {
        i = t.hasOwnProperty(`$` + e[n].value);
        if (e[n].selected !== i) {
          e[n].selected = i;
        }
        if (i && r) {
          e[n].defaultSelected = true;
        }
      }
    } else {
      n = `` + pe(n);
      t = null;
      for (i = 0; i < e.length; i++) {
        if (e[i].value === n) {
          e[i].selected = true;
          if (r) {
            e[i].defaultSelected = true;
          }
          return;
        }
        if (!(t !== null || e[i].disabled)) {
          t = e[i];
        }
      }
      if (t !== null) {
        t.selected = true;
      }
    }
  }
  function De(e, t) {
    if (t.dangerouslySetInnerHTML != null) {
      throw Error(i(91));
    }
    return Object_assign({}, t, {
      value: undefined,
      defaultValue: undefined,
      children: `` + e._wrapperState.initialValue,
    });
  }
  function Oe(e, t) {
    let t_value = t.value;
    if (t_value == null) {
      t_value = t.children;
      t = t.defaultValue;
      if (t_value != null) {
        if (t != null) {
          throw Error(i(92));
        }
        if (Array_isArray(t_value)) {
          if (t_value.length > 1) {
            throw Error(i(93));
          }
          t_value = t_value[0];
        }
        t = t_value;
      }
      t ??= ``;
      t_value = t;
    }
    e._wrapperState = {
      initialValue: pe(t_value),
    };
  }
  function ke(e, t) {
    let n = pe(t.value);
    const r = pe(t.defaultValue);
    if (n != null) {
      n = `` + n;
      if (n !== e.value) {
        e.value = n;
      }
      if (t.defaultValue == null && e.defaultValue !== n) {
        e.defaultValue = n;
      }
    }
    if (r != null) {
      e.defaultValue = `` + r;
    }
  }
  function Ae(e) {
    const e_textContent = e.textContent;
    if (
      e_textContent === e._wrapperState.initialValue &&
      e_textContent !== `` &&
      e_textContent !== null
    ) {
      e.value = e_textContent;
    }
  }
  function je(e) {
    switch (e) {
      case `svg`:
        return `http://www.w3.org/2000/svg`;
      case `math`:
        return `http://www.w3.org/1998/Math/MathML`;
      default:
        return `http://www.w3.org/1999/xhtml`;
    }
  }
  function Me(e, t) {
    if (e == null || e === `http://www.w3.org/1999/xhtml`) {
      return je(t);
    }
    if (e === `http://www.w3.org/2000/svg` && t === `foreignObject`) {
      return `http://www.w3.org/1999/xhtml`;
    }
    return e;
  }
  var Ne;
  var Pe = ((e) => {
    if (typeof MSApp < `u` && MSApp.execUnsafeLocalFunction) {
      return (t, n, r, i) => {
        MSApp.execUnsafeLocalFunction(() => e(t, n, r, i));
      };
    }
    return e;
  })((e, t) => {
    if (e.namespaceURI !== `http://www.w3.org/2000/svg` || `innerHTML` in e) {
      e.innerHTML = t;
    } else {
      Ne ||= document.createElement(`div`);
      Ne.innerHTML = `<svg>` + t.valueOf().toString() + `</svg>`;
      for (t = Ne.firstChild; e.firstChild;) {
        e.removeChild(e.firstChild);
      }
      while (t.firstChild) {
        e.appendChild(t.firstChild);
      }
    }
  });
  function Fe(e, t) {
    if (t) {
      const n = e.firstChild;
      if (n && n === e.lastChild && n.nodeType === 3) {
        n.nodeValue = t;
        return;
      }
    }
    e.textContent = t;
  }
  var Ie = {
    animationIterationCount: true,
    aspectRatio: true,
    borderImageOutset: true,
    borderImageSlice: true,
    borderImageWidth: true,
    boxFlex: true,
    boxFlexGroup: true,
    boxOrdinalGroup: true,
    columnCount: true,
    columns: true,
    flex: true,
    flexGrow: true,
    flexPositive: true,
    flexShrink: true,
    flexNegative: true,
    flexOrder: true,
    gridArea: true,
    gridRow: true,
    gridRowEnd: true,
    gridRowSpan: true,
    gridRowStart: true,
    gridColumn: true,
    gridColumnEnd: true,
    gridColumnSpan: true,
    gridColumnStart: true,
    fontWeight: true,
    lineClamp: true,
    lineHeight: true,
    opacity: true,
    order: true,
    orphans: true,
    tabSize: true,
    widows: true,
    zIndex: true,
    zoom: true,
    fillOpacity: true,
    floodOpacity: true,
    stopOpacity: true,
    strokeDasharray: true,
    strokeDashoffset: true,
    strokeMiterlimit: true,
    strokeOpacity: true,
    strokeWidth: true,
  };
  var Le = [`Webkit`, `ms`, `Moz`, `O`];
  Object.keys(Ie).forEach((e) => {
    Le.forEach((t) => {
      t = t + e.charAt(0).toUpperCase() + e.substring(1);
      Ie[t] = Ie[e];
    });
  });
  function P(e, t, n) {
    if (t == null || typeof t == `boolean` || t === ``) {
      return ``;
    }
    if (
      n ||
      typeof t != `number` ||
      t === 0 ||
      (Ie.hasOwnProperty(e) && Ie[e])
    ) {
      return (`` + t).trim();
    }
    return t + `px`;
  }
  function Re(e, t) {
    e = e.style;
    for (let n in t) {
      if (t.hasOwnProperty(n)) {
        const r = n.indexOf(`--`) === 0;
        const i = P(n, t[n], r);
        if (n === `float`) {
          n = `cssFloat`;
        }
        if (r) {
          e.setProperty(n, i);
        } else {
          e[n] = i;
        }
      }
    }
  }
  var ze = Object_assign(
    {
      menuitem: true,
    },
    {
      area: true,
      base: true,
      br: true,
      col: true,
      embed: true,
      hr: true,
      img: true,
      input: true,
      keygen: true,
      link: true,
      meta: true,
      param: true,
      source: true,
      track: true,
      wbr: true,
    },
  );
  function Be(e, t) {
    if (t) {
      if (ze[e] && (t.children != null || t.dangerouslySetInnerHTML != null)) {
        throw Error(i(137, e));
      }
      if (t.dangerouslySetInnerHTML != null) {
        if (t.children != null) {
          throw Error(i(60));
        }
        if (
          typeof t.dangerouslySetInnerHTML != `object` ||
          !(`__html` in t.dangerouslySetInnerHTML)
        ) {
          throw Error(i(61));
        }
      }
      if (t.style != null && typeof t.style != `object`) {
        throw Error(i(62));
      }
    }
  }
  function Ve(e, t) {
    if (e.indexOf(`-`) === -1) {
      return typeof t.is == `string`;
    }
    switch (e) {
      case `annotation-xml`:
      case `color-profile`:
      case `font-face`:
      case `font-face-src`:
      case `font-face-uri`:
      case `font-face-format`:
      case `font-face-name`:
      case `missing-glyph`:
        return false;
      default:
        return true;
    }
  }
  var He = null;
  function F(e) {
    e = e.target || e.srcElement || window;
    if (e.correspondingUseElement) {
      e = e.correspondingUseElement;
    }
    if (e.nodeType === 3) {
      return e.parentNode;
    }
    return e;
  }
  var Ue = null;
  var We = null;
  var Ge = null;
  function Ke(e) {
    if ((e = Vi(e))) {
      if (typeof Ue != `function`) {
        throw Error(i(280));
      }
      let t = e.stateNode;
      if (t) {
        t = Ui(t);
        Ue(e.stateNode, e.type, t);
      }
    }
  }
  function qe(e) {
    if (We) {
      if (Ge) {
        Ge.push(e);
      } else {
        Ge = [e];
      }
    } else {
      We = e;
    }
  }
  function Je() {
    if (We) {
      let e = We;
      const t = Ge;
      We = null;
      Ge = null;
      Ke(e);
      if (t) {
        for (e = 0; e < t.length; e++) {
          Ke(t[e]);
        }
      }
    }
  }
  function Ye(e, t) {
    return e(t);
  }
  function Xe() {}
  var Ze = false;
  function Qe(e, t, n) {
    if (Ze) {
      return e(t, n);
    }
    Ze = true;
    try {
      return Ye(e, t, n);
    } finally {
      Ze = false;
      if (We !== null || Ge !== null) {
        Xe();
        Je();
      }
    }
  }
  function $e(e, t) {
    let e_stateNode = e.stateNode;
    if (e_stateNode === null) {
      return null;
    }
    let r = Ui(e_stateNode);
    if (r === null) {
      return null;
    }
    e_stateNode = r[t];
    a: switch (t) {
      case `onClick`:
      case `onClickCapture`:
      case `onDoubleClick`:
      case `onDoubleClickCapture`:
      case `onMouseDown`:
      case `onMouseDownCapture`:
      case `onMouseMove`:
      case `onMouseMoveCapture`:
      case `onMouseUp`:
      case `onMouseUpCapture`:
      case `onMouseEnter`:
        if (!(r = !r.disabled)) {
          e = e.type;
          r =
            e !== `button` &&
            e !== `input` &&
            e !== `select` &&
            e !== `textarea`;
        }
        e = !r;
        break a;
      default:
        e = false;
    }
    if (e) {
      return null;
    }
    if (e_stateNode && typeof e_stateNode != `function`) {
      throw Error(i(231, t, typeof e_stateNode));
    }
    return e_stateNode;
  }
  var et = false;
  if (l) {
    try {
      var tt = {};
      Object.defineProperty(tt, "passive", {
        get() {
          et = true;
        },
      });
      window.addEventListener(`test`, tt, tt);
      window.removeEventListener(`test`, tt, tt);
    } catch {
      et = false;
    }
  }
  function nt(e, t, n, r, i, a, o, s, c) {
    const l = Array.prototype.slice.call(arguments, 3);
    try {
      t.apply(n, l);
    } catch (error) {
      this.onError(error);
    }
  }
  var rt = false;
  var it = null;
  var at = false;
  var ot = null;
  var st = {
    onError(e) {
      rt = true;
      it = e;
    },
  };
  function ct(e, t, n, r, i, a, o, s, c) {
    rt = false;
    it = null;
    nt.apply(st, arguments);
  }
  function lt(e, t, n, r, a, o, s, c, l) {
    ct.apply(this, arguments);
    if (rt) {
      if (rt) {
        var u = it;
        rt = false;
        it = null;
      } else {
        throw Error(i(198));
      }
      if (!at) {
        at = true;
        ot = u;
      }
    }
  }
  function ut(e) {
    let t = e;
    let n = e;
    if (e.alternate) {
      while (t.return) {
        t = t.return;
      }
    } else {
      e = t;
      do {
        t = e;
        if (t.flags & 4098) {
          n = t.return;
        }
        e = t.return;
      } while (e);
    }
    if (t.tag === 3) {
      return n;
    }
    return null;
  }
  function dt(e) {
    if (e.tag === 13) {
      let t = e.memoizedState;
      if (t === null) {
        e = e.alternate;
        if (e !== null) {
          t = e.memoizedState;
        }
      }
      if (t !== null) {
        return t.dehydrated;
      }
    }
    return null;
  }
  function I(e) {
    if (ut(e) !== e) {
      throw Error(i(188));
    }
  }
  function ft(e) {
    let e_alternate = e.alternate;
    if (!e_alternate) {
      e_alternate = ut(e);
      if (e_alternate === null) {
        throw Error(i(188));
      }
      if (e_alternate === e) {
        return e;
      }
      return null;
    }
    let n = e;
    let r = e_alternate;
    while (true) {
      const a = n.return;
      if (a === null) {
        break;
      }
      let o = a.alternate;
      if (o === null) {
        r = a.return;
        if (r !== null) {
          n = r;
          continue;
        }
        break;
      }
      if (a.child === o.child) {
        for (o = a.child; o;) {
          if (o === n) {
            I(a);
            return e;
          }
          if (o === r) {
            I(a);
            return e_alternate;
          }
          o = o.sibling;
        }
        throw Error(i(188));
      }
      if (n.return !== r.return) {
        n = a;
        r = o;
      } else {
        let s = false;
        for (var c = a.child; c;) {
          if (c === n) {
            s = true;
            n = a;
            r = o;
            break;
          }
          if (c === r) {
            s = true;
            r = a;
            n = o;
            break;
          }
          c = c.sibling;
        }
        if (!s) {
          for (c = o.child; c;) {
            if (c === n) {
              s = true;
              n = o;
              r = a;
              break;
            }
            if (c === r) {
              s = true;
              r = o;
              n = a;
              break;
            }
            c = c.sibling;
          }
          if (!s) {
            throw Error(i(189));
          }
        }
      }
      if (n.alternate !== r) {
        throw Error(i(190));
      }
    }
    if (n.tag !== 3) {
      throw Error(i(188));
    }
    if (n.stateNode.current === n) {
      return e;
    }
    return e_alternate;
  }
  function pt(e) {
    e = ft(e);
    if (e === null) {
      return null;
    }
    return mt(e);
  }
  function mt(e) {
    if (e.tag === 5 || e.tag === 6) {
      return e;
    }
    for (e = e.child; e !== null;) {
      const t = mt(e);
      if (t !== null) {
        return t;
      }
      e = e.sibling;
    }
    return null;
  }
  var r_unstable_scheduleCallback = r.unstable_scheduleCallback;
  var r_unstable_cancelCallback = r.unstable_cancelCallback;
  var r_unstable_shouldYield = r.unstable_shouldYield;
  var r_unstable_requestPaint = r.unstable_requestPaint;
  var r_unstable_now = r.unstable_now;
  var r_unstable_getCurrentPriorityLevel = r.unstable_getCurrentPriorityLevel;
  var r_unstable_ImmediatePriority = r.unstable_ImmediatePriority;
  var r_unstable_UserBlockingPriority = r.unstable_UserBlockingPriority;
  var r_unstable_NormalPriority = r.unstable_NormalPriority;
  var r_unstable_LowPriority = r.unstable_LowPriority;
  var r_unstable_IdlePriority = r.unstable_IdlePriority;
  var Tt = null;
  var Et = null;
  function Dt(stateNode) {
    if (Et && typeof Et.onCommitFiberRoot == `function`) {
      try {
        Et.onCommitFiberRoot(
          Tt,
          stateNode,
          undefined,
          (stateNode.current.flags & 128) == 128,
        );
      } catch {}
    }
  }
  var Ot = Math.clz32 ? Math.clz32 : jt;
  var Math_log = Math.log;
  var Math_LN2 = Math.LN2;
  function jt(e) {
    e >>>= 0;
    if (e === 0) {
      return 32;
    }
    return (31 - ((Math_log(e) / Math_LN2) | 0)) | 0;
  }
  var Mt = 64;
  var Nt = 4194304;
  function Pt(e) {
    switch (e & -e) {
      case 1:
        return 1;
      case 2:
        return 2;
      case 4:
        return 4;
      case 8:
        return 8;
      case 16:
        return 16;
      case 32:
        return 32;
      case 64:
      case 128:
      case 256:
      case 512:
      case 1024:
      case 2048:
      case 4096:
      case 8192:
      case 16384:
      case 32768:
      case 65536:
      case 131072:
      case 262144:
      case 524288:
      case 1048576:
      case 2097152:
        return e & 4194240;
      case 4194304:
      case 8388608:
      case 16777216:
      case 33554432:
      case 67108864:
        return e & 130023424;
      case 134217728:
        return 134217728;
      case 268435456:
        return 268435456;
      case 536870912:
        return 536870912;
      case 1073741824:
        return 1073741824;
      default:
        return e;
    }
  }
  function Ft(e, t) {
    let e_pendingLanes = e.pendingLanes;
    if (e_pendingLanes === 0) {
      return 0;
    }
    let r = 0;
    let e_suspendedLanes = e.suspendedLanes;
    let e_pingedLanes = e.pingedLanes;
    let o = e_pendingLanes & 268435455;
    if (o !== 0) {
      const s = o & ~e_suspendedLanes;
      if (s === 0) {
        e_pingedLanes &= o;
        if (e_pingedLanes !== 0) {
          r = Pt(e_pingedLanes);
        }
      } else {
        r = Pt(s);
      }
    } else {
      o = e_pendingLanes & ~e_suspendedLanes;
      if (o === 0) {
        if (e_pingedLanes !== 0) {
          r = Pt(e_pingedLanes);
        }
      } else {
        r = Pt(o);
      }
    }
    if (r === 0) {
      return 0;
    }
    if (
      t !== 0 &&
      t !== r &&
      (t & e_suspendedLanes) === 0 &&
      ((e_suspendedLanes = r & -r),
      (e_pingedLanes = t & -t),
      e_suspendedLanes >= e_pingedLanes ||
        (e_suspendedLanes === 16 && e_pingedLanes & 4194240))
    ) {
      return t;
    }
    if (r & 4) {
      r |= e_pendingLanes & 16;
    }
    t = e.entangledLanes;
    if (t !== 0) {
      e = e.entanglements;
      for (t &= r; t > 0;) {
        e_pendingLanes = 31 - Ot(t);
        e_suspendedLanes = 1 << e_pendingLanes;
        r |= e[e_pendingLanes];
        t &= ~e_suspendedLanes;
      }
    }
    return r;
  }
  function It(e, t) {
    switch (e) {
      case 1:
      case 2:
      case 4:
        return t + 250;
      case 8:
      case 16:
      case 32:
      case 64:
      case 128:
      case 256:
      case 512:
      case 1024:
      case 2048:
      case 4096:
      case 8192:
      case 16384:
      case 32768:
      case 65536:
      case 131072:
      case 262144:
      case 524288:
      case 1048576:
      case 2097152:
        return t + 5000;
      case 4194304:
      case 8388608:
      case 16777216:
      case 33554432:
      case 67108864:
        return -1;
      case 134217728:
      case 268435456:
      case 536870912:
      case 1073741824:
        return -1;
      default:
        return -1;
    }
  }
  function Lt(e, t) {
    const { suspendedLanes, pingedLanes, expirationTimes } = e;
    for (let a = e.pendingLanes; a > 0;) {
      const o = 31 - Ot(a);
      const s = 1 << o;
      const c = expirationTimes[o];
      c === -1
        ? ((s & suspendedLanes) === 0 || (s & pingedLanes) !== 0) &&
          (expirationTimes[o] = It(s, t))
        : c <= t && (e.expiredLanes |= s);
      a &= ~s;
    }
  }
  function R(e) {
    e = e.pendingLanes & -1073741825;
    if (e === 0) {
      if (e & 1073741824) {
        return 1073741824;
      }
      return 0;
    }
    return e;
  }
  function Rt() {
    const e = Mt;
    Mt <<= 1;
    if (!(Mt & 4194240)) {
      Mt = 64;
    }
    return e;
  }
  function zt(e) {
    const t = [];
    for (let n = 0; n < 31; n++) {
      t.push(e);
    }
    return t;
  }
  function Bt(e, t, n) {
    e.pendingLanes |= t;
    if (t !== 536870912) {
      e.suspendedLanes = 0;
      e.pingedLanes = 0;
    }
    e = e.eventTimes;
    t = 31 - Ot(t);
    e[t] = n;
  }
  function Vt(e, t) {
    let n = e.pendingLanes & ~t;
    e.pendingLanes = t;
    e.suspendedLanes = 0;
    e.pingedLanes = 0;
    e.expiredLanes &= t;
    e.mutableReadLanes &= t;
    e.entangledLanes &= t;
    t = e.entanglements;
    const e_eventTimes = e.eventTimes;
    for (e = e.expirationTimes; n > 0;) {
      const i = 31 - Ot(n);
      const a = 1 << i;
      t[i] = 0;
      e_eventTimes[i] = -1;
      e[i] = -1;
      n &= ~a;
    }
  }
  function Ht(e, t) {
    let n = (e.entangledLanes |= t);
    for (e = e.entanglements; n;) {
      const r = 31 - Ot(n);
      const i = 1 << r;
      if ((i & t) | (e[r] & t)) {
        e[r] |= t;
      }
      n &= ~i;
    }
  }
  var z = 0;
  function Ut(e) {
    e &= -e;
    if (e > 1) {
      if (e > 4) {
        if (e & 268435455) {
          return 16;
        }
        return 536870912;
      }
      return 4;
    }
    return 1;
  }
  var Wt;
  var Gt;
  var Kt;
  var qt;
  var Jt;
  var Yt = false;
  var Xt = [];
  var Zt = null;
  var Qt = null;
  var $t = null;
  var en = new Map();
  var tn = new Map();
  var nn = [];
  var rn =
    `mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset submit`.split(
      ` `,
    );
  function B(e, t) {
    switch (e) {
      case `focusin`:
      case `focusout`:
        Zt = null;
        break;
      case `dragenter`:
      case `dragleave`:
        Qt = null;
        break;
      case `mouseover`:
      case `mouseout`:
        $t = null;
        break;
      case `pointerover`:
      case `pointerout`:
        en.delete(t.pointerId);
        break;
      case `gotpointercapture`:
      case `lostpointercapture`:
        tn.delete(t.pointerId);
    }
  }
  function an(e, blockedOn, domEventName, eventSystemFlags, i, nativeEvent) {
    if (e === null || e.nativeEvent !== nativeEvent) {
      return (
        (e = {
          blockedOn,
          domEventName,
          eventSystemFlags,
          nativeEvent,
          targetContainers: [i],
        }),
        blockedOn !== null &&
          ((blockedOn = Vi(blockedOn)), blockedOn !== null && Gt(blockedOn)),
        e
      );
    }
    return (
      (e.eventSystemFlags |= eventSystemFlags),
      (blockedOn = e.targetContainers),
      i !== null && blockedOn.indexOf(i) === -1 && blockedOn.push(i),
      e
    );
  }
  function on(e, t, n, r, i) {
    switch (t) {
      case `focusin`:
        Zt = an(Zt, e, t, n, r, i);
        return true;
      case `dragenter`:
        Qt = an(Qt, e, t, n, r, i);
        return true;
      case `mouseover`:
        $t = an($t, e, t, n, r, i);
        return true;
      case `pointerover`:
        var a = i.pointerId;
        en.set(a, an(en.get(a) || null, e, t, n, r, i));
        return true;
      case `gotpointercapture`:
        a = i.pointerId;
        tn.set(a, an(tn.get(a) || null, e, t, n, r, i));
        return true;
    }
    return false;
  }
  function sn(e) {
    let t = findFiberByHostInstance(e.target);
    if (t !== null) {
      const n = ut(t);
      if (n !== null) {
        t = n.tag;
        if (t === 13) {
          t = dt(n);
          if (t !== null) {
            e.blockedOn = t;
            Jt(e.priority, () => {
              Kt(n);
            });
            return;
          }
        } else if (t === 3 && n.stateNode.current.memoizedState.isDehydrated) {
          e.blockedOn = n.tag === 3 ? n.stateNode.containerInfo : null;
          return;
        }
      }
    }
    e.blockedOn = null;
  }
  function cn(e) {
    if (e.blockedOn !== null) {
      return false;
    }
    for (let t = e.targetContainers; t.length > 0;) {
      let n = yn(e.domEventName, e.eventSystemFlags, t[0], e.nativeEvent);
      if (n === null) {
        n = e.nativeEvent;
        const r = new n.constructor(n.type, n);
        He = r;
        n.target.dispatchEvent(r);
        He = null;
      } else {
        t = Vi(n);
        if (t !== null) {
          Gt(t);
        }
        e.blockedOn = n;
        return false;
      }
      t.shift();
    }
    return true;
  }
  function ln(e, t, n) {
    if (cn(e)) {
      n.delete(t);
    }
  }
  function un() {
    Yt = false;
    if (Zt !== null && cn(Zt)) {
      Zt = null;
    }
    if (Qt !== null && cn(Qt)) {
      Qt = null;
    }
    if ($t !== null && cn($t)) {
      $t = null;
    }
    en.forEach(ln);
    tn.forEach(ln);
  }
  function dn(e, t) {
    if (e.blockedOn === t) {
      e.blockedOn = null;
      if (!Yt) {
        Yt = true;
        r.unstable_scheduleCallback(r.unstable_NormalPriority, un);
      }
    }
  }
  function fn(e) {
    function t(t) {
      return dn(t, e);
    }
    if (Xt.length > 0) {
      dn(Xt[0], e);
      for (var n = 1; n < Xt.length; n++) {
        var r = Xt[n];
        if (r.blockedOn === e) {
          r.blockedOn = null;
        }
      }
    }
    if (Zt !== null) {
      dn(Zt, e);
    }
    if (Qt !== null) {
      dn(Qt, e);
    }
    if ($t !== null) {
      dn($t, e);
    }
    en.forEach(t);
    tn.forEach(t);
    for (n = 0; n < nn.length; n++) {
      r = nn[n];
      if (r.blockedOn === e) {
        r.blockedOn = null;
      }
    }
    while (nn.length > 0 && ((n = nn[0]), n.blockedOn === null)) {
      sn(n);
      if (n.blockedOn === null) {
        nn.shift();
      }
    }
  }
  var C_ReactCurrentBatchConfig =
    n___SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentBatchConfig;
  var mn = true;
  function hn(e, t, n, r) {
    const i = z;
    const C_ReactCurrentBatchConfig_transition =
      C_ReactCurrentBatchConfig.transition;
    C_ReactCurrentBatchConfig.transition = null;
    try {
      z = 1;
      _n(e, t, n, r);
    } finally {
      z = i;
      C_ReactCurrentBatchConfig.transition =
        C_ReactCurrentBatchConfig_transition;
    }
  }
  function gn(e, t, n, r) {
    const i = z;
    const C_ReactCurrentBatchConfig_transition =
      C_ReactCurrentBatchConfig.transition;
    C_ReactCurrentBatchConfig.transition = null;
    try {
      z = 4;
      _n(e, t, n, r);
    } finally {
      z = i;
      C_ReactCurrentBatchConfig.transition =
        C_ReactCurrentBatchConfig_transition;
    }
  }
  function _n(e, t, n, r) {
    if (mn) {
      let i = yn(e, t, n, r);
      if (i === null) {
        fi(e, t, r, vn, n);
        B(e, r);
      } else if (on(i, e, t, n, r)) {
        r.stopPropagation();
      } else {
        B(e, r);
        if (t & 4 && -1 < rn.indexOf(e)) {
          while (i !== null) {
            let a = Vi(i);
            if (a !== null) {
              Wt(a);
            }
            a = yn(e, t, n, r);
            if (a === null) {
              fi(e, t, r, vn, n);
            }
            if (a === i) {
              break;
            }
            i = a;
          }
          if (i !== null) {
            r.stopPropagation();
          }
        } else {
          fi(e, t, r, null, n);
        }
      }
    }
  }
  var vn = null;
  function yn(e, t, n, r) {
    vn = null;
    e = F(r);
    e = findFiberByHostInstance(e);
    if (e !== null) {
      t = ut(e);
      if (t === null) {
        e = null;
      } else {
        n = t.tag;
        if (n === 13) {
          e = dt(t);
          if (e !== null) {
            return e;
          }
          e = null;
        } else if (n === 3) {
          if (t.stateNode.current.memoizedState.isDehydrated) {
            if (t.tag === 3) {
              return t.stateNode.containerInfo;
            }
            return null;
          }
          e = null;
        } else {
          if (t !== e) {
            e = null;
          }
        }
      }
    }
    vn = e;
    return null;
  }
  function bn(e) {
    switch (e) {
      case `cancel`:
      case `click`:
      case `close`:
      case `contextmenu`:
      case `copy`:
      case `cut`:
      case `auxclick`:
      case `dblclick`:
      case `dragend`:
      case `dragstart`:
      case `drop`:
      case `focusin`:
      case `focusout`:
      case `input`:
      case `invalid`:
      case `keydown`:
      case `keypress`:
      case `keyup`:
      case `mousedown`:
      case `mouseup`:
      case `paste`:
      case `pause`:
      case `play`:
      case `pointercancel`:
      case `pointerdown`:
      case `pointerup`:
      case `ratechange`:
      case `reset`:
      case `resize`:
      case `seeked`:
      case `submit`:
      case `touchcancel`:
      case `touchend`:
      case `touchstart`:
      case `volumechange`:
      case `change`:
      case `selectionchange`:
      case `textInput`:
      case `compositionstart`:
      case `compositionend`:
      case `compositionupdate`:
      case `beforeblur`:
      case `afterblur`:
      case `beforeinput`:
      case `blur`:
      case `fullscreenchange`:
      case `focus`:
      case `hashchange`:
      case `popstate`:
      case `select`:
      case `selectstart`:
        return 1;
      case `drag`:
      case `dragenter`:
      case `dragexit`:
      case `dragleave`:
      case `dragover`:
      case `mousemove`:
      case `mouseout`:
      case `mouseover`:
      case `pointermove`:
      case `pointerout`:
      case `pointerover`:
      case `scroll`:
      case `toggle`:
      case `touchmove`:
      case `wheel`:
      case `mouseenter`:
      case `mouseleave`:
      case `pointerenter`:
      case `pointerleave`:
        return 4;
      case `message`:
        switch (r_unstable_getCurrentPriorityLevel()) {
          case r_unstable_ImmediatePriority:
            return 1;
          case r_unstable_UserBlockingPriority:
            return 4;
          case r_unstable_NormalPriority:
          case r_unstable_LowPriority:
            return 16;
          case r_unstable_IdlePriority:
            return 536870912;
          default:
            return 16;
        }
      default:
        return 16;
    }
  }
  var xn = null;
  var Sn = null;
  var Cn = null;
  function wn() {
    if (Cn) {
      return Cn;
    }
    let e;
    const t = Sn;
    const t_length = t.length;
    let r;
    const i = `value` in xn ? xn.value : xn.textContent;
    const i_length = i.length;
    for (e = 0; e < t_length && t[e] === i[e]; e++);
    const o = t_length - e;
    for (r = 1; r <= o && t[t_length - r] === i[i_length - r]; r++);
    return (Cn = i.slice(e, r > 1 ? 1 - r : undefined));
  }
  function Tn(e) {
    const e_keyCode = e.keyCode;
    if (`charCode` in e) {
      e = e.charCode;
      if (e === 0 && e_keyCode === 13) {
        e = 13;
      }
    } else {
      e = e_keyCode;
    }
    if (e === 10) {
      e = 13;
    }
    if (e >= 32 || e === 13) {
      return e;
    }
    return 0;
  }
  function isPersistent() {
    return true;
  }
  function Dn() {
    return false;
  }
  function On(e) {
    function t(t, n, r, i, a) {
      this._reactName = t;
      this._targetInst = r;
      this.type = n;
      this.nativeEvent = i;
      this.target = a;
      this.currentTarget = null;
      for (const o in e) {
        if (e.hasOwnProperty(o)) {
          t = e[o];
          this[o] = t ? t(i) : i[o];
        }
      }
      this.isDefaultPrevented =
        (i.defaultPrevented ?? i.returnValue === false) ? isPersistent : Dn;
      this.isPropagationStopped = Dn;
      return this;
    }
    Object_assign(t.prototype, {
      preventDefault() {
        this.defaultPrevented = true;
        const nativeEvent = this.nativeEvent;
        if (nativeEvent) {
          if (nativeEvent.preventDefault) {
            nativeEvent.preventDefault();
          } else if (typeof nativeEvent.returnValue != `unknown`) {
            nativeEvent.returnValue = false;
          }
          this.isDefaultPrevented = isPersistent;
        }
      },
      stopPropagation() {
        const nativeEvent = this.nativeEvent;
        if (nativeEvent) {
          if (nativeEvent.stopPropagation) {
            nativeEvent.stopPropagation();
          } else if (typeof nativeEvent.cancelBubble != `unknown`) {
            nativeEvent.cancelBubble = true;
          }
          this.isPropagationStopped = isPersistent;
        }
      },
      persist() {},
      isPersistent,
    });
    return t;
  }
  var kn = {
    eventPhase: 0,
    bubbles: 0,
    cancelable: 0,
    timeStamp(e) {
      return e.timeStamp || Date.now();
    },
    defaultPrevented: 0,
    isTrusted: 0,
  };
  var An = On(kn);
  var jn = Object_assign({}, kn, {
    view: 0,
    detail: 0,
  });
  var Mn = On(jn);
  var Nn;
  var Pn;
  var Fn;
  var In = Object_assign({}, jn, {
    screenX: 0,
    screenY: 0,
    clientX: 0,
    clientY: 0,
    pageX: 0,
    pageY: 0,
    ctrlKey: 0,
    shiftKey: 0,
    altKey: 0,
    metaKey: 0,
    getModifierState,
    button: 0,
    buttons: 0,
    relatedTarget(e) {
      if (e.relatedTarget === undefined) {
        if (e.fromElement === e.srcElement) {
          return e.toElement;
        }
        return e.fromElement;
      }
      return e.relatedTarget;
    },
    movementX(e) {
      if (`movementX` in e) {
        return e.movementX;
      }
      return (
        e !== Fn &&
          (Fn && e.type === `mousemove`
            ? ((Nn = e.screenX - Fn.screenX), (Pn = e.screenY - Fn.screenY))
            : (Pn = Nn = 0),
          (Fn = e)),
        Nn
      );
    },
    movementY(e) {
      if (`movementY` in e) {
        return e.movementY;
      }
      return Pn;
    },
  });
  var Ln = On(In);
  var Rn = On(
    Object_assign({}, In, {
      dataTransfer: 0,
    }),
  );
  var zn = On(
    Object_assign({}, jn, {
      relatedTarget: 0,
    }),
  );
  var Bn = On(
    Object_assign({}, kn, {
      animationName: 0,
      elapsedTime: 0,
      pseudoElement: 0,
    }),
  );
  var Vn = On(
    Object_assign({}, kn, {
      clipboardData(e) {
        if (`clipboardData` in e) {
          return e.clipboardData;
        }
        return window.clipboardData;
      },
    }),
  );
  var Hn = On(
    Object_assign({}, kn, {
      data: 0,
    }),
  );
  var Un = {
    Esc: `Escape`,
    Spacebar: ` `,
    Left: `ArrowLeft`,
    Up: `ArrowUp`,
    Right: `ArrowRight`,
    Down: `ArrowDown`,
    Del: `Delete`,
    Win: `OS`,
    Menu: `ContextMenu`,
    Apps: `ContextMenu`,
    Scroll: `ScrollLock`,
    MozPrintableKey: `Unidentified`,
  };
  var Wn = {
    8: `Backspace`,
    9: `Tab`,
    12: `Clear`,
    13: `Enter`,
    16: `Shift`,
    17: `Control`,
    18: `Alt`,
    19: `Pause`,
    20: `CapsLock`,
    27: `Escape`,
    32: ` `,
    33: `PageUp`,
    34: `PageDown`,
    35: `End`,
    36: `Home`,
    37: `ArrowLeft`,
    38: `ArrowUp`,
    39: `ArrowRight`,
    40: `ArrowDown`,
    45: `Insert`,
    46: `Delete`,
    112: `F1`,
    113: `F2`,
    114: `F3`,
    115: `F4`,
    116: `F5`,
    117: `F6`,
    118: `F7`,
    119: `F8`,
    120: `F9`,
    121: `F10`,
    122: `F11`,
    123: `F12`,
    144: `NumLock`,
    145: `ScrollLock`,
    224: `Meta`,
  };
  var Gn = {
    Alt: `altKey`,
    Control: `ctrlKey`,
    Meta: `metaKey`,
    Shift: `shiftKey`,
  };
  function Kn(e) {
    const nativeEvent = this.nativeEvent;
    if (nativeEvent.getModifierState) {
      return nativeEvent.getModifierState(e);
    }
    if ((e = Gn[e])) {
      return !!nativeEvent[e];
    }
    return false;
  }
  function getModifierState() {
    return Kn;
  }
  var Jn = On(
    Object_assign({}, jn, {
      key(e) {
        if (e.key) {
          const t = Un[e.key] || e.key;
          if (t !== `Unidentified`) {
            return t;
          }
        }
        if (e.type === `keypress`) {
          return ((e = Tn(e)), e === 13 ? `Enter` : String.fromCharCode(e));
        }
        if (e.type === `keydown` || e.type === `keyup`) {
          return Wn[e.keyCode] || `Unidentified`;
        }
        return ``;
      },
      code: 0,
      location: 0,
      ctrlKey: 0,
      shiftKey: 0,
      altKey: 0,
      metaKey: 0,
      repeat: 0,
      locale: 0,
      getModifierState,
      charCode(e) {
        if (e.type === `keypress`) {
          return Tn(e);
        }
        return 0;
      },
      keyCode(e) {
        if (e.type === `keydown` || e.type === `keyup`) {
          return e.keyCode;
        }
        return 0;
      },
      which(e) {
        if (e.type === `keypress`) {
          return Tn(e);
        }
        if (e.type === `keydown` || e.type === `keyup`) {
          return e.keyCode;
        }
        return 0;
      },
    }),
  );
  var Yn = On(
    Object_assign({}, In, {
      pointerId: 0,
      width: 0,
      height: 0,
      pressure: 0,
      tangentialPressure: 0,
      tiltX: 0,
      tiltY: 0,
      twist: 0,
      pointerType: 0,
      isPrimary: 0,
    }),
  );
  var Xn = On(
    Object_assign({}, jn, {
      touches: 0,
      targetTouches: 0,
      changedTouches: 0,
      altKey: 0,
      metaKey: 0,
      ctrlKey: 0,
      shiftKey: 0,
      getModifierState,
    }),
  );
  var Zn = On(
    Object_assign({}, kn, {
      propertyName: 0,
      elapsedTime: 0,
      pseudoElement: 0,
    }),
  );
  var Qn = On(
    Object_assign({}, In, {
      deltaX(e) {
        if (`deltaX` in e) {
          return e.deltaX;
        }
        if (`wheelDeltaX` in e) {
          return -e.wheelDeltaX;
        }
        return 0;
      },
      deltaY(e) {
        if (`deltaY` in e) {
          return e.deltaY;
        }
        if (`wheelDeltaY` in e) {
          return -e.wheelDeltaY;
        }
        if (`wheelDelta` in e) {
          return -e.wheelDelta;
        }
        return 0;
      },
      deltaZ: 0,
      deltaMode: 0,
    }),
  );
  var $n = [9, 13, 27, 32];
  var er = l && `CompositionEvent` in window;
  var tr = null;
  if (l && `documentMode` in document) {
    tr = document.documentMode;
  }
  var nr = l && `TextEvent` in window && !tr;
  var rr = l && (!er || (tr && tr > 8 && tr <= 11));
  var ir = ` `;
  var ar = false;
  function or(e, t) {
    switch (e) {
      case `keyup`:
        return $n.indexOf(t.keyCode) !== -1;
      case `keydown`:
        return t.keyCode !== 229;
      case `keypress`:
      case `mousedown`:
      case `focusout`:
        return true;
      default:
        return false;
    }
  }
  function sr(e) {
    e = e.detail;
    if (typeof e == `object` && `data` in e) {
      return e.data;
    }
    return null;
  }
  var cr = false;
  function lr(e, t) {
    switch (e) {
      case `compositionend`:
        return sr(t);
      case `keypress`:
        if (t.which === 32) {
          return ((ar = true), ir);
        }
        return null;
      case `textInput`:
        e = t.data;
        if (e === ir && ar) {
          return null;
        }
        return e;
      default:
        return null;
    }
  }
  function ur(e, t) {
    if (cr) {
      if (e === `compositionend` || (!er && or(e, t))) {
        return ((e = wn()), (Cn = Sn = xn = null), (cr = false), e);
      }
      return null;
    }
    switch (e) {
      case `paste`:
        return null;
      case `keypress`:
        if (!(t.ctrlKey || t.altKey || t.metaKey) || (t.ctrlKey && t.altKey)) {
          if (t.char && t.char.length > 1) {
            return t.char;
          }
          if (t.which) {
            return String.fromCharCode(t.which);
          }
        }
        return null;
      case `compositionend`:
        if (rr && t.locale !== `ko`) {
          return null;
        }
        return t.data;
      default:
        return null;
    }
  }
  var dr = {
    color: true,
    date: true,
    datetime: true,
    "datetime-local": true,
    email: true,
    month: true,
    number: true,
    password: true,
    range: true,
    search: true,
    tel: true,
    text: true,
    time: true,
    url: true,
    week: true,
  };
  function fr(e) {
    const t = e && e.nodeName && e.nodeName.toLowerCase();
    if (t === `input`) {
      return !!dr[e.type];
    }
    return t === `textarea`;
  }
  function pr(e, t, n, r) {
    qe(r);
    t = mi(t, `onChange`);
    if (t.length > 0) {
      n = new An(`onChange`, `change`, null, n, r);
      e.push({
        event: n,
        listeners: t,
      });
    }
  }
  var mr = null;
  var hr = null;
  function gr(e) {
    si(e, 0);
  }
  function _r(e) {
    if (_e(Hi(e))) {
      return e;
    }
  }
  function vr(e, t) {
    if (e === `change`) {
      return t;
    }
  }
  var yr = false;
  if (l) {
    var br;
    if (l) {
      var xr = `oninput` in document;
      if (!xr) {
        var Sr = document.createElement(`div`);
        Sr.setAttribute(`oninput`, `return;`);
        xr = typeof Sr.oninput == `function`;
      }
      br = xr;
    } else {
      br = false;
    }
    yr = br && (!document.documentMode || document.documentMode > 9);
  }
  function Cr() {
    if (mr) {
      mr.detachEvent(`onpropertychange`, wr);
      hr = mr = null;
    }
  }
  function wr(e) {
    if (e.propertyName === `value` && _r(hr)) {
      const t = [];
      pr(t, hr, e, F(e));
      Qe(gr, t);
    }
  }
  function Tr(e, t, n) {
    if (e === `focusin`) {
      Cr();
      mr = t;
      hr = n;
      mr.attachEvent(`onpropertychange`, wr);
    } else if (e === `focusout`) {
      Cr();
    }
  }
  function Er(e) {
    if (e === `selectionchange` || e === `keyup` || e === `keydown`) {
      return _r(hr);
    }
  }
  function Dr(e, t) {
    if (e === `click`) {
      return _r(t);
    }
  }
  function Or(e, t) {
    if (e === `input` || e === `change`) {
      return _r(t);
    }
  }
  function kr(e, t) {
    return (e === t && (e !== 0 || 1 / e == 1 / t)) || (e !== e && t !== t);
  }
  var Ar = typeof Object.is == `function` ? Object.is : kr;
  function jr(e, t) {
    if (Ar(e, t)) {
      return true;
    }
    if (typeof e != `object` || !e || typeof t != `object` || !t) {
      return false;
    }
    const n = Object.keys(e);
    let r = Object.keys(t);
    if (n.length !== r.length) {
      return false;
    }
    for (r = 0; r < n.length; r++) {
      const i = n[r];
      if (!hasOwnProperty.call(t, i) || !Ar(e[i], t[i])) {
        return false;
      }
    }
    return true;
  }
  function Mr(e) {
    while (e && e.firstChild) {
      e = e.firstChild;
    }
    return e;
  }
  function Nr(e, t) {
    let node = Mr(e);
    e = 0;
    let r;
    while (node) {
      if (node.nodeType === 3) {
        r = e + node.textContent.length;
        if (e <= t && r >= t) {
          return {
            node,
            offset: t - e,
          };
        }
        e = r;
      }
      a: {
        while (node) {
          if (node.nextSibling) {
            node = node.nextSibling;
            break a;
          }
          node = node.parentNode;
        }
        node = undefined;
      }
      node = Mr(node);
    }
  }
  function Pr(e, t) {
    if (e && t) {
      if (e === t) {
        return true;
      }
      if (e && e.nodeType === 3) {
        return false;
      }
      if (t && t.nodeType === 3) {
        return Pr(e, t.parentNode);
      }
      if (`contains` in e) {
        return e.contains(t);
      }
      if (e.compareDocumentPosition) {
        return !!(e.compareDocumentPosition(t) & 16);
      }
      return false;
    }
    return false;
  }
  function Fr() {
    for (var e = window, t = ve(); t instanceof e.HTMLIFrameElement;) {
      try {
        var n = typeof t.contentWindow.location.href == `string`;
      } catch {
        n = false;
      }
      if (n) {
        e = t.contentWindow;
      } else {
        break;
      }
      t = ve(e.document);
    }
    return t;
  }
  function Ir(e) {
    const t = e && e.nodeName && e.nodeName.toLowerCase();
    return (
      t &&
      ((t === `input` &&
        (e.type === `text` ||
          e.type === `search` ||
          e.type === `tel` ||
          e.type === `url` ||
          e.type === `password`)) ||
        t === `textarea` ||
        e.contentEditable === `true`)
    );
  }
  function Lr(e) {
    let t = Fr();
    let e_focusedElem = e.focusedElem;
    let e_selectionRange = e.selectionRange;
    if (
      t !== e_focusedElem &&
      e_focusedElem &&
      e_focusedElem.ownerDocument &&
      Pr(e_focusedElem.ownerDocument.documentElement, e_focusedElem)
    ) {
      if (e_selectionRange !== null && Ir(e_focusedElem)) {
        t = e_selectionRange.start;
        e = e_selectionRange.end;
        if (e === undefined) {
          e = t;
        }
        if (`selectionStart` in e_focusedElem) {
          e_focusedElem.selectionStart = t;
          e_focusedElem.selectionEnd = Math.min(e, e_focusedElem.value.length);
        } else {
          e =
            ((t = e_focusedElem.ownerDocument || document) && t.defaultView) ||
            window;
          if (e.getSelection) {
            e = e.getSelection();
            let i = e_focusedElem.textContent.length;
            let a = Math.min(e_selectionRange.start, i);
            e_selectionRange =
              e_selectionRange.end === undefined
                ? a
                : Math.min(e_selectionRange.end, i);
            if (!e.extend && a > e_selectionRange) {
              i = e_selectionRange;
              e_selectionRange = a;
              a = i;
            }
            i = Nr(e_focusedElem, a);
            const o = Nr(e_focusedElem, e_selectionRange);
            if (
              i &&
              o &&
              (e.rangeCount !== 1 ||
                e.anchorNode !== i.node ||
                e.anchorOffset !== i.offset ||
                e.focusNode !== o.node ||
                e.focusOffset !== o.offset)
            ) {
              t = t.createRange();
              t.setStart(i.node, i.offset);
              e.removeAllRanges();
              if (a > e_selectionRange) {
                e.addRange(t);
                e.extend(o.node, o.offset);
              } else {
                t.setEnd(o.node, o.offset);
                e.addRange(t);
              }
            }
          }
        }
      }
      t = [];
      for (e = e_focusedElem; (e = e.parentNode);) {
        if (e.nodeType === 1) {
          t.push({
            element: e,
            left: e.scrollLeft,
            top: e.scrollTop,
          });
        }
      }
      if (typeof e_focusedElem.focus == `function`) {
        e_focusedElem.focus();
      }
      for (e_focusedElem = 0; e_focusedElem < t.length; e_focusedElem++) {
        e = t[e_focusedElem];
        e.element.scrollLeft = e.left;
        e.element.scrollTop = e.top;
      }
    }
  }
  var Rr = l && `documentMode` in document && document.documentMode <= 11;
  var zr = null;
  var Br = null;
  var Vr = null;
  var Hr = false;
  function Ur(e, t, n) {
    let r =
      n.window === n ? n.document : n.nodeType === 9 ? n : n.ownerDocument;
    if (!(Hr || zr == null || zr !== ve(r))) {
      r = zr;
      if (`selectionStart` in r && Ir(r)) {
        r = {
          start: r.selectionStart,
          end: r.selectionEnd,
        };
      } else {
        r = (
          (r.ownerDocument && r.ownerDocument.defaultView) ||
          window
        ).getSelection();
        r = {
          anchorNode: r.anchorNode,
          anchorOffset: r.anchorOffset,
          focusNode: r.focusNode,
          focusOffset: r.focusOffset,
        };
      }
      if (!(Vr && jr(Vr, r))) {
        Vr = r;
        r = mi(Br, `onSelect`);
        if (r.length > 0) {
          t = new An(`onSelect`, `select`, null, t, n);
          e.push({
            event: t,
            listeners: r,
          });
          t.target = zr;
        }
      }
    }
  }
  function Wr(e, t) {
    const n = {};
    n[e.toLowerCase()] = t.toLowerCase();
    n[`Webkit` + e] = `webkit` + t;
    n[`Moz` + e] = `moz` + t;
    return n;
  }
  var Gr = {
    animationend: Wr(`Animation`, `AnimationEnd`),
    animationiteration: Wr(`Animation`, `AnimationIteration`),
    animationstart: Wr(`Animation`, `AnimationStart`),
    transitionend: Wr(`Transition`, `TransitionEnd`),
  };
  var Kr = {};
  var qr = {};
  if (l) {
    qr = document.createElement(`div`).style;
    `AnimationEvent` in window ||
      (delete Gr.animationend.animation,
      delete Gr.animationiteration.animation,
      delete Gr.animationstart.animation);
    `TransitionEvent` in window || delete Gr.transitionend.transition;
  }
  function Jr(e) {
    if (Kr[e]) {
      return Kr[e];
    }
    if (!Gr[e]) {
      return e;
    }
    const t = Gr[e];
    let n;
    for (n in t) {
      if (t.hasOwnProperty(n) && n in qr) {
        return (Kr[e] = t[n]);
      }
    }
    return e;
  }
  var Yr = Jr(`animationend`);
  var Xr = Jr(`animationiteration`);
  var Zr = Jr(`animationstart`);
  var Qr = Jr(`transitionend`);
  var $r = new Map();
  var ei =
    `abort auxClick cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel`.split(
      ` `,
    );
  function ti(e, t) {
    $r.set(e, t);
    s(t, [e]);
  }
  for (var ri of ei) {
    ti(ri.toLowerCase(), `on` + (ri[0].toUpperCase() + ri.slice(1)));
  }
  ti(Yr, `onAnimationEnd`);
  ti(Xr, `onAnimationIteration`);
  ti(Zr, `onAnimationStart`);
  ti(`dblclick`, `onDoubleClick`);
  ti(`focusin`, `onFocus`);
  ti(`focusout`, `onBlur`);
  ti(Qr, `onTransitionEnd`);
  c(`onMouseEnter`, [`mouseout`, `mouseover`]);
  c(`onMouseLeave`, [`mouseout`, `mouseover`]);
  c(`onPointerEnter`, [`pointerout`, `pointerover`]);
  c(`onPointerLeave`, [`pointerout`, `pointerover`]);
  s(
    `onChange`,
    `change click focusin focusout input keydown keyup selectionchange`.split(
      ` `,
    ),
  );
  s(
    `onSelect`,
    `focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange`.split(
      ` `,
    ),
  );
  s(`onBeforeInput`, [`compositionend`, `keypress`, `textInput`, `paste`]);
  s(
    `onCompositionEnd`,
    `compositionend focusout keydown keypress keyup mousedown`.split(` `),
  );
  s(
    `onCompositionStart`,
    `compositionstart focusout keydown keypress keyup mousedown`.split(` `),
  );
  s(
    `onCompositionUpdate`,
    `compositionupdate focusout keydown keypress keyup mousedown`.split(` `),
  );
  var ii =
    `abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting`.split(
      ` `,
    );
  var ai = new Set(
    `cancel close invalid load scroll toggle`.split(` `).concat(ii),
  );
  function oi(e, t, n) {
    const r = e.type || `unknown-event`;
    e.currentTarget = n;
    lt(r, t, undefined, e);
    e.currentTarget = null;
  }
  function si(e, t) {
    t = !!(t & 4);
    for (let r of e) {
      const i = r.event;
      r = r.listeners;
      a: {
        let a;
        if (t) {
          for (var o = r.length - 1; o >= 0; o--) {
            var s = r[o];
            var c = s.instance;
            var l = s.currentTarget;
            s = s.listener;
            if (c !== a && i.isPropagationStopped()) {
              break a;
            }
            oi(i, s, l);
            a = c;
          }
        } else {
          for (o = 0; o < r.length; o++) {
            s = r[o];
            c = s.instance;
            l = s.currentTarget;
            s = s.listener;
            if (c !== a && i.isPropagationStopped()) {
              break a;
            }
            oi(i, s, l);
            a = c;
          }
        }
      }
    }
    if (at) {
      e = ot;
      at = false;
      ot = null;
      throw e;
    }
  }
  function V(e, t) {
    let n = t[Li];
    if (n === undefined) {
      n = t[Li] = new Set();
    }
    const r = e + `__bubble`;
    if (!n.has(r)) {
      di(t, e, 2, false);
      n.add(r);
    }
  }
  function ci(e, t, n) {
    let r = 0;
    if (t) {
      r |= 4;
    }
    di(n, e, r, t);
  }
  var li = `_reactListening` + Math.random().toString(36).slice(2);
  function ui(e) {
    if (!e[li]) {
      e[li] = true;
      a.forEach((t) => {
        if (t !== `selectionchange`) {
          if (!ai.has(t)) {
            ci(t, false, e);
          }
          ci(t, true, e);
        }
      });
      const t = e.nodeType === 9 ? e : e.ownerDocument;
      if (!(t === null || t[li])) {
        t[li] = true;
        ci(`selectionchange`, false, t);
      }
    }
  }
  function di(e, t, n, r) {
    switch (bn(t)) {
      case 1:
        var passive = hn;
        break;
      case 4:
        passive = gn;
        break;
      default:
        passive = _n;
    }
    n = passive.bind(null, t, n, e);
    passive = undefined;
    if (!(!et || (t !== `touchstart` && t !== `touchmove` && t !== `wheel`))) {
      passive = true;
    }
    r
      ? passive === undefined
        ? e.addEventListener(t, n, true)
        : e.addEventListener(t, n, {
            capture: true,
            passive,
          })
      : passive === undefined
        ? e.addEventListener(t, n, false)
        : e.addEventListener(t, n, {
            passive,
          });
  }
  function fi(e, t, n, r, i) {
    let a = r;
    if (!(t & 1) && !(t & 2) && r !== null) {
      a: while (true) {
        if (r === null) {
          return;
        }
        let o = r.tag;
        if (o === 3 || o === 4) {
          let s = r.stateNode.containerInfo;
          if (s === i || (s.nodeType === 8 && s.parentNode === i)) {
            break;
          }
          if (o === 4) {
            for (o = r.return; o !== null;) {
              var c = o.tag;
              if (
                (c === 3 || c === 4) &&
                ((c = o.stateNode.containerInfo),
                c === i || (c.nodeType === 8 && c.parentNode === i))
              ) {
                return;
              }
              o = o.return;
            }
          }
          while (s !== null) {
            o = findFiberByHostInstance(s);
            if (o === null) {
              return;
            }
            c = o.tag;
            if (c === 5 || c === 6) {
              a = o;
              r = o;
              continue a;
            }
            s = s.parentNode;
          }
        }
        r = r.return;
      }
    }
    Qe(() => {
      let r = a;
      let i = F(n);
      const o = [];
      a: {
        var s = $r.get(e);
        if (s !== undefined) {
          var c = An;
          var l = e;
          switch (e) {
            case `keypress`:
              if (Tn(n) === 0) {
                break a;
              }
            case `keydown`:
            case `keyup`:
              c = Jn;
              break;
            case `focusin`:
              l = `focus`;
              c = zn;
              break;
            case `focusout`:
              l = `blur`;
              c = zn;
              break;
            case `beforeblur`:
            case `afterblur`:
              c = zn;
              break;
            case `click`:
              if (n.button === 2) {
                break a;
              }
            case `auxclick`:
            case `dblclick`:
            case `mousedown`:
            case `mousemove`:
            case `mouseup`:
            case `mouseout`:
            case `mouseover`:
            case `contextmenu`:
              c = Ln;
              break;
            case `drag`:
            case `dragend`:
            case `dragenter`:
            case `dragexit`:
            case `dragleave`:
            case `dragover`:
            case `dragstart`:
            case `drop`:
              c = Rn;
              break;
            case `touchcancel`:
            case `touchend`:
            case `touchmove`:
            case `touchstart`:
              c = Xn;
              break;
            case Yr:
            case Xr:
            case Zr:
              c = Bn;
              break;
            case Qr:
              c = Zn;
              break;
            case `scroll`:
              c = Mn;
              break;
            case `wheel`:
              c = Qn;
              break;
            case `copy`:
            case `cut`:
            case `paste`:
              c = Vn;
              break;
            case `gotpointercapture`:
            case `lostpointercapture`:
            case `pointercancel`:
            case `pointerdown`:
            case `pointermove`:
            case `pointerout`:
            case `pointerover`:
            case `pointerup`:
              c = Yn;
          }
          var u = !!(t & 4);
          var d = !u && e === `scroll`;
          var f = u ? (s === null ? null : s + `Capture`) : s;
          u = [];
          var m;
          for (var p = r; p !== null;) {
            m = p;
            var h = m.stateNode;
            if (m.tag === 5 && h !== null) {
              m = h;
              if (f !== null) {
                h = $e(p, f);
                if (h != null) {
                  u.push(pi(p, h, m));
                }
              }
            }
            if (d) {
              break;
            }
            p = p.return;
          }
          if (u.length > 0) {
            s = new c(s, l, null, n, i);
            o.push({
              event: s,
              listeners: u,
            });
          }
        }
      }
      if (!(t & 7)) {
        a: {
          s = e === `mouseover` || e === `pointerover`;
          c = e === `mouseout` || e === `pointerout`;
          if (
            s &&
            n !== He &&
            (l = n.relatedTarget || n.fromElement) &&
            (findFiberByHostInstance(l) || l[Ii])
          ) {
            break a;
          }
          if (
            (c || s) &&
            ((s =
              i.window === i
                ? i
                : (s = i.ownerDocument)
                  ? s.defaultView || s.parentWindow
                  : window),
            c
              ? ((l = n.relatedTarget || n.toElement),
                (c = r),
                (l = l ? findFiberByHostInstance(l) : null),
                l !== null &&
                  ((d = ut(l)), l !== d || (l.tag !== 5 && l.tag !== 6)) &&
                  (l = null))
              : ((c = null), (l = r)),
            c !== l)
          ) {
            u = Ln;
            h = `onMouseLeave`;
            f = `onMouseEnter`;
            p = `mouse`;
            if (e === `pointerout` || e === `pointerover`) {
              u = Yn;
              h = `onPointerLeave`;
              f = `onPointerEnter`;
              p = `pointer`;
            }
            d = c == null ? s : Hi(c);
            m = l == null ? s : Hi(l);
            s = new u(h, p + `leave`, c, n, i);
            s.target = d;
            s.relatedTarget = m;
            h = null;
            if (findFiberByHostInstance(i) === r) {
              u = new u(f, p + `enter`, l, n, i);
              u.target = m;
              u.relatedTarget = d;
              h = u;
            }
            d = h;
            if (c && l) {
              b: {
                u = c;
                f = l;
                p = 0;
                for (m = u; m; m = hi(m)) {
                  p++;
                }
                m = 0;
                for (h = f; h; h = hi(h)) {
                  m++;
                }
                while (p - m > 0) {
                  u = hi(u);
                  p--;
                }
                while (m - p > 0) {
                  f = hi(f);
                  m--;
                }
                while (p--) {
                  if (u === f || (f !== null && u === f.alternate)) {
                    break b;
                  }
                  u = hi(u);
                  f = hi(f);
                }
                u = null;
              }
            } else {
              u = null;
            }
            if (c !== null) {
              gi(o, s, c, u, false);
            }
            if (l !== null && d !== null) {
              gi(o, d, l, u, true);
            }
          }
        }
        a: {
          s = r ? Hi(r) : window;
          c = s.nodeName && s.nodeName.toLowerCase();
          if (c === `select` || (c === `input` && s.type === `file`))
            var g = vr;
          else if (fr(s)) {
            if (yr) {
              g = Or;
            } else {
              g = Er;
              var _ = Tr;
            }
          } else {
            if (
              (c = s.nodeName) &&
              c.toLowerCase() === `input` &&
              (s.type === `checkbox` || s.type === `radio`)
            ) {
              g = Dr;
            }
          }
          if ((g &&= g(e, r))) {
            pr(o, g, n, i);
            break a;
          }
          if (_) {
            _(e, s, r);
          }
          if (
            e === `focusout` &&
            (_ = s._wrapperState) &&
            _.controlled &&
            s.type === `number`
          ) {
            we(s, `number`, s.value);
          }
        }
        _ = r ? Hi(r) : window;
        switch (e) {
          case `focusin`:
            if (fr(_) || _.contentEditable === `true`) {
              zr = _;
              Br = r;
              Vr = null;
            }
            break;
          case `focusout`:
            zr = null;
            Br = null;
            Vr = null;
            break;
          case `mousedown`:
            Hr = true;
            break;
          case `contextmenu`:
          case `mouseup`:
          case `dragend`:
            Hr = false;
            Ur(o, n, i);
            break;
          case `selectionchange`:
            if (Rr) {
              break;
            }
          case `keydown`:
          case `keyup`:
            Ur(o, n, i);
        }
        let v;
        if (er) {
          b: {
            switch (e) {
              case `compositionstart`:
                var y = `onCompositionStart`;
                break b;
              case `compositionend`:
                y = `onCompositionEnd`;
                break b;
              case `compositionupdate`:
                y = `onCompositionUpdate`;
                break b;
            }
            y = undefined;
          }
        } else {
          cr
            ? or(e, n) && (y = `onCompositionEnd`)
            : e === `keydown` &&
              n.keyCode === 229 &&
              (y = `onCompositionStart`);
        }
        if (y) {
          rr &&
            n.locale !== `ko` &&
            (cr || y !== `onCompositionStart`
              ? y === `onCompositionEnd` && cr && (v = wn())
              : ((xn = i),
                (Sn = `value` in xn ? xn.value : xn.textContent),
                (cr = true)));
          _ = mi(r, y);
          if (_.length > 0) {
            y = new Hn(y, e, null, n, i);
            o.push({
              event: y,
              listeners: _,
            });
            if (v) {
              y.data = v;
            } else {
              v = sr(n);
              if (v !== null) {
                y.data = v;
              }
            }
          }
        }
        if ((v = nr ? lr(e, n) : ur(e, n))) {
          r = mi(r, `onBeforeInput`);
          if (r.length > 0) {
            i = new Hn(`onBeforeInput`, `beforeinput`, null, n, i);
            o.push({
              event: i,
              listeners: r,
            });
            i.data = v;
          }
        }
      }
      si(o, t);
    });
  }
  function pi(instance, listener, currentTarget) {
    return {
      instance,
      listener,
      currentTarget,
    };
  }
  function mi(e, t) {
    const n = t + `Capture`;
    const r = [];
    while (e !== null) {
      let i = e;
      let a = i.stateNode;
      if (i.tag === 5 && a !== null) {
        i = a;
        a = $e(e, n);
        if (a != null) {
          r.unshift(pi(e, a, i));
        }
        a = $e(e, t);
        if (a != null) {
          r.push(pi(e, a, i));
        }
      }
      e = e.return;
    }
    return r;
  }
  function hi(e) {
    if (e === null) {
      return null;
    }
    do {
      e = e.return;
    } while (e && e.tag !== 5);
    return e || null;
  }
  function gi(e, t, n, r, i) {
    const t__reactName = t._reactName;
    const o = [];
    while (n !== null && n !== r) {
      let s = n;
      let c = s.alternate;
      const l = s.stateNode;
      if (c !== null && c === r) {
        break;
      }
      if (s.tag === 5 && l !== null) {
        s = l;
        if (i) {
          c = $e(n, t__reactName);
          if (c != null) {
            o.unshift(pi(n, c, s));
          }
        } else if (!i) {
          c = $e(n, t__reactName);
          if (c != null) {
            o.push(pi(n, c, s));
          }
        }
      }
      n = n.return;
    }
    if (o.length !== 0) {
      e.push({
        event: t,
        listeners: o,
      });
    }
  }
  var _i = /\r\n?/g;
  var vi = /\u0000|\uFFFD/g;
  function yi(e) {
    return (typeof e == `string` ? e : `` + e)
      .replace(
        _i,
        `
`,
      )
      .replace(vi, ``);
  }
  function bi(e, t, n) {
    t = yi(t);
    if (yi(e) !== t && n) {
      throw Error(i(425));
    }
  }
  function xi() {}
  var Si = null;
  var Ci = null;
  function wi(e, t) {
    return (
      e === `textarea` ||
      e === `noscript` ||
      typeof t.children == `string` ||
      typeof t.children == `number` ||
      (typeof t.dangerouslySetInnerHTML == `object` &&
        t.dangerouslySetInnerHTML !== null &&
        t.dangerouslySetInnerHTML.__html != null)
    );
  }
  var Ti = typeof setTimeout == `function` ? setTimeout : undefined;
  var Ei = typeof clearTimeout == `function` ? clearTimeout : undefined;
  var Di = typeof Promise == `function` ? Promise : undefined;
  var Oi =
    typeof queueMicrotask == `function`
      ? queueMicrotask
      : Di === undefined
        ? Ti
        : (e) => Di.resolve(null).then(e).catch(ki);
  function ki(e) {
    setTimeout(() => {
      throw e;
    });
  }
  function Ai(e, t) {
    let n = t;
    let r = 0;
    do {
      const i = n.nextSibling;
      e.removeChild(n);
      if (i && i.nodeType === 8) {
        n = i.data;
        if (n === `/$`) {
          if (r === 0) {
            e.removeChild(i);
            fn(t);
            return;
          }
          r--;
        } else {
          (n !== `$` && n !== `$?` && n !== `$!`) || r++;
        }
      }
      n = i;
    } while (n);
    fn(t);
  }
  function ji(e) {
    for (; e != null; e = e.nextSibling) {
      let t = e.nodeType;
      if (t === 1 || t === 3) {
        break;
      }
      if (t === 8) {
        t = e.data;
        if (t === `$` || t === `$!` || t === `$?`) {
          break;
        }
        if (t === `/$`) {
          return null;
        }
      }
    }
    return e;
  }
  function Mi(e) {
    e = e.previousSibling;
    let t = 0;
    while (e) {
      if (e.nodeType === 8) {
        const n = e.data;
        if (n === `$` || n === `$!` || n === `$?`) {
          if (t === 0) {
            return e;
          }
          t--;
        } else {
          n === `/$` && t++;
        }
      }
      e = e.previousSibling;
    }
    return null;
  }
  var Ni = Math.random().toString(36).slice(2);
  var Pi = `__reactFiber$` + Ni;
  var Fi = `__reactProps$` + Ni;
  var Ii = `__reactContainer$` + Ni;
  var Li = `__reactEvents$` + Ni;
  var Ri = `__reactListeners$` + Ni;
  var zi = `__reactHandles$` + Ni;
  function findFiberByHostInstance(e) {
    let t = e[Pi];
    if (t) {
      return t;
    }
    for (let n = e.parentNode; n;) {
      if ((t = n[Ii] || n[Pi])) {
        n = t.alternate;
        if (t.child !== null || (n !== null && n.child !== null)) {
          for (e = Mi(e); e !== null;) {
            if ((n = e[Pi])) {
              return n;
            }
            e = Mi(e);
          }
        }
        return t;
      }
      e = n;
      n = e.parentNode;
    }
    return null;
  }
  function Vi(e) {
    e = e[Pi] || e[Ii];
    if (!e || (e.tag !== 5 && e.tag !== 6 && e.tag !== 13 && e.tag !== 3)) {
      return null;
    }
    return e;
  }
  function Hi(e) {
    if (e.tag === 5 || e.tag === 6) {
      return e.stateNode;
    }
    throw Error(i(33));
  }
  function Ui(e) {
    return e[Fi] || null;
  }
  var Wi = [];
  var Gi = -1;
  function Ki(current) {
    return {
      current,
    };
  }
  function H(e) {
    if (!(Gi < 0)) {
      e.current = Wi[Gi];
      Wi[Gi] = null;
      Gi--;
    }
  }
  function U(e, t) {
    Gi++;
    Wi[Gi] = e.current;
    e.current = t;
  }
  var qi = {};
  var Ji = Ki(qi);
  var Yi = Ki(false);
  var Xi = qi;
  function Zi(e, t) {
    const contextTypes = e.type.contextTypes;
    if (!contextTypes) {
      return qi;
    }
    const e_stateNode = e.stateNode;
    if (
      e_stateNode &&
      e_stateNode.__reactInternalMemoizedUnmaskedChildContext === t
    ) {
      return e_stateNode.__reactInternalMemoizedMaskedChildContext;
    }
    const i = {};
    let a;
    for (a in contextTypes) {
      i[a] = t[a];
    }
    if (e_stateNode) {
      e = e.stateNode;
      e.__reactInternalMemoizedUnmaskedChildContext = t;
      e.__reactInternalMemoizedMaskedChildContext = i;
    }
    return i;
  }
  function Qi(e) {
    e = e.childContextTypes;
    return e != null;
  }
  function $i() {
    H(Yi);
    H(Ji);
  }
  function ea(e, t, n) {
    if (Ji.current !== qi) {
      throw Error(i(168));
    }
    U(Ji, t);
    U(Yi, n);
  }
  function ta(e, t, n) {
    let e_stateNode = e.stateNode;
    t = t.childContextTypes;
    if (typeof e_stateNode.getChildContext != `function`) {
      return n;
    }
    e_stateNode = e_stateNode.getChildContext();
    for (const a in e_stateNode) {
      if (!(a in t)) {
        throw Error(i(108, fe(e) || `Unknown`, a));
      }
    }
    return Object_assign({}, n, e_stateNode);
  }
  function na(e) {
    e =
      ((e = e.stateNode) && e.__reactInternalMemoizedMergedChildContext) || qi;
    Xi = Ji.current;
    U(Ji, e);
    U(Yi, Yi.current);
    return true;
  }
  function ra(e, t, n) {
    const e_stateNode = e.stateNode;
    if (!e_stateNode) {
      throw Error(i(169));
    }
    if (n) {
      e = ta(e, t, Xi);
      e_stateNode.__reactInternalMemoizedMergedChildContext = e;
      H(Yi);
      H(Ji);
      U(Ji, e);
    } else {
      H(Yi);
    }
    U(Yi, n);
  }
  var ia = null;
  var aa = false;
  var oa = false;
  function sa(e) {
    if (ia === null) {
      ia = [e];
    } else {
      ia.push(e);
    }
  }
  function ca(e) {
    aa = true;
    sa(e);
  }
  function la() {
    if (!oa && ia !== null) {
      oa = true;
      let e = 0;
      const t = z;
      try {
        const n = ia;
        for (z = 1; e < n.length; e++) {
          let r = n[e];
          do {
            r = r(true);
          } while (r !== null);
        }
        ia = null;
        aa = false;
      } catch (error) {
        if (ia !== null) {
          ia = ia.slice(e + 1);
        }
        r_unstable_scheduleCallback(r_unstable_ImmediatePriority, la);
        throw error;
      } finally {
        z = t;
        oa = false;
      }
    }
    return null;
  }
  var ua = [];
  var da = 0;
  var fa = null;
  var pa = 0;
  var ma = [];
  var ha = 0;
  var ga = null;
  var _a = 1;
  var overflow = ``;
  function ya(e, t) {
    ua[da++] = pa;
    ua[da++] = fa;
    fa = e;
    pa = t;
  }
  function ba(e, t, n) {
    ma[ha++] = _a;
    ma[ha++] = overflow;
    ma[ha++] = ga;
    ga = e;
    let r = _a;
    e = overflow;
    let i = 32 - Ot(r) - 1;
    r &= ~(1 << i);
    n += 1;
    let a = 32 - Ot(t) + i;
    if (a > 30) {
      const o = i - (i % 5);
      a = (r & ((1 << o) - 1)).toString(32);
      r >>= o;
      i -= o;
      _a = (1 << (32 - Ot(t) + i)) | (n << i) | r;
      overflow = a + e;
    } else {
      _a = (1 << a) | (n << i) | r;
      overflow = e;
    }
  }
  function xa(e) {
    if (e.return !== null) {
      ya(e, 1);
      ba(e, 1, 0);
    }
  }
  function Sa(e) {
    while (e === fa) {
      fa = ua[--da];
      ua[da] = null;
      pa = ua[--da];
      ua[da] = null;
    }
    while (e === ga) {
      ga = ma[--ha];
      ma[ha] = null;
      overflow = ma[--ha];
      ma[ha] = null;
      _a = ma[--ha];
      ma[ha] = null;
    }
  }
  var Ca = null;
  var wa = null;
  var W = false;
  var Ta = null;
  function Ea(e, t) {
    const n = ql(5, null, null, 0);
    n.elementType = `DELETED`;
    n.stateNode = t;
    n.return = e;
    t = e.deletions;
    if (t === null) {
      e.deletions = [n];
      e.flags |= 16;
    } else {
      t.push(n);
    }
  }
  function Da(e, dehydrated) {
    switch (e.tag) {
      case 5:
        var treeContext = e.type;
        dehydrated =
          dehydrated.nodeType !== 1 ||
          treeContext.toLowerCase() !== dehydrated.nodeName.toLowerCase()
            ? null
            : dehydrated;
        return (
          dehydrated !== null &&
          ((e.stateNode = dehydrated),
          (Ca = e),
          (wa = ji(dehydrated.firstChild)),
          true)
        );
      case 6:
        dehydrated =
          e.pendingProps === `` || dehydrated.nodeType !== 3
            ? null
            : dehydrated;
        return (
          dehydrated !== null &&
          ((e.stateNode = dehydrated), (Ca = e), (wa = null), true)
        );
      case 13:
        dehydrated = dehydrated.nodeType === 8 ? dehydrated : null;
        return (
          dehydrated !== null &&
          ((treeContext =
            ga === null
              ? null
              : {
                  id: _a,
                  overflow,
                }),
          (e.memoizedState = {
            dehydrated,
            treeContext,
            retryLane: 1073741824,
          }),
          (treeContext = ql(18, null, null, 0)),
          (treeContext.stateNode = dehydrated),
          (treeContext.return = e),
          (e.child = treeContext),
          (Ca = e),
          (wa = null),
          true)
        );
      default:
        return false;
    }
  }
  function Oa(e) {
    return !!(e.mode & 1) && !(e.flags & 128);
  }
  function ka(e) {
    if (W) {
      let t = wa;
      if (t) {
        const n = t;
        if (!Da(e, t)) {
          if (Oa(e)) {
            throw Error(i(418));
          }
          t = ji(n.nextSibling);
          const r = Ca;
          if (t && Da(e, t)) {
            Ea(r, n);
          } else {
            e.flags = (e.flags & -4097) | 2;
            W = false;
            Ca = e;
          }
        }
      } else {
        if (Oa(e)) {
          throw Error(i(418));
        }
        e.flags = (e.flags & -4097) | 2;
        W = false;
        Ca = e;
      }
    }
  }
  function Aa(e) {
    for (
      e = e.return;
      e !== null && e.tag !== 5 && e.tag !== 3 && e.tag !== 13;
    ) {
      e = e.return;
    }
    Ca = e;
  }
  function ja(e) {
    if (e !== Ca) {
      return false;
    }
    if (!W) {
      Aa(e);
      W = true;
      return false;
    }
    let t;
    if ((t = e.tag !== 3) && !(t = e.tag !== 5)) {
      t = e.type;
      t = t !== `head` && t !== `body` && !wi(e.type, e.memoizedProps);
    }
    if ((t &&= wa)) {
      if (Oa(e)) {
        Ma();
        throw Error(i(418));
      }
      while (t) {
        Ea(e, t);
        t = ji(t.nextSibling);
      }
    }
    Aa(e);
    if (e.tag === 13) {
      e = e.memoizedState;
      e = e === null ? null : e.dehydrated;
      if (!e) {
        throw Error(i(317));
      }
      a: {
        e = e.nextSibling;
        for (t = 0; e;) {
          if (e.nodeType === 8) {
            const n = e.data;
            if (n === `/$`) {
              if (t === 0) {
                wa = ji(e.nextSibling);
                break a;
              }
              t--;
            } else {
              (n !== `$` && n !== `$!` && n !== `$?`) || t++;
            }
          }
          e = e.nextSibling;
        }
        wa = null;
      }
    } else {
      wa = Ca ? ji(e.stateNode.nextSibling) : null;
    }
    return true;
  }
  function Ma() {
    for (let e = wa; e;) {
      e = ji(e.nextSibling);
    }
  }
  function Na() {
    Ca = null;
    wa = null;
    W = false;
  }
  function Pa(e) {
    if (Ta === null) {
      Ta = [e];
    } else {
      Ta.push(e);
    }
  }
  var C_ReactCurrentBatchConfig_1 =
    n___SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentBatchConfig;
  function Ia(e, t, n) {
    e = n.ref;
    if (e !== null && typeof e != `function` && typeof e != `object`) {
      if (n._owner) {
        n = n._owner;
        if (n) {
          if (n.tag !== 1) {
            throw Error(i(309));
          }
          var r = n.stateNode;
        }
        if (!r) {
          throw Error(i(147, e));
        }
        const a = r;
        const o = `` + e;
        if (
          t !== null &&
          t.ref !== null &&
          typeof t.ref == `function` &&
          t.ref._stringRef === o
        ) {
          return t.ref;
        }
        return (
          (t = (e) => {
            const a_refs = a.refs;
            if (e === null) {
              delete a_refs[o];
            } else {
              a_refs[o] = e;
            }
          }),
          (t._stringRef = o),
          t
        );
      }
      if (typeof e != `string`) {
        throw Error(i(284));
      }
      if (!n._owner) {
        throw Error(i(290, e));
      }
    }
    return e;
  }
  function La(e, t) {
    e = Object.prototype.toString.call(t);
    throw Error(
      i(
        31,
        e === `[object Object]`
          ? `object with keys {` + Object.keys(t).join(`, `) + `}`
          : e,
      ),
    );
  }
  function Ra(e) {
    const e__init = e._init;
    return e__init(e._payload);
  }
  function za(e) {
    function t(t, n) {
      if (e) {
        const r = t.deletions;
        if (r === null) {
          t.deletions = [n];
          t.flags |= 16;
        } else {
          r.push(n);
        }
      }
    }
    function n(n, r) {
      if (!e) {
        return null;
      }
      while (r !== null) {
        t(n, r);
        r = r.sibling;
      }
      return null;
    }
    function r(e, t) {
      for (e = new Map(); t !== null;) {
        if (t.key === null) {
          e.set(t.index, t);
        } else {
          e.set(t.key, t);
        }
        t = t.sibling;
      }
      return e;
    }
    function a(e, t) {
      e = Xl(e, t);
      e.index = 0;
      e.sibling = null;
      return e;
    }
    function o(t, n, r) {
      t.index = r;
      if (e) {
        return (
          (r = t.alternate),
          r === null
            ? ((t.flags |= 2), n)
            : ((r = r.index), r < n ? ((t.flags |= 2), n) : r)
        );
      }
      return ((t.flags |= 1048576), n);
    }
    function s(t) {
      if (e && t.alternate === null) {
        t.flags |= 2;
      }
      return t;
    }
    function c(e, t, n, r) {
      if (t === null || t.tag !== 6) {
        return ((t = eu(n, e.mode, r)), (t.return = e), t);
      }
      return ((t = a(t, n)), (t.return = e), t);
    }
    function l(e, t, n, r) {
      const n_type = n.type;
      if (n_type === E) {
        return d(e, t, n.props.children, r, n.key);
      }
      if (
        t !== null &&
        (t.elementType === n_type ||
          (typeof n_type == `object` &&
            n_type &&
            n_type.$$typeof === j &&
            Ra(n_type) === t.type))
      ) {
        return ((r = a(t, n.props)), (r.ref = Ia(e, t, n)), (r.return = e), r);
      }
      return (
        (r = Zl(n.type, n.key, n.props, null, e.mode, r)),
        (r.ref = Ia(e, t, n)),
        (r.return = e),
        r
      );
    }
    function u(e, t, n, r) {
      if (
        t === null ||
        t.tag !== 4 ||
        t.stateNode.containerInfo !== n.containerInfo ||
        t.stateNode.implementation !== n.implementation
      ) {
        return ((t = tu(n, e.mode, r)), (t.return = e), t);
      }
      return ((t = a(t, n.children || [])), (t.return = e), t);
    }
    function d(e, t, n, r, i) {
      if (t === null || t.tag !== 7) {
        return ((t = Ql(n, e.mode, r, i)), (t.return = e), t);
      }
      return ((t = a(t, n)), (t.return = e), t);
    }
    function f(e, t, n) {
      if ((typeof t == `string` && t !== ``) || typeof t == `number`) {
        t = eu(`` + t, e.mode, n);
        t.return = e;
        return t;
      }
      if (typeof t == `object` && t) {
        switch (t.$$typeof) {
          case w:
            n = Zl(t.type, t.key, t.props, null, e.mode, n);
            n.ref = Ia(e, null, t);
            n.return = e;
            return n;
          case T:
            t = tu(t, e.mode, n);
            t.return = e;
            return t;
          case j:
            const r = t._init;
            return f(e, r(t._payload), n);
        }
        if (Array_isArray(t) || oe(t)) {
          t = Ql(t, e.mode, n, null);
          t.return = e;
          return t;
        }
        La(e, t);
      }
      return null;
    }
    function p(e, t, n, r) {
      let i = t === null ? null : t.key;
      if ((typeof n == `string` && n !== ``) || typeof n == `number`) {
        if (i === null) {
          return c(e, t, `` + n, r);
        }
        return null;
      }
      if (typeof n == `object` && n) {
        switch (n.$$typeof) {
          case w:
            if (n.key === i) {
              return l(e, t, n, r);
            }
            return null;
          case T:
            if (n.key === i) {
              return u(e, t, n, r);
            }
            return null;
          case j:
            i = n._init;
            return p(e, t, i(n._payload), r);
        }
        if (Array_isArray(n) || oe(n)) {
          if (i === null) {
            return d(e, t, n, r, null);
          }
          return null;
        }
        La(e, n);
      }
      return null;
    }
    function m(e, t, n, r, i) {
      if ((typeof r == `string` && r !== ``) || typeof r == `number`) {
        e = e.get(n) || null;
        return c(t, e, `` + r, i);
      }
      if (typeof r == `object` && r) {
        switch (r.$$typeof) {
          case w:
            e = e.get(r.key === null ? n : r.key) || null;
            return l(t, e, r, i);
          case T:
            e = e.get(r.key === null ? n : r.key) || null;
            return u(t, e, r, i);
          case j:
            const a = r._init;
            return m(e, t, n, a(r._payload), i);
        }
        if (Array_isArray(r) || oe(r)) {
          e = e.get(n) || null;
          return d(t, e, r, i, null);
        }
        La(t, r);
      }
      return null;
    }
    function h(i, a, s, c) {
      let l = null;
      let u = null;
      for (var d = a, h = (a = 0), g = null; d !== null && h < s.length; h++) {
        if (d.index > h) {
          g = d;
          d = null;
        } else {
          g = d.sibling;
        }
        const _ = p(i, d, s[h], c);
        if (_ === null) {
          if (d === null) {
            d = g;
          }
          break;
        }
        if (e && d && _.alternate === null) {
          t(i, d);
        }
        a = o(_, a, h);
        if (u === null) {
          l = _;
        } else {
          u.sibling = _;
        }
        u = _;
        d = g;
      }
      if (h === s.length) {
        n(i, d);
        if (W) {
          ya(i, h);
        }
        return l;
      }
      if (d === null) {
        for (; h < s.length; h++) {
          d = f(i, s[h], c);
          if (d !== null) {
            a = o(d, a, h);
            if (u === null) {
              l = d;
            } else {
              u.sibling = d;
            }
            u = d;
          }
        }
        if (W) {
          ya(i, h);
        }
        return l;
      }
      for (d = r(i, d); h < s.length; h++) {
        g = m(d, i, h, s[h], c);
        if (g !== null) {
          if (e && g.alternate !== null) {
            d.delete(g.key === null ? h : g.key);
          }
          a = o(g, a, h);
          if (u === null) {
            l = g;
          } else {
            u.sibling = g;
          }
          u = g;
        }
      }
      if (e) {
        d.forEach((e) => t(i, e));
      }
      if (W) {
        ya(i, h);
      }
      return l;
    }
    function g(a, s, c, l) {
      let u = oe(c);
      if (typeof u != `function`) {
        throw Error(i(150));
      }
      c = u.call(c);
      if (c == null) {
        throw Error(i(151));
      }
      let d = (u = null);
      for (
        var h = s, g = (s = 0), _ = null, v = c.next();
        h !== null && !v.done;
        g++, v = c.next()
      ) {
        if (h.index > g) {
          _ = h;
          h = null;
        } else {
          _ = h.sibling;
        }
        const y = p(a, h, v.value, l);
        if (y === null) {
          if (h === null) {
            h = _;
          }
          break;
        }
        if (e && h && y.alternate === null) {
          t(a, h);
        }
        s = o(y, s, g);
        if (d === null) {
          u = y;
        } else {
          d.sibling = y;
        }
        d = y;
        h = _;
      }
      if (v.done) {
        n(a, h);
        if (W) {
          ya(a, g);
        }
        return u;
      }
      if (h === null) {
        for (; !v.done; g++, v = c.next()) {
          v = f(a, v.value, l);
          if (v !== null) {
            s = o(v, s, g);
            if (d === null) {
              u = v;
            } else {
              d.sibling = v;
            }
            d = v;
          }
        }
        if (W) {
          ya(a, g);
        }
        return u;
      }
      for (h = r(a, h); !v.done; g++, v = c.next()) {
        v = m(h, a, g, v.value, l);
        if (v !== null) {
          if (e && v.alternate !== null) {
            h.delete(v.key === null ? g : v.key);
          }
          s = o(v, s, g);
          if (d === null) {
            u = v;
          } else {
            d.sibling = v;
          }
          d = v;
        }
      }
      if (e) {
        h.forEach((e) => t(a, e));
      }
      if (W) {
        ya(a, g);
      }
      return u;
    }
    function _(e, r, i, o) {
      if (typeof i == `object` && i && i.type === E && i.key === null) {
        i = i.props.children;
      }
      if (typeof i == `object` && i) {
        switch (i.$$typeof) {
          case w:
            a: {
              let c = i.key;
              for (var l = r; l !== null;) {
                if (l.key === c) {
                  c = i.type;
                  if (c === E) {
                    if (l.tag === 7) {
                      n(e, l.sibling);
                      r = a(l, i.props.children);
                      r.return = e;
                      e = r;
                      break a;
                    }
                  } else if (
                    l.elementType === c ||
                    (typeof c == `object` &&
                      c &&
                      c.$$typeof === j &&
                      Ra(c) === l.type)
                  ) {
                    n(e, l.sibling);
                    r = a(l, i.props);
                    r.ref = Ia(e, l, i);
                    r.return = e;
                    e = r;
                    break a;
                  }
                  n(e, l);
                  break;
                }
                t(e, l);
                l = l.sibling;
              }
              if (i.type === E) {
                r = Ql(i.props.children, e.mode, o, i.key);
                r.return = e;
                e = r;
              } else {
                o = Zl(i.type, i.key, i.props, null, e.mode, o);
                o.ref = Ia(e, r, i);
                o.return = e;
                e = o;
              }
            }
            return s(e);
          case T:
            a: {
              for (l = i.key; r !== null;) {
                if (r.key === l) {
                  if (
                    r.tag === 4 &&
                    r.stateNode.containerInfo === i.containerInfo &&
                    r.stateNode.implementation === i.implementation
                  ) {
                    n(e, r.sibling);
                    r = a(r, i.children || []);
                    r.return = e;
                    e = r;
                    break a;
                  }
                  n(e, r);
                  break;
                }
                t(e, r);
                r = r.sibling;
              }
              r = tu(i, e.mode, o);
              r.return = e;
              e = r;
            }
            return s(e);
          case j:
            l = i._init;
            return _(e, r, l(i._payload), o);
        }
        if (Array_isArray(i)) {
          return h(e, r, i, o);
        }
        if (oe(i)) {
          return g(e, r, i, o);
        }
        La(e, i);
      }
      if ((typeof i == `string` && i !== ``) || typeof i == `number`) {
        return (
          (i = `` + i),
          r !== null && r.tag === 6
            ? (n(e, r.sibling), (r = a(r, i)), (r.return = e), (e = r))
            : (n(e, r), (r = eu(i, e.mode, o)), (r.return = e), (e = r)),
          s(e)
        );
      }
      return n(e, r);
    }
    return _;
  }
  var Ba = za(true);
  var Va = za(false);
  var Ha = Ki(null);
  var Ua = null;
  var Wa = null;
  var Ga = null;
  function Ka() {
    Ua = null;
    Wa = null;
    Ga = null;
  }
  function qa(_context) {
    const Ha_current = Ha.current;
    H(Ha);
    _context._currentValue = Ha_current;
  }
  function Ja(e, t, n) {
    while (e !== null) {
      const r = e.alternate;
      if ((e.childLanes & t) === t) {
        if (r !== null && (r.childLanes & t) !== t) {
          r.childLanes |= t;
        }
      } else {
        e.childLanes |= t;
        if (r !== null) {
          r.childLanes |= t;
        }
      }
      if (e === n) {
        break;
      }
      e = e.return;
    }
  }
  function Ya(e, t) {
    Ua = e;
    Wa = null;
    Ga = null;
    e = e.dependencies;
    if (e !== null && e.firstContext !== null) {
      if ((e.lanes & t) !== 0) {
        Is = true;
      }
      e.firstContext = null;
    }
  }
  function Xa(e) {
    const e__currentValue = e._currentValue;
    if (Ga !== e) {
      e = {
        context: e,
        memoizedValue: e__currentValue,
        next: null,
      };
      if (Wa === null) {
        if (Ua === null) {
          throw Error(i(308));
        }
        Wa = e;
        Ua.dependencies = {
          lanes: 0,
          firstContext: e,
        };
      } else {
        Wa = Wa.next = e;
      }
    }
    return e__currentValue;
  }
  var Za = null;
  function Qa(e) {
    if (Za === null) {
      Za = [e];
    } else {
      Za.push(e);
    }
  }
  function $a(e, t, n, r) {
    const t_interleaved = t.interleaved;
    if (t_interleaved === null) {
      n.next = n;
      Qa(t);
    } else {
      n.next = t_interleaved.next;
      t_interleaved.next = n;
    }
    t.interleaved = n;
    return eo(e, r);
  }
  function eo(e, t) {
    e.lanes |= t;
    let e_alternate = e.alternate;
    if (e_alternate !== null) {
      e_alternate.lanes |= t;
    }
    e_alternate = e;
    for (e = e.return; e !== null;) {
      e.childLanes |= t;
      e_alternate = e.alternate;
      if (e_alternate !== null) {
        e_alternate.childLanes |= t;
      }
      e_alternate = e;
      e = e.return;
    }
    if (e_alternate.tag === 3) {
      return e_alternate.stateNode;
    }
    return null;
  }
  var to = false;
  function no(e) {
    e.updateQueue = {
      baseState: e.memoizedState,
      firstBaseUpdate: null,
      lastBaseUpdate: null,
      shared: {
        pending: null,
        interleaved: null,
        lanes: 0,
      },
      effects: null,
    };
  }
  function ro(e, t) {
    e = e.updateQueue;
    if (t.updateQueue === e) {
      t.updateQueue = {
        baseState: e.baseState,
        firstBaseUpdate: e.firstBaseUpdate,
        lastBaseUpdate: e.lastBaseUpdate,
        shared: e.shared,
        effects: e.effects,
      };
    }
  }
  function io(eventTime, lane) {
    return {
      eventTime,
      lane,
      tag: 0,
      payload: null,
      callback: null,
      next: null,
    };
  }
  function ao(e, t, n) {
    let e_updateQueue = e.updateQueue;
    if (e_updateQueue === null) {
      return null;
    }
    e_updateQueue = e_updateQueue.shared;
    if (X & 2) {
      var i = e_updateQueue.pending;
      if (i === null) {
        t.next = t;
      } else {
        t.next = i.next;
        i.next = t;
      }
      e_updateQueue.pending = t;
      return eo(e, n);
    }
    i = e_updateQueue.interleaved;
    if (i === null) {
      t.next = t;
      Qa(e_updateQueue);
    } else {
      t.next = i.next;
      i.next = t;
    }
    e_updateQueue.interleaved = t;
    return eo(e, n);
  }
  function oo(e, t, n) {
    t = t.updateQueue;
    if (t !== null && ((t = t.shared), n & 4194240)) {
      let r = t.lanes;
      r &= e.pendingLanes;
      n |= r;
      t.lanes = n;
      Ht(e, n);
    }
  }
  function so(e, t) {
    let e_updateQueue = e.updateQueue;
    let e_alternate = e.alternate;
    if (
      e_alternate !== null &&
      ((e_alternate = e_alternate.updateQueue), e_updateQueue === e_alternate)
    ) {
      let firstBaseUpdate = null;
      let lastBaseUpdate = null;
      e_updateQueue = e_updateQueue.firstBaseUpdate;
      if (e_updateQueue !== null) {
        do {
          const o = {
            eventTime: e_updateQueue.eventTime,
            lane: e_updateQueue.lane,
            tag: e_updateQueue.tag,
            payload: e_updateQueue.payload,
            callback: e_updateQueue.callback,
            next: null,
          };
          if (lastBaseUpdate === null) {
            firstBaseUpdate = lastBaseUpdate = o;
          } else {
            lastBaseUpdate = lastBaseUpdate.next = o;
          }
          e_updateQueue = e_updateQueue.next;
        } while (e_updateQueue !== null);
        if (lastBaseUpdate === null) {
          firstBaseUpdate = lastBaseUpdate = t;
        } else {
          lastBaseUpdate = lastBaseUpdate.next = t;
        }
      } else {
        lastBaseUpdate = t;
        firstBaseUpdate = t;
      }
      e_updateQueue = {
        baseState: e_alternate.baseState,
        firstBaseUpdate,
        lastBaseUpdate,
        shared: e_alternate.shared,
        effects: e_alternate.effects,
      };
      e.updateQueue = e_updateQueue;
      return;
    }
    e = e_updateQueue.lastBaseUpdate;
    if (e === null) {
      e_updateQueue.firstBaseUpdate = t;
    } else {
      e.next = t;
    }
    e_updateQueue.lastBaseUpdate = t;
  }
  function co(e, t, n, r) {
    let e_updateQueue = e.updateQueue;
    to = false;
    let i_firstBaseUpdate = e_updateQueue.firstBaseUpdate;
    let i_lastBaseUpdate = e_updateQueue.lastBaseUpdate;
    let pending = e_updateQueue.shared.pending;
    if (pending !== null) {
      e_updateQueue.shared.pending = null;
      var c = pending;
      var l = c.next;
      c.next = null;
      if (i_lastBaseUpdate === null) {
        i_firstBaseUpdate = l;
      } else {
        i_lastBaseUpdate.next = l;
      }
      i_lastBaseUpdate = c;
      var u = e.alternate;
      if (u !== null) {
        u = u.updateQueue;
        pending = u.lastBaseUpdate;
        if (pending !== i_lastBaseUpdate) {
          if (pending === null) {
            u.firstBaseUpdate = l;
          } else {
            pending.next = l;
          }
          u.lastBaseUpdate = c;
        }
      }
    }
    if (i_firstBaseUpdate !== null) {
      let d = e_updateQueue.baseState;
      i_lastBaseUpdate = 0;
      c = null;
      l = null;
      u = null;
      pending = i_firstBaseUpdate;
      do {
        let f = pending.lane;
        let eventTime = pending.eventTime;
        if ((r & f) === f) {
          if (u !== null) {
            u = u.next = {
              eventTime,
              lane: 0,
              tag: pending.tag,
              payload: pending.payload,
              callback: pending.callback,
              next: null,
            };
          }
          a: {
            let m = e;
            const h = pending;
            f = t;
            eventTime = n;
            switch (h.tag) {
              case 1:
                m = h.payload;
                if (typeof m == `function`) {
                  d = m.call(eventTime, d, f);
                  break a;
                }
                d = m;
                break a;
              case 3:
                m.flags = (m.flags & -65537) | 128;
              case 0:
                m = h.payload;
                f = typeof m == `function` ? m.call(eventTime, d, f) : m;
                if (f == null) {
                  break a;
                }
                d = Object_assign({}, d, f);
                break a;
              case 2:
                to = true;
            }
          }
          if (pending.callback !== null && pending.lane !== 0) {
            e.flags |= 64;
            f = e_updateQueue.effects;
            if (f === null) {
              e_updateQueue.effects = [pending];
            } else {
              f.push(pending);
            }
          }
        } else {
          eventTime = {
            eventTime,
            lane: f,
            tag: pending.tag,
            payload: pending.payload,
            callback: pending.callback,
            next: null,
          };
          if (u === null) {
            l = u = eventTime;
            c = d;
          } else {
            u = u.next = eventTime;
          }
          i_lastBaseUpdate |= f;
        }
        pending = pending.next;
        if (pending === null) {
          pending = e_updateQueue.shared.pending;
          if (pending === null) {
            break;
          }
          f = pending;
          pending = f.next;
          f.next = null;
          e_updateQueue.lastBaseUpdate = f;
          e_updateQueue.shared.pending = null;
        }
      } while (1);
      if (u === null) {
        c = d;
      }
      e_updateQueue.baseState = c;
      e_updateQueue.firstBaseUpdate = l;
      e_updateQueue.lastBaseUpdate = u;
      t = e_updateQueue.shared.interleaved;
      if (t !== null) {
        e_updateQueue = t;
        do {
          i_lastBaseUpdate |= e_updateQueue.lane;
          e_updateQueue = e_updateQueue.next;
        } while (e_updateQueue !== t);
      } else {
        if (i_firstBaseUpdate === null) {
          e_updateQueue.shared.lanes = 0;
        }
      }
      Xc |= i_lastBaseUpdate;
      e.lanes = i_lastBaseUpdate;
      e.memoizedState = d;
    }
  }
  function lo(e, t, n) {
    e = t.effects;
    t.effects = null;
    if (e !== null) {
      for (t = 0; t < e.length; t++) {
        let r = e[t];
        const a = r.callback;
        if (a !== null) {
          r.callback = null;
          r = n;
          if (typeof a != `function`) {
            throw Error(i(191, a));
          }
          a.call(r);
        }
      }
    }
  }
  var uo = {};
  var G = Ki(uo);
  var fo = Ki(uo);
  var po = Ki(uo);
  function mo(e) {
    if (e === uo) {
      throw Error(i(174));
    }
    return e;
  }
  function ho(e, t) {
    U(po, t);
    U(fo, e);
    U(G, uo);
    e = t.nodeType;
    switch (e) {
      case 9:
      case 11:
        t = (t = t.documentElement) ? t.namespaceURI : Me(null, ``);
        break;
      default:
        e = e === 8 ? t.parentNode : t;
        t = e.namespaceURI || null;
        e = e.tagName;
        t = Me(t, e);
    }
    H(G);
    U(G, t);
  }
  function go() {
    H(G);
    H(fo);
    H(po);
  }
  function _o(e) {
    mo(po.current);
    const t = mo(G.current);
    const n = Me(t, e.type);
    if (t !== n) {
      U(fo, e);
      U(G, n);
    }
  }
  function vo(e) {
    if (fo.current === e) {
      H(G);
      H(fo);
    }
  }
  var K = Ki(0);
  function yo(e) {
    for (let t = e; t !== null;) {
      if (t.tag === 13) {
        let n = t.memoizedState;
        if (
          n !== null &&
          ((n = n.dehydrated), n === null || n.data === `$?` || n.data === `$!`)
        ) {
          return t;
        }
      } else if (t.tag === 19 && t.memoizedProps.revealOrder !== undefined) {
        if (t.flags & 128) {
          return t;
        }
      } else if (t.child !== null) {
        t.child.return = t;
        t = t.child;
        continue;
      }
      if (t === e) {
        break;
      }
      while (t.sibling === null) {
        if (t.return === null || t.return === e) {
          return null;
        }
        t = t.return;
      }
      t.sibling.return = t.return;
      t = t.sibling;
    }
    return null;
  }
  var bo = [];
  function xo() {
    for (let e = 0; e < bo.length; e++) {
      bo[e]._workInProgressVersionPrimary = null;
    }
    bo.length = 0;
  }
  var C_ReactCurrentDispatcher =
    n___SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentDispatcher;
  var C_ReactCurrentBatchConfig_2 =
    n___SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentBatchConfig;
  var wo = 0;
  var q = null;
  var To = null;
  var Eo = null;
  var Do = false;
  var Oo = false;
  var ko = 0;
  var Ao = 0;
  function jo() {
    throw Error(i(321));
  }
  function Mo(e, t) {
    if (t === null) {
      return false;
    }
    for (let n = 0; n < t.length && n < e.length; n++) {
      if (!Ar(e[n], t[n])) {
        return false;
      }
    }
    return true;
  }
  function No(e, t, n, r, a, o) {
    wo = o;
    q = t;
    t.memoizedState = null;
    t.updateQueue = null;
    t.lanes = 0;
    C_ReactCurrentDispatcher.current =
      e === null || e.memoizedState === null ? gs : _s;
    e = n(r, a);
    if (Oo) {
      o = 0;
      do {
        Oo = false;
        ko = 0;
        if (o >= 25) {
          throw Error(i(301));
        }
        o += 1;
        To = null;
        Eo = null;
        t.updateQueue = null;
        C_ReactCurrentDispatcher.current = vs;
        e = n(r, a);
      } while (Oo);
    }
    C_ReactCurrentDispatcher.current = hs;
    t = To !== null && To.next !== null;
    wo = 0;
    q = null;
    To = null;
    Eo = null;
    Do = false;
    if (t) {
      throw Error(i(300));
    }
    return e;
  }
  function Po() {
    const e = ko !== 0;
    ko = 0;
    return e;
  }
  function Fo() {
    const e = {
      memoizedState: null,
      baseState: null,
      baseQueue: null,
      queue: null,
      next: null,
    };
    if (Eo === null) {
      q.memoizedState = Eo = e;
    } else {
      Eo = Eo.next = e;
    }
    return Eo;
  }
  function Io() {
    if (To === null) {
      var e = q.alternate;
      e = e === null ? null : e.memoizedState;
    } else {
      e = To.next;
    }
    const t = Eo === null ? q.memoizedState : Eo.next;
    if (t !== null) {
      Eo = t;
      To = e;
    } else {
      if (e === null) {
        throw Error(i(310));
      }
      To = e;
      e = {
        memoizedState: To.memoizedState,
        baseState: To.baseState,
        baseQueue: To.baseQueue,
        queue: To.queue,
        next: null,
      };
      if (Eo === null) {
        q.memoizedState = Eo = e;
      } else {
        Eo = Eo.next = e;
      }
    }
    return Eo;
  }
  function Lo(e, t) {
    if (typeof t == `function`) {
      return t(e);
    }
    return t;
  }
  function Ro(e) {
    const t = Io();
    const t_queue = t.queue;
    if (t_queue === null) {
      throw Error(i(311));
    }
    t_queue.lastRenderedReducer = e;
    let r = To;
    let r_baseQueue = r.baseQueue;
    let n_pending = t_queue.pending;
    if (n_pending !== null) {
      if (r_baseQueue !== null) {
        var s = r_baseQueue.next;
        r_baseQueue.next = n_pending.next;
        n_pending.next = s;
      }
      r.baseQueue = r_baseQueue = n_pending;
      t_queue.pending = null;
    }
    if (r_baseQueue !== null) {
      n_pending = r_baseQueue.next;
      r = r.baseState;
      let c = (s = null);
      let l = null;
      let u = n_pending;
      do {
        const d = u.lane;
        if ((wo & d) === d) {
          if (l !== null) {
            l = l.next = {
              lane: 0,
              action: u.action,
              hasEagerState: u.hasEagerState,
              eagerState: u.eagerState,
              next: null,
            };
          }
          r = u.hasEagerState ? u.eagerState : e(r, u.action);
        } else {
          const f = {
            lane: d,
            action: u.action,
            hasEagerState: u.hasEagerState,
            eagerState: u.eagerState,
            next: null,
          };
          if (l === null) {
            c = l = f;
            s = r;
          } else {
            l = l.next = f;
          }
          q.lanes |= d;
          Xc |= d;
        }
        u = u.next;
      } while (u !== null && u !== n_pending);
      if (l === null) {
        s = r;
      } else {
        l.next = c;
      }
      if (!Ar(r, t.memoizedState)) {
        Is = true;
      }
      t.memoizedState = r;
      t.baseState = s;
      t.baseQueue = l;
      t_queue.lastRenderedState = r;
    }
    e = t_queue.interleaved;
    if (e !== null) {
      r_baseQueue = e;
      do {
        n_pending = r_baseQueue.lane;
        q.lanes |= n_pending;
        Xc |= n_pending;
        r_baseQueue = r_baseQueue.next;
      } while (r_baseQueue !== e);
    } else {
      if (r_baseQueue === null) {
        t_queue.lanes = 0;
      }
    }
    return [t.memoizedState, t_queue.dispatch];
  }
  function zo(e) {
    const t = Io();
    const t_queue = t.queue;
    if (t_queue === null) {
      throw Error(i(311));
    }
    t_queue.lastRenderedReducer = e;
    const n_dispatch = t_queue.dispatch;
    let n_pending = t_queue.pending;
    let t_memoizedState = t.memoizedState;
    if (n_pending !== null) {
      t_queue.pending = null;
      let s = (n_pending = n_pending.next);
      do {
        t_memoizedState = e(t_memoizedState, s.action);
        s = s.next;
      } while (s !== n_pending);
      if (!Ar(t_memoizedState, t.memoizedState)) {
        Is = true;
      }
      t.memoizedState = t_memoizedState;
      if (t.baseQueue === null) {
        t.baseState = t_memoizedState;
      }
      t_queue.lastRenderedState = t_memoizedState;
    }
    return [t_memoizedState, n_dispatch];
  }
  function useMutableSource() {}
  function useSyncExternalStore(e, t) {
    const n = q;
    let r = Io();
    const a = t();
    const o = !Ar(r.memoizedState, a);
    if (o) {
      r.memoizedState = a;
      Is = true;
    }
    r = r.queue;
    $o(Wo.bind(null, n, r, e), [e]);
    if (r.getSnapshot !== t || o || (Eo !== null && Eo.memoizedState.tag & 1)) {
      n.flags |= 2048;
      Jo(9, Uo.bind(null, n, r, a, t), undefined, null);
      if (Wc === null) {
        throw Error(i(349));
      }
      if (!(wo & 30)) {
        Ho(n, t, a);
      }
    }
    return a;
  }
  function Ho(e, t, n) {
    e.flags |= 16384;
    e = {
      getSnapshot: t,
      value: n,
    };
    t = q.updateQueue;
    if (t === null) {
      t = {
        lastEffect: null,
        stores: null,
      };
      q.updateQueue = t;
      t.stores = [e];
    } else {
      n = t.stores;
      if (n === null) {
        t.stores = [e];
      } else {
        n.push(e);
      }
    }
  }
  function Uo(e, t, n, r) {
    t.value = n;
    t.getSnapshot = r;
    if (Go(t)) {
      Ko(e);
    }
  }
  function Wo(e, t, n) {
    return n(() => {
      if (Go(t)) {
        Ko(e);
      }
    });
  }
  function Go(e) {
    const e_getSnapshot = e.getSnapshot;
    e = e.value;
    try {
      const n = e_getSnapshot();
      return !Ar(e, n);
    } catch {
      return true;
    }
  }
  function Ko(e) {
    const t = eo(e, 1);
    if (t !== null) {
      gl(t, e, 1, -1);
    }
  }
  function useState(e) {
    const t = Fo();
    if (typeof e == `function`) {
      e = e();
    }
    t.memoizedState = t.baseState = e;
    e = {
      pending: null,
      interleaved: null,
      lanes: 0,
      dispatch: null,
      lastRenderedReducer: Lo,
      lastRenderedState: e,
    };
    t.queue = e;
    e = e.dispatch = ds.bind(null, q, e);
    return [t.memoizedState, e];
  }
  function Jo(tag, create, destroy, deps) {
    tag = {
      tag,
      create,
      destroy,
      deps,
      next: null,
    };
    create = q.updateQueue;
    if (create === null) {
      create = {
        lastEffect: null,
        stores: null,
      };
      q.updateQueue = create;
      create.lastEffect = tag.next = tag;
    } else {
      destroy = create.lastEffect;
      if (destroy === null) {
        create.lastEffect = tag.next = tag;
      } else {
        deps = destroy.next;
        destroy.next = tag;
        tag.next = deps;
        create.lastEffect = tag;
      }
    }
    return tag;
  }
  function useRef() {
    return Io().memoizedState;
  }
  function Xo(e, t, n, r) {
    const i = Fo();
    q.flags |= e;
    i.memoizedState = Jo(1 | t, n, undefined, r === undefined ? null : r);
  }
  function Zo(e, t, n, r) {
    const i = Io();
    r = r === undefined ? null : r;
    let a;
    if (To !== null) {
      const o = To.memoizedState;
      a = o.destroy;
      if (r !== null && Mo(r, o.deps)) {
        i.memoizedState = Jo(t, n, a, r);
        return;
      }
    }
    q.flags |= e;
    i.memoizedState = Jo(1 | t, n, a, r);
  }
  function Qo(e, t) {
    return Xo(8390656, 8, e, t);
  }
  function $o(e, t) {
    return Zo(2048, 8, e, t);
  }
  function useInsertionEffect(e, t) {
    return Zo(4, 2, e, t);
  }
  function useLayoutEffect(e, t) {
    return Zo(4, 4, e, t);
  }
  function ns(e, t) {
    if (typeof t == `function`) {
      e = e();
      t(e);
      return () => {
        t(null);
      };
    }
    if (t != null) {
      e = e();
      t.current = e;
      return () => {
        t.current = null;
      };
    }
  }
  function useImperativeHandle(e, t, n) {
    n = n == null ? null : n.concat([e]);
    return Zo(4, 4, ns.bind(null, t, e), n);
  }
  function useDebugValue() {}
  function useCallback(e, t) {
    const n = Io();
    t = t === undefined ? null : t;
    const n_memoizedState = n.memoizedState;
    if (n_memoizedState !== null && t !== null && Mo(t, n_memoizedState[1])) {
      return n_memoizedState[0];
    }
    return ((n.memoizedState = [e, t]), e);
  }
  function useMemo(e, t) {
    const n = Io();
    t = t === undefined ? null : t;
    const n_memoizedState = n.memoizedState;
    if (n_memoizedState !== null && t !== null && Mo(t, n_memoizedState[1])) {
      return n_memoizedState[0];
    }
    return ((e = e()), (n.memoizedState = [e, t]), e);
  }
  function ss(e, memoizedState, n) {
    if (wo & 21) {
      return (
        Ar(n, memoizedState) ||
          ((n = Rt()), (q.lanes |= n), (Xc |= n), (e.baseState = true)),
        memoizedState
      );
    }
    return (
      e.baseState && ((e.baseState = false), (Is = true)),
      (e.memoizedState = n)
    );
  }
  function cs(e, t) {
    const n = z;
    z = n !== 0 && n < 4 ? n : 4;
    e(true);
    const C_ReactCurrentBatchConfig_2_transition =
      C_ReactCurrentBatchConfig_2.transition;
    C_ReactCurrentBatchConfig_2.transition = {};
    try {
      e(false);
      t();
    } finally {
      z = n;
      C_ReactCurrentBatchConfig_2.transition =
        C_ReactCurrentBatchConfig_2_transition;
    }
  }
  function useId() {
    return Io().memoizedState;
  }
  function us(e, t, n) {
    const r = hl(e);
    n = {
      lane: r,
      action: n,
      hasEagerState: false,
      eagerState: null,
      next: null,
    };
    if (fs(e)) {
      ps(t, n);
    } else {
      n = $a(e, t, n, r);
      if (n !== null) {
        const i = ml();
        gl(n, e, r, i);
        ms(n, t, r);
      }
    }
  }
  function ds(e, t, n) {
    const r = hl(e);
    let i = {
      lane: r,
      action: n,
      hasEagerState: false,
      eagerState: null,
      next: null,
    };
    if (fs(e)) {
      ps(t, i);
    } else {
      let a = e.alternate;
      if (
        e.lanes === 0 &&
        (a === null || a.lanes === 0) &&
        ((a = t.lastRenderedReducer), a !== null)
      ) {
        try {
          const o = t.lastRenderedState;
          const s = a(o, n);
          i.hasEagerState = true;
          i.eagerState = s;
          if (Ar(s, o)) {
            const c = t.interleaved;
            if (c === null) {
              i.next = i;
              Qa(t);
            } else {
              i.next = c.next;
              c.next = i;
            }
            t.interleaved = i;
            return;
          }
        } catch {}
      }
      n = $a(e, t, i, r);
      if (n !== null) {
        i = ml();
        gl(n, e, r, i);
        ms(n, t, r);
      }
    }
  }
  function fs(e) {
    const e_alternate = e.alternate;
    return e === q || (e_alternate !== null && e_alternate === q);
  }
  function ps(e, t) {
    Do = true;
    Oo = true;
    const e_pending = e.pending;
    if (e_pending === null) {
      t.next = t;
    } else {
      t.next = e_pending.next;
      e_pending.next = t;
    }
    e.pending = t;
  }
  function ms(e, t, n) {
    if (n & 4194240) {
      let r = t.lanes;
      r &= e.pendingLanes;
      n |= r;
      t.lanes = n;
      Ht(e, n);
    }
  }
  var hs = {
    readContext: Xa,
    useCallback: jo,
    useContext: jo,
    useEffect: jo,
    useImperativeHandle: jo,
    useInsertionEffect: jo,
    useLayoutEffect: jo,
    useMemo: jo,
    useReducer: jo,
    useRef: jo,
    useState: jo,
    useDebugValue: jo,
    useDeferredValue: jo,
    useTransition: jo,
    useMutableSource: jo,
    useSyncExternalStore: jo,
    useId: jo,
    unstable_isNewReconciler: false,
  };
  var gs = {
    readContext: Xa,
    useCallback(e, t) {
      Fo().memoizedState = [e, t === undefined ? null : t];
      return e;
    },
    useContext: Xa,
    useEffect: Qo,
    useImperativeHandle(e, t, n) {
      n = n == null ? null : n.concat([e]);
      return Xo(4194308, 4, ns.bind(null, t, e), n);
    },
    useLayoutEffect(e, t) {
      return Xo(4194308, 4, e, t);
    },
    useInsertionEffect(e, t) {
      return Xo(4, 2, e, t);
    },
    useMemo(e, t) {
      const n = Fo();
      t = t === undefined ? null : t;
      e = e();
      n.memoizedState = [e, t];
      return e;
    },
    useReducer(e, t, n) {
      const r = Fo();
      t = n === undefined ? t : n(t);
      r.memoizedState = r.baseState = t;
      e = {
        pending: null,
        interleaved: null,
        lanes: 0,
        dispatch: null,
        lastRenderedReducer: e,
        lastRenderedState: t,
      };
      r.queue = e;
      e = e.dispatch = us.bind(null, q, e);
      return [r.memoizedState, e];
    },
    useRef(current) {
      const t = Fo();
      current = {
        current,
      };
      return (t.memoizedState = current);
    },
    useState,
    useDebugValue,
    useDeferredValue(e) {
      return (Fo().memoizedState = e);
    },
    useTransition() {
      let e = useState(false);
      const t = e[0];
      e = cs.bind(null, e[1]);
      Fo().memoizedState = e;
      return [t, e];
    },
    useMutableSource() {},
    useSyncExternalStore(e, t, n) {
      const r = q;
      const a = Fo();
      if (W) {
        if (n === undefined) {
          throw Error(i(407));
        }
        n = n();
      } else {
        n = t();
        if (Wc === null) {
          throw Error(i(349));
        }
        if (!(wo & 30)) {
          Ho(r, t, n);
        }
      }
      a.memoizedState = n;
      const o = {
        value: n,
        getSnapshot: t,
      };
      a.queue = o;
      Qo(Wo.bind(null, r, o, e), [e]);
      r.flags |= 2048;
      Jo(9, Uo.bind(null, r, o, n, t), undefined, null);
      return n;
    },
    useId() {
      const e = Fo();
      let Wc_identifierPrefix = Wc.identifierPrefix;
      if (W) {
        var n = overflow;
        const r = _a;
        n = (r & ~(1 << (32 - Ot(r) - 1))).toString(32) + n;
        Wc_identifierPrefix = `:` + Wc_identifierPrefix + `R` + n;
        n = ko++;
        if (n > 0) {
          Wc_identifierPrefix += `H` + n.toString(32);
        }
        Wc_identifierPrefix += `:`;
      } else {
        n = Ao++;
        Wc_identifierPrefix =
          `:` + Wc_identifierPrefix + `r` + n.toString(32) + `:`;
      }
      return (e.memoizedState = Wc_identifierPrefix);
    },
    unstable_isNewReconciler: false,
  };
  var _s = {
    readContext: Xa,
    useCallback,
    useContext: Xa,
    useEffect: $o,
    useImperativeHandle,
    useInsertionEffect,
    useLayoutEffect,
    useMemo,
    useReducer: Ro,
    useRef,
    useState() {
      return Ro(Lo);
    },
    useDebugValue,
    useDeferredValue(e) {
      return ss(Io(), To.memoizedState, e);
    },
    useTransition() {
      return [Ro(Lo)[0], Io().memoizedState];
    },
    useMutableSource,
    useSyncExternalStore,
    useId,
    unstable_isNewReconciler: false,
  };
  var vs = {
    readContext: Xa,
    useCallback,
    useContext: Xa,
    useEffect: $o,
    useImperativeHandle,
    useInsertionEffect,
    useLayoutEffect,
    useMemo,
    useReducer: zo,
    useRef,
    useState() {
      return zo(Lo);
    },
    useDebugValue,
    useDeferredValue(e) {
      const t = Io();
      if (To === null) {
        return (t.memoizedState = e);
      }
      return ss(t, To.memoizedState, e);
    },
    useTransition() {
      return [zo(Lo)[0], Io().memoizedState];
    },
    useMutableSource,
    useSyncExternalStore,
    useId,
    unstable_isNewReconciler: false,
  };
  function ys(e, t) {
    if (e && e.defaultProps) {
      t = Object_assign({}, t);
      e = e.defaultProps;
      for (const n in e) {
        if (t[n] === undefined) {
          t[n] = e[n];
        }
      }
      return t;
    }
    return t;
  }
  function bs(e, t, n, r) {
    t = e.memoizedState;
    n = n(r, t);
    n = n == null ? t : Object_assign({}, t, n);
    e.memoizedState = n;
    if (e.lanes === 0) {
      e.updateQueue.baseState = n;
    }
  }
  var xs = {
    isMounted(e) {
      if ((e = e._reactInternals)) {
        return ut(e) === e;
      }
      return false;
    },
    enqueueSetState(e, t, n) {
      e = e._reactInternals;
      const r = ml();
      const i = hl(e);
      const a = io(r, i);
      a.payload = t;
      if (n != null) {
        a.callback = n;
      }
      t = ao(e, a, i);
      if (t !== null) {
        gl(t, e, i, r);
        oo(t, e, i);
      }
    },
    enqueueReplaceState(e, t, n) {
      e = e._reactInternals;
      const r = ml();
      const i = hl(e);
      const a = io(r, i);
      a.tag = 1;
      a.payload = t;
      if (n != null) {
        a.callback = n;
      }
      t = ao(e, a, i);
      if (t !== null) {
        gl(t, e, i, r);
        oo(t, e, i);
      }
    },
    enqueueForceUpdate(e, t) {
      e = e._reactInternals;
      const n = ml();
      const r = hl(e);
      const i = io(n, r);
      i.tag = 2;
      if (t != null) {
        i.callback = t;
      }
      t = ao(e, i, r);
      if (t !== null) {
        gl(t, e, r, n);
        oo(t, e, r);
      }
    },
  };
  function Ss(e, t, n, r, i, a, o) {
    e = e.stateNode;
    if (typeof e.shouldComponentUpdate == `function`) {
      return e.shouldComponentUpdate(r, a, o);
    }
    if (t.prototype && t.prototype.isPureReactComponent) {
      return !jr(n, r) || !jr(i, a);
    }
    return true;
  }
  function Cs(e, t, n) {
    let r = false;
    let i = qi;
    let t_contextType = t.contextType;
    if (typeof t_contextType == `object` && t_contextType) {
      t_contextType = Xa(t_contextType);
    } else {
      i = Qi(t) ? Xi : Ji.current;
      r = t.contextTypes;
      t_contextType = (r = r != null) ? Zi(e, i) : qi;
    }
    t = new t(n, t_contextType);
    e.memoizedState = t.state ?? null;
    t.updater = xs;
    e.stateNode = t;
    t._reactInternals = e;
    if (r) {
      e = e.stateNode;
      e.__reactInternalMemoizedUnmaskedChildContext = i;
      e.__reactInternalMemoizedMaskedChildContext = t_contextType;
    }
    return t;
  }
  function ws(e, t, n, r) {
    e = t.state;
    if (typeof t.componentWillReceiveProps == `function`) {
      t.componentWillReceiveProps(n, r);
    }
    if (typeof t.UNSAFE_componentWillReceiveProps == `function`) {
      t.UNSAFE_componentWillReceiveProps(n, r);
    }
    if (t.state !== e) {
      xs.enqueueReplaceState(t, t.state, null);
    }
  }
  function Ts(e, t, n, r) {
    const e_stateNode = e.stateNode;
    e_stateNode.props = n;
    e_stateNode.state = e.memoizedState;
    e_stateNode.refs = {};
    no(e);
    let t_contextType = t.contextType;
    if (typeof t_contextType == `object` && t_contextType) {
      e_stateNode.context = Xa(t_contextType);
    } else {
      t_contextType = Qi(t) ? Xi : Ji.current;
      e_stateNode.context = Zi(e, t_contextType);
    }
    e_stateNode.state = e.memoizedState;
    t_contextType = t.getDerivedStateFromProps;
    if (typeof t_contextType == `function`) {
      bs(e, t, t_contextType, n);
      e_stateNode.state = e.memoizedState;
    }
    if (!(
      typeof t.getDerivedStateFromProps == `function` ||
      typeof e_stateNode.getSnapshotBeforeUpdate == `function` ||
      (typeof e_stateNode.UNSAFE_componentWillMount != `function` &&
        typeof e_stateNode.componentWillMount != `function`)
    )) {
      t = e_stateNode.state;
      if (typeof e_stateNode.componentWillMount == `function`) {
        e_stateNode.componentWillMount();
      }
      if (typeof e_stateNode.UNSAFE_componentWillMount == `function`) {
        e_stateNode.UNSAFE_componentWillMount();
      }
      if (t !== e_stateNode.state) {
        xs.enqueueReplaceState(e_stateNode, e_stateNode.state, null);
      }
      co(e, n, e_stateNode, r);
      e_stateNode.state = e.memoizedState;
    }
    if (typeof e_stateNode.componentDidMount == `function`) {
      e.flags |= 4194308;
    }
  }
  function Es(e, source) {
    try {
      let n = ``;
      let r = source;
      do {
        n += ue(r);
        r = r.return;
      } while (r);
      var stack = n;
    } catch (error) {
      stack =
        `
Error generating stack: ` +
        error.message +
        `
` +
        error.stack;
    }
    return {
      value: e,
      source,
      stack,
      digest: null,
    };
  }
  function Ds(e, t, n) {
    return {
      value: e,
      source: null,
      stack: n ?? null,
      digest: t ?? null,
    };
  }
  function Os(e, t) {
    try {
      console.error(t.value);
    } catch (error) {
      setTimeout(() => {
        throw error;
      });
    }
  }
  var ks = typeof WeakMap == `function` ? WeakMap : Map;
  function As(e, t, n) {
    n = io(-1, n);
    n.tag = 3;
    n.payload = {
      element: null,
    };
    const t_value = t.value;
    n.callback = () => {
      if (!il) {
        il = true;
        al = t_value;
      }
      Os(e, t);
    };
    return n;
  }
  function js(e, t, n) {
    n = io(-1, n);
    n.tag = 3;
    const getDerivedStateFromError = e.type.getDerivedStateFromError;
    if (typeof getDerivedStateFromError == `function`) {
      const i = t.value;
      n.payload = () => getDerivedStateFromError(i);
      n.callback = () => {
        Os(e, t);
      };
    }
    const e_stateNode = e.stateNode;
    if (
      e_stateNode !== null &&
      typeof e_stateNode.componentDidCatch == `function`
    ) {
      n.callback = function () {
        Os(e, t);
        typeof getDerivedStateFromError != `function` &&
          (ol === null ? (ol = new Set([this])) : ol.add(this));
        const t_stack = t.stack;
        this.componentDidCatch(t.value, {
          componentStack: t_stack === null ? `` : t_stack,
        });
      };
    }
    return n;
  }
  function Ms(e, t, n) {
    let e_pingCache = e.pingCache;
    if (e_pingCache === null) {
      e_pingCache = e.pingCache = new ks();
      var i = new Set();
      e_pingCache.set(t, i);
    } else {
      i = e_pingCache.get(t);
      if (i === undefined) {
        i = new Set();
        e_pingCache.set(t, i);
      }
    }
    if (!i.has(n)) {
      i.add(n);
      e = Bl.bind(null, e, t, n);
      t.then(e, e);
    }
  }
  function Ns(e) {
    do {
      let t;
      if ((t = e.tag === 13)) {
        t = e.memoizedState;
        t = t === null || t.dehydrated !== null;
      }
      if (t) {
        return e;
      }
      e = e.return;
    } while (e !== null);
    return null;
  }
  function Ps(e, t, n, r, i) {
    if (e.mode & 1) {
      return ((e.flags |= 65536), (e.lanes = i), e);
    }
    return (
      e === t
        ? (e.flags |= 65536)
        : ((e.flags |= 128),
          (n.flags |= 131072),
          (n.flags &= -52805),
          n.tag === 1 &&
            (n.alternate === null
              ? (n.tag = 17)
              : ((t = io(-1, 1)), (t.tag = 2), ao(n, t, 1))),
          (n.lanes |= 1)),
      e
    );
  }
  var C_ReactCurrentOwner =
    n___SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner;
  var Is = false;
  function Ls(e, t, n, r) {
    t.child = e === null ? Va(t, null, n, r) : Ba(t, e.child, n, r);
  }
  function Rs(e, t, n, r, i) {
    n = n.render;
    const t_ref = t.ref;
    Ya(t, i);
    r = No(e, t, n, r, t_ref, i);
    n = Po();
    if (e !== null && !Is) {
      return (
        (t.updateQueue = e.updateQueue),
        (t.flags &= -2053),
        (e.lanes &= ~i),
        ic(e, t, i)
      );
    }
    return (W && n && xa(t), (t.flags |= 1), Ls(e, t, r, i), t.child);
  }
  function zs(e, t, n, r, i) {
    if (e === null) {
      var a = n.type;
      if (
        typeof a == `function` &&
        !Jl(a) &&
        a.defaultProps === undefined &&
        n.compare === null &&
        n.defaultProps === undefined
      ) {
        return ((t.tag = 15), (t.type = a), Bs(e, t, a, r, i));
      }
      return (
        (e = Zl(n.type, null, r, t, t.mode, i)),
        (e.ref = t.ref),
        (e.return = t),
        (t.child = e)
      );
    }
    a = e.child;
    if ((e.lanes & i) === 0) {
      const o = a.memoizedProps;
      n = n.compare;
      n = n === null ? jr : n;
      if (n(o, r) && e.ref === t.ref) {
        return ic(e, t, i);
      }
    }
    t.flags |= 1;
    e = Xl(a, r);
    e.ref = t.ref;
    e.return = t;
    return (t.child = e);
  }
  function Bs(e, t, n, r, i) {
    if (e !== null) {
      const a = e.memoizedProps;
      if (jr(a, r) && e.ref === t.ref) {
        Is = false;
        t.pendingProps = r = a;
        if ((e.lanes & i) !== 0) {
          if (e.flags & 131072) {
            Is = true;
          }
        } else {
          t.lanes = e.lanes;
          return ic(e, t, i);
        }
      }
    }
    return Us(e, t, n, r, i);
  }
  function Vs(baseLanes, t, n) {
    let t_pendingProps = t.pendingProps;
    const r_children = t_pendingProps.children;
    const a = baseLanes === null ? null : baseLanes.memoizedState;
    if (t_pendingProps.mode === `hidden`) {
      if (!(t.mode & 1)) {
        t.memoizedState = {
          baseLanes: 0,
          cachePool: null,
          transitions: null,
        };
        U(qc, Kc);
        Kc |= n;
      } else {
        if (!(n & 1073741824)) {
          baseLanes = a === null ? n : a.baseLanes | n;
          t.lanes = t.childLanes = 1073741824;
          t.memoizedState = {
            baseLanes,
            cachePool: null,
            transitions: null,
          };
          t.updateQueue = null;
          U(qc, Kc);
          Kc |= baseLanes;
          return null;
        }
        t.memoizedState = {
          baseLanes: 0,
          cachePool: null,
          transitions: null,
        };
        t_pendingProps = a === null ? n : a.baseLanes;
        U(qc, Kc);
        Kc |= t_pendingProps;
      }
    } else {
      if (a === null) {
        t_pendingProps = n;
      } else {
        t_pendingProps = a.baseLanes | n;
        t.memoizedState = null;
      }
      U(qc, Kc);
      Kc |= t_pendingProps;
    }
    Ls(baseLanes, t, r_children, n);
    return t.child;
  }
  function Hs(e, t) {
    const t_ref = t.ref;
    if ((e === null && t_ref !== null) || (e !== null && e.ref !== t_ref)) {
      t.flags |= 512;
      t.flags |= 2097152;
    }
  }
  function Us(e, t, n, r, i) {
    let a = Qi(n) ? Xi : Ji.current;
    a = Zi(t, a);
    Ya(t, i);
    n = No(e, t, n, r, a, i);
    r = Po();
    if (e !== null && !Is) {
      return (
        (t.updateQueue = e.updateQueue),
        (t.flags &= -2053),
        (e.lanes &= ~i),
        ic(e, t, i)
      );
    }
    return (W && r && xa(t), (t.flags |= 1), Ls(e, t, n, i), t.child);
  }
  function Ws(e, t, n, r, i) {
    if (Qi(n)) {
      var a = true;
      na(t);
    } else {
      a = false;
    }
    Ya(t, i);
    if (t.stateNode === null) {
      rc(e, t);
      Cs(t, n, r);
      Ts(t, n, r, i);
      r = true;
    } else if (e === null) {
      var o = t.stateNode;
      var s = t.memoizedProps;
      o.props = s;
      var c = o.context;
      var l = n.contextType;
      if (typeof l == `object` && l) {
        l = Xa(l);
      } else {
        l = Qi(n) ? Xi : Ji.current;
        l = Zi(t, l);
      }
      var u = n.getDerivedStateFromProps;
      var d =
        typeof u == `function` ||
        typeof o.getSnapshotBeforeUpdate == `function`;
      d ||
        (typeof o.UNSAFE_componentWillReceiveProps != `function` &&
          typeof o.componentWillReceiveProps != `function`) ||
        ((s !== r || c !== l) && ws(t, o, r, l));
      to = false;
      var f = t.memoizedState;
      o.state = f;
      co(t, r, o, i);
      c = t.memoizedState;
      if (s !== r || f !== c || Yi.current || to) {
        if (typeof u == `function`) {
          bs(t, n, u, r);
          c = t.memoizedState;
        }
        if ((s = to || Ss(t, n, s, r, f, c, l))) {
          d ||
            (typeof o.UNSAFE_componentWillMount != `function` &&
              typeof o.componentWillMount != `function`) ||
            (typeof o.componentWillMount == `function` &&
              o.componentWillMount(),
            typeof o.UNSAFE_componentWillMount == `function` &&
              o.UNSAFE_componentWillMount());
          if (typeof o.componentDidMount == `function`) {
            t.flags |= 4194308;
          }
        } else {
          if (typeof o.componentDidMount == `function`) {
            t.flags |= 4194308;
          }
          t.memoizedProps = r;
          t.memoizedState = c;
        }
        o.props = r;
        o.state = c;
        o.context = l;
        r = s;
      } else {
        if (typeof o.componentDidMount == `function`) {
          t.flags |= 4194308;
        }
        r = false;
      }
    } else {
      o = t.stateNode;
      ro(e, t);
      s = t.memoizedProps;
      l = t.type === t.elementType ? s : ys(t.type, s);
      o.props = l;
      d = t.pendingProps;
      f = o.context;
      c = n.contextType;
      if (typeof c == `object` && c) {
        c = Xa(c);
      } else {
        c = Qi(n) ? Xi : Ji.current;
        c = Zi(t, c);
      }
      const p = n.getDerivedStateFromProps;
      (u =
        typeof p == `function` ||
        typeof o.getSnapshotBeforeUpdate == `function`) ||
        (typeof o.UNSAFE_componentWillReceiveProps != `function` &&
          typeof o.componentWillReceiveProps != `function`) ||
        ((s !== d || f !== c) && ws(t, o, r, c));
      to = false;
      f = t.memoizedState;
      o.state = f;
      co(t, r, o, i);
      let m = t.memoizedState;
      if (s !== d || f !== m || Yi.current || to) {
        if (typeof p == `function`) {
          bs(t, n, p, r);
          m = t.memoizedState;
        }
        if ((l = to || Ss(t, n, l, r, f, m, c) || false)) {
          u ||
            (typeof o.UNSAFE_componentWillUpdate != `function` &&
              typeof o.componentWillUpdate != `function`) ||
            (typeof o.componentWillUpdate == `function` &&
              o.componentWillUpdate(r, m, c),
            typeof o.UNSAFE_componentWillUpdate == `function` &&
              o.UNSAFE_componentWillUpdate(r, m, c));
          if (typeof o.componentDidUpdate == `function`) {
            t.flags |= 4;
          }
          if (typeof o.getSnapshotBeforeUpdate == `function`) {
            t.flags |= 1024;
          }
        } else {
          if (!(
            typeof o.componentDidUpdate != `function` ||
            (s === e.memoizedProps && f === e.memoizedState)
          )) {
            t.flags |= 4;
          }
          if (!(
            typeof o.getSnapshotBeforeUpdate != `function` ||
            (s === e.memoizedProps && f === e.memoizedState)
          )) {
            t.flags |= 1024;
          }
          t.memoizedProps = r;
          t.memoizedState = m;
        }
        o.props = r;
        o.state = m;
        o.context = c;
        r = l;
      } else {
        if (!(
          typeof o.componentDidUpdate != `function` ||
          (s === e.memoizedProps && f === e.memoizedState)
        )) {
          t.flags |= 4;
        }
        if (!(
          typeof o.getSnapshotBeforeUpdate != `function` ||
          (s === e.memoizedProps && f === e.memoizedState)
        )) {
          t.flags |= 1024;
        }
        r = false;
      }
    }
    return Gs(e, t, n, r, a, i);
  }
  function Gs(e, t, n, r, i, a) {
    Hs(e, t);
    const o = !!(t.flags & 128);
    if (!r && !o) {
      if (i) {
        ra(t, n, false);
      }
      return ic(e, t, a);
    }
    r = t.stateNode;
    C_ReactCurrentOwner.current = t;
    const s =
      o && typeof n.getDerivedStateFromError != `function` ? null : r.render();
    t.flags |= 1;
    if (e !== null && o) {
      t.child = Ba(t, e.child, null, a);
      t.child = Ba(t, null, s, a);
    } else {
      Ls(e, t, s, a);
    }
    t.memoizedState = r.state;
    if (i) {
      ra(t, n, true);
    }
    return t.child;
  }
  function Ks(e) {
    const e_stateNode = e.stateNode;
    if (e_stateNode.pendingContext) {
      ea(
        e,
        e_stateNode.pendingContext,
        e_stateNode.pendingContext !== e_stateNode.context,
      );
    } else if (e_stateNode.context) {
      ea(e, e_stateNode.context, false);
    }
    ho(e, e_stateNode.containerInfo);
  }
  function qs(e, t, n, r, i) {
    Na();
    Pa(i);
    t.flags |= 256;
    Ls(e, t, n, r);
    return t.child;
  }
  var Js = {
    dehydrated: null,
    treeContext: null,
    retryLane: 0,
  };
  function Ys(baseLanes) {
    return {
      baseLanes,
      cachePool: null,
      transitions: null,
    };
  }
  function Xs(e, t, n) {
    let t_pendingProps = t.pendingProps;
    let K_current = K.current;
    let a = false;
    let o = !!(t.flags & 128);
    let s;
    if (!(s = o)) {
      s = e !== null && e.memoizedState === null ? false : !!(K_current & 2);
    }
    if (s) {
      a = true;
      t.flags &= -129;
    } else if (e === null || e.memoizedState !== null) {
      K_current |= 1;
    }
    U(K, K_current & 1);
    if (e === null) {
      ka(t);
      e = t.memoizedState;
      if (e !== null && ((e = e.dehydrated), e !== null)) {
        return (
          (t.lanes = t.mode & 1 ? (e.data === `$!` ? 8 : 1073741824) : 1),
          null
        );
      }
      return (
        (o = t_pendingProps.children),
        (e = t_pendingProps.fallback),
        a
          ? ((t_pendingProps = t.mode),
            (a = t.child),
            (o = {
              mode: `hidden`,
              children: o,
            }),
            !(t_pendingProps & 1) && a !== null
              ? ((a.childLanes = 0), (a.pendingProps = o))
              : (a = $l(o, t_pendingProps, 0, null)),
            (e = Ql(e, t_pendingProps, n, null)),
            (a.return = t),
            (e.return = t),
            (a.sibling = e),
            (t.child = a),
            (t.child.memoizedState = Ys(n)),
            (t.memoizedState = Js),
            e)
          : Zs(t, o)
      );
    }
    K_current = e.memoizedState;
    if (K_current !== null && ((s = K_current.dehydrated), s !== null)) {
      return $s(e, t, o, t_pendingProps, s, K_current, n);
    }
    if (a) {
      a = t_pendingProps.fallback;
      o = t.mode;
      K_current = e.child;
      s = K_current.sibling;
      const c = {
        mode: `hidden`,
        children: t_pendingProps.children,
      };
      if (!(o & 1) && t.child !== K_current) {
        t_pendingProps = t.child;
        t_pendingProps.childLanes = 0;
        t_pendingProps.pendingProps = c;
        t.deletions = null;
      } else {
        t_pendingProps = Xl(K_current, c);
        t_pendingProps.subtreeFlags = K_current.subtreeFlags & 14680064;
      }
      if (s === null) {
        a = Ql(a, o, n, null);
        a.flags |= 2;
      } else {
        a = Xl(s, a);
      }
      a.return = t;
      t_pendingProps.return = t;
      t_pendingProps.sibling = a;
      t.child = t_pendingProps;
      t_pendingProps = a;
      a = t.child;
      o = e.child.memoizedState;
      o =
        o === null
          ? Ys(n)
          : {
              baseLanes: o.baseLanes | n,
              cachePool: null,
              transitions: o.transitions,
            };
      a.memoizedState = o;
      a.childLanes = e.childLanes & ~n;
      t.memoizedState = Js;
      return t_pendingProps;
    }
    a = e.child;
    e = a.sibling;
    t_pendingProps = Xl(a, {
      mode: `visible`,
      children: t_pendingProps.children,
    });
    if (!(t.mode & 1)) {
      t_pendingProps.lanes = n;
    }
    t_pendingProps.return = t;
    t_pendingProps.sibling = null;
    if (e !== null) {
      n = t.deletions;
      if (n === null) {
        t.deletions = [e];
        t.flags |= 16;
      } else {
        n.push(e);
      }
    }
    t.child = t_pendingProps;
    t.memoizedState = null;
    return t_pendingProps;
  }
  function Zs(e, t) {
    t = $l(
      {
        mode: `visible`,
        children: t,
      },
      e.mode,
      0,
      null,
    );
    t.return = e;
    return (e.child = t);
  }
  function Qs(e, t, n, r) {
    if (r !== null) {
      Pa(r);
    }
    Ba(t, e.child, null, n);
    e = Zs(t, t.pendingProps.children);
    e.flags |= 2;
    t.memoizedState = null;
    return e;
  }
  function $s(e, t, n, r, a, o, s) {
    if (n) {
      if (t.flags & 256) {
        return ((t.flags &= -257), (r = Ds(Error(i(422)))), Qs(e, t, s, r));
      }
      if (t.memoizedState === null) {
        return (
          (o = r.fallback),
          (a = t.mode),
          (r = $l(
            {
              mode: `visible`,
              children: r.children,
            },
            a,
            0,
            null,
          )),
          (o = Ql(o, a, s, null)),
          (o.flags |= 2),
          (r.return = t),
          (o.return = t),
          (r.sibling = o),
          (t.child = r),
          t.mode & 1 && Ba(t, e.child, null, s),
          (t.child.memoizedState = Ys(s)),
          (t.memoizedState = Js),
          o
        );
      }
      return ((t.child = e.child), (t.flags |= 128), null);
    }
    if (!(t.mode & 1)) {
      return Qs(e, t, s, null);
    }
    if (a.data === `$!`) {
      r = a.nextSibling && a.nextSibling.dataset;
      if (r) var c = r.dgst;
      r = c;
      o = Error(i(419));
      r = Ds(o, r, undefined);
      return Qs(e, t, s, r);
    }
    c = (s & e.childLanes) !== 0;
    if (Is || c) {
      r = Wc;
      if (r !== null) {
        switch (s & -s) {
          case 4:
            a = 2;
            break;
          case 16:
            a = 8;
            break;
          case 64:
          case 128:
          case 256:
          case 512:
          case 1024:
          case 2048:
          case 4096:
          case 8192:
          case 16384:
          case 32768:
          case 65536:
          case 131072:
          case 262144:
          case 524288:
          case 1048576:
          case 2097152:
          case 4194304:
          case 8388608:
          case 16777216:
          case 33554432:
          case 67108864:
            a = 32;
            break;
          case 536870912:
            a = 268435456;
            break;
          default:
            a = 0;
        }
        a = (a & (r.suspendedLanes | s)) === 0 ? a : 0;
        if (a !== 0 && a !== o.retryLane) {
          o.retryLane = a;
          eo(e, a);
          gl(r, e, a, -1);
        }
      }
      Al();
      r = Ds(Error(i(421)));
      return Qs(e, t, s, r);
    }
    if (a.data === `$?`) {
      return (
        (t.flags |= 128),
        (t.child = e.child),
        (t = Hl.bind(null, e)),
        (a._reactRetry = t),
        null
      );
    }
    return (
      (e = o.treeContext),
      (wa = ji(a.nextSibling)),
      (Ca = t),
      (W = true),
      (Ta = null),
      e !== null &&
        ((ma[ha++] = _a),
        (ma[ha++] = overflow),
        (ma[ha++] = ga),
        (_a = e.id),
        (overflow = e.overflow),
        (ga = t)),
      (t = Zs(t, r.children)),
      (t.flags |= 4096),
      t
    );
  }
  function ec(e, t, n) {
    e.lanes |= t;
    const e_alternate = e.alternate;
    if (e_alternate !== null) {
      e_alternate.lanes |= t;
    }
    Ja(e.return, t, n);
  }
  function tc(e, isBackwards, tail, last, tailMode) {
    const e_memoizedState = e.memoizedState;
    if (e_memoizedState === null) {
      e.memoizedState = {
        isBackwards,
        rendering: null,
        renderingStartTime: 0,
        last,
        tail,
        tailMode,
      };
    } else {
      e_memoizedState.isBackwards = isBackwards;
      e_memoizedState.rendering = null;
      e_memoizedState.renderingStartTime = 0;
      e_memoizedState.last = last;
      e_memoizedState.tail = tail;
      e_memoizedState.tailMode = tailMode;
    }
  }
  function nc(e, t, n) {
    let t_pendingProps = t.pendingProps;
    let r_revealOrder = t_pendingProps.revealOrder;
    const r_tail = t_pendingProps.tail;
    Ls(e, t, t_pendingProps.children, n);
    t_pendingProps = K.current;
    if (t_pendingProps & 2) {
      t_pendingProps = (t_pendingProps & 1) | 2;
      t.flags |= 128;
    } else {
      if (e !== null && e.flags & 128) {
        a: for (e = t.child; e !== null;) {
          if (e.tag === 13) {
            if (e.memoizedState !== null) {
              ec(e, n, t);
            }
          } else if (e.tag === 19) {
            ec(e, n, t);
          } else if (e.child !== null) {
            e.child.return = e;
            e = e.child;
            continue;
          }
          if (e === t) {
            break a;
          }
          while (e.sibling === null) {
            if (e.return === null || e.return === t) {
              break a;
            }
            e = e.return;
          }
          e.sibling.return = e.return;
          e = e.sibling;
        }
      }
      t_pendingProps &= 1;
    }
    U(K, t_pendingProps);
    if (!(t.mode & 1)) {
      t.memoizedState = null;
    } else {
      switch (r_revealOrder) {
        case `forwards`:
          n = t.child;
          for (r_revealOrder = null; n !== null;) {
            e = n.alternate;
            if (e !== null && yo(e) === null) {
              r_revealOrder = n;
            }
            n = n.sibling;
          }
          n = r_revealOrder;
          if (n === null) {
            r_revealOrder = t.child;
            t.child = null;
          } else {
            r_revealOrder = n.sibling;
            n.sibling = null;
          }
          tc(t, false, r_revealOrder, n, r_tail);
          break;
        case `backwards`:
          n = null;
          r_revealOrder = t.child;
          for (t.child = null; r_revealOrder !== null;) {
            e = r_revealOrder.alternate;
            if (e !== null && yo(e) === null) {
              t.child = r_revealOrder;
              break;
            }
            e = r_revealOrder.sibling;
            r_revealOrder.sibling = n;
            n = r_revealOrder;
            r_revealOrder = e;
          }
          tc(t, true, n, null, r_tail);
          break;
        case `together`:
          tc(t, false, null, null, undefined);
          break;
        default:
          t.memoizedState = null;
      }
    }
    return t.child;
  }
  function rc(e, t) {
    if (!(t.mode & 1) && e !== null) {
      e.alternate = null;
      t.alternate = null;
      t.flags |= 2;
    }
  }
  function ic(e, t, n) {
    if (e !== null) {
      t.dependencies = e.dependencies;
    }
    Xc |= t.lanes;
    if ((n & t.childLanes) === 0) {
      return null;
    }
    if (e !== null && t.child !== e.child) {
      throw Error(i(153));
    }
    if (t.child !== null) {
      e = t.child;
      n = Xl(e, e.pendingProps);
      t.child = n;
      for (n.return = t; e.sibling !== null;) {
        e = e.sibling;
        n = n.sibling = Xl(e, e.pendingProps);
        n.return = t;
      }
      n.sibling = null;
    }
    return t.child;
  }
  function ac(e, t, n) {
    switch (t.tag) {
      case 3:
        Ks(t);
        Na();
        break;
      case 5:
        _o(t);
        break;
      case 1:
        if (Qi(t.type)) {
          na(t);
        }
        break;
      case 4:
        ho(t, t.stateNode.containerInfo);
        break;
      case 10:
        var r = t.type._context;
        var i = t.memoizedProps.value;
        U(Ha, r._currentValue);
        r._currentValue = i;
        break;
      case 13:
        r = t.memoizedState;
        if (r !== null) {
          if (r.dehydrated === null) {
            if ((n & t.child.childLanes) === 0) {
              return (
                U(K, K.current & 1),
                (e = ic(e, t, n)),
                e === null ? null : e.sibling
              );
            }
            return Xs(e, t, n);
          }
          return (U(K, K.current & 1), (t.flags |= 128), null);
        }
        U(K, K.current & 1);
        break;
      case 19:
        r = (n & t.childLanes) !== 0;
        if (e.flags & 128) {
          if (r) {
            return nc(e, t, n);
          }
          t.flags |= 128;
        }
        i = t.memoizedState;
        if (i !== null) {
          i.rendering = null;
          i.tail = null;
          i.lastEffect = null;
        }
        U(K, K.current);
        if (r) {
          break;
        }
        return null;
      case 22:
      case 23:
        t.lanes = 0;
        return Vs(e, t, n);
    }
    return ic(e, t, n);
  }
  var oc = (e, t) => {
    for (let n = t.child; n !== null;) {
      if (n.tag === 5 || n.tag === 6) {
        e.appendChild(n.stateNode);
      } else if (n.tag !== 4 && n.child !== null) {
        n.child.return = n;
        n = n.child;
        continue;
      }
      if (n === t) {
        break;
      }
      while (n.sibling === null) {
        if (n.return === null || n.return === t) {
          return;
        }
        n = n.return;
      }
      n.sibling.return = n.return;
      n = n.sibling;
    }
  };
  var sc = (e, t, n, r) => {
    let e_memoizedProps = e.memoizedProps;
    if (e_memoizedProps !== r) {
      e = t.stateNode;
      mo(G.current);
      let a = null;
      switch (n) {
        case `input`:
          e_memoizedProps = ye(e, e_memoizedProps);
          r = ye(e, r);
          a = [];
          break;
        case `select`:
          e_memoizedProps = Object_assign({}, e_memoizedProps, {
            value: undefined,
          });
          r = Object_assign({}, r, {
            value: undefined,
          });
          a = [];
          break;
        case `textarea`:
          e_memoizedProps = De(e, e_memoizedProps);
          r = De(e, r);
          a = [];
          break;
        default:
          if (
            typeof e_memoizedProps.onClick != `function` &&
            typeof r.onClick == `function`
          ) {
            e.onclick = xi;
          }
      }
      Be(n, r);
      let s;
      n = null;
      for (u in e_memoizedProps) {
        if (
          !r.hasOwnProperty(u) &&
          e_memoizedProps.hasOwnProperty(u) &&
          e_memoizedProps[u] != null
        ) {
          if (u === `style`) {
            var c = e_memoizedProps[u];
            for (s in c) {
              if (c.hasOwnProperty(s)) {
                n ||= {};
                n[s] = ``;
              }
            }
          } else {
            u !== `dangerouslySetInnerHTML` &&
              u !== `children` &&
              u !== `suppressContentEditableWarning` &&
              u !== `suppressHydrationWarning` &&
              u !== `autoFocus` &&
              (o.hasOwnProperty(u) ? (a ||= []) : (a ||= []).push(u, null));
          }
        }
      }
      for (u in r) {
        let l = r[u];
        c = e_memoizedProps?.[u];
        if (r.hasOwnProperty(u) && l !== c && (l != null || c != null)) {
          if (u === `style`) {
            if (c) {
              for (s in c) {
                if (!(!c.hasOwnProperty(s) || (l && l.hasOwnProperty(s)))) {
                  n ||= {};
                  n[s] = ``;
                }
              }
              for (s in l) {
                if (l.hasOwnProperty(s) && c[s] !== l[s]) {
                  n ||= {};
                  n[s] = l[s];
                }
              }
            } else {
              if (!n) {
                a ||= [];
                a.push(u, n);
              }
              n = l;
            }
          } else {
            if (u === `dangerouslySetInnerHTML`) {
              l = l ? l.__html : undefined;
              c = c ? c.__html : undefined;
              if (l != null && c !== l) {
                (a ||= []).push(u, l);
              }
            } else if (u === `children`) {
              if (!(typeof l != `string` && typeof l != `number`)) {
                (a ||= []).push(u, `` + l);
              }
            } else {
              u !== `suppressContentEditableWarning` &&
                u !== `suppressHydrationWarning` &&
                (o.hasOwnProperty(u)
                  ? (l != null && u === `onScroll` && V(`scroll`, e),
                    a || c === l || (a = []))
                  : (a ||= []).push(u, l));
            }
          }
        }
      }
      if (n) {
        (a ||= []).push(`style`, n);
      }
      var u = a;
      if ((t.updateQueue = u)) {
        t.flags |= 4;
      }
    }
  };
  var cc = (e, t, memoizedProps, r) => {
    if (memoizedProps !== r) {
      t.flags |= 4;
    }
  };
  function lc(e, t) {
    if (!W) {
      switch (e.tailMode) {
        case `hidden`:
          t = e.tail;
          var n = null;
          while (t !== null) {
            if (t.alternate !== null) {
              n = t;
            }
            t = t.sibling;
          }
          if (n === null) {
            e.tail = null;
          } else {
            n.sibling = null;
          }
          break;
        case `collapsed`:
          n = e.tail;
          let r = null;
          while (n !== null) {
            if (n.alternate !== null) {
              r = n;
            }
            n = n.sibling;
          }
          if (r === null) {
            if (t || e.tail === null) {
              e.tail = null;
            } else {
              e.tail.sibling = null;
            }
          } else {
            r.sibling = null;
          }
      }
    }
  }
  function uc(e) {
    const t = e.alternate !== null && e.alternate.child === e.child;
    let n = 0;
    let r = 0;
    if (t) {
      for (var i = e.child; i !== null;) {
        n |= i.lanes | i.childLanes;
        r |= i.subtreeFlags & 14680064;
        r |= i.flags & 14680064;
        i.return = e;
        i = i.sibling;
      }
    } else {
      for (i = e.child; i !== null;) {
        n |= i.lanes | i.childLanes;
        r |= i.subtreeFlags;
        r |= i.flags;
        i.return = e;
        i = i.sibling;
      }
    }
    e.subtreeFlags |= r;
    e.childLanes = n;
    return t;
  }
  function dc(e, t, n) {
    let t_pendingProps = t.pendingProps;
    Sa(t);
    switch (t.tag) {
      case 2:
      case 16:
      case 15:
      case 0:
      case 11:
      case 7:
      case 8:
      case 12:
      case 9:
      case 14:
        uc(t);
        return null;
      case 1:
        if (Qi(t.type)) {
          $i();
        }
        uc(t);
        return null;
      case 3:
        t_pendingProps = t.stateNode;
        go();
        H(Yi);
        H(Ji);
        xo();
        if (t_pendingProps.pendingContext) {
          t_pendingProps.context = t_pendingProps.pendingContext;
          t_pendingProps.pendingContext = null;
        }
        (e === null || e.child === null) &&
          (ja(t)
            ? (t.flags |= 4)
            : e === null ||
              (e.memoizedState.isDehydrated && !(t.flags & 256)) ||
              ((t.flags |= 1024), Ta !== null && (bl(Ta), (Ta = null))));
        uc(t);
        return null;
      case 5:
        vo(t);
        let a = mo(po.current);
        n = t.type;
        if (e !== null && t.stateNode != null) {
          sc(e, t, n, t_pendingProps, a);
          if (e.ref !== t.ref) {
            t.flags |= 512;
            t.flags |= 2097152;
          }
        } else {
          if (!t_pendingProps) {
            if (t.stateNode === null) {
              throw Error(i(166));
            }
            uc(t);
            return null;
          }
          e = mo(G.current);
          if (ja(t)) {
            t_pendingProps = t.stateNode;
            n = t.type;
            var s = t.memoizedProps;
            t_pendingProps[Pi] = t;
            t_pendingProps[Fi] = s;
            e = !!(t.mode & 1);
            switch (n) {
              case `dialog`:
                V(`cancel`, t_pendingProps);
                V(`close`, t_pendingProps);
                break;
              case `iframe`:
              case `object`:
              case `embed`:
                V(`load`, t_pendingProps);
                break;
              case `video`:
              case `audio`:
                for (a = 0; a < ii.length; a++) {
                  V(ii[a], t_pendingProps);
                }
                break;
              case `source`:
                V(`error`, t_pendingProps);
                break;
              case `img`:
              case `image`:
              case `link`:
                V(`error`, t_pendingProps);
                V(`load`, t_pendingProps);
                break;
              case `details`:
                V(`toggle`, t_pendingProps);
                break;
              case `input`:
                be(t_pendingProps, s);
                V(`invalid`, t_pendingProps);
                break;
              case `select`:
                t_pendingProps._wrapperState = {
                  wasMultiple: !!s.multiple,
                };
                V(`invalid`, t_pendingProps);
                break;
              case `textarea`:
                Oe(t_pendingProps, s);
                V(`invalid`, t_pendingProps);
            }
            Be(n, s);
            a = null;
            for (var c in s) {
              if (s.hasOwnProperty(c)) {
                var l = s[c];
                c === `children`
                  ? typeof l == `string`
                    ? t_pendingProps.textContent !== l &&
                      (s.suppressHydrationWarning !== true &&
                        bi(t_pendingProps.textContent, l, e),
                      (a = [`children`, l]))
                    : typeof l == `number` &&
                      t_pendingProps.textContent !== `` + l &&
                      (s.suppressHydrationWarning !== true &&
                        bi(t_pendingProps.textContent, l, e),
                      (a = [`children`, `` + l]))
                  : o.hasOwnProperty(c) &&
                    l != null &&
                    c === `onScroll` &&
                    V(`scroll`, t_pendingProps);
              }
            }
            switch (n) {
              case `input`:
                ge(t_pendingProps);
                Ce(t_pendingProps, s, true);
                break;
              case `textarea`:
                ge(t_pendingProps);
                Ae(t_pendingProps);
                break;
              case `select`:
              case `option`:
                break;
              default:
                if (typeof s.onClick == `function`) {
                  t_pendingProps.onclick = xi;
                }
            }
            t_pendingProps = a;
            t.updateQueue = t_pendingProps;
            if (t_pendingProps !== null) {
              t.flags |= 4;
            }
          } else {
            c = a.nodeType === 9 ? a : a.ownerDocument;
            if (e === `http://www.w3.org/1999/xhtml`) {
              e = je(n);
            }
            if (e === `http://www.w3.org/1999/xhtml`) {
              if (n === `script`) {
                e = c.createElement(`div`);
                e.innerHTML = `<script><\/script>`;
                e = e.removeChild(e.firstChild);
              } else if (typeof t_pendingProps.is == `string`) {
                e = c.createElement(n, {
                  is: t_pendingProps.is,
                });
              } else {
                e = c.createElement(n);
                if (n === `select`) {
                  c = e;
                  if (t_pendingProps.multiple) {
                    c.multiple = true;
                  } else if (t_pendingProps.size) {
                    c.size = t_pendingProps.size;
                  }
                }
              }
            } else {
              e = c.createElementNS(e, n);
            }
            e[Pi] = t;
            e[Fi] = t_pendingProps;
            oc(e, t, false, false);
            t.stateNode = e;
            a: {
              c = Ve(n, t_pendingProps);
              switch (n) {
                case `dialog`:
                  V(`cancel`, e);
                  V(`close`, e);
                  a = t_pendingProps;
                  break;
                case `iframe`:
                case `object`:
                case `embed`:
                  V(`load`, e);
                  a = t_pendingProps;
                  break;
                case `video`:
                case `audio`:
                  for (a = 0; a < ii.length; a++) {
                    V(ii[a], e);
                  }
                  a = t_pendingProps;
                  break;
                case `source`:
                  V(`error`, e);
                  a = t_pendingProps;
                  break;
                case `img`:
                case `image`:
                case `link`:
                  V(`error`, e);
                  V(`load`, e);
                  a = t_pendingProps;
                  break;
                case `details`:
                  V(`toggle`, e);
                  a = t_pendingProps;
                  break;
                case `input`:
                  be(e, t_pendingProps);
                  a = ye(e, t_pendingProps);
                  V(`invalid`, e);
                  break;
                case `option`:
                  a = t_pendingProps;
                  break;
                case `select`:
                  e._wrapperState = {
                    wasMultiple: !!t_pendingProps.multiple,
                  };
                  a = Object_assign({}, t_pendingProps, {
                    value: undefined,
                  });
                  V(`invalid`, e);
                  break;
                case `textarea`:
                  Oe(e, t_pendingProps);
                  a = De(e, t_pendingProps);
                  V(`invalid`, e);
                  break;
                default:
                  a = t_pendingProps;
              }
              Be(n, a);
              l = a;
              for (s in l) {
                if (l.hasOwnProperty(s)) {
                  let u = l[s];
                  if (s === `style`) {
                    Re(e, u);
                  } else if (s === `dangerouslySetInnerHTML`) {
                    u = u ? u.__html : undefined;
                    if (u != null) {
                      Pe(e, u);
                    }
                  } else if (s === `children`) {
                    if (typeof u == `string`) {
                      if (n !== `textarea` || u !== ``) {
                        Fe(e, u);
                      }
                    } else if (typeof u == `number`) {
                      Fe(e, `` + u);
                    }
                  } else {
                    s !== `suppressContentEditableWarning` &&
                      s !== `suppressHydrationWarning` &&
                      s !== `autoFocus` &&
                      (o.hasOwnProperty(s)
                        ? u != null && s === `onScroll` && V(`scroll`, e)
                        : u != null && x(e, s, u, c));
                  }
                }
              }
              switch (n) {
                case `input`:
                  ge(e);
                  Ce(e, t_pendingProps, false);
                  break;
                case `textarea`:
                  ge(e);
                  Ae(e);
                  break;
                case `option`:
                  if (t_pendingProps.value != null) {
                    e.setAttribute(`value`, `` + pe(t_pendingProps.value));
                  }
                  break;
                case `select`:
                  e.multiple = !!t_pendingProps.multiple;
                  s = t_pendingProps.value;
                  if (s == null) {
                    if (t_pendingProps.defaultValue != null) {
                      Ee(
                        e,
                        !!t_pendingProps.multiple,
                        t_pendingProps.defaultValue,
                        true,
                      );
                    }
                  } else {
                    Ee(e, !!t_pendingProps.multiple, s, false);
                  }
                  break;
                default:
                  if (typeof a.onClick == `function`) {
                    e.onclick = xi;
                  }
              }
              switch (n) {
                case `button`:
                case `input`:
                case `select`:
                case `textarea`:
                  t_pendingProps = !!t_pendingProps.autoFocus;
                  break a;
                case `img`:
                  t_pendingProps = true;
                  break a;
                default:
                  t_pendingProps = false;
              }
            }
            if (t_pendingProps) {
              t.flags |= 4;
            }
          }
          if (t.ref !== null) {
            t.flags |= 512;
            t.flags |= 2097152;
          }
        }
        uc(t);
        return null;
      case 6:
        if (e && t.stateNode != null) {
          cc(e, t, e.memoizedProps, t_pendingProps);
        } else {
          if (typeof t_pendingProps != `string` && t.stateNode === null) {
            throw Error(i(166));
          }
          n = mo(po.current);
          mo(G.current);
          if (ja(t)) {
            t_pendingProps = t.stateNode;
            n = t.memoizedProps;
            t_pendingProps[Pi] = t;
            if (
              (s = t_pendingProps.nodeValue !== n) &&
              ((e = Ca), e !== null)
            ) {
              switch (e.tag) {
                case 3:
                  bi(t_pendingProps.nodeValue, n, !!(e.mode & 1));
                  break;
                case 5:
                  if (e.memoizedProps.suppressHydrationWarning !== true) {
                    bi(t_pendingProps.nodeValue, n, !!(e.mode & 1));
                  }
              }
            }
            if (s) {
              t.flags |= 4;
            }
          } else {
            t_pendingProps = (
              n.nodeType === 9 ? n : n.ownerDocument
            ).createTextNode(t_pendingProps);
            t_pendingProps[Pi] = t;
            t.stateNode = t_pendingProps;
          }
        }
        uc(t);
        return null;
      case 13:
        H(K);
        t_pendingProps = t.memoizedState;
        if (
          e === null ||
          (e.memoizedState !== null && e.memoizedState.dehydrated !== null)
        ) {
          if (W && wa !== null && t.mode & 1 && !(t.flags & 128)) {
            Ma();
            Na();
            t.flags |= 98560;
            s = false;
          } else {
            s = ja(t);
            if (t_pendingProps !== null && t_pendingProps.dehydrated !== null) {
              if (e === null) {
                if (!s) {
                  throw Error(i(318));
                }
                s = t.memoizedState;
                s = s === null ? null : s.dehydrated;
                if (!s) {
                  throw Error(i(317));
                }
                s[Pi] = t;
              } else {
                Na();
                if (!(t.flags & 128)) {
                  t.memoizedState = null;
                }
                t.flags |= 4;
              }
              uc(t);
              s = false;
            } else {
              if (Ta !== null) {
                bl(Ta);
                Ta = null;
              }
              s = true;
            }
          }
          if (!s) {
            if (t.flags & 65536) {
              return t;
            }
            return null;
          }
        }
        if (t.flags & 128) {
          return ((t.lanes = n), t);
        }
        return (
          (t_pendingProps = t_pendingProps !== null),
          t_pendingProps !== (e !== null && e.memoizedState !== null) &&
            t_pendingProps &&
            ((t.child.flags |= 8192),
            t.mode & 1 &&
              (e === null || K.current & 1 ? Jc === 0 && (Jc = 3) : Al())),
          t.updateQueue !== null && (t.flags |= 4),
          uc(t),
          null
        );
      case 4:
        go();
        if (e === null) {
          ui(t.stateNode.containerInfo);
        }
        uc(t);
        return null;
      case 10:
        qa(t.type._context);
        uc(t);
        return null;
      case 17:
        if (Qi(t.type)) {
          $i();
        }
        uc(t);
        return null;
      case 19:
        H(K);
        s = t.memoizedState;
        if (s === null) {
          uc(t);
          return null;
        }
        t_pendingProps = !!(t.flags & 128);
        c = s.rendering;
        if (c === null) {
          if (t_pendingProps) {
            lc(s, false);
          } else {
            if (Jc !== 0 || (e !== null && e.flags & 128)) {
              for (e = t.child; e !== null;) {
                c = yo(e);
                if (c !== null) {
                  t.flags |= 128;
                  lc(s, false);
                  t_pendingProps = c.updateQueue;
                  if (t_pendingProps !== null) {
                    t.updateQueue = t_pendingProps;
                    t.flags |= 4;
                  }
                  t.subtreeFlags = 0;
                  t_pendingProps = n;
                  for (n = t.child; n !== null;) {
                    s = n;
                    e = t_pendingProps;
                    s.flags &= 14680066;
                    c = s.alternate;
                    if (c === null) {
                      s.childLanes = 0;
                      s.lanes = e;
                      s.child = null;
                      s.subtreeFlags = 0;
                      s.memoizedProps = null;
                      s.memoizedState = null;
                      s.updateQueue = null;
                      s.dependencies = null;
                      s.stateNode = null;
                    } else {
                      s.childLanes = c.childLanes;
                      s.lanes = c.lanes;
                      s.child = c.child;
                      s.subtreeFlags = 0;
                      s.deletions = null;
                      s.memoizedProps = c.memoizedProps;
                      s.memoizedState = c.memoizedState;
                      s.updateQueue = c.updateQueue;
                      s.type = c.type;
                      e = c.dependencies;
                      s.dependencies =
                        e === null
                          ? null
                          : {
                              lanes: e.lanes,
                              firstContext: e.firstContext,
                            };
                    }
                    n = n.sibling;
                  }
                  U(K, (K.current & 1) | 2);
                  return t.child;
                }
                e = e.sibling;
              }
            }
            if (s.tail !== null && r_unstable_now() > nl) {
              t.flags |= 128;
              t_pendingProps = true;
              lc(s, false);
              t.lanes = 4194304;
            }
          }
        } else {
          if (!t_pendingProps) {
            e = yo(c);
            if (e !== null) {
              t.flags |= 128;
              t_pendingProps = true;
              n = e.updateQueue;
              if (n !== null) {
                t.updateQueue = n;
                t.flags |= 4;
              }
              lc(s, true);
              if (
                s.tail === null &&
                s.tailMode === `hidden` &&
                !c.alternate &&
                !W
              ) {
                uc(t);
                return null;
              }
            } else {
              if (
                2 * r_unstable_now() - s.renderingStartTime > nl &&
                n !== 1073741824
              ) {
                t.flags |= 128;
                t_pendingProps = true;
                lc(s, false);
                t.lanes = 4194304;
              }
            }
          }
          if (s.isBackwards) {
            c.sibling = t.child;
            t.child = c;
          } else {
            n = s.last;
            if (n === null) {
              t.child = c;
            } else {
              n.sibling = c;
            }
            s.last = c;
          }
        }
        if (s.tail === null) {
          return (uc(t), null);
        }
        return (
          (t = s.tail),
          (s.rendering = t),
          (s.tail = t.sibling),
          (s.renderingStartTime = r_unstable_now()),
          (t.sibling = null),
          (n = K.current),
          U(K, t_pendingProps ? (n & 1) | 2 : n & 1),
          t
        );
      case 22:
      case 23:
        El();
        t_pendingProps = t.memoizedState !== null;
        if (e !== null && (e.memoizedState !== null) !== t_pendingProps) {
          t.flags |= 8192;
        }
        if (t_pendingProps && t.mode & 1) {
          if (Kc & 1073741824) {
            uc(t);
            if (t.subtreeFlags & 6) {
              t.flags |= 8192;
            }
          }
        } else {
          uc(t);
        }
        return null;
      case 24:
        return null;
      case 25:
        return null;
    }
    throw Error(i(156, t.tag));
  }
  function fc(e, t) {
    Sa(t);
    switch (t.tag) {
      case 1:
        if (Qi(t.type)) {
          $i();
        }
        e = t.flags;
        if (e & 65536) {
          return ((t.flags = (e & -65537) | 128), t);
        }
        return null;
      case 3:
        go();
        H(Yi);
        H(Ji);
        xo();
        e = t.flags;
        if (e & 65536 && !(e & 128)) {
          return ((t.flags = (e & -65537) | 128), t);
        }
        return null;
      case 5:
        vo(t);
        return null;
      case 13:
        H(K);
        e = t.memoizedState;
        if (e !== null && e.dehydrated !== null) {
          if (t.alternate === null) {
            throw Error(i(340));
          }
          Na();
        }
        e = t.flags;
        if (e & 65536) {
          return ((t.flags = (e & -65537) | 128), t);
        }
        return null;
      case 19:
        H(K);
        return null;
      case 4:
        go();
        return null;
      case 10:
        qa(t.type._context);
        return null;
      case 22:
      case 23:
        El();
        return null;
      case 24:
        return null;
      default:
        return null;
    }
  }
  var pc = false;
  var mc = false;
  var hc = typeof WeakSet == `function` ? WeakSet : Set;
  var J = null;
  function gc(e, t) {
    const e_ref = e.ref;
    if (e_ref !== null) {
      if (typeof e_ref == `function`) {
        try {
          e_ref(null);
        } catch (error) {
          Q(e, t, error);
        }
      } else {
        e_ref.current = null;
      }
    }
  }
  function _c(e, t, n) {
    try {
      n();
    } catch (error) {
      Q(e, t, error);
    }
  }
  var vc = false;
  function yc(focusedElem, t) {
    Si = mn;
    focusedElem = Fr();
    if (Ir(focusedElem)) {
      if (`selectionStart` in focusedElem)
        var selectionRange = {
          start: focusedElem.selectionStart,
          end: focusedElem.selectionEnd,
        };
      else {
        a: {
          selectionRange =
            ((selectionRange = focusedElem.ownerDocument) &&
              selectionRange.defaultView) ||
            window;
          let r = selectionRange.getSelection && selectionRange.getSelection();
          if (r && r.rangeCount !== 0) {
            selectionRange = r.anchorNode;
            const { anchorOffset, focusNode } = r;
            r = r.focusOffset;
            try {
              selectionRange.nodeType;
              focusNode.nodeType;
            } catch {
              selectionRange = null;
              break a;
            }
            let s = 0;
            let start = -1;
            let l = -1;
            let u = 0;
            let d = 0;
            let f = focusedElem;
            let p = null;
            b: while (true) {
              let m;
              while (
                (f !== selectionRange ||
                  (anchorOffset !== 0 && f.nodeType !== 3) ||
                  (start = s + anchorOffset),
                f !== focusNode || (r !== 0 && f.nodeType !== 3) || (l = s + r),
                f.nodeType === 3 && (s += f.nodeValue.length),
                (m = f.firstChild) !== null)
              ) {
                p = f;
                f = m;
              }
              while (true) {
                if (f === focusedElem) {
                  break b;
                }
                if (p === selectionRange && ++u === anchorOffset) {
                  start = s;
                }
                if (p === focusNode && ++d === r) {
                  l = s;
                }
                if ((m = f.nextSibling) !== null) {
                  break;
                }
                f = p;
                p = f.parentNode;
              }
              f = m;
            }
            selectionRange =
              start === -1 || l === -1
                ? null
                : {
                    start,
                    end: l,
                  };
          } else {
            selectionRange = null;
          }
        }
      }
      selectionRange ||= {
        start: 0,
        end: 0,
      };
    } else {
      selectionRange = null;
    }
    Ci = {
      focusedElem,
      selectionRange,
    };
    mn = false;
    for (J = t; J !== null;) {
      t = J;
      focusedElem = t.child;
      if (t.subtreeFlags & 1028 && focusedElem !== null) {
        focusedElem.return = t;
        J = focusedElem;
      } else {
        while (J !== null) {
          t = J;
          try {
            var h = t.alternate;
            if (t.flags & 1024) {
              switch (t.tag) {
                case 0:
                case 11:
                case 15:
                  break;
                case 1:
                  if (h !== null) {
                    const { memoizedProps, memoizedState } = h;
                    const v = t.stateNode;
                    v.__reactInternalSnapshotBeforeUpdate =
                      v.getSnapshotBeforeUpdate(
                        t.elementType === t.type
                          ? memoizedProps
                          : ys(t.type, memoizedProps),
                        memoizedState,
                      );
                  }
                  break;
                case 3:
                  const y = t.stateNode.containerInfo;
                  if (y.nodeType === 1) {
                    y.textContent = ``;
                  } else if (y.nodeType === 9 && y.documentElement) {
                    y.removeChild(y.documentElement);
                  }
                  break;
                case 5:
                case 6:
                case 4:
                case 17:
                  break;
                default:
                  throw Error(i(163));
              }
            }
          } catch (error) {
            Q(t, t.return, error);
          }
          focusedElem = t.sibling;
          if (focusedElem !== null) {
            focusedElem.return = t.return;
            J = focusedElem;
            break;
          }
          J = t.return;
        }
      }
    }
    h = vc;
    vc = false;
    return h;
  }
  function bc(e, t, n) {
    let t_updateQueue = t.updateQueue;
    t_updateQueue = t_updateQueue === null ? null : t_updateQueue.lastEffect;
    if (t_updateQueue !== null) {
      let i = (t_updateQueue = t_updateQueue.next);
      do {
        if ((i.tag & e) === e) {
          const a = i.destroy;
          i.destroy = undefined;
          if (a !== undefined) {
            _c(t, n, a);
          }
        }
        i = i.next;
      } while (i !== t_updateQueue);
    }
  }
  function xc(e, t) {
    t = t.updateQueue;
    t = t === null ? null : t.lastEffect;
    if (t !== null) {
      let n = (t = t.next);
      do {
        if ((n.tag & e) === e) {
          const r = n.create;
          n.destroy = r();
        }
        n = n.next;
      } while (n !== t);
    }
  }
  function Sc(e) {
    const e_ref = e.ref;
    if (e_ref !== null) {
      const n = e.stateNode;
      switch (e.tag) {
        case 5:
          e = n;
          break;
        default:
          e = n;
      }
      if (typeof e_ref == `function`) {
        e_ref(e);
      } else {
        e_ref.current = e;
      }
    }
  }
  function Cc(e) {
    let e_alternate = e.alternate;
    if (e_alternate !== null) {
      e.alternate = null;
      Cc(e_alternate);
    }
    e.child = null;
    e.deletions = null;
    e.sibling = null;
    if (e.tag === 5) {
      e_alternate = e.stateNode;
      e_alternate !== null &&
        (delete e_alternate[Pi],
        delete e_alternate[Fi],
        delete e_alternate[Li],
        delete e_alternate[Ri],
        delete e_alternate[zi]);
    }
    e.stateNode = null;
    e.return = null;
    e.dependencies = null;
    e.memoizedProps = null;
    e.memoizedState = null;
    e.pendingProps = null;
    e.stateNode = null;
    e.updateQueue = null;
  }
  function wc(e) {
    return e.tag === 5 || e.tag === 3 || e.tag === 4;
  }
  function Tc(e) {
    a: while (true) {
      while (e.sibling === null) {
        if (e.return === null || wc(e.return)) {
          return null;
        }
        e = e.return;
      }
      e.sibling.return = e.return;
      for (e = e.sibling; e.tag !== 5 && e.tag !== 6 && e.tag !== 18;) {
        if (e.flags & 2 || e.child === null || e.tag === 4) {
          continue a;
        }
        e.child.return = e;
        e = e.child;
      }
      if (!(e.flags & 2)) {
        return e.stateNode;
      }
    }
  }
  function Ec(e, t, n) {
    const e_tag = e.tag;
    if (e_tag === 5 || e_tag === 6) {
      e = e.stateNode;
      if (t) {
        if (n.nodeType === 8) {
          n.parentNode.insertBefore(e, t);
        } else {
          n.insertBefore(e, t);
        }
      } else {
        if (n.nodeType === 8) {
          t = n.parentNode;
          t.insertBefore(e, n);
        } else {
          t = n;
          t.appendChild(e);
        }
        n = n._reactRootContainer;
        if (!(n != null || t.onclick !== null)) {
          t.onclick = xi;
        }
      }
    } else if (e_tag !== 4 && ((e = e.child), e !== null)) {
      Ec(e, t, n);
      for (e = e.sibling; e !== null;) {
        Ec(e, t, n);
        e = e.sibling;
      }
    }
  }
  function Dc(e, t, n) {
    const e_tag = e.tag;
    if (e_tag === 5 || e_tag === 6) {
      e = e.stateNode;
      if (t) {
        n.insertBefore(e, t);
      } else {
        n.appendChild(e);
      }
    } else if (e_tag !== 4 && ((e = e.child), e !== null)) {
      Dc(e, t, n);
      for (e = e.sibling; e !== null;) {
        Dc(e, t, n);
        e = e.sibling;
      }
    }
  }
  var Oc = null;
  var kc = false;
  function Ac(e, t, n) {
    for (n = n.child; n !== null;) {
      Y(e, t, n);
      n = n.sibling;
    }
  }
  function Y(e, t, n) {
    if (Et && typeof Et.onCommitFiberUnmount == `function`) {
      try {
        Et.onCommitFiberUnmount(Tt, n);
      } catch {}
    }
    switch (n.tag) {
      case 5:
        if (!mc) {
          gc(n, t);
        }
      case 6:
        var r = Oc;
        var i = kc;
        Oc = null;
        Ac(e, t, n);
        Oc = r;
        kc = i;
        Oc !== null &&
          (kc
            ? ((e = Oc),
              (n = n.stateNode),
              e.nodeType === 8 ? e.parentNode.removeChild(n) : e.removeChild(n))
            : Oc.removeChild(n.stateNode));
        break;
      case 18:
        Oc !== null &&
          (kc
            ? ((e = Oc),
              (n = n.stateNode),
              e.nodeType === 8
                ? Ai(e.parentNode, n)
                : e.nodeType === 1 && Ai(e, n),
              fn(e))
            : Ai(Oc, n.stateNode));
        break;
      case 4:
        r = Oc;
        i = kc;
        Oc = n.stateNode.containerInfo;
        kc = true;
        Ac(e, t, n);
        Oc = r;
        kc = i;
        break;
      case 0:
      case 11:
      case 14:
      case 15:
        if (
          !mc &&
          ((r = n.updateQueue), r !== null && ((r = r.lastEffect), r !== null))
        ) {
          i = r = r.next;
          do {
            let a = i;
            const o = a.destroy;
            a = a.tag;
            if (o !== undefined && (a & 2 || a & 4)) {
              _c(n, t, o);
            }
            i = i.next;
          } while (i !== r);
        }
        Ac(e, t, n);
        break;
      case 1:
        if (
          !mc &&
          (gc(n, t),
          (r = n.stateNode),
          typeof r.componentWillUnmount == `function`)
        ) {
          try {
            r.props = n.memoizedProps;
            r.state = n.memoizedState;
            r.componentWillUnmount();
          } catch (error) {
            Q(n, t, error);
          }
        }
        Ac(e, t, n);
        break;
      case 21:
        Ac(e, t, n);
        break;
      case 22:
        if (n.mode & 1) {
          mc = (r = mc) || n.memoizedState !== null;
          Ac(e, t, n);
          mc = r;
        } else {
          Ac(e, t, n);
        }
        break;
      default:
        Ac(e, t, n);
    }
  }
  function jc(e) {
    const e_updateQueue = e.updateQueue;
    if (e_updateQueue !== null) {
      e.updateQueue = null;
      let n = e.stateNode;
      if (n === null) {
        n = e.stateNode = new hc();
      }
      e_updateQueue.forEach((t) => {
        const r = Ul.bind(null, e, t);
        if (!n.has(t)) {
          n.add(t);
          t.then(r, r);
        }
      });
    }
  }
  function Mc(e, t) {
    const t_deletions = t.deletions;
    if (t_deletions !== null) {
      for (const a of t_deletions) {
        try {
          const o = e;
          const s = t;
          let c = s;
          a: while (c !== null) {
            switch (c.tag) {
              case 5:
                Oc = c.stateNode;
                kc = false;
                break a;
              case 3:
                Oc = c.stateNode.containerInfo;
                kc = true;
                break a;
              case 4:
                Oc = c.stateNode.containerInfo;
                kc = true;
                break a;
            }
            c = c.return;
          }
          if (Oc === null) {
            throw Error(i(160));
          }
          Y(o, s, a);
          Oc = null;
          kc = false;
          const l = a.alternate;
          if (l !== null) {
            l.return = null;
          }
          a.return = null;
        } catch (error) {
          Q(a, t, error);
        }
      }
    }
    if (t.subtreeFlags & 12854) {
      for (t = t.child; t !== null;) {
        Nc(t, e);
        t = t.sibling;
      }
    }
  }
  function Nc(e, t) {
    let e_alternate = e.alternate;
    let e_flags = e.flags;
    switch (e.tag) {
      case 0:
      case 11:
      case 14:
      case 15:
        Mc(t, e);
        Pc(e);
        if (e_flags & 4) {
          try {
            bc(3, e, e.return);
            xc(3, e);
          } catch (error) {
            Q(e, e.return, error);
          }
          try {
            bc(5, e, e.return);
          } catch (error) {
            Q(e, e.return, error);
          }
        }
        break;
      case 1:
        Mc(t, e);
        Pc(e);
        if (e_flags & 512 && e_alternate !== null) {
          gc(e_alternate, e_alternate.return);
        }
        break;
      case 5:
        Mc(t, e);
        Pc(e);
        if (e_flags & 512 && e_alternate !== null) {
          gc(e_alternate, e_alternate.return);
        }
        if (e.flags & 32) {
          var a = e.stateNode;
          try {
            Fe(a, ``);
          } catch (error) {
            Q(e, e.return, error);
          }
        }
        if (e_flags & 4 && ((a = e.stateNode), a != null)) {
          var o = e.memoizedProps;
          var s = e_alternate === null ? o : e_alternate.memoizedProps;
          var c = e.type;
          var l = e.updateQueue;
          e.updateQueue = null;
          if (l !== null) {
            try {
              if (c === `input` && o.type === `radio` && o.name != null) {
                xe(a, o);
              }
              Ve(c, s);
              var u = Ve(c, o);
              for (s = 0; s < l.length; s += 2) {
                var d = l[s];
                var f = l[s + 1];
                if (d === `style`) {
                  Re(a, f);
                } else if (d === `dangerouslySetInnerHTML`) {
                  Pe(a, f);
                } else if (d === `children`) {
                  Fe(a, f);
                } else {
                  x(a, d, f, u);
                }
              }
              switch (c) {
                case `input`:
                  Se(a, o);
                  break;
                case `textarea`:
                  ke(a, o);
                  break;
                case `select`:
                  var p = a._wrapperState.wasMultiple;
                  a._wrapperState.wasMultiple = !!o.multiple;
                  var m = o.value;
                  if (m == null) {
                    p !== !!o.multiple &&
                      (o.defaultValue == null
                        ? Ee(a, !!o.multiple, o.multiple ? [] : ``, false)
                        : Ee(a, !!o.multiple, o.defaultValue, true));
                  } else {
                    Ee(a, !!o.multiple, m, false);
                  }
              }
              a[Fi] = o;
            } catch (error) {
              Q(e, e.return, error);
            }
          }
        }
        break;
      case 6:
        Mc(t, e);
        Pc(e);
        if (e_flags & 4) {
          if (e.stateNode === null) {
            throw Error(i(162));
          }
          a = e.stateNode;
          o = e.memoizedProps;
          try {
            a.nodeValue = o;
          } catch (error) {
            Q(e, e.return, error);
          }
        }
        break;
      case 3:
        Mc(t, e);
        Pc(e);
        if (
          e_flags & 4 &&
          e_alternate !== null &&
          e_alternate.memoizedState.isDehydrated
        ) {
          try {
            fn(t.containerInfo);
          } catch (error) {
            Q(e, e.return, error);
          }
        }
        break;
      case 4:
        Mc(t, e);
        Pc(e);
        break;
      case 13:
        Mc(t, e);
        Pc(e);
        a = e.child;
        if (a.flags & 8192) {
          o = a.memoizedState !== null;
          a.stateNode.isHidden = o;
          if (!(
            !o ||
            (a.alternate !== null && a.alternate.memoizedState !== null)
          )) {
            tl = r_unstable_now();
          }
        }
        if (e_flags & 4) {
          jc(e);
        }
        break;
      case 22:
        d = e_alternate !== null && e_alternate.memoizedState !== null;
        if (e.mode & 1) {
          mc = (u = mc) || d;
          Mc(t, e);
          mc = u;
        } else {
          Mc(t, e);
        }
        Pc(e);
        if (e_flags & 8192) {
          u = e.memoizedState !== null;
          if ((e.stateNode.isHidden = u) && !d && e.mode & 1) {
            J = e;
            for (d = e.child; d !== null;) {
              for (f = J = d; J !== null;) {
                p = J;
                m = p.child;
                switch (p.tag) {
                  case 0:
                  case 11:
                  case 14:
                  case 15:
                    bc(4, p, p.return);
                    break;
                  case 1:
                    gc(p, p.return);
                    const h = p.stateNode;
                    if (typeof h.componentWillUnmount == `function`) {
                      e_flags = p;
                      e_alternate = p.return;
                      try {
                        t = e_flags;
                        h.props = t.memoizedProps;
                        h.state = t.memoizedState;
                        h.componentWillUnmount();
                      } catch (error) {
                        Q(e_flags, e_alternate, error);
                      }
                    }
                    break;
                  case 5:
                    gc(p, p.return);
                    break;
                  case 22:
                    if (p.memoizedState !== null) {
                      Rc(f);
                      continue;
                    }
                }
                if (m === null) {
                  Rc(f);
                } else {
                  m.return = p;
                  J = m;
                }
              }
              d = d.sibling;
            }
          }
          a: for (d = null, f = e; ;) {
            if (f.tag === 5) {
              if (d === null) {
                d = f;
                try {
                  a = f.stateNode;
                  if (u) {
                    o = a.style;
                    if (typeof o.setProperty == `function`) {
                      o.setProperty(`display`, `none`, `important`);
                    } else {
                      o.display = `none`;
                    }
                  } else {
                    c = f.stateNode;
                    l = f.memoizedProps.style;
                    s =
                      l != null && l.hasOwnProperty(`display`)
                        ? l.display
                        : null;
                    c.style.display = P(`display`, s);
                  }
                } catch (error) {
                  Q(e, e.return, error);
                }
              }
            } else if (f.tag === 6) {
              if (d === null) {
                try {
                  f.stateNode.nodeValue = u ? `` : f.memoizedProps;
                } catch (error) {
                  Q(e, e.return, error);
                }
              }
            } else if (
              ((f.tag !== 22 && f.tag !== 23) ||
                f.memoizedState === null ||
                f === e) &&
              f.child !== null
            ) {
              f.child.return = f;
              f = f.child;
              continue;
            }
            if (f === e) {
              break a;
            }
            while (f.sibling === null) {
              if (f.return === null || f.return === e) {
                break a;
              }
              if (d === f) {
                d = null;
              }
              f = f.return;
            }
            if (d === f) {
              d = null;
            }
            f.sibling.return = f.return;
            f = f.sibling;
          }
        }
        break;
      case 19:
        Mc(t, e);
        Pc(e);
        if (e_flags & 4) {
          jc(e);
        }
        break;
      case 21:
        break;
      default:
        Mc(t, e);
        Pc(e);
    }
  }
  function Pc(e) {
    const e_flags = e.flags;
    if (e_flags & 2) {
      try {
        a: {
          for (let n = e.return; n !== null;) {
            if (wc(n)) {
              var r = n;
              break a;
            }
            n = n.return;
          }
          throw Error(i(160));
        }
        switch (r.tag) {
          case 5:
            const a = r.stateNode;
            if (r.flags & 32) {
              Fe(a, ``);
              r.flags &= -33;
            }
            Dc(e, Tc(e), a);
            break;
          case 3:
          case 4:
            const o = r.stateNode.containerInfo;
            Ec(e, Tc(e), o);
            break;
          default:
            throw Error(i(161));
        }
      } catch (error) {
        Q(e, e.return, error);
      }
      e.flags &= -3;
    }
    if (e_flags & 4096) {
      e.flags &= -4097;
    }
  }
  function Fc(e, t, n) {
    J = e;
    Ic(e, t, n);
  }
  function Ic(e, t, n) {
    const r = !!(e.mode & 1);
    while (J !== null) {
      const i = J;
      let a = i.child;
      if (i.tag === 22 && r) {
        let o = i.memoizedState !== null || pc;
        if (!o) {
          let s = i.alternate;
          let c = (s !== null && s.memoizedState !== null) || mc;
          s = pc;
          const l = mc;
          pc = o;
          if ((mc = c) && !l) {
            for (J = i; J !== null;) {
              o = J;
              c = o.child;
              if ((o.tag === 22 && o.memoizedState !== null) || c === null) {
                zc(i);
              } else {
                c.return = o;
                J = c;
              }
            }
          }
          while (a !== null) {
            J = a;
            Ic(a, t, n);
            a = a.sibling;
          }
          J = i;
          pc = s;
          mc = l;
        }
        Lc(e, t, n);
      } else {
        if (i.subtreeFlags & 8772 && a !== null) {
          a.return = i;
          J = a;
        } else {
          Lc(e, t, n);
        }
      }
    }
  }
  function Lc(e) {
    while (J !== null) {
      const t = J;
      if (t.flags & 8772) {
        var n = t.alternate;
        try {
          if (t.flags & 8772) {
            switch (t.tag) {
              case 0:
              case 11:
              case 15:
                if (!mc) {
                  xc(5, t);
                }
                break;
              case 1:
                const r = t.stateNode;
                if (t.flags & 4 && !mc) {
                  if (n === null) {
                    r.componentDidMount();
                  } else {
                    const a =
                      t.elementType === t.type
                        ? n.memoizedProps
                        : ys(t.type, n.memoizedProps);
                    r.componentDidUpdate(
                      a,
                      n.memoizedState,
                      r.__reactInternalSnapshotBeforeUpdate,
                    );
                  }
                }
                const o = t.updateQueue;
                if (o !== null) {
                  lo(t, o, r);
                }
                break;
              case 3:
                const s = t.updateQueue;
                if (s !== null) {
                  n = null;
                  if (t.child !== null) {
                    switch (t.child.tag) {
                      case 5:
                        n = t.child.stateNode;
                        break;
                      case 1:
                        n = t.child.stateNode;
                    }
                  }
                  lo(t, s, n);
                }
                break;
              case 5:
                const c = t.stateNode;
                if (n === null && t.flags & 4) {
                  n = c;
                  const l = t.memoizedProps;
                  switch (t.type) {
                    case `button`:
                    case `input`:
                    case `select`:
                    case `textarea`:
                      if (l.autoFocus) {
                        n.focus();
                      }
                      break;
                    case `img`:
                      if (l.src) {
                        n.src = l.src;
                      }
                  }
                }
                break;
              case 6:
                break;
              case 4:
                break;
              case 12:
                break;
              case 13:
                if (t.memoizedState === null) {
                  const u = t.alternate;
                  if (u !== null) {
                    const d = u.memoizedState;
                    if (d !== null) {
                      const f = d.dehydrated;
                      if (f !== null) {
                        fn(f);
                      }
                    }
                  }
                }
                break;
              case 19:
              case 17:
              case 21:
              case 22:
              case 23:
              case 25:
                break;
              default:
                throw Error(i(163));
            }
          }
          mc || (t.flags & 512 && Sc(t));
        } catch (error) {
          Q(t, t.return, error);
        }
      }
      if (t === e) {
        J = null;
        break;
      }
      n = t.sibling;
      if (n !== null) {
        n.return = t.return;
        J = n;
        break;
      }
      J = t.return;
    }
  }
  function Rc(e) {
    while (J !== null) {
      const t = J;
      if (t === e) {
        J = null;
        break;
      }
      const n = t.sibling;
      if (n !== null) {
        n.return = t.return;
        J = n;
        break;
      }
      J = t.return;
    }
  }
  function zc(e) {
    while (J !== null) {
      const t = J;
      try {
        switch (t.tag) {
          case 0:
          case 11:
          case 15:
            const n = t.return;
            try {
              xc(4, t);
            } catch (error) {
              Q(t, n, error);
            }
            break;
          case 1:
            const r = t.stateNode;
            if (typeof r.componentDidMount == `function`) {
              const i = t.return;
              try {
                r.componentDidMount();
              } catch (error) {
                Q(t, i, error);
              }
            }
            const a = t.return;
            try {
              Sc(t);
            } catch (error) {
              Q(t, a, error);
            }
            break;
          case 5:
            const o = t.return;
            try {
              Sc(t);
            } catch (error) {
              Q(t, o, error);
            }
        }
      } catch (error) {
        Q(t, t.return, error);
      }
      if (t === e) {
        J = null;
        break;
      }
      const s = t.sibling;
      if (s !== null) {
        s.return = t.return;
        J = s;
        break;
      }
      J = t.return;
    }
  }
  var Math_ceil = Math.ceil;
  var C_ReactCurrentDispatcher_1 =
    n___SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentDispatcher;
  var C_ReactCurrentOwner_1 =
    n___SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner;
  var C_ReactCurrentBatchConfig_3 =
    n___SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentBatchConfig;
  var X = 0;
  var Wc = null;
  var Z = null;
  var Gc = 0;
  var Kc = 0;
  var qc = Ki(0);
  var Jc = 0;
  var Yc = null;
  var Xc = 0;
  var Zc = 0;
  var Qc = 0;
  var $c = null;
  var el = null;
  var tl = 0;
  var nl = Infinity;
  var rl = null;
  var il = false;
  var al = null;
  var ol = null;
  var sl = false;
  var cl = null;
  var ll = 0;
  var ul = 0;
  var dl = null;
  var fl = -1;
  var pl = 0;
  function ml() {
    if (X & 6) {
      return r_unstable_now();
    }
    if (fl === -1) {
      return (fl = r_unstable_now());
    }
    return fl;
  }
  function hl(e) {
    if (e.mode & 1) {
      if (X & 2 && Gc !== 0) {
        return Gc & -Gc;
      }
      if (C_ReactCurrentBatchConfig_1.transition === null) {
        return (
          (e = z),
          e === 0
            ? ((e = window.event), (e = e === undefined ? 16 : bn(e.type)), e)
            : e
        );
      }
      return (pl === 0 && (pl = Rt()), pl);
    }
    return 1;
  }
  function gl(e, t, n, r) {
    if (ul > 50) {
      ul = 0;
      dl = null;
      throw Error(i(185));
    }
    Bt(e, n, r);
    if (!(X & 2) || e !== Wc) {
      e === Wc && (!(X & 2) && (Zc |= n), Jc === 4 && Sl(e, Gc));
      _l(e, r);
      if (n === 1 && X === 0 && !(t.mode & 1)) {
        nl = r_unstable_now() + 500;
        if (aa) {
          la();
        }
      }
    }
  }
  function _l(e, t) {
    let e_callbackNode = e.callbackNode;
    Lt(e, t);
    const r = Ft(e, e === Wc ? Gc : 0);
    if (r === 0) {
      if (e_callbackNode !== null) {
        r_unstable_cancelCallback(e_callbackNode);
      }
      e.callbackNode = null;
      e.callbackPriority = 0;
    } else {
      t = r & -r;
      if (e.callbackPriority !== t) {
        if (e_callbackNode != null) {
          r_unstable_cancelCallback(e_callbackNode);
        }
        if (t === 1) {
          if (e.tag === 0) {
            ca(Cl.bind(null, e));
          } else {
            sa(Cl.bind(null, e));
          }
          Oi(() => {
            if (!(X & 6)) {
              la();
            }
          });
          e_callbackNode = null;
        } else {
          switch (Ut(r)) {
            case 1:
              e_callbackNode = r_unstable_ImmediatePriority;
              break;
            case 4:
              e_callbackNode = r_unstable_UserBlockingPriority;
              break;
            case 16:
              e_callbackNode = r_unstable_NormalPriority;
              break;
            case 536870912:
              e_callbackNode = r_unstable_IdlePriority;
              break;
            default:
              e_callbackNode = r_unstable_NormalPriority;
          }
          e_callbackNode = Gl(e_callbackNode, vl.bind(null, e));
        }
        e.callbackPriority = t;
        e.callbackNode = e_callbackNode;
      }
    }
  }
  function vl(e, t) {
    fl = -1;
    pl = 0;
    if (X & 6) {
      throw Error(i(327));
    }
    let e_callbackNode = e.callbackNode;
    if (Rl() && e.callbackNode !== e_callbackNode) {
      return null;
    }
    let r = Ft(e, e === Wc ? Gc : 0);
    if (r === 0) {
      return null;
    }
    if (r & 30 || (r & e.expiredLanes) !== 0 || t) {
      t = jl(e, r);
    } else {
      t = r;
      var a = X;
      X |= 2;
      var o = kl();
      if (Wc !== e || Gc !== t) {
        rl = null;
        nl = r_unstable_now() + 500;
        Dl(e, t);
      }
      do {
        try {
          Nl();
          break;
        } catch (error) {
          Ol(e, error);
        }
      } while (1);
      Ka();
      C_ReactCurrentDispatcher_1.current = o;
      X = a;
      if (Z === null) {
        Wc = null;
        Gc = 0;
        t = Jc;
      } else {
        t = 0;
      }
    }
    if (t !== 0) {
      if (t === 2) {
        a = R(e);
        if (a !== 0) {
          r = a;
          t = yl(e, a);
        }
      }
      if (t === 1) {
        e_callbackNode = Yc;
        Dl(e, 0);
        Sl(e, r);
        _l(e, r_unstable_now());
        throw e_callbackNode;
      }
      if (t === 6) {
        Sl(e, r);
      } else {
        a = e.current.alternate;
        if (
          !(r & 30) &&
          !xl(a) &&
          ((t = jl(e, r)),
          t === 2 && ((o = R(e)), o !== 0 && ((r = o), (t = yl(e, o)))),
          t === 1)
        ) {
          e_callbackNode = Yc;
          Dl(e, 0);
          Sl(e, r);
          _l(e, r_unstable_now());
          throw e_callbackNode;
        }
        e.finishedWork = a;
        e.finishedLanes = r;
        switch (t) {
          case 0:
          case 1:
            throw Error(i(345));
          case 2:
            Il(e, el, rl);
            break;
          case 3:
            Sl(e, r);
            if (
              (r & 130023424) === r &&
              ((t = tl + 500 - r_unstable_now()), t > 10)
            ) {
              if (Ft(e, 0) !== 0) {
                break;
              }
              a = e.suspendedLanes;
              if ((a & r) !== r) {
                ml();
                e.pingedLanes |= e.suspendedLanes & a;
                break;
              }
              e.timeoutHandle = Ti(Il.bind(null, e, el, rl), t);
              break;
            }
            Il(e, el, rl);
            break;
          case 4:
            Sl(e, r);
            if ((r & 4194240) === r) {
              break;
            }
            t = e.eventTimes;
            for (a = -1; r > 0;) {
              let s = 31 - Ot(r);
              o = 1 << s;
              s = t[s];
              if (s > a) {
                a = s;
              }
              r &= ~o;
            }
            r = a;
            r = r_unstable_now() - r;
            r =
              (r < 120
                ? 120
                : r < 480
                  ? 480
                  : r < 1080
                    ? 1080
                    : r < 1920
                      ? 1920
                      : r < 3000
                        ? 3000
                        : r < 4320
                          ? 4320
                          : 1960 * Math_ceil(r / 1960)) - r;
            if (r > 10) {
              e.timeoutHandle = Ti(Il.bind(null, e, el, rl), r);
              break;
            }
            Il(e, el, rl);
            break;
          case 5:
            Il(e, el, rl);
            break;
          default:
            throw Error(i(329));
        }
      }
    }
    _l(e, r_unstable_now());
    if (e.callbackNode === e_callbackNode) {
      return vl.bind(null, e);
    }
    return null;
  }
  function yl(e, t) {
    const n = $c;
    if (e.current.memoizedState.isDehydrated) {
      Dl(e, t).flags |= 256;
    }
    e = jl(e, t);
    if (e !== 2) {
      t = el;
      el = n;
      if (t !== null) {
        bl(t);
      }
    }
    return e;
  }
  function bl(e) {
    if (el === null) {
      el = e;
    } else {
      el.push(...e);
    }
  }
  function xl(e) {
    let t = e;
    while (true) {
      if (t.flags & 16384) {
        var n = t.updateQueue;
        if (n !== null && ((n = n.stores), n !== null)) {
          for (let i of n) {
            const a = i.getSnapshot;
            i = i.value;
            try {
              if (!Ar(a(), i)) {
                return false;
              }
            } catch {
              return false;
            }
          }
        }
      }
      n = t.child;
      if (t.subtreeFlags & 16384 && n !== null) {
        n.return = t;
        t = n;
      } else {
        if (t === e) {
          break;
        }
        while (t.sibling === null) {
          if (t.return === null || t.return === e) {
            return true;
          }
          t = t.return;
        }
        t.sibling.return = t.return;
        t = t.sibling;
      }
    }
    return true;
  }
  function Sl(e, t) {
    t &= ~Qc;
    t &= ~Zc;
    e.suspendedLanes |= t;
    e.pingedLanes &= ~t;
    for (e = e.expirationTimes; t > 0;) {
      const n = 31 - Ot(t);
      const r = 1 << n;
      e[n] = -1;
      t &= ~r;
    }
  }
  function Cl(e) {
    if (X & 6) {
      throw Error(i(327));
    }
    Rl();
    let t = Ft(e, 0);
    if (!(t & 1)) {
      _l(e, r_unstable_now());
      return null;
    }
    let n = jl(e, t);
    if (e.tag !== 0 && n === 2) {
      const r = R(e);
      if (r !== 0) {
        t = r;
        n = yl(e, r);
      }
    }
    if (n === 1) {
      n = Yc;
      Dl(e, 0);
      Sl(e, t);
      _l(e, r_unstable_now());
      throw n;
    }
    if (n === 6) {
      throw Error(i(345));
    }
    e.finishedWork = e.current.alternate;
    e.finishedLanes = t;
    Il(e, el, rl);
    _l(e, r_unstable_now());
    return null;
  }
  function wl(e, t) {
    const n = X;
    X |= 1;
    try {
      return e(t);
    } finally {
      X = n;
      if (X === 0) {
        nl = r_unstable_now() + 500;
        if (aa) {
          la();
        }
      }
    }
  }
  function Tl(e) {
    if (cl !== null && cl.tag === 0 && !(X & 6)) {
      Rl();
    }
    const t = X;
    X |= 1;
    const C_ReactCurrentBatchConfig_3_transition =
      C_ReactCurrentBatchConfig_3.transition;
    const r = z;
    try {
      C_ReactCurrentBatchConfig_3.transition = null;
      z = 1;
      if (e) {
        return e();
      }
    } finally {
      z = r;
      C_ReactCurrentBatchConfig_3.transition =
        C_ReactCurrentBatchConfig_3_transition;
      X = t;
      if (!(X & 6)) {
        la();
      }
    }
  }
  function El() {
    Kc = qc.current;
    H(qc);
  }
  function Dl(e, t) {
    e.finishedWork = null;
    e.finishedLanes = 0;
    let e_timeoutHandle = e.timeoutHandle;
    if (e_timeoutHandle !== -1) {
      e.timeoutHandle = -1;
      Ei(e_timeoutHandle);
    }
    if (Z !== null) {
      for (e_timeoutHandle = Z.return; e_timeoutHandle !== null;) {
        var r = e_timeoutHandle;
        Sa(r);
        switch (r.tag) {
          case 1:
            r = r.type.childContextTypes;
            if (r != null) {
              $i();
            }
            break;
          case 3:
            go();
            H(Yi);
            H(Ji);
            xo();
            break;
          case 5:
            vo(r);
            break;
          case 4:
            go();
            break;
          case 13:
            H(K);
            break;
          case 19:
            H(K);
            break;
          case 10:
            qa(r.type._context);
            break;
          case 22:
          case 23:
            El();
        }
        e_timeoutHandle = e_timeoutHandle.return;
      }
    }
    Wc = e;
    Z = e = Xl(e.current, null);
    Kc = t;
    Gc = t;
    Jc = 0;
    Yc = null;
    Xc = 0;
    Zc = 0;
    Qc = 0;
    $c = null;
    el = null;
    if (Za !== null) {
      for (t = 0; t < Za.length; t++) {
        e_timeoutHandle = Za[t];
        r = e_timeoutHandle.interleaved;
        if (r !== null) {
          e_timeoutHandle.interleaved = null;
          const i = r.next;
          const a = e_timeoutHandle.pending;
          if (a !== null) {
            const o = a.next;
            a.next = i;
            r.next = o;
          }
          e_timeoutHandle.pending = r;
        }
      }
      Za = null;
    }
    return e;
  }
  function Ol(e, t) {
    do {
      let n = Z;
      try {
        Ka();
        C_ReactCurrentDispatcher.current = hs;
        if (Do) {
          for (let r = q.memoizedState; r !== null;) {
            const a = r.queue;
            if (a !== null) {
              a.pending = null;
            }
            r = r.next;
          }
          Do = false;
        }
        wo = 0;
        q = null;
        To = null;
        Eo = null;
        Oo = false;
        ko = 0;
        C_ReactCurrentOwner_1.current = null;
        if (n === null || n.return === null) {
          Jc = 1;
          Yc = t;
          Z = null;
          break;
        }
        a: {
          let o = e;
          const s = n.return;
          let c = n;
          let l = t;
          t = Gc;
          c.flags |= 32768;
          if (typeof l == `object` && l && typeof l.then == `function`) {
            const u = l;
            const d = c;
            const f = d.tag;
            if (!(d.mode & 1) && (f === 0 || f === 11 || f === 15)) {
              const p = d.alternate;
              if (p) {
                d.updateQueue = p.updateQueue;
                d.memoizedState = p.memoizedState;
                d.lanes = p.lanes;
              } else {
                d.updateQueue = null;
                d.memoizedState = null;
              }
            }
            const m = Ns(s);
            if (m !== null) {
              m.flags &= -257;
              Ps(m, s, c, o, t);
              if (m.mode & 1) {
                Ms(o, u, t);
              }
              t = m;
              l = u;
              const h = t.updateQueue;
              if (h === null) {
                const g = new Set();
                g.add(l);
                t.updateQueue = g;
              } else {
                h.add(l);
              }
              break a;
            }
            if (!(t & 1)) {
              Ms(o, u, t);
              Al();
              break a;
            }
            l = Error(i(426));
          } else if (W && c.mode & 1) {
            const _ = Ns(s);
            if (_ !== null) {
              if (!(_.flags & 65536)) {
                _.flags |= 256;
              }
              Ps(_, s, c, o, t);
              Pa(Es(l, c));
              break a;
            }
          }
          o = l = Es(l, c);
          if (Jc !== 4) {
            Jc = 2;
          }
          if ($c === null) {
            $c = [o];
          } else {
            $c.push(o);
          }
          o = s;
          do {
            switch (o.tag) {
              case 3:
                o.flags |= 65536;
                t &= -t;
                o.lanes |= t;
                const v = As(o, l, t);
                so(o, v);
                break a;
              case 1:
                c = l;
                const { type, stateNode } = o;
                if (
                  !(o.flags & 128) &&
                  (typeof type.getDerivedStateFromError == `function` ||
                    (stateNode !== null &&
                      typeof stateNode.componentDidCatch == `function` &&
                      (ol === null || !ol.has(stateNode))))
                ) {
                  o.flags |= 65536;
                  t &= -t;
                  o.lanes |= t;
                  const x = js(o, c, t);
                  so(o, x);
                  break a;
                }
            }
            o = o.return;
          } while (o !== null);
        }
        Fl(n);
      } catch (error) {
        t = error;
        if (Z === n && n !== null) {
          Z = n = n.return;
        }
        continue;
      }
      break;
    } while (1);
  }
  function kl() {
    const C_ReactCurrentDispatcher_1_current =
      C_ReactCurrentDispatcher_1.current;
    C_ReactCurrentDispatcher_1.current = hs;
    if (C_ReactCurrentDispatcher_1_current === null) {
      return hs;
    }
    return C_ReactCurrentDispatcher_1_current;
  }
  function Al() {
    if (Jc === 0 || Jc === 3 || Jc === 2) {
      Jc = 4;
    }
    if (!(Wc === null || (!(Xc & 268435455) && !(Zc & 268435455)))) {
      Sl(Wc, Gc);
    }
  }
  function jl(e, t) {
    const n = X;
    X |= 2;
    const r = kl();
    if (Wc !== e || Gc !== t) {
      rl = null;
      Dl(e, t);
    }
    do {
      try {
        Ml();
        break;
      } catch (error) {
        Ol(e, error);
      }
    } while (1);
    Ka();
    X = n;
    C_ReactCurrentDispatcher_1.current = r;
    if (Z !== null) {
      throw Error(i(261));
    }
    Wc = null;
    Gc = 0;
    return Jc;
  }
  function Ml() {
    while (Z !== null) {
      Pl(Z);
    }
  }
  function Nl() {
    while (Z !== null && !r_unstable_shouldYield()) {
      Pl(Z);
    }
  }
  function Pl(e) {
    const t = Wl(e.alternate, e, Kc);
    e.memoizedProps = e.pendingProps;
    if (t === null) {
      Fl(e);
    } else {
      Z = t;
    }
    C_ReactCurrentOwner_1.current = null;
  }
  function Fl(e) {
    let t = e;
    do {
      let n = t.alternate;
      e = t.return;
      if (t.flags & 32768) {
        n = fc(n, t);
        if (n !== null) {
          n.flags &= 32767;
          Z = n;
          return;
        }
        if (e !== null) {
          e.flags |= 32768;
          e.subtreeFlags = 0;
          e.deletions = null;
        } else {
          Jc = 6;
          Z = null;
          return;
        }
      } else {
        n = dc(n, t, Kc);
        if (n !== null) {
          Z = n;
          return;
        }
      }
      t = t.sibling;
      if (t !== null) {
        Z = t;
        return;
      }
      t = e;
      Z = e;
    } while (t !== null);
    if (Jc === 0) {
      Jc = 5;
    }
  }
  function Il(e, t, n) {
    const r = z;
    const C_ReactCurrentBatchConfig_3_transition =
      C_ReactCurrentBatchConfig_3.transition;
    try {
      C_ReactCurrentBatchConfig_3.transition = null;
      z = 1;
      Ll(e, t, n, r);
    } finally {
      C_ReactCurrentBatchConfig_3.transition =
        C_ReactCurrentBatchConfig_3_transition;
      z = r;
    }
    return null;
  }
  function Ll(e, t, n, r) {
    do {
      Rl();
    } while (cl !== null);
    if (X & 6) {
      throw Error(i(327));
    }
    n = e.finishedWork;
    let e_finishedLanes = e.finishedLanes;
    if (n === null) {
      return null;
    }
    e.finishedWork = null;
    e.finishedLanes = 0;
    if (n === e.current) {
      throw Error(i(177));
    }
    e.callbackNode = null;
    e.callbackPriority = 0;
    let o = n.lanes | n.childLanes;
    Vt(e, o);
    if (e === Wc) {
      Z = Wc = null;
      Gc = 0;
    }
    if (!((!(n.subtreeFlags & 2064) && !(n.flags & 2064)) || sl)) {
      sl = true;
      Gl(r_unstable_NormalPriority, () => {
        Rl();
        return null;
      });
    }
    o = !!(n.flags & 15990);
    if (n.subtreeFlags & 15990 || o) {
      o = C_ReactCurrentBatchConfig_3.transition;
      C_ReactCurrentBatchConfig_3.transition = null;
      const s = z;
      z = 1;
      const c = X;
      X |= 4;
      C_ReactCurrentOwner_1.current = null;
      yc(e, n);
      Nc(n, e);
      Lr(Ci);
      mn = !!Si;
      Si = null;
      Ci = null;
      e.current = n;
      Fc(n, e, e_finishedLanes);
      r_unstable_requestPaint();
      X = c;
      z = s;
      C_ReactCurrentBatchConfig_3.transition = o;
    } else {
      e.current = n;
    }
    if (sl) {
      sl = false;
      cl = e;
      ll = e_finishedLanes;
    }
    o = e.pendingLanes;
    if (o === 0) {
      ol = null;
    }
    Dt(n.stateNode, r);
    _l(e, r_unstable_now());
    if (t !== null) {
      r = e.onRecoverableError;
      for (n = 0; n < t.length; n++) {
        e_finishedLanes = t[n];
        r(e_finishedLanes.value, {
          componentStack: e_finishedLanes.stack,
          digest: e_finishedLanes.digest,
        });
      }
    }
    if (il) {
      il = false;
      e = al;
      al = null;
      throw e;
    }
    if (ll & 1 && e.tag !== 0) {
      Rl();
    }
    o = e.pendingLanes;
    if (o & 1) {
      if (e === dl) {
        ul++;
      } else {
        ul = 0;
        dl = e;
      }
    } else {
      ul = 0;
    }
    la();
    return null;
  }
  function Rl() {
    if (cl !== null) {
      let e = Ut(ll);
      const t = C_ReactCurrentBatchConfig_3.transition;
      const n = z;
      try {
        C_ReactCurrentBatchConfig_3.transition = null;
        z = e < 16 ? 16 : e;
        if (cl === null) var r = false;
        else {
          e = cl;
          cl = null;
          ll = 0;
          if (X & 6) {
            throw Error(i(331));
          }
          const a = X;
          X |= 4;
          for (J = e.current; J !== null;) {
            let o = J;
            var s = o.child;
            if (J.flags & 16) {
              var c = o.deletions;
              if (c !== null) {
                for (const u of c) {
                  for (J = u; J !== null;) {
                    let d = J;
                    switch (d.tag) {
                      case 0:
                      case 11:
                      case 15:
                        bc(8, d, o);
                    }
                    const f = d.child;
                    if (f !== null) {
                      f.return = d;
                      J = f;
                    } else {
                      while (J !== null) {
                        d = J;
                        const { sibling, return: _return } = d;
                        Cc(d);
                        if (d === u) {
                          J = null;
                          break;
                        }
                        if (sibling !== null) {
                          sibling.return = _return;
                          J = sibling;
                          break;
                        }
                        J = _return;
                      }
                    }
                  }
                }
                const h = o.alternate;
                if (h !== null) {
                  let g = h.child;
                  if (g !== null) {
                    h.child = null;
                    do {
                      const _ = g.sibling;
                      g.sibling = null;
                      g = _;
                    } while (g !== null);
                  }
                }
                J = o;
              }
            }
            if (o.subtreeFlags & 2064 && s !== null) {
              s.return = o;
              J = s;
            } else {
              b: while (J !== null) {
                o = J;
                if (o.flags & 2048) {
                  switch (o.tag) {
                    case 0:
                    case 11:
                    case 15:
                      bc(9, o, o.return);
                  }
                }
                const v = o.sibling;
                if (v !== null) {
                  v.return = o.return;
                  J = v;
                  break b;
                }
                J = o.return;
              }
            }
          }
          const y = e.current;
          for (J = y; J !== null;) {
            s = J;
            const b = s.child;
            if (s.subtreeFlags & 2064 && b !== null) {
              b.return = s;
              J = b;
            } else {
              b: for (s = y; J !== null;) {
                c = J;
                if (c.flags & 2048) {
                  try {
                    switch (c.tag) {
                      case 0:
                      case 11:
                      case 15:
                        xc(9, c);
                    }
                  } catch (error) {
                    Q(c, c.return, error);
                  }
                }
                if (c === s) {
                  J = null;
                  break b;
                }
                const x = c.sibling;
                if (x !== null) {
                  x.return = c.return;
                  J = x;
                  break b;
                }
                J = c.return;
              }
            }
          }
          X = a;
          la();
          if (Et && typeof Et.onPostCommitFiberRoot == `function`) {
            try {
              Et.onPostCommitFiberRoot(Tt, e);
            } catch {}
          }
          r = true;
        }
        return r;
      } finally {
        z = n;
        C_ReactCurrentBatchConfig_3.transition = t;
      }
    }
    return false;
  }
  function zl(e, t, n) {
    t = Es(n, t);
    t = As(e, t, 1);
    e = ao(e, t, 1);
    t = ml();
    if (e !== null) {
      Bt(e, 1, t);
      _l(e, t);
    }
  }
  function Q(e, t, n) {
    if (e.tag === 3) {
      zl(e, e, n);
    } else {
      while (t !== null) {
        if (t.tag === 3) {
          zl(t, e, n);
          break;
        }
        if (t.tag === 1) {
          const r = t.stateNode;
          if (
            typeof t.type.getDerivedStateFromError == `function` ||
            (typeof r.componentDidCatch == `function` &&
              (ol === null || !ol.has(r)))
          ) {
            e = Es(n, e);
            e = js(t, e, 1);
            t = ao(t, e, 1);
            e = ml();
            if (t !== null) {
              Bt(t, 1, e);
              _l(t, e);
            }
            break;
          }
        }
        t = t.return;
      }
    }
  }
  function Bl(e, t, n) {
    const e_pingCache = e.pingCache;
    if (e_pingCache !== null) {
      e_pingCache.delete(t);
    }
    t = ml();
    e.pingedLanes |= e.suspendedLanes & n;
    Wc === e &&
      (Gc & n) === n &&
      (Jc === 4 ||
      (Jc === 3 && (Gc & 130023424) === Gc && r_unstable_now() - tl < 500)
        ? Dl(e, 0)
        : (Qc |= n));
    _l(e, t);
  }
  function Vl(e, t) {
    t === 0 &&
      (e.mode & 1
        ? ((t = Nt), (Nt <<= 1), !(Nt & 130023424) && (Nt = 4194304))
        : (t = 1));
    const n = ml();
    e = eo(e, t);
    if (e !== null) {
      Bt(e, t, n);
      _l(e, n);
    }
  }
  function Hl(e) {
    const e_memoizedState = e.memoizedState;
    let n = 0;
    if (e_memoizedState !== null) {
      n = e_memoizedState.retryLane;
    }
    Vl(e, n);
  }
  function Ul(e, t) {
    let n = 0;
    switch (e.tag) {
      case 13:
        var r = e.stateNode;
        const a = e.memoizedState;
        if (a !== null) {
          n = a.retryLane;
        }
        break;
      case 19:
        r = e.stateNode;
        break;
      default:
        throw Error(i(314));
    }
    if (r !== null) {
      r.delete(t);
    }
    Vl(e, n);
  }
  var Wl = (e, t, n) => {
    if (e !== null) {
      if (e.memoizedProps !== t.pendingProps || Yi.current) {
        Is = true;
      } else {
        if ((e.lanes & n) === 0 && !(t.flags & 128)) {
          Is = false;
          return ac(e, t, n);
        }
        Is = !!(e.flags & 131072);
      }
    } else {
      Is = false;
      if (W && t.flags & 1048576) {
        ba(t, pa, t.index);
      }
    }
    t.lanes = 0;
    switch (t.tag) {
      case 2:
        var r = t.type;
        rc(e, t);
        e = t.pendingProps;
        var a = Zi(t, Ji.current);
        Ya(t, n);
        a = No(null, t, r, e, a, n);
        var o = Po();
        t.flags |= 1;
        if (
          typeof a == `object` &&
          a &&
          typeof a.render == `function` &&
          a.$$typeof === undefined
        ) {
          t.tag = 1;
          t.memoizedState = null;
          t.updateQueue = null;
          if (Qi(r)) {
            o = true;
            na(t);
          } else {
            o = false;
          }
          t.memoizedState = a.state ?? null;
          no(t);
          a.updater = xs;
          t.stateNode = a;
          a._reactInternals = t;
          Ts(t, r, e, n);
          t = Gs(null, t, r, true, o, n);
        } else {
          t.tag = 0;
          if (W && o) {
            xa(t);
          }
          Ls(null, t, a, n);
          t = t.child;
        }
        return t;
      case 16:
        r = t.elementType;
        a: {
          rc(e, t);
          e = t.pendingProps;
          a = r._init;
          r = a(r._payload);
          t.type = r;
          a = t.tag = Yl(r);
          e = ys(r, e);
          switch (a) {
            case 0:
              t = Us(null, t, r, e, n);
              break a;
            case 1:
              t = Ws(null, t, r, e, n);
              break a;
            case 11:
              t = Rs(null, t, r, e, n);
              break a;
            case 14:
              t = zs(null, t, r, ys(r.type, e), n);
              break a;
          }
          throw Error(i(306, r, ``));
        }
        return t;
      case 0:
        r = t.type;
        a = t.pendingProps;
        a = t.elementType === r ? a : ys(r, a);
        return Us(e, t, r, a, n);
      case 1:
        r = t.type;
        a = t.pendingProps;
        a = t.elementType === r ? a : ys(r, a);
        return Ws(e, t, r, a, n);
      case 3:
        a: {
          Ks(t);
          if (e === null) {
            throw Error(i(387));
          }
          r = t.pendingProps;
          o = t.memoizedState;
          a = o.element;
          ro(e, t);
          co(t, r, null, n);
          var s = t.memoizedState;
          r = s.element;
          if (o.isDehydrated) {
            o = {
              element: r,
              isDehydrated: false,
              cache: s.cache,
              pendingSuspenseBoundaries: s.pendingSuspenseBoundaries,
              transitions: s.transitions,
            };
            t.updateQueue.baseState = o;
            t.memoizedState = o;
            if (t.flags & 256) {
              a = Es(Error(i(423)), t);
              t = qs(e, t, r, n, a);
              break a;
            }
            if (r !== a) {
              a = Es(Error(i(424)), t);
              t = qs(e, t, r, n, a);
              break a;
            }
            wa = ji(t.stateNode.containerInfo.firstChild);
            Ca = t;
            W = true;
            Ta = null;
            n = Va(t, null, r, n);
            for (t.child = n; n;) {
              n.flags = (n.flags & -3) | 4096;
              n = n.sibling;
            }
          } else {
            Na();
            if (r === a) {
              t = ic(e, t, n);
              break a;
            }
            Ls(e, t, r, n);
          }
          t = t.child;
        }
        return t;
      case 5:
        _o(t);
        if (e === null) {
          ka(t);
        }
        r = t.type;
        a = t.pendingProps;
        o = e === null ? null : e.memoizedProps;
        s = a.children;
        if (wi(r, a)) {
          s = null;
        } else if (o !== null && wi(r, o)) {
          t.flags |= 32;
        }
        Hs(e, t);
        Ls(e, t, s, n);
        return t.child;
      case 6:
        if (e === null) {
          ka(t);
        }
        return null;
      case 13:
        return Xs(e, t, n);
      case 4:
        ho(t, t.stateNode.containerInfo);
        r = t.pendingProps;
        if (e === null) {
          t.child = Ba(t, null, r, n);
        } else {
          Ls(e, t, r, n);
        }
        return t.child;
      case 11:
        r = t.type;
        a = t.pendingProps;
        a = t.elementType === r ? a : ys(r, a);
        return Rs(e, t, r, a, n);
      case 7:
        Ls(e, t, t.pendingProps, n);
        return t.child;
      case 8:
        Ls(e, t, t.pendingProps.children, n);
        return t.child;
      case 12:
        Ls(e, t, t.pendingProps.children, n);
        return t.child;
      case 10:
        a: {
          r = t.type._context;
          a = t.pendingProps;
          o = t.memoizedProps;
          s = a.value;
          U(Ha, r._currentValue);
          r._currentValue = s;
          if (o !== null) {
            if (Ar(o.value, s)) {
              if (o.children === a.children && !Yi.current) {
                t = ic(e, t, n);
                break a;
              }
            } else {
              o = t.child;
              if (o !== null) {
                o.return = t;
              }
              while (o !== null) {
                let c = o.dependencies;
                if (c !== null) {
                  s = o.child;
                  for (let l = c.firstContext; l !== null;) {
                    if (l.context === r) {
                      if (o.tag === 1) {
                        l = io(-1, n & -n);
                        l.tag = 2;
                        let u = o.updateQueue;
                        if (u !== null) {
                          u = u.shared;
                          const d = u.pending;
                          if (d === null) {
                            l.next = l;
                          } else {
                            l.next = d.next;
                            d.next = l;
                          }
                          u.pending = l;
                        }
                      }
                      o.lanes |= n;
                      l = o.alternate;
                      if (l !== null) {
                        l.lanes |= n;
                      }
                      Ja(o.return, n, t);
                      c.lanes |= n;
                      break;
                    }
                    l = l.next;
                  }
                } else if (o.tag === 10) {
                  s = o.type === t.type ? null : o.child;
                } else if (o.tag === 18) {
                  s = o.return;
                  if (s === null) {
                    throw Error(i(341));
                  }
                  s.lanes |= n;
                  c = s.alternate;
                  if (c !== null) {
                    c.lanes |= n;
                  }
                  Ja(s, n, t);
                  s = o.sibling;
                } else {
                  s = o.child;
                }
                if (s !== null) {
                  s.return = o;
                } else {
                  for (s = o; s !== null;) {
                    if (s === t) {
                      s = null;
                      break;
                    }
                    o = s.sibling;
                    if (o !== null) {
                      o.return = s.return;
                      s = o;
                      break;
                    }
                    s = s.return;
                  }
                }
                o = s;
              }
            }
          }
          Ls(e, t, a.children, n);
          t = t.child;
        }
        return t;
      case 9:
        a = t.type;
        r = t.pendingProps.children;
        Ya(t, n);
        a = Xa(a);
        r = r(a);
        t.flags |= 1;
        Ls(e, t, r, n);
        return t.child;
      case 14:
        r = t.type;
        a = ys(r, t.pendingProps);
        a = ys(r.type, a);
        return zs(e, t, r, a, n);
      case 15:
        return Bs(e, t, t.type, t.pendingProps, n);
      case 17:
        r = t.type;
        a = t.pendingProps;
        a = t.elementType === r ? a : ys(r, a);
        rc(e, t);
        t.tag = 1;
        if (Qi(r)) {
          e = true;
          na(t);
        } else {
          e = false;
        }
        Ya(t, n);
        Cs(t, r, a);
        Ts(t, r, a, n);
        return Gs(null, t, r, true, e, n);
      case 19:
        return nc(e, t, n);
      case 22:
        return Vs(e, t, n);
    }
    throw Error(i(156, t.tag));
  };
  function Gl(e, t) {
    return r_unstable_scheduleCallback(e, t);
  }
  function Kl(e, t, n, r) {
    this.tag = e;
    this.key = n;
    this.sibling =
      this.child =
      this.return =
      this.stateNode =
      this.type =
      this.elementType =
        null;
    this.index = 0;
    this.ref = null;
    this.pendingProps = t;
    this.dependencies =
      this.memoizedState =
      this.updateQueue =
      this.memoizedProps =
        null;
    this.mode = r;
    this.subtreeFlags = this.flags = 0;
    this.deletions = null;
    this.childLanes = this.lanes = 0;
    this.alternate = null;
  }
  function ql(e, t, n, r) {
    return new Kl(e, t, n, r);
  }
  function Jl(e) {
    e = e.prototype;
    return !(!e || !e.isReactComponent);
  }
  function Yl(e) {
    if (typeof e == `function`) {
      return +!!Jl(e);
    }
    if (e != null) {
      e = e.$$typeof;
      if (e === te) {
        return 11;
      }
      if (e === re) {
        return 14;
      }
    }
    return 2;
  }
  function Xl(e, t) {
    let e_alternate = e.alternate;
    if (e_alternate === null) {
      e_alternate = ql(e.tag, t, e.key, e.mode);
      e_alternate.elementType = e.elementType;
      e_alternate.type = e.type;
      e_alternate.stateNode = e.stateNode;
      e_alternate.alternate = e;
      e.alternate = e_alternate;
    } else {
      e_alternate.pendingProps = t;
      e_alternate.type = e.type;
      e_alternate.flags = 0;
      e_alternate.subtreeFlags = 0;
      e_alternate.deletions = null;
    }
    e_alternate.flags = e.flags & 14680064;
    e_alternate.childLanes = e.childLanes;
    e_alternate.lanes = e.lanes;
    e_alternate.child = e.child;
    e_alternate.memoizedProps = e.memoizedProps;
    e_alternate.memoizedState = e.memoizedState;
    e_alternate.updateQueue = e.updateQueue;
    t = e.dependencies;
    e_alternate.dependencies =
      t === null
        ? null
        : {
            lanes: t.lanes,
            firstContext: t.firstContext,
          };
    e_alternate.sibling = e.sibling;
    e_alternate.index = e.index;
    e_alternate.ref = e.ref;
    return e_alternate;
  }
  function Zl(e, t, n, r, a, o) {
    let s = 2;
    r = e;
    if (typeof e == `function`) {
      if (Jl(e)) {
        s = 1;
      }
    } else if (typeof e == `string`) {
      s = 5;
    } else {
      a: switch (e) {
        case E:
          return Ql(n.children, a, o, t);
        case D:
          s = 8;
          a |= 8;
          break;
        case O:
          e = ql(12, n, t, a | 2);
          e.elementType = O;
          e.lanes = o;
          return e;
        case ne:
          e = ql(13, n, t, a);
          e.elementType = ne;
          e.lanes = o;
          return e;
        case A:
          e = ql(19, n, t, a);
          e.elementType = A;
          e.lanes = o;
          return e;
        case ie:
          return $l(n, a, o, t);
        default:
          if (typeof e == `object` && e) {
            switch (e.$$typeof) {
              case k:
                s = 10;
                break a;
              case ee:
                s = 9;
                break a;
              case te:
                s = 11;
                break a;
              case re:
                s = 14;
                break a;
              case j:
                s = 16;
                r = null;
                break a;
            }
          }
          throw Error(i(130, e == null ? e : typeof e, ``));
      }
    }
    t = ql(s, n, t, a);
    t.elementType = e;
    t.type = r;
    t.lanes = o;
    return t;
  }
  function Ql(e, t, n, r) {
    e = ql(7, e, r, t);
    e.lanes = n;
    return e;
  }
  function $l(e, t, n, r) {
    e = ql(22, e, r, t);
    e.elementType = ie;
    e.lanes = n;
    e.stateNode = {
      isHidden: false,
    };
    return e;
  }
  function eu(e, mode, n) {
    e = ql(6, e, null, mode);
    e.lanes = n;
    return e;
  }
  function tu(e, t, n) {
    t = ql(4, e.children === null ? [] : e.children, e.key, t);
    t.lanes = n;
    t.stateNode = {
      containerInfo: e.containerInfo,
      pendingChildren: null,
      implementation: e.implementation,
    };
    return t;
  }
  function nu(e, t, n, r, i) {
    this.tag = t;
    this.containerInfo = e;
    this.finishedWork =
      this.pingCache =
      this.current =
      this.pendingChildren =
        null;
    this.timeoutHandle = -1;
    this.callbackNode = this.pendingContext = this.context = null;
    this.callbackPriority = 0;
    this.eventTimes = zt(0);
    this.expirationTimes = zt(-1);
    this.entangledLanes =
      this.finishedLanes =
      this.mutableReadLanes =
      this.expiredLanes =
      this.pingedLanes =
      this.suspendedLanes =
      this.pendingLanes =
        0;
    this.entanglements = zt(0);
    this.identifierPrefix = r;
    this.onRecoverableError = i;
    this.mutableSourceEagerHydrationData = null;
  }
  function ru(e, t, isDehydrated, element, i, a, o, s, c) {
    e = new nu(e, t, isDehydrated, s, c);
    if (t === 1) {
      t = 1;
      if (a === true) {
        t |= 8;
      }
    } else {
      t = 0;
    }
    a = ql(3, null, null, t);
    e.current = a;
    a.stateNode = e;
    a.memoizedState = {
      element,
      isDehydrated,
      cache: null,
      transitions: null,
      pendingSuspenseBoundaries: null,
    };
    no(a);
    return e;
  }
  function iu(e, containerInfo, implementation, r = null) {
    return {
      $$typeof: T,
      key: r == null ? null : `` + r,
      children: e,
      containerInfo,
      implementation,
    };
  }
  function au(e) {
    if (!e) {
      return qi;
    }
    e = e._reactInternals;
    a: {
      if (ut(e) !== e || e.tag !== 1) {
        throw Error(i(170));
      }
      var t = e;
      do {
        switch (t.tag) {
          case 3:
            t = t.stateNode.context;
            break a;
          case 1:
            if (Qi(t.type)) {
              t = t.stateNode.__reactInternalMemoizedMergedChildContext;
              break a;
            }
        }
        t = t.return;
      } while (t !== null);
      throw Error(i(171));
    }
    if (e.tag === 1) {
      const n = e.type;
      if (Qi(n)) {
        return ta(e, n, t);
      }
    }
    return t;
  }
  function ou(e, t, n, r, i, a, o, s, c) {
    e = ru(n, r, true, e, i, a, o, s, c);
    e.context = au(null);
    n = e.current;
    r = ml();
    i = hl(n);
    a = io(r, i);
    a.callback = t ?? null;
    ao(n, a, i);
    e.current.lanes = i;
    Bt(e, i, r);
    _l(e, r);
    return e;
  }
  function su(e, t, n, r) {
    const t_current = t.current;
    const a = ml();
    const o = hl(t_current);
    n = au(n);
    if (t.context === null) {
      t.context = n;
    } else {
      t.pendingContext = n;
    }
    t = io(a, o);
    t.payload = {
      element: e,
    };
    r = r === undefined ? null : r;
    if (r !== null) {
      t.callback = r;
    }
    e = ao(t_current, t, o);
    if (e !== null) {
      gl(e, t_current, o, a);
      oo(e, t_current, o);
    }
    return o;
  }
  function cu(e) {
    e = e.current;
    if (!e.child) {
      return null;
    }
    switch (e.child.tag) {
      case 5:
        return e.child.stateNode;
      default:
        return e.child.stateNode;
    }
  }
  function lu(e, t) {
    e = e.memoizedState;
    if (e !== null && e.dehydrated !== null) {
      const n = e.retryLane;
      e.retryLane = n !== 0 && n < t ? n : t;
    }
  }
  function uu(e, t) {
    lu(e, t);
    if ((e = e.alternate)) {
      lu(e, t);
    }
  }
  function du() {
    return null;
  }
  var fu =
    typeof reportError == `function`
      ? reportError
      : (e) => {
          console.error(e);
        };
  function pu(e) {
    this._internalRoot = e;
  }
  mu.prototype.render = pu.prototype.render = function (e) {
    const _internalRoot = this._internalRoot;
    if (_internalRoot === null) {
      throw Error(i(409));
    }
    su(e, _internalRoot, null, null);
  };
  mu.prototype.unmount = pu.prototype.unmount = function () {
    const _internalRoot = this._internalRoot;
    if (_internalRoot !== null) {
      this._internalRoot = null;
      const t = _internalRoot.containerInfo;
      Tl(() => {
        su(null, _internalRoot, null, null);
      });
      t[Ii] = null;
    }
  };
  function mu(e) {
    this._internalRoot = e;
  }
  mu.prototype.unstable_scheduleHydration = (e) => {
    if (e) {
      const priority = qt();
      e = {
        blockedOn: null,
        target: e,
        priority,
      };
      for (
        var n = 0;
        n < nn.length && priority !== 0 && priority < nn[n].priority;
        n++
      );
      nn.splice(n, 0, e);
      if (n === 0) {
        sn(e);
      }
    }
  };
  function hu(e) {
    return !(!e || (e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11));
  }
  function gu(e) {
    return !(
      !e ||
      (e.nodeType !== 1 &&
        e.nodeType !== 9 &&
        e.nodeType !== 11 &&
        (e.nodeType !== 8 || e.nodeValue !== ` react-mount-point-unstable `))
    );
  }
  function _u() {}
  function vu(e, t, n, r, i) {
    if (i) {
      if (typeof r == `function`) {
        const a = r;
        r = () => {
          const e = cu(o);
          a.call(e);
        };
      }
      var o = ou(t, r, e, 0, null, false, false, ``, _u);
      e._reactRootContainer = o;
      e[Ii] = o.current;
      ui(e.nodeType === 8 ? e.parentNode : e);
      Tl();
      return o;
    }
    while ((i = e.lastChild)) {
      e.removeChild(i);
    }
    if (typeof r == `function`) {
      const s = r;
      r = () => {
        const e = cu(c);
        s.call(e);
      };
    }
    var c = ru(e, 0, false, null, null, false, false, ``, _u);
    e._reactRootContainer = c;
    e[Ii] = c.current;
    ui(e.nodeType === 8 ? e.parentNode : e);
    Tl(() => {
      su(t, c, n, r);
    });
    return c;
  }
  function yu(e, t, n, r, i) {
    const n__reactRootContainer = n._reactRootContainer;
    if (n__reactRootContainer) {
      var o = n__reactRootContainer;
      if (typeof i == `function`) {
        const s = i;
        i = () => {
          const e = cu(o);
          s.call(e);
        };
      }
      su(t, o, e, i);
    } else {
      o = vu(n, t, e, i, r);
    }
    return cu(o);
  }
  Wt = (e) => {
    switch (e.tag) {
      case 3:
        const t = e.stateNode;
        if (t.current.memoizedState.isDehydrated) {
          const n = Pt(t.pendingLanes);
          if (n !== 0) {
            Ht(t, n | 1);
            _l(t, r_unstable_now());
            if (!(X & 6)) {
              nl = r_unstable_now() + 500;
              la();
            }
          }
        }
        break;
      case 13:
        Tl(() => {
          const t = eo(e, 1);
          if (t !== null) {
            gl(t, e, 1, ml());
          }
        });
        uu(e, 1);
    }
  };
  Gt = (e) => {
    if (e.tag === 13) {
      const t = eo(e, 134217728);
      if (t !== null) {
        gl(t, e, 134217728, ml());
      }
      uu(e, 134217728);
    }
  };
  Kt = (e) => {
    if (e.tag === 13) {
      const t = hl(e);
      const n = eo(e, t);
      if (n !== null) {
        gl(n, e, t, ml());
      }
      uu(e, t);
    }
  };
  qt = () => z;
  Jt = (e, t) => {
    const n = z;
    try {
      z = e;
      return t();
    } finally {
      z = n;
    }
  };
  Ue = (e, t, n) => {
    switch (t) {
      case `input`:
        Se(e, n);
        t = n.name;
        if (n.type === `radio` && t != null) {
          for (n = e; n.parentNode;) {
            n = n.parentNode;
          }
          n = n.querySelectorAll(
            `input[name=` + JSON.stringify(`` + t) + `][type="radio"]`,
          );
          for (t = 0; t < n.length; t++) {
            const r = n[t];
            if (r !== e && r.form === e.form) {
              const a = Ui(r);
              if (!a) {
                throw Error(i(90));
              }
              _e(r);
              Se(r, a);
            }
          }
        }
        break;
      case `textarea`:
        ke(e, n);
        break;
      case `select`:
        t = n.value;
        if (t != null) {
          Ee(e, !!n.multiple, t, false);
        }
    }
  };
  Ye = wl;
  Xe = Tl;
  var bu = {
    usingClientEntryPoint: false,
    Events: [Vi, Hi, Ui, qe, Je, wl],
  };
  var xu = {
    findFiberByHostInstance,
    bundleType: 0,
    version: `18.3.1`,
    rendererPackageName: `react-dom`,
  };
  var Su = {
    bundleType: xu.bundleType,
    version: xu.version,
    rendererPackageName: xu.rendererPackageName,
    rendererConfig: xu.rendererConfig,
    overrideHookState: null,
    overrideHookStateDeletePath: null,
    overrideHookStateRenamePath: null,
    overrideProps: null,
    overridePropsDeletePath: null,
    overridePropsRenamePath: null,
    setErrorHandler: null,
    setSuspenseHandler: null,
    scheduleUpdate: null,
    currentDispatcherRef:
      n___SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentDispatcher,
    findHostInstanceByFiber(e) {
      e = pt(e);
      if (e === null) {
        return null;
      }
      return e.stateNode;
    },
    findFiberByHostInstance: xu.findFiberByHostInstance || du,
    findHostInstancesForRefresh: null,
    scheduleRefresh: null,
    scheduleRoot: null,
    setRefreshHandler: null,
    getCurrentFiber: null,
    reconcilerVersion: `18.3.1-next-f1338f8080-20240426`,
  };
  if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < `u`) {
    var Cu = __REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (!Cu.isDisabled && Cu.supportsFiber) {
      try {
        Tt = Cu.inject(Su);
        Et = Cu;
      } catch {}
    }
  }
  e.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = bu;
  e.createPortal = (e, t, n = null) => {
    if (!hu(t)) {
      throw Error(i(200));
    }
    return iu(e, t, null, n);
  };
  e.createRoot = (e, t) => {
    if (!hu(e)) {
      throw Error(i(299));
    }
    let n = false;
    let r = ``;
    let a = fu;
    t != null &&
      (t.unstable_strictMode === true && (n = true),
      t.identifierPrefix !== undefined && (r = t.identifierPrefix),
      t.onRecoverableError !== undefined && (a = t.onRecoverableError));
    t = ru(e, 1, false, null, null, n, false, r, a);
    e[Ii] = t.current;
    ui(e.nodeType === 8 ? e.parentNode : e);
    return new pu(t);
  };
  e.findDOMNode = (e) => {
    if (e == null) {
      return null;
    }
    if (e.nodeType === 1) {
      return e;
    }
    const e__reactInternals = e._reactInternals;
    if (e__reactInternals === undefined) {
      throw typeof e.render == `function`
        ? Error(i(188))
        : ((e = Object.keys(e).join(`,`)), Error(i(268, e)));
    }
    e = pt(e__reactInternals);
    e = e === null ? null : e.stateNode;
    return e;
  };
  e.flushSync = (e) => Tl(e);
  e.hydrate = (e, t, n) => {
    if (!gu(t)) {
      throw Error(i(200));
    }
    return yu(null, e, t, true, n);
  };
  e.hydrateRoot = (e, t, n) => {
    if (!hu(e)) {
      throw Error(i(405));
    }
    const r = (n != null && n.hydratedSources) || null;
    let a = false;
    let o = ``;
    let s = fu;
    n != null &&
      (n.unstable_strictMode === true && (a = true),
      n.identifierPrefix !== undefined && (o = n.identifierPrefix),
      n.onRecoverableError !== undefined && (s = n.onRecoverableError));
    t = ou(t, null, e, 1, n ?? null, a, false, o, s);
    e[Ii] = t.current;
    ui(e);
    if (r) {
      for (e = 0; e < r.length; e++) {
        n = r[e];
        a = n._getVersion;
        a = a(n._source);
        if (t.mutableSourceEagerHydrationData == null) {
          t.mutableSourceEagerHydrationData = [n, a];
        } else {
          t.mutableSourceEagerHydrationData.push(n, a);
        }
      }
    }
    return new mu(t);
  };
  e.render = (e, t, n) => {
    if (!gu(t)) {
      throw Error(i(200));
    }
    return yu(null, e, t, false, n);
  };
  e.unmountComponentAtNode = (e) => {
    if (!gu(e)) {
      throw Error(i(40));
    }
    if (e._reactRootContainer) {
      return (
        Tl(() => {
          yu(null, null, e, false, () => {
            e._reactRootContainer = null;
            e[Ii] = null;
          });
        }),
        true
      );
    }
    return false;
  };
  e.unstable_batchedUpdates = wl;
  e.unstable_renderSubtreeIntoContainer = (e, t, n, r) => {
    if (!gu(n)) {
      throw Error(i(200));
    }
    if (e == null || e._reactInternals === undefined) {
      throw Error(i(38));
    }
    return yu(e, t, n, false, r);
  };
  e.version = `18.3.1-next-f1338f8080-20240426`;
});
const w = r((e, t) => {
  function n() {
    if (
      typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < `u` &&
      typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE == `function`
    ) {
      try {
        __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(n);
      } catch (error) {
        console.error(error);
      }
    }
  }
  n();
  t.exports = C();
});
const T = r((e) => {
  var t = w();
  e.createRoot = t.createRoot;
  e.hydrateRoot = t.hydrateRoot;
});
const E = i_1(n_1(), 1);
const DContext = E.createContext({});
function useO(e) {
  let tRef = E.useRef(null);
  if (tRef.current === null) {
    tRef.current = e();
  }
  return tRef.current;
}
const k = typeof window < `u` ? E.useLayoutEffect : E.useEffect;
const EeContext = E.createContext(null);
function te(e, t) {
  if (e.indexOf(t) === -1) {
    e.push(t);
  }
}
function ne(e, t) {
  let n = e.indexOf(t);
  if (n > -1) {
    e.splice(n, 1);
  }
}
const A = (e, t, n) => {
  if (n > t) {
    return t;
  }
  if (n < e) {
    return e;
  }
  return n;
};
const re = {};
const j = (e) => /^-?(?:\d+(?:\.\d+)?|\.\d+)$/u.test(e);
const ie = (e) => typeof e == `object` && !!e;
const ae = (e) => /^0[^.\s]+$/u.test(e);
function oe(e) {
  let t;
  return () => {
    if (t === undefined) {
      t = e();
    }
    return t;
  };
}
const linear = (e) => e;
const se = (...e) => e.reduce((acc, item) => (n) => item(acc(n)));
const ce = (e, t, n) => {
  let r = t - e;
  if (r) {
    return (n - e) / r;
  }
  return 1;
};
class le {
  constructor() {
    this.subscriptions = [];
  }
  add(e) {
    te(this.subscriptions, e);
    return () => this.remove(e);
  }
  remove(e) {
    ne(this.subscriptions, e);
  }
  notify(e, t, n) {
    let length = this.subscriptions.length;
    if (length) {
      if (length === 1) {
        this.subscriptions[0](e, t, n);
      } else {
        for (let i = 0; i < length; i++) {
          let r = this.subscriptions[i];
          if (r) {
            r(e, t, n);
          }
        }
      }
    }
  }
  getSize() {
    return this.subscriptions.length;
  }
  clear() {
    this.subscriptions.length = 0;
  }
}
const N = (e) => e * 1000;
const ue = (e) => e / 1000;
const de = (e, t) => {
  if (t) {
    return (1000 / t) * e;
  }
  return 0;
};
const fe = (e, t, n) =>
  (((1 - 3 * n + 3 * t) * e + (3 * n - 6 * t)) * e + 3 * t) * e;
const pe = 1e-7;
const me = 12;
function he(e, t, n, r, i) {
  let a;
  let o;
  let s = 0;
  do {
    o = t + (n - t) / 2;
    a = fe(o, r, i) - e;
    if (a > 0) {
      n = o;
    } else {
      t = o;
    }
  } while (Math.abs(a) > pe && ++s < me);
  return o;
}
function ge(e, t, n, r) {
  if (e === t && n === r) {
    return linear;
  }
  let i = (t) => he(t, 0, 1, e, n);
  return (e) => {
    if (e === 0 || e === 1) {
      return e;
    }
    return fe(i(e), t, r);
  };
}
const _e = (e) => (t) => {
  if (t <= 0.5) {
    return e(2 * t) / 2;
  }
  return (2 - e(2 * (1 - t))) / 2;
};
const ve = (e) => (t) => 1 - e(1 - t);
const backOut = ge(0.33, 1.53, 0.69, 0.99);
const backIn = ve(backOut);
const backInOut = _e(backIn);
const anticipate = (e) => {
  if (e >= 1) {
    return 1;
  }
  if ((e *= 2) < 1) {
    return 0.5 * backIn(e);
  }
  return 0.5 * (2 - 2 ** (-10 * (e - 1)));
};
const circIn = (e) => 1 - Math.sin(Math.acos(e));
const circOut = ve(circIn);
const circInOut = _e(circIn);
const easeIn = ge(0.42, 0, 1, 1);
const easeOut = ge(0, 0, 0.58, 1);
const easeInOut = ge(0.42, 0, 0.58, 1);
const ke = (ease) => Array.isArray(ease) && typeof ease[0] != `number`;
const Ae = (e) => Array.isArray(e) && typeof e[0] == `number`;
const je = {
  linear,
  easeIn,
  easeInOut,
  easeOut,
  circIn,
  circInOut,
  circOut,
  backIn,
  backInOut,
  backOut,
  anticipate,
};
const Me = (e) => typeof e == `string`;
const Ne = (e) => {
  if (Ae(e)) {
    e.length;
    let [t, n, r, i] = e;
    return ge(t, n, r, i);
  }
  if (Me(e)) {
    return (je[e], `${e}`, je[e]);
  }
  return e;
};
const Pe = [
  `setup`,
  `read`,
  `resolveKeyframes`,
  `preUpdate`,
  `update`,
  `preRender`,
  `render`,
  `postRender`,
];
function Fe(e) {
  let t = new Set();
  let n = new Set();
  let r = false;
  let i = false;
  let a = new Set();
  let o = {
    delta: 0,
    timestamp: 0,
    isProcessing: false,
  };
  function s(t) {
    if (a.has(t)) {
      n.add(t);
      e();
    }
    t(o);
  }
  let c = {
    schedule: (e, i = false, o = false) => {
      let s = o && r ? t : n;
      if (i) {
        a.add(e);
      }
      s.add(e);
      return e;
    },
    cancel: (e) => {
      n.delete(e);
      a.delete(e);
    },
    process: (e) => {
      o = e;
      if (r) {
        i = true;
        return;
      }
      r = true;
      let a = t;
      t = n;
      n = a;
      t.forEach(s);
      t.clear();
      r = false;
      if (i) {
        i = false;
        c.process(e);
      }
    },
  };
  return c;
}
const Ie = 40;
function Le(e, t) {
  let n = false;
  let r = true;
  let i = {
    delta: 0,
    timestamp: 0,
    isProcessing: false,
  };
  let a = () => (n = true);
  let steps_1 = Pe.reduce((acc, item) => {
    acc[item] = Fe(a);
    return acc;
  }, {});
  let {
    setup,
    read,
    resolveKeyframes,
    preUpdate,
    update,
    preRender,
    render,
    postRender,
  } = steps_1;
  let h = () => {
    let re_useManualTiming = re.useManualTiming;
    let o = re_useManualTiming ? i.timestamp : performance.now();
    n = false;
    if (!re_useManualTiming) {
      i.delta = r ? 1000 / 60 : Math.max(Math.min(o - i.timestamp, Ie), 1);
    }
    i.timestamp = o;
    i.isProcessing = true;
    setup.process(i);
    read.process(i);
    resolveKeyframes.process(i);
    preUpdate.process(i);
    update.process(i);
    preRender.process(i);
    render.process(i);
    postRender.process(i);
    i.isProcessing = false;
    if (n && t) {
      r = false;
      e(h);
    }
  };
  let g = () => {
    n = true;
    r = true;
    if (!i.isProcessing) {
      e(h);
    }
  };
  return {
    schedule: Pe.reduce((acc, item) => {
      let r = steps_1[item];
      acc[item] = (e, t = false, i = false) => {
        if (!n) {
          g();
        }
        return r.schedule(e, t, i);
      };
      return acc;
    }, {}),
    cancel: (e) => {
      for (let t = 0; t < Pe.length; t++) {
        steps_1[Pe[t]].cancel(e);
      }
    },
    state: i,
    steps: steps_1,
  };
}
const { schedule, cancel, state, steps } = Le(
  typeof requestAnimationFrame < `u` ? requestAnimationFrame : linear,
  true,
);
let Ve;
function He() {
  Ve = undefined;
}
var F = {
  now: () => {
    if (Ve === undefined) {
      F.set(
        state.isProcessing || re.useManualTiming
          ? state.timestamp
          : performance.now(),
      );
    }
    return Ve;
  },
  set: (e) => {
    Ve = e;
    queueMicrotask(He);
  },
};
const Ue = (e) => Math.round(e * 100000) / 100000;
const We = (e) => (t) => typeof t == `string` && t.startsWith(e);
const Ge = We(`--`);
const Ke = We(`var(--`);
const qe = (e) => {
  if (Ke(e)) {
    return Je.test(e.split(`/*`)[0].trim());
  }
  return false;
};
var Je =
  /var\(--(?:[\w-]+\s*|[\w-]+\s*,(?:\s*[^)(\s]|\s*\((?:[^)(]|\([^)(]*\))*\))+\s*)\)$/iu;
function Ye(e) {
  return typeof e == `string` && e.split(`/*`)[0].includes(`var(--`);
}
const Xe = {
  test: (e) => typeof e == `number`,
  parse: parseFloat,
  transform: (e) => e,
};
const Ze = {
  ...Xe,
  transform: (e) => A(0, 1, e),
};
const Qe = {
  ...Xe,
  default: 1,
};
const $e = /-?(?:\d+(?:\.\d+)?|\.\d+)/gu;
function et(e) {
  return e == null;
}
const tt =
  /^(?:#[\da-f]{3,8}|(?:rgb|hsl)a?\((?:-?[\d.]+%?[,\s]+){2}-?[\d.]+%?\s*(?:[,/]\s*)?(?:\b\d+(?:\.\d+)?|\.\d+)?%?\))$/iu;
const nt = (e, t) => (n) =>
  !!(
    (typeof n == `string` && tt.test(n) && n.startsWith(e)) ||
    (t && !et(n) && Object.prototype.hasOwnProperty.call(n, t))
  );
const rt = (e, t, n) => (r) => {
  if (typeof r != `string`) {
    return r;
  }
  let [i, a, o, s] = r.match($e);
  return {
    [e]: parseFloat(i),
    [t]: parseFloat(a),
    [n]: parseFloat(o),
    alpha: s === undefined ? 1 : parseFloat(s),
  };
};
const it = (e) => A(0, 255, e);
const at = {
  ...Xe,
  transform: (e) => Math.round(it(e)),
};
const ot = {
  test: nt(`rgb`, `red`),
  parse: rt(`red`, `green`, `blue`),
  transform: ({ red, green, blue, alpha = 1 }) =>
    `rgba(` +
    at.transform(red) +
    `, ` +
    at.transform(green) +
    `, ` +
    at.transform(blue) +
    `, ` +
    Ue(Ze.transform(alpha)) +
    `)`,
};
function parse_1(e) {
  let t = ``;
  let n = ``;
  let r = ``;
  let i = ``;
  if (e.length > 5) {
    t = e.substring(1, 3);
    n = e.substring(3, 5);
    r = e.substring(5, 7);
    i = e.substring(7, 9);
  } else {
    t = e.substring(1, 2);
    n = e.substring(2, 3);
    r = e.substring(3, 4);
    i = e.substring(4, 5);
    t += t;
    n += n;
    r += r;
    i += i;
  }
  return {
    red: parseInt(t, 16),
    green: parseInt(n, 16),
    blue: parseInt(r, 16),
    alpha: i ? parseInt(i, 16) / 255 : 1,
  };
}
const ct = {
  test: nt(`#`),
  parse: parse_1,
  transform: ot.transform,
};
const lt = (e) => ({
  test: (t) =>
    typeof t == `string` && t.endsWith(e) && t.split(` `).length === 1,
  parse: parseFloat,
  transform: (t) => `${t}${e}`,
});
const ut = lt(`deg`);
const dt = lt(`%`);
const I = lt(`px`);
const ft = lt(`vh`);
const pt = lt(`vw`);
const mt = {
  ...dt,
  parse: (e) => dt.parse(e) / 100,
  transform: (e) => dt.transform(e * 100),
};
const ht = {
  test: nt(`hsl`, `hue`),
  parse: rt(`hue`, `saturation`, `lightness`),
  transform: ({ hue, saturation, lightness, alpha = 1 }) =>
    `hsla(` +
    Math.round(hue) +
    `, ` +
    dt.transform(Ue(saturation)) +
    `, ` +
    dt.transform(Ue(lightness)) +
    `, ` +
    Ue(Ze.transform(alpha)) +
    `)`,
};
var gt = {
  test: (e) => ot.test(e) || ct.test(e) || ht.test(e),
  parse: (e) => {
    if (ot.test(e)) {
      return ot.parse(e);
    }
    if (ht.test(e)) {
      return ht.parse(e);
    }
    return ct.parse(e);
  },
  transform: (e) => {
    if (typeof e == `string`) {
      return e;
    }
    if (e.hasOwnProperty(`red`)) {
      return ot.transform(e);
    }
    return ht.transform(e);
  },
  getAnimatableNone: (e) => {
    let t = gt.parse(e);
    t.alpha = 0;
    return gt.transform(t);
  },
};
const _t =
  /(?:#[\da-f]{3,8}|(?:rgb|hsl)a?\((?:-?[\d.]+%?[,\s]+){2}-?[\d.]+%?\s*(?:[,/]\s*)?(?:\b\d+(?:\.\d+)?|\.\d+)?%?\))/giu;
const vt = new RegExp($e.source);
const L = new RegExp(_t.source, `i`);
function test(e) {
  return isNaN(e) && typeof e == `string` && (vt.test(e) || L.test(e));
}
const bt = `number`;
const xt = `color`;
const St = `var`;
const Ct = `var(`;
const wt = "${}";
const Tt =
  /var\s*\(\s*--(?:[\w-]+\s*|[\w-]+\s*,(?:\s*[^)(\s]|\s*\((?:[^)(]|\([^)(]*\))*\))+\s*)\)|#[\da-f]{3,8}|(?:rgb|hsl)a?\((?:-?[\d.]+%?[,\s]+){2}-?[\d.]+%?\s*(?:[,/]\s*)?(?:\b\d+(?:\.\d+)?|\.\d+)?%?\)|-?(?:\d+(?:\.\d+)?|\.\d+)/giu;
function Et(e) {
  let t = e.toString();
  return vt.test(t) || L.test(t);
}
function Dt(e) {
  let t = e.toString();
  let values = [];
  let indexes = {
    color: [],
    number: [],
    var: [],
  };
  let types = [];
  let a = 0;
  return {
    values,
    split: t
      .replace(Tt, (e) => {
        if (gt.test(e)) {
          indexes.color.push(a);
          types.push(xt);
          values.push(gt.parse(e));
        } else if (e.startsWith(Ct)) {
          indexes.var.push(a);
          types.push(St);
          values.push(e);
        } else {
          indexes.number.push(a);
          types.push(bt);
          values.push(parseFloat(e));
        }
        ++a;
        return wt;
      })
      .split(wt),
    indexes,
    types,
  };
}
function parse(e) {
  return Dt(e).values;
}
function kt({ split, types }) {
  let split_length = split.length;
  return (r) => {
    let i = ``;
    for (let a = 0; a < split_length; a++) {
      i += split[a];
      if (r[a] !== undefined) {
        let e = types[a];
        i += e === bt ? Ue(r[a]) : e === xt ? gt.transform(r[a]) : r[a];
      }
    }
    return i;
  };
}
function createTransformer(e) {
  return kt(Dt(e));
}
const jt = (e) => {
  if (typeof e == `number`) {
    return 0;
  }
  if (gt.test(e)) {
    return gt.getAnimatableNone(e);
  }
  return e;
};
const Mt = (e, t) => {
  if (typeof e == `number`) {
    if (t?.trim().endsWith(`/`)) {
      return e;
    }
    return 0;
  }
  return jt(e);
};
function getAnimatableNone(e) {
  let t = Dt(e);
  return kt(t)(t.values.map((e, n) => Mt(e, t.split[n])));
}
const Pt = {
  test,
  parse,
  createTransformer,
  getAnimatableNone,
};
function Ft(e, t, n) {
  if (n < 0) {
    n += 1;
  }
  n > 1 && --n;
  if (n < 1 / 6) {
    return e + (t - e) * 6 * n;
  }
  if (n < 1 / 2) {
    return t;
  }
  if (n < 2 / 3) {
    return e + (t - e) * (2 / 3 - n) * 6;
  }
  return e;
}
function It({ hue, saturation, lightness, alpha }) {
  hue /= 360;
  saturation /= 100;
  lightness /= 100;
  let i = 0;
  let a = 0;
  let o = 0;
  if (!saturation) {
    o = lightness;
    a = lightness;
    i = lightness;
  } else {
    let r =
      lightness < 0.5
        ? lightness * (1 + saturation)
        : lightness + saturation - lightness * saturation;
    let s = 2 * lightness - r;
    i = Ft(s, r, hue + 1 / 3);
    a = Ft(s, r, hue);
    o = Ft(s, r, hue - 1 / 3);
  }
  return {
    red: Math.round(i * 255),
    green: Math.round(a * 255),
    blue: Math.round(o * 255),
    alpha,
  };
}
function Lt(e, t) {
  return (n) => {
    if (n > 0) {
      return t;
    }
    return e;
  };
}
const R = (e, t, n) => e + (t - e) * n;
const Rt = (e, t, n) => {
  let r = e * e;
  let i = n * (t * t - r) + r;
  if (i < 0) {
    return 0;
  }
  return Math.sqrt(i);
};
const zt = [ct, ot, ht];
const Bt = (e) => zt.find((t) => t.test(e));
function Vt(e) {
  let t = Bt(e);
  if (!t) {
    `${e}`;
    return false;
  }
  let n = t.parse(e);
  if (t === ht) {
    n = It(n);
  }
  return n;
}
const Ht = (e, t) => {
  let n = Vt(e);
  let r = Vt(t);
  if (!n || !r) {
    return Lt(e, t);
  }
  let i = {
    ...n,
  };
  return (e) => {
    i.red = Rt(n.red, r.red, e);
    i.green = Rt(n.green, r.green, e);
    i.blue = Rt(n.blue, r.blue, e);
    i.alpha = R(n.alpha, r.alpha, e);
    return ot.transform(i);
  };
};
const z = new Set([`none`, `hidden`]);
function Ut(e, t) {
  if (z.has(e)) {
    return (n) => {
      if (n <= 0) {
        return e;
      }
      return t;
    };
  }
  return (n) => {
    if (n >= 1) {
      return t;
    }
    return e;
  };
}
function Wt(e, t) {
  return (n) => R(e, t, n);
}
function Gt(e) {
  if (typeof e == `number`) {
    return Wt;
  }
  if (typeof e == `string`) {
    if (qe(e)) {
      return Lt;
    }
    if (gt.test(e)) {
      return Ht;
    }
    return Yt;
  }
  if (Array.isArray(e)) {
    return Kt;
  }
  if (typeof e == `object`) {
    if (gt.test(e)) {
      return Ht;
    }
    return qt;
  }
  return Lt;
}
function Kt(e, t) {
  let n = [...e];
  let n_length = n.length;
  let i = e.map((e, n) => Gt(e)(e, t[n]));
  return (e) => {
    for (let t = 0; t < n_length; t++) {
      n[t] = i[t](e);
    }
    return n;
  };
}
function qt(e, t) {
  let n = {
    ...e,
    ...t,
  };
  let r = {};
  for (let i in n) {
    if (e[i] !== undefined && t[i] !== undefined) {
      r[i] = Gt(e[i])(e[i], t[i]);
    }
  }
  return (e) => {
    for (let t in r) {
      n[t] = r[t](e);
    }
    return n;
  };
}
function Jt(e, t) {
  let n = [];
  let r = {
    color: 0,
    var: 0,
    number: 0,
  };
  for (let i = 0; i < t.values.length; i++) {
    let a = t.types[i];
    let o = e.indexes[a][r[a]];
    let s = e.values[o] ?? 0;
    n[i] = s;
    r[a]++;
  }
  return n;
}
var Yt = (e, t) => {
  let n = Pt.createTransformer(t);
  let r = Dt(e);
  let i = Dt(t);
  if (
    r.indexes.var.length === i.indexes.var.length &&
    r.indexes.color.length === i.indexes.color.length &&
    r.indexes.number.length >= i.indexes.number.length
  ) {
    if ((z.has(e) && !i.values.length) || (z.has(t) && !r.values.length)) {
      return Ut(e, t);
    }
    return se(Kt(Jt(r, i), i.values), n);
  }
  return (`${e}${t}`, Lt(e, t));
};
const Xt = /^(-?(?:\d+(?:\.\d*)?|\.\d+))([a-z%]*)$/iu;
function Zt(e, t) {
  let n = Xt.exec(e);
  if (!n) {
    return;
  }
  let r = Xt.exec(t);
  if (!r || n[2] !== r[2]) {
    return;
  }
  let i = n[2];
  let a = parseFloat(n[1]);
  let o = parseFloat(r[1]);
  return (e) => Ue(R(a, o, e)) + i;
}
function Qt(e, t, n) {
  if (typeof e == `number` && typeof t == `number` && typeof n == `number`) {
    return R(e, t, n);
  }
  if (typeof e == `string` && typeof t == `string`) {
    let n = Zt(e, t);
    if (n) {
      return n;
    }
  }
  return Gt(e)(e, t);
}
const $t = (e) => {
  let t = ({ timestamp }) => e(timestamp);
  return {
    start: (e = true) => schedule.update(t, e),
    stop: () => cancel(t),
    now: () => {
      if (state.isProcessing) {
        return state.timestamp;
      }
      return F.now();
    },
  };
};
const en = (e, t, n = 10) => {
  let r = ``;
  let i = Math.max(Math.round(t / n), 2);
  for (let t = 0; t < i; t++) {
    r += Math.round(e(t / (i - 1)) * 10000) / 10000 + `, `;
  }
  return `linear(${r.substring(0, r.length - 2)})`;
};
const tn = 20000;
function nn(e, t = 50, n = tn, r) {
  let i = 0;
  let a = e.next(i);
  for (r?.push(a.value); !a.done && i < n;) {
    i += t;
    a = e.next(i);
    r?.push(a.value);
  }
  if (i >= n) {
    return Infinity;
  }
  return i;
}
function rn(e, t = 100, spring) {
  let r = spring({
    ...e,
    keyframes: [0, t],
  });
  let i = Math.min(nn(r), tn);
  return {
    type: `keyframes`,
    ease: (e) => r.next(i * e).value / t,
    duration: ue(i),
  };
}
const B = {
  stiffness: 100,
  damping: 10,
  mass: 1,
  velocity: 0,
  duration: 800,
  bounce: 0.3,
  visualDuration: 0.3,
  restSpeed: {
    granular: 0.01,
    default: 2,
  },
  restDelta: {
    granular: 0.005,
    default: 0.5,
  },
  minDuration: 0.01,
  maxDuration: 10,
  minDamping: 0.05,
  maxDamping: 1,
};
function an(e, t) {
  return e * Math.sqrt(1 - t * t);
}
const on = 12;
function sn(e, t, n) {
  let r = n;
  for (let n = 1; n < on; n++) {
    r -= e(r) / t(r);
  }
  return r;
}
const cn = 0.001;
function ln({
  duration = B.duration,
  bounce = B.bounce,
  velocity = B.velocity,
  mass = B.mass,
}) {
  let i;
  let a;
  B.maxDuration;
  let o = 1 - bounce;
  o = A(B.minDamping, B.maxDamping, o);
  duration = A(B.minDuration, B.maxDuration, ue(duration));
  if (o < 1) {
    i = (t) => {
      let r = t * o;
      let i = r * duration;
      let a = r - velocity;
      let s = an(t, o);
      let c = Math.exp(-i);
      return cn - (a / s) * c;
    };
    a = (t) => {
      let r = t * o * duration;
      let a = r * velocity + velocity;
      let s = o * o * t * t * duration;
      let c = Math.exp(-r);
      let l = an(t * t, o);
      return ((-i(t) + cn > 0 ? -1 : 1) * ((a - s) * c)) / l;
    };
  } else {
    i = (t) =>
      -0.001 + Math.exp(-t * duration) * ((t - velocity) * duration + 1);
    a = (t) =>
      Math.exp(-t * duration) * ((velocity - t) * (duration * duration));
  }
  let s = 5 / duration;
  let c = sn(i, a, s);
  duration = N(duration);
  if (isNaN(c)) {
    return {
      stiffness: B.stiffness,
      damping: B.damping,
      duration,
    };
  }
  {
    let t = c * c * mass;
    return {
      stiffness: t,
      damping: o * 2 * Math.sqrt(mass * t),
      duration,
    };
  }
}
const un = [`duration`, `bounce`];
function dn(e, t) {
  return t.some((t) => e[t] !== undefined);
}
const fn = (e, t) => (t ? e >= 0 : e > 0) && e < Infinity;
function pn(e, t) {
  if (fn(e, t)) {
    return e;
  }
}
function mn(e) {
  let t = pn(e.stiffness);
  let n = pn(e.damping, true);
  let r = pn(e.mass);
  let i = {
    ...e,
    stiffness: t ?? B.stiffness,
    damping: n ?? B.damping,
    mass: r ?? B.mass,
    isResolvedFromDuration: false,
    isTimeDefined: (t ?? n ?? r) === undefined && dn(e, un),
  };
  if (i.isTimeDefined) {
    i.velocity = 0;
    if (e.visualDuration) {
      let t = e.visualDuration;
      let n = (2 * Math.PI) / (t * 1.2);
      let r = n * n;
      let damping = 2 * A(0.05, 1, 1 - (e.bounce || 0)) * Math.sqrt(r);
      i = {
        ...i,
        mass: B.mass,
        stiffness: r,
        damping,
      };
    } else {
      let e = ln(i);
      i = {
        ...i,
        ...e,
        mass: B.mass,
      };
      i.isResolvedFromDuration = true;
    }
    if (!fn(i.stiffness) || !fn(i.damping, true)) {
      i.stiffness = B.stiffness;
      i.damping = B.damping;
    }
  }
  return i;
}
function spring(visualDuration = B.visualDuration, bounce = B.bounce) {
  let n =
    typeof visualDuration == `object`
      ? visualDuration
      : {
          visualDuration,
          keyframes: [0, 1],
          bounce,
        };
  let r = n.keyframes[0];
  let i = n.keyframes[n.keyframes.length - 1];
  let a = {
    done: false,
    value: r,
  };
  let {
    stiffness,
    damping,
    mass,
    duration,
    velocity,
    isResolvedFromDuration,
    isTimeDefined,
  } = mn({
    ...n,
    velocity: -ue(n.velocity || 0),
  });
  let p = damping / (2 * Math.sqrt(stiffness * mass));
  let m = ue(Math.sqrt(stiffness / mass));
  let h = p * m;
  let g = {
    target: i,
    delta: i - r,
    velocity: velocity || 0,
    restSpeed: 0,
    restDelta: 0,
  };
  let _ = () => {
    let e = Math.abs(g.delta) < 5;
    g.restSpeed =
      n.restSpeed || (e ? B.restSpeed.granular : B.restSpeed.default);
    g.restDelta =
      n.restDelta || (e ? B.restDelta.granular : B.restDelta.default);
  };
  _();
  let v;
  let y;
  let b;
  if (p < 1) {
    let e = an(m, p);
    let t = {
      A: 0,
      sinC: 0,
      cosC: 0,
      t: -1,
      env: 0,
      sin: 0,
      cos: 0,
    };
    b = () => {
      t.A = (g.velocity + h * g.delta) / e;
      t.sinC = h * t.A + g.delta * e;
      t.cosC = h * g.delta - t.A * e;
    };
    let n = (n) => {
      if (n !== t.t) {
        t.t = n;
        t.env = Math.exp(-h * n);
        t.sin = Math.sin(e * n);
        t.cos = Math.cos(e * n);
      }
    };
    v = (e) => {
      n(e);
      return g.target - t.env * (t.A * t.sin + g.delta * t.cos);
    };
    y = (e) => {
      n(e);
      return t.env * (t.sinC * t.sin + t.cosC * t.cos);
    };
  } else if (p === 1) {
    v = (e) =>
      g.target - Math.exp(-m * e) * (g.delta + (g.velocity + m * g.delta) * e);
    let e = {
      C: 0,
    };
    b = () => {
      e.C = g.velocity + m * g.delta;
    };
    y = (t) => Math.exp(-m * t) * (m * e.C * t - g.velocity);
  } else {
    let e = m * Math.sqrt(p * p - 1);
    v = (t) => {
      let n = Math.exp(-h * t);
      let r = Math.min(e * t, 300);
      return (
        g.target -
        (n *
          ((g.velocity + h * g.delta) * Math.sinh(r) +
            e * g.delta * Math.cosh(r))) /
          e
      );
    };
    let t = {
      P: 0,
      sinh: 0,
      cosh: 0,
    };
    b = () => {
      t.P = (g.velocity + h * g.delta) / e;
      t.sinh = h * t.P - g.delta * e;
      t.cosh = h * g.delta - t.P * e;
    };
    y = (n) => {
      let r = Math.exp(-h * n);
      let i = Math.min(e * n, 300);
      return r * (t.sinh * Math.sinh(i) + t.cosh * Math.cosh(i));
    };
  }
  b();
  let calculatedDuration = (isResolvedFromDuration && duration) || null;
  let S = {
    calculatedDuration,
    retarget: (e, t) => {
      g.target = e[e.length - 1];
      g.delta = g.target - e[0];
      g.velocity = isTimeDefined ? 0 : -ue(t);
      if (!(n.restSpeed && n.restDelta)) {
        _();
      }
      S.calculatedDuration = calculatedDuration;
      a.done = false;
      b();
    },
    velocity: (e) => N(y(e)),
    next: (e) => {
      let t = v(e);
      if (isResolvedFromDuration) {
        a.done = e >= duration;
      } else {
        let n = N(y(e));
        a.done =
          Math.abs(n) <= g.restSpeed && Math.abs(g.target - t) <= g.restDelta;
      }
      a.value = a.done ? g.target : t;
      return a;
    },
    toString: () => {
      let e = Math.min(nn(S), tn);
      let t = en((t) => S.next(e * t).value, e, 30);
      return e + `ms ` + t;
    },
    toTransition: () => {},
  };
  return S;
}
spring.applyToOptions = (e) => {
  let t = rn(e, 100, spring);
  e.ease = t.ease;
  e.duration = N(t.duration);
  e.type = `keyframes`;
  return e;
};
function gn({
  keyframes,
  velocity = 0,
  power = 0.8,
  timeConstant = 325,
  bounceDamping = 10,
  bounceStiffness = 500,
  modifyTarget,
  min,
  max,
  restDelta = 0.5,
  restSpeed,
}) {
  let d = keyframes[0];
  let f = {
    done: false,
    value: d,
  };
  let p = (e) => e < min || e > max;
  let m = (e) => {
    if (min === undefined) {
      return max;
    }
    if (max === undefined || Math.abs(min - e) < Math.abs(max - e)) {
      return min;
    }
    return max;
  };
  let h = power * velocity;
  let g = d + h;
  let _ = modifyTarget === undefined ? g : modifyTarget(g);
  if (_ !== g) {
    h = _ - d;
  }
  let v = (e) => -h * Math.exp(-e / timeConstant);
  let y = (e) => {
    let t = v(e);
    f.done = Math.abs(t) <= restDelta;
    f.value = f.done ? _ : _ + t;
  };
  let b;
  let x;
  let S = (e) => {
    if (p(f.value)) {
      b = e;
      x = spring({
        keyframes: [f.value, m(f.value)],
        velocity: (-v(e) / timeConstant) * 1000,
        damping: bounceDamping,
        stiffness: bounceStiffness,
        restDelta,
        restSpeed,
      });
    }
  };
  S(0);
  return {
    calculatedDuration: null,
    next: (e) => {
      let t = false;
      if (!x && b === undefined) {
        t = true;
        y(e);
        S(e);
      }
      if (b !== undefined && e >= b) {
        return x.next(e - b);
      }
      return (!t && y(e), f);
    },
  };
}
function _n(e, ease, mixer) {
  let r = [];
  let i = mixer || re.mix || Qt;
  let a = e.length - 1;
  for (let n = 0; n < a; n++) {
    let a = i(e[n], e[n + 1]);
    if (ease) {
      a = se(Array.isArray(ease) ? ease[n] || linear : ease, a);
    }
    r.push(a);
  }
  return r;
}
function vn(e, t, { clamp = true, ease, mixer } = {}) {
  let e_length = e.length;
  t.length;
  if (e_length === 1) {
    return () => t[0];
  }
  if (e_length === 2 && t[0] === t[1]) {
    return () => t[1];
  }
  let o = e[0] === e[1];
  if (e[0] > e[e_length - 1]) {
    e = [...e].reverse();
    t = [...t].reverse();
  }
  let s = _n(t, ease, mixer);
  let s_length = s.length;
  let l = (n) => {
    if (o && n < e[0]) {
      return t[0];
    }
    let r = 0;
    if (s_length > 1) {
      for (; r < e.length - 2 && !(n < e[r + 1]); r++);
    }
    let i = ce(e[r], e[r + 1], n);
    return s[r](i);
  };
  if (clamp) {
    return (t) => l(A(e[0], e[e_length - 1], t));
  }
  return l;
}
function yn(e, t) {
  let n = e[e.length - 1];
  for (let r = 1; r <= t; r++) {
    let i = ce(0, t, r);
    e.push(R(n, 1, i));
  }
}
function bn(keyframes) {
  let t = [0];
  yn(t, keyframes.length - 1);
  return t;
}
function xn(e, duration) {
  return e.map((e) => e * duration);
}
function Sn(keyframes, t) {
  return keyframes.map(() => t || easeInOut).splice(0, keyframes.length - 1);
}
function Cn({ duration = 300, keyframes, times, ease = `easeInOut` }) {
  let i = ke(ease) ? ease.map(Ne) : Ne(ease) || easeInOut;
  let a = {
    done: false,
    value: keyframes[0],
  };
  if (
    keyframes.length === 2 &&
    !Array.isArray(i) &&
    (!times || times.length !== 2 || (times[0] === 0 && times[1] === 1))
  ) {
    let [n, r] = keyframes;
    let o = n === r ? undefined : (re.mix || Qt)(n, r);
    return {
      calculatedDuration: duration,
      next: (t) => {
        a.value = o ? o(i(duration > 0 ? A(0, 1, t / duration) : 1)) : r;
        a.done = t >= duration;
        return a;
      },
    };
  }
  let o = vn(
    xn(
      times && times.length === keyframes.length ? times : bn(keyframes),
      duration,
    ),
    keyframes,
    {
      ease: Array.isArray(i) ? i : Sn(keyframes, i),
    },
  );
  return {
    calculatedDuration: duration,
    next: (t) => {
      a.value = o(t);
      a.done = t >= duration;
      return a;
    },
  };
}
const wn = 5;
function Tn(e, t, n) {
  let r = Math.max(t - wn, 0);
  return de(n - e(r), t - r);
}
function En(e, t, n = 0) {
  if (t <= 0) {
    return n;
  }
  if (e.velocity) {
    return e.velocity(t);
  }
  return Tn((t) => e.next(t).value, t, e.next(t).value);
}
const Dn = (e) => e !== null;
function On(e, { repeat, repeatType = `loop` }, r, i = 1) {
  let a = e.filter(Dn);
  let o =
    i < 0 || (repeat && repeatType !== `loop` && repeat % 2 == 1)
      ? 0
      : a.length - 1;
  if (!o || r === undefined) {
    return a[o];
  }
  return r;
}
const kn = {
  decay: gn,
  inertia: gn,
  tween: Cn,
  keyframes: Cn,
  spring,
};
function An(e) {
  if (typeof e.type == `string`) {
    e.type = kn[e.type];
  }
}
function jn(kind, animation) {
  return {
    kind,
    animation,
    timestamp: F.now(),
    frameTimestamp: state.timestamp,
    frameIsProcessing: state.isProcessing,
  };
}
function Mn(e, t, n) {
  let globalThis___MOTION_INSPECT__ = globalThis.__MOTION_INSPECT__;
  if (globalThis___MOTION_INSPECT__) {
    try {
      globalThis___MOTION_INSPECT__({
        ...jn(`animation-start`, e),
        options: n
          ? {
              ...t,
              ...n,
            }
          : t,
      });
    } catch {}
  }
}
function Nn(currentAnimation, node) {
  let globalThis___MOTION_INSPECT__ = globalThis.__MOTION_INSPECT__;
  if (globalThis___MOTION_INSPECT__) {
    try {
      globalThis___MOTION_INSPECT__({
        ...jn(`layout-animation-start`, currentAnimation),
        node,
      });
    } catch {}
  }
}
class Pn {
  constructor() {
    this.isResolved = false;
  }
  get finished() {
    this._finished ||= this.isResolved
      ? Promise.resolve()
      : new Promise((resolve) => {
          this._resolve = resolve;
        });
    return this._finished;
  }
  updateFinished() {
    this._finished = this._resolve = undefined;
    this.isResolved = false;
  }
  notifyFinished() {
    this.isResolved = true;
    this._resolve?.();
  }
  then(e, t) {
    return this.finished.then(e, t);
  }
}
const Fn = (e) => e / 100;
class In extends Pn {
  constructor(e) {
    super();
    this.state = `idle`;
    this.startTime = null;
    this.isStopped = false;
    this.currentTime = 0;
    this.holdTime = null;
    this.playbackSpeed = 1;
    this.delayState = {
      done: false,
      value: undefined,
    };
    this.stop = () => {
      let { motionValue } = this.options;
      if (motionValue && motionValue.updatedAt !== F.now()) {
        this.tick(F.now());
      }
      this.isStopped = true;
      if (this.state !== `idle`) {
        this.teardown();
        this.options.onStop?.();
      }
    };
    this.options = e;
    this.initAnimation();
    this.play();
    if (e.autoplay === false) {
      this.pause();
    }
    Mn(this, this.options);
  }
  initAnimation() {
    let { options } = this;
    An(options);
    let {
      type = Cn,
      repeat = 0,
      repeatDelay = 0,
      repeatType,
      velocity = 0,
    } = options;
    let { keyframes } = options;
    let s = type || Cn;
    if (s !== Cn && typeof keyframes[0] != `number`) {
      this.mixKeyframes = se(Fn, Qt(keyframes[0], keyframes[1]));
      keyframes = [0, 100];
    }
    let c = s(
      keyframes === options.keyframes
        ? options
        : {
            ...options,
            keyframes,
          },
    );
    if (repeatType === `mirror`) {
      this.mirroredGenerator = s({
        ...options,
        keyframes: [...keyframes].reverse(),
        velocity: -velocity,
      });
    }
    if (c.calculatedDuration === null) {
      c.calculatedDuration = nn(c);
    }
    let { calculatedDuration } = c;
    this.calculatedDuration = calculatedDuration;
    this.resolvedDuration = calculatedDuration + repeatDelay;
    this.totalDuration = this.resolvedDuration * (repeat + 1) - repeatDelay;
    this.generator = c;
  }
  updateTime(e) {
    let t = Math.round(e - this.startTime) * this.playbackSpeed;
    this.currentTime = this.holdTime === null ? t : this.holdTime;
  }
  tick(e, t = false) {
    let {
      generator,
      totalDuration,
      mixKeyframes,
      mirroredGenerator,
      resolvedDuration,
      calculatedDuration,
    } = this;
    if (this.startTime === null) {
      return generator.next(0);
    }
    let {
      delay = 0,
      keyframes,
      repeat,
      repeatType,
      repeatDelay,
      type,
      onUpdate,
      finalKeyframe,
    } = this.options;
    if (this.speed > 0) {
      this.startTime = Math.min(this.startTime, e);
    } else if (this.speed < 0) {
      this.startTime = Math.min(e - totalDuration / this.speed, this.startTime);
    }
    if (t) {
      this.currentTime = e;
    } else {
      this.updateTime(e);
    }
    let g = this.currentTime - delay * (this.playbackSpeed >= 0 ? 1 : -1);
    let _ = this.playbackSpeed >= 0 ? g < 0 : g > totalDuration;
    this.currentTime = Math.max(g, 0);
    if (this.state === `finished` && this.holdTime === null) {
      this.currentTime = totalDuration;
    }
    let currentTime = this.currentTime;
    let y = generator;
    if (repeat) {
      let e = Math.min(this.currentTime, totalDuration) / resolvedDuration;
      let t = Math.floor(e);
      let n = e % 1;
      if (!n && e >= 1) {
        n = 1;
      }
      n === 1 && t--;
      t = Math.min(t, repeat + 1);
      t % 2 &&
        (repeatType === `reverse`
          ? ((n = 1 - n), repeatDelay && (n -= repeatDelay / resolvedDuration))
          : repeatType === `mirror` && (y = mirroredGenerator));
      currentTime = A(0, 1, n) * resolvedDuration;
    }
    let b;
    if (_) {
      this.delayState.value = keyframes[0];
      b = this.delayState;
    } else {
      b = y.next(currentTime);
    }
    if (mixKeyframes && !_) {
      b.value = mixKeyframes(b.value);
    }
    let { done } = b;
    if (!_ && calculatedDuration !== null) {
      done =
        this.playbackSpeed >= 0
          ? this.currentTime >= totalDuration
          : this.currentTime <= 0;
    }
    let S =
      this.holdTime === null &&
      (this.state === `finished` || (this.state === `running` && done));
    if (S && type !== gn) {
      b.value = On(keyframes, this.options, finalKeyframe, this.speed);
    }
    if (onUpdate) {
      onUpdate(b.value);
    }
    if (S) {
      this.finish();
    }
    return b;
  }
  then(e, t) {
    return this.finished.then(e, t);
  }
  get duration() {
    return ue(this.calculatedDuration);
  }
  get iterationDuration() {
    let { delay = 0 } = this.options || {};
    return this.duration + ue(delay);
  }
  get time() {
    return ue(this.currentTime);
  }
  set time(e) {
    e = N(e);
    this.currentTime = e;
    if (
      this.startTime === null ||
      this.holdTime !== null ||
      this.playbackSpeed === 0
    ) {
      this.holdTime = e;
    } else if (this.driver) {
      this.startTime = this.driver.now() - e / this.playbackSpeed;
    }
    if (this.driver) {
      this.driver.start(false);
    } else {
      this.startTime = 0;
      this.state = `paused`;
      this.holdTime = e;
      this.tick(e);
    }
  }
  getGeneratorVelocity() {
    return En(this.generator, this.currentTime, this.options.velocity);
  }
  get speed() {
    return this.playbackSpeed;
  }
  set speed(e) {
    let t = this.playbackSpeed !== e;
    if (t && this.driver) {
      this.updateTime(F.now());
    }
    this.playbackSpeed = e;
    if (t && this.driver) {
      this.time = ue(this.currentTime);
    }
  }
  play() {
    if (this.isStopped) {
      return;
    }
    let { driver = $t, startTime } = this.options;
    this.driver ||= driver((e) => this.tick(e));
    this.options.onPlay?.();
    let n = this.driver.now();
    if (this.state === `finished`) {
      this.updateFinished();
      this.startTime = n;
    } else if (this.holdTime === null) {
      this.startTime ||= startTime ?? n;
    } else {
      this.startTime = n - this.holdTime;
    }
    if (this.state === `finished` && this.speed < 0) {
      this.startTime += this.calculatedDuration;
    }
    this.holdTime = null;
    this.state = `running`;
    this.driver.start();
  }
  pause() {
    this.state = `paused`;
    this.updateTime(F.now());
    this.holdTime = this.currentTime;
  }
  complete() {
    if (this.state !== `running`) {
      this.play();
    }
    this.state = `finished`;
    this.holdTime = null;
  }
  finish() {
    this.notifyFinished();
    this.teardown();
    this.state = `finished`;
    this.options.onComplete?.();
  }
  cancel() {
    this.holdTime = null;
    this.startTime = 0;
    this.tick(0);
    this.teardown();
    this.options.onCancel?.();
  }
  teardown() {
    this.state = `idle`;
    this.stopDriver();
    this.startTime = this.holdTime = null;
  }
  stopDriver() {
    this.driver &&= (this.driver.stop(), undefined);
  }
  sample(e) {
    this.startTime = 0;
    return this.tick(e, true);
  }
  attachTimeline(e) {
    if (this.options.allowFlatten) {
      this.options.type = `keyframes`;
      this.options.ease = `linear`;
      this.initAnimation();
    }
    this.driver?.stop();
    return e.observe(this);
  }
}
const Ln = new Set([`brightness`, `contrast`, `saturate`, `opacity`]);
function Rn(e) {
  let [t, n] = e.slice(0, -1).split(`(`);
  if (t === `drop-shadow`) {
    return e;
  }
  let [r] = n.match($e) || [];
  if (!r) {
    return e;
  }
  let i = n.replace(r, ``);
  let a = +!!Ln.has(t);
  if (r !== n) {
    a *= 100;
  }
  return t + `(` + a + i + `)`;
}
const zn = /\b([a-z-]*)\(.*?\)/gu;
const Bn = {
  ...Pt,
  getAnimatableNone: (e) => {
    let t = e.match(zn);
    if (t) {
      return t.map(Rn).join(` `);
    }
    return e;
  },
};
const Vn = {
  ...Pt,
  getAnimatableNone: (e) => {
    let t = Pt.parse(e);
    return Pt.createTransformer(e)(
      t.map((e) => {
        if (typeof e == `number`) {
          return 0;
        }
        if (typeof e == `object`) {
          return {
            ...e,
            alpha: 1,
          };
        }
        return e;
      }),
    );
  },
};
const Hn = {
  ...Xe,
  transform: Math.round,
};
const Un = {
  borderWidth: I,
  borderTopWidth: I,
  borderRightWidth: I,
  borderBottomWidth: I,
  borderLeftWidth: I,
  borderRadius: I,
  borderTopLeftRadius: I,
  borderTopRightRadius: I,
  borderBottomRightRadius: I,
  borderBottomLeftRadius: I,
  width: I,
  maxWidth: I,
  height: I,
  maxHeight: I,
  top: I,
  right: I,
  bottom: I,
  left: I,
  inset: I,
  insetBlock: I,
  insetBlockStart: I,
  insetBlockEnd: I,
  insetInline: I,
  insetInlineStart: I,
  insetInlineEnd: I,
  padding: I,
  paddingTop: I,
  paddingRight: I,
  paddingBottom: I,
  paddingLeft: I,
  paddingBlock: I,
  paddingBlockStart: I,
  paddingBlockEnd: I,
  paddingInline: I,
  paddingInlineStart: I,
  paddingInlineEnd: I,
  margin: I,
  marginTop: I,
  marginRight: I,
  marginBottom: I,
  marginLeft: I,
  marginBlock: I,
  marginBlockStart: I,
  marginBlockEnd: I,
  marginInline: I,
  marginInlineStart: I,
  marginInlineEnd: I,
  fontSize: I,
  backgroundPositionX: I,
  backgroundPositionY: I,
  rotate: ut,
  pathRotation: ut,
  rotateX: ut,
  rotateY: ut,
  rotateZ: ut,
  scale: Qe,
  scaleX: Qe,
  scaleY: Qe,
  scaleZ: Qe,
  skew: ut,
  skewX: ut,
  skewY: ut,
  distance: I,
  translateX: I,
  translateY: I,
  translateZ: I,
  x: I,
  y: I,
  z: I,
  perspective: I,
  transformPerspective: I,
  opacity: Ze,
  originX: mt,
  originY: mt,
  originZ: I,
  zIndex: Hn,
  fillOpacity: Ze,
  strokeOpacity: Ze,
  numOctaves: Hn,
};
const Wn = {
  ...Un,
  color: gt,
  backgroundColor: gt,
  outlineColor: gt,
  fill: gt,
  stroke: gt,
  borderColor: gt,
  borderTopColor: gt,
  borderRightColor: gt,
  borderBottomColor: gt,
  borderLeftColor: gt,
  filter: Bn,
  WebkitFilter: Bn,
  mask: Vn,
  WebkitMask: Vn,
};
const Gn = (e) => Wn[e];
const Kn = new Set([Bn, Vn]);
function qn(e, t) {
  let n = Gn(e);
  if (!Kn.has(n)) {
    n = Pt;
  }
  if (n.getAnimatableNone) {
    return n.getAnimatableNone(t);
  }
}
function Jn(unresolvedKeyframes) {
  for (let t = 1; t < unresolvedKeyframes.length; t++) {
    unresolvedKeyframes[t] ??
      (unresolvedKeyframes[t] = unresolvedKeyframes[t - 1]);
  }
}
const Yn = (e) => (e * 180) / Math.PI;
const Xn = (e) => Qn(Yn(Math.atan2(e[1], e[0])));
const Zn = {
  x: 4,
  y: 5,
  translateX: 4,
  translateY: 5,
  scaleX: 0,
  scaleY: 3,
  scale: (e) => (Math.abs(e[0]) + Math.abs(e[3])) / 2,
  rotate: Xn,
  rotateZ: Xn,
  skewX: (e) => Yn(Math.atan(e[1])),
  skewY: (e) => Yn(Math.atan(e[2])),
  skew: (e) => (Math.abs(e[1]) + Math.abs(e[2])) / 2,
};
var Qn = (e) => {
  e %= 360;
  if (e < 0) {
    e += 360;
  }
  return e;
};
const $n = Xn;
const scaleX = (e) => Math.sqrt(e[0] * e[0] + e[1] * e[1]);
const scaleY = (e) => Math.sqrt(e[4] * e[4] + e[5] * e[5]);
const nr = {
  x: 12,
  y: 13,
  z: 14,
  translateX: 12,
  translateY: 13,
  translateZ: 14,
  scaleX,
  scaleY,
  scale: (e) => (scaleX(e) + scaleY(e)) / 2,
  rotateX: (e) => Qn(Yn(Math.atan2(e[6], e[5]))),
  rotateY: (e) => Qn(Yn(Math.atan2(-e[2], e[0]))),
  rotateZ: $n,
  rotate: $n,
  skewX: (e) => Yn(Math.atan(e[4])),
  skewY: (e) => Yn(Math.atan(e[1])),
  skew: (e) => (Math.abs(e[1]) + Math.abs(e[4])) / 2,
};
function rr(e) {
  return +!!e.includes(`scale`);
}
function ir(transform, t) {
  if (!transform || transform === `none`) {
    return rr(t);
  }
  let n = transform.match(/^matrix3d\(([-\d.e\s,]+)\)$/u);
  let r;
  let i;
  if (n) {
    r = nr;
    i = n;
  } else {
    let t = transform.match(/^matrix\(([-\d.e\s,]+)\)$/u);
    r = Zn;
    i = t;
  }
  if (!i) {
    return rr(t);
  }
  let a = r[t];
  let o = i[1].split(`,`).map(or);
  if (typeof a == `function`) {
    return a(o);
  }
  return o[a];
}
const ar = (e, t) => {
  let { transform = `none` } = getComputedStyle(e);
  return ir(transform, t);
};
function or(e) {
  return parseFloat(e.trim());
}
const sr = [
  `transformPerspective`,
  `x`,
  `y`,
  `z`,
  `translateX`,
  `translateY`,
  `translateZ`,
  `scale`,
  `scaleX`,
  `scaleY`,
  `rotate`,
  `rotateX`,
  `rotateY`,
  `rotateZ`,
  `skew`,
  `skewX`,
  `skewY`,
];
const cr = new Set([...sr, `pathRotation`]);
const lr = (e) => e === Xe || e === I;
const ur = new Set([`x`, `y`, `z`]);
const dr = sr.filter((e) => !ur.has(e));
function fr(e) {
  let t = [];
  dr.forEach((n) => {
    let r = e.getValue(n);
    if (r !== undefined) {
      let e = r.get();
      let i = +!!n.startsWith(`scale`);
      if (e === i) {
        return;
      }
      t.push([n, e]);
      r.set(i);
    }
  });
  return t;
}
const pr = new Set([`bottom`, `right`]);
function mr(e, t, n, r, i, boxSizing) {
  let o = parseFloat(e);
  if (!isNaN(o)) {
    return o;
  }
  let { min, max } = t()[n];
  let l = max - min;
  if (boxSizing === `border-box`) {
    return l;
  }
  return l - parseFloat(r) - parseFloat(i);
}
const hr = {
  width: ({ width, paddingLeft = `0`, paddingRight = `0`, boxSizing }, i) =>
    mr(width, i, `x`, paddingLeft, paddingRight, boxSizing),
  height: ({ height, paddingTop = `0`, paddingBottom = `0`, boxSizing }, i) =>
    mr(height, i, `y`, paddingTop, paddingBottom, boxSizing),
  top: ({ top }) => parseFloat(top),
  left: ({ left }) => parseFloat(left),
  bottom: ({ top }, t) => {
    let { y } = t();
    return parseFloat(top) + (y.max - y.min);
  },
  right: ({ left }, t) => {
    let { x } = t();
    return parseFloat(left) + (x.max - x.min);
  },
  x: ({ transform }) => ir(transform, `x`),
  y: ({ transform }) => ir(transform, `y`),
};
hr.translateX = hr.x;
hr.translateY = hr.y;
const gr = new Set();
let _r = false;
let vr = false;
let yr = false;
function br() {
  if (vr) {
    let e = [];
    let t = new Set();
    let n = new Set();
    gr.forEach((r) => {
      if (r.needsMeasurement) {
        e.push(r);
        t.add(r.element);
        if (pr.has(r.name)) {
          n.add(r.element);
        }
      }
    });
    let r = new Map();
    n.forEach((e) => {
      let t = fr(e);
      if (t.length) {
        r.set(e, t);
        e.render();
      }
    });
    e.forEach((e) => e.measureInitialState());
    t.forEach((e) => {
      e.render();
      let t = r.get(e);
      if (t) {
        t.forEach(([t, n]) => {
          e.getValue(t)?.set(n);
        });
      }
    });
    e.forEach((e) => e.measureEndState());
    e.forEach((e) => {
      if (e.suspendedScrollY !== undefined) {
        window.scrollTo(0, e.suspendedScrollY);
      }
    });
  }
  vr = false;
  _r = false;
  gr.forEach((e) => e.complete(yr));
  gr.clear();
}
function xr() {
  gr.forEach((e) => {
    e.readKeyframes();
    if (e.needsMeasurement) {
      vr = true;
    }
  });
}
function Sr() {
  yr = true;
  xr();
  br();
  yr = false;
}
function Cr(e, name, n) {
  if (typeof e == `string`) {
    if (j(e) || ae(e)) {
      return parseFloat(e);
    }
    if (!Pt.test(e) && Pt.test(n)) {
      return qn(name, n);
    }
  }
  return e ?? undefined;
}
class wr {
  constructor(e, t, n, r, i, a = false) {
    this.state = `pending`;
    this.isAsync = false;
    this.needsMeasurement = false;
    this.unresolvedKeyframes = [...e];
    this.onComplete = t;
    this.name = n;
    this.motionValue = r;
    this.element = i;
    this.isAsync = a;
  }
  scheduleResolve() {
    this.state = `scheduled`;
    if (this.isAsync) {
      gr.add(this);
      if (!_r) {
        _r = true;
        schedule.read(xr);
        schedule.resolveKeyframes(br);
      }
    } else {
      this.readKeyframes();
      this.complete();
    }
  }
  readKeyframes() {
    let { unresolvedKeyframes, name, element, motionValue } = this;
    if (unresolvedKeyframes[0] === null) {
      let i = motionValue?.get();
      let a = unresolvedKeyframes[unresolvedKeyframes.length - 1];
      if (i !== undefined) {
        unresolvedKeyframes[0] = i;
      } else if (element && name) {
        let r = Cr(element.readValue(name, a), name, a);
        if (r !== undefined) {
          unresolvedKeyframes[0] = r;
        }
      }
      if (unresolvedKeyframes[0] === undefined) {
        unresolvedKeyframes[0] = a;
      }
      if (motionValue && i === undefined) {
        motionValue.set(unresolvedKeyframes[0]);
      }
    }
    Jn(unresolvedKeyframes);
  }
  setFinalKeyframe() {}
  measureInitialState() {}
  renderEndStyles() {}
  measureEndState() {}
  complete(e = false) {
    this.state = `complete`;
    this.onComplete(this.unresolvedKeyframes, this.finalKeyframe, e);
    gr.delete(this);
  }
  cancel() {
    if (this.state === `scheduled`) {
      gr.delete(this);
      this.state = `pending`;
    }
  }
  resume() {
    if (this.state === `pending`) {
      this.scheduleResolve();
    }
  }
}
const Tr = (e) => e.startsWith(`--`);
function Er(element, name, n) {
  if (Tr(name)) {
    element.style.setProperty(name, n);
  } else {
    element.style[name] = n;
  }
}
const Dr = {};
function Or(e, t) {
  let n = oe(e);
  return () => Dr[t] ?? n();
}
const kr = Or(() => window.ScrollTimeline !== undefined, `scrollTimeline`);
const Ar = Or(() => {
  try {
    document.createElement(`div`).animate(
      {
        opacity: 0,
      },
      {
        easing: `linear(0, 1)`,
      },
    );
  } catch {
    return false;
  }
  return true;
}, `linearEasing`);
const jr = ([e, t, n, r]) => `cubic-bezier(${e}, ${t}, ${n}, ${r})`;
const Mr = {
  linear: `linear`,
  ease: `ease`,
  easeIn: `ease-in`,
  easeOut: `ease-out`,
  easeInOut: `ease-in-out`,
  circIn: jr([0, 0.65, 0.55, 1]),
  circOut: jr([0.55, 0, 1, 0.45]),
  backIn: jr([0.31, 0.01, 0.66, -0.59]),
  backOut: jr([0.33, 1.53, 0.69, 0.99]),
};
function Nr(e, t) {
  if (e) {
    if (typeof e == `function`) {
      if (Ar()) {
        return en(e, t);
      }
      return `ease-out`;
    }
    if (Ae(e)) {
      return jr(e);
    }
    if (Array.isArray(e)) {
      return e.map((e) => Nr(e, t) || Mr.easeOut);
    }
    return Mr[e];
  }
}
function Pr(
  element,
  name,
  keyframes,
  {
    delay = 0,
    duration = 300,
    repeat = 0,
    repeatType = `loop`,
    ease = `easeOut`,
    times,
  } = {},
  l = undefined,
) {
  let u = {
    [name]: keyframes,
  };
  if (times) {
    u.offset = times;
  }
  let d = Nr(ease, duration);
  if (Array.isArray(d)) {
    u.easing = d;
  }
  let f = {
    delay,
    duration,
    easing: Array.isArray(d) ? `linear` : d,
    fill: `both`,
    iterations: repeat + 1,
    direction: repeatType === `reverse` ? `alternate` : `normal`,
  };
  if (l) {
    f.pseudoElement = l;
  }
  return element.animate(u, f);
}
function Fr(e) {
  return typeof e == `function` && `applyToOptions` in e;
}
function Ir({ type, ...rest }) {
  if (Fr(type) && Ar()) {
    return type.applyToOptions(rest);
  }
  return ((rest.duration ??= 300), (rest.ease ??= `easeOut`), rest);
}
class Lr extends Pn {
  constructor(e) {
    super();
    this.finishedTime = null;
    this.isStopped = false;
    this.manualStartTime = null;
    if (!e) {
      return;
    }
    let {
      element,
      name,
      keyframes,
      pseudoElement,
      allowFlatten = false,
      finalKeyframe,
      onComplete,
    } = e;
    this.isPseudoElement = !!pseudoElement;
    this.allowFlatten = allowFlatten;
    this.options = e;
    e.type;
    let c = Ir(e);
    this.animation = Pr(element, name, keyframes, c, pseudoElement);
    if (c.autoplay === false) {
      this.animation.pause();
    }
    this.animation.onfinish = () => {
      this.finishedTime = this.time;
      if (!pseudoElement) {
        let e = On(keyframes, this.options, finalKeyframe, this.speed);
        if (this.updateMotionValue) {
          this.updateMotionValue(e);
        }
        Er(element, name, e);
        this.animation.cancel();
      }
      onComplete?.();
      this.notifyFinished();
    };
    Mn(this, e, c);
  }
  play() {
    if (!this.isStopped) {
      this.manualStartTime = null;
      this.animation.play();
      if (this.state === `finished`) {
        this.updateFinished();
      }
    }
  }
  pause() {
    this.animation.pause();
  }
  complete() {
    this.animation.finish?.();
  }
  cancel() {
    try {
      this.animation.cancel();
    } catch {}
  }
  stop() {
    if (this.isStopped) {
      return;
    }
    this.isStopped = true;
    let { state } = this;
    state !== `idle` &&
      state !== `finished` &&
      (this.updateMotionValue ? this.updateMotionValue() : this.commitStyles(),
      this.isPseudoElement || this.cancel());
  }
  commitStyles() {
    let e = this.options?.element;
    !this.isPseudoElement && e?.isConnected && this.animation.commitStyles?.();
  }
  get duration() {
    let e = this.animation.effect?.getComputedTiming?.().duration || 0;
    return ue(Number(e));
  }
  get iterationDuration() {
    let { delay = 0 } = this.options || {};
    return this.duration + ue(delay);
  }
  get time() {
    return ue(Number(this.animation.currentTime) || 0);
  }
  set time(e) {
    let t = this.finishedTime !== null;
    this.manualStartTime = null;
    this.finishedTime = null;
    this.animation.currentTime = N(e);
    if (t) {
      this.animation.pause();
    }
  }
  get speed() {
    return this.animation.playbackRate;
  }
  set speed(e) {
    if (e < 0) {
      this.finishedTime = null;
    }
    this.animation.playbackRate = e;
  }
  get state() {
    if (this.finishedTime === null) {
      return this.animation.playState;
    }
    return `finished`;
  }
  get startTime() {
    return this.manualStartTime ?? Number(this.animation.startTime);
  }
  set startTime(e) {
    this.manualStartTime = this.animation.startTime = e;
  }
  attachTimeline({ timeline, rangeStart, rangeEnd, observe }) {
    this.allowFlatten &&
      this.animation.effect?.updateTiming({
        easing: `linear`,
      });
    this.animation.onfinish = null;
    if (timeline && kr()) {
      return (
        (this.animation.timeline = timeline),
        rangeStart && (this.animation.rangeStart = rangeStart),
        rangeEnd && (this.animation.rangeEnd = rangeEnd),
        linear
      );
    }
    return observe(this);
  }
}
const Rr = {
  anticipate,
  backInOut,
  circInOut,
};
function zr(ease) {
  return ease in Rr;
}
function Br(e) {
  if (typeof e.ease == `string` && zr(e.ease)) {
    e.ease = Rr[e.ease];
  }
}
const Vr = 10;
class Hr extends Lr {
  constructor(e) {
    Br(e);
    An(e);
    super(e);
    if (e.startTime !== undefined && e.autoplay !== false) {
      this.startTime = e.startTime;
    }
    this.options = e;
  }
  updateMotionValue(e) {
    let { motionValue, onUpdate, onComplete, element, ...rest } = this.options;
    if (!motionValue) {
      return;
    }
    if (e !== undefined) {
      motionValue.set(e);
      return;
    }
    let o = new In({
      ...rest,
      autoplay: false,
    });
    let s = Math.max(Vr, F.now() - this.startTime);
    let c = A(0, Vr, s - Vr);
    let value = o.sample(s).value;
    let { name } = this.options;
    if (element && name) {
      Er(element, name, value);
    }
    motionValue.setWithVelocity(o.sample(Math.max(0, s - c)).value, value, c);
    o.stop();
  }
}
const Ur = (e, t) =>
  t !== `zIndex` &&
  !!(
    typeof e == `number` ||
    Array.isArray(e) ||
    (typeof e == `string` && (Pt.test(e) || e === `0`) && !e.startsWith(`url(`))
  );
function Wr(e) {
  let t = e[0];
  if (e.length === 1) {
    return true;
  }
  for (let n = 0; n < e.length; n++) {
    if (e[n] !== t) {
      return true;
    }
  }
}
function Gr(e, name, type, velocity) {
  let i = e[0];
  if (i === null) {
    return false;
  }
  if (name === `display` || name === `visibility`) {
    return true;
  }
  let a = e[e.length - 1];
  let o = Ur(i, name);
  let s = Ur(a, name);
  if (!o || !s) {
    return (o !== s && `${name}${i}${a}${o ? a : i}`, false);
  }
  return Wr(e) || ((type === `spring` || Fr(type)) && velocity);
}
function Kr(e) {
  e.duration = 0;
  e.type = `keyframes`;
}
const qr = new Set([
  `opacity`,
  `clipPath`,
  `filter`,
  `transform`,
  `backgroundColor`,
]);
const Jr = /^(?:oklch|oklab|lab|lch|color|color-mix|light-dark)\(/;
function Yr(keyframes) {
  for (let t = 0; t < keyframes.length; t++) {
    if (typeof keyframes[t] == `string` && Jr.test(keyframes[t])) {
      return true;
    }
  }
  return false;
}
const Xr = new Set([
  `color`,
  `backgroundColor`,
  `outlineColor`,
  `fill`,
  `stroke`,
  `borderColor`,
  `borderTopColor`,
  `borderRightColor`,
  `borderBottomColor`,
  `borderLeftColor`,
]);
const Zr = oe(() => Object.hasOwnProperty.call(Element.prototype, `animate`));
function Qr({
  motionValue,
  name,
  repeatDelay,
  repeatType,
  damping,
  type,
  keyframes,
}) {
  if (!name || !(qr.has(name) || Xr.has(name))) {
    return false;
  }
  let c = motionValue?.owner?.current;
  if (!(c instanceof HTMLElement) && !(c instanceof SVGElement)) {
    return false;
  }
  let { onUpdate, transformTemplate } = motionValue.owner.getProps();
  return (
    Zr() &&
    (qr.has(name) || (Xr.has(name) && Yr(keyframes))) &&
    (name !== `transform` || !transformTemplate) &&
    !onUpdate &&
    !repeatDelay &&
    repeatType !== `mirror` &&
    damping !== 0 &&
    type !== `inertia`
  );
}
const $r = 40;
class ei extends Pn {
  constructor(e) {
    super();
    this.stop = () => {
      if (this._animation) {
        this._animation.stop();
        this.stopTimeline?.();
      }
      this.keyframeResolver?.cancel();
    };
    this.createdAt = F.now();
    let { keyframes, name, motionValue, element } = e;
    let a = e;
    a.autoplay ??= true;
    a.delay ??= 0;
    a.type ??= `keyframes`;
    a.repeat ??= 0;
    a.repeatDelay ??= 0;
    a.repeatType ??= `loop`;
    let o = element?.KeyframeResolver || wr;
    this.keyframeResolver = new o(
      keyframes,
      (e, t, n) => this.onKeyframesResolved(e, t, a, !n),
      name,
      motionValue,
      element,
    );
    this.keyframeResolver?.scheduleResolve();
  }
  onKeyframesResolved(e, t, n, r) {
    this.keyframeResolver = undefined;
    let { name, type, velocity, delay, isHandoff, onUpdate } = n;
    this.resolvedAt = F.now();
    let u = true;
    if (!Gr(e, name, type, velocity)) {
      u = false;
      (re.instantAnimations || !delay) && onUpdate?.(On(e, n, t));
      e[0] = e[e.length - 1];
      Kr(n);
      n.repeat = 0;
    }
    let d = r
      ? this.resolvedAt && this.resolvedAt - this.createdAt > $r
        ? this.resolvedAt
        : this.createdAt
      : undefined;
    let { onComplete } = n;
    n.startTime ??= d;
    n.finalKeyframe = t;
    n.keyframes = e;
    n.onComplete = () => {
      onComplete?.();
      this.notifyFinished();
    };
    let p = u && !isHandoff && Qr(n);
    let m;
    if (p) {
      n.element = n.motionValue?.owner?.current;
      try {
        m = new Hr(n);
      } catch {
        m = new In(n);
      }
    } else {
      m = new In(n);
    }
    this.pendingTimeline &&=
      ((this.stopTimeline = m.attachTimeline(this.pendingTimeline)), undefined);
    this._animation = m;
  }
  get finished() {
    if (this._animation) {
      return this._animation.finished;
    }
    return super.finished;
  }
  then(e, t) {
    return this.finished.finally(e).then(() => {});
  }
  get animation() {
    if (!this._animation) {
      this.keyframeResolver?.resume();
      Sr();
    }
    return this._animation;
  }
  get duration() {
    return this.animation.duration;
  }
  get iterationDuration() {
    return this.animation.iterationDuration;
  }
  get time() {
    return this.animation.time;
  }
  set time(e) {
    this.animation.time = e;
  }
  get speed() {
    return this.animation.speed;
  }
  get state() {
    return this.animation.state;
  }
  set speed(e) {
    this.animation.speed = e;
  }
  get startTime() {
    return this.animation.startTime;
  }
  attachTimeline(e) {
    if (this._animation) {
      this.stopTimeline = this.animation.attachTimeline(e);
    } else {
      this.pendingTimeline = e;
    }
    return () => this.stop();
  }
  play() {
    this.animation.play();
  }
  pause() {
    this.animation.pause();
  }
  complete() {
    this.animation.complete();
  }
  cancel() {
    if (this._animation) {
      this.animation.cancel();
    }
    this.keyframeResolver?.cancel();
  }
}
function ti(e, t, n, r = 0, i = 1) {
  let a = Array.from(e)
    .sort((e, t) => e.sortNodePosition(t))
    .indexOf(t);
  let e_size = e.size;
  let s = (e_size - 1) * r;
  if (typeof n == `function`) {
    return n(a, e_size);
  }
  if (i === 1) {
    return a * r;
  }
  return s - a * r;
}
const ni = 30;
const ri = (e) => !isNaN(parseFloat(e));
const ii = {
  current: undefined,
};
class ai {
  constructor(e, t = {}) {
    this.canTrackVelocity = null;
    this.events = {};
    this.updateAndNotify = (e) => {
      let t = F.now();
      if (this.updatedAt !== t) {
        this.setPrevFrameValue();
      }
      this.prev = this.current;
      this.setCurrent(e);
      if (
        this.current !== this.prev &&
        (this.notifyChange(), this.dependents)
      ) {
        for (let e of this.dependents) {
          e.dirty();
        }
      }
    };
    this.hasAnimated = false;
    this.setCurrent(e);
    this.owner = t.owner;
  }
  setCurrent(e) {
    this.current = e;
    this.updatedAt = F.now();
    if (this.canTrackVelocity === null && e !== undefined) {
      this.canTrackVelocity = ri(this.current);
    }
  }
  setPrevFrameValue(e = this.current) {
    this.prevFrameValue = e;
    this.prevUpdatedAt = this.updatedAt;
  }
  onChange(e) {
    return this.on(`change`, e);
  }
  on(e, t) {
    let n;
    if (e === `change`) {
      return this.onChangeSubscribe(t);
    }
    return ((n = this.events)[e] || (n[e] = new le())).add(t);
  }
  onChangeSubscribe(e) {
    let { events } = this;
    if (!events.change && !this.changeSubscriber) {
      this.changeSubscriber = e;
    } else {
      if (!events.change) {
        events.change = new le();
        events.change.add(this.changeSubscriber);
        this.changeSubscriber = undefined;
      }
      events.change.add(e);
    }
    return () => {
      if (this.changeSubscriber === e) {
        this.changeSubscriber = undefined;
      } else {
        events.change?.remove(e);
      }
      this.stopIfUnobserved();
    };
  }
  stopIfUnobserved() {
    schedule.read(() => {
      if (!this.changeSubscriber && !this.events.change?.getSize()) {
        this.stop();
      }
    });
  }
  clearListeners() {
    this.changeSubscriber = undefined;
    for (let e in this.events) {
      this.events[e].clear();
    }
  }
  attach(e, t) {
    this.passiveEffect = e;
    this.stopPassiveEffect = t;
  }
  set(e) {
    if (this.passiveEffect) {
      this.passiveEffect(e, this.updateAndNotify);
    } else {
      this.updateAndNotify(e);
    }
  }
  setWithVelocity(e, t, n) {
    this.set(t);
    this.prev = undefined;
    this.prevFrameValue = e;
    this.prevUpdatedAt = this.updatedAt - n;
  }
  jump(e, t = true) {
    this.updateAndNotify(e);
    this.prev = e;
    this.prevUpdatedAt = this.prevFrameValue = undefined;
    if (t) {
      this.stop();
    }
    if (this.stopPassiveEffect) {
      this.stopPassiveEffect();
    }
  }
  dirty() {
    this.notifyChange();
  }
  notifyChange() {
    let { current, changeSubscriber } = this;
    if (changeSubscriber) {
      changeSubscriber(current);
    } else {
      this.events.change?.notify(current);
    }
  }
  addDependent(e) {
    this.dependents ||= new Set();
    this.dependents.add(e);
  }
  removeDependent(e) {
    if (this.dependents) {
      this.dependents.delete(e);
    }
  }
  get() {
    if (ii.current) {
      ii.current.push(this);
    }
    return this.current;
  }
  getPrevious() {
    return this.prev;
  }
  getVelocity() {
    let e = F.now();
    if (
      !this.canTrackVelocity ||
      this.prevFrameValue === undefined ||
      e - this.updatedAt > ni
    ) {
      return 0;
    }
    let t = Math.min(this.updatedAt - this.prevUpdatedAt, ni);
    return de(parseFloat(this.current) - parseFloat(this.prevFrameValue), t);
  }
  start(e) {
    this.stop();
    return new Promise((resolve) => {
      this.hasAnimated = true;
      let n = false;
      let r;
      r = e(() => {
        n = true;
        this.events.animationComplete?.notify();
        if (this.animation === r) {
          this.clearAnimation();
        }
        resolve();
      });
      if (!n) {
        this.animation = r;
      }
      this.events.animationStart?.notify();
    });
  }
  stop() {
    if (this.animation) {
      this.animation.stop();
      if (this.events.animationCancel) {
        this.events.animationCancel.notify();
      }
    }
    this.clearAnimation();
  }
  isAnimating() {
    return !!this.animation;
  }
  clearAnimation() {
    this.animation = undefined;
  }
  destroy() {
    this.dependents?.clear();
    this.events.destroy?.notify();
    this.clearListeners();
    this.stop();
    if (this.stopPassiveEffect) {
      this.stopPassiveEffect();
    }
  }
}
function oi(e, t) {
  return new ai(e, t);
}
function si(e, t) {
  if (e?.inherit && t) {
    let { inherit, ...rest } = e;
    return {
      ...t,
      ...rest,
    };
  }
  return e;
}
function V(e, t) {
  let n = e?.[t] ?? e?.default ?? e;
  if (n === e) {
    return n;
  }
  return si(n, e);
}
const ci = {
  type: `spring`,
  stiffness: 500,
  damping: 25,
  restSpeed: 10,
};
const li = (e) => ({
  type: `spring`,
  stiffness: 550,
  damping: e === 0 ? 2 * Math.sqrt(550) : 30,
  restSpeed: 10,
});
const ui = {
  type: `keyframes`,
  duration: 0.8,
};
const di = {
  type: `keyframes`,
  ease: [0.25, 0.1, 0.35, 1],
  duration: 0.3,
};
const fi = (e, { keyframes }) => {
  if (keyframes.length > 2) {
    return ui;
  }
  if (cr.has(e)) {
    if (e.startsWith(`scale`)) {
      return li(keyframes[1]);
    }
    return ci;
  }
  return di;
};
const pi = new Set([
  `when`,
  `delay`,
  `delayChildren`,
  `staggerChildren`,
  `staggerDirection`,
  `repeat`,
  `repeatType`,
  `repeatDelay`,
  `from`,
  `elapsed`,
]);
function mi(e) {
  for (let t in e) {
    if (!pi.has(t)) {
      return true;
    }
  }
  return false;
}
const hi =
  (e, motionValue, n, r = {}, i, a) =>
  (o) => {
    let s = V(r, e) || {};
    let c = s.delay || r.delay || 0;
    let { elapsed = 0 } = r;
    elapsed -= N(c);
    let u = {
      keyframes: Array.isArray(n) ? n : [null, n],
      ease: `easeOut`,
      velocity: motionValue.getVelocity(),
      ...s,
      delay: -elapsed,
      onUpdate: (e) => {
        motionValue.set(e);
        if (s.onUpdate) {
          s.onUpdate(e);
        }
      },
      onComplete: () => {
        o();
        if (s.onComplete) {
          s.onComplete();
        }
      },
      name: e,
      motionValue,
      element: a ? undefined : i,
    };
    if (!mi(s)) {
      Object.assign(u, fi(e, u));
    }
    u.duration &&= N(u.duration);
    u.repeatDelay &&= N(u.repeatDelay);
    if (u.from !== undefined) {
      u.keyframes[0] = u.from;
    }
    let d = false;
    if (u.type === false || (u.duration === 0 && !u.repeatDelay)) {
      Kr(u);
      if (u.delay === 0) {
        d = true;
      }
    }
    if (
      re.instantAnimations ||
      re.skipAnimations ||
      i?.shouldSkipAnimations ||
      s.skipAnimations
    ) {
      d = true;
      Kr(u);
      u.delay = 0;
    }
    u.allowFlatten = !s.type && !s.ease;
    if (d && !a && motionValue.get() !== undefined) {
      let e = On(u.keyframes, s);
      if (e !== undefined) {
        schedule.update(() => {
          u.onUpdate(e);
          u.onComplete();
        });
        return;
      }
    }
    if (s.isSync) {
      return new In(u);
    }
    return new ei(u);
  };
const gi = /^var\(--(?:([\w-]+)|([\w-]+), ?([a-zA-Z\d ()%#.,-]+))\)/u;
function _i(e) {
  let t = gi.exec(e);
  if (!t) {
    return [,];
  }
  let [, n, r, i] = t;
  return [`--${n ?? r}`, i];
}
function vi(e, t, n = 1) {
  `${e}`;
  let [r, i] = _i(e);
  if (!r) {
    return;
  }
  let a = window.getComputedStyle(t).getPropertyValue(r);
  if (a) {
    let e = a.trim();
    if (j(e)) {
      return parseFloat(e);
    }
    return e;
  }
  if (qe(i)) {
    return vi(i, t, n + 1);
  }
  return i;
}
function yi(e) {
  let t = [{}, {}];
  e?.values.forEach((e, n) => {
    t[0][n] = e.get();
    t[1][n] = e.getVelocity();
  });
  return t;
}
function bi(e, t, n, r) {
  if (typeof t == `function`) {
    let [i, a] = yi(r);
    t = t(n === undefined ? e.custom : n, i, a);
  }
  if (typeof t == `string`) {
    t = e.variants && e.variants[t];
  }
  if (typeof t == `function`) {
    let [i, a] = yi(r);
    t = t(n === undefined ? e.custom : n, i, a);
  }
  return t;
}
function xi(e, t, n) {
  let r = e.getProps();
  return bi(r, t, n === undefined ? r.custom : n, e);
}
const Si = new Set([
  `width`,
  `height`,
  `top`,
  `left`,
  `right`,
  `bottom`,
  ...sr,
]);
const Ci = (e) => Array.isArray(e);
function wi(e, t, n) {
  if (e.hasValue(t)) {
    e.getValue(t).set(n);
  } else {
    e.addValue(t, oi(n));
  }
}
function Ti(e) {
  if (Ci(e)) {
    return e[e.length - 1] || 0;
  }
  return e;
}
function Ei(e, t) {
  let { transitionEnd = {}, transition = {}, ...rest } = xi(e, t) || {};
  rest = {
    ...rest,
    ...transitionEnd,
  };
  for (let t in rest) {
    wi(e, t, Ti(rest[t]));
  }
}
const Di = (e) => !!(e && e.getVelocity);
function Oi(e) {
  return !!(Di(e) && e.add);
}
function ki(e, t) {
  let n = e.getValue(`willChange`);
  if (Oi(n)) {
    return n.add(t);
  }
  if (!n && re.WillChange) {
    let n = new re.WillChange(`auto`);
    e.addValue(`willChange`, n);
    n.add(t);
  }
}
function Ai(e) {
  return e.replace(/([A-Z])/g, (e) => `-${e.toLowerCase()}`);
}
const ji = `data-` + Ai(`framerAppearId`);
function Mi(e) {
  return e.props[ji];
}
const Ni = typeof window < `u`;
function Pi({ protectedKeys, needsAnimating }, n) {
  let r = protectedKeys.hasOwnProperty(n) && needsAnimating[n] !== true;
  needsAnimating[n] = false;
  return r;
}
function Fi(
  e,
  { transition, transitionEnd, ...rest },
  { delay = 0, transitionOverride, type } = {},
) {
  let c = e.getDefaultTransition();
  transition = transition ? si(transition, c) : c;
  let l = transition?.reduceMotion;
  let u = transition?.skipAnimations;
  if (transitionOverride) {
    transition = transitionOverride;
  }
  let d = [];
  let f = type && e.animationState && e.animationState.getState()[type];
  let p = transition?.path;
  if (p) {
    p.animateVisualElement(e, rest, transition, delay, d);
  }
  for (let t in rest) {
    let r = e.getValue(t, e.latestValues[t] ?? null);
    let i = rest[t];
    if (i === undefined || (f && Pi(f, t))) {
      continue;
    }
    let o = {
      delay,
      ...V(transition || {}, t),
    };
    if (u) {
      o.skipAnimations = true;
    }
    let c = r.get();
    if (
      c !== undefined &&
      !r.isAnimating() &&
      !Array.isArray(i) &&
      i === c &&
      !o.velocity
    ) {
      schedule.update(() => r.set(i));
      continue;
    }
    let p = false;
    if (Ni && window.MotionHandoffAnimation) {
      let n = Mi(e);
      if (n) {
        let e = window.MotionHandoffAnimation(n, t, schedule);
        if (e !== null) {
          o.startTime = e;
          p = true;
        }
      }
    }
    ki(e, t);
    let m = l ?? e.shouldReduceMotion;
    r.start(
      hi(
        t,
        r,
        i,
        m && Si.has(t)
          ? {
              type: false,
            }
          : o,
        e,
        p,
      ),
    );
    let h = r.animation;
    if (h) {
      d.push(h);
    }
  }
  if (transitionEnd) {
    let t = () =>
      schedule.update(() => {
        if (transitionEnd) {
          Ei(e, transitionEnd);
        }
      });
    if (d.length) {
      Promise.all(d).then(t);
    } else {
      t();
    }
  }
  return d;
}
function Ii(e, t, n = {}) {
  let r = xi(e, t, n.type === `exit` ? e.presenceContext?.custom : undefined);
  let { transition = e.getDefaultTransition() || {} } = r || {};
  if (n.transitionOverride) {
    transition = n.transitionOverride;
  }
  let a = r ? () => Promise.all(Fi(e, r, n)) : () => Promise.resolve();
  let o =
    e.variantChildren && e.variantChildren.size
      ? (r = 0) => {
          let {
            delayChildren = 0,
            staggerChildren,
            staggerDirection,
          } = transition;
          return Li(
            e,
            t,
            r,
            delayChildren,
            staggerChildren,
            staggerDirection,
            n,
          );
        }
      : () => Promise.resolve();
  let { when } = transition;
  if (when) {
    let [e, t] = when === `beforeChildren` ? [a, o] : [o, a];
    return e().then(() => t());
  }
  return Promise.all([a(), o(n.delay)]);
}
function Li(e, t, n = 0, r = 0, i = 0, a = 1, o) {
  let s = [];
  for (let c of e.variantChildren) {
    c.notify(`AnimationStart`, t);
    s.push(
      Ii(c, t, {
        ...o,
        delay:
          n +
          (typeof r == `function` ? 0 : r) +
          ti(e.variantChildren, c, r, i, a),
      }).then(() => c.notify(`AnimationComplete`, t)),
    );
  }
  return Promise.all(s);
}
function Ri(e, animation, n = {}) {
  e.notify(`AnimationStart`, animation);
  let r;
  if (Array.isArray(animation)) {
    let i = animation.map((t) => Ii(e, t, n));
    r = Promise.all(i);
  } else if (typeof animation == `string`) {
    r = Ii(e, animation, n);
  } else {
    let i =
      typeof animation == `function` ? xi(e, animation, n.custom) : animation;
    r = Promise.all(Fi(e, i, n));
  }
  return r.then(() => {
    e.notify(`AnimationComplete`, animation);
  });
}
const zi = {
  test: (e) => e === `auto`,
  parse: (e) => e,
};
const Bi = (e) => (t) => t.test(e);
const Vi = [Xe, I, dt, ut, pt, ft, zi];
const Hi = (e) => Vi.find(Bi(e));
function Ui(e) {
  if (typeof e == `number`) {
    return e === 0;
  }
  return e === null || e === `none` || e === `0` || ae(e);
}
const Wi = new Set([`auto`, `none`, `0`]);
function Gi(unresolvedKeyframes, t, name) {
  let r = 0;
  let i;
  while (r < unresolvedKeyframes.length && !i) {
    let t = unresolvedKeyframes[r];
    if (typeof t == `string` && !Wi.has(t) && Et(t)) {
      i = unresolvedKeyframes[r];
    }
    r++;
  }
  if (i && name) {
    for (let r of t) {
      if (unresolvedKeyframes[r] !== i) {
        unresolvedKeyframes[r] = qn(name, i);
      }
    }
  }
}
class Ki extends wr {
  constructor(e, t, n, r, i) {
    super(e, t, n, r, i, true);
  }
  readKeyframes() {
    let { unresolvedKeyframes, element, name } = this;
    if (!element || !element.current) {
      return;
    }
    super.readKeyframes();
    for (let n = 0; n < unresolvedKeyframes.length; n++) {
      let r = unresolvedKeyframes[n];
      if (typeof r == `string` && ((r = r.trim()), qe(r))) {
        let i = vi(r, element.current);
        if (i !== undefined) {
          unresolvedKeyframes[n] = i;
        }
        if (n === unresolvedKeyframes.length - 1) {
          this.finalKeyframe = r;
        }
      }
    }
    this.resolveNoneKeyframes();
    if (!Si.has(name) || unresolvedKeyframes.length !== 2) {
      return;
    }
    let [r, i] = unresolvedKeyframes;
    if (typeof r == `number` && typeof i == `number`) {
      return;
    }
    let a = Hi(r);
    let o = Hi(i);
    if (Ye(r) !== Ye(i) && hr[name]) {
      this.needsMeasurement = true;
      return;
    }
    if (a !== o) {
      if (lr(a) && lr(o)) {
        for (let t = 0; t < unresolvedKeyframes.length; t++) {
          let unresolvedKeyframe = unresolvedKeyframes[t];
          if (typeof unresolvedKeyframe == `string`) {
            unresolvedKeyframes[t] = parseFloat(unresolvedKeyframe);
          }
        }
      } else {
        if (hr[name]) {
          this.needsMeasurement = true;
        }
      }
    }
  }
  resolveNoneKeyframes() {
    let { unresolvedKeyframes, name } = this;
    let n = [];
    for (let t = 0; t < unresolvedKeyframes.length; t++) {
      if (unresolvedKeyframes[t] === null || Ui(unresolvedKeyframes[t])) {
        n.push(t);
      }
    }
    if (n.length) {
      Gi(unresolvedKeyframes, n, name);
    }
  }
  measure() {
    let { element, name } = this;
    return hr[name](window.getComputedStyle(element.current), () =>
      element.measureViewportBox(),
    );
  }
  measureInitialState() {
    let { element, unresolvedKeyframes, name } = this;
    if (!element || !element.current) {
      return;
    }
    if (name === `height`) {
      this.suspendedScrollY = window.pageYOffset;
    }
    this.measuredOrigin = this.measure();
    unresolvedKeyframes[0] = this.measuredOrigin;
    let r = unresolvedKeyframes[unresolvedKeyframes.length - 1];
    r !== undefined && this.motionValue?.jump(r, false);
  }
  measureEndState() {
    let { element, unresolvedKeyframes } = this;
    if (!element || !element.current) {
      return;
    }
    this.motionValue?.jump(this.measuredOrigin, false);
    let n = unresolvedKeyframes.length - 1;
    let r = unresolvedKeyframes[n];
    unresolvedKeyframes[n] = this.measure();
    if (r !== null && this.finalKeyframe === undefined) {
      this.finalKeyframe = r;
    }
    if (this.removedTransforms?.length) {
      this.removedTransforms.forEach(([t, n]) => {
        element.getValue(t).set(n);
      });
    }
    this.resolveNoneKeyframes();
  }
}
const H = [
  `borderTopLeftRadius`,
  `borderTopRightRadius`,
  `borderBottomRightRadius`,
  `borderBottomLeftRadius`,
];
function U(e) {
  return ie(e) && `offsetHeight` in e && !(`ownerSVGElement` in e);
}
function qi(e) {
  return ie(e) && `ownerSVGElement` in e;
}
const Ji = (e, t) => {
  if (t && typeof e == `number`) {
    return t.transform(e);
  }
  return e;
};
function Yi(e, t, n) {
  if (e == null) {
    return [];
  }
  if (e instanceof EventTarget) {
    return [e];
  }
  if (typeof e == `string`) {
    let r = document;
    if (t) {
      r = t.current;
    }
    let i = n?.[e] ?? r.querySelectorAll(e);
    if (i) {
      return Array.from(i);
    }
    return [];
  }
  return Array.from(e).filter((e) => e != null);
}
const Xi = {
  x: `translateX`,
  y: `translateY`,
  z: `translateZ`,
  transformPerspective: `perspective`,
};
const sr_length = sr.length;
function Qi(e, transform, n) {
  let r = ``;
  let i = true;
  for (let a = 0; a < sr_length; a++) {
    let o = sr[a];
    let s = e[o];
    if (s === undefined) {
      continue;
    }
    let c = true;
    if (typeof s == `number`) {
      c = s === +!!o.startsWith(`scale`);
    } else {
      let e = parseFloat(s);
      c = o.startsWith(`scale`) ? e === 1 : e === 0;
    }
    if (!c || n) {
      let e = Ji(s, Un[o]);
      if (!c) {
        i = false;
        let t = Xi[o] || o;
        r += `${t}(${e}) `;
      }
      if (n) {
        transform[o] = e;
      }
    }
  }
  let e_pathRotation = e.pathRotation;
  if (e_pathRotation) {
    i = false;
    r += `rotate(${Ji(e_pathRotation, Un.pathRotation)}) `;
  }
  r = r.trim();
  if (n) {
    r = n(transform, i ? `` : r);
  } else if (i) {
    r = `none`;
  }
  return r;
}
function $i(e, t, n) {
  let { style, vars, transformOrigin } = e;
  let o = false;
  let s = false;
  for (let e in t) {
    let n = t[e];
    if (cr.has(e)) {
      o = true;
      continue;
    }
    if (Ge(e)) {
      vars[e] = n;
      continue;
    }
    {
      let t = Ji(n, Un[e]);
      if (e.startsWith(`origin`)) {
        s = true;
        transformOrigin[e] = t;
      } else {
        style[e] = t;
      }
    }
  }
  t.transform ||
    (o || n
      ? (style.transform = Qi(t, e.transform, n))
      : (style.transform &&= `none`));
  if (s) {
    let { originX = `50%`, originY = `50%`, originZ = 0 } = transformOrigin;
    style.transformOrigin = `${originX} ${originY} ${originZ}`;
  }
}
const ea = {
  offset: `stroke-dashoffset`,
  array: `stroke-dasharray`,
};
const ta = {
  offset: `strokeDashoffset`,
  array: `strokeDasharray`,
};
function na(attrs, pathLength, n = 1, r = 0, i = true) {
  attrs.pathLength = 1;
  let a = i ? ea : ta;
  attrs[a.offset] = `${-r}`;
  attrs[a.array] = `${pathLength} ${n}`;
}
const ra = [
  `transform`,
  `opacity`,
  `offsetDistance`,
  `offsetPath`,
  `offsetRotate`,
  `offsetAnchor`,
];
function ia(
  e,
  {
    attrX,
    attrY,
    attrScale,
    pathLength,
    pathSpacing = 1,
    pathOffset = 0,
    ...rest
  },
  c,
  transformTemplate,
  u,
) {
  $i(e, rest, transformTemplate);
  if (c) {
    if (e.style.viewBox) {
      e.attrs.viewBox = e.style.viewBox;
    }
    return;
  }
  e.attrs = e.style;
  e.style = {};
  let { attrs, style } = e;
  for (let e of ra) {
    if (attrs[e] !== undefined) {
      style[e] = attrs[e];
      delete attrs[e];
    }
  }
  if (style.transform || attrs.transformOrigin) {
    style.transformOrigin = attrs.transformOrigin ?? `50% 50%`;
    delete attrs.transformOrigin;
  }
  if (style.transform) {
    style.transformBox = u?.transformBox ?? `fill-box`;
    delete attrs.transformBox;
  }
  if (attrX !== undefined) {
    attrs.x = attrX;
  }
  if (attrY !== undefined) {
    attrs.y = attrY;
  }
  if (attrScale !== undefined) {
    attrs.scale = attrScale;
  }
  if (pathLength !== undefined) {
    na(attrs, pathLength, pathSpacing, pathOffset, false);
  }
}
function aa({ top, left, right, bottom }) {
  return {
    x: {
      min: left,
      max: right,
    },
    y: {
      min: top,
      max: bottom,
    },
  };
}
function oa({ x, y }) {
  return {
    top: y.min,
    right: x.max,
    bottom: y.max,
    left: x.min,
  };
}
function sa(e, t) {
  if (!t) {
    return e;
  }
  let n = t({
    x: e.left,
    y: e.top,
  });
  let r = t({
    x: e.right,
    y: e.bottom,
  });
  return {
    top: n.y,
    left: n.x,
    bottom: r.y,
    right: r.x,
  };
}
function ca(e) {
  return e === undefined || e === 1;
}
function la({ scale, scaleX, scaleY }) {
  return !ca(scale) || !ca(scaleX) || !ca(scaleY);
}
function ua(latestValues) {
  return (
    la(latestValues) ||
    da(latestValues) ||
    latestValues.z ||
    latestValues.rotate ||
    latestValues.rotateX ||
    latestValues.rotateY ||
    latestValues.skewX ||
    latestValues.skewY
  );
}
function da(e) {
  return fa(e.x) || fa(e.y);
}
function fa(e) {
  return e && e !== `0%`;
}
function pa(e, t, n) {
  return n + t * (e - n);
}
function ma(e, t, n, r, i) {
  if (i !== undefined) {
    e = pa(e, i, r);
  }
  return pa(e, n, r) + t;
}
function ha(e, t = 0, n = 1, r, i) {
  e.min = ma(e.min, t, n, r, i);
  e.max = ma(e.max, t, n, r, i);
}
function ga(e, { x, y }) {
  ha(e.x, x.translate, x.scale, x.originPoint);
  ha(e.y, y.translate, y.scale, y.originPoint);
}
const _a = 0.999999999999;
const va = 1.0000000000001;
function ya(layoutCorrected, treeScale, path, r = false) {
  let n_length = path.length;
  if (!n_length) {
    return;
  }
  treeScale.x = treeScale.y = 1;
  let a;
  let o;
  for (let s = 0; s < n_length; s++) {
    a = path[s];
    o = a.projectionDelta;
    let { visualElement } = a.options;
    (visualElement &&
      visualElement.props.style &&
      visualElement.props.style.display === `contents`) ||
      (r &&
        a.options.layoutScroll &&
        a.scroll &&
        a !== a.root &&
        (ba(layoutCorrected.x, -a.scroll.offset.x),
        ba(layoutCorrected.y, -a.scroll.offset.y)),
      o &&
        ((treeScale.x *= o.x.scale),
        (treeScale.y *= o.y.scale),
        ga(layoutCorrected, o)),
      r &&
        ua(a.latestValues) &&
        Ca(layoutCorrected, a.latestValues, a.layout?.layoutBox));
  }
  if (treeScale.x < va && treeScale.x > _a) {
    treeScale.x = 1;
  }
  if (treeScale.y < va && treeScale.y > _a) {
    treeScale.y = 1;
  }
}
function ba(e, t) {
  e.min += t;
  e.max += t;
}
function xa(e, t, n, scale, i = 0.5) {
  ha(e, t, n, R(e.min, e.max, i), scale);
}
function Sa(e, t) {
  if (typeof e == `string`) {
    return (parseFloat(e) / 100) * (t.max - t.min);
  }
  return e;
}
function Ca(e, latestValues, n) {
  let r = n ?? e;
  xa(
    e.x,
    Sa(latestValues.x, r.x),
    latestValues.scaleX,
    latestValues.scale,
    latestValues.originX,
  );
  xa(
    e.y,
    Sa(latestValues.y, r.y),
    latestValues.scaleY,
    latestValues.scale,
    latestValues.originY,
  );
}
function wa(e, t) {
  return aa(sa(e.getBoundingClientRect(), t));
}
function W(e, t, n) {
  let r = wa(e, n);
  let { scroll } = t;
  if (scroll) {
    ba(r.x, scroll.offset.x);
    ba(r.y, scroll.offset.y);
  }
  return r;
}
const { schedule: schedule_1, cancel: cancel_1 } = Le(queueMicrotask, false);
const Da = {
  x: false,
  y: false,
};
function Oa() {
  return Da.x || Da.y;
}
function ka(drag) {
  if (drag === `x` || drag === `y`) {
    if (Da[drag]) {
      return null;
    }
    return (
      (Da[drag] = true),
      () => {
        Da[drag] = false;
      }
    );
  }
  if (Da.x || Da.y) {
    return null;
  }
  return (
    (Da.x = Da.y = true),
    () => {
      Da.x = Da.y = false;
    }
  );
}
function Aa(e, t) {
  let n = Yi(e);
  let r = new AbortController();
  return [
    n,
    {
      passive: true,
      ...t,
      signal: r.signal,
    },
    () => r.abort(),
  ];
}
function ja(e) {
  return !(e.pointerType === `touch` || Oa());
}
function Ma(e, t, n = {}) {
  let [r, i, a] = Aa(e, n);
  r.forEach((e) => {
    let n = false;
    let r = false;
    let a;
    let o = () => {
      e.removeEventListener(`pointerleave`, u);
    };
    let s = (e) => {
      a &&= (a(e), undefined);
      o();
    };
    let c = (e) => {
      n = false;
      window.removeEventListener(`pointerup`, c);
      window.removeEventListener(`pointercancel`, c);
      if (r) {
        r = false;
        s(e);
      }
    };
    let l = () => {
      n = true;
      window.addEventListener(`pointerup`, c, i);
      window.addEventListener(`pointercancel`, c, i);
    };
    let u = (e) => {
      if (e.pointerType !== `touch`) {
        if (n) {
          r = true;
          return;
        }
        s(e);
      }
    };
    e.addEventListener(
      `pointerenter`,
      (n) => {
        if (!ja(n)) {
          return;
        }
        r = false;
        let o = t(e, n);
        if (typeof o == `function`) {
          a = o;
          e.addEventListener(`pointerleave`, u, i);
        }
      },
      i,
    );
    e.addEventListener(`pointerdown`, l, i);
  });
  return a;
}
const Na = (e, t) => {
  if (t) {
    return e === t || Na(e, t.parentElement);
  }
  return false;
};
const Pa = (e) => {
  if (e.pointerType === `mouse`) {
    return typeof e.button != `number` || e.button <= 0;
  }
  return e.isPrimary !== false;
};
const Fa = new Set([`BUTTON`, `INPUT`, `SELECT`, `TEXTAREA`, `A`]);
function Ia(e) {
  return Fa.has(e.tagName) || e.isContentEditable === true;
}
const La = new Set([`INPUT`, `SELECT`, `TEXTAREA`]);
function Ra(e) {
  return La.has(e.tagName) || e.isContentEditable === true;
}
const za = new WeakSet();
function Ba(e) {
  return (t) => {
    if (t.key === `Enter`) {
      e(t);
    }
  };
}
function Va(e, t) {
  e.dispatchEvent(
    new PointerEvent(`pointer` + t, {
      isPrimary: true,
      bubbles: true,
    }),
  );
}
const Ha = (e, t) => {
  let e_currentTarget = e.currentTarget;
  if (!e_currentTarget) {
    return;
  }
  let r = Ba(() => {
    if (za.has(e_currentTarget)) {
      return;
    }
    Va(e_currentTarget, `down`);
    let e = Ba(() => {
      Va(e_currentTarget, `up`);
    });
    e_currentTarget.addEventListener(`keyup`, e, t);
    e_currentTarget.addEventListener(
      `blur`,
      () => Va(e_currentTarget, `cancel`),
      t,
    );
  });
  e_currentTarget.addEventListener(`keydown`, r, t);
  e_currentTarget.addEventListener(
    `blur`,
    () => e_currentTarget.removeEventListener(`keydown`, r),
    t,
  );
};
function Ua(e) {
  return Pa(e) && !Oa();
}
const Wa = new WeakSet();
function Ga(e, t, n = {}) {
  let [r, i, a] = Aa(e, n);
  let o = (e) => {
    let e_currentTarget = e.currentTarget;
    if (!Ua(e) || Wa.has(e)) {
      return;
    }
    za.add(e_currentTarget);
    if (n.stopPropagation) {
      Wa.add(e);
    }
    let a = t(e_currentTarget, e);
    let o = {
      ...i,
      capture: true,
    };
    let s = (e, success) => {
      window.removeEventListener(`pointerup`, c, o);
      window.removeEventListener(`pointercancel`, l, o);
      if (za.has(e_currentTarget)) {
        za.delete(e_currentTarget);
      }
      if (Ua(e) && typeof a == `function`) {
        a(e, {
          success,
        });
      }
    };
    let c = (e) => {
      s(
        e,
        e_currentTarget === window ||
          e_currentTarget === document ||
          n.useGlobalTarget ||
          Na(e_currentTarget, e.target),
      );
    };
    let l = (e) => {
      s(e, false);
    };
    window.addEventListener(`pointerup`, c, o);
    window.addEventListener(`pointercancel`, l, o);
  };
  r.forEach((e) => {
    (n.useGlobalTarget ? window : e).addEventListener(`pointerdown`, o, i);
    if (U(e)) {
      e.addEventListener(`focus`, (e) => Ha(e, i));
      if (!Ia(e) && !e.hasAttribute(`tabindex`)) {
        e.tabIndex = 0;
      }
    }
  });
  return a;
}
const Ka = new WeakMap();
let qa;
const Ja = (e, t, n) => (r, i) => {
  if (i && i[0]) {
    return i[0][e + `Size`];
  }
  if (qi(r) && `getBBox` in r) {
    return r.getBBox()[t];
  }
  return r[n];
};
const Ya = Ja(`inline`, `width`, `offsetWidth`);
const Xa = Ja(`block`, `height`, `offsetHeight`);
function Za({ target, borderBoxSize }) {
  Ka.get(target)?.forEach((n) => {
    n(target, {
      get width() {
        return Ya(target, borderBoxSize);
      },
      get height() {
        return Xa(target, borderBoxSize);
      },
    });
  });
}
function Qa(e) {
  e.forEach(Za);
}
function $a() {
  if (typeof ResizeObserver < `u`) {
    qa = new ResizeObserver(Qa);
  }
}
function eo(e, t) {
  if (!qa) {
    $a();
  }
  let n = Yi(e);
  n.forEach((e) => {
    let n = Ka.get(e);
    if (!n) {
      n = new Set();
      Ka.set(e, n);
    }
    n.add(t);
    qa?.observe(e);
  });
  return () => {
    n.forEach((e) => {
      let n = Ka.get(e);
      n?.delete(t);
      n?.size || qa?.unobserve(e);
    });
  };
}
const to = new Set();
let no;
function ro() {
  no = () => {
    let e = {
      get width() {
        return window.innerWidth;
      },
      get height() {
        return window.innerHeight;
      },
    };
    to.forEach((t) => t(e));
  };
  window.addEventListener(`resize`, no);
}
function io(e) {
  to.add(e);
  if (!no) {
    ro();
  }
  return () => {
    to.delete(e);
    if (!to.size && typeof no == `function`) {
      window.removeEventListener(`resize`, no);
      no = undefined;
    }
  };
}
function ao(e, t) {
  if (typeof e == `function`) {
    return io(e);
  }
  return eo(e, t);
}
const oo = {
  value: null,
  addProjectionMetrics: null,
};
function so(e) {
  return qi(e) && e.tagName === `svg`;
}
const co = () => ({
  translate: 0,
  scale: 1,
  origin: 0,
  originPoint: 0,
});
const lo = () => ({
  x: co(),
  y: co(),
});
const uo = () => ({
  min: 0,
  max: 0,
});
const G = () => ({
  x: uo(),
  y: uo(),
});
const fo = new WeakMap();
function po(e) {
  return typeof e == `object` && !!e && typeof e.start == `function`;
}
function mo(e) {
  return typeof e == `string` || Array.isArray(e);
}
const ho = [
  `animate`,
  `whileInView`,
  `whileFocus`,
  `whileHover`,
  `whileTap`,
  `whileDrag`,
  `exit`,
];
const go = [`initial`, ...ho];
function _o(e) {
  if (po(e.animate)) {
    return true;
  }
  for (let t = 0; t < go.length; t++) {
    if (mo(e[go[t]])) {
      return true;
    }
  }
  return false;
}
function vo(e) {
  return !!(_o(e) || e.variants);
}
function K(owner, t, n) {
  for (let r in t) {
    let i = t[r];
    let a = n[r];
    if (Di(i)) {
      owner.addValue(r, i);
    } else if (Di(a)) {
      owner.addValue(
        r,
        oi(i, {
          owner,
        }),
      );
    } else if (a !== i) {
      if (owner.hasValue(r)) {
        let t = owner.getValue(r);
        if (t.liveStyle === true) {
          t.jump(i);
        } else if (!t.hasAnimated) {
          t.set(i);
        }
      } else {
        let t = owner.getStaticValue(r);
        owner.addValue(
          r,
          oi(t === undefined ? i : t, {
            owner,
          }),
        );
      }
    }
  }
  for (let r in n) {
    if (t[r] === undefined) {
      owner.removeValue(r);
    }
  }
  return t;
}
const yo = {
  current: null,
};
const bo = {
  current: false,
};
const xo = typeof window < `u`;
function So() {
  bo.current = true;
  if (xo) {
    if (window.matchMedia) {
      let e = window.matchMedia(`(prefers-reduced-motion)`);
      let t = () => (yo.current = e.matches);
      e.addEventListener(`change`, t);
      t();
    } else {
      yo.current = false;
    }
  }
}
const Co = [
  `AnimationStart`,
  `AnimationComplete`,
  `Update`,
  `BeforeLayoutMeasure`,
  `LayoutMeasure`,
  `LayoutAnimationStart`,
  `LayoutAnimationComplete`,
];
let wo = {};
function q(e) {
  wo = e;
}
function To() {
  return wo;
}
class Eo {
  scrapeMotionValuesFromProps(e, t, n) {
    return {};
  }
  constructor(
    {
      parent,
      props,
      presenceContext,
      reducedMotionConfig,
      skipAnimations,
      blockInitialAnimation,
      visualState,
    },
    s = {},
  ) {
    this.current = null;
    this.children = new Set();
    this.isVariantNode = false;
    this.isControllingVariants = false;
    this.shouldReduceMotion = null;
    this.shouldSkipAnimations = false;
    this.values = new Map();
    this.KeyframeResolver = wr;
    this.features = {};
    this.valueSubscriptions = new Map();
    this.prevMotionValues = {};
    this.hasBeenMounted = false;
    this.events = {};
    this.propEventSubscriptions = {};
    this.notifyUpdate = () => this.notify(`Update`, this.latestValues);
    this.render = () => {
      if (this.current) {
        this.triggerBuild();
        this.renderInstance(
          this.current,
          this.renderState,
          this.props.style,
          this.projection,
        );
      }
    };
    this.renderScheduledAt = 0;
    this.scheduleRender = () => {
      let e = F.now();
      if (this.renderScheduledAt < e) {
        this.renderScheduledAt = e;
        schedule.render(this.render, false, true);
      }
    };
    let { latestValues, renderState } = visualState;
    this.latestValues = latestValues;
    this.baseTarget = {
      ...latestValues,
    };
    this.initialValues = props.initial
      ? {
          ...latestValues,
        }
      : {};
    this.renderState = renderState;
    this.parent = parent;
    this.props = props;
    this.presenceContext = presenceContext;
    this.depth = parent ? parent.depth + 1 : 0;
    this.reducedMotionConfig = reducedMotionConfig;
    this.skipAnimationsConfig = skipAnimations;
    this.options = s;
    this.blockInitialAnimation = !!blockInitialAnimation;
    this.isControllingVariants = _o(props);
    this.isVariantNode = vo(props);
    if (this.isVariantNode) {
      this.variantChildren = new Set();
    }
    this.manuallyAnimateOnMount = !!(parent && parent.current);
    let { willChange, ...rest } = this.scrapeMotionValuesFromProps(
      props,
      {},
      this,
    );
    for (let e in rest) {
      let t = rest[e];
      if (latestValues[e] !== undefined && Di(t)) {
        t.set(latestValues[e]);
      }
    }
  }
  mount(e) {
    if (this.hasBeenMounted) {
      for (let e in this.initialValues) {
        this.values.get(e)?.jump(this.initialValues[e]);
        this.latestValues[e] = this.initialValues[e];
      }
    }
    this.current = e;
    fo.set(e, this);
    if (this.projection && !this.projection.instance) {
      this.projection.mount(e);
    }
    if (this.parent && this.isVariantNode && !this.isControllingVariants) {
      this.removeFromVariantTree = this.parent.addVariantChild(this);
    }
    this.values.forEach((e, t) => this.bindToMotionValue(t, e));
    if (this.reducedMotionConfig === `never`) {
      this.shouldReduceMotion = false;
    } else if (this.reducedMotionConfig === `always`) {
      this.shouldReduceMotion = true;
    } else {
      if (!bo.current) {
        So();
      }
      this.shouldReduceMotion = yo.current;
    }
    this.shouldSkipAnimations = this.skipAnimationsConfig ?? false;
    this.parent?.addChild(this);
    this.update(this.props, this.presenceContext);
    this.hasBeenMounted = true;
  }
  unmount() {
    if (this.projection) {
      this.projection.unmount();
    }
    cancel(this.notifyUpdate);
    cancel(this.render);
    this.valueSubscriptions.forEach((e) => e());
    this.valueSubscriptions.clear();
    if (this.removeFromVariantTree) {
      this.removeFromVariantTree();
    }
    this.parent?.removeChild(this);
    for (let e in this.events) {
      this.events[e].clear();
    }
    for (let e in this.features) {
      let t = this.features[e];
      if (t) {
        t.unmount();
        t.isMounted = false;
      }
    }
    this.current = null;
  }
  addChild(e) {
    this.children.add(e);
    this.enteringChildren ??= new Set();
    this.enteringChildren.add(e);
  }
  removeChild(e) {
    this.children.delete(e);
    if (this.enteringChildren) {
      this.enteringChildren.delete(e);
    }
  }
  bindToMotionValue(e, t) {
    if (this.valueSubscriptions.has(e)) {
      this.valueSubscriptions.get(e)();
    }
    if (t.accelerate && qr.has(e) && this.current instanceof HTMLElement) {
      let { factory, keyframes, times, ease, duration } = t.accelerate;
      let s = new Lr({
        element: this.current,
        name: e,
        keyframes,
        times,
        ease,
        duration: N(duration),
      });
      let c = factory(s);
      this.valueSubscriptions.set(e, () => {
        c();
        s.cancel();
      });
      return;
    }
    let n = cr.has(e);
    if (n && this.onBindTransform) {
      this.onBindTransform();
    }
    let r = t.on(`change`, (t) => {
      this.latestValues[e] = t;
      if (this.props.onUpdate) {
        schedule.preRender(this.notifyUpdate);
      }
      if (n && this.projection) {
        this.projection.isTransformDirty = true;
      }
      this.scheduleRender();
    });
    let i;
    if (typeof window < `u` && window.MotionCheckAppearSync) {
      i = window.MotionCheckAppearSync(this, e, t);
    }
    this.valueSubscriptions.set(e, () => {
      r();
      if (i) {
        i();
      }
    });
  }
  sortNodePosition(e) {
    if (
      !this.current ||
      !this.sortInstanceNodePosition ||
      this.type !== e.type
    ) {
      return 0;
    }
    return this.sortInstanceNodePosition(this.current, e.current);
  }
  updateFeatures() {
    let e = `animation`;
    for (e in wo) {
      let t = wo[e];
      if (!t) {
        continue;
      }
      let { isEnabled, Feature } = t;
      if (!this.features[e] && Feature && isEnabled(this.props)) {
        this.features[e] = new Feature(this);
      }
      if (this.features[e]) {
        let t = this.features[e];
        if (t.isMounted) {
          t.update();
        } else {
          t.mount();
          t.isMounted = true;
        }
      }
    }
  }
  triggerBuild() {
    this.build(this.renderState, this.latestValues, this.props);
  }
  measureViewportBox() {
    if (this.current) {
      return this.measureInstanceViewportBox(this.current, this.props);
    }
    return G();
  }
  getStaticValue(e) {
    return this.latestValues[e];
  }
  setStaticValue(e, t) {
    this.latestValues[e] = t;
  }
  update(e, t) {
    if (e.transformTemplate || this.props.transformTemplate) {
      this.scheduleRender();
    }
    this.prevProps = this.props;
    this.props = e;
    this.prevPresenceContext = this.presenceContext;
    this.presenceContext = t;
    for (const n of Co) {
      if (this.propEventSubscriptions[n]) {
        this.propEventSubscriptions[n]();
        delete this.propEventSubscriptions[n];
      }
      let r = e[`on` + n];
      if (r) {
        this.propEventSubscriptions[n] = this.on(n, r);
      }
    }
    this.prevMotionValues = K(
      this,
      this.scrapeMotionValuesFromProps(e, this.prevProps || {}, this),
      this.prevMotionValues,
    );
    if (this.handleChildMotionValue) {
      this.handleChildMotionValue();
    }
  }
  getProps() {
    return this.props;
  }
  getVariant(e) {
    if (this.props.variants) {
      return this.props.variants[e];
    }
  }
  getDefaultTransition() {
    return this.props.transition;
  }
  getTransformPagePoint() {
    return this.props.transformPagePoint;
  }
  getClosestVariantNode() {
    if (this.isVariantNode) {
      return this;
    }
    if (this.parent) {
      return this.parent.getClosestVariantNode();
    }
  }
  addVariantChild(e) {
    let t = this.getClosestVariantNode();
    if (t) {
      if (t.variantChildren) {
        t.variantChildren.add(e);
      }
      return () => t.variantChildren.delete(e);
    }
  }
  addValue(e, t) {
    let n = this.values.get(e);
    if (t !== n) {
      if (n) {
        this.removeValue(e);
      }
      this.bindToMotionValue(e, t);
      this.values.set(e, t);
      this.latestValues[e] = t.get();
    }
  }
  removeValue(e) {
    this.values.delete(e);
    let t = this.valueSubscriptions.get(e);
    if (t) {
      t();
      this.valueSubscriptions.delete(e);
    }
    delete this.latestValues[e];
    this.removeValueFromRenderState(e, this.renderState);
  }
  hasValue(e) {
    return this.values.has(e);
  }
  getValue(e, t) {
    if (this.props.values && this.props.values[e]) {
      return this.props.values[e];
    }
    let n = this.values.get(e);
    if (n === undefined && t !== undefined) {
      n = oi(t === null ? undefined : t, {
        owner: this,
      });
      this.addValue(e, n);
    }
    return n;
  }
  readValue(e, t) {
    let n =
      this.latestValues[e] !== undefined || !this.current
        ? this.latestValues[e]
        : (this.getBaseTargetFromProps(this.props, e) ??
          this.readValueFromInstance(this.current, e, this.options));
    if (n != null) {
      if (typeof n == `string` && (j(n) || ae(n))) {
        n = parseFloat(n);
      } else if (typeof n != `number` && !Pt.test(n) && Pt.test(t)) {
        n = qn(e, t);
      }
      this.setBaseTarget(e, Di(n) ? n.get() : n);
    }
    if (Di(n)) {
      return n.get();
    }
    return n;
  }
  setBaseTarget(e, t) {
    this.baseTarget[e] = t;
  }
  getBaseTarget(e) {
    let { initial } = this.props;
    let n;
    if (typeof initial == `string` || typeof initial == `object`) {
      let r = bi(this.props, initial, this.presenceContext?.custom);
      if (r) {
        n = r[e];
      }
    }
    if (initial && n !== undefined) {
      return n;
    }
    let r = this.getBaseTargetFromProps(this.props, e);
    if (r !== undefined && !Di(r)) {
      return r;
    }
    if (this.initialValues[e] !== undefined && n === undefined) {
      return undefined;
    }
    return this.baseTarget[e];
  }
  on(e, t) {
    if (!this.events[e]) {
      this.events[e] = new le();
    }
    return this.events[e].add(t);
  }
  notify(e, ...t) {
    if (this.events[e]) {
      this.events[e].notify(...t);
    }
  }
  scheduleRenderMicrotask() {
    schedule_1.render(this.render);
  }
}
class Do extends Eo {
  constructor() {
    super(...arguments);
    this.KeyframeResolver = Ki;
  }
  sortInstanceNodePosition(e, t) {
    if (e.compareDocumentPosition(t) & 2) {
      return 1;
    }
    return -1;
  }
  getBaseTargetFromProps({ style }, t) {
    if (style) {
      return style[t];
    }
  }
  removeValueFromRenderState(e, { vars, style }) {
    delete vars[e];
    delete style[e];
  }
  handleChildMotionValue() {
    if (this.childSubscription) {
      this.childSubscription();
      delete this.childSubscription;
    }
    let { children } = this.props;
    if (Di(children)) {
      this.childSubscription = children.on(`change`, (e) => {
        if (this.current) {
          this.current.textContent = `${e}`;
        }
      });
    }
  }
}
class Oo {
  constructor(e) {
    this.isMounted = false;
    this.node = e;
  }
  update() {}
}
function ko({ style }, { style: style_1, vars }, r, i) {
  let o;
  for (o in style_1) {
    style[o] = style_1[o];
  }
  i?.applyProjectionStyles(style, r);
  for (o in vars) {
    style.setProperty(o, vars[o]);
  }
}
function Ao(e, t) {
  if (t.max === t.min) {
    return 0;
  }
  return (e / (t.max - t.min)) * 100;
}
const jo = {
  correct: (e, t) => {
    if (!t.target) {
      return e;
    }
    if (typeof e == `string`) {
      if (I.test(e)) {
        e = parseFloat(e);
      } else {
        return e;
      }
    }
    return `${Ao(e, t.target.x)}% ${Ao(e, t.target.y)}%`;
  },
};
const boxShadow = {
  correct: (e, { treeScale, projectionDelta }) => {
    let r = e;
    let i = Pt.parse(e);
    if (i.length > 5) {
      return r;
    }
    let a = Pt.createTransformer(e);
    let o = typeof i[0] == `number` ? 0 : 1;
    let s = projectionDelta.x.scale * treeScale.x;
    let c = projectionDelta.y.scale * treeScale.y;
    i[0 + o] /= s;
    i[1 + o] /= c;
    let l = R(s, c, 0.5);
    if (typeof i[2 + o] == `number`) {
      i[2 + o] /= l;
    }
    if (typeof i[3 + o] == `number`) {
      i[3 + o] /= l;
    }
    return a(i);
  },
};
const No = {
  borderRadius: {
    ...jo,
    applyTo: [...H],
  },
  borderTopLeftRadius: jo,
  borderTopRightRadius: jo,
  borderBottomLeftRadius: jo,
  borderBottomRightRadius: jo,
  boxShadow,
};
function Po(e, { layout, layoutId }) {
  return (
    cr.has(e) ||
    e.startsWith(`origin`) ||
    ((layout || layoutId !== undefined) && (!!No[e] || e === `opacity`))
  );
}
function Fo(e, t, n) {
  let e_style = e.style;
  let i = t?.style;
  let a = {};
  if (!e_style) {
    return a;
  }
  for (let t in e_style) {
    if (
      Di(e_style[t]) ||
      (i && Di(i[t])) ||
      Po(t, e) ||
      n?.getValue(t)?.liveStyle !== undefined
    ) {
      a[t] = e_style[t];
    }
  }
  return a;
}
function Io(e) {
  return window.getComputedStyle(e);
}
class Lo extends Do {
  constructor() {
    super(...arguments);
    this.type = `html`;
    this.renderInstance = ko;
  }
  mount(e) {
    e.style;
    super.mount(e);
  }
  readValueFromInstance(e, t) {
    if (cr.has(t)) {
      if (this.projection?.isProjecting) {
        return rr(t);
      }
      return ar(e, t);
    }
    {
      let n = Io(e);
      let r = (Ge(t) ? n.getPropertyValue(t) : n[t]) || 0;
      if (typeof r == `string`) {
        return r.trim();
      }
      return r;
    }
  }
  measureInstanceViewportBox(e, { transformPagePoint }) {
    return wa(e, transformPagePoint);
  }
  build(e, t, n) {
    $i(e, t, n.transformTemplate);
  }
  scrapeMotionValuesFromProps(e, t, n) {
    return Fo(e, t, n);
  }
}
const Ro = new Set([
  `baseFrequency`,
  `diffuseConstant`,
  `kernelMatrix`,
  `kernelUnitLength`,
  `keySplines`,
  `keyTimes`,
  `limitingConeAngle`,
  `markerHeight`,
  `markerWidth`,
  `numOctaves`,
  `targetX`,
  `targetY`,
  `surfaceScale`,
  `specularConstant`,
  `specularExponent`,
  `stdDeviation`,
  `tableValues`,
  `viewBox`,
  `gradientTransform`,
  `pathLength`,
  `startOffset`,
  `textLength`,
  `lengthAdjust`,
]);
const zo = (e) => typeof e == `string` && e.toLowerCase() === `svg`;
function Bo(e, t, n, r) {
  ko(e, t, undefined, r);
  for (let n in t.attrs) {
    e.setAttribute(Ro.has(n) ? n : Ai(n), t.attrs[n]);
  }
}
function Vo(e, t, n) {
  let r = Fo(e, t, n);
  for (let n in e) {
    if (Di(e[n]) || Di(t[n])) {
      let t =
        sr.indexOf(n) === -1
          ? n
          : `attr` + n.charAt(0).toUpperCase() + n.substring(1);
      r[t] = e[n];
    }
  }
  return r;
}
class Ho extends Do {
  constructor() {
    super(...arguments);
    this.type = `svg`;
    this.isSVGTag = false;
    this.measureInstanceViewportBox = G;
  }
  getBaseTargetFromProps(e, t) {
    return e[t];
  }
  readValueFromInstance(e, t) {
    if (cr.has(t)) {
      let e = Gn(t);
      return (e && e.default) || 0;
    }
    if (ra.includes(t)) {
      let n = getComputedStyle(e)[t];
      if (typeof n == `string` && n) {
        return n.trim();
      }
    }
    t = Ro.has(t) ? t : Ai(t);
    return e.getAttribute(t);
  }
  scrapeMotionValuesFromProps(e, t, n) {
    return Vo(e, t, n);
  }
  build(e, t, n) {
    ia(e, t, this.isSVGTag, n.transformTemplate, n.style);
  }
  renderInstance(e, t, n, r) {
    Bo(e, t, n, r);
  }
  mount(e) {
    this.isSVGTag = zo(e.tagName);
    super.mount(e);
  }
}
const go_length = go.length;
function Wo(parent) {
  if (!parent) {
    return;
  }
  if (!parent.isControllingVariants) {
    let t = (parent.parent && Wo(parent.parent)) || {};
    if (parent.props.initial !== undefined) {
      t.initial = parent.props.initial;
    }
    return t;
  }
  let t = {};
  for (let n = 0; n < go_length; n++) {
    let r = go[n];
    let i = parent.props[r];
    if (mo(i) || i === false) {
      t[r] = i;
    }
  }
  return t;
}
function Go(e, t) {
  if (!Array.isArray(t)) {
    return false;
  }
  let t_length = t.length;
  if (t_length !== e.length) {
    return false;
  }
  for (let r = 0; r < t_length; r++) {
    if (t[r] !== e[r]) {
      return false;
    }
  }
  return true;
}
const Ko = [...ho].reverse();
const ho_length = ho.length;
function Jo(e) {
  return (t) =>
    Promise.all(t.map(({ animation, options }) => Ri(e, animation, options)));
}
function Yo(e) {
  let t = Jo(e);
  let n = Qo();
  let r = true;
  let i = false;
  let a = (t) => (n, r) => {
    let i = xi(e, r, t === `exit` ? e.presenceContext?.custom : undefined);
    if (i) {
      let { transition, transitionEnd, ...rest } = i;
      n = {
        ...n,
        ...rest,
        ...transitionEnd,
      };
    }
    return n;
  };
  function setAnimateFunction(n) {
    t = n(e);
  }
  function animateChanges(o) {
    let { props } = e;
    let c = Wo(e.parent) || {};
    let l = [];
    let u = new Set();
    let d = {};
    let f = Infinity;
    for (let t = 0; t < ho_length; t++) {
      let p = Ko[t];
      let m = n[p];
      let h = props[p] === undefined ? c[p] : props[p];
      let g = mo(h);
      let _ = p === o ? m.isActive : null;
      if (_ === false) {
        f = t;
      }
      let v = h === c[p] && h !== props[p] && g;
      if (v && (r || i) && e.manuallyAnimateOnMount) {
        v = false;
      }
      m.protectedKeys = {
        ...d,
      };
      if (
        (!m.isActive && _ === null) ||
        (!h && !m.prevProp) ||
        po(h) ||
        typeof h == `boolean`
      ) {
        continue;
      }
      if (p === `exit` && m.isActive && _ !== true) {
        if (m.prevResolvedValues) {
          d = {
            ...d,
            ...m.prevResolvedValues,
          };
        }
        continue;
      }
      let y = Xo(m.prevProp, h);
      let b = y || (p === o && m.isActive && !v && g) || (t > f && g);
      let x = false;
      let S = Array.isArray(h) ? h : [h];
      let C = S.reduce(a(p), {});
      if (_ === false) {
        C = {};
      }
      let { prevResolvedValues = {} } = m;
      let T = {
        ...prevResolvedValues,
        ...C,
      };
      let E = (t) => {
        b = true;
        if (u.has(t)) {
          x = true;
          u.delete(t);
        }
        m.needsAnimating[t] = true;
        let n = e.getValue(t);
        if (n) {
          n.liveStyle = false;
        }
      };
      for (let e in T) {
        let t = C[e];
        let n = prevResolvedValues[e];
        if (d.hasOwnProperty(e)) {
          continue;
        }
        let r = false;
        r = Ci(t) && Ci(n) ? !Go(t, n) || y : t !== n;
        r
          ? t == null
            ? u.add(e)
            : E(e)
          : t !== undefined && u.has(e)
            ? E(e)
            : (m.protectedKeys[e] = true);
      }
      m.prevProp = h;
      m.prevResolvedValues = C;
      if (m.isActive) {
        d = {
          ...d,
          ...C,
        };
      }
      if ((r || i) && e.blockInitialAnimation) {
        b = false;
      }
      let D = v && y;
      if (b && (!D || x)) {
        l.push(
          ...S.map((t) => {
            let options = {
              type: p,
            };
            if (
              typeof t == `string` &&
              (r || i) &&
              !D &&
              e.manuallyAnimateOnMount &&
              e.parent
            ) {
              let { parent } = e;
              let i = xi(parent, t);
              if (parent.enteringChildren && i) {
                let { delayChildren } = i.transition || {};
                options.delay = ti(parent.enteringChildren, e, delayChildren);
              }
            }
            return {
              animation: t,
              options,
            };
          }),
        );
      }
    }
    if (u.size) {
      let t = {};
      if (typeof props.initial != `boolean`) {
        let n = xi(
          e,
          Array.isArray(props.initial) ? props.initial[0] : props.initial,
        );
        if (n && n.transition) {
          t.transition = n.transition;
        }
      }
      u.forEach((n) => {
        let r = e.getBaseTarget(n);
        let i = e.getValue(n);
        if (i) {
          i.liveStyle = true;
        }
        t[n] = r ?? null;
      });
      l.push({
        animation: t,
      });
    }
    let p = !!l.length;
    if (
      r &&
      (props.initial === false || props.initial === props.animate) &&
      !e.manuallyAnimateOnMount
    ) {
      p = false;
    }
    r = false;
    i = false;
    if (p) {
      return t(l);
    }
    return Promise.resolve();
  }
  function setActive(t, r) {
    if (n[t].isActive === r) {
      return Promise.resolve();
    }
    e.variantChildren?.forEach((e) => e.animationState?.setActive(t, r));
    n[t].isActive = r;
    let i = animateChanges(t);
    for (let e in n) {
      n[e].protectedKeys = {};
    }
    return i;
  }
  return {
    animateChanges,
    setActive,
    setAnimateFunction,
    getState: () => n,
    reset: () => {
      n = Qo();
      i = true;
    },
  };
}
function Xo(prevProp, t) {
  if (typeof t == `string`) {
    return t !== prevProp;
  }
  if (Array.isArray(t)) {
    return !Go(t, prevProp);
  }
  return false;
}
function Zo(isActive = false) {
  return {
    isActive,
    protectedKeys: {},
    needsAnimating: {},
    prevResolvedValues: {},
  };
}
function Qo() {
  return {
    animate: Zo(true),
    whileInView: Zo(),
    whileHover: Zo(),
    whileTap: Zo(),
    whileDrag: Zo(),
    whileFocus: Zo(),
    exit: Zo(),
  };
}
function $o(e, t) {
  e.min = t.min;
  e.max = t.max;
}
function es(e, t) {
  $o(e.x, t.x);
  $o(e.y, t.y);
}
function ts(e, t) {
  e.translate = t.translate;
  e.scale = t.scale;
  e.originPoint = t.originPoint;
  e.origin = t.origin;
}
const ns = 0.9999;
const rs = 1.0001;
const is = -0.01;
const as = 0.01;
function os(e) {
  return e.max - e.min;
}
function ss(e, t, n) {
  return Math.abs(e - t) <= n;
}
function cs(e, t, n, r = 0.5) {
  e.origin = r;
  e.originPoint = R(t.min, t.max, e.origin);
  e.scale = os(n) / os(t);
  e.translate = R(n.min, n.max, e.origin) - e.originPoint;
  if ((e.scale >= ns && e.scale <= rs) || isNaN(e.scale)) {
    e.scale = 1;
  }
  if ((e.translate >= is && e.translate <= as) || isNaN(e.translate)) {
    e.translate = 0;
  }
}
function ls(e, t, n, r) {
  cs(e.x, t.x, n.x, r ? r.originX : undefined);
  cs(e.y, t.y, n.y, r ? r.originY : undefined);
}
function us(e, t, n, r = 0) {
  e.min = (r ? R(n.min, n.max, r) : n.min) + t.min;
  e.max = e.min + os(t);
}
function ds(target, relativeTarget, n, r) {
  us(target.x, relativeTarget.x, n.x, r?.x);
  us(target.y, relativeTarget.y, n.y, r?.y);
}
function fs(e, t, n, r = 0) {
  let i = r ? R(n.min, n.max, r) : n.min;
  e.min = t.min - i;
  e.max = e.min + os(t);
}
function ps(e, t, n, r) {
  fs(e.x, t.x, n.x, r?.x);
  fs(e.y, t.y, n.y, r?.y);
}
function ms(e, t, n, r, i) {
  e -= t;
  e = pa(e, 1 / n, r);
  if (i !== undefined) {
    e = pa(e, 1 / i, r);
  }
  return e;
}
function hs(e, t = 0, n = 1, r = 0.5, scale, a = e, o = e) {
  if (dt.test(t)) {
    t = parseFloat(t);
    t = R(o.min, o.max, t / 100) - o.min;
  }
  if (typeof t != `number`) {
    return;
  }
  let s = R(a.min, a.max, r);
  if (e === a) {
    s -= t;
  }
  e.min = ms(e.min, t, n, s, scale);
  e.max = ms(e.max, t, n, s, scale);
}
function gs(e, t, [n, r, i], a, o) {
  hs(e, t[n], t[r], t[i], t.scale, a, o);
}
const _s = [`x`, `scaleX`, `originX`];
const vs = [`y`, `scaleY`, `originY`];
function ys(e, latestValues, n, r) {
  gs(e.x, latestValues, _s, n ? n.x : undefined, r ? r.x : undefined);
  gs(e.y, latestValues, vs, n ? n.y : undefined, r ? r.y : undefined);
}
function bs(e) {
  return e.translate === 0 && e.scale === 1;
}
function xs(e) {
  return bs(e.x) && bs(e.y);
}
function Ss(e, t) {
  return e.min === t.min && e.max === t.max;
}
function Cs(relativeTarget, t) {
  return Ss(relativeTarget.x, t.x) && Ss(relativeTarget.y, t.y);
}
function ws(e, t) {
  return (
    Math.round(e.min) === Math.round(t.min) &&
    Math.round(e.max) === Math.round(t.max)
  );
}
function Ts(e, t) {
  return ws(e.x, t.x) && ws(e.y, t.y);
}
function Es(e) {
  return os(e.x) / os(e.y);
}
function Ds(e, t) {
  return (
    e.translate === t.translate &&
    e.scale === t.scale &&
    e.originPoint === t.originPoint
  );
}
function Os(e) {
  return [e(`x`), e(`y`)];
}
function ks(projectionDeltaWithTransform, treeScale, n) {
  let r = ``;
  let i = projectionDeltaWithTransform.x.translate / treeScale.x;
  let a = projectionDeltaWithTransform.y.translate / treeScale.y;
  let o = n?.z || 0;
  if (i || a || o) {
    r = `translate3d(${i}px, ${a}px, ${o}px) `;
  }
  if (treeScale.x !== 1 || treeScale.y !== 1) {
    r += `scale(${1 / treeScale.x}, ${1 / treeScale.y}) `;
  }
  if (n) {
    let {
      transformPerspective,
      rotate,
      pathRotation,
      rotateX,
      rotateY,
      skewX,
      skewY,
    } = n;
    if (transformPerspective) {
      r = `perspective(${transformPerspective}px) ${r}`;
    }
    if (rotate) {
      r += `rotate(${rotate}deg) `;
    }
    if (pathRotation) {
      r += `rotate(${pathRotation}deg) `;
    }
    if (rotateX) {
      r += `rotateX(${rotateX}deg) `;
    }
    if (rotateY) {
      r += `rotateY(${rotateY}deg) `;
    }
    if (skewX) {
      r += `skewX(${skewX}deg) `;
    }
    if (skewY) {
      r += `skewY(${skewY}deg) `;
    }
  }
  let s = projectionDeltaWithTransform.x.scale * treeScale.x;
  let c = projectionDeltaWithTransform.y.scale * treeScale.y;
  if (s !== 1 || c !== 1) {
    r += `scale(${s}, ${c})`;
  }
  return r || `none`;
}
const H_length = H.length;
const js = (e) => {
  if (typeof e == `string`) {
    return parseFloat(e);
  }
  return e;
};
const Ms = (e) => typeof e == `number` || I.test(e);
function Ns(e, t, latestValues, r, i, a) {
  if (i) {
    e.opacity = R(0, latestValues.opacity ?? 1, Fs(r));
    e.opacityExit = R(t.opacity ?? 1, 0, Is(r));
  } else if (a) {
    e.opacity = R(t.opacity ?? 1, latestValues.opacity ?? 1, r);
  }
  for (let i = 0; i < H_length; i++) {
    let a = H[i];
    let o = Ps(t, a);
    let s = Ps(latestValues, a);
    if (o !== undefined || s !== undefined) {
      o ||= 0;
      s ||= 0;
      if (o === 0 || s === 0 || Ms(o) === Ms(s)) {
        e[a] = Math.max(R(js(o), js(s), r), 0);
        if (dt.test(s) || dt.test(o)) {
          e[a] += `%`;
        }
      } else {
        e[a] = s;
      }
    }
  }
  if (t.rotate || latestValues.rotate) {
    e.rotate = R(t.rotate || 0, latestValues.rotate || 0, r);
  }
}
function Ps(e, t) {
  if (e[t] === undefined) {
    return e.borderRadius;
  }
  return e[t];
}
var Fs = Ls(0, 0.5, circOut);
var Is = Ls(0.5, 0.95, linear);
function Ls(e, t, n) {
  return (r) => {
    if (r < e) {
      return 0;
    }
    if (r > t) {
      return 1;
    }
    return n(ce(e, t, r));
  };
}
function Rs(motionValue, t, n) {
  let r = Di(motionValue) ? motionValue : oi(motionValue);
  r.start(hi(``, r, t, n));
  return r.animation;
}
function zs(
  e,
  t,
  n,
  r = {
    passive: true,
  },
) {
  e.addEventListener(t, n, r);
  return () => e.removeEventListener(t, n, r);
}
const Bs = (e, t) => e.depth - t.depth;
class Vs {
  constructor() {
    this.children = [];
    this.isDirty = false;
  }
  add(e) {
    te(this.children, e);
    this.isDirty = true;
  }
  remove(e) {
    ne(this.children, e);
    this.isDirty = true;
  }
  forEach(e) {
    if (this.isDirty) {
      this.children.sort(Bs);
    }
    this.isDirty = false;
    this.children.forEach(e);
  }
}
function Hs(e, t) {
  let n = F.now();
  let r = ({ timestamp }) => {
    let a = timestamp - n;
    if (a >= t) {
      cancel(r);
      e(a - t);
    }
  };
  schedule.setup(r, true);
  return () => cancel(r);
}
function Us(e) {
  if (Di(e)) {
    return e.get();
  }
  return e;
}
class Ws {
  constructor() {
    this.members = [];
  }
  add(e) {
    te(this.members, e);
    for (let t = this.members.length - 1; t >= 0; t--) {
      let n = this.members[t];
      if (n === e || n === this.lead || n === this.prevLead) {
        continue;
      }
      let r = n.instance;
      if ((!r || r.isConnected === false) && !n.snapshot) {
        ne(this.members, n);
        n.unmount();
      }
    }
    e.scheduleRender();
  }
  remove(e) {
    ne(this.members, e);
    if (e === this.prevLead) {
      this.prevLead = undefined;
    }
    if (e === this.lead) {
      let e = this.members[this.members.length - 1];
      if (e) {
        this.promote(e);
      }
    }
  }
  relegate(e) {
    for (let t = this.members.indexOf(e) - 1; t >= 0; t--) {
      let e = this.members[t];
      if (e.isPresent !== false && e.instance?.isConnected !== false) {
        this.promote(e);
        return true;
      }
    }
    return false;
  }
  promote(e, t) {
    let lead = this.lead;
    if (
      e !== lead &&
      ((this.prevLead = lead), (this.lead = e), e.show(), lead)
    ) {
      lead.updateSnapshot();
      e.scheduleRender();
      let { layoutDependency } = lead.options;
      let { layoutDependency: layoutDependency_1 } = e.options;
      if (
        layoutDependency === undefined ||
        layoutDependency !== layoutDependency_1
      ) {
        e.resumeFrom = lead;
        if (t) {
          lead.preserveOpacity = true;
        }
        if (lead.snapshot) {
          e.snapshot = lead.snapshot;
          e.snapshot.latestValues = lead.animationValues || lead.latestValues;
        }
        if (e.root?.isUpdating) {
          e.isLayoutDirty = true;
        }
      }
      if (e.options.crossfade === false) {
        lead.hide();
      }
    }
  }
  exitAnimationComplete() {
    this.members.forEach((e) => {
      e.options.onExitComplete?.();
      e.resumingFrom?.options.onExitComplete?.();
    });
  }
  scheduleRender() {
    this.members.forEach((e) => e.instance && e.scheduleRender(false));
  }
  removeLeadSnapshot() {
    if (this.lead?.snapshot) {
      this.lead.snapshot = undefined;
    }
  }
}
const Gs = {
  hasAnimatedSinceResize: true,
  hasEverUpdated: false,
};
const Ks = {
  nodes: 0,
  calculatedTargetDeltas: 0,
  calculatedProjections: 0,
};
const qs = [``, `X`, `Y`, `Z`];
const Js = 1000;
let Ys = 0;
function Xs(e, visualElement, n, animationValues) {
  let { latestValues } = visualElement;
  if (latestValues[e]) {
    n[e] = latestValues[e];
    visualElement.setStaticValue(e, 0);
    if (animationValues) {
      animationValues[e] = 0;
    }
  }
}
function Zs(e) {
  e.hasCheckedOptimisedAppear = true;
  if (e.root === e) {
    return;
  }
  let { visualElement } = e.options;
  if (!visualElement) {
    return;
  }
  let n = Mi(visualElement);
  if (window.MotionHasOptimisedAnimation(n, `transform`)) {
    let { layout, layoutId } = e.options;
    window.MotionCancelOptimisedAnimation(
      n,
      `transform`,
      schedule,
      !(layout || layoutId),
    );
  }
  let { parent } = e;
  if (parent && !parent.hasCheckedOptimisedAppear) {
    Zs(parent);
  }
}
function Qs({
  attachResizeListener,
  defaultParent,
  measureScroll,
  checkIsScrollRoot,
  resetTransform,
}) {
  return class {
    constructor(e = {}, n = defaultParent?.()) {
      this.id = Ys++;
      this.animationId = 0;
      this.animationCommitId = 0;
      this.children = new Set();
      this.options = {};
      this.isTreeAnimating = false;
      this.isAnimationBlocked = false;
      this.isLayoutDirty = false;
      this.isProjectionDirty = false;
      this.isSharedProjectionDirty = false;
      this.isTransformDirty = false;
      this.updateManuallyBlocked = false;
      this.updateBlockedByResize = false;
      this.isUpdating = false;
      this.isSVG = false;
      this.needsReset = false;
      this.shouldResetTransform = false;
      this.hasCheckedOptimisedAppear = false;
      this.treeScale = {
        x: 1,
        y: 1,
      };
      this.eventHandlers = new Map();
      this.hasTreeAnimated = false;
      this.layoutVersion = 0;
      this.updateScheduled = false;
      this.scheduleUpdate = () => this.update();
      this.projectionUpdateScheduled = false;
      this.checkUpdateFailed = () => {
        if (this.isUpdating) {
          this.isUpdating = false;
          this.clearAllSnapshots();
        }
      };
      this.updateProjection = () => {
        this.projectionUpdateScheduled = false;
        if (oo.value) {
          Ks.nodes = Ks.calculatedTargetDeltas = Ks.calculatedProjections = 0;
        }
        this.nodes.forEach(tc);
        this.nodes.forEach(uc);
        this.nodes.forEach(dc);
        this.nodes.forEach(nc);
        if (oo.addProjectionMetrics) {
          oo.addProjectionMetrics(Ks);
        }
      };
      this.resolvedRelativeTargetAt = 0;
      this.linkedParentVersion = 0;
      this.hasProjected = false;
      this.isVisible = true;
      this.animationProgress = 0;
      this.sharedNodes = new Map();
      this.latestValues = e;
      this.root = n ? n.root || n : this;
      this.path = n ? [...n.path, n] : [];
      this.parent = n;
      this.depth = n ? n.depth + 1 : 0;
      for (let e = 0; e < this.path.length; e++) {
        this.path[e].shouldResetTransform = true;
      }
      if (this.root === this) {
        this.nodes = new Vs();
      }
    }
    addEventListener(e, t) {
      if (!this.eventHandlers.has(e)) {
        this.eventHandlers.set(e, new le());
      }
      return this.eventHandlers.get(e).add(t);
    }
    notifyListeners(e, ...t) {
      let n = this.eventHandlers.get(e);
      if (n) {
        n.notify(...t);
      }
    }
    hasListeners(e) {
      return this.eventHandlers.has(e);
    }
    mount(t) {
      if (this.instance) {
        return;
      }
      this.isSVG = qi(t) && !so(t);
      this.instance = t;
      let { layoutId, layout, visualElement } = this.options;
      if (visualElement && !visualElement.current) {
        visualElement.mount(t);
      }
      this.root.nodes.add(this);
      if (this.parent) {
        this.parent.children.add(this);
      }
      if (this.root.hasTreeAnimated && (layout || layoutId)) {
        this.isLayoutDirty = true;
      }
      if (attachResizeListener) {
        let n;
        let r = 0;
        let i = () => (this.root.updateBlockedByResize = false);
        schedule.read(() => {
          r = window.innerWidth;
        });
        attachResizeListener(t, () => {
          let window_innerWidth = window.innerWidth;
          if (window_innerWidth !== r) {
            r = window_innerWidth;
            this.root.updateBlockedByResize = true;
            if (n) {
              n();
            }
            n = Hs(i, 250);
            if (Gs.hasAnimatedSinceResize) {
              Gs.hasAnimatedSinceResize = false;
              this.nodes.forEach(lc);
            }
          }
        });
      }
      if (layoutId) {
        this.root.registerSharedNode(layoutId, this);
      }
      if (
        this.options.animate !== false &&
        visualElement &&
        (layoutId || layout)
      ) {
        this.addEventListener(
          `didUpdate`,
          ({ delta, hasLayoutChanged, hasRelativeLayoutChanged, layout }) => {
            if (this.isTreeAnimationBlocked()) {
              this.target = undefined;
              this.relativeTarget = undefined;
              return;
            }
            let a =
              this.options.transition ||
              visualElement.getDefaultTransition() ||
              _c;
            let { onLayoutAnimationStart, onLayoutAnimationComplete } =
              visualElement.getProps();
            let c = !this.targetLayout || !Ts(this.targetLayout, layout);
            let l = !hasLayoutChanged && hasRelativeLayoutChanged;
            if (
              this.options.layoutRoot ||
              this.resumeFrom ||
              l ||
              (hasLayoutChanged && (c || !this.currentAnimation))
            ) {
              if (this.resumeFrom) {
                this.resumingFrom = this.resumeFrom;
                this.resumingFrom.resumingFrom = undefined;
              }
              let t = {
                ...V(a, `layout`),
                onPlay: onLayoutAnimationStart,
                onComplete: onLayoutAnimationComplete,
              };
              if (visualElement.shouldReduceMotion || this.options.layoutRoot) {
                t.delay = 0;
                t.type = false;
              }
              this.startAnimation(t);
              this.setAnimationOrigin(delta, l, t.path);
            } else {
              if (!hasLayoutChanged) {
                lc(this);
              }
              if (this.isLead() && this.options.onExitComplete) {
                this.options.onExitComplete();
              }
            }
            this.targetLayout = layout;
          },
        );
      }
    }
    unmount() {
      if (this.options.layoutId) {
        this.willUpdate();
      }
      this.root.nodes.remove(this);
      let e = this.getStack();
      if (e) {
        e.remove(this);
      }
      if (this.parent) {
        this.parent.children.delete(this);
      }
      this.instance = undefined;
      this.eventHandlers.clear();
      cancel(this.updateProjection);
    }
    blockUpdate() {
      this.updateManuallyBlocked = true;
    }
    unblockUpdate() {
      this.updateManuallyBlocked = false;
    }
    isUpdateBlocked() {
      return this.updateManuallyBlocked || this.updateBlockedByResize;
    }
    isTreeAnimationBlocked() {
      return (
        this.isAnimationBlocked ||
        (this.parent && this.parent.isTreeAnimationBlocked()) ||
        false
      );
    }
    startUpdate() {
      if (!this.isUpdateBlocked()) {
        this.isUpdating = true;
        if (this.nodes) {
          this.nodes.forEach(fc);
        }
        this.animationId++;
      }
    }
    getTransformTemplate() {
      let { visualElement } = this.options;
      return visualElement && visualElement.getProps().transformTemplate;
    }
    willUpdate(e = true) {
      this.root.hasTreeAnimated = true;
      if (this.root.isUpdateBlocked()) {
        if (this.options.onExitComplete) {
          this.options.onExitComplete();
        }
        return;
      }
      if (
        window.MotionCancelOptimisedAnimation &&
        !this.hasCheckedOptimisedAppear
      ) {
        Zs(this);
      }
      if (!this.root.isUpdating) {
        this.root.startUpdate();
      }
      if (this.isLayoutDirty) {
        return;
      }
      this.isLayoutDirty = true;
      for (let e = 0; e < this.path.length; e++) {
        let t = this.path[e];
        t.shouldResetTransform = true;
        if (
          typeof t.latestValues.x == `string` ||
          typeof t.latestValues.y == `string`
        ) {
          t.isLayoutDirty = true;
        }
        t.updateScroll(`snapshot`);
        if (t.options.layoutRoot) {
          t.willUpdate(false);
        }
      }
      let { layoutId, layout } = this.options;
      if (layoutId === undefined && !layout) {
        return;
      }
      let r = this.getTransformTemplate();
      this.prevTransformTemplateValue = r
        ? r(this.latestValues, ``)
        : undefined;
      this.updateSnapshot();
      if (e) {
        this.notifyListeners(`willUpdate`);
      }
    }
    update() {
      this.updateScheduled = false;
      if (this.isUpdateBlocked()) {
        let e = this.updateBlockedByResize;
        this.unblockUpdate();
        this.updateBlockedByResize = false;
        this.clearAllSnapshots();
        if (e) {
          this.nodes.forEach(ac);
        }
        this.nodes.forEach(ic);
        return;
      }
      if (this.animationId <= this.animationCommitId) {
        this.nodes.forEach(oc);
        return;
      }
      this.animationCommitId = this.animationId;
      if (this.isUpdating) {
        this.isUpdating = false;
        this.nodes.forEach(sc);
        this.nodes.forEach(cc);
        this.nodes.forEach($s);
        this.nodes.forEach(ec);
      } else {
        this.nodes.forEach(oc);
      }
      this.clearAllSnapshots();
      let e = F.now();
      state.delta = A(0, 1000 / 60, e - state.timestamp);
      state.timestamp = e;
      state.isProcessing = true;
      steps.update.process(state);
      steps.preRender.process(state);
      steps.render.process(state);
      state.isProcessing = false;
    }
    didUpdate() {
      if (!this.updateScheduled) {
        this.updateScheduled = true;
        schedule_1.read(this.scheduleUpdate);
      }
    }
    clearAllSnapshots() {
      this.nodes.forEach(rc);
      this.sharedNodes.forEach(pc);
    }
    scheduleUpdateProjection() {
      if (!this.projectionUpdateScheduled) {
        this.projectionUpdateScheduled = true;
        schedule.preRender(this.updateProjection, false, true);
      }
    }
    scheduleCheckAfterUnmount() {
      schedule.postRender(() => {
        if (this.isLayoutDirty) {
          this.root.didUpdate();
        } else {
          this.root.checkUpdateFailed();
        }
      });
    }
    updateSnapshot() {
      if (!this.snapshot && this.instance) {
        this.snapshot = this.measure();
        if (
          this.snapshot &&
          !os(this.snapshot.measuredBox.x) &&
          !os(this.snapshot.measuredBox.y)
        ) {
          this.snapshot = undefined;
        }
      }
    }
    updateLayout() {
      if (
        !this.instance ||
        (this.updateScroll(),
        !(this.options.alwaysMeasureLayout && this.isLead()) &&
          !this.isLayoutDirty)
      ) {
        return;
      }
      if (this.resumeFrom && !this.resumeFrom.instance) {
        for (let e = 0; e < this.path.length; e++) {
          this.path[e].updateScroll();
        }
      }
      let layout = this.layout;
      this.layout = this.measure(false);
      this.layoutVersion++;
      this.layoutCorrected ||= G();
      this.isLayoutDirty = false;
      this.projectionDelta = undefined;
      this.notifyListeners(`measure`, this.layout.layoutBox);
      let { visualElement } = this.options;
      if (visualElement) {
        visualElement.notify(
          `LayoutMeasure`,
          this.layout.layoutBox,
          layout ? layout.layoutBox : undefined,
        );
      }
    }
    updateScroll(phase = `measure`) {
      let t = !!(this.options.layoutScroll && this.instance);
      if (
        this.scroll &&
        this.scroll.animationId === this.root.animationId &&
        this.scroll.phase === phase
      ) {
        t = false;
      }
      if (t && this.instance) {
        let isRoot = checkIsScrollRoot(this.instance);
        this.scroll = {
          animationId: this.root.animationId,
          phase,
          isRoot,
          offset: measureScroll(this.instance),
          wasRoot: this.scroll ? this.scroll.isRoot : isRoot,
        };
      }
    }
    resetTransform() {
      if (!resetTransform) {
        return;
      }
      let e =
        this.isLayoutDirty ||
        this.shouldResetTransform ||
        this.options.alwaysMeasureLayout;
      let t = this.projectionDelta && !xs(this.projectionDelta);
      let n = this.getTransformTemplate();
      let r = n ? n(this.latestValues, ``) : undefined;
      let a = r !== this.prevTransformTemplateValue;
      if (e && this.instance && (t || ua(this.latestValues) || a)) {
        resetTransform(this.instance, r);
        this.shouldResetTransform = false;
        this.scheduleRender();
      }
    }
    measure(e = true) {
      let measuredBox = this.measurePageBox();
      let layoutBox = this.removeElementScroll(measuredBox);
      if (e) {
        layoutBox = this.removeTransform(layoutBox);
      }
      xc(layoutBox);
      return {
        animationId: this.root.animationId,
        measuredBox,
        layoutBox,
        latestValues: {},
        source: this.id,
      };
    }
    measurePageBox() {
      let { visualElement } = this.options;
      if (!visualElement) {
        return G();
      }
      let t = visualElement.measureViewportBox();
      if (!(this.scroll?.wasRoot || this.path.some(Cc))) {
        let { scroll } = this.root;
        if (scroll) {
          ba(t.x, scroll.offset.x);
          ba(t.y, scroll.offset.y);
        }
      }
      return t;
    }
    removeElementScroll(e) {
      let t = G();
      es(t, e);
      if (this.scroll?.wasRoot) {
        return t;
      }
      for (let n = 0; n < this.path.length; n++) {
        let r = this.path[n];
        let { scroll, options } = r;
        if (r !== this.root && scroll && options.layoutScroll) {
          if (scroll.wasRoot) {
            es(t, e);
          }
          ba(t.x, scroll.offset.x);
          ba(t.y, scroll.offset.y);
        }
      }
      return t;
    }
    applyTransform(e, t = false, n) {
      let r = n || G();
      es(r, e);
      for (let e = 0; e < this.path.length; e++) {
        let n = this.path[e];
        if (!t && n.options.layoutScroll && n.scroll && n !== n.root) {
          ba(r.x, -n.scroll.offset.x);
          ba(r.y, -n.scroll.offset.y);
        }
        if (ua(n.latestValues)) {
          Ca(r, n.latestValues, n.layout?.layoutBox);
        }
      }
      if (ua(this.latestValues)) {
        Ca(r, this.latestValues, this.layout?.layoutBox);
      }
      return r;
    }
    removeTransform(e) {
      let t = G();
      es(t, e);
      for (let e = 0; e < this.path.length; e++) {
        let n = this.path[e];
        if (!ua(n.latestValues)) {
          continue;
        }
        let r;
        if (n.instance) {
          if (la(n.latestValues)) {
            n.updateSnapshot();
          }
          r = G();
          es(r, n.measurePageBox());
        }
        ys(t, n.latestValues, n.snapshot?.layoutBox, r);
      }
      if (ua(this.latestValues)) {
        ys(t, this.latestValues);
      }
      return t;
    }
    setTargetDelta(e) {
      this.targetDelta = e;
      this.root.scheduleUpdateProjection();
      this.isProjectionDirty = true;
    }
    setOptions(e) {
      this.options = {
        ...this.options,
        ...e,
        crossfade: e.crossfade === undefined || e.crossfade,
      };
    }
    clearMeasurements() {
      this.scroll = undefined;
      this.layout = undefined;
      this.snapshot = undefined;
      this.prevTransformTemplateValue = undefined;
      this.targetDelta = undefined;
      this.target = undefined;
      this.isLayoutDirty = false;
    }
    forceRelativeParentToResolveTarget() {
      if (
        this.relativeParent &&
        this.relativeParent.resolvedRelativeTargetAt !== state.timestamp
      ) {
        this.relativeParent.resolveTargetDelta(true);
      }
    }
    resolveTargetDelta(e = false) {
      let t = this.getLead();
      this.isProjectionDirty ||= t.isProjectionDirty;
      this.isTransformDirty ||= t.isTransformDirty;
      this.isSharedProjectionDirty ||= t.isSharedProjectionDirty;
      let n = !!this.resumingFrom || this !== t;
      if (!(
        e ||
        (n && this.isSharedProjectionDirty) ||
        this.isProjectionDirty ||
        this.parent?.isProjectionDirty ||
        this.attemptToResolveRelativeTarget ||
        this.root.updateBlockedByResize
      )) {
        return;
      }
      let { layout, layoutId } = this.options;
      if (!this.layout || !(layout || layoutId)) {
        return;
      }
      this.resolvedRelativeTargetAt = state.timestamp;
      let a = this.getClosestProjectingParent();
      if (
        a &&
        this.linkedParentVersion !== a.layoutVersion &&
        !a.options.layoutRoot
      ) {
        this.removeRelativeTarget();
      }
      !this.targetDelta &&
        !this.relativeTarget &&
        (this.options.layoutAnchor !== false && a && a.layout
          ? this.createRelativeTarget(
              a,
              this.layout.layoutBox,
              a.layout.layoutBox,
            )
          : this.removeRelativeTarget());
      (this.relativeTarget || this.targetDelta) &&
        (this.target ||
          ((this.target = G()), (this.targetWithTransforms = G())),
        this.relativeTarget &&
        this.relativeTargetOrigin &&
        this.relativeParent &&
        this.relativeParent.target
          ? (this.forceRelativeParentToResolveTarget(),
            ds(
              this.target,
              this.relativeTarget,
              this.relativeParent.target,
              this.options.layoutAnchor || undefined,
            ))
          : this.targetDelta
            ? (this.resumingFrom
                ? this.applyTransform(this.layout.layoutBox, false, this.target)
                : es(this.target, this.layout.layoutBox),
              ga(this.target, this.targetDelta))
            : es(this.target, this.layout.layoutBox),
        this.attemptToResolveRelativeTarget &&
          ((this.attemptToResolveRelativeTarget = false),
          this.options.layoutAnchor !== false &&
          a &&
          !!a.resumingFrom == !!this.resumingFrom &&
          !a.options.layoutScroll &&
          a.target &&
          this.animationProgress !== 1
            ? this.createRelativeTarget(a, this.target, a.target)
            : (this.relativeParent = this.relativeTarget = undefined)),
        oo.value && Ks.calculatedTargetDeltas++);
    }
    getClosestProjectingParent() {
      if (!(
        !this.parent ||
        la(this.parent.latestValues) ||
        da(this.parent.latestValues)
      )) {
        if (this.parent.isProjecting()) {
          return this.parent;
        }
        return this.parent.getClosestProjectingParent();
      }
    }
    isProjecting() {
      return !!(
        (this.relativeTarget || this.targetDelta || this.options.layoutRoot) &&
        this.layout
      );
    }
    createRelativeTarget(e, t, n) {
      this.relativeParent = e;
      this.linkedParentVersion = e.layoutVersion;
      this.forceRelativeParentToResolveTarget();
      this.relativeTarget = G();
      this.relativeTargetOrigin = G();
      ps(
        this.relativeTargetOrigin,
        t,
        n,
        this.options.layoutAnchor || undefined,
      );
      es(this.relativeTarget, this.relativeTargetOrigin);
    }
    removeRelativeTarget() {
      this.relativeParent = this.relativeTarget = undefined;
    }
    calcProjection() {
      let e = this.getLead();
      let t = !!this.resumingFrom || this !== e;
      let n = true;
      if (this.isProjectionDirty || this.parent?.isProjectionDirty) {
        n = false;
      }
      if (t && (this.isSharedProjectionDirty || this.isTransformDirty)) {
        n = false;
      }
      if (this.resolvedRelativeTargetAt === state.timestamp) {
        n = false;
      }
      if (n) {
        return;
      }
      let { layout, layoutId } = this.options;
      this.isTreeAnimating = !!(
        (this.parent && this.parent.isTreeAnimating) ||
        this.currentAnimation ||
        this.pendingAnimation
      );
      if (!this.isTreeAnimating) {
        this.targetDelta = this.relativeTarget = undefined;
      }
      if (!this.layout || !(layout || layoutId)) {
        return;
      }
      es(this.layoutCorrected, this.layout.layoutBox);
      let a = this.treeScale.x;
      let o = this.treeScale.y;
      ya(this.layoutCorrected, this.treeScale, this.path, t);
      if (
        e.layout &&
        !e.target &&
        (this.treeScale.x !== 1 || this.treeScale.y !== 1)
      ) {
        e.target = e.layout.layoutBox;
        e.targetWithTransforms = G();
      }
      let { target } = e;
      if (!target) {
        if (this.prevProjectionDelta) {
          this.createProjectionDeltas();
          this.scheduleRender();
        }
        return;
      }
      if (!this.projectionDelta || !this.prevProjectionDelta) {
        this.createProjectionDeltas();
      } else {
        ts(this.prevProjectionDelta.x, this.projectionDelta.x);
        ts(this.prevProjectionDelta.y, this.projectionDelta.y);
      }
      ls(this.projectionDelta, this.layoutCorrected, target, this.latestValues);
      if (
        this.treeScale.x !== a ||
        this.treeScale.y !== o ||
        !Ds(this.projectionDelta.x, this.prevProjectionDelta.x) ||
        !Ds(this.projectionDelta.y, this.prevProjectionDelta.y)
      ) {
        this.hasProjected = true;
        this.scheduleRender();
        this.notifyListeners(`projectionUpdate`, target);
      }
      oo.value && Ks.calculatedProjections++;
    }
    hide() {
      this.isVisible = false;
    }
    show() {
      this.isVisible = true;
    }
    scheduleRender(e = true) {
      this.options.visualElement?.scheduleRender();
      if (e) {
        let e = this.getStack();
        if (e) {
          e.scheduleRender();
        }
      }
      if (this.resumingFrom && !this.resumingFrom.instance) {
        this.resumingFrom = undefined;
      }
    }
    createProjectionDeltas() {
      this.prevProjectionDelta = lo();
      this.projectionDelta = lo();
      this.projectionDeltaWithTransform = lo();
    }
    setAnimationOrigin(e, t = false, n) {
      let snapshot = this.snapshot;
      let i = snapshot ? snapshot.latestValues : {};
      let a = {
        ...this.latestValues,
      };
      let o = lo();
      if (!this.relativeParent || !this.relativeParent.options.layoutRoot) {
        this.relativeTarget = this.relativeTargetOrigin = undefined;
      }
      this.attemptToResolveRelativeTarget = !t;
      let s = G();
      let c =
        (snapshot ? snapshot.source : undefined) !==
        (this.layout ? this.layout.source : undefined);
      let l = this.getStack();
      let u = !l || l.members.length <= 1;
      let d = !(
        !c ||
        u ||
        this.options.crossfade !== true ||
        this.path.some(gc)
      );
      this.animationProgress = 0;
      let f;
      let p = n?.interpolateProjection(e);
      this.mixTargetDelta = (t) => {
        let n = t / 1000;
        let r = p?.(n);
        if (r) {
          o.x.translate = r.x;
          o.x.scale = R(e.x.scale, 1, n);
          o.x.origin = e.x.origin;
          o.x.originPoint = e.x.originPoint;
          o.y.translate = r.y;
          o.y.scale = R(e.y.scale, 1, n);
          o.y.origin = e.y.origin;
          o.y.originPoint = e.y.originPoint;
        } else {
          mc(o.x, e.x, n);
          mc(o.y, e.y, n);
        }
        this.setTargetDelta(o);
        if (
          this.relativeTarget &&
          this.relativeTargetOrigin &&
          this.layout &&
          this.relativeParent &&
          this.relativeParent.layout
        ) {
          ps(
            s,
            this.layout.layoutBox,
            this.relativeParent.layout.layoutBox,
            this.options.layoutAnchor || undefined,
          );
          J(this.relativeTarget, this.relativeTargetOrigin, s, n);
          if (f && Cs(this.relativeTarget, f)) {
            this.isProjectionDirty = false;
          }
          f ||= G();
          es(f, this.relativeTarget);
        }
        if (c) {
          this.animationValues = a;
          Ns(a, i, this.latestValues, n, d, u);
        }
        if (r && r.rotate !== undefined) {
          this.animationValues ||= a;
          this.animationValues.pathRotation = r.rotate;
        }
        this.root.scheduleUpdateProjection();
        this.scheduleRender();
        this.animationProgress = n;
      };
      this.mixTargetDelta(this.options.layoutRoot ? 1000 : 0);
    }
    startAnimation(e) {
      this.notifyListeners(`animationStart`);
      this.currentAnimation?.stop();
      this.resumingFrom?.currentAnimation?.stop();
      this.pendingAnimation &&= (cancel(this.pendingAnimation), undefined);
      this.pendingAnimation = schedule.update(() => {
        Gs.hasAnimatedSinceResize = true;
        this.motionValue ||= oi(0);
        this.motionValue.jump(0, false);
        this.currentAnimation = Rs(this.motionValue, [0, 1000], {
          ...e,
          velocity: 0,
          isSync: true,
          onUpdate: (t) => {
            this.mixTargetDelta(t);
            if (e.onUpdate) {
              e.onUpdate(t);
            }
          },
          onComplete: () => {
            if (e.onComplete) {
              e.onComplete();
            }
            this.completeAnimation();
          },
        });
        Nn(this.currentAnimation, this);
        if (this.resumingFrom) {
          this.resumingFrom.currentAnimation = this.currentAnimation;
        }
        this.pendingAnimation = undefined;
      });
    }
    completeAnimation() {
      if (this.resumingFrom) {
        this.resumingFrom.currentAnimation = undefined;
        this.resumingFrom.preserveOpacity = undefined;
      }
      let e = this.getStack();
      if (e) {
        e.exitAnimationComplete();
      }
      this.resumingFrom =
        this.currentAnimation =
        this.animationValues =
          undefined;
      this.notifyListeners(`animationComplete`);
    }
    finishAnimation() {
      if (this.currentAnimation) {
        if (this.mixTargetDelta) {
          this.mixTargetDelta(Js);
        }
        this.currentAnimation.stop();
      }
      this.completeAnimation();
    }
    applyTransformsToTarget() {
      let e = this.getLead();
      let { targetWithTransforms, layout, latestValues } = e;
      let { target } = e;
      if (targetWithTransforms && target && layout) {
        if (
          this !== e &&
          this.layout &&
          layout &&
          Sc(
            this.options.animationType,
            this.layout.layoutBox,
            layout.layoutBox,
          )
        ) {
          target = this.target || G();
          let t = os(this.layout.layoutBox.x);
          target.x.min = e.target.x.min;
          target.x.max = target.x.min + t;
          let n = os(this.layout.layoutBox.y);
          target.y.min = e.target.y.min;
          target.y.max = target.y.min + n;
        }
        es(targetWithTransforms, target);
        Ca(targetWithTransforms, latestValues);
        ls(
          this.projectionDeltaWithTransform,
          this.layoutCorrected,
          targetWithTransforms,
          latestValues,
        );
      }
    }
    registerSharedNode(e, t) {
      if (!this.sharedNodes.has(e)) {
        this.sharedNodes.set(e, new Ws());
      }
      this.sharedNodes.get(e).add(t);
      let initialPromotionConfig = t.options.initialPromotionConfig;
      t.promote({
        transition: initialPromotionConfig
          ? initialPromotionConfig.transition
          : undefined,
        preserveFollowOpacity:
          initialPromotionConfig &&
          initialPromotionConfig.shouldPreserveFollowOpacity
            ? initialPromotionConfig.shouldPreserveFollowOpacity(t)
            : undefined,
      });
    }
    isLead() {
      let e = this.getStack();
      return !e || e.lead === this;
    }
    getLead() {
      let { layoutId } = this.options;
      return (layoutId && this.getStack()?.lead) || this;
    }
    getPrevLead() {
      let { layoutId } = this.options;
      if (layoutId) {
        return this.getStack()?.prevLead;
      }
    }
    getStack() {
      let { layoutId } = this.options;
      if (layoutId) {
        return this.root.sharedNodes.get(layoutId);
      }
    }
    promote({ needsReset, transition, preserveFollowOpacity } = {}) {
      let r = this.getStack();
      if (r) {
        r.promote(this, preserveFollowOpacity);
      }
      if (needsReset) {
        this.projectionDelta = undefined;
        this.needsReset = true;
      }
      if (transition) {
        this.setOptions({
          transition,
        });
      }
    }
    relegate() {
      let e = this.getStack();
      if (e) {
        return e.relegate(this);
      }
      return false;
    }
    resetSkewAndRotation() {
      let { visualElement } = this.options;
      if (!visualElement) {
        return;
      }
      let t = false;
      let { latestValues } = visualElement;
      if (
        latestValues.z ||
        latestValues.rotate ||
        latestValues.rotateX ||
        latestValues.rotateY ||
        latestValues.rotateZ ||
        latestValues.skewX ||
        latestValues.skewY
      ) {
        t = true;
      }
      if (!t) {
        return;
      }
      let r = {};
      if (latestValues.z) {
        Xs(`z`, visualElement, r, this.animationValues);
      }
      for (let t = 0; t < qs.length; t++) {
        Xs(`rotate${qs[t]}`, visualElement, r, this.animationValues);
        Xs(`skew${qs[t]}`, visualElement, r, this.animationValues);
      }
      visualElement.render();
      for (let t in r) {
        visualElement.setStaticValue(t, r[t]);
        if (this.animationValues) {
          this.animationValues[t] = r[t];
        }
      }
      visualElement.scheduleRender();
    }
    applyProjectionStyles(e, t) {
      if (!this.instance || this.isSVG) {
        return;
      }
      if (!this.isVisible) {
        e.visibility = `hidden`;
        return;
      }
      let n = this.getTransformTemplate();
      if (this.needsReset) {
        this.needsReset = false;
        e.visibility = ``;
        e.opacity = ``;
        e.pointerEvents = Us(t?.pointerEvents) || ``;
        e.transform = n ? n(this.latestValues, ``) : `none`;
        return;
      }
      let r = this.getLead();
      if (!this.projectionDelta || !this.layout || !r.target) {
        if (this.options.layoutId) {
          e.opacity =
            this.latestValues.opacity === undefined
              ? 1
              : this.latestValues.opacity;
          e.pointerEvents = Us(t?.pointerEvents) || ``;
        }
        if (this.hasProjected && !ua(this.latestValues)) {
          e.transform = n ? n({}, ``) : `none`;
          this.hasProjected = false;
        }
        return;
      }
      e.visibility = ``;
      let i = r.animationValues || r.latestValues;
      this.applyTransformsToTarget();
      let a = ks(this.projectionDeltaWithTransform, this.treeScale, i);
      if (n) {
        a = n(i, a);
      }
      e.transform = a;
      let { x, y } = this.projectionDelta;
      e.transformOrigin = `${x.origin * 100}% ${y.origin * 100}% 0`;
      e.opacity = r.animationValues
        ? r === this
          ? (i.opacity ?? this.latestValues.opacity ?? 1)
          : this.preserveOpacity
            ? this.latestValues.opacity
            : i.opacityExit
        : r === this
          ? i.opacity === undefined
            ? ``
            : i.opacity
          : i.opacityExit === undefined
            ? 0
            : i.opacityExit;
      for (let t in No) {
        if (i[t] === undefined) {
          continue;
        }
        let { correct, applyTo, isCSSVariable } = No[t];
        let c = a === `none` ? i[t] : correct(i[t], r);
        if (applyTo) {
          let t = applyTo.length;
          for (let n = 0; n < t; n++) {
            e[applyTo[n]] = c;
          }
        } else {
          if (isCSSVariable) {
            this.options.visualElement.renderState.vars[t] = c;
          } else {
            e[t] = c;
          }
        }
      }
      if (this.options.layoutId) {
        e.pointerEvents = r === this ? Us(t?.pointerEvents) || `` : `none`;
      }
    }
    clearSnapshot() {
      this.resumeFrom = this.snapshot = undefined;
    }
    resetTree() {
      this.root.nodes.forEach((e) => e.currentAnimation?.stop());
      this.root.nodes.forEach(ic);
      this.root.sharedNodes.clear();
    }
  };
}
function $s(e) {
  e.updateLayout();
}
function ec(e) {
  let snapshot_1 = e.resumeFrom?.snapshot || e.snapshot;
  if (e.isLead() && e.layout && snapshot_1 && e.hasListeners(`didUpdate`)) {
    let { layoutBox, measuredBox } = e.layout;
    let { animationType } = e.options;
    let a = snapshot_1.source !== e.layout.source;
    if (animationType === `size`) {
      Os((e) => {
        let r = a ? snapshot_1.measuredBox[e] : snapshot_1.layoutBox[e];
        let i = os(r);
        r.min = layoutBox[e].min;
        r.max = r.min + i;
      });
    } else if (animationType === `x` || animationType === `y`) {
      let e = animationType === `x` ? `y` : `x`;
      $o(a ? snapshot_1.measuredBox[e] : snapshot_1.layoutBox[e], layoutBox[e]);
    } else {
      if (Sc(animationType, snapshot_1.layoutBox, layoutBox)) {
        Os((r) => {
          let i = a ? snapshot_1.measuredBox[r] : snapshot_1.layoutBox[r];
          let o = os(layoutBox[r]);
          i.max = i.min + o;
          if (e.relativeTarget && !e.currentAnimation) {
            e.isProjectionDirty = true;
            e.relativeTarget[r].max = e.relativeTarget[r].min + o;
          }
        });
      }
    }
    let layoutDelta = lo();
    ls(layoutDelta, layoutBox, snapshot_1.layoutBox);
    let delta = lo();
    if (a) {
      ls(delta, e.applyTransform(measuredBox, true), snapshot_1.measuredBox);
    } else {
      ls(delta, layoutBox, snapshot_1.layoutBox);
    }
    let hasLayoutChanged = !xs(layoutDelta);
    let hasRelativeLayoutChanged = false;
    if (!e.resumeFrom) {
      let r = e.getClosestProjectingParent();
      if (r && !r.resumeFrom) {
        let { snapshot, layout } = r;
        if (snapshot && layout) {
          let o = e.options.layoutAnchor || undefined;
          let s = G();
          ps(s, snapshot_1.layoutBox, snapshot.layoutBox, o);
          let c = G();
          ps(c, layoutBox, layout.layoutBox, o);
          if (!Ts(s, c)) {
            hasRelativeLayoutChanged = true;
          }
          if (r.options.layoutRoot) {
            e.relativeTarget = c;
            e.relativeTargetOrigin = s;
            e.relativeParent = r;
          }
        }
      }
    }
    e.notifyListeners(`didUpdate`, {
      layout: layoutBox,
      snapshot: snapshot_1,
      delta,
      layoutDelta,
      hasLayoutChanged,
      hasRelativeLayoutChanged,
    });
  } else if (e.isLead()) {
    let { onExitComplete } = e.options;
    if (onExitComplete) {
      onExitComplete();
    }
  }
  e.options.transition = undefined;
}
function tc(e) {
  oo.value && Ks.nodes++;
  if (e.parent) {
    if (!e.isProjecting()) {
      e.isProjectionDirty = e.parent.isProjectionDirty;
    }
    e.isSharedProjectionDirty ||= !!(
      e.isProjectionDirty ||
      e.parent.isProjectionDirty ||
      e.parent.isSharedProjectionDirty
    );
    e.isTransformDirty ||= e.parent.isTransformDirty;
  }
}
function nc(e) {
  e.isProjectionDirty = e.isSharedProjectionDirty = e.isTransformDirty = false;
}
function rc(e) {
  e.clearSnapshot();
}
function ic(e) {
  e.clearMeasurements();
}
function ac(e) {
  e.isLayoutDirty = true;
  e.updateLayout();
}
function oc(e) {
  e.isLayoutDirty = false;
}
function sc(e) {
  if (e.isAnimationBlocked && e.layout && !e.isLayoutDirty) {
    e.snapshot = e.layout;
    e.isLayoutDirty = true;
  }
}
function cc(e) {
  let { visualElement } = e.options;
  if (visualElement && visualElement.getProps().onBeforeLayoutMeasure) {
    visualElement.notify(`BeforeLayoutMeasure`);
  }
  e.resetTransform();
}
function lc(e) {
  e.finishAnimation();
  e.targetDelta = e.relativeTarget = e.target = undefined;
  e.isProjectionDirty = true;
}
function uc(e) {
  e.resolveTargetDelta();
}
function dc(e) {
  e.calcProjection();
}
function fc(e) {
  e.resetSkewAndRotation();
}
function pc(e) {
  e.removeLeadSnapshot();
}
function mc(e, t, n) {
  e.translate = R(t.translate, 0, n);
  e.scale = R(t.scale, 1, n);
  e.origin = t.origin;
  e.originPoint = t.originPoint;
}
function hc(e, t, n, r) {
  e.min = R(t.min, n.min, r);
  e.max = R(t.max, n.max, r);
}
function J(e, t, n, r) {
  hc(e.x, t.x, n.x, r);
  hc(e.y, t.y, n.y, r);
}
function gc(e) {
  return e.animationValues && e.animationValues.opacityExit !== undefined;
}
var _c = {
  duration: 0.45,
  ease: [0.4, 0, 0.1, 1],
};
const vc = (e) =>
  typeof navigator < `u` &&
  navigator.userAgent &&
  navigator.userAgent.toLowerCase().includes(e);
const yc = vc(`applewebkit/`) && !vc(`chrome/`) ? Math.round : linear;
function bc(e) {
  e.min = yc(e.min);
  e.max = yc(e.max);
}
function xc(layoutBox) {
  bc(layoutBox.x);
  bc(layoutBox.y);
}
function Sc(animationType, layoutBox, n) {
  return (
    animationType === `position` ||
    (animationType === `preserve-aspect` && !ss(Es(layoutBox), Es(n), 0.2))
  );
}
function Cc(e) {
  return e !== e.root && e.scroll?.wasRoot;
}
const wc = Qs({
  attachResizeListener: (e, t) => zs(e, `resize`, t),
  measureScroll: () => ({
    x: document.documentElement.scrollLeft || document.body?.scrollLeft || 0,
    y: document.documentElement.scrollTop || document.body?.scrollTop || 0,
  }),
  checkIsScrollRoot: () => true,
});
const Tc = {
  current: undefined,
};
const ProjectionNode = Qs({
  measureScroll: (e) => ({
    x: e.scrollLeft,
    y: e.scrollTop,
  }),
  defaultParent: () => {
    if (!Tc.current) {
      let e = new wc({});
      e.mount(window);
      e.setOptions({
        layoutScroll: true,
      });
      Tc.current = e;
    }
    return Tc.current;
  },
  resetTransform: (e, t) => {
    e.style.transform = t === undefined ? `none` : t;
  },
  checkIsScrollRoot: (e) => window.getComputedStyle(e).position === `fixed`,
});
const DcContext = E.createContext({
  transformPagePoint: (e) => e,
  isStatic: false,
  reducedMotion: `never`,
});
function Oc(e, t) {
  if (typeof e == `function`) {
    return e(t);
  }
  if (e != null) {
    e.current = t;
  }
}
function kc(...e) {
  return (t) => {
    let n = false;
    let r = e.map((e) => {
      let r = Oc(e, t);
      if (!n && typeof r == `function`) {
        n = true;
      }
      return r;
    });
    if (n) {
      return () => {
        for (let t = 0; t < r.length; t++) {
          let n = r[t];
          if (typeof n == `function`) {
            n();
          } else {
            Oc(e[t], null);
          }
        }
      };
    }
  };
}
function useAc(...e) {
  return E.useCallback(kc(...e), e);
}
const Y = t();
class Jc1 extends E.Component {
  getSnapshotBeforeUpdate(e) {
    let current = this.props.childRef.current;
    if (
      U(current) &&
      e.isPresent &&
      !this.props.isPresent &&
      this.props.pop !== false
    ) {
      let e = current.offsetParent;
      let n = (U(e) && e.offsetWidth) || 0;
      let r = (U(e) && e.offsetHeight) || 0;
      let i = getComputedStyle(current);
      let a = this.props.sizeRef.current;
      a.height = parseFloat(i.height);
      a.width = parseFloat(i.width);
      a.top = current.offsetTop;
      a.left = current.offsetLeft;
      a.right = n - a.width - a.left;
      a.bottom = r - a.height - a.top;
      a.direction = i.direction;
    }
    return null;
  }
  componentDidUpdate() {}
  render() {
    return this.props.children;
  }
}
function McComponent({ children, isPresent, anchorX, anchorY, root, pop }) {
  let o = E.useId();
  let sRef = E.useRef(null);
  let cRef = E.useRef({
    width: 0,
    height: 0,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    direction: `ltr`,
  });
  let { nonce } = E.useContext(DcContext);
  let u = useAc(
    sRef,
    pop === false ? undefined : (children.props?.ref ?? children?.ref),
  );
  E.useInsertionEffect(() => {
    let { width, height, top, left, right, bottom, direction } = cRef.current;
    if (isPresent || pop === false || !sRef.current || !width || !height) {
      return;
    }
    let g = direction === `rtl`;
    let _ =
      anchorX === `left`
        ? g
          ? `right: ${right}`
          : `left: ${left}`
        : g
          ? `left: ${left}`
          : `right: ${right}`;
    let v = anchorY === `bottom` ? `bottom: ${bottom}` : `top: ${top}`;
    sRef.current.dataset.motionPopId = o;
    let y = document.createElement(`style`);
    if (nonce) {
      y.nonce = nonce;
    }
    let b = root ?? document.head;
    b.appendChild(y);
    if (y.sheet) {
      y.sheet.insertRule(`
          [data-motion-pop-id="${o}"] {
            position: absolute !important;
            width: ${width}px !important;
            height: ${height}px !important;
            ${_}px !important;
            ${v}px !important;
          }
        `);
    }
    return () => {
      sRef.current?.removeAttribute(`data-motion-pop-id`);
      if (b.contains(y)) {
        b.removeChild(y);
      }
    };
  }, [isPresent]);
  return (
    <Jc1 isPresent={isPresent} childRef={sRef} sizeRef={cRef} pop={pop}>
      {pop === false
        ? children
        : E.cloneElement(children, {
            ref: u,
          })}
    </Jc1>
  );
}
const NcComponent = ({
  children,
  initial,
  isPresent,
  onExitComplete,
  custom,
  presenceAffectsLayout,
  mode,
  anchorX,
  anchorY,
  root,
}) => {
  let u = useO(Pc);
  let id_1 = E.useId();
  let fRef = E.useRef(isPresent);
  let pRef = E.useRef(onExitComplete);
  k(() => {
    fRef.current = isPresent;
    pRef.current = onExitComplete;
  });
  let m = true;
  let h = E.useMemo(() => {
    m = false;
    return {
      id: id_1,
      initial,
      isPresent,
      custom,
      onExitComplete: (e) => {
        u.set(e, true);
        for (let e of u.values()) {
          if (!e) {
            return;
          }
        }
        if (onExitComplete) {
          onExitComplete();
        }
      },
      register: (e) => {
        u.set(e, false);
        return () => {
          u.delete(e);
          !fRef.current && !u.size && pRef.current?.();
        };
      },
    };
  }, [isPresent, u, onExitComplete]);
  if (presenceAffectsLayout && m) {
    h = {
      ...h,
    };
  }
  E.useMemo(() => {
    u.forEach((e, t) => u.set(t, false));
  }, [isPresent]);
  E.useEffect(() => {
    if (!isPresent && !u.size && onExitComplete) {
      onExitComplete();
    }
  }, [isPresent]);
  children = (
    <McComponent
      pop={mode === `popLayout`}
      isPresent={isPresent}
      anchorX={anchorX}
      anchorY={anchorY}
      root={root}
    >
      {children}
    </McComponent>
  );
  return <EeContext.Provider value={h}>{children}</EeContext.Provider>;
};
function Pc() {
  return new Map();
}
function useFc(e = true) {
  let t = E.useContext(EeContext);
  if (t === null) {
    return [true, null];
  }
  let { isPresent, onExitComplete, register } = t;
  let a = E.useId();
  E.useEffect(() => {
    if (e) {
      return register(a);
    }
  }, [e]);
  let o = E.useCallback(
    () => e && onExitComplete && onExitComplete(a),
    [a, onExitComplete, e],
  );
  if (!isPresent && onExitComplete) {
    return [false, o];
  }
  return [true];
}
const Ic = (e) => e.key || ``;
function Lc(e) {
  let t = [];
  E.Children.forEach(e, (e) => {
    if (E.isValidElement(e)) {
      t.push(e);
    }
  });
  return t;
}
const RcComponent = ({
  children,
  custom,
  initial = true,
  onExitComplete,
  presenceAffectsLayout = true,
  mode = `sync`,
  propagate = false,
  anchorX = `left`,
  anchorY = `top`,
  root,
}) => {
  let [u, d] = useFc(propagate);
  let f = E.useMemo(() => Lc(children), [children]);
  let p = propagate && !u ? [] : f.map(Ic);
  let mRef = E.useRef(true);
  let hRef = E.useRef(f);
  let g = useO(() => new Map());
  let _RefRef = E.useRef(new Set());
  let [v, setV] = E.useState(f);
  let [b, setB] = E.useState(f);
  k(() => {
    propagate && !u && !b.length && d?.();
  }, [u, propagate, b.length, d]);
  k(() => {
    mRef.current = false;
    hRef.current = f;
    for (let e = 0; e < b.length; e++) {
      let t = Ic(b[e]);
      if (p.includes(t)) {
        g.delete(t);
        _RefRef.current.delete(t);
      } else if (g.get(t) !== true) {
        g.set(t, false);
      }
    }
  }, [b, p.length, p.join(`-`)]);
  let S = [];
  if (f !== v) {
    let e = [...f];
    let t = 0;
    for (let n of b) {
      let r = p.indexOf(Ic(n));
      if (r === -1) {
        e.splice(t++, 0, n);
        S.push(n);
      } else {
        t = r + S.length + 1;
      }
    }
    if (mode === `wait` && S.length) {
      e = S;
    }
    setB(Lc(e));
    setV(f);
    return null;
  }
  let { forceRender } = E.useContext(DContext);
  return (
    <>
      {b.map((e) => {
        let v = Ic(e);
        let isPresent = propagate && !u ? false : f === b || p.includes(v);
        return (
          <NcComponent
            key={v}
            isPresent={isPresent}
            initial={!mRef.current || initial ? undefined : false}
            custom={custom}
            presenceAffectsLayout={presenceAffectsLayout}
            mode={mode}
            root={root}
            onExitComplete={
              isPresent
                ? undefined
                : () => {
                    if (_RefRef.current.has(v)) {
                      return;
                    }
                    if (g.has(v)) {
                      _RefRef.current.add(v);
                      g.set(v, true);
                    } else {
                      return;
                    }
                    let e = true;
                    g.forEach((t) => {
                      if (!t) {
                        e = false;
                      }
                    });
                    if (e) {
                      forceRender?.();
                      setB(hRef.current);
                      propagate && d?.();
                      if (onExitComplete) {
                        onExitComplete();
                      }
                    }
                  }
            }
            anchorX={anchorX}
            anchorY={anchorY}
          >
            {e}
          </NcComponent>
        );
      })}
    </>
  );
};
const ZcContext = E.createContext({
  strict: false,
});
const Bc = {
  animation: [
    `animate`,
    `variants`,
    `whileHover`,
    `whileTap`,
    `exit`,
    `whileInView`,
    `whileFocus`,
    `whileDrag`,
  ],
  exit: [`exit`],
  drag: [`drag`, `dragControls`],
  focus: [`whileFocus`],
  hover: [`whileHover`, `onHoverStart`, `onHoverEnd`],
  tap: [`whileTap`, `onTap`, `onTapStart`, `onTapCancel`],
  pan: [`onPan`, `onPanStart`, `onPanSessionStart`, `onPanEnd`],
  inView: [`whileInView`, `onViewportEnter`, `onViewportLeave`],
  layout: [`layout`, `layoutId`],
};
let Vc = false;
function Hc() {
  if (Vc) {
    return;
  }
  let e = {};
  for (let t in Bc) {
    e[t] = {
      isEnabled: (e) => Bc[t].some((t) => !!e[t]),
    };
  }
  q(e);
  Vc = true;
}
function Uc() {
  Hc();
  return To();
}
function X(e) {
  let t = Uc();
  for (let n in e) {
    t[n] = {
      ...t[n],
      ...e[n],
    };
  }
  q(t);
}
function WcComponent({ children, ...rest }) {
  let n = E.useContext(DcContext);
  rest = {
    ...n,
    ...rest,
  };
  rest.transition = si(rest.transition, n.transition);
  rest.isStatic = useO(() => rest.isStatic);
  let r = E.useMemo(
    () => rest,
    [
      JSON.stringify(rest.transition),
      rest.transformPagePoint,
      rest.reducedMotion,
      rest.skipAnimations,
      rest.isValidProp,
    ],
  );
  return <DcContext.Provider value={r}>{children}</DcContext.Provider>;
}
const ZContext = E.createContext({});
function Gc(e, t) {
  if (_o(e)) {
    let { initial, animate } = e;
    return {
      initial: initial === false || mo(initial) ? initial : undefined,
      animate: mo(animate) ? animate : undefined,
    };
  }
  if (e.inherit === false) {
    return {};
  }
  return t;
}
function useKc(e) {
  let { initial, animate } = Gc(e, E.useContext(ZContext));
  return E.useMemo(
    () => ({
      initial,
      animate,
    }),
    [qc(initial), qc(animate)],
  );
}
function qc(e) {
  if (Array.isArray(e)) {
    return e.join(` `);
  }
  return e;
}
const Jc = () => ({
  style: {},
  transform: {},
  transformOrigin: {},
  vars: {},
});
function Yc(e, t, n) {
  for (let r in t) {
    if (!Di(t[r]) && !Po(r, n)) {
      e[r] = t[r];
    }
  }
}
function useXc({ transformTemplate }, t) {
  return E.useMemo(() => {
    let n = Jc();
    $i(n, t, transformTemplate);
    return {
      ...n.vars,
      ...n.style,
    };
  }, [t]);
}
function Zc(e, t) {
  let n = e.style || {};
  let r = {};
  Yc(r, n, e);
  Object.assign(r, useXc(e, t));
  return r;
}
function Qc(e, t) {
  let n = {};
  let r = Zc(e, t);
  if (e.drag && e.dragListener !== false) {
    n.draggable = false;
    r.userSelect = r.WebkitUserSelect = r.WebkitTouchCallout = `none`;
    r.touchAction =
      e.drag === true ? `none` : `pan-${e.drag === `x` ? `y` : `x`}`;
  }
  if (e.tabIndex === undefined && (e.onTap || e.onTapStart || e.whileTap)) {
    n.tabIndex = 0;
  }
  n.style = r;
  return n;
}
const $c = () => ({
  ...Jc(),
  attrs: {},
});
function useEl(e, t, n, r) {
  let i = E.useMemo(() => {
    let n = $c();
    ia(n, t, zo(r), e.transformTemplate, e.style);
    return {
      ...n.attrs,
      style: {
        ...n.style,
      },
    };
  }, [t]);
  if (e.style) {
    let t = {};
    Yc(t, e.style, e);
    i.style = {
      ...t,
      ...i.style,
    };
  }
  return i;
}
const tl = new Set(
  `animate.exit.variants.initial.style.values.variants.transition.transformTemplate.custom.inherit.onBeforeLayoutMeasure.onAnimationStart.onAnimationComplete.onUpdate.onDragStart.onDrag.onDragEnd.onMeasureDragConstraints.onDirectionLock.onDragTransitionEnd._dragX._dragY.onHoverStart.onHoverEnd.onViewportEnter.onViewportLeave.globalTapTarget.propagate.ignoreStrict.viewport`.split(
    `.`,
  ),
);
function nl(e) {
  return (
    e.startsWith(`while`) ||
    (e.startsWith(`drag`) && e !== `draggable`) ||
    e.startsWith(`layout`) ||
    e.startsWith(`onTap`) ||
    e.startsWith(`onPan`) ||
    e.startsWith(`onLayout`) ||
    tl.has(e)
  );
}
function rl(e, t) {
  if (e.startsWith(`on`)) {
    return !nl(e);
  }
  return t?.(e) ?? !nl(e);
}
function il(e, t, n, r) {
  let i = {};
  for (let a in e) {
    (a !== `values` || typeof e.values != `object`) &&
      (Di(e[a]) ||
        ((rl(a, r) ||
          (n === true && nl(a)) ||
          (!t && !nl(a)) ||
          (e.draggable && a.startsWith(`onDrag`))) &&
          (i[a] = e[a])));
  }
  return i;
}
const al = [
  `animate`,
  `circle`,
  `defs`,
  `desc`,
  `ellipse`,
  `g`,
  `image`,
  `line`,
  `filter`,
  `marker`,
  `mask`,
  `metadata`,
  `path`,
  `pattern`,
  `polygon`,
  `polyline`,
  `rect`,
  `stop`,
  `switch`,
  `symbol`,
  `svg`,
  `text`,
  `tspan`,
  `use`,
  `view`,
];
function ol(e) {
  if (typeof e != `string` || e.includes(`-`)) {
    return false;
  }
  return !!(al.indexOf(e) > -1 || /[A-Z]/u.test(e));
}
function useSl(e, t, n, { latestValues }, isStatic, a = false, o, isValidProp) {
  let c = ((o ?? ol(e)) ? useEl : Qc)(t, latestValues, isStatic, e);
  let l = il(t, typeof e == `string`, a, isValidProp);
  let u =
    e === E.Fragment
      ? {}
      : {
          ...l,
          ...c,
          ref: n,
        };
  let { children } = t;
  let f = E.useMemo(() => {
    if (Di(children)) {
      return children.get();
    }
    return children;
  }, [children]);
  return E.createElement(e, {
    ...u,
    children: f,
  });
}
function cl({ scrapeMotionValuesFromProps, createRenderState }, n, r, i) {
  return {
    latestValues: ll(n, r, i, scrapeMotionValuesFromProps),
    renderState: createRenderState(),
  };
}
function ll(e, t, n, scrapeMotionValuesFromProps) {
  let i = {};
  let a = scrapeMotionValuesFromProps(e, {});
  for (let e in a) {
    i[e] = Us(a[e]);
  }
  let { initial, animate } = e;
  let c = _o(e);
  let l = vo(e);
  t &&
    l &&
    !c &&
    e.inherit !== false &&
    (initial === undefined && (initial = t.initial),
    animate === undefined && (animate = t.animate));
  let u = n ? n.initial === false : false;
  u ||= initial === false;
  let d = u ? animate : initial;
  if (d && typeof d != `boolean` && !po(d)) {
    let t = Array.isArray(d) ? d : [d];
    for (let n = 0; n < t.length; n++) {
      let r = bi(e, t[n]);
      if (r) {
        let { transitionEnd, transition, ...rest } = r;
        for (let e in rest) {
          let t = rest[e];
          if (Array.isArray(t)) {
            let e = u ? t.length - 1 : 0;
            t = t[e];
          }
          if (t !== null) {
            i[e] = t;
          }
        }
        for (let t in transitionEnd) {
          i[t] = transitionEnd[t];
        }
      }
    }
  }
  return i;
}
const ul = (e) => (t, n) => {
  let r = E.useContext(ZContext);
  let i = E.useContext(EeContext);
  let a = () => cl(e, t, r, i);
  if (n) {
    return a();
  }
  return useO(a);
};
const dl = ul({
  scrapeMotionValuesFromProps: Fo,
  createRenderState: Jc,
});
const fl = ul({
  scrapeMotionValuesFromProps: Vo,
  createRenderState: $c,
});
const pl = Symbol.for(`motionComponentSymbol`);
function useMl(e, visualElement, n) {
  let rRef = E.useRef(n);
  E.useInsertionEffect(() => {
    rRef.current = n;
  });
  let iRef = E.useRef(null);
  return E.useCallback(
    (n) => {
      n && e.onMount?.(n);
      visualElement && (n ? visualElement.mount(n) : visualElement.unmount());
      let rRef_current = rRef.current;
      if (typeof rRef_current == `function`) {
        if (n) {
          let e = rRef_current(n);
          if (typeof e == `function`) {
            iRef.current = e;
          }
        } else {
          if (iRef.current) {
            iRef.current();
            iRef.current = null;
          } else {
            rRef_current(n);
          }
        }
      } else {
        if (rRef_current) {
          rRef_current.current = n;
        }
      }
    },
    [visualElement],
  );
}
const HlContext = E.createContext({});
function gl(dragConstraints) {
  return (
    dragConstraints &&
    typeof dragConstraints == `object` &&
    Object.prototype.hasOwnProperty.call(dragConstraints, `current`)
  );
}
function useL(e, visualState, props, r, ProjectionNode, isSVG) {
  let { visualElement } = E.useContext(ZContext);
  let s = E.useContext(ZcContext);
  let presenceContext = E.useContext(EeContext);
  let l = E.useContext(DcContext);
  let l_reducedMotion = l.reducedMotion;
  let l_skipAnimations = l.skipAnimations;
  let fRef = E.useRef(null);
  let pRef = E.useRef(false);
  r ||= s.renderer;
  if (!fRef.current && r) {
    fRef.current = r(e, {
      visualState,
      parent: visualElement,
      props,
      presenceContext,
      blockInitialAnimation: presenceContext
        ? presenceContext.initial === false
        : false,
      reducedMotionConfig: l_reducedMotion,
      skipAnimations: l_skipAnimations,
      isSVG,
    });
    if (pRef.current && fRef.current) {
      fRef.current.manuallyAnimateOnMount = true;
    }
  }
  let fRef_current = fRef.current;
  let h = E.useContext(HlContext);
  if (
    fRef_current &&
    !fRef_current.projection &&
    ProjectionNode &&
    (fRef_current.type === `html` || fRef_current.type === `svg`)
  ) {
    vl(fRef.current, props, ProjectionNode, h);
  }
  let gRef = E.useRef(false);
  E.useInsertionEffect(() => {
    if (fRef_current && gRef.current) {
      fRef_current.update(props, presenceContext);
    }
  });
  let _ = props[ji];
  let vRef = E.useRef(
    !!_ &&
      typeof window < `u` &&
      !window.MotionHandoffIsComplete?.(_) &&
      window.MotionHasOptimisedAnimation?.(_),
  );
  k(() => {
    if (pRef.current && fRef_current) {
      fRef_current.animationState?.animateChanges();
      fRef_current.enteringChildren = undefined;
    }
  }, []);
  k(() => {
    pRef.current = true;
    if (fRef_current) {
      gRef.current = true;
      window.MotionIsMounted = true;
      fRef_current.updateFeatures();
      fRef_current.scheduleRenderMicrotask();
      if (vRef.current && fRef_current.animationState) {
        fRef_current.animationState.animateChanges();
      }
    }
  });
  E.useEffect(() => {
    if (fRef_current) {
      if (!vRef.current && fRef_current.animationState) {
        fRef_current.animationState.animateChanges();
      }
      vRef.current &&=
        (queueMicrotask(() => {
          window.MotionHandoffMarkAsComplete?.(_);
        }),
        false);
      fRef_current.enteringChildren = undefined;
    }
  });
  return fRef_current;
}
function vl(visualElement, props, n, initialPromotionConfig) {
  let {
    layoutId,
    layout,
    drag,
    dragConstraints,
    layoutScroll,
    layoutRoot,
    layoutAnchor,
    layoutCrossfade,
  } = props;
  visualElement.projection = new n(
    visualElement.latestValues,
    props[`data-framer-portal-id`] ? undefined : yl(visualElement.parent),
  );
  visualElement.projection.setOptions({
    layoutId,
    layout,
    alwaysMeasureLayout: !!drag || (dragConstraints && gl(dragConstraints)),
    visualElement,
    animationType: typeof layout == `string` ? layout : `both`,
    initialPromotionConfig,
    crossfade: layoutCrossfade,
    layoutScroll,
    layoutRoot,
    layoutAnchor,
  });
}
function yl(parent) {
  if (parent) {
    if (parent.options.allowProjection === false) {
      return yl(parent.parent);
    }
    return parent.projection;
  }
}
function bl(e, { forwardMotionProps = false, type } = {}, r, i) {
  if (r) {
    X(r);
  }
  let a = type ? type === `svg` : ol(e);
  let o = a ? fl : dl;
  function SComponent(n, s) {
    let c;
    let l = {
      ...E.useContext(DcContext),
      ...n,
      layoutId: useXl(n),
    };
    let { isStatic, isValidProp } = l;
    let f = useKc(n);
    let p = o(n, isStatic);
    if (!isStatic && typeof window < `u`) {
      Sl(l, r);
      let t = Cl(l);
      c = t.MeasureLayout;
      f.visualElement = useL(e, p, l, i, t.ProjectionNode, a);
    }
    return (
      <ZContext.Provider value={f}>
        {c && f.visualElement
          ? Y.jsx(c, {
              visualElement: f.visualElement,
              ...l,
            })
          : null}
        {useSl(
          e,
          n,
          useMl(p, f.visualElement, s),
          p,
          isStatic,
          forwardMotionProps,
          a,
          isValidProp,
        )}
      </ZContext.Provider>
    );
  }
  SComponent.displayName = `motion.${typeof e == `string` ? e : `create(${e.displayName ?? e.name ?? ``})`}`;
  let c = E.forwardRef(SComponent);
  c[pl] = e;
  return c;
}
function useXl({ layoutId }) {
  let t = E.useContext(DContext).id;
  if (t && layoutId !== undefined) {
    return t + `-` + layoutId;
  }
  return layoutId;
}
function Sl(e, t) {
  E.useContext(ZcContext).strict;
}
function Cl(e) {
  let { drag, layout } = Uc();
  if (!drag && !layout) {
    return {};
  }
  let r = {
    ...drag,
    ...layout,
  };
  return {
    MeasureLayout:
      drag?.isEnabled(e) || layout?.isEnabled(e) ? r.MeasureLayout : undefined,
    ProjectionNode: r.ProjectionNode,
  };
}
function wl(e, t) {
  if (typeof Proxy > `u`) {
    return bl;
  }
  let n = new Map();
  let r = (n, r) => bl(n, r, e, t);
  return new Proxy((e, t) => r(e, t), {
    get: (i, a) => {
      if (a === `create`) {
        return r;
      }
      return (n.has(a) || n.set(a, bl(a, undefined, e, t)), n.get(a));
    },
  });
}
const Tl = (e, t) => {
  if (t.isSVG ?? ol(e)) {
    return new Ho(t);
  }
  return new Lo(t, {
    allowProjection: e !== E.Fragment,
  });
};
class El extends Oo {
  constructor(e) {
    super(e);
    e.animationState ||= Yo(e);
  }
  updateAnimationControlsSubscription() {
    let { animate } = this.node.getProps();
    if (po(animate)) {
      this.unmountControls = animate.subscribe(this.node);
    }
  }
  mount() {
    this.updateAnimationControlsSubscription();
  }
  update() {
    let { animate } = this.node.getProps();
    let { animate: animate_1 } = this.node.prevProps || {};
    if (animate !== animate_1) {
      this.updateAnimationControlsSubscription();
    }
  }
  unmount() {
    this.node.animationState.reset();
    this.unmountControls?.();
  }
}
let Dl = 0;
const Ol = {
  animation: {
    Feature: El,
  },
  exit: {
    Feature: class extends Oo {
      constructor() {
        super(...arguments);
        this.id = Dl++;
        this.isExitComplete = false;
      }
      update() {
        if (!this.node.presenceContext) {
          return;
        }
        let { isPresent, onExitComplete } = this.node.presenceContext;
        let { isPresent: isPresent_1 } = this.node.prevPresenceContext || {};
        if (!this.node.animationState || isPresent === isPresent_1) {
          return;
        }
        if (isPresent && isPresent_1 === false) {
          if (this.isExitComplete) {
            let { initial, custom } = this.node.getProps();
            if (
              typeof initial == `string` ||
              (typeof initial == `object` && initial && !Array.isArray(initial))
            ) {
              let n = xi(this.node, initial, custom);
              if (n) {
                let { transition, transitionEnd, ...rest } = n;
                for (let e in rest) {
                  this.node.getValue(e)?.jump(rest[e]);
                }
              }
            }
            this.node.blockInitialAnimation = false;
            this.node.animationState.reset();
            this.node.animationState.animateChanges();
          } else {
            this.node.animationState.setActive(`exit`, false);
          }
          this.isExitComplete = false;
          this.exitAnimation = undefined;
          return;
        }
        let r = (this.exitAnimation = this.node.animationState.setActive(
          `exit`,
          !isPresent,
        ));
        if (onExitComplete && !isPresent) {
          r.then(() => {
            if (this.exitAnimation === r) {
              this.isExitComplete = true;
              onExitComplete(this.id);
            }
          });
        }
      }
      mount() {
        let { register, onExitComplete } = this.node.presenceContext || {};
        if (onExitComplete) {
          onExitComplete(this.id);
        }
        if (register) {
          this.unmount = register(this.id);
        }
      }
      unmount() {}
    },
  },
};
function kl(e) {
  return {
    point: {
      x: e.pageX,
      y: e.pageY,
    },
  };
}
const Al = (e) => (t) => Pa(t) && e(t, kl(t));
function jl(e, t, n, r) {
  return zs(e, t, Al(n), r);
}
const Ml = ({ current }) => {
  if (current) {
    return current.ownerDocument.defaultView;
  }
  return null;
};
const Nl = (e, t) => Math.abs(e - t);
function Pl(offset, t) {
  let n = Nl(offset.x, t.x);
  let r = Nl(offset.y, t.y);
  return Math.sqrt(n ** 2 + r ** 2);
}
const Fl = new Set([`auto`, `scroll`]);
class Il {
  constructor(
    e,
    t,
    {
      transformPagePoint,
      contextWindow = window,
      dragSnapToOrigin = false,
      distanceThreshold = 3,
      element,
    } = {},
  ) {
    this.startEvent = null;
    this.lastMoveEvent = null;
    this.lastMoveEventInfo = null;
    this.lastRawMoveEventInfo = null;
    this.handlers = {};
    this.contextWindow = window;
    this.scrollPositions = new Map();
    this.removeScrollListeners = null;
    this.onElementScroll = (e) => {
      this.handleScroll(e.target);
    };
    this.onWindowScroll = () => {
      this.handleScroll(window);
    };
    this.updatePoint = () => {
      if (!(this.lastMoveEvent && this.lastMoveEventInfo)) {
        return;
      }
      this.hasPendingMove = false;
      if (this.lastRawMoveEventInfo) {
        this.lastMoveEventInfo = Ll(
          this.lastRawMoveEventInfo,
          this.transformPagePoint,
        );
      }
      let e = zl(this.lastMoveEventInfo, this.history);
      let t = this.startEvent !== null;
      let n =
        Pl(e.offset, {
          x: 0,
          y: 0,
        }) >= this.distanceThreshold;
      if (!t && !n) {
        return;
      }
      let { point } = e;
      this.history.push({
        ...point,
        timestamp: F.now(),
      });
      let { onStart, onMove } = this.handlers;
      if (!t) {
        if (onStart) {
          onStart(this.lastMoveEvent, e);
        }
        this.startEvent = this.lastMoveEvent;
      }
      if (onMove) {
        onMove(this.lastMoveEvent, e);
      }
    };
    this.handlePointerMove = (e, t) => {
      this.lastMoveEvent = e;
      this.lastRawMoveEventInfo = t;
      this.lastMoveEventInfo = Ll(t, this.transformPagePoint);
      this.hasPendingMove = true;
      schedule.update(this.updatePoint, true);
    };
    this.handlePointerUp = (e, t) => {
      if (this.hasPendingMove) {
        this.updatePoint();
      }
      this.end();
      let { onEnd, onSessionEnd, resumeAnimation } = this.handlers;
      if ((this.dragSnapToOrigin || !this.startEvent) && resumeAnimation) {
        resumeAnimation();
      }
      if (!(this.lastMoveEvent && this.lastMoveEventInfo)) {
        return;
      }
      let a = zl(
        e.type === `pointercancel`
          ? this.lastMoveEventInfo
          : Ll(t, this.transformPagePoint),
        this.history,
      );
      if (this.startEvent && onEnd) {
        onEnd(e, a);
      }
      if (onSessionEnd) {
        onSessionEnd(e, a);
      }
    };
    if (!Pa(e)) {
      return;
    }
    this.dragSnapToOrigin = dragSnapToOrigin;
    this.handlers = t;
    this.transformPagePoint = transformPagePoint;
    this.distanceThreshold = distanceThreshold;
    this.contextWindow = contextWindow || window;
    let s = Ll(kl(e), this.transformPagePoint);
    let { point } = s;
    let { timestamp } = state;
    this.history = [
      {
        ...point,
        timestamp,
      },
    ];
    let { onSessionStart } = t;
    if (onSessionStart) {
      onSessionStart(e, zl(s, this.history));
    }
    let d = {
      passive: true,
      capture: true,
    };
    this.removeListeners = se(
      jl(this.contextWindow, `pointermove`, this.handlePointerMove, d),
      jl(this.contextWindow, `pointerup`, this.handlePointerUp, d),
      jl(this.contextWindow, `pointercancel`, this.handlePointerUp, d),
    );
    if (element) {
      this.startScrollTracking(element);
    }
  }
  startScrollTracking({ parentElement }) {
    while (parentElement) {
      let e = getComputedStyle(parentElement);
      if (Fl.has(e.overflowX) || Fl.has(e.overflowY)) {
        this.scrollPositions.set(parentElement, {
          x: parentElement.scrollLeft,
          y: parentElement.scrollTop,
        });
      }
      parentElement = parentElement.parentElement;
    }
    this.scrollPositions.set(window, {
      x: window.scrollX,
      y: window.scrollY,
    });
    window.addEventListener(`scroll`, this.onElementScroll, {
      capture: true,
    });
    window.addEventListener(`scroll`, this.onWindowScroll);
    this.removeScrollListeners = () => {
      window.removeEventListener(`scroll`, this.onElementScroll, {
        capture: true,
      });
      window.removeEventListener(`scroll`, this.onWindowScroll);
    };
  }
  handleScroll(e) {
    let t = this.scrollPositions.get(e);
    if (!t) {
      return;
    }
    let n = e === window;
    let r = n
      ? {
          x: window.scrollX,
          y: window.scrollY,
        }
      : {
          x: e.scrollLeft,
          y: e.scrollTop,
        };
    let i = {
      x: r.x - t.x,
      y: r.y - t.y,
    };
    if (i.x !== 0 || i.y !== 0) {
      n
        ? this.lastMoveEventInfo &&
          ((this.lastMoveEventInfo.point.x += i.x),
          (this.lastMoveEventInfo.point.y += i.y))
        : this.history.length > 0 &&
          ((this.history[0].x -= i.x), (this.history[0].y -= i.y));
      this.scrollPositions.set(e, r);
      schedule.update(this.updatePoint, true);
    }
  }
  updateHandlers(e) {
    this.handlers = e;
  }
  end() {
    if (this.removeListeners) {
      this.removeListeners();
    }
    if (this.removeScrollListeners) {
      this.removeScrollListeners();
    }
    this.scrollPositions.clear();
    cancel(this.updatePoint);
  }
}
function Ll(e, transformPagePoint) {
  if (transformPagePoint) {
    return {
      point: transformPagePoint(e.point),
    };
  }
  return e;
}
function Rl(point, t) {
  return {
    x: point.x - t.x,
    y: point.y - t.y,
  };
}
function zl({ point }, history) {
  return {
    point,
    delta: Rl(point, Bl(history)),
    offset: Rl(point, Q(history)),
    velocity: Vl(history, 0.1),
  };
}
function Q(e) {
  return e[0];
}
function Bl(e) {
  return e[e.length - 1];
}
function Vl(e, t) {
  if (e.length < 2) {
    return {
      x: 0,
      y: 0,
    };
  }
  let n = e.length - 1;
  let r = null;
  let i = Bl(e);
  while (n >= 0 && ((r = e[n]), !(i.timestamp - r.timestamp > N(t)))) {
    n--;
  }
  if (!r) {
    return {
      x: 0,
      y: 0,
    };
  }
  if (r === e[0] && e.length > 2 && i.timestamp - r.timestamp > N(t) * 2) {
    r = e[1];
  }
  let a = ue(i.timestamp - r.timestamp);
  if (a === 0) {
    return {
      x: 0,
      y: 0,
    };
  }
  let o = {
    x: (i.x - r.x) / a,
    y: (i.y - r.y) / a,
  };
  if (o.x === Infinity) {
    o.x = 0;
  }
  if (o.y === Infinity) {
    o.y = 0;
  }
  return o;
}
function Hl(e, { min, max }, r) {
  if (min !== undefined && e < min) {
    e = r ? R(min, e, r.min) : Math.max(e, min);
  } else if (max !== undefined && e > max) {
    e = r ? R(max, e, r.max) : Math.min(e, max);
  }
  return e;
}
function Ul(e, t, n) {
  return {
    min: t === undefined ? undefined : e.min + t,
    max: n === undefined ? undefined : e.max + n - (e.max - e.min),
  };
}
function Wl(layoutBox, { top, left, bottom, right }) {
  return {
    x: Ul(layoutBox.x, left, right),
    y: Ul(layoutBox.y, top, bottom),
  };
}
function Gl(e, t) {
  let min = t.min - e.min;
  let max = t.max - e.max;
  if (t.max - t.min < e.max - e.min) {
    [min, max] = [max, min];
  }
  return {
    min,
    max,
  };
}
function Kl(layoutBox, t) {
  return {
    x: Gl(layoutBox.x, t.x),
    y: Gl(layoutBox.y, t.y),
  };
}
function ql(e, t) {
  let n = 0.5;
  let r = os(e);
  let i = os(t);
  if (i > r) {
    n = ce(t.min, t.max - r, e.min);
  } else if (r > i) {
    n = ce(e.min, e.max - i, t.min);
  }
  return A(0, 1, n);
}
function Jl(e, t) {
  let n = {};
  if (t.min !== undefined) {
    n.min = t.min - e.min;
  }
  if (t.max !== undefined) {
    n.max = t.max - e.min;
  }
  return n;
}
const Yl = 0.35;
function Xl(e = Yl) {
  if (e === false) {
    e = 0;
  } else if (e === true) {
    e = Yl;
  }
  return {
    x: Zl(e, `left`, `right`),
    y: Zl(e, `top`, `bottom`),
  };
}
function Zl(e, t, n) {
  return {
    min: Ql(e, t),
    max: Ql(e, n),
  };
}
function Ql(e, t) {
  if (typeof e == `number`) {
    return e;
  }
  return e[t] || 0;
}
const $l = new WeakMap();
class eu {
  constructor(e) {
    this.openDragLock = null;
    this.isDragging = false;
    this.currentDirection = null;
    this.originPoint = {
      x: 0,
      y: 0,
    };
    this.constraints = false;
    this.hasMutatedConstraints = false;
    this.elastic = G();
    this.latestPointerEvent = null;
    this.latestPanInfo = null;
    this.visualElement = e;
  }
  start(e, { snapToCursor = false, distanceThreshold } = {}) {
    let { presenceContext } = this.visualElement;
    if (presenceContext && presenceContext.isPresent === false) {
      return;
    }
    let onSessionStart = (e) => {
      if (snapToCursor) {
        this.snapToCursor(e);
      }
      this.stopAnimation();
    };
    let onStart = (e, t) => {
      let { drag, dragPropagation, onDragStart } = this.getProps();
      if (
        drag &&
        !dragPropagation &&
        (this.openDragLock && this.openDragLock(),
        (this.openDragLock = ka(drag)),
        !this.openDragLock)
      ) {
        return;
      }
      this.latestPointerEvent = e;
      this.latestPanInfo = t;
      this.isDragging = true;
      this.currentDirection = null;
      this.resolveConstraints();
      if (this.visualElement.projection) {
        this.visualElement.projection.isAnimationBlocked = true;
        this.visualElement.projection.target = undefined;
      }
      Os((e) => {
        let t = this.getAxisMotionValue(e).get() || 0;
        if (dt.test(t)) {
          let { projection } = this.visualElement;
          if (projection && projection.layout) {
            let r = projection.layout.layoutBox[e];
            if (r) {
              t = os(r) * (parseFloat(t) / 100);
            }
          }
        }
        this.originPoint[e] = t;
      });
      if (onDragStart) {
        schedule.update(() => onDragStart(e, t), false, true);
      }
      ki(this.visualElement, `transform`);
      let { animationState } = this.visualElement;
      if (animationState) {
        animationState.setActive(`whileDrag`, true);
      }
    };
    let onMove = (e, t) => {
      this.latestPointerEvent = e;
      this.latestPanInfo = t;
      let { dragPropagation, dragDirectionLock, onDirectionLock, onDrag } =
        this.getProps();
      if (!dragPropagation && !this.openDragLock) {
        return;
      }
      let { offset } = t;
      if (dragDirectionLock && this.currentDirection === null) {
        this.currentDirection = iu(offset);
        if (this.currentDirection !== null && onDirectionLock) {
          onDirectionLock(this.currentDirection);
        }
        return;
      }
      this.updateAxis(`x`, t.point, offset);
      this.updateAxis(`y`, t.point, offset);
      this.visualElement.render();
      if (onDrag) {
        schedule.update(() => onDrag(e, t), false, true);
      }
    };
    let onSessionEnd = (e, t) => {
      this.latestPointerEvent = e;
      this.latestPanInfo = t;
      this.stop(e, t);
      this.latestPointerEvent = null;
      this.latestPanInfo = null;
    };
    let resumeAnimation = () => {
      let { dragSnapToOrigin } = this.getProps();
      if (dragSnapToOrigin || this.constraints) {
        this.startAnimation({
          x: 0,
          y: 0,
        });
      }
    };
    let { dragSnapToOrigin } = this.getProps();
    this.panSession = new Il(
      e,
      {
        onSessionStart,
        onStart,
        onMove,
        onSessionEnd,
        resumeAnimation,
      },
      {
        transformPagePoint: this.visualElement.getTransformPagePoint(),
        dragSnapToOrigin,
        distanceThreshold,
        contextWindow: Ml(this.visualElement),
        element: this.visualElement.current,
      },
    );
  }
  stop(e, t) {
    let n = e || this.latestPointerEvent;
    let r = t || this.latestPanInfo;
    let isDragging = this.isDragging;
    this.cancel();
    if (!isDragging || !r || !n) {
      return;
    }
    let { velocity } = r;
    this.startAnimation(velocity);
    let { onDragEnd } = this.getProps();
    if (onDragEnd) {
      schedule.postRender(() => onDragEnd(n, r));
    }
  }
  cancel() {
    this.isDragging = false;
    let { projection, animationState } = this.visualElement;
    if (projection) {
      projection.isAnimationBlocked = false;
    }
    this.endPanSession();
    let { dragPropagation } = this.getProps();
    if (!dragPropagation && this.openDragLock) {
      this.openDragLock();
      this.openDragLock = null;
    }
    if (animationState) {
      animationState.setActive(`whileDrag`, false);
    }
  }
  endPanSession() {
    if (this.panSession) {
      this.panSession.end();
    }
    this.panSession = undefined;
  }
  updateAxis(e, t, n) {
    let { drag } = this.getProps();
    if (!n || !ru(e, drag, this.currentDirection)) {
      return;
    }
    let i = this.getAxisMotionValue(e);
    let a = this.originPoint[e] + n[e];
    if (this.constraints && this.constraints[e]) {
      a = Hl(a, this.constraints[e], this.elastic[e]);
    }
    i.set(a);
  }
  resolveConstraints() {
    let { dragConstraints, dragElastic } = this.getProps();
    let n =
      this.visualElement.projection && !this.visualElement.projection.layout
        ? this.visualElement.projection.measure(false)
        : this.visualElement.projection?.layout;
    let constraints = this.constraints;
    if (dragConstraints && gl(dragConstraints)) {
      this.constraints ||= this.resolveRefConstraints();
    } else {
      this.constraints =
        dragConstraints && n ? Wl(n.layoutBox, dragConstraints) : false;
    }
    this.elastic = Xl(dragElastic);
    if (
      constraints !== this.constraints &&
      !gl(dragConstraints) &&
      n &&
      this.constraints &&
      !this.hasMutatedConstraints
    ) {
      Os((e) => {
        if (this.constraints !== false && this.getAxisMotionValue(e)) {
          this.constraints[e] = Jl(n.layoutBox[e], this.constraints[e]);
        }
      });
    }
  }
  resolveRefConstraints() {
    let { dragConstraints, onMeasureDragConstraints } = this.getProps();
    if (!dragConstraints || !gl(dragConstraints)) {
      return false;
    }
    let dragConstraints_current = dragConstraints.current;
    let { projection } = this.visualElement;
    if (!projection || !projection.layout) {
      return false;
    }
    if (projection.root) {
      projection.root.scroll = undefined;
      projection.root.updateScroll();
    }
    let i = W(
      dragConstraints_current,
      projection.root,
      this.visualElement.getTransformPagePoint(),
    );
    let a = Kl(projection.layout.layoutBox, i);
    if (onMeasureDragConstraints) {
      let e = onMeasureDragConstraints(oa(a));
      this.hasMutatedConstraints = !!e;
      if (e) {
        a = aa(e);
      }
    }
    return a;
  }
  startAnimation(e) {
    let {
      drag,
      dragMomentum,
      dragElastic,
      dragTransition,
      dragSnapToOrigin,
      onDragTransitionEnd,
    } = this.getProps();
    let s = this.constraints || {};
    let c = Os((o) => {
      if (!ru(o, drag, this.currentDirection)) {
        return;
      }
      let c = (s && s[o]) || {};
      if (dragSnapToOrigin === true || dragSnapToOrigin === o) {
        c = {
          min: 0,
          max: 0,
        };
      }
      let bounceStiffness = dragElastic ? 200 : 1000000;
      let bounceDamping = dragElastic ? 40 : 10000000;
      let d = {
        type: `inertia`,
        velocity: dragMomentum ? e[o] : 0,
        bounceStiffness,
        bounceDamping,
        timeConstant: 750,
        restDelta: 1,
        restSpeed: 10,
        ...dragTransition,
        ...c,
      };
      return this.startAxisValueAnimation(o, d);
    });
    return Promise.all(c).then(onDragTransitionEnd);
  }
  startAxisValueAnimation(e, t) {
    let n = this.getAxisMotionValue(e);
    ki(this.visualElement, e);
    return n.start(hi(e, n, 0, t, this.visualElement, false));
  }
  stopAnimation() {
    Os((e) => this.getAxisMotionValue(e).stop());
  }
  getAxisMotionValue(e) {
    let t = `_drag${e.toUpperCase()}`;
    return (
      this.visualElement.getProps()[t] ||
      this.visualElement.getValue(e, this.visualElement.latestValues[e] ?? 0)
    );
  }
  snapToCursor({ clientX, clientY }) {
    let { drag } = this.getProps();
    let r = {
      x: clientX,
      y: clientY,
    };
    let i = this.visualElement.getTransformPagePoint()?.(r) || r;
    let a = this.visualElement.measureViewportBox();
    Os((e) => {
      if (!ru(e, drag, this.currentDirection)) {
        return;
      }
      let t = this.getAxisMotionValue(e);
      let { min, max } = a[e];
      t.set((t.get() || 0) + i[e] - R(min, max, 0.5));
    });
  }
  scalePositionWithinConstraints() {
    if (!this.visualElement.current) {
      return;
    }
    let { drag, dragConstraints } = this.getProps();
    let { projection } = this.visualElement;
    if (!gl(dragConstraints) || !projection || !this.constraints) {
      return;
    }
    this.stopAnimation();
    let constraints = this.constraints;
    let i = {
      x: 0,
      y: 0,
    };
    Os((e) => {
      let t = this.getAxisMotionValue(e).get();
      i[e] = ql(
        {
          min: t,
          max: t,
        },
        constraints[e],
      );
    });
    let { transformTemplate } = this.visualElement.getProps();
    this.visualElement.current.style.transform = transformTemplate
      ? transformTemplate({}, ``)
      : `none`;
    if (projection.root) {
      projection.root.updateScroll();
    }
    projection.updateLayout();
    this.constraints = false;
    this.resolveConstraints();
    Os((t) => {
      let n = this.getAxisMotionValue(t);
      if (!ru(t, drag, null) || !n.get()) {
        return;
      }
      let { min, max } = this.constraints[t];
      n.set(R(min, max, i[t]));
    });
    this.visualElement.render();
  }
  addListeners() {
    if (!this.visualElement.current) {
      return;
    }
    $l.set(this.visualElement, this);
    let current = this.visualElement.current;
    let t = jl(current, `pointerdown`, (t) => {
      let { drag, dragListener = true } = this.getProps();
      let t_target = t.target;
      let a = t_target !== current && Ra(t_target);
      if (drag && dragListener && !a) {
        this.start(t);
      }
    });
    let n;
    let r = () => {
      let { dragConstraints } = this.getProps();
      if (gl(dragConstraints) && dragConstraints.current) {
        this.constraints = this.resolveRefConstraints();
        n ||= nu(current, dragConstraints.current, () =>
          this.scalePositionWithinConstraints(),
        );
      }
    };
    let { projection } = this.visualElement;
    let a = projection.addEventListener(`measure`, r);
    if (projection && !projection.layout) {
      if (projection.root) {
        projection.root.updateScroll();
      }
      projection.updateLayout();
    }
    schedule.read(r);
    let o = zs(window, `resize`, () => this.scalePositionWithinConstraints());
    let s = projection.addEventListener(
      `didUpdate`,
      ({ delta, hasLayoutChanged }) => {
        if (this.isDragging && hasLayoutChanged) {
          Os((t) => {
            let n = this.getAxisMotionValue(t);
            if (n) {
              this.originPoint[t] += delta[t].translate;
              n.set(n.get() + delta[t].translate);
            }
          });
          this.visualElement.render();
        }
      },
    );
    return () => {
      o();
      t();
      a();
      if (s) {
        s();
      }
      if (n) {
        n();
      }
    };
  }
  getProps() {
    let e = this.visualElement.getProps();
    let {
      drag = false,
      dragDirectionLock = false,
      dragPropagation = false,
      dragConstraints = false,
      dragElastic = Yl,
      dragMomentum = true,
    } = e;
    return {
      ...e,
      drag,
      dragDirectionLock,
      dragPropagation,
      dragConstraints,
      dragElastic,
      dragMomentum,
    };
  }
}
function tu(e) {
  let t = true;
  return () => {
    if (t) {
      t = false;
      return;
    }
    e();
  };
}
function nu(e, t, n) {
  let r = ao(e, tu(n));
  let i = ao(t, tu(n));
  return () => {
    r();
    i();
  };
}
function ru(e, drag, n) {
  return (drag === true || drag === e) && (n === null || n === e);
}
function iu(offset, t = 10) {
  let n = null;
  if (Math.abs(offset.y) > t) {
    n = `y`;
  } else if (Math.abs(offset.x) > t) {
    n = `x`;
  }
  return n;
}
class au extends Oo {
  constructor(e) {
    super(e);
    this.removeGroupControls = linear;
    this.removeListeners = linear;
    this.controls = new eu(e);
  }
  mount() {
    let { dragControls } = this.node.getProps();
    if (dragControls) {
      this.removeGroupControls = dragControls.subscribe(this.controls);
    }
    this.removeListeners = this.controls.addListeners() || linear;
  }
  update() {
    let { dragControls } = this.node.getProps();
    let { dragControls: dragControls_1 } = this.node.prevProps || {};
    if (dragControls !== dragControls_1) {
      this.removeGroupControls();
      if (dragControls) {
        this.removeGroupControls = dragControls.subscribe(this.controls);
      }
    }
  }
  unmount() {
    this.removeGroupControls();
    this.removeListeners();
    if (!this.controls.isDragging) {
      this.controls.endPanSession();
    }
  }
}
const ou = (e) => (t, n) => {
  if (e) {
    schedule.update(() => e(t, n), false, true);
  }
};
class su extends Oo {
  constructor() {
    super(...arguments);
    this.removePointerDownListener = linear;
  }
  onPointerDown(e) {
    this.session = new Il(e, this.createPanHandlers(), {
      transformPagePoint: this.node.getTransformPagePoint(),
      contextWindow: Ml(this.node),
    });
  }
  createPanHandlers() {
    let { onPanSessionStart, onPanStart, onPan, onPanEnd } =
      this.node.getProps();
    return {
      onSessionStart: ou(onPanSessionStart),
      onStart: ou(onPanStart),
      onMove: ou(onPan),
      onEnd: (e, t) => {
        delete this.session;
        if (onPanEnd) {
          schedule.postRender(() => onPanEnd(e, t));
        }
      },
    };
  }
  mount() {
    this.removePointerDownListener = jl(this.node.current, `pointerdown`, (e) =>
      this.onPointerDown(e),
    );
  }
  update() {
    if (this.session) {
      this.session.updateHandlers(this.createPanHandlers());
    }
  }
  unmount() {
    this.removePointerDownListener();
    if (this.session) {
      this.session.end();
    }
  }
}
let cu = false;
class Lu1 extends E.Component {
  componentDidMount() {
    let { visualElement, layoutGroup, switchLayoutGroup, layoutId } =
      this.props;
    let { projection } = visualElement;
    if (projection) {
      if (layoutGroup.group) {
        layoutGroup.group.add(projection);
      }
      if (switchLayoutGroup && switchLayoutGroup.register && layoutId) {
        switchLayoutGroup.register(projection);
      }
      if (cu) {
        projection.root.didUpdate();
      }
      projection.addEventListener(`animationComplete`, () => {
        this.safeToRemove();
      });
      projection.setOptions({
        ...projection.options,
        layoutDependency: this.props.layoutDependency,
        onExitComplete: () => this.safeToRemove(),
      });
    }
    Gs.hasEverUpdated = true;
  }
  getSnapshotBeforeUpdate(e) {
    let { layoutDependency, visualElement, drag, isPresent } = this.props;
    let { projection } = visualElement;
    if (projection) {
      return (
        (projection.isPresent = isPresent),
        e.layoutDependency !== layoutDependency &&
          projection.setOptions({
            ...projection.options,
            layoutDependency,
          }),
        (cu = true),
        drag ||
        e.layoutDependency !== layoutDependency ||
        layoutDependency === undefined ||
        e.isPresent !== isPresent
          ? projection.willUpdate()
          : this.safeToRemove(),
        e.isPresent !== isPresent &&
          (isPresent
            ? projection.promote()
            : projection.relegate() ||
              schedule.postRender(() => {
                let e = projection.getStack();
                if (!e || !e.members.length) {
                  this.safeToRemove();
                }
              })),
        null
      );
    }
    return null;
  }
  componentDidUpdate() {
    let { visualElement, layoutAnchor } = this.props;
    let { projection } = visualElement;
    if (projection) {
      projection.options.layoutAnchor = layoutAnchor;
      projection.root.didUpdate();
      schedule_1.postRender(() => {
        if (!projection.currentAnimation && projection.isLead()) {
          this.safeToRemove();
        }
      });
    }
  }
  componentWillUnmount() {
    let { visualElement, layoutGroup, switchLayoutGroup } = this.props;
    let { projection } = visualElement;
    cu = true;
    if (projection) {
      projection.scheduleCheckAfterUnmount();
      if (layoutGroup && layoutGroup.group) {
        layoutGroup.group.remove(projection);
      }
      if (switchLayoutGroup && switchLayoutGroup.deregister) {
        switchLayoutGroup.deregister(projection);
      }
    }
  }
  safeToRemove() {
    let { safeToRemove } = this.props;
    if (safeToRemove) {
      safeToRemove();
    }
  }
  render() {
    return null;
  }
}
function UuComponent(e) {
  let [isPresent, safeToRemove] = useFc();
  let layoutGroup = E.useContext(DContext);
  return (
    <Lu1
      {...e}
      layoutGroup={layoutGroup}
      switchLayoutGroup={E.useContext(HlContext)}
      isPresent={isPresent}
      safeToRemove={safeToRemove}
    />
  );
}
const du = {
  pan: {
    Feature: su,
  },
  drag: {
    Feature: au,
    ProjectionNode,
    MeasureLayout: UuComponent,
  },
};
function fu(node, t, n) {
  let { props } = node;
  if (node.animationState && props.whileHover) {
    node.animationState.setActive(`whileHover`, n === `Start`);
  }
  let i = props[`onHover` + n];
  if (i) {
    schedule.postRender(() => i(t, kl(t)));
  }
}
class pu extends Oo {
  mount() {
    let { current } = this.node;
    if (current) {
      this.unmount = Ma(current, (e, t) => {
        fu(this.node, t, `Start`);
        return (e) => fu(this.node, e, `End`);
      });
    }
  }
  unmount() {}
}
class mu extends Oo {
  constructor() {
    super(...arguments);
    this.isActive = false;
  }
  onFocus() {
    let e = false;
    try {
      e = this.node.current.matches(`:focus-visible`);
    } catch {
      e = true;
    }
    if (e && this.node.animationState) {
      this.node.animationState.setActive(`whileFocus`, true);
      this.isActive = true;
    }
  }
  onBlur() {
    if (this.isActive && this.node.animationState) {
      this.node.animationState.setActive(`whileFocus`, false);
      this.isActive = false;
    }
  }
  mount() {
    this.unmount = se(
      zs(this.node.current, `focus`, () => this.onFocus()),
      zs(this.node.current, `blur`, () => this.onBlur()),
    );
  }
  unmount() {}
}
function hu(node, t, n) {
  let { props } = node;
  if (node.current instanceof HTMLButtonElement && node.current.disabled) {
    return;
  }
  if (node.animationState && props.whileTap) {
    node.animationState.setActive(`whileTap`, n === `Start`);
  }
  let i = props[`onTap` + (n === `End` ? `` : n)];
  if (i) {
    schedule.postRender(() => i(t, kl(t)));
  }
}
class gu extends Oo {
  mount() {
    let { current } = this.node;
    if (!current) {
      return;
    }
    let { globalTapTarget, propagate } = this.node.props;
    this.unmount = Ga(
      current,
      (e, t) => {
        hu(this.node, t, `Start`);
        return (e, { success }) => hu(this.node, e, success ? `End` : `Cancel`);
      },
      {
        useGlobalTarget: globalTapTarget,
        stopPropagation: propagate?.tap === false,
      },
    );
  }
  unmount() {}
}
const _u = new WeakMap();
const vu = new WeakMap();
const yu = (e) => {
  let t = _u.get(e.target);
  if (t) {
    t(e);
  }
};
const bu = (e) => {
  e.forEach(yu);
};
function xu({ root, ...rest }) {
  let n = root || document;
  if (!vu.has(n)) {
    vu.set(n, {});
  }
  let r = vu.get(n);
  let i = JSON.stringify(rest);
  if (!r[i]) {
    r[i] = new IntersectionObserver(bu, {
      root,
      ...rest,
    });
  }
  return r[i];
}
function Su(e, t, n) {
  let r = xu(t);
  _u.set(e, n);
  r.observe(e);
  return () => {
    _u.delete(e);
    r.unobserve(e);
  };
}
const Cu = {
  some: 0,
  all: 1,
};
class wu extends Oo {
  constructor() {
    super(...arguments);
    this.hasEnteredView = false;
    this.isInView = false;
  }
  startObserver() {
    this.stopObserver?.();
    let { viewport = {} } = this.node.getProps();
    let { root, margin, amount = `some`, once } = viewport;
    let a = {
      root: root ? root.current : undefined,
      rootMargin: margin,
      threshold: typeof amount == `number` ? amount : Cu[amount],
    };
    let o = (e) => {
      let { isIntersecting } = e;
      if (
        this.isInView === isIntersecting ||
        ((this.isInView = isIntersecting),
        once && !isIntersecting && this.hasEnteredView)
      ) {
        return;
      }
      if (isIntersecting) {
        this.hasEnteredView = true;
      }
      if (this.node.animationState) {
        this.node.animationState.setActive(`whileInView`, isIntersecting);
      }
      let { onViewportEnter, onViewportLeave } = this.node.getProps();
      let a = isIntersecting ? onViewportEnter : onViewportLeave;
      if (a) {
        a(e);
      }
    };
    this.stopObserver = Su(this.node.current, a, o);
  }
  mount() {
    this.startObserver();
  }
  update() {
    if (typeof IntersectionObserver > `u`) {
      return;
    }
    let { props, prevProps } = this.node;
    if ([`amount`, `margin`, `root`].some(Tu(props, prevProps))) {
      this.startObserver();
    }
  }
  unmount() {
    this.stopObserver?.();
    this.hasEnteredView = false;
    this.isInView = false;
  }
}
function Tu({ viewport = {} }, { viewport: viewport_1 = {} } = {}) {
  return (n) => viewport[n] !== viewport_1[n];
}
const Eu = {
  inView: {
    Feature: wu,
  },
  tap: {
    Feature: gu,
  },
  focus: {
    Feature: mu,
  },
  hover: {
    Feature: pu,
  },
};
const Du = {
  layout: {
    ProjectionNode,
    MeasureLayout: UuComponent,
  },
};
const Ou = wl(
  {
    ...Ol,
    ...Eu,
    ...du,
    ...Du,
  },
  Tl,
);
const ku = T();
const Au = Ou;
const ju = `modulepreload`;
const Mu = (e) => `/` + e;
const Nu = {};
const Pu = function (e, t, n) {
  let r = Promise.resolve();
  if (t && t.length > 0) {
    let e = document.getElementsByTagName(`link`);
    let i = document.querySelector(`meta[property=csp-nonce]`);
    let a = i?.nonce || i?.getAttribute(`nonce`);
    function o(e) {
      return Promise.all(
        e.map((e) =>
          Promise.resolve(e).then(
            (e) => ({
              status: `fulfilled`,
              value: e,
            }),
            (reason) => ({
              status: `rejected`,
              reason,
            }),
          ),
        ),
      );
    }
    function s(e) {
      if (import.meta.resolve) {
        return import.meta.resolve(e);
      }
      return new URL(e, import.meta.url).href;
    }
    r = o(
      t
        .map((t) => {
          t = Mu(t, n);
          t = s(t);
          if (t in Nu) {
            return;
          }
          Nu[t] = true;
          let r = t.endsWith(`.css`);
          for (let n = e.length - 1; n >= 0; n--) {
            let i = e[n];
            if (i.href === t && (!r || i.rel === `stylesheet`)) {
              return;
            }
          }
          let i = document.createElement(`link`);
          i.rel = r ? `stylesheet` : ju;
          if (!r) {
            i.as = `script`;
          }
          i.crossOrigin = ``;
          i.href = t;
          if (a) {
            i.setAttribute(`nonce`, a);
          }
          document.head.appendChild(i);
          if (r) {
            return new Promise((resolve, reject) => {
              i.addEventListener(`load`, resolve);
              i.addEventListener(`error`, () =>
                reject(Error(`Unable to preload CSS for ${t}`)),
              );
            });
          }
        })
        .filter((e) => e !== undefined),
    );
  }
  function i(e) {
    let t = new Event(`vite:preloadError`, {
      cancelable: true,
    });
    t.payload = e;
    window.dispatchEvent(t);
    if (!t.defaultPrevented) {
      throw e;
    }
  }
  return r.then((t) => {
    for (let e of t || []) {
      if (e.status === `rejected`) {
        i(e.reason);
      }
    }
    return e().catch(i);
  });
};
const Fu = (e) => {
  throw TypeError(e);
};
const Iu = (e, t, n) => t.has(e) || Fu(`Cannot ` + n);
const Lu = (e, t, n) => {
  Iu(e, t, `read from private field`);
  if (n) {
    return n.call(e);
  }
  return t.get(e);
};
const Ru = (e, t, n) => {
  if (t.has(e)) {
    return Fu(`Cannot add the same private member more than once`);
  }
  if (t instanceof WeakSet) {
    return t.add(e);
  }
  return t.set(e, n);
};
const zu = (e, t, n, r) => {
  Iu(e, t, `write to private field`);
  if (r) {
    r.call(e, n);
  } else {
    t.set(e, n);
  }
  return n;
};
const Bu = /^(?:[a-z][a-z0-9+.-]*:|[\\/]{2})/i;
const Vu = /^[\\/]{2}/;
function Hu(e, protocol) {
  return protocol + e.replace(/\\/g, `/`);
}
const Uu = `popstate`;
function Wu(e) {
  return (
    typeof e == `object` &&
    !!e &&
    `pathname` in e &&
    `search` in e &&
    `hash` in e &&
    `state` in e &&
    `key` in e
  );
}
function Gu(e = {}) {
  function t(e, t) {
    let n = t.state?.masked;
    let { pathname, search, hash } = n || e.location;
    return Yu(
      ``,
      {
        pathname,
        search,
        hash,
      },
      (t.state && t.state.usr) || null,
      (t.state && t.state.key) || `default`,
      n
        ? {
            pathname: e.location.pathname,
            search: e.location.search,
            hash: e.location.hash,
          }
        : undefined,
    );
  }
  function n(e, t) {
    if (typeof t == `string`) {
      return t;
    }
    return Xu(t);
  }
  return Qu(t, n, null, e);
}
function $(e, t) {
  if (e === false || e == null) {
    throw Error(t);
  }
}
function Ku(e, t) {
  if (!e) {
    if (typeof console < `u`) {
      console.warn(t);
    }
    try {
      throw Error(t);
    } catch {}
  }
}
function qu() {
  return Math.random().toString(36).substring(2, 10);
}
function Ju(e, idx) {
  return {
    usr: e.state,
    key: e.key,
    idx,
    masked: e.mask
      ? {
          pathname: e.pathname,
          search: e.search,
          hash: e.hash,
        }
      : undefined,
  };
}
function Yu(e, t, n = null, r, mask) {
  return {
    pathname: typeof e == `string` ? e : e.pathname,
    search: ``,
    hash: ``,
    ...(typeof t == `string` ? Zu(t) : t),
    state: n,
    key: (t && t.key) || r || qu(),
    mask,
  };
}
function Xu({ pathname = `/`, search = ``, hash = `` }) {
  if (search && search !== `?`) {
    pathname += search.charAt(0) === `?` ? search : `?` + search;
  }
  if (hash && hash !== `#`) {
    pathname += hash.charAt(0) === `#` ? hash : `#` + hash;
  }
  return pathname;
}
function Zu(e) {
  let t = {};
  if (e) {
    let n = e.indexOf(`#`);
    if (n >= 0) {
      t.hash = e.substring(n);
      e = e.substring(0, n);
    }
    let r = e.indexOf(`?`);
    if (r >= 0) {
      t.search = e.substring(r);
      e = e.substring(0, r);
    }
    if (e) {
      t.pathname = e;
    }
  }
  return t;
}
function Qu(e, t, n, { window = document.defaultView, v5Compat = false } = {}) {
  let window_history = window.history;
  let s = `POP`;
  let c = null;
  let idx = u();
  idx ??
    ((idx = 0),
    window_history.replaceState(
      {
        ...window_history.state,
        idx,
      },
      ``,
    ));
  function u() {
    return (
      window_history.state || {
        idx: null,
      }
    ).idx;
  }
  function d() {
    s = `POP`;
    let e = u();
    let delta = e == null ? null : e - idx;
    idx = e;
    if (c) {
      c({
        action: s,
        location: h.location,
        delta,
      });
    }
  }
  function push(e, t) {
    s = `PUSH`;
    let r = Wu(e) ? e : Yu(h.location, e, t);
    if (n) {
      n(r, e);
    }
    idx = u() + 1;
    let d = Ju(r, idx);
    let f = h.createHref(r.mask || r);
    try {
      window_history.pushState(d, ``, f);
    } catch (error) {
      if (error instanceof DOMException && error.name === `DataCloneError`) {
        throw error;
      }
      window.location.assign(f);
    }
    if (v5Compat && c) {
      c({
        action: s,
        location: h.location,
        delta: 1,
      });
    }
  }
  function p(e, t) {
    s = `REPLACE`;
    let r = Wu(e) ? e : Yu(h.location, e, t);
    if (n) {
      n(r, e);
    }
    idx = u();
    let i = Ju(r, idx);
    let d = h.createHref(r.mask || r);
    window_history.replaceState(i, ``, d);
    if (v5Compat && c) {
      c({
        action: s,
        location: h.location,
        delta: 0,
      });
    }
  }
  function createURL(e) {
    return $u(window, e);
  }
  let h = {
    get action() {
      return s;
    },
    get location() {
      return e(window, window_history);
    },
    listen(e) {
      if (c) {
        throw Error(`A history only accepts one active listener`);
      }
      window.addEventListener(Uu, d);
      c = e;
      return () => {
        window.removeEventListener(Uu, d);
        c = null;
      };
    },
    createHref(e) {
      return t(window, e);
    },
    createURL,
    encodeLocation(e) {
      let t = createURL(e);
      return {
        pathname: t.pathname,
        search: t.search,
        hash: t.hash,
      };
    },
    push,
    replace: p,
    go(e) {
      return window_history.go(e);
    },
  };
  return h;
}
function $u(window, t, n = false) {
  let r = `http://localhost`;
  if (window) {
    r =
      window.location.origin === `null`
        ? window.location.href
        : window.location.origin;
  }
  $(r, `No window.location.(origin|href) available to create URL`);
  let i = typeof t == `string` ? t : Xu(t);
  i = i.replace(/ $/, `%20`);
  if (!n && Vu.test(i)) {
    i = r + i;
  }
  return new URL(i, r);
}
let ed;
class td {
  constructor(e) {
    Ru(this, ed, new Map());
    if (e) {
      for (let [t, n] of e) {
        this.set(t, n);
      }
    }
  }
  get(e) {
    if (Lu(this, ed).has(e)) {
      return Lu(this, ed).get(e);
    }
    if (e.defaultValue !== undefined) {
      return e.defaultValue;
    }
    throw Error(`No value found for context`);
  }
  set(e, t) {
    Lu(this, ed).set(e, t);
  }
}
ed = new WeakMap();
const nd = new Set([
  `lazy`,
  `caseSensitive`,
  `path`,
  `id`,
  `index`,
  `children`,
]);
function rd(key) {
  return nd.has(key);
}
var id = new Set([
  `lazy`,
  `caseSensitive`,
  `path`,
  `id`,
  `index`,
  `middleware`,
  `children`,
]);
function ad(e) {
  return id.has(e);
}
function od(e) {
  return e.index === true;
}
function sd(e, t, n = [], r = {}, i = false) {
  return e.map((e, a) => {
    let o = [...n, String(a)];
    let s = typeof e.id == `string` ? e.id : o.join(`-`);
    $(
      e.index !== true || !e.children,
      `Cannot specify children on an index route`,
    );
    $(
      i || !r[s],
      `Found a route id collision on id "${s}".  Route id's must be globally unique within Data Router usages`,
    );
    if (od(e)) {
      let n = {
        ...e,
        id: s,
      };
      r[s] = cd(n, t(n));
      return n;
    }
    {
      let n = {
        ...e,
        id: s,
        children: undefined,
      };
      r[s] = cd(n, t(n));
      if (e.children) {
        n.children = sd(e.children, t, o, r, i);
      }
      return n;
    }
  });
}
function cd(e, t) {
  return Object.assign(e, {
    ...t,
    ...(typeof t.lazy == `object` && t.lazy != null
      ? {
          lazy: {
            ...e.lazy,
            ...t.lazy,
          },
        }
      : {}),
  });
}
function ld(e, t, n = `/`) {
  return ud(e, t, n, false);
}
function ud(e, t, n, r, i) {
  let a = Ad((typeof t == `string` ? Zu(t) : t).pathname || `/`, n);
  if (a == null) {
    return null;
  }
  let o = i ?? fd(e);
  let s = null;
  let c = kd(a);
  for (let e = 0; s == null && e < o.length; ++e) {
    s = Td(o[e], c, r);
  }
  return s;
}
function dd({ route, pathname, params }, loaderData) {
  return {
    id: route.id,
    pathname,
    params,
    data: loaderData[route.id],
    loaderData: loaderData[route.id],
    handle: route.handle,
  };
}
function fd(e) {
  let t = pd(e);
  hd(t);
  return t;
}
function pd(e, t = [], n = [], r = ``, i = false) {
  let a = (e, childrenIndex, o = i, s) => {
    let c = {
      relativePath: s === undefined ? e.path || `` : s,
      caseSensitive: e.caseSensitive === true,
      childrenIndex,
      route: e,
    };
    if (c.relativePath.startsWith(`/`)) {
      if (!c.relativePath.startsWith(r) && o) {
        return;
      }
      $(
        c.relativePath.startsWith(r),
        `Absolute route path "${c.relativePath}" nested under path "${r}" is not valid. An absolute child route path must start with the combined path of all its parent routes.`,
      );
      c.relativePath = c.relativePath.slice(r.length);
    }
    let l = Bd([r, c.relativePath]);
    let u = n.concat(c);
    if (e.children && e.children.length > 0) {
      $(
        e.index !== true,
        `Index routes must not have child routes. Please remove all child routes from route path "${l}".`,
      );
      pd(e.children, t, u, l, o);
    }
    if (e.path != null || e.index) {
      t.push({
        path: l,
        score: Cd(l, e.index),
        routesMeta: u.map((e, t) => {
          let [matcher, compiledParams] = Od(
            e.relativePath,
            e.caseSensitive,
            t === u.length - 1,
          );
          return {
            ...e,
            matcher,
            compiledParams,
          };
        }),
      });
    }
  };
  e.forEach((e, t) => {
    if (e.path === `` || !e.path?.includes(`?`)) {
      a(e, t);
    } else {
      for (let n of md(e.path)) {
        a(e, t, true, n);
      }
    }
  });
  return t;
}
function md(e) {
  let t = e.split(`/`);
  if (t.length === 0) {
    return [];
  }
  let [n, ...r] = t;
  let i = n.endsWith(`?`);
  let a = n.replace(/\?$/, ``);
  if (r.length === 0) {
    if (i) {
      return [a, ``];
    }
    return [a];
  }
  let o = md(r.join(`/`));
  let s = [];
  s.push(
    ...o.map((e) => {
      if (e === ``) {
        return a;
      }
      return [a, e].join(`/`);
    }),
  );
  if (i) {
    s.push(...o);
  }
  return s.map((t) => {
    if (e.startsWith(`/`) && t === ``) {
      return `/`;
    }
    return t;
  });
}
function hd(e) {
  e.sort((e, t) => {
    if (e.score === t.score) {
      return wd(
        e.routesMeta.map((e) => e.childrenIndex),
        t.routesMeta.map((e) => e.childrenIndex),
      );
    }
    return t.score - e.score;
  });
}
const gd = /^:[\w-]+$/;
const _d = 3;
const vd = 2;
const yd = 1;
const bd = 10;
const xd = -2;
const Sd = (e) => e === `*`;
function Cd(e, index) {
  let n = e.split(`/`);
  let n_length = n.length;
  if (n.some(Sd)) {
    n_length += xd;
  }
  if (index) {
    n_length += vd;
  }
  return n
    .filter((e) => !Sd(e))
    .reduce(
      (acc, item) => acc + (gd.test(item) ? _d : item === `` ? yd : bd),
      n_length,
    );
}
function wd(e, t) {
  if (e.length === t.length && e.slice(0, -1).every((e, n) => e === t[n])) {
    return e[e.length - 1] - t[t.length - 1];
  }
  return 0;
}
function Td({ routesMeta }, t, n = false) {
  let params = {};
  let a = `/`;
  let o = [];
  for (let e = 0; e < routesMeta.length; ++e) {
    let s = routesMeta[e];
    let c = e === routesMeta.length - 1;
    let l = a === `/` ? t : t.slice(a.length) || `/`;
    let u = {
      path: s.relativePath,
      caseSensitive: s.caseSensitive,
      end: c,
    };
    let d =
      s.matcher && s.compiledParams
        ? Dd(u, l, s.matcher, s.compiledParams)
        : Ed(u, l);
    let f = s.route;
    if (!d && c && n && !routesMeta[routesMeta.length - 1].route.index) {
      d = Ed(
        {
          path: s.relativePath,
          caseSensitive: s.caseSensitive,
          end: false,
        },
        l,
      );
    }
    if (!d) {
      return null;
    }
    Object.assign(params, d.params);
    o.push({
      params,
      pathname: Bd([a, d.pathname]),
      pathnameBase: Hd(Bd([a, d.pathnameBase])),
      route: f,
    });
    if (d.pathnameBase !== `/`) {
      a = Bd([a, d.pathnameBase]);
    }
  }
  return o;
}
function Ed(e, t) {
  if (typeof e == `string`) {
    e = {
      path: e,
      caseSensitive: false,
      end: true,
    };
  }
  let [n, r] = Od(e.path, e.caseSensitive, e.end);
  return Dd(e, t, n, r);
}
function Dd(e, t, n, r) {
  let i = t.match(n);
  if (!i) {
    return null;
  }
  let a = i[0];
  let pathnameBase = Vd(a, 1);
  let s = i.slice(1);
  return {
    params: r.reduce((acc, { paramName, isOptional }, index) => {
      if (paramName === `*`) {
        let e = s[index] || ``;
        pathnameBase = Vd(a.slice(0, a.length - e.length), 1);
      }
      let i = s[index];
      acc[paramName] =
        isOptional && !i ? undefined : (i || ``).replace(/%2F/g, `/`);
      return acc;
    }, {}),
    pathname: a,
    pathnameBase,
    pattern: e,
  };
}
function Od(e, t = false, n = true) {
  Ku(
    e === `*` || !e.endsWith(`*`) || e.endsWith(`/*`),
    `Route path "${e}" will be treated as if it were "${e.replace(/\*$/, `/*`)}" because the \`*\` character must always follow a \`/\` in the pattern. To get rid of this warning, please change the route path to "${e.replace(/\*$/, `/*`)}".`,
  );
  let r = [];
  let i =
    `^` +
    e
      .replace(/\/*\*?$/, ``)
      .replace(/^\/*/, `/`)
      .replace(/[\\.*+^${}|()[\]]/g, `\\$&`)
      .replace(/\/:([\w-]+)(\?)?/g, (e, paramName, n, i, a) => {
        r.push({
          paramName,
          isOptional: n != null,
        });
        if (n) {
          let t = a.charAt(i + e.length);
          if (t && t !== `/`) {
            return `/([^\\/]*)`;
          }
          return `(?:/([^\\/]*))?`;
        }
        return `/([^\\/]+)`;
      })
      .replace(/\/([\w-]+)\?(\/|$)/g, `(/$1)?$2`);
  if (e.endsWith(`*`)) {
    r.push({
      paramName: `*`,
    });
    i += e === `*` || e === `/*` ? `(.*)$` : `(?:\\/(.+)|\\/*)$`;
  } else if (n) {
    i += `\\/*$`;
  } else if (e !== `` && e !== `/`) {
    i += `(?:(?=\\/|$))`;
  }
  return [new RegExp(i, t ? undefined : `i`), r];
}
function kd(e) {
  try {
    return e
      .split(`/`)
      .map((e) => decodeURIComponent(e).replace(/\//g, `%2F`))
      .join(`/`);
  } catch (error) {
    Ku(
      false,
      `The URL path "${e}" could not be decoded because it is a malformed URL segment. This is probably due to a bad percent encoding (${error}).`,
    );
    return e;
  }
}
function Ad(e, t) {
  if (t === `/`) {
    return e;
  }
  if (!e.toLowerCase().startsWith(t.toLowerCase())) {
    return null;
  }
  let n = t.endsWith(`/`) ? t.length - 1 : t.length;
  let r = e.charAt(n);
  if (r && r !== `/`) {
    return null;
  }
  return e.slice(n) || `/`;
}
function jd({ basename, pathname }) {
  if (pathname === `/`) {
    return basename;
  }
  return Bd([basename, pathname]);
}
const Md = (e) => Bu.test(e);
function Nd(e, t = `/`) {
  let { pathname, search = ``, hash = `` } = typeof e == `string` ? Zu(e) : e;
  let a;
  if (pathname) {
    pathname = zd(pathname);
    a =
      pathname.startsWith(`/`) || pathname.startsWith(`\\`)
        ? Pd(pathname.substring(1), `/`)
        : Pd(pathname, t);
  } else {
    a = t;
  }
  return {
    pathname: a,
    search: Ud(search),
    hash: Wd(hash),
  };
}
function Pd(e, t) {
  let n = Vd(t).split(`/`);
  e.split(`/`).forEach((e) => {
    e === `..` ? n.length > 1 && n.pop() : e !== `.` && n.push(e);
  });
  if (n.length > 1) {
    return n.join(`/`);
  }
  return `/`;
}
function Fd(e, t, n, r) {
  return `Cannot include a '${e}' character in a manually specified \`to.${t}\` field [${JSON.stringify(r)}].  Please separate it out to the \`to.${n}\` field. Alternatively you may provide the full path as a string in <Link to="..."> and the router will parse it for you.`;
}
function Id(e) {
  return e.filter(
    (e, t) => t === 0 || (e.route.path && e.route.path.length > 0),
  );
}
function Ld(e) {
  let t = Id(e);
  return t.map((e, n) => {
    if (n === t.length - 1) {
      return e.pathname;
    }
    return e.pathnameBase;
  });
}
function Rd(e, t, n, r = false) {
  let i;
  if (typeof e == `string`) {
    i = Zu(e);
  } else {
    i = {
      ...e,
    };
    $(
      !i.pathname || !i.pathname.includes(`?`),
      Fd(`?`, `pathname`, `search`, i),
    );
    $(!i.pathname || !i.pathname.includes(`#`), Fd(`#`, `pathname`, `hash`, i));
    $(!i.search || !i.search.includes(`#`), Fd(`#`, `search`, `hash`, i));
  }
  let a = e === `` || i.pathname === ``;
  let o = a ? `/` : i.pathname;
  let s;
  if (o == null) {
    s = n;
  } else {
    let e = t.length - 1;
    if (!r && o.startsWith(`..`)) {
      let t = o.split(`/`);
      while (t[0] === `..`) {
        t.shift();
        --e;
      }
      i.pathname = t.join(`/`);
    }
    s = e >= 0 ? t[e] : `/`;
  }
  let c = Nd(i, s);
  let l = o && o !== `/` && o.endsWith(`/`);
  let u = (a || o === `.`) && n.endsWith(`/`);
  if (!c.pathname.endsWith(`/`) && (l || u)) {
    c.pathname += `/`;
  }
  return c;
}
var zd = (e) => e.replace(/[\\/]{2,}/g, `/`);
var Bd = (e) => zd(e.join(`/`));
function Vd(e, t = 0) {
  let e_length = e.length;
  while (e_length > t && e.charCodeAt(e_length - 1) === 47) {
    e_length--;
  }
  if (e_length === e.length) {
    return e;
  }
  return e.slice(0, e_length);
}
var Hd = (e) => Vd(e).replace(/^\/*/, `/`);
var Ud = (search) => {
  if (!search || search === `?`) {
    return ``;
  }
  if (search.startsWith(`?`)) {
    return search;
  }
  return `?` + search;
};
var Wd = (hash) => {
  if (!hash || hash === `#`) {
    return ``;
  }
  if (hash.startsWith(`#`)) {
    return hash;
  }
  return `#` + hash;
};
const Gd = [
  `EvalError`,
  `RangeError`,
  `ReferenceError`,
  `SyntaxError`,
  `TypeError`,
  `URIError`,
];
class Kd {
  constructor(e, t, n, r = false) {
    this.status = e;
    this.statusText = t || ``;
    this.internal = r;
    if (n instanceof Error) {
      this.data = n.toString();
      this.error = n;
    } else {
      this.data = n;
    }
  }
}
function qd(e) {
  return (
    e != null &&
    typeof e.status == `number` &&
    typeof e.statusText == `string` &&
    typeof e.internal == `boolean` &&
    `data` in e
  );
}
function Jd(e) {
  return Bd(e.map((e) => e.route.path).filter(Boolean)) || `/`;
}
const Yd =
  typeof window < `u` &&
  window.document !== undefined &&
  window.document.createElement !== undefined;
function Xd(e, basename) {
  let to_1 = e;
  if (typeof to_1 != `string` || !Bu.test(to_1)) {
    return {
      absoluteURL: undefined,
      isExternal: false,
      to: to_1,
    };
  }
  let absoluteURL = to_1;
  let isExternal = false;
  if (Yd) {
    try {
      let e = new URL(window.location.href);
      let r = Vu.test(to_1) ? new URL(Hu(to_1, e.protocol)) : new URL(to_1);
      let a = Ad(r.pathname, basename);
      if (r.origin === e.origin && a != null) {
        to_1 = a + r.search + r.hash;
      } else {
        isExternal = true;
      }
    } catch {
      Ku(
        false,
        `<Link to="${to_1}"> contains an invalid URL which will probably break when clicked - please update to a valid URL path.`,
      );
    }
  }
  return {
    absoluteURL,
    isExternal,
    to: to_1,
  };
}
const Zd = Symbol(`Uninstrumented`);
function Qd(e, t) {
  let n = {
    lazy: [],
    "lazy.loader": [],
    "lazy.action": [],
    "lazy.middleware": [],
    middleware: [],
    loader: [],
    action: [],
  };
  e.forEach((e) =>
    e({
      id: t.id,
      index: t.index,
      path: t.path,
      instrument(e) {
        let t = Object.keys(n);
        for (let r of t) {
          if (e[r]) {
            n[r].push(e[r]);
          }
        }
      },
    }),
  );
  let r = {};
  if (typeof t.lazy == `function` && n.lazy.length > 0) {
    let e = ef(n.lazy, t.lazy, () => undefined);
    if (e) {
      r.lazy = e;
    }
  }
  if (typeof t.lazy == `object`) {
    let e = t.lazy;
    [`middleware`, `loader`, `action`].forEach((t) => {
      let i = e[t];
      let a = n[`lazy.${t}`];
      if (typeof i == `function` && a.length > 0) {
        let e = ef(a, i, () => undefined);
        if (e) {
          r.lazy = Object.assign(r.lazy || {}, {
            [t]: e,
          });
        }
      }
    });
  }
  [`loader`, `action`].forEach((e) => {
    let i = t[e];
    if (typeof i == `function` && n[e].length > 0) {
      let t = i[Zd] ?? i;
      let a = ef(n[e], t, (...e) => nf(e[0]));
      if (a) {
        if (e === `loader` && t.hydrate === true) {
          a.hydrate = true;
        }
        a[Zd] = t;
        r[e] = a;
      }
    }
  });
  if (t.middleware && t.middleware.length > 0 && n.middleware.length > 0) {
    r.middleware = t.middleware.map((e) => {
      let t = e[Zd] ?? e;
      let r = ef(n.middleware, t, (...e) => nf(e[0]));
      if (r) {
        return ((r[Zd] = t), r);
      }
      return e;
    });
  }
  return r;
}
function $d(e, t) {
  let n = {
    navigate: [],
    fetch: [],
  };
  t.forEach((e) =>
    e({
      instrument(e) {
        let t = Object.keys(e);
        for (let r of t) {
          if (e[r]) {
            n[r].push(e[r]);
          }
        }
      },
    }),
  );
  if (n.navigate.length > 0) {
    let t = e.navigate[Zd] ?? e.navigate;
    let r = ef(n.navigate, t, (...t) => {
      let [n, r] = t;
      return {
        to: typeof n == `number` || typeof n == `string` ? n : n ? Xu(n) : `.`,
        ...rf(e, r ?? {}),
      };
    });
    if (r) {
      r[Zd] = t;
      e.navigate = r;
    }
  }
  if (n.fetch.length > 0) {
    let t = e.fetch[Zd] ?? e.fetch;
    let r = ef(n.fetch, t, (...t) => {
      let [n, , r, i] = t;
      return {
        href: r ?? `.`,
        fetcherKey: n,
        ...rf(e, i ?? {}),
      };
    });
    if (r) {
      r[Zd] = t;
      e.fetch = r;
    }
  }
  return e;
}
function ef(e, t, n) {
  if (e.length === 0) {
    return null;
  }
  return async (...r) => {
    let i = await tf(e, n(...r), () => t(...r), e.length - 1);
    if (i.type === `error`) {
      throw i.value;
    }
    return i.value;
  };
}
async function tf(e, t, n, r) {
  let i = e[r];
  let a;
  if (i) {
    let o;
    let s = async () => {
      if (o) {
        console.error(`You cannot call instrumented handlers more than once`);
      } else {
        o = tf(e, t, n, r - 1);
      }
      a = await o;
      $(a, `Expected a result`);
      if (a.type === `error` && a.value instanceof Error) {
        return {
          status: `error`,
          error: a.value,
        };
      }
      return {
        status: `success`,
        error: undefined,
      };
    };
    try {
      await i(s, t);
    } catch (error) {
      console.error(`An instrumentation function threw an error:`, error);
    }
    if (!o) {
      await s();
    }
    await o;
  } else {
    try {
      a = {
        type: `success`,
        value: await n(),
      };
    } catch (error) {
      a = {
        type: `error`,
        value: error,
      };
    }
  }
  return (
    a || {
      type: `error`,
      value: Error(`No result assigned in instrumentation chain.`),
    }
  );
}
function nf({ request, context, params, pattern }) {
  return {
    request: af(request),
    params: {
      ...params,
    },
    pattern,
    context: of(context),
  };
}
function rf(e, t) {
  return {
    currentUrl: Xu(e.state.location),
    ...(`formMethod` in t
      ? {
          formMethod: t.formMethod,
        }
      : {}),
    ...(`formEncType` in t
      ? {
          formEncType: t.formEncType,
        }
      : {}),
    ...(`formData` in t
      ? {
          formData: t.formData,
        }
      : {}),
    ...(`body` in t
      ? {
          body: t.body,
        }
      : {}),
  };
}
function af(request) {
  return {
    method: request.method,
    url: request.url,
    headers: {
      get: (...t) => request.headers.get(...t),
    },
  };
}
function of(context) {
  if (cf(context)) {
    let t = {
      ...context,
    };
    Object.freeze(t);
    return t;
  }
  return {
    get: (t) => context.get(t),
  };
}
const sf = Object.getOwnPropertyNames(Object.prototype).sort().join(`\0`);
function cf(e) {
  if (typeof e != `object` || !e) {
    return false;
  }
  let t = Object.getPrototypeOf(e);
  return (
    t === Object.prototype ||
    t === null ||
    Object.getOwnPropertyNames(t).sort().join(`\0`) === sf
  );
}
const lf = new URL(`http://localhost`);
function uf(navigator) {
  if (navigator.createURL) {
    return navigator.createURL(`/`);
  }
  try {
    return new URL(navigator.createHref(`/`), lf);
  } catch {
    return lf;
  }
}
function df(e, t) {
  return (
    e.origin === t.origin &&
    (e.origin !== `null` || (e.protocol === t.protocol && e.host === t.host))
  );
}
function ff(e, t) {
  if (e.startsWith(`//`)) {
    return true;
  }
  let n = t.protocol.toLowerCase();
  if (e.toLowerCase().startsWith(n)) {
    return t.host === `` || e.slice(n.length).startsWith(`//`);
  }
  return false;
}
function pf(e, t, n, r) {
  let i = null;
  try {
    i = e == null ? null : new URL(e, n);
  } catch {}
  let a = new URL(t, n);
  let o = i != null && !df(i, n);
  let s = !df(a, n);
  if (r === `reject`) {
    if (o || s) {
      throw Error(`External navigation is not allowed`);
    }
  } else if (s && (i == null || !ff(e, i) || !df(i, a))) {
    throw Error(`External navigation is not allowed`);
  }
}
const mf = [`POST`, `PUT`, `PATCH`, `DELETE`];
const hf = new Set(mf);
const gf = [`GET`, ...mf];
const _f = new Set(gf);
const vf = new Set([301, 302, 303, 307, 308]);
const yf = new Set([307, 308]);
const bf = {
  state: `idle`,
  location: undefined,
  matches: undefined,
  historyAction: undefined,
  formMethod: undefined,
  formAction: undefined,
  formEncType: undefined,
  formData: undefined,
  json: undefined,
  text: undefined,
};
const xf = {
  state: `idle`,
  data: undefined,
  formMethod: undefined,
  formAction: undefined,
  formEncType: undefined,
  formData: undefined,
  json: undefined,
  text: undefined,
};
const Sf = {
  state: `unblocked`,
  proceed: undefined,
  reset: undefined,
  location: undefined,
};
const Cf = (e) => ({
  hasErrorBoundary: !!e.hasErrorBoundary,
});
const wf = `remix-router-transitions`;
const Tf = Symbol(`ResetLoaderData`);
let Ef;
let Df;
let Of;
let kf;
class Af {
  constructor(e) {
    Ru(this, Ef);
    Ru(this, Df);
    Ru(this, Of);
    Ru(this, kf);
    zu(this, Ef, e);
    zu(this, Df, fd(e));
  }
  get stableRoutes() {
    return Lu(this, Ef);
  }
  get activeRoutes() {
    return Lu(this, Of) ?? Lu(this, Ef);
  }
  get branches() {
    return Lu(this, kf) ?? Lu(this, Df);
  }
  get hasHMRRoutes() {
    return Lu(this, Of) != null;
  }
  setRoutes(e) {
    zu(this, Ef, e);
    zu(this, Df, fd(e));
  }
  setHmrRoutes(e) {
    zu(this, Of, e);
    zu(this, kf, fd(e));
  }
  commitHmrRoutes() {
    if (Lu(this, Of)) {
      zu(this, Ef, Lu(this, Of));
      zu(this, Df, Lu(this, kf));
      zu(this, Of, undefined);
      zu(this, kf, undefined);
    }
  }
}
Ef = new WeakMap();
Df = new WeakMap();
Of = new WeakMap();
kf = new WeakMap();
function jf(e) {
  let window_1 = e.window ? e.window : typeof window < `u` ? window : undefined;
  let n =
    window_1 !== undefined &&
    window_1.document !== undefined &&
    window_1.document.createElement !== undefined;
  $(
    e.routes.length > 0,
    `You must provide a non-empty routes array to createRouter`,
  );
  let r = e.hydrationRouteProperties || [];
  let i = e.mapRouteProperties || Cf;
  let a = i;
  if (e.instrumentations) {
    let t = e.instrumentations;
    a = (e) => ({
      ...i(e),
      ...Qd(t.map((e) => e.route).filter(Boolean), e),
    });
  }
  let o = {};
  let s = new Af(sd(e.routes, a, undefined, o));
  let c = e.basename || `/`;
  if (!c.startsWith(`/`)) {
    c = `/${c}`;
  }
  let l = e.dataStrategy || Jf;
  let future = {
    ...e.future,
  };
  let d = null;
  let f = new Set();
  let p = null;
  let m = null;
  let h = null;
  let g = null;
  let _ = e.hydrationData != null;
  let v = ud(s.activeRoutes, e.history.location, c, false, s.branches);
  let y = false;
  let b = null;
  let initialized;
  let renderFallback;
  if (v == null && !e.patchRoutesOnNavigation) {
    let t = yp(404, {
      pathname: e.history.location.pathname,
    });
    let { matches, route } = vp(s.activeRoutes);
    initialized = true;
    renderFallback = !initialized;
    v = matches;
    b = {
      [route.id]: t,
    };
  } else {
    if (
      v &&
      !e.hydrationData &&
      Je(v, s.activeRoutes, e.history.location.pathname).active
    ) {
      v = null;
    }
    if (!v) {
      initialized = false;
      renderFallback = !initialized;
      v = [];
      let t = Je(null, s.activeRoutes, e.history.location.pathname);
      if (t.active && t.matches) {
        y = true;
        v = t.matches;
      }
    } else if (v.some((e) => e.route.lazy)) {
      initialized = false;
      renderFallback = !initialized;
    } else if (!v.some((e) => If(e.route))) {
      initialized = true;
      renderFallback = !initialized;
    } else {
      let t = e.hydrationData ? e.hydrationData.loaderData : null;
      let n = e.hydrationData ? e.hydrationData.errors : null;
      let r = v;
      if (n) {
        let e = v.findIndex((e) => n[e.route.id] !== undefined);
        r = r.slice(0, e + 1);
      }
      renderFallback = false;
      initialized = true;
      r.forEach((e) => {
        let r = Lf(e.route, t, n);
        renderFallback ||= r.renderFallback;
        initialized &&= !r.shouldLoad;
      });
    }
  }
  let C;
  let w = {
    historyAction: e.history.action,
    location: e.history.location,
    matches: v,
    initialized,
    renderFallback,
    navigation: bf,
    restoreScrollPosition: e.hydrationData == null && null,
    preventScrollReset: false,
    revalidation: `idle`,
    loaderData: (e.hydrationData && e.hydrationData.loaderData) || {},
    actionData: (e.hydrationData && e.hydrationData.actionData) || null,
    errors: (e.hydrationData && e.hydrationData.errors) || b,
    fetchers: new Map(),
    blockers: new Map(),
  };
  let T = `POP`;
  let E = null;
  let D = false;
  let O;
  let k = false;
  let ee = new Map();
  let te = null;
  let ne = false;
  let A = false;
  let re = new Set();
  let _internalFetchControllers = new Map();
  let ie = 0;
  let ae = -1;
  let oe = new Map();
  let M = new Set();
  let se = new Map();
  let ce = new Map();
  let le = new Set();
  let N = new Map();
  let ue;
  let de = null;
  function initialize() {
    d = e.history.listen(({ action, location, delta }) => {
      if (ue) {
        ue();
        ue = undefined;
        return;
      }
      Ku(
        N.size === 0 || delta != null,
        "You are trying to use a blocker on a POP navigation to a location that was not created by @remix-run/router. This will fail silently in production. This can happen if you are navigating outside the router via `window.history.pushState`/`window.location.hash` instead of using router navigation APIs.  This can also happen if you are using createHashRouter and the user manually changes the URL.",
      );
      let i = F({
        currentLocation: w.location,
        nextLocation: location,
        historyAction: action,
      });
      if (i && delta != null) {
        let t = new Promise((resolve) => {
          ue = resolve;
        });
        e.history.go(delta * -1);
        He(i, {
          state: `blocked`,
          location,
          proceed() {
            He(i, {
              state: `proceeding`,
              proceed: undefined,
              reset: undefined,
              location,
            });
            t.then(() => e.history.go(delta));
          },
          reset() {
            let e = new Map(w.blockers);
            e.set(i, Sf);
            he({
              blockers: e,
            });
          },
        });
        E?.resolve();
        E = null;
        return;
      }
      return ye(action, location);
    });
    if (n) {
      Up(window_1, ee);
      let e = () => Wp(window_1, ee);
      window_1.addEventListener(`pagehide`, e);
      te = () => window_1.removeEventListener(`pagehide`, e);
    }
    if (!w.initialized) {
      ye(`POP`, w.location, {
        initialHydration: true,
      });
    }
    return C;
  }
  function dispose() {
    if (d) {
      d();
    }
    if (te) {
      te();
    }
    f.clear();
    if (O) {
      O.abort();
    }
    w.fetchers.forEach((e, t) => Fe(w.fetchers, t));
    w.blockers.forEach((e, t) => deleteBlocker(t));
  }
  function subscribe(e) {
    f.add(e);
    if (p) {
      let { newErrors } = p;
      p = null;
      e(w, {
        deletedFetchers: [],
        newErrors,
        viewTransitionOpts: undefined,
        flushSync: false,
      });
    }
    return () => f.delete(e);
  }
  function he(e, t = {}) {
    e.matches &&= e.matches.map((e) => {
      let t = o[e.route.id];
      let e_route = e.route;
      if (
        e_route.element !== t.element ||
        e_route.errorElement !== t.errorElement ||
        e_route.hydrateFallbackElement !== t.hydrateFallbackElement
      ) {
        return {
          ...e,
          route: t,
        };
      }
      return e;
    });
    w = {
      ...w,
      ...e,
    };
    let deletedFetchers = [];
    let r = [];
    w.fetchers.forEach((e, t) => {
      e.state === `idle` && (le.has(t) ? deletedFetchers.push(t) : r.push(t));
    });
    le.forEach((e) => {
      if (!w.fetchers.has(e) && !_internalFetchControllers.has(e)) {
        deletedFetchers.push(e);
      }
    });
    if (f.size === 0) {
      p = {
        newErrors: e.errors ?? null,
      };
    }
    [...f].forEach((r) =>
      r(w, {
        deletedFetchers,
        newErrors: e.errors ?? null,
        viewTransitionOpts: t.viewTransitionOpts,
        flushSync: t.flushSync === true,
      }),
    );
    deletedFetchers.forEach((e) => Fe(w.fetchers, e));
    r.forEach((e) => w.fetchers.delete(e));
  }
  function ge(t, n, { flushSync } = {}) {
    let i =
      w.actionData != null &&
      w.navigation.formMethod != null &&
      Pp(w.navigation.formMethod) &&
      w.navigation.state === `loading` &&
      t.state?._isRedirect !== true;
    let a;
    a = n.actionData
      ? Object.keys(n.actionData).length > 0
        ? n.actionData
        : null
      : i
        ? w.actionData
        : null;
    let loaderData = n.loaderData
      ? hp(w.loaderData, n.loaderData, n.matches || [], n.errors)
      : w.loaderData;
    let w_blockers = w.blockers;
    if (w_blockers.size > 0) {
      w_blockers = new Map(w_blockers);
      w_blockers.forEach((e, t) => w_blockers.set(t, Sf));
    }
    let restoreScrollPosition = !ne && qe(t, n.matches || w.matches);
    let u =
      D === true ||
      (w.navigation.formMethod != null &&
        Pp(w.navigation.formMethod) &&
        t.state?._isRedirect !== true);
    s.commitHmrRoutes();
    ne ||
      T === `POP` ||
      (T === `PUSH`
        ? e.history.push(t, t.state)
        : T === `REPLACE` && e.history.replace(t, t.state));
    let viewTransitionOpts;
    if (T === `POP` && !ne && t !== w.location) {
      let e = ee.get(w.location.pathname);
      if (e && e.has(t.pathname)) {
        viewTransitionOpts = {
          currentLocation: w.location,
          nextLocation: t,
        };
      } else if (ee.has(t.pathname)) {
        viewTransitionOpts = {
          currentLocation: t,
          nextLocation: w.location,
        };
      }
    } else if (k) {
      let e = ee.get(w.location.pathname);
      if (e) {
        e.add(t.pathname);
      } else {
        e = new Set([t.pathname]);
        ee.set(w.location.pathname, e);
      }
      viewTransitionOpts = {
        currentLocation: w.location,
        nextLocation: t,
      };
    }
    he(
      {
        ...n,
        actionData: a,
        loaderData,
        historyAction: T,
        location: t,
        initialized: true,
        renderFallback: false,
        navigation: bf,
        revalidation: `idle`,
        restoreScrollPosition,
        preventScrollReset: u,
        blockers: w_blockers,
      },
      {
        viewTransitionOpts,
        flushSync: flushSync === true,
      },
    );
    T = `POP`;
    D = false;
    k = false;
    ne = false;
    A = false;
    E?.resolve();
    E = null;
    de?.resolve();
    de = null;
  }
  async function navigate(t, n) {
    E?.resolve();
    E = null;
    if (typeof t == `number`) {
      E ||= Gp();
      let n = E.promise;
      e.history.go(t);
      return n;
    }
    let { path, submission, error } = Pf(
      false,
      Nf(w.location, w.matches, c, t, n?.fromRouteId, n?.relative),
      n,
    );
    let o;
    if (n?.mask) {
      let t =
        typeof n.mask == `string`
          ? Zu(n.mask)
          : {
              ...w.location.mask,
              ...n.mask,
            };
      o = {
        pathname: t.pathname ?? ``,
        search: t.search ?? ``,
        hash: t.hash ?? ``,
      };
      if (Vu.test(o.pathname)) {
        throw Error(`External navigation is not allowed`);
      }
      if (o.pathname.startsWith(`\\`)) {
        o.pathname = o.pathname.replace(/^\\+/, `/`);
      }
      pf(
        typeof n.mask == `string` ? n.mask : Xu(n.mask),
        Xu(o),
        e.history.createURL(`/`),
        `reject`,
      );
    }
    let w_location = w.location;
    let l = Yu(w_location, path, n && n.state, undefined, o);
    l = {
      ...l,
      ...e.history.encodeLocation(l),
    };
    pf(
      t == null
        ? e.history.createHref(w.location)
        : typeof t == `string`
          ? t
          : Xu(t),
      e.history.createHref(l.mask || l),
      e.history.createURL(`/`),
      `reject`,
    );
    let u = n && n.replace != null ? n.replace : undefined;
    let d = `PUSH`;
    if (u === true) {
      d = `REPLACE`;
    } else {
      u === false ||
        (submission != null &&
          Pp(submission.formMethod) &&
          submission.formAction === w.location.pathname + w.location.search &&
          (d = `REPLACE`));
    }
    let f =
      n && `preventScrollReset` in n
        ? n.preventScrollReset === true
        : undefined;
    let p = (n && n.flushSync) === true;
    let m = F({
      currentLocation: w_location,
      nextLocation: l,
      historyAction: d,
    });
    if (m) {
      He(m, {
        state: `blocked`,
        location: l,
        proceed() {
          He(m, {
            state: `proceeding`,
            proceed: undefined,
            reset: undefined,
            location: l,
          });
          navigate(t, n);
        },
        reset() {
          let e = new Map(w.blockers);
          e.set(m, Sf);
          he({
            blockers: e,
          });
        },
      });
      return;
    }
    await ye(d, l, {
      submission,
      pendingError: error,
      preventScrollReset: f,
      replace: n && n.replace,
      enableViewTransition: n && n.viewTransition,
      flushSync: p,
      callSiteDefaultShouldRevalidate: n && n.defaultShouldRevalidate,
    });
  }
  function revalidate() {
    de ||= Gp();
    Ae();
    he({
      revalidation: `loading`,
    });
    let de_promise = de.promise;
    if (w.navigation.state === `submitting`) {
      return de_promise;
    }
    if (w.navigation.state === `idle`) {
      return (
        ye(w.historyAction, w.location, {
          startUninterruptedRevalidation: true,
        }),
        de_promise
      );
    }
    return (
      ye(T || w.historyAction, w.navigation.location, {
        overrideNavigation: w.navigation,
        enableViewTransition: k === true,
      }),
      de_promise
    );
  }
  async function ye(t, n, r) {
    if (O) {
      O.abort();
    }
    O = null;
    T = t;
    ne = (r && r.startUninterruptedRevalidation) === true;
    Ke(w.location, w.matches);
    D = (r && r.preventScrollReset) === true;
    k = (r && r.enableViewTransition) === true;
    let s_activeRoutes = s.activeRoutes;
    let a =
      r?.initialHydration && w.matches && w.matches.length > 0 && !y
        ? w.matches
        : ud(s_activeRoutes, n, c, false, s.branches);
    let o = (r && r.flushSync) === true;
    if (
      a &&
      w.initialized &&
      !A &&
      Sp(w.location, n) &&
      !(r && r.submission && Pp(r.submission.formMethod))
    ) {
      ge(
        n,
        {
          matches: a,
        },
        {
          flushSync: o,
        },
      );
      return;
    }
    let l = Je(a, s_activeRoutes, n.pathname);
    if (l.active && l.matches) {
      a = l.matches;
    }
    if (!a) {
      let { error, notFoundMatches, route } = Ue(n.pathname);
      ge(
        n,
        {
          matches: notFoundMatches,
          loaderData: {},
          errors: {
            [route.id]: error,
          },
        },
        {
          flushSync: o,
        },
      );
      return;
    }
    let u =
      r && r.overrideNavigation
        ? {
            ...r.overrideNavigation,
            matches: a,
            historyAction: t,
          }
        : undefined;
    O = new AbortController();
    let d = lp(e.history, n, O.signal, r && r.submission);
    let f = e.getContext ? await e.getContext() : new td();
    let p;
    if (r && r.pendingError) {
      p = [
        _p(a).route.id,
        {
          type: `error`,
          error: r.pendingError,
        },
      ];
    } else if (r && r.submission && Pp(r.submission.formMethod)) {
      let i = await be(
        d,
        n,
        r.submission,
        a,
        t,
        f,
        l.active,
        r && r.initialHydration === true,
        {
          replace: r.replace,
          flushSync: o,
        },
      );
      if (i.shortCircuited) {
        return;
      }
      if (i.pendingActionResult) {
        let [e, t] = i.pendingActionResult;
        if (Dp(t) && qd(t.error) && t.error.status === 404) {
          O = null;
          ge(n, {
            matches: i.matches,
            loaderData: {},
            errors: {
              [e]: t.error,
            },
          });
          return;
        }
      }
      a = i.matches || a;
      p = i.pendingActionResult;
      u = Rp(n, a, t, r.submission);
      o = false;
      l.active = false;
      d = lp(e.history, d.url, d.signal);
    }
    let { shortCircuited, matches, loaderData, errors, workingFetchers } =
      await xe(
        d,
        n,
        a,
        t,
        f,
        l.active,
        u,
        r && r.submission,
        r && r.fetcherSubmission,
        r && r.replace,
        r && r.initialHydration === true,
        o,
        p,
        r && r.callSiteDefaultShouldRevalidate,
      );
    if (!shortCircuited) {
      O = null;
      ge(n, {
        matches: matches || a,
        ...gp(p),
        loaderData,
        errors,
        ...(workingFetchers
          ? {
              fetchers: workingFetchers,
            }
          : {}),
      });
    }
  }
  async function be(t, n, submission, l, u, d, active, p, m = {}) {
    Ae();
    he(
      {
        navigation: zp(n, l, u, submission),
      },
      {
        flushSync: m.flushSync === true,
      },
    );
    if (active) {
      let e = await Ye(l, n.pathname, t.signal);
      if (e.type === `aborted`) {
        return {
          shortCircuited: true,
        };
      }
      if (e.type === `error`) {
        if (e.partialMatches.length === 0) {
          let { matches, route } = vp(s.activeRoutes);
          return {
            matches,
            pendingActionResult: [
              route.id,
              {
                type: `error`,
                error: e.error,
              },
            ],
          };
        }
        let t = _p(e.partialMatches).route.id;
        return {
          matches: e.partialMatches,
          pendingActionResult: [
            t,
            {
              type: `error`,
              error: e.error,
            },
          ],
        };
      }
      if (e.matches) {
        l = e.matches;
      } else {
        let { notFoundMatches, error, route } = Ue(n.pathname);
        return {
          matches: notFoundMatches,
          pendingActionResult: [
            route.id,
            {
              type: `error`,
              error,
            },
          ],
        };
      }
    }
    let h;
    let g = Ip(l, n);
    if (!g.route.action && !g.route.lazy) {
      h = {
        type: `error`,
        error: yp(405, {
          method: t.method,
          pathname: n.pathname,
          routeId: g.route.id,
        }),
      };
    } else {
      let e = await Oe(t, n, ep(a, o, t, n, l, g, p ? [] : r, d), d, null);
      h = e[g.route.id];
      if (!h) {
        for (let t of l) {
          if (e[t.route.id]) {
            h = e[t.route.id];
            break;
          }
        }
      }
      if (t.signal.aborted) {
        return {
          shortCircuited: true,
        };
      }
    }
    if (Op(h)) {
      let n;
      n =
        m && m.replace != null
          ? m.replace
          : cp(
              h.response.headers.get(`Location`),
              new URL(t.url),
              c,
              e.history,
            ) ===
            w.location.pathname + w.location.search;
      await De(t, h, true, {
        submission,
        replace: n,
      });
      return {
        shortCircuited: true,
      };
    }
    if (Dp(h)) {
      let e = _p(l, g.route.id);
      if ((m && m.replace) !== true) {
        T = `PUSH`;
      }
      return {
        matches: l,
        pendingActionResult: [e.route.id, h, g.route.id],
      };
    }
    return {
      matches: l,
      pendingActionResult: [g.route.id, h],
    };
  }
  async function xe(t, n, i, l, u, active, f, p, m, h, g, _, v, y) {
    let b = f || Rp(n, i, l, p);
    let x = p || m || Lp(b);
    let S = !ne && !g;
    if (active) {
      if (S) {
        let e = Se(v);
        he(
          {
            navigation: b,
            ...(e === undefined
              ? {}
              : {
                  actionData: e,
                }),
          },
          {
            flushSync: _,
          },
        );
      }
      let e = await Ye(i, n.pathname, t.signal);
      if (e.type === `aborted`) {
        return {
          shortCircuited: true,
        };
      }
      if (e.type === `error`) {
        if (e.partialMatches.length === 0) {
          let { matches, route } = vp(s.activeRoutes);
          return {
            matches,
            loaderData: {},
            errors: {
              [route.id]: e.error,
            },
          };
        }
        let t = _p(e.partialMatches).route.id;
        return {
          matches: e.partialMatches,
          loaderData: {},
          errors: {
            [t]: e.error,
          },
        };
      }
      if (e.matches) {
        i = e.matches;
      } else {
        let { error, notFoundMatches, route } = Ue(n.pathname);
        return {
          matches: notFoundMatches,
          loaderData: {},
          errors: {
            [route.id]: error,
          },
        };
      }
    }
    let s_activeRoutes = s.activeRoutes;
    let { dsMatches, revalidatingFetchers } = Ff(
      t,
      u,
      a,
      o,
      e.history,
      w,
      i,
      x,
      n,
      g ? [] : r,
      g === true,
      A,
      re,
      le,
      se,
      M,
      s_activeRoutes,
      c,
      e.patchRoutesOnNavigation != null,
      s.branches,
      v,
      y,
    );
    ae = ++ie;
    if (
      !e.dataStrategy &&
      !dsMatches.some((e) => e.shouldLoad) &&
      !dsMatches.some(
        (e) => e.route.middleware && e.route.middleware.length > 0,
      ) &&
      revalidatingFetchers.length === 0
    ) {
      let e = new Map(w.fetchers);
      let t = Re(e);
      ge(
        n,
        {
          matches: i,
          loaderData: {},
          errors:
            v && Dp(v[1])
              ? {
                  [v[0]]: v[1].error,
                }
              : null,
          ...gp(v),
          ...(t
            ? {
                fetchers: e,
              }
            : {}),
        },
        {
          flushSync: _,
        },
      );
      return {
        shortCircuited: true,
      };
    }
    if (S) {
      let e = {};
      if (!active) {
        e.navigation = b;
        let t = Se(v);
        if (t !== undefined) {
          e.actionData = t;
        }
      }
      if (revalidatingFetchers.length > 0) {
        e.fetchers = Ce(revalidatingFetchers);
      }
      he(e, {
        flushSync: _,
      });
    }
    revalidatingFetchers.forEach((e) => {
      Le(e.key);
      if (e.controller) {
        _internalFetchControllers.set(e.key, e.controller);
      }
    });
    let D = () => revalidatingFetchers.forEach((e) => Le(e.key));
    if (O) {
      O.signal.addEventListener(`abort`, D);
    }
    let { loaderResults, fetcherResults } = await ke(
      dsMatches,
      revalidatingFetchers,
      t,
      n,
      u,
    );
    if (t.signal.aborted) {
      return {
        shortCircuited: true,
      };
    }
    if (O) {
      O.signal.removeEventListener(`abort`, D);
    }
    revalidatingFetchers.forEach((e) =>
      _internalFetchControllers.delete(e.key),
    );
    let te = bp(loaderResults);
    if (te) {
      await De(t, te.result, true, {
        replace: h,
      });
      return {
        shortCircuited: true,
      };
    }
    te = bp(fetcherResults);
    if (te) {
      M.add(te.key);
      await De(t, te.result, true, {
        replace: h,
      });
      return {
        shortCircuited: true,
      };
    }
    let workingFetchers = new Map(w.fetchers);
    let { loaderData, errors } = mp(
      w,
      i,
      loaderResults,
      v,
      revalidatingFetchers,
      fetcherResults,
      workingFetchers,
    );
    if (g && w.errors) {
      errors = {
        ...w.errors,
        ...errors,
      };
    }
    let ue = Re(workingFetchers);
    let de = ze(ae, workingFetchers);
    let fe = ue || de || revalidatingFetchers.length > 0;
    return {
      matches: i,
      loaderData,
      errors,
      ...(fe
        ? {
            workingFetchers,
          }
        : {}),
    };
  }
  function Se(e) {
    if (e && !Dp(e[1])) {
      return {
        [e[0]]: e[1].data,
      };
    }
    if (w.actionData) {
      if (Object.keys(w.actionData).length === 0) {
        return null;
      }
      return w.actionData;
    }
  }
  function Ce(revalidatingFetchers) {
    let t = new Map(w.fetchers);
    revalidatingFetchers.forEach((e) => {
      let n = t.get(e.key);
      let r = Bp(undefined, n ? n.data : undefined);
      t.set(e.key, r);
    });
    return t;
  }
  async function fetch(t, n, r, i) {
    Le(t);
    let a = (i && i.flushSync) === true;
    let s_activeRoutes = s.activeRoutes;
    let l = Nf(w.location, w.matches, c, r, n, i?.relative);
    let u = ud(s_activeRoutes, l, c, false, s.branches);
    let d = Je(u, s_activeRoutes, l);
    if (d.active && d.matches) {
      u = d.matches;
    }
    if (!u) {
      Me(
        t,
        n,
        yp(404, {
          pathname: l,
        }),
        {
          flushSync: a,
        },
      );
      return;
    }
    let { path, submission, error } = Pf(true, l, i);
    if (error) {
      Me(t, n, error, {
        flushSync: a,
      });
      return;
    }
    let h = e.getContext ? await e.getContext() : new td();
    let g = (i && i.preventScrollReset) === true;
    if (submission && Pp(submission.formMethod)) {
      await Te(
        t,
        n,
        path,
        u,
        h,
        d.active,
        a,
        g,
        submission,
        i && i.defaultShouldRevalidate,
      );
      return;
    }
    se.set(t, {
      routeId: n,
      path,
    });
    await Ee(t, n, path, u, h, d.active, a, g, submission);
  }
  async function Te(t, n, path, l, u, active, f, p, fetcherSubmission, h) {
    Ae();
    se.delete(t);
    je(t, Vp(fetcherSubmission, w.fetchers.get(t)), {
      flushSync: f,
    });
    let g = new AbortController();
    let _ = lp(e.history, path, g.signal, fetcherSubmission);
    if (active) {
      let e = await Ye(l, new URL(_.url).pathname, _.signal, t);
      if (e.type === `aborted`) {
        return;
      }
      if (e.type === `error`) {
        Me(t, n, e.error, {
          flushSync: f,
        });
        return;
      }
      if (e.matches) {
        l = e.matches;
      } else {
        Me(
          t,
          n,
          yp(404, {
            pathname: path,
          }),
          {
            flushSync: f,
          },
        );
        return;
      }
    }
    let v = Ip(l, path);
    if (!v.route.action && !v.route.lazy) {
      Me(
        t,
        n,
        yp(405, {
          method: fetcherSubmission.formMethod,
          pathname: path,
          routeId: n,
        }),
        {
          flushSync: f,
        },
      );
      return;
    }
    _internalFetchControllers.set(t, g);
    let y = ie;
    let b = ep(a, o, _, path, l, v, r, u);
    let x = await Oe(_, path, b, u, t);
    let S = x[v.route.id];
    if (!S) {
      for (let e of b) {
        if (x[e.route.id]) {
          S = x[e.route.id];
          break;
        }
      }
    }
    if (_.signal.aborted) {
      if (_internalFetchControllers.get(t) === g) {
        _internalFetchControllers.delete(t);
      }
      return;
    }
    if (le.has(t)) {
      if (Op(S) || Dp(S)) {
        je(t, Hp(undefined));
        return;
      }
    } else {
      if (Op(S)) {
        _internalFetchControllers.delete(t);
        if (ae > y) {
          je(t, Hp(undefined));
          return;
        }
        M.add(t);
        je(t, Bp(fetcherSubmission));
        return De(_, S, false, {
          fetcherSubmission,
          preventScrollReset: p,
        });
      }
      if (Dp(S)) {
        Me(t, n, S.error);
        return;
      }
    }
    let C = w.navigation.location || w.location;
    let E = lp(e.history, C, g.signal);
    let s_activeRoutes = s.activeRoutes;
    let k =
      w.navigation.state === `idle`
        ? w.matches
        : ud(s_activeRoutes, w.navigation.location, c, false, s.branches);
    $(k, `Didn't find any matches after fetcher action`);
    let ee = ++ie;
    oe.set(t, ee);
    let { dsMatches, revalidatingFetchers } = Ff(
      E,
      u,
      a,
      o,
      e.history,
      w,
      k,
      fetcherSubmission,
      C,
      r,
      false,
      A,
      re,
      le,
      se,
      M,
      s_activeRoutes,
      c,
      e.patchRoutesOnNavigation != null,
      s.branches,
      [v.route.id, S],
      h,
    );
    let ce = Bp(fetcherSubmission, S.data);
    let N = new Map(w.fetchers);
    N.set(t, ce);
    revalidatingFetchers
      .filter((e) => e.key !== t)
      .forEach((e) => {
        let e_key = e.key;
        let n = N.get(e_key);
        let r = Bp(undefined, n ? n.data : undefined);
        N.set(e_key, r);
        Le(e_key);
        if (e.controller) {
          _internalFetchControllers.set(e_key, e.controller);
        }
      });
    he({
      fetchers: N,
    });
    let ue = () => revalidatingFetchers.forEach((e) => Le(e.key));
    g.signal.addEventListener(`abort`, ue);
    let { loaderResults, fetcherResults } = await ke(
      dsMatches,
      revalidatingFetchers,
      E,
      C,
      u,
    );
    if (g.signal.aborted) {
      return;
    }
    g.signal.removeEventListener(`abort`, ue);
    oe.delete(t);
    _internalFetchControllers.delete(t);
    revalidatingFetchers.forEach((e) =>
      _internalFetchControllers.delete(e.key),
    );
    let pe = w.fetchers.has(t);
    let me = (e) => {
      if (!pe) {
        return e;
      }
      let n = new Map(e.fetchers);
      n.set(t, Hp(S.data));
      return {
        ...e,
        fetchers: n,
      };
    };
    let _e = bp(loaderResults);
    if (_e) {
      w = me(w);
      return De(E, _e.result, false, {
        preventScrollReset: p,
      });
    }
    _e = bp(fetcherResults);
    if (_e) {
      M.add(_e.key);
      w = me(w);
      return De(E, _e.result, false, {
        preventScrollReset: p,
      });
    }
    let ve = new Map(w.fetchers);
    if (pe) {
      ve.set(t, Hp(S.data));
    }
    let { loaderData, errors } = mp(
      w,
      k,
      loaderResults,
      undefined,
      revalidatingFetchers,
      fetcherResults,
      ve,
    );
    ze(ee, ve);
    if (w.navigation.state === `loading` && ee > ae) {
      $(T, `Expected pending action`);
      if (O) {
        O.abort();
      }
      ge(w.navigation.location, {
        matches: k,
        loaderData,
        errors,
        fetchers: ve,
      });
    } else {
      he({
        errors,
        loaderData: hp(w.loaderData, loaderData, k, errors),
        fetchers: ve,
      });
      A = false;
    }
  }
  async function Ee(t, n, path, s, c, active, u, d, submission) {
    let p = w.fetchers.get(t);
    je(t, Bp(submission, p ? p.data : undefined), {
      flushSync: u,
    });
    let m = new AbortController();
    let h = lp(e.history, path, m.signal);
    if (active) {
      let e = await Ye(s, new URL(h.url).pathname, h.signal, t);
      if (e.type === `aborted`) {
        return;
      }
      if (e.type === `error`) {
        Me(t, n, e.error, {
          flushSync: u,
        });
        return;
      }
      if (e.matches) {
        s = e.matches;
      } else {
        Me(
          t,
          n,
          yp(404, {
            pathname: path,
          }),
          {
            flushSync: u,
          },
        );
        return;
      }
    }
    let g = Ip(s, path);
    _internalFetchControllers.set(t, m);
    let _ = ie;
    let v = await Oe(h, path, ep(a, o, h, path, s, g, r, c), c, t);
    let y = v[g.route.id];
    if (!y) {
      for (let e of s) {
        if (v[e.route.id]) {
          y = v[e.route.id];
          break;
        }
      }
    }
    if (_internalFetchControllers.get(t) === m) {
      _internalFetchControllers.delete(t);
    }
    if (!h.signal.aborted) {
      if (le.has(t)) {
        je(t, Hp(undefined));
        return;
      }
      if (Op(y)) {
        if (ae > _) {
          je(t, Hp(undefined));
          return;
        }
        M.add(t);
        await De(h, y, false, {
          preventScrollReset: d,
        });
        return;
      }
      if (Dp(y)) {
        Me(t, n, y.error);
        return;
      }
      je(t, Hp(y.data));
    }
  }
  async function De(
    r,
    i,
    a,
    { submission, fetcherSubmission, preventScrollReset, replace } = {},
  ) {
    if (!a) {
      E?.resolve();
      E = null;
    }
    if (i.response.headers.has(`X-Remix-Revalidate`)) {
      A = true;
    }
    let formAction_1 = i.response.headers.get(`Location`);
    $(formAction_1, `Expected a Location header on the redirect Response`);
    let f = formAction_1;
    let p = new URL(r.url);
    formAction_1 = cp(formAction_1, p, c, e.history);
    pf(f, formAction_1, p, `allow-explicit`);
    let m = Yu(w.location, formAction_1, {
      _isRedirect: true,
    });
    if (n) {
      let e = false;
      if (i.response.headers.has(`X-Remix-Reload-Document`)) {
        e = true;
      } else if (Md(formAction_1)) {
        let n = $u(window_1, formAction_1, true);
        e = n.origin !== window_1.location.origin || Ad(n.pathname, c) == null;
      }
      if (e) {
        if (replace) {
          window_1.location.replace(formAction_1);
        } else {
          window_1.location.assign(formAction_1);
        }
        return;
      }
    }
    O = null;
    let h =
      replace === true || i.response.headers.has(`X-Remix-Replace`)
        ? `REPLACE`
        : `PUSH`;
    let { formMethod, formAction, formEncType } = w.navigation;
    if (
      !submission &&
      !fetcherSubmission &&
      formMethod &&
      formAction &&
      formEncType
    ) {
      submission = Lp(w.navigation);
    }
    let y = submission || fetcherSubmission;
    if (yf.has(i.response.status) && y && Pp(y.formMethod)) {
      await ye(h, m, {
        submission: {
          ...y,
          formAction: formAction_1,
        },
        preventScrollReset: preventScrollReset || D,
        enableViewTransition: a ? k : undefined,
      });
    } else {
      await ye(h, m, {
        overrideNavigation: Rp(m, [], h, submission),
        fetcherSubmission,
        preventScrollReset: preventScrollReset || D,
        enableViewTransition: a ? k : undefined,
      });
    }
  }
  async function Oe(e, t, n, r, i) {
    let a;
    let o = {};
    try {
      a = await tp(l, e, t, n, i, r, false);
    } catch (error) {
      n.filter((e) => e.shouldLoad).forEach((t) => {
        o[t.route.id] = {
          type: `error`,
          error,
        };
      });
      return o;
    }
    if (e.signal.aborted) {
      return o;
    }
    if (!Pp(e.method)) {
      for (let e of n) {
        if (a[e.route.id]?.type === `error`) {
          break;
        }
        if (
          !a.hasOwnProperty(e.route.id) &&
          !w.loaderData.hasOwnProperty(e.route.id) &&
          (!w.errors || !w.errors.hasOwnProperty(e.route.id)) &&
          e.shouldCallHandler()
        ) {
          a[e.route.id] = {
            type: `error`,
            result: Error(
              `No result returned from dataStrategy for route ${e.route.id}`,
            ),
          };
        }
      }
    }
    for (let [t, r] of Object.entries(a)) {
      if (Ep(r)) {
        let i = r.result;
        o[t] = {
          type: `redirect`,
          response: ap(i, e, t, n, c),
        };
      } else {
        o[t] = await ip(r);
      }
    }
    return o;
  }
  async function ke(dsMatches, revalidatingFetchers, n, r, i) {
    let a = Oe(n, r, dsMatches, i, null);
    let o = Promise.all(
      revalidatingFetchers.map(async (e) => {
        if (e.matches && e.match && e.request && e.controller) {
          let t = (await Oe(e.request, e.path, e.matches, i, e.key))[
            e.match.route.id
          ];
          return {
            [e.key]: t,
          };
        }
        return Promise.resolve({
          [e.key]: {
            type: `error`,
            error: yp(404, {
              pathname: e.path,
            }),
          },
        });
      }),
    );
    return {
      loaderResults: await a,
      fetcherResults: (await o).reduce(
        (acc, item) => Object.assign(acc, item),
        {},
      ),
    };
  }
  function Ae() {
    A = true;
    se.forEach((e, t) => {
      if (_internalFetchControllers.has(t)) {
        re.add(t);
      }
      Le(t);
    });
  }
  function je(e, t, n = {}) {
    let r = new Map(w.fetchers);
    r.set(e, t);
    he(
      {
        fetchers: r,
      },
      {
        flushSync: (n && n.flushSync) === true,
      },
    );
  }
  function Me(e, t, n, r = {}) {
    let i = _p(w.matches, t);
    let a = new Map(w.fetchers);
    Fe(a, e);
    he(
      {
        errors: {
          [i.route.id]: n,
        },
        fetchers: a,
      },
      {
        flushSync: (r && r.flushSync) === true,
      },
    );
  }
  function getFetcher(e) {
    ce.set(e, (ce.get(e) || 0) + 1);
    if (le.has(e)) {
      le.delete(e);
    }
    return w.fetchers.get(e) || xf;
  }
  function resetFetcher(e, t) {
    Le(e, t?.reason);
    je(e, Hp(null));
  }
  function Fe(e, t) {
    let n = w.fetchers.get(t);
    if (
      _internalFetchControllers.has(t) &&
      !(n && n.state === `loading` && oe.has(t))
    ) {
      Le(t);
    }
    se.delete(t);
    oe.delete(t);
    M.delete(t);
    le.delete(t);
    re.delete(t);
    e.delete(t);
  }
  function deleteFetcher(e) {
    let t = (ce.get(e) || 0) - 1;
    if (t <= 0) {
      ce.delete(e);
      le.add(e);
    } else {
      ce.set(e, t);
    }
    he({
      fetchers: new Map(w.fetchers),
    });
  }
  function Le(e, t) {
    let n = _internalFetchControllers.get(e);
    if (n) {
      n.abort(t);
      _internalFetchControllers.delete(e);
    }
  }
  function P(e, t) {
    for (let n of e) {
      let e = t.get(n);
      $(e, `Expected fetcher: ${n}`);
      let r = Hp(e.data);
      t.set(n, r);
    }
  }
  function Re(e) {
    let t = [];
    let n = false;
    for (let r of M) {
      let i = e.get(r);
      $(i, `Expected fetcher: ${r}`);
      if (i.state === `loading`) {
        M.delete(r);
        t.push(r);
        n = true;
      }
    }
    P(t, e);
    return n;
  }
  function ze(e, t) {
    let n = [];
    for (let [r, i] of oe) {
      if (i < e) {
        let e = t.get(r);
        $(e, `Expected fetcher: ${r}`);
        if (e.state === `loading`) {
          Le(r);
          oe.delete(r);
          n.push(r);
        }
      }
    }
    P(n, t);
    return n.length > 0;
  }
  function getBlocker(e, t) {
    let n = w.blockers.get(e) || Sf;
    if (N.get(e) !== t) {
      N.set(e, t);
    }
    return n;
  }
  function deleteBlocker(e) {
    w.blockers.delete(e);
    N.delete(e);
  }
  function He(e, t) {
    let n = w.blockers.get(e) || Sf;
    $(
      (n.state === `unblocked` && t.state === `blocked`) ||
        (n.state === `blocked` && t.state === `blocked`) ||
        (n.state === `blocked` && t.state === `proceeding`) ||
        (n.state === `blocked` && t.state === `unblocked`) ||
        (n.state === `proceeding` && t.state === `unblocked`),
      `Invalid blocker state transition: ${n.state} -> ${t.state}`,
    );
    let r = new Map(w.blockers);
    r.set(e, t);
    he({
      blockers: r,
    });
  }
  function F({ currentLocation, nextLocation, historyAction }) {
    if (N.size === 0) {
      return;
    }
    if (N.size > 1) {
      Ku(false, `A router only supports one blocker at a time`);
    }
    let r = Array.from(N.entries());
    let [i, a] = r[r.length - 1];
    let o = w.blockers.get(i);
    if (
      !(o && o.state === `proceeding`) &&
      a({
        currentLocation,
        nextLocation,
        historyAction,
      })
    ) {
      return i;
    }
  }
  function Ue(pathname) {
    let t = yp(404, {
      pathname,
    });
    let s_activeRoutes = s.activeRoutes;
    let { matches, route } = vp(s_activeRoutes);
    return {
      notFoundMatches: matches,
      route,
      error: t,
    };
  }
  function enableScrollRestoration(e, t, n) {
    m = e;
    g = t;
    h = n || null;
    if (!_ && w.navigation === bf) {
      _ = true;
      let restoreScrollPosition = qe(w.location, w.matches);
      if (restoreScrollPosition != null) {
        he({
          restoreScrollPosition,
        });
      }
    }
    return () => {
      m = null;
      g = null;
      h = null;
    };
  }
  function Ge(e, t) {
    return (
      (h &&
        h(
          e,
          t.map((e) => dd(e, w.loaderData)),
        )) ||
      e.key
    );
  }
  function Ke(location, matches) {
    if (m && g) {
      let n = Ge(location, matches);
      m[n] = g();
    }
  }
  function qe(e, t) {
    if (m) {
      let n = Ge(e, t);
      let r = m[n];
      if (typeof r == `number`) {
        return r;
      }
    }
    return null;
  }
  function Je(t, n, r) {
    if (e.patchRoutesOnNavigation) {
      let e = s.branches;
      if (!t) {
        return {
          active: true,
          matches: ud(n, r, c, true, e) || [],
        };
      }
      if (Object.keys(t[0].params).length > 0) {
        return {
          active: true,
          matches: ud(n, r, c, true, e),
        };
      }
    }
    return {
      active: false,
      matches: null,
    };
  }
  async function Ye(t, pathname, signal, i) {
    if (!e.patchRoutesOnNavigation) {
      return {
        type: `success`,
        matches: t,
      };
    }
    let l = t;
    while (true) {
      let t = o;
      try {
        await e.patchRoutesOnNavigation({
          signal,
          path: pathname,
          matches: l,
          fetcherKey: i,
          patch: (e, n) => {
            if (!signal.aborted) {
              Vf(e, n, s, t, a, false);
            }
          },
        });
      } catch (error) {
        return {
          type: `error`,
          error,
          partialMatches: l,
        };
      }
      if (signal.aborted) {
        return {
          type: `aborted`,
        };
      }
      let u = s.branches;
      let d = ud(s.activeRoutes, pathname, c, false, u);
      let f = null;
      if (
        d &&
        (Object.keys(d[0].params).length === 0 ||
          ((f = ud(s.activeRoutes, pathname, c, true, u)),
          !(f && l.length < f.length && Xe(l, f.slice(0, l.length)))))
      ) {
        return {
          type: `success`,
          matches: d,
        };
      }
      f ||= ud(s.activeRoutes, pathname, c, true, u);
      if (!f || Xe(l, f)) {
        return {
          type: `success`,
          matches: null,
        };
      }
      l = f;
    }
  }
  function Xe(e, t) {
    return (
      e.length === t.length && e.every((e, n) => e.route.id === t[n].route.id)
    );
  }
  function _internalSetRoutes(e) {
    o = {};
    s.setHmrRoutes(sd(e, a, undefined, o));
  }
  function patchRoutes(e, t, n = false) {
    Vf(e, t, s, o, a, n);
    if (!s.hasHMRRoutes) {
      he({});
    }
  }
  C = {
    get basename() {
      return c;
    },
    get future() {
      return future;
    },
    get state() {
      return w;
    },
    get routes() {
      return s.stableRoutes;
    },
    get branches() {
      return s.branches;
    },
    get manifest() {
      return o;
    },
    get window() {
      return window_1;
    },
    initialize,
    subscribe,
    enableScrollRestoration,
    navigate,
    fetch,
    revalidate,
    createHref: (t) => e.history.createHref(t),
    createURL: (t) => e.history.createURL(t),
    encodeLocation: (t) => e.history.encodeLocation(t),
    getFetcher,
    resetFetcher,
    deleteFetcher,
    dispose,
    getBlocker,
    deleteBlocker,
    patchRoutes,
    _internalFetchControllers,
    _internalSetRoutes,
    _internalSetStateDoNotUseOrYouWillBreakYourApp(e) {
      he(e);
    },
  };
  if (e.instrumentations) {
    C = $d(C, e.instrumentations.map((e) => e.router).filter(Boolean));
  }
  return C;
}
function Mf(e) {
  return (
    e != null &&
    ((`formData` in e && e.formData != null) ||
      (`body` in e && e.body !== undefined))
  );
}
function Nf(e, t, n, r, i, a) {
  let o;
  let s;
  if (i) {
    o = [];
    for (let e of t) {
      o.push(e);
      if (e.route.id === i) {
        s = e;
        break;
      }
    }
  } else {
    o = t;
    s = t[t.length - 1];
  }
  let c = Rd(r || `.`, Ld(o), Ad(e.pathname, n) || e.pathname, a === `path`);
  r ?? ((c.search = e.search), (c.hash = e.hash));
  if ((r == null || r === `` || r === `.`) && s) {
    let e = Fp(c.search);
    if (s.route.index && !e) {
      c.search = c.search ? c.search.replace(/^\?/, `?index&`) : `?index`;
    } else if (!s.route.index && e) {
      let e = new URLSearchParams(c.search);
      let t = e.getAll(`index`);
      e.delete(`index`);
      t.filter((e) => e).forEach((t) => e.append(`index`, t));
      let n = e.toString();
      c.search = n ? `?${n}` : ``;
    }
  }
  if (n !== `/`) {
    c.pathname = jd({
      basename: n,
      pathname: c.pathname,
    });
  }
  return Xu(c);
}
function Pf(e, t, n) {
  if (!n || !Mf(n)) {
    return {
      path: t,
    };
  }
  if (n.formMethod && !Np(n.formMethod)) {
    return {
      path: t,
      error: yp(405, {
        method: n.formMethod,
      }),
    };
  }
  let r = () => ({
    path: t,
    error: yp(400, {
      type: `invalid-body`,
    }),
  });
  let formMethod = (n.formMethod || `get`).toUpperCase();
  let formAction = xp(t);
  if (n.body !== undefined) {
    if (n.formEncType === `text/plain`) {
      if (!Pp(formMethod)) {
        return r();
      }
      let text =
        typeof n.body == `string`
          ? n.body
          : n.body instanceof FormData || n.body instanceof URLSearchParams
            ? Array.from(n.body.entries()).reduce(
                (acc, [t, n]) => `${acc}${t}=${n}
`,
                ``,
              )
            : String(n.body);
      return {
        path: t,
        submission: {
          formMethod,
          formAction,
          formEncType: n.formEncType,
          formData: undefined,
          json: undefined,
          text,
        },
      };
    }
    if (n.formEncType === `application/json`) {
      if (!Pp(formMethod)) {
        return r();
      }
      try {
        let json = typeof n.body == `string` ? JSON.parse(n.body) : n.body;
        return {
          path: t,
          submission: {
            formMethod,
            formAction,
            formEncType: n.formEncType,
            formData: undefined,
            json,
            text: undefined,
          },
        };
      } catch {
        return r();
      }
    }
  }
  $(
    typeof FormData == `function`,
    `FormData is not available in this environment`,
  );
  let o;
  let s;
  if (n.formData) {
    o = dp(n.formData);
    s = n.formData;
  } else if (n.body instanceof FormData) {
    o = dp(n.body);
    s = n.body;
  } else if (n.body instanceof URLSearchParams) {
    o = n.body;
    s = fp(o);
  } else if (n.body == null) {
    o = new URLSearchParams();
    s = new FormData();
  } else {
    try {
      o = new URLSearchParams(n.body);
      s = fp(o);
    } catch {
      return r();
    }
  }
  let submission = {
    formMethod,
    formAction,
    formEncType: (n && n.formEncType) || `application/x-www-form-urlencoded`,
    formData: s,
    json: undefined,
    text: undefined,
  };
  if (Pp(submission.formMethod)) {
    return {
      path: t,
      submission,
    };
  }
  let l = Zu(t);
  if (e && l.search && Fp(l.search)) {
    o.append(`index`, ``);
  }
  l.search = `?${o}`;
  return {
    path: Xu(l),
    submission,
  };
}
function Ff(
  e,
  t,
  n,
  r,
  history,
  a,
  o,
  s,
  c,
  l,
  u,
  d,
  f,
  p,
  m,
  h,
  g,
  _,
  v,
  branches,
  b,
  x,
) {
  let actionResult = b ? (Dp(b[1]) ? b[1].error : b[1].data) : undefined;
  let currentUrl = history.createURL(a.location);
  let nextUrl = history.createURL(c);
  let T;
  if (u && a.errors) {
    let e = Object.keys(a.errors)[0];
    T = o.findIndex((t) => t.route.id === e);
  } else if (b && Dp(b[1])) {
    let e = b[0];
    T = o.findIndex((t) => t.route.id === e) - 1;
  }
  let actionStatus = b ? b[1].statusCode : undefined;
  let D = actionStatus && actionStatus >= 400;
  let O = {
    currentUrl,
    currentParams: a.matches[0]?.params || {},
    nextUrl,
    nextParams: o[0].params,
    ...s,
    actionResult,
    actionStatus,
  };
  let k = Jd(o);
  let dsMatches = o.map((i, o) => {
    let { route } = i;
    let f = null;
    if (T != null && o > T) {
      f = false;
    } else if (route.lazy) {
      f = true;
    } else if (!If(route)) {
      f = false;
    } else if (u) {
      let { shouldLoad } = Lf(route, a.loaderData, a.errors);
      f = shouldLoad;
    } else {
      if (Rf(a.loaderData, a.matches[o], i)) {
        f = true;
      }
    }
    if (f !== null) {
      return $f(n, r, e, c, k, i, l, t, f);
    }
    let p = false;
    if (typeof x == `boolean`) {
      p = x;
    } else if (D) {
      p = false;
    } else if (
      d ||
      currentUrl.pathname + currentUrl.search ===
        nextUrl.pathname + nextUrl.search
    ) {
      p = true;
    } else if (currentUrl.search === nextUrl.search) {
      if (zf(a.matches[o], i)) {
        p = true;
      }
    } else {
      p = true;
    }
    let m = {
      ...O,
      defaultShouldRevalidate: p,
    };
    let h = Bf(i, m);
    return $f(n, r, e, c, k, i, l, t, h, m, x);
  });
  let revalidatingFetchers = [];
  m.forEach((e, s) => {
    if (u || !o.some((t) => t.route.id === e.routeId) || p.has(s)) {
      return;
    }
    let c = a.fetchers.get(s);
    let m = c && c.state !== `idle` && c.data === undefined;
    let b = ud(g, e.path, _ ?? `/`, false, branches);
    if (!b) {
      if (v && m) {
        return;
      }
      revalidatingFetchers.push({
        key: s,
        routeId: e.routeId,
        path: e.path,
        matches: null,
        match: null,
        request: null,
        controller: null,
      });
      return;
    }
    if (h.has(s)) {
      return;
    }
    let S = Ip(b, e.path);
    let controller = new AbortController();
    let w = lp(history, e.path, controller.signal);
    let T = null;
    if (f.has(s)) {
      f.delete(s);
      T = ep(n, r, w, e.path, b, S, l, t);
    } else if (m) {
      if (d) {
        T = ep(n, r, w, e.path, b, S, l, t);
      }
    } else {
      let i;
      i = typeof x == `boolean` ? x : !D && d;
      let a = {
        ...O,
        defaultShouldRevalidate: i,
      };
      if (Bf(S, a)) {
        T = ep(n, r, w, e.path, b, S, l, t, a);
      }
    }
    if (T) {
      revalidatingFetchers.push({
        key: s,
        routeId: e.routeId,
        path: e.path,
        matches: T,
        match: S,
        request: w,
        controller,
      });
    }
  });
  return {
    dsMatches,
    revalidatingFetchers,
  };
}
function If(e) {
  return e.loader != null || (e.middleware != null && e.middleware.length > 0);
}
function Lf(route, t, n) {
  if (route.lazy) {
    return {
      shouldLoad: true,
      renderFallback: true,
    };
  }
  if (!If(route)) {
    return {
      shouldLoad: false,
      renderFallback: false,
    };
  }
  let r = t != null && route.id in t;
  let i = n != null && n[route.id] !== undefined;
  if (!r && i) {
    return {
      shouldLoad: false,
      renderFallback: false,
    };
  }
  if (typeof route.loader == `function` && route.loader.hydrate === true) {
    return {
      shouldLoad: true,
      renderFallback: !r,
    };
  }
  let a = !r && !i;
  return {
    shouldLoad: a,
    renderFallback: a,
  };
}
function Rf(loaderData, t, n) {
  let r = !t || n.route.id !== t.route.id;
  let i = !loaderData.hasOwnProperty(n.route.id);
  return r || i;
}
function zf(e, t) {
  let path = e.route.path;
  return (
    e.pathname !== t.pathname ||
    (path != null && path.endsWith(`*`) && e.params[`*`] !== t.params[`*`])
  );
}
function Bf(e, t) {
  if (e.route.shouldRevalidate) {
    let n = e.route.shouldRevalidate(t);
    if (typeof n == `boolean`) {
      return n;
    }
  }
  return t.defaultShouldRevalidate;
}
function Vf(e, t, n, r, i, a) {
  let o;
  if (e) {
    let t = r[e];
    $(t, `No route found to patch children into: routeId = ${e}`);
    t.children ||= [];
    o = t.children;
  } else {
    o = n.activeRoutes;
  }
  let s = [];
  let c = [];
  t.forEach((newRoute) => {
    let existingRoute = o.find((t) => Hf(newRoute, t));
    if (existingRoute) {
      c.push({
        existingRoute,
        newRoute,
      });
    } else {
      s.push(newRoute);
    }
  });
  if (s.length > 0) {
    let t = sd(s, i, [e || `_`, `patch`, String(o?.length || `0`)], r);
    o.push(...t);
  }
  if (a && c.length > 0) {
    for (let e = 0; e < c.length; e++) {
      let { existingRoute, newRoute } = c[e];
      let r = existingRoute;
      let [a] = sd([newRoute], i, [], {}, true);
      Object.assign(r, {
        element: a.element ? a.element : r.element,
        errorElement: a.errorElement ? a.errorElement : r.errorElement,
        hydrateFallbackElement: a.hydrateFallbackElement
          ? a.hydrateFallbackElement
          : r.hydrateFallbackElement,
      });
    }
  }
  if (!n.hasHMRRoutes) {
    n.setRoutes([...n.activeRoutes]);
  }
}
function Hf(e, t) {
  if (`id` in e && `id` in t && e.id === t.id) {
    return true;
  }
  if (
    e.index !== t.index ||
    e.path !== t.path ||
    e.caseSensitive !== t.caseSensitive
  ) {
    return false;
  }
  if (
    (!e.children || e.children.length === 0) &&
    (!t.children || t.children.length === 0)
  ) {
    return true;
  }
  return (
    e.children?.every((e, n) => t.children?.some((t) => Hf(e, t))) ?? false
  );
}
const Uf = new WeakMap();
const Wf = ({ key, route, manifest, mapRouteProperties }) => {
  let i = manifest[route.id];
  $(i, `No route found in manifest`);
  if (!i.lazy || typeof i.lazy != `object`) {
    return;
  }
  let a = i.lazy[key];
  if (!a) {
    return;
  }
  let o = Uf.get(i);
  if (!o) {
    o = {};
    Uf.set(i, o);
  }
  let s = o[key];
  if (s) {
    return s;
  }
  let c = (async () => {
    let t = rd(key);
    let n = i[key] !== undefined && key !== `hasErrorBoundary`;
    if (t) {
      Ku(
        !t,
        `Route property ` +
          key +
          ` is not a supported lazy route property. This property will be ignored.`,
      );
      o[key] = Promise.resolve();
    } else if (n) {
      Ku(
        false,
        `Route "${i.id}" has a static property "${key}" defined. The lazy property will be ignored.`,
      );
    } else {
      let t = await a();
      if (t != null) {
        Object.assign(i, {
          [key]: t,
        });
        Object.assign(i, mapRouteProperties(i));
      }
    }
    if (typeof i.lazy == `object`) {
      i.lazy[key] = undefined;
      if (Object.values(i.lazy).every((e) => e === undefined)) {
        i.lazy = undefined;
      }
    }
  })();
  o[key] = c;
  return c;
};
const Gf = new WeakMap();
function Kf(route, t, n, r, i) {
  let a = n[route.id];
  $(a, `No route found in manifest`);
  if (!route.lazy) {
    return {
      lazyRoutePromise: undefined,
      lazyHandlerPromise: undefined,
    };
  }
  if (typeof route.lazy == `function`) {
    let t = Gf.get(a);
    if (t) {
      return {
        lazyRoutePromise: t,
        lazyHandlerPromise: t,
      };
    }
    let n = (async () => {
      $(typeof route.lazy == `function`, `No lazy route function found`);
      let t = await route.lazy();
      let n = {};
      for (let e in t) {
        let r = t[e];
        if (r === undefined) {
          continue;
        }
        let i = ad(e);
        let o = a[e] !== undefined && e !== `hasErrorBoundary`;
        if (i) {
          Ku(
            !i,
            `Route property ` +
              e +
              ` is not a supported property to be returned from a lazy route function. This property will be ignored.`,
          );
        } else if (o) {
          Ku(
            !o,
            `Route "${a.id}" has a static property "${e}" defined but its lazy function is also returning a value for this property. The lazy route property "${e}" will be ignored.`,
          );
        } else {
          n[e] = r;
        }
      }
      Object.assign(a, n);
      Object.assign(a, {
        ...r(a),
        lazy: undefined,
      });
    })();
    Gf.set(a, n);
    n.catch(() => {});
    return {
      lazyRoutePromise: n,
      lazyHandlerPromise: n,
    };
  }
  let o = Object.keys(route.lazy);
  let s = [];
  let lazyHandlerPromise;
  for (let a of o) {
    if (i && i.includes(a)) {
      continue;
    }
    let o = Wf({
      key: a,
      route,
      manifest: n,
      mapRouteProperties: r,
    });
    if (o) {
      s.push(o);
      if (a === t) {
        lazyHandlerPromise = o;
      }
    }
  }
  let lazyRoutePromise =
    s.length > 0 ? Promise.all(s).then(() => {}) : undefined;
  lazyRoutePromise?.catch(() => {});
  lazyHandlerPromise?.catch(() => {});
  return {
    lazyRoutePromise,
    lazyHandlerPromise,
  };
}
async function qf(e) {
  let t = e.matches.filter((e) => e.shouldLoad);
  let n = {};
  (await Promise.all(t.map((e) => e.resolve()))).forEach((e, r) => {
    n[t[r].route.id] = e;
  });
  return n;
}
async function Jf(e) {
  if (e.matches.some((e) => e.route.middleware)) {
    return Yf(e, () => qf(e));
  }
  return qf(e);
}
function Yf(e, t) {
  return Xf(
    e,
    t,
    (e) => {
      if (Mp(e)) {
        throw e;
      }
      return e;
    },
    wp,
    n,
  );
  function n(result, n, r) {
    if (r) {
      return Promise.resolve(
        Object.assign(r.value, {
          [n]: {
            type: `error`,
            result,
          },
        }),
      );
    }
    {
      let { matches } = e;
      let i = _p(
        matches,
        matches[
          Math.min(
            Math.max(
              matches.findIndex((e) => e.route.id === n),
              0,
            ),
            Math.max(
              matches.findIndex((e) => e.shouldCallHandler()),
              0,
            ),
          )
        ].route.id,
      ).route.id;
      return Promise.resolve({
        [i]: {
          type: `error`,
          result,
        },
      });
    }
  }
}
async function Xf({ matches, ...rest }, t, n, r, i) {
  return await Zf(
    rest,
    matches.flatMap((e) => {
      if (e.route.middleware) {
        return e.route.middleware.map((t) => [e.route.id, t]);
      }
      return [];
    }),
    t,
    n,
    r,
    i,
  );
}
async function Zf(e, t, n, r, i, a, o = 0) {
  let { request } = e;
  if (request.signal.aborted) {
    throw (
      request.signal.reason ??
      Error(`Request aborted: ${request.method} ${request.url}`)
    );
  }
  let c = t[o];
  if (!c) {
    return await n();
  }
  let [l, u] = c;
  let d;
  let f = async () => {
    if (d) {
      throw Error("You may only call `next()` once per middleware");
    }
    try {
      d = {
        value: await Zf(e, t, n, r, i, a, o + 1),
      };
      return d.value;
    } catch (error) {
      d = {
        value: await a(error, l, d),
      };
      return d.value;
    }
  };
  try {
    let t = await u(e, f);
    let n = t == null ? undefined : r(t);
    if (i(n)) {
      return n;
    }
    if (d) {
      return n ?? d.value;
    }
    return (
      (d = {
        value: await f(),
      }),
      d.value
    );
  } catch (error) {
    return await a(error, l, d);
  }
}
function Qf(e, t, n, r, i) {
  let middleware = Wf({
    key: `middleware`,
    route: r.route,
    manifest: t,
    mapRouteProperties: e,
  });
  let o = Kf(r.route, Pp(n.method) ? `action` : `loader`, t, e, i);
  return {
    middleware,
    route: o.lazyRoutePromise,
    handler: o.lazyHandlerPromise,
  };
}
function $f(e, t, n, path, i, a, o, scopedContext, shouldLoad, l = null, u) {
  let d = false;
  let _lazyPromises = Qf(e, t, n, a, o);
  return {
    ...a,
    _lazyPromises,
    shouldLoad,
    shouldRevalidateArgs: l,
    shouldCallHandler(e) {
      d = true;
      if (l) {
        if (typeof u == `boolean`) {
          return Bf(a, {
            ...l,
            defaultShouldRevalidate: u,
          });
        }
        if (typeof e == `boolean`) {
          return Bf(a, {
            ...l,
            defaultShouldRevalidate: e,
          });
        }
        return Bf(a, l);
      }
      return shouldLoad;
    },
    resolve(handlerOverride) {
      let { lazy, loader, middleware } = a.route;
      let u =
        d ||
        shouldLoad ||
        (handlerOverride && !Pp(n.method) && (lazy || loader));
      let p = middleware && middleware.length > 0 && !loader && !lazy;
      if (u && (Pp(n.method) || !p)) {
        return np({
          request: n,
          path,
          pattern: i,
          match: a,
          lazyHandlerPromise: _lazyPromises?.handler,
          lazyRoutePromise: _lazyPromises?.route,
          handlerOverride,
          scopedContext,
        });
      }
      return Promise.resolve({
        type: `data`,
        result: undefined,
      });
    },
  };
}
function ep(e, t, n, r, i, a, o, s, c = null) {
  return i.map((l) => {
    if (l.route.id === a.route.id) {
      return $f(e, t, n, r, Jd(i), l, o, s, true, c);
    }
    return {
      ...l,
      shouldLoad: false,
      shouldRevalidateArgs: c,
      shouldCallHandler: () => false,
      _lazyPromises: Qf(e, t, n, l, o),
      resolve: () =>
        Promise.resolve({
          type: `data`,
          result: undefined,
        }),
    };
  });
}
async function tp(e, t, n, r, i, context, o) {
  if (r.some((e) => e._lazyPromises?.middleware)) {
    await Promise.all(r.map((e) => e._lazyPromises?.middleware));
  }
  let s = {
    request: t,
    url: up(t, n),
    pattern: Jd(r),
    params: r[0].params,
    context,
    matches: r,
  };
  let runClientMiddleware = o
    ? () => {
        throw Error(
          "You cannot call `runClientMiddleware()` from a static handler `dataStrategy`. Middleware is run outside of `dataStrategy` during SSR in order to bubble up the Response.  You can enable middleware via the `respond` API in `query`/`queryRoute`",
        );
      }
    : (e) => {
        let t = s;
        return Yf(t, () =>
          e({
            ...t,
            fetcherKey: i,
            runClientMiddleware: () => {
              throw Error(
                "Cannot call `runClientMiddleware()` from within an `runClientMiddleware` handler",
              );
            },
          }),
        );
      };
  let l = await e({
    ...s,
    fetcherKey: i,
    runClientMiddleware,
  });
  try {
    await Promise.all(
      r.flatMap((e) => [e._lazyPromises?.handler, e._lazyPromises?.route]),
    );
  } catch {}
  return l;
}
async function np({
  request,
  path,
  pattern,
  match,
  lazyHandlerPromise,
  lazyRoutePromise,
  handlerOverride,
  scopedContext,
}) {
  let c;
  let l;
  let u = Pp(request.method);
  let d = u ? `action` : `loader`;
  let f = (i) => {
    let a;
    let c = new Promise((resolve, reject) => (a = reject));
    l = () => a();
    request.signal.addEventListener(`abort`, l);
    let u = (a) => {
      if (typeof i == `function`) {
        return i(
          {
            request,
            url: up(request, path),
            pattern,
            params: match.params,
            context: scopedContext,
          },
          ...(a === undefined ? [] : [a]),
        );
      }
      return Promise.reject(
        Error(
          `You cannot call the handler for a route which defines a boolean "${d}" [routeId: ${match.route.id}]`,
        ),
      );
    };
    let f = (async () => {
      try {
        return {
          type: `data`,
          result: await (handlerOverride ? handlerOverride((e) => u(e)) : u()),
        };
      } catch (error) {
        return {
          type: `error`,
          result: error,
        };
      }
    })();
    return Promise.race([f, c]);
  };
  try {
    let t = u ? match.route.action : match.route.loader;
    if (lazyHandlerPromise || lazyRoutePromise) {
      if (t) {
        let e;
        let [n] = await Promise.all([
          f(t).catch((t) => {
            e = t;
          }),
          lazyHandlerPromise,
          lazyRoutePromise,
        ]);
        if (e !== undefined) {
          throw e;
        }
        c = n;
      } else {
        await lazyHandlerPromise;
        let t = u ? match.route.action : match.route.loader;
        if (t) {
          [c] = await Promise.all([f(t), lazyRoutePromise]);
        } else if (d === `action`) {
          let t = new URL(request.url);
          let pathname = t.pathname + t.search;
          throw yp(405, {
            method: request.method,
            pathname,
            routeId: match.route.id,
          });
        } else {
          return {
            type: `data`,
            result: undefined,
          };
        }
      }
    } else if (t) {
      c = await f(t);
    } else {
      let t = new URL(request.url);
      throw yp(404, {
        pathname: t.pathname + t.search,
      });
    }
  } catch (error) {
    return {
      type: `error`,
      result: error,
    };
  } finally {
    if (l) {
      request.signal.removeEventListener(`abort`, l);
    }
  }
  return c;
}
async function rp(result) {
  let t = result.headers.get(`Content-Type`);
  if (t && /\bapplication\/json\b/.test(t)) {
    if (result.body == null) {
      return null;
    }
    return result.json();
  }
  return result.text();
}
async function ip({ result, type }) {
  if (Ap(result)) {
    let e;
    try {
      e = await rp(result);
    } catch (error) {
      return {
        type: `error`,
        error,
      };
    }
    if (type === `error`) {
      return {
        type: `error`,
        error: new Kd(result.status, result.statusText, e),
        statusCode: result.status,
        headers: result.headers,
      };
    }
    return {
      type: `data`,
      data: e,
      statusCode: result.status,
      headers: result.headers,
    };
  }
  if (type === `error`) {
    if (kp(result)) {
      if (result.data instanceof Error) {
        return {
          type: `error`,
          error: result.data,
          statusCode: result.init?.status,
          headers: result.init?.headers
            ? new Headers(result.init.headers)
            : undefined,
        };
      }
      return {
        type: `error`,
        error: Cp(result),
        statusCode: qd(result) ? result.status : undefined,
        headers: result.init?.headers
          ? new Headers(result.init.headers)
          : undefined,
      };
    }
    return {
      type: `error`,
      error: result,
      statusCode: qd(result) ? result.status : undefined,
    };
  }
  if (kp(result)) {
    return {
      type: `data`,
      data: result.data,
      statusCode: result.init?.status,
      headers: result.init?.headers
        ? new Headers(result.init.headers)
        : undefined,
    };
  }
  return {
    type: `data`,
    data: result,
  };
}
function ap(e, t, n, r, i) {
  let a = e.headers.get(`Location`);
  $(
    a,
    `Redirects returned/thrown from loaders/actions must have a Location header`,
  );
  if (!Md(a)) {
    let o = r.slice(0, r.findIndex((e) => e.route.id === n) + 1);
    a = Nf(new URL(t.url), o, i, a);
    e.headers.set(`Location`, a);
  }
  return e;
}
const op = [
  `about:`,
  `blob:`,
  `chrome:`,
  `chrome-untrusted:`,
  `content:`,
  `data:`,
  `devtools:`,
  `file:`,
  `filesystem:`,
  `javascript:`,
];
function sp(e) {
  try {
    return op.includes(new URL(e).protocol);
  } catch {
    return false;
  }
}
function cp(e, t, n, history) {
  if (Md(e)) {
    let r = e;
    let i = Vu.test(r) ? new URL(Hu(r, t.protocol)) : new URL(r);
    if (sp(i.toString())) {
      throw Error(`Invalid redirect location`);
    }
    let a = Ad(i.pathname, n) != null;
    if (i.origin === t.origin && a) {
      return zd(i.pathname) + i.search + i.hash;
    }
  }
  try {
    if (sp(history.createURL(e).toString())) {
      throw Error(`Invalid redirect location`);
    }
  } catch {}
  return e;
}
function lp(e, t, signal, r) {
  let i = e.createURL(xp(t)).toString();
  let a = {
    signal,
  };
  if (r && Pp(r.formMethod)) {
    let { formMethod, formEncType } = r;
    a.method = formMethod.toUpperCase();
    if (formEncType === `application/json`) {
      a.headers = new Headers({
        "Content-Type": formEncType,
      });
      a.body = JSON.stringify(r.json);
    } else {
      a.body =
        formEncType === `text/plain`
          ? r.text
          : formEncType === `application/x-www-form-urlencoded` && r.formData
            ? dp(r.formData)
            : r.formData;
    }
  }
  return new Request(i, a);
}
function up(e, t) {
  let n = new URL(e.url);
  let r = typeof t == `string` ? Zu(t) : t;
  n.pathname = r.pathname || `/`;
  if (r.search) {
    let e = new URLSearchParams(r.search);
    let t = e.getAll(`index`);
    e.delete(`index`);
    for (let n of t.filter(Boolean)) {
      e.append(`index`, n);
    }
    n.search = e.size ? `?${e.toString()}` : ``;
  } else {
    n.search = ``;
  }
  n.hash = r.hash || ``;
  return n;
}
function dp(e) {
  let t = new URLSearchParams();
  for (let [n, r] of e.entries()) {
    t.append(n, typeof r == `string` ? r : r.name);
  }
  return t;
}
function fp(e) {
  let t = new FormData();
  for (let [n, r] of e.entries()) {
    t.append(n, r);
  }
  return t;
}
function pp(e, t, n, r = false, i = false) {
  let loaderData = {};
  let errors = null;
  let s;
  let c = false;
  let loaderHeaders = {};
  let u = n && Dp(n[1]) ? n[1].error : undefined;
  e.forEach((n) => {
    if (!(n.route.id in t)) {
      return;
    }
    let d = n.route.id;
    let f = t[d];
    $(!Op(f), `Cannot handle redirect results in processLoaderData`);
    if (Dp(f)) {
      let t = f.error;
      if (u !== undefined) {
        t = u;
        u = undefined;
      }
      errors ||= {};
      if (i) {
        errors[d] = t;
      } else {
        let n = _p(e, d);
        errors[n.route.id] ?? (errors[n.route.id] = t);
      }
      if (!r) {
        loaderData[d] = Tf;
      }
      if (!c) {
        c = true;
        s = qd(f.error) ? f.error.status : 500;
      }
      if (f.headers) {
        loaderHeaders[d] = f.headers;
      }
    } else {
      loaderData[d] = f.data;
      if (f.statusCode && f.statusCode !== 200 && !c) {
        s = f.statusCode;
      }
      if (f.headers) {
        loaderHeaders[d] = f.headers;
      }
    }
  });
  if (u !== undefined && n) {
    errors = {
      [n[0]]: u,
    };
    if (n[2]) {
      loaderData[n[2]] = undefined;
    }
  }
  return {
    loaderData,
    errors,
    statusCode: s || 200,
    loaderHeaders,
  };
}
function mp(e, t, loaderResults, r, revalidatingFetchers, fetcherResults, o) {
  let { loaderData, errors } = pp(t, loaderResults, r);
  revalidatingFetchers
    .filter((e) => !e.matches || e.matches.some((e) => e.shouldLoad))
    .forEach(({ key, match, controller }) => {
      if (controller && controller.signal.aborted) {
        return;
      }
      let s = fetcherResults[key];
      $(s, `Did not find corresponding fetcher result`);
      if (Dp(s)) {
        let t = _p(e.matches, match?.route.id);
        if (!(errors && errors[t.route.id])) {
          errors = {
            ...errors,
            [t.route.id]: s.error,
          };
        }
        o.delete(key);
      } else if (Op(s)) {
        $(false, `Unhandled fetcher revalidation redirect`);
      } else {
        let e = Hp(s.data);
        o.set(key, e);
      }
    });
  return {
    loaderData,
    errors,
  };
}
function hp(loaderData, t, n, errors) {
  let i = Object.entries(t)
    .filter(([, e]) => e !== Tf)
    .reduce((acc, [t, n]) => {
      acc[t] = n;
      return acc;
    }, {});
  for (let a of n) {
    let n = a.route.id;
    if (
      !t.hasOwnProperty(n) &&
      loaderData.hasOwnProperty(n) &&
      a.route.loader
    ) {
      i[n] = loaderData[n];
    }
    if (errors && errors.hasOwnProperty(n)) {
      break;
    }
  }
  return i;
}
function gp(e) {
  if (e) {
    if (Dp(e[1])) {
      return {
        actionData: {},
      };
    }
    return {
      actionData: {
        [e[0]]: e[1].data,
      },
    };
  }
  return {};
}
function _p(e, t) {
  return (
    (t ? e.slice(0, e.findIndex((e) => e.route.id === t) + 1) : [...e])
      .reverse()
      .find((e) => e.route.hasErrorBoundary === true) || e[0]
  );
}
function vp(e) {
  let t =
    e.length === 1
      ? e[0]
      : e.find((e) => e.index || !e.path || e.path === `/`) || {
          id: `__shim-error-route__`,
        };
  return {
    matches: [
      {
        params: {},
        pathname: ``,
        pathnameBase: ``,
        route: t,
      },
    ],
    route: t,
  };
}
function yp(e, { pathname, routeId, method, type, message } = {}) {
  let o = `Unknown Server Error`;
  let s = `Unknown @remix-run/router error`;
  switch (e) {
    case 400:
      o = `Bad Request`;
      if (method && pathname && routeId) {
        s = `You made a ${method} request to "${pathname}" but did not provide a \`loader\` for route "${routeId}", so there is no way to handle the request.`;
      } else if (type === `invalid-body`) {
        s = `Unable to encode submission body`;
      }
      break;
    case 403:
      o = `Forbidden`;
      s = `Route "${routeId}" does not match URL "${pathname}"`;
      break;
    case 404:
      o = `Not Found`;
      s = `No route matches URL "${pathname}"`;
      break;
    default:
      if (e === 405) {
        o = `Method Not Allowed`;
        if (method && pathname && routeId) {
          s = `You made a ${method.toUpperCase()} request to "${pathname}" but did not provide an \`action\` for route "${routeId}", so there is no way to handle the request.`;
        } else if (method) {
          s = `Invalid request method "${method.toUpperCase()}"`;
        }
      }
  }
  return new Kd(e || 500, o, Error(s), true);
}
function bp(e) {
  let t = Object.entries(e);
  for (let e = t.length - 1; e >= 0; e--) {
    let [n, r] = t[e];
    if (Op(r)) {
      return {
        key: n,
        result: r,
      };
    }
  }
}
function xp(e) {
  return Xu({
    ...(typeof e == `string` ? Zu(e) : e),
    hash: ``,
  });
}
function Sp(location, t) {
  if (location.pathname !== t.pathname || location.search !== t.search) {
    return false;
  }
  if (location.hash === ``) {
    return t.hash !== ``;
  }
  return location.hash === t.hash || t.hash !== ``;
}
function Cp(result) {
  return new Kd(
    result.init?.status ?? 500,
    result.init?.statusText ?? `Internal Server Error`,
    result.data,
  );
}
function wp(e) {
  return (
    typeof e == `object` &&
    !!e &&
    Object.entries(e).every(([e, t]) => typeof e == `string` && Tp(t))
  );
}
function Tp(e) {
  return (
    typeof e == `object` &&
    !!e &&
    `type` in e &&
    `result` in e &&
    (e.type === `data` || e.type === `error`)
  );
}
function Ep(e) {
  return Ap(e.result) && vf.has(e.result.status);
}
function Dp(e) {
  return e.type === `error`;
}
function Op(e) {
  return (e && e.type) === `redirect`;
}
function kp(result) {
  return (
    typeof result == `object` &&
    !!result &&
    `type` in result &&
    `data` in result &&
    `init` in result &&
    result.type === `DataWithResponseInit`
  );
}
function Ap(e) {
  return (
    e != null &&
    typeof e.status == `number` &&
    typeof e.statusText == `string` &&
    typeof e.headers == `object` &&
    e.body !== undefined
  );
}
function jp(status) {
  return vf.has(status);
}
function Mp(e) {
  return Ap(e) && jp(e.status) && e.headers.has(`Location`);
}
function Np(formMethod) {
  return _f.has(formMethod.toUpperCase());
}
function Pp(e) {
  return hf.has(e.toUpperCase());
}
function Fp(e) {
  return new URLSearchParams(e).getAll(`index`).some((e) => e === ``);
}
function Ip(e, t) {
  let n = typeof t == `string` ? Zu(t).search : t.search;
  if (e[e.length - 1].route.index && Fp(n || ``)) {
    return e[e.length - 1];
  }
  let r = Id(e);
  return r[r.length - 1];
}
function Lp({ formMethod, formAction, formEncType, text, formData, json }) {
  if (formMethod && formAction && formEncType) {
    if (text != null) {
      return {
        formMethod,
        formAction,
        formEncType,
        formData: undefined,
        json: undefined,
        text,
      };
    }
    if (formData != null) {
      return {
        formMethod,
        formAction,
        formEncType,
        formData,
        json: undefined,
        text: undefined,
      };
    }
    if (json !== undefined) {
      return {
        formMethod,
        formAction,
        formEncType,
        formData: undefined,
        json,
        text: undefined,
      };
    }
  }
}
function Rp(e, t, n, r) {
  if (r) {
    return {
      state: `loading`,
      location: e,
      matches: t,
      historyAction: n,
      formMethod: r.formMethod,
      formAction: r.formAction,
      formEncType: r.formEncType,
      formData: r.formData,
      json: r.json,
      text: r.text,
    };
  }
  return {
    state: `loading`,
    location: e,
    matches: t,
    historyAction: n,
    formMethod: undefined,
    formAction: undefined,
    formEncType: undefined,
    formData: undefined,
    json: undefined,
    text: undefined,
  };
}
function zp(e, t, n, r) {
  return {
    state: `submitting`,
    location: e,
    matches: t,
    historyAction: n,
    formMethod: r.formMethod,
    formAction: r.formAction,
    formEncType: r.formEncType,
    formData: r.formData,
    json: r.json,
    text: r.text,
  };
}
function Bp(e, t) {
  if (e) {
    return {
      state: `loading`,
      formMethod: e.formMethod,
      formAction: e.formAction,
      formEncType: e.formEncType,
      formData: e.formData,
      json: e.json,
      text: e.text,
      data: t,
    };
  }
  return {
    state: `loading`,
    formMethod: undefined,
    formAction: undefined,
    formEncType: undefined,
    formData: undefined,
    json: undefined,
    text: undefined,
    data: t,
  };
}
function Vp(fetcherSubmission, t) {
  return {
    state: `submitting`,
    formMethod: fetcherSubmission.formMethod,
    formAction: fetcherSubmission.formAction,
    formEncType: fetcherSubmission.formEncType,
    formData: fetcherSubmission.formData,
    json: fetcherSubmission.json,
    text: fetcherSubmission.text,
    data: t ? t.data : undefined,
  };
}
function Hp(e) {
  return {
    state: `idle`,
    formMethod: undefined,
    formAction: undefined,
    formEncType: undefined,
    formData: undefined,
    json: undefined,
    text: undefined,
    data: e,
  };
}
function Up(window, t) {
  try {
    let n = window.sessionStorage.getItem(wf);
    if (n) {
      let e = JSON.parse(n);
      for (let [n, r] of Object.entries(e || {})) {
        if (r && Array.isArray(r)) {
          t.set(n, new Set(r || []));
        }
      }
    }
  } catch {}
}
function Wp(window, t) {
  if (t.size > 0) {
    let n = {};
    for (let [e, r] of t) {
      n[e] = [...r];
    }
    try {
      window.sessionStorage.setItem(wf, JSON.stringify(n));
    } catch (error) {
      Ku(
        false,
        `Failed to save applied view transitions in sessionStorage (${error}).`,
      );
    }
  }
}
function Gp() {
  let resolve;
  let reject;
  let promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = async (e) => {
      resolvePromise(e);
      try {
        await promise;
      } catch {}
    };
    reject = async (e) => {
      rejectPromise(e);
      try {
        await promise;
      } catch {}
    };
  });
  return {
    promise,
    resolve,
    reject,
  };
}
const KpContext = E.createContext(null);
KpContext.displayName = `DataRouter`;
const QpContext = E.createContext(null);
QpContext.displayName = `DataRouterState`;
const JpContext = E.createContext(false);
function useYp() {
  return E.useContext(JpContext);
}
const XpContext = E.createContext({
  isTransitioning: false,
});
XpContext.displayName = `ViewTransition`;
const ZpContext = E.createContext(new Map());
ZpContext.displayName = `Fetchers`;
const Qp = E.createContext(null);
Qp.displayName = `Await`;
const $pContext = E.createContext(null);
$pContext.displayName = `Navigation`;
const EmContext = E.createContext(null);
EmContext.displayName = `Location`;
const TmContext = E.createContext({
  outlet: null,
  matches: [],
  isDataRoute: false,
});
TmContext.displayName = `Route`;
const NmContext = E.createContext(null);
NmContext.displayName = `RouteError`;
const rm = `REACT_ROUTER_ERROR`;
const im = `REDIRECT`;
const am = `ROUTE_ERROR_RESPONSE`;
function om(digest) {
  if (digest.startsWith(`${rm}:${im}:{`)) {
    try {
      let t = JSON.parse(digest.slice(28));
      if (
        typeof t == `object` &&
        t &&
        typeof t.status == `number` &&
        typeof t.statusText == `string` &&
        typeof t.location == `string` &&
        typeof t.reloadDocument == `boolean` &&
        typeof t.replace == `boolean`
      ) {
        return t;
      }
    } catch {}
  }
}
function sm(digest) {
  if (digest.startsWith(`${rm}:${am}:{`)) {
    try {
      let t = JSON.parse(digest.slice(40));
      if (
        typeof t == `object` &&
        t &&
        typeof t.status == `number` &&
        typeof t.statusText == `string`
      ) {
        return new Kd(t.status, t.statusText, t.data);
      }
    } catch {}
  }
}
function useCm(e, { relative } = {}) {
  $(
    useLm(),
    `useHref() may be used only in the context of a <Router> component.`,
  );
  let { basename, navigator } = E.useContext($pContext);
  let { hash, pathname, search } = useVm(e, {
    relative,
  });
  let s = pathname;
  if (basename !== `/`) {
    s = pathname === `/` ? basename : Bd([basename, pathname]);
  }
  return navigator.createHref({
    pathname: s,
    search,
    hash,
  });
}
function useLm() {
  return E.useContext(EmContext) != null;
}
function useUm() {
  $(
    useLm(),
    `useLocation() may be used only in the context of a <Router> component.`,
  );
  return E.useContext(EmContext).location;
}
const dm = `You should call navigate() in a React.useEffect(), not when your component is first rendered.`;
function useFm(e) {
  if (!E.useContext($pContext).static) {
    E.useLayoutEffect(e);
  }
}
function usePm() {
  let { isDataRoute } = E.useContext(TmContext);
  if (isDataRoute) {
    return useIm();
  }
  return useMm();
}
function useMm() {
  $(
    useLm(),
    `useNavigate() may be used only in the context of a <Router> component.`,
  );
  let e = E.useContext(KpContext);
  let { basename, navigator } = E.useContext($pContext);
  let { matches } = E.useContext(TmContext);
  let { pathname } = useUm();
  let a = JSON.stringify(Ld(matches));
  let oRef = E.useRef(false);
  useFm(() => {
    oRef.current = true;
  });
  return E.useCallback(
    (r, s = {}) => {
      Ku(oRef.current, dm);
      if (!oRef.current) {
        return;
      }
      if (typeof r == `number`) {
        navigator.go(r);
        return;
      }
      let c = Rd(r, JSON.parse(a), pathname, s.relative === `path`);
      if (e == null && basename !== `/`) {
        c.pathname = c.pathname === `/` ? basename : Bd([basename, c.pathname]);
      }
      pf(
        typeof r == `string` ? r : Xu(r),
        navigator.createHref(c),
        uf(navigator),
        `reject`,
      );
      (s.replace ? navigator.replace : navigator.push)(c, s.state, s);
    },
    [basename, navigator, a, pathname, e],
  );
}
const HmContext = E.createContext(null);
function useGm(context) {
  let outlet = E.useContext(TmContext).outlet;
  return E.useMemo(
    () =>
      outlet && (
        <HmContext.Provider value={context}>{outlet}</HmContext.Provider>
      ),
    [outlet, context],
  );
}
function useM() {
  let { matches } = E.useContext(TmContext);
  return matches[matches.length - 1]?.params ?? {};
}
function useVm(e, { relative } = {}) {
  let { matches } = E.useContext(TmContext);
  let { pathname } = useUm();
  let i = JSON.stringify(Ld(matches));
  return E.useMemo(
    () => Rd(e, JSON.parse(i), pathname, relative === `path`),
    [e, i, pathname, relative],
  );
}
function YmComponent(routes, t, n) {
  $(
    useLm(),
    `useRoutes() may be used only in the context of a <Router> component.`,
  );
  let { navigator } = E.useContext($pContext);
  let { matches } = E.useContext(TmContext);
  let a = matches[matches.length - 1];
  let o = a ? a.params : {};
  let s = a ? a.pathname : `/`;
  let c = a ? a.pathnameBase : `/`;
  let l = a && a.route;
  {
    let e = (l && l.path) || ``;
    Rm(
      s,
      !l || e.endsWith(`*`) || e.endsWith(`*?`),
      `You rendered descendant <Routes> (or called \`useRoutes()\`) at "${s}" (under <Route path="${e}">) but the parent route path has no trailing "*". This means if you navigate deeper, the parent won't match anymore and therefore the child routes will never render.

Please change the parent <Route path="${e}"> to <Route path="${e === `/` ? `*` : `${e}/*`}">.`,
    );
  }
  let u = useUm();
  let d;
  if (t) {
    let e = typeof t == `string` ? Zu(t) : t;
    $(
      c === `/` || e.pathname?.startsWith(c),
      `When overriding the location using \`<Routes location>\` or \`useRoutes(routes, location)\`, the location pathname must begin with the portion of the URL pathname that was matched by all parent routes. The current pathname base is "${c}" but pathname "${e.pathname}" was given in the \`location\` prop.`,
    );
    d = e;
  } else {
    d = u;
  }
  let f = d.pathname || `/`;
  let p = f;
  if (c !== `/`) {
    let e = c.replace(/^\//, ``).split(`/`);
    p = `/` + f.replace(/^\//, ``).split(`/`).slice(e.length).join(`/`);
  }
  let m =
    n && n.state.matches.length
      ? n.state.matches.map((e) =>
          Object.assign(e, {
            route: n.manifest[e.route.id] || e.route,
          }),
        )
      : ld(routes, {
          pathname: p,
        });
  Ku(
    l || m != null,
    `No routes matched location "${d.pathname}${d.search}${d.hash}" `,
  );
  Ku(
    m == null ||
      m[m.length - 1].route.element !== undefined ||
      m[m.length - 1].route.Component !== undefined ||
      m[m.length - 1].route.lazy !== undefined,
    `Matched leaf route at location "${d.pathname}${d.search}${d.hash}" does not have an element or Component. This means it will render an <Outlet /> with a null value by default resulting in an "empty" page.`,
  );
  let h = Em(
    m &&
      m.map((e) => ({
        ...e,
        params: {
          ...o,
          ...e.params,
        },
        pathname: Bd([
          c,
          navigator.encodeLocation
            ? navigator.encodeLocation(
                e.pathname
                  .replace(/%/g, `%25`)
                  .replace(/\?/g, `%3F`)
                  .replace(/#/g, `%23`),
              ).pathname
            : e.pathname,
        ]),
        pathnameBase:
          e.pathnameBase === `/`
            ? c
            : Bd([
                c,
                navigator.encodeLocation
                  ? navigator.encodeLocation(
                      e.pathnameBase
                        .replace(/%/g, `%25`)
                        .replace(/\?/g, `%3F`)
                        .replace(/#/g, `%23`),
                    ).pathname
                  : e.pathnameBase,
              ]),
      })),
    matches,
    n,
  );
  if (t && h) {
    return (
      <EmContext.Provider
        value={{
          location: {
            pathname: `/`,
            search: ``,
            hash: ``,
            state: null,
            key: `default`,
            mask: undefined,
            ...d,
          },
          navigationType: `POP`,
        }}
      >
        {h}
      </EmContext.Provider>
    );
  }
  return h;
}
function Bm1Component() {
  let e = useNm();
  let t = qd(e)
    ? `${e.status} ${e.statusText}`
    : e instanceof Error
      ? e.message
      : JSON.stringify(e);
  let n = e instanceof Error ? e.stack : null;
  let backgroundColor = `rgba(200,200,200, 0.5)`;
  let i = {
    padding: `0.5rem`,
    backgroundColor,
  };
  let a = {
    padding: `2px 4px`,
    backgroundColor,
  };
  let o = null;
  console.error(`Error handled by React Router default ErrorBoundary:`, e);
  o = (
    <>
      <p>{`💿 Hey developer 👋`}</p>
      <p>
        {`You can provide a way better UX than this when your app throws errors by providing your own `}
        <code style={a}>{`ErrorBoundary`}</code>
        {` or`}
        {` `}
        <code style={a}>{`errorElement`}</code>
        {` prop on your route.`}
      </p>
    </>
  );
  return (
    <>
      <h2>{`Unexpected Application Error!`}</h2>
      <h3
        style={{
          fontStyle: `italic`,
        }}
      >
        {t}
      </h3>
      {n ? <pre style={i}>{n}</pre> : null}
      {o}
    </>
  );
}
const xm = <Bm1Component />;
class Sm extends E.Component {
  constructor(e) {
    super(e);
    this.state = {
      location: e.location,
      revalidation: e.revalidation,
      error: e.error,
    };
  }
  static getDerivedStateFromError(e) {
    return {
      error: e,
    };
  }
  static getDerivedStateFromProps(e, t) {
    if (
      t.location !== e.location ||
      (t.revalidation !== `idle` && e.revalidation === `idle`)
    ) {
      return {
        error: e.error,
        location: e.location,
        revalidation: e.revalidation,
      };
    }
    return {
      error: e.error === undefined ? t.error : e.error,
      location: t.location,
      revalidation: e.revalidation || t.revalidation,
    };
  }
  componentDidCatch(e, t) {
    if (this.props.onError) {
      this.props.onError(e, t);
    } else {
      console.error(`React Router caught the following error during render`, e);
    }
  }
  render() {
    let error = this.state.error;
    if (
      this.context &&
      typeof error == `object` &&
      error &&
      `digest` in error &&
      typeof error.digest == `string`
    ) {
      let t = sm(error.digest);
      if (t) {
        error = t;
      }
    }
    let t =
      error === undefined ? (
        this.props.children
      ) : (
        <TmContext.Provider value={this.props.routeContext}>
          <NmContext.Provider value={error} children={this.props.component} />
        </TmContext.Provider>
      );
    if (this.context) {
      return <Wm1Component error={error}>{t}</Wm1Component>;
    }
    return t;
  }
}
Sm.contextType = JpContext;
var Cm = new WeakMap();
function Wm1Component({ children, error }) {
  let { basename, navigator } = E.useContext($pContext);
  if (
    typeof error == `object` &&
    error &&
    `digest` in error &&
    typeof error.digest == `string`
  ) {
    let e = om(error.digest);
    if (e) {
      let i = Cm.get(error);
      if (i) {
        throw i;
      }
      let a = Xd(e.location, basename);
      let o = a.absoluteURL || a.to;
      pf(e.location, o, uf(navigator), `allow-explicit`);
      if (sp(o)) {
        throw Error(`Invalid redirect location`);
      }
      if (Yd && !Cm.get(error)) {
        if (a.isExternal || e.reloadDocument) {
          window.location.href = o;
        } else {
          let n = Promise.resolve().then(() =>
            window.__reactRouterDataRouter.navigate(a.to, {
              replace: e.replace,
            }),
          );
          Cm.set(error, n);
          throw n;
        }
      }
      return <meta httpEquiv={`refresh`} content={`0;url=${o}`} />;
    }
  }
  return children;
}
function TmComponent({ routeContext, match, children }) {
  let r = E.useContext(KpContext);
  if (
    r &&
    r.static &&
    r.staticContext &&
    (match.route.errorElement || match.route.ErrorBoundary)
  ) {
    r.staticContext._deepestRenderedBoundaryId = match.route.id;
  }
  return (
    <TmContext.Provider value={routeContext}>{children}</TmContext.Provider>
  );
}
function Em(e, t = [], n) {
  let r = n?.state;
  if (e == null) {
    if (!r) {
      return null;
    }
    if (r.errors) {
      e = r.matches;
    } else if (t.length === 0 && !r.initialized && r.matches.length > 0) {
      e = r.matches;
    } else {
      return null;
    }
  }
  let i = e;
  let a = r?.errors;
  if (a != null) {
    let e = i.findIndex((e) => e.route.id && a?.[e.route.id] !== undefined);
    $(
      e >= 0,
      `Could not find a matching route for errors on route IDs: ${Object.keys(a).join(`,`)}`,
    );
    i = i.slice(0, Math.min(i.length, e + 1));
  }
  let o = false;
  let s = -1;
  if (n && r) {
    o = r.renderFallback;
    for (let e = 0; e < i.length; e++) {
      let t = i[e];
      if (t.route.HydrateFallback || t.route.hydrateFallbackElement) {
        s = e;
      }
      if (t.route.id) {
        let { loaderData, errors } = r;
        let c =
          t.route.loader &&
          !loaderData.hasOwnProperty(t.route.id) &&
          (!errors || errors[t.route.id] === undefined);
        if (t.route.lazy || c) {
          if (n.isStatic) {
            o = true;
          }
          i = s >= 0 ? i.slice(0, s + 1) : [i[0]];
          break;
        }
      }
    }
  }
  let c = n?.onError;
  let onError =
    r && c
      ? (e, errorInfo) => {
          c(e, {
            location: r.location,
            params: r.matches?.[0]?.params ?? {},
            pattern: Jd(r.matches),
            errorInfo,
          });
        }
      : undefined;
  return i.reduceRight((outlet, item, index) => {
    let u;
    let d = false;
    let component = null;
    let p = null;
    if (r) {
      u = a && item.route.id ? a[item.route.id] : undefined;
      component = item.route.errorElement || xm;
      o &&
        (s < 0 && index === 0
          ? (Rm(
              `route-fallback`,
              false,
              "No `HydrateFallback` element provided to render during initial hydration",
            ),
            (d = true),
            (p = null))
          : s === index &&
            ((d = true), (p = item.route.hydrateFallbackElement || null)));
    }
    let m = t.concat(i.slice(0, index + 1));
    let HComponent = () => {
      let t;
      t = u ? (
        component
      ) : d ? (
        p
      ) : item.route.Component ? (
        <item.route.Component />
      ) : item.route.element ? (
        item.route.element
      ) : (
        outlet
      );
      return (
        <TmComponent
          match={item}
          routeContext={{
            outlet,
            matches: m,
            isDataRoute: r != null,
          }}
          children={t}
        />
      );
    };
    if (
      r &&
      (item.route.ErrorBoundary || item.route.errorElement || index === 0)
    ) {
      return (
        <Sm
          location={r.location}
          revalidation={r.revalidation}
          component={component}
          error={u}
          children={HComponent()}
          routeContext={{
            outlet: null,
            matches: m,
            isDataRoute: true,
          }}
          onError={onError}
        />
      );
    }
    return HComponent();
  }, null);
}
function Dm(e) {
  return `${e} must be used within a data router.  See https://reactrouter.com/en/main/routers/picking-a-router.`;
}
function useOm(e) {
  let t = E.useContext(KpContext);
  $(t, Dm(e));
  return t;
}
function useKm(e) {
  let t = E.useContext(QpContext);
  $(t, Dm(e));
  return t;
}
function useAm(e) {
  let t = E.useContext(TmContext);
  $(t, Dm(e));
  return t;
}
function jm(e) {
  let t = useAm(e);
  let n = t.matches[t.matches.length - 1];
  $(n.route.id, `${e} can only be used on routes that contain a unique "id"`);
  return n.route.id;
}
function Mm() {
  return jm(`useRouteId`);
}
function useNm() {
  let e = E.useContext(NmContext);
  let t = useKm(`useRouteError`);
  let n = jm(`useRouteError`);
  if (e === undefined) {
    return t.errors?.[n];
  }
  return e;
}
let Pm = 0;
function Fm(e) {
  let { router, basename } = useOm(`useBlocker`);
  let r = useKm(`useBlocker`);
  let [i, setI] = E.useState(``);
  let o = E.useCallback(
    (t) => {
      if (typeof e != `function`) {
        return !!e;
      }
      if (basename === `/`) {
        return e(t);
      }
      let { currentLocation, nextLocation, historyAction } = t;
      return e({
        currentLocation: {
          ...currentLocation,
          pathname:
            Ad(currentLocation.pathname, basename) || currentLocation.pathname,
        },
        nextLocation: {
          ...nextLocation,
          pathname:
            Ad(nextLocation.pathname, basename) || nextLocation.pathname,
        },
        historyAction,
      });
    },
    [basename, e],
  );
  E.useEffect(() => {
    let e = String(++Pm);
    setI(e);
    return () => router.deleteBlocker(e);
  }, [router]);
  E.useEffect(() => {
    if (i !== ``) {
      router.getBlocker(i, o);
    }
  }, [router, i, o]);
  if (i && r.blockers.has(i)) {
    return r.blockers.get(i);
  }
  return Sf;
}
function useIm() {
  let { router } = useOm(`useNavigate`);
  let t = jm(`useNavigate`);
  let nRef = E.useRef(false);
  useFm(() => {
    nRef.current = true;
  });
  return E.useCallback(
    async (r, i = {}) => {
      Ku(nRef.current, dm);
      nRef.current &&
        (typeof r == `number`
          ? await router.navigate(r)
          : await router.navigate(r, {
              fromRouteId: t,
              ...i,
            }));
    },
    [router, t],
  );
}
const Lm = {};
function Rm(e, t, n) {
  if (!t && !Lm[e]) {
    Lm[e] = true;
    Ku(false, n);
  }
}
const zm = {};
function Bm(e, t) {
  if (!e && !zm[t]) {
    zm[t] = true;
    console.warn(t);
  }
}
const E_useOptimistic = E.useOptimistic;
const Hm = () => undefined;
function Um(e) {
  if (E_useOptimistic) {
    return E_useOptimistic(e);
  }
  return [e, Hm];
}
function mapRouteProperties(e) {
  let t = {
    hasErrorBoundary:
      e.hasErrorBoundary || e.ErrorBoundary != null || e.errorElement != null,
  };
  if (e.Component) {
    if (e.element) {
      Ku(
        false,
        "You should not include both `Component` and `element` on your route - `Component` will be used.",
      );
    }
    Object.assign(t, {
      element: E.createElement(e.Component),
      Component: undefined,
    });
  }
  if (e.HydrateFallback) {
    if (e.hydrateFallbackElement) {
      Ku(
        false,
        "You should not include both `HydrateFallback` and `hydrateFallbackElement` on your route - `HydrateFallback` will be used.",
      );
    }
    Object.assign(t, {
      hydrateFallbackElement: E.createElement(e.HydrateFallback),
      HydrateFallback: undefined,
    });
  }
  if (e.ErrorBoundary) {
    if (e.errorElement) {
      Ku(
        false,
        "You should not include both `ErrorBoundary` and `errorElement` on your route - `ErrorBoundary` will be used.",
      );
    }
    Object.assign(t, {
      errorElement: E.createElement(e.ErrorBoundary),
      ErrorBoundary: undefined,
    });
  }
  return t;
}
const hydrationRouteProperties = [`HydrateFallback`, `hydrateFallbackElement`];
class Km {
  constructor() {
    this.status = `pending`;
    this.promise = new Promise((resolve, reject) => {
      this.resolve = (t) => {
        if (this.status === `pending`) {
          this.status = `resolved`;
          resolve(t);
        }
      };
      this.reject = (e) => {
        if (this.status === `pending`) {
          this.status = `rejected`;
          reject(e);
        }
      };
    });
  }
}
function Qm1Component({ router, flushSync, onError, useTransitions }) {
  useTransitions = useYp() || useTransitions;
  let [i, setI] = E.useState(router.state);
  let [o, s] = Um(i);
  let [c, setC] = E.useState();
  let [u, setU] = E.useState({
    isTransitioning: false,
  });
  let [f, setF] = E.useState();
  let [m, setM] = E.useState();
  let [g, setG] = E.useState();
  let vRef = E.useRef(new Map());
  let y = E.useCallback(
    (
      i,
      {
        deletedFetchers,
        newErrors,
        flushSync: flushSync_1,
        viewTransitionOpts,
      },
    ) => {
      if (newErrors && onError) {
        Object.values(newErrors).forEach((e) =>
          onError(e, {
            location: i.location,
            params: i.matches[0]?.params ?? {},
            pattern: Jd(i.matches),
          }),
        );
      }
      i.fetchers.forEach((e, t) => {
        if (e.data !== undefined) {
          vRef.current.set(t, e.data);
        }
      });
      deletedFetchers.forEach((e) => vRef.current.delete(e));
      Bm(
        flushSync_1 === false || flushSync != null,
        'You provided the `flushSync` option to a router update, but you are not using the `<RouterProvider>` from `react-router/dom` so `ReactDOM.flushSync()` is unavailable.  Please update your app to `import { RouterProvider } from "react-router/dom"` and ensure you have `react-dom` installed as a dependency to use the `flushSync` option.',
      );
      let y =
        router.window != null &&
        router.window.document != null &&
        typeof router.window.document.startViewTransition == `function`;
      Bm(
        viewTransitionOpts == null || y,
        "You provided the `viewTransition` option to a router update, but you do not appear to be running in a DOM environment as `window.startViewTransition` is not available.",
      );
      if (!viewTransitionOpts || !y) {
        if (flushSync && flushSync_1) {
          flushSync(() => setI(i));
        } else if (useTransitions === false) {
          setI(i);
        } else {
          E.startTransition(() => {
            if (useTransitions === true) {
              s((e) => Jm(e, i));
            }
            setI(i);
          });
        }
        return;
      }
      if (flushSync && flushSync_1) {
        flushSync(() => {
          if (m) {
            f?.resolve();
            m.skipTransition();
          }
          setU({
            isTransitioning: true,
            flushSync: true,
            currentLocation: viewTransitionOpts.currentLocation,
            nextLocation: viewTransitionOpts.nextLocation,
          });
        });
        let n = router.window.document.startViewTransition(() => {
          flushSync(() => setI(i));
        });
        n.finished.finally(() => {
          flushSync(() => {
            setF(undefined);
            setM(undefined);
            setC(undefined);
            setU({
              isTransitioning: false,
            });
          });
        });
        flushSync(() => setM(n));
        return;
      }
      if (m) {
        f?.resolve();
        m.skipTransition();
        setG({
          state: i,
          currentLocation: viewTransitionOpts.currentLocation,
          nextLocation: viewTransitionOpts.nextLocation,
        });
      } else {
        setC(i);
        setU({
          isTransitioning: true,
          flushSync: false,
          currentLocation: viewTransitionOpts.currentLocation,
          nextLocation: viewTransitionOpts.nextLocation,
        });
      }
    },
    [router.window, flushSync, m, f, useTransitions, s, onError],
  );
  E.useLayoutEffect(() => router.subscribe(y), [router, y]);
  E.useEffect(() => {
    if (u.isTransitioning && !u.flushSync) {
      setF(new Km());
    }
  }, [u]);
  E.useEffect(() => {
    if (f && c && router.window) {
      let t = c;
      let n = f.promise;
      let i = router.window.document.startViewTransition(async () => {
        if (useTransitions === false) {
          setI(t);
        } else {
          E.startTransition(() => {
            if (useTransitions === true) {
              s((e) => Jm(e, t));
            }
            setI(t);
          });
        }
        await n;
      });
      i.finished.finally(() => {
        setF(undefined);
        setM(undefined);
        setC(undefined);
        setU({
          isTransitioning: false,
        });
      });
      setM(i);
    }
  }, [c, f, router.window, useTransitions, s]);
  E.useEffect(() => {
    if (f && c && o.location.key === c.location.key) {
      f.resolve();
    }
  }, [f, m, o.location, c]);
  E.useEffect(() => {
    if (!u.isTransitioning && g) {
      setC(g.state);
      setU({
        isTransitioning: true,
        flushSync: false,
        currentLocation: g.currentLocation,
        nextLocation: g.nextLocation,
      });
      setG(undefined);
    }
  }, [u.isTransitioning, g]);
  let navigator = E.useMemo(
    () => ({
      createHref: router.createHref,
      createURL: router.createURL,
      encodeLocation: router.encodeLocation,
      go: (t) => router.navigate(t),
      push: (t, n, r) =>
        router.navigate(t, {
          state: n,
          preventScrollReset: r?.preventScrollReset,
        }),
      replace: (t, n, r) =>
        router.navigate(t, {
          replace: true,
          state: n,
          preventScrollReset: r?.preventScrollReset,
        }),
    }),
    [router],
  );
  let x = router.basename || `/`;
  let S = E.useMemo(
    () => ({
      router,
      navigator,
      static: false,
      basename: x,
      onError,
    }),
    [router, navigator, x, onError],
  );
  return (
    <>
      <KpContext.Provider value={S}>
        <QpContext.Provider value={o}>
          <ZpContext.Provider value={vRef.current}>
            <XpContext.Provider value={u}>
              <QmComponent
                basename={x}
                location={o.location}
                navigationType={o.historyAction}
                navigator={navigator}
                useTransitions={useTransitions}
              >
                <Ym
                  routes={router.routes}
                  manifest={router.manifest}
                  future={router.future}
                  state={o}
                  isStatic={false}
                  onError={onError}
                />
              </QmComponent>
            </XpContext.Provider>
          </ZpContext.Provider>
        </QpContext.Provider>
      </KpContext.Provider>
    </>
  );
}
function Jm(e, t) {
  return {
    ...e,
    navigation: t.navigation.state === `idle` ? e.navigation : t.navigation,
    revalidation: t.revalidation === `idle` ? e.revalidation : t.revalidation,
    actionData:
      t.navigation.state === `submitting` ? e.actionData : t.actionData,
    fetchers: t.fetchers,
  };
}
var Ym = E.memo(Xm);
function Xm({ routes, manifest, future, state, isStatic, onError }) {
  return YmComponent(routes, undefined, {
    manifest,
    state,
    isStatic,
    onError,
    future,
  });
}
function Zm(e) {
  return useGm(e.context);
}
function QmComponent({
  basename = `/`,
  children = null,
  location,
  navigationType = `POP`,
  navigator,
  static: _static = false,
  useTransitions,
}) {
  $(
    !useLm(),
    `You cannot render a <Router> inside another <Router>. You should never have more than one in your app.`,
  );
  let s = basename.replace(/^\/*/, `/`);
  let c = E.useMemo(
    () => ({
      basename: s,
      navigator,
      static: _static,
      useTransitions,
      future: {},
    }),
    [s, navigator, _static, useTransitions],
  );
  if (typeof location == `string`) {
    location = Zu(location);
  }
  let {
    pathname = `/`,
    search = ``,
    hash = ``,
    state = null,
    key = `default`,
    mask,
  } = location;
  let h = E.useMemo(() => {
    let e = Ad(pathname, s);
    if (e == null) {
      return null;
    }
    return {
      location: {
        pathname: e,
        search,
        hash,
        state,
        key,
        mask,
      },
      navigationType,
    };
  }, [s, pathname, search, hash, state, key, navigationType, mask]);
  Ku(
    h != null,
    `<Router basename="${s}"> is not able to match the URL "${pathname}${search}${hash}" because it does not start with the basename, so the <Router> won't render anything.`,
  );
  if (h == null) {
    return null;
  }
  return (
    <$pContext.Provider value={c}>
      <EmContext.Provider children={children} value={h} />
    </$pContext.Provider>
  );
}
E.Component;
const $m = `get`;
const eh = `application/x-www-form-urlencoded`;
function th(e) {
  return typeof HTMLElement < `u` && e instanceof HTMLElement;
}
function nh(e) {
  return th(e) && e.tagName.toLowerCase() === `button`;
}
function rh(e) {
  return th(e) && e.tagName.toLowerCase() === `form`;
}
function ih(e) {
  return th(e) && e.tagName.toLowerCase() === `input`;
}
function ah(e) {
  return !!(e.metaKey || e.altKey || e.ctrlKey || e.shiftKey);
}
function oh(e, target) {
  return e.button === 0 && (!target || target === `_self`) && !ah(e);
}
function sh(e = ``) {
  return new URLSearchParams(
    typeof e == `string` || Array.isArray(e) || e instanceof URLSearchParams
      ? e
      : Object.keys(e).reduce((acc, key) => {
          let r = e[key];
          return acc.concat(
            Array.isArray(r) ? r.map((e) => [key, e]) : [[key, r]],
          );
        }, []),
  );
}
function ch(search, t) {
  let n = sh(search);
  if (t) {
    t.forEach((e, r) => {
      if (!n.has(r)) {
        t.getAll(r).forEach((e) => {
          n.append(r, e);
        });
      }
    });
  }
  return n;
}
let lh = null;
function uh() {
  if (lh === null) {
    try {
      new FormData(document.createElement(`form`), 0);
      lh = false;
    } catch {
      lh = true;
    }
  }
  return lh;
}
const dh = new Set([
  `application/x-www-form-urlencoded`,
  `multipart/form-data`,
  `text/plain`,
]);
function fh(e) {
  if (e != null && !dh.has(e)) {
    return (
      Ku(
        false,
        `"${e}" is not a valid \`encType\` for \`<Form>\`/\`<fetcher.Form>\` and will default to "${eh}"`,
      ),
      null
    );
  }
  return e;
}
function ph(e, basename) {
  let n;
  let r;
  let encType;
  let a;
  let body;
  if (rh(e)) {
    let o = e.getAttribute(`action`);
    r = o ? Ad(o, basename) : null;
    n = e.getAttribute(`method`) || $m;
    encType = fh(e.getAttribute(`enctype`)) || eh;
    a = new FormData(e);
  } else if (nh(e) || (ih(e) && (e.type === `submit` || e.type === `image`))) {
    let o = e.form;
    if (o == null) {
      throw Error(
        `Cannot submit a <button> or <input type="submit"> without a <form>`,
      );
    }
    let s = e.getAttribute(`formaction`) || o.getAttribute(`action`);
    r = s ? Ad(s, basename) : null;
    n = e.getAttribute(`formmethod`) || o.getAttribute(`method`) || $m;
    encType =
      fh(e.getAttribute(`formenctype`)) || fh(o.getAttribute(`enctype`)) || eh;
    a = new FormData(o, e);
    if (!uh()) {
      let { name, type, value } = e;
      if (type === `image`) {
        let e = name ? `${name}.` : ``;
        a.append(`${e}x`, `0`);
        a.append(`${e}y`, `0`);
      } else {
        if (name) {
          a.append(name, value);
        }
      }
    }
  } else if (th(e)) {
    throw Error(
      `Cannot submit element that is not <form>, <button>, or <input type="submit|image">`,
    );
  } else {
    n = $m;
    r = null;
    encType = eh;
    body = e;
  }
  if (a && encType === `text/plain`) {
    body = a;
    a = undefined;
  }
  return {
    action: r,
    method: n.toLowerCase(),
    encType,
    formData: a,
    body,
  };
}
Object.getOwnPropertyNames(Object.prototype).sort().join(`\0`);
function mh(e, t) {
  if (e === false || e == null) {
    throw Error(t);
  }
}
function hh(page, basename, n, r) {
  let i =
    typeof page == `string`
      ? new URL(
          page,
          typeof window > `u`
            ? `server://singlefetch/`
            : window.location.origin,
        )
      : page;
  i.pathname = n
    ? i.pathname.endsWith(`/`)
      ? `${i.pathname}_.${r}`
      : `${i.pathname}.${r}`
    : i.pathname === `/`
      ? `_root.${r}`
      : basename && Ad(i.pathname, basename) === `/`
        ? `${Vd(basename)}/_root.${r}`
        : `${Vd(i.pathname)}.${r}`;
  return i;
}
async function gh(e, t) {
  if (e.id in t) {
    return t[e.id];
  }
  try {
    let n = await Pu(() => import(e.module), []);
    t[e.id] = n;
    return n;
  } catch (error) {
    console.error(
      `Error loading route module \`${e.module}\`, reloading page...`,
    );
    console.error(error);
    window.__reactRouterContext && window.__reactRouterContext.isSpaMode;
    window.location.reload();
    return new Promise(() => {});
  }
}
function _h(link) {
  return link != null && typeof link.page == `string`;
}
function vh(e) {
  if (e == null) {
    return false;
  }
  if (e.href == null) {
    return (
      e.rel === `preload` &&
      typeof e.imageSrcSet == `string` &&
      typeof e.imageSizes == `string`
    );
  }
  return typeof e.rel == `string` && typeof e.href == `string`;
}
async function yh(e, manifest, routeModules) {
  return wh(
    (
      await Promise.all(
        e.map(async (e) => {
          let r = manifest.routes[e.route.id];
          if (r) {
            let e = await gh(r, routeModules);
            if (e.links) {
              return e.links();
            }
            return [];
          }
          return [];
        }),
      )
    )
      .flat(1)
      .filter(vh)
      .filter((e) => e.rel === `stylesheet` || e.rel === `preload`)
      .map((e) => {
        if (e.rel === `stylesheet`) {
          return {
            ...e,
            rel: `prefetch`,
            as: `style`,
          };
        }
        return {
          ...e,
          rel: `prefetch`,
        };
      }),
  );
}
function bh(page, matches, n, manifest, i, a) {
  let o = (e, t) => !n[t] || e.route.id !== n[t].route.id;
  let s = (e, t) =>
    n[t].pathname !== e.pathname ||
    (n[t].route.path?.endsWith(`*`) && n[t].params[`*`] !== e.params[`*`]);
  if (a === `assets`) {
    return matches.filter((e, t) => o(e, t) || s(e, t));
  }
  if (a === `data`) {
    return matches.filter((t, a) => {
      let c = manifest.routes[t.route.id];
      if (!c || !c.hasLoader) {
        return false;
      }
      if (o(t, a) || s(t, a)) {
        return true;
      }
      if (t.route.shouldRevalidate) {
        let r = t.route.shouldRevalidate({
          currentUrl: new URL(i.pathname + i.search + i.hash, window.origin),
          currentParams: n[0]?.params || {},
          nextUrl: new URL(page, window.origin),
          nextParams: t.params,
          defaultShouldRevalidate: true,
        });
        if (typeof r == `boolean`) {
          return r;
        }
      }
      return true;
    });
  }
  return [];
}
function xh(e, manifest, { includeHydrateFallback } = {}) {
  return Sh(
    e
      .map((e) => {
        let r = manifest.routes[e.route.id];
        if (!r) {
          return [];
        }
        let i = [r.module];
        if (r.clientActionModule) {
          i = i.concat(r.clientActionModule);
        }
        if (r.clientLoaderModule) {
          i = i.concat(r.clientLoaderModule);
        }
        if (includeHydrateFallback && r.hydrateFallbackModule) {
          i = i.concat(r.hydrateFallbackModule);
        }
        if (r.imports) {
          i = i.concat(r.imports);
        }
        return i;
      })
      .flat(1),
  );
}
function Sh(e) {
  return [...new Set(e)];
}
function Ch(link) {
  let t = {};
  let n = Object.keys(link).sort();
  for (let r of n) {
    t[r] = link[r];
  }
  return t;
}
function wh(e, t) {
  let n = new Set();
  let r = new Set(t);
  return e.reduce((acc, link) => {
    if (
      t &&
      !_h(link) &&
      link.as === `script` &&
      link.href &&
      r.has(link.href)
    ) {
      return acc;
    }
    let a = JSON.stringify(Ch(link));
    if (!n.has(a)) {
      n.add(a);
      acc.push({
        key: a,
        link,
      });
    }
    return acc;
  }, []);
}
function useTh() {
  let e = E.useContext(KpContext);
  mh(
    e,
    `You must render this element inside a <DataRouterContext.Provider> element`,
  );
  return e;
}
function useEh() {
  let e = E.useContext(QpContext);
  mh(
    e,
    `You must render this element inside a <DataRouterStateContext.Provider> element`,
  );
  return e;
}
const DhContext = E.createContext(undefined);
DhContext.displayName = `FrameworkContext`;
function useOh() {
  let e = E.useContext(DhContext);
  mh(e, `You must render this element inside a <HydratedRouter> element`);
  return e;
}
function useKh(prefetch, rest) {
  let n = E.useContext(DhContext);
  let [r, setR] = E.useState(false);
  let [a, setA] = E.useState(false);
  let { onFocus, onBlur, onMouseEnter, onMouseLeave, onTouchStart } = rest;
  let fRef = E.useRef(null);
  E.useEffect(() => {
    if (prefetch === `render`) {
      setA(true);
    }
    if (prefetch === `viewport`) {
      let e = new IntersectionObserver(
        (e) => {
          e.forEach((e) => {
            setA(e.isIntersecting);
          });
        },
        {
          threshold: 0.5,
        },
      );
      if (fRef.current) {
        e.observe(fRef.current);
      }
      return () => {
        e.disconnect();
      };
    }
  }, [prefetch]);
  E.useEffect(() => {
    if (r) {
      let e = setTimeout(() => {
        setA(true);
      }, 100);
      return () => {
        clearTimeout(e);
      };
    }
  }, [r]);
  let p = () => {
    setR(true);
  };
  let m = () => {
    setR(false);
    setA(false);
  };
  if (n) {
    if (prefetch === `intent`) {
      return [
        a,
        fRef,
        {
          onFocus: Ah(onFocus, p),
          onBlur: Ah(onBlur, m),
          onMouseEnter: Ah(onMouseEnter, p),
          onMouseLeave: Ah(onMouseLeave, m),
          onTouchStart: Ah(onTouchStart, p),
        },
      ];
    }
    return [a, fRef, {}];
  }
  return [false, fRef, {}];
}
function Ah(e, t) {
  return (n) => {
    if (e) {
      e(n);
    }
    if (!n.defaultPrevented) {
      t(n);
    }
  };
}
function Jh1Component({ page, ...rest }) {
  let n = useYp();
  let { nonce } = useOh();
  let { router } = useTh();
  let a = E.useMemo(
    () => ld(router.routes, page, router.basename),
    [router.routes, page, router.basename],
  );
  if (a) {
    return (
      rest.nonce == null &&
        nonce &&
        (rest = {
          ...rest,
          nonce,
        }),
      n ? (
        <NhComponent page={page} matches={a} {...rest} />
      ) : (
        <PhComponent page={page} matches={a} {...rest} />
      )
    );
  }
  return null;
}
function useMh(e) {
  let { manifest, routeModules } = useOh();
  let [r, setR] = E.useState([]);
  E.useEffect(() => {
    let r = false;
    yh(e, manifest, routeModules).then((e) => {
      if (!r) {
        setR(e);
      }
    });
    return () => {
      r = true;
    };
  }, [e, manifest, routeModules]);
  return r;
}
function NhComponent({ page, matches, ...rest }) {
  let r = useUm();
  let { future } = useOh();
  let { basename } = useTh();
  let o = E.useMemo(() => {
    if (page === r.pathname + r.search + r.hash) {
      return [];
    }
    let n = hh(page, basename, future.v8_trailingSlashAwareDataRequests, `rsc`);
    let o = false;
    let s = [];
    for (let e of matches) {
      if (typeof e.route.shouldRevalidate == `function`) {
        o = true;
      } else {
        s.push(e.route.id);
      }
    }
    if (o && s.length > 0) {
      n.searchParams.set(`_routes`, s.join(`,`));
    }
    return [n.pathname + n.search];
  }, [basename, future.v8_trailingSlashAwareDataRequests, page, r, matches]);
  return (
    <>
      {o.map((e) => (
        <link key={e} rel={`prefetch`} as={`fetch`} href={e} {...rest} />
      ))}
    </>
  );
}
function PhComponent({ page, matches, ...rest }) {
  let r = useUm();
  let { future, manifest, routeModules } = useOh();
  let { basename } = useTh();
  let { loaderData, matches: matches_1 } = useEh();
  let u = E.useMemo(
    () => bh(page, matches, matches_1, manifest, r, `data`),
    [page, matches, matches_1, manifest, r],
  );
  let d = E.useMemo(
    () => bh(page, matches, matches_1, manifest, r, `assets`),
    [page, matches, matches_1, manifest, r],
  );
  let f = E.useMemo(() => {
    if (page === r.pathname + r.search + r.hash) {
      return [];
    }
    let n = new Set();
    let l = false;
    matches.forEach((e) => {
      let t = manifest.routes[e.route.id];
      t &&
        t.hasLoader &&
        ((!u.some((t) => t.route.id === e.route.id) &&
          e.route.id in loaderData &&
          routeModules[e.route.id]?.shouldRevalidate) ||
        t.hasClientLoader
          ? (l = true)
          : n.add(e.route.id));
    });
    if (n.size === 0) {
      return [];
    }
    let d = hh(
      page,
      basename,
      future.v8_trailingSlashAwareDataRequests,
      `data`,
    );
    if (l && n.size > 0) {
      d.searchParams.set(
        `_routes`,
        matches
          .filter((e) => n.has(e.route.id))
          .map((e) => e.route.id)
          .join(`,`),
      );
    }
    return [d.pathname + d.search];
  }, [
    basename,
    future.v8_trailingSlashAwareDataRequests,
    loaderData,
    r,
    manifest,
    u,
    matches,
    page,
    routeModules,
  ]);
  let p = E.useMemo(() => xh(d, manifest), [d, manifest]);
  let m = useMh(d);
  return (
    <>
      {f.map((e) => (
        <link key={e} rel={`prefetch`} as={`fetch`} href={e} {...rest} />
      ))}
      {p.map((e) => (
        <link key={e} rel={`modulepreload`} href={e} {...rest} />
      ))}
      {m.map(({ key, link: link_1 }) => (
        <link
          key={key}
          nonce={rest.nonce}
          {...link_1}
          crossOrigin={link_1.crossOrigin ?? rest.crossOrigin}
        />
      ))}
    </>
  );
}
function Fh(...e) {
  return (t) => {
    e.forEach((e) => {
      if (typeof e == `function`) {
        e(t);
      } else if (e != null) {
        e.current = t;
      }
    });
  };
}
E.Component;
const Ih =
  typeof window < `u` &&
  window.document !== undefined &&
  window.document.createElement !== undefined;
try {
  if (Ih) {
    window.__reactRouterVersion = `7.18.4`;
  }
} catch {}
function Lh(routes, t) {
  return jf({
    basename: t?.basename,
    getContext: t?.getContext,
    future: t?.future,
    history: Gu({
      window: t?.window,
    }),
    hydrationData: t?.hydrationData || Rh(),
    routes,
    mapRouteProperties,
    hydrationRouteProperties,
    dataStrategy: t?.dataStrategy,
    patchRoutesOnNavigation: t?.patchRoutesOnNavigation,
    window: t?.window,
    instrumentations: t?.instrumentations,
  }).initialize();
}
function Rh() {
  let e = window?.__staticRouterHydrationData;
  if (e && e.errors) {
    e = {
      ...e,
      errors: zh(e.errors),
    };
  }
  return e;
}
function zh(errors) {
  if (!errors) {
    return null;
  }
  let t = Object.entries(errors);
  let n = {};
  for (let [e, r] of t) {
    if (r && r.__type === `RouteErrorResponse`) {
      n[e] = new Kd(r.status, r.statusText, r.data, r.internal === true);
    } else if (r && r.__type === `Error`) {
      if (typeof r.__subType == `string` && Gd.includes(r.__subType)) {
        let t = window[r.__subType];
        if (typeof t == `function`) {
          try {
            let i = new t(r.message);
            i.stack = ``;
            n[e] = i;
          } catch {}
        }
      }
      if (n[e] == null) {
        let t = Error(r.message);
        t.stack = ``;
        n[e] = t;
      }
    } else {
      n[e] = r;
    }
  }
  return n;
}
const Bh = E.forwardRef(
  (
    {
      onClick,
      discover = `render`,
      prefetch = `none`,
      relative,
      reloadDocument,
      replace,
      mask,
      state,
      target,
      to,
      preventScrollReset,
      viewTransition,
      defaultShouldRevalidate,
      ...rest
    },
    m,
  ) => {
    let { basename, navigator, useTransitions } = E.useContext($pContext);
    let v = typeof to == `string` && Bu.test(to);
    let y = Xd(to, basename);
    to = y.to;
    let page = useCm(to, {
      relative,
    });
    let x = useUm();
    let S = null;
    if (mask) {
      let e = Rd(mask, [], x.mask ? x.mask.pathname : `/`, true);
      if (basename !== `/`) {
        e.pathname = e.pathname === `/` ? basename : Bd([basename, e.pathname]);
      }
      S = navigator.createHref(e);
    }
    let [C, w, T] = useKh(prefetch, rest);
    let D = useGh(to, {
      replace,
      mask,
      state,
      target,
      preventScrollReset,
      relative,
      viewTransition,
      defaultShouldRevalidate,
      useTransitions,
    });
    function O(t) {
      if (onClick) {
        onClick(t);
      }
      if (!t.defaultPrevented) {
        D(t);
      }
    }
    let k = !(y.isExternal || reloadDocument);
    let ee = (
      <a
        {...rest}
        {...T}
        href={(k ? S : undefined) || y.absoluteURL || page}
        onClick={k ? O : onClick}
        ref={Fh(m, w)}
        target={target}
        data-discover={!v && discover === `render` ? `true` : undefined}
      />
    );
    if (C && !v) {
      return (
        <>
          {ee}
          <Jh1Component page={page} />
        </>
      );
    }
    return ee;
  },
);
Bh.displayName = `Link`;
const Vh = E.forwardRef(
  (
    {
      "aria-current": aria_current = `page`,
      caseSensitive = false,
      className = ``,
      end = false,
      style,
      to,
      viewTransition,
      children,
      ...rest
    },
    l,
  ) => {
    let u = useVm(to, {
      relative: rest.relative,
    });
    let d = useUm();
    let f = E.useContext(QpContext);
    let { navigator, basename } = E.useContext($pContext);
    let isTransitioning = f != null && useZh(u) && viewTransition === true;
    let g = navigator.encodeLocation
      ? navigator.encodeLocation(u).pathname
      : u.pathname;
    let d_pathname = d.pathname;
    let v =
      f && f.navigation && f.navigation.location
        ? f.navigation.location.pathname
        : null;
    if (!caseSensitive) {
      d_pathname = d_pathname.toLowerCase();
      v = v ? v.toLowerCase() : null;
      g = g.toLowerCase();
    }
    if (v && basename) {
      v = Ad(v, basename) || v;
    }
    let y = g !== `/` && g.endsWith(`/`) ? g.length - 1 : g.length;
    let isActive =
      d_pathname === g ||
      (!end && d_pathname.startsWith(g) && d_pathname.charAt(y) === `/`);
    let isPending =
      v != null &&
      (v === g || (!end && v.startsWith(g) && v.charAt(g.length) === `/`));
    let S = {
      isActive,
      isPending,
      isTransitioning,
    };
    let C = isActive ? aria_current : undefined;
    let className_1;
    className_1 =
      typeof className == `function`
        ? className(S)
        : [
            className,
            isActive ? `active` : null,
            isPending ? `pending` : null,
            isTransitioning ? `transitioning` : null,
          ]
            .filter(Boolean)
            .join(` `);
    let T = typeof style == `function` ? style(S) : style;
    return (
      <Bh
        {...rest}
        aria-current={C}
        className={className_1}
        ref={l}
        style={T}
        to={to}
        viewTransition={viewTransition}
      >
        {typeof children == `function` ? children(S) : children}
      </Bh>
    );
  },
);
Vh.displayName = `NavLink`;
const Hh = E.forwardRef(
  (
    {
      discover = `render`,
      fetcherKey,
      navigate,
      reloadDocument,
      replace,
      state,
      method = $m,
      action,
      onSubmit,
      relative,
      preventScrollReset,
      viewTransition,
      defaultShouldRevalidate,
      ...rest
    },
    m,
  ) => {
    let { useTransitions } = E.useContext($pContext);
    let g = useYh();
    let action_1 = useXh(action, {
      relative,
    });
    let v = method.toLowerCase() === `get` ? `get` : `post`;
    let y = typeof action == `string` && Bu.test(action);
    return (
      <form
        ref={m}
        method={v}
        action={action_1}
        onSubmit={
          reloadDocument
            ? onSubmit
            : (e) => {
                if (onSubmit) {
                  onSubmit(e);
                }
                if (e.defaultPrevented) {
                  return;
                }
                e.preventDefault();
                let submitter = e.nativeEvent.submitter;
                let s = submitter?.getAttribute(`formmethod`) || method;
                let p = () =>
                  g(submitter || e.currentTarget, {
                    fetcherKey,
                    method: s,
                    navigate,
                    replace,
                    state,
                    relative,
                    preventScrollReset,
                    viewTransition,
                    defaultShouldRevalidate,
                  });
                if (useTransitions && navigate !== false) {
                  E.startTransition(() => p());
                } else {
                  p();
                }
              }
        }
        {...rest}
        data-discover={!y && discover === `render` ? `true` : undefined}
      />
    );
  },
);
Hh.displayName = `Form`;
function Uh(e) {
  return `${e} must be used within a data router.  See https://reactrouter.com/en/main/routers/picking-a-router.`;
}
function useWh(e) {
  let t = E.useContext(KpContext);
  $(t, Uh(e));
  return t;
}
function useGh(
  e,
  {
    target,
    replace,
    mask,
    state,
    preventScrollReset,
    relative,
    viewTransition,
    defaultShouldRevalidate,
    useTransitions,
  } = {},
) {
  let u = usePm();
  let d = useUm();
  let f = useVm(e, {
    relative,
  });
  return E.useCallback(
    (p) => {
      if (oh(p, target)) {
        p.preventDefault();
        let t = replace === undefined ? Xu(d) === Xu(f) : replace;
        let m = () =>
          u(e, {
            replace: t,
            mask,
            state,
            preventScrollReset,
            relative,
            viewTransition,
            defaultShouldRevalidate,
          });
        if (useTransitions) {
          E.startTransition(() => m());
        } else {
          m();
        }
      }
    },
    [
      d,
      u,
      f,
      replace,
      mask,
      state,
      target,
      e,
      preventScrollReset,
      relative,
      viewTransition,
      defaultShouldRevalidate,
      useTransitions,
    ],
  );
}
function Kh(e) {
  Ku(
    typeof URLSearchParams < `u`,
    "You cannot use the `useSearchParams` hook in a browser that does not support the URLSearchParams API. If you need to support Internet Explorer 11, we recommend you load a polyfill such as https://github.com/ungap/url-search-params.",
  );
  let tRef = E.useRef(sh(e));
  let nRef = E.useRef(false);
  let r = useUm();
  let i = E.useMemo(
    () => ch(r.search, nRef.current ? null : tRef.current),
    [r.search],
  );
  let a = usePm();
  return [
    i,
    E.useCallback(
      (e, t) => {
        let r = sh(typeof e == `function` ? e(new URLSearchParams(i)) : e);
        nRef.current = true;
        a(`?` + r, t);
      },
      [a, i],
    ),
  ];
}
let qh = 0;
var Jh = () => `__${String(++qh)}__`;
function useYh() {
  let { router } = useWh(`useSubmit`);
  let { basename } = E.useContext($pContext);
  let n = Mm();
  let router_fetch = router.fetch;
  let router_navigate = router.navigate;
  return E.useCallback(
    async (e, a = {}) => {
      let { action, method, encType, formData, body } = ph(e, basename);
      if (a.navigate === false) {
        let e = a.fetcherKey || Jh();
        await router_fetch(e, n, a.action || action, {
          defaultShouldRevalidate: a.defaultShouldRevalidate,
          preventScrollReset: a.preventScrollReset,
          formData,
          body,
          formMethod: a.method || method,
          formEncType: a.encType || encType,
          flushSync: a.flushSync,
        });
      } else {
        await router_navigate(a.action || action, {
          defaultShouldRevalidate: a.defaultShouldRevalidate,
          preventScrollReset: a.preventScrollReset,
          formData,
          body,
          formMethod: a.method || method,
          formEncType: a.encType || encType,
          replace: a.replace,
          state: a.state,
          fromRouteId: n,
          flushSync: a.flushSync,
          viewTransition: a.viewTransition,
        });
      }
    },
    [router_fetch, router_navigate, basename, n],
  );
}
function useXh(action, { relative } = {}) {
  let { basename } = E.useContext($pContext);
  let r = E.useContext(TmContext);
  $(r, `useFormAction must be used inside a RouteContext`);
  let [i] = r.matches.slice(-1);
  let a = {
    ...useVm(action || `.`, {
      relative,
    }),
  };
  let o = useUm();
  if (action == null) {
    a.search = o.search;
    let e = new URLSearchParams(a.search);
    let t = e.getAll(`index`);
    if (t.some((e) => e === ``)) {
      e.delete(`index`);
      t.filter((e) => e).forEach((t) => e.append(`index`, t));
      let n = e.toString();
      a.search = n ? `?${n}` : ``;
    }
  }
  if ((!action || action === `.`) && i.route.index) {
    a.search = a.search ? a.search.replace(/^\?/, `?index&`) : `?index`;
  }
  if (basename !== `/`) {
    a.pathname = a.pathname === `/` ? basename : Bd([basename, a.pathname]);
  }
  return Xu(a);
}
function useZh(e, { relative } = {}) {
  let n = E.useContext(XpContext);
  $(
    n != null,
    "`useViewTransitionState` must be used within `react-router-dom`'s `RouterProvider`.  Did you accidentally import `RouterProvider` from `react-router`?",
  );
  let { basename } = useWh(`useViewTransitionState`);
  let i = useVm(e, {
    relative,
  });
  if (!n.isTransitioning) {
    return false;
  }
  let a =
    Ad(n.currentLocation.pathname, basename) || n.currentLocation.pathname;
  let o = Ad(n.nextLocation.pathname, basename) || n.nextLocation.pathname;
  return Ed(i.pathname, o) != null || Ed(i.pathname, a) != null;
}
const Qh = i_1(w(), 1);
function HComponent(e) {
  return <Qm1Component flushSync={Qh.flushSync} {...e} />;
}
const eg = {
  name: `activity`,
  size: 24,
  node: [
    [
      `path`,
      {
        d: `M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2`,
        key: `169zse`,
      },
    ],
  ],
};
eg.node;
const tg = i(eg);
const ng = {
  name: `book-open`,
  size: 24,
  node: [
    [
      `path`,
      {
        d: `M12 5v16`,
        key: `1f6ucr`,
      },
    ],
    [
      `path`,
      {
        d: `M20.001 19A2 2 0 0022 17V5a2 2 0 00-1.999-2L16 3.002A5 5 0 0012 5a5 5 0 00-4-2H4a2 2 0 00-2 2v12a2 2 0 001.999 2H8a5 5 0 014 2 5 5 0 014-2z`,
        key: `1fyvmf`,
      },
    ],
  ],
};
ng.node;
const rg = i(ng);
const ig = {
  name: `chart-no-axes-combined`,
  size: 24,
  node: [
    [
      `path`,
      {
        d: `M12 16v5`,
        key: `zza2cw`,
      },
    ],
    [
      `path`,
      {
        d: `M16 14.639V21`,
        key: `1s85h0`,
      },
    ],
    [
      `path`,
      {
        d: `M20 10.656V21`,
        key: `q45596`,
      },
    ],
    [
      `path`,
      {
        d: `m22 3-8.646 8.646a.5.5 0 0 1-.708 0L9.354 8.354a.5.5 0 0 0-.707 0L2 15`,
        key: `1fw8x9`,
      },
    ],
    [
      `path`,
      {
        d: `M4 18.463V21`,
        key: `1otddq`,
      },
    ],
    [
      `path`,
      {
        d: `M8 14.656V21`,
        key: `1t2idw`,
      },
    ],
  ],
};
ig.node;
const ag = i(ig);
const og = {
  name: `circle-check`,
  size: 24,
  node: [
    [
      `circle`,
      {
        cx: `12`,
        cy: `12`,
        r: `10`,
        key: `1mglay`,
      },
    ],
    [
      `path`,
      {
        d: `m16 9-5.5 5.5L8 12`,
        key: `xofnsj`,
      },
    ],
  ],
  aliases: [`check-circle-2`],
};
og.node;
const Sg1 = i(og);
const cg = {
  name: `circle-x`,
  size: 24,
  node: [
    [
      `circle`,
      {
        cx: `12`,
        cy: `12`,
        r: `10`,
        key: `1mglay`,
      },
    ],
    [
      `path`,
      {
        d: `m15 9-6 6`,
        key: `1uzhvr`,
      },
    ],
    [
      `path`,
      {
        d: `m9 9 6 6`,
        key: `z0biqf`,
      },
    ],
  ],
  aliases: [`x-circle`],
};
cg.node;
const Lg1 = i(cg);
const ug = {
  name: `gauge`,
  size: 24,
  node: [
    [
      `path`,
      {
        d: `m12 14 4-4`,
        key: `9kzdfg`,
      },
    ],
    [
      `path`,
      {
        d: `M3.34 19a10 10 0 1 1 17.32 0`,
        key: `19p75a`,
      },
    ],
  ],
};
ug.node;
const dg = i(ug);
const fg = {
  name: `info`,
  size: 24,
  node: [
    [
      `circle`,
      {
        cx: `12`,
        cy: `12`,
        r: `10`,
        key: `1mglay`,
      },
    ],
    [
      `path`,
      {
        d: `M12 16v-4`,
        key: `1dtifu`,
      },
    ],
    [
      `path`,
      {
        d: `M12 8h.01`,
        key: `e9boi3`,
      },
    ],
  ],
};
fg.node;
const Pg1 = i(fg);
const mg = {
  name: `layers`,
  size: 24,
  node: [
    [
      `path`,
      {
        d: `M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z`,
        key: `zw3jo`,
      },
    ],
    [
      `path`,
      {
        d: `M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12`,
        key: `1wduqc`,
      },
    ],
    [
      `path`,
      {
        d: `M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17`,
        key: `kqbvx6`,
      },
    ],
  ],
  aliases: [`layers-3`],
};
mg.node;
const hg = i(mg);
const gg = {
  name: `log-out`,
  size: 24,
  node: [
    [
      `path`,
      {
        d: `m16 17 5-5-5-5`,
        key: `1bji2h`,
      },
    ],
    [
      `path`,
      {
        d: `M21 12H9`,
        key: `dn1m92`,
      },
    ],
    [
      `path`,
      {
        d: `M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4`,
        key: `1uf3rs`,
      },
    ],
  ],
};
gg.node;
const _g = i(gg);
const vg = {
  name: `messages-square`,
  size: 24,
  node: [
    [
      `path`,
      {
        d: `M16 10a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 14.286V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z`,
        key: `1n2ejm`,
      },
    ],
    [
      `path`,
      {
        d: `M20 9a2 2 0 0 1 2 2v10.286a.71.71 0 0 1-1.212.502l-2.202-2.202A2 2 0 0 0 17.172 19H10a2 2 0 0 1-2-2v-1`,
        key: `1qfcsi`,
      },
    ],
  ],
};
vg.node;
const yg = i(vg);
const bg = {
  name: `monitor-play`,
  size: 24,
  node: [
    [
      `path`,
      {
        d: `M15.033 9.44a.647.647 0 0 1 0 1.12l-4.065 2.352a.645.645 0 0 1-.968-.56V7.648a.645.645 0 0 1 .967-.56z`,
        key: `vbtd3f`,
      },
    ],
    [
      `path`,
      {
        d: `M12 17v4`,
        key: `1riwvh`,
      },
    ],
    [
      `path`,
      {
        d: `M8 21h8`,
        key: `1ev6f3`,
      },
    ],
    [
      `rect`,
      {
        x: `2`,
        y: `3`,
        width: `20`,
        height: `14`,
        rx: `2`,
        key: `x3v2xh`,
      },
    ],
  ],
};
bg.node;
const xg = i(bg);
const Sg = {
  name: `palette`,
  size: 24,
  node: [
    [
      `path`,
      {
        d: `M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z`,
        key: `e79jfc`,
      },
    ],
    [
      `circle`,
      {
        cx: `13.5`,
        cy: `6.5`,
        r: `.5`,
        fill: `currentColor`,
        key: `1okk4w`,
      },
    ],
    [
      `circle`,
      {
        cx: `17.5`,
        cy: `10.5`,
        r: `.5`,
        fill: `currentColor`,
        key: `f64h9f`,
      },
    ],
    [
      `circle`,
      {
        cx: `6.5`,
        cy: `12.5`,
        r: `.5`,
        fill: `currentColor`,
        key: `qy21gx`,
      },
    ],
    [
      `circle`,
      {
        cx: `8.5`,
        cy: `7.5`,
        r: `.5`,
        fill: `currentColor`,
        key: `fotxhn`,
      },
    ],
  ],
};
Sg.node;
const icon = i(Sg);
const wg = {
  name: `pause`,
  size: 24,
  node: [
    [
      `rect`,
      {
        x: `14`,
        y: `3`,
        width: `5`,
        height: `18`,
        rx: `1`,
        key: `kaeet6`,
      },
    ],
    [
      `rect`,
      {
        x: `5`,
        y: `3`,
        width: `5`,
        height: `18`,
        rx: `1`,
        key: `1wsw3u`,
      },
    ],
  ],
};
wg.node;
const Tg = i(wg);
const Eg = {
  name: `scale`,
  size: 24,
  node: [
    [
      `path`,
      {
        d: `M12 3v18`,
        key: `108xh3`,
      },
    ],
    [
      `path`,
      {
        d: `m19 8 3 8a5 5 0 0 1-6 0zV7`,
        key: `zcdpyk`,
      },
    ],
    [
      `path`,
      {
        d: `M3 7h1a17 17 0 0 0 8-2 17 17 0 0 0 8 2h1`,
        key: `1yorad`,
      },
    ],
    [
      `path`,
      {
        d: `m5 8 3 8a5 5 0 0 1-6 0zV7`,
        key: `eua70x`,
      },
    ],
    [
      `path`,
      {
        d: `M7 21h10`,
        key: `1b0cd5`,
      },
    ],
  ],
};
Eg.node;
const Dg = i(Eg);
const Og = {
  name: `settings-2`,
  size: 24,
  node: [
    [
      `path`,
      {
        d: `M14 17H5`,
        key: `gfn3mx`,
      },
    ],
    [
      `path`,
      {
        d: `M19 7h-9`,
        key: `6i9tg`,
      },
    ],
    [
      `circle`,
      {
        cx: `17`,
        cy: `17`,
        r: `3`,
        key: `18b49y`,
      },
    ],
    [
      `circle`,
      {
        cx: `7`,
        cy: `7`,
        r: `3`,
        key: `dfmy0x`,
      },
    ],
  ],
};
Og.node;
const Kg1 = i(Og);
const Ag = {
  name: `sparkles`,
  size: 24,
  node: [
    [
      `path`,
      {
        d: `M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z`,
        key: `1s2grr`,
      },
    ],
    [
      `path`,
      {
        d: `M20 2v4`,
        key: `1rf3ol`,
      },
    ],
    [
      `path`,
      {
        d: `M22 4h-4`,
        key: `gwowj6`,
      },
    ],
    [
      `circle`,
      {
        cx: `4`,
        cy: `20`,
        r: `2`,
        key: `6kqj1y`,
      },
    ],
  ],
  aliases: [`stars`],
};
Ag.node;
const Jg1 = i(Ag);
const Mg = {
  name: `store`,
  size: 24,
  node: [
    [
      `path`,
      {
        d: `M15 21v-5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v5`,
        key: `slp6dd`,
      },
    ],
    [
      `path`,
      {
        d: `M17.774 10.31a1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.451 0 1.12 1.12 0 0 0-1.548 0 2.5 2.5 0 0 1-3.452 0 1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.77-3.248l2.889-4.184A2 2 0 0 1 7 2h10a2 2 0 0 1 1.653.873l2.895 4.192a2.5 2.5 0 0 1-3.774 3.244`,
        key: `o0xfot`,
      },
    ],
    [
      `path`,
      {
        d: `M4 10.95V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8.05`,
        key: `wn3emo`,
      },
    ],
  ],
};
Mg.node;
const Ng = i(Mg);
const Pg = {
  name: `swords`,
  size: 24,
  node: [
    [
      `path`,
      {
        d: `m13 19 6-6`,
        key: `gj6q8g`,
      },
    ],
    [
      `path`,
      {
        d: `M14.5 17.5 3.586 6.586A2 2 0 013 5.172V3h2.172a2 2 0 011.414.586L17.5 14.5`,
        key: `uwfxh8`,
      },
    ],
    [
      `path`,
      {
        d: `m14.828 6.172 2.586-2.586A2 2 0 0118.828 3H21v2.172a2 2 0 01-.586 1.414l-2.586 2.586`,
        key: `1f17hx`,
      },
    ],
    [
      `path`,
      {
        d: `m16 16 4 4`,
        key: `up5ibb`,
      },
    ],
    [
      `path`,
      {
        d: `m19 21 2-2`,
        key: `1phfkn`,
      },
    ],
    [
      `path`,
      {
        d: `m5 14 4 4`,
        key: `1gk0qx`,
      },
    ],
    [
      `path`,
      {
        d: `m5 21-2-2`,
        key: `1kw20b`,
      },
    ],
    [
      `path`,
      {
        d: `M7.5 16.5 4 20`,
        key: `14nozp`,
      },
    ],
  ],
};
Pg.node;
const Fg = i(Pg);
const Ig = {
  name: `trophy`,
  size: 24,
  node: [
    [
      `path`,
      {
        d: `M10 14.66V17a1 1 0 0 1-1 1 2 2 0 0 0-2 2v2`,
        key: `pwuv1l`,
      },
    ],
    [
      `path`,
      {
        d: `M14 14.66V17a1 1 0 0 0 1 1 2 2 0 0 1 2 2v2`,
        key: `1y54w1`,
      },
    ],
    [
      `path`,
      {
        d: `M17.916 10H19.5A2.5 2.5 0 0 0 22 7.5V5a1 1 0 0 0-1-1h-3`,
        key: `e30mpu`,
      },
    ],
    [
      `path`,
      {
        d: `M4 22h16`,
        key: `57wxv0`,
      },
    ],
    [
      `path`,
      {
        d: `M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z`,
        key: `1mhfuq`,
      },
    ],
    [
      `path`,
      {
        d: `M6.084 10H4.5A2.5 2.5 0 0 1 2 7.5V5a1 1 0 0 1 1-1h3`,
        key: `i0yafy`,
      },
    ],
  ],
};
Ig.node;
const Lg = i(Ig);
const Rg = {
  name: `users`,
  size: 24,
  node: [
    [
      `path`,
      {
        d: `M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2`,
        key: `1yyitq`,
      },
    ],
    [
      `path`,
      {
        d: `M16 3.128a4 4 0 0 1 0 7.744`,
        key: `16gr8j`,
      },
    ],
    [
      `path`,
      {
        d: `M22 21v-2a4 4 0 0 0-3-3.87`,
        key: `kshegd`,
      },
    ],
    [
      `circle`,
      {
        cx: `9`,
        cy: `7`,
        r: `4`,
        key: `nufk8`,
      },
    ],
  ],
};
Rg.node;
const zg = i(Rg);
const Bg = {
  name: `venetian-mask`,
  size: 24,
  node: [
    [
      `path`,
      {
        d: `M18 11c-1.5 0-2.5.5-3 2`,
        key: `1fod00`,
      },
    ],
    [
      `path`,
      {
        d: `M4 6a2 2 0 0 0-2 2v4a5 5 0 0 0 5 5 8 8 0 0 1 5 2 8 8 0 0 1 5-2 5 5 0 0 0 5-5V8a2 2 0 0 0-2-2h-3a8 8 0 0 0-5 2 8 8 0 0 0-5-2z`,
        key: `d70hit`,
      },
    ],
    [
      `path`,
      {
        d: `M6 11c1.5 0 2.5.5 3 2`,
        key: `136fht`,
      },
    ],
  ],
};
Bg.node;
const Vg = i(Bg);
const Hg = `−`;
const Ug = (e) =>
  new Intl.NumberFormat(`en-US`, {
    minimumFractionDigits: e,
    maximumFractionDigits: e,
  });
const Wg = new Map();
function Gg(e, t) {
  let n = Wg.get(t);
  if (!n) {
    n = Ug(t);
    Wg.set(t, n);
  }
  return n.format(Math.abs(e));
}
const Kg = (e) => typeof e == `number` && Number.isFinite(e);
function qg(e, t = 0) {
  if (!Kg(e)) {
    return `—`;
  }
  let n = Gg(e, t);
  if (e < 0 && n !== Gg(0, t)) {
    return Hg + n;
  }
  return n;
}
function Jg(e, t = 0) {
  if (!Kg(e)) {
    return `—`;
  }
  let n = qg(e, t);
  if (e > 0 && n !== Gg(0, t)) {
    return `+${n}`;
  }
  return n;
}
function Yg(e, t = {}) {
  if (!Kg(e)) {
    return `—`;
  }
  let { symbol = `P`, decimals = 0, sign = false, compact = false } = t;
  let o = Math.abs(e);
  let s;
  s =
    compact && o >= 10000
      ? o >= 1000000
        ? `${Gg(o / 1000000, 1)}M`
        : `${Gg(o / 1000, 1)}k`
      : Gg(o, decimals);
  return `${e < 0 && s !== Gg(0, decimals) ? Hg : sign && e > 0 ? `+` : ``}${symbol}${s}`;
}
function Xg(e, t = 0) {
  if (Kg(e)) {
    return `${qg(e * 100, t)}%`;
  }
  return `—`;
}
function Zg(e) {
  if (Kg(e)) {
    return `${qg(e / 100, e % 100 == 0 ? 0 : 2)}%`;
  }
  return `—`;
}
function Qg(e) {
  if (Kg(e)) {
    return `T${qg(e)}`;
  }
  return `T—`;
}
function $g(e) {
  if (!Kg(e)) {
    return `—`;
  }
  let t = Math.max(0, Math.round(e * 3600));
  let n = Math.floor(t / 3600);
  let r = Math.floor((t % 3600) / 60);
  let i = t % 60;
  let a = String(r).padStart(2, `0`);
  let o = String(i).padStart(2, `0`);
  if (n > 0) {
    return `${n}:${a}:${o}`;
  }
  return `${r}:${o}`;
}
function e_(e) {
  if (!Kg(e)) {
    return `—`;
  }
  let t = Math.max(0, Math.round(Math.abs(e) * 3600));
  let n = Math.floor(t / 3600);
  let r = Math.floor((t % 3600) / 60);
  if (n >= 24) {
    return `${Math.floor(n / 24)}d ${n % 24}h`;
  }
  if (n > 0) {
    return `${n}h ${String(r).padStart(2, `0`)}m`;
  }
  if (r > 0) {
    return `${r}m`;
  }
  return `${t % 60}s`;
}
function t_(e, t) {
  if (!Kg(e) || !Kg(t)) {
    return ``;
  }
  let n = t - e;
  if (n < 1 / 60) {
    return `just now`;
  }
  return `${e_(n)} ago`;
}
function n_(e, t = false) {
  if (!Kg(e)) {
    return `—`;
  }
  let n = Math.max(0, e);
  if (t && n < 10) {
    return `${n.toFixed(1)}s`;
  }
  let r = Math.ceil(n);
  return `${Math.floor(r / 60)}:${String(r % 60).padStart(2, `0`)}`;
}
function r_(e, t, n = `${t}s`) {
  return `${qg(e)} ${e === 1 ? t : n}`;
}
function i_(e, t) {
  if (!Kg(e)) {
    return ``;
  }
  if (!Kg(t)) {
    return `#${e}`;
  }
  let length = String(t).length;
  return `#${String(e).padStart(Math.max(2, length), `0`)}/${t}`;
}
function a_(e) {
  let t = e.indexOf(`:`);
  if (t < 0) {
    return {
      kind: `card`,
      ref: e,
    };
  }
  return {
    kind: e.slice(0, t),
    ref: e.slice(t + 1),
  };
}
function o_(e) {
  return e.replace(/[._-]+/g, ` `).trim();
}
const s_ = {
  neutral: `bg-raised text-ink border-line-strong`,
  muted: `bg-transparent text-muted border-line`,
  gold: `bg-gold/12 text-gold border-gold/35`,
  good: `bg-good/12 text-good border-good/35`,
  warn: `bg-warn/12 text-warn border-warn/35`,
  accent: `bg-accent/12 text-accent border-accent/40`,
  info: `bg-info/12 text-info border-info/35`,
};
function CComponent({
  tone = `neutral`,
  dot,
  live,
  icon,
  size = `sm`,
  onRemove,
  className,
  children,
  style,
  ...rest
}) {
  let f = T_1(tone) ? tone : null;
  let color = f ? v[f] : null;
  return (
    <span
      className={r_2(
        `inline-flex max-w-full items-center gap-1.5 rounded-full border font-semibold leading-none whitespace-nowrap`,
        size === `sm` ? `h-6 px-2.5 text-[11px]` : `h-7 px-3 text-xs`,
        !f && s_[tone],
        className,
      )}
      style={
        color
          ? {
              color,
              borderColor: `${color}59`,
              background: `${color}1f`,
              ...style,
            }
          : style
      }
      {...rest}
    >
      {live ? (
        <U1Component />
      ) : dot ? (
        <span
          className={`size-1.5 shrink-0 rounded-full bg-current`}
          aria-hidden
        />
      ) : null}
      {icon}
      <span className={`truncate`}>{children}</span>
      {onRemove && (
        <button
          type={`button`}
          onClick={onRemove}
          className={`-mr-1 rounded-full p-0.5 opacity-70 hover:opacity-100`}
          aria-label={`Remove`}
        >
          <B1 className={`size-3`} />
        </button>
      )}
    </span>
  );
}
const l_ = {
  accent: `bg-accent`,
  good: `bg-good`,
  gold: `bg-gold`,
  muted: `bg-faint`,
};
function U1Component({ tone = `accent`, pulse = true, className, label }) {
  return (
    <span
      role={label ? `status` : undefined}
      aria-label={label}
      aria-hidden={!label || undefined}
      className={r_2(
        `inline-block size-2 shrink-0 rounded-full`,
        l_[tone],
        pulse && tone === `accent` && `animate-live`,
        className,
      )}
    />
  );
}
const d_ = new Set();
let f_ = {
  clock: null,
  syncedAt: 0,
  error: null,
};
let p_ = 0;
let m_ = null;
let h_ = null;
function g_(e) {
  f_ = {
    ...f_,
    ...e,
  };
  for (let e of [...d_]) {
    e();
  }
}
function __() {
  if (m_) {
    clearTimeout(m_);
  }
  m_ = null;
  if (p_ === 0) {
    return;
  }
  let f__clock = f_.clock;
  let t = 10000;
  if (f_.error) {
    t = 3000;
  } else if (f__clock && !f__clock.paused) {
    t = Math.min(10000, Math.max(1000, f__clock.next_tick_in * 1000 + 300));
  } else if (f__clock?.paused) {
    t = 4000;
  }
  m_ = setTimeout(() => void refresh(), t);
}
function refresh() {
  return (
    h_ ||
    ((h_ = c
      .clock()
      .then((clock) =>
        g_({
          clock,
          syncedAt: performance.now(),
          error: null,
        }),
      )
      .catch((e) =>
        g_({
          error: e,
        }),
      )
      .finally(() => {
        h_ = null;
        __();
      })),
    h_)
  );
}
function y_(e) {
  d_.add(e);
  if (p_++ === 0) {
    refresh();
  }
  return () => {
    d_.delete(e);
    if (--p_ === 0 && m_) {
      clearTimeout(m_);
      m_ = null;
    }
  };
}
function useB({ live = true } = {}) {
  let n = E.useSyncExternalStore(
    y_,
    () => f_,
    () => f_,
  );
  let [r, setR] = E.useState(() => performance.now());
  E.useEffect(() => {
    if (!live) {
      return;
    }
    let e = setInterval(() => setR(performance.now()), 100);
    return () => clearInterval(e);
  }, [live]);
  let n_clock = n.clock;
  let nextTickIn = null;
  let progress = 0;
  if (n_clock) {
    let e = Math.max(0, ((live ? r : performance.now()) - n.syncedAt) / 1000);
    nextTickIn = Math.max(0, n_clock.next_tick_in - e);
    progress =
      n_clock.tick_seconds > 0
        ? Math.min(1, Math.max(0, 1 - nextTickIn / n_clock.tick_seconds))
        : 0;
  }
  return {
    clock: n_clock,
    nextTickIn,
    progress,
    paused: !!n_clock?.paused,
    error: n.error,
    refresh,
  };
}
const x_ = new Intl.NumberFormat(`en-US`);
function SComponent({ value, format, weight = 800, className, title }) {
  let o =
    value == null || (typeof value == `number` && !Number.isFinite(value))
      ? `—`
      : typeof value == `number`
        ? (format ?? x_.format)(value)
        : value;
  return (
    <span
      className={r_2(`num`, className)}
      data-weight={weight === 800 ? undefined : weight}
      title={title}
    >
      <span className={`sr-only`}>{o}</span>
      {Array.from(o).map((e, t) => {
        if (e >= `0` && e <= `9`) {
          return (
            <span key={t} className={`d`} aria-hidden>
              {e}
            </span>
          );
        }
        return (
          <span key={t} aria-hidden>
            {e}
          </span>
        );
      })}
    </span>
  );
}
function C_({ variant = `full`, className }) {
  let { clock, nextTickIn, progress, paused, error } = useB();
  let strokeDasharray = 2 * Math.PI * 9;
  return (
    <div
      className={r_2(
        `inline-flex shrink-0 items-center gap-3 whitespace-nowrap rounded-full border border-line bg-panel/80 py-1.5 pl-3 pr-4 backdrop-blur`,
        className,
      )}
      title={
        clock
          ? `Tick ${qg(clock.tick)} · every ${clock.tick_seconds}s${paused ? ` · paused` : ``}`
          : `connecting…`
      }
    >
      {paused ? (
        <Tg className={`size-3.5 text-warn`} aria-label={`paused`} />
      ) : (
        <U1Component
          tone={error ? `muted` : `accent`}
          label={error ? `offline` : `live`}
        />
      )}
      <span className={`flex items-baseline gap-1`}>
        <span className={`eyebrow`}>{`tick`}</span>
        <SComponent
          value={clock?.tick ?? null}
          className={`text-xl text-ink`}
        />
      </span>
      <span
        className={`relative grid size-6 place-items-center`}
        aria-label={paused ? `paused` : `next tick in ${n_(nextTickIn)}`}
      >
        <svg viewBox={`0 0 24 24`} className={`absolute inset-0 -rotate-90`}>
          <circle
            cx={`12`}
            cy={`12`}
            r={9}
            fill={`none`}
            stroke={`var(--color-line-strong)`}
            strokeWidth={`2.5`}
          />
          <circle
            cx={`12`}
            cy={`12`}
            r={9}
            fill={`none`}
            stroke={paused ? `var(--color-warn)` : `var(--color-gold)`}
            strokeWidth={`2.5`}
            strokeLinecap={`round`}
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDasharray * (1 - (paused ? 1 : progress))}
          />
        </svg>
        <span className={`font-mono text-[8px] font-bold text-muted`}>
          {paused ? `` : Math.ceil(nextTickIn ?? 0)}
        </span>
      </span>
      {variant === `full` && clock && (
        <span
          className={`hidden items-baseline gap-2 text-xs text-muted lg:flex`}
        >
          <span className={`font-semibold text-ink`}>{clock.round_name}</span>
          <span className={`font-mono`}>{$g(clock.t_hours)}</span>
        </span>
      )}
    </div>
  );
}
function useW(open, onClose) {
  let nRef = E.useRef(null);
  let rRef = E.useRef(onClose);
  rRef.current = onClose;
  E.useEffect(() => {
    if (!open) {
      return;
    }
    let document_activeElement = document.activeElement;
    let i = (e) => {
      if (e.key === `Escape`) {
        e.stopPropagation();
        rRef.current();
      }
      if (e.key === `Tab` && nRef.current) {
        let t = nRef.current.querySelectorAll(
          `button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])`,
        );
        let r = Array.from(t).filter((e) => !e.hasAttribute(`disabled`));
        if (!r.length) {
          return;
        }
        let i = r[0];
        let a = r[r.length - 1];
        if (e.shiftKey && document.activeElement === i) {
          e.preventDefault();
          a.focus();
        } else if (!e.shiftKey && document.activeElement === a) {
          e.preventDefault();
          i.focus();
        }
      }
    };
    document.addEventListener(`keydown`, i);
    let overflow = document.body.style.overflow;
    document.body.style.overflow = `hidden`;
    let o = setTimeout(() => {
      (
        nRef.current?.querySelector(
          `[data-autofocus],input,textarea,select,button:not([data-close])`,
        ) ?? nRef.current
      )?.focus();
    }, 30);
    return () => {
      clearTimeout(o);
      document.removeEventListener(`keydown`, i);
      document.body.style.overflow = overflow;
      document_activeElement?.focus?.();
    };
  }, [open]);
  return nRef;
}
const T_ = {
  sm: `max-w-sm`,
  md: `max-w-lg`,
  lg: `max-w-2xl`,
  xl: `max-w-4xl`,
};
function EComponent({
  open,
  onClose,
  title,
  description,
  footer,
  children,
  size = `md`,
  dismissable = true,
  className,
}) {
  let u = useW(open, onClose);
  let d = E.useId();
  return Qh.createPortal(
    <RcComponent>
      {open && (
        <Au.div
          className={`fixed inset-0 z-50 flex items-center justify-center p-4`}
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          exit={{
            opacity: 0,
          }}
        >
          <div
            className={`absolute inset-0 bg-[#05080f]/75 backdrop-blur-[3px]`}
            onClick={dismissable ? onClose : undefined}
            aria-hidden
          />
          <Au.div
            ref={u}
            role={`dialog`}
            aria-modal={`true`}
            aria-labelledby={title ? d : undefined}
            tabIndex={-1}
            initial={{
              opacity: 0,
              y: 14,
              scale: 0.98,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: 8,
              scale: 0.98,
            }}
            transition={{
              type: `spring`,
              bounce: 0.12,
              duration: 0.35,
            }}
            className={r_2(
              `relative flex max-h-[88vh] w-full flex-col overflow-hidden rounded-2xl border border-line-strong bg-panel shadow-[var(--shadow-lift)] outline-none`,
              T_[size],
              className,
            )}
          >
            <OComponent
              titleId={d}
              title={title}
              description={description}
              onClose={onClose}
            />
            <div className={`min-h-0 flex-1 overflow-y-auto px-6 py-4`}>
              {children}
            </div>
            {footer && (
              <div
                className={`flex items-center justify-end gap-2 border-t border-line bg-base/40 px-6 py-3.5`}
              >
                {footer}
              </div>
            )}
          </Au.div>
        </Au.div>
      )}
    </RcComponent>,
    document.body,
  );
}
function DComponent({
  open,
  onClose,
  title,
  description,
  footer,
  children,
  side = `right`,
  width = `min(560px, 100vw)`,
  dismissable = true,
  className,
}) {
  let d = useW(open, onClose);
  let f = E.useId();
  let x_1 = side === `right` ? `100%` : `-100%`;
  return Qh.createPortal(
    <RcComponent>
      {open && (
        <Au.div
          className={`fixed inset-0 z-50`}
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          exit={{
            opacity: 0,
          }}
        >
          <div
            className={`absolute inset-0 bg-[#05080f]/60 backdrop-blur-[2px]`}
            onClick={dismissable ? onClose : undefined}
            aria-hidden
          />
          <Au.div
            ref={d}
            role={`dialog`}
            aria-modal={`true`}
            aria-labelledby={title ? f : undefined}
            tabIndex={-1}
            initial={{
              x: x_1,
            }}
            animate={{
              x: 0,
            }}
            exit={{
              x: x_1,
            }}
            transition={{
              type: `spring`,
              bounce: 0,
              duration: 0.38,
            }}
            style={{
              width,
            }}
            className={r_2(
              `absolute top-0 flex h-full flex-col border-line-strong bg-panel shadow-[var(--shadow-lift)] outline-none`,
              side === `right` ? `right-0 border-l` : `left-0 border-r`,
              className,
            )}
          >
            <OComponent
              titleId={f}
              title={title}
              description={description}
              onClose={onClose}
            />
            <div className={`min-h-0 flex-1 overflow-y-auto px-6 py-4`}>
              {children}
            </div>
            {footer && (
              <div
                className={`flex items-center justify-end gap-2 border-t border-line bg-base/40 px-6 py-3.5`}
              >
                {footer}
              </div>
            )}
          </Au.div>
        </Au.div>
      )}
    </RcComponent>,
    document.body,
  );
}
function OComponent({ titleId, title, description, onClose }) {
  return (
    <div
      className={`flex items-start justify-between gap-4 border-b border-line px-6 pb-3.5 pt-4`}
    >
      <div className={`min-w-0`}>
        {title && (
          <h2 id={titleId} className={`text-2xl text-ink`}>
            {title}
          </h2>
        )}
        {description && (
          <p className={`mt-1 text-sm text-muted`}>{description}</p>
        )}
      </div>
      <button
        type={`button`}
        data-close
        onClick={onClose}
        className={`-mr-2 rounded-lg p-2 text-muted hover:bg-raised hover:text-ink`}
        aria-label={`Close`}
      >
        <B1 className={`size-5`} />
      </button>
    </div>
  );
}
const K_Context = E.createContext(null);
const A_ = {
  info: <Pg1 className={`size-4 text-info`} />,
  success: <Sg1 className={`size-4 text-good`} />,
  warn: <F1 className={`size-4 text-warn`} />,
  error: <Lg1 className={`size-4 text-accent`} />,
  gold: <Jg1 className={`size-4 text-gold`} />,
};
const j_ = {
  info: `before:bg-info`,
  success: `before:bg-good`,
  warn: `before:bg-warn`,
  error: `before:bg-accent`,
  gold: `before:bg-gold`,
};
function MComponent({ children }) {
  let [t, setT] = E.useState([]);
  let rRef = E.useRef(0);
  let dismiss = E.useCallback(
    (e) => setT((t) => t.filter((t) => t.id !== e)),
    [],
  );
  let show = E.useCallback(
    (e) => {
      let t = ++rRef.current;
      let a = e.duration ?? (e.tone === `error` ? 8000 : 4500);
      setT((n) => [
        ...n.slice(-4),
        {
          ...e,
          id: t,
        },
      ]);
      if (a > 0) {
        setTimeout(() => dismiss(t), a);
      }
      return t;
    },
    [dismiss],
  );
  let s = E.useMemo(
    () => ({
      show,
      dismiss,
      success: (e, t) =>
        show({
          title: e,
          description: t,
          tone: `success`,
        }),
      info: (e, t) =>
        show({
          title: e,
          description: t,
          tone: `info`,
        }),
      warn: (e, t) =>
        show({
          title: e,
          description: t,
          tone: `warn`,
        }),
      gold: (e, t) =>
        show({
          title: e,
          description: t,
          tone: `gold`,
        }),
      error: (e, t) => {
        let n = u(e);
        return show({
          title: t ?? n.message,
          description: t ? `${n.error} — ${n.message}` : n.error,
          tone: `error`,
        });
      },
    }),
    [show, dismiss],
  );
  return (
    <K_Context.Provider value={s}>
      {children}
      {Qh.createPortal(
        <div
          className={`pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(380px,calc(100vw-2rem))] flex-col gap-2`}
          aria-live={`polite`}
        >
          <RcComponent initial={false}>
            {t.map((e) => (
              <Au.div
                key={e.id}
                layout
                initial={{
                  opacity: 0,
                  y: 16,
                  scale: 0.97,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                }}
                exit={{
                  opacity: 0,
                  x: 40,
                  transition: {
                    duration: 0.18,
                  },
                }}
                transition={{
                  type: `spring`,
                  bounce: 0.2,
                  duration: 0.4,
                }}
                role={e.tone === `error` ? `alert` : `status`}
                className={r_2(
                  `pointer-events-auto relative flex items-start gap-3 overflow-hidden rounded-xl border border-line-strong bg-raised/95 py-3 pl-4 pr-3 shadow-[var(--shadow-lift)] backdrop-blur`,
                  `before:absolute before:inset-y-0 before:left-0 before:w-1 before:content-['']`,
                  j_[e.tone ?? `info`],
                )}
              >
                <span className={`mt-0.5 shrink-0`}>
                  {A_[e.tone ?? `info`]}
                </span>
                <div className={`min-w-0 flex-1`}>
                  <div className={`text-sm font-semibold text-ink`}>
                    {e.title}
                  </div>
                  {e.description && (
                    <div className={`mt-0.5 break-words text-xs text-muted`}>
                      {e.description}
                    </div>
                  )}
                </div>
                <button
                  type={`button`}
                  onClick={() => dismiss(e.id)}
                  className={`rounded-md p-1 text-muted hover:bg-line hover:text-ink`}
                  aria-label={`Dismiss`}
                >
                  <B1 className={`size-3.5`} />
                </button>
              </Au.div>
            ))}
          </RcComponent>
        </div>,
        document.body,
      )}
    </K_Context.Provider>
  );
}
function useN() {
  let e = E.useContext(K_Context);
  if (!e) {
    throw Error(`useToast() needs <ToastProvider> above it (main.tsx)`);
  }
  return e;
}
function PComponent({ onToken }) {
  let [open, setOpen] = E.useState(() => !d());
  let [r, setR] = E.useState(() => {
    if (d()) {
      return `rejected`;
    }
    return `missing`;
  });
  let [a, setA] = E.useState(``);
  let [loading, setLoading] = E.useState(false);
  let [f, setF] = E.useState(null);
  let h = useN();
  E.useEffect(
    () =>
      p((e) => {
        setR(e === `rejected` ? `rejected` : `missing`);
        setOpen(true);
      }),
    [],
  );
  return (
    <EComponent
      open={open}
      onClose={() => setOpen(false)}
      dismissable={false}
      size={`sm`}
      title={`Game-master token`}
      description={
        r === `rejected`
          ? `The stored token was rejected — enter the current one.`
          : `Enter the admin token once; this browser keeps it.`
      }
    >
      <form
        onSubmit={async (t) => {
          t.preventDefault();
          let r = a.trim();
          if (!r) {
            return;
          }
          setLoading(true);
          setF(null);
          let i = await s.verifyToken(r);
          setLoading(false);
          if (!i) {
            setF(
              `The server rejected this token. It is BAZAAR_ADMIN_TOKEN in .env (printed when the server starts).`,
            );
            return;
          }
          m(r);
          setA(``);
          setOpen(false);
          h.success(
            `Control room unlocked`,
            `The token is kept in this browser.`,
          );
          onToken();
        }}
        className={`flex flex-col gap-3 pb-2`}
      >
        <label
          className={`eyebrow`}
          htmlFor={`admin-token`}
        >{`Admin token`}</label>
        <div
          className={`flex items-center gap-2 rounded-xl border border-line-strong bg-base px-3 focus-within:border-gold/70`}
        >
          <M className={`size-4 text-muted`} aria-hidden />
          <input
            id={`admin-token`}
            data-autofocus
            type={`password`}
            autoComplete={`current-password`}
            value={a}
            onChange={(e) => setA(e.target.value)}
            placeholder={`adm_…`}
            className={`h-11 w-full bg-transparent font-mono text-sm text-ink outline-none placeholder:text-faint`}
          />
        </div>
        {f && <p className={`text-xs text-accent`}>{f}</p>}
        <O1
          type={`submit`}
          variant={`primary`}
          loading={loading}
          disabled={!a.trim()}
        >{`Open the control room`}</O1>
      </form>
    </EComponent>
  );
}
const F_ = [
  {
    to: `/`,
    label: `Leaderboard`,
    icon: Lg,
    end: true,
  },
  {
    to: `/cards`,
    label: `Cards`,
    icon: rg,
    end: false,
  },
  {
    to: `/personas`,
    label: `Dealers`,
    icon: Vg,
    end: false,
  },
];
function IComponent({ className }) {
  return (
    <svg viewBox={`0 0 32 32`} className={className} aria-hidden>
      <g transform={`rotate(-8 16 16)`}>
        <rect
          x={`7.5`}
          y={`3.5`}
          width={`17`}
          height={`25`}
          rx={`3`}
          fill={`#18223B`}
          stroke={`#FFC44D`}
          strokeWidth={`2`}
        />
        <rect
          x={`10`}
          y={`6`}
          width={`12`}
          height={`3.5`}
          rx={`1`}
          fill={`#FF5A5F`}
        />
        <rect
          x={`10`}
          y={`11`}
          width={`12`}
          height={`10`}
          rx={`1.5`}
          fill={`#22304D`}
        />
        <circle cx={`16`} cy={`16`} r={`3.2`} fill={`#FFC44D`} />
        <rect
          x={`10`}
          y={`23`}
          width={`7`}
          height={`2`}
          rx={`1`}
          fill={`#8C97B2`}
        />
      </g>
    </svg>
  );
}
function LComponent({ className, logoClass = `h-5` }) {
  return (
    <a
      href={`https://causaprima.com`}
      target={`_blank`}
      rel={`noreferrer`}
      className={r_2(
        `flex shrink-0 flex-col justify-center gap-1.5 opacity-90 transition-opacity hover:opacity-100`,
        className,
      )}
      title={`The Bazaar is a Causa Prima hackathon game`}
    >
      <span
        className={`eyebrow leading-none whitespace-nowrap`}
      >{`Hosted by`}</span>
      <img
        src={`/causa-prima.svg`}
        alt={`Causa Prima`}
        className={r_2(`w-auto`, logoClass)}
      />
    </a>
  );
}
function RComponent() {
  let [e] = Kh();
  let t = e.has(`tv`);
  return (
    <div className={`bg-market min-h-screen`}>
      {!t && (
        <header
          className={`sticky top-0 z-40 border-b border-line/70 bg-base/80 backdrop-blur-md`}
        >
          <div
            className={`mx-auto flex h-16 max-w-[1600px] items-center gap-6 px-4 sm:px-6`}
          >
            <Vh
              to={`/`}
              className={`flex shrink-0 items-center gap-2.5 whitespace-nowrap`}
            >
              <IComponent className={`size-8`} />
              <span className={`hidden leading-none sm:block`}>
                <span
                  className={`block font-display text-xl font-extrabold tracking-wide text-ink`}
                >{`THE BAZAAR`}</span>
                <span
                  className={`block text-[10px] font-bold tracking-[0.22em] text-gold/90 uppercase`}
                >{`Cromos de Madrid`}</span>
              </span>
            </Vh>
            <nav className={`flex items-center gap-1`}>
              {F_.map(({ to, label, icon, end }) => (
                <Vh
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    r_2(
                      `inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors`,
                      isActive
                        ? `bg-raised text-ink`
                        : `text-muted hover:text-ink`,
                    )
                  }
                >
                  <icon className={`size-4`} />
                  <span className={`hidden md:inline`}>{label}</span>
                </Vh>
              ))}
            </nav>
            <div className={`ml-auto flex items-center gap-3`}>
              <LComponent
                className={`mr-2 hidden border-r border-line/70 pr-5 lg:flex`}
                logoClass={`h-[18px]`}
              />
              <C_ />
              <Vh
                to={`/admin`}
                className={`rounded-lg p-2 text-faint hover:bg-raised hover:text-ink`}
                title={`Game-master console`}
              >
                <Kg1 className={`size-4`} />
              </Vh>
            </div>
          </div>
        </header>
      )}
      <main
        className={r_2(
          `mx-auto max-w-[1600px]`,
          t ? `p-6` : `px-4 py-8 sm:px-6`,
        )}
      >
        <E.Suspense fallback=<Z1Component />>
          <Zm />
        </E.Suspense>
      </main>
    </div>
  );
}
function Z1Component() {
  return (
    <div className={`flex flex-col gap-4`} aria-busy>
      <L1 className={`h-10 w-72`} />
      <L1 className={`h-4 w-96`} />
      <div className={`mt-4 grid grid-cols-2 gap-4 md:grid-cols-4`}>
        {Array.from(
          {
            length: 4,
          },
          (e, t) => (
            <L1 key={t} className={`h-24 rounded-2xl`} />
          ),
        )}
      </div>
      <L1 className={`h-72 rounded-2xl`} />
    </div>
  );
}
const B_ = [
  {
    to: `/admin`,
    label: `Control room`,
    icon: dg,
    end: true,
  },
  {
    to: `/admin/personas`,
    label: `Personas`,
    icon: Vg,
  },
  {
    to: `/admin/teams`,
    label: `Teams`,
    icon: zg,
  },
  {
    to: `/admin/insights`,
    label: `Insights`,
    icon: ag,
  },
  {
    to: `/admin/venues`,
    label: `Venues`,
    icon: Ng,
  },
  {
    to: `/admin/duels`,
    label: `Duels`,
    icon: Fg,
  },
  {
    to: `/admin/bench`,
    label: `The Market Test`,
    icon: Dg,
  },
  {
    to: `/admin/threads`,
    label: `Threads`,
    icon: yg,
  },
  {
    to: `/admin/cards`,
    label: `Cards`,
    icon: hg,
  },
  {
    to: `/admin/events`,
    label: `Events`,
    icon: tg,
  },
];
const V_ = [
  {
    to: `/`,
    label: `Big screen`,
    icon: xg,
  },
  {
    to: `/styleguide`,
    label: `Styleguide`,
    icon,
  },
];
function H_() {
  let [e, setE] = E.useState(0);
  let n = n_2(() => {}, {
    scope: `admin`,
  });
  let r = !!d();
  return (
    <div className={`bg-market flex min-h-screen`}>
      <aside
        className={`sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line bg-base/85 backdrop-blur md:flex`}
      >
        <Vh
          to={`/admin`}
          className={`flex items-center gap-2.5 px-5 pb-4 pt-5`}
        >
          <IComponent className={`size-8`} />
          <span className={`leading-none`}>
            <span
              className={`block font-display text-lg font-extrabold tracking-wide text-ink`}
            >{`THE BAZAAR`}</span>
            <span
              className={`block text-[10px] font-bold tracking-[0.2em] text-accent uppercase`}
            >{`Game master`}</span>
          </span>
        </Vh>
        <nav className={`flex flex-1 flex-col gap-0.5 px-3 py-2`}>
          {B_.map((e) => (
            <UComponent key={e.to} {...e} />
          ))}
          <div
            className={`eyebrow mt-5 mb-1 px-3 text-faint`}
          >{`Elsewhere`}</div>
          {V_.map((e) => (
            <UComponent key={e.to} {...e} />
          ))}
        </nav>
        <div className={`border-t border-line px-4 py-3 text-xs text-muted`}>
          <div className={`flex items-center gap-2`}>
            <U1Component
              tone={n.status === `open` ? `accent` : `muted`}
              pulse={n.status === `open`}
            />
            <span>
              {n.status === `open`
                ? `Admin stream live`
                : n.status === `unauthorised`
                  ? `Token rejected`
                  : `Connecting…`}
            </span>
          </div>
          {r && (
            <button
              type={`button`}
              onClick={() => {
                l();
                window.location.reload();
              }}
              className={`mt-2 inline-flex items-center gap-1.5 text-faint hover:text-ink`}
            >
              <_g className={`size-3.5`} />
              {` Forget token`}
            </button>
          )}
        </div>
      </aside>
      <div className={`flex min-w-0 flex-1 flex-col`}>
        <div
          className={`sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line/70 bg-base/75 px-4 backdrop-blur-md sm:px-6`}
        >
          <nav className={`flex gap-1 overflow-x-auto md:hidden`}>
            {B_.map(({ to, icon, end, label }) => (
              <Vh
                key={to}
                to={to}
                end={end}
                title={label}
                className={({ isActive }) =>
                  r_2(
                    `rounded-lg p-2`,
                    isActive ? `bg-raised text-ink` : `text-muted`,
                  )
                }
              >
                <icon className={`size-4`} />
              </Vh>
            ))}
          </nav>
          <div className={`ml-auto`}>
            <C_ />
          </div>
        </div>
        <main className={`min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8`}>
          <E.Suspense fallback=<Z1Component />>
            <div key={e}>
              <Zm />
            </div>
          </E.Suspense>
        </main>
      </div>
      <PComponent onToken={() => setE((e) => e + 1)} />
    </div>
  );
}
function UComponent({ to, label, icon, end }) {
  return (
    <Vh
      to={to}
      end={end}
      className={({ isActive }) =>
        r_2(
          `group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-colors`,
          isActive
            ? `bg-raised text-ink`
            : `text-muted hover:bg-raised/50 hover:text-ink`,
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span
              className={`absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-gold`}
              aria-hidden
            />
          )}
          {Y.jsx(icon, {
            className: r_2(
              `size-4`,
              isActive ? `text-gold` : `text-faint group-hover:text-muted`,
            ),
          })}
          {label}
        </>
      )}
    </Vh>
  );
}
const W_ = E.lazy(() =>
  Pu(
    () => import(`./BigScreen-CIAu_gkJ.js`),
    __vite__mapDeps([
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
      21, 22, 23, 24, 25, 26, 27, 28, 29, 30,
    ]),
  ),
);
const G_ = E.lazy(() =>
  Pu(
    () => import(`./Catalogue-B7zHP7rb.js`),
    __vite__mapDeps([
      31, 1, 2, 3, 4, 5, 17, 19, 11, 24, 26, 12, 14, 32, 33, 34, 35, 22, 23,
    ]),
  ),
);
const K_ = E.lazy(() =>
  Pu(
    () => import(`./PersonaGallery-DvtlR2Yh.js`),
    __vite__mapDeps([
      36, 1, 2, 3, 4, 5, 37, 17, 10, 19, 20, 6, 7, 8, 9, 11, 12, 13, 14, 16, 21,
      22, 23, 24, 29, 34, 35, 30, 25,
    ]),
  ),
);
const Q1 = E.lazy(() =>
  Pu(
    () => import(`./ControlRoom-BPiPQhN5.js`),
    __vite__mapDeps([
      38, 1, 3, 39, 7, 6, 8, 9, 4, 10, 11, 12, 13, 14, 40, 41, 42, 15, 17, 43,
      21, 24, 44, 25, 32, 33, 35, 45, 46, 47, 48, 49, 50, 28,
    ]),
  ),
);
const J_ = E.lazy(() =>
  Pu(
    () => import(`./PersonaList-D1blR-q3.js`),
    __vite__mapDeps([
      51, 1, 3, 52, 39, 8, 16, 9, 17, 4, 53, 54, 24, 25, 29, 35, 30, 19, 48, 49,
      50, 28, 13, 55, 56,
    ]),
  ),
);
const Y_ = E.lazy(() =>
  Pu(
    () => import(`./PersonaEditor-CY0YsfDU.js`),
    __vite__mapDeps([
      57, 1, 3, 58, 39, 59, 40, 60, 8, 41, 16, 9, 17, 4, 53, 10, 61, 11, 54, 24,
      44, 28, 12, 14, 29, 30, 19, 25, 46, 47, 48, 62, 49, 50, 13, 55, 56, 63,
      64, 52,
    ]),
  ),
);
const X_ = E.lazy(() =>
  Pu(
    () => import(`./Teams-TPp3tDwD.js`),
    __vite__mapDeps([
      65, 1, 2, 3, 4, 5, 58, 6, 60, 16, 17, 54, 24, 25, 27, 12, 13, 32, 33, 29,
      34, 35, 45, 30, 19, 49, 50, 28, 55, 64, 52, 11,
    ]),
  ),
);
const Z_ = E.lazy(() =>
  Pu(
    () => import(`./Insights-CZNFWMow.js`),
    __vite__mapDeps([66, 1, 3, 58, 9, 17, 4, 24, 33, 32, 29, 35, 45, 47]),
  ),
);
const Q_ = E.lazy(() =>
  Pu(
    () => import(`./Venues-By_ioigg.js`),
    __vite__mapDeps([
      67, 1, 3, 7, 6, 8, 9, 4, 10, 11, 12, 13, 14, 40, 17, 18, 61, 24, 68, 32,
      33, 35, 46, 49, 50, 28, 64, 52,
    ]),
  ),
);
const $_ = E.lazy(() =>
  Pu(
    () => import(`./Duels--ctbgHOp.js`),
    __vite__mapDeps([
      69, 1, 3, 9, 17, 4, 24, 12, 32, 33, 35, 45, 47, 48, 49, 50, 28, 13, 55,
    ]),
  ),
);
const Ev = E.lazy(() =>
  Pu(
    () => import(`./Bench-CQD-tuQh.js`),
    __vite__mapDeps([
      70, 1, 3, 17, 4, 43, 24, 68, 32, 33, 35, 45, 46, 47, 49, 50, 28, 13, 55,
    ]),
  ),
);
const Tv = E.lazy(() =>
  Pu(
    () => import(`./Threads-Bm_ipLV8.js`),
    __vite__mapDeps([
      71, 1, 3, 41, 42, 17, 4, 24, 72, 12, 33, 35, 45, 30, 19, 25, 48, 50, 28,
      13, 55, 63, 39, 8, 16, 53, 64, 52, 11,
    ]),
  ),
);
const Nv = E.lazy(() =>
  Pu(
    () => import(`./CardsAdmin-BXwbvoPk.js`),
    __vite__mapDeps([
      73, 1, 2, 3, 4, 5, 52, 41, 17, 24, 72, 12, 14, 35, 45, 47, 50, 28, 13,
    ]),
  ),
);
const Rv = E.lazy(() =>
  Pu(
    () => import(`./Events-BtvMjJi8.js`),
    __vite__mapDeps([
      74, 1, 3, 7, 6, 8, 9, 4, 10, 11, 12, 13, 14, 59, 37, 17, 21, 24, 72, 35,
      45, 48, 50, 28,
    ]),
  ),
);
const Iv = E.lazy(() =>
  Pu(
    () => import(`./Styleguide-0WmY8aCf.js`),
    __vite__mapDeps([
      75, 1, 2, 3, 4, 5, 7, 6, 8, 9, 10, 11, 12, 13, 14, 40, 17, 43, 24, 33, 32,
      29, 34, 35, 45, 30, 19, 25, 46, 47, 48, 62,
    ]),
  ),
);
const Av = E.lazy(() =>
  Pu(() => import(`./NotFound-avGWl0I-.js`), __vite__mapDeps([76, 1, 3, 17])),
);
const router = Lh([
  {
    element: <RComponent />,
    children: [
      {
        index: true,
        element: <W_ />,
      },
      {
        path: `cards`,
        element: <G_ />,
      },
      {
        path: `cards/:setId`,
        element: <G_ />,
      },
      {
        path: `personas`,
        element: <K_ />,
      },
      {
        path: `personas/:id`,
        element: <K_ />,
      },
      {
        path: `styleguide`,
        element: <Iv />,
      },
      {
        path: `*`,
        element: <Av />,
      },
    ],
  },
  {
    path: `admin`,
    element: <H_ />,
    children: [
      {
        index: true,
        element: <Q1 />,
      },
      {
        path: `personas`,
        element: <J_ />,
      },
      {
        path: `personas/:id`,
        element: <Y_ />,
      },
      {
        path: `teams`,
        element: <X_ />,
      },
      {
        path: `teams/:id`,
        element: <X_ />,
      },
      {
        path: `insights`,
        element: <Z_ />,
      },
      {
        path: `insights/:id`,
        element: <Z_ />,
      },
      {
        path: `venues`,
        element: <Q_ />,
      },
      {
        path: `venues/:id`,
        element: <Q_ />,
      },
      {
        path: `duels`,
        element: <$_ />,
      },
      {
        path: `bench`,
        element: <Ev />,
      },
      {
        path: `threads`,
        element: <Tv />,
      },
      {
        path: `threads/:id`,
        element: <Tv />,
      },
      {
        path: `cards`,
        element: <Nv />,
      },
      {
        path: `cards/:id`,
        element: <Nv />,
      },
      {
        path: `events`,
        element: <Rv />,
      },
      {
        path: `*`,
        element: <Av />,
      },
    ],
  },
]);
function SvComponent() {
  return <HComponent router={router} />;
}
ku.createRoot(document.getElementById(`root`)).render(
  <E.StrictMode>
    <WcComponent reducedMotion={`user`}>
      <MComponent>
        <SvComponent />
      </MComponent>
    </WcComponent>
  </E.StrictMode>,
);
export {
  bo as $,
  Ng as A,
  rg as B,
  Jg as C,
  zg as D,
  Vg as E,
  yg as F,
  usePm as G,
  Bh as H,
  hg as I,
  Pu as J,
  useM as K,
  dg as L,
  Dg as M,
  Tg as N,
  Lg as O,
  xg as P,
  So as Q,
  Sg1 as R,
  i_ as S,
  a_ as T,
  Vh as U,
  tg as V,
  Fm as W,
  RcComponent as X,
  Au as Y,
  DcContext as Z,
  o_ as _,
  EComponent as a,
  An as at,
  Xg as b,
  refresh as c,
  vn as ct,
  U1Component as d,
  schedule as dt,
  yo as et,
  t_ as f,
  k as ft,
  $g as g,
  e_ as h,
  DComponent as i,
  Pn as it,
  Jg1 as j,
  Fg as k,
  useB as l,
  F as lt,
  n_ as m,
  LComponent as n,
  ii as nt,
  C_ as o,
  En as ot,
  Zg as p,
  useO as pt,
  Kh as q,
  useN as r,
  oi as rt,
  SComponent as s,
  Cn as st,
  IComponent as t,
  Di as tt,
  CComponent as u,
  cancel as ut,
  Yg as v,
  Qg as w,
  r_ as x,
  qg as y,
  ag as z,
};
