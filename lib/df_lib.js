"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Then = void 0;
var _ = require("lodash");
var Then = /** @class */ (function () {
    function Then(gp, axis, df) {
        this.gp = gp;
        this.axis = axis;
        this.df = df;
    }
    Then.prototype.then = function (func) {
        var _this = this;
        var i = 0;
        _.forOwn(this.gp, function (val, key) {
            var karr = JSON.parse(key);
            var k = karr.length === 1 ? karr[0] : karr;
            var sub = _this.axis === 1 ?
                _this.df.iloc(val) : _this.df.iloc(null, val);
            func(sub, k, i);
            i += 1;
        });
    };
    return Then;
}());
exports.Then = Then;
