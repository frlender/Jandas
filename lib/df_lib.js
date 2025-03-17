"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findUnquotedAt = exports._sortIndices = exports.GroupByThen = void 0;
const _ = require("lodash");
const util_1 = require("./util");
const util2_1 = require("./util2");
const stat = require("simple-statistics");
class GroupByThen {
    constructor(gp, axis, df, labels, index) {
        this.gp = gp;
        this.axis = axis;
        this.df = df;
        this.labels = labels;
        this.index = index;
    }
    _get_keep_labels() {
        return _.difference(this.index.values, this.labels);
    }
    // _get_remain_df(){
    //     const df = this.df
    //     this.rf = _.isNull(this.labels) ? df :
    //         (this.axis === 0 ? 
    //             df.loc(null,_.difference(this.index.values,this.labels)) :
    //             df.loc(_.difference(this.index.values,this.labels)))
    // }
    _prepare(key, val) {
        const karr = JSON.parse(key);
        const k = karr.length === 1 ? karr[0] : karr;
        const sub = this.axis === 0 ?
            this.df.iloc(val) : this.df.iloc(null, val);
        return { sub: sub, k: k };
    }
    then(func) {
        let i = 0;
        _.forOwn(this.gp, (val, key) => {
            const { sub, k } = this._prepare(key, val);
            func(sub, k, i);
            i += 1;
        });
    }
    [Symbol.iterator]() {
        const self = this;
        function* iter() {
            let i = 0;
            for (const [key, val] of Object.entries(self.gp)) {
                const { sub, k } = self._prepare(key, val);
                yield [sub, k, i];
                i += 1;
            }
        }
        return iter();
    }
    reduce(func) {
        const keep_labels = _.isNull(this.labels) ?
            null : this._get_keep_labels();
        const get_keep = _.isNull(keep_labels) ?
            (x) => x :
            (x) => x.loc(keep_labels);
        const arr = [];
        for (const [gp, key] of this) {
            let ss = gp.reduce(func, this.axis);
            // console.log(gp,key,keep_labels,ss)
            if (_.isString(key) || _.isNumber(key))
                ss.name = key;
            else
                ss.name = JSON.stringify(key);
            ss = get_keep(ss);
            arr.push(ss);
        }
        const res = (0, util2_1.concat)(arr, 1);
        return this.axis === 0 ? res.transpose() : res;
    }
    _reduce_num(func) {
        return this.reduce(func);
    }
    min() {
        return this._reduce_num(stat.min);
    }
    max() {
        return this._reduce_num(stat.max);
    }
    sum() {
        return this._reduce_num(stat.sum);
    }
    mean() {
        return this._reduce_num(stat.mean);
    }
    median() {
        return this._reduce_num(stat.median);
    }
    std() {
        return this._reduce_num(stat.sampleStandardDeviation);
    }
    var() {
        return this._reduce_num(stat.sampleVariance);
    }
    mode() {
        return this._reduce_num(stat.mode);
    }
    prod() {
        return this._reduce_num(stat.product);
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
function findUnquotedAt(str) {
    let inQuotes = false;
    let quoteType = null;
    const positions = [];
    for (let i = 0; i < str.length; i++) {
        const char = str[i];
        if (char === '"' || char === "'") {
            if (!inQuotes) {
                inQuotes = true;
                quoteType = char;
            }
            else if (char === quoteType) {
                inQuotes = false;
            }
        }
        else if (char === '@' && !inQuotes) {
            positions.push(i);
        }
    }
    return positions;
}
exports.findUnquotedAt = findUnquotedAt;
