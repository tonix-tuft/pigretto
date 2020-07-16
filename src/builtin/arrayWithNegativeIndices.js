/*
 * Copyright (c) 2020 Anton Bagdatyev (Tonix)
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */

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
