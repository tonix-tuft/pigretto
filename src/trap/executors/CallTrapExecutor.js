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
import { withFunctionTrapExecutor } from "./behaviours/withFunctionTrapExecutor";
import { isEmpty, shallowExtend } from "js-utl";

export default withFunctionTrapExecutor(
  class CallTrapExecutor extends TrapExecutor {
    getTrapArgsArgumentsListIndex() {
      return 4;
    }

    execute(
      [target, property, receiver, propertyValue],
      before,
      around,
      after
    ) {
      if (
        typeof propertyValue === "function" &&
        [before, around, after].some(advices => !isEmpty(advices))
      ) {
        const superExecute = trapArgs => {
          return super.execute(trapArgs, before, around, after);
        };
        const wrapperFn = function (...args) {
          let boundThis;
          if (this !== receiver) {
            boundThis = this;
          } else {
            boundThis = target;
          }
          const originalFn = propertyValue.bind(boundThis);
          const trapArgs = [target, property, receiver, originalFn, args];
          const returnValue = superExecute(trapArgs);
          return returnValue;
        };
        return wrapperFn;
      }
      return propertyValue;
    }

    executeBeforeAdvice(
      [target, property, receiver, , argumentsList],
      advice,
      rule
    ) {
      const context = {
        target,
        property,
        receiver,
        rule,
      };
      this.notWithinExecContext(() => {
        advice.fn.apply(context, argumentsList);
      });
    }

    executeAroundAdvice(
      [target, property, receiver, , argumentsList],
      advice,
      rule,
      proceed,
      context
    ) {
      shallowExtend(context, {
        target,
        property,
        receiver,
        rule,
        flat: advice.flat,
      });
      const returnValue = this.notWithinExecContext(() => {
        const returnValue = advice.fn
          .call(context, proceed)
          .apply(context, argumentsList);
        return returnValue;
      });
      return returnValue;
    }

    executeAfterAdvice(
      [target, property, receiver, , argumentsList],
      advice,
      rule,
      returnValue
    ) {
      const context = {
        target,
        property,
        receiver,
        rule,
        effectiveArgumentsList: TrapExecutor.getTransversalExecContextStackData(
          "finalParams",
          argumentsList
        ),
        hasPerformedUnderlyingOperation: this.execContextStack[
          this.execContextID
        ].hasPerformedUnderlyingOperation,
        hasEffectivelyPerformedUnderlyingOperation: TrapExecutor.getTransversalExecContextStackData(
          "hasEffectivelyPerformedUnderlyingOperation"
        ),
      };
      this.notWithinExecContext(() => {
        advice.fn.call(context, ...argumentsList).apply(context, [returnValue]);
      });
    }

    performUnderlyingOperation([target, , , originalFn, argumentsList]) {
      const returnValue = this.notWithinExecContext(
        () => {
          const returnValue = originalFn(...argumentsList);
          return returnValue;
        },
        target,
        true
      );
      return returnValue;
    }

    executeProceedCallback(
      [target, property, receiver, , argumentsList],
      rule,
      returnValue,
      callback
    ) {
      const context = {
        target,
        property,
        receiver,
        rule,
        argumentsList,
        effectiveArgumentsList: TrapExecutor.getTransversalExecContextStackData(
          "finalParams",
          argumentsList
        ),
        hasPerformedUnderlyingOperation: this.execContextStack[
          this.execContextID
        ].hasPerformedUnderlyingOperation,
        hasEffectivelyPerformedUnderlyingOperation: TrapExecutor.getTransversalExecContextStackData(
          "hasEffectivelyPerformedUnderlyingOperation"
        ),
      };
      return this.notWithinExecContext(() => {
        return callback.apply(context, [returnValue]);
      });
    }
  }
);
