"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
exports.default = wait;
