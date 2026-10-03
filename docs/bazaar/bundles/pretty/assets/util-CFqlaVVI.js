function e(t) {
  if (t === undefined) {
    return `null`;
  }
  if (typeof t != `object` || !t) {
    return JSON.stringify(t);
  }
  if (Array.isArray(t)) {
    return `[${t.map(e).join(`,`)}]`;
  }
  let n = t;
  return `{${Object.keys(n)
    .filter((e) => n[e] !== undefined)
    .sort()
    .map((t) => `${JSON.stringify(t)}:${e(n[t])}`)
    .join(`,`)}}`;
}
const t = (t, n) => e(t) === e(n);
const n = (e) => {
  if (typeof structuredClone == `function`) {
    return structuredClone(e);
  }
  return JSON.parse(JSON.stringify(e));
};
function r(e, t) {
  let n = e.replace(/\n$/, ``).split(`
`);
  let r = t.replace(/\n$/, ``).split(`
`);
  let n_length = n.length;
  let r_length = r.length;
  let o = Array.from(
    {
      length: n_length + 1,
    },
    () => new Uint16Array(r_length + 1),
  );
  for (let e = n_length - 1; e >= 0; e--) {
    for (let t = r_length - 1; t >= 0; t--) {
      o[e][t] =
        n[e] === r[t]
          ? o[e + 1][t + 1] + 1
          : Math.max(o[e + 1][t], o[e][t + 1]);
    }
  }
  let s = [];
  let c = 0;
  let l = 0;
  while (c < n_length && l < r_length) {
    if (n[c] === r[l]) {
      s.push({
        kind: `same`,
        text: n[c],
        a: c + 1,
        b: l + 1,
      });
      c++;
      l++;
    } else if (o[c + 1][l] >= o[c][l + 1]) {
      s.push({
        kind: `del`,
        text: n[c],
        a: c + 1,
      });
      c++;
    } else {
      s.push({
        kind: `add`,
        text: r[l],
        b: l + 1,
      });
      l++;
    }
  }
  while (c < n_length) {
    s.push({
      kind: `del`,
      text: n[c],
      a: ++c,
    });
  }
  while (l < r_length) {
    s.push({
      kind: `add`,
      text: r[l],
      b: ++l,
    });
  }
  return s;
}
function i(e, t = 3) {
  let n = Array(e.length).fill(false);
  e.forEach((r, i) => {
    if (r.kind !== `same`) {
      for (
        let r = Math.max(0, i - t);
        r <= Math.min(e.length - 1, i + t);
        r++
      ) {
        n[r] = true;
      }
    }
  });
  let r = [];
  let i = [];
  let a = [];
  e.forEach((e, t) => {
    if (n[t]) {
      if (a.length) {
        r.push({
          kind: `gap`,
          count: a.length,
          lines: a,
        });
      }
      a = [];
      i.push(e);
    } else {
      if (i.length) {
        r.push({
          kind: `lines`,
          lines: i,
        });
      }
      i = [];
      a.push(e);
    }
  });
  if (i.length) {
    r.push({
      kind: `lines`,
      lines: i,
    });
  }
  if (a.length) {
    r.push({
      kind: `gap`,
      count: a.length,
      lines: a,
    });
  }
  return r;
}
const a = /^(true|false|yes|no|on|off|null|~|y|n)$/i;
const o = /^[A-Za-z_][A-Za-z0-9_\-./ ]*$/;
function s(e) {
  if (e == null) {
    return `null`;
  }
  if (typeof e == `boolean`) {
    if (e) {
      return `true`;
    }
    return `false`;
  }
  if (typeof e == `number`) {
    if (Number.isFinite(e)) {
      return String(e);
    }
    return `null`;
  }
  let t = String(e);
  if (
    t &&
    o.test(t) &&
    !a.test(t) &&
    !/\s$/.test(t) &&
    !t.includes(`: `) &&
    !t.includes(` #`)
  ) {
    return t;
  }
  return JSON.stringify(t);
}
const c = (e) => {
  if (o.test(e) && !a.test(e) && !e.includes(` `)) {
    return e;
  }
  return JSON.stringify(e);
};
const l = (e) => typeof e != `object` || !e;
function u(e, t) {
  let n = ` `.repeat(t);
  if (Array.isArray(e)) {
    if (!e.length) {
      return [`${n}[]`];
    }
    if (e.every(l) && e.map(s).join(`, `).length < 70) {
      return [`${n}[${e.map(s).join(`, `)}]`];
    }
    let r = [];
    for (let i of e) {
      if (l(i)) {
        r.push(`${n}- ${s(i)}`);
      } else {
        let e = u(i, t + 2);
        r.push(`${n}- ${e[0].slice(t + 2)}`, ...e.slice(1));
      }
    }
    return r;
  }
  if (e && typeof e == `object`) {
    let r = Object.entries(e).filter(([, e]) => e !== undefined);
    if (!r.length) {
      return [`${n}{}`];
    }
    let i = [];
    for (let [e, a] of r) {
      if (l(a)) {
        i.push(`${n}${c(e)}: ${s(a)}`);
      } else if (
        Array.isArray(a) &&
        (!a.length || (a.every(l) && a.map(s).join(`, `).length < 70))
      ) {
        i.push(`${n}${c(e)}: ${u(a, 0)[0]}`);
      } else if (!Array.isArray(a) && !Object.keys(a).length) {
        i.push(`${n}${c(e)}: {}`);
      } else {
        i.push(`${n}${c(e)}:`, ...u(a, t + 2));
      }
    }
    return i;
  }
  return [`${n}${s(e)}`];
}
function d(e) {
  return (
    u(e, 0).join(`
`) +
    `
`
  );
}
function f(e) {
  if (!e) {
    return null;
  }
  let t = /^\+(\d+(?:\.\d+)?)([hm])$/.exec(e.trim());
  if (t) {
    if (t[2] === `h`) {
      return Number(t[1]);
    }
    return Number(t[1]) / 60;
  }
  return null;
}
function p(e) {
  return (
    !e || !e.trim() || f(e) !== null || !Number.isNaN(Date.parse(e.trim()))
  );
}
function m(e, t, n) {
  if (!e && !t) {
    return {
      state: `always`,
    };
  }
  if (n == null) {
    return {
      state: `unknown`,
    };
  }
  let r = f(e);
  let i = f(t);
  if ((e && r === null) || (t && i === null)) {
    return {
      state: `unknown`,
    };
  }
  if (r !== null && n < r) {
    return {
      state: `upcoming`,
      hoursUntil: r - n,
    };
  }
  if (i !== null && n >= i) {
    return {
      state: `over`,
    };
  }
  return {
    state: `active`,
    hoursUntil: i === null ? undefined : i - n,
  };
}
const h = {
  patience: [
    `You get impatient quickly.`,
    `You have average patience.`,
    `You are very patient and never rush anyone.`,
  ],
  generosity: [
    `You are tight with money.`,
    `You are fair with money.`,
    `You are generous and like to help people start.`,
  ],
  shrewdness: [
    `You are trusting and a little naive about prices.`,
    `You know roughly what things are worth.`,
    `You know exactly what everything is worth and cannot be fooled.`,
  ],
  memory: [
    `You forget grudges immediately.`,
    `You remember how people treated you for a while.`,
    `You never forget how someone treated you.`,
  ],
  strictness: [
    `You forgive rudeness and tricks.`,
    `You warn people who misbehave.`,
    `You stop dealing with anyone who tries to trick you.`,
  ],
  chattiness: [
    `You speak in very few words.`,
    `You chat a little.`,
    `You love to chat and tell little stories.`,
  ],
};
function g(e, t) {
  let n = h[e];
  if (n) {
    if (t < 0.34) {
      return n[0];
    }
    if (t < 0.67) {
      return n[1];
    }
    return n[2];
  }
  return ``;
}
const _ = (e) => {
  if (e < 0.34) {
    return 0;
  }
  if (e < 0.67) {
    return 1;
  }
  return 2;
};
const v = (e) => Math.floor(18 + 42 * e);
function y(e, t, n, r, i) {
  let a =
    Math.min(1, Math.max(0, n) / Math.max(1, r)) ** (1 / Math.max(0.05, i));
  return e + (t - e) * a;
}
const b = (e) =>
  e
    .toLowerCase()
    .normalize(`NFD`)
    .replace(/[̀-ͯ]/g, ``)
    .replace(/[^a-z0-9]+/g, `_`)
    .replace(/^_+|_+$/g, ``)
    .slice(0, 30);
const x = /^[a-z][a-z0-9_]{1,30}$/;
function S(e, t) {
  if (!t.includes(e)) {
    return e;
  }
  for (let n = 2; ; n++) {
    if (!t.includes(`${e}-${n}`)) {
      return `${e}-${n}`;
    }
  }
}
function C(e, t) {
  if (!t) {
    return `${e} ticks`;
  }
  let n = Math.round(e * t);
  let r = Math.floor(n / 3600);
  let i = Math.floor((n % 3600) / 60);
  if (r) {
    return `${r}h ${String(i).padStart(2, `0`)}m`;
  }
  if (i) {
    return `${i}m ${String(n % 60).padStart(2, `0`)}s`;
  }
  return `${n}s`;
}
function w(e, t, n) {
  if (t == null) {
    return `T${e}`;
  }
  let r = t - e;
  if (r <= 0) {
    return `now`;
  }
  return `${C(r, n)} ago`;
}
export {
  m as _,
  r as a,
  f as c,
  w as d,
  C as f,
  p as g,
  g as h,
  y as i,
  t as l,
  _ as m,
  i as n,
  S as o,
  d as p,
  n as r,
  v as s,
  x as t,
  b as u,
};
