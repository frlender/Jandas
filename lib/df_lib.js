"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeriesRolling = exports.Rolling = exports.findUnquotedAt = exports._sortIndices = exports.GroupByThen = void 0;
// util functions
const DataFrame_1 = require("./DataFrame");
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
function _sortIndices(arr, multiple, ascending) {
    // const flag = ascending ? 1:-1
    const _cmp = (a, b, flag) => {
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
    if (multiple) {
        const cmp = (a1, a2) => {
            const ax = arr[a1];
            const bx = arr[a2];
            let res = 0;
            for (let i = 0; i < ax.length; i++) {
                const ascending_i = _.isArray(ascending) ? ascending[i] : ascending;
                const flag = ascending_i ? 1 : -1;
                res = _cmp(ax[i], bx[i], flag);
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
            ascending = _.isArray(ascending) ? ascending[0] : ascending;
            const flag = ascending ? 1 : -1;
            return _cmp(arr[a1], arr[a2], flag);
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
// rolling_series.ts
const get_center_idx = (i, window) => Math.floor(i + 1 - window / 2);
const get_i_from_center_idx = (center_idx, window) => {
    return Math.ceil(center_idx + window / 2 - 1);
};
class Rolling {
    constructor(df, window, min_periods = window, center = false, closed = 'right', step = 1, axis = 0) {
        this.df = df;
        this.window = window;
        this.min_periods = min_periods;
        this.center = center;
        this.closed = closed;
        this.step = step;
        this.axis = axis;
        const wins = [];
        const labels = [];
        // i is right edge of window
        for (let i = center ? get_i_from_center_idx(0, window) : 0; center ? get_center_idx(i, window) < df.shape[0] : i < df.shape[0]; i += step) {
            if (center && get_center_idx(i, window) < 0)
                continue;
            const win_idx = center ? get_center_idx(i, window) : i;
            labels.push(df.index.values[win_idx]);
            const indices = [];
            for (let j = window; j >= 0; j--) {
                const idx = i - j;
                if (idx >= 0 && idx < df.shape[0]) {
                    if (j === window && (closed === 'left' || closed === 'both'))
                        indices.push(idx);
                    if (j === 0 && (closed === 'right' || closed === 'both'))
                        indices.push(idx);
                    if (j > 0 && j < window)
                        indices.push(idx);
                }
            }
            // console.log(indices)
            if (indices.length < min_periods)
                wins.push(NaN);
            else
                wins.push(df.iloc(indices));
        }
        // console.log(wins)
        this.wins = wins;
        this.labels = labels;
    }
    apply(fn2, keepNaN = false) {
        //fn: (win: DataFrame<number>|typeof NaN) => number[]
        const fn = (win) => {
            if (_.isNumber(win))
                return (0, util2_1.full)(this.df.shape[1], NaN);
            else
                return (0, util_1.range)(this.df.shape[1]).map(i => {
                    const s0 = win.iloc(null, i);
                    const ss = s0.query('!_.isNaN(x)');
                    if (ss.shape < this.min_periods)
                        return NaN;
                    else if (_.isString(fn2))
                        return ss[fn2]();
                    else
                        return keepNaN ? fn2(s0.values) : fn2(ss.values);
                });
        };
        const res = this.wins.map(win => fn(win));
        const ff = new DataFrame_1.default(res, { index: this.labels, columns: this.df.columns });
        return this.axis === 0 ? ff : ff.transpose();
    }
    sum() {
        return this.apply('sum');
    }
}
exports.Rolling = Rolling;
class SeriesRolling {
    constructor(df, window, min_periods = window, center = false, closed = 'right', step = 1) {
        this.df = df;
        this.window = window;
        this.min_periods = min_periods;
        this.center = center;
        this.closed = closed;
        this.step = step;
        this.roll = new Rolling(df, window, min_periods, center, closed, step);
    }
    apply(fn2, keepNaN = false) {
        return this.roll.apply(fn2, keepNaN).iloc(null, 0);
    }
    sum() {
        return this.apply('sum');
    }
}
exports.SeriesRolling = SeriesRolling;
