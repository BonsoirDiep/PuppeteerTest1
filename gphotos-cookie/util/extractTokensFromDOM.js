"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cheerio = require("cheerio");
const esprima = require("esprima");
const staticEval = require("static-eval");
const esrecurse = require("esrecurse");
const escodegen = require("escodegen");
function extractTokensFromDOM(html) {
    const $ = cheerio.load(html);
    const string = $('script')
        .map((_, el) => $(el).html())
        .get()
        .join(';\n');
    const ast = esprima.parseScript(string);
    let tokens = {};
    const visitor = new esrecurse.Visitor({
        AssignmentExpression(node) {
            const left = escodegen.generate(node.left);
            if (left === 'window.WIZ_global_data') {
                tokens = staticEval(node.right, {});
            }
        },
    });
    visitor.visit(ast);
    return tokens;
}
exports.default = extractTokensFromDOM;
