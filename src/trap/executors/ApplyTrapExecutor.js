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

import TrapExecutor from "./TrapExecutor";
import reflectApply from "../reflect/reflectApply";
import { withFunctionTrapExecutor } from "./behaviours/withFunctionTrapExecutor";

export default withFunctionTrapExecutor(
  class ApplyTrapExecutor extends TrapExecutor {
    getTrapArgsArgumentsListIndex() {
      return 2;
    }

    executeBeforeAdvice([target, thisArg, argumentsList], advice, rule) {
      const context = {
        target,
        thisArg,
        rule,
      };
      advice.fn.apply(context, argumentsList);
    }

    executeAroundAdvice(
      [target, thisArg, argumentsList],
      advice,
      rule,
      proceed
    ) {
      const context = {
        target,
        thisArg,
        rule,
      };
      return advice.fn.call(context, proceed).apply(context, argumentsList);
    }

    executeAfterAdvice(
      [target, thisArg, argumentsList],
      advice,
      rule,
      returnValue
    ) {
      const context = {
        target,
        thisArg,
        rule,
      };
      advice.fn.call(context, ...argumentsList).apply(context, [returnValue]);
    }

    performUnderlyingOperation([target, thisArg, argumentsList]) {
      const returnValue = reflectApply(target, thisArg, argumentsList);
      return returnValue;
    }

    executeProceedCallback(
      [target, thisArg, argumentsList],
      rule,
      returnValue,
      callback
    ) {
      const context = {
        target,
        thisArg,
        rule,
        argumentsList,
      };
      return callback.apply(context, [returnValue]);
    }
  }
);
