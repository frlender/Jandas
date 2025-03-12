"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addCtx = exports._rename = exports.duplicated = exports.setIndex = exports._trans = exports._str = exports.cp = exports.vec_set = exports.vec_loc2 = exports.vec_loc = void 0;
const util_1 = require("./util");
const Index_1 = require("./Index");
const Series_1 = require("./Series");
const _ = require("lodash");
const df_lib_1 = require("./df_lib");
function cp(arr) {
    return arr.slice(0);
}
exports.cp = cp;
function vec_loc(vec, idx, f) {
    if (idx.length === 0)
        return [];
    if (f === undefined)
        f = (0, util_1.isArr)(vec[0]) ? (x) => cp(x)
            : (x) => x;
    if (typeof idx[0] === 'number') {
        return idx.map(i => {
            util_1.check.iloc.num(i, vec.length);
            return f(vec[i]);
        });
    }
    else {
        util_1.check.iloc.bool(idx, vec.length);
        const arr = [];
        idx.forEach((b, i) => {
            if (b)
                arr.push(f(vec[i]));
        });
        return arr;
    }
}
exports.vec_loc = vec_loc;
function vec_loc2(vec1, vec2, idx) {
    if (idx.length === 0)
        return [[], []];
    const vec1x = [];
    const vec2x = [];
    const f1 = (0, util_1.isArr)(vec1[0]) ? (x) => cp(x)
        : (x) => x;
    const f2 = (0, util_1.isArr)(vec2[0]) ? (x) => cp(x)
        : (x) => x;
    if (typeof idx[0] === 'number') {
        idx.forEach(i => {
            util_1.check.iloc.num(i, vec1.length);
            vec1x.push(f1(vec1[i]));
            vec2x.push(f2(vec2[i]));
        });
    }
    else {
        util_1.check.iloc.bool(idx, vec1.length);
        idx.forEach((val, i) => {
            if (val) {
                vec1x.push(f1(vec1[i]));
                vec2x.push(f2(vec2[i]));
            }
        });
    }
    return [vec1x, vec2x];
}
exports.vec_loc2 = vec_loc2;
function vec_set(vec, rpl, idx) {
    if (idx.length === 0) {
        util_1.check.iset.rpl.num(rpl, idx.length);
        return;
    }
    // cp rpl element if S is an array type
    const f = (0, util_1.isArr)(rpl[0]) ? (x) => cp(x)
        : (x) => x;
    if (typeof idx[0] === 'number') {
        util_1.check.iset.rpl.num(rpl, idx.length);
        idx.forEach((i, ix) => {
            util_1.check.iloc.num(i, vec.length);
            if (ix === 0)
                (0, util_1.isArr)(vec[0]) ? util_1.check.iset.rpl.num(rpl[0], vec[0].length)
                    : util_1.check.iset.rpl.val(rpl[0]);
            vec[i] = f(rpl[ix]);
        });
    }
    else {
        let ix = 0;
        idx = idx;
        util_1.check.iloc.bool(idx, vec.length);
        util_1.check.iset.rpl.bool(rpl, idx);
        idx.forEach((val, i) => {
            if (val) {
                if (ix === 0)
                    (0, util_1.isArr)(vec[0]) ? util_1.check.iset.rpl.num(rpl[0], vec[0].length)
                        : util_1.check.iset.rpl.val(rpl[0]);
                vec[i] = f(rpl[ix]);
                ix += 1;
            }
        });
    }
}
exports.vec_set = vec_set;
function _str(x) {
    if ((0, util_1.isNum)(x) || (0, util_1.isStr)(x) || (0, util_1.isArr)(x))
        return x.toString();
    else
        return JSON.stringify(x);
}
exports._str = _str;
function _trans(index, idx) {
    // translate labelled index to numeric index
    if ((0, util_1.isVal)(idx))
        return index.trans(idx);
    else {
        // let res:number[]
        switch (true) {
            case idx instanceof Index_1.default:
                return index.trans(idx.values);
            case idx instanceof Series_1.default && idx.values.length > 0 && typeof idx.values[0] !== 'boolean':
                return index.trans(idx.values);
            case idx instanceof Series_1.default:
                return idx.values;
            case _.isArray(idx) && idx.length > 0 && typeof idx[0] !== 'boolean':
                return index.trans(idx);
            default:
                return idx;
        }
        // throw('unexpected error. The second argument idx does not match what is predefined.')
    }
}
exports._trans = _trans;
const setIndex = (vals, shape) => {
    const len = vals instanceof Index_1.default ?
        vals.shape : vals.length;
    util_1.check.frame.index.set(shape, len);
    return vals instanceof Index_1.default ? vals : new Index_1.default(vals);
};
exports.setIndex = setIndex;
const duplicated = (vals, keep = 'first', keyFunc = JSON.stringify) => {
    const mp = {};
    const arr = [];
    vals.forEach((val, i) => {
        const k = _.isString(val) || _.isNumber(val)
            ? val : keyFunc(val);
        if (!(k in mp)) {
            arr[i] = false;
            mp[k] = i;
        }
        else {
            if (keep === 'first')
                arr[i] = true;
            else if (keep === 'last') {
                arr[mp[k]] = true;
                mp[k] = i;
                arr[i] = false;
            }
            else {
                arr[mp[k]] = true;
                arr[i] = true;
            }
        }
    });
    return arr;
};
exports.duplicated = duplicated;
function _rename(index, labelMap, inplace = false) {
    if (inplace) {
        for (const [i, key] of index.values.entries()) {
            if (key in labelMap)
                index.values[i] = labelMap[key];
        }
    }
    else {
        const arr = [];
        for (const key of index.values) {
            if (key in labelMap)
                arr.push(labelMap[key]);
            else
                arr.push(key);
        }
        return new Index_1.default(arr, index.name);
    }
}
exports._rename = _rename;
function addCtx(expr, __ctx__) {
    const atPosArr = (0, df_lib_1.findUnquotedAt)(expr);
    let newExpr = '';
    let lastPos = 0;
    // let lastLen = 0
    for (var match of expr.matchAll(/(@[a-zA-Z_$][a-zA-Z0-9_$]*)|(@)/g)) {
        const idx = match.index;
        if (atPosArr.includes(idx)) {
            const addOn = match[0] === '@' ?
                `__ctx__` :
                `__ctx__["${match[0].slice(1)}"]`;
            newExpr += expr.slice(lastPos, idx) + addOn;
            lastPos = idx + match[0].length;
        }
    }
    newExpr += expr.slice(lastPos);
    return newExpr;
}
exports.addCtx = addCtx;
