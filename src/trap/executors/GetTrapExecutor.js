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
import reflectGet from "../reflect/reflectGet";
import { shallowExtend } from "js-utl";
import { PIGRETTO_EFFECTIVE_TARGET_PROP } from "../../constants";

export default class GetTrapExecutor extends TrapExecutor {
  executeBeforeAdvice([target, property, receiver], advice, rule) {
    const context = {
      target,
      effectiveTarget: receiver[PIGRETTO_EFFECTIVE_TARGET_PROP],
      property,
      receiver,
      rule,
    };
    this.notWithinExecContext(() => {
      advice.fn.apply(context);
    });
  }

  executeAroundAdvice(
    [target, property, receiver],
    advice,
    rule,
    proceed,
    context
  ) {
    shallowExtend(context, {
      target,
      effectiveTarget: receiver[PIGRETTO_EFFECTIVE_TARGET_PROP],
      property,
      receiver,
      rule,
      flat: advice.flat,
    });
    const returnValue = this.notWithinExecContext(() => {
      const returnValue = advice.fn.apply(context, [proceed]);
      return returnValue;
    });
    return returnValue;
  }

  executeAfterAdvice(
    [target, property, receiver],
    advice,
    rule,
    propertyValue
  ) {
    const context = {
      target,
      effectiveTarget: receiver[PIGRETTO_EFFECTIVE_TARGET_PROP],
      property,
      receiver,
      rule,
      hasPerformedUnderlyingOperation: this.execContextStack[this.execContextID]
        .hasPerformedUnderlyingOperation,
      hasEffectivelyPerformedUnderlyingOperation: TrapExecutor.getTransversalExecContextStackData(
        "hasEffectivelyPerformedUnderlyingOperation"
      ),
    };
    this.notWithinExecContext(() => {
      advice.fn.apply(context, [propertyValue]);
    });
  }

  performUnderlyingOperation([target, property, receiver]) {
    const propertyValue = this.notWithinExecContext(
      () => {
        const propertyValue = reflectGet(target, property, receiver);
        return propertyValue;
      },
      target,
      true
    );
    return propertyValue;
  }

  executeProceedCallback(
    [target, property, receiver],
    rule,
    propertyValue,
    callback
  ) {
    const context = {
      target,
      effectiveTarget: receiver[PIGRETTO_EFFECTIVE_TARGET_PROP],
      property,
      receiver,
      rule,
      hasPerformedUnderlyingOperation: this.execContextStack[this.execContextID]
        .hasPerformedUnderlyingOperation,
      hasEffectivelyPerformedUnderlyingOperation: TrapExecutor.getTransversalExecContextStackData(
        "hasEffectivelyPerformedUnderlyingOperation"
      ),
    };
    return this.notWithinExecContext(() => {
      return callback.apply(context, [propertyValue]);
    });
  }
}
