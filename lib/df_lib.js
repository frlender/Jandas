"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._sortIndices = exports.GroupByThen = void 0;
var _ = require("lodash");
var util_1 = require("./util");
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
function _sortIndices(arr, ascending) {
    var _cmp = function (a, b) {
        // const a = arr[aidx]
        // const b = arr[bidx]
        if (a === b) {
            return 0;
        }
        else {
            if (_.isNumber(a) && _.isNumber(b)) {
                return (a - b) * flag;
            }
            else {
                if (a < b) {
                    return -1 * flag;
                }
                else {
                    return flag;
                }
            }
        }
    };
    var idx = (0, util_1.range)(arr.length);
    var flag = ascending ? 1 : -1;
    if (_.isArray(arr[0])) {
        var cmp = function (a1, a2) {
            var ax = arr[a1];
            var bx = arr[a2];
            var res = 0;
            for (var i = 0; i < ax.length; i++) {
                res = _cmp(ax[i], bx[i]);
                if (res !== 0) {
                    break;
                }
            }
            return res;
        };
        return idx.sort(cmp);
    }
    else {
        var cmp = function (a1, a2) {
            return _cmp(arr[a1], arr[a2]);
        };
        return idx.sort(cmp);
    }
}
exports._sortIndices = _sortIndices;
