"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var util_1 = require("./util");
var cmm_1 = require("./cmm");
var df_lib_1 = require("./df_lib");
var Index_1 = require("./Index");
var DataFrame_1 = require("./DataFrame");
var stat = require("simple-statistics");
var _ = require("lodash");
var ranks = require("@stdlib/stats-ranks");
var Series = /** @class */ (function () {
    function Series(first, second) {
        if (_.isUndefined(second))
            second = {};
        second = _.defaults(second, { name: '', index: new Index_1.default(first.map(function (_, i) { return i; })) });
        this.values = first;
        this.shape = this.values.length;
        this.name = second.name;
        this.index = second.index instanceof Index_1.default ?
            second.index : new Index_1.default(second.index);
    }
    Object.defineProperty(Series.prototype, "index", {
        get: function () {
            return this._index;
        },
        set: function (vals) {
            this._index = (0, cmm_1.setIndex)(vals, this.shape);
        },
        enumerable: false,
        configurable: true
    });
    Series.prototype.p = function () {
        var name_str = this.name ? ' ' + this.name : '';
        console.log(this.index.values.map(function (x) { return x.toString(); }).join('\t') + '\n' +
            this.values.map(function (x) { return (0, cmm_1._str)(x); }).join('\t') + '\n' +
            "Series (".concat(this.shape, ")").concat(name_str));
    };
    Series.prototype._iloc = function (idx) {
        switch (true) {
            case idx === undefined:
                return new Series((0, cmm_1.cp)(this.values), { index: this.index.cp(), name: this.name });
            case (0, util_1.isNum)(idx):
                util_1.check.iloc.num(idx, this.shape);
                return this.values[idx];
            default:
                var _a = (0, cmm_1.vec_loc2)(this.values, this.index.values, idx), vec = _a[0], new_idx = _a[1];
                var new_index = new Index_1.default(new_idx, this.index.name);
                return new Series(vec, { index: new_idx, name: this.name });
        }
    };
    Series.prototype.iloc = function (idx) {
        idx = (0, util_1._trans_iloc)(idx, this.shape);
        // have to use any here. Refer to:
        // https://stackoverflow.com/questions/67972427/typescript-function-overloading-no-overload-matches-this-call
        return this._iloc(idx);
    };
    Series.prototype.loc = function (index) {
        var num_idx;
        if (_.isNumber(index) || _.isString(index))
            num_idx = (0, cmm_1._trans)(this.index, index);
        else
            num_idx = (0, cmm_1._trans)(this.index, index);
        if (_.isNumber(num_idx))
            return this._iloc(num_idx);
        else
            return this._iloc(num_idx);
    };
    Series.prototype._iset = function (idx, values) {
        switch (true) {
            case idx === undefined:
                util_1.check.iset.rpl.num(values, this.shape);
                this.values = (0, cmm_1.cp)(values);
                break;
            case (0, util_1.isVal)(idx):
                util_1.check.iloc.num(idx, this.shape);
                this.values[idx] = values;
                break;
            default:
                (0, cmm_1.vec_set)(this.values, values, idx);
        }
    };
    Series.prototype.iset = function (first, second) {
        if (second === undefined) {
            this._iset(undefined, first);
        }
        else {
            first = (0, util_1._trans_iloc)(first, this.shape);
            this._iset(first, second);
        }
    };
    Series.prototype.set = function (first, second) {
        if (second === undefined) {
            this._iset(undefined, first);
        }
        else {
            if ((0, util_1.isVal)(first) && !this.index.has(first))
                this.push(second, first);
            else {
                if (first instanceof Index_1.default ||
                    first instanceof Series)
                    first = first.values;
                // differs from pandas with the following
                // code annotated. See Series.test.tsx 
                // line 320.
                // if(isNumArr(first)|| isStrArr(first))
                //     check.set.index.uniq(this.index)
                if ((0, util_1.isNum)(first) || (0, util_1.isStr)(first)) {
                    var pos = this.index.mp.get(first);
                    if ((0, util_1.isArr)(pos) && !(0, util_1.isArr)(second)) {
                        second = Array.from(Array(pos.length).keys()).map(function (_) { return second; });
                    }
                }
                var num_idx = (0, cmm_1._trans)(this.index, first);
                this._iset(num_idx, second);
            }
        }
    };
    Series.prototype.push = function (val, name) {
        if (name === void 0) { name = ''; }
        this.values.push(val);
        this.index.values.push(name);
        this.shape += 1;
    };
    Series.prototype.insert = function (idx, val, name) {
        if (name === void 0) { name = ''; }
        util_1.check.iloc.num(idx, this.shape);
        this.values.splice(idx, 0, val);
        this.index.insert(idx, name);
        this.shape += 1;
    };
    Series.prototype.drop = function (labels) {
        var _this = this;
        labels = (0, util_1.isArr)(labels) ? labels : [labels];
        var labels2 = labels;
        var new_idx = (0, util_1.range)(this.index.shape).filter(function (i) { return !labels2.includes(_this.index.values[i]); });
        return this.iloc(new_idx);
    };
    // drop_duplicates_by_index():Series<T>{
    //     return drop_duplicates_by_index(this)
    // }
    Series.prototype.bool = function (expr) {
        return this.b(expr);
    };
    Series.prototype.b = function (expr) {
        return this.values.map(function (x) { return eval(expr); });
    };
    Series.prototype.query = function (expr) {
        return this.q(expr);
    };
    Series.prototype.q = function (expr) {
        var bidx = this.b(expr);
        return this.loc(bidx);
    };
    Series.prototype.sort_values = function (ascending) {
        if (ascending === void 0) { ascending = true; }
        var idx = (0, df_lib_1._sortIndices)(this.values, ascending);
        return this.iloc(idx);
    };
    Series.prototype.value_counts = function () {
        // only work if values are string or number
        var mp = new Map;
        this.values.forEach((function (e) {
            var e2 = e;
            if (!mp.has(e2))
                mp.set(e2, 0);
            mp.set(e2, mp.get(e2) + 1);
        }));
        var arr = [];
        mp.forEach(function (count, key) {
            arr.push([key, count]);
        });
        var df = new DataFrame_1.default(arr, { columns: ['value', 'count'] });
        var ss = df.sort_values('count', { ascending: false }).set_index('value').loc(null, 'count');
        ss.name = '';
        ss.index.name = '';
        return ss;
    };
    Series.prototype.op = function (opStr, ss) {
        var _this = this;
        if (_.isUndefined(ss)) {
            var vals = this.values.map(function (x) { return eval(opStr); });
            return new Series(vals, { index: this.index, name: this.name });
        }
        else if (ss instanceof Series) {
            util_1.check.op.index(this.index, ss.index);
            var vals_1 = [];
            this.index.values.forEach(function (idx) {
                var x = _this.loc(idx);
                var y = ss.loc(idx);
                var val = eval(opStr);
                vals_1.push(val);
            });
            return new Series(vals_1, this.index);
        }
        else {
            util_1.check.op.values(this.index, ss);
            var vals_2 = [];
            this.values.forEach(function (x, i) {
                var y = ss[i];
                var val = eval(opStr);
                vals_2.push(val);
            });
            return new Series(vals_2, this.index);
        }
    };
    Series.prototype.unique = function () {
        return _.uniq(this.values);
    };
    Series.prototype.rank = function (options) {
        if (_.isUndefined(options))
            options = {};
        var vals = ranks(this.values, options);
        return new Series(vals, { index: this.index, name: this.name });
    };
    Series.prototype.min = function () {
        return stat.min(this.values);
    };
    Series.prototype.max = function () {
        return stat.max(this.values);
    };
    Series.prototype.sum = function () {
        return stat.sum(this.values);
    };
    Series.prototype.mean = function () {
        return stat.mean(this.values);
    };
    Series.prototype.mode = function () {
        return stat.mode(this.values);
    };
    Series.prototype.median = function () {
        return stat.median(this.values);
    };
    // cumsum(){
    //     return d3.cumsum(this.values as number[])
    // }
    Series.prototype.std = function () {
        return stat.sampleStandardDeviation(this.values);
    };
    Series.prototype.var = function () {
        return stat.sampleVariance(this.values);
    };
    Series.prototype.to_raw = function (copy) {
        if (copy === void 0) { copy = true; }
        if (copy)
            return { values: (0, cmm_1.cp)(this.values),
                name: this.name,
                index: this.index.to_raw() };
        else
            return { values: this.values,
                name: this.name,
                index: this.index.to_raw(copy) };
    };
    return Series;
}());
exports.default = Series;
