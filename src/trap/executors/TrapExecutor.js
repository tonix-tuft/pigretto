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

import { isArray, chain } from "js-utl";
import declarativeFactory from "declarative-factory";
import { isPigrettoProxy } from "../../props";
import {
  flatProceedAPIAroundAdviceFactory,
  proceedAPIAroundAdviceFactory,
} from "./factory/aroundAdviceFactory";

export default class TrapExecutor {
  static isWithinExecContext = false;
  static transversalExecContextStack = [];
  static transversalExecContextID = -1;
  static newTransversalExecContextMap = {};

  execContextStack = [];
  execContextID = -1;

  /**
   * @static
   * @private
   */
  static newTransversalExecutionContext() {
    const context = {
      finalParams: void 0,
      hasEffectivelyPerformedUnderlyingOperation: false,
    };
    TrapExecutor.transversalExecContextStack.push(context);
    TrapExecutor.transversalExecContextID++;
    TrapExecutor.newTransversalExecContextMap[
      TrapExecutor.transversalExecContextID
    ] = true;
  }

  /**
   * @static
   * @private
   */
  static cleanUpTransversalExecutionContext() {
    TrapExecutor.transversalExecContextStack.pop();
    const currentTransversalExecContextID =
      TrapExecutor.transversalExecContextID;
    TrapExecutor.transversalExecContextID--;
    if (
      TrapExecutor.newTransversalExecContextMap[currentTransversalExecContextID]
    ) {
      delete TrapExecutor.newTransversalExecContextMap[
        currentTransversalExecContextID
      ];
      TrapExecutor.isWithinExecContext = false;
    }
  }

  static getTransversalExecContextStackData(key, defaultValue = void 0) {
    if (
      TrapExecutor.transversalExecContextStack[
        TrapExecutor.transversalExecContextID
      ]
    ) {
      return TrapExecutor.transversalExecContextStack[
        TrapExecutor.transversalExecContextID
      ][key];
    } else {
      return defaultValue;
    }
  }

  execute(trapArgs, before, around, after) {
    const returnValue = this.withinExecContext(() => {
      this.newExecutionContext();
      this.startExecutionContext(trapArgs);
      this.beforePhase(trapArgs, before);
      const returnValue = this.aroundProceedPhase(trapArgs, around);
      this.afterPhase(trapArgs, after, returnValue);
      this.endExecutionContext(trapArgs);
      this.cleanUpExecutionContext();
      return returnValue;
    });
    return returnValue;
  }

  /**
   * @private
   */
  withinExecContext(callback) {
    let isNewTransversalExecutionContext = false;
    if (!TrapExecutor.isWithinExecContext) {
      isNewTransversalExecutionContext = true;
      TrapExecutor.isWithinExecContext = true;
      TrapExecutor.newTransversalExecutionContext();
    }
    const returnValue = callback();
    if (isNewTransversalExecutionContext) {
      TrapExecutor.cleanUpTransversalExecutionContext();
    }
    return returnValue;
  }

  notWithinExecContext(
    callback,
    target = void 0,
    isPerformingUnderlyingOperation = false
  ) {
    const current = TrapExecutor.isWithinExecContext;
    const isTargetPigrettoProxy = target && target[isPigrettoProxy];
    if (isPerformingUnderlyingOperation && !isTargetPigrettoProxy && target) {
      TrapExecutor.transversalExecContextStack[
        TrapExecutor.transversalExecContextID
      ].hasEffectivelyPerformedUnderlyingOperation = true;
    }
    if (!isTargetPigrettoProxy) {
      TrapExecutor.isWithinExecContext = false;
    }
    const returnValue = callback();
    TrapExecutor.isWithinExecContext = current;
    return returnValue;
  }

  /**
   * @private
   */
  newExecutionContext() {
    const context = {
      finalParams: void 0,
      hasPerformedUnderlyingOperation: false,
    };
    this.execContextStack.push(context);
    this.execContextID++;
  }

  /* eslint-disable no-unused-vars, @typescript-eslint/no-empty-function */
  startExecutionContext(trapArgs) {}
  /* eslint-enable no-unused-vars, @typescript-eslint/no-empty-function */

  /* eslint-disable no-unused-vars, @typescript-eslint/no-empty-function */
  endExecutionContext(trapArgs) {}
  /* eslint-enable no-unused-vars, @typescript-eslint/no-empty-function */

  /**
   * @private
   */
  cleanUpExecutionContext() {
    this.execContextStack.pop();
    this.execContextID--;
  }

  /**
   * @private
   */
  unsupportedMultipleProceeds(advice, rule) {
    // eslint-disable-next-line no-console
    console.error(
      "pigretto - Multiple proceeds for the same around advice are not supported, subsequent proceed has been ignored.",
      "\n\tadvice: ",
      advice,
      "\n\trule: ",
      rule
    );
  }

  // eslint-disable-next-line no-unused-vars
  executeBeforeAdvice(trapArgs, advice, rule) {
    throw new Error(
      `pigretto - ${this.constructor.name} trap executor does not implement "executeBeforeAdvice".`
    );
  }

  // eslint-disable-next-line no-unused-vars
  executeAroundAdvice(trapArgs, advice, rule, proceed, context) {
    throw new Error(
      `pigretto - ${this.constructor.name} trap executor does not implement "executeAroundAdvice".`
    );
  }

  // eslint-disable-next-line no-unused-vars
  executeAfterAdvice(trapArgs, advice, rule, returnValue) {
    throw new Error(
      `pigretto - ${this.constructor.name} trap executor does not implement "executeAfterAdvice".`
    );
  }

  // eslint-disable-next-line no-unused-vars
  performUnderlyingOperation(trapArgs) {
    throw new Error(
      `pigretto - ${this.constructor.name} trap executor does not implement "performUnderlyingOperation".`
    );
  }

  // eslint-disable-next-line no-unused-vars
  executeProceedCallback(trapArgs, rule, returnValue, callback) {
    throw new Error(
      `pigretto - ${this.constructor.name} trap executor does not implement "executeProceedCallback".`
    );
  }

  /**
   * @private
   */
  beforePhase(trapArgs, before) {
    for (const { rule, advice } of before) {
      this.executeBefore(trapArgs, advice, rule);
    }
  }

  /**
   * @private
   */
  executeBefore(trapArgs, advice, rule) {
    this.executeBeforeAdvice(trapArgs, advice, rule);
  }

  /**
   * @private
   */
  afterPhase(trapArgs, after, returnValue) {
    for (const { rule, advice } of after) {
      this.executeAfter(trapArgs, advice, rule, returnValue);
    }
  }

  /**
   * @private
   */
  executeAfter(trapArgs, advice, rule, returnValue) {
    this.executeAfterAdvice(trapArgs, advice, rule, returnValue);
  }

  /**
   * @private
   */
  aroundProceedPhase(trapArgs, around) {
    const aroundAdvicesMiddlewares = around.map(
      ({ advice, rule }) => ([trapArgs], next) => {
        const aroundAdviceFactory = declarativeFactory([
          [advice.flat, flatProceedAPIAroundAdviceFactory],
          proceedAPIAroundAdviceFactory,
        ]);

        let proceedCallback = void 0;
        let proceedReturnValue = void 0;
        let hasProceeded = false;
        const context = {};
        const proceed = (params = void 0, fn = void 0) => {
          if (hasProceeded) {
            this.unsupportedMultipleProceeds(advice, rule);
            return proceedReturnValue;
          }
          hasProceeded = true;
          let finalParams = void 0;
          let finalFn = void 0;
          if (isArray(params)) {
            finalParams = params;
            finalFn = typeof fn === "function" ? fn : void 0;
          } else if (typeof params === "function") {
            finalFn = params;
          }
          proceedCallback = finalFn;

          this.execContextStack[this.execContextID].finalParams =
            finalParams ||
            this.execContextStack[this.execContextID].finalParams;
          TrapExecutor.transversalExecContextStack[
            TrapExecutor.transversalExecContextID
          ].finalParams = this.execContextStack[this.execContextID].finalParams;

          this.onProceed(this.execContextStack[this.execContextID].finalParams);

          proceedReturnValue = aroundAdviceFactory.proceedWithinProceed({
            trapExecutor: this,
            trapArgs,
            next,
            context,
          });
          return proceedReturnValue;
        };
        const returnValue = this.executeAroundAdvice(
          trapArgs,
          advice,
          rule,
          proceed,
          context
        );
        if (!hasProceeded) {
          this.onNoProceed(returnValue);
          return returnValue;
        } else {
          return aroundAdviceFactory.proceedOutOfProceed({
            trapExecutor: this,
            trapArgs,
            rule,
            returnValue,
            proceedCallback,
            next,
          });
        }
      }
    );
    aroundAdvicesMiddlewares.push(([trapArgs]) => {
      this.execContextStack[
        this.execContextID
      ].hasPerformedUnderlyingOperation = true;
      return this.performUnderlyingOperation(trapArgs);
    });
    const aroundProceedChain = chain(aroundAdvicesMiddlewares);
    let returnValue = aroundProceedChain(trapArgs);
    returnValue = this.return(trapArgs, returnValue);
    return returnValue;
  }

  return(trapArgs, returnValue) {
    return returnValue;
  }

  // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-empty-function
  mutateFlatProceedContext(trapArgs, context) {}

  // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-empty-function
  onProceed(finalParams) {}

  // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-empty-function
  onNoProceed(returnValue) {}
}
