import { i, n, t } from "./jsx-runtime.js";
const r = i(n());
function a(e, t) {
  if (e == null) {
    return {};
  }
  const n = {};
  for (const r in e) {
    if ({}.hasOwnProperty.call(e, r)) {
      if (t.indexOf(r) !== -1) {
        continue;
      }
      n[r] = e[r];
    }
  }
  return n;
}
const o = [];
const s = [];
(() => {
  let e =
    `lc,34,7n,7,7b,19,,,,2,,2,,,20,b,1c,l,g,,2t,7,2,6,2,2,,4,z,,u,r,2j,b,1m,9,9,,o,4,,9,,3,,5,17,3,1n,9,16,o,,x,1i,3,,i,,7,a,2,t,3,1k,,,7,2,2,2,3,9,,a,2,q,,2,3,1k,,,5,4,2,2,3,3,,u,2,3,,b,3,1k,,,8,,3,,3,k,2,m,6,,3,1k,,,7,2,2,2,3,7,3,a,2,u,,1n,5,3,3,,4,9,,14,5,1j,,,7,,3,,4,7,2,b,2,t,3,1k,,,7,,3,,4,7,2,b,2,f,,c,4,1j,2,,7,,3,,4,9,,a,2,t,3,1y,,4,6,,,,8,i,2,1p,,,8,c,8,2q,,,a,b,7,21,2,r,,,,,,4,2,1d,k,,2,5,b,,10,9,,2u,b,,6,n,4,4,3,g,4,d,,,3,6,,f,,jj,3,qa,4,s,3,t,2,u,2,1s,w,9,,19,3,,,39,2,y,,3a,c,4,c,63,5,1l,a,,,,,2,o,2,,1c,1a,2,c,k,5,1b,h,12,9,c,3,u,d,1k,e,1c,k,48,3,,l,4,,6,,2,3,5i,1s,ek,,5f,x,2da,3,3x,,2o,w,fe,6,2x,2,n9w,4,,a,w,2,28,2,7k,,3,,4,,n,5,4,,2b,2,1e,i,q,i,d,,12,8,p,d,18,4,1b,e,10,,1v,e,c,,8,2,1a,,1f,,,3,2,2,5,2,,,15,5,5,2,6k,8,,2,fn4,,kh,g,g,g,a6,2,gt,,6a,,45,5,1ae,3,,2,5,4,14,3,4,,4l,2,fx,4,1t,5,8t,2,25,6,1y,b,1d,4,3e,3,1h,f,15,,2,2,a,4,19,b,7,,1p,3,10,e,g,2,18,,c,3,1c,e,8,4,,2,2k,c,6,,2,,4d,c,l,4,1j,2,,7,2,2,2,3,9,,a,2,2,7,3,5,1v,9,,,2,,,4,,5,,,e,2,2a,i,n,,29,k,6j,7,2,9,r,2,2a,h,2y,d,2t,3,2,a,74,f,6t,6,,2,2,4,,,,2,3x,7,2,7,3,,s,a,14,7,,4,8,,9,b,1a,g,5i,8,5j,8,,8,2a,m,,e,3e,6,3,,,2,,7,,,1u,5,,2,,5,9n,4,9,2,,,1c,7,3,5,n,,44l,,6,f,8ug,i,1xc,5,1n,7,t4,,,1j,7,4,29,,b,2,f57,2,3mp,1a,2,n,f2,5,3,6,8,8,2,7,u,4,44,3,1iz,1j,4,1e,8,,e,,m,5,,f,11s,7,,h,2,7,,2,,5,2s,,4g,7,af,,1p,4,e4,4,72,2,6r,,2,,7,2,5,,d6,7,31,7,240,5`
      .split(`,`)
      .map((e) => {
        if (e) {
          return parseInt(e, 36);
        }
        return 1;
      });
  for (let t = 0, n = 0; t < e.length; t++) {
    (t % 2 ? s : o).push((n += e[t]));
  }
})();
function c(e) {
  if (e < 768) {
    return false;
  }
  for (let t = 0, n = o.length; ;) {
    let r = (t + n) >> 1;
    if (e < o[r]) {
      n = r;
    } else if (e >= s[r]) {
      t = r + 1;
    } else {
      return true;
    }
    if (t == n) {
      return false;
    }
  }
}
function l(e) {
  return e >= 127462 && e <= 127487;
}
const u = 8205;
function d(e, t, n = true, r = true) {
  return (n ? f : p)(e, t, r);
}
function f(e, t, n) {
  if (t == e.length) {
    return t;
  }
  t && h(e.charCodeAt(t)) && g(e.charCodeAt(t - 1)) && t--;
  let r = m(e, t);
  for (t += _(r); t < e.length;) {
    let i = m(e, t);
    if (r == u || i == u || (n && c(i))) {
      t += _(i);
      r = i;
    } else if (l(i)) {
      let n = 0;
      let r = t - 2;
      while (r >= 0 && l(m(e, r))) {
        n++;
        r -= 2;
      }
      if (n % 2 == 0) {
        break;
      }
      t += 2;
    } else {
      break;
    }
  }
  return t;
}
function p(e, t, n) {
  while (t > 1) {
    let r = f(e, t - 2, n);
    if (r < t) {
      return r;
    }
    t--;
  }
  return 0;
}
function m(e, t) {
  let n = e.charCodeAt(t);
  if (!g(n) || t + 1 == e.length) {
    return n;
  }
  let r = e.charCodeAt(t + 1);
  if (h(r)) {
    return ((n - 55296) << 10) + (r - 56320) + 65536;
  }
  return n;
}
function h(e) {
  return e >= 56320 && e < 57344;
}
function g(e) {
  return e >= 55296 && e < 56320;
}
function _(e) {
  if (e < 65536) {
    return 1;
  }
  return 2;
}
const v = class e {
  lineAt(e) {
    if (e < 0 || e > this.length) {
      throw RangeError(
        `Invalid position ${e} in document of length ${this.length}`,
      );
    }
    return this.lineInner(e, false, 1, 0);
  }
  line(e) {
    if (e < 1 || e > this.lines) {
      throw RangeError(
        `Invalid line number ${e} in ${this.lines}-line document`,
      );
    }
    return this.lineInner(e, true, 1, 0);
  }
  replace(e, t, n) {
    [e, t] = ae(this, e, t);
    let r = [];
    this.decompose(0, e, r, 2);
    if (n.length) {
      n.decompose(0, n.length, r, 3);
    }
    this.decompose(t, this.length, r, 1);
    return b.from(r, this.length - (t - e) + n.length);
  }
  append(e) {
    return this.replace(this.length, this.length, e);
  }
  slice(e, t = this.length) {
    [e, t] = ae(this, e, t);
    let n = [];
    this.decompose(e, t, n, 0);
    return b.from(n, t - e);
  }
  eq(e) {
    if (e == this) {
      return true;
    }
    if (e.length != this.length || e.lines != this.lines) {
      return false;
    }
    let t = this.scanIdentical(e, 1);
    let n = this.length - this.scanIdentical(e, -1);
    let r = new te(this);
    let i = new te(e);
    for (let e = t, a = t; ;) {
      r.next(e);
      i.next(e);
      e = 0;
      if (
        r.lineBreak != i.lineBreak ||
        r.done != i.done ||
        r.value != i.value
      ) {
        return false;
      }
      a += r.value.length;
      if (r.done || a >= n) {
        return true;
      }
    }
  }
  iter(e = 1) {
    return new te(this, e);
  }
  iterRange(e, t = this.length) {
    return new ne(this, e, t);
  }
  iterLines(e, t) {
    let n;
    if (e == null) {
      n = this.iter();
    } else {
      t ??= this.lines + 1;
      let r = this.line(e).from;
      n = this.iterRange(
        r,
        Math.max(
          r,
          t == this.lines + 1 ? this.length : t <= 1 ? 0 : this.line(t - 1).to,
        ),
      );
    }
    return new re(n);
  }
  toString() {
    return this.sliceString(0);
  }
  toJSON() {
    let e = [];
    this.flatten(e);
    return e;
  }
  constructor() {}
  static of(t) {
    if (t.length == 0) {
      throw RangeError(`A document must have at least one line`);
    }
    if (t.length == 1 && !t[0]) {
      return e.empty;
    }
    if (t.length <= 32) {
      return new y(t);
    }
    return b.from(y.split(t, []));
  }
};
var y = class e extends v {
  constructor(e, t = x(e)) {
    super();
    this.text = e;
    this.length = t;
  }
  get lines() {
    return this.text.length;
  }
  get children() {
    return null;
  }
  lineInner(e, t, n, r) {
    for (let i = 0; ; i++) {
      let a = this.text[i];
      let o = r + a.length;
      if ((t ? n : o) >= e) {
        return new ie(r, o, n, a);
      }
      r = o + 1;
      n++;
    }
  }
  decompose(t, n, r, i) {
    let a =
      t <= 0 && n >= this.length
        ? this
        : new e(ee(this.text, t, n), Math.min(n, this.length) - Math.max(0, t));
    if (i & 1) {
      let t = r.pop();
      let n = S(a.text, t.text.slice(), 0, a.length);
      if (n.length <= 32) {
        r.push(new e(n, t.length + a.length));
      } else {
        let t = n.length >> 1;
        r.push(new e(n.slice(0, t)), new e(n.slice(t)));
      }
    } else {
      r.push(a);
    }
  }
  replace(t, n, r) {
    if (!(r instanceof e)) {
      return super.replace(t, n, r);
    }
    [t, n] = ae(this, t, n);
    let i = S(this.text, S(r.text, ee(this.text, 0, t)), n);
    let a = this.length + r.length - (n - t);
    if (i.length <= 32) {
      return new e(i, a);
    }
    return b.from(e.split(i, []), a);
  }
  sliceString(
    e,
    t = this.length,
    n = `
`,
  ) {
    [e, t] = ae(this, e, t);
    let r = ``;
    for (let i = 0, a = 0; i <= t && a < this.text.length; a++) {
      let o = this.text[a];
      let s = i + o.length;
      if (i > e && a) {
        r += n;
      }
      if (e < s && t > i) {
        r += o.slice(Math.max(0, e - i), t - i);
      }
      i = s + 1;
    }
    return r;
  }
  flatten(e) {
    for (let t of this.text) {
      e.push(t);
    }
  }
  scanIdentical() {
    return 0;
  }
  static split(t, n) {
    let r = [];
    let i = -1;
    for (let a of t) {
      r.push(a);
      i += a.length + 1;
      if (r.length == 32) {
        n.push(new e(r, i));
        r = [];
        i = -1;
      }
    }
    if (i > -1) {
      n.push(new e(r, i));
    }
    return n;
  }
};
var b = class e extends v {
  constructor(e, t) {
    super();
    this.children = e;
    this.length = t;
    this.lines = 0;
    for (let t of e) {
      this.lines += t.lines;
    }
  }
  lineInner(e, t, n, r) {
    for (let i = 0; ; i++) {
      let a = this.children[i];
      let o = r + a.length;
      let s = n + a.lines - 1;
      if ((t ? s : o) >= e) {
        return a.lineInner(e, t, n, r);
      }
      r = o + 1;
      n = s + 1;
    }
  }
  decompose(e, t, n, r) {
    for (let i = 0, a = 0; a <= t && i < this.children.length; i++) {
      let o = this.children[i];
      let s = a + o.length;
      if (e <= s && t >= a) {
        let i = r & ((a <= e) | (s >= t ? 2 : 0));
        if (a >= e && s <= t && !i) {
          n.push(o);
        } else {
          o.decompose(e - a, t - a, n, i);
        }
      }
      a = s + 1;
    }
  }
  replace(t, n, r) {
    [t, n] = ae(this, t, n);
    if (r.lines < this.lines) {
      for (let i = 0, a = 0; i < this.children.length; i++) {
        let child = this.children[i];
        let s = a + child.length;
        if (t >= a && n <= s) {
          let c = child.replace(t - a, n - a, r);
          let l = this.lines - child.lines + c.lines;
          if (c.lines < l >> 4 && c.lines > l >> 6) {
            let a = this.children.slice();
            a[i] = c;
            return new e(a, this.length - (n - t) + r.length);
          }
          return super.replace(a, s, c);
        }
        a = s + 1;
      }
    }
    return super.replace(t, n, r);
  }
  sliceString(
    e,
    t = this.length,
    n = `
`,
  ) {
    [e, t] = ae(this, e, t);
    let r = ``;
    for (let i = 0, a = 0; i < this.children.length && a <= t; i++) {
      let o = this.children[i];
      let s = a + o.length;
      if (a > e && i) {
        r += n;
      }
      if (e < s && t > a) {
        r += o.sliceString(e - a, t - a, n);
      }
      a = s + 1;
    }
    return r;
  }
  flatten(e) {
    for (let t of this.children) {
      t.flatten(e);
    }
  }
  scanIdentical(t, n) {
    if (!(t instanceof e)) {
      return 0;
    }
    let r = 0;
    let [i, a, o, s] =
      n > 0
        ? [0, 0, this.children.length, t.children.length]
        : [this.children.length - 1, t.children.length - 1, -1, -1];
    for (; ; i += n, a += n) {
      if (i == o || a == s) {
        return r;
      }
      let e = this.children[i];
      let c = t.children[a];
      if (e != c) {
        return r + e.scanIdentical(c, n);
      }
      r += e.length + 1;
    }
  }
  static from(t, n = t.reduce((acc, item) => acc + item.length + 1, -1)) {
    let r = 0;
    for (let e of t) {
      r += e.lines;
    }
    if (r < 32) {
      let e = [];
      for (let n of t) {
        n.flatten(e);
      }
      return new y(e, n);
    }
    let i = Math.max(32, r >> 5);
    let a = i << 1;
    let o = i >> 1;
    let s = [];
    let c = 0;
    let l = -1;
    let u = [];
    function d(t) {
      let n;
      if (t.lines > a && t instanceof e) {
        for (let e of t.children) {
          d(e);
        }
      } else {
        if (t.lines > o && (c > o || !c)) {
          f();
          s.push(t);
        } else if (
          t instanceof y &&
          c &&
          (n = u[u.length - 1]) instanceof y &&
          t.lines + n.lines <= 32
        ) {
          c += t.lines;
          l += t.length + 1;
          u[u.length - 1] = new y(
            n.text.concat(t.text),
            n.length + 1 + t.length,
          );
        } else {
          if (c + t.lines > i) {
            f();
          }
          c += t.lines;
          l += t.length + 1;
          u.push(t);
        }
      }
    }
    function f() {
      if (c != 0) {
        s.push(u.length == 1 ? u[0] : e.from(u, l));
        l = -1;
        c = u.length = 0;
      }
    }
    for (let e of t) {
      d(e);
    }
    f();
    if (s.length == 1) {
      return s[0];
    }
    return new e(s, n);
  }
};
v.empty = new y([``], 0);
function x(e) {
  let t = -1;
  for (let n of e) {
    t += n.length + 1;
  }
  return t;
}
function S(e, t, n = 0, r = 1000000000) {
  for (let i = 0, a = 0, o = true; a < e.length && i <= r; a++) {
    let s = e[a];
    let c = i + s.length;
    c >= n &&
      (c > r && (s = s.slice(0, r - i)),
      i < n && (s = s.slice(n - i)),
      o ? ((t[t.length - 1] += s), (o = false)) : t.push(s));
    i = c + 1;
  }
  return t;
}
function ee(text, t, n) {
  return S(text, [``], t, n);
}
var te = class {
  constructor(e, t = 1) {
    this.dir = t;
    this.done = false;
    this.lineBreak = false;
    this.value = ``;
    this.nodes = [e];
    this.offsets = [
      t > 0 ? 1 : (e instanceof y ? e.text.length : e.children.length) << 1,
    ];
  }
  nextInner(e, t) {
    for (this.done = this.lineBreak = false; ;) {
      let n = this.nodes.length - 1;
      let r = this.nodes[n];
      let i = this.offsets[n];
      let a = i >> 1;
      let o = r instanceof y ? r.text.length : r.children.length;
      if (a == (t > 0 ? o : 0)) {
        if (n == 0) {
          this.done = true;
          this.value = ``;
          return this;
        }
        t > 0 && this.offsets[n - 1]++;
        this.nodes.pop();
        this.offsets.pop();
      } else if ((i & 1) == (t > 0 ? 0 : 1)) {
        this.offsets[n] += t;
        if (e == 0) {
          this.lineBreak = true;
          this.value = `
`;
          return this;
        }
        e--;
      } else if (r instanceof y) {
        let i = r.text[a + (t < 0 ? -1 : 0)];
        this.offsets[n] += t;
        if (i.length > Math.max(0, e)) {
          this.value =
            e == 0 ? i : t > 0 ? i.slice(e) : i.slice(0, i.length - e);
          return this;
        }
        e -= i.length;
      } else {
        let i = r.children[a + (t < 0 ? -1 : 0)];
        if (e > i.length) {
          e -= i.length;
          this.offsets[n] += t;
        } else {
          t < 0 && this.offsets[n]--;
          this.nodes.push(i);
          this.offsets.push(
            t > 0
              ? 1
              : (i instanceof y ? i.text.length : i.children.length) << 1,
          );
        }
      }
    }
  }
  next(e = 0) {
    if (e < 0) {
      this.nextInner(-e, -this.dir);
      e = this.value.length;
    }
    return this.nextInner(e, this.dir);
  }
};
var ne = class {
  constructor(e, t, n) {
    this.value = ``;
    this.done = false;
    this.cursor = new te(e, t > n ? -1 : 1);
    this.pos = t > n ? e.length : 0;
    this.from = Math.min(t, n);
    this.to = Math.max(t, n);
  }
  nextInner(e, t) {
    if (t < 0 ? this.pos <= this.from : this.pos >= this.to) {
      this.value = ``;
      this.done = true;
      return this;
    }
    e += Math.max(0, t < 0 ? this.pos - this.to : this.from - this.pos);
    let n = t < 0 ? this.pos - this.from : this.to - this.pos;
    if (e > n) {
      e = n;
    }
    n -= e;
    let { value } = this.cursor.next(e);
    this.pos += (value.length + e) * t;
    this.value =
      value.length <= n
        ? value
        : t < 0
          ? value.slice(value.length - n)
          : value.slice(0, n);
    this.done = !this.value;
    return this;
  }
  next(e = 0) {
    if (e < 0) {
      e = Math.max(e, this.from - this.pos);
    } else if (e > 0) {
      e = Math.min(e, this.to - this.pos);
    }
    return this.nextInner(e, this.cursor.dir);
  }
  get lineBreak() {
    return this.cursor.lineBreak && this.value != ``;
  }
};
var re = class {
  constructor(e) {
    this.inner = e;
    this.afterBreak = true;
    this.value = ``;
    this.done = false;
  }
  next(e = 0) {
    let { done, lineBreak, value } = this.inner.next(e);
    if (done && this.afterBreak) {
      this.value = ``;
      this.afterBreak = false;
    } else if (done) {
      this.done = true;
      this.value = ``;
    } else if (lineBreak) {
      if (this.afterBreak) {
        this.value = ``;
      } else {
        this.afterBreak = true;
        this.next();
      }
    } else {
      this.value = value;
      this.afterBreak = false;
    }
    return this;
  }
  get lineBreak() {
    return false;
  }
};
if (typeof Symbol < `u`) {
  v.prototype[Symbol.iterator] = function () {
    return this.iter();
  };
  te.prototype[Symbol.iterator] =
    ne.prototype[Symbol.iterator] =
    re.prototype[Symbol.iterator] =
      function () {
        return this;
      };
}
var ie = class {
  constructor(e, t, n, r) {
    this.from = e;
    this.to = t;
    this.number = n;
    this.text = r;
  }
  get length() {
    return this.to - this.from;
  }
};
function ae(e, t, n) {
  t = Math.max(0, Math.min(e.length, t));
  return [t, Math.max(t, Math.min(e.length, n))];
}
function C(e, t, n = true, r = true) {
  return d(e, t, n, r);
}
function oe(e) {
  return e >= 56320 && e < 57344;
}
function se(e) {
  return e >= 55296 && e < 56320;
}
function w(e, t) {
  let n = e.charCodeAt(t);
  if (!se(n) || t + 1 == e.length) {
    return n;
  }
  let r = e.charCodeAt(t + 1);
  if (oe(r)) {
    return ((n - 55296) << 10) + (r - 56320) + 65536;
  }
  return n;
}
function ce(e) {
  if (e <= 65535) {
    return String.fromCharCode(e);
  }
  return (
    (e -= 65536),
    String.fromCharCode((e >> 10) + 55296, (e & 1023) + 56320)
  );
}
function le(e) {
  if (e < 65536) {
    return 1;
  }
  return 2;
}
const ue = /\r\n?|\n/;
var T = ((e) => {
  e[(e.Simple = 0)] = `Simple`;
  e[(e.TrackDel = 1)] = `TrackDel`;
  e[(e.TrackBefore = 2)] = `TrackBefore`;
  e[(e.TrackAfter = 3)] = `TrackAfter`;
  return e;
})((T ||= {}));
var de = class e {
  constructor(e) {
    this.sections = e;
  }
  get length() {
    let e = 0;
    for (let t = 0; t < this.sections.length; t += 2) {
      e += this.sections[t];
    }
    return e;
  }
  get newLength() {
    let e = 0;
    for (let t = 0; t < this.sections.length; t += 2) {
      let n = this.sections[t + 1];
      e += n < 0 ? this.sections[t] : n;
    }
    return e;
  }
  get empty() {
    return (
      this.sections.length == 0 ||
      (this.sections.length == 2 && this.sections[1] < 0)
    );
  }
  iterGaps(e) {
    for (let t = 0, n = 0, r = 0; t < this.sections.length;) {
      let i = this.sections[t++];
      let a = this.sections[t++];
      if (a < 0) {
        e(n, r, i);
        r += i;
      } else {
        r += a;
      }
      n += i;
    }
  }
  iterChangedRanges(e, t = false) {
    O(this, e, t);
  }
  get invertedDesc() {
    let t = [];
    for (let e = 0; e < this.sections.length;) {
      let n = this.sections[e++];
      let r = this.sections[e++];
      if (r < 0) {
        t.push(n, r);
      } else {
        t.push(r, n);
      }
    }
    return new e(t);
  }
  composeDesc(e) {
    if (this.empty) {
      return e;
    }
    if (e.empty) {
      return this;
    }
    return me(this, e);
  }
  mapDesc(e, t = false) {
    if (e.empty) {
      return this;
    }
    return pe(this, e, t);
  }
  mapPos(e, t = -1, n = T.Simple) {
    let r = 0;
    let i = 0;
    for (let a = 0; a < this.sections.length;) {
      let o = this.sections[a++];
      let s = this.sections[a++];
      let c = r + o;
      if (s < 0) {
        if (c > e) {
          return i + (e - r);
        }
        i += o;
      } else {
        if (
          n != T.Simple &&
          c >= e &&
          ((n == T.TrackDel && r < e && c > e) ||
            (n == T.TrackBefore && r < e) ||
            (n == T.TrackAfter && c > e))
        ) {
          return null;
        }
        if (c > e || (c == e && t < 0 && !o)) {
          if (e == r || t < 0) {
            return i;
          }
          return i + s;
        }
        i += s;
      }
      r = c;
    }
    if (e > r) {
      throw RangeError(
        `Position ${e} is out of range for changeset of length ${r}`,
      );
    }
    return i;
  }
  touchesRange(e, t = e) {
    for (let n = 0, r = 0; n < this.sections.length && r <= t;) {
      let i = this.sections[n++];
      let a = this.sections[n++];
      let o = r + i;
      if (a >= 0 && r <= t && o >= e) {
        if (r < e && o > t) {
          return `cover`;
        }
        return true;
      }
      r = o;
    }
    return false;
  }
  toString() {
    let e = ``;
    for (let t = 0; t < this.sections.length;) {
      let n = this.sections[t++];
      let r = this.sections[t++];
      e += (e ? ` ` : ``) + n + (r >= 0 ? `:` + r : ``);
    }
    return e;
  }
  toJSON() {
    return this.sections;
  }
  static fromJSON(t) {
    if (
      !Array.isArray(t) ||
      t.length % 2 ||
      t.some((e) => typeof e != `number`)
    ) {
      throw RangeError(`Invalid JSON representation of ChangeDesc`);
    }
    return new e(t);
  }
  static create(t) {
    return new e(t);
  }
};
var E = class e extends de {
  constructor(e, t) {
    super(e);
    this.inserted = t;
  }
  apply(e) {
    if (this.length != e.length) {
      throw RangeError(
        `Applying change set to a document with the wrong length`,
      );
    }
    O(this, (t, n, r, i, a) => (e = e.replace(r, r + (n - t), a)), false);
    return e;
  }
  mapDesc(e, t = false) {
    return pe(this, e, t, true);
  }
  invert(t) {
    let n = this.sections.slice();
    let r = [];
    for (let e = 0, i = 0; e < n.length; e += 2) {
      let a = n[e];
      let o = n[e + 1];
      if (o >= 0) {
        n[e] = o;
        n[e + 1] = a;
        let s = e >> 1;
        while (r.length < s) {
          r.push(v.empty);
        }
        r.push(a ? t.slice(i, i + a) : v.empty);
      }
      i += a;
    }
    return new e(n, r);
  }
  compose(e) {
    if (this.empty) {
      return e;
    }
    if (e.empty) {
      return this;
    }
    return me(this, e, true);
  }
  map(e, t = false) {
    if (e.empty) {
      return this;
    }
    return pe(this, e, t, true);
  }
  iterChanges(e, t = false) {
    O(this, e, t);
  }
  get desc() {
    return de.create(this.sections);
  }
  filter(t) {
    let n = [];
    let r = [];
    let i = [];
    let a = new he(this);
    done: for (let e = 0, o = 0; ;) {
      let s = e == t.length ? 1000000000 : t[e++];
      while (o < s || (o == s && a.len == 0)) {
        if (a.done) {
          break done;
        }
        let e = Math.min(a.len, s - o);
        D(i, e, -1);
        let t = a.ins == -1 ? -1 : a.off == 0 ? a.ins : 0;
        D(n, e, t);
        if (t > 0) {
          fe(r, n, a.text);
        }
        a.forward(e);
        o += e;
      }
      let c = t[e++];
      while (o < c) {
        if (a.done) {
          break done;
        }
        let e = Math.min(a.len, c - o);
        D(n, e, -1);
        D(i, e, a.ins == -1 ? -1 : a.off == 0 ? a.ins : 0);
        a.forward(e);
        o += e;
      }
    }
    return {
      changes: new e(n, r),
      filtered: de.create(i),
    };
  }
  toJSON() {
    let e = [];
    for (let t = 0; t < this.sections.length; t += 2) {
      let section = this.sections[t];
      let r = this.sections[t + 1];
      if (r < 0) {
        e.push(section);
      } else if (r == 0) {
        e.push([section]);
      } else {
        e.push([section].concat(this.inserted[t >> 1].toJSON()));
      }
    }
    return e;
  }
  static of(t, n, r) {
    let i = [];
    let a = [];
    let o = 0;
    let s = null;
    function c(t = false) {
      if (!t && !i.length) {
        return;
      }
      if (o < n) {
        D(i, n - o, -1);
      }
      let r = new e(i, a);
      s = s ? s.compose(r.map(s)) : r;
      i = [];
      a = [];
      o = 0;
    }
    function l(t) {
      if (Array.isArray(t)) {
        for (let e of t) {
          l(e);
        }
      } else if (t instanceof e) {
        if (t.length != n) {
          throw RangeError(
            `Mismatched change set length (got ${t.length}, expected ${n})`,
          );
        }
        c();
        s = s ? s.compose(t.map(s)) : t;
      } else {
        let { from, to = from, insert } = t;
        if (from > to || from < 0 || to > n) {
          throw RangeError(
            `Invalid change range ${from} to ${to} (in doc of length ${n})`,
          );
        }
        let u = insert
          ? typeof insert == `string`
            ? v.of(insert.split(r || ue))
            : insert
          : v.empty;
        let d = u.length;
        if (from == to && d == 0) {
          return;
        }
        if (from < o) {
          c();
        }
        if (from > o) {
          D(i, from - o, -1);
        }
        D(i, to - from, d);
        fe(a, i, u);
        o = to;
      }
    }
    l(t);
    c(!s);
    return s;
  }
  static empty(t) {
    return new e(t ? [t, -1] : [], []);
  }
  static fromJSON(t) {
    if (!Array.isArray(t)) {
      throw RangeError(`Invalid JSON representation of ChangeSet`);
    }
    let n = [];
    let r = [];
    for (let e = 0; e < t.length; e++) {
      let i = t[e];
      if (typeof i == `number`) {
        n.push(i, -1);
      } else if (
        !Array.isArray(i) ||
        typeof i[0] != `number` ||
        i.some((e, t) => t && typeof e != `string`)
      ) {
        throw RangeError(`Invalid JSON representation of ChangeSet`);
      } else if (i.length == 1) {
        n.push(i[0], 0);
      } else {
        while (r.length < e) {
          r.push(v.empty);
        }
        r[e] = v.of(i.slice(1));
        n.push(i[0], r[e].length);
      }
    }
    return new e(n, r);
  }
  static createSet(t, n) {
    return new e(t, n);
  }
};
function D(e, t, n, r = false) {
  if (t == 0 && n <= 0) {
    return;
  }
  let i = e.length - 2;
  if (i >= 0 && n <= 0 && n == e[i + 1]) {
    e[i] += t;
  } else if (i >= 0 && t == 0 && e[i] == 0) {
    e[i + 1] += n;
  } else if (r) {
    e[i] += t;
    e[i + 1] += n;
  } else {
    e.push(t, n);
  }
}
function fe(e, t, n) {
  if (n.length == 0) {
    return;
  }
  let r = (t.length - 2) >> 1;
  if (r < e.length) {
    e[e.length - 1] = e[e.length - 1].append(n);
  } else {
    while (e.length < r) {
      e.push(v.empty);
    }
    e.push(n);
  }
}
function O(e, t, n) {
  let e_inserted = e.inserted;
  for (let i = 0, a = 0, o = 0; o < e.sections.length;) {
    let s = e.sections[o++];
    let c = e.sections[o++];
    if (c < 0) {
      i += s;
      a += s;
    } else {
      let l = i;
      let u = a;
      let d = v.empty;
      while (
        ((l += s),
        (u += c),
        c && e_inserted && (d = d.append(e_inserted[(o - 2) >> 1])),
        !(n || o == e.sections.length || e.sections[o + 1] < 0))
      ) {
        s = e.sections[o++];
        c = e.sections[o++];
      }
      t(i, l, a, u, d);
      i = l;
      a = u;
    }
  }
}
function pe(e, t, n, r = false) {
  let i = [];
  let a = r ? [] : null;
  let o = new he(e);
  let s = new he(t);
  for (let e = -1; ;) {
    if ((o.done && s.len) || (s.done && o.len)) {
      throw Error(`Mismatched change set lengths`);
    } else if (o.ins == -1 && s.ins == -1) {
      let e = Math.min(o.len, s.len);
      D(i, e, -1);
      o.forward(e);
      s.forward(e);
    } else if (
      s.ins >= 0 &&
      (o.ins < 0 ||
        e == o.i ||
        (o.off == 0 && (s.len < o.len || (s.len == o.len && !n))))
    ) {
      let t = s.len;
      D(i, s.ins, -1);
      while (t) {
        let n = Math.min(o.len, t);
        if (o.ins >= 0 && e < o.i && o.len <= n) {
          D(i, 0, o.ins);
          if (a) {
            fe(a, i, o.text);
          }
          e = o.i;
        }
        o.forward(n);
        t -= n;
      }
      s.next();
    } else if (o.ins >= 0) {
      let t = 0;
      let n = o.len;
      while (n) {
        if (s.ins == -1) {
          let e = Math.min(n, s.len);
          t += e;
          n -= e;
          s.forward(e);
        } else if (s.ins == 0 && s.len < n) {
          n -= s.len;
          s.next();
        } else {
          break;
        }
      }
      D(i, t, e < o.i ? o.ins : 0);
      if (a && e < o.i) {
        fe(a, i, o.text);
      }
      e = o.i;
      o.forward(o.len - n);
    } else if (o.done && s.done) {
      if (a) {
        return E.createSet(i, a);
      }
      return de.create(i);
    } else {
      throw Error(`Mismatched change set lengths`);
    }
  }
}
function me(e, t, n = false) {
  let r = [];
  let i = n ? [] : null;
  let a = new he(e);
  let o = new he(t);
  for (let e = false; ;) {
    if (a.done && o.done) {
      if (i) {
        return E.createSet(r, i);
      }
      return de.create(r);
    } else if (a.ins == 0) {
      D(r, a.len, 0, e);
      a.next();
    } else if (o.len == 0 && !o.done) {
      D(r, 0, o.ins, e);
      if (i) {
        fe(i, r, o.text);
      }
      o.next();
    } else if (a.done || o.done) {
      throw Error(`Mismatched change set lengths`);
    } else {
      let t = Math.min(a.len2, o.len);
      let n = r.length;
      if (a.ins == -1) {
        let n = o.ins == -1 ? -1 : o.off ? 0 : o.ins;
        D(r, t, n, e);
        if (i && n) {
          fe(i, r, o.text);
        }
      } else {
        if (o.ins == -1) {
          D(r, a.off ? 0 : a.len, t, e);
          if (i) {
            fe(i, r, a.textBit(t));
          }
        } else {
          D(r, a.off ? 0 : a.len, o.off ? 0 : o.ins, e);
          if (i && !o.off) {
            fe(i, r, o.text);
          }
        }
      }
      e = (a.ins > t || (o.ins >= 0 && o.len > t)) && (e || r.length > n);
      a.forward2(t);
      o.forward(t);
    }
  }
}
var he = class {
  constructor(e) {
    this.set = e;
    this.i = 0;
    this.next();
  }
  next() {
    let { sections } = this.set;
    if (this.i < sections.length) {
      this.len = sections[this.i++];
      this.ins = sections[this.i++];
    } else {
      this.len = 0;
      this.ins = -2;
    }
    this.off = 0;
  }
  get done() {
    return this.ins == -2;
  }
  get len2() {
    if (this.ins < 0) {
      return this.len;
    }
    return this.ins;
  }
  get text() {
    let { inserted } = this.set;
    let t = (this.i - 2) >> 1;
    if (t >= inserted.length) {
      return v.empty;
    }
    return inserted[t];
  }
  textBit(e) {
    let { inserted } = this.set;
    let n = (this.i - 2) >> 1;
    if (n >= inserted.length && !e) {
      return v.empty;
    }
    return inserted[n].slice(this.off, e == null ? undefined : this.off + e);
  }
  forward(e) {
    if (e == this.len) {
      this.next();
    } else {
      this.len -= e;
      this.off += e;
    }
  }
  forward2(e) {
    if (this.ins == -1) {
      this.forward(e);
    } else if (e == this.ins) {
      this.next();
    } else {
      this.ins -= e;
      this.off += e;
    }
  }
};
const ge = class e {
  constructor(e, t, n, r) {
    this.from = e;
    this.to = t;
    this.flags = n;
    this.goalColumn = r;
  }
  get anchor() {
    if (this.flags & 32) {
      return this.to;
    }
    return this.from;
  }
  get head() {
    if (this.flags & 32) {
      return this.from;
    }
    return this.to;
  }
  get empty() {
    return this.from == this.to;
  }
  get assoc() {
    if (this.flags & 8) {
      return -1;
    }
    if (this.flags & 16) {
      return 1;
    }
    return 0;
  }
  get undirectional() {
    return (this.flags & 64) > 0;
  }
  get bidiLevel() {
    let e = this.flags & 7;
    if (e == 7) {
      return null;
    }
    return e;
  }
  map(t, n = -1) {
    let r;
    let i;
    if (this.empty) {
      r = i = t.mapPos(this.from, n);
    } else {
      r = t.mapPos(this.from, 1);
      i = t.mapPos(this.to, -1);
    }
    if (r == this.from && i == this.to) {
      return this;
    }
    return new e(r, i, this.flags, this.goalColumn);
  }
  extend(e, t = e, n = 0) {
    if (e <= this.anchor && t >= this.anchor) {
      return k.range(e, t, undefined, undefined, n);
    }
    let r = Math.abs(e - this.anchor) > Math.abs(t - this.anchor) ? e : t;
    return k.range(this.anchor, r, undefined, undefined, n);
  }
  eq(e, t = false) {
    return (
      this.anchor == e.anchor &&
      this.head == e.head &&
      this.goalColumn == e.goalColumn &&
      (!t || !this.empty || this.assoc == e.assoc)
    );
  }
  toJSON() {
    return {
      anchor: this.anchor,
      head: this.head,
    };
  }
  static fromJSON(e) {
    if (!e || typeof e.anchor != `number` || typeof e.head != `number`) {
      throw RangeError(`Invalid JSON representation for SelectionRange`);
    }
    return k.range(e.anchor, e.head);
  }
  static create(t, n, r, i) {
    return new e(t, n, r, i);
  }
};
var k = class e {
  constructor(e, t) {
    this.ranges = e;
    this.mainIndex = t;
  }
  map(t, n = -1) {
    if (t.empty) {
      return this;
    }
    return e.create(
      this.ranges.map((e) => e.map(t, n)),
      this.mainIndex,
    );
  }
  eq(e, t = false) {
    if (
      this.ranges.length != e.ranges.length ||
      this.mainIndex != e.mainIndex
    ) {
      return false;
    }
    for (let n = 0; n < this.ranges.length; n++) {
      if (!this.ranges[n].eq(e.ranges[n], t)) {
        return false;
      }
    }
    return true;
  }
  get main() {
    return this.ranges[this.mainIndex];
  }
  asSingle() {
    if (this.ranges.length == 1) {
      return this;
    }
    return new e([this.main], 0);
  }
  addRange(t, n = true) {
    return e.create([t].concat(this.ranges), n ? 0 : this.mainIndex + 1);
  }
  replaceRange(t, n = this.mainIndex) {
    let r = this.ranges.slice();
    r[n] = t;
    return e.create(r, this.mainIndex);
  }
  toJSON() {
    return {
      ranges: this.ranges.map((e) => e.toJSON()),
      main: this.mainIndex,
    };
  }
  static fromJSON(t) {
    if (
      !t ||
      !Array.isArray(t.ranges) ||
      typeof t.main != `number` ||
      t.main >= t.ranges.length
    ) {
      throw RangeError(`Invalid JSON representation for EditorSelection`);
    }
    return new e(
      t.ranges.map((e) => ge.fromJSON(e)),
      t.main,
    );
  }
  static single(t, n = t) {
    return new e([e.range(t, n)], 0);
  }
  static create(t, n = 0) {
    if (t.length == 0) {
      throw RangeError(`A selection needs at least one range`);
    }
    for (let r = 0, i = 0; i < t.length; i++) {
      let a = t[i];
      if (a.empty ? a.from <= r : a.from < r) {
        return e.normalized(t.slice(), n);
      }
      r = a.to;
    }
    return new e(t, n);
  }
  static cursor(e, t = 0, n, r) {
    return ge.create(
      e,
      e,
      (t == 0 ? 0 : t < 0 ? 8 : 16) | (n == null ? 7 : Math.min(6, n)),
      r,
    );
  }
  static range(e, t, n, r, i) {
    let a = r == null ? 7 : Math.min(6, r);
    if (!i && e != t) {
      i = t < e ? 1 : -1;
    }
    if (i) {
      a |= i < 0 ? 8 : 16;
    }
    if (t < e) {
      return ge.create(t, e, a | 32, n);
    }
    return ge.create(e, t, a, n);
  }
  static undirectionalRange(e, t) {
    return ge.create(e, t, 64, undefined);
  }
  static normalized(t, n = 0) {
    let r = t[n];
    t.sort((e, t) => e.from - t.from);
    n = t.indexOf(r);
    for (let r = 1; r < t.length; r++) {
      let i = t[r];
      let a = t[r - 1];
      if (i.empty ? i.from <= a.to : i.from < a.to) {
        let o = a.from;
        let s = Math.max(i.to, a.to);
        r <= n && n--;
        t.splice(--r, 2, i.anchor > i.head ? e.range(s, o) : e.range(o, s));
      }
    }
    return new e(t, n);
  }
};
function _e(e, t) {
  for (let n of e.ranges) {
    if (n.to > t) {
      throw RangeError(`Selection points outside of document`);
    }
  }
}
let ve = 0;
const A = class e {
  constructor(e, t, n, r, i) {
    this.combine = e;
    this.compareInput = t;
    this.compare = n;
    this.isStatic = r;
    this.id = ve++;
    this.default = e([]);
    this.extensions = typeof i == `function` ? i(this) : i;
  }
  get reader() {
    return this;
  }
  static define(t = {}) {
    return new e(
      t.combine || ((e) => e),
      t.compareInput || ((e, t) => e === t),
      t.compare || (t.combine ? (e, t) => e === t : ye),
      !!t.static,
      t.enables,
    );
  }
  of(e) {
    return new be([], this, 0, e);
  }
  compute(e, t) {
    if (this.isStatic) {
      throw Error(`Can't compute a static facet`);
    }
    return new be(e, this, 1, t);
  }
  computeN(e, t) {
    if (this.isStatic) {
      throw Error(`Can't compute a static facet`);
    }
    return new be(e, this, 2, t);
  }
  from(e, t) {
    t ||= (e) => e;
    return this.compute([e], (n) => t(n.field(e)));
  }
};
function ye(e, t) {
  return e == t || (e.length == t.length && e.every((e, n) => e === t[n]));
}
var be = class {
  constructor(e, t, n, r) {
    this.dependencies = e;
    this.facet = t;
    this.type = n;
    this.value = r;
    this.id = ve++;
  }
  dynamicSlot(e) {
    let value = this.value;
    let compareInput = this.facet.compareInput;
    let r = this.id;
    let i = e[r] >> 1;
    let a = this.type == 2;
    let o = false;
    let s = false;
    let c = [];
    for (let t of this.dependencies) {
      if (t == `doc`) {
        o = true;
      } else if (t == `selection`) {
        s = true;
      } else if (!((e[t.id] ?? 1) & 1)) {
        c.push(e[t.id]);
      }
    }
    return {
      create(e) {
        e.values[i] = value(e);
        return 1;
      },
      update(e, r) {
        if (
          (o && r.docChanged) ||
          (s && (r.docChanged || r.selection)) ||
          Se(e, c)
        ) {
          let r = value(e);
          if (
            a
              ? !xe(r, e.values[i], compareInput)
              : !compareInput(r, e.values[i])
          ) {
            e.values[i] = r;
            return 1;
          }
        }
        return 0;
      },
      reconfigure: (e, o) => {
        let s;
        let c = o.config.address[r];
        if (c != null) {
          let r = Fe(o, c);
          if (
            this.dependencies.every((t) => {
              if (t instanceof A) {
                return o.facet(t) === e.facet(t);
              }
              if (t instanceof Te) {
                return o.field(t, false) == e.field(t, false);
              }
              return true;
            }) ||
            (a
              ? xe((s = value(e)), r, compareInput)
              : compareInput((s = value(e)), r))
          ) {
            e.values[i] = r;
            return 0;
          }
        } else {
          s = value(e);
        }
        e.values[i] = s;
        return 1;
      },
    };
  }
  get extension() {
    return this;
  }
};
function xe(e, t, compareInput) {
  if (e.length != t.length) {
    return false;
  }
  for (let r = 0; r < e.length; r++) {
    if (!compareInput(e[r], t[r])) {
      return false;
    }
  }
  return true;
}
function Se(e, t) {
  let n = false;
  for (let r of t) {
    if (Pe(e, r) & 1) {
      n = true;
    }
  }
  return n;
}
function Ce(e, t, n) {
  let r = n.map((t) => e[t.id]);
  let i = n.map((e) => e.type);
  let a = r.filter((e) => !(e & 1));
  let o = e[t.id] >> 1;
  function s(e) {
    let n = [];
    for (let t = 0; t < r.length; t++) {
      let a = Fe(e, r[t]);
      if (i[t] == 2) {
        for (let e of a) {
          n.push(e);
        }
      } else {
        n.push(a);
      }
    }
    return t.combine(n);
  }
  return {
    create(e) {
      for (let t of r) {
        Pe(e, t);
      }
      e.values[o] = s(e);
      return 1;
    },
    update(e, n) {
      if (!Se(e, a)) {
        return 0;
      }
      let r = s(e);
      if (t.compare(r, e.values[o])) {
        return 0;
      }
      return ((e.values[o] = r), 1);
    },
    reconfigure(e, i) {
      let a = Se(e, r);
      let c = i.config.facets[t.id];
      let l = i.facet(t);
      if (c && !a && ye(n, c)) {
        e.values[o] = l;
        return 0;
      }
      let u = s(e);
      if (t.compare(u, l)) {
        return ((e.values[o] = l), 0);
      }
      return ((e.values[o] = u), 1);
    },
  };
}
const we = A.define({
  static: true,
});
var Te = class e {
  constructor(e, t, n, r, i) {
    this.id = e;
    this.createF = t;
    this.updateF = n;
    this.compareF = r;
    this.spec = i;
    this.provides = undefined;
  }
  static define(t) {
    let n = new e(
      ve++,
      t.create,
      t.update,
      t.compare || ((e, t) => e === t),
      t,
    );
    if (t.provide) {
      n.provides = t.provide(n);
    }
    return n;
  }
  create(e) {
    return (e.facet(we).find((e) => e.field == this)?.create || this.createF)(
      e,
    );
  }
  slot(e) {
    let t = e[this.id] >> 1;
    return {
      create: (e) => {
        e.values[t] = this.create(e);
        return 1;
      },
      update: (e, n) => {
        let r = e.values[t];
        let i = this.updateF(r, n);
        if (this.compareF(r, i)) {
          return 0;
        }
        return ((e.values[t] = i), 1);
      },
      reconfigure: (e, n) => {
        let r = e.facet(we);
        let i = n.facet(we);
        let a;
        if (
          (a = r.find((e) => e.field == this)) &&
          a != i.find((e) => e.field == this)
        ) {
          return ((e.values[t] = a.create(e)), 1);
        }
        if (n.config.address[this.id] == null) {
          return ((e.values[t] = this.create(e)), 1);
        }
        return ((e.values[t] = n.field(this)), 0);
      },
    };
  }
  init(e) {
    return [
      this,
      we.of({
        field: this,
        create: e,
      }),
    ];
  }
  get extension() {
    return this;
  }
};
const Ee = {
  lowest: 4,
  low: 3,
  default: 2,
  high: 1,
  highest: 0,
};
function De(e) {
  return (t) => new ke(t, e);
}
const Oe = {
  highest: De(Ee.highest),
  high: De(Ee.high),
  default: De(Ee.default),
  low: De(Ee.low),
  lowest: De(Ee.lowest),
};
var ke = class {
  constructor(e, t) {
    this.inner = e;
    this.prec = t;
  }
  get extension() {
    return this;
  }
};
const Ae = class e {
  of(e) {
    return new je(this, e);
  }
  reconfigure(extension) {
    return e.reconfigure.of({
      compartment: this,
      extension,
    });
  }
  get(e) {
    return e.config.compartments.get(this);
  }
};
var je = class {
  constructor(e, t) {
    this.compartment = e;
    this.inner = t;
  }
  get extension() {
    return this;
  }
};
const Me = class e {
  constructor(e, t, n, r, i, a) {
    this.base = e;
    this.compartments = t;
    this.dynamicSlots = n;
    this.address = r;
    this.staticValues = i;
    this.facets = a;
    for (this.statusTemplate = []; this.statusTemplate.length < n.length;) {
      this.statusTemplate.push(0);
    }
  }
  staticFacet(e) {
    let t = this.address[e.id];
    if (t == null) {
      return e.default;
    }
    return this.staticValues[t >> 1];
  }
  static resolve(t, n, r) {
    let i = [];
    let a = Object.create(null);
    let o = new Map();
    for (let e of Ne(t, n, o)) {
      if (e instanceof Te) {
        i.push(e);
      } else {
        (a[e.facet.id] || (a[e.facet.id] = [])).push(e);
      }
    }
    let s = Object.create(null);
    let c = [];
    let l = [];
    for (let e of i) {
      s[e.id] = l.length << 1;
      l.push((t) => e.slot(t));
    }
    let u = r?.config.facets;
    for (let e in a) {
      let t = a[e];
      let n = t[0].facet;
      let i = (u && u[e]) || [];
      if (t.every((e) => e.type == 0)) {
        s[n.id] = (c.length << 1) | 1;
        if (ye(i, t)) {
          c.push(r.facet(n));
        } else {
          let e = n.combine(t.map((e) => e.value));
          c.push(r && n.compare(e, r.facet(n)) ? r.facet(n) : e);
        }
      } else {
        for (let e of t) {
          if (e.type == 0) {
            s[e.id] = (c.length << 1) | 1;
            c.push(e.value);
          } else {
            s[e.id] = l.length << 1;
            l.push((t) => e.dynamicSlot(t));
          }
        }
        s[n.id] = l.length << 1;
        l.push((e) => Ce(e, n, t));
      }
    }
    let d = l.map((e) => e(s));
    return new e(t, o, d, s, c, a);
  }
};
function Ne(e, t, n) {
  let r = [[], [], [], [], []];
  let i = new Map();
  function a(e, o) {
    let s = i.get(e);
    if (s != null) {
      if (s <= o) {
        return;
      }
      let t = r[s].indexOf(e);
      if (t > -1) {
        r[s].splice(t, 1);
      }
      if (e instanceof je) {
        n.delete(e.compartment);
      }
    }
    i.set(e, o);
    if (Array.isArray(e)) {
      for (let t of e) {
        a(t, o);
      }
    } else if (e instanceof je) {
      if (n.has(e.compartment)) {
        throw RangeError(`Duplicate use of compartment in extensions`);
      }
      let r = t.get(e.compartment) || e.inner;
      n.set(e.compartment, r);
      a(r, o);
    } else if (e instanceof ke) {
      a(e.inner, e.prec);
    } else if (e instanceof Te) {
      r[o].push(e);
      if (e.provides) {
        a(e.provides, o);
      }
    } else if (e instanceof be) {
      r[o].push(e);
      if (e.facet.extensions) {
        a(e.facet.extensions, Ee.default);
      }
    } else {
      let t = e.extension;
      if (!t) {
        throw Error(`Unrecognized extension value in extension set (${e}).`);
      }
      if (t == e) {
        throw Error(
          `Unrecognized extension value in extension set (${e}). This sometimes happens because multiple instances of @codemirror/state are loaded, breaking instanceof checks.`,
        );
      }
      a(t, o);
    }
  }
  a(e, Ee.default);
  return r.reduce((acc, item) => acc.concat(item));
}
function Pe(e, t) {
  if (t & 1) {
    return 2;
  }
  let n = t >> 1;
  let r = e.status[n];
  if (r == 4) {
    throw Error(`Cyclic dependency between fields and/or facets`);
  }
  if (r & 2) {
    return r;
  }
  e.status[n] = 4;
  let i = e.computeSlot(e, e.config.dynamicSlots[n]);
  return (e.status[n] = 2 | i);
}
function Fe(e, t) {
  if (t & 1) {
    return e.config.staticValues[t >> 1];
  }
  return e.values[t >> 1];
}
const Ie = A.define();
const Le = A.define({
  combine: (e) => e.some((e) => e),
  static: true,
});
const Re = A.define({
  combine: (e) => {
    if (e.length) {
      return e[0];
    }
  },
  static: true,
});
const ze = A.define();
const Be = A.define();
const Ve = A.define();
const He = A.define({
  combine: (e) => {
    if (e.length) {
      return e[0];
    }
    return false;
  },
});
class Ue {
  constructor(e, t) {
    this.type = e;
    this.value = t;
  }
  static define() {
    return new We();
  }
}
var We = class {
  of(e) {
    return new Ue(this, e);
  }
};
class Ge {
  constructor(e) {
    this.map = e;
  }
  of(e) {
    return new j(this, e);
  }
}
var j = class e {
  constructor(e, t) {
    this.type = e;
    this.value = t;
  }
  map(t) {
    let n = this.type.map(this.value, t);
    if (n === undefined) {
      return undefined;
    }
    if (n == this.value) {
      return this;
    }
    return new e(this.type, n);
  }
  is(e) {
    return this.type == e;
  }
  static define(e = {}) {
    return new Ge(e.map || ((e) => e));
  }
  static mapEffects(e, t) {
    if (!e.length) {
      return e;
    }
    let n = [];
    for (let r of e) {
      let e = r.map(t);
      if (e) {
        n.push(e);
      }
    }
    return n;
  }
};
j.reconfigure = j.define();
j.appendConfig = j.define();
const Ke = class e {
  constructor(t, n, r, i, a, o) {
    this.startState = t;
    this.changes = n;
    this.selection = r;
    this.effects = i;
    this.annotations = a;
    this.scrollIntoView = o;
    this._doc = null;
    this._state = null;
    if (r) {
      _e(r, n.newLength);
    }
    if (!a.some((t) => t.type == e.time)) {
      this.annotations = a.concat(e.time.of(Date.now()));
    }
  }
  static create(t, n, r, i, a, o) {
    return new e(t, n, r, i, a, o);
  }
  get newDoc() {
    return (this._doc ||= this.changes.apply(this.startState.doc));
  }
  get newSelection() {
    return this.selection || this.startState.selection.map(this.changes);
  }
  get state() {
    if (!this._state) {
      this.startState.applyTransaction(this);
    }
    return this._state;
  }
  annotation(e) {
    for (let t of this.annotations) {
      if (t.type == e) {
        return t.value;
      }
    }
  }
  get docChanged() {
    return !this.changes.empty;
  }
  get reconfigured() {
    return this.startState.config != this.state.config;
  }
  isUserEvent(t) {
    let n = this.annotation(e.userEvent);
    return !!(
      n &&
      (n == t ||
        (n.length > t.length &&
          n.slice(0, t.length) == t &&
          n[t.length] == `.`))
    );
  }
};
Ke.time = Ue.define();
Ke.userEvent = Ue.define();
Ke.addToHistory = Ue.define();
Ke.remote = Ue.define();
function qe(e, t) {
  let n = [];
  for (let r = 0, i = 0; ;) {
    let a;
    let o;
    if (r < e.length && (i == t.length || t[i] >= e[r])) {
      a = e[r++];
      o = e[r++];
    } else if (i < t.length) {
      a = t[i++];
      o = t[i++];
    } else {
      return n;
    }
    if (!n.length || n[n.length - 1] < a) {
      n.push(a, o);
    } else if (n[n.length - 1] < o) {
      n[n.length - 1] = o;
    }
  }
}
function Je(e, t, n) {
  let r;
  let i;
  let a;
  if (n) {
    r = t.changes;
    i = E.empty(t.changes.length);
    a = e.changes.compose(t.changes);
  } else {
    r = t.changes.map(e.changes);
    i = e.changes.mapDesc(t.changes, true);
    a = e.changes.compose(r);
  }
  return {
    changes: a,
    selection: t.selection ? t.selection.map(i) : e.selection?.map(r),
    effects: j.mapEffects(e.effects, r).concat(j.mapEffects(t.effects, i)),
    annotations: e.annotations.length
      ? e.annotations.concat(t.annotations)
      : t.annotations,
    scrollIntoView: e.scrollIntoView || t.scrollIntoView,
  };
}
function Ye(e, t, n) {
  let t_selection = t.selection;
  let annotations = et(t.annotations);
  if (t.userEvent) {
    annotations = annotations.concat(Ke.userEvent.of(t.userEvent));
  }
  return {
    changes:
      t.changes instanceof E
        ? t.changes
        : E.of(t.changes || [], n, e.facet(Re)),
    selection:
      t_selection &&
      (t_selection instanceof k
        ? t_selection
        : k.single(t_selection.anchor, t_selection.head)),
    effects: et(t.effects),
    annotations,
    scrollIntoView: !!t.scrollIntoView,
  };
}
function Xe(e, t, n) {
  let r = Ye(e, t.length ? t[0] : {}, e.doc.length);
  if (t.length && t[0].filter === false) {
    n = false;
  }
  for (let i = 1; i < t.length; i++) {
    if (t[i].filter === false) {
      n = false;
    }
    let a = !!t[i].sequential;
    r = Je(r, Ye(e, t[i], a ? r.changes.newLength : e.doc.length), a);
  }
  let i = Ke.create(
    e,
    r.changes,
    r.selection,
    r.effects,
    r.annotations,
    r.scrollIntoView,
  );
  return Qe(n ? Ze(i) : i);
}
function Ze(e) {
  let e_startState = e.startState;
  let n = true;
  for (let r of e_startState.facet(ze)) {
    let t = r(e);
    if (t === false) {
      n = false;
      break;
    }
    if (Array.isArray(t)) {
      n = n === true ? t : qe(n, t);
    }
  }
  if (n !== true) {
    let r;
    let i;
    if (n === false) {
      i = e.changes.invertedDesc;
      r = E.empty(e_startState.doc.length);
    } else {
      let t = e.changes.filter(n);
      r = t.changes;
      i = t.filtered.mapDesc(t.changes).invertedDesc;
    }
    e = Ke.create(
      e_startState,
      r,
      e.selection && e.selection.map(i),
      j.mapEffects(e.effects, i),
      e.annotations,
      e.scrollIntoView,
    );
  }
  let r = e_startState.facet(Be);
  for (let n = r.length - 1; n >= 0; n--) {
    let i = r[n](e);
    e =
      i instanceof Ke
        ? i
        : Array.isArray(i) && i.length == 1 && i[0] instanceof Ke
          ? i[0]
          : Xe(e_startState, et(i), false);
  }
  return e;
}
function Qe(e) {
  let e_startState = e.startState;
  let n = e_startState.facet(Ve);
  let r = e;
  for (let i = n.length - 1; i >= 0; i--) {
    let a = n[i](e);
    if (a && Object.keys(a).length) {
      r = Je(r, Ye(e_startState, a, e.changes.newLength), true);
    }
  }
  if (r == e) {
    return e;
  }
  return Ke.create(
    e_startState,
    e.changes,
    e.selection,
    r.effects,
    r.annotations,
    r.scrollIntoView,
  );
}
const $e = [];
function et(e) {
  if (e == null) {
    return $e;
  }
  if (Array.isArray(e)) {
    return e;
  }
  return [e];
}
var M = ((e) => {
  e[(e.Word = 0)] = `Word`;
  e[(e.Space = 1)] = `Space`;
  e[(e.Other = 2)] = `Other`;
  return e;
})((M ||= {}));
const tt =
  /[\u00df\u0587\u0590-\u05f4\u0600-\u06ff\u3040-\u309f\u30a0-\u30ff\u3400-\u4db5\u4e00-\u9fcc\uac00-\ud7af]/;
let nt;
try {
  nt = RegExp(`[\\p{Alphabetic}\\p{Number}_]`, `u`);
} catch {}
function rt(e) {
  if (nt) {
    return nt.test(e);
  }
  for (const n of e) {
    if (
      /\w/.test(n) ||
      (n > `` && (n.toUpperCase() != n.toLowerCase() || tt.test(n)))
    ) {
      return true;
    }
  }
  return false;
}
function it(e) {
  return (t) => {
    if (!/\S/.test(t)) {
      return M.Space;
    }
    if (rt(t)) {
      return M.Word;
    }
    for (let n = 0; n < e.length; n++) {
      if (t.indexOf(e[n]) > -1) {
        return M.Word;
      }
    }
    return M.Other;
  };
}
const N = class e {
  constructor(e, t, n, r, i, a) {
    this.config = e;
    this.doc = t;
    this.selection = n;
    this.values = r;
    this.status = e.statusTemplate.slice();
    this.computeSlot = i;
    if (a) {
      a._state = this;
    }
    for (let e = 0; e < this.config.dynamicSlots.length; e++) {
      Pe(this, e << 1);
    }
    this.computeSlot = null;
  }
  field(e, t = true) {
    let n = this.config.address[e.id];
    if (n == null) {
      if (t) {
        throw RangeError(`Field is not present in this state`);
      }
      return;
    }
    Pe(this, n);
    return Fe(this, n);
  }
  update(...e) {
    return Xe(this, e, true);
  }
  applyTransaction(t) {
    let config = this.config;
    let { base, compartments } = config;
    for (let e of t.effects) {
      if (e.is(Ae.reconfigure)) {
        config &&=
          ((compartments = new Map()),
          config.compartments.forEach((e, t) => compartments.set(t, e)),
          null);
        compartments.set(e.value.compartment, e.value.extension);
      } else if (e.is(j.reconfigure)) {
        config = null;
        base = e.value;
      } else if (e.is(j.appendConfig)) {
        config = null;
        base = et(base).concat(e.value);
      }
    }
    let a;
    if (config) {
      a = t.startState.values.slice();
    } else {
      config = Me.resolve(base, compartments, this);
      a = new e(
        config,
        this.doc,
        this.selection,
        config.dynamicSlots.map(() => null),
        (e, t) => t.reconfigure(e, this),
        null,
      ).values;
    }
    let o = t.startState.facet(Le) ? t.newSelection : t.newSelection.asSingle();
    new e(config, t.newDoc, o, a, (e, n) => n.update(e, t), t);
  }
  replaceSelection(e) {
    if (typeof e == `string`) {
      e = this.toText(e);
    }
    return this.changeByRange((t) => ({
      changes: {
        from: t.from,
        to: t.to,
        insert: e,
      },
      range: k.cursor(t.from + e.length, -1),
    }));
  }
  changeByRange(e) {
    let selection = this.selection;
    let n = e(selection.ranges[0]);
    let r = this.changes(n.changes);
    let i = [n.range];
    let a = et(n.effects);
    for (let n = 1; n < selection.ranges.length; n++) {
      let o = e(selection.ranges[n]);
      let s = this.changes(o.changes);
      let c = s.map(r);
      for (let e = 0; e < n; e++) {
        i[e] = i[e].map(c);
      }
      let l = r.mapDesc(s, true);
      i.push(o.range.map(l));
      r = r.compose(c);
      a = j.mapEffects(a, c).concat(j.mapEffects(et(o.effects), l));
    }
    return {
      changes: r,
      selection: k.create(i, selection.mainIndex),
      effects: a,
    };
  }
  changes(t = []) {
    if (t instanceof E) {
      return t;
    }
    return E.of(t, this.doc.length, this.facet(e.lineSeparator));
  }
  toText(t) {
    return v.of(t.split(this.facet(e.lineSeparator) || ue));
  }
  sliceDoc(e = 0, t = this.doc.length) {
    return this.doc.sliceString(e, t, this.lineBreak);
  }
  facet(e) {
    let t = this.config.address[e.id];
    if (t == null) {
      return e.default;
    }
    return (Pe(this, t), Fe(this, t));
  }
  toJSON(e) {
    let t = {
      doc: this.sliceDoc(),
      selection: this.selection.toJSON(),
    };
    if (e) {
      for (let n in e) {
        let r = e[n];
        if (r instanceof Te && this.config.address[r.id] != null) {
          t[n] = r.spec.toJSON(this.field(e[n]), this);
        }
      }
    }
    return t;
  }
  static fromJSON(t, n = {}, r) {
    if (!t || typeof t.doc != `string`) {
      throw RangeError(`Invalid JSON representation for EditorState`);
    }
    let i = [];
    if (r) {
      for (let e in r) {
        if (Object.prototype.hasOwnProperty.call(t, e)) {
          let n = r[e];
          let a = t[e];
          i.push(n.init((e) => n.spec.fromJSON(a, e)));
        }
      }
    }
    return e.create({
      doc: t.doc,
      selection: k.fromJSON(t.selection),
      extensions: n.extensions ? i.concat([n.extensions]) : i,
    });
  }
  static create(t = {}) {
    let n = Me.resolve(t.extensions || [], new Map());
    let r =
      t.doc instanceof v
        ? t.doc
        : v.of((t.doc || ``).split(n.staticFacet(e.lineSeparator) || ue));
    let i = t.selection
      ? t.selection instanceof k
        ? t.selection
        : k.single(t.selection.anchor, t.selection.head)
      : k.single(0);
    _e(i, r.length);
    if (!n.staticFacet(Le)) {
      i = i.asSingle();
    }
    return new e(
      n,
      r,
      i,
      n.dynamicSlots.map(() => null),
      (e, t) => t.create(e),
      null,
    );
  }
  get tabSize() {
    return this.facet(e.tabSize);
  }
  get lineBreak() {
    return (
      this.facet(e.lineSeparator) ||
      `
`
    );
  }
  get readOnly() {
    return this.facet(He);
  }
  phrase(t, ...n) {
    for (let n of this.facet(e.phrases)) {
      if (Object.prototype.hasOwnProperty.call(n, t)) {
        t = n[t];
        break;
      }
    }
    if (n.length) {
      t = t.replace(/\$(\$|\d*)/g, (e, t) => {
        if (t == `$`) {
          return `$`;
        }
        let r = +(t || 1);
        if (!r || r > n.length) {
          return e;
        }
        return n[r - 1];
      });
    }
    return t;
  }
  languageDataAt(e, t, n = -1) {
    let r = [];
    for (let i of this.facet(Ie)) {
      for (let a of i(this, t, n)) {
        if (Object.prototype.hasOwnProperty.call(a, e)) {
          r.push(a[e]);
        }
      }
    }
    return r;
  }
  charCategorizer(e) {
    let t = this.languageDataAt(`wordChars`, e);
    return it(t.length ? t[0] : ``);
  }
  wordAt(e) {
    let { text, from, length } = this.doc.lineAt(e);
    let i = this.charCategorizer(e);
    let a = e - from;
    let o = e - from;
    while (a > 0) {
      let e = C(text, a, false);
      if (i(text.slice(e, a)) != M.Word) {
        break;
      }
      a = e;
    }
    while (o < length) {
      let e = C(text, o);
      if (i(text.slice(o, e)) != M.Word) {
        break;
      }
      o = e;
    }
    if (a == o) {
      return null;
    }
    return k.range(a + from, o + from);
  }
};
N.allowMultipleSelections = Le;
N.tabSize = A.define({
  combine: (e) => {
    if (e.length) {
      return e[0];
    }
    return 4;
  },
});
N.lineSeparator = Re;
N.readOnly = He;
N.phrases = A.define({
  compare(e, t) {
    let n = Object.keys(e);
    let r = Object.keys(t);
    return n.length == r.length && n.every((n) => e[n] == t[n]);
  },
});
N.languageData = Ie;
N.changeFilter = ze;
N.transactionFilter = Be;
N.transactionExtender = Ve;
Ae.reconfigure = j.define();
function at(e, t, n = {}) {
  let r = {};
  for (let t of e) {
    for (let e of Object.keys(t)) {
      let i = t[e];
      let a = r[e];
      if (a === undefined) {
        r[e] = i;
      } else if (a !== i && i !== undefined) {
        if (Object.hasOwnProperty.call(n, e)) {
          r[e] = n[e](a, i);
        } else {
          throw Error(`Config merge conflict for field ` + e);
        }
      }
    }
  }
  for (let e in t) {
    if (r[e] === undefined) {
      r[e] = t[e];
    }
  }
  return r;
}
class ot {
  eq(e) {
    return this == e;
  }
  range(e, t = e) {
    return ct.create(e, t, this);
  }
}
ot.prototype.startSide = ot.prototype.endSide = 0;
ot.prototype.point = false;
ot.prototype.mapMode = T.TrackDel;
function st(e, t) {
  return e == t || (e.constructor == t.constructor && e.eq(t));
}
var ct = class e {
  constructor(e, t, n) {
    this.from = e;
    this.to = t;
    this.value = n;
  }
  static create(t, n, r) {
    return new e(t, n, r);
  }
};
function lt(e, t) {
  return e.from - t.from || e.value.startSide - t.value.startSide;
}
const ut = class e {
  constructor(e, t, n, r) {
    this.from = e;
    this.to = t;
    this.value = n;
    this.maxPoint = r;
  }
  get length() {
    return dt(this.to);
  }
  findIndex(e, t, n, r = 0) {
    let i = n ? this.to : this.from;
    for (let a = r, o = i.length; ;) {
      if (a == o) {
        return a;
      }
      let r = (a + o) >> 1;
      let s =
        i[r] - e || (n ? this.value[r].endSide : this.value[r].startSide) - t;
      if (r == a) {
        if (s >= 0) {
          return a;
        }
        return o;
      }
      if (s >= 0) {
        o = r;
      } else {
        a = r + 1;
      }
    }
  }
  between(e, t, n, r) {
    for (
      let i = this.findIndex(t, -1000000000, true),
        a = this.findIndex(n, 1000000000, false, i);
      i < a;
      i++
    ) {
      if (r(this.from[i] + e, this.to[i] + e, this.value[i]) === false) {
        return false;
      }
    }
  }
  map(t, n, r, i, a) {
    let o = [];
    let s = [];
    let c = [];
    let l = -1;
    let u = -1;
    iter: for (let e = 0; e < this.value.length; e++) {
      let d = this.value[e];
      let f = this.from[e] + t;
      let p = this.to[e] + t;
      let m;
      let h;
      if (f == p) {
        let e = n.mapPos(f, d.startSide, d.mapMode);
        if (
          e == null ||
          ((m = h = e),
          d.startSide != d.endSide && ((h = n.mapPos(f, d.endSide)), h < m))
        ) {
          continue;
        }
      } else {
        m = n.mapPos(f, d.startSide);
        h = n.mapPos(p, d.endSide);
        if (m > h || (m == h && d.startSide > 0 && d.endSide <= 0)) {
          continue;
        }
      }
      if (!((h - m || d.endSide - d.startSide) < 0)) {
        if (l < 0) {
          l = m;
        }
        if (d.point) {
          u = Math.max(u, h - m);
        }
        if ((m - r || d.startSide - i) >= 0) {
          o.push(d);
          s.push(m - l);
          c.push(h - l);
          r = h;
          i = d.endSide;
        } else {
          if (m == h) {
            for (let e = o.length; e > 0; e--) {
              if ((m - (c[e - 1] + l) || d.startSide - o[e - 1].endSide) >= 0) {
                o.splice(e, 0, d);
                s.splice(e, 0, m - l);
                c.splice(e, 0, h - l);
                continue iter;
              }
              if ((m - (s[e - 1] + l) || d.endSide - o[e - 1].startSide) > 0) {
                break;
              }
            }
          }
          a(m, h, d);
        }
      }
    }
    return {
      mapped: o.length ? new e(s, c, o, u) : null,
      pos: l,
    };
  }
};
const P = class e {
  constructor(e, t, n, r) {
    this.chunkPos = e;
    this.chunk = t;
    this.nextLayer = n;
    this.maxPoint = r;
  }
  static create(t, n, r, i) {
    return new e(t, n, r, i);
  }
  get length() {
    let e = this.chunk.length - 1;
    if (e < 0) {
      return 0;
    }
    return Math.max(this.chunkEnd(e), this.nextLayer.length);
  }
  get size() {
    if (this.isEmpty) {
      return 0;
    }
    let size = this.nextLayer.size;
    for (let t of this.chunk) {
      size += t.value.length;
    }
    return size;
  }
  chunkEnd(e) {
    return this.chunkPos[e] + this.chunk[e].length;
  }
  update(t) {
    let { add = [], sort = false, filterFrom = 0, filterTo = this.length } = t;
    let t_filter = t.filter;
    if (add.length == 0 && !t_filter) {
      return this;
    }
    if (sort) {
      add = add.slice().sort(lt);
    }
    if (this.isEmpty) {
      if (add.length) {
        return e.of(add);
      }
      return this;
    }
    let s = new ht(this, null, -1).goto(0);
    let c = 0;
    let l = [];
    let u = new pt();
    while (s.value || c < add.length) {
      if (
        c < add.length &&
        (s.from - add[c].from || s.startSide - add[c].value.startSide) >= 0
      ) {
        let e = add[c++];
        if (!u.addInner(e.from, e.to, e.value, false)) {
          l.push(e);
        }
      } else {
        if (
          s.rangeIndex == 1 &&
          s.chunkIndex < this.chunk.length &&
          (c == add.length || this.chunkEnd(s.chunkIndex) < add[c].from) &&
          (!t_filter ||
            filterFrom > this.chunkEnd(s.chunkIndex) ||
            filterTo < this.chunkPos[s.chunkIndex]) &&
          u.addChunk(this.chunkPos[s.chunkIndex], this.chunk[s.chunkIndex])
        ) {
          s.nextChunk();
        } else {
          (!t_filter ||
            filterFrom > s.to ||
            filterTo < s.from ||
            t_filter(s.from, s.to, s.value)) &&
            (u.addInner(s.from, s.to, s.value, false) ||
              l.push(ct.create(s.from, s.to, s.value)));
          s.next();
        }
      }
    }
    return u.finishInner(
      this.nextLayer.isEmpty && !l.length
        ? e.empty
        : this.nextLayer.update({
            add: l,
            filter: t_filter,
            filterFrom,
            filterTo,
          }),
    );
  }
  map(t) {
    if (t.empty || this.isEmpty) {
      return this;
    }
    let n = [];
    let r = [];
    let i = -1;
    let a;
    let o = (e, t, n) => {
      a ||= new pt();
      a.addRange(e, t, n, false);
    };
    for (let e = 0; e < this.chunk.length; e++) {
      let a = this.chunkPos[e];
      let s = this.chunk[e];
      let c = t.touchesRange(a, a + s.length);
      if (c === false) {
        i = Math.max(i, s.maxPoint);
        n.push(s);
        r.push(t.mapPos(a));
      } else if (c === true) {
        let [e, c] = n.length
          ? [dt(r) + dt(n).length, dt(dt(n).value).endSide]
          : [-1, -1];
        let { mapped, pos } = s.map(a, t, e, c, o);
        if (mapped) {
          i = Math.max(i, mapped.maxPoint);
          n.push(mapped);
          r.push(pos);
        }
      }
    }
    let s = this.nextLayer.map(t);
    if (a) {
      s = a.finishInner(s);
    }
    if (n.length == 0) {
      return s;
    }
    return new e(r, n, s || e.empty, i);
  }
  between(e, t, n) {
    if (!this.isEmpty) {
      for (let r = 0; r < this.chunk.length; r++) {
        let i = this.chunkPos[r];
        let a = this.chunk[r];
        if (
          t >= i &&
          e <= i + a.length &&
          a.between(i, e - i, t - i, n) === false
        ) {
          return;
        }
      }
      this.nextLayer.between(e, t, n);
    }
  }
  iter(e = 0) {
    return gt.from([this]).goto(e);
  }
  get isEmpty() {
    return this.nextLayer == this;
  }
  static iter(e, t = 0) {
    return gt.from(e).goto(t);
  }
  static compare(e, t, n, r, i = -1) {
    let a = e.filter((e) => e.maxPoint > 0 || (!e.isEmpty && e.maxPoint >= i));
    let o = t.filter((e) => e.maxPoint > 0 || (!e.isEmpty && e.maxPoint >= i));
    let s = mt(a, o, n);
    let c = new vt(a, s, i);
    let l = new vt(o, s, i);
    n.iterGaps((e, t, n) => yt(c, e, l, t, n, r));
    if (n.empty && n.length == 0) {
      yt(c, 0, l, 0, 0, r);
    }
  }
  static eq(e, t, n = 0, r) {
    r ??= 1000000000 - 1;
    let i = e.filter((e) => !e.isEmpty && t.indexOf(e) < 0);
    let a = t.filter((t) => !t.isEmpty && e.indexOf(t) < 0);
    if (i.length != a.length) {
      return false;
    }
    if (!i.length) {
      return true;
    }
    let o = mt(i, a);
    let s = new vt(i, o, 0).goto(n);
    let c = new vt(a, o, 0).goto(n);
    while (true) {
      if (
        s.to != c.to ||
        !bt(s.active, c.active) ||
        (s.point && (!c.point || !st(s.point, c.point)))
      ) {
        return false;
      }
      if (s.to > r) {
        return true;
      }
      s.next();
      c.next();
    }
  }
  static spans(e, t, n, r, i = -1) {
    let a = new vt(e, null, i).goto(t);
    let o = t;
    let a_openStart = a.openStart;
    while (true) {
      let e = Math.min(a.to, n);
      if (a.point) {
        let n = a.activeForPoint(a.to);
        let i =
          a.pointFrom < t
            ? n.length + 1
            : a.point.startSide < 0
              ? n.length
              : Math.min(n.length, a_openStart);
        r.point(o, e, a.point, n, i, a.pointRank);
        a_openStart = Math.min(a.openEnd(e), n.length);
      } else {
        if (e > o) {
          r.span(o, e, a.active, a_openStart);
          a_openStart = a.openEnd(e);
        }
      }
      if (a.to > n) {
        return a_openStart + (a.point && a.to > n ? 1 : 0);
      }
      o = a.to;
      a.next();
    }
  }
  static of(e, t = false) {
    let n = new pt();
    for (let r of e instanceof ct ? [e] : t ? ft(e) : e) {
      n.add(r.from, r.to, r.value);
    }
    return n.finish();
  }
  static join(t) {
    if (!t.length) {
      return e.empty;
    }
    let n = dt(t);
    for (let r = t.length - 2; r >= 0; r--) {
      for (let i = t[r]; i != e.empty; i = i.nextLayer) {
        n = new e(i.chunkPos, i.chunk, n, Math.max(i.maxPoint, n.maxPoint));
      }
    }
    return n;
  }
};
P.empty = new P([], [], null, -1);
function dt(e) {
  return e[e.length - 1];
}
function ft(e) {
  if (e.length > 1) {
    for (let t = e[0], n = 1; n < e.length; n++) {
      let r = e[n];
      if (lt(t, r) > 0) {
        return e.slice().sort(lt);
      }
      t = r;
    }
  }
  return e;
}
P.empty.nextLayer = P.empty;
var pt = class e {
  finishChunk(e) {
    this.chunks.push(new ut(this.from, this.to, this.value, this.maxPoint));
    this.chunkPos.push(this.chunkStart);
    this.chunkStart = -1;
    this.setMaxPoint = Math.max(this.setMaxPoint, this.maxPoint);
    this.maxPoint = -1;
    if (e) {
      this.from = [];
      this.to = [];
      this.value = [];
    }
  }
  constructor() {
    this.chunks = [];
    this.chunkPos = [];
    this.chunkStart = -1;
    this.last = null;
    this.lastFrom = -1000000000;
    this.lastTo = -1000000000;
    this.from = [];
    this.to = [];
    this.value = [];
    this.maxPoint = -1;
    this.setMaxPoint = -1;
    this.nextLayer = null;
  }
  add(e, t, n) {
    this.addRange(e, t, n, true);
  }
  addRange(t, n, r, i) {
    if (!this.addInner(t, n, r, i)) {
      (this.nextLayer ||= new e()).addRange(t, n, r, i);
    }
  }
  addInner(e, t, n, r) {
    let i = e - this.lastTo || n.startSide - this.last.endSide;
    if (
      r &&
      i <= 0 &&
      (e - this.lastFrom || n.startSide - this.last.startSide) < 0
    ) {
      throw Error(
        "Ranges must be added sorted by `from` position and `startSide`",
      );
    }
    if (i < 0) {
      return false;
    }
    return (
      this.from.length == 250 && this.finishChunk(true),
      this.chunkStart < 0 && (this.chunkStart = e),
      this.from.push(e - this.chunkStart),
      this.to.push(t - this.chunkStart),
      (this.last = n),
      (this.lastFrom = e),
      (this.lastTo = t),
      this.value.push(n),
      n.point && (this.maxPoint = Math.max(this.maxPoint, t - e)),
      true
    );
  }
  addChunk(e, t) {
    if ((e - this.lastTo || t.value[0].startSide - this.last.endSide) < 0) {
      return false;
    }
    if (this.from.length) {
      this.finishChunk(true);
    }
    this.setMaxPoint = Math.max(this.setMaxPoint, t.maxPoint);
    this.chunks.push(t);
    this.chunkPos.push(e);
    let n = t.value.length - 1;
    this.last = t.value[n];
    this.lastFrom = t.from[n] + e;
    this.lastTo = t.to[n] + e;
    return true;
  }
  finish() {
    return this.finishInner(P.empty);
  }
  finishInner(e) {
    if (this.from.length) {
      this.finishChunk(false);
    }
    if (this.chunks.length == 0) {
      return e;
    }
    let t = P.create(
      this.chunkPos,
      this.chunks,
      this.nextLayer ? this.nextLayer.finishInner(e) : e,
      this.setMaxPoint,
    );
    this.from = null;
    return t;
  }
};
function mt(e, t, n) {
  let r = new Map();
  for (let t of e) {
    for (let e = 0; e < t.chunk.length; e++) {
      if (t.chunk[e].maxPoint <= 0) {
        r.set(t.chunk[e], t.chunkPos[e]);
      }
    }
  }
  let i = new Set();
  for (let e of t) {
    for (let t = 0; t < e.chunk.length; t++) {
      let a = r.get(e.chunk[t]);
      if (
        a != null &&
        (n ? n.mapPos(a) : a) == e.chunkPos[t] &&
        !n?.touchesRange(a, a + e.chunk[t].length)
      ) {
        i.add(e.chunk[t]);
      }
    }
  }
  return i;
}
var ht = class {
  constructor(e, t, n, r = 0) {
    this.layer = e;
    this.skip = t;
    this.minPoint = n;
    this.rank = r;
  }
  get startSide() {
    if (this.value) {
      return this.value.startSide;
    }
    return 0;
  }
  get endSide() {
    if (this.value) {
      return this.value.endSide;
    }
    return 0;
  }
  goto(e, t = -1000000000) {
    this.chunkIndex = this.rangeIndex = 0;
    this.gotoInner(e, t, false);
    return this;
  }
  gotoInner(e, t, n) {
    while (this.chunkIndex < this.layer.chunk.length) {
      let t = this.layer.chunk[this.chunkIndex];
      if (!(
        (this.skip && this.skip.has(t)) ||
        this.layer.chunkEnd(this.chunkIndex) < e ||
        t.maxPoint < this.minPoint
      )) {
        break;
      }
      this.chunkIndex++;
      n = false;
    }
    if (this.chunkIndex < this.layer.chunk.length) {
      let r = this.layer.chunk[this.chunkIndex].findIndex(
        e - this.layer.chunkPos[this.chunkIndex],
        t,
        true,
      );
      if (!n || this.rangeIndex < r) {
        this.setRangeIndex(r);
      }
    }
    this.next();
  }
  forward(e, t) {
    if ((this.to - e || this.endSide - t) < 0) {
      this.gotoInner(e, t, true);
    }
  }
  next() {
    while (true) {
      if (this.chunkIndex == this.layer.chunk.length) {
        this.from = this.to = 1000000000;
        this.value = null;
        break;
      } else {
        let e = this.layer.chunkPos[this.chunkIndex];
        let t = this.layer.chunk[this.chunkIndex];
        let n = e + t.from[this.rangeIndex];
        this.from = n;
        this.to = e + t.to[this.rangeIndex];
        this.value = t.value[this.rangeIndex];
        this.setRangeIndex(this.rangeIndex + 1);
        if (
          this.minPoint < 0 ||
          (this.value.point && this.to - this.from >= this.minPoint)
        ) {
          break;
        }
      }
    }
  }
  setRangeIndex(e) {
    if (e == this.layer.chunk[this.chunkIndex].value.length) {
      this.chunkIndex++;
      if (this.skip) {
        while (
          this.chunkIndex < this.layer.chunk.length &&
          this.skip.has(this.layer.chunk[this.chunkIndex])
        ) {
          this.chunkIndex++;
        }
      }
      this.rangeIndex = 0;
    } else {
      this.rangeIndex = e;
    }
  }
  nextChunk() {
    this.chunkIndex++;
    this.rangeIndex = 0;
    this.next();
  }
  compare(e) {
    return (
      this.from - e.from ||
      this.startSide - e.startSide ||
      this.rank - e.rank ||
      this.to - e.to ||
      this.endSide - e.endSide
    );
  }
};
var gt = class e {
  constructor(e) {
    this.heap = e;
  }
  static from(t, n = null, r = -1) {
    let i = [];
    for (let e = 0; e < t.length; e++) {
      for (let a = t[e]; !a.isEmpty; a = a.nextLayer) {
        if (a.maxPoint >= r) {
          i.push(new ht(a, n, r, e));
        }
      }
    }
    if (i.length == 1) {
      return i[0];
    }
    return new e(i);
  }
  get startSide() {
    if (this.value) {
      return this.value.startSide;
    }
    return 0;
  }
  goto(e, t = -1000000000) {
    for (let n of this.heap) {
      n.goto(e, t);
    }
    for (let e = this.heap.length >> 1; e >= 0; e--) {
      _t(this.heap, e);
    }
    this.next();
    return this;
  }
  forward(e, t) {
    for (let n of this.heap) {
      n.forward(e, t);
    }
    for (let e = this.heap.length >> 1; e >= 0; e--) {
      _t(this.heap, e);
    }
    if ((this.to - e || this.value.endSide - t) < 0) {
      this.next();
    }
  }
  next() {
    if (this.heap.length == 0) {
      this.from = this.to = 1000000000;
      this.value = null;
      this.rank = -1;
    } else {
      let e = this.heap[0];
      this.from = e.from;
      this.to = e.to;
      this.value = e.value;
      this.rank = e.rank;
      if (e.value) {
        e.next();
      }
      _t(this.heap, 0);
    }
  }
};
function _t(heap, t) {
  for (let n = heap[t]; ;) {
    let r = (t << 1) + 1;
    if (r >= heap.length) {
      break;
    }
    let i = heap[r];
    if (r + 1 < heap.length && i.compare(heap[r + 1]) >= 0) {
      i = heap[r + 1];
      r++;
    }
    if (n.compare(i) < 0) {
      break;
    }
    heap[r] = n;
    heap[t] = i;
    t = r;
  }
}
var vt = class {
  constructor(e, t, n) {
    this.minPoint = n;
    this.active = [];
    this.activeTo = [];
    this.activeRank = [];
    this.minActive = -1;
    this.point = null;
    this.pointFrom = 0;
    this.pointRank = 0;
    this.to = -1000000000;
    this.endSide = 0;
    this.openStart = -1;
    this.cursor = gt.from(e, t, n);
  }
  goto(e, t = -1000000000) {
    this.cursor.goto(e, t);
    this.active.length = this.activeTo.length = this.activeRank.length = 0;
    this.minActive = -1;
    this.to = e;
    this.endSide = t;
    this.openStart = -1;
    this.next();
    return this;
  }
  forward(e, t) {
    while (
      this.minActive > -1 &&
      (this.activeTo[this.minActive] - e ||
        this.active[this.minActive].endSide - t) < 0
    ) {
      this.removeActive(this.minActive);
    }
    this.cursor.forward(e, t);
  }
  removeActive(e) {
    xt(this.active, e);
    xt(this.activeTo, e);
    xt(this.activeRank, e);
    this.minActive = Ct(this.active, this.activeTo);
  }
  addActive(e) {
    let t = 0;
    let { value, to, rank } = this.cursor;
    while (
      t < this.activeRank.length &&
      (rank - this.activeRank[t] || to - this.activeTo[t]) > 0
    ) {
      t++;
    }
    St(this.active, t, value);
    St(this.activeTo, t, to);
    St(this.activeRank, t, rank);
    if (e) {
      St(e, t, this.cursor.from);
    }
    this.minActive = Ct(this.active, this.activeTo);
  }
  next() {
    let e = this.to;
    let point = this.point;
    this.point = null;
    let n = this.openStart < 0 ? [] : null;
    while (true) {
      let r = this.minActive;
      if (
        r > -1 &&
        (this.activeTo[r] - this.cursor.from ||
          this.active[r].endSide - this.cursor.startSide) < 0
      ) {
        if (this.activeTo[r] > e) {
          this.to = this.activeTo[r];
          this.endSide = this.active[r].endSide;
          break;
        }
        this.removeActive(r);
        if (n) {
          xt(n, r);
        }
      } else if (!this.cursor.value) {
        this.to = this.endSide = 1000000000;
        break;
      } else if (this.cursor.from > e) {
        this.to = this.cursor.from;
        this.endSide = this.cursor.startSide;
        break;
      } else {
        let e = this.cursor.value;
        if (!e.point) {
          this.addActive(n);
          this.cursor.next();
        } else if (
          point &&
          this.cursor.to == this.to &&
          this.cursor.from < this.cursor.to
        ) {
          this.cursor.next();
        } else {
          this.point = e;
          this.pointFrom = this.cursor.from;
          this.pointRank = this.cursor.rank;
          this.to = this.cursor.to;
          this.endSide = e.endSide;
          this.cursor.next();
          this.forward(this.to, this.endSide);
          break;
        }
      }
    }
    if (n) {
      this.openStart = 0;
      for (let t = n.length - 1; t >= 0 && n[t] < e; t--) {
        this.openStart++;
      }
    }
  }
  activeForPoint(e) {
    if (!this.active.length) {
      return this.active;
    }
    let t = [];
    for (
      let n = this.active.length - 1;
      n >= 0 && !(this.activeRank[n] < this.pointRank);
      n--
    ) {
      if (
        this.activeTo[n] > e ||
        (this.activeTo[n] == e && this.active[n].endSide >= this.point.endSide)
      ) {
        t.push(this.active[n]);
      }
    }
    return t.reverse();
  }
  openEnd(e) {
    let t = 0;
    for (
      let n = this.activeTo.length - 1;
      n >= 0 && this.activeTo[n] > e;
      n--
    ) {
      t++;
    }
    return t;
  }
};
function yt(e, t, n, r, i, a) {
  e.goto(t);
  n.goto(r);
  let o = r + i;
  let s = r;
  let c = r - t;
  let l = !!a.boundChange;
  for (let t = false; ;) {
    let r = e.to + c - n.to;
    let i = r || e.endSide - n.endSide;
    let u = i < 0 ? e.to + c : n.to;
    let d = Math.min(u, o);
    if (e.point || n.point) {
      if (!(
        e.point &&
        n.point &&
        st(e.point, n.point) &&
        bt(e.activeForPoint(e.to), n.activeForPoint(n.to))
      )) {
        a.comparePoint(s, d, e.point, n.point);
      }
      t = false;
    } else {
      t &&= (a.boundChange(s), false);
      if (d > s && !bt(e.active, n.active)) {
        a.compareRange(s, d, e.active, n.active);
      }
      if (l && d < o && (r || e.openEnd(u) != n.openEnd(u))) {
        t = true;
      }
    }
    if (u > o) {
      break;
    }
    s = u;
    if (i <= 0) {
      e.next();
    }
    if (i >= 0) {
      n.next();
    }
  }
}
function bt(e, t) {
  if (e.length != t.length) {
    return false;
  }
  for (let n = 0; n < e.length; n++) {
    if (e[n] != t[n] && !st(e[n], t[n])) {
      return false;
    }
  }
  return true;
}
function xt(e, t) {
  for (let n = t, r = e.length - 1; n < r; n++) {
    e[n] = e[n + 1];
  }
  e.pop();
}
function St(e, t, n) {
  for (let n = e.length - 1; n >= t; n--) {
    e[n + 1] = e[n];
  }
  e[t] = n;
}
function Ct(active, activeTo) {
  let n = -1;
  let r = 1000000000;
  for (let i = 0; i < activeTo.length; i++) {
    if ((activeTo[i] - r || active[i].endSide - active[n].endSide) < 0) {
      n = i;
      r = activeTo[i];
    }
  }
  return n;
}
function wt(e, t, n = e.length) {
  let r = 0;
  for (let i = 0; i < n && i < e.length;) {
    if (e.charCodeAt(i) == 9) {
      r += t - (r % t);
      i++;
    } else {
      r++;
      i = C(e, i);
    }
  }
  return r;
}
function Tt(e, t, tabSize, r) {
  for (let r = 0, i = 0; ;) {
    if (i >= t) {
      return r;
    }
    if (r == e.length) {
      break;
    }
    i += e.charCodeAt(r) == 9 ? tabSize - (i % tabSize) : 1;
    r = C(e, r);
  }
  if (r === true) {
    return -1;
  }
  return e.length;
}
const Et = `ͼ`;
const Dt = typeof Symbol > `u` ? `__ͼ` : Symbol.for(Et);
const Ot =
  typeof Symbol > `u`
    ? `__styleSet` + Math.floor(Math.random() * 100000000)
    : Symbol(`styleSet`);
const kt =
  typeof globalThis < `u` ? globalThis : typeof window < `u` ? window : {};
class At {
  constructor(e, t) {
    this.rules = [];
    let { finish } = t || {};
    function r(e) {
      if (/^@/.test(e)) {
        return [e];
      }
      return e.split(/,\s*/);
    }
    function i(e, t, a, o) {
      let s = [];
      let c = /^@(\w+)\b/.exec(e[0]);
      let l = c && c[1] == `keyframes`;
      if (c && t == null) {
        return a.push(e[0] + `;`);
      }
      for (let n in t) {
        let o = t[n];
        if (/&/.test(n)) {
          i(
            n
              .split(/,\s*/)
              .map((t) => e.map((e) => t.replace(/&/, e)))
              .reduce((acc, item) => acc.concat(item)),
            o,
            a,
          );
        } else if (o && typeof o == `object`) {
          if (!c) {
            throw RangeError(
              `The value of a property (` +
                n +
                `) should be a primitive value.`,
            );
          }
          i(r(n), o, s, l);
        } else {
          if (o != null) {
            s.push(
              n
                .replace(/_.*/, ``)
                .replace(/[A-Z]/g, (e) => `-` + e.toLowerCase()) +
                `: ` +
                o +
                `;`,
            );
          }
        }
      }
      if (s.length || l) {
        a.push(
          (finish && !c && !o ? e.map(finish) : e).join(`, `) +
            ` {` +
            s.join(` `) +
            `}`,
        );
      }
    }
    for (let t in e) {
      i(r(t), e[t], this.rules);
    }
  }
  getRules() {
    return this.rules.join(`
`);
  }
  static newName() {
    let e = kt[Dt] || 1;
    kt[Dt] = e + 1;
    return Et + e.toString(36);
  }
  static mount(e, t, n) {
    let r = e[Ot];
    let i = n && n.nonce;
    if (r) {
      if (i) {
        r.setNonce(i);
      }
    } else {
      r = new Mt(e, i);
    }
    r.mount(Array.isArray(t) ? t : [t], e);
  }
}
const jt = new Map();
var Mt = class {
  constructor(e, t) {
    let n = e.ownerDocument || e;
    let r = n.defaultView;
    if (!e.head && e.adoptedStyleSheets && r.CSSStyleSheet) {
      let t = jt.get(n);
      if (t) {
        return (e[Ot] = t);
      }
      this.sheet = new r.CSSStyleSheet();
      jt.set(n, this);
    } else {
      this.styleTag = n.createElement(`style`);
      if (t) {
        this.styleTag.setAttribute(`nonce`, t);
      }
    }
    this.modules = [];
    e[Ot] = this;
  }
  mount(e, t) {
    let sheet = this.sheet;
    let r = 0;
    let i = 0;
    let a = false;
    for (const o of e) {
      let s = this.modules.indexOf(o);
      if (s < i && s > -1) {
        this.modules.splice(s, 1);
        a = true;
        i--;
        s = -1;
      }
      if (s == -1) {
        this.modules.splice(i++, 0, o);
        a = true;
        if (sheet) {
          for (let e = 0; e < o.rules.length; e++) {
            sheet.insertRule(o.rules[e], r++);
          }
        }
      } else {
        while (i < s) {
          r += this.modules[i++].rules.length;
        }
        r += o.rules.length;
        i++;
      }
    }
    if (sheet) {
      if (t.adoptedStyleSheets.indexOf(this.sheet) < 0) {
        t.adoptedStyleSheets = [this.sheet, ...t.adoptedStyleSheets];
      }
    } else {
      if (a) {
        let e = ``;
        for (let t = 0; t < this.modules.length; t++) {
          e +=
            this.modules[t].getRules() +
            `
`;
        }
        this.styleTag.textContent = e;
      }
      let e = t.head || t;
      if (this.styleTag.parentNode != e) {
        e.insertBefore(this.styleTag, e.firstChild);
      }
    }
  }
  setNonce(e) {
    if (this.styleTag && this.styleTag.getAttribute(`nonce`) != e) {
      this.styleTag.setAttribute(`nonce`, e);
    }
  }
};
const Nt = {
  8: `Backspace`,
  9: `Tab`,
  10: `Enter`,
  12: `NumLock`,
  13: `Enter`,
  16: `Shift`,
  17: `Control`,
  18: `Alt`,
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
  44: `PrintScreen`,
  45: `Insert`,
  46: `Delete`,
  59: `;`,
  61: `=`,
  91: `Meta`,
  92: `Meta`,
  106: `*`,
  107: `+`,
  108: `,`,
  109: `-`,
  110: `.`,
  111: `/`,
  144: `NumLock`,
  145: `ScrollLock`,
  160: `Shift`,
  161: `Shift`,
  162: `Control`,
  163: `Control`,
  164: `Alt`,
  165: `Alt`,
  173: `-`,
  186: `;`,
  187: `=`,
  188: `,`,
  189: `-`,
  190: `.`,
  191: `/`,
  192: "`",
  219: `[`,
  220: `\\`,
  221: `]`,
  222: `'`,
};
const Pt = {
  48: `)`,
  49: `!`,
  50: `@`,
  51: `#`,
  52: `$`,
  53: `%`,
  54: `^`,
  55: `&`,
  56: `*`,
  57: `(`,
  59: `:`,
  61: `+`,
  173: `_`,
  186: `:`,
  187: `+`,
  188: `<`,
  189: `_`,
  190: `>`,
  191: `?`,
  192: `~`,
  219: `{`,
  220: `|`,
  221: `}`,
  222: `"`,
};
const Ft = typeof navigator < `u` && /Mac/.test(navigator.platform);
const It =
  typeof navigator < `u` &&
  /MSIE \d|Trident\/(?:[7-9]|\d{2,})\..*rv:(\d+)/.exec(navigator.userAgent);
for (var F = 0; F < 10; F++) {
  Nt[48 + F] = Nt[96 + F] = String(F);
}
for (var F = 1; F <= 24; F++) {
  Nt[F + 111] = `F` + F;
}
for (var F = 65; F <= 90; F++) {
  Nt[F] = String.fromCharCode(F + 32);
  Pt[F] = String.fromCharCode(F);
}
for (const Lt in Nt) {
  if (!Pt.hasOwnProperty(Lt)) {
    Pt[Lt] = Nt[Lt];
  }
}
function Rt(e) {
  let t =
    (!(
      (Ft && e.metaKey && e.shiftKey && !e.ctrlKey && !e.altKey) ||
      (It && e.shiftKey && e.key && e.key.length == 1) ||
      e.key == `Unidentified`
    ) &&
      e.key) ||
    (e.shiftKey ? Pt : Nt)[e.keyCode] ||
    e.key ||
    `Unidentified`;
  if (t == `Esc`) {
    t = `Escape`;
  }
  if (t == `Del`) {
    t = `Delete`;
  }
  if (t == `Left`) {
    t = `ArrowLeft`;
  }
  if (t == `Up`) {
    t = `ArrowUp`;
  }
  if (t == `Right`) {
    t = `ArrowRight`;
  }
  if (t == `Down`) {
    t = `ArrowDown`;
  }
  return t;
}
function I(e, n) {
  if (typeof e == `string`) {
    e = document.createElement(e);
  }
  let t = 1;
  if (n && typeof n == `object` && n.nodeType == null && !Array.isArray(n)) {
    for (const r in n) {
      if (Object.prototype.hasOwnProperty.call(n, r)) {
        const i = n[r];
        if (typeof i == `string`) {
          e.setAttribute(r, i);
        } else if (i != null) {
          e[r] = i;
        }
      }
    }
    t++;
  }
  for (; t < arguments.length; t++) {
    zt(e, arguments[t]);
  }
  return e;
}
function zt(e, t) {
  if (typeof t == `string`) {
    e.appendChild(document.createTextNode(t));
  } else if (t != null) {
    if (t.nodeType != null) {
      e.appendChild(t);
    } else if (Array.isArray(t)) {
      for (let n = 0; n < t.length; n++) {
        zt(e, t[n]);
      }
    } else {
      throw RangeError(`Unsupported child node: ` + t);
    }
  }
}
const Bt =
  typeof navigator < `u`
    ? navigator
    : {
        userAgent: ``,
        vendor: ``,
        platform: ``,
      };
const Vt =
  typeof document < `u`
    ? document
    : {
        documentElement: {
          style: {},
        },
      };
const Ht = /Edge\/(\d+)/.exec(Bt.userAgent);
const Ut = /MSIE \d/.test(Bt.userAgent);
const Wt = /Trident\/(?:[7-9]|\d{2,})\..*rv:(\d+)/.exec(Bt.userAgent);
const ie_1 = !!(Ut || Wt || Ht);
const gecko = !ie_1 && /gecko\/(\d+)/i.test(Bt.userAgent);
const qt = !ie_1 && /Chrome\/(\d+)/.exec(Bt.userAgent);
const webkit = `webkitFontSmoothing` in Vt.documentElement.style;
const safari = !ie_1 && /Apple Computer/.test(Bt.vendor);
const ios =
  safari && (/Mobile\/\w+/.test(Bt.userAgent) || Bt.maxTouchPoints > 2);
const L = {
  mac: ios || /Mac/.test(Bt.platform),
  windows: /Win/.test(Bt.platform),
  linux: /Linux|X11/.test(Bt.platform),
  ie: ie_1,
  ie_version: Ut ? Vt.documentMode || 6 : Wt ? +Wt[1] : Ht ? +Ht[1] : 0,
  gecko,
  gecko_version: gecko
    ? +(/Firefox\/(\d+)/.exec(Bt.userAgent) || [0, 0])[1]
    : 0,
  chrome: !!qt,
  chrome_version: qt ? +qt[1] : 0,
  ios,
  android: /Android\b/.test(Bt.userAgent),
  webkit,
  webkit_version: webkit
    ? +(/\bAppleWebKit\/(\d+)/.exec(Bt.userAgent) || [0, 0])[1]
    : 0,
  safari,
  safari_version: safari
    ? +(/\bVersion\/(\d+(\.\d+)?)/.exec(Bt.userAgent) || [0, 0])[1]
    : 0,
  tabSize:
    Vt.documentElement.style.tabSize == null ? `-moz-tab-size` : `tab-size`,
};
function Zt(e, t) {
  for (let n in e) {
    if (n == `class` && t.class) {
      t.class += ` ` + e.class;
    } else if (n == `style` && t.style) {
      t.style += `;` + e.style;
    } else {
      t[n] = e[n];
    }
  }
  return t;
}
const Qt = Object.create(null);
function $t(e, t, n) {
  if (e == t) {
    return true;
  }
  e ||= Qt;
  t ||= Qt;
  let r = Object.keys(e);
  let i = Object.keys(t);
  if (
    r.length - (n && r.indexOf(n) > -1 ? 1 : 0) !=
    i.length - (n && i.indexOf(n) > -1 ? 1 : 0)
  ) {
    return false;
  }
  for (let a of r) {
    if (a != n && (i.indexOf(a) == -1 || e[a] !== t[a])) {
      return false;
    }
  }
  return true;
}
function en(dom, t) {
  for (let n = dom.attributes.length - 1; n >= 0; n--) {
    let r = dom.attributes[n].name;
    t[r] ?? dom.removeAttribute(r);
  }
  for (let n in t) {
    let r = t[n];
    if (n == `style`) {
      dom.style.cssText = r;
    } else if (dom.getAttribute(n) != r) {
      dom.setAttribute(n, r);
    }
  }
}
function tn(e, t, n) {
  let r = false;
  if (t) {
    for (let i in t) {
      if (!(n && i in n)) {
        r = true;
        if (i == `style`) {
          e.style.cssText = ``;
        } else {
          e.removeAttribute(i);
        }
      }
    }
  }
  if (n) {
    for (let i in n) {
      if (!(t && t[i] == n[i])) {
        r = true;
        if (i == `style`) {
          e.style.cssText = n[i];
        } else {
          e.setAttribute(i, n[i]);
        }
      }
    }
  }
  return r;
}
function nn(e) {
  let t = Object.create(null);
  for (let n = 0; n < e.attributes.length; n++) {
    let attribute = e.attributes[n];
    t[attribute.name] = attribute.value;
  }
  return t;
}
class rn {
  eq(e) {
    return false;
  }
  updateDOM(e, t, n) {
    return false;
  }
  compare(e) {
    return this == e || (this.constructor == e.constructor && this.eq(e));
  }
  get estimatedHeight() {
    return -1;
  }
  get lineBreaks() {
    return 0;
  }
  ignoreEvent(e) {
    return true;
  }
  coordsAt(e, t, n) {
    return null;
  }
  get isHidden() {
    return false;
  }
  get editable() {
    return false;
  }
  destroy(e) {}
}
var R = ((e) => {
  e[(e.Text = 0)] = `Text`;
  e[(e.WidgetBefore = 1)] = `WidgetBefore`;
  e[(e.WidgetAfter = 2)] = `WidgetAfter`;
  e[(e.WidgetRange = 3)] = `WidgetRange`;
  return e;
})((R ||= {}));
class z extends ot {
  constructor(e, t, n, r) {
    super();
    this.startSide = e;
    this.endSide = t;
    this.widget = n;
    this.spec = r;
  }
  get heightRelevant() {
    return false;
  }
  static mark(e) {
    return new an(e);
  }
  static widget(e) {
    let t = Math.max(-10000, Math.min(10000, e.side || 0));
    let n = !!e.block;
    t +=
      n && !e.inlineOrder
        ? t > 0
          ? 300000000
          : -400000000
        : t > 0
          ? 100000000
          : -100000000;
    return new sn(e, t, t, n, e.widget || null, false);
  }
  static replace(e) {
    let t = !!e.block;
    let n;
    let r;
    if (e.isBlockGap) {
      n = -500000000;
      r = 400000000;
    } else {
      let { start, end } = cn(e, t);
      n = (start ? (t ? -300000000 : -1) : 500000000) - 1;
      r = (end ? (t ? 200000000 : 1) : -600000000) + 1;
    }
    return new sn(e, n, r, t, e.widget || null, true);
  }
  static line(e) {
    return new on(e);
  }
  static set(e, t = false) {
    return P.of(e, t);
  }
  hasHeight() {
    if (this.widget) {
      return this.widget.estimatedHeight > -1;
    }
    return false;
  }
}
z.none = P.empty;
var an = class e extends z {
  constructor(e) {
    let { start, end } = cn(e);
    super(start ? -1 : 500000000, end ? 1 : -600000000, null, e);
    this.tagName = e.tagName || `span`;
    this.attrs =
      e.class && e.attributes
        ? Zt(e.attributes, {
            class: e.class,
          })
        : e.class
          ? {
              class: e.class,
            }
          : e.attributes || Qt;
  }
  eq(t) {
    return (
      this == t ||
      (t instanceof e && this.tagName == t.tagName && $t(this.attrs, t.attrs))
    );
  }
  range(e, t = e) {
    if (e >= t) {
      throw RangeError(`Mark decorations may not be empty`);
    }
    return super.range(e, t);
  }
};
an.prototype.point = false;
var on = class e extends z {
  constructor(e) {
    super(-200000000, -200000000, null, e);
  }
  eq(t) {
    return (
      t instanceof e &&
      this.spec.class == t.spec.class &&
      $t(this.spec.attributes, t.spec.attributes)
    );
  }
  range(e, t = e) {
    if (t != e) {
      throw RangeError(`Line decoration ranges must be zero-length`);
    }
    return super.range(e, t);
  }
};
on.prototype.mapMode = T.TrackBefore;
on.prototype.point = true;
var sn = class e extends z {
  constructor(e, t, n, r, i, a) {
    super(t, n, i, e);
    this.block = r;
    this.isReplace = a;
    this.mapMode = r ? (t <= 0 ? T.TrackBefore : T.TrackAfter) : T.TrackDel;
  }
  get type() {
    if (this.startSide == this.endSide) {
      if (this.startSide <= 0) {
        return R.WidgetBefore;
      }
      return R.WidgetAfter;
    }
    return R.WidgetRange;
  }
  get heightRelevant() {
    return (
      this.block ||
      (!!this.widget &&
        (this.widget.estimatedHeight >= 5 || this.widget.lineBreaks > 0))
    );
  }
  eq(t) {
    return (
      t instanceof e &&
      ln(this.widget, t.widget) &&
      this.block == t.block &&
      this.startSide == t.startSide &&
      this.endSide == t.endSide
    );
  }
  range(e, t = e) {
    if (
      this.isReplace &&
      (e > t || (e == t && this.startSide > 0 && this.endSide <= 0))
    ) {
      throw RangeError(`Invalid range for replacement decoration`);
    }
    if (!this.isReplace && t != e) {
      throw RangeError(`Widget decorations can only have zero-length ranges`);
    }
    return super.range(e, t);
  }
};
sn.prototype.point = true;
function cn(e, t = false) {
  let { inclusiveStart, inclusiveEnd } = e;
  inclusiveStart ??= e.inclusive;
  inclusiveEnd ??= e.inclusive;
  return {
    start: inclusiveStart ?? t,
    end: inclusiveEnd ?? t,
  };
}
function ln(widget, t) {
  return widget == t || !!(widget && t && widget.compare(t));
}
function un(e, t, changes, r = 0) {
  let i = changes.length - 1;
  if (i >= 0 && changes[i] + r >= e) {
    changes[i] = Math.max(changes[i], t);
  } else {
    changes.push(e, t);
  }
}
const dn = class e extends ot {
  constructor(e, t, n) {
    super();
    this.tagName = e;
    this.attributes = t;
    this.rank = n;
  }
  eq(t) {
    return (
      t == this ||
      (t instanceof e &&
        this.tagName == t.tagName &&
        $t(this.attributes, t.attributes))
    );
  }
  static create(t) {
    return new e(
      t.tagName,
      t.attributes || Qt,
      t.rank == null ? 50 : Math.max(0, Math.min(t.rank, 100)),
    );
  }
  static set(e, t = false) {
    return P.of(e, t);
  }
};
dn.prototype.startSide = dn.prototype.endSide = -1;
function fn(root) {
  let t;
  t =
    root.nodeType == 11
      ? root.getSelection
        ? root
        : root.ownerDocument
      : root;
  return t.getSelection();
}
function pn(e, t) {
  if (t) {
    return e == t || e.contains(t.nodeType == 1 ? t : t.parentNode);
  }
  return false;
}
function mn(e, t) {
  if (!t.anchorNode) {
    return false;
  }
  try {
    return pn(e, t.anchorNode);
  } catch {
    return false;
  }
}
function hn(e) {
  if (e.nodeType == 3) {
    return Mn(e, 0, e.nodeValue.length).getClientRects();
  }
  if (e.nodeType == 1) {
    return e.getClientRects();
  }
  return [];
}
function gn(e, t, n, r) {
  if (n) {
    return yn(e, t, n, r, -1) || yn(e, t, n, r, 1);
  }
  return false;
}
function _n(e) {
  for (let t = 0; ; t++) {
    e = e.previousSibling;
    if (!e) {
      return t;
    }
  }
}
function vn(e) {
  return (
    e.nodeType == 1 &&
    /^(DIV|P|LI|UL|OL|BLOCKQUOTE|DD|DT|H\d|SECTION|PRE)$/.test(e.nodeName)
  );
}
function yn(e, t, n, r, i) {
  while (true) {
    if (e == n && t == r) {
      return true;
    }
    if (t == (i < 0 ? 0 : bn(e))) {
      if (e.nodeName == `DIV`) {
        return false;
      }
      let n = e.parentNode;
      if (!n || n.nodeType != 1) {
        return false;
      }
      t = _n(e) + (i < 0 ? 0 : 1);
      e = n;
    } else if (e.nodeType == 1) {
      e = e.childNodes[t + (i < 0 ? -1 : 0)];
      if (e.nodeType == 1 && e.contentEditable == `false`) {
        return false;
      }
      t = i < 0 ? bn(e) : 0;
    } else {
      return false;
    }
  }
}
function bn(e) {
  if (e.nodeType == 3) {
    return e.nodeValue.length;
  }
  return e.childNodes.length;
}
function xn(e, t) {
  let { left, right } = e;
  if (left == right) {
    return e;
  }
  let i = t ? left : right;
  return {
    left: i,
    right: i,
    top: e.top,
    bottom: e.bottom,
  };
}
function Sn(e) {
  let e_visualViewport = e.visualViewport;
  if (e_visualViewport) {
    return {
      left: 0,
      right: e_visualViewport.width,
      top: 0,
      bottom: e_visualViewport.height,
    };
  }
  return {
    left: 0,
    right: e.innerWidth,
    top: 0,
    bottom: e.innerHeight,
  };
}
function Cn(e, t) {
  let n = t.width / e.offsetWidth;
  let r = t.height / e.offsetHeight;
  if (
    (n > 0.995 && n < 1.005) ||
    !isFinite(n) ||
    Math.abs(t.width - e.offsetWidth) < 1
  ) {
    n = 1;
  }
  if (
    (r > 0.995 && r < 1.005) ||
    !isFinite(r) ||
    Math.abs(t.height - e.offsetHeight) < 1
  ) {
    r = 1;
  }
  return {
    scaleX: n,
    scaleY: r,
  };
}
function wn(scrollDOM, t, n, r, i, a, o, s) {
  let e_ownerDocument = scrollDOM.ownerDocument;
  let l = e_ownerDocument.defaultView || window;
  for (let u = scrollDOM, d = false; u && !d;) {
    if (u.nodeType == 1) {
      let e;
      let f = u == e_ownerDocument.body;
      let p = 1;
      let m = 1;
      if (f) {
        e = Sn(l);
      } else {
        if (/^(fixed|sticky)$/.test(getComputedStyle(u).position)) {
          d = true;
        }
        if (
          u.scrollHeight <= u.clientHeight &&
          u.scrollWidth <= u.clientWidth
        ) {
          u = u.assignedSlot || u.parentNode;
          continue;
        }
        let t = u.getBoundingClientRect();
        ({ scaleX: p, scaleY: m } = Cn(u, t));
        e = {
          left: t.left,
          right: t.left + u.clientWidth * p,
          top: t.top,
          bottom: t.top + u.clientHeight * m,
        };
      }
      let h = 0;
      let g = 0;
      if (i == `nearest`) {
        if (t.top < e.top + o) {
          g = t.top - (e.top + o);
          if (n > 0 && t.bottom > e.bottom + g) {
            g = t.bottom - e.bottom + o;
          }
        } else if (t.bottom > e.bottom - o) {
          g = t.bottom - e.bottom + o;
          if (n < 0 && t.top - g < e.top) {
            g = t.top - (e.top + o);
          }
        }
      } else {
        let r = t.bottom - t.top;
        let a = e.bottom - e.top;
        g =
          (i == `center` && r <= a
            ? t.top + r / 2 - a / 2
            : i == `start` || (i == `center` && n < 0)
              ? t.top - o
              : t.bottom - a + o) - e.top;
      }
      if (r == `nearest`) {
        if (t.left < e.left + a) {
          h = t.left - (e.left + a);
          if (n > 0 && t.right > e.right + h) {
            h = t.right - e.right + a;
          }
        } else if (t.right > e.right - a) {
          h = t.right - e.right + a;
          if (n < 0 && t.left < e.left + h) {
            h = t.left - (e.left + a);
          }
        }
      } else {
        h =
          (r == `center`
            ? t.left + (t.right - t.left) / 2 - (e.right - e.left) / 2
            : (r == `start`) == s
              ? t.left - a
              : t.right - (e.right - e.left) + a) - e.left;
      }
      if (h || g) {
        if (f) {
          l.scrollBy(h, g);
        } else {
          let e = 0;
          let n = 0;
          if (g) {
            let e = u.scrollTop;
            u.scrollTop += g / m;
            n = (u.scrollTop - e) * m;
          }
          if (h) {
            let t = u.scrollLeft;
            u.scrollLeft += h / p;
            e = (u.scrollLeft - t) * p;
          }
          t = {
            left: t.left - e,
            top: t.top - n,
            right: t.right - e,
            bottom: t.bottom - n,
          };
          if (e && Math.abs(e - h) < 1) {
            r = `nearest`;
          }
          if (n && Math.abs(n - g) < 1) {
            i = `nearest`;
          }
        }
      }
      if (f) {
        break;
      }
      if (
        t.top < e.top ||
        t.bottom > e.bottom ||
        t.left < e.left ||
        t.right > e.right
      ) {
        t = {
          left: Math.max(t.left, e.left),
          right: Math.min(t.right, e.right),
          top: Math.max(t.top, e.top),
          bottom: Math.min(t.bottom, e.bottom),
        };
      }
      u = u.assignedSlot || u.parentNode;
    } else if (u.nodeType == 11) {
      u = u.host;
    } else {
      break;
    }
  }
}
function Tn(contentDOM, t = true) {
  let e_ownerDocument = contentDOM.ownerDocument;
  let r = null;
  let i = null;
  for (
    let a = contentDOM.parentNode;
    a && !(a == e_ownerDocument.body || ((!t || r) && i));
  ) {
    if (a.nodeType == 1) {
      if (!i && a.scrollHeight > a.clientHeight) {
        i = a;
      }
      if (t && !r && a.scrollWidth > a.clientWidth) {
        r = a;
      }
      a = a.assignedSlot || a.parentNode;
    } else if (a.nodeType == 11) {
      a = a.host;
    } else {
      break;
    }
  }
  return {
    x: r,
    y: i,
  };
}
class En {
  constructor() {
    this.anchorNode = null;
    this.anchorOffset = 0;
    this.focusNode = null;
    this.focusOffset = 0;
  }
  eq(e) {
    return (
      this.anchorNode == e.anchorNode &&
      this.anchorOffset == e.anchorOffset &&
      this.focusNode == e.focusNode &&
      this.focusOffset == e.focusOffset
    );
  }
  setRange(e) {
    let { anchorNode, focusNode } = e;
    this.set(
      anchorNode,
      Math.min(e.anchorOffset, anchorNode ? bn(anchorNode) : 0),
      focusNode,
      Math.min(e.focusOffset, focusNode ? bn(focusNode) : 0),
    );
  }
  set(e, t, n, r) {
    this.anchorNode = e;
    this.anchorOffset = t;
    this.focusNode = n;
    this.focusOffset = r;
  }
}
function Dn(e) {
  let t = [];
  for (let n = e; n; n = n.nodeType == 11 ? n.host : n.parentNode) {
    if (n.nodeType == 1) {
      t.push({
        node: n,
        left: n.scrollLeft,
        top: n.scrollTop,
      });
    }
  }
  return t;
}
function On(e, t = true) {
  for (let { node, left, top } of e) {
    if (t && node.scrollTop != top) {
      node.scrollTop = top;
    }
    if (node.scrollLeft != left) {
      node.scrollLeft = left;
    }
  }
}
let kn = null;
if (L.safari && L.safari_version >= 26) {
  kn = false;
}
function An(contentDOM) {
  if (contentDOM.setActive) {
    return contentDOM.setActive();
  }
  if (kn) {
    return contentDOM.focus(kn);
  }
  let t = Dn(contentDOM);
  contentDOM.focus(
    kn == null
      ? {
          get preventScroll() {
            kn = {
              preventScroll: true,
            };
            return true;
          },
        }
      : undefined,
  );
  if (!kn) {
    kn = false;
    On(t);
  }
}
let jn;
function Mn(e, t, n = t) {
  let r = (jn ||= document.createRange());
  r.setEnd(e, n);
  r.setStart(e, t);
  return r;
}
function Nn(e, t, n, r) {
  let i = {
    key: t,
    code: t,
    keyCode: n,
    which: n,
    cancelable: true,
  };
  if (r) {
    ({
      altKey: i.altKey,
      ctrlKey: i.ctrlKey,
      shiftKey: i.shiftKey,
      metaKey: i.metaKey,
    } = r);
  }
  let a = new KeyboardEvent(`keydown`, i);
  a.synthetic = true;
  e.dispatchEvent(a);
  let o = new KeyboardEvent(`keyup`, i);
  o.synthetic = true;
  e.dispatchEvent(o);
  return a.defaultPrevented || o.defaultPrevented;
}
function Pn(e) {
  while (e) {
    if (e && (e.nodeType == 9 || (e.nodeType == 11 && e.host))) {
      return e;
    }
    e = e.assignedSlot || e.parentNode;
  }
  return null;
}
function Fn(dom, t) {
  let t_focusNode = t.focusNode;
  let t_focusOffset = t.focusOffset;
  if (
    !t_focusNode ||
    t.anchorNode != t_focusNode ||
    t.anchorOffset != t_focusOffset
  ) {
    return false;
  }
  for (t_focusOffset = Math.min(t_focusOffset, bn(t_focusNode)); ;) {
    if (t_focusOffset) {
      if (t_focusNode.nodeType != 1) {
        return false;
      }
      let e = t_focusNode.childNodes[t_focusOffset - 1];
      if (e.contentEditable == `false`) {
        t_focusOffset--;
      } else {
        t_focusNode = e;
        t_focusOffset = bn(t_focusNode);
      }
    } else if (t_focusNode == dom) {
      return true;
    } else {
      t_focusOffset = _n(t_focusNode);
      t_focusNode = t_focusNode.parentNode;
    }
  }
}
function In(e) {
  if (e instanceof Window) {
    return (
      e.pageYOffset >
      Math.max(0, e.document.documentElement.scrollHeight - e.innerHeight - 4)
    );
  }
  return e.scrollTop > Math.max(1, e.scrollHeight - e.clientHeight - 4);
}
function Ln(e, t) {
  for (let n = e, r = t; ;) {
    if (n.nodeType == 3 && r > 0) {
      return {
        node: n,
        offset: r,
      };
    } else if (n.nodeType == 1 && r > 0) {
      if (n.contentEditable == `false`) {
        return null;
      }
      n = n.childNodes[r - 1];
      r = bn(n);
    } else if (n.parentNode && !vn(n)) {
      r = _n(n);
      n = n.parentNode;
    } else {
      return null;
    }
  }
}
function Rn(e, t) {
  for (let n = e, r = t; ;) {
    if (n.nodeType == 3 && r < n.nodeValue.length) {
      return {
        node: n,
        offset: r,
      };
    } else if (n.nodeType == 1 && r < n.childNodes.length) {
      if (n.contentEditable == `false`) {
        return null;
      }
      n = n.childNodes[r];
      r = 0;
    } else if (n.parentNode && !vn(n)) {
      r = _n(n) + 1;
      n = n.parentNode;
    } else {
      return null;
    }
  }
}
const zn = class e {
  constructor(e, t, n = true) {
    this.node = e;
    this.offset = t;
    this.precise = n;
  }
  static before(t, n) {
    return new e(t.parentNode, _n(t), n);
  }
  static after(t, n) {
    return new e(t.parentNode, _n(t) + 1, n);
  }
};
var B = ((e) => {
  e[(e.LTR = 0)] = `LTR`;
  e[(e.RTL = 1)] = `RTL`;
  return e;
})((B ||= {}));
const { LTR, RTL } = B;
function Hn(e) {
  let t = [];
  for (let n = 0; n < e.length; n++) {
    t.push(1 << e[n]);
  }
  return t;
}
const Un = Hn(
  `88888888888888888888888888888888888666888888787833333333337888888000000000000000000000000008888880000000000000000000000000088888888888888888888888888888888888887866668888088888663380888308888800000000000000000000000800000000000000000000000000000008`,
);
const Wn = Hn(
  `4444448826627288999999999992222222222222222222222222222222222222222222222229999999999999999999994444444444644222822222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222999999949999999229989999223333333333`,
);
const Gn = Object.create(null);
const Kn = [];
for (let e of [`()`, `[]`, `{}`]) {
  let t = e.charCodeAt(0);
  let n = e.charCodeAt(1);
  Gn[t] = n;
  Gn[n] = -t;
}
function qn(e) {
  if (e <= 247) {
    return Un[e];
  }
  if (e >= 1424 && e <= 1524) {
    return 2;
  }
  if (e >= 1536 && e <= 1785) {
    return Wn[e - 1536];
  }
  if (e >= 1774 && e <= 2220) {
    return 4;
  }
  if (e >= 8192 && e <= 8204) {
    return 256;
  }
  if (e >= 64336 && e <= 65023) {
    return 4;
  }
  return 1;
}
const Jn = /[\u0590-\u05f4\u0600-\u06ff\u0700-\u08ac\ufb50-\ufdff]/;
class Yn {
  get dir() {
    if (this.level % 2) {
      return RTL;
    }
    return LTR;
  }
  constructor(e, t, n) {
    this.from = e;
    this.to = t;
    this.level = n;
  }
  side(e, t) {
    if ((this.dir == t) == e) {
      return this.to;
    }
    return this.from;
  }
  forward(e, t) {
    return e == (this.dir == t);
  }
  static find(e, t, n, r) {
    let i = -1;
    for (let a = 0; a < e.length; a++) {
      let o = e[a];
      if (o.from <= t && o.to >= t) {
        if (o.level == n) {
          return a;
        }
        if (
          i < 0 ||
          (r == 0 ? e[i].level > o.level : r < 0 ? o.from < t : o.to > t)
        ) {
          i = a;
        }
      }
    }
    if (i < 0) {
      throw RangeError(`Index out of range`);
    }
    return i;
  }
}
function Xn(e, t) {
  if (e.length != t.length) {
    return false;
  }
  for (let n = 0; n < e.length; n++) {
    let r = e[n];
    let i = t[n];
    if (
      r.from != i.from ||
      r.to != i.to ||
      r.direction != i.direction ||
      !Xn(r.inner, i.inner)
    ) {
      return false;
    }
  }
  return true;
}
const V = [];
function Zn(e, t, n, r, i) {
  for (let a = 0; a <= r.length; a++) {
    let o = a ? r[a - 1].to : t;
    let s = a < r.length ? r[a].from : n;
    let c = a ? 256 : i;
    for (let t = o, n = c, r = c; t < s; t++) {
      let i = qn(e.charCodeAt(t));
      if (i == 512) {
        i = n;
      } else if (i == 8 && r == 4) {
        i = 16;
      }
      V[t] = i == 4 ? 2 : i;
      if (i & 7) {
        r = i;
      }
      n = i;
    }
    for (let e = o, t = c, r = c; e < s; e++) {
      let i = V[e];
      if (i == 128) {
        if (e < s - 1 && t == V[e + 1] && t & 24) {
          i = V[e] = t;
        } else {
          V[e] = 256;
        }
      } else if (i == 64) {
        let i = e + 1;
        while (i < s && V[i] == 64) {
          i++;
        }
        let a = (e && t == 8) || (i < n && V[i] == 8) ? (r == 1 ? 1 : 8) : 256;
        for (let t = e; t < i; t++) {
          V[t] = a;
        }
        e = i - 1;
      } else {
        if (i == 8 && r == 1) {
          V[e] = 1;
        }
      }
      t = i;
      if (i & 7) {
        r = i;
      }
    }
  }
}
function Qn(e, t, n, r, i) {
  let a = i == 1 ? 2 : 1;
  for (let o = 0, s = 0, c = 0; o <= r.length; o++) {
    let l = o ? r[o - 1].to : t;
    let u = o < r.length ? r[o].from : n;
    for (let t = l, n, r, o; t < u; t++) {
      if ((r = Gn[(n = e.charCodeAt(t))])) {
        if (r < 0) {
          for (let e = s - 3; e >= 0; e -= 3) {
            if (Kn[e + 1] == -r) {
              let n = Kn[e + 2];
              let r = n & 2 ? i : n & 4 ? (n & 1 ? a : i) : 0;
              if (r) {
                V[t] = V[Kn[e]] = r;
              }
              s = e;
              break;
            }
          }
        } else if (Kn.length == 189) {
          break;
        } else {
          Kn[s++] = t;
          Kn[s++] = n;
          Kn[s++] = c;
        }
      } else if ((o = V[t]) == 2 || o == 1) {
        let e = o == i;
        c = +!e;
        for (let t = s - 3; t >= 0; t -= 3) {
          let n = Kn[t + 2];
          if (n & 2) {
            break;
          }
          if (e) {
            Kn[t + 2] |= 2;
          } else {
            if (n & 4) {
              break;
            }
            Kn[t + 2] |= 4;
          }
        }
      }
    }
  }
}
function $n(e, t, n, r) {
  for (let i = 0, a = r; i <= n.length; i++) {
    let o = i ? n[i - 1].to : e;
    let s = i < n.length ? n[i].from : t;
    for (let c = o; c < s;) {
      let o = V[c];
      if (o == 256) {
        let o = c + 1;
        while (true) {
          if (o == s) {
            if (i == n.length) {
              break;
            }
            o = n[i++].to;
            s = i < n.length ? n[i].from : t;
          } else if (V[o] == 256) {
            o++;
          } else {
            break;
          }
        }
        let l = a == 1;
        let u = l == ((o < t ? V[o] : r) == 1) ? (l ? 1 : 2) : r;
        for (let t = o, r = i, a = r ? n[r - 1].to : e; t > c;) {
          if (t == a) {
            t = n[--r].from;
            a = r ? n[r - 1].to : e;
          }
          V[--t] = u;
        }
        c = o;
      } else {
        a = o;
        c++;
      }
    }
  }
}
function er(e, t, n, r, i, a, o) {
  let s = r % 2 ? 2 : 1;
  if (r % 2 == i % 2) {
    for (let c = t, l = 0; c < n;) {
      let t = true;
      let u = false;
      if (l == a.length || c < a[l].from) {
        let e = V[c];
        if (e != s) {
          t = false;
          u = e == 16;
        }
      }
      let d = !t && s == 1 ? [] : null;
      let f = t ? r : r + 1;
      let p = c;
      run: while (true) {
        if (l < a.length && p == a[l].from) {
          if (u) {
            break run;
          }
          let m = a[l];
          if (!t) {
            for (let e = m.to, t = l + 1; ;) {
              if (e == n) {
                break run;
              }
              if (t < a.length && a[t].from == e) {
                e = a[t++].to;
              } else if (V[e] == s) {
                break run;
              } else {
                break;
              }
            }
          }
          l++;
          if (d) {
            d.push(m);
          } else {
            if (m.from > c) {
              o.push(new Yn(c, m.from, f));
            }
            tr(
              e,
              (m.direction == LTR) == !(f % 2) ? r : r + 1,
              i,
              m.inner,
              m.from,
              m.to,
              o,
            );
            c = m.to;
          }
          p = m.to;
        } else if (p == n || (t ? V[p] != s : V[p] == s)) {
          break;
        } else {
          p++;
        }
      }
      if (d) {
        er(e, c, p, r + 1, i, d, o);
      } else if (c < p) {
        o.push(new Yn(c, p, f));
      }
      c = p;
    }
  } else {
    for (let c = n, l = a.length; c > t;) {
      let n = true;
      let u = false;
      if (!l || c > a[l - 1].to) {
        let e = V[c - 1];
        if (e != s) {
          n = false;
          u = e == 16;
        }
      }
      let d = !n && s == 1 ? [] : null;
      let f = n ? r : r + 1;
      let p = c;
      run: while (true) {
        if (l && p == a[l - 1].to) {
          if (u) {
            break run;
          }
          let m = a[--l];
          if (!n) {
            for (let e = m.from, n = l; ;) {
              if (e == t) {
                break run;
              }
              if (n && a[n - 1].to == e) {
                e = a[--n].from;
              } else if (V[e - 1] == s) {
                break run;
              } else {
                break;
              }
            }
          }
          if (d) {
            d.push(m);
          } else {
            if (m.to < c) {
              o.push(new Yn(m.to, c, f));
            }
            tr(
              e,
              (m.direction == LTR) == !(f % 2) ? r : r + 1,
              i,
              m.inner,
              m.from,
              m.to,
              o,
            );
            c = m.from;
          }
          p = m.from;
        } else if (p == t || (n ? V[p - 1] != s : V[p - 1] == s)) {
          break;
        } else {
          p--;
        }
      }
      if (d) {
        er(e, p, c, r + 1, i, d, o);
      } else if (p < c) {
        o.push(new Yn(p, c, f));
      }
      c = p;
    }
  }
}
function tr(e, t, n, r, i, a, o) {
  let s = t % 2 ? 2 : 1;
  Zn(e, i, a, r, s);
  Qn(e, i, a, r, s);
  $n(i, a, r, s);
  er(e, i, a, t, n, r, o);
}
function nr(text, t, n) {
  if (!text) {
    return [new Yn(0, 0, +(t == RTL))];
  }
  if (t == LTR && !n.length && !Jn.test(text)) {
    return rr(text.length);
  }
  if (n.length) {
    while (text.length > V.length) {
      V[V.length] = 256;
    }
  }
  let r = [];
  let i = t == LTR ? 0 : 1;
  tr(text, i, i, n, 0, text.length, r);
  return r;
}
function rr(e) {
  return [new Yn(0, e, 0)];
}
let ir = ``;
function ar(e, t, n, r, i) {
  if (!e.length) {
    return null;
  }
  let a = r.head - e.from;
  let o;
  if (r.head == e.from && r.assoc < 0) {
    if (!i) {
      return null;
    }
    a = t[(o = 0)].side(false, n);
  } else if (r.head == e.to && r.assoc > 0) {
    if (i) {
      return null;
    }
    a = t[(o = t.length - 1)].side(true, n);
  } else {
    o = Yn.find(t, a, r.bidiLevel ?? -1, r.assoc);
  }
  let s = t[o];
  let c = s.side(i, n);
  if (a == c) {
    let e = (o += i ? 1 : -1);
    if (e < 0 || e >= t.length) {
      return null;
    }
    s = t[(o = e)];
    a = s.side(!i, n);
    c = s.side(i, n);
  }
  let l = C(e.text, a, s.forward(i, n));
  if (l < s.from || l > s.to) {
    l = c;
  }
  ir = e.text.slice(Math.min(a, l), Math.max(a, l));
  let u = o == (i ? t.length - 1 : 0) ? null : t[o + (i ? 1 : -1)];
  if (l == c) {
    if (!u) {
      if (i) {
        return k.cursor(e.to, 1);
      }
      return k.cursor(e.from, -1);
    }
    if (u.level + +!i < s.level) {
      return k.cursor(
        u.side(!i, n) + e.from,
        u.forward(i, n) ? 1 : -1,
        u.level,
      );
    }
  }
  return k.cursor(l + e.from, s.forward(i, n) ? -1 : 1, s.level);
}
function or(text, t, n) {
  for (let r = t; r < n; r++) {
    let t = qn(text.charCodeAt(r));
    if (t == 1) {
      return LTR;
    }
    if (t == 2 || t == 4) {
      return RTL;
    }
  }
  return LTR;
}
const sr = A.define();
const cr = A.define();
const lr = A.define();
const ur = A.define();
const dr = A.define();
const fr = A.define();
const pr = A.define();
const mr = A.define();
const hr = A.define();
const gr = A.define({
  combine: (e) => e.some((e) => e),
});
const _r = A.define({
  combine: (e) => e.some((e) => e),
});
const vr = A.define();
const yr = class e {
  constructor(e, t, n, r, i, a = false) {
    this.range = e;
    this.y = t;
    this.x = n;
    this.yMargin = r;
    this.xMargin = i;
    this.isSnapshot = a;
  }
  map(t) {
    if (t.empty) {
      return this;
    }
    return new e(
      this.range.map(t),
      this.y,
      this.x,
      this.yMargin,
      this.xMargin,
      this.isSnapshot,
    );
  }
  clip(t) {
    if (this.range.to <= t.doc.length) {
      return this;
    }
    return new e(
      k.cursor(t.doc.length),
      this.y,
      this.x,
      this.yMargin,
      this.xMargin,
      this.isSnapshot,
    );
  }
};
const br = j.define({
  map: (e, t) => e.map(t),
});
const xr = j.define();
function Sr(state, t, n) {
  let r = state.facet(ur);
  if (r.length) {
    r[0](t);
  } else {
    (window.onerror && window.onerror(String(t), n, undefined, undefined, t)) ||
      (n ? console.error(n + `:`, t) : console.error(t));
  }
}
const Cr = A.define({
  combine: (e) => !e.length || e[0],
});
let wr = 0;
const Tr = A.define({
  combine(e) {
    return e.filter((t, n) => {
      for (let r = 0; r < n; r++) {
        if (e[r].plugin == t.plugin) {
          return false;
        }
      }
      return true;
    });
  },
});
const H = class e {
  constructor(e, t, n, r, i) {
    this.id = e;
    this.create = t;
    this.domEventHandlers = n;
    this.domEventObservers = r;
    this.baseExtensions = i(this);
    this.extension = this.baseExtensions.concat(
      Tr.of({
        plugin: this,
        arg: undefined,
      }),
    );
  }
  of(arg) {
    return this.baseExtensions.concat(
      Tr.of({
        plugin: this,
        arg,
      }),
    );
  }
  static define(t, n) {
    let { eventHandlers, eventObservers, provide, decorations } = n || {};
    return new e(wr++, t, eventHandlers, eventObservers, (e) => {
      let t = [];
      if (decorations) {
        t.push(
          kr.of((t) => {
            let n = t.plugin(e);
            if (n) {
              return decorations(n);
            }
            return z.none;
          }),
        );
      }
      if (provide) {
        t.push(provide(e));
      }
      return t;
    });
  }
  static fromClass(t, n) {
    return e.define((e, n) => new t(e, n), n);
  }
};
class Er {
  constructor(e) {
    this.spec = e;
    this.mustUpdate = null;
    this.value = null;
  }
  get plugin() {
    return this.spec && this.spec.plugin;
  }
  update(e) {
    if (!this.value) {
      if (this.spec) {
        try {
          this.value = this.spec.plugin.create(e, this.spec.arg);
        } catch (error) {
          Sr(e.state, error, `CodeMirror plugin crashed`);
          this.deactivate();
        }
      }
    } else if (this.mustUpdate) {
      let e = this.mustUpdate;
      this.mustUpdate = null;
      if (this.value.update) {
        try {
          this.value.update(e);
        } catch (error) {
          Sr(e.state, error, `CodeMirror plugin crashed`);
          if (this.value.destroy) {
            try {
              this.value.destroy();
            } catch {}
          }
          this.deactivate();
        }
      }
    }
    return this;
  }
  destroy(e) {
    if (this.value?.destroy) {
      try {
        this.value.destroy();
      } catch (error) {
        Sr(e.state, error, `CodeMirror plugin crashed`);
      }
    }
  }
  deactivate() {
    this.spec = this.value = null;
  }
}
const Dr = A.define();
const Or = A.define();
var kr = A.define();
const Ar = A.define();
const jr = A.define();
const Mr = A.define();
const Nr = A.define();
function Pr(e, t) {
  let n = e.state.facet(Nr);
  if (!n.length) {
    return n;
  }
  let r = n.map((t) => {
    if (t instanceof Function) {
      return t(e);
    }
    return t;
  });
  let i = [];
  P.spans(r, t.from, t.to, {
    point() {},
    span(e, n, r, a) {
      let o = e - t.from;
      let s = n - t.from;
      let c = i;
      for (let e = r.length - 1; e >= 0; e--, a--) {
        let direction = r[e].spec.bidiIsolate;
        let i;
        direction ??= or(t.text, o, s);
        if (
          a > 0 &&
          c.length &&
          (i = c[c.length - 1]).to == o &&
          i.direction == direction
        ) {
          i.to = s;
          c = i.inner;
        } else {
          let e = {
            from: o,
            to: s,
            direction,
            inner: [],
          };
          c.push(e);
          c = e.inner;
        }
      }
    },
  });
  return i;
}
const Fr = A.define();
function Ir(view) {
  let t = 0;
  let n = 0;
  let r = 0;
  let i = 0;
  for (let a of view.state.facet(Fr)) {
    let o = a(view);
    o &&
      (o.left != null && (t = Math.max(t, o.left)),
      o.right != null && (n = Math.max(n, o.right)),
      o.top != null && (r = Math.max(r, o.top)),
      o.bottom != null && (i = Math.max(i, o.bottom)));
  }
  return {
    left: t,
    right: n,
    top: r,
    bottom: i,
  };
}
const Lr = A.define();
const Rr = class e {
  constructor(e, t, n, r) {
    this.fromA = e;
    this.toA = t;
    this.fromB = n;
    this.toB = r;
  }
  join(t) {
    return new e(
      Math.min(this.fromA, t.fromA),
      Math.max(this.toA, t.toA),
      Math.min(this.fromB, t.fromB),
      Math.max(this.toB, t.toB),
    );
  }
  addToSet(e) {
    let e_length = e.length;
    let n = this;
    for (; e_length > 0; e_length--) {
      let r = e[e_length - 1];
      if (!(r.fromA > n.toA)) {
        if (r.toA < n.fromA) {
          break;
        }
        n = n.join(r);
        e.splice(e_length - 1, 1);
      }
    }
    e.splice(e_length, 0, n);
    return e;
  }
  static extendWithRanges(t, n) {
    if (n.length == 0) {
      return t;
    }
    let r = [];
    for (let i = 0, a = 0, o = 0; ;) {
      let s = i < t.length ? t[i].fromB : 1000000000;
      let c = a < n.length ? n[a] : 1000000000;
      let l = Math.min(s, c);
      if (l == 1000000000) {
        break;
      }
      let u = l + o;
      let d = l;
      let f = u;
      while (true) {
        if (a < n.length && n[a] <= d) {
          let e = n[a + 1];
          a += 2;
          d = Math.max(d, e);
          for (let e = i; e < t.length && t[e].fromB <= d; e++) {
            o = t[e].toA - t[e].toB;
          }
          f = Math.max(f, e + o);
        } else if (i < t.length && t[i].fromB <= d) {
          let e = t[i++];
          d = Math.max(d, e.toB);
          f = Math.max(f, e.toA);
          o = e.toA - e.toB;
        } else {
          break;
        }
      }
      r.push(new e(u, f, l, d));
    }
    return r;
  }
};
const zr = class e {
  constructor(e, t, n) {
    this.view = e;
    this.state = t;
    this.transactions = n;
    this.flags = 0;
    this.startState = e.state;
    this.changes = E.empty(this.startState.doc.length);
    for (let e of n) {
      this.changes = this.changes.compose(e.changes);
    }
    let r = [];
    this.changes.iterChangedRanges((e, t, n, i) => r.push(new Rr(e, t, n, i)));
    this.changedRanges = r;
  }
  static create(t, n, r) {
    return new e(t, n, r);
  }
  get viewportChanged() {
    return (this.flags & 4) > 0;
  }
  get viewportMoved() {
    return (this.flags & 8) > 0;
  }
  get heightChanged() {
    return (this.flags & 2) > 0;
  }
  get geometryChanged() {
    return this.docChanged || (this.flags & 18) > 0;
  }
  get focusChanged() {
    return (this.flags & 1) > 0;
  }
  get docChanged() {
    return !this.changes.empty;
  }
  get selectionSet() {
    return this.transactions.some((e) => e.selection);
  }
  get empty() {
    return this.flags == 0 && this.transactions.length == 0;
  }
};
const Br = [];
class U {
  constructor(e, t, n = 0) {
    this.dom = e;
    this.length = t;
    this.flags = n;
    this.parent = null;
    e.cmTile = this;
  }
  get breakAfter() {
    return this.flags & 1;
  }
  get children() {
    return Br;
  }
  isWidget() {
    return false;
  }
  get isHidden() {
    return false;
  }
  isComposite() {
    return false;
  }
  isLine() {
    return false;
  }
  isText() {
    return false;
  }
  isBlock() {
    return false;
  }
  get domAttrs() {
    return null;
  }
  sync(e) {
    this.flags |= 2;
    if (this.flags & 4) {
      this.flags &= -5;
      let e = this.domAttrs;
      if (e) {
        en(this.dom, e);
      }
    }
  }
  toString() {
    return (
      this.constructor.name +
      (this.children.length ? `(${this.children})` : ``) +
      (this.breakAfter ? `#` : ``)
    );
  }
  destroy() {
    this.parent = null;
  }
  setDOM(e) {
    this.dom = e;
    e.cmTile = this;
  }
  get posAtStart() {
    if (this.parent) {
      return this.parent.posBefore(this);
    }
    return 0;
  }
  get posAtEnd() {
    return this.posAtStart + this.length;
  }
  posBefore(e, t = this.posAtStart) {
    let n = t;
    for (let t of this.children) {
      if (t == e) {
        return n;
      }
      n += t.length + t.breakAfter;
    }
    throw RangeError(`Invalid child in posBefore`);
  }
  posAfter(e) {
    return this.posBefore(e) + e.length;
  }
  covers(e) {
    return true;
  }
  coordsIn(e, t, n) {
    return null;
  }
  domPosFor(e, t) {
    let n = _n(this.dom);
    let r = this.length ? e > 0 : t > 0;
    return new zn(this.parent.dom, n + +!!r, e == 0 || e == this.length);
  }
  markDirty(e) {
    this.flags &= -3;
    if (e) {
      this.flags |= 4;
    }
    if (this.parent && this.parent.flags & 2) {
      this.parent.markDirty(false);
    }
  }
  get overrideDOMText() {
    return null;
  }
  get root() {
    for (let e = this; e; e = e.parent) {
      if (e instanceof Ur) {
        return e;
      }
    }
    return null;
  }
  static get(e) {
    return e.cmTile;
  }
}
class Vr extends U {
  constructor(e) {
    super(e, 0);
    this._children = [];
  }
  isComposite() {
    return true;
  }
  get children() {
    return this._children;
  }
  get lastChild() {
    if (this.children.length) {
      return this.children[this.children.length - 1];
    }
    return null;
  }
  append(e) {
    this.children.push(e);
    e.parent = this;
  }
  sync(e) {
    if (this.flags & 2) {
      return;
    }
    super.sync(e);
    let dom = this.dom;
    let n = null;
    let r;
    let i = e?.node == dom ? e : null;
    let a = 0;
    for (let o of this.children) {
      o.sync(e);
      a += o.length + o.breakAfter;
      r = n ? n.nextSibling : dom.firstChild;
      if (i && r != o.dom) {
        i.written = true;
      }
      if (o.dom.parentNode == dom) {
        while (r && r != o.dom) {
          r = Hr(r);
        }
      } else {
        dom.insertBefore(o.dom, r);
      }
      n = o.dom;
    }
    r = n ? n.nextSibling : dom.firstChild;
    if (i && r) {
      i.written = true;
    }
    while (r) {
      r = Hr(r);
    }
    this.length = a;
  }
}
function Hr(e) {
  let e_nextSibling = e.nextSibling;
  e.parentNode.removeChild(e);
  return e_nextSibling;
}
var Ur = class extends Vr {
  constructor(e, t) {
    super(t);
    this.view = e;
  }
  owns(e) {
    for (; e; e = e.parent) {
      if (e == this) {
        return true;
      }
    }
    return false;
  }
  isBlock() {
    return true;
  }
  nearest(e) {
    while (true) {
      if (!e) {
        return null;
      }
      let t = U.get(e);
      if (t && this.owns(t)) {
        return t;
      }
      e = e.parentNode;
    }
  }
  blockTiles(e) {
    for (let t = [], n = this, r = 0, i = 0; ;) {
      if (r == n.children.length) {
        if (!t.length) {
          return;
        }
        n = n.parent;
        n.breakAfter && i++;
        r = t.pop();
      } else {
        let a = n.children[r++];
        if (a instanceof Wr) {
          t.push(r);
          n = a;
          r = 0;
        } else {
          let t = i + a.length;
          let n = e(a, i);
          if (n !== undefined) {
            return n;
          }
          i = t + a.breakAfter;
        }
      }
    }
  }
  resolveBlock(e, t) {
    let n;
    let r = -1;
    let i;
    let a = -1;
    this.blockTiles((o, s) => {
      let c = s + o.length;
      if (e >= s && e <= c) {
        if (o.isWidget() && t >= -1 && t <= 1) {
          if (o.flags & 32) {
            return true;
          }
          if (o.flags & 16) {
            n = undefined;
          }
        }
        if (
          (s < e || (e == c && (t < -1 ? o.length : o.covers(1)))) &&
          (!n || (!o.isWidget() && n.isWidget()))
        ) {
          n = o;
          r = e - s;
        }
        if (
          (c > e || (e == s && (t > 1 ? o.length : o.covers(-1)))) &&
          (!i || (!o.isWidget() && i.isWidget()))
        ) {
          i = o;
          a = e - s;
        }
      }
    });
    if (!n && !i) {
      throw Error(`No tile at position ` + e);
    }
    if ((n && t < 0) || !i) {
      return {
        tile: n,
        offset: r,
      };
    }
    return {
      tile: i,
      offset: a,
    };
  }
};
var Wr = class e extends Vr {
  constructor(e, t) {
    super(e);
    this.wrapper = t;
  }
  isBlock() {
    return true;
  }
  covers(e) {
    if (this.children.length) {
      if (e < 0) {
        return this.children[0].covers(-1);
      }
      return this.lastChild.covers(1);
    }
    return false;
  }
  get domAttrs() {
    return this.wrapper.attributes;
  }
  static of(t, n) {
    let r = new e(n || document.createElement(t.tagName), t);
    if (!n) {
      r.flags |= 4;
    }
    return r;
  }
};
const Gr = class e extends Vr {
  constructor(e, t) {
    super(e);
    this.attrs = t;
  }
  isLine() {
    return true;
  }
  static start(t, n, r) {
    let i = new e(n || document.createElement(`div`), t);
    if (!n || !r) {
      i.flags |= 4;
    }
    return i;
  }
  get domAttrs() {
    return this.attrs;
  }
  resolveInline(e, t, n) {
    let r = null;
    let i = -1;
    let a = null;
    let o = -1;
    function s(e, c) {
      for (let l = 0, u = 0; l < e.children.length && u <= c; l++) {
        let d = e.children[l];
        let f = u + d.length;
        f >= c &&
          (d.isComposite()
            ? s(d, c - u)
            : (!a ||
                  (a.isHidden &&
                    ((t > 0 && !(a.flags & 32)) || (n && qr(a, d))))) &&
                (f > c || (d.flags & 32 && t <= 1))
              ? ((a = d), (o = c - u))
              : (u < c || (d.flags & 16 && !d.isHidden && t >= -1)) &&
                ((r = d), (i = c - u)));
        u = f;
      }
    }
    s(this, e);
    let c = (t < 0 ? r : a) || r || a;
    if (c) {
      return {
        tile: c,
        offset: c == r ? i : o,
      };
    }
    return null;
  }
  coordsIn(e, t, n) {
    let r = this.resolveInline(e, t, true);
    if (r) {
      return r.tile.coordsIn(Math.max(0, r.offset), t, n);
    }
    return Kr(this);
  }
  domIn(e, t) {
    let n = this.resolveInline(e, t);
    if (n) {
      let { tile, offset } = n;
      if (this.dom.contains(tile.dom)) {
        if (tile.isText()) {
          return new zn(tile.dom, Math.min(tile.dom.nodeValue.length, offset));
        }
        return tile.domPosFor(
          offset,
          tile.flags & 16 ? 1 : tile.flags & 32 ? -1 : t,
        );
      }
      let i = n.tile.parent;
      let a = false;
      for (let e of i.children) {
        if (a) {
          return new zn(e.dom, 0);
        }
        if (e == n.tile) {
          a = true;
        }
      }
    }
    return new zn(this.dom, 0);
  }
};
function Kr(e) {
  let lastChild = e.dom.lastChild;
  if (!lastChild) {
    return e.dom.getBoundingClientRect();
  }
  let n = hn(lastChild);
  return n[n.length - 1] || null;
}
function qr(e, t) {
  let n = e.coordsIn(0, 1);
  let r = t.coordsIn(0, 1);
  return n && r && r.top < n.bottom;
}
const Jr = class e extends Vr {
  constructor(e, t) {
    super(e);
    this.mark = t;
  }
  get domAttrs() {
    return this.mark.attrs;
  }
  static of(t, n) {
    let r = new e(n || document.createElement(t.tagName), t);
    if (!n) {
      r.flags |= 4;
    }
    return r;
  }
};
const Yr = class e extends U {
  constructor(e, t) {
    super(e, t.length);
    this.text = t;
  }
  sync(e) {
    if (!(this.flags & 2)) {
      super.sync(e);
      if (this.dom.nodeValue != this.text) {
        if (e && e.node == this.dom) {
          e.written = true;
        }
        this.dom.nodeValue = this.text;
      }
    }
  }
  isText() {
    return true;
  }
  toString() {
    return JSON.stringify(this.text);
  }
  coordsIn(e, t, n) {
    let length = this.dom.nodeValue.length;
    if (e > length) {
      e = length;
    }
    let i = e;
    let a = e;
    let o = 0;
    (e == 0 && t < 0) || (e == length && t >= 0)
      ? L.chrome ||
        L.gecko ||
        (e ? (i--, (o = 1)) : a < length && (a++, (o = -1)))
      : t < 0
        ? i--
        : a < length && a++;
    let s = Mn(this.dom, i, a).getClientRects();
    if (!s.length) {
      return null;
    }
    let c = s[(o ? o < 0 : t >= 0) ? 0 : s.length - 1];
    if (L.safari && !o && c.width == 0) {
      c = Array.prototype.find.call(s, (e) => e.width) || c;
    }
    if (n == null) {
      return c;
    }
    return xn(c, (o ? o > 0 : t < 0) == n);
  }
  static of(t, n) {
    let r = new e(n || document.createTextNode(t), t);
    if (!n) {
      r.flags |= 2;
    }
    return r;
  }
};
const Xr = class e extends U {
  constructor(e, t, n, r) {
    super(e, t, r);
    this.widget = n;
  }
  isWidget() {
    return true;
  }
  get isHidden() {
    return this.widget.isHidden;
  }
  covers(e) {
    if (this.flags & 48) {
      return false;
    }
    return (this.flags & (e < 0 ? 64 : 128)) > 0;
  }
  coordsIn(e, t) {
    return this.coordsInWidget(e, t, false);
  }
  coordsInWidget(e, t, n) {
    let r = this.widget.coordsAt(this.dom, e, t);
    if (r) {
      return r;
    }
    if (n) {
      return xn(
        this.dom.getBoundingClientRect(),
        this.length ? e == 0 : t <= 0,
      );
    }
    {
      let t = this.dom.getClientRects();
      let n = null;
      if (!t.length) {
        return null;
      }
      let r = this.flags & 16 ? true : this.flags & 32 ? false : e > 0;
      for (
        let i = r ? t.length - 1 : 0;
        (n = t[i]), !(e > 0 ? i == 0 : i == t.length - 1 || n.top < n.bottom);
        i += r ? -1 : 1
      );
      return xn(n, !r);
    }
  }
  get overrideDOMText() {
    if (!this.length) {
      return v.empty;
    }
    let { root } = this;
    if (!root) {
      return v.empty;
    }
    let posAtStart = this.posAtStart;
    return root.view.state.doc.slice(posAtStart, posAtStart + this.length);
  }
  destroy() {
    super.destroy();
    this.widget.destroy(this.dom);
  }
  static of(t, n, r, i, a) {
    if (!a) {
      a = t.toDOM(n);
      if (!t.editable) {
        a.contentEditable = `false`;
      }
    }
    return new e(a, r, t, i);
  }
};
class Zr extends U {
  constructor(e) {
    let t = document.createElement(`img`);
    t.className = `cm-widgetBuffer`;
    t.setAttribute(`aria-hidden`, `true`);
    super(t, 0, e);
  }
  get isHidden() {
    return true;
  }
  get overrideDOMText() {
    return v.empty;
  }
  coordsIn(e, t, n) {
    let r = this.dom.getBoundingClientRect();
    if (n == null) {
      return r;
    }
    return xn(r, t > 0 == n);
  }
}
class Qr {
  constructor(e) {
    this.index = 0;
    this.beforeBreak = false;
    this.parents = [];
    this.tile = e;
  }
  advance(e, t, n) {
    let { tile, index, beforeBreak, parents } = this;
    while (e || t > 0) {
      if (!tile.isComposite()) {
        let t = tile.length;
        if (index < t && e) {
          let a = Math.min(e, t - index);
          if (n) {
            n.skip(tile, index, index + a);
          }
          e -= a;
          index += a;
        }
        if (index == t) {
          beforeBreak = !!tile.breakAfter;
          ({ tile, index } = parents.pop());
          index++;
        } else if (!e) {
          break;
        }
      } else if (beforeBreak) {
        if (!e) {
          break;
        }
        if (n) {
          n.break();
        }
        e--;
        beforeBreak = false;
      } else if (index == tile.children.length) {
        if (!e && !parents.length) {
          break;
        }
        if (n) {
          n.leave(tile);
        }
        beforeBreak = !!tile.breakAfter;
        ({ tile, index } = parents.pop());
        index++;
      } else {
        let s = tile.children[index];
        let c = s.breakAfter;
        if (
          (t > 0 ? s.length <= e : s.length < e) &&
          (!n || n.skip(s, 0, s.length) !== false || !s.isComposite)
        ) {
          beforeBreak = !!c;
          index++;
          e -= s.length;
        } else {
          parents.push({
            tile,
            index,
          });
          tile = s;
          index = 0;
          if (n && s.isComposite()) {
            n.enter(s);
          }
        }
      }
    }
    this.tile = tile;
    this.index = index;
    this.beforeBreak = beforeBreak;
    return this;
  }
  get root() {
    if (this.parents.length) {
      return this.parents[0].tile;
    }
    return this.tile;
  }
}
class $r {
  constructor(e, t, n, r) {
    this.from = e;
    this.to = t;
    this.wrapper = n;
    this.rank = r;
  }
}
class ei {
  constructor(e, t, n) {
    this.cache = e;
    this.root = t;
    this.blockWrappers = n;
    this.curLine = null;
    this.lastBlock = null;
    this.afterWidget = null;
    this.pos = 0;
    this.wrappers = [];
    this.wrapperPos = 0;
  }
  addText(e, t, n, r) {
    this.flushBuffer();
    let i = this.ensureMarks(t, n);
    let i_lastChild = i.lastChild;
    if (
      i_lastChild &&
      i_lastChild.isText() &&
      !(i_lastChild.flags & 8) &&
      i_lastChild.length + e.length < 512
    ) {
      this.cache.reused.set(i_lastChild, 2);
      let t = (i.children[i.children.length - 1] = new Yr(
        i_lastChild.dom,
        i_lastChild.text + e,
      ));
      t.parent = i;
    } else {
      i.append(r || Yr.of(e, this.cache.find(Yr)?.dom));
    }
    this.pos += e.length;
    this.afterWidget = null;
  }
  addComposition(e, t) {
    let curLine = this.curLine;
    if (curLine.dom != t.line.dom) {
      curLine.setDOM(
        this.cache.reused.has(t.line) ? ui(t.line.dom) : t.line.dom,
      );
      this.cache.reused.set(t.line, 2);
    }
    let r = curLine;
    for (let e = t.marks.length - 1; e >= 0; e--) {
      let n = t.marks[e];
      let i = r.lastChild;
      if (i instanceof Jr && i.mark.eq(n.mark)) {
        if (i.dom != n.dom) {
          i.setDOM(ui(n.dom));
        }
        r = i;
      } else {
        let { dom } = n;
        if (this.cache.reused.get(n) && U.get(n.dom)) {
          dom = ui(n.dom);
        }
        let t = Jr.of(n.mark, dom);
        r.append(t);
        r = t;
      }
      this.cache.reused.set(n, 2);
    }
    let i = U.get(e.text);
    if (i) {
      this.cache.reused.set(i, 2);
    }
    let a = new Yr(e.text, e.text.nodeValue);
    a.flags |= 8;
    this.pos = e.range.toB;
    r.append(a);
  }
  addInlineWidget(e, t, n) {
    let r =
      this.afterWidget &&
      e.flags & 48 &&
      (this.afterWidget.flags & 48) == (e.flags & 48);
    if (!r) {
      this.flushBuffer();
    }
    let i = this.ensureMarks(t, n);
    if (!r && !(e.flags & 16)) {
      i.append(this.getBuffer(1));
    }
    i.append(e);
    this.pos += e.length;
    this.afterWidget = e;
  }
  addMark(e, t, n) {
    this.flushBuffer();
    this.ensureMarks(t, n).append(e);
    this.pos += e.length;
    this.afterWidget = null;
  }
  addBlockWidget(e) {
    this.getBlockPos().append(e);
    this.pos += e.length;
    this.lastBlock = e;
    this.endLine();
  }
  continueWidget(e) {
    let t = this.afterWidget || this.lastBlock;
    t.length += e;
    this.pos += e;
  }
  addLineStart(e, t) {
    e ||= si;
    let n = Gr.start(e, t || this.cache.find(Gr)?.dom, !!t);
    this.getBlockPos().append((this.lastBlock = this.curLine = n));
  }
  addLine(e) {
    this.getBlockPos().append(e);
    this.pos += e.length;
    this.lastBlock = e;
    this.endLine();
  }
  addBreak() {
    this.lastBlock.flags |= 1;
    this.endLine();
    this.pos++;
  }
  addLineStartIfNotCovered(e) {
    if (!this.blockPosCovered()) {
      this.addLineStart(e);
    }
  }
  ensureLine(e) {
    if (!this.curLine) {
      this.addLineStart(e);
    }
  }
  ensureMarks(e, t) {
    let curLine = this.curLine;
    for (let r = e.length - 1; r >= 0; r--) {
      let i = e[r];
      let a;
      if (t > 0 && (a = curLine.lastChild) && a instanceof Jr && a.mark.eq(i)) {
        curLine = a;
        t--;
      } else {
        let e = Jr.of(i, this.cache.find(Jr, (e) => e.mark.eq(i))?.dom);
        curLine.append(e);
        curLine = e;
        t = 0;
      }
    }
    return curLine;
  }
  endLine() {
    if (this.curLine) {
      this.flushBuffer();
      let e = this.curLine.lastChild;
      if (
        !e ||
        !ai(this.curLine, false) ||
        (e.dom.nodeName != `BR` &&
          e.isWidget() &&
          !(L.ios && ai(this.curLine, true)))
      ) {
        this.curLine.append(
          this.cache.findWidget(fi, 0, 32) || new Xr(fi.toDOM(), 0, fi, 32),
        );
      }
      this.curLine = this.afterWidget = null;
    }
  }
  updateBlockWrappers() {
    if (this.wrapperPos > this.pos + 10000) {
      this.blockWrappers.goto(this.pos);
      this.wrappers.length = 0;
    }
    for (let e = this.wrappers.length - 1; e >= 0; e--) {
      if (this.wrappers[e].to < this.pos) {
        this.wrappers.splice(e, 1);
      }
    }
    for (let e = this.blockWrappers; e.value && e.from <= this.pos; e.next()) {
      if (e.to >= this.pos) {
        let t = e.rank * 102 + e.value.rank;
        let n = new $r(e.from, e.to, e.value, t);
        let r = this.wrappers.length;
        while (
          r > 0 &&
          (this.wrappers[r - 1].rank - n.rank ||
            this.wrappers[r - 1].to - n.to) < 0
        ) {
          r--;
        }
        this.wrappers.splice(r, 0, n);
      }
    }
    this.wrapperPos = this.pos;
  }
  getBlockPos() {
    this.updateBlockWrappers();
    let root = this.root;
    for (let t of this.wrappers) {
      let n = root.lastChild;
      if (t.from < this.pos && n instanceof Wr && n.wrapper.eq(t.wrapper)) {
        root = n;
      } else {
        let n = Wr.of(
          t.wrapper,
          this.cache.find(Wr, (e) => e.wrapper.eq(t.wrapper))?.dom,
        );
        root.append(n);
        root = n;
      }
    }
    return root;
  }
  blockPosCovered() {
    let lastBlock = this.lastBlock;
    return (
      lastBlock != null &&
      !lastBlock.breakAfter &&
      (!lastBlock.isWidget() || (lastBlock.flags & 160) > 0)
    );
  }
  getBuffer(e) {
    let t = 2 | (e < 0 ? 16 : 32);
    let n = this.cache.find(Zr, undefined, 1);
    if (n) {
      n.flags = t;
    }
    return n || new Zr(t);
  }
  flushBuffer() {
    if (this.afterWidget && !(this.afterWidget.flags & 32)) {
      this.afterWidget.parent.append(this.getBuffer(-1));
      this.afterWidget = null;
    }
  }
}
class ti {
  constructor(e) {
    this.skipCount = 0;
    this.text = ``;
    this.textOff = 0;
    this.cursor = e.iter();
  }
  skip(e) {
    if (this.textOff + e <= this.text.length) {
      this.textOff += e;
    } else {
      this.skipCount += e - (this.text.length - this.textOff);
      this.text = ``;
      this.textOff = 0;
    }
  }
  next(e) {
    if (this.textOff == this.text.length) {
      let { value, lineBreak, done } = this.cursor.next(this.skipCount);
      this.skipCount = 0;
      if (done) {
        throw Error(`Ran out of text content when drawing inline views`);
      }
      this.text = value;
      let i = (this.textOff = Math.min(e, value.length));
      if (lineBreak) {
        return null;
      }
      return value.slice(0, i);
    }
    let t = Math.min(this.text.length, this.textOff + e);
    let n = this.text.slice(this.textOff, t);
    this.textOff = t;
    return n;
  }
}
const ni = [Xr, Gr, Yr, Jr, Zr, Wr, Ur];
for (let e = 0; e < ni.length; e++) {
  ni[e].bucket = e;
}
class ri {
  constructor(e) {
    this.view = e;
    this.buckets = ni.map(() => []);
    this.index = ni.map(() => 0);
    this.reused = new Map();
  }
  add(e) {
    let bucket = e.constructor.bucket;
    let n = this.buckets[bucket];
    if (n.length < 6) {
      n.push(e);
    } else {
      n[(this.index[bucket] = (this.index[bucket] + 1) % 6)] = e;
    }
  }
  find({ bucket }, t, n = 2) {
    let i = this.buckets[bucket];
    let a = this.index[bucket];
    for (let e = 0; e < i.length; e++) {
      let o = (e + a) % i.length;
      let s = i[o];
      if ((!t || t(s)) && !this.reused.has(s)) {
        i.splice(o, 1);
        o < a && this.index[bucket]--;
        this.reused.set(s, n);
        return s;
      }
    }
    return null;
  }
  findWidget(e, t, n) {
    let r = this.buckets[0];
    if (r.length) {
      for (let i = 0, a = 0; ; i++) {
        if (i == r.length) {
          if (a) {
            return null;
          }
          a = 1;
          i = 0;
        }
        let o = r[i];
        if (
          !this.reused.has(o) &&
          (a == 0
            ? o.widget.compare(e)
            : o.widget.constructor == e.constructor &&
              e.updateDOM(o.dom, this.view, o.widget))
        ) {
          r.splice(i, 1);
          i < this.index[0] && this.index[0]--;
          if (o.widget == e && o.length == t && (o.flags & 497) == n) {
            return (this.reused.set(o, 1), o);
          }
          return (
            this.reused.set(o, 2),
            new Xr(o.dom, t, e, (o.flags & -498) | n)
          );
        }
      }
    }
  }
  reuse(e) {
    this.reused.set(e, 1);
    return e;
  }
  maybeReuse(e, t = 2) {
    if (!this.reused.has(e)) {
      this.reused.set(e, t);
      return e.dom;
    }
  }
  clear() {
    for (let e = 0; e < this.buckets.length; e++) {
      this.buckets[e].length = this.index[e] = 0;
    }
  }
}
class ii {
  constructor(e, t, n, r, i) {
    this.view = e;
    this.decorations = r;
    this.disallowBlockEffectsFor = i;
    this.openWidget = false;
    this.openMarks = 0;
    this.cache = new ri(e);
    this.text = new ti(e.state.doc);
    this.builder = new ei(this.cache, new Ur(e, e.contentDOM), P.iter(n));
    this.cache.reused.set(t, 2);
    this.old = new Qr(t);
    this.reuseWalker = {
      skip: (e, t, n) => {
        this.cache.add(e);
        if (e.isComposite()) {
          return false;
        }
      },
      enter: (e) => this.cache.add(e),
      leave: () => {},
      break: () => {},
    };
  }
  run(e, t) {
    let n = t && this.getCompositionContext(t.text);
    for (let r = 0, i = 0, a = 0; ;) {
      let o = a < e.length ? e[a++] : null;
      let s = o ? o.fromA : this.old.root.length;
      if (s > r) {
        let e = s - r;
        this.preserve(e, !a, !o);
        r = s;
        i += e;
      }
      if (!o) {
        break;
      }
      if (t && o.fromA <= t.range.fromA && o.toA >= t.range.toA) {
        this.forward(
          o.fromA,
          t.range.fromA,
          t.range.fromA < t.range.toA ? 1 : -1,
        );
        this.emit(i, t.range.fromB);
        this.builder.flushBuffer();
        this.cache.clear();
        this.builder.addComposition(t, n);
        this.text.skip(t.range.toB - t.range.fromB);
        this.forward(t.range.fromA, o.toA);
        this.emit(t.range.toB, o.toB);
      } else {
        this.forward(o.fromA, o.toA);
        this.emit(i, o.toB);
      }
      i = o.toB;
      r = o.toA;
    }
    if (this.builder.curLine) {
      this.builder.endLine();
    }
    return this.builder.root;
  }
  preserve(e, t, n) {
    let r = li(this.old);
    let openMarks = this.openMarks;
    this.old.advance(e, n ? 1 : -1, {
      skip: (e, t, n) => {
        if (e.isWidget()) {
          if (this.openWidget) {
            this.builder.continueWidget(n - t);
          } else {
            let a =
              n > 0 || t < e.length
                ? Xr.of(
                    e.widget,
                    this.view,
                    n - t,
                    e.flags & 496,
                    this.cache.maybeReuse(e),
                  )
                : this.cache.reuse(e);
            if (a.flags & 256) {
              a.flags &= -2;
              this.builder.addBlockWidget(a);
            } else {
              this.builder.ensureLine(null);
              this.builder.addInlineWidget(a, r, openMarks);
              openMarks = r.length;
            }
          }
        } else if (e.isText()) {
          this.builder.ensureLine(null);
          if (!t && n == e.length && !this.cache.reused.has(e)) {
            this.builder.addText(e.text, r, openMarks, this.cache.reuse(e));
          } else {
            this.cache.add(e);
            this.builder.addText(e.text.slice(t, n), r, openMarks);
          }
          openMarks = r.length;
        } else if (e.isLine()) {
          e.flags &= -2;
          this.cache.reused.set(e, 1);
          this.builder.addLine(e);
        } else if (e instanceof Zr) {
          this.cache.add(e);
        } else if (e instanceof Jr) {
          this.builder.ensureLine(null);
          this.builder.addMark(e, r, openMarks);
          this.cache.reused.set(e, 1);
          openMarks = r.length;
        } else {
          return false;
        }
        this.openWidget = false;
      },
      enter: (e) => {
        if (e.isLine()) {
          this.builder.addLineStart(e.attrs, this.cache.maybeReuse(e));
        } else {
          this.cache.add(e);
          if (e instanceof Jr) {
            r.unshift(e.mark);
          }
        }
        this.openWidget = false;
      },
      leave: (e) => {
        if (e.isLine()) {
          r.length &&= openMarks = 0;
        } else if (e instanceof Jr) {
          r.shift();
          openMarks = Math.min(openMarks, r.length);
        }
      },
      break: () => {
        this.builder.addBreak();
        this.openWidget = false;
      },
    });
    this.text.skip(e);
  }
  emit(e, t) {
    let n = null;
    let builder = this.builder;
    let i = -1;
    let a = P.spans(this.decorations, e, t, {
      point: (e, t, a, o, s, c) => {
        if (a instanceof sn) {
          if (this.disallowBlockEffectsFor[c]) {
            if (a.block) {
              throw RangeError(
                `Block decorations may not be specified via plugins`,
              );
            }
            if (t > this.view.state.doc.lineAt(e).to) {
              throw RangeError(
                `Decorations that replace line breaks may not be specified via plugins`,
              );
            }
          }
          i = o.length;
          if (s > o.length) {
            builder.continueWidget(t - e);
          } else {
            let i = a.widget || (a.block ? di.block : di.inline);
            let c = oi(a);
            let l =
              this.cache.findWidget(i, t - e, c) ||
              Xr.of(i, this.view, t - e, c);
            if (a.block) {
              if (a.startSide > 0) {
                builder.addLineStartIfNotCovered(n);
              }
              builder.addBlockWidget(l);
            } else {
              builder.ensureLine(n);
              builder.addInlineWidget(l, o, s);
            }
          }
          n = null;
        } else {
          n = ci(n, a);
        }
        if (t > e) {
          this.text.skip(t - e);
        }
      },
      span: (e, t, a, o) => {
        for (let i = e; i < t;) {
          let s = this.text.next(Math.min(512, t - i));
          if (s == null) {
            builder.addLineStartIfNotCovered(n);
            builder.addBreak();
            i++;
          } else {
            builder.ensureLine(n);
            builder.addText(s, a, i == e ? o : a.length);
            i += s.length;
          }
          n = null;
        }
        i = a.length;
      },
    });
    if (i > -1) {
      this.openWidget = a > i;
    }
    if (!this.openWidget) {
      builder.addLineStartIfNotCovered(n);
    }
    this.openMarks = a;
  }
  forward(e, t, n = 1) {
    if (t - e <= 10) {
      this.old.advance(t - e, n, this.reuseWalker);
    } else {
      this.old.advance(5, -1, this.reuseWalker);
      this.old.advance(t - e - 10, -1);
      this.old.advance(5, n, this.reuseWalker);
    }
  }
  getCompositionContext(e) {
    let marks = [];
    let n = null;
    for (let r = e.parentNode; ; r = r.parentNode) {
      let e = U.get(r);
      if (r == this.view.contentDOM) {
        break;
      }
      if (e instanceof Jr) {
        marks.push(e);
      } else if (e?.isLine()) {
        n = e;
      } else {
        e instanceof Wr ||
          (r.nodeName == `DIV` && !n
            ? (n = new Gr(r, si))
            : n ||
              marks.push(
                Jr.of(
                  new an({
                    tagName: r.nodeName.toLowerCase(),
                    attributes: nn(r),
                  }),
                  r,
                ),
              ));
      }
    }
    if (n) {
      return {
        line: n,
        marks,
      };
    }
    return null;
  }
}
function ai(curLine, t) {
  let n = (e) => {
    for (let r of e.children) {
      if ((t ? r.isText() : r.length) || n(r)) {
        return true;
      }
    }
    return false;
  };
  return n(curLine);
}
function oi(e) {
  let t = e.isReplace
    ? (e.startSide < 0 ? 64 : 0) | (e.endSide > 0 ? 128 : 0)
    : e.startSide > 0
      ? 32
      : 16;
  if (e.block) {
    t |= 256;
  }
  return t;
}
var si = {
  class: `cm-line`,
};
function ci(e, t) {
  let attributes = t.spec.attributes;
  let _class = t.spec.class;
  if (!attributes && !_class) {
    return e;
  }
  return (
    (e ||= {
      class: `cm-line`,
    }),
    attributes && Zt(attributes, e),
    _class && (e.class += ` ` + _class),
    e
  );
}
function li(old) {
  let t = [];
  for (let n = old.parents.length; n > 1; n--) {
    let r = n == old.parents.length ? old.tile : old.parents[n].tile;
    if (r instanceof Jr) {
      t.push(r.mark);
    }
  }
  return t;
}
function ui(dom) {
  let t = U.get(dom);
  if (t) {
    t.setDOM(dom.cloneNode());
  }
  return dom;
}
var di = class extends rn {
  constructor(e) {
    super();
    this.tag = e;
  }
  eq(e) {
    return e.tag == this.tag;
  }
  toDOM() {
    return document.createElement(this.tag);
  }
  updateDOM(e) {
    return e.nodeName.toLowerCase() == this.tag;
  }
  get isHidden() {
    return true;
  }
};
di.inline = new di(`span`);
di.block = new di(`div`);
var fi = new (class extends rn {
  toDOM() {
    return document.createElement(`br`);
  }
  get isHidden() {
    return true;
  }
  get editable() {
    return true;
  }
})();
class pi {
  constructor(e) {
    this.view = e;
    this.decorations = [];
    this.blockWrappers = [];
    this.dynamicDecorationMap = [false];
    this.domChanged = null;
    this.hasComposition = null;
    this.editContextFormatting = z.none;
    this.lastCompositionAfterCursor = false;
    this.minWidth = 0;
    this.minWidthFrom = 0;
    this.minWidthTo = 0;
    this.impreciseAnchor = null;
    this.impreciseHead = null;
    this.forceSelection = false;
    this.lastUpdate = Date.now();
    this.updateDeco();
    this.tile = new Ur(e, e.contentDOM);
    this.updateInner([new Rr(0, 0, 0, e.state.doc.length)], null);
  }
  update(e) {
    let e_changedRanges = e.changedRanges;
    this.minWidth > 0 &&
      e_changedRanges.length &&
      (e_changedRanges.every(
        ({ fromA, toA }) => toA < this.minWidthFrom || fromA > this.minWidthTo,
      )
        ? ((this.minWidthFrom = e.changes.mapPos(this.minWidthFrom, 1)),
          (this.minWidthTo = e.changes.mapPos(this.minWidthTo, 1)))
        : (this.minWidth = this.minWidthFrom = this.minWidthTo = 0));
    this.updateEditContextFormatting(e);
    let n = -1;
    this.view.inputState.composing >= 0 &&
      !this.view.observer.editContext &&
      (this.domChanged?.newSel
        ? (n = this.domChanged.newSel.head)
        : !wi(e.changes, this.hasComposition) &&
          !e.selectionSet &&
          (n = e.state.selection.main.head));
    let r = n > -1 ? _i(this.view, e.changes, n) : null;
    this.domChanged = null;
    if (this.hasComposition) {
      let { from, to } = this.hasComposition;
      e_changedRanges = new Rr(
        from,
        to,
        e.changes.mapPos(from, -1),
        e.changes.mapPos(to, 1),
      ).addToSet(e_changedRanges.slice());
    }
    this.hasComposition = r
      ? {
          from: r.range.fromB,
          to: r.range.toB,
        }
      : null;
    if (
      (L.ie || L.chrome) &&
      !r &&
      e &&
      e.state.doc.lines != e.startState.doc.lines
    ) {
      this.forceSelection = true;
    }
    let decorations = this.decorations;
    let blockWrappers = this.blockWrappers;
    this.updateDeco();
    let o = bi(decorations, this.decorations, e.changes);
    if (o.length) {
      e_changedRanges = Rr.extendWithRanges(e_changedRanges, o);
    }
    let s = Si(blockWrappers, this.blockWrappers, e.changes);
    if (s.length) {
      e_changedRanges = Rr.extendWithRanges(e_changedRanges, s);
    }
    if (
      r &&
      !e_changedRanges.some(
        (e) => e.fromA <= r.range.fromA && e.toA >= r.range.toA,
      )
    ) {
      e_changedRanges = r.range.addToSet(e_changedRanges.slice());
    }
    if (this.tile.flags & 2 && e_changedRanges.length == 0) {
      return false;
    }
    return (
      this.updateInner(e_changedRanges, r),
      e.transactions.length && (this.lastUpdate = Date.now()),
      true
    );
  }
  updateInner(e, t) {
    this.view.viewState.mustMeasureContent = true;
    let { observer } = this.view;
    observer.ignore(() => {
      if (t || e.length) {
        let n = this.tile;
        let r = new ii(
          this.view,
          n,
          this.blockWrappers,
          this.decorations,
          this.dynamicDecorationMap,
        );
        if (t && U.get(t.text)) {
          r.cache.reused.set(U.get(t.text), 2);
        }
        this.tile = r.run(e, t);
        mi(n, r.cache.reused);
      }
      this.tile.dom.style.height =
        this.view.viewState.contentHeight / this.view.scaleY + `px`;
      this.tile.dom.style.flexBasis = this.minWidth ? this.minWidth + `px` : ``;
      let r =
        L.chrome || L.ios
          ? {
              node: observer.selectionRange.focusNode,
              written: false,
            }
          : undefined;
      this.tile.sync(r);
      if (
        r &&
        (r.written ||
          observer.selectionRange.focusNode != r.node ||
          !this.tile.dom.contains(r.node))
      ) {
        this.forceSelection = true;
      }
      this.tile.dom.style.height = ``;
    });
    let r = [];
    if (
      this.view.viewport.from ||
      this.view.viewport.to < this.view.state.doc.length
    ) {
      for (let e of this.tile.children) {
        if (e.isWidget() && e.widget instanceof Ti) {
          r.push(e.dom);
        }
      }
    }
    observer.updateGaps(r);
  }
  updateEditContextFormatting(e) {
    this.editContextFormatting = this.editContextFormatting.map(e.changes);
    for (let t of e.transactions) {
      for (let e of t.effects) {
        if (e.is(xr)) {
          this.editContextFormatting = e.value;
        }
      }
    }
  }
  updateSelection(e = false, t = false) {
    if (e || !this.view.observer.selectionRange.focusNode) {
      this.view.observer.readSelectionRange();
    }
    let { dom } = this.tile;
    let activeElement = this.view.root.activeElement;
    let i = activeElement == dom;
    let a =
      !i &&
      !(this.view.state.facet(Cr) || dom.tabIndex > -1) &&
      mn(dom, this.view.observer.selectionRange) &&
      !(activeElement && dom.contains(activeElement));
    if (!(i || t || a)) {
      return;
    }
    let forceSelection = this.forceSelection;
    this.forceSelection = false;
    let main = this.view.state.selection.main;
    let c;
    let l;
    if (main.empty) {
      l = c = this.inlineDOMNearPos(main.anchor, main.assoc || 1);
    } else {
      l = this.inlineDOMNearPos(main.head, main.head == main.from ? 1 : -1);
      c = this.inlineDOMNearPos(main.anchor, main.anchor == main.from ? 1 : -1);
    }
    if (L.gecko && main.empty && !this.hasComposition && hi(c)) {
      let e = document.createTextNode(``);
      this.view.observer.ignore(() =>
        c.node.insertBefore(e, c.node.childNodes[c.offset] || null),
      );
      c = l = new zn(e, 0);
      forceSelection = true;
    }
    let selectionRange = this.view.observer.selectionRange;
    if (
      forceSelection ||
      !selectionRange.focusNode ||
      ((!gn(
        c.node,
        c.offset,
        selectionRange.anchorNode,
        selectionRange.anchorOffset,
      ) ||
        !gn(
          l.node,
          l.offset,
          selectionRange.focusNode,
          selectionRange.focusOffset,
        )) &&
        !this.suppressWidgetCursorChange(selectionRange, main))
    ) {
      this.view.observer.ignore(() => {
        if (
          L.android &&
          L.chrome &&
          dom.contains(selectionRange.focusNode) &&
          Ci(selectionRange.focusNode, dom)
        ) {
          dom.blur();
          dom.focus({
            preventScroll: true,
          });
        }
        let e = fn(this.view.root);
        if (e) {
          if (main.empty) {
            if (L.gecko) {
              let e = vi(c.node, c.offset);
              if (e && e != 3) {
                let t = (e == 1 ? Ln : Rn)(c.node, c.offset);
                if (t) {
                  c = new zn(t.node, t.offset);
                }
              }
            }
            e.collapse(c.node, c.offset);
            if (main.bidiLevel != null && e.caretBidiLevel !== undefined) {
              e.caretBidiLevel = main.bidiLevel;
            }
          } else if (e.extend) {
            e.collapse(c.node, c.offset);
            try {
              e.extend(l.node, l.offset);
            } catch {}
          } else {
            let t = document.createRange();
            if (main.anchor > main.head) {
              [c, l] = [l, c];
            }
            t.setEnd(l.node, l.offset);
            t.setStart(c.node, c.offset);
            e.removeAllRanges();
            e.addRange(t);
          }
        }
        if (a && this.view.root.activeElement == dom) {
          dom.blur();
          if (activeElement) {
            activeElement.focus();
          }
        }
      });
      this.view.observer.setSelectionRange(c, l);
    }
    this.impreciseAnchor = c.precise
      ? null
      : new zn(selectionRange.anchorNode, selectionRange.anchorOffset);
    this.impreciseHead = l.precise
      ? null
      : new zn(selectionRange.focusNode, selectionRange.focusOffset);
  }
  suppressWidgetCursorChange(e, t) {
    return (
      this.hasComposition &&
      t.empty &&
      gn(e.focusNode, e.focusOffset, e.anchorNode, e.anchorOffset) &&
      this.posFromDOM(e.focusNode, e.focusOffset) == t.head
    );
  }
  enforceCursorAssoc() {
    if (this.hasComposition) {
      return;
    }
    let { view } = this;
    let main = view.state.selection.main;
    let n = fn(view.root);
    let { anchorNode, anchorOffset } = view.observer.selectionRange;
    if (!n || !main.empty || !main.assoc || !n.modify) {
      return;
    }
    let a = this.lineAt(main.head, main.assoc);
    if (!a) {
      return;
    }
    let a_posAtStart = a.posAtStart;
    if (main.head == a_posAtStart || main.head == a_posAtStart + a.length) {
      return;
    }
    let s = this.coordsAt(main.head, -1);
    let c = this.coordsAt(main.head, 1);
    if (!s || !c || s.bottom > c.top) {
      return;
    }
    let l = this.domAtPos(main.head + main.assoc, main.assoc);
    n.collapse(l.node, l.offset);
    n.modify(`move`, main.assoc < 0 ? `forward` : `backward`, `lineboundary`);
    view.observer.readSelectionRange();
    let selectionRange = view.observer.selectionRange;
    if (
      view.docView.posFromDOM(
        selectionRange.anchorNode,
        selectionRange.anchorOffset,
      ) != main.from
    ) {
      n.collapse(anchorNode, anchorOffset);
    }
  }
  posFromDOM(e, t) {
    let n = this.tile.nearest(e);
    if (!n) {
      if (this.tile.dom.compareDocumentPosition(e) & 2) {
        return 0;
      }
      return this.view.state.doc.length;
    }
    let n_posAtStart = n.posAtStart;
    if (n.isComposite()) {
      let i;
      if (e == n.dom) {
        i = n.dom.childNodes[t];
      } else {
        let r = bn(e) == 0 ? 0 : t == 0 ? -1 : 1;
        while (true) {
          let t = e.parentNode;
          if (t == n.dom) {
            break;
          }
          if (r == 0 && t.firstChild != t.lastChild) {
            r = e == t.firstChild ? -1 : 1;
          }
          e = t;
        }
        i = r < 0 ? e : e.nextSibling;
      }
      if (i == n.dom.firstChild) {
        return n_posAtStart;
      }
      while (i && !U.get(i)) {
        i = i.nextSibling;
      }
      if (!i) {
        return n_posAtStart + n.length;
      }
      for (let e = 0, t = n_posAtStart; ; e++) {
        let r = n.children[e];
        if (r.dom == i) {
          return t;
        }
        t += r.length + r.breakAfter;
      }
    } else if (n.isText()) {
      if (e == n.dom) {
        return n_posAtStart + t;
      }
      return n_posAtStart + (t ? n.length : 0);
    } else {
      return n_posAtStart;
    }
  }
  domAtPos(e, t) {
    let { tile, offset } = this.tile.resolveBlock(e, t);
    if (tile.isWidget()) {
      return tile.domPosFor(offset, t);
    }
    return tile.domIn(offset, t);
  }
  inlineDOMNearPos(e, t) {
    let n;
    let r = -1;
    let i = false;
    let a;
    let o = -1;
    let s = false;
    this.tile.blockTiles((t, c) => {
      if (t.isWidget()) {
        if (t.flags & 32 && c >= e) {
          return true;
        }
        if (t.flags & 16) {
          i = true;
        }
      } else {
        let l = c + t.length;
        if (c <= e) {
          n = t;
          r = e - c;
          i = l < e;
        }
        if (l >= e && !a) {
          a = t;
          o = e - c;
          s = c > e;
        }
        if (c > e && a) {
          return true;
        }
      }
    });
    if (!n && !a) {
      return this.domAtPos(e, t);
    }
    return (
      i && a ? (n = null) : s && n && (a = null),
      (n && t < 0) || !a ? n.domIn(r, t) : a.domIn(o, t)
    );
  }
  coordsAt(e, t, n) {
    let { tile, offset } = this.tile.resolveBlock(e, t);
    if (tile.isWidget()) {
      if (tile.widget instanceof Ti) {
        return null;
      }
      return tile.coordsInWidget(offset, t, true);
    }
    return tile.coordsIn(offset, t, n);
  }
  lineAt(e, t) {
    let { tile } = this.tile.resolveBlock(e, t);
    if (tile.isLine()) {
      return tile;
    }
    return null;
  }
  coordsForChar(e) {
    let { tile, offset } = this.tile.resolveBlock(e, 1);
    if (!tile.isLine()) {
      return null;
    }
    function r(e, t) {
      if (e.isComposite()) {
        for (let n of e.children) {
          if (n.length >= t) {
            let e = r(n, t);
            if (e) {
              return e;
            }
          }
          t -= n.length;
          if (t < 0) {
            break;
          }
        }
      } else if (e.isText() && t < e.length) {
        let n = C(e.text, t);
        if (n == t) {
          return null;
        }
        let r = Mn(e.dom, t, n).getClientRects();
        for (let e = 0; e < r.length; e++) {
          let t = r[e];
          if (e == r.length - 1 || (t.top < t.bottom && t.left < t.right)) {
            return t;
          }
        }
      }
      return null;
    }
    return r(tile, offset);
  }
  measureVisibleLineHeights(e) {
    let t = [];
    let { from, to } = e;
    let clientWidth = this.view.contentDOM.clientWidth;
    let a =
      clientWidth >
      Math.max(this.view.scrollDOM.clientWidth, this.minWidth) + 1;
    let o = -1;
    let s = this.view.textDirection == B.LTR;
    let c = 0;
    let l = (e, u, d) => {
      for (let f = 0; f < e.children.length && !(u > to); f++) {
        let r = e.children[f];
        let p = u + r.length;
        let m = r.dom.getBoundingClientRect();
        let { height } = m;
        if (d && !f) {
          c += m.top - d.top;
        }
        if (r instanceof Wr) {
          if (p > from) {
            l(r, u, m);
          }
        } else if (
          u >= from &&
          (c > 0 && t.push(-c), t.push(height + c), (c = 0), a)
        ) {
          let e = r.dom.lastChild;
          let t = e ? hn(e) : [];
          if (t.length) {
            let e = t[t.length - 1];
            let n = s ? e.right - m.left : m.right - e.left;
            if (n > o) {
              o = n;
              this.minWidth = clientWidth;
              this.minWidthFrom = u;
              this.minWidthTo = p;
            }
          }
        }
        if (d && f == e.children.length - 1) {
          c += d.bottom - m.bottom;
        }
        u = p + r.breakAfter;
      }
    };
    l(this.tile, 0, null);
    return t;
  }
  textDirectionAt(e) {
    let { tile } = this.tile.resolveBlock(e, 1);
    if (getComputedStyle(tile.dom).direction == `rtl`) {
      return B.RTL;
    }
    return B.LTR;
  }
  measureTextSize() {
    let e = this.tile.blockTiles((e) => {
      if (e.isLine() && e.children.length && e.length <= 20) {
        let t = 0;
        let n;
        for (let r of e.children) {
          if (!r.isText() || /[^ -~]/.test(r.text)) {
            return;
          }
          let e = hn(r.dom);
          if (e.length != 1) {
            return;
          }
          t += e[0].width;
          n = e[0].height;
        }
        if (t) {
          return {
            lineHeight: e.dom.getBoundingClientRect().height,
            charWidth: t / e.length,
            textHeight: n,
          };
        }
      }
    });
    if (e) {
      return e;
    }
    let t = document.createElement(`div`);
    let lineHeight;
    let charWidth;
    let i;
    t.className = `cm-line`;
    t.style.width = `99999px`;
    t.style.position = `absolute`;
    t.textContent = `abc def ghi jkl mno pqr stu`;
    this.view.observer.ignore(() => {
      this.tile.dom.appendChild(t);
      let e = hn(t.firstChild)[0];
      lineHeight = t.getBoundingClientRect().height;
      charWidth = e && e.width ? e.width / 27 : 7;
      i = e && e.height ? e.height : lineHeight;
      t.remove();
    });
    return {
      lineHeight,
      charWidth,
      textHeight: i,
    };
  }
  computeBlockGapDeco() {
    let e = [];
    let viewState = this.view.viewState;
    for (let n = 0, r = 0; ; r++) {
      let i = r == viewState.viewports.length ? null : viewState.viewports[r];
      let a = i ? i.from - 1 : this.view.state.doc.length;
      if (a > n) {
        let r =
          (viewState.lineBlockAt(a).bottom - viewState.lineBlockAt(n).top) /
          this.view.scaleY;
        e.push(
          z
            .replace({
              widget: new Ti(r),
              block: true,
              inclusive: true,
              isBlockGap: true,
            })
            .range(n, a),
        );
      }
      if (!i) {
        break;
      }
      n = i.to + 1;
    }
    return z.set(e);
  }
  updateDeco() {
    let e = 1;
    let t = this.view.state.facet(kr).map((t) => {
      if ((this.dynamicDecorationMap[e++] = typeof t == `function`)) {
        return t(this.view);
      }
      return t;
    });
    let n = false;
    let r = this.view.state.facet(jr).map((e, t) => {
      let r = typeof e == `function`;
      if (r) {
        n = true;
      }
      if (r) {
        return e(this.view);
      }
      return e;
    });
    if (r.length) {
      this.dynamicDecorationMap[e++] = n;
      t.push(P.join(r));
    }
    for (
      this.decorations = [
        this.editContextFormatting,
        ...t,
        this.computeBlockGapDeco(),
        this.view.viewState.lineGapDeco,
      ];
      e < this.decorations.length;
    ) {
      this.dynamicDecorationMap[e++] = false;
    }
    this.blockWrappers = this.view.state.facet(Ar).map((e) => {
      if (typeof e == `function`) {
        return e(this.view);
      }
      return e;
    });
  }
  scrollIntoView(e) {
    if (e.isSnapshot) {
      let t = this.view.viewState.lineBlockAt(e.range.head);
      this.view.scrollDOM.scrollTop = t.top - e.yMargin;
      this.view.scrollDOM.scrollLeft = e.xMargin;
      return;
    }
    for (let t of this.view.state.facet(vr)) {
      try {
        if (t(this.view, e.range, e)) {
          return true;
        }
      } catch (error) {
        Sr(this.view.state, error, `scroll handler`);
      }
    }
    let { range } = e;
    let n = this.coordsAt(
      range.head,
      range.assoc || (range.head > range.anchor ? -1 : 1),
    );
    let r;
    if (!n) {
      return;
    }
    if (
      !range.empty &&
      (r = this.coordsAt(range.anchor, range.anchor > range.head ? -1 : 1))
    ) {
      n = {
        left: Math.min(n.left, r.left),
        top: Math.min(n.top, r.top),
        right: Math.max(n.right, r.right),
        bottom: Math.max(n.bottom, r.bottom),
      };
    }
    let i = Ir(this.view);
    let a = {
      left: n.left - i.left,
      top: n.top - i.top,
      right: n.right + i.right,
      bottom: n.bottom + i.bottom,
    };
    let { offsetWidth, offsetHeight } = this.view.scrollDOM;
    wn(
      this.view.scrollDOM,
      a,
      range.head < range.anchor ? -1 : 1,
      e.x,
      e.y,
      Math.max(Math.min(e.xMargin, offsetWidth), -offsetWidth),
      Math.max(Math.min(e.yMargin, offsetHeight), -offsetHeight),
      this.view.textDirection == B.LTR,
    );
    if (
      window.visualViewport &&
      window.innerHeight - window.visualViewport.height > 1 &&
      (n.top > window.visualViewport.offsetTop + window.visualViewport.height ||
        n.bottom < window.visualViewport.offsetTop)
    ) {
      let e = this.view.docView.lineAt(range.head, 1);
      if (e) {
        let t = Dn(e.dom);
        e.dom.scrollIntoView({
          block: `nearest`,
        });
        On(t, false);
      }
    }
  }
  lineHasWidget(e) {
    let t = (e) => e.isWidget() || e.children.some(t);
    return t(this.tile.resolveBlock(e, 1).tile);
  }
  destroy() {
    mi(this.tile);
  }
}
function mi(e, t) {
  let n = t?.get(e);
  if (n != 1) {
    n ?? e.destroy();
    for (let n of e.children) {
      mi(n, t);
    }
  }
}
function hi(e) {
  return (
    e.node.nodeType == 1 &&
    e.node.firstChild &&
    (e.offset == 0 ||
      e.node.childNodes[e.offset - 1].contentEditable == `false`) &&
    (e.offset == e.node.childNodes.length ||
      e.node.childNodes[e.offset].contentEditable == `false`)
  );
}
function gi(e, t) {
  let selectionRange = e.observer.selectionRange;
  if (!selectionRange.focusNode) {
    return null;
  }
  let r = Ln(selectionRange.focusNode, selectionRange.focusOffset);
  let i = Rn(selectionRange.focusNode, selectionRange.focusOffset);
  let a = r || i;
  if (i && r && i.node != r.node) {
    let t = U.get(i.node);
    if (!t || (t.isText() && t.text != i.node.nodeValue)) {
      a = i;
    } else if (e.docView.lastCompositionAfterCursor) {
      let e = U.get(r.node);
      if (!(!e || (e.isText() && e.text != r.node.nodeValue))) {
        a = i;
      }
    }
  }
  e.docView.lastCompositionAfterCursor = a != r;
  if (!a) {
    return null;
  }
  let o = t - a.offset;
  return {
    from: o,
    to: o + a.node.nodeValue.length,
    node: a.node,
  };
}
function _i(view, changes, n) {
  let r = gi(view, n);
  if (!r) {
    return null;
  }
  let { node, from, to } = r;
  let node_nodeValue = node.nodeValue;
  if (
    /[\n\r]/.test(node_nodeValue) ||
    view.state.doc.sliceString(r.from, r.to) != node_nodeValue
  ) {
    return null;
  }
  let t_invertedDesc = changes.invertedDesc;
  return {
    range: new Rr(
      t_invertedDesc.mapPos(from),
      t_invertedDesc.mapPos(to),
      from,
      to,
    ),
    text: node,
  };
}
function vi(node, offset) {
  if (node.nodeType == 1) {
    return (
      (offset && node.childNodes[offset - 1].contentEditable == `false`
        ? 1
        : 0) |
      (offset < node.childNodes.length &&
      node.childNodes[offset].contentEditable == `false`
        ? 2
        : 0)
    );
  }
  return 0;
}
var yi = class {
  constructor() {
    this.changes = [];
  }
  compareRange(e, t) {
    un(e, t, this.changes);
  }
  comparePoint(e, t) {
    un(e, t, this.changes);
  }
  boundChange(e) {
    un(e, e, this.changes);
  }
};
function bi(decorations, t, changes) {
  let r = new yi();
  P.compare(decorations, t, changes, r);
  return r.changes;
}
var xi = class {
  constructor() {
    this.changes = [];
  }
  compareRange(e, t) {
    un(e, t, this.changes);
  }
  comparePoint() {}
  boundChange(e) {
    un(e, e, this.changes);
  }
};
function Si(blockWrappers, t, changes) {
  let r = new xi();
  P.compare(blockWrappers, t, changes, r);
  return r.changes;
}
function Ci(focusNode, dom) {
  for (let n = focusNode; n && n != dom; n = n.assignedSlot || n.parentNode) {
    if (n.nodeType == 1 && n.contentEditable == `false`) {
      return true;
    }
  }
  return false;
}
function wi(changes, hasComposition) {
  let n = false;
  if (hasComposition) {
    changes.iterChangedRanges((e, r) => {
      if (e < hasComposition.to && r > hasComposition.from) {
        n = true;
      }
    });
  }
  return n;
}
var Ti = class extends rn {
  constructor(e) {
    super();
    this.height = e;
  }
  toDOM() {
    let e = document.createElement(`div`);
    e.className = `cm-gap`;
    this.updateDOM(e);
    return e;
  }
  eq(e) {
    return e.height == this.height;
  }
  updateDOM(e) {
    e.style.height = this.height + `px`;
    return true;
  }
  get editable() {
    return true;
  }
  get estimatedHeight() {
    return this.height;
  }
  ignoreEvent() {
    return false;
  }
};
function Ei(state, t, n = 1) {
  let r = state.charCategorizer(t);
  let i = state.doc.lineAt(t);
  let a = t - i.from;
  if (i.length == 0) {
    return k.cursor(t);
  }
  if (a == 0) {
    n = 1;
  } else if (a == i.length) {
    n = -1;
  }
  let o = a;
  let s = a;
  if (n < 0) {
    o = C(i.text, a, false);
  } else {
    s = C(i.text, a);
  }
  let c = r(i.text.slice(o, s));
  while (o > 0) {
    let e = C(i.text, o, false);
    if (r(i.text.slice(e, o)) != c) {
      break;
    }
    o = e;
  }
  while (s < i.length) {
    let e = C(i.text, s);
    if (r(i.text.slice(s, e)) != c) {
      break;
    }
    s = e;
  }
  return k.undirectionalRange(o + i.from, s + i.from);
}
function Di(e, t, n, r, i) {
  let a = Math.round((r - t.left) * e.defaultCharacterWidth);
  if (e.lineWrapping && n.height > e.defaultLineHeight * 1.5) {
    let t = e.viewState.heightOracle.textHeight;
    let r = Math.floor((i - n.top - (e.defaultLineHeight - t) * 0.5) / t);
    a += r * e.viewState.heightOracle.lineLength;
  }
  let o = e.state.sliceDoc(n.from, n.to);
  return n.from + Tt(o, a, e.state.tabSize);
}
function Oi(e, t, n) {
  let r = e.lineBlockAt(t);
  if (Array.isArray(r.type)) {
    let e;
    for (let i of r.type) {
      if (i.from > t) {
        break;
      }
      if (!(i.to < t)) {
        if (i.from < t && i.to > t) {
          return i;
        }
        if (
          !e ||
          (i.type == R.Text &&
            (e.type != i.type || (n < 0 ? i.from < t : i.to > t)))
        ) {
          e = i;
        }
      }
    }
    return e || r;
  }
  return r;
}
function ki(e, t, n, r) {
  let i = Oi(e, t.head, t.assoc || -1);
  let a =
    !r || i.type != R.Text || !(e.lineWrapping || i.widgetLineBreaks)
      ? null
      : e.coordsAtPos(t.assoc < 0 && t.head > i.from ? t.head - 1 : t.head);
  if (a) {
    let t = e.dom.getBoundingClientRect();
    let r = e.textDirectionAt(i.from);
    let o = e.posAtCoords({
      x: n == (r == B.LTR) ? t.right - 1 : t.left + 1,
      y: (a.top + a.bottom) / 2,
    });
    if (o != null) {
      return k.cursor(o, n ? -1 : 1);
    }
  }
  return k.cursor(n ? i.to : i.from, n ? -1 : 1);
}
function Ai(e, t, n, r) {
  let i = e.state.doc.lineAt(t.head);
  let a = e.bidiSpans(i);
  let o = e.textDirectionAt(i.from);
  for (let s = t, c = null; ;) {
    let t = ar(i, a, o, s, n);
    let l = ir;
    if (!t) {
      if (i.number == (n ? e.state.doc.lines : 1)) {
        return s;
      }
      l = `
`;
      i = e.state.doc.line(i.number + (n ? 1 : -1));
      a = e.bidiSpans(i);
      t = n ? k.cursor(i.from, -1) : k.cursor(i.to, 1);
    }
    if (!c) {
      if (!r) {
        return t;
      }
      c = r(l);
    } else if (!c(l)) {
      return s;
    }
    s = t;
  }
}
function ji(e, head, n) {
  let r = e.state.charCategorizer(head);
  let i = r(n);
  return (e) => {
    let t = r(e);
    if (i == M.Space) {
      i = t;
    }
    return i == t;
  };
}
function Mi(e, t, n, r) {
  let t_head = t.head;
  let a = n ? 1 : -1;
  if (t_head == (n ? e.state.doc.length : 0)) {
    return k.cursor(t_head, t.assoc);
  }
  let t_goalColumn = t.goalColumn;
  let s;
  let c = e.contentDOM.getBoundingClientRect();
  let l = e.coordsAtPos(
    t_head,
    t.assoc || ((t.empty ? n : t.head == t.from) ? 1 : -1),
  );
  let e_documentTop = e.documentTop;
  if (l) {
    t_goalColumn ??= l.left - c.left;
    s = a < 0 ? l.top : l.bottom;
  } else {
    let t = e.viewState.lineBlockAt(t_head);
    t_goalColumn ??= Math.min(
      c.right - c.left,
      e.defaultCharacterWidth * (t_head - t.from),
    );
    s = (a < 0 ? t.top : t.bottom) + e_documentTop;
  }
  let x_1 = c.left + t_goalColumn;
  let f = e.viewState.heightOracle.textHeight >> 1;
  let p = r ?? f;
  for (let t = 0; ; t += f) {
    let r = s + (p + t) * a;
    let i = Li(
      e,
      {
        x: x_1,
        y: r,
      },
      false,
      a,
    );
    if (n ? r > c.bottom : r < c.top) {
      return k.cursor(i.pos, i.assoc);
    }
    let l = e.coordsAtPos(i.pos, i.assoc);
    let u = l ? (l.top + l.bottom) / 2 : 0;
    if (!l || (n ? u > s : u < s)) {
      return k.cursor(i.pos, i.assoc, undefined, t_goalColumn);
    }
  }
}
function Ni(e, t, n) {
  while (true) {
    let r = 0;
    for (let i of e) {
      i.between(t - 1, t + 1, (e, i, a) => {
        if (t > e && t < i) {
          let a = r || n || (t - e < i - t ? -1 : 1);
          t = a < 0 ? e : i;
          r = a;
        }
      });
    }
    if (!r) {
      return t;
    }
  }
}
function Pi(e, t) {
  let n = null;
  for (let r = 0; r < t.ranges.length; r++) {
    let range = t.ranges[r];
    let a = null;
    if (range.empty) {
      let t = Ni(e, range.from, 0);
      if (t != range.from) {
        a = k.cursor(t, -1);
      }
    } else {
      let t = Ni(e, range.from, -1);
      let n = Ni(e, range.to, 1);
      if (t != range.from || n != range.to) {
        a = range.undirectional
          ? k.undirectionalRange(range.from, range.to)
          : k.range(
              range.from == range.anchor ? t : n,
              range.from == range.head ? t : n,
            );
      }
    }
    if (a) {
      n ||= t.ranges.slice();
      n[r] = a;
    }
  }
  if (n) {
    return k.create(n, t.mainIndex);
  }
  return t;
}
function Fi(e, t, n) {
  let r = Ni(
    e.state.facet(Mr).map((t) => t(e)),
    n.from,
    t.head > n.from ? -1 : 1,
  );
  if (r == n.from) {
    return n;
  }
  return k.cursor(r, r < n.from ? 1 : -1);
}
class Ii {
  constructor(e, t) {
    this.pos = e;
    this.assoc = t;
  }
}
function Li(e, t, n, r) {
  let i = e.contentDOM.getBoundingClientRect();
  let a = i.top + e.viewState.paddingTop;
  let { x, y } = t;
  let c = y - a;
  let l;
  while (true) {
    if (c < 0) {
      return new Ii(0, 1);
    }
    if (c > e.viewState.docHeight) {
      return new Ii(e.state.doc.length, -1);
    }
    l = e.elementAtHeight(c);
    if (r == null) {
      break;
    }
    if (l.type == R.Text) {
      if (r < 0 ? l.to < e.viewport.from : l.from > e.viewport.to) {
        break;
      }
      let t = e.docView.coordsAt(r < 0 ? l.from : l.to, r > 0 ? -1 : 1);
      if (t && (r < 0 ? t.top <= c + a : t.bottom >= c + a)) {
        break;
      }
    }
    let t = e.viewState.heightOracle.textHeight / 2;
    c = r > 0 ? l.bottom + t : l.top - t;
  }
  if (e.viewport.from >= l.to || e.viewport.to <= l.from) {
    if (n) {
      return null;
    }
    if (l.type == R.Text) {
      let t = Di(e, i, l, x, y);
      return new Ii(t, t == l.from ? 1 : -1);
    }
  }
  if (l.type != R.Text) {
    if (c < (l.top + l.bottom) / 2) {
      return new Ii(l.from, 1);
    }
    return new Ii(l.to, -1);
  }
  let u = e.docView.lineAt(l.from, 2);
  if (!u || u.length != l.length) {
    u = e.docView.lineAt(l.from, -2);
  }
  return new Ri(e, x, y, e.textDirectionAt(l.from)).scanTile(u, l.from);
}
var Ri = class {
  constructor(e, t, n, r) {
    this.view = e;
    this.x = t;
    this.y = n;
    this.baseDir = r;
    this.line = null;
    this.spans = null;
  }
  bidiSpansAt(e) {
    if (!this.line || this.line.from > e || this.line.to < e) {
      this.line = this.view.state.doc.lineAt(e);
      this.spans = this.view.bidiSpans(this.line);
    }
    return this;
  }
  baseDirAt(e, t) {
    let { line, spans } = this.bidiSpansAt(e);
    return spans[Yn.find(spans, e - line.from, -1, t)].level == this.baseDir;
  }
  dirAt(e, t) {
    let { line, spans } = this.bidiSpansAt(e);
    return spans[Yn.find(spans, e - line.from, -1, t)].dir;
  }
  bidiIn(e, t) {
    let { spans, line } = this.bidiSpansAt(e);
    return (
      spans.length > 1 ||
      (spans.length &&
        (spans[0].level != this.baseDir || spans[0].to + line.from < t))
    );
  }
  scan(e, t, n = false) {
    let r = 0;
    let i = e.length - 1;
    let a = new Set();
    let o = this.bidiIn(e[0], e[i]);
    let s;
    let c;
    let i_1 = -1;
    let u = 1000000000;
    let d;
    search: while (r < i) {
      let n = i - r;
      let f = (r + i) >> 1;
      adjust: if (a.has(f)) {
        for (let e = 1; e < n; e++) {
          let t = f + e;
          if (t >= i) {
            t -= n;
          }
          if (!a.has(t)) {
            f = t;
            break adjust;
          }
        }
        break search;
      }
      a.add(f);
      let p = t(f);
      let m = 0;
      if (p) {
        for (const t of p) {
          if (!(t.width == 0 && p.length > 1)) {
            if (t.bottom < this.y) {
              if (!s || s.bottom < t.bottom) {
                s = t;
              }
              m = 1;
            } else if (t.top > this.y) {
              if (!c || c.top > t.top) {
                c = t;
              }
              m = -1;
            } else {
              let e =
                t.left > this.x
                  ? this.x - t.left
                  : t.right < this.x
                    ? this.x - t.right
                    : 0;
              let n = Math.abs(e);
              if (n < u) {
                i_1 = f;
                u = n;
                d = t;
              }
              if (e) {
                m = e < 0 == (this.baseDir == B.LTR) ? -1 : 1;
              }
            }
          }
        }
      }
      if (m == -1 && (!o || this.baseDirAt(e[f], 1))) {
        i = f;
      } else if (m == 1 && (!o || this.baseDirAt(e[f + 1], -1))) {
        r = f + 1;
      }
    }
    if (!d) {
      if (!c && !s) {
        return {
          i: 0,
          after: false,
        };
      }
      let n = s && (!c || this.y - s.bottom < c.top - this.y) ? s : c;
      this.y = (n.top + n.bottom) / 2;
      return this.scan(e, t, true);
    }
    if (u && !n) {
      let { top, bottom } = d;
      if (s && s.bottom > (top + top + bottom) / 3) {
        this.y = s.bottom - 1;
        return this.scan(e, t, true);
      }
      if (c && c.top < (top + bottom + bottom) / 3) {
        this.y = c.top + 1;
        return this.scan(e, t, true);
      }
    }
    let f = (o ? this.dirAt(e[i_1], 1) : this.baseDir) == B.LTR;
    return {
      i: i_1,
      after: this.x > (d.left + d.right) / 2 == f,
    };
  }
  scanText(e, t) {
    let n = [];
    for (let r = 0; r < e.length; r = C(e.text, r)) {
      n.push(t + r);
    }
    n.push(t + e.length);
    let r = this.scan(n, (r) => {
      let i = n[r] - t;
      let a = n[r + 1] - t;
      return Mn(e.dom, i, a).getClientRects();
    });
    if (r.after) {
      return new Ii(n[r.i + 1], -1);
    }
    return new Ii(n[r.i], 1);
  }
  scanTile(e, t) {
    if (!e.length) {
      return new Ii(t, 1);
    }
    if (e.children.length == 1) {
      let n = e.children[0];
      if (n.isText()) {
        return this.scanText(n, t);
      }
      if (n.isComposite()) {
        return this.scanTile(n, t);
      }
    }
    let n = [t];
    for (let r = 0, i = t; r < e.children.length; r++) {
      n.push((i += e.children[r].length));
    }
    let r = this.scan(n, (t) => {
      let n = e.children[t];
      if (n.flags & 48) {
        return null;
      }
      return (
        n.dom.nodeType == 1 ? n.dom : Mn(n.dom, 0, n.length)
      ).getClientRects();
    });
    let i = e.children[r.i];
    let a = n[r.i];
    if (i.isText()) {
      return this.scanText(i, a);
    }
    if (i.isComposite()) {
      return this.scanTile(i, a);
    }
    if (r.after) {
      return new Ii(n[r.i + 1], -1);
    }
    return new Ii(a, 1);
  }
};
const zi = `￿`;
class Bi {
  constructor(e, t) {
    this.points = e;
    this.view = t;
    this.text = ``;
    this.lineSeparator = t.state.facet(N.lineSeparator);
  }
  append(e) {
    this.text += e;
  }
  lineBreak() {
    this.text += zi;
  }
  readRange(e, t) {
    if (!e) {
      return this;
    }
    let e_parentNode = e.parentNode;
    for (let r = e; ;) {
      this.findPointBefore(e_parentNode, r);
      let e = this.text.length;
      this.readNode(r);
      let i = U.get(r);
      let a = r.nextSibling;
      if (a == t) {
        if (i?.breakAfter && !a && e_parentNode != this.view.contentDOM) {
          this.lineBreak();
        }
        break;
      }
      let o = U.get(a);
      if (
        (i && o
          ? i.breakAfter
          : (i ? i.breakAfter : vn(r)) ||
            (vn(a) &&
              (r.nodeName != `BR` || i?.isWidget()) &&
              this.text.length > e)) &&
        !Hi(a, t)
      ) {
        this.lineBreak();
      }
      r = a;
    }
    this.findPointBefore(e_parentNode, t);
    return this;
  }
  readTextNode(e) {
    let e_nodeValue = e.nodeValue;
    for (let n of this.points) {
      if (n.node == e) {
        n.pos = this.text.length + Math.min(n.offset, e_nodeValue.length);
      }
    }
    for (let n = 0, r = this.lineSeparator ? null : /\r\n?|\n/g; ;) {
      let i = -1;
      let a = 1;
      let o;
      if (this.lineSeparator) {
        i = e_nodeValue.indexOf(this.lineSeparator, n);
        a = this.lineSeparator.length;
      } else if ((o = r.exec(e_nodeValue))) {
        i = o.index;
        a = o[0].length;
      }
      this.append(e_nodeValue.slice(n, i < 0 ? e_nodeValue.length : i));
      if (i < 0) {
        break;
      }
      this.lineBreak();
      if (a > 1) {
        for (let t of this.points) {
          if (t.node == e && t.pos > this.text.length) {
            t.pos -= a - 1;
          }
        }
      }
      n = i + a;
    }
  }
  readNode(e) {
    let t = U.get(e);
    let n = t && t.overrideDOMText;
    if (n != null) {
      this.findPointInside(e, n.length);
      for (let e = n.iter(); !e.next().done;) {
        if (e.lineBreak) {
          this.lineBreak();
        } else {
          this.append(e.value);
        }
      }
    } else {
      if (e.nodeType == 3) {
        this.readTextNode(e);
      } else if (e.nodeName == `BR`) {
        if (e.nextSibling) {
          this.lineBreak();
        }
      } else if (e.nodeType == 1) {
        this.readRange(e.firstChild, null);
      }
    }
  }
  findPointBefore(e, t) {
    for (let n of this.points) {
      if (n.node == e && e.childNodes[n.offset] == t) {
        n.pos = this.text.length;
      }
    }
  }
  findPointInside(e, t) {
    for (let n of this.points) {
      if (e.nodeType == 3 ? n.node == e : e.contains(n.node)) {
        n.pos = this.text.length + (Vi(e, n.node, n.offset) ? t : 0);
      }
    }
  }
}
function Vi(e, t, n) {
  while (true) {
    if (!t || n < bn(t)) {
      return false;
    }
    if (t == e) {
      return true;
    }
    n = _n(t) + 1;
    t = t.parentNode;
  }
}
function Hi(e, t) {
  let n;
  for (; e != t && e; e = e.nextSibling) {
    let t = U.get(e);
    if (!t?.isWidget()) {
      return false;
    }
    if (t) {
      (n ||= []).push(t);
    }
  }
  if (n) {
    for (let e of n) {
      if (e.overrideDOMText?.length) {
        return false;
      }
    }
  }
  return true;
}
class Ui {
  constructor(e, t) {
    this.node = e;
    this.offset = t;
    this.pos = -1;
  }
}
class Wi {
  constructor(e, t, n, r) {
    this.typeOver = r;
    this.bounds = null;
    this.text = ``;
    this.domChanged = t > -1;
    let { impreciseHead, impreciseAnchor } = e.docView;
    let o = e.state.selection;
    if (e.state.readOnly && t > -1) {
      this.newSel = null;
    } else if (t > -1 && (this.bounds = Gi(e.docView.tile, t, n, 0))) {
      let t = impreciseHead || impreciseAnchor ? [] : Xi(e);
      let n = new Bi(t, e);
      n.readRange(this.bounds.startDOM, this.bounds.endDOM);
      this.text = n.text;
      this.newSel = Zi(t, this.bounds.from);
    } else {
      let t = e.observer.selectionRange;
      let n =
        (impreciseHead &&
          impreciseHead.node == t.focusNode &&
          impreciseHead.offset == t.focusOffset) ||
        !pn(e.contentDOM, t.focusNode)
          ? o.main.head
          : e.docView.posFromDOM(t.focusNode, t.focusOffset);
      let r =
        (impreciseAnchor &&
          impreciseAnchor.node == t.anchorNode &&
          impreciseAnchor.offset == t.anchorOffset) ||
        !pn(e.contentDOM, t.anchorNode)
          ? o.main.anchor
          : e.docView.posFromDOM(t.anchorNode, t.anchorOffset);
      let s = e.viewport;
      if (
        (L.ios || L.chrome) &&
        n != r &&
        Math.min(n, r) <= o.main.from &&
        Math.max(n, r) >= o.main.to &&
        (s.from > 0 || s.to < e.state.doc.length)
      ) {
        let t = Math.min(n, r);
        let i = Math.max(n, r);
        let a = s.from - t;
        let o = s.to - i;
        if (
          (a == 0 || a == 1 || t == 0) &&
          (o == 0 || o == -1 || i == e.state.doc.length)
        ) {
          n = 0;
          r = e.state.doc.length;
        }
      }
      if (e.inputState.composing > -1 && o.ranges.length > 1) {
        this.newSel = o.replaceRange(k.range(r, n));
      } else if (
        e.lineWrapping &&
        r == n &&
        !(o.main.empty && o.main.head == n) &&
        e.inputState.lastTouchTime > Date.now() - 100
      ) {
        let t = e.coordsAtPos(n, -1);
        let r = 0;
        if (t) {
          r = e.inputState.lastTouchY <= t.bottom ? -1 : 1;
        }
        this.newSel = k.create([k.cursor(n, r)]);
      } else {
        this.newSel = k.single(r, n);
      }
    }
  }
}
function Gi(e, t, n, r) {
  if (e.isComposite()) {
    let i = -1;
    let a = -1;
    let o = -1;
    let s = -1;
    for (let c = 0, l = r, u = r; c < e.children.length; c++) {
      let child = e.children[c];
      let d = l + child.length;
      if (l < t && d > n) {
        return Gi(child, t, n, l);
      }
      if (d >= t && i == -1) {
        i = c;
        a = l;
      }
      if (l > n && child.dom.parentNode == e.dom) {
        o = c;
        s = u;
        break;
      }
      u = d;
      l = d + child.breakAfter;
    }
    return {
      from: a,
      to: s < 0 ? r + e.length : s,
      startDOM:
        (i ? e.children[i - 1].dom.nextSibling : null) || e.dom.firstChild,
      endDOM: o < e.children.length && o >= 0 ? e.children[o].dom : null,
    };
  }
  if (e.isText()) {
    return {
      from: r,
      to: r + e.length,
      startDOM: e.dom,
      endDOM: e.dom.nextSibling,
    };
  }
  return null;
}
function Ki(e, t) {
  let n;
  let { newSel } = t;
  let { state } = e;
  let main = state.selection.main;
  let o =
    e.inputState.lastKeyTime > Date.now() - 100 ? e.inputState.lastKeyCode : -1;
  if (t.bounds) {
    let { from, to } = t.bounds;
    let s = main.from;
    let c = null;
    if (o === 8 || (L.android && t.text.length < to - from)) {
      s = main.to;
      c = `end`;
    }
    let l = state.doc.sliceString(from, to, zi);
    let u;
    let d;
    if (
      !main.empty &&
      main.from >= from &&
      main.to <= to &&
      (t.typeOver || l != t.text) &&
      l.slice(0, main.from - from) == t.text.slice(0, main.from - from) &&
      l.slice(main.to - from) ==
        t.text.slice((u = t.text.length - (l.length - (main.to - from))))
    ) {
      n = {
        from: main.from,
        to: main.to,
        insert: v.of(t.text.slice(main.from - from, u).split(zi)),
      };
    } else if ((d = Yi(l, t.text, s - from, c))) {
      L.chrome &&
        o == 13 &&
        d.toB == d.from + 2 &&
        t.text.slice(d.from, d.toB) == `￿￿` &&
        d.toB--;
      n = {
        from: from + d.from,
        to: from + d.toA,
        insert: v.of(t.text.slice(d.from, d.toB).split(zi)),
      };
    }
  } else {
    if (newSel && ((!e.hasFocus && state.facet(Cr)) || Qi(newSel, main))) {
      newSel = null;
    }
  }
  if (!n && !newSel) {
    return false;
  }
  if (
    (L.mac || L.android) &&
    n &&
    n.from == n.to &&
    n.from == main.head - 1 &&
    /^\. ?$/.test(n.insert.toString()) &&
    e.contentDOM.getAttribute(`autocorrect`) == `off`
  ) {
    if (newSel && n.insert.length == 2) {
      newSel = k.single(newSel.main.anchor - 1, newSel.main.head - 1);
    }
    n = {
      from: n.from,
      to: n.to,
      insert: v.of([n.insert.toString().replace(`.`, ` `)]),
    };
  } else if (
    state.doc.lineAt(main.from).to < main.to &&
    e.docView.lineHasWidget(main.to) &&
    e.inputState.insertingTextAt > Date.now() - 50
  ) {
    n = {
      from: main.from,
      to: main.to,
      insert: state.toText(e.inputState.insertingText),
    };
  } else if (
    L.chrome &&
    n &&
    n.from == n.to &&
    n.from == main.head &&
    n.insert.toString() ==
      `
 ` &&
    e.lineWrapping
  ) {
    newSel &&= k.single(newSel.main.anchor - 1, newSel.main.head - 1);
    n = {
      from: main.from,
      to: main.to,
      insert: v.of([` `]),
    };
  }
  if (n) {
    return qi(e, n, newSel, o);
  }
  if (newSel && !Qi(newSel, main)) {
    let scrollIntoView = false;
    let n = `select`;
    if (e.inputState.lastSelectionTime > Date.now() - 50) {
      if (e.inputState.lastSelectionOrigin == `select`) {
        scrollIntoView = true;
      }
      n = e.inputState.lastSelectionOrigin;
      if (n == `select.pointer`) {
        newSel = Pi(
          state.facet(Mr).map((t) => t(e)),
          newSel,
        );
      }
    }
    e.dispatch({
      selection: newSel,
      scrollIntoView,
      userEvent: n,
    });
    return true;
  }
  return false;
}
function qi(e, t, n, r = -1) {
  if (L.ios && e.inputState.flushIOSKey(t)) {
    return true;
  }
  let main = e.state.selection.main;
  if (
    L.android &&
    ((t.to == main.to &&
      (t.from == main.from ||
        (t.from == main.from - 1 &&
          e.state.sliceDoc(t.from, main.from) == ` `)) &&
      t.insert.length == 1 &&
      t.insert.lines == 2 &&
      Nn(e.contentDOM, `Enter`, 13)) ||
      (((t.from == main.from - 1 && t.to == main.to && t.insert.length == 0) ||
        (r == 8 && t.insert.length < t.to - t.from && t.to > main.head)) &&
        Nn(e.contentDOM, `Backspace`, 8)) ||
      (t.from == main.from &&
        t.to == main.to + 1 &&
        t.insert.length == 0 &&
        Nn(e.contentDOM, `Delete`, 46)))
  ) {
    return true;
  }
  let a = t.insert.toString();
  e.inputState.composing >= 0 && e.inputState.composing++;
  let o;
  let s = () => (o ||= Ji(e, t, n));
  if (!e.state.facet(fr).some((n) => n(e, t.from, t.to, a, s))) {
    e.dispatch(s());
  }
  return true;
}
function Ji(e, t, n) {
  let r;
  let e_state = e.state;
  let main = e_state.selection.main;
  let o = -1;
  if ((t.from == t.to && t.from < main.from) || t.from > main.to) {
    let n = t.from < main.from ? -1 : 1;
    let r = n < 0 ? main.from : main.to;
    let s = Ni(
      e_state.facet(Mr).map((t) => t(e)),
      r,
      n,
    );
    if (t.from == s) {
      o = s;
    }
  }
  if (o > -1) {
    r = {
      changes: t,
      selection: k.cursor(t.from + t.insert.length, -1),
    };
  } else if (
    t.from >= main.from &&
    t.to <= main.to &&
    t.to - t.from >= (main.to - main.from) / 3 &&
    (!n || (n.main.empty && n.main.from == t.from + t.insert.length)) &&
    e.inputState.composing < 0
  ) {
    let n = main.from < t.from ? e_state.sliceDoc(main.from, t.from) : ``;
    let o = main.to > t.to ? e_state.sliceDoc(t.to, main.to) : ``;
    r = e_state.replaceSelection(
      e.state.toText(
        n + t.insert.sliceString(0, undefined, e.state.lineBreak) + o,
      ),
    );
  } else {
    let o = e_state.changes(t);
    let s = n && n.main.to <= o.newLength ? n.main : undefined;
    if (
      e_state.selection.ranges.length > 1 &&
      (e.inputState.composing >= 0 || e.inputState.compositionPendingChange) &&
      t.to <= main.to + 10 &&
      t.to >= main.to - 10
    ) {
      let c = e.state.sliceDoc(t.from, t.to);
      let l;
      let u = n && gi(e, n.main.head);
      if (u) {
        let e = t.insert.length - (t.to - t.from);
        l = {
          from: u.from,
          to: u.to - e,
        };
      } else {
        l = e.state.doc.lineAt(main.head);
      }
      let d = main.to - t.to;
      r = e_state.changeByRange((n) => {
        if (n.from == main.from && n.to == main.to) {
          return {
            changes: o,
            range: s || n.map(o),
          };
        }
        let r = n.to - d;
        let u = r - c.length;
        if (e.state.sliceDoc(u, r) != c || (r >= l.from && u <= l.to)) {
          return {
            range: n,
          };
        }
        let f = e_state.changes({
          from: u,
          to: r,
          insert: t.insert,
        });
        let p = n.to - main.to;
        return {
          changes: f,
          range: s
            ? k.range(Math.max(0, s.anchor + p), Math.max(0, s.head + p))
            : n.map(f),
        };
      });
    } else {
      r = {
        changes: o,
        selection: s && e_state.selection.replaceRange(s),
      };
    }
  }
  let s = `input.type`;
  if (
    e.composing ||
    (e.inputState.compositionPendingChange &&
      e.inputState.compositionEndedAt > Date.now() - 50)
  ) {
    e.inputState.compositionPendingChange = false;
    s += `.compose`;
    if (e.inputState.compositionFirstChange) {
      s += `.start`;
      e.inputState.compositionFirstChange = false;
    }
  }
  return e_state.update(r, {
    userEvent: s,
    scrollIntoView: true,
  });
}
function Yi(e, text, n, r) {
  let i = Math.min(e.length, text.length);
  let a = 0;
  while (a < i && e.charCodeAt(a) == text.charCodeAt(a)) {
    a++;
  }
  if (a == i && e.length == text.length) {
    return null;
  }
  let e_length = e.length;
  let t_length = text.length;
  while (
    e_length > 0 &&
    t_length > 0 &&
    e.charCodeAt(e_length - 1) == text.charCodeAt(t_length - 1)
  ) {
    e_length--;
    t_length--;
  }
  if (r == `end`) {
    let e = Math.max(0, a - Math.min(e_length, t_length));
    n -= e_length + e - a;
  }
  if (e_length < a && e.length < text.length) {
    let e = n <= a && n >= e_length ? a - n : 0;
    a -= e;
    t_length = a + (t_length - e_length);
    e_length = a;
  } else if (t_length < a) {
    let e = n <= a && n >= t_length ? a - n : 0;
    a -= e;
    e_length = a + (e_length - t_length);
    t_length = a;
  }
  return {
    from: a,
    toA: e_length,
    toB: t_length,
  };
}
function Xi(e) {
  let t = [];
  if (e.root.activeElement != e.contentDOM) {
    return t;
  }
  let { anchorNode, anchorOffset, focusNode, focusOffset } =
    e.observer.selectionRange;
  if (anchorNode) {
    t.push(new Ui(anchorNode, anchorOffset));
    if (focusNode != anchorNode || focusOffset != anchorOffset) {
      t.push(new Ui(focusNode, focusOffset));
    }
  }
  return t;
}
function Zi(e, from) {
  if (e.length == 0) {
    return null;
  }
  let pos = e[0].pos;
  let r = e.length == 2 ? e[1].pos : pos;
  if (pos < 0 || r < 0) {
    return null;
  }
  if (pos == r) {
    return k.create([k.cursor(r + from, -1)]);
  }
  return k.single(pos + from, r + from);
}
function Qi(e, main) {
  return main.head == e.main.head && main.anchor == e.main.anchor;
}
class $i {
  setSelectionOrigin(e) {
    this.lastSelectionOrigin = e;
    this.lastSelectionTime = Date.now();
  }
  constructor(e) {
    this.view = e;
    this.lastKeyCode = 0;
    this.lastKeyTime = 0;
    this.touchActive = false;
    this.lastTouchTime = 0;
    this.lastTouchX = 0;
    this.lastTouchY = 0;
    this.lastFocusTime = 0;
    this.lastScrollTop = 0;
    this.lastScrollLeft = 0;
    this.lastWheelEvent = 0;
    this.pendingIOSKey = undefined;
    this.lastIOSMomentumScroll = 0;
    this.tabFocusMode = -1;
    this.lastSelectionOrigin = null;
    this.lastSelectionTime = 0;
    this.lastContextMenu = 0;
    this.scrollHandlers = [];
    this.handlers = Object.create(null);
    this.composing = -1;
    this.compositionFirstChange = null;
    this.compositionEndedAt = 0;
    this.compositionPendingKey = false;
    this.compositionPendingChange = false;
    this.insertingText = ``;
    this.insertingTextAt = 0;
    this.mouseSelection = null;
    this.draggedContent = null;
    this.handleEvent = this.handleEvent.bind(this);
    this.notifiedFocused = e.hasFocus;
    if (L.safari) {
      e.contentDOM.addEventListener(`input`, () => null);
    }
    if (L.gecko) {
      Ia(e.contentDOM.ownerDocument);
    }
  }
  handleEvent(e) {
    pa(this.view, e) &&
      !this.ignoreDuringComposition(e) &&
      ((e.type == `keydown` && this.keydown(e)) ||
        (this.view.updateState == 0
          ? this.runHandlers(e.type, e)
          : Promise.resolve().then(() => this.runHandlers(e.type, e))));
  }
  runHandlers(e, t) {
    let n = this.handlers[e];
    if (n) {
      for (let e of n.observers) {
        e(this.view, t);
      }
      for (let e of n.handlers) {
        if (t.defaultPrevented) {
          break;
        }
        if (e(this.view, t)) {
          t.preventDefault();
          break;
        }
      }
    }
  }
  ensureHandlers(e) {
    let t = na(e);
    let handlers = this.handlers;
    let contentDOM = this.view.contentDOM;
    for (let e in t) {
      if (e != `scroll`) {
        let passive = !t[e].handlers.length;
        let a = handlers[e];
        if (a && passive != !a.handlers.length) {
          contentDOM.removeEventListener(e, this.handleEvent);
          a = null;
        }
        if (!a) {
          contentDOM.addEventListener(e, this.handleEvent, {
            passive,
          });
        }
      }
    }
    for (let e in handlers) {
      if (e != `scroll` && !t[e]) {
        contentDOM.removeEventListener(e, this.handleEvent);
      }
    }
    this.handlers = t;
  }
  keydown(e) {
    this.lastKeyCode = e.keyCode;
    this.lastKeyTime = Date.now();
    if (
      e.keyCode == 9 &&
      this.tabFocusMode > -1 &&
      (!this.tabFocusMode || Date.now() <= this.tabFocusMode)
    ) {
      return true;
    }
    if (this.tabFocusMode > 0 && e.keyCode != 27 && aa.indexOf(e.keyCode) < 0) {
      this.tabFocusMode = -1;
    }
    if (
      L.android &&
      L.chrome &&
      !e.synthetic &&
      (e.keyCode == 13 || e.keyCode == 8)
    ) {
      this.view.observer.delayAndroidKey(e.key, e.keyCode);
      return true;
    }
    if (
      L.ios &&
      !e.synthetic &&
      !e.altKey &&
      !e.metaKey &&
      ((ra.some((t) => t.keyCode == e.keyCode) && !e.ctrlKey) ||
        (ia.indexOf(e.key) > -1 && e.ctrlKey))
    ) {
      let mods = {
        ctrlKey: e.ctrlKey,
        altKey: e.altKey,
        metaKey: e.metaKey,
        shiftKey: e.shiftKey,
      };
      if (
        mods.shiftKey &&
        L.ios &&
        !/^(off|none)$/.test(this.view.contentDOM.autocapitalize) &&
        ea(this.view.win)
      ) {
        mods.shiftKey = false;
      }
      let n = (this.pendingIOSKey = {
        key: e.key,
        keyCode: e.keyCode,
        mods,
      });
      setTimeout(() => {
        if (this.pendingIOSKey == n) {
          this.flushIOSKey();
        }
      }, 50);
      return true;
    }
    if (e.keyCode != 229) {
      this.view.observer.forceFlush();
    }
    return false;
  }
  flushIOSKey(e) {
    let pendingIOSKey = this.pendingIOSKey;
    if (
      !pendingIOSKey ||
      this.view.observer.pendingRecords().length ||
      (pendingIOSKey.key == `Enter` &&
        e &&
        e.from < e.to &&
        /^\S+$/.test(e.insert.toString()))
    ) {
      return false;
    }
    return (
      (this.pendingIOSKey = undefined),
      Nn(
        this.view.contentDOM,
        pendingIOSKey.key,
        pendingIOSKey.keyCode,
        pendingIOSKey.mods,
      )
    );
  }
  ignoreDuringComposition(e) {
    if (!/^key/.test(e.type) || e.synthetic) {
      return false;
    }
    if (this.composing > 0) {
      return true;
    }
    if (
      L.safari &&
      !L.ios &&
      this.compositionPendingKey &&
      Date.now() - this.compositionEndedAt < 100
    ) {
      return ((this.compositionPendingKey = false), true);
    }
    return false;
  }
  startMouseSelection(e) {
    if (this.mouseSelection) {
      this.mouseSelection.destroy();
    }
    this.mouseSelection = e;
  }
  update(e) {
    this.view.observer.update(e);
    if (this.mouseSelection) {
      this.mouseSelection.update(e);
    }
    if (this.draggedContent && e.docChanged) {
      this.draggedContent = this.draggedContent.map(e.changes);
    }
    if (e.transactions.length) {
      this.lastKeyCode = this.lastSelectionTime = 0;
    }
  }
  destroy() {
    if (this.mouseSelection) {
      this.mouseSelection.destroy();
    }
  }
}
function ea(win) {
  if (win.visualViewport) {
    return (
      (win.visualViewport.height * win.visualViewport.scale) /
        win.document.documentElement.clientHeight <
      0.85
    );
  }
  return false;
}
function ta(e, t) {
  return (n, r) => {
    try {
      return t.call(e, r, n);
    } catch (error) {
      Sr(n.state, error);
    }
  };
}
function na(e) {
  let t = Object.create(null);
  function n(e) {
    return (
      t[e] ||
      (t[e] = {
        observers: [],
        handlers: [],
      })
    );
  }
  for (let t of e) {
    let e = t.spec;
    let r = e && e.plugin.domEventHandlers;
    let i = e && e.plugin.domEventObservers;
    if (r) {
      for (let e in r) {
        let i = r[e];
        if (i) {
          n(e).handlers.push(ta(t.value, i));
        }
      }
    }
    if (i) {
      for (let e in i) {
        let r = i[e];
        if (r) {
          n(e).observers.push(ta(t.value, r));
        }
      }
    }
  }
  for (let e in ma) {
    n(e).handlers.push(ma[e]);
  }
  for (let e in ha) {
    n(e).observers.push(ha[e]);
  }
  return t;
}
var ra = [
  {
    key: `Backspace`,
    keyCode: 8,
    inputType: `deleteContentBackward`,
  },
  {
    key: `Enter`,
    keyCode: 13,
    inputType: `insertParagraph`,
  },
  {
    key: `Enter`,
    keyCode: 13,
    inputType: `insertLineBreak`,
  },
  {
    key: `Delete`,
    keyCode: 46,
    inputType: `deleteContentForward`,
  },
];
var ia = `dthko`;
var aa = [16, 17, 18, 20, 91, 92, 224, 225];
const oa = 6;
function sa(e) {
  return Math.max(0, e) * 0.7 + 8;
}
function ca(startEvent, t) {
  return Math.max(
    Math.abs(startEvent.clientX - t.clientX),
    Math.abs(startEvent.clientY - t.clientY),
  );
}
class la {
  constructor(e, t, n, r) {
    this.view = e;
    this.startEvent = t;
    this.style = n;
    this.mustSelect = r;
    this.scrollSpeed = {
      x: 0,
      y: 0,
    };
    this.scrolling = -1;
    this.lastEvent = t;
    this.scrollParents = Tn(e.contentDOM);
    this.atoms = e.state.facet(Mr).map((t) => t(e));
    let i = e.contentDOM.ownerDocument;
    i.addEventListener(`mousemove`, (this.move = this.move.bind(this)));
    i.addEventListener(`mouseup`, (this.up = this.up.bind(this)));
    this.extend = t.shiftKey;
    this.multiple = e.state.facet(N.allowMultipleSelections) && ua(e, t);
    this.dragging = fa(e, t) && Ta(t) == 1 ? null : false;
  }
  start(e) {
    if (this.dragging === false) {
      this.select(e);
    }
  }
  move(e) {
    if (e.buttons == 0) {
      return this.destroy();
    }
    if (
      this.dragging ||
      (this.dragging == null && ca(this.startEvent, e) < 10)
    ) {
      return;
    }
    this.select((this.lastEvent = e));
    let t = 0;
    let n = 0;
    let r = 0;
    let i = 0;
    let innerWidth = this.view.win.innerWidth;
    let innerHeight = this.view.win.innerHeight;
    if (this.scrollParents.x) {
      ({ left: r, right: innerWidth } =
        this.scrollParents.x.getBoundingClientRect());
    }
    if (this.scrollParents.y) {
      ({ top: i, bottom: innerHeight } =
        this.scrollParents.y.getBoundingClientRect());
    }
    let s = Ir(this.view);
    if (e.clientX - s.left <= r + oa) {
      t = -sa(r - e.clientX);
    } else if (e.clientX + s.right >= innerWidth - oa) {
      t = sa(e.clientX - innerWidth);
    }
    if (e.clientY - s.top <= i + oa) {
      n = -sa(i - e.clientY);
    } else if (e.clientY + s.bottom >= innerHeight - oa) {
      n = sa(e.clientY - innerHeight);
    }
    this.setScrollSpeed(t, n);
  }
  up(e) {
    this.dragging ?? this.select(this.lastEvent);
    if (!this.dragging) {
      e.preventDefault();
    }
    this.destroy();
  }
  destroy() {
    this.setScrollSpeed(0, 0);
    let ownerDocument = this.view.contentDOM.ownerDocument;
    ownerDocument.removeEventListener(`mousemove`, this.move);
    ownerDocument.removeEventListener(`mouseup`, this.up);
    this.view.inputState.mouseSelection = this.view.inputState.draggedContent =
      null;
  }
  setScrollSpeed(e, t) {
    this.scrollSpeed = {
      x: e,
      y: t,
    };
    e || t
      ? this.scrolling < 0 &&
        (this.scrolling = setInterval(() => this.scroll(), 50))
      : this.scrolling > -1 &&
        (clearInterval(this.scrolling), (this.scrolling = -1));
  }
  scroll() {
    let { x, y } = this.scrollSpeed;
    if (x && this.scrollParents.x) {
      this.scrollParents.x.scrollLeft += x;
      x = 0;
    }
    if (y && this.scrollParents.y) {
      this.scrollParents.y.scrollTop += y;
      y = 0;
    }
    if (x || y) {
      this.view.win.scrollBy(x, y);
    }
    if (this.dragging === false) {
      this.select(this.lastEvent);
    }
  }
  select(e) {
    let { view } = this;
    let n = Pi(this.atoms, this.style.get(e, this.extend, this.multiple));
    if (
      this.mustSelect ||
      !n.eq(view.state.selection, this.dragging === false)
    ) {
      this.view.dispatch({
        selection: n,
        userEvent: `select.pointer`,
      });
    }
    this.mustSelect = false;
  }
  update(e) {
    if (e.transactions.some((e) => e.isUserEvent(`input.type`))) {
      this.destroy();
    } else if (this.style.update(e)) {
      setTimeout(() => this.select(this.lastEvent), 20);
    }
  }
}
function ua(e, t) {
  let n = e.state.facet(sr);
  if (n.length) {
    return n[0](t);
  }
  if (L.mac) {
    return t.metaKey;
  }
  return t.ctrlKey;
}
function da(e, t) {
  let n = e.state.facet(cr);
  if (n.length) {
    return n[0](t);
  }
  if (L.mac) {
    return !t.altKey;
  }
  return !t.ctrlKey;
}
function fa(e, t) {
  let { main } = e.state.selection;
  if (main.empty) {
    return false;
  }
  let r = fn(e.root);
  if (!r || r.rangeCount == 0) {
    return true;
  }
  let i = r.getRangeAt(0).getClientRects();
  for (const n of i) {
    if (
      n.left <= t.clientX &&
      n.right >= t.clientX &&
      n.top <= t.clientY &&
      n.bottom >= t.clientY
    ) {
      return true;
    }
  }
  return false;
}
function pa(view, t) {
  if (!t.bubbles) {
    return true;
  }
  if (t.defaultPrevented) {
    return false;
  }
  for (let n = t.target, r; n != view.contentDOM; n = n.parentNode) {
    if (
      !n ||
      n.nodeType == 11 ||
      ((r = U.get(n)) && r.isWidget() && !r.isHidden && r.widget.ignoreEvent(t))
    ) {
      return false;
    }
  }
  return true;
}
var ma = Object.create(null);
var ha = Object.create(null);
const ga = (L.ie && L.ie_version < 15) || (L.ios && L.webkit_version < 604);
function _a(e) {
  let parentNode = e.dom.parentNode;
  if (!parentNode) {
    return;
  }
  let n = parentNode.appendChild(document.createElement(`textarea`));
  n.style.cssText = `position: fixed; left: -10000px; top: 10px`;
  n.focus();
  setTimeout(() => {
    e.focus();
    n.remove();
    ya(e, n.value);
  }, 50);
}
function va(e, t, n) {
  for (let r of e.facet(t)) {
    n = r(n, e);
  }
  return n;
}
function ya(e, t) {
  t = va(e.state, mr, t);
  let { state } = e;
  let r;
  let i = 1;
  let a = state.toText(t);
  let o = a.lines == state.selection.ranges.length;
  if (
    ja != null &&
    state.selection.ranges.every((e) => e.empty) &&
    ja == a.toString()
  ) {
    let e = -1;
    r = state.changeByRange((r) => {
      let s = state.doc.lineAt(r.from);
      if (s.from == e) {
        return {
          range: r,
        };
      }
      e = s.from;
      let c = state.toText((o ? a.line(i++).text : t) + state.lineBreak);
      return {
        changes: {
          from: s.from,
          insert: c,
        },
        range: k.cursor(r.from + c.length, -1),
      };
    });
  } else {
    r = o
      ? state.changeByRange((e) => {
          let t = a.line(i++);
          return {
            changes: {
              from: e.from,
              to: e.to,
              insert: t.text,
            },
            range: k.cursor(e.from + t.length, -1),
          };
        })
      : state.replaceSelection(a);
  }
  e.dispatch(r, {
    userEvent: `input.paste`,
    scrollIntoView: true,
  });
}
ha.scroll = (e) => {
  let e_inputState = e.inputState;
  e_inputState.lastScrollTop = e.scrollDOM.scrollTop;
  e_inputState.lastScrollLeft = e.scrollDOM.scrollLeft;
  if (L.ios && !e_inputState.touchActive) {
    e_inputState.lastIOSMomentumScroll = Date.now();
  }
};
ha.wheel = ha.mousewheel = (e) => {
  e.inputState.lastWheelEvent = Date.now();
};
ma.keydown = (e, t) => {
  e.inputState.setSelectionOrigin(`select`);
  if (t.keyCode == 27 && e.inputState.tabFocusMode != 0) {
    e.inputState.tabFocusMode = Date.now() + 2000;
  }
  return false;
};
ha.touchstart = (e, t) => {
  let e_inputState = e.inputState;
  let r = t.targetTouches[0];
  e_inputState.touchActive = true;
  e_inputState.lastTouchTime = Date.now();
  if (r) {
    e_inputState.lastTouchX = r.clientX;
    e_inputState.lastTouchY = r.clientY;
  }
  e_inputState.setSelectionOrigin(`select.pointer`);
};
ha.touchmove = (e) => {
  e.inputState.setSelectionOrigin(`select.pointer`);
};
ha.touchend = (e, t) => {
  e.inputState.touchActive = false;
};
ma.mousedown = (e, t) => {
  e.observer.flush();
  if (e.inputState.lastTouchTime > Date.now() - 2000) {
    return false;
  }
  let n = null;
  for (let r of e.state.facet(lr)) {
    n = r(e, t);
    if (n) {
      break;
    }
  }
  if (!n && t.button == 0) {
    n = Ea(e, t);
  }
  if (n) {
    let r = !e.hasFocus;
    e.inputState.startMouseSelection(new la(e, t, n, r));
    if (r) {
      e.observer.ignore(() => {
        An(e.contentDOM);
        let activeElement = e.root.activeElement;
        if (activeElement && !activeElement.contains(e.contentDOM)) {
          activeElement.blur();
        }
      });
    }
    let i = e.inputState.mouseSelection;
    if (i) {
      i.start(t);
      return i.dragging === false;
    }
  } else {
    e.inputState.setSelectionOrigin(`select.pointer`);
  }
  return false;
};
function ba(e, pos, assoc, r) {
  if (r == 1) {
    return k.cursor(pos, assoc);
  }
  if (r == 2) {
    return Ei(e.state, pos, assoc);
  }
  {
    let r = e.docView.lineAt(pos, assoc);
    let i = e.state.doc.lineAt(r ? r.posAtEnd : pos);
    let a = r ? r.posAtStart : i.from;
    let o = r ? r.posAtEnd : i.to;
    o < e.state.doc.length && o == i.to && o++;
    return k.undirectionalRange(a, o);
  }
}
var xa = L.ie && L.ie_version <= 11;
var Sa = null;
var Ca = 0;
var wa = 0;
function Ta(e) {
  if (!xa) {
    return e.detail;
  }
  let t = Sa;
  let n = wa;
  Sa = e;
  wa = Date.now();
  return (Ca =
    !t ||
    (n > Date.now() - 400 &&
      Math.abs(t.clientX - e.clientX) < 2 &&
      Math.abs(t.clientY - e.clientY) < 2)
      ? (Ca + 1) % 3
      : 1);
}
function Ea(e, t) {
  let n = e.posAndSideAtCoords(
    {
      x: t.clientX,
      y: t.clientY,
    },
    false,
  );
  let r = Ta(t);
  let selection = e.state.selection;
  return {
    update(e) {
      if (e.docChanged) {
        n.pos = e.changes.mapPos(n.pos);
        selection = selection.map(e.changes);
      }
    },
    get(t, a, o) {
      let s = e.posAndSideAtCoords(
        {
          x: t.clientX,
          y: t.clientY,
        },
        false,
      );
      let c;
      let l = ba(e, s.pos, s.assoc, r);
      if (n.pos != s.pos && !a) {
        let t = ba(e, n.pos, n.assoc, r);
        let i = Math.min(t.from, l.from);
        let a = Math.max(t.to, l.to);
        l = i < l.from ? k.range(i, a, l.assoc) : k.range(a, i, l.assoc);
      }
      if (a) {
        return selection.replaceRange(
          selection.main.extend(l.from, l.to, l.assoc),
        );
      }
      if (
        o &&
        r == 1 &&
        selection.ranges.length > 1 &&
        (c = Da(selection, s.pos))
      ) {
        return c;
      }
      if (o) {
        return selection.addRange(l);
      }
      return k.create([l]);
    },
  };
}
function Da(selection, pos) {
  for (let n = 0; n < selection.ranges.length; n++) {
    let { from, to } = selection.ranges[n];
    if (from <= pos && to >= pos) {
      return k.create(
        selection.ranges.slice(0, n).concat(selection.ranges.slice(n + 1)),
        selection.mainIndex == n
          ? 0
          : selection.mainIndex - +(selection.mainIndex > n),
      );
    }
  }
  return null;
}
ma.dragstart = (e, t) => {
  let {
    selection: { main },
  } = e.state;
  if (t.target.draggable) {
    let r = e.docView.tile.nearest(t.target);
    if (r && r.isWidget()) {
      let e = r.posAtStart;
      let t = e + r.length;
      if (e >= main.to || t <= main.from) {
        main = k.undirectionalRange(e, t);
      }
    }
  }
  let { inputState } = e;
  if (inputState.mouseSelection) {
    inputState.mouseSelection.dragging = true;
  }
  inputState.draggedContent = main;
  if (t.dataTransfer) {
    t.dataTransfer.setData(
      `Text`,
      va(e.state, hr, e.state.sliceDoc(main.from, main.to)),
    );
    t.dataTransfer.effectAllowed = `copyMove`;
  }
  return false;
};
ma.dragend = (e) => {
  e.inputState.draggedContent = null;
  return false;
};
function Oa(e, t, n, r) {
  n = va(e.state, mr, n);
  if (!n) {
    return;
  }
  let i = e.posAtCoords(
    {
      x: t.clientX,
      y: t.clientY,
    },
    false,
  );
  let { draggedContent } = e.inputState;
  let o =
    r && draggedContent && da(e, t)
      ? {
          from: draggedContent.from,
          to: draggedContent.to,
        }
      : null;
  let s = {
    from: i,
    insert: n,
  };
  let c = e.state.changes(o ? [o, s] : s);
  e.focus();
  e.dispatch({
    changes: c,
    selection: {
      anchor: c.mapPos(i, -1),
      head: c.mapPos(i, 1),
    },
    userEvent: o ? `move.drop` : `input.drop`,
  });
  e.inputState.draggedContent = null;
}
ma.drop = (e, t) => {
  if (!t.dataTransfer) {
    return false;
  }
  if (e.state.readOnly) {
    return true;
  }
  let files = t.dataTransfer.files;
  if (files && files.length) {
    let r = Array(files.length);
    let i = 0;
    let a = () => {
      if (++i == files.length) {
        Oa(e, t, r.filter((e) => e != null).join(e.state.lineBreak), false);
      }
    };
    for (let e = 0; e < files.length; e++) {
      let t = new FileReader();
      t.onerror = a;
      t.onload = () => {
        if (!/[\x00-\x08\x0e-\x1f]{2}/.test(t.result)) {
          r[e] = t.result;
        }
        a();
      };
      t.readAsText(files[e]);
    }
    return true;
  }
  {
    let n = t.dataTransfer.getData(`Text`);
    if (n) {
      Oa(e, t, n, true);
      return true;
    }
  }
  return false;
};
ma.paste = (e, t) => {
  if (e.state.readOnly) {
    return true;
  }
  e.observer.flush();
  let n = ga ? null : t.clipboardData;
  if (n) {
    return (ya(e, n.getData(`text/plain`) || n.getData(`text/uri-list`)), true);
  }
  return (_a(e), false);
};
function ka(e, text) {
  let parentNode = e.dom.parentNode;
  if (!parentNode) {
    return;
  }
  let r = parentNode.appendChild(document.createElement(`textarea`));
  r.style.cssText = `position: fixed; left: -10000px; top: 10px`;
  r.value = text;
  r.focus();
  r.selectionEnd = text.length;
  r.selectionStart = 0;
  setTimeout(() => {
    r.remove();
    e.focus();
  }, 50);
}
function Aa(state) {
  let t = [];
  let n = [];
  let linewise = false;
  for (let r of state.selection.ranges) {
    if (!r.empty) {
      t.push(state.sliceDoc(r.from, r.to));
      n.push(r);
    }
  }
  if (!t.length) {
    let i = -1;
    for (let { from } of state.selection.ranges) {
      let a = state.doc.lineAt(from);
      if (a.number > i) {
        t.push(a.text);
        n.push({
          from: a.from,
          to: Math.min(state.doc.length, a.to + 1),
        });
      }
      i = a.number;
    }
    linewise = true;
  }
  return {
    text: va(state, hr, t.join(state.lineBreak)),
    ranges: n,
    linewise,
  };
}
var ja = null;
ma.copy = ma.cut = (e, t) => {
  if (!mn(e.contentDOM, e.observer.selectionRange)) {
    return false;
  }
  let { text, ranges, linewise } = Aa(e.state);
  if (!text && !linewise) {
    return false;
  }
  ja = linewise ? text : null;
  if (t.type == `cut` && !e.state.readOnly) {
    e.dispatch({
      changes: ranges,
      scrollIntoView: true,
      userEvent: `delete.cut`,
    });
  }
  let a = ga ? null : t.clipboardData;
  if (a) {
    return (a.clearData(), a.setData(`text/plain`, text), true);
  }
  return (ka(e, text), false);
};
const Ma = Ue.define();
function Na(state, t) {
  let n = [];
  for (let r of state.facet(pr)) {
    let i = r(state, t);
    if (i) {
      n.push(i);
    }
  }
  if (n.length) {
    return state.update({
      effects: n,
      annotations: Ma.of(true),
    });
  }
  return null;
}
function Pa(e) {
  setTimeout(() => {
    let e_hasFocus = e.hasFocus;
    if (e_hasFocus != e.inputState.notifiedFocused) {
      let n = Na(e.state, e_hasFocus);
      if (n) {
        e.dispatch(n);
      } else {
        e.update([]);
      }
    }
  }, 10);
}
ha.focus = (e) => {
  e.inputState.lastFocusTime = Date.now();
  if (
    !e.scrollDOM.scrollTop &&
    (e.inputState.lastScrollTop || e.inputState.lastScrollLeft)
  ) {
    e.scrollDOM.scrollTop = e.inputState.lastScrollTop;
    e.scrollDOM.scrollLeft = e.inputState.lastScrollLeft;
  }
  Pa(e);
};
ha.blur = (e) => {
  e.observer.clearSelectionRange();
  Pa(e);
};
ha.compositionstart = ha.compositionupdate = (e) => {
  if (
    !e.observer.editContext &&
    (e.inputState.compositionFirstChange ??
      (e.inputState.compositionFirstChange = true),
    e.inputState.composing < 0)
  ) {
    let { main } = e.state.selection;
    if (
      !main.empty &&
      e.lineBlockAt(main.from).from != e.lineBlockAt(main.to).from
    ) {
      e.dispatch({
        changes: e.state.selection.ranges
          .filter((e) => !e.empty)
          .map((e) => ({
            from: e.from,
            to: e.to,
          })),
        userEvent: `input`,
      });
    }
    e.inputState.composing = 0;
  }
};
ha.compositionend = (e) => {
  if (!e.observer.editContext) {
    e.inputState.composing = -1;
    e.inputState.compositionEndedAt = Date.now();
    e.inputState.compositionPendingKey = true;
    e.inputState.compositionPendingChange =
      e.observer.pendingRecords().length > 0;
    e.inputState.compositionFirstChange = null;
    if (L.chrome && L.android) {
      e.observer.flushSoon();
    } else if (e.inputState.compositionPendingChange) {
      Promise.resolve().then(() => e.observer.flush());
    } else {
      setTimeout(() => {
        if (e.inputState.composing < 0 && e.docView.hasComposition) {
          e.update([]);
        }
      }, 50);
    }
  }
};
ha.contextmenu = (e) => {
  e.inputState.lastContextMenu = Date.now();
};
ma.beforeinput = (e, t) => {
  if (t.inputType == `insertText` || t.inputType == `insertCompositionText`) {
    e.inputState.insertingText = t.data;
    e.inputState.insertingTextAt = Date.now();
  }
  if (t.inputType == `insertReplacementText` && e.observer.editContext) {
    let n = t.dataTransfer?.getData(`text/plain`);
    let r = t.getTargetRanges();
    if (n && r.length) {
      let t = r[0];
      qi(
        e,
        {
          from: e.posAtDOM(t.startContainer, t.startOffset),
          to: e.posAtDOM(t.endContainer, t.endOffset),
          insert: e.state.toText(n),
        },
        null,
      );
      return true;
    }
  }
  let n;
  if (
    L.chrome &&
    L.android &&
    (n = ra.find((e) => e.inputType == t.inputType)) &&
    (e.observer.delayAndroidKey(n.key, n.keyCode),
    n.key == `Backspace` || n.key == `Delete`)
  ) {
    let t = window.visualViewport?.height || 0;
    setTimeout(() => {
      if ((window.visualViewport?.height || 0) > t + 10 && e.hasFocus) {
        e.contentDOM.blur();
        e.focus();
      }
    }, 100);
  }
  if (L.ios && t.inputType == `deleteContentForward`) {
    e.observer.flushSoon();
  }
  if (L.safari && t.inputType == `insertText` && e.inputState.composing >= 0) {
    setTimeout(() => ha.compositionend(e, t), 20);
  }
  return false;
};
var Fa = new Set();
function Ia(ownerDocument) {
  if (!Fa.has(ownerDocument)) {
    Fa.add(ownerDocument);
    ownerDocument.addEventListener(`copy`, () => {});
    ownerDocument.addEventListener(`cut`, () => {});
  }
}
const La = [`pre-wrap`, `normal`, `pre-line`, `break-spaces`];
let Ra = false;
function za() {
  Ra = false;
}
class Ba {
  constructor(e) {
    this.lineWrapping = e;
    this.doc = v.empty;
    this.heightSamples = {};
    this.lineHeight = 14;
    this.charWidth = 7;
    this.textHeight = 14;
    this.lineLength = 30;
  }
  heightForGap(e, t) {
    let n = this.doc.lineAt(t).number - this.doc.lineAt(e).number + 1;
    if (this.lineWrapping) {
      n += Math.max(
        0,
        Math.ceil((t - e - n * this.lineLength * 0.5) / this.lineLength),
      );
    }
    return this.lineHeight * n;
  }
  heightForLine(e) {
    if (this.lineWrapping) {
      return (
        (1 +
          Math.max(
            0,
            Math.ceil((e - this.lineLength) / Math.max(1, this.lineLength - 5)),
          )) *
        this.lineHeight
      );
    }
    return this.lineHeight;
  }
  setDoc(e) {
    this.doc = e;
    return this;
  }
  mustRefreshForWrapping(e) {
    return La.indexOf(e) > -1 != this.lineWrapping;
  }
  mustRefreshForHeights(e) {
    let t = false;
    for (let n = 0; n < e.length; n++) {
      let r = e[n];
      r < 0
        ? n++
        : this.heightSamples[Math.floor(r * 10)] ||
          ((t = true), (this.heightSamples[Math.floor(r * 10)] = true));
    }
    return t;
  }
  refresh(e, t, n, r, i, a) {
    let o = La.indexOf(e) > -1;
    let s = Math.abs(t - this.lineHeight) > 0.3 || this.lineWrapping != o;
    this.lineWrapping = o;
    this.lineHeight = t;
    this.charWidth = n;
    this.textHeight = r;
    this.lineLength = i;
    if (s) {
      this.heightSamples = {};
      for (let e = 0; e < a.length; e++) {
        let t = a[e];
        if (t < 0) {
          e++;
        } else {
          this.heightSamples[Math.floor(t * 10)] = true;
        }
      }
    }
    return s;
  }
}
class Va {
  constructor(e, t) {
    this.from = e;
    this.heights = t;
    this.index = 0;
  }
  get more() {
    return this.index < this.heights.length;
  }
}
const Ha = class e {
  constructor(e, t, n, r, i) {
    this.from = e;
    this.length = t;
    this.top = n;
    this.height = r;
    this._content = i;
  }
  get type() {
    if (typeof this._content == `number`) {
      return R.Text;
    }
    if (Array.isArray(this._content)) {
      return this._content;
    }
    return this._content.type;
  }
  get to() {
    return this.from + this.length;
  }
  get bottom() {
    return this.top + this.height;
  }
  get widget() {
    if (this._content instanceof sn) {
      return this._content.widget;
    }
    return null;
  }
  get widgetLineBreaks() {
    if (typeof this._content == `number`) {
      return this._content;
    }
    return 0;
  }
  join(t) {
    let n = (Array.isArray(this._content) ? this._content : [this]).concat(
      Array.isArray(t._content) ? t._content : [t],
    );
    return new e(
      this.from,
      this.length + t.length,
      this.top,
      this.height + t.height,
      n,
    );
  }
};
var W = ((e) => {
  e[(e.ByPos = 0)] = `ByPos`;
  e[(e.ByHeight = 1)] = `ByHeight`;
  e[(e.ByPosNoHeight = 2)] = `ByPosNoHeight`;
  return e;
})((W ||= {}));
const Ua = 0.001;
const Wa = class e {
  constructor(e, t, n = 2) {
    this.length = e;
    this.height = t;
    this.flags = n;
  }
  get outdated() {
    return (this.flags & 2) > 0;
  }
  set outdated(e) {
    this.flags = (e ? 2 : 0) | (this.flags & -3);
  }
  setHeight(e) {
    if (this.height != e) {
      if (Math.abs(this.height - e) > Ua) {
        Ra = true;
      }
      this.height = e;
    }
  }
  replace(t, n, r) {
    return e.of(r);
  }
  decomposeLeft(e, t) {
    t.push(this);
  }
  decomposeRight(e, t) {
    t.push(this);
  }
  applyChanges(e, t, n, r) {
    let i = this;
    let n_doc = n.doc;
    for (let o = r.length - 1; o >= 0; o--) {
      let { fromA, toA, fromB, toB } = r[o];
      let d = i.lineAt(fromA, W.ByPosNoHeight, n.setDoc(t), 0, 0);
      let f = d.to >= toA ? d : i.lineAt(toA, W.ByPosNoHeight, n, 0, 0);
      toB += f.to - toA;
      for (toA = f.to; o > 0 && d.from <= r[o - 1].toA;) {
        fromA = r[o - 1].fromA;
        fromB = r[o - 1].fromB;
        o--;
        if (fromA < d.from) {
          d = i.lineAt(fromA, W.ByPosNoHeight, n, 0, 0);
        }
      }
      fromB += d.from - fromA;
      fromA = d.from;
      let p = $a.build(n.setDoc(n_doc), e, fromB, toB);
      i = Ga(i, i.replace(fromA, toA, p));
    }
    return i.updateHeight(n, 0);
  }
  static empty() {
    return new Ja(0, 0, 0);
  }
  static of(t) {
    if (t.length == 1) {
      return t[0];
    }
    let n = 0;
    let t_length = t.length;
    let i = 0;
    let a = 0;
    while (true) {
      if (n == t_length) {
        if (i > a * 2) {
          let e = t[n - 1];
          if (e.break) {
            t.splice(--n, 1, e.left, null, e.right);
          } else {
            t.splice(--n, 1, e.left, e.right);
          }
          t_length += 1 + e.break;
          i -= e.size;
        } else if (a > i * 2) {
          let e = t[t_length];
          if (e.break) {
            t.splice(t_length, 1, e.left, null, e.right);
          } else {
            t.splice(t_length, 1, e.left, e.right);
          }
          t_length += 2 + e.break;
          a -= e.size;
        } else {
          break;
        }
      } else if (i < a) {
        let e = t[n++];
        if (e) {
          i += e.size;
        }
      } else {
        let e = t[--t_length];
        if (e) {
          a += e.size;
        }
      }
    }
    let o = false;
    if (t[n - 1] == null) {
      o = true;
      n--;
    } else {
      t[n] ?? ((o = true), t_length++);
    }
    return new Xa(e.of(t.slice(0, n)), o, e.of(t.slice(t_length)));
  }
};
function Ga(e, t) {
  if (e == t) {
    return e;
  }
  return (e.constructor != t.constructor && (Ra = true), t);
}
Wa.prototype.size = 1;
const Ka = z.replace({});
class qa extends Wa {
  constructor(e, t, n) {
    super(e, t);
    this.deco = n;
    this.spaceAbove = 0;
  }
  mainBlock(e, t) {
    return new Ha(
      t,
      this.length,
      e + this.spaceAbove,
      this.height - this.spaceAbove,
      this.deco || 0,
    );
  }
  blockAt(e, t, n, r) {
    if (this.spaceAbove && e < n + this.spaceAbove) {
      return new Ha(r, 0, n, this.spaceAbove, Ka);
    }
    return this.mainBlock(n, r);
  }
  lineAt(e, t, n, r, i) {
    let a = this.mainBlock(r, i);
    if (this.spaceAbove) {
      return this.blockAt(0, n, r, i).join(a);
    }
    return a;
  }
  forEachLine(e, t, n, r, i, a) {
    if (e <= i + this.length && t >= i) {
      a(this.lineAt(0, W.ByPos, n, r, i));
    }
  }
  setMeasuredHeight(e) {
    let t = e.heights[e.index++];
    if (t < 0) {
      this.spaceAbove = -t;
      t = e.heights[e.index++];
    } else {
      this.spaceAbove = 0;
    }
    this.setHeight(t);
  }
  updateHeight(e, t = 0, n = false, r) {
    if (r && r.from <= t && r.more) {
      this.setMeasuredHeight(r);
    }
    this.outdated = false;
    return this;
  }
  toString() {
    return `block(${this.length})`;
  }
}
var Ja = class e extends qa {
  constructor(e, t, n) {
    super(e, t, null);
    this.collapsed = 0;
    this.widgetHeight = 0;
    this.breaks = 0;
    this.spaceAbove = n;
  }
  mainBlock(e, t) {
    return new Ha(
      t,
      this.length,
      e + this.spaceAbove,
      this.height - this.spaceAbove,
      this.breaks,
    );
  }
  replace(t, n, r) {
    let i = r[0];
    if (
      r.length == 1 &&
      (i instanceof e || (i instanceof Ya && i.flags & 4)) &&
      Math.abs(this.length - i.length) < 10
    ) {
      return (
        i instanceof Ya
          ? (i = new e(i.length, this.height, this.spaceAbove))
          : (i.height = this.height),
        this.outdated || (i.outdated = false),
        i
      );
    }
    return Wa.of(r);
  }
  updateHeight(e, t = 0, n = false, r) {
    if (r && r.from <= t && r.more) {
      this.setMeasuredHeight(r);
    } else if (n || this.outdated) {
      this.spaceAbove = 0;
      this.setHeight(
        Math.max(
          this.widgetHeight,
          e.heightForLine(this.length - this.collapsed),
        ) +
          this.breaks * e.lineHeight,
      );
    }
    this.outdated = false;
    return this;
  }
  toString() {
    return `line(${this.length}${this.collapsed ? -this.collapsed : ``}${this.widgetHeight ? `:` + this.widgetHeight : ``})`;
  }
};
var Ya = class e extends Wa {
  constructor(e) {
    super(e, 0);
  }
  heightMetrics(e, t) {
    let number = e.doc.lineAt(t).number;
    let number_1 = e.doc.lineAt(t + this.length).number;
    let i = number_1 - number + 1;
    let perLine;
    let perChar = 0;
    if (e.lineWrapping) {
      let t = Math.min(this.height, e.lineHeight * i);
      perLine = t / i;
      if (this.length > i + 1) {
        perChar = (this.height - t) / (this.length - i - 1);
      }
    } else {
      perLine = this.height / i;
    }
    return {
      firstLine: number,
      lastLine: number_1,
      perLine,
      perChar,
    };
  }
  blockAt(e, t, n, r) {
    let { firstLine, lastLine, perLine, perChar } = this.heightMetrics(t, r);
    if (t.lineWrapping) {
      let i =
        r +
        (e < t.lineHeight
          ? 0
          : Math.round(
              Math.max(0, Math.min(1, (e - n) / this.height)) * this.length,
            ));
      let a = t.doc.lineAt(i);
      let c = perLine + a.length * perChar;
      let l = Math.max(n, e - c / 2);
      return new Ha(a.from, a.length, l, c, 0);
    }
    {
      let r = Math.max(
        0,
        Math.min(lastLine - firstLine, Math.floor((e - n) / perLine)),
      );
      let { from, length } = t.doc.line(firstLine + r);
      return new Ha(from, length, n + perLine * r, perLine, 0);
    }
  }
  lineAt(e, t, n, r, i) {
    if (t == W.ByHeight) {
      return this.blockAt(e, n, r, i);
    }
    if (t == W.ByPosNoHeight) {
      let { from, to } = n.doc.lineAt(e);
      return new Ha(from, to - from, 0, 0, 0);
    }
    let { firstLine, perLine, perChar } = this.heightMetrics(n, i);
    let c = n.doc.lineAt(e);
    let l = perLine + c.length * perChar;
    let u = c.number - firstLine;
    let d = r + perLine * u + perChar * (c.from - i - u);
    return new Ha(
      c.from,
      c.length,
      Math.max(r, Math.min(d, r + this.height - l)),
      l,
      0,
    );
  }
  forEachLine(e, t, n, r, i, a) {
    e = Math.max(e, i);
    t = Math.min(t, i + this.length);
    let { firstLine, perLine, perChar } = this.heightMetrics(n, i);
    for (let l = e, u = r; l <= t;) {
      let t = n.doc.lineAt(l);
      if (l == e) {
        let n = t.number - firstLine;
        u += perLine * n + perChar * (e - i - n);
      }
      let r = perLine + perChar * t.length;
      a(new Ha(t.from, t.length, u, r, 0));
      u += r;
      l = t.to + 1;
    }
  }
  replace(t, n, r) {
    let i = this.length - n;
    if (i > 0) {
      let t = r[r.length - 1];
      if (t instanceof e) {
        r[r.length - 1] = new e(t.length + i);
      } else {
        r.push(null, new e(i - 1));
      }
    }
    if (t > 0) {
      let n = r[0];
      if (n instanceof e) {
        r[0] = new e(t + n.length);
      } else {
        r.unshift(new e(t - 1), null);
      }
    }
    return Wa.of(r);
  }
  decomposeLeft(t, n) {
    n.push(new e(t - 1), null);
  }
  decomposeRight(t, n) {
    n.push(null, new e(this.length - t - 1));
  }
  updateHeight(t, n = 0, r = false, i) {
    let a = n + this.length;
    if (i && i.from <= n + this.length && i.more) {
      let r = [];
      let o = Math.max(n, i.from);
      let s = -1;
      for (
        i.from > n && r.push(new e(i.from - n - 1).updateHeight(t, n));
        o <= a && i.more;
      ) {
        let e = t.doc.lineAt(o).length;
        if (r.length) {
          r.push(null);
        }
        let n = i.heights[i.index++];
        let a = 0;
        if (n < 0) {
          a = -n;
          n = i.heights[i.index++];
        }
        if (s == -1) {
          s = n;
        } else if (Math.abs(n - s) >= Ua) {
          s = -2;
        }
        let c = new Ja(e, n, a);
        c.outdated = false;
        r.push(c);
        o += e + 1;
      }
      if (o <= a) {
        r.push(null, new e(a - o).updateHeight(t, o));
      }
      let c = Wa.of(r);
      if (
        s < 0 ||
        Math.abs(c.height - this.height) >= Ua ||
        Math.abs(s - this.heightMetrics(t, n).perLine) >= Ua
      ) {
        Ra = true;
      }
      return Ga(this, c);
    }
    if (r || this.outdated) {
      this.setHeight(t.heightForGap(n, n + this.length));
      this.outdated = false;
    }
    return this;
  }
  toString() {
    return `gap(${this.length})`;
  }
};
var Xa = class extends Wa {
  constructor(e, t, n) {
    super(
      e.length + +!!t + n.length,
      e.height + n.height,
      +!!t | (e.outdated || n.outdated ? 2 : 0),
    );
    this.left = e;
    this.right = n;
    this.size = e.size + n.size;
  }
  get break() {
    return this.flags & 1;
  }
  blockAt(e, t, n, r) {
    let i = n + this.left.height;
    if (e < i) {
      return this.left.blockAt(e, t, n, r);
    }
    return this.right.blockAt(e, t, i, r + this.left.length + this.break);
  }
  lineAt(e, t, n, r, i) {
    let a = r + this.left.height;
    let o = i + this.left.length + this.break;
    let s = t == W.ByHeight ? e < a : e < o;
    let c = s
      ? this.left.lineAt(e, t, n, r, i)
      : this.right.lineAt(e, t, n, a, o);
    if (this.break || (s ? c.to < o : c.from > o)) {
      return c;
    }
    let l = t == W.ByPosNoHeight ? W.ByPosNoHeight : W.ByPos;
    if (s) {
      return c.join(this.right.lineAt(o, l, n, a, o));
    }
    return this.left.lineAt(o, l, n, r, i).join(c);
  }
  forEachLine(e, t, n, r, i, a) {
    let o = r + this.left.height;
    let s = i + this.left.length + this.break;
    if (this.break) {
      if (e < s) {
        this.left.forEachLine(e, t, n, r, i, a);
      }
      if (t >= s) {
        this.right.forEachLine(e, t, n, o, s, a);
      }
    } else {
      let c = this.lineAt(s, W.ByPos, n, r, i);
      if (e < c.from) {
        this.left.forEachLine(e, Math.min(t, c.from - 1), n, r, i, a);
      }
      if (c.to >= e && c.from <= t) {
        a(c);
      }
      if (t > c.to) {
        this.right.forEachLine(Math.max(e, c.to + 1), t, n, o, s, a);
      }
    }
  }
  replace(e, t, n) {
    let r = this.left.length + this.break;
    if (t < r) {
      return this.balanced(this.left.replace(e, t, n), this.right);
    }
    if (e > this.left.length) {
      return this.balanced(this.left, this.right.replace(e - r, t - r, n));
    }
    let i = [];
    if (e > 0) {
      this.decomposeLeft(e, i);
    }
    let i_length = i.length;
    for (let e of n) {
      i.push(e);
    }
    if (e > 0) {
      Za(i, i_length - 1);
    }
    if (t < this.length) {
      let e = i.length;
      this.decomposeRight(t, i);
      Za(i, e);
    }
    return Wa.of(i);
  }
  decomposeLeft(e, t) {
    let length = this.left.length;
    if (e <= length) {
      return this.left.decomposeLeft(e, t);
    }
    t.push(this.left);
    this.break && (length++, e >= length && t.push(null));
    if (e > length) {
      this.right.decomposeLeft(e - length, t);
    }
  }
  decomposeRight(e, t) {
    let length = this.left.length;
    let r = length + this.break;
    if (e >= r) {
      return this.right.decomposeRight(e - r, t);
    }
    if (e < length) {
      this.left.decomposeRight(e, t);
    }
    if (this.break && e < r) {
      t.push(null);
    }
    t.push(this.right);
  }
  balanced(e, t) {
    if (e.size > 2 * t.size || t.size > 2 * e.size) {
      return Wa.of(this.break ? [e, null, t] : [e, t]);
    }
    return (
      (this.left = Ga(this.left, e)),
      (this.right = Ga(this.right, t)),
      this.setHeight(e.height + t.height),
      (this.outdated = e.outdated || t.outdated),
      (this.size = e.size + t.size),
      (this.length = e.length + this.break + t.length),
      this
    );
  }
  updateHeight(e, t = 0, n = false, r) {
    let { left, right } = this;
    let o = t + left.length + this.break;
    let s = null;
    if (r && r.from <= t + left.length && r.more) {
      s = left = left.updateHeight(e, t, n, r);
    } else {
      left.updateHeight(e, t, n);
    }
    if (r && r.from <= o + right.length && r.more) {
      s = right = right.updateHeight(e, o, n, r);
    } else {
      right.updateHeight(e, o, n);
    }
    if (s) {
      return this.balanced(left, right);
    }
    return (
      (this.height = this.left.height + this.right.height),
      (this.outdated = false),
      this
    );
  }
  toString() {
    return this.left + (this.break ? ` ` : `-`) + this.right;
  }
};
function Za(e, t) {
  let n;
  let r;
  if (
    e[t] == null &&
    (n = e[t - 1]) instanceof Ya &&
    (r = e[t + 1]) instanceof Ya
  ) {
    e.splice(t - 1, 3, new Ya(n.length + 1 + r.length));
  }
}
const Qa = 5;
var $a = class e {
  constructor(e, t) {
    this.pos = e;
    this.oracle = t;
    this.nodes = [];
    this.lineStart = -1;
    this.lineEnd = -1;
    this.covering = null;
    this.writtenTo = e;
  }
  get isCovered() {
    return this.covering && this.nodes[this.nodes.length - 1] == this.covering;
  }
  span(e, t) {
    if (this.lineStart > -1) {
      let e = Math.min(t, this.lineEnd);
      let n = this.nodes[this.nodes.length - 1];
      if (n instanceof Ja) {
        n.length += e - this.pos;
      } else if (e > this.pos || !this.isCovered) {
        this.nodes.push(new Ja(e - this.pos, -1, 0));
      }
      this.writtenTo = e;
      if (t > e) {
        this.nodes.push(null);
        this.writtenTo++;
        this.lineStart = -1;
      }
    }
    this.pos = t;
  }
  point(e, t, n) {
    if (e < t || n.heightRelevant) {
      let r = n.widget ? n.widget.estimatedHeight : 0;
      let i = n.widget ? n.widget.lineBreaks : 0;
      if (r < 0) {
        r = this.oracle.lineHeight;
      }
      let a = t - e;
      if (n.block) {
        this.addBlock(new qa(a, r, n));
      } else if (a || i || r >= Qa) {
        this.addLineDeco(r, i, a);
      }
    } else {
      if (t > e) {
        this.span(e, t);
      }
    }
    if (this.lineEnd > -1 && this.lineEnd < this.pos) {
      this.lineEnd = this.oracle.doc.lineAt(this.pos).to;
    }
  }
  enterLine() {
    if (this.lineStart > -1) {
      return;
    }
    let { from, to } = this.oracle.doc.lineAt(this.pos);
    this.lineStart = from;
    this.lineEnd = to;
    if (this.writtenTo < from) {
      if (
        this.writtenTo < from - 1 ||
        this.nodes[this.nodes.length - 1] == null
      ) {
        this.nodes.push(this.blankContent(this.writtenTo, from - 1));
      }
      this.nodes.push(null);
    }
    if (this.pos > from) {
      this.nodes.push(new Ja(this.pos - from, -1, 0));
    }
    this.writtenTo = this.pos;
  }
  blankContent(e, t) {
    let n = new Ya(t - e);
    if (this.oracle.doc.lineAt(e).to == t) {
      n.flags |= 4;
    }
    return n;
  }
  ensureLine() {
    this.enterLine();
    let e = this.nodes.length ? this.nodes[this.nodes.length - 1] : null;
    if (e instanceof Ja) {
      return e;
    }
    let t = new Ja(0, -1, 0);
    this.nodes.push(t);
    return t;
  }
  addBlock(e) {
    this.enterLine();
    let e_deco = e.deco;
    if (e_deco && e_deco.startSide > 0 && !this.isCovered) {
      this.ensureLine();
    }
    this.nodes.push(e);
    this.writtenTo = this.pos += e.length;
    if (e_deco && e_deco.endSide > 0) {
      this.covering = e;
    }
  }
  addLineDeco(e, t, n) {
    let r = this.ensureLine();
    r.length += n;
    r.collapsed += n;
    r.widgetHeight = Math.max(r.widgetHeight, e);
    r.breaks += t;
    this.writtenTo = this.pos += n;
  }
  finish(e) {
    let t = this.nodes.length == 0 ? null : this.nodes[this.nodes.length - 1];
    if (this.lineStart > -1 && !(t instanceof Ja) && !this.isCovered) {
      this.nodes.push(new Ja(0, -1, 0));
    } else if (this.writtenTo < this.pos || t == null) {
      this.nodes.push(this.blankContent(this.writtenTo, this.pos));
    }
    let n = e;
    for (let e of this.nodes) {
      if (e instanceof Ja) {
        e.updateHeight(this.oracle, n);
      }
      n += e ? e.length : 1;
    }
    return this.nodes;
  }
  static build(t, n, r, i) {
    let a = new e(r, t);
    P.spans(n, r, i, a, 0);
    return a.finish(r);
  }
};
function eo(stateDeco, t, n) {
  let r = new to();
  P.compare(stateDeco, t, n, r, 0);
  return r.changes;
}
var to = class {
  constructor() {
    this.changes = [];
  }
  compareRange() {}
  comparePoint(e, t, n, r) {
    if (e < t || (n && n.heightRelevant) || (r && r.heightRelevant)) {
      un(e, t, this.changes, 5);
    }
  }
};
function no(e, t) {
  let n = e.getBoundingClientRect();
  let e_ownerDocument = e.ownerDocument;
  let i = e_ownerDocument.defaultView || window;
  let a = Math.max(0, n.left);
  let o = Math.min(i.innerWidth, n.right);
  let s = Math.max(0, n.top);
  let c = Math.min(i.innerHeight, n.bottom);
  for (let t = e.parentNode; t && t != e_ownerDocument.body;) {
    if (t.nodeType == 1) {
      let n = t;
      let r = window.getComputedStyle(n);
      if (
        (n.scrollHeight > n.clientHeight || n.scrollWidth > n.clientWidth) &&
        r.overflow != `visible`
      ) {
        let r = n.getBoundingClientRect();
        a = Math.max(a, r.left);
        o = Math.min(o, r.right);
        s = Math.max(s, r.top);
        c = Math.min(t == e.parentNode ? i.innerHeight : c, r.bottom);
      }
      t =
        r.position == `absolute` || r.position == `fixed`
          ? n.offsetParent
          : n.parentNode;
    } else if (t.nodeType == 11) {
      t = t.host;
    } else {
      break;
    }
  }
  return {
    left: a - n.left,
    right: Math.max(a, o) - n.left,
    top: s - (n.top + t),
    bottom: Math.max(s, c) - (n.top + t),
  };
}
function ro(dom) {
  let t = dom.getBoundingClientRect();
  let n = dom.ownerDocument.defaultView || window;
  return (
    t.left < n.innerWidth &&
    t.right > 0 &&
    t.top < n.innerHeight &&
    t.bottom > 0
  );
}
function io(e, t) {
  let n = e.getBoundingClientRect();
  return {
    left: 0,
    right: n.right - n.left,
    top: t,
    bottom: n.bottom - (n.top + t),
  };
}
class ao {
  constructor(e, t, n, r) {
    this.from = e;
    this.to = t;
    this.size = n;
    this.displaySize = r;
  }
  static same(e, t) {
    if (e.length != t.length) {
      return false;
    }
    for (let n = 0; n < e.length; n++) {
      let r = e[n];
      let i = t[n];
      if (r.from != i.from || r.to != i.to || r.size != i.size) {
        return false;
      }
    }
    return true;
  }
  draw(e, t) {
    return z
      .replace({
        widget: new oo(this.displaySize * (t ? e.scaleY : e.scaleX), t),
      })
      .range(this.from, this.to);
  }
}
var oo = class extends rn {
  constructor(e, t) {
    super();
    this.size = e;
    this.vertical = t;
  }
  eq(e) {
    return e.size == this.size && e.vertical == this.vertical;
  }
  toDOM() {
    let e = document.createElement(`div`);
    if (this.vertical) {
      e.style.height = this.size + `px`;
    } else {
      e.style.width = this.size + `px`;
      e.style.height = `2px`;
      e.style.display = `inline-block`;
    }
    return e;
  }
  get estimatedHeight() {
    if (this.vertical) {
      return this.size;
    }
    return -1;
  }
};
class so {
  constructor(e, t) {
    this.view = e;
    this.state = t;
    this.pixelViewport = {
      left: 0,
      right: window.innerWidth,
      top: 0,
      bottom: 0,
    };
    this.inView = true;
    this.paddingTop = 0;
    this.paddingBottom = 0;
    this.contentDOMWidth = 0;
    this.contentDOMHeight = 0;
    this.editorHeight = 0;
    this.editorWidth = 0;
    this.scaleX = 1;
    this.scaleY = 1;
    this.scrollOffset = 0;
    this.scrolledToBottom = false;
    this.scrollAnchorPos = 0;
    this.scrollAnchorHeight = -1;
    this.scaler = mo;
    this.scrollTarget = null;
    this.printing = false;
    this.mustMeasureContent = true;
    this.defaultTextDirection = B.LTR;
    this.visibleRanges = [];
    this.mustEnforceCursorAssoc = false;
    let n = t
      .facet(Or)
      .some((e) => typeof e != `function` && e.class == `cm-lineWrapping`);
    this.heightOracle = new Ba(n);
    this.stateDeco = ho(t);
    this.heightMap = Wa.empty().applyChanges(
      this.stateDeco,
      v.empty,
      this.heightOracle.setDoc(t.doc),
      [new Rr(0, 0, 0, t.doc.length)],
    );
    for (
      let e = 0;
      e < 2 &&
      ((this.viewport = this.getViewport(0, null)), this.updateForViewport());
      e++
    );
    this.updateViewportLines();
    this.lineGaps = this.ensureLineGaps([]);
    this.lineGapDeco = z.set(this.lineGaps.map((e) => e.draw(this, false)));
    this.scrollParent = e.scrollDOM;
    this.computeVisibleRanges();
  }
  updateForViewport() {
    let e = [this.viewport];
    let { main } = this.state.selection;
    for (let n = 0; n <= 1; n++) {
      let r = n ? main.head : main.anchor;
      if (!e.some(({ from, to }) => r >= from && r <= to)) {
        let { from, to } = this.lineBlockAt(r);
        e.push(new co(from, to));
      }
    }
    this.viewports = e.sort((e, t) => e.from - t.from);
    return this.updateScaler();
  }
  updateScaler() {
    let scaler = this.scaler;
    this.scaler =
      this.heightMap.height <= 7000000
        ? mo
        : new go(this.heightOracle, this.heightMap, this.viewports);
    if (scaler.eq(this.scaler)) {
      return 0;
    }
    return 2;
  }
  updateViewportLines() {
    this.viewportLines = [];
    this.heightMap.forEachLine(
      this.viewport.from,
      this.viewport.to,
      this.heightOracle.setDoc(this.state.doc),
      0,
      0,
      (e) => {
        this.viewportLines.push(_o(e, this.scaler));
      },
    );
  }
  update(e, t = null) {
    this.state = e.state;
    let stateDeco = this.stateDeco;
    this.stateDeco = ho(this.state);
    let e_changedRanges = e.changedRanges;
    let i = Rr.extendWithRanges(
      e_changedRanges,
      eo(
        stateDeco,
        this.stateDeco,
        e ? e.changes : E.empty(this.state.doc.length),
      ),
    );
    let height = this.heightMap.height;
    let o = this.scrolledToBottom
      ? null
      : this.scrollAnchorAt(this.scrollOffset);
    za();
    this.heightMap = this.heightMap.applyChanges(
      this.stateDeco,
      e.startState.doc,
      this.heightOracle.setDoc(this.state.doc),
      i,
    );
    if (this.heightMap.height != height || Ra) {
      e.flags |= 2;
    }
    if (o) {
      this.scrollAnchorPos = e.changes.mapPos(o.from, -1);
      this.scrollAnchorHeight = o.top;
    } else {
      this.scrollAnchorPos = -1;
      this.scrollAnchorHeight = height;
    }
    let s = i.length
      ? this.mapViewport(this.viewport, e.changes)
      : this.viewport;
    if (
      (t && (t.range.head < s.from || t.range.head > s.to)) ||
      !this.viewportIsAppropriate(s)
    ) {
      s = this.getViewport(0, t);
    }
    let c = s.from != this.viewport.from || s.to != this.viewport.to;
    this.viewport = s;
    e.flags |= this.updateForViewport();
    if (c || !e.changes.empty || e.flags & 2) {
      this.updateViewportLines();
    }
    if (this.lineGaps.length || this.viewport.to - this.viewport.from > 4000) {
      this.updateLineGaps(
        this.ensureLineGaps(this.mapLineGaps(this.lineGaps, e.changes)),
      );
    }
    e.flags |= this.computeVisibleRanges(e.changes);
    if (t) {
      this.scrollTarget = t;
    }
    if (
      !this.mustEnforceCursorAssoc &&
      (e.selectionSet || e.focusChanged) &&
      e.view.lineWrapping &&
      e.state.selection.main.empty &&
      e.state.selection.main.assoc &&
      !e.state.facet(_r)
    ) {
      this.mustEnforceCursorAssoc = true;
    }
  }
  measure() {
    let { view } = this;
    let view_contentDOM = view.contentDOM;
    let n = window.getComputedStyle(view_contentDOM);
    let heightOracle = this.heightOracle;
    let n_whiteSpace = n.whiteSpace;
    this.defaultTextDirection = n.direction == `rtl` ? B.RTL : B.LTR;
    let a =
      this.heightOracle.mustRefreshForWrapping(n_whiteSpace) ||
      this.mustMeasureContent === `refresh`;
    let o = view_contentDOM.getBoundingClientRect();
    let s = a || this.mustMeasureContent || this.contentDOMHeight != o.height;
    this.contentDOMHeight = o.height;
    this.mustMeasureContent = false;
    let c = 0;
    let l = 0;
    if (o.width && o.height) {
      let { scaleX, scaleY } = Cn(view_contentDOM, o);
      if (
        (scaleX > 0.005 && Math.abs(this.scaleX - scaleX) > 0.005) ||
        (scaleY > 0.005 && Math.abs(this.scaleY - scaleY) > 0.005)
      ) {
        this.scaleX = scaleX;
        this.scaleY = scaleY;
        c |= 16;
        a = s = true;
      }
    }
    let u = (parseInt(n.paddingTop) || 0) * this.scaleY;
    let d = (parseInt(n.paddingBottom) || 0) * this.scaleY;
    if (this.paddingTop != u || this.paddingBottom != d) {
      this.paddingTop = u;
      this.paddingBottom = d;
      c |= 18;
    }
    if (this.editorWidth != view.scrollDOM.clientWidth) {
      if (heightOracle.lineWrapping) {
        s = true;
      }
      this.editorWidth = view.scrollDOM.clientWidth;
      c |= 16;
    }
    let f = Tn(this.view.contentDOM, false).y;
    if (f != this.scrollParent) {
      this.scrollParent = f;
      this.scrollAnchorHeight = -1;
      this.scrollOffset = 0;
    }
    let p = this.getScrollOffset();
    if (this.scrollOffset != p) {
      this.scrollAnchorHeight = -1;
      this.scrollOffset = p;
    }
    this.scrolledToBottom = In(this.scrollParent || view.win);
    let m = (this.printing ? io : no)(view_contentDOM, this.paddingTop);
    let h = m.top - this.pixelViewport.top;
    let g = m.bottom - this.pixelViewport.bottom;
    this.pixelViewport = m;
    let _ =
      this.pixelViewport.bottom > this.pixelViewport.top &&
      this.pixelViewport.right > this.pixelViewport.left;
    if (_ != this.inView) {
      this.inView = _;
      if (_) {
        s = true;
      }
    }
    if (!this.inView && !this.scrollTarget && !ro(view.dom)) {
      return 0;
    }
    let o_width = o.width;
    if (
      this.contentDOMWidth != o_width ||
      this.editorHeight != view.scrollDOM.clientHeight
    ) {
      this.contentDOMWidth = o.width;
      this.editorHeight = view.scrollDOM.clientHeight;
      c |= 16;
    }
    if (s) {
      let t = view.docView.measureVisibleLineHeights(this.viewport);
      if (heightOracle.mustRefreshForHeights(t)) {
        a = true;
      }
      if (
        a ||
        (heightOracle.lineWrapping &&
          Math.abs(o_width - this.contentDOMWidth) > heightOracle.charWidth)
      ) {
        let { lineHeight, charWidth, textHeight } =
          view.docView.measureTextSize();
        a =
          lineHeight > 0 &&
          heightOracle.refresh(
            n_whiteSpace,
            lineHeight,
            charWidth,
            textHeight,
            Math.max(5, o_width / charWidth),
            t,
          );
        if (a) {
          view.docView.minWidth = 0;
          c |= 16;
        }
      }
      if (h > 0 && g > 0) {
        l = Math.max(h, g);
      } else if (h < 0 && g < 0) {
        l = Math.min(h, g);
      }
      za();
      for (let n of this.viewports) {
        let i =
          n.from == this.viewport.from
            ? t
            : view.docView.measureVisibleLineHeights(n);
        this.heightMap = (
          a
            ? Wa.empty().applyChanges(
                this.stateDeco,
                v.empty,
                this.heightOracle,
                [new Rr(0, 0, 0, view.state.doc.length)],
              )
            : this.heightMap
        ).updateHeight(heightOracle, 0, a, new Va(n.from, i));
      }
      if (Ra) {
        c |= 2;
      }
    }
    let b =
      !this.viewportIsAppropriate(this.viewport, l) ||
      (this.scrollTarget &&
        (this.scrollTarget.range.head < this.viewport.from ||
          this.scrollTarget.range.head > this.viewport.to));
    if (b) {
      if (c & 2) {
        c |= this.updateScaler();
      }
      this.viewport = this.getViewport(l, this.scrollTarget);
      c |= this.updateForViewport();
    }
    if (c & 2 || b) {
      this.updateViewportLines();
    }
    if (this.lineGaps.length || this.viewport.to - this.viewport.from > 4000) {
      this.updateLineGaps(this.ensureLineGaps(a ? [] : this.lineGaps, view));
    }
    c |= this.computeVisibleRanges();
    if (this.mustEnforceCursorAssoc) {
      this.mustEnforceCursorAssoc = false;
      view.docView.enforceCursorAssoc();
    }
    return c;
  }
  get visibleTop() {
    return this.scaler.fromDOM(this.pixelViewport.top);
  }
  get visibleBottom() {
    return this.scaler.fromDOM(this.pixelViewport.bottom);
  }
  getViewport(e, t) {
    let n = 0.5 - Math.max(-0.5, Math.min(0.5, e / 1000 / 2));
    let heightMap = this.heightMap;
    let heightOracle = this.heightOracle;
    let { visibleTop, visibleBottom } = this;
    let s = new co(
      heightMap.lineAt(visibleTop - n * 1000, W.ByHeight, heightOracle, 0, 0)
        .from,
      heightMap.lineAt(
        visibleBottom + (1 - n) * 1000,
        W.ByHeight,
        heightOracle,
        0,
        0,
      ).to,
    );
    if (t) {
      let { head } = t.range;
      if (head < s.from || head > s.to) {
        let n = Math.min(
          this.editorHeight,
          this.pixelViewport.bottom - this.pixelViewport.top,
        );
        let a = heightMap.lineAt(head, W.ByPos, heightOracle, 0, 0);
        let o;
        o =
          t.y == `center`
            ? (a.top + a.bottom) / 2 - n / 2
            : t.y == `start` || (t.y == `nearest` && head < s.from)
              ? a.top
              : a.bottom - n;
        s = new co(
          heightMap.lineAt(o - 500, W.ByHeight, heightOracle, 0, 0).from,
          heightMap.lineAt(o + n + 500, W.ByHeight, heightOracle, 0, 0).to,
        );
      }
    }
    return s;
  }
  mapViewport(e, t) {
    let n = t.mapPos(e.from, -1);
    let r = t.mapPos(e.to, 1);
    return new co(
      this.heightMap.lineAt(n, W.ByPos, this.heightOracle, 0, 0).from,
      this.heightMap.lineAt(r, W.ByPos, this.heightOracle, 0, 0).to,
    );
  }
  viewportIsAppropriate({ from, to }, n = 0) {
    if (!this.inView) {
      return true;
    }
    let { top } = this.heightMap.lineAt(from, W.ByPos, this.heightOracle, 0, 0);
    let { bottom } = this.heightMap.lineAt(
      to,
      W.ByPos,
      this.heightOracle,
      0,
      0,
    );
    let { visibleTop, visibleBottom } = this;
    return (
      (from == 0 || top <= visibleTop - Math.max(10, Math.min(-n, 250))) &&
      (to == this.state.doc.length ||
        bottom >= visibleBottom + Math.max(10, Math.min(n, 250))) &&
      top > visibleTop - 2000 &&
      bottom < visibleBottom + 2000
    );
  }
  mapLineGaps(e, t) {
    if (!e.length || t.empty) {
      return e;
    }
    let n = [];
    for (let r of e) {
      if (!t.touchesRange(r.from, r.to)) {
        n.push(new ao(t.mapPos(r.from), t.mapPos(r.to), r.size, r.displaySize));
      }
    }
    return n;
  }
  ensureLineGaps(e, t) {
    let lineWrapping = this.heightOracle.lineWrapping;
    let r = lineWrapping ? 10000 : 2000;
    let i = r >> 1;
    let a = r << 1;
    if (this.defaultTextDirection != B.LTR && !lineWrapping) {
      return [];
    }
    let o = [];
    let s = (r, a, c, l) => {
      if (a - r < i) {
        return;
      }
      let main = this.state.selection.main;
      let d = [main.from];
      if (!main.empty) {
        d.push(main.to);
      }
      for (let e of d) {
        if (e > r && e < a) {
          s(r, e - 10, c, l);
          s(e + 10, a, c, l);
          return;
        }
      }
      let f = po(
        e,
        (e) =>
          e.from >= c.from &&
          e.to <= c.to &&
          Math.abs(e.from - r) < i &&
          Math.abs(e.to - a) < i &&
          !d.some((t) => e.from < t && e.to > t),
      );
      if (!f) {
        if (
          a < c.to &&
          t &&
          lineWrapping &&
          t.visibleRanges.some((e) => e.from <= a && e.to >= a)
        ) {
          let e = t.moveToLineBoundary(k.cursor(a), false, true).head;
          if (e > r) {
            a = e;
          }
        }
        let e = this.gapSize(c, r, a, l);
        f = new ao(r, a, e, lineWrapping || e < 2000000 ? e : 2000000);
      }
      o.push(f);
    };
    let c = (t) => {
      if (t.length < a || t.type != R.Text) {
        return;
      }
      let i = lo(t.from, t.to, this.stateDeco);
      if (i.total < a) {
        return;
      }
      let o = this.scrollTarget ? this.scrollTarget.range.head : null;
      let c;
      let l;
      if (lineWrapping) {
        let e =
          (r / this.heightOracle.lineLength) * this.heightOracle.lineHeight;
        let n;
        let a;
        if (o != null) {
          let r = fo(i, o);
          let s = ((this.visibleBottom - this.visibleTop) / 2 + e) / t.height;
          n = r - s;
          a = r + s;
        } else {
          n = (this.visibleTop - t.top - e) / t.height;
          a = (this.visibleBottom - t.top + e) / t.height;
        }
        c = uo(i, n);
        l = uo(i, a);
      } else {
        let n = i.total * this.heightOracle.charWidth;
        let a = r * this.heightOracle.charWidth;
        let s = 0;
        if (n > 2000000) {
          for (let n of e) {
            if (
              n.from >= t.from &&
              n.from < t.to &&
              n.size != n.displaySize &&
              n.from * this.heightOracle.charWidth + s < this.pixelViewport.left
            ) {
              s = n.size - n.displaySize;
            }
          }
        }
        let u = this.pixelViewport.left + s;
        let d = this.pixelViewport.right + s;
        let f;
        let p;
        if (o != null) {
          let e = fo(i, o);
          let t = ((d - u) / 2 + a) / n;
          f = e - t;
          p = e + t;
        } else {
          f = (u - a) / n;
          p = (d + a) / n;
        }
        c = uo(i, f);
        l = uo(i, p);
      }
      if (c > t.from) {
        s(t.from, c, t, i);
      }
      if (l < t.to) {
        s(l, t.to, t, i);
      }
    };
    for (let e of this.viewportLines) {
      if (Array.isArray(e.type)) {
        e.type.forEach(c);
      } else {
        c(e);
      }
    }
    return o;
  }
  gapSize(e, t, n, r) {
    let i = fo(r, n) - fo(r, t);
    if (this.heightOracle.lineWrapping) {
      return e.height * i;
    }
    return r.total * this.heightOracle.charWidth * i;
  }
  updateLineGaps(e) {
    if (!ao.same(e, this.lineGaps)) {
      this.lineGaps = e;
      this.lineGapDeco = z.set(
        e.map((e) => e.draw(this, this.heightOracle.lineWrapping)),
      );
    }
  }
  computeVisibleRanges(e) {
    let stateDeco = this.stateDeco;
    if (this.lineGaps.length) {
      stateDeco = stateDeco.concat(this.lineGapDeco);
    }
    let n = [];
    P.spans(
      stateDeco,
      this.viewport.from,
      this.viewport.to,
      {
        span(e, t) {
          n.push({
            from: e,
            to: t,
          });
        },
        point() {},
      },
      20,
    );
    let r = 0;
    if (n.length != this.visibleRanges.length) {
      r = 12;
    } else {
      for (let t = 0; t < n.length && !(r & 8); t++) {
        let i = this.visibleRanges[t];
        let a = n[t];
        if (i.from != a.from || i.to != a.to) {
          r |= 4;
          if (!(
            e &&
            e.mapPos(i.from, -1) == a.from &&
            e.mapPos(i.to, 1) == a.to
          )) {
            r |= 8;
          }
        }
      }
    }
    this.visibleRanges = n;
    return r;
  }
  lineBlockAt(e) {
    return (
      (e >= this.viewport.from &&
        e <= this.viewport.to &&
        this.viewportLines.find((t) => t.from <= e && t.to >= e)) ||
      _o(
        this.heightMap.lineAt(e, W.ByPos, this.heightOracle, 0, 0),
        this.scaler,
      )
    );
  }
  lineBlockAtHeight(e) {
    return (
      (e >= this.viewportLines[0].top &&
        e <= this.viewportLines[this.viewportLines.length - 1].bottom &&
        this.viewportLines.find((t) => t.top <= e && t.bottom >= e)) ||
      _o(
        this.heightMap.lineAt(
          this.scaler.fromDOM(e),
          W.ByHeight,
          this.heightOracle,
          0,
          0,
        ),
        this.scaler,
      )
    );
  }
  getScrollOffset() {
    if (this.scrollParent == this.view.scrollDOM) {
      return this.scrollParent.scrollTop * this.scaleY;
    }
    return (
      (this.scrollParent ? this.scrollParent.getBoundingClientRect().top : 0) -
      this.view.contentDOM.getBoundingClientRect().top
    );
  }
  scrollAnchorAt(e) {
    let t = this.lineBlockAtHeight(e + 8);
    if (t.from >= this.viewport.from || this.viewportLines[0].top - e > 200) {
      return t;
    }
    return this.viewportLines[0];
  }
  elementAtHeight(e) {
    return _o(
      this.heightMap.blockAt(this.scaler.fromDOM(e), this.heightOracle, 0, 0),
      this.scaler,
    );
  }
  get docHeight() {
    return this.scaler.toDOM(this.heightMap.height);
  }
  get contentHeight() {
    return this.docHeight + this.paddingTop + this.paddingBottom;
  }
}
var co = class {
  constructor(e, t) {
    this.from = e;
    this.to = t;
  }
};
function lo(from, t, stateDeco) {
  let r = [];
  let i = from;
  let total = 0;
  P.spans(
    stateDeco,
    from,
    t,
    {
      span() {},
      point(e, t) {
        if (e > i) {
          r.push({
            from: i,
            to: e,
          });
          total += e - i;
        }
        i = t;
      },
    },
    20,
  );
  if (i < t) {
    r.push({
      from: i,
      to: t,
    });
    total += t - i;
  }
  return {
    total,
    ranges: r,
  };
}
function uo({ total, ranges }, n) {
  if (n <= 0) {
    return ranges[0].from;
  }
  if (n >= 1) {
    return ranges[ranges.length - 1].to;
  }
  let r = Math.floor(total * n);
  for (let e = 0; ; e++) {
    let { from, to } = ranges[e];
    let a = to - from;
    if (r <= a) {
      return from + r;
    }
    r -= a;
  }
}
function fo(e, t) {
  let n = 0;
  for (let { from, to } of e.ranges) {
    if (t <= to) {
      n += t - from;
      break;
    }
    n += to - from;
  }
  return n / e.total;
}
function po(e, t) {
  for (let n of e) {
    if (t(n)) {
      return n;
    }
  }
}
var mo = {
  toDOM(e) {
    return e;
  },
  fromDOM(e) {
    return e;
  },
  scale: 1,
  eq(e) {
    return e == this;
  },
};
function ho(e) {
  let t = e.facet(kr).filter((e) => typeof e != `function`);
  let n = e.facet(jr).filter((e) => typeof e != `function`);
  if (n.length) {
    t.push(P.join(n));
  }
  return t;
}
var go = class e {
  constructor(e, t, n) {
    let r = 0;
    let i = 0;
    let a = 0;
    this.viewports = n.map(({ from, to }) => {
      let top = t.lineAt(from, W.ByPos, e, 0, 0).top;
      let bottom = t.lineAt(to, W.ByPos, e, 0, 0).bottom;
      r += bottom - top;
      return {
        from,
        to,
        top,
        bottom,
        domTop: 0,
        domBottom: 0,
      };
    });
    this.scale = (7000000 - r) / (t.height - r);
    for (let e of this.viewports) {
      e.domTop = a + (e.top - i) * this.scale;
      a = e.domBottom = e.domTop + (e.bottom - e.top);
      i = e.bottom;
    }
  }
  toDOM(e) {
    for (let t = 0, n = 0, r = 0; ; t++) {
      let i = t < this.viewports.length ? this.viewports[t] : null;
      if (!i || e < i.top) {
        return r + (e - n) * this.scale;
      }
      if (e <= i.bottom) {
        return i.domTop + (e - i.top);
      }
      n = i.bottom;
      r = i.domBottom;
    }
  }
  fromDOM(e) {
    for (let t = 0, n = 0, r = 0; ; t++) {
      let i = t < this.viewports.length ? this.viewports[t] : null;
      if (!i || e < i.domTop) {
        return n + (e - r) / this.scale;
      }
      if (e <= i.domBottom) {
        return i.top + (e - i.domTop);
      }
      n = i.bottom;
      r = i.domBottom;
    }
  }
  eq(t) {
    return (
      t instanceof e &&
      this.scale == t.scale &&
      this.viewports.length == t.viewports.length &&
      this.viewports.every(
        (e, n) => e.from == t.viewports[n].from && e.to == t.viewports[n].to,
      )
    );
  }
};
function _o(e, t) {
  if (t.scale == 1) {
    return e;
  }
  let n = t.toDOM(e.top);
  let r = t.toDOM(e.bottom);
  return new Ha(
    e.from,
    e.length,
    n,
    r - n,
    Array.isArray(e._content) ? e._content.map((e) => _o(e, t)) : e._content,
  );
}
const vo = A.define({
  combine: (e) => e.join(` `),
});
const yo = A.define({
  combine: (e) => e.indexOf(true) > -1,
});
const bo = At.newName();
const xo = At.newName();
const So = At.newName();
const Co = {
  "&light": `.` + xo,
  "&dark": `.` + So,
};
function wo(e, t, n) {
  return new At(t, {
    finish(t) {
      if (/&/.test(t)) {
        return t.replace(/&\w*/, (t) => {
          if (t == `&`) {
            return e;
          }
          if (!n || !n[t]) {
            throw RangeError(`Unsupported selector: ${t}`);
          }
          return n[t];
        });
      }
      return e + ` ` + t;
    },
  });
}
const To = wo(
  `.` + bo,
  {
    "&": {
      position: `relative !important`,
      boxSizing: `border-box`,
      "&.cm-focused": {
        outline: `1px dotted #212121`,
      },
      display: `flex !important`,
      flexDirection: `column`,
    },
    ".cm-scroller": {
      display: `flex !important`,
      alignItems: `flex-start !important`,
      fontFamily: `monospace`,
      lineHeight: 1.4,
      height: `100%`,
      overflowX: `auto`,
      position: `relative`,
      zIndex: 0,
      overflowAnchor: `none`,
    },
    ".cm-content": {
      margin: 0,
      flexGrow: 2,
      flexShrink: 0,
      display: `block`,
      whiteSpace: `pre`,
      wordWrap: `normal`,
      boxSizing: `border-box`,
      minHeight: `100%`,
      padding: `4px 0`,
      outline: `none`,
      "&[contenteditable=true]": {
        WebkitUserModify: `read-write-plaintext-only`,
      },
    },
    ".cm-lineWrapping": {
      whiteSpace_fallback: `pre-wrap`,
      whiteSpace: `break-spaces`,
      wordBreak: `break-word`,
      overflowWrap: `anywhere`,
      flexShrink: 1,
    },
    "&light .cm-content": {
      caretColor: `black`,
    },
    "&dark .cm-content": {
      caretColor: `white`,
    },
    ".cm-line": {
      display: `block`,
      padding: `0 2px 0 6px`,
    },
    ".cm-layer": {
      userSelect: `none`,
      position: `absolute`,
      left: 0,
      top: 0,
      contain: `size style`,
      "& > *": {
        position: `absolute`,
      },
    },
    "&light .cm-selectionBackground": {
      background: `#d9d9d9`,
    },
    "&dark .cm-selectionBackground": {
      background: `#222`,
    },
    "&light.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground":
      {
        background: `#d7d4f0`,
      },
    "&dark.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground":
      {
        background: `#233`,
      },
    ".cm-cursorLayer": {
      pointerEvents: `none`,
    },
    "&.cm-focused > .cm-scroller > .cm-cursorLayer": {
      animation: `steps(1) cm-blink 1.2s infinite`,
    },
    "@keyframes cm-blink": {
      "0%": {},
      "50%": {
        opacity: 0,
      },
      "100%": {},
    },
    "@keyframes cm-blink2": {
      "0%": {},
      "50%": {
        opacity: 0,
      },
      "100%": {},
    },
    ".cm-cursor, .cm-dropCursor": {
      borderLeft: `1.2px solid black`,
      marginLeft: `-0.6px`,
      pointerEvents: `none`,
    },
    ".cm-cursor": {
      display: `none`,
    },
    "&dark .cm-cursor": {
      borderLeftColor: `#ddd`,
    },
    ".cm-selectionHandle": {
      backgroundColor: `currentColor`,
      width: `1.5px`,
    },
    ".cm-selectionHandle-start::before, .cm-selectionHandle-end::before": {
      content: `""`,
      backgroundColor: `inherit`,
      borderRadius: `50%`,
      width: `8px`,
      height: `8px`,
      position: `absolute`,
      left: `-3.25px`,
    },
    ".cm-selectionHandle-start::before": {
      top: `-8px`,
    },
    ".cm-selectionHandle-end::before": {
      bottom: `-8px`,
    },
    ".cm-dropCursor": {
      position: `absolute`,
    },
    "&.cm-focused > .cm-scroller > .cm-cursorLayer .cm-cursor": {
      display: `block`,
    },
    ".cm-iso": {
      unicodeBidi: `isolate`,
    },
    ".cm-announced": {
      position: `fixed`,
      top: `-10000px`,
    },
    "@media print": {
      ".cm-announced": {
        display: `none`,
      },
    },
    "&light .cm-activeLine": {
      backgroundColor: `#cceeff44`,
    },
    "&dark .cm-activeLine": {
      backgroundColor: `#99eeff33`,
    },
    "&light .cm-specialChar": {
      color: `red`,
    },
    "&dark .cm-specialChar": {
      color: `#f78`,
    },
    ".cm-gutters": {
      flexShrink: 0,
      display: `flex`,
      height: `100%`,
      boxSizing: `border-box`,
      zIndex: 200,
    },
    ".cm-gutters-before": {
      insetInlineStart: 0,
    },
    ".cm-gutters-after": {
      insetInlineEnd: 0,
    },
    "&light .cm-gutters": {
      backgroundColor: `#f5f5f5`,
      color: `#6c6c6c`,
      border: `0px solid #ddd`,
      "&.cm-gutters-before": {
        borderRightWidth: `1px`,
      },
      "&.cm-gutters-after": {
        borderLeftWidth: `1px`,
      },
    },
    "&dark .cm-gutters": {
      backgroundColor: `#333338`,
      color: `#ccc`,
    },
    ".cm-gutter": {
      display: `flex !important`,
      flexDirection: `column`,
      flexShrink: 0,
      boxSizing: `border-box`,
      minHeight: `100%`,
      overflow: `hidden`,
    },
    ".cm-gutterElement": {
      boxSizing: `border-box`,
    },
    ".cm-lineNumbers .cm-gutterElement": {
      padding: `0 3px 0 5px`,
      minWidth: `20px`,
      textAlign: `right`,
      whiteSpace: `nowrap`,
    },
    "&light .cm-activeLineGutter": {
      backgroundColor: `#e2f2ff`,
    },
    "&dark .cm-activeLineGutter": {
      backgroundColor: `#222227`,
    },
    ".cm-panels": {
      boxSizing: `border-box`,
      position: `sticky`,
      left: 0,
      right: 0,
      zIndex: 300,
    },
    "&light .cm-panels": {
      backgroundColor: `#f5f5f5`,
      color: `black`,
    },
    ".cm-panels-top": {
      top: `0`,
    },
    ".cm-panels-bottom": {
      bottom: `0`,
    },
    "&light .cm-panels-top": {
      borderBottom: `1px solid #ddd`,
    },
    "&light .cm-panels-bottom": {
      borderTop: `1px solid #ddd`,
    },
    "&dark .cm-panels": {
      backgroundColor: `#333338`,
      color: `white`,
    },
    ".cm-dialog": {
      padding: `2px 19px 4px 6px`,
      position: `relative`,
      "& label": {
        fontSize: `80%`,
      },
    },
    ".cm-dialog-close": {
      position: `absolute`,
      top: `3px`,
      right: `4px`,
      backgroundColor: `inherit`,
      border: `none`,
      font: `inherit`,
      fontSize: `14px`,
      padding: `0`,
    },
    ".cm-tab": {
      display: `inline-block`,
      overflow: `hidden`,
      verticalAlign: `bottom`,
    },
    ".cm-widgetBuffer": {
      verticalAlign: `text-top`,
      height: `1em`,
      width: 0,
      display: `inline`,
    },
    ".cm-placeholder": {
      color: `#888`,
      display: `inline-block`,
      verticalAlign: `top`,
      userSelect: `none`,
    },
    ".cm-highlightSpace": {
      background: `radial-gradient(circle at 50% 55%, #aaa 20%, transparent 0) no-repeat`,
      backgroundSize: `.4em`,
      backgroundPosition: `calc(min(50%, 0px)) center`,
    },
    ".cm-highlightTab": {
      backgroundImage: `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="20"><path stroke="%23888" stroke-width="1" fill="none" d="M1 10H196L190 5M190 15L196 10M197 4L197 16"/></svg>')`,
      backgroundSize: `auto 100%`,
      backgroundPosition: `right 90%`,
      backgroundRepeat: `no-repeat`,
    },
    ".cm-trailingSpace": {
      backgroundColor: `#ff332255`,
    },
    ".cm-button": {
      verticalAlign: `middle`,
      color: `inherit`,
      fontSize: `70%`,
      padding: `.2em 1em`,
      borderRadius: `1px`,
    },
    "&light .cm-button": {
      backgroundImage: `linear-gradient(#eff1f5, #d9d9df)`,
      border: `1px solid #888`,
      "&:active": {
        backgroundImage: `linear-gradient(#b4b4b4, #d0d3d6)`,
      },
    },
    "&dark .cm-button": {
      backgroundImage: `linear-gradient(#393939, #111)`,
      border: `1px solid #888`,
      "&:active": {
        backgroundImage: `linear-gradient(#111, #333)`,
      },
    },
    ".cm-textfield": {
      verticalAlign: `middle`,
      color: `inherit`,
      fontSize: `70%`,
      border: `1px solid silver`,
      padding: `.2em .5em`,
    },
    "&light .cm-textfield": {
      backgroundColor: `white`,
    },
    "&dark .cm-textfield": {
      border: `1px solid #555`,
      backgroundColor: `inherit`,
    },
  },
  Co,
);
const Eo = {
  childList: true,
  characterData: true,
  subtree: true,
  attributes: true,
  characterDataOldValue: true,
};
const Do = L.ie && L.ie_version <= 11;
class Oo {
  constructor(e) {
    this.view = e;
    this.active = false;
    this.editContext = null;
    this.selectionRange = new En();
    this.selectionChanged = false;
    this.delayedFlush = -1;
    this.resizeTimeout = -1;
    this.queue = [];
    this.delayedAndroidKey = null;
    this.flushingAndroidKey = -1;
    this.lastChange = 0;
    this.scrollTargets = [];
    this.intersection = null;
    this.resizeScroll = null;
    this.intersecting = false;
    this.gapIntersection = null;
    this.gaps = [];
    this.printQuery = null;
    this.parentCheck = -1;
    this.dom = e.contentDOM;
    this.observer = new MutationObserver((t) => {
      for (let e of t) {
        this.queue.push(e);
      }
      if (
        ((L.ie && L.ie_version <= 11) || (L.ios && e.composing)) &&
        t.some(
          (e) =>
            (e.type == `childList` && e.removedNodes.length) ||
            (e.type == `characterData` &&
              e.oldValue.length > e.target.nodeValue.length),
        )
      ) {
        this.flushSoon();
      } else {
        this.flush();
      }
    });
    if (
      window.EditContext &&
      L.android &&
      e.constructor.EDIT_CONTEXT !== false &&
      !(L.chrome && L.chrome_version < 126)
    ) {
      this.editContext = new Mo(e);
      if (e.state.facet(Cr)) {
        e.contentDOM.editContext = this.editContext.editContext;
      }
    }
    if (Do) {
      this.onCharData = (e) => {
        this.queue.push({
          target: e.target,
          type: `characterData`,
          oldValue: e.prevValue,
        });
        this.flushSoon();
      };
    }
    this.onSelectionChange = this.onSelectionChange.bind(this);
    this.onResize = this.onResize.bind(this);
    this.onPrint = this.onPrint.bind(this);
    this.onScroll = this.onScroll.bind(this);
    if (window.matchMedia) {
      this.printQuery = window.matchMedia(`print`);
    }
    if (typeof ResizeObserver == `function`) {
      this.resizeScroll = new ResizeObserver(() => {
        if (this.view.docView?.lastUpdate < Date.now() - 75) {
          this.onResize();
        }
      });
      this.resizeScroll.observe(e.scrollDOM);
    }
    this.addWindowListeners((this.win = e.win));
    this.start();
    if (typeof IntersectionObserver == `function`) {
      this.intersection = new IntersectionObserver(
        (e) => {
          if (this.parentCheck < 0) {
            this.parentCheck = setTimeout(
              this.listenForScroll.bind(this),
              1000,
            );
          }
          if (
            e.length > 0 &&
            e[e.length - 1].intersectionRatio > 0 != this.intersecting
          ) {
            this.intersecting = !this.intersecting;
            if (this.intersecting != this.view.inView) {
              this.onScrollChanged(document.createEvent(`Event`));
            }
          }
        },
        {
          threshold: [0, 0.001],
        },
      );
      this.intersection.observe(this.dom);
      this.gapIntersection = new IntersectionObserver((e) => {
        if (e.length > 0 && e[e.length - 1].intersectionRatio > 0) {
          this.onScrollChanged(document.createEvent(`Event`));
        }
      }, {});
    }
    this.listenForScroll();
    this.readSelectionRange();
  }
  onScrollChanged(e) {
    this.view.inputState.runHandlers(`scroll`, e);
    if (this.intersecting) {
      this.view.measure();
    }
  }
  onScroll(e) {
    if (this.intersecting) {
      this.flush(false);
    }
    if (this.editContext) {
      this.view.requestMeasure(this.editContext.measureReq);
    }
    this.onScrollChanged(e);
  }
  onResize() {
    if (this.resizeTimeout < 0) {
      this.resizeTimeout = setTimeout(() => {
        this.resizeTimeout = -1;
        this.view.requestMeasure();
      }, 50);
    }
  }
  onPrint(e) {
    if ((e.type != `change` && e.type) || e.matches) {
      this.view.viewState.printing = true;
      this.view.measure();
      setTimeout(() => {
        this.view.viewState.printing = false;
        this.view.requestMeasure();
      }, 500);
    }
  }
  updateGaps(e) {
    if (
      this.gapIntersection &&
      (e.length != this.gaps.length || this.gaps.some((t, n) => t != e[n]))
    ) {
      this.gapIntersection.disconnect();
      for (let t of e) {
        this.gapIntersection.observe(t);
      }
      this.gaps = e;
    }
  }
  onSelectionChange(e) {
    let selectionChanged = this.selectionChanged;
    if (!this.readSelectionRange() || this.delayedAndroidKey) {
      return;
    }
    let { view } = this;
    let selectionRange = this.selectionRange;
    if (
      view.state.facet(Cr)
        ? view.root.activeElement != this.dom
        : !mn(this.dom, selectionRange)
    ) {
      return;
    }
    let i =
      selectionRange.anchorNode &&
      view.docView.tile.nearest(selectionRange.anchorNode);
    if (i && i.isWidget() && i.widget.ignoreEvent(e)) {
      if (!selectionChanged) {
        this.selectionChanged = false;
      }
      return;
    }
    if (
      ((L.ie && L.ie_version <= 11) || (L.android && L.chrome)) &&
      !view.state.selection.main.empty &&
      selectionRange.focusNode &&
      gn(
        selectionRange.focusNode,
        selectionRange.focusOffset,
        selectionRange.anchorNode,
        selectionRange.anchorOffset,
      )
    ) {
      this.flushSoon();
    } else {
      this.flush(false);
    }
  }
  readSelectionRange() {
    let { view } = this;
    let t = fn(view.root);
    if (!t) {
      return false;
    }
    let n =
      (L.safari &&
        view.root.nodeType == 11 &&
        view.root.activeElement == this.dom &&
        jo(this.view, t)) ||
      t;
    if (!n || this.selectionRange.eq(n)) {
      return false;
    }
    let r = mn(this.dom, n);
    if (
      r &&
      !this.selectionChanged &&
      view.inputState.lastFocusTime > Date.now() - 200 &&
      view.inputState.lastTouchTime < Date.now() - 300 &&
      Fn(this.dom, n)
    ) {
      return (
        (this.view.inputState.lastFocusTime = 0),
        view.docView.updateSelection(),
        false
      );
    }
    return (
      this.selectionRange.setRange(n),
      r && (this.selectionChanged = true),
      true
    );
  }
  setSelectionRange(e, t) {
    this.selectionRange.set(e.node, e.offset, t.node, t.offset);
    this.selectionChanged = false;
  }
  clearSelectionRange() {
    this.selectionRange.set(null, 0, null, 0);
  }
  listenForScroll() {
    this.parentCheck = -1;
    let e = 0;
    let t = null;
    for (let n = this.dom; n;) {
      if (n.nodeType == 1) {
        if (!t && e < this.scrollTargets.length && this.scrollTargets[e] == n) {
          e++;
        } else {
          t ||= this.scrollTargets.slice(0, e);
        }
        if (t) {
          t.push(n);
        }
        n = n.assignedSlot || n.parentNode;
      } else if (n.nodeType == 11) {
        n = n.host;
      } else {
        break;
      }
    }
    if (e < this.scrollTargets.length && !t) {
      t = this.scrollTargets.slice(0, e);
    }
    if (t) {
      for (let e of this.scrollTargets) {
        e.removeEventListener(`scroll`, this.onScroll);
      }
      for (let e of (this.scrollTargets = t)) {
        e.addEventListener(`scroll`, this.onScroll);
      }
    }
  }
  ignore(e) {
    if (!this.active) {
      return e();
    }
    try {
      this.stop();
      return e();
    } finally {
      this.start();
      this.clear();
    }
  }
  start() {
    this.active ||=
      (this.observer.observe(this.dom, Eo),
      Do &&
        this.dom.addEventListener(`DOMCharacterDataModified`, this.onCharData),
      true);
  }
  stop() {
    if (this.active) {
      this.active = false;
      this.observer.disconnect();
      if (Do) {
        this.dom.removeEventListener(
          `DOMCharacterDataModified`,
          this.onCharData,
        );
      }
    }
  }
  clear() {
    this.processRecords();
    this.queue.length = 0;
    this.selectionChanged = false;
  }
  delayAndroidKey(e, keyCode) {
    if (!this.delayedAndroidKey) {
      let e = () => {
        let delayedAndroidKey = this.delayedAndroidKey;
        if (delayedAndroidKey) {
          this.clearDelayedAndroidKey();
          this.view.inputState.lastKeyCode = delayedAndroidKey.keyCode;
          this.view.inputState.lastKeyTime = Date.now();
          if (!this.flush() && delayedAndroidKey.force) {
            Nn(this.dom, delayedAndroidKey.key, delayedAndroidKey.keyCode);
          }
        }
      };
      this.flushingAndroidKey = this.view.win.requestAnimationFrame(e);
    }
    if (!this.delayedAndroidKey || e == `Enter`) {
      this.delayedAndroidKey = {
        key: e,
        keyCode,
        force:
          this.lastChange < Date.now() - 50 || !!this.delayedAndroidKey?.force,
      };
    }
  }
  clearDelayedAndroidKey() {
    this.win.cancelAnimationFrame(this.flushingAndroidKey);
    this.delayedAndroidKey = null;
    this.flushingAndroidKey = -1;
  }
  flushSoon() {
    if (this.delayedFlush < 0) {
      this.delayedFlush = this.view.win.requestAnimationFrame(() => {
        this.delayedFlush = -1;
        this.flush();
      });
    }
  }
  forceFlush() {
    if (this.delayedFlush >= 0) {
      this.view.win.cancelAnimationFrame(this.delayedFlush);
      this.delayedFlush = -1;
    }
    this.flush();
  }
  pendingRecords() {
    for (let e of this.observer.takeRecords()) {
      this.queue.push(e);
    }
    return this.queue;
  }
  processRecords() {
    let e = this.pendingRecords();
    if (e.length) {
      this.queue = [];
    }
    let t = -1;
    let n = -1;
    let typeOver = false;
    for (let i of e) {
      let e = this.readMutation(i);
      e &&
        (e.typeOver && (typeOver = true),
        t == -1
          ? ({ from: t, to: n } = e)
          : ((t = Math.min(e.from, t)), (n = Math.max(e.to, n))));
    }
    return {
      from: t,
      to: n,
      typeOver,
    };
  }
  readChange() {
    let { from, to, typeOver } = this.processRecords();
    let r = this.selectionChanged && mn(this.dom, this.selectionRange);
    if (from < 0 && !r) {
      return null;
    }
    if (from > -1) {
      this.lastChange = Date.now();
    }
    this.view.inputState.lastFocusTime = 0;
    this.selectionChanged = false;
    let i = new Wi(this.view, from, to, typeOver);
    this.view.docView.domChanged = {
      newSel: i.newSel ? i.newSel.main : null,
    };
    return i;
  }
  flush(e = true) {
    if (this.delayedFlush >= 0 || this.delayedAndroidKey) {
      return false;
    }
    if (e) {
      this.readSelectionRange();
    }
    let t = this.readChange();
    if (!t) {
      this.view.requestMeasure();
      return false;
    }
    let state = this.view.state;
    let r = Ki(this.view, t);
    if (
      this.view.state == state &&
      (t.domChanged ||
        (t.newSel && !Qi(this.view.state.selection, t.newSel.main)))
    ) {
      this.view.update([]);
    }
    return r;
  }
  readMutation(e) {
    let t = this.view.docView.tile.nearest(e.target);
    if (!t || t.isWidget()) {
      return null;
    }
    t.markDirty(e.type == `attributes`);
    if (e.type == `childList`) {
      let n = ko(t, e.previousSibling || e.target.previousSibling, -1);
      let r = ko(t, e.nextSibling || e.target.nextSibling, 1);
      return {
        from: n ? t.posAfter(n) : t.posAtStart,
        to: r ? t.posBefore(r) : t.posAtEnd,
        typeOver: false,
      };
    }
    if (e.type == `characterData`) {
      return {
        from: t.posAtStart,
        to: t.posAtEnd,
        typeOver: e.target.nodeValue == e.oldValue,
      };
    }
    return null;
  }
  setWindow(e) {
    if (e != this.win) {
      this.removeWindowListeners(this.win);
      this.win = e;
      this.addWindowListeners(this.win);
    }
  }
  addWindowListeners(e) {
    e.addEventListener(`resize`, this.onResize);
    if (this.printQuery) {
      if (this.printQuery.addEventListener) {
        this.printQuery.addEventListener(`change`, this.onPrint);
      } else {
        this.printQuery.addListener(this.onPrint);
      }
    } else {
      e.addEventListener(`beforeprint`, this.onPrint);
    }
    e.addEventListener(`scroll`, this.onScroll);
    e.document.addEventListener(`selectionchange`, this.onSelectionChange);
  }
  removeWindowListeners(e) {
    e.removeEventListener(`scroll`, this.onScroll);
    e.removeEventListener(`resize`, this.onResize);
    if (this.printQuery) {
      if (this.printQuery.removeEventListener) {
        this.printQuery.removeEventListener(`change`, this.onPrint);
      } else {
        this.printQuery.removeListener(this.onPrint);
      }
    } else {
      e.removeEventListener(`beforeprint`, this.onPrint);
    }
    e.document.removeEventListener(`selectionchange`, this.onSelectionChange);
  }
  update(e) {
    if (this.editContext) {
      this.editContext.update(e);
      if (e.startState.facet(Cr) != e.state.facet(Cr)) {
        e.view.contentDOM.editContext = e.state.facet(Cr)
          ? this.editContext.editContext
          : null;
      }
    }
  }
  destroy() {
    let e;
    let t;
    let n;
    this.stop();
    if (!((e = this.intersection) == null)) {
      e.disconnect();
    }
    if (!((t = this.gapIntersection) == null)) {
      t.disconnect();
    }
    if (!((n = this.resizeScroll) == null)) {
      n.disconnect();
    }
    for (let e of this.scrollTargets) {
      e.removeEventListener(`scroll`, this.onScroll);
    }
    this.removeWindowListeners(this.win);
    clearTimeout(this.parentCheck);
    clearTimeout(this.resizeTimeout);
    this.win.cancelAnimationFrame(this.delayedFlush);
    this.win.cancelAnimationFrame(this.flushingAndroidKey);
    if (this.editContext) {
      this.view.contentDOM.editContext = null;
      this.editContext.destroy();
    }
  }
}
function ko(e, t, n) {
  while (t) {
    let r = U.get(t);
    if (r && r.parent == e) {
      return r;
    }
    let i = t.parentNode;
    t = i == e.dom ? (n > 0 ? t.nextSibling : t.previousSibling) : i;
  }
  return null;
}
function Ao(e, { startContainer, startOffset, endContainer, endOffset }) {
  let o = e.docView.domAtPos(e.state.selection.main.anchor, 1);
  if (gn(o.node, o.offset, endContainer, endOffset)) {
    [startContainer, startOffset, endContainer, endOffset] = [
      endContainer,
      endOffset,
      startContainer,
      startOffset,
    ];
  }
  return {
    anchorNode: startContainer,
    anchorOffset: startOffset,
    focusNode: endContainer,
    focusOffset: endOffset,
  };
}
function jo(view, t) {
  if (t.getComposedRanges) {
    let n = t.getComposedRanges(view.root)[0];
    if (n) {
      return Ao(view, n);
    }
  }
  let n = null;
  function r(e) {
    e.preventDefault();
    e.stopImmediatePropagation();
    n = e.getTargetRanges()[0];
  }
  view.contentDOM.addEventListener(`beforeinput`, r, true);
  view.dom.ownerDocument.execCommand(`indent`);
  view.contentDOM.removeEventListener(`beforeinput`, r, true);
  if (n) {
    return Ao(view, n);
  }
  return null;
}
var Mo = class {
  constructor(e) {
    this.from = 0;
    this.to = 0;
    this.pendingContextChange = null;
    this.handlers = Object.create(null);
    this.composing = null;
    this.resetRange(e.state);
    let t = (this.editContext = new window.EditContext({
      text: e.state.doc.sliceString(this.from, this.to),
      selectionStart: this.toContextPos(
        Math.max(this.from, Math.min(this.to, e.state.selection.main.anchor)),
      ),
      selectionEnd: this.toContextPos(e.state.selection.main.head),
    }));
    this.handlers.textupdate = (n) => {
      let main = e.state.selection.main;
      let { anchor, head } = main;
      let o = this.toEditorPos(n.updateRangeStart);
      let s = this.toEditorPos(n.updateRangeEnd);
      if (e.inputState.composing >= 0 && !this.composing) {
        this.composing = {
          contextBase: n.updateRangeStart,
          editorBase: o,
          drifted: false,
        };
      }
      let c = s - o > n.text.length;
      if (o == this.from && anchor < this.from) {
        o = anchor;
      } else if (s == this.to && anchor > this.to) {
        s = anchor;
      }
      let l = Yi(
        e.state.sliceDoc(o, s),
        n.text,
        (c ? main.from : main.to) - o,
        c ? `end` : null,
      );
      if (!l) {
        let t = k.single(
          this.toEditorPos(n.selectionStart),
          this.toEditorPos(n.selectionEnd),
        );
        if (!Qi(t, main)) {
          e.dispatch({
            selection: t,
            userEvent: `select`,
          });
        }
        return;
      }
      let u = {
        from: l.from + o,
        to: l.toA + o,
        insert: v.of(
          n.text.slice(l.from, l.toB).split(`
`),
        ),
      };
      if (
        (L.mac || L.android) &&
        u.from == head - 1 &&
        /^\. ?$/.test(n.text) &&
        e.contentDOM.getAttribute(`autocorrect`) == `off`
      ) {
        u = {
          from: o,
          to: s,
          insert: v.of([n.text.replace(`.`, ` `)]),
        };
      }
      this.pendingContextChange = u;
      if (!e.state.readOnly) {
        let t = this.to - this.from + (u.to - u.from + u.insert.length);
        qi(
          e,
          u,
          k.single(
            this.toEditorPos(n.selectionStart, t),
            this.toEditorPos(n.selectionEnd, t),
          ),
        );
      }
      if (this.pendingContextChange) {
        this.revertPending(e.state);
        this.setSelection(e.state);
      }
      if (
        u.from < u.to &&
        !u.insert.length &&
        e.inputState.composing >= 0 &&
        !/[\\p{Alphabetic}\\p{Number}_]/.test(
          t.text.slice(
            Math.max(0, n.updateRangeStart - 1),
            Math.min(t.text.length, n.updateRangeStart + 1),
          ),
        )
      ) {
        this.handlers.compositionend(n);
      }
    };
    this.handlers.characterboundsupdate = (n) => {
      let r = [];
      let i = null;
      for (
        let t = this.toEditorPos(n.rangeStart),
          a = this.toEditorPos(n.rangeEnd);
        t < a;
        t++
      ) {
        let n = e.coordsForChar(t);
        i =
          (n &&
            new DOMRect(n.left, n.top, n.right - n.left, n.bottom - n.top)) ||
          i ||
          new DOMRect();
        r.push(i);
      }
      t.updateCharacterBounds(n.rangeStart, r);
    };
    this.handlers.textformatupdate = (t) => {
      let n = [];
      for (let e of t.getTextFormats()) {
        let t = e.underlineStyle;
        let r = e.underlineThickness;
        if (!/none/i.test(t) && !/none/i.test(r)) {
          let i = this.toEditorPos(e.rangeStart);
          let a = this.toEditorPos(e.rangeEnd);
          if (i < a) {
            let style = `text-decoration: underline ${/^[a-z]/.test(t) ? t + ` ` : t == `Dashed` ? `dashed ` : t == `Squiggle` ? `wavy ` : ``}${/thin/i.test(r) ? 1 : 2}px`;
            n.push(
              z
                .mark({
                  attributes: {
                    style,
                  },
                })
                .range(i, a),
            );
          }
        }
      }
      e.dispatch({
        effects: xr.of(z.set(n)),
      });
    };
    this.handlers.compositionstart = () => {
      if (e.inputState.composing < 0) {
        e.inputState.composing = 0;
        e.inputState.compositionFirstChange = true;
      }
    };
    this.handlers.compositionend = () => {
      e.inputState.composing = -1;
      e.inputState.compositionFirstChange = null;
      if (this.composing) {
        let { drifted } = this.composing;
        this.composing = null;
        if (drifted) {
          this.reset(e.state);
        }
      }
    };
    for (let e in this.handlers) {
      t.addEventListener(e, this.handlers[e]);
    }
    this.measureReq = {
      read: (e) => {
        let t = fn(e.root);
        if (t && t.rangeCount) {
          this.editContext.updateSelectionBounds(
            t.getRangeAt(0).getBoundingClientRect(),
          );
        }
      },
    };
  }
  applyEdits(e) {
    let t = 0;
    let n = false;
    let pendingContextChange = this.pendingContextChange;
    e.changes.iterChanges((i, a, o, s, c) => {
      if (n) {
        return;
      }
      let l = c.length - (a - i);
      if (pendingContextChange && a >= pendingContextChange.to) {
        if (
          pendingContextChange.from == i &&
          pendingContextChange.to == a &&
          pendingContextChange.insert.eq(c)
        ) {
          pendingContextChange = this.pendingContextChange = null;
          t += l;
          this.to += l;
          return;
        }
        pendingContextChange = null;
        this.revertPending(e.state);
      }
      i += t;
      a += t;
      if (a <= this.from) {
        this.from += l;
        this.to += l;
      } else if (i < this.to) {
        if (
          i < this.from ||
          a > this.to ||
          this.to - this.from + c.length > 30000
        ) {
          n = true;
          return;
        }
        this.editContext.updateText(
          this.toContextPos(i),
          this.toContextPos(a),
          c.toString(),
        );
        this.to += l;
      }
      t += l;
    });
    if (pendingContextChange && !n) {
      this.revertPending(e.state);
    }
    return !n;
  }
  update(e) {
    let pendingContextChange = this.pendingContextChange;
    let main = e.startState.selection.main;
    if (
      this.composing &&
      (this.composing.drifted ||
        (!e.changes.touchesRange(main.from, main.to) &&
          e.transactions.some(
            (e) =>
              !e.isUserEvent(`input.type`) &&
              e.changes.touchesRange(this.from, this.to),
          )))
    ) {
      this.composing.drifted = true;
      this.composing.editorBase = e.changes.mapPos(this.composing.editorBase);
    } else if (!this.applyEdits(e) || !this.rangeIsValid(e.state)) {
      this.pendingContextChange = null;
      this.reset(e.state);
    } else if (e.docChanged || e.selectionSet || pendingContextChange) {
      this.setSelection(e.state);
    }
    if (e.geometryChanged || e.docChanged || e.selectionSet) {
      e.view.requestMeasure(this.measureReq);
    }
  }
  resetRange(e) {
    let { head } = e.selection.main;
    this.from = Math.max(0, head - 10000);
    this.to = Math.min(e.doc.length, head + 10000);
  }
  reset(e) {
    this.resetRange(e);
    this.editContext.updateText(
      0,
      this.editContext.text.length,
      e.doc.sliceString(this.from, this.to),
    );
    this.setSelection(e);
  }
  revertPending(e) {
    let pendingContextChange = this.pendingContextChange;
    this.pendingContextChange = null;
    this.editContext.updateText(
      this.toContextPos(pendingContextChange.from),
      this.toContextPos(
        pendingContextChange.from + pendingContextChange.insert.length,
      ),
      e.doc.sliceString(pendingContextChange.from, pendingContextChange.to),
    );
  }
  setSelection(e) {
    let { main } = e.selection;
    let n = this.toContextPos(
      Math.max(this.from, Math.min(this.to, main.anchor)),
    );
    let r = this.toContextPos(main.head);
    if (
      this.editContext.selectionStart != n ||
      this.editContext.selectionEnd != r
    ) {
      this.editContext.updateSelection(n, r);
    }
  }
  rangeIsValid(e) {
    let { head } = e.selection.main;
    return !(
      (this.from > 0 && head - this.from < 500) ||
      (this.to < e.doc.length && this.to - head < 500) ||
      this.to - this.from > 30000
    );
  }
  toEditorPos(e, t = this.to - this.from) {
    e = Math.min(e, t);
    let composing = this.composing;
    if (composing && composing.drifted) {
      return composing.editorBase + (e - composing.contextBase);
    }
    return e + this.from;
  }
  toContextPos(e) {
    let composing = this.composing;
    if (composing && composing.drifted) {
      return composing.contextBase + (e - composing.editorBase);
    }
    return e - this.from;
  }
  destroy() {
    for (let e in this.handlers) {
      this.editContext.removeEventListener(e, this.handlers[e]);
    }
  }
};
const G = class e {
  get state() {
    return this.viewState.state;
  }
  get viewport() {
    return this.viewState.viewport;
  }
  get visibleRanges() {
    return this.viewState.visibleRanges;
  }
  get inView() {
    return this.viewState.inView;
  }
  get composing() {
    return !!this.inputState && this.inputState.composing > 0;
  }
  get compositionStarted() {
    return !!this.inputState && this.inputState.composing >= 0;
  }
  get root() {
    return this._root;
  }
  get win() {
    return this.dom.ownerDocument.defaultView || window;
  }
  constructor(e = {}) {
    this.plugins = [];
    this.pluginMap = new Map();
    this.editorAttrs = {};
    this.contentAttrs = {};
    this.bidiCache = [];
    this.destroyed = false;
    this.updateState = 2;
    this.measureScheduled = -1;
    this.measureRequests = [];
    this.clearAnnouncement = -1;
    this.contentDOM = document.createElement(`div`);
    this.scrollDOM = document.createElement(`div`);
    this.scrollDOM.tabIndex = -1;
    this.scrollDOM.className = `cm-scroller`;
    this.scrollDOM.appendChild(this.contentDOM);
    this.announceDOM = document.createElement(`div`);
    this.announceDOM.className = `cm-announced`;
    this.announceDOM.setAttribute(`aria-live`, `polite`);
    this.dom = document.createElement(`div`);
    this.dom.appendChild(this.announceDOM);
    this.dom.appendChild(this.scrollDOM);
    if (e.parent) {
      e.parent.appendChild(this.dom);
    }
    let { dispatch } = e;
    this.dispatchTransactions =
      e.dispatchTransactions ||
      (dispatch && ((e) => e.forEach((e) => dispatch(e, this)))) ||
      ((e) => this.update(e));
    this.dispatch = this.dispatch.bind(this);
    this._root = e.root || Pn(e.parent) || document;
    this.viewState = new so(this, e.state || N.create(e));
    if (e.scrollTo && e.scrollTo.is(br)) {
      this.viewState.scrollTarget = e.scrollTo.value.clip(this.viewState.state);
    }
    this.plugins = this.state.facet(Tr).map((e) => new Er(e));
    for (let e of this.plugins) {
      e.update(this);
    }
    this.observer = new Oo(this);
    this.inputState = new $i(this);
    this.inputState.ensureHandlers(this.plugins);
    this.docView = new pi(this);
    this.mountStyles();
    this.updateAttrs();
    this.updateState = 0;
    this.requestMeasure();
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        this.viewState.mustMeasureContent = `refresh`;
        this.requestMeasure();
      });
    }
  }
  dispatch(...e) {
    let t =
      e.length == 1 && e[0] instanceof Ke
        ? e
        : e.length == 1 && Array.isArray(e[0])
          ? e[0]
          : [this.state.update(...e)];
    this.dispatchTransactions(t, this);
  }
  update(t) {
    if (this.updateState != 0) {
      throw Error(
        `Calls to EditorView.update are not allowed while an update is in progress`,
      );
    }
    let n = false;
    let r = false;
    let i;
    let state = this.state;
    for (let e of t) {
      if (e.startState != state) {
        throw RangeError(
          `Trying to update state with a transaction that doesn't start from the previous state.`,
        );
      }
      state = e.state;
    }
    if (this.destroyed) {
      this.viewState.state = state;
      return;
    }
    let hasFocus = this.hasFocus;
    let s = 0;
    let c = null;
    if (t.some((e) => e.annotation(Ma))) {
      this.inputState.notifiedFocused = hasFocus;
      s = 1;
    } else if (hasFocus != this.inputState.notifiedFocused) {
      this.inputState.notifiedFocused = hasFocus;
      c = Na(state, hasFocus);
      if (!c) {
        s = 1;
      }
    }
    let delayedAndroidKey = this.observer.delayedAndroidKey;
    let u = null;
    if (delayedAndroidKey) {
      this.observer.clearDelayedAndroidKey();
      u = this.observer.readChange();
      if (
        (u && !this.state.doc.eq(state.doc)) ||
        !this.state.selection.eq(state.selection)
      ) {
        u = null;
      }
    } else {
      this.observer.clear();
    }
    if (state.facet(N.phrases) != this.state.facet(N.phrases)) {
      return this.setState(state);
    }
    i = zr.create(this, state, t);
    i.flags |= s;
    let scrollTarget = this.viewState.scrollTarget;
    try {
      this.updateState = 2;
      for (let n of t) {
        scrollTarget &&= scrollTarget.map(n.changes);
        if (n.scrollIntoView) {
          let { main } = n.state.selection;
          let { x, y } = this.state.facet(e.cursorScrollMargin);
          scrollTarget = new yr(
            main.empty
              ? main
              : k.cursor(main.head, main.head > main.anchor ? -1 : 1),
            `nearest`,
            `nearest`,
            y,
            x,
          );
        }
        for (let e of n.effects) {
          if (e.is(br)) {
            scrollTarget = e.value.clip(this.state);
          }
        }
      }
      this.viewState.update(i, scrollTarget);
      this.bidiCache = Fo.update(this.bidiCache, i.changes);
      if (!i.empty) {
        this.updatePlugins(i);
        this.inputState.update(i);
      }
      n = this.docView.update(i);
      if (this.state.facet(Lr) != this.styleModules) {
        this.mountStyles();
      }
      r = this.updateAttrs();
      this.showAnnouncements(t);
      this.docView.updateSelection(
        n,
        t.some((e) => e.isUserEvent(`select.pointer`)),
      );
    } finally {
      this.updateState = 0;
    }
    if (i.startState.facet(vo) != i.state.facet(vo)) {
      this.viewState.mustMeasureContent = true;
    }
    if (
      n ||
      r ||
      scrollTarget ||
      this.viewState.mustEnforceCursorAssoc ||
      this.viewState.mustMeasureContent
    ) {
      this.requestMeasure();
    }
    if (n) {
      this.docViewUpdate();
    }
    if (!i.empty) {
      for (let e of this.state.facet(dr)) {
        try {
          e(i);
        } catch (error) {
          Sr(this.state, error, `update listener`);
        }
      }
    }
    if (c || u) {
      Promise.resolve().then(() => {
        if (c && this.state == c.startState) {
          this.dispatch(c);
        }
        if (u && !Ki(this, u) && delayedAndroidKey.force) {
          Nn(this.contentDOM, delayedAndroidKey.key, delayedAndroidKey.keyCode);
        }
      });
    }
  }
  setState(e) {
    if (this.updateState != 0) {
      throw Error(
        `Calls to EditorView.setState are not allowed while an update is in progress`,
      );
    }
    if (this.destroyed) {
      this.viewState.state = e;
      return;
    }
    this.updateState = 2;
    let hasFocus = this.hasFocus;
    try {
      for (let e of this.plugins) {
        e.destroy(this);
      }
      this.viewState = new so(this, e);
      this.plugins = e.facet(Tr).map((e) => new Er(e));
      this.pluginMap.clear();
      for (let e of this.plugins) {
        e.update(this);
      }
      this.docView.destroy();
      this.docView = new pi(this);
      this.inputState.ensureHandlers(this.plugins);
      this.mountStyles();
      this.updateAttrs();
      this.bidiCache = [];
    } finally {
      this.updateState = 0;
    }
    if (hasFocus) {
      this.focus();
    }
    this.requestMeasure();
  }
  updatePlugins(e) {
    let t = e.startState.facet(Tr);
    let n = e.state.facet(Tr);
    if (t != n) {
      let r = [];
      for (let i of n) {
        let n = t.indexOf(i);
        if (n < 0) {
          r.push(new Er(i));
        } else {
          let t = this.plugins[n];
          t.mustUpdate = e;
          r.push(t);
        }
      }
      for (let t of this.plugins) {
        if (t.mustUpdate != e) {
          t.destroy(this);
        }
      }
      this.plugins = r;
      this.pluginMap.clear();
    } else {
      for (let t of this.plugins) {
        t.mustUpdate = e;
      }
    }
    for (let e = 0; e < this.plugins.length; e++) {
      this.plugins[e].update(this);
    }
    if (t != n) {
      this.inputState.ensureHandlers(this.plugins);
    }
  }
  docViewUpdate() {
    for (let e of this.plugins) {
      let t = e.value;
      if (t && t.docViewUpdate) {
        try {
          t.docViewUpdate(this);
        } catch (error) {
          Sr(this.state, error, `doc view update listener`);
        }
      }
    }
  }
  measure(e = true) {
    if (this.destroyed) {
      return;
    }
    if (this.measureScheduled > -1) {
      this.win.cancelAnimationFrame(this.measureScheduled);
    }
    if (this.observer.delayedAndroidKey) {
      this.measureScheduled = -1;
      this.requestMeasure();
      return;
    }
    this.measureScheduled = 0;
    if (e) {
      this.observer.forceFlush();
    }
    let t = null;
    let scrollParent = this.viewState.scrollParent;
    let r = this.viewState.getScrollOffset();
    let { scrollAnchorPos, scrollAnchorHeight, scaleY } = this.viewState;
    if (Math.abs(r - this.viewState.scrollOffset) > 1) {
      scrollAnchorHeight = -1;
    }
    this.viewState.scrollAnchorHeight = -1;
    try {
      for (let e = 0; ; e++) {
        if (scrollAnchorHeight < 0) {
          if (In(scrollParent || this.win)) {
            scrollAnchorPos = -1;
            scrollAnchorHeight =
              this.viewState.heightMap.height / this.viewState.scaleY;
          } else {
            let e = this.viewState.scrollAnchorAt(r);
            scrollAnchorPos = e.from;
            scrollAnchorHeight = e.top;
          }
          scaleY = this.viewState.scaleY;
        }
        this.updateState = 1;
        let s = this.viewState.measure();
        if (
          !s &&
          !this.measureRequests.length &&
          this.viewState.scrollTarget == null
        ) {
          break;
        }
        if (e > 5) {
          console.warn(
            this.measureRequests.length
              ? `Measure loop restarted more than 5 times`
              : `Viewport failed to stabilize`,
          );
          break;
        }
        let c = [];
        if (!(s & 4)) {
          [this.measureRequests, c] = [c, this.measureRequests];
        }
        let l = c.map((e) => {
          try {
            return e.read(this);
          } catch (error) {
            Sr(this.state, error);
            return Po;
          }
        });
        let u = zr.create(this, this.state, []);
        let d = false;
        u.flags |= s;
        if (t) {
          t.flags |= s;
        } else {
          t = u;
        }
        this.updateState = 2;
        if (!u.empty) {
          this.updatePlugins(u);
          this.inputState.update(u);
          this.updateAttrs();
          d = this.docView.update(u);
          if (d) {
            this.docViewUpdate();
          }
        }
        for (let e = 0; e < c.length; e++) {
          if (l[e] != Po) {
            try {
              let t = c[e];
              if (t.write) {
                t.write(l[e], this);
              }
            } catch (error) {
              Sr(this.state, error);
            }
          }
        }
        if (d) {
          this.docView.updateSelection(true);
        }
        if (!u.viewportChanged && this.measureRequests.length == 0) {
          if (this.viewState.editorHeight) {
            if (this.viewState.scrollTarget) {
              this.docView.scrollIntoView(this.viewState.scrollTarget);
              this.viewState.scrollTarget = null;
              scrollAnchorHeight = -1;
              continue;
            }
            {
              let e =
                (scrollAnchorPos < 0
                  ? this.viewState.heightMap.height
                  : this.viewState.lineBlockAt(scrollAnchorPos).top) /
                  this.viewState.scaleY -
                scrollAnchorHeight / scaleY;
              if (
                (e > 1 || e < -1) &&
                !(
                  L.ios &&
                  this.inputState.lastIOSMomentumScroll > Date.now() - 100
                ) &&
                (scrollParent == this.scrollDOM ||
                  this.hasFocus ||
                  Math.max(
                    this.inputState.lastWheelEvent,
                    this.inputState.lastTouchTime,
                  ) >
                    Date.now() - 100)
              ) {
                r += e;
                if (scrollParent) {
                  if (scrollAnchorPos < 0) {
                    scrollParent.scrollTop = scrollParent.scrollHeight;
                  } else {
                    scrollParent.scrollTop += e;
                  }
                } else {
                  this.win.scrollBy(0, e);
                }
                scrollAnchorHeight = -1;
                continue;
              }
            }
          }
          break;
        }
      }
    } finally {
      this.updateState = 0;
      this.measureScheduled = -1;
    }
    if (t && !t.empty) {
      for (let e of this.state.facet(dr)) {
        e(t);
      }
    }
  }
  get themeClasses() {
    return (
      bo + ` ` + (this.state.facet(yo) ? So : xo) + ` ` + this.state.facet(vo)
    );
  }
  updateAttrs() {
    let e = Io(this, Dr, {
      class:
        `cm-editor` +
        (this.hasFocus ? ` cm-focused ` : ` `) +
        this.themeClasses,
    });
    let t = {
      spellcheck: `false`,
      autocorrect: `off`,
      autocapitalize: `off`,
      writingsuggestions: `false`,
      translate: `no`,
      contenteditable: this.state.facet(Cr) ? `true` : `false`,
      class: `cm-content`,
      style: `${L.tabSize}: ${this.state.tabSize}`,
      role: `textbox`,
      "aria-multiline": `true`,
    };
    if (this.state.readOnly) {
      t[`aria-readonly`] = `true`;
    }
    Io(this, Or, t);
    let n = this.observer.ignore(() => {
      let n = tn(this.contentDOM, this.contentAttrs, t);
      let r = tn(this.dom, this.editorAttrs, e);
      return n || r;
    });
    this.editorAttrs = e;
    this.contentAttrs = t;
    return n;
  }
  showAnnouncements(t) {
    let n = true;
    for (let r of t) {
      for (let t of r.effects) {
        if (t.is(e.announce)) {
          n &&=
            ((this.announceDOM.textContent = ``),
            this.win.clearTimeout(this.clearAnnouncement),
            (this.clearAnnouncement = this.win.setTimeout(() => {
              this.announceDOM.textContent = `\xA0`;
            }, 200)),
            false);
          let e = this.announceDOM.appendChild(document.createElement(`div`));
          e.textContent = t.value;
        }
      }
    }
  }
  mountStyles() {
    this.styleModules = this.state.facet(Lr);
    let nonce = this.state.facet(e.cspNonce);
    At.mount(
      this.root,
      this.styleModules.concat(To).reverse(),
      nonce
        ? {
            nonce,
          }
        : undefined,
    );
  }
  readMeasured() {
    if (this.updateState == 2) {
      throw Error(`Reading the editor layout isn't allowed during an update`);
    }
    if (this.updateState == 0 && this.measureScheduled > -1) {
      this.measure(false);
    }
  }
  requestMeasure(e) {
    if (this.measureScheduled < 0) {
      this.measureScheduled = this.win.requestAnimationFrame(() =>
        this.measure(),
      );
    }
    if (e) {
      if (this.measureRequests.indexOf(e) > -1) {
        return;
      }
      if (e.key != null) {
        for (let t = 0; t < this.measureRequests.length; t++) {
          if (this.measureRequests[t].key === e.key) {
            this.measureRequests[t] = e;
            return;
          }
        }
      }
      this.measureRequests.push(e);
    }
  }
  plugin(e) {
    let t = this.pluginMap.get(e);
    if (t === undefined || (t && t.plugin != e)) {
      this.pluginMap.set(
        e,
        (t = this.plugins.find((t) => t.plugin == e) || null),
      );
    }
    return t && t.update(this).value;
  }
  get documentTop() {
    return (
      this.contentDOM.getBoundingClientRect().top + this.viewState.paddingTop
    );
  }
  get documentPadding() {
    return {
      top: this.viewState.paddingTop,
      bottom: this.viewState.paddingBottom,
    };
  }
  get scaleX() {
    return this.viewState.scaleX;
  }
  get scaleY() {
    return this.viewState.scaleY;
  }
  elementAtHeight(e) {
    this.readMeasured();
    return this.viewState.elementAtHeight(e);
  }
  lineBlockAtHeight(e) {
    this.readMeasured();
    return this.viewState.lineBlockAtHeight(e);
  }
  get viewportLineBlocks() {
    return this.viewState.viewportLines;
  }
  lineBlockAt(e) {
    return this.viewState.lineBlockAt(e);
  }
  get contentHeight() {
    return this.viewState.contentHeight;
  }
  moveByChar(e, t, n) {
    return Fi(this, e, Ai(this, e, t, n));
  }
  moveByGroup(e, t) {
    return Fi(
      this,
      e,
      Ai(this, e, t, (t) => ji(this, e.head, t)),
    );
  }
  visualLineSide(e, t) {
    if (t) {
      return k.cursor(e.to, 1);
    }
    return k.cursor(e.from, -1);
  }
  moveToLineBoundary(e, t, n = true) {
    return ki(this, e, t, n);
  }
  moveVertically(e, t, n) {
    return Fi(this, e, Mi(this, e, t, n));
  }
  domAtPos(e, t = 1) {
    return this.docView.domAtPos(e, t);
  }
  posAtDOM(e, t = 0) {
    return this.docView.posFromDOM(e, t);
  }
  posAtCoords(e, t = true) {
    this.readMeasured();
    let n = Li(this, e, t);
    return n && n.pos;
  }
  posAndSideAtCoords(e, t = true) {
    this.readMeasured();
    return Li(this, e, t);
  }
  coordsAtPos(e, t = 1) {
    this.readMeasured();
    let n = this.state.doc.lineAt(e);
    let r = this.bidiSpans(n);
    let i = r[Yn.find(r, e - n.from, -1, t)];
    n.length &&
      ((e == n.from && t < 0) || (e == n.to && t > 0)) &&
      i.dir != this.textDirectionAt(n.from) &&
      (e == n.to
        ? ((e = n.from + i.from), (t = 1))
        : ((e = n.from + i.to), (t = -1)));
    return this.docView.coordsAt(e, t, i.dir == B.RTL);
  }
  coordsForChar(e) {
    this.readMeasured();
    return this.docView.coordsForChar(e);
  }
  get defaultCharacterWidth() {
    return this.viewState.heightOracle.charWidth;
  }
  get defaultLineHeight() {
    return this.viewState.heightOracle.lineHeight;
  }
  get textDirection() {
    return this.viewState.defaultTextDirection;
  }
  textDirectionAt(e) {
    if (
      !this.state.facet(gr) ||
      e < this.viewport.from ||
      e > this.viewport.to
    ) {
      return this.textDirection;
    }
    return (this.readMeasured(), this.docView.textDirectionAt(e));
  }
  get lineWrapping() {
    return this.viewState.heightOracle.lineWrapping;
  }
  bidiSpans(e) {
    if (e.length > No) {
      return rr(e.length);
    }
    let t = this.textDirectionAt(e.from);
    let n;
    for (let r of this.bidiCache) {
      if (
        r.from == e.from &&
        r.dir == t &&
        (r.fresh || Xn(r.isolates, (n = Pr(this, e))))
      ) {
        return r.order;
      }
    }
    n ||= Pr(this, e);
    let r = nr(e.text, t, n);
    this.bidiCache.push(new Fo(e.from, e.to, t, n, true, r));
    return r;
  }
  get hasFocus() {
    return (
      (this.dom.ownerDocument.hasFocus() ||
        (L.safari && this.inputState?.lastContextMenu > Date.now() - 30000)) &&
      this.root.activeElement == this.contentDOM
    );
  }
  focus() {
    this.observer.ignore(() => {
      An(this.contentDOM);
      this.docView.updateSelection();
    });
  }
  setRoot(e) {
    if (this._root != e) {
      this._root = e;
      this.observer.setWindow(
        (e.nodeType == 9 ? e : e.ownerDocument).defaultView || window,
      );
      this.mountStyles();
    }
  }
  destroy() {
    if (this.root.activeElement == this.contentDOM) {
      this.contentDOM.blur();
    }
    for (let e of this.plugins) {
      e.destroy(this);
    }
    this.plugins = [];
    this.inputState.destroy();
    this.docView.destroy();
    this.dom.remove();
    this.observer.destroy();
    this.win.clearTimeout(this.clearAnnouncement);
    if (this.measureScheduled > -1) {
      this.win.cancelAnimationFrame(this.measureScheduled);
    }
    this.destroyed = true;
  }
  static scrollIntoView(e, t = {}) {
    return br.of(
      new yr(
        typeof e == `number` ? k.cursor(e) : e,
        t.y ?? `nearest`,
        t.x ?? `nearest`,
        t.yMargin ?? 5,
        t.xMargin ?? 5,
      ),
    );
  }
  scrollSnapshot() {
    let { scrollTop, scrollLeft } = this.scrollDOM;
    let n = this.viewState.scrollAnchorAt(scrollTop);
    return br.of(
      new yr(
        k.cursor(n.from),
        `start`,
        `start`,
        n.top - scrollTop,
        scrollLeft,
        true,
      ),
    );
  }
  setTabFocusMode(e) {
    if (e == null) {
      this.inputState.tabFocusMode = this.inputState.tabFocusMode < 0 ? 0 : -1;
    } else if (typeof e == `boolean`) {
      this.inputState.tabFocusMode = e ? 0 : -1;
    } else if (this.inputState.tabFocusMode != 0) {
      this.inputState.tabFocusMode = Date.now() + e;
    }
  }
  static domEventHandlers(eventHandlers) {
    return H.define(() => ({}), {
      eventHandlers,
    });
  }
  static domEventObservers(eventObservers) {
    return H.define(() => ({}), {
      eventObservers,
    });
  }
  static theme(e, t) {
    let n = At.newName();
    let r = [vo.of(n), Lr.of(wo(`.${n}`, e))];
    if (t && t.dark) {
      r.push(yo.of(true));
    }
    return r;
  }
  static baseTheme(e) {
    return Oe.lowest(Lr.of(wo(`.` + bo, e, Co)));
  }
  static findFromDOM(e) {
    let t = e.querySelector(`.cm-content`);
    return ((t && U.get(t)) || U.get(e))?.root?.view || null;
  }
};
G.styleModule = Lr;
G.inputHandler = fr;
G.clipboardInputFilter = mr;
G.clipboardOutputFilter = hr;
G.scrollHandler = vr;
G.focusChangeEffect = pr;
G.perLineTextDirection = gr;
G.exceptionSink = ur;
G.updateListener = dr;
G.editable = Cr;
G.mouseSelectionStyle = lr;
G.dragMovesSelection = cr;
G.clickAddsSelectionRange = sr;
G.decorations = kr;
G.blockWrappers = Ar;
G.outerDecorations = jr;
G.atomicRanges = Mr;
G.bidiIsolatedRanges = Nr;
G.cursorScrollMargin = A.define({
  combine: (e) => {
    let t = 5;
    let n = 5;
    for (let r of e) {
      if (typeof r == `number`) {
        t = n = r;
      } else {
        ({ x: t, y: n } = r);
      }
    }
    return {
      x: t,
      y: n,
    };
  },
});
G.scrollMargins = Fr;
G.darkTheme = yo;
G.cspNonce = A.define({
  combine: (e) => {
    if (e.length) {
      return e[0];
    }
    return ``;
  },
});
G.contentAttributes = Or;
G.editorAttributes = Dr;
G.lineWrapping = G.contentAttributes.of({
  class: `cm-lineWrapping`,
});
G.announce = j.define();
var No = 4096;
var Po = {};
var Fo = class e {
  constructor(e, t, n, r, i, a) {
    this.from = e;
    this.to = t;
    this.dir = n;
    this.isolates = r;
    this.fresh = i;
    this.order = a;
  }
  static update(t, n) {
    if (n.empty && !t.some((e) => e.fresh)) {
      return t;
    }
    let r = [];
    let i = t.length ? t[t.length - 1].dir : B.LTR;
    for (let a = Math.max(0, t.length - 10); a < t.length; a++) {
      let o = t[a];
      if (o.dir == i && !n.touchesRange(o.from, o.to)) {
        r.push(
          new e(
            n.mapPos(o.from, 1),
            n.mapPos(o.to, -1),
            o.dir,
            o.isolates,
            false,
            o.order,
          ),
        );
      }
    }
    return r;
  }
};
function Io(e, t, n) {
  for (let r = e.state.facet(t), i = r.length - 1; i >= 0; i--) {
    let t = r[i];
    let a = typeof t == `function` ? t(e) : t;
    if (a) {
      Zt(a, n);
    }
  }
  return n;
}
const Lo = L.mac ? `mac` : L.windows ? `win` : L.linux ? `linux` : `key`;
function Ro(e, t) {
  let n = e.split(/-(?!$)/);
  let r = n[n.length - 1];
  if (r == `Space`) {
    r = ` `;
  }
  let i;
  let a;
  let o;
  let s;
  for (let e = 0; e < n.length - 1; ++e) {
    let r = n[e];
    if (/^(cmd|meta|m)$/i.test(r)) {
      s = true;
    } else if (/^a(lt)?$/i.test(r)) {
      i = true;
    } else if (/^(c|ctrl|control)$/i.test(r)) {
      a = true;
    } else if (/^s(hift)?$/i.test(r)) {
      o = true;
    } else if (/^mod$/i.test(r)) {
      if (t == `mac`) {
        s = true;
      } else {
        a = true;
      }
    } else {
      throw Error(`Unrecognized modifier name: ` + r);
    }
  }
  if (i) {
    r = `Alt-` + r;
  }
  if (a) {
    r = `Ctrl-` + r;
  }
  if (s) {
    r = `Meta-` + r;
  }
  if (o) {
    r = `Shift-` + r;
  }
  return r;
}
function zo(e, t, n) {
  if (t.altKey) {
    e = `Alt-` + e;
  }
  if (t.ctrlKey) {
    e = `Ctrl-` + e;
  }
  if (t.metaKey) {
    e = `Meta-` + e;
  }
  if (n !== false && t.shiftKey) {
    e = `Shift-` + e;
  }
  return e;
}
const enables = Oe.default(
  G.domEventHandlers({
    keydown(e, t) {
      return Yo(Uo(t.state), e, t, `editor`);
    },
  }),
);
var Vo = A.define({
  enables,
});
var Ho = new WeakMap();
function Uo(state) {
  let t = state.facet(Vo);
  let n = Ho.get(t);
  if (!n) {
    Ho.set(t, (n = qo(t.reduce((acc, item) => acc.concat(item), []))));
  }
  return n;
}
function Wo(view, t, n) {
  return Yo(Uo(view.state), t, view, n);
}
var Go = null;
var Ko = 4000;
function qo(e, t = Lo) {
  let n = Object.create(null);
  let r = Object.create(null);
  let i = (e, t) => {
    let n = r[e];
    if (n == null) {
      r[e] = t;
    } else if (n != t) {
      throw Error(
        `Key binding ` +
          e +
          ` is used both as a regular binding and as a multi-stroke prefix`,
      );
    }
  };
  let a = (scope, r, a, preventDefault, stopPropagation) => {
    let c = n[scope] || (n[scope] = Object.create(null));
    let l = r.split(/ (?!$)/).map((e) => Ro(e, t));
    for (let t = 1; t < l.length; t++) {
      let prefix = l.slice(0, t).join(` `);
      i(prefix, true);
      if (!c[prefix]) {
        c[prefix] = {
          preventDefault: true,
          stopPropagation: false,
          run: [
            (view) => {
              let r = (Go = {
                view,
                prefix,
                scope,
              });
              setTimeout(() => {
                if (Go == r) {
                  Go = null;
                }
              }, Ko);
              return true;
            },
          ],
        };
      }
    }
    let u = l.join(` `);
    i(u, false);
    let d =
      c[u] ||
      (c[u] = {
        preventDefault: false,
        stopPropagation: false,
        run: c._any?.run?.slice() || [],
      });
    if (a) {
      d.run.push(a);
    }
    if (preventDefault) {
      d.preventDefault = true;
    }
    if (stopPropagation) {
      d.stopPropagation = true;
    }
  };
  for (let r of e) {
    let e = r.scope ? r.scope.split(` `) : [`editor`];
    if (r.any) {
      for (let t of e) {
        let e = n[t] || (n[t] = Object.create(null));
        e._any ||= {
          preventDefault: false,
          stopPropagation: false,
          run: [],
        };
        let { any } = r;
        for (let t in e) {
          e[t].run.push((e) => any(e, Jo));
        }
      }
    }
    let i = r[t] || r.key;
    if (i) {
      for (let t of e) {
        a(t, i, r.run, r.preventDefault, r.stopPropagation);
        if (r.shift) {
          a(t, `Shift-` + i, r.shift, r.preventDefault, r.stopPropagation);
        }
      }
    }
  }
  return n;
}
var Jo = null;
function Yo(e, t, n, r) {
  Jo = t;
  let i = Rt(t);
  let a = le(w(i, 0)) == i.length && i != ` `;
  let o = ``;
  let s = false;
  let c = false;
  let l = false;
  if (Go && Go.view == n && Go.scope == r) {
    o = Go.prefix + ` `;
    if (aa.indexOf(t.keyCode) < 0) {
      c = true;
      Go = null;
    }
  }
  let u = new Set();
  let d = (e) => {
    if (e) {
      for (let t of e.run) {
        if (!u.has(t) && (u.add(t), t(n))) {
          if (e.stopPropagation) {
            l = true;
          }
          return true;
        }
      }
      if (e.preventDefault) {
        if (e.stopPropagation) {
          l = true;
        }
        c = true;
      }
    }
    return false;
  };
  let f = e[r];
  let p;
  let m;
  f &&
    (d(f[o + zo(i, t, !a)])
      ? (s = true)
      : a &&
          (t.altKey || t.metaKey || t.ctrlKey) &&
          !(L.windows && t.ctrlKey && t.altKey) &&
          !(L.mac && t.altKey && !(t.ctrlKey || t.metaKey)) &&
          (p = Nt[t.keyCode]) &&
          p != i
        ? (d(f[o + zo(p, t, true)]) ||
            (t.shiftKey &&
              (m = Pt[t.keyCode]) != i &&
              m != p &&
              d(f[o + zo(m, t, false)]))) &&
          (s = true)
        : a && t.shiftKey && d(f[o + zo(i, t, true)]) && (s = true),
    !s && d(f._any) && (s = true));
  if (c) {
    s = true;
  }
  if (s && l) {
    t.stopPropagation();
  }
  Jo = null;
  return s;
}
var Xo = class e {
  constructor(e, t, n, r, i) {
    this.className = e;
    this.left = t;
    this.top = n;
    this.width = r;
    this.height = i;
  }
  draw() {
    let e = document.createElement(`div`);
    e.className = this.className;
    this.adjust(e);
    return e;
  }
  update(e, t) {
    return t.className == this.className && (this.adjust(e), true);
  }
  adjust(e) {
    e.style.left = this.left + `px`;
    e.style.top = this.top + `px`;
    if (this.width != null) {
      e.style.width = this.width + `px`;
    }
    e.style.height = this.height + `px`;
  }
  eq(e) {
    return (
      this.left == e.left &&
      this.top == e.top &&
      this.width == e.width &&
      this.height == e.height &&
      this.className == e.className
    );
  }
  static forRange(t, n, r) {
    if (r.empty) {
      let i = t.coordsAtPos(r.head, r.assoc || 1);
      if (!i) {
        return [];
      }
      let a = Zo(t);
      return [new e(n, i.left - a.left, i.top - a.top, null, i.bottom - i.top)];
    }
    return $o(t, n, r);
  }
};
function Zo(e) {
  let t = e.scrollDOM.getBoundingClientRect();
  return {
    left:
      (e.textDirection == B.LTR
        ? t.left
        : t.right - e.scrollDOM.clientWidth * e.scaleX) -
      e.scrollDOM.scrollLeft * e.scaleX,
    top: t.top - e.scrollDOM.scrollTop * e.scaleY,
  };
}
function Qo(e, t, n, r) {
  let i = e.coordsAtPos(t, n * 2);
  if (!i) {
    return r;
  }
  let a = e.dom.getBoundingClientRect();
  let y_1 = (i.top + i.bottom) / 2;
  let s = e.posAtCoords({
    x: a.left + 1,
    y: y_1,
  });
  let c = e.posAtCoords({
    x: a.right - 1,
    y: y_1,
  });
  if (s == null || c == null) {
    return r;
  }
  return {
    from: Math.max(r.from, Math.min(s, c)),
    to: Math.min(r.to, Math.max(s, c)),
  };
}
function $o(e, t, n) {
  if (n.to <= e.viewport.from || n.from >= e.viewport.to) {
    return [];
  }
  let r = Math.max(n.from, e.viewport.from);
  let i = Math.min(n.to, e.viewport.to);
  let a = e.textDirection == B.LTR;
  let e_contentDOM = e.contentDOM;
  let s = e_contentDOM.getBoundingClientRect();
  let c = Zo(e);
  let l = e_contentDOM.querySelector(`.cm-line`);
  let u = l && window.getComputedStyle(l);
  let d =
    s.left +
    (u ? parseInt(u.paddingLeft) + Math.min(0, parseInt(u.textIndent)) : 0);
  let f = s.right - (u ? parseInt(u.paddingRight) : 0);
  let p = Oi(e, r, 1);
  let m = Oi(e, i, -1);
  let h = p.type == R.Text ? p : null;
  let g = m.type == R.Text ? m : null;
  if (h && (e.lineWrapping || p.widgetLineBreaks)) {
    h = Qo(e, r, 1, h);
  }
  if (g && (e.lineWrapping || m.widgetLineBreaks)) {
    g = Qo(e, i, -1, g);
  }
  if (h && g && h.from == g.from && h.to == g.to) {
    return v(y(n.from, n.to, h));
  }
  {
    let t = h ? y(n.from, null, h) : b(p, false);
    let r = g ? y(null, n.to, g) : b(m, true);
    let i = [];
    if (
      (h || p).to < (g || m).from - (h && g ? 1 : 0) ||
      (p.widgetLineBreaks > 1 && t.bottom + e.defaultLineHeight / 2 < r.top)
    ) {
      i.push(_(d, t.bottom, f, r.top));
    } else if (
      t.bottom < r.top &&
      e.elementAtHeight((t.bottom + r.top) / 2).type == R.Text
    ) {
      t.bottom = r.top = (t.bottom + r.top) / 2;
    }
    return v(t).concat(i).concat(v(r));
  }
  function _(e, n, r, i) {
    return new Xo(t, e - c.left, n - c.top, Math.max(0, r - e), i - n);
  }
  function v({ top, bottom, horizontal }) {
    let r = [];
    for (let i = 0; i < horizontal.length; i += 2) {
      r.push(_(horizontal[i], top, horizontal[i + 1], bottom));
    }
    return r;
  }
  function y(t, n, r) {
    let i = 1000000000;
    let o = -1000000000;
    let horizontal = [];
    function c(t, n, c, l, u) {
      let p = e.coordsAtPos(t, t == r.to ? -2 : 2);
      let m = e.coordsAtPos(c, c == r.from ? 2 : -2);
      if (p && m) {
        i = Math.min(p.top, m.top, i);
        o = Math.max(p.bottom, m.bottom, o);
        if (u == B.LTR) {
          horizontal.push(a && n ? d : p.left, a && l ? f : m.right);
        } else {
          horizontal.push(!a && l ? d : m.left, !a && n ? f : p.right);
        }
      }
    }
    let l = t ?? r.from;
    let u = n ?? r.to;
    for (let r of e.visibleRanges) {
      if (r.to > l && r.from < u) {
        for (let i = Math.max(r.from, l), a = Math.min(r.to, u); ;) {
          let r = e.state.doc.lineAt(i);
          for (let o of e.bidiSpans(r)) {
            let e = o.from + r.from;
            let s = o.to + r.from;
            if (e >= a) {
              break;
            }
            if (s > i) {
              c(
                Math.max(e, i),
                t == null && e <= l,
                Math.min(s, a),
                n == null && s >= u,
                o.dir,
              );
            }
          }
          i = r.to + 1;
          if (i >= a) {
            break;
          }
        }
      }
    }
    if (horizontal.length == 0) {
      c(l, t == null, u, n == null, e.textDirection);
    }
    return {
      top: i,
      bottom: o,
      horizontal,
    };
  }
  function b(e, t) {
    let n = s.top + (t ? e.top : e.bottom);
    return {
      top: n,
      bottom: n,
      horizontal: [],
    };
  }
}
function es(e, t) {
  return e.constructor == t.constructor && e.eq(t);
}
class ts {
  constructor(e, t) {
    this.view = e;
    this.layer = t;
    this.drawn = [];
    this.scaleX = 1;
    this.scaleY = 1;
    this.measureReq = {
      read: this.measure.bind(this),
      write: this.draw.bind(this),
    };
    this.dom = e.scrollDOM.appendChild(document.createElement(`div`));
    this.dom.classList.add(`cm-layer`);
    if (t.above) {
      this.dom.classList.add(`cm-layer-above`);
    }
    if (t.class) {
      this.dom.classList.add(t.class);
    }
    this.scale();
    this.dom.setAttribute(`aria-hidden`, `true`);
    this.setOrder(e.state);
    e.requestMeasure(this.measureReq);
    if (t.mount) {
      t.mount(this.dom, e);
    }
  }
  update(e) {
    if (e.startState.facet(ns) != e.state.facet(ns)) {
      this.setOrder(e.state);
    }
    if (this.layer.update(e, this.dom) || e.geometryChanged) {
      this.scale();
      e.view.requestMeasure(this.measureReq);
    }
  }
  docViewUpdate(e) {
    if (this.layer.updateOnDocViewUpdate !== false) {
      e.requestMeasure(this.measureReq);
    }
  }
  setOrder(e) {
    let t = 0;
    let n = e.facet(ns);
    while (t < n.length && n[t] != this.layer) {
      t++;
    }
    this.dom.style.zIndex = String((this.layer.above ? 150 : -1) - t);
  }
  measure() {
    return this.layer.markers(this.view);
  }
  scale() {
    let { scaleX, scaleY } = this.view;
    if (scaleX != this.scaleX || scaleY != this.scaleY) {
      this.scaleX = scaleX;
      this.scaleY = scaleY;
      this.dom.style.transform = `scale(${1 / scaleX}, ${1 / scaleY})`;
    }
  }
  draw(e) {
    if (
      e.length != this.drawn.length ||
      e.some((e, t) => !es(e, this.drawn[t]))
    ) {
      let t = this.dom.firstChild;
      let n = 0;
      for (let r of e) {
        if (
          r.update &&
          t &&
          r.constructor &&
          this.drawn[n].constructor &&
          r.update(t, this.drawn[n])
        ) {
          t = t.nextSibling;
          n++;
        } else {
          this.dom.insertBefore(r.draw(), t);
        }
      }
      while (t) {
        let e = t.nextSibling;
        t.remove();
        t = e;
      }
      this.drawn = e;
      if (L.webkit) {
        this.dom.style.display = this.dom.firstChild ? `` : `none`;
      }
    }
  }
  destroy() {
    if (this.layer.destroy) {
      this.layer.destroy(this.dom, this.view);
    }
    this.dom.remove();
  }
}
var ns = A.define();
function rs(e) {
  return [H.define((t) => new ts(t, e)), ns.of(e)];
}
const is = A.define({
  combine(e) {
    return at(
      e,
      {
        cursorBlinkRate: 1200,
        drawRangeCursor: true,
        iosSelectionHandles: true,
      },
      {
        cursorBlinkRate: (e, t) => Math.min(e, t),
        drawRangeCursor: (e, t) => e || t,
      },
    );
  },
});
function as(e = {}) {
  return [is.of(e), ss, ls, ds, _r.of(true)];
}
function os(e) {
  return e.startState.facet(is) != e.state.facet(is);
}
var ss = rs({
  above: true,
  markers(e) {
    let { state } = e;
    let n = state.facet(is);
    let r = [];
    for (let i of state.selection.ranges) {
      let a = i == state.selection.main;
      if (
        i.empty ||
        (n.drawRangeCursor && !(a && L.ios && n.iosSelectionHandles))
      ) {
        let t = a
          ? `cm-cursor cm-cursor-primary`
          : `cm-cursor cm-cursor-secondary`;
        let n = i.empty ? i : k.cursor(i.head, i.assoc);
        for (let i of Xo.forRange(e, t, n)) {
          r.push(i);
        }
      }
    }
    return r;
  },
  update(e, t) {
    if (e.transactions.some((e) => e.selection)) {
      t.style.animationName =
        t.style.animationName == `cm-blink` ? `cm-blink2` : `cm-blink`;
    }
    let n = os(e);
    if (n) {
      cs(e.state, t);
    }
    return e.docChanged || e.selectionSet || n;
  },
  mount(e, t) {
    cs(t.state, e);
  },
  class: `cm-cursorLayer`,
});
function cs(state, t) {
  t.style.animationDuration = state.facet(is).cursorBlinkRate + `ms`;
}
var ls = rs({
  above: false,
  markers(e) {
    let t = [];
    let { main, ranges } = e.state.selection;
    for (let n of ranges) {
      if (!n.empty) {
        for (let r of Xo.forRange(e, `cm-selectionBackground`, n)) {
          t.push(r);
        }
      }
    }
    if (L.ios && !main.empty && e.state.facet(is).iosSelectionHandles) {
      for (let r of Xo.forRange(
        e,
        `cm-selectionHandle cm-selectionHandle-start`,
        k.cursor(main.from, 1),
      )) {
        t.push(r);
      }
      for (let r of Xo.forRange(
        e,
        `cm-selectionHandle cm-selectionHandle-end`,
        k.cursor(main.to, 1),
      )) {
        t.push(r);
      }
    }
    return t;
  },
  update(e, t) {
    return e.docChanged || e.selectionSet || e.viewportChanged || os(e);
  },
  class: `cm-selectionLayer`,
});
const us = L.gecko && L.gecko_version == 153 ? `#ffffff01` : `transparent`;
var ds = Oe.highest(
  G.theme({
    ".cm-line": {
      "& ::selection, &::selection": {
        backgroundColor: `${us} !important`,
      },
      caretColor: `transparent !important`,
    },
    ".cm-content": {
      caretColor: `transparent !important`,
      "& :focus": {
        caretColor: `initial !important`,
        "&::selection, & ::selection": {
          backgroundColor: `Highlight !important`,
        },
      },
    },
  }),
);
const fs = j.define({
  map(e, t) {
    if (e == null) {
      return null;
    }
    return t.mapPos(e);
  },
});
const ps = Te.define({
  create() {
    return null;
  },
  update(e, t) {
    if (e != null) {
      e = t.changes.mapPos(e);
    }
    return t.effects.reduce((acc, effect) => {
      if (effect.is(fs)) {
        return effect.value;
      }
      return acc;
    }, e);
  },
});
const ms = H.fromClass(
  class {
    constructor(e) {
      this.view = e;
      this.cursor = null;
      this.measureReq = {
        read: this.readPos.bind(this),
        write: this.drawCursor.bind(this),
      };
    }
    update(e) {
      let t;
      let n = e.state.field(ps);
      n == null
        ? this.cursor != null &&
          ((t = this.cursor) == null || t.remove(), (this.cursor = null))
        : (this.cursor ||
            ((this.cursor = this.view.scrollDOM.appendChild(
              document.createElement(`div`),
            )),
            (this.cursor.className = `cm-dropCursor`)),
          (e.startState.field(ps) != n || e.docChanged || e.geometryChanged) &&
            this.view.requestMeasure(this.measureReq));
    }
    readPos() {
      let { view } = this;
      let t = view.state.field(ps);
      let n = t != null && view.coordsAtPos(t);
      if (!n) {
        return null;
      }
      let r = view.scrollDOM.getBoundingClientRect();
      return {
        left: n.left - r.left + view.scrollDOM.scrollLeft * view.scaleX,
        top: n.top - r.top + view.scrollDOM.scrollTop * view.scaleY,
        height: n.bottom - n.top,
      };
    }
    drawCursor(e) {
      if (this.cursor) {
        let { scaleX, scaleY } = this.view;
        if (e) {
          this.cursor.style.left = e.left / scaleX + `px`;
          this.cursor.style.top = e.top / scaleY + `px`;
          this.cursor.style.height = e.height / scaleY + `px`;
        } else {
          this.cursor.style.left = `-100000px`;
        }
      }
    }
    destroy() {
      if (this.cursor) {
        this.cursor.remove();
      }
    }
    setDropPos(e) {
      if (this.view.state.field(ps) != e) {
        this.view.dispatch({
          effects: fs.of(e),
        });
      }
    }
  },
  {
    eventObservers: {
      dragover(e) {
        this.setDropPos(
          this.view.posAtCoords({
            x: e.clientX,
            y: e.clientY,
          }),
        );
      },
      dragleave(e) {
        if (
          e.target == this.view.contentDOM ||
          !this.view.contentDOM.contains(e.relatedTarget)
        ) {
          this.setDropPos(null);
        }
      },
      dragend() {
        this.setDropPos(null);
      },
      drop() {
        this.setDropPos(null);
      },
    },
  },
);
function hs() {
  return [ps, ms];
}
function gs(doc, regexp, n, r, i) {
  regexp.lastIndex = 0;
  for (
    let a = doc.iterRange(n, r), o = n, s;
    !a.next().done;
    o += a.value.length
  ) {
    if (!a.lineBreak) {
      while ((s = regexp.exec(a.value))) {
        i(o + s.index, s);
      }
    }
  }
}
function _s(e, maxLength) {
  let e_visibleRanges = e.visibleRanges;
  if (
    e_visibleRanges.length == 1 &&
    e_visibleRanges[0].from == e.viewport.from &&
    e_visibleRanges[0].to == e.viewport.to
  ) {
    return e_visibleRanges;
  }
  let r = [];
  for (let { from, to } of e_visibleRanges) {
    from = Math.max(e.state.doc.lineAt(from).from, from - maxLength);
    to = Math.min(e.state.doc.lineAt(to).to, to + maxLength);
    if (r.length && r[r.length - 1].to >= from) {
      r[r.length - 1].to = to;
    } else {
      r.push({
        from,
        to,
      });
    }
  }
  return r;
}
class vs {
  constructor(e) {
    let { regexp, decoration, decorate, boundary, maxLength = 1000 } = e;
    if (!regexp.global) {
      throw RangeError(
        `The regular expression given to MatchDecorator should have its 'g' flag set`,
      );
    }
    this.regexp = regexp;
    if (decorate) {
      this.addMatch = (e, t, n, i) => decorate(i, n, n + e[0].length, e, t);
    } else if (typeof decoration == `function`) {
      this.addMatch = (e, t, r, i) => {
        let a = decoration(e, t, r);
        if (a) {
          i(r, r + e[0].length, a);
        }
      };
    } else if (decoration) {
      this.addMatch = (e, t, r, i) => i(r, r + e[0].length, decoration);
    } else {
      throw RangeError(
        `Either 'decorate' or 'decoration' should be provided to MatchDecorator`,
      );
    }
    this.boundary = boundary;
    this.maxLength = maxLength;
  }
  createDeco(e) {
    let t = new pt();
    let n = t.add.bind(t);
    for (let { from, to } of _s(e, this.maxLength)) {
      gs(e.state.doc, this.regexp, from, to, (t, r) =>
        this.addMatch(r, e, t, n),
      );
    }
    return t.finish();
  }
  updateDeco(e, t) {
    let n = 1000000000;
    let r = -1;
    if (e.docChanged) {
      e.changes.iterChanges((t, i, a, o) => {
        if (o >= e.view.viewport.from && a <= e.view.viewport.to) {
          n = Math.min(a, n);
          r = Math.max(o, r);
        }
      });
    }
    if (e.viewportMoved || r - n > 1000) {
      return this.createDeco(e.view);
    }
    if (r > -1) {
      return this.updateRange(e.view, t.map(e.changes), n, r);
    }
    return t;
  }
  updateRange(e, t, n, r) {
    for (let i of e.visibleRanges) {
      let a = Math.max(i.from, n);
      let o = Math.min(i.to, r);
      if (o >= a) {
        let n = e.state.doc.lineAt(a);
        let r = n.to < o ? e.state.doc.lineAt(o) : n;
        let s = Math.max(i.from, n.from);
        let c = Math.min(i.to, r.to);
        if (this.boundary) {
          for (; a > n.from; a--) {
            if (this.boundary.test(n.text[a - 1 - n.from])) {
              s = a;
              break;
            }
          }
          for (; o < r.to; o++) {
            if (this.boundary.test(r.text[o - r.from])) {
              c = o;
              break;
            }
          }
        }
        let l = [];
        let u;
        let d = (e, t, n) => l.push(n.range(e, t));
        if (n == r) {
          for (
            this.regexp.lastIndex = s - n.from;
            (u = this.regexp.exec(n.text)) && u.index < c - n.from;
          ) {
            this.addMatch(u, e, u.index + n.from, d);
          }
        } else {
          gs(e.state.doc, this.regexp, s, c, (t, n) =>
            this.addMatch(n, e, t, d),
          );
        }
        t = t.update({
          filterFrom: s,
          filterTo: c,
          filter: (e, t) => e < s || t > c,
          add: l,
        });
      }
    }
    return t;
  }
}
const ys = /x/.unicode == null ? `g` : `gu`;
const specialChars = RegExp(
  `[\0-\b
--­؜​‎‏\u2028\u2029‭‮⁦⁧⁩﻿￹-￼]`,
  ys,
);
const xs = {
  0: `null`,
  7: `bell`,
  8: `backspace`,
  10: `newline`,
  11: `vertical tab`,
  13: `carriage return`,
  27: `escape`,
  8203: `zero width space`,
  8204: `zero width non-joiner`,
  8205: `zero width joiner`,
  8206: `left-to-right mark`,
  8207: `right-to-left mark`,
  8232: `line separator`,
  8237: `left-to-right override`,
  8238: `right-to-left override`,
  8294: `left-to-right isolate`,
  8295: `right-to-left isolate`,
  8297: `pop directional isolate`,
  8233: `paragraph separator`,
  65279: `zero width no-break space`,
  65532: `object replacement`,
};
let Ss = null;
function Cs() {
  if (Ss == null && typeof document < `u` && document.body) {
    let e = document.body.style;
    Ss = (e.tabSize ?? e.MozTabSize) != null;
  }
  return Ss || false;
}
const ws = A.define({
  combine(e) {
    let t = at(e, {
      render: null,
      specialChars,
      addSpecialChars: null,
    });
    if ((t.replaceTabs = !Cs())) {
      t.specialChars = RegExp(`	|` + t.specialChars.source, ys);
    }
    if (t.addSpecialChars) {
      t.specialChars = RegExp(
        t.specialChars.source + `|` + t.addSpecialChars.source,
        ys,
      );
    }
    return t;
  },
});
function Ts(e = {}) {
  return [ws.of(e), Ds()];
}
let Es = null;
function Ds() {
  return (Es ||= H.fromClass(
    class {
      constructor(e) {
        this.view = e;
        this.decorations = z.none;
        this.decorationCache = Object.create(null);
        this.decorator = this.makeDecorator(e.state.facet(ws));
        this.decorations = this.decorator.createDeco(e);
      }
      makeDecorator(e) {
        return new vs({
          regexp: e.specialChars,
          decoration: (t, n, r) => {
            let { doc } = n.state;
            let a = w(t[0], 0);
            if (a == 9) {
              let e = doc.lineAt(r);
              let t = n.state.tabSize;
              let a = wt(e.text, t, r - e.from);
              return z.replace({
                widget: new js(
                  ((t - (a % t)) * this.view.defaultCharacterWidth) /
                    this.view.scaleX,
                ),
              });
            }
            return (
              this.decorationCache[a] ||
              (this.decorationCache[a] = z.replace({
                widget: new As(e, a),
              }))
            );
          },
          boundary: e.replaceTabs ? undefined : /[^]/,
        });
      }
      update(e) {
        let t = e.state.facet(ws);
        if (e.startState.facet(ws) == t) {
          this.decorations = this.decorator.updateDeco(e, this.decorations);
        } else {
          this.decorator = this.makeDecorator(t);
          this.decorations = this.decorator.createDeco(e.view);
        }
      }
    },
    {
      decorations: (e) => e.decorations,
    },
  ));
}
const Os = `•`;
function ks(code) {
  if (code >= 32) {
    return Os;
  }
  if (code == 10) {
    return `␤`;
  }
  return String.fromCharCode(9216 + code);
}
var As = class extends rn {
  constructor(e, t) {
    super();
    this.options = e;
    this.code = t;
  }
  eq(e) {
    return e.code == this.code;
  }
  toDOM(e) {
    let t = ks(this.code);
    let n =
      e.state.phrase(`Control character`) +
      ` ` +
      (xs[this.code] || `0x` + this.code.toString(16));
    let r = this.options.render && this.options.render(this.code, n, t);
    if (r) {
      return r;
    }
    let i = document.createElement(`span`);
    i.textContent = t;
    i.title = n;
    i.setAttribute(`aria-label`, n);
    i.className = `cm-specialChar`;
    return i;
  }
  ignoreEvent() {
    return false;
  }
};
var js = class extends rn {
  constructor(e) {
    super();
    this.width = e;
  }
  eq(e) {
    return e.width == this.width;
  }
  toDOM() {
    let e = document.createElement(`span`);
    e.textContent = `	`;
    e.className = `cm-tab`;
    e.style.width = this.width + `px`;
    return e;
  }
  ignoreEvent() {
    return false;
  }
};
function Ms() {
  return Ps;
}
const Ns = z.line({
  class: `cm-activeLine`,
});
var Ps = H.fromClass(
  class {
    constructor(e) {
      this.decorations = this.getDeco(e);
    }
    update(e) {
      if (e.docChanged || e.selectionSet) {
        this.decorations = this.getDeco(e.view);
      }
    }
    getDeco(e) {
      let t = -1;
      let n = [];
      for (let r of e.state.selection.ranges) {
        let i = e.lineBlockAt(r.head);
        if (i.from > t) {
          n.push(Ns.range(i.from));
          t = i.from;
        }
      }
      return z.set(n);
    }
  },
  {
    decorations: (e) => e.decorations,
  },
);
class Fs extends rn {
  constructor(e) {
    super();
    this.content = e;
  }
  toDOM(e) {
    let t = document.createElement(`span`);
    t.className = `cm-placeholder`;
    t.style.pointerEvents = `none`;
    t.appendChild(
      typeof this.content == `string`
        ? document.createTextNode(this.content)
        : typeof this.content == `function`
          ? this.content(e)
          : this.content.cloneNode(true),
    );
    t.setAttribute(`aria-hidden`, `true`);
    return t;
  }
  coordsAt(e) {
    let t = e.firstChild ? hn(e.firstChild) : [];
    if (!t.length) {
      return null;
    }
    let n = window.getComputedStyle(e.parentNode);
    let r = xn(t[0], n.direction != `rtl`);
    let i = parseInt(n.lineHeight);
    if (r.bottom - r.top > i * 1.5) {
      return {
        left: r.left,
        right: r.right,
        top: r.top,
        bottom: r.top + i,
      };
    }
    return r;
  }
  ignoreEvent() {
    return false;
  }
}
function Is(placeholder) {
  let t = H.fromClass(
    class {
      constructor(t) {
        this.view = t;
        this.placeholder = placeholder
          ? z.set([
              z
                .widget({
                  widget: new Fs(placeholder),
                  side: 1,
                })
                .range(0),
            ])
          : z.none;
      }
      get decorations() {
        if (this.view.state.doc.length) {
          return z.none;
        }
        return this.placeholder;
      }
    },
    {
      decorations: (e) => e.decorations,
    },
  );
  if (typeof placeholder == `string`) {
    return [
      t,
      G.contentAttributes.of({
        "aria-placeholder": placeholder,
      }),
    ];
  }
  return t;
}
const Ls = 2000;
function Rs(state, t, n) {
  let r = Math.min(t.line, n.line);
  let i = Math.max(t.line, n.line);
  let a = [];
  if (t.off > Ls || n.off > Ls || t.col < 0 || n.col < 0) {
    let o = Math.min(t.off, n.off);
    let s = Math.max(t.off, n.off);
    for (let t = r; t <= i; t++) {
      let n = state.doc.line(t);
      if (n.length <= s) {
        a.push(k.range(n.from + o, n.to + s));
      }
    }
  } else {
    let o = Math.min(t.col, n.col);
    let s = Math.max(t.col, n.col);
    for (let t = r; t <= i; t++) {
      let n = state.doc.line(t);
      let r = Tt(n.text, o, state.tabSize, true);
      if (r < 0) {
        a.push(k.cursor(n.to));
      } else {
        let t = Tt(n.text, s, state.tabSize);
        a.push(k.range(n.from + r, n.from + t));
      }
    }
  }
  return a;
}
function zs(e, clientX) {
  let n = e.coordsAtPos(e.viewport.from);
  if (n) {
    return Math.round(Math.abs((n.left - clientX) / e.defaultCharacterWidth));
  }
  return -1;
}
function Bs(e, t) {
  let n = e.posAtCoords(
    {
      x: t.clientX,
      y: t.clientY,
    },
    false,
  );
  let r = e.state.doc.lineAt(n);
  let off = n - r.from;
  let col =
    off > Ls
      ? -1
      : off == r.length
        ? zs(e, t.clientX)
        : wt(r.text, e.state.tabSize, n - r.from);
  return {
    line: r.number,
    col,
    off,
  };
}
function Vs(e, t) {
  let n = Bs(e, t);
  let selection = e.state.selection;
  if (n) {
    return {
      update(e) {
        if (e.docChanged) {
          let t = e.changes.mapPos(e.startState.doc.line(n.line).from);
          let i = e.state.doc.lineAt(t);
          n = {
            line: i.number,
            col: n.col,
            off: Math.min(n.off, i.length),
          };
          selection = selection.map(e.changes);
        }
      },
      get(t, i, a) {
        let o = Bs(e, t);
        if (!o) {
          return selection;
        }
        let s = Rs(e.state, n, o);
        if (s.length) {
          if (a) {
            return k.create(s.concat(selection.ranges));
          }
          return k.create(s);
        }
        return selection;
      },
    };
  }
  return null;
}
function Hs(e) {
  let t = e?.eventFilter || ((e) => e.altKey && e.button == 0);
  return G.mouseSelectionStyle.of((e, n) => {
    if (t(n)) {
      return Vs(e, n);
    }
    return null;
  });
}
const Us = {
  Alt: [18, (e) => !!e.altKey],
  Control: [17, (e) => !!e.ctrlKey],
  Shift: [16, (e) => !!e.shiftKey],
  Meta: [91, (e) => !!e.metaKey],
};
const Ws = {
  style: `cursor: crosshair`,
};
function Gs(e = {}) {
  let [t, n] = Us[e.key || `Alt`];
  let r = H.fromClass(
    class {
      constructor(e) {
        this.view = e;
        this.isDown = false;
      }
      set(e) {
        if (this.isDown != e) {
          this.isDown = e;
          this.view.update([]);
        }
      }
    },
    {
      eventObservers: {
        keydown(e) {
          this.set(e.keyCode == t || n(e));
        },
        keyup(e) {
          if (e.keyCode == t || !n(e)) {
            this.set(false);
          }
        },
        mousemove(e) {
          this.set(n(e));
        },
      },
    },
  );
  return [
    r,
    G.contentAttributes.of((e) => {
      if (e.plugin(r)?.isDown) {
        return Ws;
      }
      return null;
    }),
  ];
}
const Ks = `-10000px`;
class qs {
  constructor(e, t, n, r) {
    this.facet = t;
    this.createTooltipView = n;
    this.removeTooltipView = r;
    this.input = e.state.facet(t);
    this.tooltips = this.input.filter((e) => e);
    let i = null;
    this.tooltipViews = this.tooltips.map((e) => (i = n(e, i)));
  }
  update(e, t) {
    let n;
    let r = e.state.facet(this.facet);
    let i = r.filter((e) => e);
    if (r === this.input) {
      for (let t of this.tooltipViews) {
        if (t.update) {
          t.update(e);
        }
      }
      return false;
    }
    let a = [];
    let o = t ? [] : null;
    for (let n = 0; n < i.length; n++) {
      let r = i[n];
      let s = -1;
      if (r) {
        for (let e = 0; e < this.tooltips.length; e++) {
          let tooltip_1 = this.tooltips[e];
          if (tooltip_1 && tooltip_1.create == r.create) {
            s = e;
          }
        }
        if (s < 0) {
          a[n] = this.createTooltipView(r, n ? a[n - 1] : null);
          if (o) {
            o[n] = !!r.above;
          }
        } else {
          let r = (a[n] = this.tooltipViews[s]);
          if (o) {
            o[n] = t[s];
          }
          if (r.update) {
            r.update(e);
          }
        }
      }
    }
    for (let e of this.tooltipViews) {
      if (a.indexOf(e) < 0) {
        this.removeTooltipView(e);
        if (!((n = e.destroy) == null)) {
          n.call(e);
        }
      }
    }
    if (t) {
      o.forEach((e, n) => (t[n] = e));
      t.length = o.length;
    }
    this.input = r;
    this.tooltips = i;
    this.tooltipViews = a;
    return true;
  }
}
function Js(e) {
  let documentElement = e.dom.ownerDocument.documentElement;
  return {
    top: 0,
    left: 0,
    bottom: documentElement.clientHeight,
    right: documentElement.clientWidth,
  };
}
const Ys = A.define({
  combine: (e) => ({
    position: L.ios
      ? `absolute`
      : e.find((e) => e.position)?.position || `fixed`,
    parent: e.find((e) => e.parent)?.parent || null,
    tooltipSpace: e.find((e) => e.tooltipSpace)?.tooltipSpace || Js,
  }),
});
const Xs = new WeakMap();
const Zs = H.fromClass(
  class {
    constructor(e) {
      this.view = e;
      this.above = [];
      this.inView = true;
      this.madeAbsolute = false;
      this.lastTransaction = 0;
      this.measureTimeout = -1;
      let t = e.state.facet(Ys);
      this.position = t.position;
      this.parent = t.parent;
      this.classes = e.themeClasses;
      this.createContainer();
      this.measureReq = {
        read: this.readMeasure.bind(this),
        write: this.writeMeasure.bind(this),
        key: this,
      };
      this.resizeObserver =
        typeof ResizeObserver == `function`
          ? new ResizeObserver(() => this.measureSoon())
          : null;
      this.manager = new qs(
        e,
        tc,
        (e, t) => this.createTooltip(e, t),
        (e) => {
          if (this.resizeObserver) {
            this.resizeObserver.unobserve(e.dom);
          }
          e.dom.remove();
        },
      );
      this.above = this.manager.tooltips.map((e) => !!e.above);
      this.intersectionObserver =
        typeof IntersectionObserver == `function`
          ? new IntersectionObserver(
              (e) => {
                if (
                  Date.now() > this.lastTransaction - 50 &&
                  e.length > 0 &&
                  e[e.length - 1].intersectionRatio < 1
                ) {
                  this.measureSoon();
                }
              },
              {
                threshold: [1],
              },
            )
          : null;
      this.observeIntersection();
      e.win.addEventListener(
        `resize`,
        (this.measureSoon = this.measureSoon.bind(this)),
      );
      this.maybeMeasure();
    }
    createContainer() {
      if (this.parent) {
        this.container = document.createElement(`div`);
        this.container.style.position = `relative`;
        this.container.className = this.view.themeClasses;
        this.parent.appendChild(this.container);
      } else {
        this.container = this.view.dom;
      }
    }
    observeIntersection() {
      if (this.intersectionObserver) {
        this.intersectionObserver.disconnect();
        for (let e of this.manager.tooltipViews) {
          this.intersectionObserver.observe(e.dom);
        }
      }
    }
    measureSoon() {
      if (this.measureTimeout < 0) {
        this.measureTimeout = setTimeout(() => {
          this.measureTimeout = -1;
          this.maybeMeasure();
        }, 50);
      }
    }
    update(e) {
      if (e.transactions.length) {
        this.lastTransaction = Date.now();
      }
      let t = this.manager.update(e, this.above);
      if (t) {
        this.observeIntersection();
      }
      let n = t || e.geometryChanged;
      let r = e.state.facet(Ys);
      if (r.position != this.position && !this.madeAbsolute) {
        this.position = r.position;
        for (let e of this.manager.tooltipViews) {
          e.dom.style.position = this.position;
        }
        n = true;
      }
      if (r.parent != this.parent) {
        if (this.parent) {
          this.container.remove();
        }
        this.parent = r.parent;
        this.createContainer();
        for (let e of this.manager.tooltipViews) {
          this.container.appendChild(e.dom);
        }
        n = true;
      } else {
        if (this.parent && this.view.themeClasses != this.classes) {
          this.classes = this.container.className = this.view.themeClasses;
        }
      }
      if (n) {
        this.maybeMeasure();
      }
    }
    createTooltip(e, t) {
      let n = e.create(this.view);
      let r = t ? t.dom : null;
      n.dom.classList.add(`cm-tooltip`);
      if (e.arrow && !n.dom.querySelector(`.cm-tooltip > .cm-tooltip-arrow`)) {
        let e = document.createElement(`div`);
        e.className = `cm-tooltip-arrow`;
        n.dom.appendChild(e);
      }
      n.dom.style.position = this.position;
      n.dom.style.top = Ks;
      n.dom.style.left = `0px`;
      this.container.insertBefore(n.dom, r);
      if (n.mount) {
        n.mount(this.view);
      }
      if (this.resizeObserver) {
        this.resizeObserver.observe(n.dom);
      }
      return n;
    }
    destroy() {
      let e;
      let t;
      let n;
      this.view.win.removeEventListener(`resize`, this.measureSoon);
      for (let t of this.manager.tooltipViews) {
        t.dom.remove();
        if (!((e = t.destroy) == null)) {
          e.call(t);
        }
      }
      if (this.parent) {
        this.container.remove();
      }
      if (!((t = this.resizeObserver) == null)) {
        t.disconnect();
      }
      if (!((n = this.intersectionObserver) == null)) {
        n.disconnect();
      }
      clearTimeout(this.measureTimeout);
    }
    readMeasure() {
      let e = 1;
      let t = 1;
      let makeAbsolute = false;
      if (this.position == `fixed` && this.manager.tooltipViews.length) {
        let { dom } = this.manager.tooltipViews[0];
        if (L.safari) {
          let t = dom.getBoundingClientRect();
          makeAbsolute = Math.abs(t.top + 10000) > 1 || Math.abs(t.left) > 1;
        } else {
          makeAbsolute =
            !!dom.offsetParent &&
            dom.offsetParent != this.container.ownerDocument.body;
        }
      }
      if (makeAbsolute || this.position == `absolute`) {
        if (this.parent) {
          let n = this.parent.getBoundingClientRect();
          if (n.width && n.height) {
            e = n.width / this.parent.offsetWidth;
            t = n.height / this.parent.offsetHeight;
          }
        } else {
          ({ scaleX: e, scaleY: t } = this.view.viewState);
        }
      }
      let r = this.view.scrollDOM.getBoundingClientRect();
      let i = Ir(this.view);
      return {
        visible: {
          left: r.left + i.left,
          top: r.top + i.top,
          right: r.right - i.right,
          bottom: r.bottom - i.bottom,
        },
        parent: this.parent
          ? this.container.getBoundingClientRect()
          : this.view.dom.getBoundingClientRect(),
        pos: this.manager.tooltips.map((e, t) => {
          let n = this.manager.tooltipViews[t];
          if (n.getCoords) {
            return n.getCoords(e.pos);
          }
          return this.view.coordsAtPos(e.pos);
        }),
        size: this.manager.tooltipViews.map(({ dom }) =>
          dom.getBoundingClientRect(),
        ),
        space: this.view.state.facet(Ys).tooltipSpace(this.view),
        scaleX: e,
        scaleY: t,
        makeAbsolute,
      };
    }
    writeMeasure(e) {
      if (e.makeAbsolute) {
        this.madeAbsolute = true;
        this.position = `absolute`;
        for (let e of this.manager.tooltipViews) {
          e.dom.style.position = `absolute`;
        }
      }
      let { visible, space, scaleX, scaleY } = e;
      let a = [];
      for (let o = 0; o < this.manager.tooltips.length; o++) {
        let tooltip_1 = this.manager.tooltips[o];
        let c = this.manager.tooltipViews[o];
        let { dom } = c;
        let u = e.pos[o];
        let d = e.size[o];
        if (
          !u ||
          (tooltip_1.clip !== false &&
            (u.bottom <= Math.max(visible.top, space.top) ||
              u.top >= Math.min(visible.bottom, space.bottom) ||
              u.right < Math.max(visible.left, space.left) - 0.1 ||
              u.left > Math.min(visible.right, space.right) + 0.1))
        ) {
          dom.style.top = Ks;
          continue;
        }
        let f = tooltip_1.arrow
          ? c.dom.querySelector(`.cm-tooltip-arrow`)
          : null;
        let p = f ? 7 : 0;
        let m = d.right - d.left;
        let h = Xs.get(c) ?? d.bottom - d.top;
        let g = c.offset || ec;
        let _ = this.view.textDirection == B.LTR;
        let v =
          d.width > space.right - space.left
            ? _
              ? space.left
              : space.right - d.width
            : _
              ? Math.max(
                  space.left,
                  Math.min(u.left - (f ? 14 : 0) + g.x, space.right - m),
                )
              : Math.min(
                  Math.max(space.left, u.left - m + (f ? 14 : 0) - g.x),
                  space.right - m,
                );
        let y = this.above[o];
        if (
          !tooltip_1.strictSide &&
          (y
            ? u.top - h - p - g.y < space.top
            : u.bottom + h + p + g.y > space.bottom) &&
          y == space.bottom - u.bottom > u.top - space.top
        ) {
          y = this.above[o] = !y;
        }
        let b = (y ? u.top - space.top : space.bottom - u.bottom) - p;
        if (b < h && c.resize !== false) {
          if (b < this.view.defaultLineHeight) {
            dom.style.top = Ks;
            continue;
          }
          Xs.set(c, h);
          dom.style.height = (h = b) / scaleY + `px`;
        } else {
          if (dom.style.height) {
            dom.style.height = ``;
          }
        }
        let x = y ? u.top - h - p - g.y : u.bottom + p + g.y;
        let S = v + m;
        if (c.overlap !== true) {
          for (let e of a) {
            if (e.left < S && e.right > v && e.top < x + h && e.bottom > x) {
              x = y ? e.top - h - 2 - p : e.bottom + p + 2;
            }
          }
        }
        if (this.position == `absolute`) {
          dom.style.top = (x - e.parent.top) / scaleY + `px`;
          Qs(dom, (v - e.parent.left) / scaleX);
        } else {
          dom.style.top = x / scaleY + `px`;
          Qs(dom, v / scaleX);
        }
        if (f) {
          let e = u.left + (_ ? g.x : -g.x) - (v + 14 - 7);
          f.style.left = e / scaleX + `px`;
        }
        if (c.overlap !== true) {
          a.push({
            left: v,
            top: x,
            right: S,
            bottom: x + h,
          });
        }
        dom.classList.toggle(`cm-tooltip-above`, y);
        dom.classList.toggle(`cm-tooltip-below`, !y);
        if (c.positioned) {
          c.positioned(e.space);
        }
      }
    }
    maybeMeasure() {
      if (
        this.manager.tooltips.length &&
        (this.view.inView && this.view.requestMeasure(this.measureReq),
        this.inView != this.view.inView &&
          ((this.inView = this.view.inView), !this.inView))
      ) {
        for (let e of this.manager.tooltipViews) {
          e.dom.style.top = Ks;
        }
      }
    }
  },
  {
    eventObservers: {
      scroll() {
        this.maybeMeasure();
      },
    },
  },
);
function Qs(dom, t) {
  let n = parseInt(dom.style.left, 10);
  if (isNaN(n) || Math.abs(t - n) > 1) {
    dom.style.left = t + `px`;
  }
}
const $s = G.baseTheme({
  ".cm-tooltip": {
    zIndex: 500,
    boxSizing: `border-box`,
  },
  "&light .cm-tooltip": {
    border: `1px solid #bbb`,
    backgroundColor: `#f5f5f5`,
  },
  "&light .cm-tooltip-section:not(:first-child)": {
    borderTop: `1px solid #bbb`,
  },
  "&dark .cm-tooltip": {
    backgroundColor: `#333338`,
    color: `white`,
  },
  ".cm-tooltip-arrow": {
    height: `7px`,
    width: `14px`,
    position: `absolute`,
    zIndex: -1,
    overflow: `hidden`,
    "&:before, &:after": {
      content: `''`,
      position: `absolute`,
      width: 0,
      height: 0,
      borderLeft: `7px solid transparent`,
      borderRight: `7px solid transparent`,
    },
    ".cm-tooltip-above &": {
      bottom: `-7px`,
      "&:before": {
        borderTop: `7px solid #bbb`,
      },
      "&:after": {
        borderTop: `7px solid #f5f5f5`,
        bottom: `1px`,
      },
    },
    ".cm-tooltip-below &": {
      top: `-7px`,
      "&:before": {
        borderBottom: `7px solid #bbb`,
      },
      "&:after": {
        borderBottom: `7px solid #f5f5f5`,
        top: `1px`,
      },
    },
  },
  "&dark .cm-tooltip .cm-tooltip-arrow": {
    "&:before": {
      borderTopColor: `#333338`,
      borderBottomColor: `#333338`,
    },
    "&:after": {
      borderTopColor: `transparent`,
      borderBottomColor: `transparent`,
    },
  },
});
var ec = {
  x: 0,
  y: 0,
};
var tc = A.define({
  enables: [Zs, $s],
});
const nc = A.define({
  combine: (e) => e.reduce((acc, item) => acc.concat(item), []),
});
const rc = class e {
  static create(t) {
    return new e(t);
  }
  constructor(e) {
    this.view = e;
    this.mounted = false;
    this.dom = document.createElement(`div`);
    this.dom.classList.add(`cm-tooltip-hover`);
    this.manager = new qs(
      e,
      nc,
      (e, t) => this.createHostedView(e, t),
      (e) => e.dom.remove(),
    );
  }
  createHostedView(e, t) {
    let n = e.create(this.view);
    n.dom.classList.add(`cm-tooltip-section`);
    this.dom.insertBefore(n.dom, t ? t.dom.nextSibling : this.dom.firstChild);
    if (this.mounted && n.mount) {
      n.mount(this.view);
    }
    return n;
  }
  mount(e) {
    for (let t of this.manager.tooltipViews) {
      if (t.mount) {
        t.mount(e);
      }
    }
    this.mounted = true;
  }
  positioned(e) {
    for (let t of this.manager.tooltipViews) {
      if (t.positioned) {
        t.positioned(e);
      }
    }
  }
  update(e) {
    this.manager.update(e);
  }
  destroy() {
    let e;
    for (let t of this.manager.tooltipViews) {
      if (!((e = t.destroy) == null)) {
        e.call(t);
      }
    }
  }
  passProp(e) {
    let t;
    for (let n of this.manager.tooltipViews) {
      let r = n[e];
      if (r !== undefined) {
        if (t === undefined) {
          t = r;
        } else if (t !== r) {
          return;
        }
      }
    }
    return t;
  }
  get offset() {
    return this.passProp(`offset`);
  }
  get getCoords() {
    return this.passProp(`getCoords`);
  }
  get overlap() {
    return this.passProp(`overlap`);
  }
  get resize() {
    return this.passProp(`resize`);
  }
};
const ic = tc.compute([nc], (e) => {
  let t = e.facet(nc);
  if (t.length === 0) {
    return null;
  }
  return {
    pos: Math.min(...t.map((e) => e.pos)),
    end: Math.max(...t.map((e) => e.end ?? e.pos)),
    create: rc.create,
    above: t[0].above,
    arrow: t.some((e) => e.arrow),
  };
});
const ac = A.define();
class oc {
  constructor(e, t, n, r, i, a) {
    this.view = e;
    this.source = t;
    this.field = n;
    this.locked = r;
    this.setHover = i;
    this.hoverTime = a;
    this.hoverTimeout = -1;
    this.restartTimeout = -1;
    this.pending = null;
    this.lastMove = {
      x: 0,
      y: 0,
      target: e.dom,
      time: 0,
    };
    this.checkHover = this.checkHover.bind(this);
    e.dom.addEventListener(
      `mouseleave`,
      (this.mouseleave = this.mouseleave.bind(this)),
    );
    e.dom.addEventListener(
      `mousemove`,
      (this.mousemove = this.mousemove.bind(this)),
    );
  }
  update(e) {
    if (this.pending) {
      this.pending = null;
      clearTimeout(this.restartTimeout);
      this.restartTimeout = setTimeout(() => this.startHover(), 20);
    }
  }
  get active() {
    return this.view.state.field(this.field);
  }
  checkHover() {
    this.hoverTimeout = -1;
    if (this.active.length) {
      return;
    }
    let e = Date.now() - this.lastMove.time;
    if (e < this.hoverTime) {
      this.hoverTimeout = setTimeout(this.checkHover, this.hoverTime - e);
    } else {
      this.startHover();
    }
  }
  startHover() {
    clearTimeout(this.restartTimeout);
    let { view, lastMove } = this;
    let n = view.docView.tile.nearest(lastMove.target);
    if (!n) {
      return;
    }
    let r;
    let i = 1;
    if (n.isWidget()) {
      r = n.posAtStart;
    } else {
      r = view.posAtCoords(lastMove);
      if (r == null) {
        return;
      }
      let n = view.coordsAtPos(r);
      if (
        !n ||
        lastMove.y < n.top ||
        lastMove.y > n.bottom ||
        lastMove.x < n.left - view.defaultCharacterWidth ||
        lastMove.x > n.right + view.defaultCharacterWidth
      ) {
        return;
      }
      let a = view
        .bidiSpans(view.state.doc.lineAt(r))
        .find((e) => e.from <= r && e.to >= r);
      let o = a && a.dir == B.RTL ? -1 : 1;
      i = lastMove.x < n.left ? -o : o;
    }
    this.activateHover(view, r, i);
  }
  activateHover(e, t, n, r) {
    let i = this.source(e, t, n);
    let a = (t) => {
      if (t && (!Array.isArray(t) || t.length)) {
        let n = Array.isArray(t) ? t : [t];
        if (r) {
          this.locked.set(n, r);
        }
        e.dispatch({
          effects: this.setHover.of(n),
        });
      }
    };
    if (i && `then` in i) {
      let n = (this.pending = {
        pos: t,
      });
      i.then(
        (e) => {
          if (this.pending == n) {
            this.pending = null;
            a(e);
          }
        },
        (t) => Sr(e.state, t, `hover tooltip`),
      );
    } else {
      a(i);
    }
  }
  get tooltip() {
    let e = this.view.plugin(Zs);
    let t = e ? e.manager.tooltips.findIndex((e) => e.create == rc.create) : -1;
    if (t > -1) {
      return e.manager.tooltipViews[t];
    }
    return null;
  }
  mousemove(e) {
    this.lastMove = {
      x: e.clientX,
      y: e.clientY,
      target: e.target,
      time: Date.now(),
    };
    if (this.hoverTimeout < 0) {
      this.hoverTimeout = setTimeout(this.checkHover, this.hoverTime);
    }
    let { active, tooltip } = this;
    if (
      (active.length &&
        !this.locked.has(active) &&
        tooltip &&
        !cc(tooltip.dom, e)) ||
      this.pending
    ) {
      let { pos } = active[0] || this.pending;
      let r = active[0]?.end ?? pos;
      if (
        pos == r
          ? this.view.posAtCoords(this.lastMove) != pos
          : !lc(this.view, pos, r, e.clientX, e.clientY)
      ) {
        this.view.dispatch({
          effects: this.setHover.of([]),
        });
        this.pending = null;
      }
    }
  }
  mouseleave(e) {
    clearTimeout(this.hoverTimeout);
    this.hoverTimeout = -1;
    let { active } = this;
    if (active.length && !this.locked.has(active)) {
      let { tooltip } = this;
      if (tooltip && tooltip.dom.contains(e.relatedTarget)) {
        this.watchTooltipLeave(tooltip.dom);
      } else {
        this.view.dispatch({
          effects: this.setHover.of([]),
        });
      }
    }
  }
  watchTooltipLeave(e) {
    let t = (n) => {
      e.removeEventListener(`mouseleave`, t);
      let { active } = this;
      if (
        active.length &&
        !this.locked.has(active) &&
        !this.view.dom.contains(n.relatedTarget)
      ) {
        this.view.dispatch({
          effects: this.setHover.of([]),
        });
      }
    };
    e.addEventListener(`mouseleave`, t);
  }
  destroy() {
    clearTimeout(this.hoverTimeout);
    clearTimeout(this.restartTimeout);
    this.view.dom.removeEventListener(`mouseleave`, this.mouseleave);
    this.view.dom.removeEventListener(`mousemove`, this.mousemove);
  }
}
var sc = 4;
function cc(dom, t) {
  let { left, right, top, bottom } = dom.getBoundingClientRect();
  let o;
  if ((o = dom.querySelector(`.cm-tooltip-arrow`))) {
    let e = o.getBoundingClientRect();
    top = Math.min(e.top, top);
    bottom = Math.max(e.bottom, bottom);
  }
  return (
    t.clientX >= left - sc &&
    t.clientX <= right + sc &&
    t.clientY >= top - sc &&
    t.clientY <= bottom + sc
  );
}
function lc(view, pos, n, clientX, clientY, a) {
  let o = view.scrollDOM.getBoundingClientRect();
  let s = view.documentTop + view.documentPadding.top + view.contentHeight;
  if (
    o.left > clientX ||
    o.right < clientX ||
    o.top > clientY ||
    Math.min(o.bottom, s) < clientY
  ) {
    return false;
  }
  let c = view.posAtCoords(
    {
      x: clientX,
      y: clientY,
    },
    false,
  );
  return c >= pos && c <= n;
}
function uc(e, t = {}) {
  let n = j.define();
  let r = new WeakMap();
  let active = Te.define({
    create() {
      return [];
    },
    update(e, a) {
      let o = r.get(e);
      e.length &&
        ((t.hideOnChange && (a.docChanged || a.selection)) || (o && o(a))
          ? (e = [])
          : t.hideOn && (e = e.filter((e) => !t.hideOn(a, e))));
      if (a.docChanged && e.length) {
        let t = [];
        for (let n of e) {
          let e = a.changes.mapPos(n.pos, -1, T.TrackDel);
          if (e != null) {
            let r = Object.assign(Object.create(null), n);
            r.pos = e;
            if (r.end != null) {
              r.end = a.changes.mapPos(r.end);
            }
            t.push(r);
          }
        }
        e = t;
      }
      for (let t of a.effects) {
        if (t.is(n)) {
          e = t.value;
          o = undefined;
        }
        if ((t.is(pc) && !t.value) || t.value == active) {
          e = [];
        }
      }
      if (e.length && o) {
        r.set(e, o);
      }
      return e;
    },
    provide: (e) => nc.from(e),
  });
  let a = H.define((a) => new oc(a, e, active, r, n, t.hoverTime || 300));
  return {
    active,
    extension: [active, a, ac.of(a), ic],
  };
}
function dc(e, from, n, r = {}) {
  let i = e.state
    .facet(ac)
    .map((t) => e.plugin(t))
    .filter((e) => !!e);
  if (r.tooltip && r.tooltip.active) {
    let e = i.find((e) => e.field == r.tooltip.active);
    if (e) {
      i = [e];
    }
  }
  for (let a of i) {
    a.activateHover(e, from, n, r.until ?? (() => false));
  }
}
function fc(e, tooltip) {
  let n = e.plugin(Zs);
  if (!n) {
    return null;
  }
  let r = n.manager.tooltips.indexOf(tooltip);
  if (r < 0) {
    return null;
  }
  return n.manager.tooltipViews[r];
}
var pc = j.define();
const mc = A.define({
  combine(e) {
    let topContainer;
    let bottomContainer;
    for (let r of e) {
      topContainer ||= r.topContainer;
      bottomContainer ||= r.bottomContainer;
    }
    return {
      topContainer,
      bottomContainer,
    };
  },
});
function hc(e, t) {
  let n = e.plugin(enables_1);
  let r = n ? n.specs.indexOf(t) : -1;
  if (r > -1) {
    return n.panels[r];
  }
  return null;
}
var enables_1 = H.fromClass(
  class {
    constructor(e) {
      this.input = e.state.facet(yc);
      this.specs = this.input.filter((e) => e);
      this.panels = this.specs.map((t) => t(e));
      let t = e.state.facet(mc);
      this.top = new _c(e, true, t.topContainer);
      this.bottom = new _c(e, false, t.bottomContainer);
      this.top.sync(this.panels.filter((e) => e.top));
      this.bottom.sync(this.panels.filter((e) => !e.top));
      for (let e of this.panels) {
        e.dom.classList.add(`cm-panel`);
        if (e.mount) {
          e.mount();
        }
      }
    }
    update(e) {
      let t = e.state.facet(mc);
      if (this.top.container != t.topContainer) {
        this.top.sync([]);
        this.top = new _c(e.view, true, t.topContainer);
      }
      if (this.bottom.container != t.bottomContainer) {
        this.bottom.sync([]);
        this.bottom = new _c(e.view, false, t.bottomContainer);
      }
      this.top.syncClasses();
      this.bottom.syncClasses();
      let n = e.state.facet(yc);
      if (n != this.input) {
        let t = n.filter((e) => e);
        let r = [];
        let i = [];
        let a = [];
        let o = [];
        for (let n of t) {
          let t = this.specs.indexOf(n);
          let s;
          if (t < 0) {
            s = n(e.view);
            o.push(s);
          } else {
            s = this.panels[t];
            if (s.update) {
              s.update(e);
            }
          }
          r.push(s);
          (s.top ? i : a).push(s);
        }
        this.specs = t;
        this.panels = r;
        this.top.sync(i);
        this.bottom.sync(a);
        for (let e of o) {
          e.dom.classList.add(`cm-panel`);
          if (e.mount) {
            e.mount();
          }
        }
      } else {
        for (let t of this.panels) {
          if (t.update) {
            t.update(e);
          }
        }
      }
    }
    destroy() {
      this.top.sync([]);
      this.bottom.sync([]);
    }
  },
  {
    provide: (e) =>
      G.scrollMargins.of((t) => {
        let n = t.plugin(e);
        return (
          n && {
            top: n.top.scrollMargin(),
            bottom: n.bottom.scrollMargin(),
          }
        );
      }),
  },
);
var _c = class {
  constructor(e, t, n) {
    this.view = e;
    this.top = t;
    this.container = n;
    this.dom = undefined;
    this.classes = ``;
    this.panels = [];
    this.syncClasses();
  }
  sync(e) {
    for (let t of this.panels) {
      if (t.destroy && e.indexOf(t) < 0) {
        t.destroy();
      }
    }
    this.panels = e;
    this.syncDOM();
  }
  syncDOM() {
    if (this.panels.length == 0) {
      this.dom &&= (this.dom.remove(), undefined);
      return;
    }
    if (!this.dom) {
      this.dom = document.createElement(`div`);
      this.dom.className = this.top
        ? `cm-panels cm-panels-top`
        : `cm-panels cm-panels-bottom`;
      let e = this.container || this.view.dom;
      e.insertBefore(this.dom, this.top ? e.firstChild : null);
    }
    let firstChild = this.dom.firstChild;
    for (let t of this.panels) {
      if (t.dom.parentNode == this.dom) {
        while (firstChild != t.dom) {
          firstChild = vc(firstChild);
        }
        firstChild = firstChild.nextSibling;
      } else {
        this.dom.insertBefore(t.dom, firstChild);
      }
    }
    while (firstChild) {
      firstChild = vc(firstChild);
    }
  }
  scrollMargin() {
    if (!this.dom || this.container) {
      return 0;
    }
    return Math.max(
      0,
      this.top
        ? this.dom.getBoundingClientRect().bottom -
            Math.max(0, this.view.scrollDOM.getBoundingClientRect().top)
        : Math.min(
            innerHeight,
            this.view.scrollDOM.getBoundingClientRect().bottom,
          ) - this.dom.getBoundingClientRect().top,
    );
  }
  syncClasses() {
    if (this.container && this.classes != this.view.themeClasses) {
      for (let e of this.classes.split(` `)) {
        if (e) {
          this.container.classList.remove(e);
        }
      }
      for (let e of (this.classes = this.view.themeClasses).split(` `)) {
        if (e) {
          this.container.classList.add(e);
        }
      }
    }
  }
};
function vc(firstChild) {
  let e_nextSibling = firstChild.nextSibling;
  firstChild.remove();
  return e_nextSibling;
}
var yc = A.define({
  enables: enables_1,
});
function bc(e, t) {
  let n;
  let r = new Promise((resolve) => (n = resolve));
  let i = (e) => Tc(e, t, n);
  if (e.state.field(Sc, false)) {
    e.dispatch({
      effects: Cc.of(i),
    });
  } else {
    e.dispatch({
      effects: j.appendConfig.of(Sc.init(() => [i])),
    });
  }
  let a = wc.of(i);
  return {
    close: a,
    result: r.then((t) => {
      (e.win.queueMicrotask || ((t) => e.win.setTimeout(t, 10)))(() => {
        if (e.state.field(Sc).indexOf(i) > -1) {
          e.dispatch({
            effects: a,
          });
        }
      });
      return t;
    }),
  };
}
function xc(e, t) {
  let n = e.state.field(Sc, false) || [];
  for (let r of n) {
    let n = hc(e, r);
    if (n && n.dom.classList.contains(t)) {
      return n;
    }
  }
  return null;
}
var Sc = Te.define({
  create() {
    return [];
  },
  update(e, t) {
    for (let n of t.effects) {
      if (n.is(Cc)) {
        e = [n.value].concat(e);
      } else if (n.is(wc)) {
        e = e.filter((e) => e != n.value);
      }
    }
    return e;
  },
  provide: (e) => yc.computeN([e], (t) => t.field(e)),
});
var Cc = j.define();
var wc = j.define();
function Tc(e, t, n) {
  let r = t.content ? t.content(e, () => o(null)) : null;
  if (!r) {
    r = I(`form`);
    if (t.input) {
      let e = I(`input`, t.input);
      if (/^(text|password|number|email|tel|url)$/.test(e.type)) {
        e.classList.add(`cm-textfield`);
      }
      e.name ||= `input`;
      r.appendChild(I(`label`, (t.label || ``) + `: `, e));
    } else {
      r.appendChild(document.createTextNode(t.label || ``));
    }
    r.appendChild(document.createTextNode(` `));
    r.appendChild(
      I(
        `button`,
        {
          class: `cm-button`,
          type: `submit`,
        },
        t.submitLabel || `OK`,
      ),
    );
  }
  let i = r.nodeName == `FORM` ? [r] : r.querySelectorAll(`form`);
  for (const t of i) {
    t.addEventListener(`keydown`, (e) => {
      if (e.keyCode == 27) {
        e.preventDefault();
        o(null);
      } else if (e.keyCode == 13) {
        e.preventDefault();
        o(t);
      }
    });
    t.addEventListener(`submit`, (e) => {
      e.preventDefault();
      o(t);
    });
  }
  let dom = I(
    `div`,
    r,
    I(
      `button`,
      {
        onclick: () => o(null),
        "aria-label": e.state.phrase(`close`),
        class: `cm-dialog-close`,
        type: `button`,
      },
      [`×`],
    ),
  );
  if (t.class) {
    dom.className = t.class;
  }
  dom.classList.add(`cm-dialog`);
  function o(t) {
    if (dom.contains(dom.ownerDocument.activeElement)) {
      e.focus();
    }
    n(t);
  }
  return {
    dom,
    top: t.top,
    mount: () => {
      if (t.focus) {
        let e;
        e =
          typeof t.focus == `string`
            ? r.querySelector(t.focus)
            : r.querySelector(`input`) || r.querySelector(`button`);
        if (e && `select` in e) {
          e.select();
        } else if (e && `focus` in e) {
          e.focus();
        }
      }
    },
  };
}
class Ec extends ot {
  compare(e) {
    return this == e || (this.constructor == e.constructor && this.eq(e));
  }
  eq(e) {
    return false;
  }
  destroy(e) {}
}
Ec.prototype.elementClass = ``;
Ec.prototype.toDOM = undefined;
Ec.prototype.mapMode = T.TrackBefore;
Ec.prototype.startSide = Ec.prototype.endSide = -1;
Ec.prototype.point = true;
const Dc = A.define();
const Oc = A.define();
const kc = {
  class: ``,
  renderEmptyElements: false,
  elementStyle: ``,
  markers: () => P.empty,
  lineMarker: () => null,
  widgetMarker: () => null,
  lineMarkerChange: null,
  initialSpacer: null,
  updateSpacer: null,
  domEventHandlers: {},
  side: `before`,
};
const Ac = A.define();
function jc(e) {
  return [
    Nc(),
    Ac.of({
      ...kc,
      ...e,
    }),
  ];
}
const Mc = A.define({
  combine: (e) => e.some((e) => e),
});
function Nc(e) {
  let t = [Pc];
  if (e && e.fixed === false) {
    t.push(Mc.of(true));
  }
  return t;
}
var Pc = H.fromClass(
  class {
    constructor(e) {
      this.view = e;
      this.domAfter = null;
      this.prevViewport = e.viewport;
      this.dom = document.createElement(`div`);
      this.dom.className = `cm-gutters cm-gutters-before`;
      this.dom.setAttribute(`aria-hidden`, `true`);
      this.dom.style.minHeight =
        this.view.contentHeight / this.view.scaleY + `px`;
      this.gutters = e.state.facet(Ac).map((t) => new Rc(e, t));
      this.fixed = !e.state.facet(Mc);
      for (let e of this.gutters) {
        if (e.config.side == `after`) {
          this.getDOMAfter().appendChild(e.dom);
        } else {
          this.dom.appendChild(e.dom);
        }
      }
      if (this.fixed) {
        this.dom.style.position = `sticky`;
      }
      this.syncGutters(false);
      e.scrollDOM.insertBefore(this.dom, e.contentDOM);
    }
    getDOMAfter() {
      if (!this.domAfter) {
        this.domAfter = document.createElement(`div`);
        this.domAfter.className = `cm-gutters cm-gutters-after`;
        this.domAfter.setAttribute(`aria-hidden`, `true`);
        this.domAfter.style.minHeight =
          this.view.contentHeight / this.view.scaleY + `px`;
        this.domAfter.style.position = this.fixed ? `sticky` : ``;
        this.view.scrollDOM.appendChild(this.domAfter);
      }
      return this.domAfter;
    }
    update(e) {
      if (this.updateGutters(e)) {
        let t = this.prevViewport;
        let n = e.view.viewport;
        let r = Math.min(t.to, n.to) - Math.max(t.from, n.from);
        this.syncGutters(r < (n.to - n.from) * 0.8);
      }
      if (e.geometryChanged) {
        let e = this.view.contentHeight / this.view.scaleY + `px`;
        this.dom.style.minHeight = e;
        if (this.domAfter) {
          this.domAfter.style.minHeight = e;
        }
      }
      if (this.view.state.facet(Mc) != !this.fixed) {
        this.fixed = !this.fixed;
        this.dom.style.position = this.fixed ? `sticky` : ``;
        if (this.domAfter) {
          this.domAfter.style.position = this.fixed ? `sticky` : ``;
        }
      }
      this.prevViewport = e.view.viewport;
    }
    syncGutters(e) {
      let nextSibling = this.dom.nextSibling;
      if (e) {
        this.dom.remove();
        if (this.domAfter) {
          this.domAfter.remove();
        }
      }
      let n = P.iter(this.view.state.facet(Dc), this.view.viewport.from);
      let r = [];
      let i = this.gutters.map(
        (e) => new Lc(e, this.view.viewport, -this.view.documentPadding.top),
      );
      for (let e of this.view.viewportLineBlocks) {
        if (r.length) {
          r = [];
        }
        if (Array.isArray(e.type)) {
          let t = true;
          for (let a of e.type) {
            if (a.type == R.Text && t) {
              Ic(n, r, a.from);
              for (let e of i) {
                e.line(this.view, a, r);
              }
              t = false;
            } else if (a.widget) {
              for (let e of i) {
                e.widget(this.view, a);
              }
            }
          }
        } else if (e.type == R.Text) {
          Ic(n, r, e.from);
          for (let t of i) {
            t.line(this.view, e, r);
          }
        } else if (e.widget) {
          for (let t of i) {
            t.widget(this.view, e);
          }
        }
      }
      for (let e of i) {
        e.finish();
      }
      if (e) {
        this.view.scrollDOM.insertBefore(this.dom, nextSibling);
        if (this.domAfter) {
          this.view.scrollDOM.appendChild(this.domAfter);
        }
      }
    }
    updateGutters(e) {
      let t = e.startState.facet(Ac);
      let n = e.state.facet(Ac);
      let r =
        e.docChanged ||
        e.heightChanged ||
        e.viewportChanged ||
        !P.eq(
          e.startState.facet(Dc),
          e.state.facet(Dc),
          e.view.viewport.from,
          e.view.viewport.to,
        );
      if (t == n) {
        for (let t of this.gutters) {
          if (t.update(e)) {
            r = true;
          }
        }
      } else {
        r = true;
        let i = [];
        for (let r of n) {
          let n = t.indexOf(r);
          if (n < 0) {
            i.push(new Rc(this.view, r));
          } else {
            this.gutters[n].update(e);
            i.push(this.gutters[n]);
          }
        }
        for (let e of this.gutters) {
          e.dom.remove();
          if (i.indexOf(e) < 0) {
            e.destroy();
          }
        }
        for (let e of i) {
          if (e.config.side == `after`) {
            this.getDOMAfter().appendChild(e.dom);
          } else {
            this.dom.appendChild(e.dom);
          }
        }
        this.gutters = i;
      }
      return r;
    }
    destroy() {
      for (let e of this.gutters) {
        e.destroy();
      }
      this.dom.remove();
      if (this.domAfter) {
        this.domAfter.remove();
      }
    }
  },
  {
    provide: (e) =>
      G.scrollMargins.of((t) => {
        let n = t.plugin(e);
        if (!n || n.gutters.length == 0 || !n.fixed) {
          return null;
        }
        let r = n.dom.offsetWidth * t.scaleX;
        let i = n.domAfter ? n.domAfter.offsetWidth * t.scaleX : 0;
        if (t.textDirection == B.LTR) {
          return {
            left: r,
            right: i,
          };
        }
        return {
          right: r,
          left: i,
        };
      }),
  },
);
function Fc(e) {
  if (Array.isArray(e)) {
    return e;
  }
  return [e];
}
function Ic(e, t, from) {
  while (e.value && e.from <= from) {
    if (e.from == from) {
      t.push(e.value);
    }
    e.next();
  }
}
var Lc = class {
  constructor(e, t, n) {
    this.gutter = e;
    this.height = n;
    this.i = 0;
    this.cursor = P.iter(e.markers, t.from);
  }
  addElement(e, t, n) {
    let { gutter } = this;
    let i = (t.top - this.height) / e.scaleY;
    let a = t.height / e.scaleY;
    if (this.i == gutter.elements.length) {
      let t = new zc(e, a, i, n);
      gutter.elements.push(t);
      gutter.dom.appendChild(t.dom);
    } else {
      gutter.elements[this.i].update(e, a, i, n);
    }
    this.height = t.bottom;
    this.i++;
  }
  line(e, t, n) {
    let r = [];
    Ic(this.cursor, r, t.from);
    if (n.length) {
      r = r.concat(n);
    }
    let i = this.gutter.config.lineMarker(e, t, r);
    if (i) {
      r.unshift(i);
    }
    let gutter = this.gutter;
    if (r.length != 0 || gutter.config.renderEmptyElements) {
      this.addElement(e, t, r);
    }
  }
  widget(e, t) {
    let n = this.gutter.config.widgetMarker(e, t.widget, t);
    let r = n ? [n] : null;
    for (let n of e.state.facet(Oc)) {
      let i = n(e, t.widget, t);
      if (i) {
        (r ||= []).push(i);
      }
    }
    if (r) {
      this.addElement(e, t, r);
    }
  }
  finish() {
    let gutter = this.gutter;
    while (gutter.elements.length > this.i) {
      let t = gutter.elements.pop();
      gutter.dom.removeChild(t.dom);
      t.destroy();
    }
  }
};
var Rc = class {
  constructor(e, t) {
    this.view = e;
    this.config = t;
    this.elements = [];
    this.spacer = null;
    this.dom = document.createElement(`div`);
    this.dom.className =
      `cm-gutter` + (this.config.class ? ` ` + this.config.class : ``);
    for (let n in t.domEventHandlers) {
      this.dom.addEventListener(n, (r) => {
        let r_target = r.target;
        let a;
        if (r_target != this.dom && this.dom.contains(r_target)) {
          while (r_target.parentNode != this.dom) {
            r_target = r_target.parentNode;
          }
          let e = r_target.getBoundingClientRect();
          a = (e.top + e.bottom) / 2;
        } else {
          a = r.clientY;
        }
        let o = e.lineBlockAtHeight(a - e.documentTop);
        if (t.domEventHandlers[n](e, o, r)) {
          r.preventDefault();
        }
      });
    }
    this.markers = Fc(t.markers(e));
    if (t.initialSpacer) {
      this.spacer = new zc(e, 0, 0, [t.initialSpacer(e)]);
      this.dom.appendChild(this.spacer.dom);
      this.spacer.dom.style.cssText += `visibility: hidden; pointer-events: none`;
    }
  }
  update(e) {
    let markers = this.markers;
    this.markers = Fc(this.config.markers(e.view));
    if (this.spacer && this.config.updateSpacer) {
      let t = this.config.updateSpacer(this.spacer.markers[0], e);
      if (t != this.spacer.markers[0]) {
        this.spacer.update(e.view, 0, 0, [t]);
      }
    }
    let viewport = e.view.viewport;
    return (
      !P.eq(this.markers, markers, viewport.from, viewport.to) ||
      (this.config.lineMarkerChange ? this.config.lineMarkerChange(e) : false)
    );
  }
  destroy() {
    for (let e of this.elements) {
      e.destroy();
    }
  }
};
var zc = class {
  constructor(e, t, n, r) {
    this.height = -1;
    this.above = 0;
    this.markers = [];
    this.dom = document.createElement(`div`);
    this.dom.className = `cm-gutterElement`;
    this.update(e, t, n, r);
  }
  update(e, t, n, r) {
    if (this.height != t) {
      this.height = t;
      this.dom.style.height = t + `px`;
    }
    if (this.above != n) {
      this.dom.style.marginTop = (this.above = n) ? n + `px` : ``;
    }
    if (!Bc(this.markers, r)) {
      this.setMarkers(e, r);
    }
  }
  setMarkers(e, t) {
    let n = `cm-gutterElement`;
    let firstChild = this.dom.firstChild;
    for (let i = 0, a = 0; ;) {
      let o = a;
      let s = i < t.length ? t[i++] : null;
      let c = false;
      if (s) {
        let e = s.elementClass;
        if (e) {
          n += ` ` + e;
        }
        for (let e = a; e < this.markers.length; e++) {
          if (this.markers[e].compare(s)) {
            o = e;
            c = true;
            break;
          }
        }
      } else {
        o = this.markers.length;
      }
      while (a < o) {
        let e = this.markers[a++];
        if (e.toDOM) {
          e.destroy(firstChild);
          let t = firstChild.nextSibling;
          firstChild.remove();
          firstChild = t;
        }
      }
      if (!s) {
        break;
      }
      s.toDOM &&
        (c
          ? (firstChild = firstChild.nextSibling)
          : this.dom.insertBefore(s.toDOM(e), firstChild));
      c && a++;
    }
    this.dom.className = n;
    this.markers = t;
  }
  destroy() {
    this.setMarkers(null, []);
  }
};
function Bc(markers, t) {
  if (markers.length != t.length) {
    return false;
  }
  for (let n = 0; n < markers.length; n++) {
    if (!markers[n].compare(t[n])) {
      return false;
    }
  }
  return true;
}
const Vc = A.define();
const Hc = A.define();
const Uc = A.define({
  combine(e) {
    return at(
      e,
      {
        formatNumber: String,
        domEventHandlers: {},
      },
      {
        domEventHandlers(e, t) {
          let n = {
            ...e,
          };
          for (let e in t) {
            let r = n[e];
            let i = t[e];
            n[e] = r ? (e, t, n) => r(e, t, n) || i(e, t, n) : i;
          }
          return n;
        },
      },
    );
  },
});
class Wc extends Ec {
  constructor(e) {
    super();
    this.number = e;
  }
  eq(e) {
    return this.number == e.number;
  }
  toDOM() {
    return document.createTextNode(this.number);
  }
}
function Gc(e, t) {
  return e.state.facet(Uc).formatNumber(t, e.state);
}
const Kc = Ac.compute([Uc], (e) => ({
  class: `cm-lineNumbers`,
  renderEmptyElements: false,
  markers(e) {
    return e.state.facet(Vc);
  },
  lineMarker(e, t, n) {
    if (n.some((e) => e.toDOM)) {
      return null;
    }
    return new Wc(Gc(e, e.state.doc.lineAt(t.from).number));
  },
  widgetMarker: (e, t, n) => {
    for (let r of e.state.facet(Hc)) {
      let i = r(e, t, n);
      if (i) {
        return i;
      }
    }
    return null;
  },
  lineMarkerChange: (e) => e.startState.facet(Uc) != e.state.facet(Uc),
  initialSpacer(e) {
    return new Wc(Gc(e, Jc(e.state.doc.lines)));
  },
  updateSpacer(e, t) {
    let n = Gc(t.view, Jc(t.view.state.doc.lines));
    if (n == e.number) {
      return e;
    }
    return new Wc(n);
  },
  domEventHandlers: e.facet(Uc).domEventHandlers,
  side: `before`,
}));
function qc(e = {}) {
  return [Uc.of(e), Nc(), Kc];
}
function Jc(lines) {
  let t = 9;
  while (t < lines) {
    t = t * 10 + 9;
  }
  return t;
}
const Yc = new (class extends Ec {
  constructor() {
    super(...arguments);
    this.elementClass = `cm-activeLineGutter`;
  }
})();
const Xc = Dc.compute([`selection`], (e) => {
  let t = [];
  let n = -1;
  for (let r of e.selection.ranges) {
    let i = e.doc.lineAt(r.head).from;
    if (i > n) {
      n = i;
      t.push(Yc.range(i));
    }
  }
  return P.of(t);
});
function Zc() {
  return Xc;
}
const Qc = 1024;
let $c = 0;
class el {
  constructor(e, t) {
    this.from = e;
    this.to = t;
  }
}
class K {
  constructor(e = {}) {
    this.id = $c++;
    this.perNode = !!e.perNode;
    this.deserialize =
      e.deserialize ||
      (() => {
        throw Error(`This node type doesn't define a deserialize function`);
      });
    this.combine = e.combine || null;
  }
  add(e) {
    if (this.perNode) {
      throw RangeError(`Can't add per-node props to node types`);
    }
    if (typeof e != `function`) {
      e = rl.match(e);
    }
    return (t) => {
      let n = e(t);
      if (n === undefined) {
        return null;
      }
      return [this, n];
    };
  }
}
K.closedBy = new K({
  deserialize: (e) => e.split(` `),
});
K.openedBy = new K({
  deserialize: (e) => e.split(` `),
});
K.group = new K({
  deserialize: (e) => e.split(` `),
});
K.isolate = new K({
  deserialize: (e) => {
    if (e && e != `rtl` && e != `ltr` && e != `auto`) {
      throw RangeError(`Invalid value for isolate: ` + e);
    }
    return e || `auto`;
  },
});
K.contextHash = new K({
  perNode: true,
});
K.lookAhead = new K({
  perNode: true,
});
K.mounted = new K({
  perNode: true,
});
class tl {
  constructor(e, t, n, r = false) {
    this.tree = e;
    this.overlay = t;
    this.parser = n;
    this.bracketed = r;
  }
  static get(e) {
    return e && e.props && e.props[K.mounted.id];
  }
}
const nl = Object.create(null);
var rl = class e {
  constructor(e, t, n, r = 0) {
    this.name = e;
    this.props = t;
    this.id = n;
    this.flags = r;
  }
  static define(t) {
    let n = t.props && t.props.length ? Object.create(null) : nl;
    let r =
      +!!t.top |
      (t.skipped ? 2 : 0) |
      (t.error ? 4 : 0) |
      (t.name == null ? 8 : 0);
    let i = new e(t.name || ``, n, t.id, r);
    if (t.props) {
      for (let e of t.props) {
        if (!Array.isArray(e)) {
          e = e(i);
        }
        if (e) {
          if (e[0].perNode) {
            throw RangeError(`Can't store a per-node prop on a node type`);
          }
          n[e[0].id] = e[1];
        }
      }
    }
    return i;
  }
  prop(e) {
    return this.props[e.id];
  }
  get isTop() {
    return (this.flags & 1) > 0;
  }
  get isSkipped() {
    return (this.flags & 2) > 0;
  }
  get isError() {
    return (this.flags & 4) > 0;
  }
  get isAnonymous() {
    return (this.flags & 8) > 0;
  }
  is(e) {
    if (typeof e == `string`) {
      if (this.name == e) {
        return true;
      }
      let t = this.prop(K.group);
      if (t) {
        return t.indexOf(e) > -1;
      }
      return false;
    }
    return this.id == e;
  }
  static match(e) {
    let t = Object.create(null);
    for (let n in e) {
      for (let r of n.split(` `)) {
        t[r] = e[n];
      }
    }
    return (e) => {
      for (let n = e.prop(K.group), r = -1; r < (n ? n.length : 0); r++) {
        let i = t[r < 0 ? e.name : n[r]];
        if (i) {
          return i;
        }
      }
    };
  }
};
rl.none = new rl(``, Object.create(null), 0, 8);
const il = class e {
  constructor(e) {
    this.types = e;
    for (let t = 0; t < e.length; t++) {
      if (e[t].id != t) {
        throw RangeError(
          `Node type ids should correspond to array positions when creating a node set`,
        );
      }
    }
  }
  extend(...t) {
    let n = [];
    for (let e of this.types) {
      let r = null;
      for (let n of t) {
        let t = n(e);
        if (t) {
          r ||= {
            ...e.props,
          };
          let n = t[1];
          let i = t[0];
          if (i.combine && i.id in r) {
            n = i.combine(r[i.id], n);
          }
          r[i.id] = n;
        }
      }
      n.push(r ? new rl(e.name, r, e.id, e.flags) : e);
    }
    return new e(n);
  }
};
const al = new WeakMap();
const ol = new WeakMap();
let q;
((e) => {
  e[(e.ExcludeBuffers = 1)] = `ExcludeBuffers`;
  e[(e.IncludeAnonymous = 2)] = `IncludeAnonymous`;
  e[(e.IgnoreMounts = 4)] = `IgnoreMounts`;
  e[(e.IgnoreOverlays = 8)] = `IgnoreOverlays`;
  e[(e.EnterBracketed = 16)] = `EnterBracketed`;
})((q ||= {}));
var J = class e {
  constructor(e, t, n, r, i) {
    this.type = e;
    this.children = t;
    this.positions = n;
    this.length = r;
    this.props = null;
    if (i && i.length) {
      this.props = Object.create(null);
      for (let [e, t] of i) {
        this.props[typeof e == `number` ? e : e.id] = t;
      }
    }
  }
  toString() {
    let e = tl.get(this);
    if (e && !e.overlay) {
      return e.tree.toString();
    }
    let t = ``;
    for (let e of this.children) {
      let n = e.toString();
      if (n) {
        if (t) {
          t += `,`;
        }
        t += n;
      }
    }
    if (this.type.name) {
      return (
        (/\W/.test(this.type.name) && !this.type.isError
          ? JSON.stringify(this.type.name)
          : this.type.name) + (t.length ? `(` + t + `)` : ``)
      );
    }
    return t;
  }
  cursor(e = 0) {
    return new bl(this.topNode, e);
  }
  cursorAt(e, t = 0, n = 0) {
    let r = new bl(al.get(this) || this.topNode);
    r.moveTo(e, t);
    al.set(this, r._tree);
    return r;
  }
  get topNode() {
    return new fl(this, 0, 0, null);
  }
  resolve(e, t = 0) {
    let n = ul(al.get(this) || this.topNode, e, t, false);
    al.set(this, n);
    return n;
  }
  resolveInner(e, t = 0) {
    let n = ul(ol.get(this) || this.topNode, e, t, true);
    ol.set(this, n);
    return n;
  }
  resolveStack(e, t = 0) {
    return yl(this, e, t);
  }
  iterate(e) {
    let { enter, leave, from = 0, to = this.length } = e;
    let a = e.mode || 0;
    let o = (a & q.IncludeAnonymous) > 0;
    for (let e = this.cursor(a | q.IncludeAnonymous); ;) {
      let a = false;
      if (
        e.from <= to &&
        e.to >= from &&
        ((!o && e.type.isAnonymous) || enter(e) !== false)
      ) {
        if (e.firstChild()) {
          continue;
        }
        a = true;
      }
      while (
        (a && leave && (o || !e.type.isAnonymous) && leave(e), !e.nextSibling())
      ) {
        if (!e.parent()) {
          return;
        }
        a = true;
      }
    }
  }
  prop(e) {
    if (e.perNode) {
      if (this.props) {
        return this.props[e.id];
      }
      return undefined;
    }
    return this.type.prop(e);
  }
  get propValues() {
    let e = [];
    if (this.props) {
      for (let t in this.props) {
        e.push([+t, this.props[t]]);
      }
    }
    return e;
  }
  balance(t = {}) {
    if (this.children.length <= 8) {
      return this;
    }
    return Tl(
      rl.none,
      this.children,
      this.positions,
      0,
      this.children.length,
      0,
      this.length,
      (t, n, r) => new e(this.type, t, n, r, this.propValues),
      t.makeTree || ((t, n, r) => new e(rl.none, t, n, r)),
    );
  }
  static build(e) {
    return Sl(e);
  }
};
J.empty = new J(rl.none, [], [], 0);
var sl = class e {
  constructor(e, t) {
    this.buffer = e;
    this.index = t;
  }
  get id() {
    return this.buffer[this.index - 4];
  }
  get start() {
    return this.buffer[this.index - 3];
  }
  get end() {
    return this.buffer[this.index - 2];
  }
  get size() {
    return this.buffer[this.index - 1];
  }
  get pos() {
    return this.index;
  }
  next() {
    this.index -= 4;
  }
  fork() {
    return new e(this.buffer, this.index);
  }
};
var cl = class e {
  constructor(e, t, n) {
    this.buffer = e;
    this.length = t;
    this.set = n;
  }
  get type() {
    return rl.none;
  }
  toString() {
    let e = [];
    for (let t = 0; t < this.buffer.length;) {
      e.push(this.childString(t));
      t = this.buffer[t + 3];
    }
    return e.join(`,`);
  }
  childString(e) {
    let t = this.buffer[e];
    let n = this.buffer[e + 3];
    let r = this.set.types[t];
    let r_name = r.name;
    if (/\W/.test(r_name) && !r.isError) {
      r_name = JSON.stringify(r_name);
    }
    e += 4;
    if (n == e) {
      return r_name;
    }
    let a = [];
    while (e < n) {
      a.push(this.childString(e));
      e = this.buffer[e + 3];
    }
    return r_name + `(` + a.join(`,`) + `)`;
  }
  findChild(e, t, n, r, i) {
    let { buffer } = this;
    let o = -1;
    for (
      let s = e;
      s != t && !(ll(i, r, buffer[s + 1], buffer[s + 2]) && ((o = s), n > 0));
      s = buffer[s + 3]
    );
    return o;
  }
  slice(t, n, r) {
    let buffer = this.buffer;
    let a = new Uint16Array(n - t);
    let o = 0;
    for (let e = t, s = 0; e < n;) {
      a[s++] = buffer[e++];
      a[s++] = buffer[e++] - r;
      let n = (a[s++] = buffer[e++] - r);
      a[s++] = buffer[e++] - t;
      o = Math.max(o, n);
    }
    return new e(a, o, this.set);
  }
};
function ll(e, t, n, r) {
  switch (e) {
    case -2:
      return n < t;
    case -1:
      return r >= t && n < t;
    case 0:
      return n < t && r > t;
    case 1:
      return n <= t && r > t;
    case 2:
      return r > t;
    case 4:
      return true;
  }
}
function ul(e, t, n, r) {
  while (
    e.from == e.to ||
    (n < 1 ? e.from >= t : e.from > t) ||
    (n > -1 ? e.to <= t : e.to < t)
  ) {
    let t = !r && e instanceof fl && e.index < 0 ? null : e.parent;
    if (!t) {
      return e;
    }
    e = t;
  }
  let i = r ? 0 : q.IgnoreOverlays;
  if (r) {
    for (let r = e, a = r.parent; a; r = a, a = r.parent) {
      if (r instanceof fl && r.index < 0 && a.enter(t, n, i)?.from != r.from) {
        e = a;
      }
    }
  }
  while (true) {
    let r = e.enter(t, n, i);
    if (!r) {
      return e;
    }
    e = r;
  }
}
class dl {
  cursor(e = 0) {
    return new bl(this, e);
  }
  getChild(e, t = null, n = null) {
    let r = pl(this, e, t, n);
    if (r.length) {
      return r[0];
    }
    return null;
  }
  getChildren(e, t = null, n = null) {
    return pl(this, e, t, n);
  }
  resolve(e, t = 0) {
    return ul(this, e, t, false);
  }
  resolveInner(e, t = 0) {
    return ul(this, e, t, true);
  }
  matchContext(e) {
    return ml(this.parent, e);
  }
  enterUnfinishedNodesBefore(e) {
    let t = this.childBefore(e);
    let n = this;
    while (t) {
      let e = t.lastChild;
      if (!e || e.to != t.to) {
        break;
      }
      if (e.type.isError && e.from == e.to) {
        n = t;
        t = e.prevSibling;
      } else {
        t = e;
      }
    }
    return n;
  }
  get node() {
    return this;
  }
  get next() {
    return this.parent;
  }
}
var fl = class e extends dl {
  constructor(e, t, n, r) {
    super();
    this._tree = e;
    this.from = t;
    this.index = n;
    this._parent = r;
  }
  get type() {
    return this._tree.type;
  }
  get name() {
    return this._tree.type.name;
  }
  get to() {
    return this.from + this._tree.length;
  }
  nextChild(t, n, r, i, a = 0) {
    for (let o = this; ;) {
      for (
        let { children, positions } = o._tree, l = n > 0 ? children.length : -1;
        t != l;
        t += n
      ) {
        let l = children[t];
        let u = positions[t] + o.from;
        let d;
        if (
          (a & q.EnterBracketed &&
            l instanceof J &&
            (d = tl.get(l)) &&
            !d.overlay &&
            d.bracketed &&
            r >= u &&
            r <= u + l.length) ||
          ll(i, r, u, u + l.length)
        ) {
          if (l instanceof cl) {
            if (a & q.ExcludeBuffers) {
              continue;
            }
            let e = l.findChild(0, l.buffer.length, n, r - u, i);
            if (e > -1) {
              return new gl(new hl(o, l, t, u), null, e);
            }
          } else if (a & q.IncludeAnonymous || !l.type.isAnonymous || xl(l)) {
            let s;
            if (!(a & q.IgnoreMounts) && (s = tl.get(l)) && !s.overlay) {
              return new e(s.tree, u, t, o);
            }
            let c = new e(l, u, t, o);
            if (a & q.IncludeAnonymous || !c.type.isAnonymous) {
              return c;
            }
            return c.nextChild(n < 0 ? l.children.length - 1 : 0, n, r, i, a);
          }
        }
      }
      if (
        a & q.IncludeAnonymous ||
        !o.type.isAnonymous ||
        ((t =
          o.index >= 0
            ? o.index + n
            : n < 0
              ? -1
              : o._parent._tree.children.length),
        (o = o._parent),
        !o)
      ) {
        return null;
      }
    }
  }
  get firstChild() {
    return this.nextChild(0, 1, 0, 4);
  }
  get lastChild() {
    return this.nextChild(this._tree.children.length - 1, -1, 0, 4);
  }
  childAfter(e) {
    return this.nextChild(0, 1, e, 2);
  }
  childBefore(e) {
    return this.nextChild(this._tree.children.length - 1, -1, e, -2);
  }
  prop(e) {
    return this._tree.prop(e);
  }
  enter(t, n, r = 0) {
    let i;
    if (!(r & q.IgnoreOverlays) && (i = tl.get(this._tree)) && i.overlay) {
      let a = t - this.from;
      let o = r & q.EnterBracketed && i.bracketed;
      for (let { from, to } of i.overlay) {
        if (
          (n > 0 || o ? from <= a : from < a) &&
          (n < 0 || o ? to >= a : to > a)
        ) {
          return new e(i.tree, i.overlay[0].from + this.from, -1, this);
        }
      }
    }
    return this.nextChild(0, 1, t, n, r);
  }
  nextSignificantParent() {
    let e = this;
    while (e.type.isAnonymous && e._parent) {
      e = e._parent;
    }
    return e;
  }
  get parent() {
    if (this._parent) {
      return this._parent.nextSignificantParent();
    }
    return null;
  }
  get nextSibling() {
    if (this._parent && this.index >= 0) {
      return this._parent.nextChild(this.index + 1, 1, 0, 4);
    }
    return null;
  }
  get prevSibling() {
    if (this._parent && this.index >= 0) {
      return this._parent.nextChild(this.index - 1, -1, 0, 4);
    }
    return null;
  }
  get tree() {
    return this._tree;
  }
  toTree() {
    return this._tree;
  }
  toString() {
    return this._tree.toString();
  }
};
function pl(e, t, n, r) {
  let i = e.cursor();
  let a = [];
  if (!i.firstChild()) {
    return a;
  }
  if (n != null) {
    for (let e = false; !e;) {
      e = i.type.is(n);
      if (!i.nextSibling()) {
        return a;
      }
    }
  }
  while (true) {
    if (r != null && i.type.is(r)) {
      return a;
    }
    if (i.type.is(t)) {
      a.push(i.node);
    }
    if (!i.nextSibling()) {
      if (r == null) {
        return a;
      }
      return [];
    }
  }
}
function ml(e, t, n = t.length - 1) {
  for (let r = e; n >= 0; r = r.parent) {
    if (!r) {
      return false;
    }
    if (!r.type.isAnonymous) {
      if (t[n] && t[n] != r.name) {
        return false;
      }
      n--;
    }
  }
  return true;
}
var hl = class {
  constructor(e, t, n, r) {
    this.parent = e;
    this.buffer = t;
    this.index = n;
    this.start = r;
  }
};
var gl = class e extends dl {
  get name() {
    return this.type.name;
  }
  get from() {
    return this.context.start + this.context.buffer.buffer[this.index + 1];
  }
  get to() {
    return this.context.start + this.context.buffer.buffer[this.index + 2];
  }
  constructor(e, t, n) {
    super();
    this.context = e;
    this._parent = t;
    this.index = n;
    this.type = e.buffer.set.types[e.buffer.buffer[n]];
  }
  child(t, n, r) {
    let { buffer } = this.context;
    let a = buffer.findChild(
      this.index + 4,
      buffer.buffer[this.index + 3],
      t,
      n - this.context.start,
      r,
    );
    if (a < 0) {
      return null;
    }
    return new e(this.context, this, a);
  }
  get firstChild() {
    return this.child(1, 0, 4);
  }
  get lastChild() {
    return this.child(-1, 0, 4);
  }
  childAfter(e) {
    return this.child(1, e, 2);
  }
  childBefore(e) {
    return this.child(-1, e, -2);
  }
  prop(e) {
    return this.type.prop(e);
  }
  enter(t, n, r = 0) {
    if (r & q.ExcludeBuffers) {
      return null;
    }
    let { buffer } = this.context;
    let a = buffer.findChild(
      this.index + 4,
      buffer.buffer[this.index + 3],
      n > 0 ? 1 : -1,
      t - this.context.start,
      n,
    );
    if (a < 0) {
      return null;
    }
    return new e(this.context, this, a);
  }
  get parent() {
    return this._parent || this.context.parent.nextSignificantParent();
  }
  externalSibling(e) {
    if (this._parent) {
      return null;
    }
    return this.context.parent.nextChild(this.context.index + e, e, 0, 4);
  }
  get nextSibling() {
    let { buffer } = this.context;
    let n = buffer.buffer[this.index + 3];
    if (
      n <
      (this._parent
        ? buffer.buffer[this._parent.index + 3]
        : buffer.buffer.length)
    ) {
      return new e(this.context, this._parent, n);
    }
    return this.externalSibling(1);
  }
  get prevSibling() {
    let { buffer } = this.context;
    let n = this._parent ? this._parent.index + 4 : 0;
    if (this.index == n) {
      return this.externalSibling(-1);
    }
    return new e(
      this.context,
      this._parent,
      buffer.findChild(n, this.index, -1, 0, 4),
    );
  }
  get tree() {
    return null;
  }
  toTree() {
    let e = [];
    let t = [];
    let { buffer } = this.context;
    let r = this.index + 4;
    let i = buffer.buffer[this.index + 3];
    if (i > r) {
      let a = buffer.buffer[this.index + 1];
      e.push(buffer.slice(r, i, a));
      t.push(0);
    }
    return new J(this.type, e, t, this.to - this.from);
  }
  toString() {
    return this.context.buffer.childString(this.index);
  }
};
function _l(e) {
  if (!e.length) {
    return null;
  }
  let t = 0;
  let n = e[0];
  for (let r = 1; r < e.length; r++) {
    let i = e[r];
    if (i.from > n.from || i.to < n.to) {
      n = i;
      t = r;
    }
  }
  let r = n instanceof fl && n.index < 0 ? null : n.parent;
  let i = e.slice();
  if (r) {
    i[t] = r;
  } else {
    i.splice(t, 1);
  }
  return new vl(i, n);
}
var vl = class {
  constructor(e, t) {
    this.heads = e;
    this.node = t;
  }
  get next() {
    return _l(this.heads);
  }
};
function yl(e, t, n) {
  let r = e.resolveInner(t, n);
  let i = null;
  for (let e = r instanceof fl ? r : r.context.parent; e; e = e.parent) {
    if (e.index < 0) {
      let a = e.parent;
      (i ||= [r]).push(a.resolve(t, n));
      e = a;
    } else {
      let a = tl.get(e.tree);
      if (
        a &&
        a.overlay &&
        a.overlay[0].from <= t &&
        a.overlay[a.overlay.length - 1].to >= t
      ) {
        let o = new fl(a.tree, a.overlay[0].from + e.from, -1, e);
        (i ||= [r]).push(ul(o, t, n, false));
      }
    }
  }
  if (i) {
    return _l(i);
  }
  return r;
}
var bl = class {
  get name() {
    return this.type.name;
  }
  constructor(e, t = 0) {
    this.buffer = null;
    this.stack = [];
    this.index = 0;
    this.bufferNode = null;
    this.mode = t & ~q.EnterBracketed;
    if (e instanceof fl) {
      this.yieldNode(e);
    } else {
      this._tree = e.context.parent;
      this.buffer = e.context;
      for (let t = e._parent; t; t = t._parent) {
        this.stack.unshift(t.index);
      }
      this.bufferNode = e;
      this.yieldBuf(e.index);
    }
  }
  yieldNode(e) {
    if (e) {
      return (
        (this._tree = e),
        (this.type = e.type),
        (this.from = e.from),
        (this.to = e.to),
        true
      );
    }
    return false;
  }
  yieldBuf(e, t) {
    this.index = e;
    let { start, buffer } = this.buffer;
    this.type = t || buffer.set.types[buffer.buffer[e]];
    this.from = start + buffer.buffer[e + 1];
    this.to = start + buffer.buffer[e + 2];
    return true;
  }
  yield(e) {
    if (e) {
      if (e instanceof fl) {
        return ((this.buffer = null), this.yieldNode(e));
      }
      return ((this.buffer = e.context), this.yieldBuf(e.index, e.type));
    }
    return false;
  }
  toString() {
    if (this.buffer) {
      return this.buffer.buffer.childString(this.index);
    }
    return this._tree.toString();
  }
  enterChild(e, t, n) {
    if (!this.buffer) {
      return this.yield(
        this._tree.nextChild(
          e < 0 ? this._tree._tree.children.length - 1 : 0,
          e,
          t,
          n,
          this.mode,
        ),
      );
    }
    let { buffer } = this.buffer;
    let i = buffer.findChild(
      this.index + 4,
      buffer.buffer[this.index + 3],
      e,
      t - this.buffer.start,
      n,
    );
    if (i < 0) {
      return false;
    }
    return (this.stack.push(this.index), this.yieldBuf(i));
  }
  firstChild() {
    return this.enterChild(1, 0, 4);
  }
  lastChild() {
    return this.enterChild(-1, 0, 4);
  }
  childAfter(e) {
    return this.enterChild(1, e, 2);
  }
  childBefore(e) {
    return this.enterChild(-1, e, -2);
  }
  enter(e, t, n = this.mode) {
    if (this.buffer) {
      if (n & q.ExcludeBuffers) {
        return false;
      }
      return this.enterChild(1, e, t);
    }
    return this.yield(this._tree.enter(e, t, n));
  }
  parent() {
    if (!this.buffer) {
      return this.yieldNode(
        this.mode & q.IncludeAnonymous ? this._tree._parent : this._tree.parent,
      );
    }
    if (this.stack.length) {
      return this.yieldBuf(this.stack.pop());
    }
    let e =
      this.mode & q.IncludeAnonymous
        ? this.buffer.parent
        : this.buffer.parent.nextSignificantParent();
    this.buffer = null;
    return this.yieldNode(e);
  }
  sibling(e) {
    if (!this.buffer) {
      if (this._tree._parent) {
        return this.yield(
          this._tree.index < 0
            ? null
            : this._tree._parent.nextChild(
                this._tree.index + e,
                e,
                0,
                4,
                this.mode,
              ),
        );
      }
      return false;
    }
    let { buffer } = this.buffer;
    let n = this.stack.length - 1;
    if (e < 0) {
      let e = n < 0 ? 0 : this.stack[n] + 4;
      if (this.index != e) {
        return this.yieldBuf(buffer.findChild(e, this.index, -1, 0, 4));
      }
    } else {
      let e = buffer.buffer[this.index + 3];
      if (
        e < (n < 0 ? buffer.buffer.length : buffer.buffer[this.stack[n] + 3])
      ) {
        return this.yieldBuf(e);
      }
    }
    return (
      n < 0 &&
      this.yield(
        this.buffer.parent.nextChild(this.buffer.index + e, e, 0, 4, this.mode),
      )
    );
  }
  nextSibling() {
    return this.sibling(1);
  }
  prevSibling() {
    return this.sibling(-1);
  }
  atLastNode(e) {
    let t;
    let n;
    let { buffer } = this;
    if (buffer) {
      if (e > 0) {
        if (this.index < buffer.buffer.buffer.length) {
          return false;
        }
      } else {
        for (let e = 0; e < this.index; e++) {
          if (buffer.buffer.buffer[e + 3] < this.index) {
            return false;
          }
        }
      }
      ({ index: t, parent: n } = buffer);
    } else {
      ({ index: t, _parent: n } = this._tree);
    }
    for (; n; { index: t, _parent: n } = n) {
      if (t > -1) {
        for (
          let r = t + e, i = e < 0 ? -1 : n._tree.children.length;
          r != i;
          r += e
        ) {
          let e = n._tree.children[r];
          if (
            this.mode & q.IncludeAnonymous ||
            e instanceof cl ||
            !e.type.isAnonymous ||
            xl(e)
          ) {
            return false;
          }
        }
      }
    }
    return true;
  }
  move(e, t) {
    if (t && this.enterChild(e, 0, 4)) {
      return true;
    }
    while (true) {
      if (this.sibling(e)) {
        return true;
      }
      if (this.atLastNode(e) || !this.parent()) {
        return false;
      }
    }
  }
  next(e = true) {
    return this.move(1, e);
  }
  prev(e = true) {
    return this.move(-1, e);
  }
  moveTo(e, t = 0) {
    while (
      (this.from == this.to ||
        (t < 1 ? this.from >= e : this.from > e) ||
        (t > -1 ? this.to <= e : this.to < e)) &&
      this.parent()
    );
    while (this.enterChild(1, e, t));
    return this;
  }
  get node() {
    if (!this.buffer) {
      return this._tree;
    }
    let bufferNode = this.bufferNode;
    let t = null;
    let n = 0;
    if (bufferNode && bufferNode.context == this.buffer) {
      scan: for (let r = this.index, i = this.stack.length; i >= 0;) {
        for (let a = bufferNode; a; a = a._parent) {
          if (a.index == r) {
            if (r == this.index) {
              return a;
            }
            t = a;
            n = i + 1;
            break scan;
          }
        }
        r = this.stack[--i];
      }
    }
    for (let e = n; e < this.stack.length; e++) {
      t = new gl(this.buffer, t, this.stack[e]);
    }
    return (this.bufferNode = new gl(this.buffer, t, this.index));
  }
  get tree() {
    if (this.buffer) {
      return null;
    }
    return this._tree._tree;
  }
  iterate(e, t) {
    for (let n = 0; ;) {
      let r = false;
      if (this.type.isAnonymous || e(this) !== false) {
        if (this.firstChild()) {
          n++;
          continue;
        }
        if (!this.type.isAnonymous) {
          r = true;
        }
      }
      while (true) {
        if (r && t) {
          t(this);
        }
        r = this.type.isAnonymous;
        if (!n) {
          return;
        }
        if (this.nextSibling()) {
          break;
        }
        this.parent();
        n--;
        r = true;
      }
    }
  }
  matchContext(e) {
    if (!this.buffer) {
      return ml(this.node.parent, e);
    }
    let { buffer } = this.buffer;
    let { types } = buffer.set;
    for (let r = e.length - 1, i = this.stack.length - 1; r >= 0; i--) {
      if (i < 0) {
        return ml(this._tree, e, r);
      }
      let a = types[buffer.buffer[this.stack[i]]];
      if (!a.isAnonymous) {
        if (e[r] && e[r] != a.name) {
          return false;
        }
        r--;
      }
    }
    return true;
  }
};
function xl(e) {
  return e.children.some(
    (e) => e instanceof cl || !e.type.isAnonymous || xl(e),
  );
}
function Sl(e) {
  let {
    buffer,
    nodeSet,
    maxBufferLength = Qc,
    reused = [],
    minRepeatType = nodeSet.types.length,
  } = e;
  let o = Array.isArray(buffer) ? new sl(buffer, buffer.length) : buffer;
  let nodeSet_types = nodeSet.types;
  let c = 0;
  let l = 0;
  function u(e, t, _, v, y, b) {
    let { id, start, end, size } = o;
    let ne = l;
    let re = c;
    if (size < 0) {
      o.next();
      if (size == -1) {
        let t = reused[id];
        _.push(t);
        v.push(start - e);
        return;
      }
      if (size == -3) {
        c = id;
        return;
      }
      if (size == -4) {
        l = id;
        return;
      }
      throw RangeError(`Unrecognized record size: ${size}`);
    }
    let ie = nodeSet_types[id];
    let ae;
    let C;
    let oe = start - e;
    if (end - start <= maxBufferLength && (C = h(o.pos - t, y))) {
      let t = new Uint16Array(C.size - C.skip);
      let r = o.pos - C.size;
      let i = t.length;
      while (o.pos > r) {
        i = g(C.start, t, i);
      }
      ae = new cl(t, end - C.start, nodeSet);
      oe = C.start - e;
    } else {
      let e = o.pos - size;
      o.next();
      let t = [];
      let n = [];
      let i = id >= minRepeatType ? id : -1;
      let s = 0;
      let c = end;
      while (o.pos > e) {
        if (i >= 0 && o.id == i && o.size >= 0) {
          if (o.end <= c - maxBufferLength) {
            p(t, n, start, s, o.end, c, i, ne, re);
            s = t.length;
            c = o.end;
          }
          o.next();
        } else if (b > 2500) {
          d(start, e, t, n);
        } else {
          u(start, e, t, n, i, b + 1);
        }
      }
      if (i >= 0 && s > 0 && s < t.length) {
        p(t, n, start, s, start, c, i, ne, re);
      }
      t.reverse();
      n.reverse();
      if (i > -1 && s > 0) {
        let e = f(ie, re);
        ae = Tl(ie, t, n, 0, t.length, 0, end - start, e, e);
      } else {
        ae = m(ie, t, n, end - start, ne - end, re);
      }
    }
    _.push(ae);
    v.push(oe);
  }
  function d(e, t, i, a) {
    let s = [];
    let c = 0;
    let l = -1;
    while (o.pos > t) {
      let { id, start, end, size } = o;
      if (size > 4) {
        o.next();
      } else if (l > -1 && start < l) {
        break;
      } else {
        if (l < 0) {
          l = end - maxBufferLength;
        }
        s.push(id, start, end);
        c++;
        o.next();
      }
    }
    if (c) {
      let t = new Uint16Array(c * 4);
      let r = s[s.length - 2];
      for (let e = s.length - 3, n = 0; e >= 0; e -= 3) {
        t[n++] = s[e];
        t[n++] = s[e + 1] - r;
        t[n++] = s[e + 2] - r;
        t[n++] = n;
      }
      i.push(new cl(t, s[2] - r, nodeSet));
      a.push(r - e);
    }
  }
  function f(e, t) {
    return (n, r, i) => {
      let a = 0;
      let o = n.length - 1;
      let s;
      let c;
      if (o >= 0 && (s = n[o]) instanceof J) {
        if (!o && s.type == e && s.length == i) {
          return s;
        }
        if ((c = s.prop(K.lookAhead))) {
          a = r[o] + s.length + c;
        }
      }
      return m(e, n, r, i, a, t);
    };
  }
  function p(e, t, start, i, a, o, s, c, l) {
    let u = [];
    let d = [];
    while (e.length > i) {
      u.push(e.pop());
      d.push(t.pop() + start - a);
    }
    e.push(m(nodeSet.types[s], u, d, o - a, c - o, l));
    t.push(a - start);
  }
  function m(e, t, n, r, i, a, o) {
    if (a) {
      let e = [K.contextHash, a];
      o = o ? [e].concat(o) : [e];
    }
    if (i > 25) {
      let e = [K.lookAhead, i];
      o = o ? [e].concat(o) : [e];
    }
    return new J(e, t, n, r, o);
  }
  function h(e, t) {
    let n = o.fork();
    let i = 0;
    let s = 0;
    let c = 0;
    let l = n.end - maxBufferLength;
    let u = {
      size: 0,
      start: 0,
      skip: 0,
    };
    scan: for (let r = n.pos - e; n.pos > r;) {
      let e = n.size;
      if (n.id == t && e >= 0) {
        u.size = i;
        u.start = s;
        u.skip = c;
        c += 4;
        i += 4;
        n.next();
        continue;
      }
      let o = n.pos - e;
      if (e < 0 || o < r || n.start < l) {
        break;
      }
      let d = n.id >= minRepeatType ? 4 : 0;
      let f = n.start;
      for (n.next(); n.pos > o;) {
        if (n.size < 0) {
          if (n.size == -3 || n.size == -4) {
            d += 4;
          } else {
            break scan;
          }
        } else {
          if (n.id >= minRepeatType) {
            d += 4;
          }
        }
        n.next();
      }
      s = f;
      i += e;
      c += d;
    }
    if (t < 0 || i == e) {
      u.size = i;
      u.start = s;
      u.skip = c;
    }
    if (u.size > 4) {
      return u;
    }
  }
  function g(e, t, n) {
    let { id, start, end, size } = o;
    o.next();
    if (size >= 0 && id < minRepeatType) {
      let a = n;
      if (size > 4) {
        let r = o.pos - (size - 4);
        while (o.pos > r) {
          n = g(e, t, n);
        }
      }
      t[--n] = a;
      t[--n] = end - e;
      t[--n] = start - e;
      t[--n] = id;
    } else {
      if (size == -3) {
        c = id;
      } else if (size == -4) {
        l = id;
      }
    }
    return n;
  }
  let _ = [];
  let v = [];
  while (o.pos > 0) {
    u(e.start || 0, e.bufferStart || 0, _, v, -1, 0);
  }
  let y = e.length ?? (_.length ? v[0] + _[0].length : 0);
  return new J(nodeSet_types[e.topID], _.reverse(), v.reverse(), y);
}
var Cl = new WeakMap();
function wl(e, t) {
  if (!e.isAnonymous || t instanceof cl || t.type != e) {
    return 1;
  }
  let n = Cl.get(t);
  if (n == null) {
    n = 1;
    for (let r of t.children) {
      if (r.type != e || !(r instanceof J)) {
        n = 1;
        break;
      }
      n += wl(e, r);
    }
    Cl.set(t, n);
  }
  return n;
}
function Tl(e, t, n, r, i, a, o, s, c) {
  let l = 0;
  for (let n = r; n < i; n++) {
    l += wl(e, t[n]);
  }
  let u = Math.ceil((l * 1.5) / 8);
  let d = [];
  let f = [];
  function p(t, n, r, i, o) {
    for (let s = r; s < i;) {
      let r = s;
      let l = n[s];
      let m = wl(e, t[s]);
      for (s++; s < i; s++) {
        let n = wl(e, t[s]);
        if (m + n >= u) {
          break;
        }
        m += n;
      }
      if (s == r + 1) {
        if (m > u) {
          let e = t[r];
          p(e.children, e.positions, 0, e.children.length, n[r] + o);
          continue;
        }
        d.push(t[r]);
      } else {
        let i = n[s - 1] + t[s - 1].length - l;
        d.push(Tl(e, t, n, r, s, l, i, null, c));
      }
      f.push(l + o - a);
    }
  }
  p(t, n, r, i, 0);
  return (s || c)(d, f, o);
}
const El = class e {
  constructor(e, t, n, r, i = false, a = false) {
    this.from = e;
    this.to = t;
    this.tree = n;
    this.offset = r;
    this.open = !!i | (a ? 2 : 0);
  }
  get openStart() {
    return (this.open & 1) > 0;
  }
  get openEnd() {
    return (this.open & 2) > 0;
  }
  static addTree(t, n = [], r = false) {
    let i = [new e(0, t.length, t, 0, false, r)];
    for (let e of n) {
      if (e.to > t.length) {
        i.push(e);
      }
    }
    return i;
  }
  static applyChanges(t, n, r = 128) {
    if (!n.length) {
      return t;
    }
    let i = [];
    let a = 1;
    let o = t.length ? t[0] : null;
    for (let s = 0, c = 0, l = 0; ; s++) {
      let u = s < n.length ? n[s] : null;
      let d = u ? u.fromA : 1000000000;
      if (d - c >= r) {
        while (o && o.from < d) {
          let n = o;
          if (c >= n.from || d <= n.to || l) {
            let t = Math.max(n.from, c) - l;
            let r = Math.min(n.to, d) - l;
            n = t >= r ? null : new e(t, r, n.tree, n.offset + l, s > 0, !!u);
          }
          if (n) {
            i.push(n);
          }
          if (o.to > d) {
            break;
          }
          o = a < t.length ? t[a++] : null;
        }
      }
      if (!u) {
        break;
      }
      c = u.toA;
      l = u.toA - u.toB;
    }
    return i;
  }
};
class Dl {
  startParse(e, t, n) {
    if (typeof e == `string`) {
      e = new Ol(e);
    }
    n = n
      ? n.length
        ? n.map((e) => new el(e.from, e.to))
        : [new el(0, 0)]
      : [new el(0, e.length)];
    return this.createParse(e, t || [], n);
  }
  parse(e, t, n) {
    let r = this.startParse(e, t, n);
    while (true) {
      let e = r.advance();
      if (e) {
        return e;
      }
    }
  }
}
var Ol = class {
  constructor(e) {
    this.string = e;
  }
  get length() {
    return this.string.length;
  }
  chunk(e) {
    return this.string.slice(e);
  }
  get lineChunks() {
    return false;
  }
  read(e, t) {
    return this.string.slice(e, t);
  }
};
new K({
  perNode: true,
});
let kl = 0;
const Al = class e {
  constructor(e, t, n, r) {
    this.name = e;
    this.set = t;
    this.base = n;
    this.modified = r;
    this.id = kl++;
  }
  toString() {
    let { name } = this;
    for (let t of this.modified) {
      if (t.name) {
        name = `${t.name}(${name})`;
      }
    }
    return name;
  }
  static define(t, n) {
    let r = typeof t == `string` ? t : `?`;
    if (t instanceof e) {
      n = t;
    }
    if (n?.base) {
      throw Error(`Can not derive from a modified tag`);
    }
    let i = new e(r, [], null, []);
    i.set.push(i);
    if (n) {
      for (let e of n.set) {
        i.set.push(e);
      }
    }
    return i;
  }
  static defineModifier(e) {
    let t = new Ml(e);
    return (e) => {
      if (e.modified.indexOf(t) > -1) {
        return e;
      }
      return Ml.get(
        e.base || e,
        e.modified.concat(t).sort((e, t) => e.id - t.id),
      );
    };
  }
};
let jl = 0;
var Ml = class e {
  constructor(e) {
    this.name = e;
    this.instances = [];
    this.id = jl++;
  }
  static get(t, n) {
    if (!n.length) {
      return t;
    }
    let r = n[0].instances.find((e) => e.base == t && Nl(n, e.modified));
    if (r) {
      return r;
    }
    let i = [];
    let a = new Al(t.name, i, t, n);
    for (let e of n) {
      e.instances.push(a);
    }
    let o = Pl(n);
    for (let n of t.set) {
      if (!n.modified.length) {
        for (let t of o) {
          i.push(e.get(n, t));
        }
      }
    }
    return a;
  }
};
function Nl(e, modified) {
  return e.length == modified.length && e.every((e, n) => e == modified[n]);
}
function Pl(e) {
  let t = [[]];
  for (let n = 0; n < e.length; n++) {
    for (let r = 0, i = t.length; r < i; r++) {
      t.push(t[r].concat(e[n]));
    }
  }
  return t.sort((e, t) => t.length - e.length);
}
function Fl(e) {
  let t = Object.create(null);
  for (let n in e) {
    let r = e[n];
    if (!Array.isArray(r)) {
      r = [r];
    }
    for (let e of n.split(` `)) {
      if (e) {
        let n = [];
        let i = 2;
        let a = e;
        for (let t = 0; ;) {
          if (a == `...` && t > 0 && t + 3 == e.length) {
            i = 1;
            break;
          }
          let r = /^"(?:[^"\\]|\\.)*?"|[^\/!]+/.exec(a);
          if (!r) {
            throw RangeError(`Invalid path: ` + e);
          }
          n.push(r[0] == `*` ? `` : r[0][0] == `"` ? JSON.parse(r[0]) : r[0]);
          t += r[0].length;
          if (t == e.length) {
            break;
          }
          let o = e[t++];
          if (t == e.length && o == `!`) {
            i = 0;
            break;
          }
          if (o != `/`) {
            throw RangeError(`Invalid path: ` + e);
          }
          a = e.slice(t);
        }
        let o = n.length - 1;
        let s = n[o];
        if (!s) {
          throw RangeError(`Invalid path: ` + e);
        }
        t[s] = new Ll(r, i, o > 0 ? n.slice(0, o) : null).sort(t[s]);
      }
    }
  }
  return Il.add(t);
}
var Il = new K({
  combine(e, t) {
    let n;
    let r;
    let i;
    while (e || t) {
      if (!e || (t && e.depth <= t.depth)) {
        i = t;
        t = t.next;
      } else {
        i = e;
        e = e.next;
      }
      if (n && n.mode == i.mode && !i.context && !n.context) {
        continue;
      }
      let a = new Ll(i.tags, i.mode, i.context);
      if (n) {
        n.next = a;
      } else {
        r = a;
      }
      n = a;
    }
    return r;
  },
});
var Ll = class {
  constructor(e, t, n, r) {
    this.tags = e;
    this.mode = t;
    this.context = n;
    this.next = r;
  }
  get opaque() {
    return this.mode == 0;
  }
  get inherit() {
    return this.mode == 1;
  }
  sort(e) {
    if (!e || e.depth < this.depth) {
      return ((this.next = e), this);
    }
    return ((e.next = this.sort(e.next)), e);
  }
  get depth() {
    if (this.context) {
      return this.context.length;
    }
    return 0;
  }
};
Ll.empty = new Ll([], 2, null);
function Rl(e, t) {
  let n = Object.create(null);
  for (let t of e) {
    if (!Array.isArray(t.tag)) {
      n[t.tag.id] = t.class;
    } else {
      for (let e of t.tag) {
        n[e.id] = t.class;
      }
    }
  }
  let { scope, all = null } = t || {};
  return {
    style: (e) => {
      let t = all;
      for (let r of e) {
        for (let e of r.set) {
          let r = n[e.id];
          if (r) {
            t = t ? t + ` ` + r : r;
            break;
          }
        }
      }
      return t;
    },
    scope,
  };
}
function zl(e, tags) {
  let n = null;
  for (let r of e) {
    let e = r.style(tags);
    if (e) {
      n = n ? n + ` ` + e : e;
    }
  }
  return n;
}
function Bl(tree, t, n, r = 0, i = tree.length) {
  let a = new Vl(r, Array.isArray(t) ? t : [t], n);
  a.highlightRange(tree.cursor(), r, i, ``, a.highlighters);
  a.flush(i);
}
var Vl = class {
  constructor(e, t, n) {
    this.at = e;
    this.highlighters = t;
    this.span = n;
    this.class = ``;
  }
  startSpan(e, t) {
    if (t != this.class) {
      this.flush(e);
      if (e > this.at) {
        this.at = e;
      }
      this.class = t;
    }
  }
  flush(e) {
    if (e > this.at && this.class) {
      this.span(this.at, e, this.class);
    }
  }
  highlightRange(e, t, n, r, i) {
    let { type, from, to } = e;
    if (from >= n || to <= t) {
      return;
    }
    if (type.isTop) {
      i = this.highlighters.filter((e) => !e.scope || e.scope(type));
    }
    let c = r;
    let l = Hl(e) || Ll.empty;
    let u = zl(i, l.tags);
    if (u) {
      if (c) {
        c += ` `;
      }
      c += u;
      if (l.mode == 1) {
        r += (r ? ` ` : ``) + u;
      }
    }
    this.startSpan(Math.max(t, from), c);
    if (l.opaque) {
      return;
    }
    let d = e.tree && e.tree.prop(K.mounted);
    if (d && d.overlay) {
      let a = e.node.enter(d.overlay[0].from + from, 1);
      let l = this.highlighters.filter((e) => !e.scope || e.scope(d.tree.type));
      let u = e.firstChild();
      for (let f = 0, p = from; ; f++) {
        let m = f < d.overlay.length ? d.overlay[f] : null;
        let h = m ? m.from + from : to;
        let g = Math.max(t, p);
        let _ = Math.min(n, h);
        if (g < _ && u) {
          while (
            e.from < _ &&
            (this.highlightRange(e, g, _, r, i),
            this.startSpan(Math.min(_, e.to), c),
            !(e.to >= h || !e.nextSibling()))
          );
        }
        if (!m || h > n) {
          break;
        }
        p = m.to + from;
        if (p > t) {
          this.highlightRange(
            a.cursor(),
            Math.max(t, m.from + from),
            Math.min(n, p),
            ``,
            l,
          );
          this.startSpan(Math.min(n, p), c);
        }
      }
      if (u) {
        e.parent();
      }
    } else if (e.firstChild()) {
      if (d) {
        r = ``;
      }
      do {
        if (!(e.to <= t)) {
          if (e.from >= n) {
            break;
          }
          this.highlightRange(e, t, n, r, i);
          this.startSpan(Math.min(n, e.to), c);
        }
      } while (e.nextSibling());
      e.parent();
    }
  }
};
function Hl(e) {
  let t = e.type.prop(Il);
  while (t && t.context && !e.matchContext(t.context)) {
    t = t.next;
  }
  return t || null;
}
const Al_define = Al.define;
const comment = Al_define();
const Wl = Al_define();
const typeName = Al_define(Wl);
const propertyName = Al_define(Wl);
const literal = Al_define();
const string = Al_define(literal);
const number = Al_define(literal);
const content = Al_define();
const heading = Al_define(content);
const keyword = Al_define();
const operator = Al_define();
const punctuation = Al_define();
const bracket = Al_define(punctuation);
const meta = Al_define();
const X = {
  comment,
  lineComment: Al_define(comment),
  blockComment: Al_define(comment),
  docComment: Al_define(comment),
  name: Wl,
  variableName: Al_define(Wl),
  typeName,
  tagName: Al_define(typeName),
  propertyName,
  attributeName: Al_define(propertyName),
  className: Al_define(Wl),
  labelName: Al_define(Wl),
  namespace: Al_define(Wl),
  macroName: Al_define(Wl),
  literal,
  string,
  docString: Al_define(string),
  character: Al_define(string),
  attributeValue: Al_define(string),
  number,
  integer: Al_define(number),
  float: Al_define(number),
  bool: Al_define(literal),
  regexp: Al_define(literal),
  escape: Al_define(literal),
  color: Al_define(literal),
  url: Al_define(literal),
  keyword,
  self: Al_define(keyword),
  null: Al_define(keyword),
  atom: Al_define(keyword),
  unit: Al_define(keyword),
  modifier: Al_define(keyword),
  operatorKeyword: Al_define(keyword),
  controlKeyword: Al_define(keyword),
  definitionKeyword: Al_define(keyword),
  moduleKeyword: Al_define(keyword),
  operator,
  derefOperator: Al_define(operator),
  arithmeticOperator: Al_define(operator),
  logicOperator: Al_define(operator),
  bitwiseOperator: Al_define(operator),
  compareOperator: Al_define(operator),
  updateOperator: Al_define(operator),
  definitionOperator: Al_define(operator),
  typeOperator: Al_define(operator),
  controlOperator: Al_define(operator),
  punctuation,
  separator: Al_define(punctuation),
  bracket,
  angleBracket: Al_define(bracket),
  squareBracket: Al_define(bracket),
  paren: Al_define(bracket),
  brace: Al_define(bracket),
  content,
  heading,
  heading1: Al_define(heading),
  heading2: Al_define(heading),
  heading3: Al_define(heading),
  heading4: Al_define(heading),
  heading5: Al_define(heading),
  heading6: Al_define(heading),
  contentSeparator: Al_define(content),
  list: Al_define(content),
  quote: Al_define(content),
  emphasis: Al_define(content),
  strong: Al_define(content),
  link: Al_define(content),
  monospace: Al_define(content),
  strikethrough: Al_define(content),
  inserted: Al_define(),
  deleted: Al_define(),
  changed: Al_define(),
  invalid: Al_define(),
  meta,
  documentMeta: Al_define(meta),
  annotation: Al_define(meta),
  processingInstruction: Al_define(meta),
  definition: Al.defineModifier(`definition`),
  constant: Al.defineModifier(`constant`),
  function: Al.defineModifier(`function`),
  standard: Al.defineModifier(`standard`),
  local: Al.defineModifier(`local`),
  special: Al.defineModifier(`special`),
};
for (let e in X) {
  let t = X[e];
  if (t instanceof Al) {
    t.name = e;
  }
}
Rl([
  {
    tag: X.link,
    class: `tok-link`,
  },
  {
    tag: X.heading,
    class: `tok-heading`,
  },
  {
    tag: X.emphasis,
    class: `tok-emphasis`,
  },
  {
    tag: X.strong,
    class: `tok-strong`,
  },
  {
    tag: X.keyword,
    class: `tok-keyword`,
  },
  {
    tag: X.atom,
    class: `tok-atom`,
  },
  {
    tag: X.bool,
    class: `tok-bool`,
  },
  {
    tag: X.url,
    class: `tok-url`,
  },
  {
    tag: X.labelName,
    class: `tok-labelName`,
  },
  {
    tag: X.inserted,
    class: `tok-inserted`,
  },
  {
    tag: X.deleted,
    class: `tok-deleted`,
  },
  {
    tag: X.literal,
    class: `tok-literal`,
  },
  {
    tag: X.string,
    class: `tok-string`,
  },
  {
    tag: X.number,
    class: `tok-number`,
  },
  {
    tag: [X.regexp, X.escape, X.special(X.string)],
    class: `tok-string2`,
  },
  {
    tag: X.variableName,
    class: `tok-variableName`,
  },
  {
    tag: X.local(X.variableName),
    class: `tok-variableName tok-local`,
  },
  {
    tag: X.definition(X.variableName),
    class: `tok-variableName tok-definition`,
  },
  {
    tag: X.special(X.variableName),
    class: `tok-variableName2`,
  },
  {
    tag: X.definition(X.propertyName),
    class: `tok-propertyName tok-definition`,
  },
  {
    tag: X.typeName,
    class: `tok-typeName`,
  },
  {
    tag: X.namespace,
    class: `tok-namespace`,
  },
  {
    tag: X.className,
    class: `tok-className`,
  },
  {
    tag: X.macroName,
    class: `tok-macroName`,
  },
  {
    tag: X.propertyName,
    class: `tok-propertyName`,
  },
  {
    tag: X.operator,
    class: `tok-operator`,
  },
  {
    tag: X.comment,
    class: `tok-comment`,
  },
  {
    tag: X.meta,
    class: `tok-meta`,
  },
  {
    tag: X.invalid,
    class: `tok-invalid`,
  },
  {
    tag: X.punctuation,
    class: `tok-punctuation`,
  },
]);
const ru = new K();
function iu(languageData) {
  return A.define({
    combine: languageData ? (t) => t.concat(languageData) : undefined,
  });
}
const au = new K();
var ou = class {
  constructor(e, t, n = [], r = ``) {
    this.data = e;
    this.name = r;
    if (!N.prototype.hasOwnProperty(`tree`)) {
      Object.defineProperty(N.prototype, "tree", {
        get() {
          return Z(this);
        },
      });
    }
    this.parser = t;
    this.extension = [
      _u.of(this),
      N.languageData.of((e, t, n) => {
        let r = su(e, t, n);
        let i = r.type.prop(ru);
        if (!i) {
          return [];
        }
        let a = e.facet(i);
        let o = r.type.prop(au);
        if (o) {
          let i = r.resolve(t - r.from, n);
          for (let t of o) {
            if (t.test(i, e)) {
              let n = e.facet(t.facet);
              if (t.type == `replace`) {
                return n;
              }
              return n.concat(a);
            }
          }
        }
        return a;
      }),
    ].concat(n);
  }
  isActiveAt(e, t, n = -1) {
    return su(e, t, n).type.prop(ru) == this.data;
  }
  findRegions(e) {
    let t = e.facet(_u);
    if (t?.data == this.data) {
      return [
        {
          from: 0,
          to: e.doc.length,
        },
      ];
    }
    if (!t || !t.allowsNesting) {
      return [];
    }
    let n = [];
    let r = (e, t) => {
      if (e.prop(ru) == this.data) {
        n.push({
          from: t,
          to: t + e.length,
        });
        return;
      }
      let i = e.prop(K.mounted);
      if (i) {
        if (i.tree.prop(ru) == this.data) {
          if (i.overlay) {
            for (let e of i.overlay) {
              n.push({
                from: e.from + t,
                to: e.to + t,
              });
            }
          } else {
            n.push({
              from: t,
              to: t + e.length,
            });
          }
          return;
        }
        if (i.overlay) {
          let e = n.length;
          r(i.tree, i.overlay[0].from + t);
          if (n.length > e) {
            return;
          }
        }
      }
      for (let n = 0; n < e.children.length; n++) {
        let child = e.children[n];
        if (child instanceof J) {
          r(child, e.positions[n] + t);
        }
      }
    };
    r(Z(e), 0);
    return n;
  }
  get allowsNesting() {
    return true;
  }
};
ou.setState = j.define();
function su(e, t, n) {
  let r = e.facet(_u);
  let topNode = Z(e).topNode;
  if (!r || r.allowsNesting) {
    for (
      let e = topNode;
      e;
      e = e.enter(t, n, q.ExcludeBuffers | q.EnterBracketed)
    ) {
      if (e.type.isTop) {
        topNode = e;
      }
    }
  }
  return topNode;
}
const cu = class e extends ou {
  constructor(e, t, n) {
    super(e, t, [], n);
    this.parser = t;
  }
  static define(t) {
    let n = iu(t.languageData);
    return new e(
      n,
      t.parser.configure({
        props: [
          ru.add((e) => {
            if (e.isTop) {
              return n;
            }
          }),
        ],
      }),
      t.name,
    );
  }
  configure(t, n) {
    return new e(this.data, this.parser.configure(t), n || this.name);
  }
  get allowsNesting() {
    return this.parser.hasWrappers();
  }
};
function Z(e) {
  let t = e.field(ou.state, false);
  if (t) {
    return t.tree;
  }
  return J.empty;
}
class lu {
  constructor(e) {
    this.doc = e;
    this.cursorPos = 0;
    this.string = ``;
    this.cursor = e.iter();
  }
  get length() {
    return this.doc.length;
  }
  syncTo(e) {
    this.string = this.cursor.next(e - this.cursorPos).value;
    this.cursorPos = e + this.string.length;
    return this.cursorPos - this.string.length;
  }
  chunk(e) {
    this.syncTo(e);
    return this.string;
  }
  get lineChunks() {
    return true;
  }
  read(e, t) {
    let n = this.cursorPos - this.string.length;
    if (e < n || t >= this.cursorPos) {
      return this.doc.sliceString(e, t);
    }
    return this.string.slice(e - n, t - n);
  }
}
let uu = null;
const du = class e {
  constructor(e, t, n = [], r, i, a, o, s) {
    this.parser = e;
    this.state = t;
    this.fragments = n;
    this.tree = r;
    this.treeLen = i;
    this.viewport = a;
    this.skipped = o;
    this.scheduleOn = s;
    this.parse = null;
    this.tempSkipped = [];
  }
  static create(t, n, r) {
    return new e(t, n, [], J.empty, 0, r, [], null);
  }
  startParse() {
    return this.parser.startParse(new lu(this.state.doc), this.fragments);
  }
  work(e, t) {
    if (t != null && t >= this.state.doc.length) {
      t = undefined;
    }
    if (this.tree != J.empty && this.isDone(t ?? this.state.doc.length)) {
      return (this.takeTree(), true);
    }
    return this.withContext(() => {
      if (typeof e == `number`) {
        let t = Date.now() + e;
        e = () => Date.now() > t;
      }
      this.parse ||= this.startParse();
      if (
        t != null &&
        (this.parse.stoppedAt == null || this.parse.stoppedAt > t) &&
        t < this.state.doc.length
      ) {
        this.parse.stopAt(t);
      }
      while (true) {
        let n = this.parse.advance();
        if (n) {
          this.fragments = this.withoutTempSkipped(
            El.addTree(n, this.fragments, this.parse.stoppedAt != null),
          );
          this.treeLen = this.parse.stoppedAt ?? this.state.doc.length;
          this.tree = n;
          this.parse = null;
          if (this.treeLen < (t ?? this.state.doc.length)) {
            this.parse = this.startParse();
          } else {
            return true;
          }
        }
        if (e()) {
          return false;
        }
      }
    });
  }
  takeTree() {
    let e;
    let t;
    if (this.parse && (e = this.parse.parsedPos) >= this.treeLen) {
      if (this.parse.stoppedAt == null || this.parse.stoppedAt > e) {
        this.parse.stopAt(e);
      }
      this.withContext(() => {
        while (!(t = this.parse.advance()));
      });
      this.treeLen = e;
      this.tree = t;
      this.fragments = this.withoutTempSkipped(
        El.addTree(this.tree, this.fragments, true),
      );
      this.parse = null;
    }
  }
  withContext(e) {
    let t = uu;
    uu = this;
    try {
      return e();
    } finally {
      uu = t;
    }
  }
  withoutTempSkipped(e) {
    for (let t; (t = this.tempSkipped.pop());) {
      e = fu(e, t.from, t.to);
    }
    return e;
  }
  changes(t, n) {
    let { fragments, tree, treeLen, viewport, skipped } = this;
    this.takeTree();
    if (!t.empty) {
      let e = [];
      t.iterChangedRanges((fromA, toA, fromB, toB) =>
        e.push({
          fromA,
          toA,
          fromB,
          toB,
        }),
      );
      fragments = El.applyChanges(fragments, e);
      tree = J.empty;
      treeLen = 0;
      viewport = {
        from: t.mapPos(viewport.from, -1),
        to: t.mapPos(viewport.to, 1),
      };
      if (this.skipped.length) {
        skipped = [];
        for (let e of this.skipped) {
          let n = t.mapPos(e.from, 1);
          let r = t.mapPos(e.to, -1);
          if (n < r) {
            skipped.push({
              from: n,
              to: r,
            });
          }
        }
      }
    }
    return new e(
      this.parser,
      n,
      fragments,
      tree,
      treeLen,
      viewport,
      skipped,
      this.scheduleOn,
    );
  }
  updateViewport(e) {
    if (this.viewport.from == e.from && this.viewport.to == e.to) {
      return false;
    }
    this.viewport = e;
    let length = this.skipped.length;
    for (let t = 0; t < this.skipped.length; t++) {
      let { from, to } = this.skipped[t];
      if (from < e.to && to > e.from) {
        this.fragments = fu(this.fragments, from, to);
        this.skipped.splice(t--, 1);
      }
    }
    if (this.skipped.length >= length) {
      return false;
    }
    return (this.reset(), true);
  }
  reset() {
    this.parse &&= (this.takeTree(), null);
  }
  skipUntilInView(e, t) {
    this.skipped.push({
      from: e,
      to: t,
    });
  }
  static getSkippingParser(e) {
    return new (class extends Dl {
      createParse(t, n, r) {
        let from = r[0].from;
        let a = r[r.length - 1].to;
        return {
          parsedPos: from,
          advance() {
            let t = uu;
            if (t) {
              for (let e of r) {
                t.tempSkipped.push(e);
              }
              if (e) {
                t.scheduleOn = t.scheduleOn
                  ? Promise.all([t.scheduleOn, e])
                  : e;
              }
            }
            this.parsedPos = a;
            return new J(rl.none, [], [], a - from);
          },
          stoppedAt: null,
          stopAt() {},
        };
      }
    })();
  }
  isDone(e) {
    e = Math.min(e, this.state.doc.length);
    let fragments = this.fragments;
    return (
      this.treeLen >= e &&
      fragments.length &&
      fragments[0].from == 0 &&
      fragments[0].to >= e
    );
  }
  static get() {
    return uu;
  }
};
function fu(e, from, n) {
  return El.applyChanges(e, [
    {
      fromA: from,
      toA: n,
      fromB: from,
      toB: n,
    },
  ]);
}
const pu = class e {
  constructor(e) {
    this.context = e;
    this.tree = e.tree;
  }
  apply(t) {
    if (!t.docChanged && this.tree == this.context.tree) {
      return this;
    }
    let n = this.context.changes(t.changes, t.state);
    let r =
      this.context.treeLen == t.startState.doc.length
        ? undefined
        : Math.max(t.changes.mapPos(this.context.treeLen), n.viewport.to);
    if (!n.work(20, r)) {
      n.takeTree();
    }
    return new e(n);
  }
  static init(t) {
    let n = Math.min(3000, t.doc.length);
    let r = du.create(t.facet(_u).parser, t, {
      from: 0,
      to: n,
    });
    if (!r.work(20, n)) {
      r.takeTree();
    }
    return new e(r);
  }
};
ou.state = Te.define({
  create: pu.init,
  update(e, t) {
    for (let e of t.effects) {
      if (e.is(ou.setState)) {
        return e.value;
      }
    }
    if (t.startState.facet(_u) == t.state.facet(_u)) {
      return e.apply(t);
    }
    return pu.init(t.state);
  },
});
let mu = (e) => {
  let t = setTimeout(() => e(), 500);
  return () => clearTimeout(t);
};
if (typeof requestIdleCallback < `u`) {
  mu = (e) => {
    let t = -1;
    let n = setTimeout(() => {
      t = requestIdleCallback(e, {
        timeout: 400,
      });
    }, 100);
    return () => {
      if (t < 0) {
        return clearTimeout(n);
      }
      return cancelIdleCallback(t);
    };
  };
}
const hu =
  typeof navigator < `u` && navigator.scheduling?.isInputPending
    ? () => navigator.scheduling.isInputPending()
    : null;
const gu = H.fromClass(
  class {
    constructor(e) {
      this.view = e;
      this.working = null;
      this.workScheduled = 0;
      this.chunkEnd = -1;
      this.chunkBudget = -1;
      this.work = this.work.bind(this);
      this.scheduleWork();
    }
    update(e) {
      let context = this.view.state.field(ou.state).context;
      if (
        context.updateViewport(e.view.viewport) ||
        this.view.viewport.to > context.treeLen
      ) {
        this.scheduleWork();
      }
      if (e.docChanged || e.selectionSet) {
        if (this.view.hasFocus) {
          this.chunkBudget += 50;
        }
        this.scheduleWork();
      }
      this.checkAsyncSchedule(context);
    }
    scheduleWork() {
      if (this.working) {
        return;
      }
      let { state } = this.view;
      let t = state.field(ou.state);
      if (t.tree != t.context.tree || !t.context.isDone(state.doc.length)) {
        this.working = mu(this.work);
      }
    }
    work(e) {
      this.working = null;
      let t = Date.now();
      if (this.chunkEnd < t && (this.chunkEnd < 0 || this.view.hasFocus)) {
        this.chunkEnd = t + 30000;
        this.chunkBudget = 3000;
      }
      if (this.chunkBudget <= 0) {
        return;
      }
      let {
        state,
        viewport: { to },
      } = this.view;
      let i = state.field(ou.state);
      if (i.tree == i.context.tree && i.context.isDone(to + 100000)) {
        return;
      }
      let a =
        Date.now() +
        Math.min(
          this.chunkBudget,
          100,
          e && !hu ? Math.max(25, e.timeRemaining() - 5) : 1000000000,
        );
      let o = i.context.treeLen < to && state.doc.length > to + 1000;
      let s = i.context.work(
        () => (hu && hu()) || Date.now() > a,
        to + (o ? 0 : 100000),
      );
      this.chunkBudget -= Date.now() - t;
      if (s || this.chunkBudget <= 0) {
        i.context.takeTree();
        this.view.dispatch({
          effects: ou.setState.of(new pu(i.context)),
        });
      }
      if (this.chunkBudget > 0 && (!s || o)) {
        this.scheduleWork();
      }
      this.checkAsyncSchedule(i.context);
    }
    checkAsyncSchedule(e) {
      e.scheduleOn &&=
        (this.workScheduled++,
        e.scheduleOn
          .then(() => this.scheduleWork())
          .catch((e) => Sr(this.view.state, e))
          .then(() => this.workScheduled--),
        null);
    }
    destroy() {
      if (this.working) {
        this.working();
      }
    }
    isWorking() {
      return !!(this.working || this.workScheduled > 0);
    }
  },
  {
    eventHandlers: {
      focus() {
        this.scheduleWork();
      },
    },
  },
);
var _u = A.define({
  combine(e) {
    if (e.length) {
      return e[0];
    }
    return null;
  },
  enables: (e) => [
    ou.state,
    gu,
    G.contentAttributes.compute([e], (t) => {
      let n = t.facet(e);
      if (n && n.name) {
        return {
          "data-language": n.name,
        };
      }
      return {};
    }),
  ],
});
class vu {
  constructor(e, t = []) {
    this.language = e;
    this.support = t;
    this.extension = [e, t];
  }
}
const yu = A.define();
const bu = A.define({
  combine: (e) => {
    if (!e.length) {
      return `  `;
    }
    let t = e[0];
    if (!t || /\S/.test(t) || Array.from(t).some((e) => e != t[0])) {
      throw Error(`Invalid indent unit: ` + JSON.stringify(e[0]));
    }
    return t;
  },
});
function xu(e) {
  let t = e.facet(bu);
  if (t.charCodeAt(0) == 9) {
    return e.tabSize * t.length;
  }
  return t.length;
}
function Su(state, t) {
  let n = ``;
  let e_tabSize = state.tabSize;
  let i = state.facet(bu)[0];
  if (i == `	`) {
    while (t >= e_tabSize) {
      n += `	`;
      t -= e_tabSize;
    }
    i = ` `;
  }
  for (let e = 0; e < t; e++) {
    n += i;
  }
  return n;
}
function Cu(e, from) {
  if (e instanceof N) {
    e = new wu(e);
  }
  for (let n of e.state.facet(yu)) {
    let r = n(e, from);
    if (r !== undefined) {
      return r;
    }
  }
  let n = Z(e.state);
  if (n.length >= from) {
    return Eu(e, n, from);
  }
  return null;
}
var wu = class {
  constructor(e, t = {}) {
    this.state = e;
    this.options = t;
    this.unit = xu(e);
  }
  lineAt(e, t = 1) {
    let n = this.state.doc.lineAt(e);
    let { simulateBreak, simulateDoubleBreak } = this.options;
    if (
      simulateBreak != null &&
      simulateBreak >= n.from &&
      simulateBreak <= n.to
    ) {
      if (simulateDoubleBreak && simulateBreak == e) {
        return {
          text: ``,
          from: e,
        };
      }
      if (t < 0 ? simulateBreak < e : simulateBreak <= e) {
        return {
          text: n.text.slice(simulateBreak - n.from),
          from: simulateBreak,
        };
      }
      return {
        text: n.text.slice(0, simulateBreak - n.from),
        from: n.from,
      };
    }
    return n;
  }
  textAfterPos(e, t = 1) {
    if (this.options.simulateDoubleBreak && e == this.options.simulateBreak) {
      return ``;
    }
    let { text, from } = this.lineAt(e, t);
    return text.slice(e - from, Math.min(text.length, e + 100 - from));
  }
  column(e, t = 1) {
    let { text, from } = this.lineAt(e, t);
    let i = this.countColumn(text, e - from);
    let a = this.options.overrideIndentation
      ? this.options.overrideIndentation(from)
      : -1;
    if (a > -1) {
      i += a - this.countColumn(text, text.search(/\S|$/));
    }
    return i;
  }
  countColumn(e, t = e.length) {
    return wt(e, this.state.tabSize, t);
  }
  lineIndent(e, t = 1) {
    let { text, from } = this.lineAt(e, t);
    let overrideIndentation = this.options.overrideIndentation;
    if (overrideIndentation) {
      let e = overrideIndentation(from);
      if (e > -1) {
        return e;
      }
    }
    return this.countColumn(text, text.search(/\S|$/));
  }
  get simulatedBreak() {
    return this.options.simulateBreak || null;
  }
};
const Tu = new K();
function Eu(e, t, n) {
  let next = t.resolveStack(n);
  let i = t.resolveInner(n, -1).resolve(n, 0).enterUnfinishedNodesBefore(n);
  if (i != next.node) {
    let e = [];
    for (
      let t = i;
      t &&
      !(
        t.from < next.node.from ||
        t.to > next.node.to ||
        (t.from == next.node.from && t.type == next.node.type)
      );
      t = t.parent
    ) {
      e.push(t);
    }
    for (let t = e.length - 1; t >= 0; t--) {
      next = {
        node: e[t],
        next,
      };
    }
  }
  return Du(next, e, n);
}
function Du(next, t, n) {
  for (let r = next; r; r = r.next) {
    let e = ku(r.node);
    if (e) {
      return e(ju.create(t, n, r));
    }
  }
  return 0;
}
function Ou(e) {
  return e.pos == e.options.simulateBreak && e.options.simulateDoubleBreak;
}
function ku(node) {
  let t = node.type.prop(Tu);
  if (t) {
    return t;
  }
  let e_firstChild = node.firstChild;
  let r;
  if (e_firstChild && (r = e_firstChild.type.prop(K.closedBy))) {
    let t = node.lastChild;
    let n = t && r.indexOf(t.name) > -1;
    return (e) => Fu(e, true, 1, undefined, n && !Ou(e) ? t.from : undefined);
  }
  if (node.parent == null) {
    return Au;
  }
  return null;
}
function Au() {
  return 0;
}
var ju = class e extends wu {
  constructor(e, t, n) {
    super(e.state, e.options);
    this.base = e;
    this.pos = t;
    this.context = n;
  }
  get node() {
    return this.context.node;
  }
  static create(t, n, r) {
    return new e(t, n, r);
  }
  get textAfter() {
    return this.textAfterPos(this.pos);
  }
  get baseIndent() {
    return this.baseIndentFor(this.node);
  }
  baseIndentFor(e) {
    let t = this.state.doc.lineAt(e.from);
    while (true) {
      let n = e.resolve(t.from);
      while (n.parent && n.parent.from == n.from) {
        n = n.parent;
      }
      if (Mu(n, e)) {
        break;
      }
      t = this.state.doc.lineAt(n.from);
    }
    return this.lineIndent(t.from);
  }
  continue() {
    return Du(this.context.next, this.base, this.pos);
  }
};
function Mu(e, t) {
  for (let n = t; n; n = n.parent) {
    if (e == n) {
      return true;
    }
  }
  return false;
}
function Nu(e) {
  let e_node = e.node;
  let n = e_node.childAfter(e_node.from);
  let t_lastChild = e_node.lastChild;
  if (!n) {
    return null;
  }
  let simulateBreak = e.options.simulateBreak;
  let a = e.state.doc.lineAt(n.from);
  let o =
    simulateBreak == null || simulateBreak <= a.from
      ? a.to
      : Math.min(a.to, simulateBreak);
  for (let e = n.to; ;) {
    let i = e_node.childAfter(e);
    if (!i || i == t_lastChild) {
      return null;
    }
    if (!i.type.isSkipped) {
      if (i.from >= o) {
        return null;
      }
      let e = /^ */.exec(a.text.slice(n.to - a.from))[0].length;
      return {
        from: n.from,
        to: n.to + e,
      };
    }
    e = i.to;
  }
}
function Pu({ closing, align = true, units = 1 }) {
  return (r) => Fu(r, align, units, closing);
}
function Fu(e, t, n, r, i) {
  let e_textAfter = e.textAfter;
  let length = e_textAfter.match(/^\s*/)[0].length;
  let s =
    (r && e_textAfter.slice(length, length + r.length) == r) ||
    i == e.pos + length;
  let c = t ? Nu(e) : null;
  if (c) {
    if (s) {
      return e.column(c.from);
    }
    return e.column(c.to);
  }
  return e.baseIndent + (s ? 0 : e.unit * n);
}
const Iu = 200;
function Lu() {
  return N.transactionFilter.of((e) => {
    if (
      !e.docChanged ||
      (!e.isUserEvent(`input.type`) && !e.isUserEvent(`input.complete`))
    ) {
      return e;
    }
    let t = e.startState.languageDataAt(
      `indentOnInput`,
      e.startState.selection.main.head,
    );
    if (!t.length) {
      return e;
    }
    let e_newDoc = e.newDoc;
    let { head } = e.newSelection.main;
    let i = e_newDoc.lineAt(head);
    if (head > i.from + Iu) {
      return e;
    }
    let a = e_newDoc.sliceString(i.from, head);
    if (!t.some((e) => e.test(a))) {
      return e;
    }
    let { state } = e;
    let s = -1;
    let c = [];
    for (let { head: head_1 } of state.selection.ranges) {
      let t = state.doc.lineAt(head_1);
      if (t.from == s) {
        continue;
      }
      s = t.from;
      let n = Cu(state, t.from);
      if (n == null) {
        continue;
      }
      let r = /^\s*/.exec(t.text)[0];
      let i = Su(state, n);
      if (r != i) {
        c.push({
          from: t.from,
          to: t.from + r.length,
          insert: i,
        });
      }
    }
    if (c.length) {
      return [
        e,
        {
          changes: c,
          sequential: true,
        },
      ];
    }
    return e;
  });
}
const Ru = A.define();
const zu = new K();
function Bu(e) {
  let e_firstChild = e.firstChild;
  let e_lastChild = e.lastChild;
  if (e_firstChild && e_firstChild.to < e_lastChild.from) {
    return {
      from: e_firstChild.to,
      to: e_lastChild.type.isError ? e.to : e_lastChild.from,
    };
  }
  return null;
}
function Vu(e, t, n) {
  let r = Z(e);
  if (r.length < n) {
    return null;
  }
  let i = r.resolveStack(n, 1);
  let a = null;
  for (let o = i; o; o = o.next) {
    let i = o.node;
    if (i.to <= n || i.from > n) {
      continue;
    }
    if (a && i.from < t) {
      break;
    }
    let s = i.type.prop(zu);
    if (s && (i.to < r.length - 50 || r.length == e.doc.length || !Hu(i))) {
      let r = s(i, e);
      if (r && r.from <= n && r.from >= t && r.to > n) {
        a = r;
      }
    }
  }
  return a;
}
function Hu(e) {
  let e_lastChild = e.lastChild;
  return e_lastChild && e_lastChild.to == e.to && e_lastChild.type.isError;
}
function Uu(state, from, n) {
  for (let r of state.facet(Ru)) {
    let i = r(state, from, n);
    if (i) {
      return i;
    }
  }
  return Vu(state, from, n);
}
function map(e, t) {
  let n = t.mapPos(e.from, 1);
  let r = t.mapPos(e.to, -1);
  if (n >= r) {
    return undefined;
  }
  return {
    from: n,
    to: r,
  };
}
const Gu = j.define({
  map,
});
const Ku = j.define({
  map,
});
function qu(e) {
  let t = [];
  for (let { head } of e.state.selection.ranges) {
    if (!t.some((e) => e.from <= head && e.to >= head)) {
      t.push(e.lineBlockAt(head));
    }
  }
  return t;
}
const Ju = Te.define({
  create() {
    return z.none;
  },
  update(e, t) {
    if (t.isUserEvent(`delete`)) {
      t.changes.iterChangedRanges((t, n) => (e = Yu(e, t, n)));
    }
    e = e.map(t.changes);
    let n = [];
    for (let r of t.effects) {
      if (r.is(Gu) && !Zu(e, r.value.from, r.value.to)) {
        n.push(r.value);
      } else if (r.is(Ku)) {
        e = e.update({
          filter: (e, t) => r.value.from != e || r.value.to != t,
          filterFrom: r.value.from,
          filterTo: r.value.to,
        });
      }
    }
    if (n.length) {
      let { preparePlaceholder } = t.state.facet(id);
      let add = n.map((e) =>
        (preparePlaceholder
          ? z.replace({
              widget: new cd(preparePlaceholder(t.state, e)),
            })
          : sd
        ).range(e.from, e.to),
      );
      e = e.update({
        add,
      });
    }
    if (t.selection) {
      e = Yu(e, t.selection.main.head);
    }
    return e;
  },
  provide: (e) => G.decorations.from(e),
  toJSON(e, t) {
    let n = [];
    e.between(0, t.doc.length, (e, t) => {
      n.push(e, t);
    });
    return n;
  },
  fromJSON(e) {
    if (!Array.isArray(e) || e.length % 2) {
      throw RangeError(`Invalid JSON for fold state`);
    }
    let t = [];
    for (let n = 0; n < e.length;) {
      let r = e[n++];
      let i = e[n++];
      if (typeof r != `number` || typeof i != `number`) {
        throw RangeError(`Invalid JSON for fold state`);
      }
      t.push(sd.range(r, i));
    }
    return z.set(t, true);
  },
});
function Yu(e, t, n = t) {
  let r = false;
  e.between(t, n, (e, i) => {
    if (e < n && i > t) {
      r = true;
    }
  });
  if (r) {
    return e.update({
      filterFrom: t,
      filterTo: n,
      filter: (e, r) => e >= n || r <= t,
    });
  }
  return e;
}
function Xu(state, from, n) {
  let r;
  let i = null;
  if (!((r = state.field(Ju, false)) == null)) {
    r.between(from, n, (e, t) => {
      if (!i || i.from > e) {
        i = {
          from: e,
          to: t,
        };
      }
    });
  }
  return i;
}
function Zu(e, from, n) {
  let r = false;
  e.between(from, from, (e, i) => {
    if (e == from && i == n) {
      r = true;
    }
  });
  return r;
}
function Qu(state, t) {
  if (state.field(Ju, false)) {
    return t;
  }
  return t.concat(j.appendConfig.of(ad()));
}
const $u = (e) => {
  for (let t of qu(e)) {
    let n = Uu(e.state, t.from, t.to);
    if (n) {
      e.dispatch({
        effects: Qu(e.state, [Gu.of(n), td(e, n)]),
      });
      return true;
    }
  }
  return false;
};
const ed = (e) => {
  if (!e.state.field(Ju, false)) {
    return false;
  }
  let t = [];
  for (let n of qu(e)) {
    let r = Xu(e.state, n.from, n.to);
    if (r) {
      t.push(Ku.of(r), td(e, r, false));
    }
  }
  if (t.length) {
    e.dispatch({
      effects: t,
    });
  }
  return t.length > 0;
};
function td(e, t, n = true) {
  let number = e.state.doc.lineAt(t.from).number;
  let number_1 = e.state.doc.lineAt(t.to).number;
  return G.announce.of(
    `${e.state.phrase(n ? `Folded lines` : `Unfolded lines`)} ${number} ${e.state.phrase(`to`)} ${number_1}.`,
  );
}
const nd = [
  {
    key: `Ctrl-Shift-[`,
    mac: `Cmd-Alt-[`,
    run: $u,
  },
  {
    key: `Ctrl-Shift-]`,
    mac: `Cmd-Alt-]`,
    run: ed,
  },
  {
    key: `Ctrl-Alt-[`,
    run: (e) => {
      let { state } = e;
      let n = [];
      for (let r = 0; r < state.doc.length;) {
        let i = e.lineBlockAt(r);
        let a = Uu(state, i.from, i.to);
        if (a) {
          n.push(Gu.of(a));
        }
        r = (a ? e.lineBlockAt(a.to) : i).to + 1;
      }
      if (n.length) {
        e.dispatch({
          effects: Qu(e.state, n),
        });
      }
      return !!n.length;
    },
  },
  {
    key: `Ctrl-Alt-]`,
    run: (e) => {
      let t = e.state.field(Ju, false);
      if (!t || !t.size) {
        return false;
      }
      let n = [];
      t.between(0, e.state.doc.length, (e, t) => {
        n.push(
          Ku.of({
            from: e,
            to: t,
          }),
        );
      });
      e.dispatch({
        effects: n,
      });
      return true;
    },
  },
];
const rd = {
  placeholderDOM: null,
  preparePlaceholder: null,
  placeholderText: `…`,
};
var id = A.define({
  combine(e) {
    return at(e, rd);
  },
});
function ad(e) {
  let t = [Ju, fd];
  if (e) {
    t.push(id.of(e));
  }
  return t;
}
function od(e, t) {
  let { state } = e;
  let r = state.facet(id);
  let i = (t) => {
    let n = e.lineBlockAt(e.posAtDOM(t.target));
    let r = Xu(e.state, n.from, n.to);
    if (r) {
      e.dispatch({
        effects: Ku.of(r),
      });
    }
    t.preventDefault();
  };
  if (r.placeholderDOM) {
    return r.placeholderDOM(e, i, t);
  }
  let a = document.createElement(`span`);
  a.textContent = r.placeholderText;
  a.setAttribute(`aria-label`, state.phrase(`folded code`));
  a.title = state.phrase(`unfold`);
  a.className = `cm-foldPlaceholder`;
  a.onclick = i;
  return a;
}
var sd = z.replace({
  widget: new (class extends rn {
    toDOM(e) {
      return od(e, null);
    }
  })(),
});
var cd = class extends rn {
  constructor(e) {
    super();
    this.value = e;
  }
  eq(e) {
    return this.value == e.value;
  }
  toDOM(e) {
    return od(e, this.value);
  }
};
const ld = {
  openText: `⌄`,
  closedText: `›`,
  markerDOM: null,
  domEventHandlers: {},
  foldingChanged: () => false,
};
class ud extends Ec {
  constructor(e, t) {
    super();
    this.config = e;
    this.open = t;
  }
  eq(e) {
    return this.config == e.config && this.open == e.open;
  }
  toDOM(e) {
    if (this.config.markerDOM) {
      return this.config.markerDOM(this.open);
    }
    let t = document.createElement(`span`);
    t.textContent = this.open ? this.config.openText : this.config.closedText;
    t.title = e.state.phrase(this.open ? `Fold line` : `Unfold line`);
    return t;
  }
}
function dd(e = {}) {
  let t = {
    ...ld,
    ...e,
  };
  let n = new ud(t, true);
  let r = new ud(t, false);
  let i = H.fromClass(
    class {
      constructor(e) {
        this.from = e.viewport.from;
        this.markers = this.buildMarkers(e);
      }
      update(e) {
        if (
          e.docChanged ||
          e.viewportChanged ||
          e.startState.facet(_u) != e.state.facet(_u) ||
          e.startState.field(Ju, false) != e.state.field(Ju, false) ||
          Z(e.startState) != Z(e.state) ||
          t.foldingChanged(e)
        ) {
          this.markers = this.buildMarkers(e.view);
        }
      }
      buildMarkers(e) {
        let t = new pt();
        for (let i of e.viewportLineBlocks) {
          let a = Xu(e.state, i.from, i.to)
            ? r
            : Uu(e.state, i.from, i.to)
              ? n
              : null;
          if (a) {
            t.add(i.from, i.from, a);
          }
        }
        return t.finish();
      }
    },
  );
  let { domEventHandlers } = t;
  return [
    i,
    jc({
      class: `cm-foldGutter`,
      markers(e) {
        return e.plugin(i)?.markers || P.empty;
      },
      initialSpacer() {
        return new ud(t, false);
      },
      domEventHandlers: {
        ...domEventHandlers,
        click: (e, t, n) => {
          if (domEventHandlers.click && domEventHandlers.click(e, t, n)) {
            return true;
          }
          let r = Xu(e.state, t.from, t.to);
          if (r) {
            e.dispatch({
              effects: Ku.of(r),
            });
            return true;
          }
          let i = Uu(e.state, t.from, t.to);
          if (i) {
            return (
              e.dispatch({
                effects: Gu.of(i),
              }),
              true
            );
          }
          return false;
        },
      },
    }),
    ad(),
  ];
}
var fd = G.baseTheme({
  ".cm-foldPlaceholder": {
    backgroundColor: `#eee`,
    border: `1px solid #ddd`,
    color: `#888`,
    borderRadius: `.2em`,
    margin: `0 1px`,
    padding: `0 1px`,
    cursor: `pointer`,
  },
  ".cm-foldGutter span": {
    padding: `0 1px`,
    cursor: `pointer`,
  },
});
const pd = class e {
  constructor(e, t) {
    this.specs = e;
    let n;
    function r(e) {
      let t = At.newName();
      n ||= Object.create(null);
      n[`.` + t] = e;
      return t;
    }
    let all = typeof t.all == `string` ? t.all : t.all ? r(t.all) : undefined;
    let a = t.scope;
    this.scope =
      a instanceof ou
        ? (e) => e.prop(ru) == a.data
        : a
          ? (e) => e == a
          : undefined;
    this.style = Rl(
      e.map((e) => ({
        tag: e.tag,
        class:
          e.class ||
          r({
            ...e,
            tag: null,
          }),
      })),
      {
        all,
      },
    ).style;
    this.module = n ? new At(n) : null;
    this.themeType = t.themeType;
  }
  static define(t, n) {
    return new e(t, n || {});
  }
};
const md = A.define();
const hd = A.define({
  combine(e) {
    if (e.length) {
      return [e[0]];
    }
    return null;
  },
});
function gd(e) {
  let t = e.facet(md);
  if (t.length) {
    return t;
  }
  return e.facet(hd);
}
function _d(e, t) {
  let n = [yd];
  let r;
  if (e instanceof pd) {
    if (e.module) {
      n.push(G.styleModule.of(e.module));
    }
    r = e.themeType;
  }
  if (t?.fallback) {
    n.push(hd.of(e));
  } else if (r) {
    n.push(
      md.computeN([G.darkTheme], (t) => {
        if (t.facet(G.darkTheme) == (r == `dark`)) {
          return [e];
        }
        return [];
      }),
    );
  } else {
    n.push(md.of(e));
  }
  return n;
}
class vd {
  constructor(e) {
    this.markCache = Object.create(null);
    this.tree = Z(e.state);
    this.decorations = this.buildDeco(e, gd(e.state));
    this.decoratedTo = e.viewport.to;
  }
  update(e) {
    let t = Z(e.state);
    let n = gd(e.state);
    let r = n != gd(e.startState);
    let { viewport } = e.view;
    let a = e.changes.mapPos(this.decoratedTo, 1);
    if (
      t.length < viewport.to &&
      !r &&
      t.type == this.tree.type &&
      a >= viewport.to
    ) {
      this.decorations = this.decorations.map(e.changes);
      this.decoratedTo = a;
    } else if (t != this.tree || e.viewportChanged || r) {
      this.tree = t;
      this.decorations = this.buildDeco(e.view, n);
      this.decoratedTo = viewport.to;
    }
  }
  buildDeco(e, t) {
    if (!t || !this.tree.length) {
      return z.none;
    }
    let n = new pt();
    for (let { from, to } of e.visibleRanges) {
      Bl(
        this.tree,
        t,
        (e, t, r) => {
          n.add(
            e,
            t,
            this.markCache[r] ||
              (this.markCache[r] = z.mark({
                class: r,
              })),
          );
        },
        from,
        to,
      );
    }
    return n.finish();
  }
}
var yd = Oe.high(
  H.fromClass(vd, {
    decorations: (e) => e.decorations,
  }),
);
const bd = pd.define([
  {
    tag: X.meta,
    color: `#404740`,
  },
  {
    tag: X.link,
    textDecoration: `underline`,
  },
  {
    tag: X.heading,
    textDecoration: `underline`,
    fontWeight: `bold`,
  },
  {
    tag: X.emphasis,
    fontStyle: `italic`,
  },
  {
    tag: X.strong,
    fontWeight: `bold`,
  },
  {
    tag: X.strikethrough,
    textDecoration: `line-through`,
  },
  {
    tag: X.keyword,
    color: `#708`,
  },
  {
    tag: [X.atom, X.bool, X.url, X.contentSeparator, X.labelName],
    color: `#219`,
  },
  {
    tag: [X.literal, X.inserted],
    color: `#164`,
  },
  {
    tag: [X.string, X.deleted],
    color: `#a11`,
  },
  {
    tag: [X.regexp, X.escape, X.special(X.string)],
    color: `#e40`,
  },
  {
    tag: X.definition(X.variableName),
    color: `#00f`,
  },
  {
    tag: X.local(X.variableName),
    color: `#30a`,
  },
  {
    tag: [X.typeName, X.namespace],
    color: `#085`,
  },
  {
    tag: X.className,
    color: `#167`,
  },
  {
    tag: [X.special(X.variableName), X.macroName],
    color: `#256`,
  },
  {
    tag: X.definition(X.propertyName),
    color: `#00c`,
  },
  {
    tag: X.comment,
    color: `#940`,
  },
  {
    tag: X.invalid,
    color: `#f00`,
  },
]);
const xd = G.baseTheme({
  "&.cm-focused .cm-matchingBracket": {
    backgroundColor: `#328c8252`,
  },
  "&.cm-focused .cm-nonmatchingBracket": {
    backgroundColor: `#bb555544`,
  },
});
const maxScanDistance = 10000;
const brackets = `()[]{}`;
const wd = A.define({
  combine(e) {
    return at(e, {
      afterCursor: true,
      brackets,
      maxScanDistance,
      renderMatch,
    });
  },
});
var Td = z.mark({
  class: `cm-matchingBracket`,
});
var Ed = z.mark({
  class: `cm-nonmatchingBracket`,
});
function renderMatch(e) {
  let t = [];
  let n = e.matched ? Td : Ed;
  t.push(n.range(e.start.from, e.start.to));
  if (e.end) {
    t.push(n.range(e.end.from, e.end.to));
  }
  return t;
}
function Od(state) {
  let t = [];
  let n = state.facet(wd);
  for (let r of state.selection.ranges) {
    if (!r.empty) {
      continue;
    }
    let i =
      Pd(state, r.head, -1, n) ||
      (r.head > 0 && Pd(state, r.head - 1, 1, n)) ||
      (n.afterCursor &&
        (Pd(state, r.head, 1, n) ||
          (r.head < state.doc.length && Pd(state, r.head + 1, -1, n))));
    if (i) {
      t = t.concat(n.renderMatch(i, state));
    }
  }
  return z.set(t, true);
}
const kd = [
  H.fromClass(
    class {
      constructor(e) {
        this.paused = false;
        this.decorations = Od(e.state);
      }
      update(e) {
        (e.docChanged || e.selectionSet || this.paused) &&
          (e.view.composing
            ? ((this.decorations = this.decorations.map(e.changes)),
              (this.paused = true))
            : ((this.decorations = Od(e.state)), (this.paused = false)));
      }
    },
    {
      decorations: (e) => e.decorations,
    },
  ),
  xd,
];
function Ad(e = {}) {
  return [wd.of(e), kd];
}
var jd = new K();
function Md(type, t, n) {
  let r = type.prop(t < 0 ? K.openedBy : K.closedBy);
  if (r) {
    return r;
  }
  if (type.name.length == 1) {
    let r = n.indexOf(type.name);
    if (r > -1 && r % 2 == +(t < 0)) {
      return [n[r + t]];
    }
  }
  return null;
}
function Nd(e) {
  let t = e.type.prop(jd);
  if (t) {
    return t(e.node);
  }
  return e;
}
function Pd(e, t, n, r = {}) {
  let i = r.maxScanDistance || maxScanDistance;
  let a = r.brackets || brackets;
  let o = Z(e);
  let s = o.resolveInner(t, n);
  for (let r = s; r; r = r.parent) {
    let i = Md(r.type, n, a);
    if (i && r.from < r.to) {
      let o = Nd(r);
      if (o && (n > 0 ? t >= o.from && t < o.to : t > o.from && t <= o.to)) {
        return Fd(e, t, n, r, o, i, a);
      }
    }
  }
  return Id(e, t, n, o, s.type, i, a);
}
function Fd(e, t, n, r, i, a, o) {
  let r_parent = r.parent;
  let c = {
    from: i.from,
    to: i.to,
  };
  let l = 0;
  let u = r_parent?.cursor();
  if (u && (n < 0 ? u.childBefore(r.from) : u.childAfter(r.to))) {
    do {
      if (n < 0 ? u.to <= r.from : u.from >= r.to) {
        if (l == 0 && a.indexOf(u.type.name) > -1 && u.from < u.to) {
          let e = Nd(u);
          return {
            start: c,
            end: e
              ? {
                  from: e.from,
                  to: e.to,
                }
              : undefined,
            matched: true,
          };
        }
        if (Md(u.type, n, o)) {
          l++;
        } else if (Md(u.type, -n, o)) {
          if (l == 0) {
            let e = Nd(u);
            return {
              start: c,
              end:
                e && e.from < e.to
                  ? {
                      from: e.from,
                      to: e.to,
                    }
                  : undefined,
              matched: false,
            };
          }
          l--;
        }
      }
    } while (n < 0 ? u.prevSibling() : u.nextSibling());
  }
  return {
    start: c,
    matched: false,
  };
}
function Id(e, t, n, r, type, a, o) {
  if (n < 0 ? !t : t == e.doc.length) {
    return null;
  }
  let s = n < 0 ? e.sliceDoc(t - 1, t) : e.sliceDoc(t, t + 1);
  let c = o.indexOf(s);
  if (c < 0 || (c % 2 == 0) != n > 0) {
    return null;
  }
  let l = {
    from: n < 0 ? t - 1 : t,
    to: n > 0 ? t + 1 : t,
  };
  let u = e.doc.iterRange(t, n > 0 ? e.doc.length : 0);
  let d = 0;
  for (let e = 0; !u.next().done && e <= a;) {
    let a = u.value;
    if (n < 0) {
      e += a.length;
    }
    let s = t + e * n;
    for (
      let e = n > 0 ? 0 : a.length - 1, t = n > 0 ? a.length : -1;
      e != t;
      e += n
    ) {
      let t = o.indexOf(a[e]);
      if (!(t < 0 || r.resolveInner(s + e, 1).type != type)) {
        if ((t % 2 == 0) == n > 0) {
          d++;
        } else if (d == 1) {
          return {
            start: l,
            end: {
              from: s + e,
              to: s + e + 1,
            },
            matched: t >> 1 == c >> 1,
          };
        } else {
          d--;
        }
      }
    }
    if (n > 0) {
      e += a.length;
    }
  }
  if (u.done) {
    return {
      start: l,
      matched: false,
    };
  }
  return null;
}
const Ld = Object.create(null);
const Rd = [rl.none];
const zd = [];
const Bd = Object.create(null);
const Vd = Object.create(null);
for (let [e, t] of [
  [`variable`, `variableName`],
  [`variable-2`, `variableName.special`],
  [`string-2`, `string.special`],
  [`def`, `variableName.definition`],
  [`tag`, `tagName`],
  [`attribute`, `attributeName`],
  [`type`, `typeName`],
  [`builtin`, `variableName.standard`],
  [`qualifier`, `modifier`],
  [`error`, `invalid`],
  [`header`, `heading`],
  [`property`, `propertyName`],
]) {
  Vd[e] = Ud(Ld, t);
}
function Hd(e, t) {
  if (!(zd.indexOf(e) > -1)) {
    zd.push(e);
    console.warn(t);
  }
}
function Ud(e, t) {
  let n = [];
  for (let r of t.split(` `)) {
    let t = [];
    for (let n of r.split(`.`)) {
      let r = e[n] || X[n];
      if (r) {
        if (typeof r == `function`) {
          if (t.length) {
            t = t.map(r);
          } else {
            Hd(n, `Modifier ${n} used at start of tag`);
          }
        } else if (t.length) {
          Hd(n, `Tag ${n} used as modifier`);
        } else {
          t = Array.isArray(r) ? r : [r];
        }
      } else {
        Hd(n, `Unknown highlighting tag ${n}`);
      }
    }
    for (let e of t) {
      n.push(e);
    }
  }
  if (!n.length) {
    return 0;
  }
  let r = t.replace(/ /g, `_`);
  let i = r + ` ` + n.map((e) => e.id);
  let a = Bd[i];
  if (a) {
    return a.id;
  }
  let o = (Bd[i] = rl.define({
    id: Rd.length,
    name: r,
    props: [
      Fl({
        [r]: n,
      }),
    ],
  }));
  Rd.push(o);
  return o.id;
}
B.RTL;
B.LTR;
const Wd = (e) => {
  let { state } = e;
  let n = state.doc.lineAt(state.selection.main.from);
  let r = Yd(e.state, n.from);
  if (r.line) {
    return Kd(e);
  }
  if (r.block) {
    return Jd(e);
  }
  return false;
};
function Gd(e, t) {
  return ({ state, dispatch }) => {
    if (state.readOnly) {
      return false;
    }
    let i = e(t, state);
    if (i) {
      return (dispatch(state.update(i)), true);
    }
    return false;
  };
}
var Kd = Gd(ef, 0);
const qd = Gd($d, 0);
var Jd = Gd((e, t) => $d(e, t, Qd(t)), 0);
function Yd(e, from) {
  let n = e.languageDataAt(`commentTokens`, from, 1);
  if (n.length) {
    return n[0];
  }
  return {};
}
var Xd = 50;
function Zd(e, { open, close }, from, i) {
  let a = e.sliceDoc(from - Xd, from);
  let o = e.sliceDoc(i, i + Xd);
  let length = /\s*$/.exec(a)[0].length;
  let length_1 = /^\s*/.exec(o)[0].length;
  let l = a.length - length;
  if (
    a.slice(l - open.length, l) == open &&
    o.slice(length_1, length_1 + close.length) == close
  ) {
    return {
      open: {
        pos: from - length,
        margin: length && 1,
      },
      close: {
        pos: i + length_1,
        margin: length_1 && 1,
      },
    };
  }
  let u;
  let d;
  if (i - from <= 100) {
    u = d = e.sliceDoc(from, i);
  } else {
    u = e.sliceDoc(from, from + Xd);
    d = e.sliceDoc(i - Xd, i);
  }
  let length_2 = /^\s*/.exec(u)[0].length;
  let length_3 = /\s*$/.exec(d)[0].length;
  let m = d.length - length_3 - close.length;
  if (
    u.slice(length_2, length_2 + open.length) == open &&
    d.slice(m, m + close.length) == close
  ) {
    return {
      open: {
        pos: from + length_2 + open.length,
        margin: +!!/\s/.test(u.charAt(length_2 + open.length)),
      },
      close: {
        pos: i - length_3 - close.length,
        margin: +!!/\s/.test(d.charAt(m - 1)),
      },
    };
  }
  return null;
}
function Qd(e) {
  let t = [];
  for (let n of e.selection.ranges) {
    let r = e.doc.lineAt(n.from);
    let i = n.to <= r.to ? r : e.doc.lineAt(n.to);
    if (i.from > r.from && i.from == n.to) {
      i = n.to == r.to + 1 ? r : e.doc.lineAt(n.to - 1);
    }
    let a = t.length - 1;
    if (a >= 0 && t[a].to > r.from) {
      t[a].to = i.to;
    } else {
      t.push({
        from: r.from + /^\s*/.exec(r.text)[0].length,
        to: i.to,
      });
    }
  }
  return t;
}
function $d(e, t, n = t.selection.ranges) {
  let r = n.map((e) => Yd(t, e.from).block);
  if (!r.every((e) => e)) {
    return null;
  }
  let i = n.map((e, n) => Zd(t, r[n], e.from, e.to));
  if (e != 2 && !i.every((e) => e)) {
    return {
      changes: t.changes(
        n.map((e, t) => {
          if (i[t]) {
            return [];
          }
          return [
            {
              from: e.from,
              insert: r[t].open + ` `,
            },
            {
              from: e.to,
              insert: ` ` + r[t].close,
            },
          ];
        }),
      ),
    };
  }
  if (e != 1 && i.some((e) => e)) {
    let e = [];
    for (let t = 0, n; t < i.length; t++) {
      if ((n = i[t])) {
        let i = r[t];
        let { open, close } = n;
        e.push(
          {
            from: open.pos - i.open.length,
            to: open.pos + open.margin,
          },
          {
            from: close.pos - close.margin,
            to: close.pos + i.close.length,
          },
        );
      }
    }
    return {
      changes: e,
    };
  }
  return null;
}
function ef(e, t, n = t.selection.ranges) {
  let r = [];
  let i = -1;
  ranges: for (let { from, to } of n) {
    let n = r.length;
    let o = 1000000000;
    let token;
    for (let n = from; n <= to;) {
      let c = t.doc.lineAt(n);
      if (token == null && ((token = Yd(t, c.from).line), !token)) {
        continue ranges;
      }
      if (c.from > i && (from == to || to > c.from)) {
        i = c.from;
        let indent = /^\s*/.exec(c.text)[0].length;
        let empty = indent == c.length;
        let comment =
          c.text.slice(indent, indent + token.length) == token ? indent : -1;
        if (indent < c.text.length && indent < o) {
          o = indent;
        }
        r.push({
          line: c,
          comment,
          token,
          indent,
          empty,
          single: false,
        });
      }
      n = c.to + 1;
    }
    if (o < 1000000000) {
      for (let e = n; e < r.length; e++) {
        if (r[e].indent < r[e].line.text.length) {
          r[e].indent = o;
        }
      }
    }
    if (r.length == n + 1) {
      r[n].single = true;
    }
  }
  if (e != 2 && r.some((e) => e.comment < 0 && (!e.empty || e.single))) {
    let e = [];
    for (let { line, token, indent, empty, single } of r) {
      if (single || !empty) {
        e.push({
          from: line.from + indent,
          insert: token + ` `,
        });
      }
    }
    let n = t.changes(e);
    return {
      changes: n,
      selection: t.selection.map(n, 1),
    };
  }
  if (e != 1 && r.some((e) => e.comment >= 0)) {
    let e = [];
    for (let { line, comment, token } of r) {
      if (comment >= 0) {
        let r = line.from + comment;
        let a = r + token.length;
        line.text[a - line.from] == ` ` && a++;
        e.push({
          from: r,
          to: a,
        });
      }
    }
    return {
      changes: e,
    };
  }
  return null;
}
const tf = Ue.define();
const nf = Ue.define();
const rf = A.define();
const af = A.define({
  combine(e) {
    return at(
      e,
      {
        minDepth: 100,
        newGroupDelay: 500,
        joinToEvent: (e, t) => t,
      },
      {
        minDepth: Math.max,
        newGroupDelay: Math.min,
        joinToEvent: (e, t) => (n, r) => e(n, r) || t(n, r),
      },
    );
  },
});
const of = Te.define({
  create() {
    return Tf.empty;
  },
  update(e, t) {
    let n = t.state.facet(af);
    let r = t.annotation(tf);
    if (r) {
      let i = pf.fromTransaction(t, r.selection);
      let a = r.side;
      let o = a == 0 ? e.undone : e.done;
      o = i ? mf(o, o.length, n.minDepth, i) : bf(o, t.startState.selection);
      return new Tf(a == 0 ? r.rest : o, a == 0 ? o : r.rest);
    }
    let i = t.annotation(nf);
    if (i == `full` || i == `before`) {
      e = e.isolate();
    }
    if (t.annotation(Ke.addToHistory) === false) {
      if (t.changes.empty) {
        return e;
      }
      return e.addMapping(t.changes.desc);
    }
    let a = pf.fromTransaction(t);
    let o = t.annotation(Ke.time);
    let s = t.annotation(Ke.userEvent);
    if (a) {
      e = e.addChanges(a, o, s, n, t);
    } else if (t.selection) {
      e = e.addSelection(t.startState.selection, o, s, n.newGroupDelay);
    }
    if (i == `full` || i == `after`) {
      e = e.isolate();
    }
    return e;
  },
  toJSON(e) {
    return {
      done: e.done.map((e) => e.toJSON()),
      undone: e.undone.map((e) => e.toJSON()),
    };
  },
  fromJSON(e) {
    return new Tf(e.done.map(pf.fromJSON), e.undone.map(pf.fromJSON));
  },
});
function sf(e = {}) {
  return [
    of,
    af.of(e),
    G.domEventHandlers({
      beforeinput(e, t) {
        let n =
          e.inputType == `historyUndo`
            ? lf
            : e.inputType == `historyRedo`
              ? uf
              : null;
        if (n) {
          return (e.preventDefault(), n(t));
        }
        return false;
      },
    }),
  ];
}
function cf(e, t) {
  return ({ state, dispatch }) => {
    if (!t && state.readOnly) {
      return false;
    }
    let i = state.field(of, false);
    if (!i) {
      return false;
    }
    let a = i.pop(e, state, t);
    if (a) {
      return (dispatch(a), true);
    }
    return false;
  };
}
var lf = cf(0, false);
var uf = cf(1, false);
const df = cf(0, true);
const ff = cf(1, true);
var pf = class e {
  constructor(e, t, n, r, i) {
    this.changes = e;
    this.effects = t;
    this.mapped = n;
    this.startSelection = r;
    this.selectionsAfter = i;
  }
  setSelAfter(t) {
    return new e(
      this.changes,
      this.effects,
      this.mapped,
      this.startSelection,
      t,
    );
  }
  toJSON() {
    return {
      changes: this.changes?.toJSON(),
      mapped: this.mapped?.toJSON(),
      startSelection: this.startSelection?.toJSON(),
      selectionsAfter: this.selectionsAfter.map((e) => e.toJSON()),
    };
  }
  static fromJSON(t) {
    return new e(
      t.changes && E.fromJSON(t.changes),
      [],
      t.mapped && de.fromJSON(t.mapped),
      t.startSelection && k.fromJSON(t.startSelection),
      t.selectionsAfter.map(k.fromJSON),
    );
  }
  static fromTransaction(t, n) {
    let r = vf;
    for (let e of t.startState.facet(rf)) {
      let n = e(t);
      if (n.length) {
        r = r.concat(n);
      }
    }
    if (!r.length && t.changes.empty) {
      return null;
    }
    return new e(
      t.changes.invert(t.startState.doc),
      r,
      undefined,
      n || t.startState.selection,
      vf,
    );
  }
  static selection(t) {
    return new e(undefined, vf, undefined, undefined, t);
  }
};
function mf(e, t, n, r) {
  let i = t + 1 > n + 20 ? t - n - 1 : 0;
  let a = e.slice(i, t);
  a.push(r);
  return a;
}
function hf(changes, t) {
  let n = [];
  let r = false;
  changes.iterChangedRanges((e, t) => n.push(e, t));
  t.iterChangedRanges((e, t, i, a) => {
    for (let e = 0; e < n.length;) {
      let t = n[e++];
      let o = n[e++];
      if (a >= t && i <= o) {
        r = true;
      }
    }
  });
  return r;
}
function gf(e, t) {
  return (
    e.ranges.length == t.ranges.length &&
    e.ranges.filter((e, n) => e.empty != t.ranges[n].empty).length === 0
  );
}
function _f(e, t) {
  if (e.length) {
    if (t.length) {
      return e.concat(t);
    }
    return e;
  }
  return t;
}
var vf = [];
var yf = 200;
function bf(e, t) {
  if (e.length) {
    let n = e[e.length - 1];
    let r = n.selectionsAfter.slice(Math.max(0, n.selectionsAfter.length - yf));
    if (r.length && r[r.length - 1].eq(t)) {
      return e;
    }
    return (r.push(t), mf(e, e.length - 1, 1000000000, n.setSelAfter(r)));
  }
  return [pf.selection([t])];
}
function xf(e) {
  let t = e[e.length - 1];
  let n = e.slice();
  n[e.length - 1] = t.setSelAfter(
    t.selectionsAfter.slice(0, t.selectionsAfter.length - 1),
  );
  return n;
}
function Sf(e, t) {
  if (!e.length) {
    return e;
  }
  let e_length = e.length;
  let r = vf;
  while (e_length) {
    let i = Cf(e[e_length - 1], t, r);
    if ((i.changes && !i.changes.empty) || i.effects.length) {
      let t = e.slice(0, e_length);
      t[e_length - 1] = i;
      return t;
    }
    t = i.mapped;
    e_length--;
    r = i.selectionsAfter;
  }
  if (r.length) {
    return [pf.selection(r)];
  }
  return vf;
}
function Cf(e, t, n) {
  let r = _f(
    e.selectionsAfter.length ? e.selectionsAfter.map((e) => e.map(t)) : vf,
    n,
  );
  if (!e.changes) {
    return pf.selection(r);
  }
  let i = e.changes.map(t);
  let a = t.mapDesc(e.changes, true);
  let o = e.mapped ? e.mapped.composeDesc(a) : a;
  return new pf(i, j.mapEffects(e.effects, t), o, e.startSelection.map(a), r);
}
const wf = /^(input\.type|delete)($|\.)/;
var Tf = class e {
  constructor(e, t, n = 0, r = undefined) {
    this.done = e;
    this.undone = t;
    this.prevTime = n;
    this.prevUserEvent = r;
  }
  isolate() {
    if (this.prevTime) {
      return new e(this.done, this.undone);
    }
    return this;
  }
  addChanges(t, n, r, i, a) {
    let done = this.done;
    let s = done[done.length - 1];
    done =
      s &&
      s.changes &&
      !s.changes.empty &&
      t.changes &&
      (!r || wf.test(r)) &&
      ((!s.selectionsAfter.length &&
        n - this.prevTime < i.newGroupDelay &&
        i.joinToEvent(a, hf(s.changes, t.changes))) ||
        r == `input.type.compose`)
        ? mf(
            done,
            done.length - 1,
            i.minDepth,
            new pf(
              t.changes.compose(s.changes),
              _f(j.mapEffects(t.effects, s.changes), s.effects),
              s.mapped,
              s.startSelection,
              vf,
            ),
          )
        : mf(done, done.length, i.minDepth, t);
    return new e(done, vf, n, r);
  }
  addSelection(t, n, r, i) {
    let a = this.done.length
      ? this.done[this.done.length - 1].selectionsAfter
      : vf;
    if (
      a.length > 0 &&
      n - this.prevTime < i &&
      r == this.prevUserEvent &&
      r &&
      /^select($|\.)/.test(r) &&
      gf(a[a.length - 1], t)
    ) {
      return this;
    }
    return new e(bf(this.done, t), this.undone, n, r);
  }
  addMapping(t) {
    return new e(
      Sf(this.done, t),
      Sf(this.undone, t),
      this.prevTime,
      this.prevUserEvent,
    );
  }
  pop(side, t, n) {
    let r = side == 0 ? this.done : this.undone;
    if (r.length == 0) {
      return null;
    }
    let i = r[r.length - 1];
    let a =
      i.selectionsAfter[0] ||
      (i.startSelection
        ? i.startSelection.map(i.changes.invertedDesc, 1)
        : t.selection);
    if (n && i.selectionsAfter.length) {
      return t.update({
        selection: i.selectionsAfter[i.selectionsAfter.length - 1],
        annotations: tf.of({
          side,
          rest: xf(r),
          selection: a,
        }),
        userEvent: side == 0 ? `select.undo` : `select.redo`,
        scrollIntoView: true,
      });
    }
    if (i.changes) {
      let rest = r.length == 1 ? vf : r.slice(0, r.length - 1);
      if (i.mapped) {
        rest = Sf(rest, i.mapped);
      }
      return t.update({
        changes: i.changes,
        selection: i.startSelection,
        effects: i.effects,
        annotations: tf.of({
          side,
          rest,
          selection: a,
        }),
        filter: false,
        userEvent: side == 0 ? `undo` : `redo`,
        scrollIntoView: true,
      });
    }
    return null;
  }
};
Tf.empty = new Tf(vf, vf);
const Ef = [
  {
    key: `Mod-z`,
    run: lf,
    preventDefault: true,
  },
  {
    key: `Mod-y`,
    mac: `Mod-Shift-z`,
    run: uf,
    preventDefault: true,
  },
  {
    linux: `Ctrl-Shift-z`,
    run: uf,
    preventDefault: true,
  },
  {
    key: `Mod-u`,
    run: df,
    preventDefault: true,
  },
  {
    key: `Alt-u`,
    mac: `Mod-Shift-u`,
    run: ff,
    preventDefault: true,
  },
];
function Df(selection, t) {
  return k.create(selection.ranges.map(t), selection.mainIndex);
}
function Of(e, t) {
  return e.update({
    selection: t,
    scrollIntoView: true,
    userEvent: `select`,
  });
}
function kf({ state, dispatch }, n) {
  let r = Df(state.selection, n);
  return !r.eq(state.selection, true) && (dispatch(Of(state, r)), true);
}
function Af(e, t) {
  return k.cursor(t ? e.to : e.from);
}
function jf(e, t) {
  return kf(e, (n) => {
    if (n.empty) {
      return e.moveByChar(n, t);
    }
    return Af(n, t);
  });
}
function Q(e) {
  return e.textDirectionAt(e.state.selection.main.head) == B.LTR;
}
const Mf = (e) => jf(e, !Q(e));
const Nf = (e) => jf(e, Q(e));
function Pf(e, t) {
  return kf(e, (n) => {
    if (n.empty) {
      return e.moveByGroup(n, t);
    }
    return Af(n, t);
  });
}
const Ff = (e) => Pf(e, !Q(e));
const If = (e) => Pf(e, Q(e));
typeof Intl < `u` && Intl.Segmenter;
function Lf(e, t, n) {
  if (t.type.prop(n)) {
    return true;
  }
  let r = t.to - t.from;
  return (
    (r && (r > 2 || /[^\s,.;:]/.test(e.sliceDoc(t.from, t.to)))) || t.firstChild
  );
}
function Rf(state, t, n) {
  let r = Z(state).resolveInner(t.head);
  let i = n ? K.closedBy : K.openedBy;
  for (let a = t.head; ;) {
    let t = n ? r.childAfter(a) : r.childBefore(a);
    if (!t) {
      break;
    }
    if (Lf(state, t, i)) {
      r = t;
    } else {
      a = n ? t.to : t.from;
    }
  }
  let a = r.type.prop(i);
  let o;
  let s;
  s =
    a && (o = n ? Pd(state, r.from, 1) : Pd(state, r.to, -1)) && o.matched
      ? n
        ? o.end.to
        : o.end.from
      : n
        ? r.to
        : r.from;
  return k.cursor(s, n ? -1 : 1);
}
const zf = (e) => kf(e, (t) => Rf(e.state, t, !Q(e)));
const Bf = (e) => kf(e, (t) => Rf(e.state, t, Q(e)));
function Vf(e, t) {
  return kf(e, (n) => {
    if (!n.empty) {
      return Af(n, t);
    }
    let r = e.moveVertically(n, t);
    if (r.head == n.head) {
      return e.moveToLineBoundary(n, t);
    }
    return r;
  });
}
const Hf = (e) => Vf(e, false);
const Uf = (e) => Vf(e, true);
function Wf(e) {
  let selfScroll = e.scrollDOM.clientHeight < e.scrollDOM.scrollHeight - 2;
  let marginTop = 0;
  let marginBottom = 0;
  let i;
  if (selfScroll) {
    for (let t of e.state.facet(G.scrollMargins)) {
      let i = t(e);
      if (i?.top) {
        marginTop = Math.max(i?.top, marginTop);
      }
      if (i?.bottom) {
        marginBottom = Math.max(i?.bottom, marginBottom);
      }
    }
    i = e.scrollDOM.clientHeight - marginTop - marginBottom;
  } else {
    i = (e.dom.ownerDocument.defaultView || window).innerHeight;
  }
  return {
    marginTop,
    marginBottom,
    selfScroll,
    height: Math.max(e.defaultLineHeight, i - 5),
  };
}
function Gf(e, t) {
  let n = Wf(e);
  let { state } = e;
  let i = Df(state.selection, (r) => {
    if (r.empty) {
      return e.moveVertically(r, t, n.height);
    }
    return Af(r, t);
  });
  if (i.eq(state.selection)) {
    return false;
  }
  let a;
  if (n.selfScroll) {
    let t = e.coordsAtPos(state.selection.main.head);
    let o = e.scrollDOM.getBoundingClientRect();
    let s = o.top + n.marginTop;
    let c = o.bottom - n.marginBottom;
    if (t && t.top > s && t.bottom < c) {
      a = G.scrollIntoView(i.main.head, {
        y: `start`,
        yMargin: t.top - s,
      });
    }
  }
  e.dispatch(Of(state, i), {
    effects: a,
  });
  return true;
}
const Kf = (e) => Gf(e, false);
const qf = (e) => Gf(e, true);
function Jf(e, t, n) {
  let r = e.lineBlockAt(t.head);
  let i = e.moveToLineBoundary(t, n);
  if (i.head == t.head && i.head != (n ? r.to : r.from)) {
    i = e.moveToLineBoundary(t, n, false);
  }
  if (!n && i.head == r.from && r.length) {
    let n = /^\s*/.exec(
      e.state.sliceDoc(r.from, Math.min(r.from + 100, r.to)),
    )[0].length;
    if (n && t.head != r.from + n) {
      i = k.cursor(r.from + n);
    }
  }
  return i;
}
const Yf = (e) => kf(e, (t) => Jf(e, t, true));
const Xf = (e) => kf(e, (t) => Jf(e, t, false));
const Zf = (e) => kf(e, (t) => Jf(e, t, !Q(e)));
const Qf = (e) => kf(e, (t) => Jf(e, t, Q(e)));
const $f = (e) => kf(e, (t) => e.moveToLineBoundary(t, false, false));
const ep = (e) => kf(e, (t) => e.moveToLineBoundary(t, true, false));
function tp(state, dispatch, n) {
  let r = false;
  let i = Df(state.selection, (t) => {
    let i =
      Pd(state, t.head, -1) ||
      Pd(state, t.head, 1) ||
      (t.head > 0 && Pd(state, t.head - 1, 1)) ||
      (t.head < state.doc.length && Pd(state, t.head + 1, -1));
    if (!i || !i.end) {
      return t;
    }
    r = true;
    let a = i.start.from == t.head ? i.end.to : i.end.from;
    if (n) {
      return k.range(t.anchor, a);
    }
    return k.cursor(a);
  });
  if (r) {
    return (dispatch(Of(state, i)), true);
  }
  return false;
}
const np = ({ state, dispatch }) => tp(state, dispatch, false);
function rp(e, t, n) {
  let r = Df(e.state.selection, (e) => {
    if (e.undirectional && e.head >= e.anchor != t) {
      e = k.range(e.head, e.anchor);
    }
    let r = n(e);
    return k.range(
      e.anchor,
      r.head,
      r.goalColumn,
      r.bidiLevel || undefined,
      r.assoc,
    );
  });
  return !r.eq(e.state.selection) && (e.dispatch(Of(e.state, r)), true);
}
function ip(e, t) {
  return rp(e, t, (n) => e.moveByChar(n, t));
}
const ap = (e) => ip(e, !Q(e));
const op = (e) => ip(e, Q(e));
function sp(e, t) {
  return rp(e, t, (n) => e.moveByGroup(n, t));
}
const cp = (e) => sp(e, !Q(e));
const lp = (e) => sp(e, Q(e));
var up = (e) => {
  let t = !Q(e);
  return rp(e, t, (n) => Rf(e.state, n, t));
};
const dp = (e) => {
  let t = Q(e);
  return rp(e, t, (n) => Rf(e.state, n, t));
};
function fp(e, t) {
  return rp(e, t, (n) => e.moveVertically(n, t));
}
const pp = (e) => fp(e, false);
const mp = (e) => fp(e, true);
function hp(e, t) {
  return rp(e, t, (n) => e.moveVertically(n, t, Wf(e).height));
}
const gp = (e) => hp(e, false);
const _p = (e) => hp(e, true);
const vp = (e) => rp(e, true, (t) => Jf(e, t, true));
const yp = (e) => rp(e, false, (t) => Jf(e, t, false));
const bp = (e) => {
  let t = !Q(e);
  return rp(e, t, (n) => Jf(e, n, t));
};
const xp = (e) => {
  let t = Q(e);
  return rp(e, t, (n) => Jf(e, n, t));
};
const Sp = (e) => rp(e, false, (t) => k.cursor(e.lineBlockAt(t.head).from));
const Cp = (e) => rp(e, true, (t) => k.cursor(e.lineBlockAt(t.head).to));
const wp = ({ state, dispatch }) => {
  dispatch(
    Of(state, {
      anchor: 0,
    }),
  );
  return true;
};
const Tp = ({ state, dispatch }) => {
  dispatch(
    Of(state, {
      anchor: state.doc.length,
    }),
  );
  return true;
};
const Ep = ({ state, dispatch }) => {
  dispatch(
    Of(state, {
      anchor: state.selection.main.anchor,
      head: 0,
    }),
  );
  return true;
};
const Dp = ({ state, dispatch }) => {
  dispatch(
    Of(state, {
      anchor: state.selection.main.anchor,
      head: state.doc.length,
    }),
  );
  return true;
};
const Op = ({ state, dispatch }) => {
  dispatch(
    state.update({
      selection: {
        anchor: 0,
        head: state.doc.length,
      },
      userEvent: `select`,
    }),
  );
  return true;
};
const kp = ({ state, dispatch }) => {
  let n = Jp(state).map(({ from, to }) =>
    k.undirectionalRange(from, Math.min(to + 1, state.doc.length)),
  );
  dispatch(
    state.update({
      selection: k.create(n),
      userEvent: `select`,
    }),
  );
  return true;
};
const Ap = ({ state, dispatch }) => {
  let n = Df(state.selection, (t) => {
    let n = Z(state);
    let r = n.resolveStack(t.from, 1);
    if (t.empty) {
      let e = n.resolveStack(t.from, -1);
      if (e.node.from >= r.node.from && e.node.to <= r.node.to) {
        r = e;
      }
    }
    for (let e = r; e; e = e.next) {
      let { node } = e;
      if (
        ((node.from < t.from && node.to >= t.to) ||
          (node.to > t.to && node.from <= t.from)) &&
        e.next
      ) {
        return k.undirectionalRange(node.from, node.to);
      }
    }
    return t;
  });
  return !n.eq(state.selection) && (dispatch(Of(state, n)), true);
};
function jp(e, t) {
  let { state } = e;
  let state_selection = state.selection;
  let i = state.selection.ranges.slice();
  for (let r of state.selection.ranges) {
    let a = state.doc.lineAt(r.head);
    if (t ? a.to < e.state.doc.length : a.from > 0) {
      for (let n = r; ;) {
        let r = e.moveVertically(n, t);
        if (r.head < a.from || r.head > a.to) {
          if (!i.some((e) => e.head == r.head)) {
            i.push(r);
          }
          break;
        }
        if (r.head == n.head) {
          break;
        }
        n = r;
      }
    }
  }
  return (
    i.length != state_selection.ranges.length &&
    (e.dispatch(Of(state, k.create(i, i.length - 1))), true)
  );
}
const Mp = (e) => jp(e, false);
const Np = (e) => jp(e, true);
const Pp = ({ state, dispatch }) => {
  let state_selection = state.selection;
  let r = null;
  if (state_selection.ranges.length > 1) {
    r = k.create([state_selection.main]);
  } else if (!state_selection.main.empty) {
    r = k.create([k.cursor(state_selection.main.head)]);
  }
  if (r) {
    return (dispatch(Of(state, r)), true);
  }
  return false;
};
function Fp(e, t) {
  if (e.state.readOnly) {
    return false;
  }
  let n = `delete.selection`;
  let { state } = e;
  let i = state.changeByRange((r) => {
    let { from, to } = r;
    if (from == to) {
      let o = t(r);
      if (o < from) {
        n = `delete.backward`;
        o = Ip(e, o, false);
      } else if (o > from) {
        n = `delete.forward`;
        o = Ip(e, o, true);
      }
      from = Math.min(from, o);
      to = Math.max(to, o);
    } else {
      from = Ip(e, from, false);
      to = Ip(e, to, true);
    }
    if (from == to) {
      return {
        range: r,
      };
    }
    return {
      changes: {
        from,
        to,
      },
      range: k.cursor(from, from < r.head ? -1 : 1),
    };
  });
  return (
    !i.changes.empty &&
    (e.dispatch(
      state.update(i, {
        scrollIntoView: true,
        userEvent: n,
        effects:
          n == `delete.selection`
            ? G.announce.of(state.phrase(`Selection deleted`))
            : undefined,
      }),
    ),
    true)
  );
}
function Ip(e, t, n) {
  if (e instanceof G) {
    for (let r of e.state.facet(G.atomicRanges).map((t) => t(e))) {
      r.between(t, t, (e, r) => {
        if (e < t && r > t) {
          t = n ? r : e;
        }
      });
    }
  }
  return t;
}
const Lp = (e, t, n) =>
  Fp(e, (r) => {
    let r_from = r.from;
    let { state } = e;
    let o = state.doc.lineAt(r_from);
    let s;
    let c;
    if (
      n &&
      !t &&
      r_from > o.from &&
      r_from < o.from + 200 &&
      !/[^ \t]/.test((s = o.text.slice(0, r_from - o.from)))
    ) {
      if (s[s.length - 1] == `	`) {
        return r_from - 1;
      }
      let e = wt(s, state.tabSize) % xu(state) || xu(state);
      for (let t = 0; t < e && s[s.length - 1 - t] == ` `; t++) {
        r_from--;
      }
      c = r_from;
    } else {
      c = C(o.text, r_from - o.from, t, t) + o.from;
      if (c == r_from && o.number != (t ? state.doc.lines : 1)) {
        c += t ? 1 : -1;
      } else if (
        !t &&
        /[\ufe00-\ufe0f]/.test(o.text.slice(c - o.from, r_from - o.from))
      ) {
        c = C(o.text, c - o.from, false, false) + o.from;
      }
    }
    return c;
  });
const Rp = (e) => Lp(e, false, true);
const zp = (e) => Lp(e, true, false);
const Bp = (e, t) =>
  Fp(e, (n) => {
    let n_head = n.head;
    let { state } = e;
    let a = state.doc.lineAt(n_head);
    let o = state.charCategorizer(n_head);
    for (let e = null; ;) {
      if (n_head == (t ? a.to : a.from)) {
        if (n_head == n.head && a.number != (t ? state.doc.lines : 1)) {
          n_head += t ? 1 : -1;
        }
        break;
      }
      let s = C(a.text, n_head - a.from, t) + a.from;
      let c = a.text.slice(
        Math.min(n_head, s) - a.from,
        Math.max(n_head, s) - a.from,
      );
      let l = o(c);
      if (e != null && l != e) {
        break;
      }
      if (c != ` ` || n_head != n.head) {
        e = l;
      }
      n_head = s;
    }
    return n_head;
  });
const Vp = (e) => Bp(e, false);
const Hp = (e) => Bp(e, true);
const Up = (e) =>
  Fp(e, (t) => {
    let n = e.lineBlockAt(t.head).to;
    if (t.head < n) {
      return n;
    }
    return Math.min(e.state.doc.length, t.head + 1);
  });
const Wp = (e) =>
  Fp(e, (t) => {
    let head = e.moveToLineBoundary(t, false).head;
    if (t.head > head) {
      return head;
    }
    return Math.max(0, t.head - 1);
  });
const Gp = (e) =>
  Fp(e, (t) => {
    let head = e.moveToLineBoundary(t, true).head;
    if (t.head < head) {
      return head;
    }
    return Math.min(e.state.doc.length, t.head + 1);
  });
const Kp = ({ state, dispatch }) => {
  if (state.readOnly) {
    return false;
  }
  let n = state.changeByRange((e) => ({
    changes: {
      from: e.from,
      to: e.to,
      insert: v.of([``, ``]),
    },
    range: k.cursor(e.from),
  }));
  dispatch(
    state.update(n, {
      scrollIntoView: true,
      userEvent: `input`,
    }),
  );
  return true;
};
const qp = ({ state, dispatch }) => {
  if (state.readOnly) {
    return false;
  }
  let n = state.changeByRange((t) => {
    if (!t.empty || t.from == 0 || t.from == state.doc.length) {
      return {
        range: t,
      };
    }
    let t_from = t.from;
    let r = state.doc.lineAt(t_from);
    let i =
      t_from == r.from
        ? t_from - 1
        : C(r.text, t_from - r.from, false) + r.from;
    let a =
      t_from == r.to ? t_from + 1 : C(r.text, t_from - r.from, true) + r.from;
    return {
      changes: {
        from: i,
        to: a,
        insert: state.doc.slice(t_from, a).append(state.doc.slice(i, t_from)),
      },
      range: k.cursor(a),
    };
  });
  return (
    !n.changes.empty &&
    (dispatch(
      state.update(n, {
        scrollIntoView: true,
        userEvent: `move.character`,
      }),
    ),
    true)
  );
};
function Jp(e) {
  let t = [];
  let n = -1;
  for (let r of e.selection.ranges) {
    let i = e.doc.lineAt(r.from);
    let a = e.doc.lineAt(r.to);
    if (!r.empty && r.to == a.from) {
      a = e.doc.lineAt(r.to - 1);
    }
    if (n >= i.number) {
      let e = t[t.length - 1];
      e.to = a.to;
      e.ranges.push(r);
    } else {
      t.push({
        from: i.from,
        to: a.to,
        ranges: [r],
      });
    }
    n = a.number + 1;
  }
  return t;
}
function Yp(state, dispatch, n) {
  if (state.readOnly) {
    return false;
  }
  let r = [];
  let i = [];
  for (let t of Jp(state)) {
    if (n ? t.to == state.doc.length : t.from == 0) {
      continue;
    }
    let a = state.doc.lineAt(n ? t.to + 1 : t.from - 1);
    let o = a.length + 1;
    if (n) {
      r.push(
        {
          from: t.to,
          to: a.to,
        },
        {
          from: t.from,
          insert: a.text + state.lineBreak,
        },
      );
      for (let n of t.ranges) {
        i.push(
          k.range(
            Math.min(state.doc.length, n.anchor + o),
            Math.min(state.doc.length, n.head + o),
          ),
        );
      }
    } else {
      r.push(
        {
          from: a.from,
          to: t.from,
        },
        {
          from: t.to,
          insert: state.lineBreak + a.text,
        },
      );
      for (let e of t.ranges) {
        i.push(k.range(e.anchor - o, e.head - o));
      }
    }
  }
  if (r.length) {
    return (
      dispatch(
        state.update({
          changes: r,
          scrollIntoView: true,
          selection: k.create(i, state.selection.mainIndex),
          userEvent: `move.line`,
        }),
      ),
      true
    );
  }
  return false;
}
const Xp = ({ state, dispatch }) => Yp(state, dispatch, false);
const Zp = ({ state, dispatch }) => Yp(state, dispatch, true);
function Qp(state, dispatch, n) {
  if (state.readOnly) {
    return false;
  }
  let r = [];
  for (let t of Jp(state)) {
    if (n) {
      r.push({
        from: t.from,
        insert: state.doc.slice(t.from, t.to) + state.lineBreak,
      });
    } else {
      r.push({
        from: t.to,
        insert: state.lineBreak + state.doc.slice(t.from, t.to),
      });
    }
  }
  let i = state.changes(r);
  dispatch(
    state.update({
      changes: i,
      selection: state.selection.map(i, n ? 1 : -1),
      scrollIntoView: true,
      userEvent: `input.copyline`,
    }),
  );
  return true;
}
const $p = ({ state, dispatch }) => Qp(state, dispatch, false);
const em = ({ state, dispatch }) => Qp(state, dispatch, true);
const tm = (e) => {
  if (e.state.readOnly) {
    return false;
  }
  let { state } = e;
  let n = state.changes(
    Jp(state).map(({ from, to }) => {
      from > 0 ? from-- : to < state.doc.length && to++;
      return {
        from,
        to,
      };
    }),
  );
  let r = Df(state.selection, (t) => {
    let n;
    if (e.lineWrapping) {
      let r = e.lineBlockAt(t.head);
      let i = e.coordsAtPos(t.head, t.assoc || 1);
      if (i) {
        n = r.bottom + e.documentTop - i.bottom + e.defaultLineHeight / 2;
      }
    }
    return e.moveVertically(t, true, n);
  }).map(n);
  e.dispatch({
    changes: n,
    selection: r,
    scrollIntoView: true,
    userEvent: `delete.line`,
  });
  return true;
};
function nm(state, from) {
  if (/\(\)|\[\]|\{\}/.test(state.sliceDoc(from - 1, from + 1))) {
    return {
      from,
      to: from,
    };
  }
  let n = Z(state).resolveInner(from);
  let r = n.childBefore(from);
  let i = n.childAfter(from);
  let a;
  if (
    r &&
    i &&
    r.to <= from &&
    i.from >= from &&
    (a = r.type.prop(K.closedBy)) &&
    a.indexOf(i.name) > -1 &&
    state.doc.lineAt(r.to).from == state.doc.lineAt(i.from).from &&
    !/\S/.test(state.sliceDoc(r.to, i.from))
  ) {
    return {
      from: r.to,
      to: i.from,
    };
  }
  return null;
}
const rm = am(false);
const im = am(true);
function am(e) {
  return ({ state, dispatch }) => {
    if (state.readOnly) {
      return false;
    }
    let r = state.changeByRange(({ from, to }) => {
      let a = state.doc.lineAt(from);
      let o = !e && from == to && nm(state, from);
      if (e) {
        from = to = (to <= a.to ? a : state.doc.lineAt(to)).to;
      }
      let s = new wu(state, {
        simulateBreak: from,
        simulateDoubleBreak: !!o,
      });
      let c = Cu(s, from);
      for (
        c ??= wt(/^\s*/.exec(state.doc.lineAt(from).text)[0], state.tabSize);
        to < a.to && /\s/.test(a.text[to - a.from]);
      ) {
        to++;
      }
      if (o) {
        ({ from, to } = o);
      } else if (
        from > a.from &&
        from < a.from + 100 &&
        !/\S/.test(a.text.slice(0, from))
      ) {
        from = a.from;
      }
      let l = [``, Su(state, c)];
      if (o) {
        l.push(Su(state, s.lineIndent(a.from, -1)));
      }
      return {
        changes: {
          from,
          to,
          insert: v.of(l),
        },
        range: k.cursor(from + 1 + l[1].length),
      };
    });
    dispatch(
      state.update(r, {
        scrollIntoView: true,
        userEvent: `input`,
      }),
    );
    return true;
  };
}
function om(state, t) {
  let n = -1;
  return state.changeByRange((r) => {
    let i = [];
    for (let a = r.from; a <= r.to;) {
      let o = state.doc.lineAt(a);
      if (o.number > n && (r.empty || r.to > o.from)) {
        t(o, i, r);
        n = o.number;
      }
      a = o.to + 1;
    }
    let a = state.changes(i);
    return {
      changes: i,
      range: k.range(a.mapPos(r.anchor, 1), a.mapPos(r.head, 1)),
    };
  });
}
const sm = ({ state, dispatch }) => {
  if (state.readOnly) {
    return false;
  }
  let n = Object.create(null);
  let r = new wu(state, {
    overrideIndentation: (e) => n[e] ?? -1,
  });
  let i = om(state, (t, i, a) => {
    let o = Cu(r, t.from);
    if (o == null) {
      return;
    }
    if (!/\S/.test(t.text)) {
      o = 0;
    }
    let s = /^\s*/.exec(t.text)[0];
    let c = Su(state, o);
    if (s != c || a.from < t.from + s.length) {
      n[t.from] = o;
      i.push({
        from: t.from,
        to: t.from + s.length,
        insert: c,
      });
    }
  });
  if (!i.changes.empty) {
    dispatch(
      state.update(i, {
        userEvent: `indent`,
      }),
    );
  }
  return true;
};
const cm = ({ state, dispatch }) =>
  !state.readOnly &&
  (dispatch(
    state.update(
      om(state, (t, n) => {
        n.push({
          from: t.from,
          insert: state.facet(bu),
        });
      }),
      {
        userEvent: `input.indent`,
      },
    ),
  ),
  true);
const lm = ({ state, dispatch }) =>
  !state.readOnly &&
  (dispatch(
    state.update(
      om(state, (t, n) => {
        let r = /^\s*/.exec(t.text)[0];
        if (!r) {
          return;
        }
        let i = wt(r, state.tabSize);
        let a = 0;
        let o = Su(state, Math.max(0, i - xu(state)));
        while (
          a < r.length &&
          a < o.length &&
          r.charCodeAt(a) == o.charCodeAt(a)
        ) {
          a++;
        }
        n.push({
          from: t.from + a,
          to: t.from + r.length,
          insert: o.slice(a),
        });
      }),
      {
        userEvent: `delete.dedent`,
      },
    ),
  ),
  true);
const um = (e) => {
  e.setTabFocusMode();
  return true;
};
const dm = [
  {
    key: `Ctrl-b`,
    run: Mf,
    shift: ap,
    preventDefault: true,
  },
  {
    key: `Ctrl-f`,
    run: Nf,
    shift: op,
  },
  {
    key: `Ctrl-p`,
    run: Hf,
    shift: pp,
  },
  {
    key: `Ctrl-n`,
    run: Uf,
    shift: mp,
  },
  {
    key: `Ctrl-a`,
    run: $f,
    shift: Sp,
  },
  {
    key: `Ctrl-e`,
    run: ep,
    shift: Cp,
  },
  {
    key: `Ctrl-d`,
    run: zp,
  },
  {
    key: `Ctrl-h`,
    run: Rp,
  },
  {
    key: `Ctrl-k`,
    run: Up,
  },
  {
    key: `Ctrl-Alt-h`,
    run: Vp,
  },
  {
    key: `Ctrl-o`,
    run: Kp,
  },
  {
    key: `Ctrl-t`,
    run: qp,
  },
  {
    key: `Ctrl-v`,
    run: qf,
  },
];
const fm = [
  {
    key: `ArrowLeft`,
    run: Mf,
    shift: ap,
    preventDefault: true,
  },
  {
    key: `Mod-ArrowLeft`,
    mac: `Alt-ArrowLeft`,
    run: Ff,
    shift: cp,
    preventDefault: true,
  },
  {
    mac: `Cmd-ArrowLeft`,
    run: Zf,
    shift: bp,
    preventDefault: true,
  },
  {
    key: `ArrowRight`,
    run: Nf,
    shift: op,
    preventDefault: true,
  },
  {
    key: `Mod-ArrowRight`,
    mac: `Alt-ArrowRight`,
    run: If,
    shift: lp,
    preventDefault: true,
  },
  {
    mac: `Cmd-ArrowRight`,
    run: Qf,
    shift: xp,
    preventDefault: true,
  },
  {
    key: `ArrowUp`,
    run: Hf,
    shift: pp,
    preventDefault: true,
  },
  {
    mac: `Cmd-ArrowUp`,
    run: wp,
    shift: Ep,
  },
  {
    mac: `Ctrl-ArrowUp`,
    run: Kf,
    shift: gp,
  },
  {
    key: `ArrowDown`,
    run: Uf,
    shift: mp,
    preventDefault: true,
  },
  {
    mac: `Cmd-ArrowDown`,
    run: Tp,
    shift: Dp,
  },
  {
    mac: `Ctrl-ArrowDown`,
    run: qf,
    shift: _p,
  },
  {
    key: `PageUp`,
    run: Kf,
    shift: gp,
  },
  {
    key: `PageDown`,
    run: qf,
    shift: _p,
  },
  {
    key: `Home`,
    run: Xf,
    shift: yp,
    preventDefault: true,
  },
  {
    key: `Mod-Home`,
    run: wp,
    shift: Ep,
  },
  {
    key: `End`,
    run: Yf,
    shift: vp,
    preventDefault: true,
  },
  {
    key: `Mod-End`,
    run: Tp,
    shift: Dp,
  },
  {
    key: `Enter`,
    run: rm,
    shift: rm,
  },
  {
    key: `Mod-a`,
    run: Op,
  },
  {
    key: `Backspace`,
    run: Rp,
    shift: Rp,
    preventDefault: true,
  },
  {
    key: `Delete`,
    run: zp,
    preventDefault: true,
  },
  {
    key: `Mod-Backspace`,
    mac: `Alt-Backspace`,
    run: Vp,
    preventDefault: true,
  },
  {
    key: `Mod-Delete`,
    mac: `Alt-Delete`,
    run: Hp,
    preventDefault: true,
  },
  {
    mac: `Mod-Backspace`,
    run: Wp,
    preventDefault: true,
  },
  {
    mac: `Mod-Delete`,
    run: Gp,
    preventDefault: true,
  },
].concat(
  dm.map((e) => ({
    mac: e.key,
    run: e.run,
    shift: e.shift,
  })),
);
const pm = [
  {
    key: `Alt-ArrowLeft`,
    mac: `Ctrl-ArrowLeft`,
    run: zf,
    shift: up,
  },
  {
    key: `Alt-ArrowRight`,
    mac: `Ctrl-ArrowRight`,
    run: Bf,
    shift: dp,
  },
  {
    key: `Alt-ArrowUp`,
    run: Xp,
  },
  {
    key: `Shift-Alt-ArrowUp`,
    run: $p,
  },
  {
    key: `Alt-ArrowDown`,
    run: Zp,
  },
  {
    key: `Shift-Alt-ArrowDown`,
    run: em,
  },
  {
    key: `Mod-Alt-ArrowUp`,
    run: Mp,
  },
  {
    key: `Mod-Alt-ArrowDown`,
    run: Np,
  },
  {
    key: `Escape`,
    run: Pp,
  },
  {
    key: `Mod-Enter`,
    run: im,
  },
  {
    key: `Alt-l`,
    mac: `Ctrl-l`,
    run: kp,
  },
  {
    key: `Mod-i`,
    run: Ap,
    preventDefault: true,
  },
  {
    key: `Mod-[`,
    run: lm,
  },
  {
    key: `Mod-]`,
    run: cm,
  },
  {
    key: `Mod-Alt-\\`,
    run: sm,
  },
  {
    key: `Shift-Mod-k`,
    run: tm,
  },
  {
    key: `Shift-Mod-\\`,
    run: np,
  },
  {
    key: `Mod-/`,
    run: Wd,
  },
  {
    key: `Alt-A`,
    mac: `Ctrl-A`,
    run: qd,
  },
  {
    key: `Ctrl-m`,
    mac: `Shift-Alt-m`,
    run: um,
  },
].concat(fm);
const mm = {
  key: `Tab`,
  run: cm,
  shift: lm,
};
const hm =
  typeof String.prototype.normalize == `function`
    ? (e) => e.normalize(`NFKD`)
    : (e) => e;
class gm {
  constructor(e, t, n = 0, r = e.length, i, a) {
    this.test = a;
    this.value = {
      from: 0,
      to: 0,
      precise: false,
    };
    this.done = false;
    this.matches = [];
    this.buffer = ``;
    this.bufferPos = 0;
    this.iter = e.iterRange(n, r);
    this.bufferStart = n;
    this.normalize = i ? (e) => i(hm(e)) : hm;
    this.query = this.normalize(t);
  }
  peek() {
    if (this.bufferPos == this.buffer.length) {
      this.bufferStart += this.buffer.length;
      this.iter.next();
      if (this.iter.done) {
        return -1;
      }
      this.bufferPos = 0;
      this.buffer = this.iter.value;
    }
    return w(this.buffer, this.bufferPos);
  }
  next() {
    while (this.matches.length) {
      this.matches.pop();
    }
    return this.nextOverlapping();
  }
  nextOverlapping() {
    while (true) {
      let e = this.peek();
      if (e < 0) {
        this.done = true;
        return this;
      }
      let t = ce(e);
      let n = this.bufferStart + this.bufferPos;
      this.bufferPos += le(e);
      let r = this.normalize(t);
      if (r.length) {
        for (let e = 0, i = n, a = true; ; e++) {
          let n = r.charCodeAt(e);
          let o = this.match(
            n,
            i,
            a,
            this.bufferPos + this.bufferStart,
            e == r.length - 1,
          );
          if (o) {
            this.value = o;
            return this;
          }
          if (e == r.length - 1) {
            break;
          }
          if (a && e < t.length && t.charCodeAt(e) == n) {
            i++;
          } else {
            a = false;
          }
        }
      }
    }
  }
  match(e, t, precise, r, i) {
    let a = null;
    for (let t = 0; t < this.matches.length;) {
      let match = this.matches[t];
      let o = false;
      this.query.charCodeAt(match.index) == e &&
        (match.index == this.query.length - 1
          ? (a = {
              from: match.from,
              to: r,
              precise: i && match.precise,
            })
          : (match.index++, (o = true)));
      if (o) {
        t++;
      } else {
        this.matches.splice(t, 1);
      }
    }
    this.query.charCodeAt(0) == e &&
      (this.query.length == 1
        ? (a = {
            from: t,
            to: r,
            precise: precise && i,
          })
        : this.matches.push({
            from: t,
            index: 1,
            precise,
          }));
    if (
      a &&
      this.test &&
      !this.test(a.from, a.to, this.buffer, this.bufferStart)
    ) {
      a = null;
    }
    return a;
  }
}
if (typeof Symbol < `u`) {
  gm.prototype[Symbol.iterator] = function () {
    return this;
  };
}
const _m = {
  from: -1,
  to: -1,
  match: /.*/.exec(``),
  precise: true,
};
const vm = `gm` + (/x/.unicode == null ? `` : `u`);
class ym {
  constructor(e, t, n, r = 0, i = e.length) {
    this.text = e;
    this.to = i;
    this.curLine = ``;
    this.done = false;
    this.value = _m;
    if (/\\[sWDnr]|\n|\r|\[\^/.test(t)) {
      return new Sm(e, t, n, r, i);
    }
    this.re = new RegExp(t, vm + (n?.ignoreCase ? `i` : ``));
    this.test = n?.test;
    this.iter = e.iter();
    let a = e.lineAt(r);
    this.curLineStart = a.from;
    this.matchPos = wm(e, r);
    this.getLine(this.curLineStart);
  }
  getLine(e) {
    this.iter.next(e);
    if (this.iter.lineBreak) {
      this.curLine = ``;
    } else {
      this.curLine = this.iter.value;
      if (this.curLineStart + this.curLine.length > this.to) {
        this.curLine = this.curLine.slice(0, this.to - this.curLineStart);
      }
      this.iter.next();
    }
  }
  nextLine() {
    this.curLineStart = this.curLineStart + this.curLine.length + 1;
    if (this.curLineStart > this.to) {
      this.curLine = ``;
    } else {
      this.getLine(0);
    }
  }
  next() {
    for (let e = this.matchPos - this.curLineStart; ;) {
      this.re.lastIndex = e;
      let t = this.matchPos <= this.to && this.re.exec(this.curLine);
      if (t) {
        let n = this.curLineStart + t.index;
        let r = n + t[0].length;
        this.matchPos = wm(this.text, r + +(n == r));
        if (n == this.curLineStart + this.curLine.length) {
          this.nextLine();
        }
        if (
          (n < r || n > this.value.to) &&
          (!this.test || this.test(n, r, t))
        ) {
          this.value = {
            from: n,
            to: r,
            precise: true,
            match: t,
          };
          return this;
        }
        e = this.matchPos - this.curLineStart;
      } else if (this.curLineStart + this.curLine.length < this.to) {
        this.nextLine();
        e = 0;
      } else {
        this.done = true;
        return this;
      }
    }
  }
}
const bm = new WeakMap();
const xm = class e {
  constructor(e, t) {
    this.from = e;
    this.text = t;
  }
  get to() {
    return this.from + this.text.length;
  }
  static get(t, n, r) {
    let i = bm.get(t);
    if (!i || i.from >= r || i.to <= n) {
      let i = new e(n, t.sliceString(n, r));
      bm.set(t, i);
      return i;
    }
    if (i.from == n && i.to == r) {
      return i;
    }
    let { text, from } = i;
    if (from > n) {
      text = t.sliceString(n, from) + text;
      from = n;
    }
    if (i.to < r) {
      text += t.sliceString(i.to, r);
    }
    bm.set(t, new e(from, text));
    return new e(n, text.slice(n - from, r - from));
  }
};
var Sm = class {
  constructor(e, t, n, r, i) {
    this.text = e;
    this.to = i;
    this.done = false;
    this.value = _m;
    this.matchPos = wm(e, r);
    this.re = new RegExp(t, vm + (n?.ignoreCase ? `i` : ``));
    this.test = n?.test;
    this.flat = xm.get(e, r, this.chunkEnd(r + 5000));
  }
  chunkEnd(e) {
    if (e >= this.to) {
      return this.to;
    }
    return this.text.lineAt(e).to;
  }
  next() {
    while (true) {
      let e = (this.re.lastIndex = this.matchPos - this.flat.from);
      let t = this.re.exec(this.flat.text);
      if (t && !t[0] && t.index == e) {
        this.re.lastIndex = e + 1;
        t = this.re.exec(this.flat.text);
      }
      if (t) {
        let e = this.flat.from + t.index;
        let n = e + t[0].length;
        if (
          (this.flat.to >= this.to ||
            t.index + t[0].length <= this.flat.text.length - 10) &&
          (!this.test || this.test(e, n, t))
        ) {
          this.value = {
            from: e,
            to: n,
            precise: true,
            match: t,
          };
          this.matchPos = wm(this.text, n + +(e == n));
          return this;
        }
      }
      if (this.flat.to == this.to) {
        this.done = true;
        return this;
      }
      this.flat = xm.get(
        this.text,
        this.flat.from,
        this.chunkEnd(this.flat.from + this.flat.text.length * 2),
      );
    }
  }
};
if (typeof Symbol < `u`) {
  ym.prototype[Symbol.iterator] = Sm.prototype[Symbol.iterator] = function () {
    return this;
  };
}
function Cm(search) {
  try {
    new RegExp(search, vm);
    return true;
  } catch {
    return false;
  }
}
function wm(e, t) {
  if (t >= e.length) {
    return t;
  }
  let n = e.lineAt(t);
  let r;
  while (
    t < n.to &&
    (r = n.text.charCodeAt(t - n.from)) >= 56320 &&
    r < 57344
  ) {
    t++;
  }
  return t;
}
const Tm = (e) => {
  let t = xc(e, `cm-goto-line`);
  if (t) {
    let e = t.dom.querySelector(`input[type=text]`);
    if (e) {
      e.select();
    }
    return true;
  }
  let { state } = e;
  let value = String(state.doc.lineAt(e.state.selection.main.head).number);
  let { close, result } = bc(e, {
    class: `cm-goto-line`,
    label: state.phrase(`Go to line`),
    input: {
      type: `text`,
      name: `line`,
      value,
    },
    focus: true,
    submitLabel: state.phrase(`go`),
  });
  result.then((t) => {
    let r = t && /^([+-])?(\d+)?(:\d+)?(%)?$/.exec(t.elements.line.value);
    if (!r) {
      e.dispatch({
        effects: close,
      });
      return;
    }
    let a = state.doc.lineAt(state.selection.main.head);
    let [, o, s, c, l] = r;
    let u = c ? +c.slice(1) : 0;
    let d = s ? +s : a.number;
    if (s && l) {
      let e = d / 100;
      if (o) {
        e = e * (o == `-` ? -1 : 1) + a.number / state.doc.lines;
      }
      d = Math.round(state.doc.lines * e);
    } else {
      if (s && o) {
        d = d * (o == `-` ? -1 : 1) + a.number;
      }
    }
    let f = state.doc.line(Math.max(1, Math.min(state.doc.lines, d)));
    let p = k.cursor(f.from + Math.max(0, Math.min(u, f.length)));
    e.dispatch({
      effects: [
        close,
        G.scrollIntoView(p.from, {
          y: `center`,
        }),
      ],
      selection: p,
    });
  });
  return true;
};
const Em = {
  highlightWordAroundCursor: false,
  minSelectionLength: 1,
  maxMatches: 100,
  wholeWords: false,
};
const Dm = A.define({
  combine(e) {
    return at(e, Em, {
      highlightWordAroundCursor: (e, t) => e || t,
      minSelectionLength: Math.min,
      maxMatches: Math.min,
    });
  },
});
function Om(e) {
  let t = [Pm, Nm];
  if (e) {
    t.push(Dm.of(e));
  }
  return t;
}
const km = z.mark({
  class: `cm-selectionMatch`,
});
const Am = z.mark({
  class: `cm-selectionMatch cm-selectionMatch-main`,
});
function jm(e, state, from, r) {
  return (
    (from == 0 || e(state.sliceDoc(from - 1, from)) != M.Word) &&
    (r == state.doc.length || e(state.sliceDoc(r, r + 1)) != M.Word)
  );
}
function Mm(e, state, from, r) {
  return (
    e(state.sliceDoc(from, from + 1)) == M.Word &&
    e(state.sliceDoc(r - 1, r)) == M.Word
  );
}
var Nm = H.fromClass(
  class {
    constructor(e) {
      this.decorations = this.getDeco(e);
    }
    update(e) {
      if (e.selectionSet || e.docChanged || e.viewportChanged) {
        this.decorations = this.getDeco(e.view);
      }
    }
    getDeco(e) {
      let t = e.state.facet(Dm);
      let { state } = e;
      let state_selection = state.selection;
      if (state_selection.ranges.length > 1) {
        return z.none;
      }
      let r_main = state_selection.main;
      let a;
      let o = null;
      if (r_main.empty) {
        if (!t.highlightWordAroundCursor) {
          return z.none;
        }
        let e = state.wordAt(r_main.head);
        if (!e) {
          return z.none;
        }
        o = state.charCategorizer(r_main.head);
        a = state.sliceDoc(e.from, e.to);
      } else {
        let e = r_main.to - r_main.from;
        if (e < t.minSelectionLength || e > 200) {
          return z.none;
        }
        if (t.wholeWords) {
          a = state.sliceDoc(r_main.from, r_main.to);
          o = state.charCategorizer(r_main.head);
          if (!(
            jm(o, state, r_main.from, r_main.to) &&
            Mm(o, state, r_main.from, r_main.to)
          )) {
            return z.none;
          }
        } else {
          a = state.sliceDoc(r_main.from, r_main.to);
          if (!a) {
            return z.none;
          }
        }
      }
      let s = [];
      for (let r of e.visibleRanges) {
        let e = new gm(state.doc, a, r.from, r.to);
        while (!e.next().done) {
          let { from, to } = e.value;
          if (
            (!o || jm(o, state, from, to)) &&
            (r_main.empty && from <= r_main.from && to >= r_main.to
              ? s.push(Am.range(from, to))
              : (from >= r_main.to || to <= r_main.from) &&
                s.push(km.range(from, to)),
            s.length > t.maxMatches)
          ) {
            return z.none;
          }
        }
      }
      return z.set(s);
    }
  },
  {
    decorations: (e) => e.decorations,
  },
);
var Pm = G.baseTheme({
  ".cm-selectionMatch": {
    backgroundColor: `#99ff7780`,
  },
  ".cm-searchMatch .cm-selectionMatch": {
    backgroundColor: `transparent`,
  },
});
const Fm = ({ state, dispatch }) => {
  let { selection } = state;
  let r = k.create(
    selection.ranges.map((t) => state.wordAt(t.head) || k.cursor(t.head)),
    selection.mainIndex,
  );
  return (
    !r.eq(selection) &&
    (dispatch(
      state.update({
        selection: r,
      }),
    ),
    true)
  );
};
function Im(state, t) {
  let { main, ranges } = state.selection;
  let i = state.wordAt(main.head);
  let a = i && i.from == main.from && i.to == main.to;
  for (
    let n = false, i = new gm(state.doc, t, ranges[ranges.length - 1].to);
    ;
  ) {
    i.next();
    if (i.done) {
      if (n) {
        return null;
      }
      i = new gm(
        state.doc,
        t,
        0,
        Math.max(0, ranges[ranges.length - 1].from - 1),
      );
      n = true;
    } else {
      if (n && ranges.some((e) => e.from == i.value.from)) {
        continue;
      }
      if (a) {
        let t = state.wordAt(i.value.from);
        if (!t || t.from != i.value.from || t.to != i.value.to) {
          continue;
        }
      }
      return i.value;
    }
  }
}
const Lm = ({ state, dispatch }) => {
  let { ranges } = state.selection;
  if (ranges.some((e) => e.from === e.to)) {
    return Fm({
      state,
      dispatch,
    });
  }
  let r = state.sliceDoc(ranges[0].from, ranges[0].to);
  if (state.selection.ranges.some((t) => state.sliceDoc(t.from, t.to) != r)) {
    return false;
  }
  let i = Im(state, r);
  if (i) {
    return (
      dispatch(
        state.update({
          selection: state.selection.addRange(k.range(i.from, i.to), false),
          effects: G.scrollIntoView(i.to),
        }),
      ),
      true
    );
  }
  return false;
};
const Rm = A.define({
  combine(e) {
    return at(e, {
      top: false,
      caseSensitive: false,
      literal: false,
      regexp: false,
      wholeWord: false,
      createPanel: (e) => new vh(e),
      scrollToMatch: (e) => G.scrollIntoView(e),
    });
  },
});
class zm {
  constructor(e) {
    this.search = e.search;
    this.caseSensitive = !!e.caseSensitive;
    this.literal = !!e.literal;
    this.regexp = !!e.regexp;
    this.replace = e.replace || ``;
    this.valid = !!this.search && (!this.regexp || Cm(this.search));
    this.unquoted = this.unquote(this.search);
    this.wholeWord = !!e.wholeWord;
    this.test = e.test;
  }
  unquote(e) {
    if (this.literal) {
      return e;
    }
    return e.replace(/\\([nrt\\])/g, (e, t) => {
      if (t == `n`) {
        return `
`;
      }
      if (t == `r`) {
        return `\r`;
      }
      if (t == `t`) {
        return `	`;
      }
      return `\\`;
    });
  }
  eq(e) {
    return (
      this.search == e.search &&
      this.replace == e.replace &&
      this.caseSensitive == e.caseSensitive &&
      this.regexp == e.regexp &&
      this.wholeWord == e.wholeWord &&
      this.test == e.test
    );
  }
  create() {
    if (this.regexp) {
      return new Xm(this);
    }
    return new Wm(this);
  }
  getCursor(doc, t = 0, n) {
    let r = doc.doc
      ? doc
      : N.create({
          doc,
        });
    n ??= r.doc.length;
    if (this.regexp) {
      return Km(this, r, t, n);
    }
    return Hm(this, r, t, n);
  }
}
class Bm {
  constructor(e) {
    this.spec = e;
  }
}
function Vm(test, t, n) {
  return (r, i, a, o) => {
    if (n && !n(r, i, a, o)) {
      return false;
    }
    return test(
      r >= o && i <= o + a.length
        ? a.slice(r - o, i - o)
        : t.doc.sliceString(r, i),
      t,
      r,
      i,
    );
  };
}
function Hm(e, t, n, r) {
  let i;
  if (e.wholeWord) {
    i = Um(t.doc, t.charCategorizer(t.selection.main.head));
  }
  if (e.test) {
    i = Vm(e.test, t, i);
  }
  return new gm(
    t.doc,
    e.unquoted,
    n,
    r,
    e.caseSensitive ? undefined : (e) => e.toLowerCase(),
    i,
  );
}
function Um(doc, t) {
  return (n, r, i, a) => {
    if (a > n || a + i.length < r) {
      a = Math.max(0, n - 2);
      i = doc.sliceString(a, Math.min(doc.length, r + 2));
    }
    return (
      (t(qm(i, n - a)) != M.Word || t(Jm(i, n - a)) != M.Word) &&
      (t(Jm(i, r - a)) != M.Word || t(qm(i, r - a)) != M.Word)
    );
  };
}
var Wm = class extends Bm {
  constructor(e) {
    super(e);
  }
  nextMatch(e, t, n) {
    let r = Hm(this.spec, e, n, e.doc.length).nextOverlapping();
    if (r.done) {
      let n = Math.min(e.doc.length, t + this.spec.unquoted.length);
      r = Hm(this.spec, e, 0, n).nextOverlapping();
    }
    if (r.done || (r.value.from == t && r.value.to == n)) {
      return null;
    }
    return r.value;
  }
  prevMatchInRange(e, t, n) {
    for (let r = n; ;) {
      let n = Math.max(t, r - 10000 - this.spec.unquoted.length);
      let i = Hm(this.spec, e, n, r);
      let a = null;
      while (!i.nextOverlapping().done) {
        a = i.value;
      }
      if (a) {
        return a;
      }
      if (n == t) {
        return null;
      }
      r -= 10000;
    }
  }
  prevMatch(e, t, n) {
    let r = this.prevMatchInRange(e, 0, t);
    r ||= this.prevMatchInRange(
      e,
      Math.max(0, n - this.spec.unquoted.length),
      e.doc.length,
    );
    if (r && (r.from != t || r.to != n)) {
      return r;
    }
    return null;
  }
  getReplacement(e) {
    return this.spec.unquote(this.spec.replace);
  }
  matchAll(e, t) {
    let n = Hm(this.spec, e, 0, e.doc.length);
    let r = [];
    while (!n.next().done) {
      if (r.length >= t) {
        return null;
      }
      r.push(n.value);
    }
    return r;
  }
  highlight(e, t, n, r) {
    let i = Hm(
      this.spec,
      e,
      Math.max(0, t - this.spec.unquoted.length),
      Math.min(n + this.spec.unquoted.length, e.doc.length),
    );
    while (!i.next().done) {
      r(i.value.from, i.value.to);
    }
  }
};
function Gm(test, t, n) {
  return (r, i, a) => (!n || n(r, i, a)) && test(a[0], t, r, i);
}
function Km(e, t, n, r) {
  let test;
  if (e.wholeWord) {
    test = Ym(t.charCategorizer(t.selection.main.head));
  }
  if (e.test) {
    test = Gm(e.test, t, test);
  }
  return new ym(
    t.doc,
    e.search,
    {
      ignoreCase: !e.caseSensitive,
      test,
    },
    n,
    r,
  );
}
function qm(e, t) {
  return e.slice(C(e, t, false), t);
}
function Jm(e, t) {
  return e.slice(t, C(e, t));
}
function Ym(e) {
  return (t, n, r) =>
    !r[0].length ||
    ((e(qm(r.input, r.index)) != M.Word || e(Jm(r.input, r.index)) != M.Word) &&
      (e(Jm(r.input, r.index + r[0].length)) != M.Word ||
        e(qm(r.input, r.index + r[0].length)) != M.Word));
}
var Xm = class extends Bm {
  nextMatch(e, t, n) {
    let r = Km(this.spec, e, n, e.doc.length).next();
    if (r.done) {
      r = Km(this.spec, e, 0, t).next();
    }
    if (r.done) {
      return null;
    }
    return r.value;
  }
  prevMatchInRange(e, t, n) {
    for (let r = 1; ; r++) {
      let i = Math.max(t, n - r * 10000);
      let a = Km(this.spec, e, i, n);
      let o = null;
      while (!a.next().done) {
        o = a.value;
      }
      if (o && (i == t || o.from > i + 10)) {
        return o;
      }
      if (i == t) {
        return null;
      }
    }
  }
  prevMatch(e, t, n) {
    return (
      this.prevMatchInRange(e, 0, t) ||
      this.prevMatchInRange(e, n, e.doc.length)
    );
  }
  getReplacement(e) {
    return this.spec
      .unquote(this.spec.replace)
      .replace(/\$([$&]|\d+)/g, (t, n) => {
        if (n == `&`) {
          return e.match[0];
        }
        if (n == `$`) {
          return `$`;
        }
        for (let t = n.length; t > 0; t--) {
          let r = +n.slice(0, t);
          if (r > 0 && r < e.match.length) {
            return e.match[r] + n.slice(t);
          }
        }
        return t;
      });
  }
  matchAll(e, t) {
    let n = Km(this.spec, e, 0, e.doc.length);
    let r = [];
    while (!n.next().done) {
      if (r.length >= t) {
        return null;
      }
      r.push(n.value);
    }
    return r;
  }
  highlight(e, t, n, r) {
    let i = Km(
      this.spec,
      e,
      Math.max(0, t - 250),
      Math.min(n + 250, e.doc.length),
    );
    while (!i.next().done) {
      r(i.value.from, i.value.to);
    }
  }
};
const Zm = j.define();
const Qm = j.define();
const $m = Te.define({
  create(e) {
    return new eh(fh(e).create(), null);
  },
  update(e, t) {
    for (let n of t.effects) {
      if (n.is(Zm)) {
        e = new eh(n.value.create(), e.panel);
      } else if (n.is(Qm)) {
        e = new eh(e.query, n.value ? dh : null);
      }
    }
    return e;
  },
  provide: (e) => yc.from(e, (e) => e.panel),
});
var eh = class {
  constructor(e, t) {
    this.query = e;
    this.panel = t;
  }
};
const th = z.mark({
  class: `cm-searchMatch`,
});
const nh = z.mark({
  class: `cm-searchMatch cm-searchMatch-selected`,
});
const rh = H.fromClass(
  class {
    constructor(e) {
      this.view = e;
      this.decorations = this.highlight(e.state.field($m));
    }
    update(e) {
      let t = e.state.field($m);
      if (
        t != e.startState.field($m) ||
        e.docChanged ||
        e.selectionSet ||
        e.viewportChanged
      ) {
        this.decorations = this.highlight(t);
      }
    }
    highlight({ query, panel }) {
      if (!panel || !query.spec.valid) {
        return z.none;
      }
      let { view } = this;
      let r = new pt();
      for (let t = 0, i = view.visibleRanges, a = i.length; t < a; t++) {
        let { from, to } = i[t];
        while (t < a - 1 && to > i[t + 1].from - 500) {
          to = i[++t].to;
        }
        query.highlight(view.state, from, to, (e, t) => {
          let i = view.state.selection.ranges.some(
            (n) => n.from == e && n.to == t,
          );
          r.add(e, t, i ? nh : th);
        });
      }
      return r.finish();
    }
  },
  {
    decorations: (e) => e.decorations,
  },
);
function ih(e) {
  return (t) => {
    let n = t.state.field($m, false);
    if (n && n.query.spec.valid) {
      return e(t, n);
    }
    return hh(t);
  };
}
const ah = ih((e, { query }) => {
  let { to } = e.state.selection.main;
  let r = query.nextMatch(e.state, to, to);
  if (!r) {
    return false;
  }
  let i = k.single(r.from, r.to);
  let a = e.state.facet(Rm);
  e.dispatch({
    selection: i,
    effects: [Sh(e, r), a.scrollToMatch(i.main, e)],
    userEvent: `select.search`,
  });
  mh(e);
  return true;
});
const oh = ih((e, { query }) => {
  let { state } = e;
  let { from } = state.selection.main;
  let i = query.prevMatch(state, from, from);
  if (!i) {
    return false;
  }
  let a = k.single(i.from, i.to);
  let o = e.state.facet(Rm);
  e.dispatch({
    selection: a,
    effects: [Sh(e, i), o.scrollToMatch(a.main, e)],
    userEvent: `select.search`,
  });
  mh(e);
  return true;
});
const sh = ih((e, { query }) => {
  let n = query.matchAll(e.state, 1000);
  if (!n || !n.length) {
    return false;
  }
  return (
    e.dispatch({
      selection: k.create(n.map((e) => k.range(e.from, e.to))),
      userEvent: `select.search.matches`,
    }),
    true
  );
});
const ch = ({ state, dispatch }) => {
  let state_selection = state.selection;
  if (state_selection.ranges.length > 1 || state_selection.main.empty) {
    return false;
  }
  let { from, to } = state_selection.main;
  let a = [];
  let o = 0;
  for (let t = new gm(state.doc, state.sliceDoc(from, to)); !t.next().done;) {
    if (a.length > 1000) {
      return false;
    }
    if (t.value.from == from) {
      o = a.length;
    }
    a.push(k.range(t.value.from, t.value.to));
  }
  dispatch(
    state.update({
      selection: k.create(a, o),
      userEvent: `select.search.matches`,
    }),
  );
  return true;
};
const lh = ih((e, { query }) => {
  let { state } = e;
  let { from, to } = state.selection.main;
  if (state.readOnly) {
    return false;
  }
  let a = query.nextMatch(state, from, from);
  if (!a) {
    return false;
  }
  let o = a;
  let s = [];
  let c;
  let l;
  let u = [];
  if (o.precise) {
    if (o.from == from && o.to == to) {
      l = state.toText(query.getReplacement(o));
      s.push({
        from: o.from,
        to: o.to,
        insert: l,
      });
      o = query.nextMatch(state, o.from, o.to);
      u.push(
        G.announce.of(
          state.phrase(
            `replaced match on line $`,
            state.doc.lineAt(from).number,
          ) + `.`,
        ),
      );
    }
  } else {
    o = query.nextMatch(state, o.from, o.to);
  }
  let d = e.state.changes(s);
  if (o) {
    c = k.single(o.from, o.to).map(d);
    u.push(Sh(e, o));
    u.push(state.facet(Rm).scrollToMatch(c.main, e));
  }
  e.dispatch({
    changes: d,
    selection: c,
    effects: u,
    userEvent: `input.replace`,
  });
  return true;
});
const uh = ih((e, { query }) => {
  if (e.state.readOnly) {
    return false;
  }
  let n = [];
  for (let r of query.matchAll(e.state, 1000000000)) {
    let { from, to, precise } = r;
    if (precise) {
      n.push({
        from,
        to,
        insert: query.getReplacement(r),
      });
    }
  }
  if (!n.length) {
    return false;
  }
  let r = e.state.phrase(`replaced $ matches`, n.length) + `.`;
  e.dispatch({
    changes: n,
    effects: G.announce.of(r),
    userEvent: `input.replace.all`,
  });
  return true;
});
function dh(e) {
  return e.state.facet(Rm).createPanel(e);
}
function fh(e, t) {
  let main = e.selection.main;
  let r =
    main.empty || main.to > main.from + 100
      ? ``
      : e.sliceDoc(main.from, main.to);
  if (t && !r) {
    return t;
  }
  let i = e.facet(Rm);
  return new zm({
    search: (t?.literal ?? i.literal) ? r : r.replace(/\n/g, `\\n`),
    caseSensitive: t?.caseSensitive ?? i.caseSensitive,
    literal: t?.literal ?? i.literal,
    regexp: t?.regexp ?? i.regexp,
    wholeWord: t?.wholeWord ?? i.wholeWord,
  });
}
function ph(e) {
  let t = hc(e, dh);
  return t && t.dom.querySelector(`[main-field]`);
}
function mh(e) {
  let t = ph(e);
  if (t && t == e.root.activeElement) {
    t.select();
  }
}
var hh = (e) => {
  let t = e.state.field($m, false);
  if (t && t.panel) {
    let n = ph(e);
    if (n && n != e.root.activeElement) {
      let r = fh(e.state, t.query.spec);
      if (r.valid) {
        e.dispatch({
          effects: Zm.of(r),
        });
      }
      n.focus();
      n.select();
    }
  } else {
    e.dispatch({
      effects: [
        Qm.of(true),
        t ? Zm.of(fh(e.state, t.query.spec)) : j.appendConfig.of(wh),
      ],
    });
  }
  return true;
};
const gh = (e) => {
  let t = e.state.field($m, false);
  if (!t || !t.panel) {
    return false;
  }
  let n = hc(e, dh);
  if (n && n.dom.contains(e.root.activeElement)) {
    e.focus();
  }
  e.dispatch({
    effects: Qm.of(false),
  });
  return true;
};
const _h = [
  {
    key: `Mod-f`,
    run: hh,
    scope: `editor search-panel`,
  },
  {
    key: `F3`,
    run: ah,
    shift: oh,
    scope: `editor search-panel`,
    preventDefault: true,
  },
  {
    key: `Mod-g`,
    run: ah,
    shift: oh,
    scope: `editor search-panel`,
    preventDefault: true,
  },
  {
    key: `Escape`,
    run: gh,
    scope: `editor search-panel`,
  },
  {
    key: `Mod-Shift-l`,
    run: ch,
  },
  {
    key: `Mod-Alt-g`,
    run: Tm,
  },
  {
    key: `Mod-d`,
    run: Lm,
    preventDefault: true,
  },
];
var vh = class {
  constructor(e) {
    this.view = e;
    let t = (this.query = e.state.field($m).query.spec);
    this.commit = this.commit.bind(this);
    this.searchField = I(`input`, {
      value: t.search,
      placeholder: yh(e, `Find`),
      "aria-label": yh(e, `Find`),
      class: `cm-textfield`,
      name: `search`,
      form: ``,
      "main-field": `true`,
      onchange: this.commit,
      onkeyup: this.commit,
    });
    this.replaceField = I(`input`, {
      value: t.replace,
      placeholder: yh(e, `Replace`),
      "aria-label": yh(e, `Replace`),
      class: `cm-textfield`,
      name: `replace`,
      form: ``,
      onchange: this.commit,
      onkeyup: this.commit,
    });
    this.caseField = I(`input`, {
      type: `checkbox`,
      name: `case`,
      form: ``,
      checked: t.caseSensitive,
      onchange: this.commit,
    });
    this.reField = I(`input`, {
      type: `checkbox`,
      name: `re`,
      form: ``,
      checked: t.regexp,
      onchange: this.commit,
    });
    this.wordField = I(`input`, {
      type: `checkbox`,
      name: `word`,
      form: ``,
      checked: t.wholeWord,
      onchange: this.commit,
    });
    function n(name, t, n) {
      return I(
        `button`,
        {
          class: `cm-button`,
          name,
          onclick: t,
          type: `button`,
        },
        n,
      );
    }
    this.dom = I(
      `div`,
      {
        onkeydown: (e) => this.keydown(e),
        class: `cm-search`,
      },
      [
        this.searchField,
        n(`next`, () => ah(e), [yh(e, `next`)]),
        n(`prev`, () => oh(e), [yh(e, `previous`)]),
        n(`select`, () => sh(e), [yh(e, `all`)]),
        I(`label`, null, [this.caseField, yh(e, `match case`)]),
        I(`label`, null, [this.reField, yh(e, `regexp`)]),
        I(`label`, null, [this.wordField, yh(e, `by word`)]),
        ...(e.state.readOnly
          ? []
          : [
              I(`br`),
              this.replaceField,
              n(`replace`, () => lh(e), [yh(e, `replace`)]),
              n(`replaceAll`, () => uh(e), [yh(e, `replace all`)]),
            ]),
        I(
          `button`,
          {
            name: `close`,
            onclick: () => gh(e),
            "aria-label": yh(e, `close`),
            type: `button`,
          },
          [`×`],
        ),
      ],
    );
  }
  commit() {
    let e = new zm({
      search: this.searchField.value,
      caseSensitive: this.caseField.checked,
      regexp: this.reField.checked,
      wholeWord: this.wordField.checked,
      replace: this.replaceField.value,
    });
    if (!e.eq(this.query)) {
      this.query = e;
      this.view.dispatch({
        effects: Zm.of(e),
      });
    }
  }
  keydown(e) {
    if (Wo(this.view, e, `search-panel`)) {
      e.preventDefault();
    } else if (e.keyCode == 13 && e.target == this.searchField) {
      e.preventDefault();
      (e.shiftKey ? oh : ah)(this.view);
    } else if (e.keyCode == 13 && e.target == this.replaceField) {
      e.preventDefault();
      lh(this.view);
    }
  }
  update(e) {
    for (let t of e.transactions) {
      for (let e of t.effects) {
        if (e.is(Zm) && !e.value.eq(this.query)) {
          this.setQuery(e.value);
        }
      }
    }
  }
  setQuery(e) {
    this.query = e;
    this.searchField.value = e.search;
    this.replaceField.value = e.replace;
    this.caseField.checked = e.caseSensitive;
    this.reField.checked = e.regexp;
    this.wordField.checked = e.wholeWord;
  }
  mount() {
    this.searchField.select();
  }
  get pos() {
    return 80;
  }
  get top() {
    return this.view.state.facet(Rm).top;
  }
};
function yh(e, t) {
  return e.state.phrase(t);
}
var bh = 30;
var xh = /[\s\.,:;?!]/;
function Sh(e, { from, to }) {
  let r = e.state.doc.lineAt(from);
  let i = e.state.doc.lineAt(to).to;
  let a = Math.max(r.from, from - bh);
  let o = Math.min(i, to + bh);
  let s = e.state.sliceDoc(a, o);
  if (a != r.from) {
    for (let e = 0; e < bh; e++) {
      if (!xh.test(s[e + 1]) && xh.test(s[e])) {
        s = s.slice(e);
        break;
      }
    }
  }
  if (o != i) {
    for (let e = s.length - 1; e > s.length - bh; e--) {
      if (!xh.test(s[e - 1]) && xh.test(s[e])) {
        s = s.slice(0, e);
        break;
      }
    }
  }
  return G.announce.of(
    `${e.state.phrase(`current match`)}. ${s} ${e.state.phrase(`on line`)} ${r.number}.`,
  );
}
const Ch = G.baseTheme({
  ".cm-panel.cm-search": {
    padding: `2px 6px 4px`,
    position: `relative`,
    "& [name=close]": {
      position: `absolute`,
      top: `0`,
      right: `4px`,
      backgroundColor: `inherit`,
      border: `none`,
      font: `inherit`,
      padding: 0,
      margin: 0,
    },
    "& input, & button, & label": {
      margin: `.2em .6em .2em 0`,
    },
    "& input[type=checkbox]": {
      marginRight: `.2em`,
    },
    "& label": {
      fontSize: `80%`,
      whiteSpace: `pre`,
    },
  },
  "&light .cm-searchMatch": {
    backgroundColor: `#ffff0054`,
  },
  "&dark .cm-searchMatch": {
    backgroundColor: `#00ffff8a`,
  },
  "&light .cm-searchMatch-selected": {
    backgroundColor: `#ff6a0054`,
  },
  "&dark .cm-searchMatch-selected": {
    backgroundColor: `#ff00ff8a`,
  },
});
var wh = [$m, Oe.low(rh), Ch];
class Th {
  constructor(e, t, n, r) {
    this.state = e;
    this.pos = t;
    this.explicit = n;
    this.view = r;
    this.abortListeners = [];
    this.abortOnDocChange = false;
  }
  tokenBefore(e) {
    let t = Z(this.state).resolveInner(this.pos, -1);
    while (t && e.indexOf(t.name) < 0) {
      t = t.parent;
    }
    if (t) {
      return {
        from: t.from,
        to: this.pos,
        text: this.state.sliceDoc(t.from, this.pos),
        type: t.type,
      };
    }
    return null;
  }
  matchBefore(e) {
    let t = this.state.doc.lineAt(this.pos);
    let n = Math.max(t.from, this.pos - 250);
    let r = t.text.slice(n - t.from, this.pos - t.from);
    let i = r.search(jh(e, false));
    if (i < 0) {
      return null;
    }
    return {
      from: n + i,
      to: this.pos,
      text: r.slice(i),
    };
  }
  get aborted() {
    return this.abortListeners == null;
  }
  addEventListener(e, t, n) {
    if (e == `abort` && this.abortListeners) {
      this.abortListeners.push(t);
      if (n && n.onDocChange) {
        this.abortOnDocChange = true;
      }
    }
  }
}
function Eh(e) {
  let t = Object.keys(e).join(``);
  let n = /\w/.test(t);
  if (n) {
    t = t.replace(/\w/g, ``);
  }
  return `[${n ? `\\w` : ``}${t.replace(/[^\w\s]/g, `\\$&`)}]`;
}
function Dh(options) {
  let t = Object.create(null);
  let n = Object.create(null);
  for (let { label } of options) {
    t[label[0]] = true;
    for (let e = 1; e < label.length; e++) {
      n[label[e]] = true;
    }
  }
  let r = Eh(t) + Eh(n) + `*$`;
  return [RegExp(`^` + r), new RegExp(r)];
}
function Oh(e) {
  let options = e.map((label) => {
    if (typeof label == `string`) {
      return {
        label,
      };
    }
    return label;
  });
  let [validFor, r] = options.every((e) => /^\w+$/.test(e.label))
    ? [/\w*$/, /\w+$/]
    : Dh(options);
  return (e) => {
    let i = e.matchBefore(r);
    if (i || e.explicit) {
      return {
        from: i ? i.from : e.pos,
        options,
        validFor,
      };
    }
    return null;
  };
}
class kh {
  constructor(e, t, n, r) {
    this.completion = e;
    this.source = t;
    this.match = n;
    this.score = r;
  }
}
function Ah(e) {
  return e.selection.main.from;
}
function jh(e, t) {
  let { source } = e;
  let r = t && source[0] != `^`;
  let i = source[source.length - 1] != `$`;
  if (!r && !i) {
    return e;
  }
  return RegExp(
    `${r ? `^` : ``}(?:${source})${i ? `$` : ``}`,
    e.flags ?? (e.ignoreCase ? `i` : ``),
  );
}
const Mh = Ue.define();
function Nh(state, t, from, r) {
  let { main } = state.selection;
  let a = from - main.from;
  let o = r - main.from;
  return {
    ...state.changeByRange((s) => {
      if (
        s != main &&
        from != r &&
        state.sliceDoc(s.from + a, s.from + o) != state.sliceDoc(from, r)
      ) {
        return {
          range: s,
        };
      }
      let c = state.toText(t);
      return {
        changes: {
          from: s.from + a,
          to: r == main.from ? s.to : s.from + o,
          insert: c,
        },
        range: k.cursor(s.from + a + c.length),
      };
    }),
    scrollIntoView: true,
    userEvent: `input.complete`,
  };
}
const Ph = new WeakMap();
function Fh(e) {
  if (!Array.isArray(e)) {
    return e;
  }
  let t = Ph.get(e);
  if (!t) {
    Ph.set(e, (t = Oh(e)));
  }
  return t;
}
const Ih = j.define();
const Lh = j.define();
class Rh {
  constructor(e) {
    this.pattern = e;
    this.chars = [];
    this.folded = [];
    this.any = [];
    this.precise = [];
    this.byWord = [];
    this.score = 0;
    this.matched = [];
    for (let t = 0; t < e.length;) {
      let n = w(e, t);
      let r = le(n);
      this.chars.push(n);
      let i = e.slice(t, t + r);
      let a = i.toUpperCase();
      this.folded.push(w(a == i ? i.toLowerCase() : a, 0));
      t += r;
    }
    this.astral = e.length != this.chars.length;
  }
  ret(e, t) {
    this.score = e;
    this.matched = t;
    return this;
  }
  match(e) {
    if (this.pattern.length == 0) {
      return this.ret(-100, []);
    }
    if (e.length < this.pattern.length) {
      return null;
    }
    let { chars, folded, any, precise, byWord } = this;
    if (chars.length == 1) {
      let r = w(e, 0);
      let i = le(r);
      let a = i == e.length ? 0 : -100;
      if (r != chars[0]) {
        if (r == folded[0]) {
          a += -200;
        } else {
          return null;
        }
      }
      return this.ret(a, [0, i]);
    }
    let o = e.indexOf(this.pattern);
    if (o == 0) {
      return this.ret(e.length == this.pattern.length ? 0 : -100, [
        0,
        this.pattern.length,
      ]);
    }
    let chars_length = chars.length;
    let c = 0;
    if (o < 0) {
      for (let i = 0, a = Math.min(e.length, 200); i < a && c < chars_length;) {
        let a = w(e, i);
        if (a == chars[c] || a == folded[c]) {
          any[c++] = i;
        }
        i += le(a);
      }
      if (c < chars_length) {
        return null;
      }
    }
    let l = 0;
    let u = 0;
    let d = false;
    let f = 0;
    let p = -1;
    let m = -1;
    let h = /[a-z]/.test(e);
    let g = true;
    for (
      let r = 0, c = Math.min(e.length, 200), _ = 0;
      r < c && u < chars_length;
    ) {
      let c = w(e, r);
      o < 0 &&
        (l < chars_length && c == chars[l] && (precise[l++] = r),
        f < chars_length &&
          (c == chars[f] || c == folded[f]
            ? (f == 0 && (p = r), (m = r + 1), f++)
            : (f = 0)));
      let v;
      let y =
        c < 255
          ? (c >= 48 && c <= 57) || (c >= 97 && c <= 122)
            ? 2
            : +(c >= 65 && c <= 90)
          : (v = ce(c)) == v.toLowerCase()
            ? v == v.toUpperCase()
              ? 0
              : 2
            : 1;
      (!r || (y == 1 && h) || (_ == 0 && y != 0)) &&
        (chars[u] == c || (folded[u] == c && (d = true))
          ? (byWord[u++] = r)
          : byWord.length && (g = false));
      _ = y;
      r += le(c);
    }
    if (u == chars_length && byWord[0] == 0 && g) {
      return this.result(-100 + (d ? -200 : 0), byWord, e);
    }
    if (f == chars_length && p == 0) {
      return this.ret(-200 - e.length + (m == e.length ? 0 : -100), [0, m]);
    }
    if (o > -1) {
      return this.ret(-700 - e.length, [o, o + this.pattern.length]);
    }
    if (f == chars_length) {
      return this.ret(-900 - e.length, [p, m]);
    }
    if (u == chars_length) {
      return this.result(
        -100 + (d ? -200 : 0) + -700 + (g ? 0 : -1100),
        byWord,
        e,
      );
    }
    if (chars.length == 2) {
      return null;
    }
    return this.result((any[0] ? -700 : 0) + -200 + -1100, any, e);
  }
  result(e, t, n) {
    let r = [];
    let i = 0;
    for (let e of t) {
      let t = e + (this.astral ? le(w(n, e)) : 1);
      if (i && r[i - 1] == e) {
        r[i - 1] = t;
      } else {
        r[i++] = e;
        r[i++] = t;
      }
    }
    return this.ret(e - n.length, r);
  }
}
class zh {
  constructor(e) {
    this.pattern = e;
    this.matched = [];
    this.score = 0;
    this.folded = e.toLowerCase();
  }
  match(e) {
    if (e.length < this.pattern.length) {
      return null;
    }
    let t = e.slice(0, this.pattern.length);
    let n =
      t == this.pattern ? 0 : t.toLowerCase() == this.folded ? -200 : null;
    if (n == null) {
      return null;
    }
    return (
      (this.matched = [0, t.length]),
      (this.score = n + (e.length == this.pattern.length ? 0 : -100)),
      this
    );
  }
}
const $ = A.define({
  combine(e) {
    return at(
      e,
      {
        activateOnTyping: true,
        activateOnCompletion: () => false,
        activateOnTypingDelay: 100,
        selectOnOpen: true,
        override: null,
        closeOnBlur: true,
        maxRenderedOptions: 100,
        defaultKeymap: true,
        tooltipClass: () => ``,
        optionClass: () => ``,
        aboveCursor: false,
        icons: true,
        addToOptions: [],
        positionInfo,
        filterStrict: false,
        compareCompletions: (e, t) =>
          (e.sortText || e.label).localeCompare(t.sortText || t.label),
        interactionDelay: 75,
        updateSyncTime: 100,
      },
      {
        defaultKeymap: (e, t) => e && t,
        closeOnBlur: (e, t) => e && t,
        icons: (e, t) => e && t,
        tooltipClass: (e, t) => (n) => Bh(e(n), t(n)),
        optionClass: (e, t) => (n) => Bh(e(n), t(n)),
        addToOptions: (e, t) => e.concat(t),
        filterStrict: (e, t) => e || t,
      },
    );
  },
});
function Bh(e, t) {
  if (e) {
    if (t) {
      return e + ` ` + t;
    }
    return e;
  }
  return t;
}
function positionInfo(e, t, n, r, i, a) {
  let o = e.textDirection == B.RTL;
  let s = o;
  let c = false;
  let l = `top`;
  let u;
  let d;
  let f = t.left - i.left;
  let p = i.right - t.right;
  let m = r.right - r.left;
  let h = r.bottom - r.top;
  if (s && f < Math.min(m, p)) {
    s = false;
  } else if (!s && p < Math.min(m, f)) {
    s = true;
  }
  if (m <= (s ? f : p)) {
    u = Math.max(i.top, Math.min(n.top, i.bottom - h)) - t.top;
    d = Math.min(400, s ? f : p);
  } else {
    c = true;
    d = Math.min(400, (o ? t.right : i.right - t.left) - 30);
    let e = i.bottom - t.bottom;
    if (e >= h || e > t.top) {
      u = n.bottom - t.top;
    } else {
      l = `bottom`;
      u = t.bottom - n.top;
    }
  }
  let g = (t.bottom - t.top) / a.offsetHeight;
  let _ = (t.right - t.left) / a.offsetWidth;
  return {
    style: `${l}: ${u / g}px; max-width: ${d / _}px`,
    class:
      `cm-completionInfo-` +
      (c ? (o ? `left-narrow` : `right-narrow`) : s ? `left` : `right`),
  };
}
const Hh = j.define();
function Uh(e) {
  let t = e.addToOptions.slice();
  if (e.icons) {
    t.push({
      render(e) {
        let t = document.createElement(`div`);
        t.classList.add(`cm-completionIcon`);
        if (e.type) {
          t.classList.add(
            ...e.type.split(/\s+/g).map((e) => `cm-completionIcon-` + e),
          );
        }
        t.setAttribute(`aria-hidden`, `true`);
        return t;
      },
      position: 20,
    });
  }
  t.push(
    {
      render(e, t, n, r) {
        let i = document.createElement(`span`);
        i.className = `cm-completionLabel`;
        let a = e.displayLabel || e.label;
        let o = 0;
        for (let e = 0; e < r.length;) {
          let t = r[e++];
          let n = r[e++];
          if (t > o) {
            i.appendChild(document.createTextNode(a.slice(o, t)));
          }
          let s = i.appendChild(document.createElement(`span`));
          s.appendChild(document.createTextNode(a.slice(t, n)));
          s.className = `cm-completionMatchedText`;
          o = n;
        }
        if (o < a.length) {
          i.appendChild(document.createTextNode(a.slice(o)));
        }
        return i;
      },
      position: 50,
    },
    {
      render(e) {
        if (!e.detail) {
          return null;
        }
        let t = document.createElement(`span`);
        t.className = `cm-completionDetail`;
        t.textContent = e.detail;
        return t;
      },
      position: 80,
    },
  );
  return t.sort((e, t) => e.position - t.position).map((e) => e.render);
}
function Wh(e, t, maxRenderedOptions) {
  if (e <= maxRenderedOptions) {
    return {
      from: 0,
      to: e,
    };
  }
  if (t < 0) {
    t = 0;
  }
  if (t <= e >> 1) {
    let e = Math.floor(t / maxRenderedOptions);
    return {
      from: e * maxRenderedOptions,
      to: (e + 1) * maxRenderedOptions,
    };
  }
  let r = Math.ceil((e - t) / maxRenderedOptions);
  return {
    from: e - r * maxRenderedOptions,
    to: e - (r - 1) * maxRenderedOptions,
  };
}
class Gh {
  constructor(e, t, n) {
    this.view = e;
    this.stateField = t;
    this.applyCompletion = n;
    this.info = null;
    this.infoDestroy = null;
    this.placeInfoReq = {
      read: () => this.measureInfo(),
      write: (e) => this.placeInfo(e),
      key: this,
    };
    this.space = null;
    this.currentClass = ``;
    let r = e.state.field(t);
    let { options, selected } = r.open;
    let o = e.state.facet($);
    this.optionContent = Uh(o);
    this.optionClass = o.optionClass;
    this.tooltipClass = o.tooltipClass;
    this.range = Wh(options.length, selected, o.maxRenderedOptions);
    this.dom = document.createElement(`div`);
    this.dom.className = `cm-tooltip-autocomplete`;
    this.updateTooltipClass(e.state);
    this.dom.addEventListener(`mousedown`, (n) => {
      let { options } = e.state.field(t).open;
      for (let t = n.target, i; t && t != this.dom; t = t.parentNode) {
        if (
          t.nodeName == `LI` &&
          (i = /-(\d+)$/.exec(t.id)) &&
          +i[1] < options.length
        ) {
          this.applyCompletion(e, options[+i[1]]);
          n.preventDefault();
          return;
        }
      }
      if (n.target == this.list) {
        let t =
          this.list.classList.contains(`cm-completionListIncompleteTop`) &&
          n.clientY < this.list.firstChild.getBoundingClientRect().top
            ? this.range.from - 1
            : this.list.classList.contains(
                  `cm-completionListIncompleteBottom`,
                ) &&
                n.clientY > this.list.lastChild.getBoundingClientRect().bottom
              ? this.range.to
              : null;
        if (t != null) {
          e.dispatch({
            effects: Hh.of(t),
          });
          n.preventDefault();
        }
      }
    });
    this.dom.addEventListener(`focusout`, (t) => {
      let n = e.state.field(this.stateField, false);
      if (
        n &&
        n.tooltip &&
        e.state.facet($).closeOnBlur &&
        t.relatedTarget != e.contentDOM
      ) {
        e.dispatch({
          effects: Lh.of(null),
        });
      }
    });
    this.showOptions(options, r.id);
  }
  mount() {
    this.updateSel();
  }
  showOptions(e, t) {
    if (this.list) {
      this.list.remove();
    }
    this.list = this.dom.appendChild(this.createListBox(e, t, this.range));
    this.list.addEventListener(`scroll`, () => {
      if (this.info) {
        this.view.requestMeasure(this.placeInfoReq);
      }
    });
  }
  update(e) {
    let t = e.state.field(this.stateField);
    let n = e.startState.field(this.stateField);
    this.updateTooltipClass(e.state);
    if (t != n) {
      let { options, selected, disabled } = t.open;
      if (!n.open || n.open.options != options) {
        this.range = Wh(
          options.length,
          selected,
          e.state.facet($).maxRenderedOptions,
        );
        this.showOptions(options, t.id);
      }
      this.updateSel();
      if (disabled != n.open?.disabled) {
        this.dom.classList.toggle(
          `cm-tooltip-autocomplete-disabled`,
          !!disabled,
        );
      }
    }
  }
  updateTooltipClass(e) {
    let t = this.tooltipClass(e);
    if (t != this.currentClass) {
      for (let e of this.currentClass.split(` `)) {
        if (e) {
          this.dom.classList.remove(e);
        }
      }
      for (let e of t.split(` `)) {
        if (e) {
          this.dom.classList.add(e);
        }
      }
      this.currentClass = t;
    }
  }
  positioned(e) {
    this.space = e;
    if (this.info) {
      this.view.requestMeasure(this.placeInfoReq);
    }
  }
  updateSel() {
    let e = this.view.state.field(this.stateField);
    let e_open = e.open;
    if (
      (e_open.selected > -1 && e_open.selected < this.range.from) ||
      e_open.selected >= this.range.to
    ) {
      this.range = Wh(
        e_open.options.length,
        e_open.selected,
        this.view.state.facet($).maxRenderedOptions,
      );
      this.showOptions(e_open.options, e.id);
    }
    let n = this.updateSelectedOption(e_open.selected);
    if (n) {
      this.destroyInfo();
      let { completion } = e_open.options[e_open.selected];
      let { info } = completion;
      if (!info) {
        return;
      }
      let a =
        typeof info == `string`
          ? document.createTextNode(info)
          : info(completion);
      if (!a) {
        return;
      }
      if (`then` in a) {
        a.then((t) => {
          if (t && this.view.state.field(this.stateField, false) == e) {
            this.addInfoPane(t, completion);
          }
        }).catch((e) => Sr(this.view.state, e, `completion info`));
      } else {
        this.addInfoPane(a, completion);
        n.setAttribute(`aria-describedby`, this.info.id);
      }
    }
  }
  addInfoPane(e, t) {
    this.destroyInfo();
    let n = (this.info = document.createElement(`div`));
    n.className = `cm-tooltip cm-completionInfo`;
    n.id =
      `cm-completionInfo-` + Math.floor(Math.random() * 65535).toString(16);
    if (e.nodeType != null) {
      n.appendChild(e);
      this.infoDestroy = null;
    } else {
      let { dom, destroy } = e;
      n.appendChild(dom);
      this.infoDestroy = destroy || null;
    }
    this.dom.appendChild(n);
    this.view.requestMeasure(this.placeInfoReq);
  }
  updateSelectedOption(e) {
    let t = null;
    for (
      let n = this.list.firstChild, r = this.range.from;
      n;
      n = n.nextSibling, r++
    ) {
      n.nodeName != `LI` || !n.id
        ? r--
        : r == e
          ? n.hasAttribute(`aria-selected`) ||
            (n.setAttribute(`aria-selected`, `true`), (t = n))
          : n.hasAttribute(`aria-selected`) &&
            (n.removeAttribute(`aria-selected`),
            n.removeAttribute(`aria-describedby`));
    }
    if (t) {
      qh(this.list, t);
    }
    return t;
  }
  measureInfo() {
    let e = this.dom.querySelector(`[aria-selected]`);
    if (!e || !this.info) {
      return null;
    }
    let t = this.dom.getBoundingClientRect();
    let n = this.info.getBoundingClientRect();
    let r = e.getBoundingClientRect();
    let space = this.space;
    if (!space) {
      let e = this.dom.ownerDocument.documentElement;
      space = {
        left: 0,
        top: 0,
        right: e.clientWidth,
        bottom: e.clientHeight,
      };
    }
    if (
      r.top > Math.min(space.bottom, t.bottom) - 10 ||
      r.bottom < Math.max(space.top, t.top) + 10
    ) {
      return null;
    }
    return this.view.state
      .facet($)
      .positionInfo(this.view, t, r, n, space, this.dom);
  }
  placeInfo(e) {
    this.info &&
      (e
        ? (e.style && (this.info.style.cssText = e.style),
          (this.info.className =
            `cm-tooltip cm-completionInfo ` + (e.class || ``)))
        : (this.info.style.cssText = `top: -1e6px`));
  }
  createListBox(e, t, n) {
    let r = document.createElement(`ul`);
    r.id = t;
    r.setAttribute(`role`, `listbox`);
    r.setAttribute(`aria-expanded`, `true`);
    r.setAttribute(`aria-label`, this.view.state.phrase(`Completions`));
    r.addEventListener(`mousedown`, (e) => {
      if (e.target == r) {
        e.preventDefault();
      }
    });
    let i = null;
    for (let a = n.from; a < n.to; a++) {
      let { completion, match } = e[a];
      let { section } = completion;
      if (section) {
        let e = typeof section == `string` ? section : section.name;
        if (e != i && (a > n.from || n.from == 0)) {
          i = e;
          if (typeof section != `string` && section.header) {
            r.appendChild(section.header(section));
          } else {
            let t = r.appendChild(document.createElement(`completion-section`));
            t.textContent = e;
          }
        }
      }
      let l = r.appendChild(document.createElement(`li`));
      l.id = t + `-` + a;
      l.setAttribute(`role`, `option`);
      let u = this.optionClass(completion);
      if (u) {
        l.className = u;
      }
      for (let e of this.optionContent) {
        let t = e(completion, this.view.state, this.view, match);
        if (t) {
          l.appendChild(t);
        }
      }
    }
    if (n.from) {
      r.classList.add(`cm-completionListIncompleteTop`);
    }
    if (n.to < e.length) {
      r.classList.add(`cm-completionListIncompleteBottom`);
    }
    return r;
  }
  destroyInfo() {
    this.info &&=
      (this.infoDestroy && this.infoDestroy(), this.info.remove(), null);
  }
  destroy() {
    this.destroyInfo();
  }
}
function Kh(e, t) {
  return (n) => new Gh(n, e, t);
}
function qh(list, t) {
  let n = list.getBoundingClientRect();
  let r = t.getBoundingClientRect();
  let i = n.height / list.offsetHeight;
  if (r.top < n.top) {
    list.scrollTop -= (n.top - r.top) / i;
  } else if (r.bottom > n.bottom) {
    list.scrollTop += (r.bottom - n.bottom) / i;
  }
}
function Jh(e) {
  return (
    (e.boost || 0) * 100 + (e.apply ? 10 : 0) + (e.info ? 5 : 0) + +!!e.type
  );
}
function Yh(e, t) {
  let n = [];
  let r = null;
  let i = null;
  let a = (e) => {
    n.push(e);
    let { section } = e.completion;
    if (section) {
      r ||= [];
      let e = typeof section == `string` ? section : section.name;
      if (!r.some((t) => t.name == e)) {
        r.push(
          typeof section == `string`
            ? {
                name: e,
              }
            : section,
        );
      }
    }
  };
  let o = t.facet($);
  for (let r of e) {
    if (r.hasResult()) {
      let e = r.result.getMatch;
      if (r.result.filter === false) {
        for (let t of r.result.options) {
          a(new kh(t, r.source, e ? e(t) : [], 1000000000 - n.length));
        }
      } else {
        let n = t.sliceDoc(r.from, r.to);
        let s;
        let c = o.filterStrict ? new zh(n) : new Rh(n);
        for (let t of r.result.options) {
          if ((s = c.match(t.label))) {
            let n = t.displayLabel ? (e ? e(t, s.matched) : []) : s.matched;
            let o = s.score + (t.boost || 0);
            a(new kh(t, r.source, n, o));
            if (typeof t.section == `object` && t.section.rank === `dynamic`) {
              let { name } = t.section;
              i ||= Object.create(null);
              i[name] = Math.max(o, i[name] || -1000000000);
            }
          }
        }
      }
    }
  }
  if (r) {
    let e = Object.create(null);
    let t = 0;
    let a = (e, t) =>
      (e.rank === `dynamic` && t.rank === `dynamic`
        ? i[t.name] - i[e.name]
        : 0) ||
      (typeof e.rank == `number` ? e.rank : 1000000000) -
        (typeof t.rank == `number` ? t.rank : 1000000000) ||
      (e.name < t.name ? -1 : 1);
    for (let n of r.sort(a)) {
      t -= 100000;
      e[n.name] = t;
    }
    for (let t of n) {
      let { section } = t.completion;
      if (section) {
        t.score += e[typeof section == `string` ? section : section.name];
      }
    }
  }
  let s = [];
  let c = null;
  let o_compareCompletions = o.compareCompletions;
  for (let e of n.sort(
    (e, t) =>
      t.score - e.score || o_compareCompletions(e.completion, t.completion),
  )) {
    let t = e.completion;
    if (
      !c ||
      c.label != t.label ||
      c.detail != t.detail ||
      (c.type != null && t.type != null && c.type != t.type) ||
      c.apply != t.apply ||
      c.boost != t.boost
    ) {
      s.push(e);
    } else if (Jh(e.completion) > Jh(c)) {
      s[s.length - 1] = e;
    }
    c = e.completion;
  }
  return s;
}
const Xh = class e {
  constructor(e, t, n, r, i, a) {
    this.options = e;
    this.attrs = t;
    this.tooltip = n;
    this.timestamp = r;
    this.selected = i;
    this.disabled = a;
  }
  setSelected(t, n) {
    if (t == this.selected || t >= this.options.length) {
      return this;
    }
    return new e(
      this.options,
      tg(n, t),
      this.tooltip,
      this.timestamp,
      t,
      this.disabled,
    );
  }
  static build(t, n, r, i, a, o) {
    if (i && !o && t.some((e) => e.isPending)) {
      return i.setDisabled();
    }
    let s = Yh(t, n);
    if (!s.length) {
      if (i && t.some((e) => e.isPending)) {
        return i.setDisabled();
      }
      return null;
    }
    let c = n.facet($).selectOnOpen ? 0 : -1;
    if (i && i.selected != c && i.selected != -1) {
      let e = i.options[i.selected].completion;
      for (let t = 0; t < s.length; t++) {
        if (s[t].completion == e) {
          c = t;
          break;
        }
      }
    }
    return new e(
      s,
      tg(r, c),
      {
        pos: t.reduce((acc, item) => {
          if (item.hasResult()) {
            return Math.min(acc, item.from);
          }
          return acc;
        }, 100000000),
        create: ug,
        above: a.aboveCursor,
      },
      i ? i.timestamp : Date.now(),
      c,
      false,
    );
  }
  map(t) {
    return new e(
      this.options,
      this.attrs,
      {
        ...this.tooltip,
        pos: t.mapPos(this.tooltip.pos),
      },
      this.timestamp,
      this.selected,
      this.disabled,
    );
  }
  setDisabled() {
    return new e(
      this.options,
      this.attrs,
      this.tooltip,
      this.timestamp,
      this.selected,
      true,
    );
  }
};
const Zh = class e {
  constructor(e, t, n) {
    this.active = e;
    this.id = t;
    this.open = n;
  }
  static start() {
    return new e(
      ng,
      `cm-ac-` + Math.floor(Math.random() * 2000000).toString(36),
      null,
    );
  }
  update(t) {
    let { state } = t;
    let r = state.facet($);
    let i = (
      r.override || state.languageDataAt(`autocomplete`, Ah(state)).map(Fh)
    ).map((e) =>
      (
        this.active.find((t) => t.source == e) ||
        new ig(e, +!!this.active.some((e) => e.state != 0))
      ).update(t, r),
    );
    if (
      i.length == this.active.length &&
      i.every((e, t) => e == this.active[t])
    ) {
      i = this.active;
    }
    let open = this.open;
    let o = t.effects.some((e) => e.is(sg));
    if (open && t.docChanged) {
      open = open.map(t.changes);
    }
    if (
      t.selection ||
      i.some((e) => e.hasResult() && t.changes.touchesRange(e.from, e.to)) ||
      !Qh(i, this.active) ||
      o
    ) {
      open = Xh.build(i, state, this.id, open, r, o);
    } else if (open && open.disabled && !i.some((e) => e.isPending)) {
      open = null;
    }
    if (!open && i.every((e) => !e.isPending) && i.some((e) => e.hasResult())) {
      i = i.map((e) => {
        if (e.hasResult()) {
          return new ig(e.source, 0);
        }
        return e;
      });
    }
    for (let e of t.effects) {
      if (e.is(Hh)) {
        open &&= open.setSelected(e.value, this.id);
      }
    }
    if (i == this.active && open == this.open) {
      return this;
    }
    return new e(i, this.id, open);
  }
  get tooltip() {
    if (this.open) {
      return this.open.tooltip;
    }
    return null;
  }
  get attrs() {
    if (this.open) {
      return this.open.attrs;
    }
    if (this.active.length) {
      return $h;
    }
    return eg;
  }
};
function Qh(e, active) {
  if (e == active) {
    return true;
  }
  for (let n = 0, r = 0; ;) {
    while (n < e.length && !e[n].hasResult()) {
      n++;
    }
    while (r < active.length && !active[r].hasResult()) {
      r++;
    }
    let i = n == e.length;
    let a = r == active.length;
    if (i || a) {
      return i == a;
    }
    if (e[n++].result != active[r++].result) {
      return false;
    }
  }
}
var $h = {
  "aria-autocomplete": `list`,
};
var eg = {};
function tg(e, t) {
  let n = {
    "aria-autocomplete": `list`,
    "aria-haspopup": `listbox`,
    "aria-controls": e,
  };
  if (t > -1) {
    n[`aria-activedescendant`] = e + `-` + t;
  }
  return n;
}
var ng = [];
function rg(e, t) {
  if (e.isUserEvent(`input.complete`)) {
    let n = e.annotation(Mh);
    if (n && t.activateOnCompletion(n)) {
      return 12;
    }
  }
  let n = e.isUserEvent(`input.type`);
  if (n && t.activateOnTyping) {
    return 5;
  }
  if (n) {
    return 1;
  }
  if (e.isUserEvent(`delete.backward`)) {
    return 2;
  }
  if (e.selection) {
    return 8;
  }
  if (e.docChanged) {
    return 16;
  }
  return 0;
}
var ig = class e {
  constructor(e, t, n = false) {
    this.source = e;
    this.state = t;
    this.explicit = n;
  }
  hasResult() {
    return false;
  }
  get isPending() {
    return this.state == 1;
  }
  update(t, n) {
    let r = rg(t, n);
    let i = this;
    if (r & 8 || (r & 16 && this.touches(t))) {
      i = new e(i.source, 0);
    }
    if (r & 4 && i.state == 0) {
      i = new e(this.source, 1);
    }
    i = i.updateFor(t, r);
    for (let n of t.effects) {
      if (n.is(Ih)) {
        i = new e(i.source, 1, n.value);
      } else if (n.is(Lh)) {
        i = new e(i.source, 0);
      } else if (n.is(sg)) {
        for (let e of n.value) {
          if (e.source == i.source) {
            i = e;
          }
        }
      }
    }
    return i;
  }
  updateFor(e, t) {
    return this.map(e.changes);
  }
  map(e) {
    return this;
  }
  touches(e) {
    return e.changes.touchesRange(Ah(e.state));
  }
};
const ag = class e extends ig {
  constructor(e, t, n, r, i, a) {
    super(e, 3, t);
    this.limit = n;
    this.result = r;
    this.from = i;
    this.to = a;
  }
  hasResult() {
    return true;
  }
  updateFor(t, n) {
    if (!(n & 3)) {
      return this.map(t.changes);
    }
    let result = this.result;
    if (result.map && !t.changes.empty) {
      result = result.map(result, t.changes);
    }
    let i = t.changes.mapPos(this.from);
    let a = t.changes.mapPos(this.to, 1);
    let o = Ah(t.state);
    if (
      o > a ||
      !result ||
      (n & 2 && (Ah(t.startState) == this.from || o < this.limit))
    ) {
      return new ig(this.source, n & 4 ? 1 : 0);
    }
    let s = t.changes.mapPos(this.limit);
    if (og(result.validFor, t.state, i, a)) {
      return new e(this.source, this.explicit, s, result, i, a);
    }
    if (
      result.update &&
      (result = result.update(result, i, a, new Th(t.state, o, false)))
    ) {
      return new e(
        this.source,
        this.explicit,
        s,
        result,
        result.from,
        result.to ?? Ah(t.state),
      );
    }
    return new ig(this.source, 1, this.explicit);
  }
  map(t) {
    if (t.empty) {
      return this;
    }
    let n = this.result.map ? this.result.map(this.result, t) : this.result;
    if (n) {
      return new e(
        this.source,
        this.explicit,
        t.mapPos(this.limit),
        n,
        t.mapPos(this.from),
        t.mapPos(this.to, 1),
      );
    }
    return new ig(this.source, 0);
  }
  touches(e) {
    return e.changes.touchesRange(this.from, this.to);
  }
};
function og(validFor, state, n, r) {
  if (!validFor) {
    return false;
  }
  let i = state.sliceDoc(n, r);
  if (typeof validFor == `function`) {
    return validFor(i, n, r, state);
  }
  return jh(validFor, true).test(i);
}
var sg = j.define({
  map(e, t) {
    return e.map((e) => e.map(t));
  },
});
const cg = Te.define({
  create() {
    return Zh.start();
  },
  update(e, t) {
    return e.update(t);
  },
  provide: (e) => [
    tc.from(e, (e) => e.tooltip),
    G.contentAttributes.from(e, (e) => e.attrs),
  ],
});
function lg(e, t) {
  let n = t.completion.apply || t.completion.label;
  let r = e.state.field(cg).active.find((e) => e.source == t.source);
  return (
    r instanceof ag &&
    (typeof n == `string`
      ? e.dispatch({
          ...Nh(e.state, n, r.from, r.to),
          annotations: Mh.of(t.completion),
        })
      : n(e, t.completion, r.from, r.to),
    true)
  );
}
var ug = Kh(cg, lg);
function dg(e, t = `option`) {
  return (n) => {
    let r = n.state.field(cg, false);
    if (
      !r ||
      !r.open ||
      r.open.disabled ||
      Date.now() - r.open.timestamp < n.state.facet($).interactionDelay
    ) {
      return false;
    }
    let i = 1;
    let a;
    if (t == `page` && (a = fc(n, r.open.tooltip))) {
      i = Math.max(
        2,
        Math.floor(
          a.dom.offsetHeight / a.dom.querySelector(`li`).offsetHeight,
        ) - 1,
      );
    }
    let { length } = r.open.options;
    let s =
      r.open.selected > -1
        ? r.open.selected + i * (e ? 1 : -1)
        : e
          ? 0
          : length - 1;
    if (s < 0) {
      s = t == `page` ? 0 : length - 1;
    } else if (s >= length) {
      s = t == `page` ? length - 1 : 0;
    }
    n.dispatch({
      effects: Hh.of(s),
    });
    return true;
  };
}
const fg = (e) => {
  let t = e.state.field(cg, false);
  if (
    e.state.readOnly ||
    !t ||
    !t.open ||
    t.open.selected < 0 ||
    t.open.disabled ||
    Date.now() - t.open.timestamp < e.state.facet($).interactionDelay
  ) {
    return false;
  }
  return lg(e, t.open.options[t.open.selected]);
};
const pg = (e) => {
  if (e.state.field(cg, false)) {
    return (
      e.dispatch({
        effects: Ih.of(true),
      }),
      true
    );
  }
  return false;
};
const mg = (e) => {
  let t = e.state.field(cg, false);
  if (!t || !t.active.some((e) => e.state != 0)) {
    return false;
  }
  return (
    e.dispatch({
      effects: Lh.of(null),
    }),
    true
  );
};
class hg {
  constructor(e, t) {
    this.active = e;
    this.context = t;
    this.time = Date.now();
    this.updates = [];
    this.done = undefined;
  }
}
const gg = 50;
const _g = 1000;
const vg = H.fromClass(
  class {
    constructor(e) {
      this.view = e;
      this.debounceUpdate = -1;
      this.running = [];
      this.debounceAccept = -1;
      this.pendingStart = false;
      this.composing = 0;
      for (let t of e.state.field(cg).active) {
        if (t.isPending) {
          this.startQuery(t);
        }
      }
    }
    update(e) {
      let t = e.state.field(cg);
      let n = e.state.facet($);
      if (!e.selectionSet && !e.docChanged && e.startState.field(cg) == t) {
        return;
      }
      let r = e.transactions.some((e) => {
        let t = rg(e, n);
        return t & 8 || ((e.selection || e.docChanged) && !(t & 3));
      });
      for (let t = 0; t < this.running.length; t++) {
        let n = this.running[t];
        if (
          r ||
          (n.context.abortOnDocChange && e.docChanged) ||
          (n.updates.length + e.transactions.length > gg &&
            Date.now() - n.time > _g)
        ) {
          for (let e of n.context.abortListeners) {
            try {
              e();
            } catch (error) {
              Sr(this.view.state, error);
            }
          }
          n.context.abortListeners = null;
          this.running.splice(t--, 1);
        } else {
          n.updates.push(...e.transactions);
        }
      }
      if (this.debounceUpdate > -1) {
        clearTimeout(this.debounceUpdate);
      }
      if (e.transactions.some((e) => e.effects.some((e) => e.is(Ih)))) {
        this.pendingStart = true;
      }
      let i = this.pendingStart ? 50 : n.activateOnTypingDelay;
      this.debounceUpdate = t.active.some(
        (e) =>
          e.isPending && !this.running.some((t) => t.active.source == e.source),
      )
        ? setTimeout(() => this.startUpdate(), i)
        : -1;
      if (this.composing != 0) {
        for (let t of e.transactions) {
          if (t.isUserEvent(`input.type`)) {
            this.composing = 2;
          } else if (this.composing == 2 && t.selection) {
            this.composing = 3;
          }
        }
      }
    }
    startUpdate() {
      this.debounceUpdate = -1;
      this.pendingStart = false;
      let { state } = this.view;
      let t = state.field(cg);
      for (let e of t.active) {
        if (
          e.isPending &&
          !this.running.some((t) => t.active.source == e.source)
        ) {
          this.startQuery(e);
        }
      }
      if (this.running.length && t.open && t.open.disabled) {
        this.debounceAccept = setTimeout(
          () => this.accept(),
          this.view.state.facet($).updateSyncTime,
        );
      }
    }
    startQuery(e) {
      let { state } = this.view;
      let n = new Th(state, Ah(state), e.explicit, this.view);
      let r = new hg(e, n);
      this.running.push(r);
      Promise.resolve(e.source(n)).then(
        (e) => {
          if (!r.context.aborted) {
            r.done = e || null;
            this.scheduleAccept();
          }
        },
        (e) => {
          this.view.dispatch({
            effects: Lh.of(null),
          });
          Sr(this.view.state, e);
        },
      );
    }
    scheduleAccept() {
      if (this.running.every((e) => e.done !== undefined)) {
        this.accept();
      } else if (this.debounceAccept < 0) {
        this.debounceAccept = setTimeout(
          () => this.accept(),
          this.view.state.facet($).updateSyncTime,
        );
      }
    }
    accept() {
      if (this.debounceAccept > -1) {
        clearTimeout(this.debounceAccept);
      }
      this.debounceAccept = -1;
      let e = [];
      let t = this.view.state.facet($);
      let n = this.view.state.field(cg);
      for (let r = 0; r < this.running.length; r++) {
        let i = this.running[r];
        if (i.done === undefined) {
          continue;
        }
        this.running.splice(r--, 1);
        if (i.done) {
          let n = Ah(
            i.updates.length ? i.updates[0].startState : this.view.state,
          );
          let r = Math.min(n, i.done.from + +!i.active.explicit);
          let a = new ag(
            i.active.source,
            i.active.explicit,
            r,
            i.done,
            i.done.from,
            i.done.to ?? n,
          );
          for (let e of i.updates) {
            a = a.update(e, t);
          }
          if (a.hasResult()) {
            e.push(a);
            continue;
          }
        }
        let a = n.active.find((e) => e.source == i.active.source);
        if (a && a.isPending) {
          if (i.done == null) {
            let n = new ig(i.active.source, 0);
            for (let e of i.updates) {
              n = n.update(e, t);
            }
            if (!n.isPending) {
              e.push(n);
            }
          } else {
            this.startQuery(a);
          }
        }
      }
      if (e.length || (n.open && n.open.disabled)) {
        this.view.dispatch({
          effects: sg.of(e),
        });
      }
    }
  },
  {
    eventHandlers: {
      blur(e) {
        let t = this.view.state.field(cg, false);
        if (t && t.tooltip && this.view.state.facet($).closeOnBlur) {
          let n = t.open && fc(this.view, t.open.tooltip);
          if (!n || !n.dom.contains(e.relatedTarget)) {
            setTimeout(
              () =>
                this.view.dispatch({
                  effects: Lh.of(null),
                }),
              10,
            );
          }
        }
      },
      compositionstart() {
        this.composing = 1;
      },
      compositionend() {
        if (this.composing == 3) {
          setTimeout(
            () =>
              this.view.dispatch({
                effects: Ih.of(false),
              }),
            20,
          );
        }
        this.composing = 0;
      },
    },
  },
);
const yg = typeof navigator == `object` && /Win/.test(navigator.platform);
const bg = Oe.highest(
  G.domEventHandlers({
    keydown(e, t) {
      let n = t.state.field(cg, false);
      if (
        !n ||
        !n.open ||
        n.open.disabled ||
        n.open.selected < 0 ||
        e.key.length > 1 ||
        (e.ctrlKey && !(yg && e.altKey)) ||
        e.metaKey
      ) {
        return false;
      }
      let r = n.open.options[n.open.selected];
      let i = n.active.find((e) => e.source == r.source);
      let a = r.completion.commitCharacters || i.result.commitCharacters;
      if (a && a.indexOf(e.key) > -1) {
        lg(t, r);
      }
      return false;
    },
  }),
);
const xg = G.baseTheme({
  ".cm-tooltip.cm-tooltip-autocomplete": {
    "& > ul": {
      fontFamily: `monospace`,
      whiteSpace: `nowrap`,
      overflow: `hidden auto`,
      maxWidth_fallback: `700px`,
      maxWidth: `min(700px, 95vw)`,
      minWidth: `250px`,
      maxHeight: `10em`,
      height: `100%`,
      listStyle: `none`,
      margin: 0,
      padding: 0,
      "& > li, & > completion-section": {
        padding: `1px 3px`,
        lineHeight: 1.2,
      },
      "& > li": {
        overflowX: `hidden`,
        textOverflow: `ellipsis`,
        cursor: `pointer`,
      },
      "& > completion-section": {
        display: `list-item`,
        borderBottom: `1px solid silver`,
        paddingLeft: `0.5em`,
        opacity: 0.7,
      },
    },
  },
  "&light .cm-tooltip-autocomplete ul li[aria-selected]": {
    background: `#17c`,
    color: `white`,
  },
  "&light .cm-tooltip-autocomplete-disabled ul li[aria-selected]": {
    background: `#777`,
  },
  "&dark .cm-tooltip-autocomplete ul li[aria-selected]": {
    background: `#347`,
    color: `white`,
  },
  "&dark .cm-tooltip-autocomplete-disabled ul li[aria-selected]": {
    background: `#444`,
  },
  ".cm-completionListIncompleteTop:before, .cm-completionListIncompleteBottom:after":
    {
      content: `"···"`,
      opacity: 0.5,
      display: `block`,
      textAlign: `center`,
      cursor: `pointer`,
    },
  ".cm-tooltip.cm-completionInfo": {
    position: `absolute`,
    padding: `3px 9px`,
    width: `max-content`,
    maxWidth: `400px`,
    boxSizing: `border-box`,
    whiteSpace: `pre-line`,
  },
  ".cm-completionInfo.cm-completionInfo-left": {
    right: `100%`,
  },
  ".cm-completionInfo.cm-completionInfo-right": {
    left: `100%`,
  },
  ".cm-completionInfo.cm-completionInfo-left-narrow": {
    right: `30px`,
  },
  ".cm-completionInfo.cm-completionInfo-right-narrow": {
    left: `30px`,
  },
  "&light .cm-snippetField": {
    backgroundColor: `#00000022`,
  },
  "&dark .cm-snippetField": {
    backgroundColor: `#ffffff22`,
  },
  ".cm-snippetFieldPosition": {
    verticalAlign: `text-top`,
    width: 0,
    height: `1.15em`,
    display: `inline-block`,
    margin: `0 -0.7px -.7em`,
    borderLeft: `1.4px dotted #888`,
  },
  ".cm-completionMatchedText": {
    textDecoration: `underline`,
  },
  ".cm-completionDetail": {
    marginLeft: `0.5em`,
    fontStyle: `italic`,
  },
  ".cm-completionIcon": {
    fontSize: `90%`,
    width: `.8em`,
    display: `inline-block`,
    textAlign: `center`,
    paddingRight: `.6em`,
    opacity: `0.6`,
    boxSizing: `content-box`,
  },
  ".cm-completionIcon-function, .cm-completionIcon-method": {
    "&:after": {
      content: `'ƒ'`,
    },
  },
  ".cm-completionIcon-class": {
    "&:after": {
      content: `'○'`,
    },
  },
  ".cm-completionIcon-interface": {
    "&:after": {
      content: `'◌'`,
    },
  },
  ".cm-completionIcon-variable": {
    "&:after": {
      content: `'𝑥'`,
    },
  },
  ".cm-completionIcon-constant": {
    "&:after": {
      content: `'𝐶'`,
    },
  },
  ".cm-completionIcon-type": {
    "&:after": {
      content: `'𝑡'`,
    },
  },
  ".cm-completionIcon-enum": {
    "&:after": {
      content: `'∪'`,
    },
  },
  ".cm-completionIcon-property": {
    "&:after": {
      content: `'□'`,
    },
  },
  ".cm-completionIcon-keyword": {
    "&:after": {
      content: `'🔑︎'`,
    },
  },
  ".cm-completionIcon-namespace": {
    "&:after": {
      content: `'▢'`,
    },
  },
  ".cm-completionIcon-text": {
    "&:after": {
      content: `'abc'`,
      fontSize: `50%`,
      verticalAlign: `middle`,
    },
  },
});
const Sg = {
  brackets: [`(`, `[`, `{`, `'`, `"`],
  before: `)]}:;>`,
  stringPrefixes: [],
};
const Cg = j.define({
  map(e, t) {
    return t.mapPos(e, -1, T.TrackAfter) ?? undefined;
  },
});
const wg = new (class extends ot {})();
wg.startSide = 1;
wg.endSide = -1;
const Tg = Te.define({
  create() {
    return P.empty;
  },
  update(e, t) {
    e = e.map(t.changes);
    if (t.selection) {
      let n = t.state.doc.lineAt(t.selection.main.head);
      e = e.update({
        filter: (e) => e >= n.from && e <= n.to,
      });
    }
    for (let n of t.effects) {
      if (n.is(Cg)) {
        e = e.update({
          add: [wg.range(n.value, n.value + 1)],
        });
      }
    }
    return e;
  },
});
function Eg() {
  return [jg, Tg];
}
const Dg = `()[]{}<>«»»«［］｛｝`;
function Og(e) {
  for (let t = 0; t < 16; t += 2) {
    if (Dg.charCodeAt(t) == e) {
      return Dg.charAt(t + 1);
    }
  }
  return ce(e < 128 ? e : e + 1);
}
function kg(e, head) {
  return e.languageDataAt(`closeBrackets`, head)[0] || Sg;
}
const Ag =
  typeof navigator == `object` && /Android\b/.test(navigator.userAgent);
var jg = G.inputHandler.of((e, t, n, r) => {
  if ((Ag ? e.composing : e.compositionStarted) || e.state.readOnly) {
    return false;
  }
  let main = e.state.selection.main;
  if (
    r.length > 2 ||
    (r.length == 2 && le(w(r, 0)) == 1) ||
    t != main.from ||
    n != main.to
  ) {
    return false;
  }
  let a = Ng(e.state, r);
  if (a) {
    return (e.dispatch(a), true);
  }
  return false;
});
const Mg = [
  {
    key: `Backspace`,
    run: ({ state, dispatch }) => {
      if (state.readOnly) {
        return false;
      }
      let n = kg(state, state.selection.main.head).brackets || Sg.brackets;
      let r = null;
      let i = state.changeByRange((t) => {
        if (t.empty) {
          let r = Ig(state.doc, t.head);
          for (let i of n) {
            if (i == r && Fg(state.doc, t.head) == Og(w(i, 0))) {
              return {
                changes: {
                  from: t.head - i.length,
                  to: t.head + i.length,
                },
                range: k.cursor(t.head - i.length),
              };
            }
          }
        }
        return {
          range: (r = t),
        };
      });
      if (!r) {
        dispatch(
          state.update(i, {
            scrollIntoView: true,
            userEvent: `delete.backward`,
          }),
        );
      }
      return !r;
    },
  },
];
function Ng(state, t) {
  let n = kg(state, state.selection.main.head);
  let r = n.brackets || Sg.brackets;
  for (let i of r) {
    let a = Og(w(i, 0));
    if (t == i) {
      if (a == i) {
        return zg(state, i, r.indexOf(i + i + i) > -1, n);
      }
      return Lg(state, i, a, n.before || Sg.before);
    }
    if (t == a && Pg(state, state.selection.main.from)) {
      return Rg(state, i, a);
    }
  }
  return null;
}
function Pg(e, t) {
  let n = false;
  e.field(Tg).between(0, e.doc.length, (e) => {
    if (e == t) {
      n = true;
    }
  });
  return n;
}
function Fg(doc, t) {
  let n = doc.sliceString(t, t + 2);
  return n.slice(0, le(w(n, 0)));
}
function Ig(doc, head) {
  let n = doc.sliceString(head - 2, head);
  if (le(w(n, 0)) == n.length) {
    return n;
  }
  return n.slice(1);
}
function Lg(e, t, n, r) {
  let i = null;
  let a = e.changeByRange((a) => {
    if (!a.empty) {
      return {
        changes: [
          {
            insert: t,
            from: a.from,
          },
          {
            insert: n,
            from: a.to,
          },
        ],
        effects: Cg.of(a.to + t.length),
        range: k.range(a.anchor + t.length, a.head + t.length),
      };
    }
    let o = Fg(e.doc, a.head);
    if (!o || /\s/.test(o) || r.indexOf(o) > -1) {
      return {
        changes: {
          insert: t + n,
          from: a.head,
        },
        effects: Cg.of(a.head + t.length),
        range: k.cursor(a.head + t.length),
      };
    }
    return {
      range: (i = a),
    };
  });
  if (i) {
    return null;
  }
  return e.update(a, {
    scrollIntoView: true,
    userEvent: `input.type`,
  });
}
function Rg(e, t, n) {
  let r = null;
  let i = e.changeByRange((t) => {
    if (t.empty && Fg(e.doc, t.head) == n) {
      return {
        changes: {
          from: t.head,
          to: t.head + n.length,
          insert: n,
        },
        range: k.cursor(t.head + n.length),
      };
    }
    return (r = {
      range: t,
    });
  });
  if (r) {
    return null;
  }
  return e.update(i, {
    scrollIntoView: true,
    userEvent: `input.type`,
  });
}
function zg(e, t, n, r) {
  let i = r.stringPrefixes || Sg.stringPrefixes;
  let a = null;
  let o = e.changeByRange((r) => {
    if (!r.empty) {
      return {
        changes: [
          {
            insert: t,
            from: r.from,
          },
          {
            insert: t,
            from: r.to,
          },
        ],
        effects: Cg.of(r.to + t.length),
        range: k.range(r.anchor + t.length, r.head + t.length),
      };
    }
    let r_head = r.head;
    let s = Fg(e.doc, r_head);
    let c;
    if (s == t) {
      if (Bg(e, r_head)) {
        return {
          changes: {
            insert: t + t,
            from: r_head,
          },
          effects: Cg.of(r_head + t.length),
          range: k.cursor(r_head + t.length),
        };
      }
      if (Pg(e, r_head)) {
        let r =
          n && e.sliceDoc(r_head, r_head + t.length * 3) == t + t + t
            ? t + t + t
            : t;
        return {
          changes: {
            from: r_head,
            to: r_head + r.length,
            insert: r,
          },
          range: k.cursor(r_head + r.length),
        };
      }
    } else if (
      n &&
      e.sliceDoc(r_head - 2 * t.length, r_head) == t + t &&
      (c = Hg(e, r_head - 2 * t.length, i)) > -1 &&
      Bg(e, c)
    ) {
      return {
        changes: {
          insert: t + t + t + t,
          from: r_head,
        },
        effects: Cg.of(r_head + t.length),
        range: k.cursor(r_head + t.length),
      };
    } else if (
      e.charCategorizer(r_head)(s) != M.Word &&
      Hg(e, r_head, i) > -1 &&
      !Vg(e, r_head, t, i)
    ) {
      return {
        changes: {
          insert: t + t,
          from: r_head,
        },
        effects: Cg.of(r_head + t.length),
        range: k.cursor(r_head + t.length),
      };
    }
    return {
      range: (a = r),
    };
  });
  if (a) {
    return null;
  }
  return e.update(o, {
    scrollIntoView: true,
    userEvent: `input.type`,
  });
}
function Bg(e, t) {
  let n = Z(e).resolveInner(t + 1);
  return n.parent && n.from == t;
}
function Vg(e, t, n, r) {
  let i = Z(e).resolveInner(t, -1);
  let a = r.reduce((acc, item) => Math.max(acc, item.length), 0);
  for (let o = 0; o < 5; o++) {
    let o = e.sliceDoc(i.from, Math.min(i.to, i.from + n.length + a));
    let s = o.indexOf(n);
    if (!s || (s > -1 && r.indexOf(o.slice(0, s)) > -1)) {
      let t = i.firstChild;
      while (t && t.from == i.from && t.to - t.from > n.length + s) {
        if (e.sliceDoc(t.to - n.length, t.to) == n) {
          return false;
        }
        t = t.firstChild;
      }
      return true;
    }
    let c = i.to == t && i.parent;
    if (!c) {
      break;
    }
    i = c;
  }
  return false;
}
function Hg(e, t, n) {
  let r = e.charCategorizer(t);
  if (r(e.sliceDoc(t - 1, t)) != M.Word) {
    return t;
  }
  for (let i of n) {
    let n = t - i.length;
    if (e.sliceDoc(n, t) == i && r(e.sliceDoc(n - 1, n)) != M.Word) {
      return n;
    }
  }
  return -1;
}
function Ug(e = {}) {
  return [bg, cg, $.of(e), vg, Gg, xg];
}
const Wg = [
  {
    key: `Ctrl-Space`,
    run: pg,
  },
  {
    mac: "Alt-`",
    run: pg,
  },
  {
    mac: `Alt-i`,
    run: pg,
  },
  {
    key: `Escape`,
    run: mg,
  },
  {
    key: `ArrowDown`,
    run: dg(true),
  },
  {
    key: `ArrowUp`,
    run: dg(false),
  },
  {
    key: `PageDown`,
    run: dg(true, `page`),
  },
  {
    key: `PageUp`,
    run: dg(false, `page`),
  },
  {
    key: `Enter`,
    run: fg,
  },
];
var Gg = Oe.highest(
  Vo.computeN([$], (e) => {
    if (e.facet($).defaultKeymap) {
      return [Wg];
    }
    return [];
  }),
);
class Kg {
  constructor(e, t, n) {
    this.from = e;
    this.to = t;
    this.diagnostic = n;
  }
}
const qg = class e {
  constructor(e, t, n) {
    this.diagnostics = e;
    this.panel = t;
    this.selected = n;
  }
  static init(t, n, r) {
    let markerFilter = r.facet(s_).markerFilter;
    if (markerFilter) {
      t = markerFilter(t, r);
    }
    let a = t.slice().sort((e, t) => e.from - t.from || e.to - t.to);
    let o = new pt();
    let s = [];
    let c = 0;
    let l = r.doc.iter();
    let u = 0;
    let length = r.doc.length;
    for (let e = 0; ;) {
      let t = e == a.length ? null : a[e];
      if (!t && !s.length) {
        break;
      }
      let n;
      let r;
      if (s.length) {
        n = c;
        r = s.reduce(
          (acc, item) => Math.min(acc, item.to),
          t && t.from > n ? t.from : 100000000,
        );
      } else {
        n = t.from;
        if (n > length) {
          break;
        }
        r = t.to;
        s.push(t);
        e++;
      }
      while (e < a.length) {
        let t = a[e];
        if (t.from == n && (t.to > t.from || t.to == n)) {
          s.push(t);
          e++;
          r = Math.min(t.to, r);
        } else {
          r = Math.min(t.from, r);
          break;
        }
      }
      r = Math.min(r, length);
      let i = false;
      if (
        s.some((e) => e.from == n && (e.to == r || r == length)) &&
        ((i = n == r), !i && r - n < 10)
      ) {
        let e = n - (u + l.value.length);
        if (e > 0) {
          l.next(e);
          u = n;
        }
        for (let e = n; ;) {
          if (e >= r) {
            i = true;
            break;
          }
          if (!l.lineBreak && u + l.value.length > e) {
            break;
          }
          e = u + l.value.length;
          u += l.value.length;
          l.next();
        }
      }
      let f = v_(s);
      if (i) {
        o.add(
          n,
          n,
          z.widget({
            widget: new d_(f),
            diagnostics: s.slice(),
          }),
        );
      } else {
        let e = s.reduce((acc, item) => {
          if (item.markClass) {
            return acc + ` ` + item.markClass;
          }
          return acc;
        }, ``);
        o.add(
          n,
          r,
          z.mark({
            class: `cm-lintRange cm-lintRange-` + f + e,
            diagnostics: s.slice(),
            inclusiveEnd: s.some((e) => e.to > r),
          }),
        );
      }
      c = r;
      if (c == length) {
        break;
      }
      for (let e = 0; e < s.length; e++) {
        if (s[e].to <= c) {
          s.splice(e--, 1);
        }
      }
    }
    let f = o.finish();
    return new e(f, n, Jg(f));
  }
};
function Jg(e, t = null, n = 0) {
  let r = null;
  e.between(n, 1000000000, (e, n, { spec }) => {
    if (!(t && spec.diagnostics.indexOf(t) < 0)) {
      if (!r) {
        r = new Kg(e, n, t || spec.diagnostics[0]);
      } else if (spec.diagnostics.indexOf(r.diagnostic) < 0) {
        return false;
      } else {
        r = new Kg(r.from, n, r.diagnostic);
      }
    }
  });
  return r;
}
function hideOn(e, t) {
  let t_pos = t.pos;
  let r = t.end || t_pos;
  let i = e.state.facet(s_).hideOn(e, t_pos, r);
  if (i != null) {
    return i;
  }
  let a = e.startState.doc.lineAt(t.pos);
  return !!(
    e.effects.some((e) => e.is(Zg)) ||
    e.changes.touchesRange(a.from, Math.max(a.to, r))
  );
}
function Xg(state, t) {
  if (state.field(e_, false)) {
    return t;
  }
  return t.concat(j.appendConfig.of(b_));
}
var Zg = j.define();
const Qg = j.define();
const $g = j.define();
var e_ = Te.define({
  create() {
    return new qg(z.none, null, null);
  },
  update(e, t) {
    if (t.docChanged && e.diagnostics.size) {
      let n = e.diagnostics.map(t.changes);
      let r = null;
      let i = e.panel;
      if (e.selected) {
        let i = t.changes.mapPos(e.selected.from, 1);
        r = Jg(n, e.selected.diagnostic, i) || Jg(n, null, i);
      }
      if (!n.size && i && t.state.facet(s_).autoPanel) {
        i = null;
      }
      e = new qg(n, i, r);
    }
    for (let n of t.effects) {
      if (n.is(Zg)) {
        let r = t.state.facet(s_).autoPanel
          ? n.value.length
            ? p_.open
            : null
          : e.panel;
        e = qg.init(n.value, r, t.state);
      } else {
        if (n.is(Qg)) {
          e = new qg(e.diagnostics, n.value ? p_.open : null, e.selected);
        } else if (n.is($g)) {
          e = new qg(e.diagnostics, e.panel, n.value);
        }
      }
    }
    return e;
  },
  provide: (e) => [
    yc.from(e, (e) => e.panel),
    G.decorations.from(e, (e) => e.diagnostics),
  ],
});
const t_ = z.mark({
  class: `cm-lintRange cm-lintRange-active`,
});
function n_(e, t, n) {
  let { diagnostics } = e.state.field(e_);
  let i;
  let a = -1;
  let end = -1;
  diagnostics.between(t - +(n < 0), t + +(n > 0), (e, r, { spec }) => {
    if (
      t >= e &&
      t <= r &&
      (e == r || ((t > e || n > 0) && (t < r || n < 0)))
    ) {
      i = spec.diagnostics;
      a = e;
      end = r;
      return false;
    }
  });
  let tooltipFilter = e.state.facet(s_).tooltipFilter;
  if (i && tooltipFilter) {
    i = tooltipFilter(i, e.state);
  }
  if (i) {
    return {
      pos: a,
      end,
      above: true,
      create() {
        return {
          dom: r_(e, i),
        };
      },
    };
  }
  return null;
}
function r_(e, t) {
  return I(
    `ul`,
    {
      class: `cm-tooltip-lint`,
    },
    t.map((t) => u_(e, t, false)),
  );
}
const i_ = (e) => {
  let t = e.state.field(e_, false);
  if (!t || !t.panel) {
    e.dispatch({
      effects: Xg(e.state, [Qg.of(true)]),
    });
  }
  let n = hc(e, p_.open);
  if (n) {
    n.dom.querySelector(`.cm-panel-lint ul`).focus();
  }
  return true;
};
const a_ = (view) => {
  let t = view.state.field(e_, false);
  if (!t || !t.panel) {
    return false;
  }
  return (
    view.dispatch({
      effects: Qg.of(false),
    }),
    true
  );
};
const o_ = [
  {
    key: `Mod-Shift-m`,
    run: i_,
    preventDefault: true,
  },
  {
    key: `F8`,
    run: (e) => {
      let t = e.state.field(e_, false);
      if (!t) {
        return false;
      }
      let main = e.state.selection.main;
      let r = Jg(t.diagnostics, null, main.to + 1);
      if (
        !r &&
        ((r = Jg(t.diagnostics, null, 0)),
        !r || (r.from == main.from && r.to == main.to))
      ) {
        return false;
      }
      return (
        e.dispatch({
          selection: {
            anchor: r.from,
            head: r.to,
          },
          scrollIntoView: true,
        }),
        dc(e, r.from, 1, {
          tooltip,
          until: (e) =>
            e.docChanged ||
            e.newSelection.main.head < r.from ||
            e.newSelection.main.head > r.to,
        }),
        true
      );
    },
  },
];
var s_ = A.define({
  combine(e) {
    return {
      sources: e.map((e) => e.source).filter((e) => e != null),
      ...at(
        e.map((e) => e.config),
        {
          delay: 750,
          markerFilter: null,
          tooltipFilter: null,
          needsRefresh: null,
          hideOn: () => null,
        },
        {
          delay: Math.max,
          markerFilter: c_,
          tooltipFilter: c_,
          needsRefresh: (e, t) => {
            if (e) {
              if (t) {
                return (n) => e(n) || t(n);
              }
              return e;
            }
            return t;
          },
          hideOn: (e, t) => {
            if (e) {
              if (t) {
                return (n, r, i) => e(n, r, i) || t(n, r, i);
              }
              return e;
            }
            return t;
          },
          autoPanel: (e, t) => e || t,
        },
      ),
    };
  },
});
function c_(e, t) {
  if (e) {
    if (t) {
      return (n, r) => t(e(n, r), r);
    }
    return e;
  }
  return t;
}
function l_(e) {
  let t = [];
  if (e) {
    actions: for (let { name } of e) {
      for (const r of name) {
        if (
          /[a-zA-Z]/.test(r) &&
          !t.some((e) => e.toLowerCase() == r.toLowerCase())
        ) {
          t.push(r);
          continue actions;
        }
      }
      t.push(``);
    }
  }
  return t;
}
function u_(e, t, n) {
  let r = n ? l_(t.actions) : [];
  return I(
    `li`,
    {
      class: `cm-diagnostic cm-diagnostic-` + t.severity,
    },
    I(
      `span`,
      {
        class: `cm-diagnosticText`,
      },
      t.renderMessage ? t.renderMessage(e) : t.message,
    ),
    t.actions?.map((n, i) => {
      let a = false;
      let o = (r) => {
        r.preventDefault();
        if (a) {
          return;
        }
        a = true;
        let i = Jg(e.state.field(e_).diagnostics, t);
        if (i) {
          n.apply(e, i.from, i.to);
        }
      };
      let { name } = n;
      let c = r[i] ? name.indexOf(r[i]) : -1;
      let l =
        c < 0
          ? name
          : [name.slice(0, c), I(`u`, name.slice(c, c + 1)), name.slice(c + 1)];
      return I(
        `button`,
        {
          type: `button`,
          class: `cm-diagnosticAction` + (n.markClass ? ` ` + n.markClass : ``),
          onclick: o,
          onmousedown: o,
          "aria-label": ` Action: ${name}${c < 0 ? `` : ` (access key "${r[i]})"`}.`,
        },
        l,
      );
    }),
    t.source &&
      I(
        `div`,
        {
          class: `cm-diagnosticSource`,
        },
        t.source,
      ),
  );
}
var d_ = class extends rn {
  constructor(e) {
    super();
    this.sev = e;
  }
  eq(e) {
    return e.sev == this.sev;
  }
  toDOM() {
    return I(`span`, {
      class: `cm-lintPoint cm-lintPoint-` + this.sev,
    });
  }
};
class f_ {
  constructor(e, t) {
    this.diagnostic = t;
    this.id = `item_` + Math.floor(Math.random() * 4294967295).toString(16);
    this.dom = u_(e, t, true);
    this.dom.id = this.id;
    this.dom.setAttribute(`role`, `option`);
  }
}
var p_ = class e {
  constructor(e) {
    this.view = e;
    this.items = [];
    let onkeydown = (t) => {
      if (!(t.ctrlKey || t.altKey || t.metaKey)) {
        if (t.keyCode == 27) {
          a_(this.view);
          this.view.focus();
        } else if (t.keyCode == 38 || t.keyCode == 33) {
          this.moveSelection(
            (this.selectedIndex - 1 + this.items.length) % this.items.length,
          );
        } else if (t.keyCode == 40 || t.keyCode == 34) {
          this.moveSelection((this.selectedIndex + 1) % this.items.length);
        } else if (t.keyCode == 36) {
          this.moveSelection(0);
        } else if (t.keyCode == 35) {
          this.moveSelection(this.items.length - 1);
        } else if (t.keyCode == 13) {
          this.view.focus();
        } else if (
          t.keyCode >= 65 &&
          t.keyCode <= 90 &&
          this.selectedIndex >= 0
        ) {
          let { diagnostic } = this.items[this.selectedIndex];
          let r = l_(diagnostic.actions);
          for (let i = 0; i < r.length; i++) {
            if (r[i].toUpperCase().charCodeAt(0) == t.keyCode) {
              let t = Jg(this.view.state.field(e_).diagnostics, diagnostic);
              if (t) {
                diagnostic.actions[i].apply(e, t.from, t.to);
              }
            }
          }
        } else {
          return;
        }
        t.preventDefault();
      }
    };
    let n = (e) => {
      for (let t = 0; t < this.items.length; t++) {
        if (this.items[t].dom.contains(e.target)) {
          this.moveSelection(t);
        }
      }
    };
    this.list = I(`ul`, {
      tabIndex: 0,
      role: `listbox`,
      "aria-label": this.view.state.phrase(`Diagnostics`),
      onkeydown,
      onclick: n,
    });
    this.dom = I(
      `div`,
      {
        class: `cm-panel-lint`,
      },
      this.list,
      I(
        `button`,
        {
          type: `button`,
          name: `close`,
          "aria-label": this.view.state.phrase(`close`),
          onclick: () => a_(this.view),
        },
        `×`,
      ),
    );
    this.update();
  }
  get selectedIndex() {
    let selected = this.view.state.field(e_).selected;
    if (!selected) {
      return -1;
    }
    for (let t = 0; t < this.items.length; t++) {
      if (this.items[t].diagnostic == selected.diagnostic) {
        return t;
      }
    }
    return -1;
  }
  update() {
    let { diagnostics, selected } = this.view.state.field(e_);
    let n = 0;
    let r = false;
    let i = null;
    let a = new Set();
    for (
      diagnostics.between(0, this.view.state.doc.length, (e, o, { spec }) => {
        for (let e of spec.diagnostics) {
          if (a.has(e)) {
            continue;
          }
          a.add(e);
          let o = -1;
          let s;
          for (let t = n; t < this.items.length; t++) {
            if (this.items[t].diagnostic == e) {
              o = t;
              break;
            }
          }
          if (o < 0) {
            s = new f_(this.view, e);
            this.items.splice(n, 0, s);
            r = true;
          } else {
            s = this.items[o];
            if (o > n) {
              this.items.splice(n, o - n);
              r = true;
            }
          }
          selected && s.diagnostic == selected.diagnostic
            ? s.dom.hasAttribute(`aria-selected`) ||
              (s.dom.setAttribute(`aria-selected`, `true`), (i = s))
            : s.dom.hasAttribute(`aria-selected`) &&
              s.dom.removeAttribute(`aria-selected`);
          n++;
        }
      });
      n < this.items.length &&
      !(this.items.length == 1 && this.items[0].diagnostic.from < 0);
    ) {
      r = true;
      this.items.pop();
    }
    if (this.items.length == 0) {
      this.items.push(
        new f_(this.view, {
          from: -1,
          to: -1,
          severity: `info`,
          message: this.view.state.phrase(`No diagnostics`),
        }),
      );
      r = true;
    }
    if (i) {
      this.list.setAttribute(`aria-activedescendant`, i.id);
      this.view.requestMeasure({
        key: this,
        read: () => ({
          sel: i.dom.getBoundingClientRect(),
          panel: this.list.getBoundingClientRect(),
        }),
        write: ({ sel, panel }) => {
          let n = panel.height / this.list.offsetHeight;
          if (sel.top < panel.top) {
            this.list.scrollTop -= (panel.top - sel.top) / n;
          } else if (sel.bottom > panel.bottom) {
            this.list.scrollTop += (sel.bottom - panel.bottom) / n;
          }
        },
      });
    } else if (this.selectedIndex < 0) {
      this.list.removeAttribute(`aria-activedescendant`);
    }
    if (r) {
      this.sync();
    }
  }
  sync() {
    let firstChild = this.list.firstChild;
    function t() {
      let t = firstChild;
      firstChild = t.nextSibling;
      t.remove();
    }
    for (let n of this.items) {
      if (n.dom.parentNode == this.list) {
        while (firstChild != n.dom) {
          t();
        }
        firstChild = n.dom.nextSibling;
      } else {
        this.list.insertBefore(n.dom, firstChild);
      }
    }
    while (firstChild) {
      t();
    }
  }
  moveSelection(e) {
    if (this.selectedIndex < 0) {
      return;
    }
    let t = Jg(this.view.state.field(e_).diagnostics, this.items[e].diagnostic);
    if (t) {
      this.view.dispatch({
        selection: {
          anchor: t.from,
          head: t.to,
        },
        scrollIntoView: true,
        effects: $g.of(t),
      });
    }
  }
  static open(t) {
    return new e(t);
  }
};
function m_(e, t = `viewBox="0 0 40 40"`) {
  return `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" ${t}>${encodeURIComponent(e)}</svg>')`;
}
function h_(e) {
  return m_(
    `<path d="m0 2.5 l2 -1.5 l1 0 l2 1.5 l1 0" stroke="${e}" fill="none" stroke-width=".7"/>`,
    `width="6" height="3"`,
  );
}
const g_ = G.baseTheme({
  ".cm-diagnostic": {
    padding: `3px 6px 3px 8px`,
    marginLeft: `-1px`,
    display: `block`,
    whiteSpace: `pre-wrap`,
  },
  ".cm-diagnostic-error": {
    borderLeft: `5px solid #d11`,
  },
  ".cm-diagnostic-warning": {
    borderLeft: `5px solid orange`,
  },
  ".cm-diagnostic-info": {
    borderLeft: `5px solid #999`,
  },
  ".cm-diagnostic-hint": {
    borderLeft: `5px solid #66d`,
  },
  ".cm-diagnosticAction": {
    font: `inherit`,
    border: `none`,
    padding: `2px 4px`,
    backgroundColor: `#444`,
    color: `white`,
    borderRadius: `3px`,
    marginLeft: `8px`,
    cursor: `pointer`,
  },
  ".cm-diagnosticSource": {
    fontSize: `70%`,
    opacity: 0.7,
  },
  ".cm-lintRange": {
    backgroundPosition: `left bottom`,
    backgroundRepeat: `repeat-x`,
    paddingBottom: `0.7px`,
  },
  ".cm-lintRange-error": {
    backgroundImage: h_(`#f11`),
  },
  ".cm-lintRange-warning": {
    backgroundImage: h_(`orange`),
  },
  ".cm-lintRange-info": {
    backgroundImage: h_(`#999`),
  },
  ".cm-lintRange-hint": {
    backgroundImage: h_(`#66d`),
  },
  ".cm-lintRange-active": {
    backgroundColor: `#ffdd9980`,
  },
  ".cm-tooltip-lint": {
    padding: 0,
    margin: 0,
  },
  ".cm-lintPoint": {
    position: `relative`,
    "&:after": {
      content: `""`,
      position: `absolute`,
      bottom: 0,
      left: `-2px`,
      borderLeft: `3px solid transparent`,
      borderRight: `3px solid transparent`,
      borderBottom: `4px solid #d11`,
    },
  },
  ".cm-lintPoint-warning": {
    "&:after": {
      borderBottomColor: `orange`,
    },
  },
  ".cm-lintPoint-info": {
    "&:after": {
      borderBottomColor: `#999`,
    },
  },
  ".cm-lintPoint-hint": {
    "&:after": {
      borderBottomColor: `#66d`,
    },
  },
  ".cm-panel.cm-panel-lint": {
    position: `relative`,
    "& ul": {
      maxHeight: `100px`,
      overflowY: `auto`,
      "& [aria-selected]": {
        backgroundColor: `#ddd`,
        "& u": {
          textDecoration: `underline`,
        },
      },
      "&:focus [aria-selected]": {
        background_fallback: `#bdf`,
        backgroundColor: `Highlight`,
        color_fallback: `white`,
        color: `HighlightText`,
      },
      "& u": {
        textDecoration: `none`,
      },
      padding: 0,
      margin: 0,
    },
    "& [name=close]": {
      position: `absolute`,
      top: `0`,
      right: `2px`,
      background: `inherit`,
      border: `none`,
      font: `inherit`,
      padding: 0,
      margin: 0,
    },
  },
  "&dark .cm-lintRange-active": {
    backgroundColor: `#86714a80`,
  },
  "&dark .cm-panel.cm-panel-lint ul": {
    "& [aria-selected]": {
      backgroundColor: `#2e343e`,
    },
  },
});
function __(severity) {
  if (severity == `error`) {
    return 4;
  }
  if (severity == `warning`) {
    return 3;
  }
  if (severity == `info`) {
    return 2;
  }
  return 1;
}
function v_(e) {
  let t = `hint`;
  let n = 1;
  for (let r of e) {
    let e = __(r.severity);
    if (e > n) {
      n = e;
      t = r.severity;
    }
  }
  return t;
}
var tooltip = uc(n_, {
  hideOn,
});
var b_ = [
  e_,
  G.decorations.compute([e_], (e) => {
    let { selected, panel } = e.field(e_);
    if (!selected || !panel || selected.from == selected.to) {
      return z.none;
    }
    return z.set([t_.range(selected.from, selected.to)]);
  }),
  tooltip,
  g_,
];
const x_ = (e = {}) => {
  const e_crosshairCursor = e.crosshairCursor;
  const n = e_crosshairCursor !== undefined && e_crosshairCursor;
  let r = [];
  if (e.closeBracketsKeymap !== false) {
    r = r.concat(Mg);
  }
  if (e.defaultKeymap !== false) {
    r = r.concat(pm);
  }
  if (e.searchKeymap !== false) {
    r = r.concat(_h);
  }
  if (e.historyKeymap !== false) {
    r = r.concat(Ef);
  }
  if (e.foldKeymap !== false) {
    r = r.concat(nd);
  }
  if (e.completionKeymap !== false) {
    r = r.concat(Wg);
  }
  if (e.lintKeymap !== false) {
    r = r.concat(o_);
  }
  const i = [];
  if (e.lineNumbers !== false) {
    i.push(qc());
  }
  if (e.highlightActiveLineGutter !== false) {
    i.push(Zc());
  }
  if (e.highlightSpecialChars !== false) {
    i.push(Ts());
  }
  if (e.history !== false) {
    i.push(sf());
  }
  if (e.foldGutter !== false) {
    i.push(dd());
  }
  if (e.drawSelection !== false) {
    i.push(as());
  }
  if (e.dropCursor !== false) {
    i.push(hs());
  }
  if (e.allowMultipleSelections !== false) {
    i.push(N.allowMultipleSelections.of(true));
  }
  if (e.indentOnInput !== false) {
    i.push(Lu());
  }
  if (e.syntaxHighlighting !== false) {
    i.push(
      _d(bd, {
        fallback: true,
      }),
    );
  }
  if (e.bracketMatching !== false) {
    i.push(Ad());
  }
  if (e.closeBrackets !== false) {
    i.push(Eg());
  }
  if (e.autocompletion !== false) {
    i.push(Ug());
  }
  if (e.rectangularSelection !== false) {
    i.push(Hs());
  }
  if (n !== false) {
    i.push(Gs());
  }
  if (e.highlightActiveLine !== false) {
    i.push(Ms());
  }
  if (e.highlightSelectionMatches !== false) {
    i.push(Om());
  }
  if (e.tabSize && typeof e.tabSize == `number`) {
    i.push(bu.of(` `.repeat(e.tabSize)));
  }
  return i.concat([Vo.of(r.flat())]).filter(Boolean);
};
const S_ = `#e5c07b`;
const C_ = `#e06c75`;
const w_ = `#56b6c2`;
const T_ = `#ffffff`;
const E_ = `#abb2bf`;
const D_ = `#7d8799`;
const O_ = `#61afef`;
const k_ = `#98c379`;
const A_ = `#d19a66`;
const j_ = `#c678dd`;
const M_ = `#21252b`;
const N_ = `#2c313a`;
const P_ = `#282c34`;
const F_ = `#353a42`;
const I_ = `#3E4451`;
const L_ = `#528bff`;
const R_ = [
  G.theme(
    {
      "&": {
        color: E_,
        backgroundColor: P_,
      },
      ".cm-content": {
        caretColor: L_,
      },
      ".cm-cursor, .cm-dropCursor": {
        borderLeftColor: L_,
      },
      "&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection":
        {
          backgroundColor: I_,
        },
      ".cm-panels": {
        backgroundColor: M_,
        color: E_,
      },
      ".cm-panels.cm-panels-top": {
        borderBottom: `2px solid black`,
      },
      ".cm-panels.cm-panels-bottom": {
        borderTop: `2px solid black`,
      },
      ".cm-searchMatch": {
        backgroundColor: `#72a1ff59`,
        outline: `1px solid #457dff`,
      },
      ".cm-searchMatch.cm-searchMatch-selected": {
        backgroundColor: `#6199ff2f`,
      },
      ".cm-activeLine": {
        backgroundColor: `#6699ff0b`,
      },
      ".cm-selectionMatch": {
        backgroundColor: `#aafe661a`,
      },
      "&.cm-focused .cm-matchingBracket, &.cm-focused .cm-nonmatchingBracket": {
        backgroundColor: `#bad0f847`,
      },
      ".cm-gutters": {
        backgroundColor: P_,
        color: D_,
        border: `none`,
      },
      ".cm-activeLineGutter": {
        backgroundColor: N_,
      },
      ".cm-foldPlaceholder": {
        backgroundColor: `transparent`,
        border: `none`,
        color: `#ddd`,
      },
      ".cm-tooltip": {
        border: `none`,
        backgroundColor: F_,
      },
      ".cm-tooltip .cm-tooltip-arrow:before": {
        borderTopColor: `transparent`,
        borderBottomColor: `transparent`,
      },
      ".cm-tooltip .cm-tooltip-arrow:after": {
        borderTopColor: F_,
        borderBottomColor: F_,
      },
      ".cm-tooltip-autocomplete": {
        "& > ul > li[aria-selected]": {
          backgroundColor: N_,
          color: E_,
        },
      },
    },
    {
      dark: true,
    },
  ),
  _d(
    pd.define([
      {
        tag: X.keyword,
        color: j_,
      },
      {
        tag: [X.name, X.deleted, X.character, X.propertyName, X.macroName],
        color: C_,
      },
      {
        tag: [X.function(X.variableName), X.labelName],
        color: O_,
      },
      {
        tag: [X.color, X.constant(X.name), X.standard(X.name)],
        color: A_,
      },
      {
        tag: [X.definition(X.name), X.separator],
        color: E_,
      },
      {
        tag: [
          X.typeName,
          X.className,
          X.number,
          X.changed,
          X.annotation,
          X.modifier,
          X.self,
          X.namespace,
        ],
        color: S_,
      },
      {
        tag: [
          X.operator,
          X.operatorKeyword,
          X.url,
          X.escape,
          X.regexp,
          X.link,
          X.special(X.string),
        ],
        color: w_,
      },
      {
        tag: [X.meta, X.comment],
        color: D_,
      },
      {
        tag: X.strong,
        fontWeight: `bold`,
      },
      {
        tag: X.emphasis,
        fontStyle: `italic`,
      },
      {
        tag: X.strikethrough,
        textDecoration: `line-through`,
      },
      {
        tag: X.link,
        color: D_,
        textDecoration: `underline`,
      },
      {
        tag: X.heading,
        fontWeight: `bold`,
        color: C_,
      },
      {
        tag: [X.atom, X.bool, X.special(X.variableName)],
        color: A_,
      },
      {
        tag: [X.processingInstruction, X.string, X.inserted],
        color: k_,
      },
      {
        tag: X.invalid,
        color: T_,
      },
    ]),
  ),
];
const z_ = G.theme(
  {
    "&": {
      backgroundColor: `#fff`,
    },
  },
  {
    dark: false,
  },
);
const B_ = ({
  indentWithTab = true,
  editable = true,
  readOnly = false,
  theme = `light`,
  placeholder = ``,
  basicSetup = true,
} = {}) => {
  const m = [];
  if (indentWithTab) {
    m.unshift(Vo.of([mm]));
  }
  basicSetup &&
    (typeof basicSetup == `boolean`
      ? m.unshift(x_())
      : m.unshift(x_(basicSetup)));
  if (placeholder) {
    m.unshift(Is(placeholder));
  }
  switch (theme) {
    case `light`:
      m.push(z_);
      break;
    case `dark`:
      m.push(R_);
      break;
    case `none`:
      break;
    default:
      m.push(theme);
  }
  if (editable === false) {
    m.push(G.editable.of(false));
  }
  if (readOnly) {
    m.push(N.readOnly.of(true));
  }
  return [...m];
};
const V_ = (e) => ({
  line: e.state.doc.lineAt(e.state.selection.main.from),
  lineCount: e.state.doc.lines,
  lineBreak: e.state.lineBreak,
  length: e.state.doc.length,
  readOnly: e.state.readOnly,
  tabSize: e.state.tabSize,
  selection: e.state.selection,
  selectionAsSingle: e.state.selection.asSingle().main,
  ranges: e.state.selection.ranges,
  selectionCode: e.state.sliceDoc(
    e.state.selection.main.from,
    e.state.selection.main.to,
  ),
  selections: e.state.selection.ranges.map((t) =>
    e.state.sliceDoc(t.from, t.to),
  ),
  selectedText: e.state.selection.ranges.some((e) => !e.empty),
});
class H_ {
  constructor(e, t) {
    this.timeLeftMS = undefined;
    this.timeoutMS = undefined;
    this.isCancelled = false;
    this.isTimeExhausted = false;
    this.callbacks = [];
    this.timeLeftMS = t;
    this.timeoutMS = t;
    this.callbacks.push(e);
  }
  tick() {
    if (
      !this.isCancelled &&
      !this.isTimeExhausted &&
      (this.timeLeftMS--, this.timeLeftMS <= 0)
    ) {
      this.isTimeExhausted = true;
      const e = this.callbacks.slice();
      this.callbacks.length = 0;
      e.forEach((e) => {
        try {
          e();
        } catch (error) {
          console.error(`TimeoutLatch callback error:`, error);
        }
      });
    }
  }
  cancel() {
    this.isCancelled = true;
    this.callbacks.length = 0;
  }
  reset() {
    this.timeLeftMS = this.timeoutMS;
    this.isCancelled = false;
    this.isTimeExhausted = false;
  }
  get isDone() {
    return this.isCancelled || this.isTimeExhausted;
  }
}
class U_ {
  constructor() {
    this.interval = null;
    this.latches = new Set();
  }
  add(e) {
    this.latches.add(e);
    this.start();
  }
  remove(e) {
    this.latches.delete(e);
    if (this.latches.size === 0) {
      this.stop();
    }
  }
  start() {
    if (this.interval === null) {
      this.interval = setInterval(() => {
        this.latches.forEach((e) => {
          e.tick();
          if (e.isDone) {
            this.remove(e);
          }
        });
      }, 1);
    }
  }
  stop() {
    if (this.interval !== null) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}
let W_ = null;
const G_ = () => {
  if (typeof window > `u`) {
    return new U_();
  }
  return ((W_ ||= new U_()), W_);
};
const K_ = G.theme({
  "& .cm-scroller": {
    height: `100% !important`,
  },
});
let q_ = null;
let J_ = null;
function Y_(height, minHeight, maxHeight, width, minWidth, maxWidth) {
  if (!height && !minHeight && !maxHeight && !width && !minWidth && !maxWidth) {
    return null;
  }
  const o = JSON.stringify({
    height,
    minHeight,
    maxHeight,
    width,
    minWidth,
    maxWidth,
  });
  if (o === q_) {
    return J_;
  }
  return (
    (q_ = o),
    (J_ = G.theme({
      "&": {
        height,
        minHeight,
        maxHeight,
        width,
        minWidth,
        maxWidth,
      },
    })),
    J_
  );
}
const X_ = Ue.define();
const Z_ = 200;
const Q_ = [];
function useComponent(e) {
  const {
    value,
    selection,
    onChange,
    onStatistics,
    onCreateEditor,
    onUpdate,
    extensions,
  } = e;
  const l = extensions === undefined ? Q_ : extensions;
  const { autoFocus, theme } = e;
  const f = theme === undefined ? `light` : theme;
  const e_height = e.height;
  const m = e_height === undefined ? null : e_height;
  const e_minHeight = e.minHeight;
  const g = e_minHeight === undefined ? null : e_minHeight;
  const e_maxHeight = e.maxHeight;
  const v = e_maxHeight === undefined ? null : e_maxHeight;
  const e_width = e.width;
  const b = e_width === undefined ? null : e_width;
  const e_minWidth = e.minWidth;
  const S = e_minWidth === undefined ? null : e_minWidth;
  const e_maxWidth = e.maxWidth;
  const te = e_maxWidth === undefined ? null : e_maxWidth;
  const e_placeholder = e.placeholder;
  const placeholder = e_placeholder === undefined ? `` : e_placeholder;
  const e_editable = e.editable;
  const editable = e_editable === undefined || e_editable;
  const e_readOnly = e.readOnly;
  const readOnly = e_readOnly !== undefined && e_readOnly;
  const e_indentWithTab = e.indentWithTab;
  const indentWithTab = e_indentWithTab === undefined || e_indentWithTab;
  const e_basicSetup = e.basicSetup;
  const basicSetup = e_basicSetup === undefined || e_basicSetup;
  const { root, initialState } = e;
  const [E, setE] = r.useState();
  const [O, setO] = r.useState();
  const [he, setHe] = r.useState();
  const k = r.useState(() => ({
    current: null,
  }))[0];
  const _e = r.useState(() => ({
    current: null,
  }))[0];
  const ve = Y_(m, g, v, b, S, te);
  const A = G.updateListener.of((e) => {
    if (
      e.docChanged &&
      typeof onChange == `function` &&
      !e.transactions.some((e) => e.annotation(X_))
    ) {
      if (k.current) {
        k.current.reset();
      } else {
        k.current = new H_(() => {
          if (_e.current) {
            var e = _e.current;
            _e.current = null;
            e();
          }
          k.current = null;
        }, Z_);
        G_().add(k.current);
      }
      onChange(e.state.doc.toString(), e);
    }
    if (onStatistics) {
      onStatistics(V_(e));
    }
  });
  const ye = B_({
    theme: f,
    editable,
    readOnly,
    placeholder,
    indentWithTab,
    basicSetup,
  });
  let be = [A, ...(ve ? [ve] : []), K_, ...ye];
  if (onUpdate && typeof onUpdate == `function`) {
    be.push(G.updateListener.of(onUpdate));
  }
  be = be.concat(l);
  r.useLayoutEffect(() => {
    if (E && !he) {
      var e = {
        doc: value,
        selection,
        extensions: be,
      };
      var state = initialState
        ? N.fromJSON(initialState.json, e, initialState.fields)
        : N.create(e);
      setHe(state);
      if (!O) {
        var i = new G({
          state,
          parent: E,
          root,
        });
        setO(i);
        if (onCreateEditor) {
          onCreateEditor(i, state);
        }
      }
    }
    return () => {
      if (O) {
        setHe(undefined);
        setO(undefined);
      }
    };
  }, [E, he]);
  r.useEffect(() => {
    if (e.container) {
      setE(e.container);
    }
  }, [e.container]);
  r.useEffect(
    () => () => {
      if (O) {
        O.destroy();
        setO(undefined);
      }
      k.current &&= (k.current.cancel(), null);
    },
    [O],
  );
  r.useEffect(() => {
    if (autoFocus && O) {
      O.focus();
    }
  }, [autoFocus, O]);
  r.useEffect(() => {
    if (O) {
      O.dispatch({
        effects: j.reconfigure.of(be),
      });
    }
  }, [
    f,
    l,
    m,
    g,
    v,
    b,
    S,
    te,
    placeholder,
    editable,
    readOnly,
    indentWithTab,
    basicSetup,
    onChange,
    onUpdate,
  ]);
  r.useEffect(() => {
    if (value !== undefined) {
      var e = O ? O.state.doc.toString() : ``;
      if (O && value !== e) {
        var n = k.current && !k.current.isDone;
        var r = () => {
          if (O && value !== O.state.doc.toString()) {
            O.dispatch({
              changes: {
                from: 0,
                to: O.state.doc.toString().length,
                insert: value || ``,
              },
              annotations: [X_.of(true)],
            });
          }
        };
        if (n) {
          _e.current = r;
        } else {
          r();
        }
      }
    }
  }, [value, O]);
  return {
    state: he,
    setState: setHe,
    view: O,
    setView: setO,
    container: E,
    setContainer: setE,
  };
}
const ev = t();
const tv = [
  `className`,
  `value`,
  `selection`,
  `extensions`,
  `onChange`,
  `onStatistics`,
  `onCreateEditor`,
  `onUpdate`,
  `autoFocus`,
  `theme`,
  `height`,
  `minHeight`,
  `maxHeight`,
  `width`,
  `minWidth`,
  `maxWidth`,
  `basicSetup`,
  `placeholder`,
  `indentWithTab`,
  `editable`,
  `readOnly`,
  `root`,
  `initialState`,
];
const Nv1 = r.forwardRef((e, t) => {
  var e_className = e.className;
  var e_value = e.value;
  var s = e_value === undefined ? `` : e_value;
  var e_selection = e.selection;
  var e_extensions = e.extensions;
  var u = e_extensions === undefined ? [] : e_extensions;
  var e_onChange = e.onChange;
  var e_onStatistics = e.onStatistics;
  var e_onCreateEditor = e.onCreateEditor;
  var e_onUpdate = e.onUpdate;
  var e_autoFocus = e.autoFocus;
  var e_theme = e.theme;
  var _ = e_theme === undefined ? `light` : e_theme;
  var e_height = e.height;
  var e_minHeight = e.minHeight;
  var e_maxHeight = e.maxHeight;
  var e_width = e.width;
  var e_minWidth = e.minWidth;
  var e_maxWidth = e.maxWidth;
  var e_basicSetup = e.basicSetup;
  var e_placeholder = e.placeholder;
  var e_indentWithTab = e.indentWithTab;
  var e_editable = e.editable;
  var e_readOnly = e.readOnly;
  var e_root = e.root;
  var e_initialState = e.initialState;
  var se = a(e, tv);
  var wRef = r.useRef(null);
  var ce = useComponent({
    root: e_root,
    value: s,
    autoFocus: e_autoFocus,
    theme: _,
    height: e_height,
    minHeight: e_minHeight,
    maxHeight: e_maxHeight,
    width: e_width,
    minWidth: e_minWidth,
    maxWidth: e_maxWidth,
    basicSetup: e_basicSetup,
    placeholder: e_placeholder,
    indentWithTab: e_indentWithTab,
    editable: e_editable,
    readOnly: e_readOnly,
    selection: e_selection,
    onChange: e_onChange,
    onStatistics: e_onStatistics,
    onCreateEditor: e_onCreateEditor,
    onUpdate: e_onUpdate,
    extensions: u,
    initialState: e_initialState,
  });
  var ce_state = ce.state;
  var ce_view = ce.view;
  var ce_container = ce.container;
  var ce_setContainer = ce.setContainer;
  r.useImperativeHandle(
    t,
    () => ({
      editor: wRef.current,
      state: ce_state,
      view: ce_view,
    }),
    [wRef, ce_container, ce_state, ce_view],
  );
  var ref = r.useCallback(
    (e) => {
      wRef.current = e;
      ce_setContainer(e);
    },
    [ce_setContainer],
  );
  if (typeof s != `string`) {
    throw Error(`value must be typeof string but got ` + typeof s);
  }
  var D = typeof _ == `string` ? `cm-theme-` + _ : `cm-theme`;
  return (
    <div
      ref={ref}
      className={`` + D + (e_className ? ` ` + e_className : ``)}
      {...se}
    />
  );
});
Nv1.displayName = `CodeMirror`;
const rv = class e {
  constructor(e, t, n, r, i, a, o, s, c, l = 0, u) {
    this.p = e;
    this.stack = t;
    this.state = n;
    this.reducePos = r;
    this.pos = i;
    this.score = a;
    this.buffer = o;
    this.bufferBase = s;
    this.curContext = c;
    this.lookAhead = l;
    this.parent = u;
  }
  toString() {
    return `[${this.stack.filter((e, t) => t % 3 == 0).concat(this.state)}]@${this.pos}${this.score ? `!` + this.score : ``}`;
  }
  static start(t, n, r = 0) {
    let context = t.parser.context;
    return new e(
      t,
      [],
      n,
      r,
      r,
      0,
      [],
      0,
      context ? new iv(context, context.start) : null,
      0,
      null,
    );
  }
  get context() {
    if (this.curContext) {
      return this.curContext.context;
    }
    return null;
  }
  pushState(e, t) {
    this.stack.push(this.state, t, this.bufferBase + this.buffer.length);
    this.state = e;
  }
  reduce(e) {
    let t = e >> 19;
    let n = e & 65535;
    let { parser } = this.p;
    let i = this.reducePos < this.pos - 25 && this.setLookAhead(this.pos);
    let a = parser.dynamicPrecedence(n);
    if (a) {
      this.score += a;
    }
    if (t == 0) {
      if (n < parser.minRepeatTerm && this.reducePos < this.pos) {
        this.reducePos = this.pos;
      }
      this.pushState(parser.getGoto(this.state, n, true), this.reducePos);
      if (n < parser.minRepeatTerm) {
        this.storeNode(n, this.reducePos, this.reducePos, i ? 8 : 4, true);
      }
      this.reduceContext(n, this.reducePos);
      return;
    }
    let o = this.stack.length - (t - 1) * 3 - (e & 262144 ? 6 : 0);
    let s = o ? this.stack[o - 2] : this.p.ranges[0].from;
    if (
      n < parser.minRepeatTerm &&
      s == this.reducePos &&
      this.reducePos < this.pos
    ) {
      this.reducePos = this.pos;
    }
    let c = this.reducePos - s;
    c >= 2000 &&
      !this.p.parser.nodeSet.types[n]?.isAnonymous &&
      (s == this.p.lastBigReductionStart
        ? (this.p.bigReductionCount++, (this.p.lastBigReductionSize = c))
        : this.p.lastBigReductionSize < c &&
          ((this.p.bigReductionCount = 1),
          (this.p.lastBigReductionStart = s),
          (this.p.lastBigReductionSize = c)));
    let l = o ? this.stack[o - 1] : 0;
    let u = this.bufferBase + this.buffer.length - l;
    if (n < parser.minRepeatTerm || e & 131072) {
      let e = parser.stateFlag(this.state, 1) ? this.pos : this.reducePos;
      this.storeNode(n, s, e, u + 4, true);
    }
    if (e & 262144) {
      this.state = this.stack[o];
    } else {
      let e = this.stack[o - 3];
      this.state = parser.getGoto(e, n, true);
    }
    while (this.stack.length > o) {
      this.stack.pop();
    }
    this.reduceContext(n, s);
  }
  storeNode(e, t, n, r = 4, i = false) {
    if (
      e == 0 &&
      (!this.stack.length ||
        this.stack[this.stack.length - 1] <
          this.buffer.length + this.bufferBase)
    ) {
      let e = this.buffer.length;
      if (e > 0 && this.buffer[e - 4] == 0 && this.buffer[e - 1] > -1) {
        if (t == n) {
          return;
        }
        if (this.buffer[e - 2] >= t) {
          this.buffer[e - 2] = n;
          return;
        }
      }
    }
    if (!i || this.pos == n) {
      this.buffer.push(e, t, n, r);
    } else {
      let i = this.buffer.length;
      if (i > 0 && (this.buffer[i - 4] != 0 || this.buffer[i - 1] < 0)) {
        let e = false;
        for (let t = i; t > 0 && this.buffer[t - 2] > n; t -= 4) {
          if (this.buffer[t - 1] >= 0) {
            e = true;
            break;
          }
        }
        if (e) {
          while (i > 0 && this.buffer[i - 2] > n) {
            this.buffer[i] = this.buffer[i - 4];
            this.buffer[i + 1] = this.buffer[i - 3];
            this.buffer[i + 2] = this.buffer[i - 2];
            this.buffer[i + 3] = this.buffer[i - 1];
            i -= 4;
            if (r > 4) {
              r -= 4;
            }
          }
        }
      }
      this.buffer[i] = e;
      this.buffer[i + 1] = t;
      this.buffer[i + 2] = n;
      this.buffer[i + 3] = r;
    }
  }
  shift(e, t, n, r) {
    if (e & 131072) {
      this.pushState(e & 65535, this.pos);
    } else if (e & 262144) {
      this.pos = r;
      this.shiftContext(t, n);
      if (t <= this.p.parser.maxNode) {
        this.buffer.push(t, n, r, 4);
      }
    } else {
      let i = e;
      let { parser } = this.p;
      this.pos = r;
      let o = parser.stateFlag(i, 1);
      if (!o && (r > n || t <= parser.maxNode)) {
        this.reducePos = r;
      }
      this.pushState(i, o ? n : Math.min(n, this.reducePos));
      this.shiftContext(t, n);
      if (t <= parser.maxNode) {
        this.buffer.push(t, n, r, 4);
      }
    }
  }
  apply(e, t, n, r) {
    if (e & 65536) {
      this.reduce(e);
    } else {
      this.shift(e, t, n, r);
    }
  }
  useNode(e, t) {
    let n = this.p.reused.length - 1;
    if (n < 0 || this.p.reused[n] != e) {
      this.p.reused.push(e);
      n++;
    }
    let pos = this.pos;
    this.reducePos = this.pos = pos + e.length;
    this.pushState(t, pos);
    this.buffer.push(n, pos, this.reducePos, -1);
    if (this.curContext) {
      this.updateContext(
        this.curContext.tracker.reuse(
          this.curContext.context,
          e,
          this,
          this.p.stream.reset(this.pos - e.length),
        ),
      );
    }
  }
  split() {
    let t = this;
    let length = t.buffer.length;
    for (
      length && t.buffer[length - 4] == 0 && (length -= 4);
      length > 0 && t.buffer[length - 2] > t.reducePos;
    ) {
      length -= 4;
    }
    let r = t.buffer.slice(length);
    let i = t.bufferBase + length;
    while (t && i == t.bufferBase) {
      t = t.parent;
    }
    return new e(
      this.p,
      this.stack.slice(),
      this.state,
      this.reducePos,
      this.pos,
      this.score,
      r,
      i,
      this.curContext,
      this.lookAhead,
      t,
    );
  }
  recoverByDelete(e, t) {
    let n = e <= this.p.parser.maxNode;
    if (n) {
      this.storeNode(e, this.pos, t, 4);
    }
    this.storeNode(0, this.pos, t, n ? 8 : 4);
    this.pos = this.reducePos = t;
    this.score -= 190;
  }
  canShift(e) {
    for (let t = new av(this); ;) {
      let n =
        this.p.parser.stateSlot(t.state, 4) ||
        this.p.parser.hasAction(t.state, e);
      if (n == 0) {
        return false;
      }
      if (!(n & 65536)) {
        return true;
      }
      t.reduce(n);
    }
  }
  recoverByInsert(e) {
    if (this.stack.length >= 300) {
      return [];
    }
    let t = this.p.parser.nextStates(this.state);
    if (t.length > 8 || this.stack.length >= 120) {
      let n = [];
      for (let r = 0, i; r < t.length; r += 2) {
        if ((i = t[r + 1]) != this.state && this.p.parser.hasAction(i, e)) {
          n.push(t[r], i);
        }
      }
      if (this.stack.length < 120) {
        for (let e = 0; n.length < 8 && e < t.length; e += 2) {
          let r = t[e + 1];
          if (!n.some((e, t) => t & 1 && e == r)) {
            n.push(t[e], r);
          }
        }
      }
      t = n;
    }
    let n = [];
    for (let e = 0; e < t.length && n.length < 4; e += 2) {
      let r = t[e + 1];
      if (r == this.state) {
        continue;
      }
      let i = this.split();
      i.pushState(r, this.pos);
      i.storeNode(0, i.pos, i.pos, 4, true);
      i.shiftContext(t[e], this.pos);
      i.reducePos = this.pos;
      i.score -= 200;
      n.push(i);
    }
    return n;
  }
  forceReduce() {
    let { parser } = this.p;
    let t = parser.stateSlot(this.state, 5);
    if (!(t & 65536)) {
      return false;
    }
    if (!parser.validAction(this.state, t)) {
      let n = t >> 19;
      let r = t & 65535;
      let i = this.stack.length - n * 3;
      if (i < 0 || parser.getGoto(this.stack[i], r, false) < 0) {
        let e = this.findForcedReduction();
        if (e == null) {
          return false;
        }
        t = e;
      }
      this.storeNode(0, this.pos, this.pos, 4, true);
      this.score -= 100;
    }
    this.reducePos = this.pos;
    this.reduce(t);
    return true;
  }
  findForcedReduction() {
    let { parser } = this.p;
    let t = [];
    let n = (r, i) => {
      if (!t.includes(r)) {
        t.push(r);
        return parser.allActions(r, (t) => {
          if (!(t & 393216)) {
            if (t & 65536) {
              let n = (t >> 19) - i;
              if (n > 1) {
                let r = t & 65535;
                let i = this.stack.length - n * 3;
                if (i >= 0 && parser.getGoto(this.stack[i], r, false) >= 0) {
                  return (n << 19) | 65536 | r;
                }
              }
            } else {
              let e = n(t, i + 1);
              if (e != null) {
                return e;
              }
            }
          }
        });
      }
    };
    return n(this.state, 0);
  }
  forceAll() {
    while (!this.p.parser.stateFlag(this.state, 2)) {
      if (!this.forceReduce()) {
        this.storeNode(0, this.pos, this.pos, 4, true);
        break;
      }
    }
    return this;
  }
  get deadEnd() {
    if (this.stack.length != 3) {
      return false;
    }
    let { parser } = this.p;
    return (
      parser.data[parser.stateSlot(this.state, 1)] == 65535 &&
      !parser.stateSlot(this.state, 4)
    );
  }
  restart() {
    this.storeNode(0, this.pos, this.pos, 4, true);
    this.state = this.stack[0];
    this.stack.length = 0;
  }
  sameState(e) {
    if (this.state != e.state || this.stack.length != e.stack.length) {
      return false;
    }
    for (let t = 0; t < this.stack.length; t += 3) {
      if (this.stack[t] != e.stack[t]) {
        return false;
      }
    }
    return true;
  }
  get parser() {
    return this.p.parser;
  }
  dialectEnabled(e) {
    return this.p.parser.dialect.flags[e];
  }
  shiftContext(e, t) {
    if (this.curContext) {
      this.updateContext(
        this.curContext.tracker.shift(
          this.curContext.context,
          e,
          this,
          this.p.stream.reset(t),
        ),
      );
    }
  }
  reduceContext(e, t) {
    if (this.curContext) {
      this.updateContext(
        this.curContext.tracker.reduce(
          this.curContext.context,
          e,
          this,
          this.p.stream.reset(t),
        ),
      );
    }
  }
  emitContext() {
    let e = this.buffer.length - 1;
    if (e < 0 || this.buffer[e] != -3) {
      this.buffer.push(this.curContext.hash, this.pos, this.pos, -3);
    }
  }
  emitLookAhead() {
    let e = this.buffer.length - 1;
    if (e < 0 || this.buffer[e] != -4) {
      this.buffer.push(this.lookAhead, this.pos, this.pos, -4);
    }
  }
  updateContext(e) {
    if (e != this.curContext.context) {
      let t = new iv(this.curContext.tracker, e);
      if (t.hash != this.curContext.hash) {
        this.emitContext();
      }
      this.curContext = t;
    }
  }
  setLookAhead(e) {
    if (e <= this.lookAhead) {
      return false;
    }
    return (this.emitLookAhead(), (this.lookAhead = e), true);
  }
  close() {
    if (this.curContext && this.curContext.tracker.strict) {
      this.emitContext();
    }
    if (this.lookAhead > 0) {
      this.emitLookAhead();
    }
  }
};
var iv = class {
  constructor(e, t) {
    this.tracker = e;
    this.context = t;
    this.hash = e.strict ? e.hash(t) : 0;
  }
};
var av = class {
  constructor(e) {
    this.start = e;
    this.state = e.state;
    this.stack = e.stack;
    this.base = this.stack.length;
  }
  reduce(e) {
    let t = e & 65535;
    let n = e >> 19;
    if (n == 0) {
      if (this.stack == this.start.stack) {
        this.stack = this.stack.slice();
      }
      this.stack.push(this.state, 0, 0);
      this.base += 3;
    } else {
      this.base -= (n - 1) * 3;
    }
    let r = this.start.p.parser.getGoto(this.stack[this.base - 3], t, true);
    this.state = r;
  }
};
const ov = class e {
  constructor(e, t, n) {
    this.stack = e;
    this.pos = t;
    this.index = n;
    this.buffer = e.buffer;
    if (this.index == 0) {
      this.maybeNext();
    }
  }
  static create(t, n = t.bufferBase + t.buffer.length) {
    return new e(t, n, n - t.bufferBase);
  }
  maybeNext() {
    let parent = this.stack.parent;
    if (parent != null) {
      this.index = this.stack.bufferBase - parent.bufferBase;
      this.stack = parent;
      this.buffer = parent.buffer;
    }
  }
  get id() {
    return this.buffer[this.index - 4];
  }
  get start() {
    return this.buffer[this.index - 3];
  }
  get end() {
    return this.buffer[this.index - 2];
  }
  get size() {
    return this.buffer[this.index - 1];
  }
  next() {
    this.index -= 4;
    this.pos -= 4;
    if (this.index == 0) {
      this.maybeNext();
    }
  }
  fork() {
    return new e(this.stack, this.pos, this.index);
  }
};
function sv(e, t = Uint16Array) {
  if (typeof e != `string`) {
    return e;
  }
  let n = null;
  for (let r = 0, i = 0; r < e.length;) {
    let a = 0;
    while (true) {
      let t = e.charCodeAt(r++);
      let n = false;
      if (t == 126) {
        a = 65535;
        break;
      }
      t >= 92 && t--;
      t >= 34 && t--;
      let i = t - 32;
      if (i >= 46) {
        i -= 46;
        n = true;
      }
      a += i;
      if (n) {
        break;
      }
      a *= 46;
    }
    if (n) {
      n[i++] = a;
    } else {
      n = new t(a);
    }
  }
  return n;
}
class cv {
  constructor() {
    this.start = -1;
    this.value = -1;
    this.end = -1;
    this.extended = -1;
    this.lookAhead = 0;
    this.mask = 0;
    this.context = 0;
  }
}
const lv = new cv();
class uv {
  constructor(e, t) {
    this.input = e;
    this.ranges = t;
    this.chunk = ``;
    this.chunkOff = 0;
    this.chunk2 = ``;
    this.chunk2Pos = 0;
    this.next = -1;
    this.token = lv;
    this.rangeIndex = 0;
    this.pos = this.chunkPos = t[0].from;
    this.range = t[0];
    this.end = t[t.length - 1].to;
    this.readNext();
  }
  resolveOffset(e, t) {
    let range = this.range;
    let rangeIndex = this.rangeIndex;
    let i = this.pos + e;
    while (i < range.from) {
      if (!rangeIndex) {
        return null;
      }
      let e = this.ranges[--rangeIndex];
      i -= range.from - e.to;
      range = e;
    }
    while (t < 0 ? i > range.to : i >= range.to) {
      if (rangeIndex == this.ranges.length - 1) {
        return null;
      }
      let e = this.ranges[++rangeIndex];
      i += e.from - range.to;
      range = e;
    }
    return i;
  }
  clipPos(e) {
    if (e >= this.range.from && e < this.range.to) {
      return e;
    }
    for (let t of this.ranges) {
      if (t.to > e) {
        return Math.max(e, t.from);
      }
    }
    return this.end;
  }
  peek(e) {
    let t = this.chunkOff + e;
    let n;
    let r;
    if (t >= 0 && t < this.chunk.length) {
      n = this.pos + e;
      r = this.chunk.charCodeAt(t);
    } else {
      let t = this.resolveOffset(e, 1);
      if (t == null) {
        return -1;
      }
      n = t;
      if (n >= this.chunk2Pos && n < this.chunk2Pos + this.chunk2.length) {
        r = this.chunk2.charCodeAt(n - this.chunk2Pos);
      } else {
        let e = this.rangeIndex;
        let t = this.range;
        while (t.to <= n) {
          t = this.ranges[++e];
        }
        this.chunk2 = this.input.chunk((this.chunk2Pos = n));
        if (n + this.chunk2.length > t.to) {
          this.chunk2 = this.chunk2.slice(0, t.to - n);
        }
        r = this.chunk2.charCodeAt(0);
      }
    }
    if (n >= this.token.lookAhead) {
      this.token.lookAhead = n + 1;
    }
    return r;
  }
  acceptToken(e, t = 0) {
    let n = t ? this.resolveOffset(t, -1) : this.pos;
    if (n == null || n < this.token.start) {
      throw RangeError(`Token end out of bounds`);
    }
    this.token.value = e;
    this.token.end = n;
  }
  acceptTokenTo(e, t) {
    this.token.value = e;
    this.token.end = t;
  }
  getChunk() {
    if (
      this.pos >= this.chunk2Pos &&
      this.pos < this.chunk2Pos + this.chunk2.length
    ) {
      let { chunk, chunkPos } = this;
      this.chunk = this.chunk2;
      this.chunkPos = this.chunk2Pos;
      this.chunk2 = chunk;
      this.chunk2Pos = chunkPos;
      this.chunkOff = this.pos - this.chunkPos;
    } else {
      this.chunk2 = this.chunk;
      this.chunk2Pos = this.chunkPos;
      let e = this.input.chunk(this.pos);
      let t = this.pos + e.length;
      this.chunk = t > this.range.to ? e.slice(0, this.range.to - this.pos) : e;
      this.chunkPos = this.pos;
      this.chunkOff = 0;
    }
  }
  readNext() {
    return (this.next =
      this.chunkOff >= this.chunk.length &&
      (this.getChunk(), this.chunkOff == this.chunk.length)
        ? -1
        : this.chunk.charCodeAt(this.chunkOff));
  }
  advance(e = 1) {
    for (this.chunkOff += e; this.pos + e >= this.range.to;) {
      if (this.rangeIndex == this.ranges.length - 1) {
        return this.setDone();
      }
      e -= this.range.to - this.pos;
      this.range = this.ranges[++this.rangeIndex];
      this.pos = this.range.from;
    }
    this.pos += e;
    if (this.pos >= this.token.lookAhead) {
      this.token.lookAhead = this.pos + 1;
    }
    return this.readNext();
  }
  setDone() {
    this.pos = this.chunkPos = this.end;
    this.range = this.ranges[(this.rangeIndex = this.ranges.length - 1)];
    this.chunk = ``;
    return (this.next = -1);
  }
  reset(e, t) {
    if (t) {
      this.token = t;
      t.start = e;
      t.lookAhead = e + 1;
      t.value = t.extended = -1;
    } else {
      this.token = lv;
    }
    if (this.pos != e) {
      this.pos = e;
      if (e == this.end) {
        this.setDone();
        return this;
      }
      while (e < this.range.from) {
        this.range = this.ranges[--this.rangeIndex];
      }
      while (e >= this.range.to) {
        this.range = this.ranges[++this.rangeIndex];
      }
      if (e >= this.chunkPos && e < this.chunkPos + this.chunk.length) {
        this.chunkOff = e - this.chunkPos;
      } else {
        this.chunk = ``;
        this.chunkOff = 0;
      }
      this.readNext();
    }
    return this;
  }
  read(e, t) {
    if (e >= this.chunkPos && t <= this.chunkPos + this.chunk.length) {
      return this.chunk.slice(e - this.chunkPos, t - this.chunkPos);
    }
    if (e >= this.chunk2Pos && t <= this.chunk2Pos + this.chunk2.length) {
      return this.chunk2.slice(e - this.chunk2Pos, t - this.chunk2Pos);
    }
    if (e >= this.range.from && t <= this.range.to) {
      return this.input.read(e, t);
    }
    let n = ``;
    for (let r of this.ranges) {
      if (r.from >= t) {
        break;
      }
      if (r.to > e) {
        n += this.input.read(Math.max(r.from, e), Math.min(r.to, t));
      }
    }
    return n;
  }
}
class dv {
  constructor(e, t) {
    this.data = e;
    this.id = t;
  }
  token(e, t) {
    let { parser } = t.p;
    mv(this.data, e, t, this.id, parser.data, parser.tokenPrecTable);
  }
}
dv.prototype.contextual = dv.prototype.fallback = dv.prototype.extend = false;
class fv {
  constructor(e, t, n) {
    this.precTable = t;
    this.elseToken = n;
    this.data = typeof e == `string` ? sv(e) : e;
  }
  token(e, t) {
    let e_pos = e.pos;
    let r = 0;
    while (true) {
      let n = e.next < 0;
      let i = e.resolveOffset(1, 1);
      mv(this.data, e, t, 0, this.data, this.precTable);
      if (e.token.value > -1) {
        break;
      }
      if (this.elseToken == null) {
        return;
      }
      n || r++;
      if (i == null) {
        break;
      }
      e.reset(i, e.token);
    }
    if (r) {
      e.reset(e_pos, e.token);
      e.acceptToken(this.elseToken, r);
    }
  }
}
fv.prototype.contextual = dv.prototype.fallback = dv.prototype.extend = false;
class pv {
  constructor(e, t = {}) {
    this.token = e;
    this.contextual = !!t.contextual;
    this.fallback = !!t.fallback;
    this.extend = !!t.extend;
  }
}
function mv(data, t, n, r, i, a) {
  let o = 0;
  let s = 1 << r;
  let { dialect } = n.p.parser;
  scan: while ((s & data[o]) != 0) {
    let n = data[o + 1];
    for (let r = o + 3; r < n; r += 2) {
      if ((data[r + 1] & s) > 0) {
        let n = data[r];
        if (
          dialect.allows(n) &&
          (t.token.value == -1 ||
            t.token.value == n ||
            gv(n, t.token.value, i, a))
        ) {
          t.acceptToken(n);
          break;
        }
      }
    }
    let r = t.next;
    let l = 0;
    let u = data[o + 2];
    if (t.next < 0 && u > l && data[n + u * 3 - 3] == 65535) {
      o = data[n + u * 3 - 1];
      continue scan;
    }
    while (l < u) {
      let i = (l + u) >> 1;
      let a = n + i + (i << 1);
      let s = data[a];
      let c = data[a + 1] || 65536;
      if (r < s) {
        u = i;
      } else if (r >= c) {
        l = i + 1;
      } else {
        o = data[a + 2];
        t.advance();
        continue scan;
      }
    }
    break;
  }
}
function hv(e, t, n) {
  for (let r = t, i; (i = e[r]) != 65535; r++) {
    if (i == n) {
      return r - t;
    }
  }
  return -1;
}
function gv(e, t, n, r) {
  let i = hv(n, r, t);
  return i < 0 || hv(n, r, e) < i;
}
const _v = typeof process < `u` && /\bparse\b/.test({}.LOG);
let vv = null;
function yv(tree, t, n) {
  let r = tree.cursor(q.IncludeAnonymous);
  for (r.moveTo(t); ;) {
    if (!(n < 0 ? r.childBefore(t) : r.childAfter(t))) {
      while (true) {
        if ((n < 0 ? r.to < t : r.from > t) && !r.type.isError) {
          if (n < 0) {
            return Math.max(0, Math.min(r.to - 1, t - 25));
          }
          return Math.min(tree.length, Math.max(r.from + 1, t + 25));
        }
        if (n < 0 ? r.prevSibling() : r.nextSibling()) {
          break;
        }
        if (!r.parent()) {
          if (n < 0) {
            return 0;
          }
          return tree.length;
        }
      }
    }
  }
}
class bv {
  constructor(e, t) {
    this.fragments = e;
    this.nodeSet = t;
    this.i = 0;
    this.fragment = null;
    this.safeFrom = -1;
    this.safeTo = -1;
    this.trees = [];
    this.start = [];
    this.index = [];
    this.nextFragment();
  }
  nextFragment() {
    let e = (this.fragment =
      this.i == this.fragments.length ? null : this.fragments[this.i++]);
    if (e) {
      this.safeFrom = e.openStart
        ? yv(e.tree, e.from + e.offset, 1) - e.offset
        : e.from;
      for (
        this.safeTo = e.openEnd
          ? yv(e.tree, e.to + e.offset, -1) - e.offset
          : e.to;
        this.trees.length;
      ) {
        this.trees.pop();
        this.start.pop();
        this.index.pop();
      }
      this.trees.push(e.tree);
      this.start.push(-e.offset);
      this.index.push(0);
      this.nextStart = this.safeFrom;
    } else {
      this.nextStart = 1000000000;
    }
  }
  nodeAt(e) {
    if (e < this.nextStart) {
      return null;
    }
    while (this.fragment && this.safeTo <= e) {
      this.nextFragment();
    }
    if (!this.fragment) {
      return null;
    }
    while (true) {
      let t = this.trees.length - 1;
      if (t < 0) {
        this.nextFragment();
        return null;
      }
      let n = this.trees[t];
      let r = this.index[t];
      if (r == n.children.length) {
        this.trees.pop();
        this.start.pop();
        this.index.pop();
        continue;
      }
      let i = n.children[r];
      let a = this.start[t] + n.positions[r];
      if (a > e) {
        this.nextStart = a;
        return null;
      }
      if (i instanceof J) {
        if (a == e) {
          if (a < this.safeFrom) {
            return null;
          }
          let e = a + i.length;
          if (e <= this.safeTo) {
            let t = i.prop(K.lookAhead);
            if (!t || e + t < this.fragment.to) {
              return i;
            }
          }
        }
        this.index[t]++;
        if (a + i.length >= Math.max(this.safeFrom, e)) {
          this.trees.push(i);
          this.start.push(a);
          this.index.push(0);
        }
      } else {
        this.index[t]++;
        this.nextStart = a + i.length;
      }
    }
  }
}
class xv {
  constructor(e, t) {
    this.stream = t;
    this.tokens = [];
    this.mainToken = null;
    this.actions = [];
    this.tokens = e.tokenizers.map((e) => new cv());
  }
  getActions(e) {
    let t = 0;
    let n = null;
    let { parser } = e.p;
    let { tokenizers } = parser;
    let a = parser.stateSlot(e.state, 3);
    let o = e.curContext ? e.curContext.hash : 0;
    let s = 0;
    for (let r = 0; r < tokenizers.length; r++) {
      if (!((1 << r) & a)) {
        continue;
      }
      let tokenizer = tokenizers[r];
      let l = this.tokens[r];
      if (
        (!n || tokenizer.fallback) &&
        ((tokenizer.contextual ||
          l.start != e.pos ||
          l.mask != a ||
          l.context != o) &&
          (this.updateCachedToken(l, tokenizer, e),
          (l.mask = a),
          (l.context = o)),
        l.lookAhead > l.end + 25 && (s = Math.max(l.lookAhead, s)),
        l.value != 0)
      ) {
        let r = t;
        if (l.extended > -1) {
          t = this.addActions(e, l.extended, l.end, t);
        }
        t = this.addActions(e, l.value, l.end, t);
        if (!tokenizer.extend && ((n = l), t > r)) {
          break;
        }
      }
    }
    while (this.actions.length > t) {
      this.actions.pop();
    }
    if (s) {
      e.setLookAhead(s);
    }
    if (!n && e.pos == this.stream.end) {
      n = new cv();
      n.value = e.p.parser.eofTerm;
      n.start = n.end = e.pos;
      t = this.addActions(e, n.value, n.end, t);
    }
    this.mainToken = n;
    return this.actions;
  }
  getMainToken(e) {
    if (this.mainToken) {
      return this.mainToken;
    }
    let t = new cv();
    let { pos, p } = e;
    t.start = pos;
    t.end = Math.min(pos + 1, p.stream.end);
    t.value = pos == p.stream.end ? p.parser.eofTerm : 0;
    return t;
  }
  updateCachedToken(e, t, n) {
    let r = this.stream.clipPos(n.pos);
    t.token(this.stream.reset(r, e), n);
    if (e.value > -1) {
      let { parser } = n.p;
      for (let r = 0; r < parser.specialized.length; r++) {
        if (parser.specialized[r] == e.value) {
          let i = parser.specializers[r](this.stream.read(e.start, e.end), n);
          if (i >= 0 && n.p.parser.dialect.allows(i >> 1)) {
            if (i & 1) {
              e.extended = i >> 1;
            } else {
              e.value = i >> 1;
            }
            break;
          }
        }
      }
    } else {
      e.value = 0;
      e.end = this.stream.clipPos(r + 1);
    }
  }
  putAction(e, t, n, r) {
    for (let t = 0; t < r; t += 3) {
      if (this.actions[t] == e) {
        return r;
      }
    }
    this.actions[r++] = e;
    this.actions[r++] = t;
    this.actions[r++] = n;
    return r;
  }
  addActions(e, t, n, r) {
    let { state } = e;
    let { parser } = e.p;
    let { data } = parser;
    for (let e = 0; e < 2; e++) {
      for (let s = parser.stateSlot(state, e ? 2 : 1); ; s += 3) {
        if (data[s] == 65535) {
          if (data[s + 1] == 1) {
            s = Ov(data, s + 2);
          } else {
            if (r == 0 && data[s + 1] == 2) {
              r = this.putAction(Ov(data, s + 2), t, n, r);
            }
            break;
          }
        }
        if (data[s] == t) {
          r = this.putAction(Ov(data, s + 1), t, n, r);
        }
      }
    }
    return r;
  }
}
class Sv {
  constructor(e, t, n, r) {
    this.parser = e;
    this.input = t;
    this.ranges = r;
    this.recovering = 0;
    this.nextStackID = 9812;
    this.minStackPos = 0;
    this.reused = [];
    this.stoppedAt = null;
    this.lastBigReductionStart = -1;
    this.lastBigReductionSize = 0;
    this.bigReductionCount = 0;
    this.stream = new uv(t, r);
    this.tokens = new xv(e, this.stream);
    this.topTerm = e.top[1];
    let { from } = r[0];
    this.stacks = [rv.start(this, e.top[0], from)];
    this.fragments =
      n.length && this.stream.end - from > e.bufferLength * 4
        ? new bv(n, e.nodeSet)
        : null;
  }
  get parsedPos() {
    return this.minStackPos;
  }
  advance() {
    let stacks = this.stacks;
    let minStackPos = this.minStackPos;
    let n = (this.stacks = []);
    let r;
    let i;
    if (this.bigReductionCount > 300 && stacks.length == 1) {
      let [t] = stacks;
      while (
        t.forceReduce() &&
        t.stack.length &&
        t.stack[t.stack.length - 2] >= this.lastBigReductionStart
      );
      this.bigReductionCount = this.lastBigReductionSize = 0;
    }
    for (const o of stacks) {
      while (true) {
        this.tokens.mainToken = null;
        if (o.pos > minStackPos) {
          n.push(o);
        } else if (this.advanceStack(o, n, stacks)) {
          continue;
        } else {
          if (!r) {
            r = [];
            i = [];
          }
          r.push(o);
          let e = this.tokens.getMainToken(o);
          i.push(e.value, e.end);
        }
        break;
      }
    }
    if (!n.length) {
      let e = r && kv(r);
      if (e) {
        if (_v) {
          console.log(`Finish with ` + this.stackID(e));
        }
        return this.stackToTree(e);
      }
      if (this.parser.strict) {
        if (_v && r) {
          console.log(
            `Stuck with token ` +
              (this.tokens.mainToken
                ? this.parser.getName(this.tokens.mainToken.value)
                : `none`),
          );
        }
        throw SyntaxError(`No parse at ` + minStackPos);
      }
      this.recovering ||= 5;
    }
    if (this.recovering && r) {
      let e =
        this.stoppedAt != null && r[0].pos > this.stoppedAt
          ? r[0]
          : this.runRecovery(r, i, n);
      if (e) {
        if (_v) {
          console.log(`Force-finish ` + this.stackID(e));
        }
        return this.stackToTree(e.forceAll());
      }
    }
    if (this.recovering) {
      let e = this.recovering == 1 ? 1 : this.recovering * 3;
      if (n.length > e) {
        for (n.sort((e, t) => t.score - e.score); n.length > e;) {
          n.pop();
        }
      }
      n.some((e) => e.reducePos > minStackPos) && this.recovering--;
    } else if (n.length > 1) {
      outer: for (let e = 0; e < n.length - 1; e++) {
        let t = n[e];
        for (let r = e + 1; r < n.length; r++) {
          let i = n[r];
          if (
            t.sameState(i) ||
            (t.buffer.length > 500 && i.buffer.length > 500)
          ) {
            if ((t.score - i.score || t.buffer.length - i.buffer.length) > 0) {
              n.splice(r--, 1);
            } else {
              n.splice(e--, 1);
              continue outer;
            }
          }
        }
      }
      if (n.length > 12) {
        n.sort((e, t) => t.score - e.score);
        n.splice(12, n.length - 12);
      }
    }
    this.minStackPos = n[0].pos;
    for (let e = 1; e < n.length; e++) {
      if (n[e].pos < this.minStackPos) {
        this.minStackPos = n[e].pos;
      }
    }
    return null;
  }
  stopAt(e) {
    if (this.stoppedAt != null && this.stoppedAt < e) {
      throw RangeError(`Can't move stoppedAt forward`);
    }
    this.stoppedAt = e;
  }
  advanceStack(e, t, n) {
    let e_pos = e.pos;
    let { parser } = this;
    let a = _v ? this.stackID(e) + ` -> ` : ``;
    if (this.stoppedAt != null && e_pos > this.stoppedAt) {
      if (e.forceReduce()) {
        return e;
      }
      return null;
    }
    if (this.fragments) {
      let t = e.curContext && e.curContext.tracker.strict;
      let n = t ? e.curContext.hash : 0;
      for (let o = this.fragments.nodeAt(e_pos); o;) {
        let r =
          this.parser.nodeSet.types[o.type.id] == o.type
            ? parser.getGoto(e.state, o.type.id)
            : -1;
        if (r > -1 && o.length && (!t || (o.prop(K.contextHash) || 0) == n)) {
          e.useNode(o, r);
          if (_v) {
            console.log(
              a +
                this.stackID(e) +
                ` (via reuse of ${parser.getName(o.type.id)})`,
            );
          }
          return true;
        }
        if (!(o instanceof J) || o.children.length == 0 || o.positions[0] > 0) {
          break;
        }
        let s = o.children[0];
        if (s instanceof J && o.positions[0] == 0) {
          o = s;
        } else {
          break;
        }
      }
    }
    let o = parser.stateSlot(e.state, 4);
    if (o > 0) {
      e.reduce(o);
      if (_v) {
        console.log(
          a +
            this.stackID(e) +
            ` (via always-reduce ${parser.getName(o & 65535)})`,
        );
      }
      return true;
    }
    if (e.stack.length >= 8400) {
      while (e.stack.length > 6000 && e.forceReduce());
    }
    let s = this.tokens.getActions(e);
    for (let o = 0; o < s.length;) {
      let c = s[o++];
      let l = s[o++];
      let u = s[o++];
      let d = o == s.length || !n;
      let f = d ? e : e.split();
      let p = this.tokens.mainToken;
      f.apply(c, l, p ? p.start : f.pos, u);
      if (_v) {
        console.log(
          a +
            this.stackID(f) +
            ` (via ${c & 65536 ? `reduce of ${parser.getName(c & 65535)}` : `shift`} for ${parser.getName(l)} @ ${e_pos}${f == e ? `` : `, split`})`,
        );
      }
      if (d) {
        return true;
      }
      if (f.pos > e_pos) {
        t.push(f);
      } else {
        n.push(f);
      }
    }
    return false;
  }
  advanceFully(e, t) {
    let e_pos = e.pos;
    while (true) {
      if (!this.advanceStack(e, null, null)) {
        return false;
      }
      if (e.pos > e_pos) {
        Cv(e, t);
        return true;
      }
    }
  }
  runRecovery(e, t, n) {
    let r = null;
    let i = false;
    for (let a = 0; a < e.length; a++) {
      let o = e[a];
      let s = t[a << 1];
      let c = t[(a << 1) + 1];
      let l = _v ? this.stackID(o) + ` -> ` : ``;
      if (
        o.deadEnd &&
        (i ||
          ((i = true),
          o.restart(),
          _v && console.log(l + this.stackID(o) + ` (restarted)`),
          this.advanceFully(o, n)))
      ) {
        continue;
      }
      let u = o.split();
      let d = l;
      for (
        let e = 0;
        e < 10 &&
        u.forceReduce() &&
        (_v && console.log(d + this.stackID(u) + ` (via force-reduce)`),
        !this.advanceFully(u, n));
        e++
      ) {
        if (_v) {
          d = this.stackID(u) + ` -> `;
        }
      }
      for (let e of o.recoverByInsert(s)) {
        if (_v) {
          console.log(l + this.stackID(e) + ` (via recover-insert)`);
        }
        this.advanceFully(e, n);
      }
      if (this.stream.end > o.pos) {
        if (c == o.pos) {
          c++;
          s = 0;
        }
        o.recoverByDelete(s, c);
        if (_v) {
          console.log(
            l +
              this.stackID(o) +
              ` (via recover-delete ${this.parser.getName(s)})`,
          );
        }
        Cv(o, n);
      } else if (!r || r.score < u.score) {
        r = u;
      }
    }
    return r;
  }
  stackToTree(e) {
    e.close();
    return J.build({
      buffer: ov.create(e),
      nodeSet: this.parser.nodeSet,
      topID: this.topTerm,
      maxBufferLength: this.parser.bufferLength,
      reused: this.reused,
      start: this.ranges[0].from,
      length: e.pos - this.ranges[0].from,
      minRepeatType: this.parser.minRepeatTerm,
    });
  }
  stackID(e) {
    let t = (vv ||= new WeakMap()).get(e);
    if (!t) {
      vv.set(e, (t = String.fromCodePoint(this.nextStackID++)));
    }
    return t + e;
  }
}
function Cv(e, t) {
  for (let n = 0; n < t.length; n++) {
    let r = t[n];
    if (r.pos == e.pos && r.sameState(e)) {
      if (t[n].score < e.score) {
        t[n] = e;
      }
      return;
    }
  }
  t.push(e);
}
class wv {
  constructor(e, t, n) {
    this.source = e;
    this.flags = t;
    this.disabled = n;
  }
  allows(e) {
    return !this.disabled || this.disabled[e] == 0;
  }
}
const Tv = (e) => e;
class Ev {
  constructor(e) {
    this.start = e.start;
    this.shift = e.shift || Tv;
    this.reduce = e.reduce || Tv;
    this.reuse = e.reuse || Tv;
    this.hash = e.hash || (() => 0);
    this.strict = e.strict !== false;
  }
}
const Dv = class e extends Dl {
  constructor(e) {
    super();
    this.wrappers = [];
    if (e.version != 14) {
      throw RangeError(
        `Parser version (${e.version}) doesn't match runtime version (14)`,
      );
    }
    let t = e.nodeNames.split(` `);
    this.minRepeatTerm = t.length;
    for (let n = 0; n < e.repeatNodeCount; n++) {
      t.push(``);
    }
    let n = Object.keys(e.topRules).map((t) => e.topRules[t][1]);
    let r = [];
    for (let e = 0; e < t.length; e++) {
      r.push([]);
    }
    function i(e, t, n) {
      r[e].push([t, t.deserialize(String(n))]);
    }
    if (e.nodeProps) {
      for (let t of e.nodeProps) {
        let e = t[0];
        if (typeof e == `string`) {
          e = K[e];
        }
        for (let n = 1; n < t.length;) {
          let r = t[n++];
          if (r >= 0) {
            i(r, e, t[n++]);
          } else {
            let a = t[n + -r];
            for (let o = -r; o > 0; o--) {
              i(t[n++], e, a);
            }
            n++;
          }
        }
      }
    }
    this.nodeSet = new il(
      t.map((t, id_1) =>
        rl.define({
          name: id_1 >= this.minRepeatTerm ? undefined : t,
          id: id_1,
          props: r[id_1],
          top: n.indexOf(id_1) > -1,
          error: id_1 == 0,
          skipped: e.skippedNodes && e.skippedNodes.indexOf(id_1) > -1,
        }),
      ),
    );
    if (e.propSources) {
      this.nodeSet = this.nodeSet.extend(...e.propSources);
    }
    this.strict = false;
    this.bufferLength = Qc;
    let a = sv(e.tokenData);
    this.context = e.context;
    this.specializerSpecs = e.specialized || [];
    this.specialized = new Uint16Array(this.specializerSpecs.length);
    for (let e = 0; e < this.specializerSpecs.length; e++) {
      this.specialized[e] = this.specializerSpecs[e].term;
    }
    this.specializers = this.specializerSpecs.map(Av);
    this.states = sv(e.states, Uint32Array);
    this.data = sv(e.stateData);
    this.goto = sv(e.goto);
    this.maxTerm = e.maxTerm;
    this.tokenizers = e.tokenizers.map((e) => {
      if (typeof e == `number`) {
        return new dv(a, e);
      }
      return e;
    });
    this.topRules = e.topRules;
    this.dialects = e.dialects || {};
    this.dynamicPrecedences = e.dynamicPrecedences || null;
    this.tokenPrecTable = e.tokenPrec;
    this.termNames = e.termNames || null;
    this.maxNode = this.nodeSet.types.length - 1;
    this.dialect = this.parseDialect();
    this.top = this.topRules[Object.keys(this.topRules)[0]];
  }
  createParse(e, t, n) {
    let r = new Sv(this, e, t, n);
    for (let i of this.wrappers) {
      r = i(r, e, t, n);
    }
    return r;
  }
  getGoto(e, t, n = false) {
    let goto = this.goto;
    if (t >= goto[0]) {
      return -1;
    }
    for (let i = goto[t + 1]; ;) {
      let t = goto[i++];
      let a = t & 1;
      let o = goto[i++];
      if (a && n) {
        return o;
      }
      for (let n = i + (t >> 1); i < n; i++) {
        if (goto[i] == e) {
          return o;
        }
      }
      if (a) {
        return -1;
      }
    }
  }
  hasAction(e, t) {
    let data = this.data;
    for (let r = 0; r < 2; r++) {
      for (let i = this.stateSlot(e, r ? 2 : 1), a; ; i += 3) {
        if ((a = data[i]) == 65535) {
          if (data[i + 1] == 1) {
            a = data[(i = Ov(data, i + 2))];
          } else if (data[i + 1] == 2) {
            return Ov(data, i + 2);
          } else {
            break;
          }
        }
        if (a == t || a == 0) {
          return Ov(data, i + 1);
        }
      }
    }
    return 0;
  }
  stateSlot(e, t) {
    return this.states[e * 6 + t];
  }
  stateFlag(e, t) {
    return (this.stateSlot(e, 0) & t) > 0;
  }
  validAction(e, t) {
    return !!this.allActions(e, (e) => e == t || null);
  }
  allActions(e, t) {
    let n = this.stateSlot(e, 4);
    let r = n ? t(n) : undefined;
    for (let n = this.stateSlot(e, 1); r == null; n += 3) {
      if (this.data[n] == 65535) {
        if (this.data[n + 1] == 1) {
          n = Ov(this.data, n + 2);
        } else {
          break;
        }
      }
      r = t(Ov(this.data, n + 1));
    }
    return r;
  }
  nextStates(e) {
    let t = [];
    for (let n = this.stateSlot(e, 1); ; n += 3) {
      if (this.data[n] == 65535) {
        if (this.data[n + 1] == 1) {
          n = Ov(this.data, n + 2);
        } else {
          break;
        }
      }
      if (!(this.data[n + 2] & 1)) {
        let e = this.data[n + 1];
        if (!t.some((t, n) => n & 1 && t == e)) {
          t.push(this.data[n], e);
        }
      }
    }
    return t;
  }
  configure(t) {
    let n = Object.assign(Object.create(e.prototype), this);
    if (t.props) {
      n.nodeSet = this.nodeSet.extend(...t.props);
    }
    if (t.top) {
      let e = this.topRules[t.top];
      if (!e) {
        throw RangeError(`Invalid top rule name ${t.top}`);
      }
      n.top = e;
    }
    if (t.tokenizers) {
      n.tokenizers = this.tokenizers.map((e) => {
        let n = t.tokenizers.find((t) => t.from == e);
        if (n) {
          return n.to;
        }
        return e;
      });
    }
    if (t.specializers) {
      n.specializers = this.specializers.slice();
      n.specializerSpecs = this.specializerSpecs.map((e, r) => {
        let i = t.specializers.find((t) => t.from == e.external);
        if (!i) {
          return e;
        }
        let a = {
          ...e,
          external: i.to,
        };
        n.specializers[r] = Av(a);
        return a;
      });
    }
    if (t.contextTracker) {
      n.context = t.contextTracker;
    }
    if (t.dialect) {
      n.dialect = this.parseDialect(t.dialect);
    }
    if (t.strict != null) {
      n.strict = t.strict;
    }
    if (t.wrap) {
      n.wrappers = n.wrappers.concat(t.wrap);
    }
    if (t.bufferLength != null) {
      n.bufferLength = t.bufferLength;
    }
    return n;
  }
  hasWrappers() {
    return this.wrappers.length > 0;
  }
  getName(e) {
    if (this.termNames) {
      return this.termNames[e];
    }
    return String((e <= this.maxNode && this.nodeSet.types[e].name) || e);
  }
  get eofTerm() {
    return this.maxNode + 1;
  }
  get topNode() {
    return this.nodeSet.types[this.top[1]];
  }
  dynamicPrecedence(e) {
    let dynamicPrecedences = this.dynamicPrecedences;
    if (dynamicPrecedences == null) {
      return 0;
    }
    return dynamicPrecedences[e] || 0;
  }
  parseDialect(e) {
    let t = Object.keys(this.dialects);
    let n = t.map(() => false);
    if (e) {
      for (let r of e.split(` `)) {
        let e = t.indexOf(r);
        if (e >= 0) {
          n[e] = true;
        }
      }
    }
    let r = null;
    for (let e = 0; e < t.length; e++) {
      if (!n[e]) {
        for (let n = this.dialects[t[e]], i; (i = this.data[n++]) != 65535;) {
          r ||= new Uint8Array(this.maxTerm + 1);
          r[i] = 1;
        }
      }
    }
    return new wv(e, n, r);
  }
  static deserialize(t) {
    return new e(t);
  }
};
function Ov(data, t) {
  return data[t] | (data[t + 1] << 16);
}
function kv(e) {
  let t = null;
  for (let n of e) {
    let e = n.p.stoppedAt;
    if (
      (n.pos == n.p.stream.end || (e != null && n.pos > e)) &&
      n.p.parser.stateFlag(n.state, 2) &&
      (!t || t.score < n.score)
    ) {
      t = n;
    }
  }
  return t;
}
function Av(e) {
  if (e.external) {
    let t = +!!e.extend;
    return (n, r) => (e.external(n, r) << 1) | t;
  }
  return e.get;
}
const jv = 63;
const Mv = 64;
const Nv = 1;
const Pv = 2;
const Fv = 3;
const Iv = 4;
const Lv = 5;
const Rv = 6;
const zv = 7;
const Bv = 65;
const Vv = 66;
const Hv = 8;
const Uv = 9;
const Wv = 10;
const Gv = 11;
const Kv = 12;
const qv = 13;
const Jv = 19;
const Yv = 20;
const Xv = 29;
const Zv = 33;
const Qv = 34;
const $v = 47;
const ey = 0;
const ty = 1;
const ny = 2;
const ry = 3;
const iy = 4;
class ay {
  constructor(e, t, n) {
    this.parent = e;
    this.depth = t;
    this.type = n;
    this.hash = (e ? (e.hash + e.hash) << 8 : 0) + t + (t << 4) + n;
  }
}
ay.top = new ay(null, -1, ey);
function oy(e, t) {
  for (let n = 0, r = t - e.pos - 1; ; r--, n++) {
    let t = e.peek(r);
    if (cy(t) || t == -1) {
      return n;
    }
  }
}
function sy(e) {
  return e == 32 || e == 9;
}
function cy(e) {
  return e == 10 || e == 13;
}
function ly(e) {
  return sy(e) || cy(e);
}
function uy(e) {
  return e < 0 || ly(e);
}
const context = new Ev({
  start: ay.top,
  reduce(e, t) {
    if (e.type == ry && (t == Yv || t == Qv)) {
      return e.parent;
    }
    return e;
  },
  shift(e, t, n, r) {
    if (t == Fv) {
      return new ay(e, oy(r, r.pos), ty);
    }
    if (t == Bv || t == Lv) {
      return new ay(e, oy(r, r.pos), ny);
    }
    if (t == jv) {
      return e.parent;
    }
    if (t == Jv || t == Zv) {
      return new ay(e, 0, ry);
    }
    if (t == qv && e.type == iy) {
      return e.parent;
    }
    if (t == $v) {
      let t = /[1-9]/.exec(r.read(r.pos, n.pos));
      if (t) {
        return new ay(e, e.depth + +t[0], iy);
      }
    }
    return e;
  },
  hash(e) {
    return e.hash;
  },
});
function fy(e, t, n = 0) {
  return (
    e.peek(n) == t &&
    e.peek(n + 1) == t &&
    e.peek(n + 2) == t &&
    uy(e.peek(n + 3))
  );
}
const py = new pv(
  (e, t) => {
    if (e.next == -1 && t.canShift(Mv)) {
      return e.acceptToken(Mv);
    }
    let n = e.peek(-1);
    if ((cy(n) || n < 0) && t.context.type != ry) {
      if (fy(e, 45)) {
        if (t.canShift(jv)) {
          e.acceptToken(jv);
        } else {
          return e.acceptToken(Nv, 3);
        }
      }
      if (fy(e, 46)) {
        if (t.canShift(jv)) {
          e.acceptToken(jv);
        } else {
          return e.acceptToken(Pv, 3);
        }
      }
      let n = 0;
      while (e.next == 32) {
        n++;
        e.advance();
      }
      if (
        (n < t.context.depth ||
          (n == t.context.depth &&
            t.context.type == ty &&
            (e.next != 45 || !uy(e.peek(1))))) &&
        e.next != -1 &&
        !cy(e.next) &&
        e.next != 35
      ) {
        e.acceptToken(jv, -n);
      }
    }
  },
  {
    contextual: true,
  },
);
const my = new pv(
  (e, t) => {
    if (t.context.type == ry) {
      if (e.next == 63) {
        e.advance();
        if (uy(e.next)) {
          e.acceptToken(zv);
        }
      }
      return;
    }
    if (e.next == 45) {
      e.advance();
      if (uy(e.next)) {
        e.acceptToken(
          t.context.type == ty && t.context.depth == oy(e, e.pos - 1) ? Iv : Fv,
        );
      }
    } else if (e.next == 63) {
      e.advance();
      if (uy(e.next)) {
        e.acceptToken(
          t.context.type == ny && t.context.depth == oy(e, e.pos - 1) ? Rv : Lv,
        );
      }
    } else {
      let n = e.pos;
      while (true) {
        if (sy(e.next)) {
          if (e.pos == n) {
            return;
          }
          e.advance();
        } else if (e.next == 33) {
          vy(e);
        } else if (e.next == 38) {
          yy(e);
        } else if (e.next == 42) {
          yy(e);
          break;
        } else if (e.next == 39 || e.next == 34) {
          if (by(e, true)) {
            break;
          }
          return;
        } else if (e.next == 91 || e.next == 123) {
          if (!xy(e)) {
            return;
          }
          break;
        } else {
          Ty(e, true, false, 0);
          break;
        }
      }
      while (sy(e.next)) {
        e.advance();
      }
      if (e.next == 58) {
        if (e.pos == n && t.canShift(Xv)) {
          return;
        }
        if (uy(e.peek(1))) {
          e.acceptTokenTo(
            t.context.type == ny && t.context.depth == oy(e, n) ? Vv : Bv,
            n,
          );
        }
      }
    }
  },
  {
    contextual: true,
  },
);
function hy(next) {
  return (
    next > 32 &&
    next < 127 &&
    next != 34 &&
    next != 37 &&
    next != 44 &&
    next != 60 &&
    next != 62 &&
    next != 92 &&
    next != 94 &&
    next != 96 &&
    next != 123 &&
    next != 124 &&
    next != 125
  );
}
function gy(next) {
  return (
    (next >= 48 && next <= 57) ||
    (next >= 97 && next <= 102) ||
    (next >= 65 && next <= 70)
  );
}
function _y(e, t) {
  if (e.next == 37) {
    return (
      e.advance(),
      gy(e.next) && e.advance(),
      gy(e.next) && e.advance(),
      true
    );
  }
  if (hy(e.next) || (t && e.next == 44)) {
    return (e.advance(), true);
  }
  return false;
}
function vy(e) {
  e.advance();
  if (e.next == 60) {
    for (e.advance(); ;) {
      if (!_y(e, true)) {
        if (e.next == 62) {
          e.advance();
        }
        break;
      }
    }
  } else {
    while (_y(e, false));
  }
}
function yy(e) {
  for (e.advance(); !uy(e.next) && Cy(e.next) != `f`;) {
    e.advance();
  }
}
function by(e, t) {
  let e_next = e.next;
  let r = false;
  let e_pos = e.pos;
  for (e.advance(); ;) {
    let a = e.next;
    if (a < 0) {
      break;
    }
    e.advance();
    if (a == e_next) {
      if (a == 39) {
        if (e.next == 39) {
          e.advance();
        } else {
          break;
        }
      } else {
        break;
      }
    } else if (a == 92 && e_next == 34) {
      if (e.next >= 0) {
        e.advance();
      }
    } else if (cy(a)) {
      if (t) {
        return false;
      }
      r = true;
    } else if (t && e.pos >= e_pos + 1024) {
      return false;
    }
  }
  return !r;
}
function xy(e) {
  for (let t = [], n = e.pos + 1024; ;) {
    if (e.next == 91 || e.next == 123) {
      t.push(e.next);
      e.advance();
    } else if (e.next == 39 || e.next == 34) {
      if (!by(e, true)) {
        return false;
      }
    } else if (e.next == 93 || e.next == 125) {
      if (t[t.length - 1] != e.next - 2) {
        return false;
      }
      t.pop();
      e.advance();
      if (!t.length) {
        return true;
      }
    } else if (e.next < 0 || e.pos > n || cy(e.next)) {
      return false;
    } else {
      e.advance();
    }
  }
}
var Sy = `iiisiiissisfissssssssssssisssiiissssssssssssssssssssssssssfsfssissssssssssssssssssssssssssfif`;
function Cy(e) {
  if (e < 33) {
    return `u`;
  }
  if (e > 125) {
    return `s`;
  }
  return Sy[e - 33];
}
function wy(e, t) {
  let n = Cy(e);
  return n != `u` && !(t && n == `f`);
}
function Ty(e, t, n, r) {
  if (
    Cy(e.next) == `s` ||
    ((e.next == 63 || e.next == 58 || e.next == 45) && wy(e.peek(1), n))
  ) {
    e.advance();
  } else {
    return false;
  }
  let e_pos = e.pos;
  while (true) {
    let a = e.next;
    let o = 0;
    let s = r + 1;
    while (ly(a)) {
      if (cy(a)) {
        if (t) {
          return false;
        }
        s = 0;
      } else {
        s++;
      }
      a = e.peek(++o);
    }
    if (
      !(
        a >= 0 &&
        (a == 58
          ? wy(e.peek(o + 1), n)
          : a == 35
            ? e.peek(o - 1) != 32
            : wy(a, n))
      ) ||
      (!n && s <= r) ||
      (s == 0 && !n && (fy(e, 45, o) || fy(e, 46, o)))
    ) {
      break;
    }
    if (t && Cy(a) == `f`) {
      return false;
    }
    for (let t = o; t >= 0; t--) {
      e.advance();
    }
    if (t && e.pos > e_pos + 1024) {
      return false;
    }
  }
  return true;
}
const Ey = new pv((e, t) => {
  if (e.next == 33) {
    vy(e);
    e.acceptToken(Kv);
  } else if (e.next == 38 || e.next == 42) {
    let t = e.next == 38 ? Wv : Gv;
    yy(e);
    e.acceptToken(t);
  } else {
    if (e.next == 39 || e.next == 34) {
      by(e, false);
      e.acceptToken(Uv);
    } else if (Ty(e, false, t.context.type == ry, t.context.depth)) {
      e.acceptToken(Hv);
    }
  }
});
const Dy = new pv((e, t) => {
  let n = t.context.type == iy ? t.context.depth : -1;
  let e_pos = e.pos;
  scan: while (true) {
    let i = 0;
    let a = e.next;
    while (a == 32) {
      a = e.peek(++i);
    }
    if (
      (!i && (fy(e, 45, i) || fy(e, 46, i))) ||
      (!cy(a) && (n < 0 && (n = Math.max(t.context.depth + 1, i)), i < n))
    ) {
      break;
    }
    while (true) {
      if (e.next < 0) {
        break scan;
      }
      let t = cy(e.next);
      e.advance();
      if (t) {
        continue scan;
      }
      e_pos = e.pos;
    }
  }
  e.acceptTokenTo(qv, e_pos);
});
const Oy = Fl({
  DirectiveName: X.keyword,
  DirectiveContent: X.attributeValue,
  "DirectiveEnd DocEnd": X.meta,
  QuotedLiteral: X.string,
  BlockLiteralHeader: X.special(X.string),
  BlockLiteralContent: X.content,
  Literal: X.content,
  "Key/Literal Key/QuotedLiteral": X.definition(X.propertyName),
  "Anchor Alias": X.labelName,
  Tag: X.typeName,
  Comment: X.lineComment,
  ": , -": X.separator,
  "?": X.punctuation,
  "[ ]": X.squareBracket,
  "{ }": X.brace,
});
const ky = Dv.deserialize({
  version: 14,
  states:
    "5lQ!ZQgOOO#PQfO'#CpO#uQfO'#DOOOQR'#Dv'#DvO$qQgO'#DRO%gQdO'#DUO%nQgO'#DUO&ROaO'#D[OOQR'#Du'#DuO&{QgO'#D^O'rQgO'#D`OOQR'#Dt'#DtO(iOqO'#DbOOQP'#Dj'#DjO(zQaO'#CmO)YQgO'#CmOOQP'#Cm'#CmQ)jQaOOQ)uQgOOQ]QgOOO*PQdO'#CrO*nQdO'#CtOOQO'#Dw'#DwO+]Q`O'#CxO+hQdO'#CwO+rQ`O'#CwOOQO'#Cv'#CvO+wQdO'#CvOOQO'#Cq'#CqO,UQ`O,59[O,^QfO,59[OOQR,59[,59[OOQO'#Cx'#CxO,eQ`O'#DPO,pQdO'#DPOOQO'#Dx'#DxO,zQdO'#DxO-XQ`O,59jO-aQfO,59jOOQR,59j,59jOOQR'#DS'#DSO-hQcO,59mO-sQgO'#DVO.TQ`O'#DVO.YQcO,59pOOQR'#DX'#DXO#|QfO'#DWO.hQcO'#DWOOQR,59v,59vO.yOWO,59vO/OOaO,59vO/WOaO,59vO/cQgO'#D_OOQR,59x,59xO0VQgO'#DaOOQR,59z,59zOOQP,59|,59|O0yOaO,59|O1ROaO,59|O1aOqO,59|OOQP-E7h-E7hO1oQgO,59XOOQP,59X,59XO2PQaO'#DeO2_QgO'#DeO2oQgO'#DkOOQP'#Dk'#DkQ)jQaOOO3PQdO'#CsOOQO,59^,59^O3kQdO'#CuOOQO,59`,59`OOQO,59c,59cO4VQdO,59cO4aQdO'#CzO4kQ`O'#CzOOQO,59b,59bOOQU,5:Q,5:QOOQR1G.v1G.vO4pQ`O1G.vOOQU-E7d-E7dO4xQdO,59kOOQO,59k,59kO5SQdO'#DQO5^Q`O'#DQOOQO,5:d,5:dOOQU,5:R,5:ROOQR1G/U1G/UO5cQ`O1G/UOOQU-E7e-E7eO5kQgO'#DhO5xQcO1G/XOOQR1G/X1G/XOOQR,59q,59qO6TQgO,59qO6eQdO'#DiO6lQgO'#DiO7PQcO1G/[OOQR1G/[1G/[OOQR,59r,59rO#|QfO,59rOOQR1G/b1G/bO7_OWO1G/bO7dOaO1G/bOOQR,59y,59yOOQR,59{,59{OOQP1G/h1G/hO7lOaO1G/hO7tOaO1G/hO8POaO1G/hOOQP1G.s1G.sO8_QgO,5:POOQP,5:P,5:POOQP,5:V,5:VOOQP-E7i-E7iOOQO,59_,59_OOQO,59a,59aOOQO1G.}1G.}OOQO,59f,59fO8oQdO,59fOOQR7+$b7+$bP,XQ`O'#DfOOQO1G/V1G/VOOQO,59l,59lO8yQdO,59lOOQR7+$p7+$pP9TQ`O'#DgOOQR'#DT'#DTOOQR,5:S,5:SOOQR-E7f-E7fOOQR7+$s7+$sOOQR1G/]1G/]O9YQgO'#DYO9jQ`O'#DYOOQR,5:T,5:TO#|QfO'#DZO9oQcO'#DZOOQR-E7g-E7gOOQR7+$v7+$vOOQR1G/^1G/^OOQR7+$|7+$|O:QOWO7+$|OOQP7+%S7+%SO:VOaO7+%SO:_OaO7+%SOOQP1G/k1G/kOOQO1G/Q1G/QOOQO1G/W1G/WOOQR,59t,59tO:jQgO,59tOOQR,59u,59uO#|QfO,59uOOQR<<Hh<<HhOOQP<<Hn<<HnO:zOaO<<HnOOQR1G/`1G/`OOQR1G/a1G/aOOQPAN>YAN>Y",
  stateData:
    ";S~O!fOS!gOS^OS~OP_OQbORSOTUOWROXROYYOZZO[XOcPOqQO!PVO!V[O!cTO~O`cO~P]OVkOWROXROYeOZfO[dOcPOmhOqQO~OboO~P!bOVtOWROXROYeOZfO[dOcPOmrOqQO~OpwO~P#WORSOTUOWROXROYYOZZO[XOcPOqQO!PVO!cTO~OSvP!avP!bvP~P#|OWROXROYeOZfO[dOcPOqQO~OmzO~P%OOm!OOUzP!azP!bzP!dzP~P#|O^!SO!b!QO!f!TO!g!RO~ORSOTUOWROXROcPOqQO!PVO!cTO~OY!UOP!QXQ!QX!V!QX!`!QXS!QX!a!QX!b!QXU!QXm!QX!d!QX~P&aO[!WOP!SXQ!SX!V!SX!`!SXS!SX!a!SX!b!SXU!SXm!SX!d!SX~P&aO^!ZO!W![O!b!YO!f!]O!g!YO~OP!_O!V[OQaX!`aX~OPaXQaX!VaX!`aX~P#|OP!bOQ!cO!V[O~OP_O!V[O~P#|OWROXROY!fOcPOqQObfXmfXofXpfX~OWROXRO[!hOcPOqQObhXmhXohXphX~ObeXmlXoeX~ObkXokX~P%OOm!kO~Om!lObnPonP~P%OOb!pOo!oO~Ob!pO~P!bOm!sOosXpsX~OosXpsX~P%OOm!uOotPptP~P%OOo!xOp!yO~Op!yO~P#WOS!|O!a#OO!b#OO~OUyX!ayX!byX!dyX~P#|Om#QO~OU#SO!a#UO!b#UO!d#RO~Om#WOUzX!azX!bzX!dzX~O]#XO~O!b#XO!g#YO~O^#ZO!b#XO!g#YO~OP!RXQ!RX!V!RX!`!RXS!RX!a!RX!b!RXU!RXm!RX!d!RX~P&aOP!TXQ!TX!V!TX!`!TXS!TX!a!TX!b!TXU!TXm!TX!d!TX~P&aO!b#^O!g#^O~O^#_O!b#^O!f#`O!g#^O~O^#_O!W#aO!b#^O!g#^O~OPaaQaa!Vaa!`aa~P#|OP#cO!V[OQ!XX!`!XX~OP!XXQ!XX!V!XX!`!XX~P#|OP_O!V[OQ!_X!`!_X~P#|OWROXROcPOqQObgXmgXogXpgX~OWROXROcPOqQObiXmiXoiXpiX~Obkaoka~P%OObnXonX~P%OOm#kO~Ob#lOo!oO~Oosapsa~P%OOotXptX~P%OOm#pO~Oo!xOp#qO~OSwP!awP!bwP~P#|OS!|O!a#vO!b#vO~OUya!aya!bya!dya~P#|Om#xO~P%OOm#{OU}P!a}P!b}P!d}P~P#|OU#SO!a$OO!b$OO!d#RO~O]$QO~O!b$QO!g$RO~O!b$SO!g$SO~O^$TO!b$SO!g$SO~O^$TO!b$SO!f$UO!g$SO~OP!XaQ!Xa!V!Xa!`!Xa~P#|Obnaona~P%OOotapta~P%OOo!xO~OU|X!a|X!b|X!d|X~P#|Om$ZO~Om$]OU}X!a}X!b}X!d}X~O]$^O~O!b$_O!g$_O~O^$`O!b$_O!g$_O~OU|a!a|a!b|a!d|a~P#|O!b$cO!g$cO~O",
  goto: ",]!mPPPPPPPPPPPPPPPPP!nPP!v#v#|$`#|$c$f$j$nP%VPPP!v%Y%^%a%{&O%a&R&U&X&_&b%aP&e&{&e'O'RPP']'a'g'm's'y(XPPPPPPPP(_)e*X+c,VUaObcR#e!c!{ROPQSTUXY_bcdehknrtvz!O!U!W!_!b!c!f!h!k!l!s!u!|#Q#R#S#W#c#k#p#x#{$Z$]QmPR!qnqfPQThknrtv!k!l!s!u#R#k#pR!gdR!ieTlPnTjPnSiPnSqQvQ{TQ!mkQ!trQ!vtR#y#RR!nkTsQvR!wt!RWOSUXY_bcz!O!U!W!_!b!c!|#Q#S#W#c#x#{$Z$]RySR#t!|R|TR|UQ!PUR#|#SR#z#RR#z#SyZOSU_bcz!O!_!b!c!|#Q#S#W#c#x#{$Z$]R!VXR!XYa]O^abc!a!c!eT!da!eQnPR!rnQvQR!{vQ!}yR#u!}Q#T|R#}#TW^Obc!cS!^^!aT!aa!eQ!eaR#f!eW`Obc!cQxSS}U#SQ!`_Q#PzQ#V!OQ#b!_Q#d!bQ#s!|Q#w#QQ$P#WQ$V#cQ$Y#xQ$[#{Q$a$ZR$b$]xZOSU_bcz!O!_!b!c!|#Q#S#W#c#x#{$Z$]Q!VXQ!XYQ#[!UR#]!W!QWOSUXY_bcz!O!U!W!_!b!c!|#Q#S#W#c#x#{$Z$]pfPQThknrtv!k!l!s!u#R#k#pQ!gdQ!ieQ#g!fR#h!hSgPn^pQTkrtv#RQ!jhQ#i!kQ#j!lQ#n!sQ#o!uQ$W#kR$X#pQuQR!zv",
  nodeNames: `⚠ DirectiveEnd DocEnd - - ? ? ? Literal QuotedLiteral Anchor Alias Tag BlockLiteralContent Comment Stream BOM Document ] [ FlowSequence Item Tagged Anchored Anchored Tagged FlowMapping Pair Key : Pair , } { FlowMapping Pair Pair BlockSequence Item Item BlockMapping Pair Pair Key Pair Pair BlockLiteral BlockLiteralHeader Tagged Anchored Anchored Tagged Directive DirectiveName DirectiveContent Document`,
  maxTerm: 74,
  context,
  nodeProps: [
    [`isolate`, -3, 8, 9, 14, ``],
    [`openedBy`, 18, `[`, 32, `{`],
    [`closedBy`, 19, `]`, 33, `}`],
  ],
  propSources: [Oy],
  skippedNodes: [0],
  repeatNodeCount: 6,
  tokenData:
    "-Y~RnOX#PXY$QYZ$]Z]#P]^$]^p#Ppq$Qqs#Pst$btu#Puv$yv|#P|}&e}![#P![!]'O!]!`#P!`!a'i!a!}#P!}#O*g#O#P#P#P#Q+Q#Q#o#P#o#p+k#p#q'i#q#r,U#r;'S#P;'S;=`#z<%l?HT#P?HT?HU,o?HUO#PQ#UU!WQOY#PZp#Ppq#hq;'S#P;'S;=`#z<%lO#PQ#kTOY#PZs#Pt;'S#P;'S;=`#z<%lO#PQ#}P;=`<%l#P~$VQ!f~XY$Qpq$Q~$bO!g~~$gS^~OY$bZ;'S$b;'S;=`$s<%lO$b~$vP;=`<%l$bR%OX!WQOX%kXY#PZ]%k]^#P^p%kpq#hq;'S%k;'S;=`&_<%lO%kR%rX!WQ!VPOX%kXY#PZ]%k]^#P^p%kpq#hq;'S%k;'S;=`&_<%lO%kR&bP;=`<%l%kR&lUoP!WQOY#PZp#Ppq#hq;'S#P;'S;=`#z<%lO#PR'VUmP!WQOY#PZp#Ppq#hq;'S#P;'S;=`#z<%lO#PR'p[!PP!WQOY#PZp#Ppq#hq{#P{|(f|}#P}!O(f!O!R#P!R![)p![;'S#P;'S;=`#z<%lO#PR(mW!PP!WQOY#PZp#Ppq#hq!R#P!R![)V![;'S#P;'S;=`#z<%lO#PR)^U!PP!WQOY#PZp#Ppq#hq;'S#P;'S;=`#z<%lO#PR)wY!PP!WQOY#PZp#Ppq#hq{#P{|)V|}#P}!O)V!O;'S#P;'S;=`#z<%lO#PR*nUcP!WQOY#PZp#Ppq#hq;'S#P;'S;=`#z<%lO#PR+XUbP!WQOY#PZp#Ppq#hq;'S#P;'S;=`#z<%lO#PR+rUqP!WQOY#PZp#Ppq#hq;'S#P;'S;=`#z<%lO#PR,]UpP!WQOY#PZp#Ppq#hq;'S#P;'S;=`#z<%lO#PR,vU`P!WQOY#PZp#Ppq#hq;'S#P;'S;=`#z<%lO#P",
  tokenizers: [py, my, Ey, Dy, 0, 1],
  topRules: {
    Stream: [0, 15],
  },
  tokenPrec: 0,
});
const Ay = cu.define({
  name: `yaml`,
  parser: ky.configure({
    props: [
      Tu.add({
        Stream: (e) => {
          for (
            let t = e.node.resolve(e.pos, -1);
            t && t.to >= e.pos;
            t = t.parent
          ) {
            if (t.name == `BlockLiteralContent` && t.from < t.to) {
              return e.baseIndentFor(t);
            }
            if (t.name == `BlockLiteral`) {
              return e.baseIndentFor(t) + e.unit;
            }
            if (t.name == `BlockSequence` || t.name == `BlockMapping`) {
              return e.column(t.firstChild.from, 1);
            }
            if (t.name == `QuotedLiteral`) {
              return null;
            }
            if (t.name == `Literal`) {
              let n = e.column(t.from, 1);
              if (n == e.lineIndent(t.from, 1)) {
                return n;
              }
              if (t.to > e.pos) {
                return null;
              }
            }
          }
          return null;
        },
        FlowMapping: Pu({
          closing: `}`,
        }),
        FlowSequence: Pu({
          closing: `]`,
        }),
      }),
      zu.add({
        "FlowMapping FlowSequence": Bu,
        "Item Pair BlockLiteral": (e, t) => ({
          from: t.doc.lineAt(e.from).to,
          to: e.to,
        }),
      }),
    ],
  }),
  languageData: {
    commentTokens: {
      line: `#`,
    },
    indentOnInput: /^\s*[\]\}]$/,
  },
});
function jy() {
  return new vu(Ay);
}
X.meta;
const theme = G.theme(
  {
    "&": {
      backgroundColor: `transparent`,
      color: `#E8ECF6`,
      fontSize: `13px`,
      height: `100%`,
    },
    ".cm-scroller": {
      fontFamily: `var(--font-mono)`,
      lineHeight: `1.6`,
    },
    ".cm-content": {
      caretColor: `#FFC44D`,
      padding: `12px 0`,
    },
    ".cm-line": {
      padding: `0 14px 0 8px`,
    },
    ".cm-gutters": {
      backgroundColor: `transparent`,
      color: `#5B6784`,
      border: `none`,
      borderRight: `1px solid #22304D`,
    },
    ".cm-lineNumbers .cm-gutterElement": {
      padding: `0 10px 0 14px`,
    },
    ".cm-activeLine": {
      backgroundColor: `rgb(255 196 77 / 0.05)`,
    },
    ".cm-activeLineGutter": {
      backgroundColor: `transparent`,
      color: `#FFC44D`,
    },
    ".cm-cursor, .cm-dropCursor": {
      borderLeftColor: `#FFC44D`,
      borderLeftWidth: `2px`,
    },
    "&.cm-focused": {
      outline: `none`,
    },
    "&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection":
      {
        backgroundColor: `rgb(76 141 255 / 0.3)`,
      },
    ".cm-selectionMatch": {
      backgroundColor: `rgb(255 196 77 / 0.14)`,
    },
    ".cm-matchingBracket, .cm-nonmatchingBracket": {
      backgroundColor: `rgb(255 196 77 / 0.18)`,
      outline: `none`,
    },
    ".cm-searchMatch": {
      backgroundColor: `rgb(255 196 77 / 0.22)`,
      outline: `1px solid rgb(255 196 77 / 0.5)`,
    },
    ".cm-searchMatch.cm-searchMatch-selected": {
      backgroundColor: `rgb(255 196 77 / 0.4)`,
    },
    ".cm-foldPlaceholder": {
      backgroundColor: `#18223B`,
      border: `1px solid #2E3F63`,
      color: `#8C97B2`,
      padding: `0 6px`,
      borderRadius: `6px`,
    },
    ".cm-foldGutter .cm-gutterElement": {
      color: `#5B6784`,
    },
    ".cm-tooltip": {
      backgroundColor: `#18223B`,
      border: `1px solid #2E3F63`,
      color: `#E8ECF6`,
      borderRadius: `8px`,
    },
    ".cm-tooltip-autocomplete > ul > li[aria-selected]": {
      backgroundColor: `#22304D`,
      color: `#E8ECF6`,
    },
    ".cm-panels": {
      backgroundColor: `#121A2E`,
      color: `#E8ECF6`,
      borderColor: `#22304D`,
    },
    ".cm-panels input, .cm-panels button": {
      fontFamily: `var(--font-sans)`,
    },
    ".cm-textfield": {
      backgroundColor: `#0B1020`,
      border: `1px solid #2E3F63`,
      borderRadius: `6px`,
      color: `#E8ECF6`,
    },
    ".cm-button": {
      backgroundImage: `none`,
      backgroundColor: `#18223B`,
      border: `1px solid #2E3F63`,
      borderRadius: `6px`,
      color: `#E8ECF6`,
    },
  },
  {
    dark: true,
  },
);
const Ny = pd.define([
  {
    tag: [X.definition(X.propertyName), X.propertyName],
    color: `#FFC44D`,
    fontWeight: `600`,
  },
  {
    tag: X.content,
    color: `#E8ECF6`,
  },
  {
    tag: X.string,
    color: `#9FE7C4`,
  },
  {
    tag: X.special(X.string),
    color: `#FF8A8E`,
  },
  {
    tag: [X.lineComment, X.comment],
    color: `#6B7896`,
    fontStyle: `italic`,
  },
  {
    tag: [X.separator, X.punctuation, X.squareBracket, X.brace],
    color: `#8C97B2`,
  },
  {
    tag: [X.labelName, X.typeName],
    color: `#D7A6FF`,
  },
  {
    tag: [X.keyword, X.meta, X.attributeValue],
    color: `#7FB0FF`,
  },
]);
function PyComponent({
  value,
  onChange,
  readOnly,
  height = `480px`,
  className,
  placeholder,
  onSave,
}) {
  let cRef = r.useRef(onSave);
  cRef.current = onSave;
  let l = r.useMemo(
    () => [
      jy(),
      _d(Ny),
      G.lineWrapping,
      G.domEventHandlers({
        keydown: (e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === `s` && cRef.current) {
            return (e.preventDefault(), cRef.current(), true);
          }
          return false;
        },
      }),
    ],
    [],
  );
  return (
    <Nv1
      value={value}
      onChange={onChange}
      readOnly={readOnly}
      editable={!readOnly}
      height={height}
      theme={theme}
      extensions={l}
      placeholder={placeholder}
      className={className}
      basicSetup={{
        foldGutter: true,
        highlightActiveLine: !readOnly,
        highlightActiveLineGutter: !readOnly,
        autocompletion: false,
      }}
    />
  );
}
export { PyComponent as default };
