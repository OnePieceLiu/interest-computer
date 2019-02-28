function nFormatter(value, options = {}) {
  var _value = Number(value);
  if (isNaN(_value)) return '';

  // 数值为负，一定加上“-”号， 数值为正，withSign===true 再加上“+”号
  const withSign = options.withSign || false;
  const accu = options.accu || 2
  const sign = 1 / (_value / Infinity) > 0 ? '+' : '-';

  const __value = Math.abs(_value)

  const [zs, xs] = __value.toFixed(accu).split(".")
  let str = zs.replace(/(?=(\B)(\d{3})+$)/g, ',');
  xs && (str = str + '.' + xs)

  if (sign === '-') str = sign + str;
  if (sign === '+' && withSign) str = sign + str;

  return str;
}

module.exports = {
  nFormatter
}