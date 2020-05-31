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

import pigretto from "../pigretto";
import get from "../pointcuts/shorthands/get";
import set from "../pointcuts/shorthands/set";
import { prototypeChainProperties, typeToStr } from "js-utl";

/**
 * Builtin function using pigretto's API to throw an error when an unknown property is accessed on the given target
 * (both for read and write operations).
 *
 * @param {Object} target The target object.
 * @param {Object} options Options.
 * @param {boolean} [options.dynamic] Whether or not to check against the current properties of the target on each property access (dynamic, default).
 *                                    If set to false, then only the properties of the target object at the time this builtin function is called will be
 *                                    treated as known and used for the check when determining if a property is unknown.
 * @param {?Error} [options.errorToThrow] The error to throw or null (default). If null, a default error will be thrown
 *                                        when trying to access an unknown property.
 * @param {Object} [options.prototypeChainPropertiesOptions] Further options passed to the "prototypeChainProperties" function of js-utl (used internally).
 *                                                           See the "prototypeChainProperties" function of the js-utl package (https://github.com/tonix-tuft/js-utl)
 *                                                           for the available options.
 */
export default function throwErrorForUnknownProperty(
  target,
  {
    dynamic = true,
    errorToThrow = null,
    ...prototypeChainPropertiesOptions
  } = {}
) {
  const regex = /.?/;
  let map = {};
  const mapProperties = () => {
    const props = prototypeChainProperties(
      target,
      prototypeChainPropertiesOptions
    );
    map = props.reduce((acc, prop) => !(acc[prop] = true) || acc, {});
  };
  !dynamic && mapProperties();
  const assertFn = function () {
    const propertyName = this.property;
    dynamic && mapProperties();
    if (!map[propertyName]) {
      errorToThrow =
        errorToThrow ||
        new Error(
          `Accessing unknown property "${propertyName}" of object ${typeToStr(
            target
          )}.`
        );
      throw errorToThrow;
    }
  };
  const pigrettarget = pigretto(target, [
    [regex, get().before(assertFn)],
    [regex, set().before(assertFn)],
  ]);
  return pigrettarget;
}
