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

import { noOpFn } from "js-utl";

/**
 * @type {Object}
 */
export const proceedAPIAroundAdviceFactory = {
  proceedWithinProceed: noOpFn,
  proceedOutOfProceed: ({
    trapExecutor,
    trapArgs,
    rule,
    returnValue,
    proceedCallback,
    next,
  }) => {
    returnValue = next(trapArgs);
    if (typeof proceedCallback === "function") {
      returnValue = trapExecutor.executeProceedCallback(
        trapArgs,
        rule,
        returnValue,
        proceedCallback
      );
    }
    return returnValue;
  },
};

/**
 * @type {Object}
 */
export const flatProceedAPIAroundAdviceFactory = {
  proceedWithinProceed: ({ trapExecutor, trapArgs, next, context }) => {
    let returnValue;
    let hasMutatedContext = false;
    try {
      returnValue = next(trapArgs);
      trapExecutor.mutateFlatProceedContext(trapArgs, context);
      hasMutatedContext = true;
    } catch (e) {
      !hasMutatedContext &&
        trapExecutor.mutateFlatProceedContext(trapArgs, context);
      throw e;
    }
    return returnValue;
  },
  proceedOutOfProceed: ({ returnValue }) => returnValue,
};
