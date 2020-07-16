/**
 * Builtin function using pigretto's API to create an array which allows the usage of negative indices
 * to retrieve its data, where -1 indicates the last element of the array (same as `array.length - 1`).
 *
 * @param {Array} array An array to use as the target object for this builtin.
 * @param {Object} options Options.
 * @param {boolean} [options.wrap] Whether or not to wrap if the negative index is greater than the length of the array.
 *                                 Defaults to true, in which case an array like `arrayWithNegativeIndices(['a', 'b', 'c'])[-5]`
 *                                 will wrap and return 'b', even though `Math.abs(-5) > ['a', 'b', 'c'].length`.
 *                                 If this option were set to false, then undefined would be returned for `arrayWithNegativeIndices(['a', 'b', 'c'])[-5]`.
 * @return {Proxy} The proxy object for the given array.
 */
export default function arrayWithNegativeIndices(array, { wrap = true } = {}) {
  return new Proxy(array, {
    get: function (target, propKey) {
      let numberPropKey = Number(propKey);
      if (
        !Number.isNaN(numberPropKey) &&
        Number.isInteger(numberPropKey) &&
        numberPropKey < 0
      ) {
        const absNumberPropKey = Math.abs(numberPropKey);
        if (wrap || absNumberPropKey <= target.length) {
          numberPropKey = target.length - (absNumberPropKey % target.length);
          propKey = String(numberPropKey === target.length ? 0 : numberPropKey);
        }
      }
      return target[propKey];
    },
  });
}
