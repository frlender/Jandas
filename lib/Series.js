"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("./util");
const cmm_1 = require("./cmm");
const df_lib_1 = require("./df_lib");
const Index_1 = require("./Index");
const DataFrame_1 = require("./DataFrame");
const stat = require("simple-statistics");
const _ = require("lodash");
const ranks = require("@stdlib/stats-ranks");
class Series {
    constructor(first, second) {
        if (_.isUndefined(second))
            second = {};
        second = _.defaults(second, { name: '', index: new Index_1.default(first.map((_, i) => i)) });
        this.values = first;
        this.shape = this.values.length;
        this._name = second.name;
        this._index = second.index instanceof Index_1.default ?
            second.index : new Index_1.default(second.index);
    }
    get index() {
        return this._index;
    }
    set index(vals) {
        this._index = (0, cmm_1.setIndex)(vals, this.shape);
    }
    get name() {
        return this._name;
    }
    set name(val) {
        this._name = val;
        // this.nameSetterEffect()
    }
    rename(labelMap, inplace = false) {
        if (inplace)
            (0, cmm_1._rename)(this.index, labelMap, true);
        else {
            const index = (0, cmm_1._rename)(this.index, labelMap, false);
            return new Series((0, cmm_1.cp)(this.values), { index, name: this.name });
        }
    }
    p() {
        const name_str = this.name ? ' ' + this.name : '';
        console.log(this.index.values.map(x => x.toString()).join('\t') + '\n' +
            this.values.map(x => (0, cmm_1._str)(x)).join('\t') + '\n' +
            `Series (${this.shape})${name_str}`);
    }
    _iloc(idx) {
        switch (true) {
            case idx === undefined:
                return new Series((0, cmm_1.cp)(this.values), { index: this.index.cp(), name: this.name });
            case (0, util_1.isNum)(idx):
                util_1.check.iloc.num(idx, this.shape);
                return this.values[idx];
            default:
                const [vec, new_idx] = (0, cmm_1.vec_loc2)(this.values, this.index.values, idx);
                const new_index = new Index_1.default(new_idx, this.index.name);
                return new Series(vec, { index: new_idx, name: this.name });
        }
    }
    iloc(idx) {
        idx = (0, util_1._trans_iloc)(idx, this.shape);
        return this._iloc(idx);
    }
    loc(index) {
        let num_idx;
        if (_.isNumber(index) || _.isString(index))
            num_idx = (0, cmm_1._trans)(this.index, index);
        else
            num_idx = (0, cmm_1._trans)(this.index, index);
        if (_.isNumber(num_idx))
            return this._iloc(num_idx);
        else
            return this._iloc(num_idx);
    }
    _iset(idx, values) {
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
    }
    iset(first, second) {
        if (second === undefined) {
            this._iset(undefined, first);
        }
        else {
            first = (0, util_1._trans_iloc)(first, this.shape);
            this._iset(first, second);
        }
    }
    set(first, second) {
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
                    const pos = this.index.mp.get(first);
                    if ((0, util_1.isArr)(pos) && !(0, util_1.isArr)(second)) {
                        second = Array.from(Array(pos.length).keys()).map(_ => second);
                    }
                }
                const num_idx = (0, cmm_1._trans)(this.index, first);
                this._iset(num_idx, second);
            }
        }
    }
    push(val, name = '') {
        this.values.push(val);
        this.index.values.push(name);
        this.shape += 1;
    }
    insert(idx, val, name = '') {
        util_1.check.iloc.num(idx, this.shape);
        this.values.splice(idx, 0, val);
        this.index.insert(idx, name);
        this.shape += 1;
    }
    drop(labels) {
        labels = (0, util_1.isArr)(labels) ? labels : [labels];
        const labels2 = labels;
        const new_idx = (0, util_1.range)(this.index.shape).filter(i => !labels2.includes(this.index.values[i]));
        return this.iloc(new_idx);
    }
    // drop_duplicates_by_index():Series<T>{
    //     return drop_duplicates_by_index(this)
    // }
    drop_duplicates(keep = 'first') {
        const new_idx = (0, cmm_1.duplicated)(this.values, keep);
        return this.loc(new_idx.map(x => !x));
    }
    bool(expr) {
        return this.b(expr);
    }
    b(expr) {
        return this.values.map(x => eval(expr));
    }
    query(expr) {
        return this.q(expr);
    }
    q(expr) {
        const bidx = this.b(expr);
        return this.loc(bidx);
    }
    sort_values(ascending = true) {
        const idx = (0, df_lib_1._sortIndices)(this.values, ascending);
        return this.iloc(idx);
    }
    value_counts() {
        // only work if values are string or number
        const mp = new Map;
        this.values.forEach((e => {
            const e2 = e;
            if (!mp.has(e2))
                mp.set(e2, 0);
            mp.set(e2, mp.get(e2) + 1);
        }));
        const arr = [];
        mp.forEach((count, key) => {
            arr.push([key, count]);
        });
        const df = new DataFrame_1.default(arr, { columns: ['value', 'count'] });
        const ss = df.sort_values('count', { ascending: false }).set_index('value').loc(null, 'count');
        ss.name = '';
        ss.index.name = '';
        return ss;
    }
    op(opStr, ss) {
        if (_.isUndefined(ss)) {
            const vals = this.values.map(x => eval(opStr));
            return new Series(vals, { index: this.index, name: this.name });
        }
        else if (ss instanceof Series) {
            util_1.check.op.index(this.index, ss.index);
            const vals = [];
            this.index.values.forEach((idx) => {
                const x = this.loc(idx);
                const y = ss.loc(idx);
                const val = eval(opStr);
                vals.push(val);
            });
            return new Series(vals, this.index);
        }
        else {
            util_1.check.op.values(this.index, ss);
            const vals = [];
            this.values.forEach((x, i) => {
                const y = ss[i];
                const val = eval(opStr);
                vals.push(val);
            });
            return new Series(vals, this.index);
        }
    }
    unique() {
        return _.uniq(this.values);
    }
    rank(options) {
        if (_.isUndefined(options))
            options = {};
        const vals = ranks(this.values, options);
        return new Series(vals, { index: this.index, name: this.name });
    }
    reduce(func) {
        return func(this.values);
    }
    min() {
        return stat.min(this.values);
    }
    max() {
        return stat.max(this.values);
    }
    sum() {
        return stat.sum(this.values);
    }
    mean() {
        return stat.mean(this.values);
    }
    mode() {
        return stat.mode(this.values);
    }
    median() {
        return stat.median(this.values);
    }
    // cumsum(){
    //     return d3.cumsum(this.values as number[])
    // }
    std() {
        return stat.sampleStandardDeviation(this.values);
    }
    var() {
        return stat.sampleVariance(this.values);
    }
    prod() {
        return stat.product(this.values);
    }
    to_raw(copy = true) {
        if (copy)
            return { values: (0, cmm_1.cp)(this.values),
                name: this.name,
                index: this.index.to_raw() };
        else
            return { values: this.values,
                name: this.name,
                index: this.index.to_raw(copy) };
    }
}
exports.default = Series;
