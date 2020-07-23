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

import { isArray } from "js-utl";
import { isPigrettoProxy } from "../../props";

/**
 * @type {Symbol}
 */
const noReturnValue = Symbol("noReturnValue");

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
      // TODO: Flat Proceed API
      this.aroundPhase(trapArgs, around);
      const returnValue = this.proceedPhase(trapArgs);
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

  notWithinExecContext(callback, target = void 0) {
    const current = TrapExecutor.isWithinExecContext;
    if (!target || !target[isPigrettoProxy]) {
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
      proceeds: [],
      returnValue: noReturnValue,
      finalParams: void 0,
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
  executeAroundAdvice(trapArgs, advice, rule, proceed) {
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
  aroundPhase(trapArgs, around) {
    for (const { rule, advice } of around) {
      this.executeAround(trapArgs, advice, rule);
      if (
        this.execContextStack[this.execContextID].returnValue !== noReturnValue
      ) {
        break;
      }
    }
  }

  /**
   * @private
   */
  executeAround(trapArgs, advice, rule) {
    let hasProceeded = false;
    const proceed = (params = void 0, fn = void 0) => {
      if (hasProceeded) {
        this.unsupportedMultipleProceeds(advice, rule);
        return;
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
      this.execContextStack[this.execContextID].proceeds.push({
        fn: finalFn,
        rule,
      });
      this.execContextStack[this.execContextID].finalParams =
        finalParams || this.execContextStack[this.execContextID].finalParams;
      TrapExecutor.transversalExecContextStack[
        TrapExecutor.transversalExecContextID
      ].finalParams = this.execContextStack[this.execContextID].finalParams;

      // TODO: Flat Proceed API
    };
    const returnValue = this.executeAroundAdvice(
      trapArgs,
      advice,
      rule,
      proceed
    );
    if (!hasProceeded) {
      this.execContextStack[this.execContextID].returnValue = returnValue;
    }
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
  proceedPhase(trapArgs) {
    let returnValue;
    if (
      this.execContextStack[this.execContextID].returnValue !== noReturnValue
    ) {
      returnValue = this.return(
        trapArgs,
        this.execContextStack[this.execContextID].returnValue
      );
    } else {
      returnValue = this.performUnderlyingOperation(trapArgs);
    }
    for (
      let i = this.execContextStack[this.execContextID].proceeds.length - 1;
      i >= 0;
      i--
    ) {
      const { fn: callback, rule } = this.execContextStack[
        this.execContextID
      ].proceeds[i];
      if (typeof callback === "function") {
        returnValue = this.executeProceedCallback(
          trapArgs,
          rule,
          returnValue,
          callback
        );
      }
    }
    return this.return(trapArgs, returnValue);
  }

  return(trapArgs, returnValue) {
    return returnValue;
  }
}
