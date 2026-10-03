const hasOwnProperty = Object.prototype.hasOwnProperty;
export const r = (e, t) => () => {
  if (!t) {
    e(
      (t = {
        exports: {},
      }).exports,
      t,
    );
    e = null;
  }
  return t.exports;
};
const s = (e, i, o, s) => {
  if ((i && typeof i == `object`) || typeof i == `function`) {
    var c = Object.getOwnPropertyNames(i);
    var d;
    for (var l = 0, u = c.length; l < u; l++) {
      d = c[l];
      if (!hasOwnProperty.call(e, d) && d !== o) {
        Object.defineProperty(e, d, {
          get: ((e) => i[e]).bind(null, d),
          enumerable:
            !(s = Object.getOwnPropertyDescriptor(i, d)) || s.enumerable,
        });
      }
    }
  }
  return e;
};
export const i = (n, r, o) => {
  o = n == null ? {} : Object.create(Object.getPrototypeOf(n));
  return s(
    r || !n || !n.__esModule || !hasOwnProperty.call(n, `default`)
      ? Object.defineProperty(o, `default`, {
          value: n,
          enumerable: true,
        })
      : o,
    n,
  );
};
const l = r((e) => {
  var t = Symbol.for(`react.element`);
  var n = Symbol.for(`react.portal`);
  var r = Symbol.for(`react.fragment`);
  var i = Symbol.for(`react.strict_mode`);
  var a = Symbol.for(`react.profiler`);
  var o = Symbol.for(`react.provider`);
  var s = Symbol.for(`react.context`);
  var c = Symbol.for(`react.forward_ref`);
  var l = Symbol.for(`react.suspense`);
  var u = Symbol.for(`react.memo`);
  var d = Symbol.for(`react.lazy`);
  var Symbol_iterator = Symbol.iterator;
  function p(e) {
    if (typeof e != `object` || !e) {
      return null;
    }
    return (
      (e = (Symbol_iterator && e[Symbol_iterator]) || e[`@@iterator`]),
      typeof e == `function` ? e : null
    );
  }
  var m = {
    isMounted() {
      return false;
    },
    enqueueForceUpdate() {},
    enqueueReplaceState() {},
    enqueueSetState() {},
  };
  var Object_assign = Object.assign;
  var g = {};
  class _ {
    constructor(e, t, n) {
      this.props = e;
      this.context = t;
      this.refs = g;
      this.updater = n || m;
    }
    setState(e, t) {
      if (typeof e != `object` && typeof e != `function` && e != null) {
        throw Error(
          `setState(...): takes an object of state variables to update or a function which returns an object of state variables.`,
        );
      }
      this.updater.enqueueSetState(this, e, t, `setState`);
    }
    forceUpdate(e) {
      this.updater.enqueueForceUpdate(this, e, `forceUpdate`);
    }
  }
  _.prototype.isReactComponent = {};
  function v() {}
  v.prototype = _.prototype;
  function y(e, t, n) {
    this.props = e;
    this.context = t;
    this.refs = g;
    this.updater = n || m;
  }
  var b = (y.prototype = new v());
  b.constructor = y;
  Object_assign(b, _.prototype);
  b.isPureReactComponent = true;
  var Array_isArray = Array.isArray;
  var hasOwnProperty = Object.prototype.hasOwnProperty;
  var ReactCurrentOwner = {
    current: null,
  };
  var w = {
    key: true,
    ref: true,
    __self: true,
    __source: true,
  };
  function T(e, n, r) {
    let i;
    const a = {};
    let o = null;
    let s = null;
    if (n != null) {
      if (n.ref !== undefined) {
        s = n.ref;
      }
      if (n.key !== undefined) {
        o = `` + n.key;
      }
      for (i in n) {
        if (hasOwnProperty.call(n, i) && !w.hasOwnProperty(i)) {
          a[i] = n[i];
        }
      }
    }
    let c = arguments.length - 2;
    if (c === 1) {
      a.children = r;
    } else if (c > 1) {
      const l = Array(c);
      for (let u = 0; u < c; u++) {
        l[u] = arguments[u + 2];
      }
      a.children = l;
    }
    if (e && e.defaultProps) {
      c = e.defaultProps;
      for (i in c) {
        if (a[i] === undefined) {
          a[i] = c[i];
        }
      }
    }
    return {
      $$typeof: t,
      type: e,
      key: o,
      ref: s,
      props: a,
      _owner: ReactCurrentOwner.current,
    };
  }
  function E(e, key) {
    return {
      $$typeof: t,
      type: e.type,
      key,
      ref: e.ref,
      props: e.props,
      _owner: e._owner,
    };
  }
  function D(e) {
    return typeof e == `object` && !!e && e.$$typeof === t;
  }
  function O(e) {
    const t = {
      "=": `=0`,
      ":": `=2`,
    };
    return `$` + e.replace(/[=:]/g, (e) => t[e]);
  }
  var k = /\/+/g;
  function A(e, t) {
    if (typeof e == `object` && e && e.key != null) {
      return O(`` + e.key);
    }
    return t.toString(36);
  }
  function j(e, r, i, a, o) {
    let s = typeof e;
    if (s === `undefined` || s === `boolean`) {
      e = null;
    }
    let c = false;
    if (e === null) {
      c = true;
    } else {
      switch (s) {
        case `string`:
        case `number`:
          c = true;
          break;
        case `object`:
          switch (e.$$typeof) {
            case t:
            case n:
              c = true;
          }
      }
    }
    if (c) {
      c = e;
      o = o(c);
      e = a === `` ? `.` + A(c, 0) : a;
      if (Array_isArray(o)) {
        i = ``;
        if (e != null) {
          i = e.replace(k, `$&/`) + `/`;
        }
        j(o, r, i, ``, (e) => e);
      } else if (o != null) {
        if (D(o)) {
          o = E(
            o,
            i +
              (!o.key || (c && c.key === o.key)
                ? ``
                : (`` + o.key).replace(k, `$&/`) + `/`) +
              e,
          );
        }
        r.push(o);
      }
      return 1;
    }
    c = 0;
    a = a === `` ? `.` : a + `:`;
    if (Array_isArray(e)) {
      for (var l = 0; l < e.length; l++) {
        s = e[l];
        var u = a + A(s, l);
        c += j(s, r, i, u, o);
      }
    } else {
      u = p(e);
      if (typeof u == `function`) {
        e = u.call(e);
        for (l = 0; !(s = e.next()).done;) {
          s = s.value;
          u = a + A(s, l++);
          c += j(s, r, i, u, o);
        }
      } else if (s === `object`) {
        r = String(e);
        throw Error(
          `Objects are not valid as a React child (found: ` +
            (r === `[object Object]`
              ? `object with keys {` + Object.keys(e).join(`, `) + `}`
              : r) +
            `). If you meant to render a collection of children, use an array instead.`,
        );
      }
    }
    return c;
  }
  function map(e, t, n) {
    if (e == null) {
      return e;
    }
    const r = [];
    let i = 0;
    j(e, r, ``, ``, (e) => t.call(n, e, i++));
    return r;
  }
  function _init(e) {
    if (e._status === -1) {
      let t = e._result;
      t = t();
      t.then(
        (t) => {
          if (e._status === 0 || e._status === -1) {
            e._status = 1;
            e._result = t;
          }
        },
        (t) => {
          if (e._status === 0 || e._status === -1) {
            e._status = 2;
            e._result = t;
          }
        },
      );
      if (e._status === -1) {
        e._status = 0;
        e._result = t;
      }
    }
    if (e._status === 1) {
      return e._result.default;
    }
    throw e._result;
  }
  var ReactCurrentDispatcher = {
    current: null,
  };
  var ReactCurrentBatchConfig = {
    transition: null,
  };
  var I = {
    ReactCurrentDispatcher,
    ReactCurrentBatchConfig,
    ReactCurrentOwner,
  };
  function L() {
    throw Error(`act(...) is not supported in production builds of React.`);
  }
  e.Children = {
    map,
    forEach(e, t, n) {
      map(
        e,
        function () {
          t.apply(this, arguments);
        },
        n,
      );
    },
    count(e) {
      let t = 0;
      map(e, () => {
        t++;
      });
      return t;
    },
    toArray(e) {
      return map(e, (e) => e) || [];
    },
    only(e) {
      if (!D(e)) {
        throw Error(
          `React.Children.only expected to receive a single React element child.`,
        );
      }
      return e;
    },
  };
  e.Component = _;
  e.Fragment = r;
  e.Profiler = a;
  e.PureComponent = y;
  e.StrictMode = i;
  e.Suspense = l;
  e.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = I;
  e.act = L;
  e.cloneElement = function (e, n, r) {
    if (e == null) {
      throw Error(
        `React.cloneElement(...): The argument must be a React element, but you passed ` +
          e +
          `.`,
      );
    }
    const i = Object_assign({}, e.props);
    let e_key = e.key;
    let e_ref = e.ref;
    let e__owner = e._owner;
    if (n != null) {
      if (n.ref !== undefined) {
        e_ref = n.ref;
        e__owner = ReactCurrentOwner.current;
      }
      if (n.key !== undefined) {
        e_key = `` + n.key;
      }
      if (e.type && e.type.defaultProps) var c = e.type.defaultProps;
      for (l in n) {
        if (hasOwnProperty.call(n, l) && !w.hasOwnProperty(l)) {
          i[l] = n[l] === undefined && c !== undefined ? c[l] : n[l];
        }
      }
    }
    var l = arguments.length - 2;
    if (l === 1) {
      i.children = r;
    } else if (l > 1) {
      c = Array(l);
      for (let u = 0; u < l; u++) {
        c[u] = arguments[u + 2];
      }
      i.children = c;
    }
    return {
      $$typeof: t,
      type: e.type,
      key: e_key,
      ref: e_ref,
      props: i,
      _owner: e__owner,
    };
  };
  e.createContext = (e) => {
    e = {
      $$typeof: s,
      _currentValue: e,
      _currentValue2: e,
      _threadCount: 0,
      Provider: null,
      Consumer: null,
      _defaultValue: null,
      _globalName: null,
    };
    e.Provider = {
      $$typeof: o,
      _context: e,
    };
    return (e.Consumer = e);
  };
  e.createElement = T;
  e.createFactory = (e) => {
    const t = T.bind(null, e);
    t.type = e;
    return t;
  };
  e.createRef = () => ({
    current: null,
  });
  e.forwardRef = (render) => ({
    $$typeof: c,
    render,
  });
  e.isValidElement = D;
  e.lazy = (_result) => ({
    $$typeof: d,
    _payload: {
      _status: -1,
      _result,
    },
    _init,
  });
  e.memo = (type, t) => ({
    $$typeof: u,
    type,
    compare: t === undefined ? null : t,
  });
  e.startTransition = (e) => {
    const F_transition = ReactCurrentBatchConfig.transition;
    ReactCurrentBatchConfig.transition = {};
    try {
      e();
    } finally {
      ReactCurrentBatchConfig.transition = F_transition;
    }
  };
  e.unstable_act = L;
  e.useCallback = (e, t) => ReactCurrentDispatcher.current.useCallback(e, t);
  e.useContext = (e) => ReactCurrentDispatcher.current.useContext(e);
  e.useDebugValue = () => {};
  e.useDeferredValue = (e) =>
    ReactCurrentDispatcher.current.useDeferredValue(e);
  e.useEffect = (e, t) => ReactCurrentDispatcher.current.useEffect(e, t);
  e.useId = () => ReactCurrentDispatcher.current.useId();
  e.useImperativeHandle = (e, t, n) =>
    ReactCurrentDispatcher.current.useImperativeHandle(e, t, n);
  e.useInsertionEffect = (e, t) =>
    ReactCurrentDispatcher.current.useInsertionEffect(e, t);
  e.useLayoutEffect = (e, t) =>
    ReactCurrentDispatcher.current.useLayoutEffect(e, t);
  e.useMemo = (e, t) => ReactCurrentDispatcher.current.useMemo(e, t);
  e.useReducer = (e, t, n) =>
    ReactCurrentDispatcher.current.useReducer(e, t, n);
  e.useRef = (e) => ReactCurrentDispatcher.current.useRef(e);
  e.useState = (e) => ReactCurrentDispatcher.current.useState(e);
  e.useSyncExternalStore = (e, t, n) =>
    ReactCurrentDispatcher.current.useSyncExternalStore(e, t, n);
  e.useTransition = () => ReactCurrentDispatcher.current.useTransition();
  e.version = `18.3.1`;
});
const u = r((e, t) => {
  t.exports = l();
});
const d = r((e) => {
  var t = u();
  var n = Symbol.for(`react.element`);
  var r = Symbol.for(`react.fragment`);
  var hasOwnProperty = Object.prototype.hasOwnProperty;
  var ReactCurrentOwner =
    t.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner;
  var o = {
    key: true,
    ref: true,
    __self: true,
    __source: true,
  };
  function s(e, t, r) {
    let s;
    const c = {};
    let l = null;
    let u = null;
    if (r !== undefined) {
      l = `` + r;
    }
    if (t.key !== undefined) {
      l = `` + t.key;
    }
    if (t.ref !== undefined) {
      u = t.ref;
    }
    for (s in t) {
      if (hasOwnProperty.call(t, s) && !o.hasOwnProperty(s)) {
        c[s] = t[s];
      }
    }
    if (e && e.defaultProps) {
      t = e.defaultProps;
      for (s in t) {
        if (c[s] === undefined) {
          c[s] = t[s];
        }
      }
    }
    return {
      $$typeof: n,
      type: e,
      key: l,
      ref: u,
      props: c,
      _owner: ReactCurrentOwner.current,
    };
  }
  e.Fragment = r;
  e.jsx = s;
  e.jsxs = s;
});
export const t = r((e, t) => {
  t.exports = d();
});
export { u as n };
