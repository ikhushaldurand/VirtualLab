const SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹";

function toSuperscript(exp) {
  const s = String(Math.abs(Math.round(exp)));
  let out = "";
  for (const ch of s) {
    const d = ch.charCodeAt(0) - 48;
    if (d >= 0 && d <= 9) out += SUP[d] ?? ch;
    else out += ch;
  }
  return exp < 0 ? "⁻" + out : out;
}

/**
 * @param {number} value
 * @returns {string} e.g. "4.32 × 10³"
 */
export function formatScientific(value) {
  if (!Number.isFinite(value)) return "—";
  if (value === 0) return "0";
  const sign = value < 0 ? -1 : 1;
  const a = Math.abs(value);
  let exp = Math.floor(Math.log10(a));
  let mant = sign * (a / 10 ** exp);
  if (Math.abs(mant) >= 10) {
    mant /= 10;
    exp += 1;
  }
  if (Math.abs(mant) < 1 && mant !== 0) {
    mant *= 10;
    exp -= 1;
  }
  return `${mant.toFixed(2)} × 10${toSuperscript(exp)}`;
}
