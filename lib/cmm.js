"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.duplicated = exports.setIndex = exports._trans = exports._str = exports.cp = exports.vec_set = exports.vec_loc2 = exports.vec_loc = void 0;
var util_1 = require("./util");
var Index_1 = require("./Index");
var Series_1 = require("./Series");
var _ = require("lodash");
function cp(arr) {
    return arr.slice(0);
}
exports.cp = cp;
function vec_loc(vec, idx, f) {
    if (idx.length === 0)
        return [];
    if (f === undefined)
        f = (0, util_1.isArr)(vec[0]) ? function (x) { return cp(x); }
            : function (x) { return x; };
    if (typeof idx[0] === 'number') {
        return idx.map(function (i) {
            util_1.check.iloc.num(i, vec.length);
            return f(vec[i]);
        });
    }
    else {
        util_1.check.iloc.bool(idx, vec.length);
        var arr_1 = [];
        idx.forEach(function (b, i) {
            if (b)
                arr_1.push(f(vec[i]));
        });
        return arr_1;
    }
}
exports.vec_loc = vec_loc;
function vec_loc2(vec1, vec2, idx) {
    if (idx.length === 0)
        return [[], []];
    var vec1x = [];
    var vec2x = [];
    var f1 = (0, util_1.isArr)(vec1[0]) ? function (x) { return cp(x); }
        : function (x) { return x; };
    var f2 = (0, util_1.isArr)(vec2[0]) ? function (x) { return cp(x); }
        : function (x) { return x; };
    if (typeof idx[0] === 'number') {
        idx.forEach(function (i) {
            util_1.check.iloc.num(i, vec1.length);
            vec1x.push(f1(vec1[i]));
            vec2x.push(f2(vec2[i]));
        });
    }
    else {
        util_1.check.iloc.bool(idx, vec1.length);
        idx.forEach(function (val, i) {
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
    var f = (0, util_1.isArr)(rpl[0]) ? function (x) { return cp(x); }
        : function (x) { return x; };
    if (typeof idx[0] === 'number') {
        util_1.check.iset.rpl.num(rpl, idx.length);
        idx.forEach(function (i, ix) {
            util_1.check.iloc.num(i, vec.length);
            if (ix === 0)
                (0, util_1.isArr)(vec[0]) ? util_1.check.iset.rpl.num(rpl[0], vec[0].length)
                    : util_1.check.iset.rpl.val(rpl[0]);
            vec[i] = f(rpl[ix]);
        });
    }
    else {
        var ix_1 = 0;
        idx = idx;
        util_1.check.iloc.bool(idx, vec.length);
        util_1.check.iset.rpl.bool(rpl, idx);
        idx.forEach(function (val, i) {
            if (val) {
                if (ix_1 === 0)
                    (0, util_1.isArr)(vec[0]) ? util_1.check.iset.rpl.num(rpl[0], vec[0].length)
                        : util_1.check.iset.rpl.val(rpl[0]);
                vec[i] = f(rpl[ix_1]);
                ix_1 += 1;
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
var setIndex = function (vals, shape) {
    var len = vals instanceof Index_1.default ?
        vals.shape : vals.length;
    util_1.check.frame.index.set(shape, len);
    return vals instanceof Index_1.default ? vals : new Index_1.default(vals);
};
exports.setIndex = setIndex;
var duplicated = function (vals, keep, keyFunc) {
    if (keep === void 0) { keep = 'first'; }
    if (keyFunc === void 0) { keyFunc = JSON.stringify; }
    var mp = {};
    var arr = [];
    vals.forEach(function (val, i) {
        var k = _.isString(val) || _.isNumber(val)
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
