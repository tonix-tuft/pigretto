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

import declarativeFactory from "declarative-factory";
import { isArray } from "js-utl";
import ORedRule from "../ORedRule";
import RegexRule from "../RegexRule";
import ExactRule from "../ExactRule";

const REGEX_STRING_TOKEN = "/";

const regexRule = regex => new RegexRule(regex);

const exactRule = property => new ExactRule(property);

const parseSingle = ruleToParse => {
  let factoryParam = ruleToParse;
  const factory = declarativeFactory([
    [() => ruleToParse instanceof RegExp, regexRule],
    [
      () => {
        if (typeof ruleToParse !== "string") {
          return false;
        }
        const initialRegexStringToken = ruleToParse.indexOf(REGEX_STRING_TOKEN);
        const lastRegexStringToken = ruleToParse.lastIndexOf(
          REGEX_STRING_TOKEN
        );
        if (initialRegexStringToken === 0 && lastRegexStringToken > 0) {
          const stringLiteralRegex = ruleToParse.substring(
            1,
            lastRegexStringToken
          );
          const flags =
            ruleToParse.substring(lastRegexStringToken + 1) || void 0;
          factoryParam = new RegExp(stringLiteralRegex, flags);
          return true;
        }
        return false;
      },
      regexRule
    ],
    exactRule
  ]);
  return factory(factoryParam);
};

const parseMultiple = rulesToParse => {
  const rules = [];
  for (const ruleToParse of rulesToParse) {
    const rule = parseSingle(ruleToParse);
    rules.push(rule);
  }
  return new ORedRule(rules);
};

export default function parseRule(rule) {
  const parse = declarativeFactory([
    [isArray(rule), parseMultiple],
    parseSingle
  ]);
  return parse(rule);
}
