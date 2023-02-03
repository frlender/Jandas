"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.range = exports.check = exports._trans_iloc = exports.isStrArr = exports.isNumArr = exports.isVal = exports.isArr = exports.isStr = exports.isNum = void 0;
var isNum = function (x) { return typeof x === 'number'; };
exports.isNum = isNum;
var isStr = function (x) { return typeof x === 'string'; };
exports.isStr = isStr;
// const isNonInteger = (x:any) => isNum(x) && !Number.isInteger(x)
var isArr = function (x) { return Array.isArray(x); };
exports.isArr = isArr;
var isVal = function (x) { return isNum(x) || isStr(x); };
exports.isVal = isVal;
var isNumArr = function (x) { return isArr(x)
    && x.length > 0 && isNum(x[0]); };
exports.isNumArr = isNumArr;
var isStrArr = function (x) { return isArr(x)
    && x.length > 0 && isStr(x[0]); };
exports.isStrArr = isStrArr;
var check = {
    index: {
        set: function (k, len, v) {
            var vstr = 'the values property of index';
            if (!Number.isInteger(k))
                throw ("key for ".concat(vstr, " must be a integer. But ").concat(k, " is found."));
            if (k < 0 || k > len)
                throw ("key for ".concat(vstr, " must be in the range of [0,").concat(len, "] inclusively."));
            if (!isNum(v) && !isStr(v))
                throw ("value for ".concat(vstr, " must be a number or a string."));
        }
    },
    frame: {
        index: {
            set: function (len, idx_len) {
                if (len !== idx_len)
                    throw ('Index shape is not equal to shape of Series or axis of DataFrame.');
            }
        },
        b: {
            expr: function (len) {
                if (len % 2 !== 0)
                    throw ('` is not paired in the expression.');
            }
        }
    },
    iloc: {
        num: function (idx, len) {
            if (!Number.isInteger(idx))
                throw ('input number index must be integer.');
            if (idx < 0 || idx >= len)
                throw ('input number index out of range.');
        },
        bool: function (idx, len) {
            if (idx.length !== len)
                throw ('boolean[] index shape does not match the shape of indexed vector.');
        },
        str: {
            colon: function (s) {
                if (!s.includes(':'))
                    throw ('no ":" is found in string range index.');
                if (s.split(':').length > 2)
                    throw ('currently only one ":" should be in the string index');
            },
            parsed: function (start, end) {
                if (Number.isNaN(start) || Number.isNaN(end))
                    throw ('string range index format is not correct.');
                if (!Number.isInteger(start) || !Number.isInteger(end))
                    throw ('numbers in string range index must be integers.');
            }
        }
    },
    iset: {
        rpl: {
            val: function (val) {
                if (isArr(val)) {
                    throw ('the replacement should be a value not an array');
                }
            },
            num: function (values, len) {
                var isValsArr = isArr(values);
                if (!isValsArr ||
                    values.length !== len)
                    throw ("the length of replacement values (".concat(isValsArr ? values.length : values, ") ") +
                        "does not match the length (".concat(len, ") of number[] index."));
            },
            mat: function (values, shape) {
                if (values.length !== shape[0])
                    throw ("the first dimension of replacement values (".concat(values.length, ")") +
                        " does not match the data frame shape ".concat(shape));
                var lenEql = values.reduce(function (acc, val) {
                    return acc && (val.length === shape[1]);
                }, true);
                if (!lenEql) {
                    throw ("the second dimension of replacement values" +
                        " does not match the data frame shape ".concat(shape));
                }
            },
            bool: function (values, idx) {
                var count = idx.reduce(function (x, y) { return y ? x + 1 : x; }, 0);
                if (values.length !== count)
                    throw ('the length of replacement values ' +
                        'does not match the number of true ' +
                        'values in boolean[] index');
            }
        }
    },
    set: {
        index: {
            uniq: function (index) {
                // console.log('aaa',index)
                if (!index.is_unique())
                    throw ('index of the setted object is not unique. '
                        + 'the only allowed array index type is boolean[].');
            }
        }
    }
};
exports.check = check;
function _trans_neg(x, len) {
    var nonneg = len + x;
    return nonneg < 0 ? 0 : nonneg;
}
function _trans_rg(x, len) {
    //TODO support multiple colons like 0:5:2, ::-1
    check.iloc.str.colon(x);
    var _a = x.split(':'), start_str = _a[0], end_str = _a[1];
    start_str = start_str ? start_str : '0';
    end_str = end_str ? end_str : len.toString();
    var _b = [parseFloat(start_str),
        parseFloat(end_str)], start = _b[0], end = _b[1];
    check.iloc.str.parsed(start, end);
    if (start < 0)
        start = _trans_neg(start, len);
    if (end < 0)
        end = _trans_neg(end, len);
    if (start >= end)
        return [];
    if (start >= len)
        return [];
    end = end > len ? len : end;
    return Array.from(Array(end - start).keys()).map(function (x) { return x + start; });
}
//TODO function range(start:number,end:number,step:number)
function range(first, second) {
    if (second === undefined)
        return _trans_rg(":".concat(first), first);
    else
        return _trans_rg("".concat(first, ":").concat(second), second);
}
exports.range = range;
function _trans_iloc(idx, len) {
    switch (true) {
        case typeof idx === 'string':
            return _trans_rg(idx, len);
        case isNum(idx) && idx < 0:
            return idx + len;
        case isNumArr(idx):
            return idx.map(function (x) {
                return x < 0 ? x + len : x;
            });
        default:
            return idx;
    }
}
exports._trans_iloc = _trans_iloc;
