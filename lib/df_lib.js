"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroupByThen = void 0;
var _ = require("lodash");
var GroupByThen = /** @class */ (function () {
    function GroupByThen(gp, axis, df) {
        this.gp = gp;
        this.axis = axis;
        this.df = df;
    }
    GroupByThen.prototype.then = function (func) {
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
    return GroupByThen;
}());
exports.GroupByThen = GroupByThen;
