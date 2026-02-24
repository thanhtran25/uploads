const a = '6cGumjnLCNktoqWukv9IrEOJMHa9nBYj',
    o = 'NYvVtsCUUk',
    r = 'https://trading.kisvn.vn',
    t = 'ben10/v1/napa',
    kisGateway = 'kgw',
    e = 'GET';

var s8 = { exports: {} };
var Zdt = s8.exports,
  xye;
function Jdt() {
  return (
    xye ||
      ((xye = 1),
      (function (r, t) {
        (function (e, o, a) {
          r.exports = o(
            xa(),
            lP(),
            Kct(),
            Xct(),
            mE(),
            edt(),
            gE(),
            c7e(),
            OQ(),
            odt(),
            d7e(),
            ldt(),
            cdt(),
            hdt(),
            DQ(),
            vdt(),
            jS(),
            pd(),
            Cdt(),
            Edt(),
            Tdt(),
            xdt(),
            Adt(),
            Odt(),
            Idt(),
            Ndt(),
            Ldt(),
            Fdt(),
            Hdt(),
            Udt(),
            Vdt(),
            zdt(),
            qdt(),
            Kdt(),
            Xdt(),
          );
        })(Zdt, function (e) {
          return e;
        });
      })(s8)),
    s8.exports
  );
};

var eht = Jdt();
const PT = $d(eht);
function $d(r) {
  return r && r.__esModule && Object.prototype.hasOwnProperty.call(r, 'default')
    ? r.default
    : r;
}
function uht(r, t) {
  return PT.HmacSHA256(r, t).toString(PT.enc.Base64);
}
function cht(r, t, e, o, a) {
  const s = new Date().toUTCString(),
    l =
      'x-date: ' +
      s +
      `
host: ` +
      r +
      `
` +
      e.toUpperCase() +
      ' ' +
      t +
      ' HTTP/1.1',
    u = uht(l, a);
  return {
    authorization: `hmac username="${o}", algorithm="hmac-sha256", headers="x-date host request-line", signature="${u}"`,
    date: s,
  };
};

const xx = cht(r,t,e,o,a);

console.log(xx);




