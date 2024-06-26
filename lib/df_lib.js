"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._sortIndices = exports.GroupByThen = void 0;
const _ = require("lodash");
const util_1 = require("./util");
class GroupByThen {
    constructor(gp, axis, df) {
        this.gp = gp;
        this.axis = axis;
        this.df = df;
    }
    then(func) {
        let i = 0;
        _.forOwn(this.gp, (val, key) => {
            const karr = JSON.parse(key);
            const k = karr.length === 1 ? karr[0] : karr;
            const sub = this.axis === 1 ?
                this.df.iloc(val) : this.df.iloc(null, val);
            func(sub, k, i);
            i += 1;
        });
    }
}
exports.GroupByThen = GroupByThen;
function _sortIndices(arr, ascending) {
    const _cmp = (a, b) => {
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
    const idx = (0, util_1.range)(arr.length);
    const flag = ascending ? 1 : -1;
    if (_.isArray(arr[0])) {
        const cmp = (a1, a2) => {
            const ax = arr[a1];
            const bx = arr[a2];
            let res = 0;
            for (let i = 0; i < ax.length; i++) {
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
        const cmp = (a1, a2) => {
            return _cmp(arr[a1], arr[a2]);
        };
        return idx.sort(cmp);
    }
}
exports._sortIndices = _sortIndices;
