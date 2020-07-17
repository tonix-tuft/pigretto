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
import reflectConstruct from "../reflect/reflectConstruct";
import { withFunctionTrapExecutor } from "./behaviours/withFunctionTrapExecutor";

export default withFunctionTrapExecutor(
  class ConstructTrapExecutor extends TrapExecutor {
    getTrapArgsArgumentsListIndex() {
      return 1;
    }

    executeBeforeAdvice([target, argumentsList, newTarget], advice, rule) {
      const context = {
        target,
        newTarget,
        rule,
      };
      advice.fn.apply(context, argumentsList);
    }

    executeAroundAdvice(
      [target, argumentsList, newTarget],
      advice,
      rule,
      proceed
    ) {
      const context = {
        target,
        newTarget,
        rule,
      };
      return advice.fn.call(context, proceed).apply(context, argumentsList);
    }

    executeAfterAdvice(
      [target, argumentsList, newTarget],
      advice,
      rule,
      instance
    ) {
      const context = {
        target,
        newTarget,
        rule,
      };
      advice.fn.call(context, ...argumentsList).apply(context, [instance]);
    }

    performUnderlyingOperation([target, argumentsList, newTarget]) {
      const instance = reflectConstruct(target, argumentsList, newTarget);
      return instance;
    }

    executeProceedCallback(
      [target, argumentsList, newTarget],
      rule,
      instance,
      callback
    ) {
      const context = {
        target,
        newTarget,
        rule,
        argumentsList,
      };
      return callback.apply(context, [instance]);
    }
  }
);
