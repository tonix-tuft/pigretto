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

import pigretto from "./pigretto";
import applyRule from "./rules/applyRule";
import constructRule from "./rules/constructRule";
import call from "./pointcuts/shorthands/call";
import get from "./pointcuts/shorthands/get";
import set from "./pointcuts/shorthands/set";
import apply from "./pointcuts/shorthands/apply";
import construct from "./pointcuts/shorthands/construct";
import lazyObject from "./builtin/lazyObject";
import throwErrorForUnknownProperty from "./builtin/throwErrorForUnknownProperty";
import POJOPromiser from "./builtin/POJOPromiser";
import arrayWithNegativeIndices from "./builtin/arrayWithNegativeIndices";

/*
 * Mapping the API properties to the pigretto function.
 */
pigretto.pointcuts = {};
[
  ["call", call],
  ["get", get],
  ["set", set],
  ["applyRule", applyRule],
  ["apply", apply],
  ["constructRule", constructRule],
  ["construct", construct],
].map(([prop, val]) => (pigretto.pointcuts[prop] = val));

pigretto.builtin = {};
[
  ["lazyObject", lazyObject],
  ["throwErrorForUnknownProperty", throwErrorForUnknownProperty],
  ["POJOPromiser", POJOPromiser],
  ["arrayWithNegativeIndices", arrayWithNegativeIndices],
].map(([prop, val]) => (pigretto.builtin[prop] = val));

export default pigretto;
export { call, get, set, applyRule, apply, constructRule, construct };
export {
  lazyObject,
  throwErrorForUnknownProperty,
  POJOPromiser,
  arrayWithNegativeIndices,
};
