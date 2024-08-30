"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._trans_rg = exports.range = exports.check = exports._trans_iloc = exports.isStrArr = exports.isNumArr = exports.isVal = exports.isArr = exports.isStr = exports.isNum = void 0;
const _ = require("lodash");
const isNum = (x) => _.isNumber(x);
exports.isNum = isNum;
const isStr = (x) => _.isString(x);
exports.isStr = isStr;
// const isNonInteger = (x:any) => isNum(x) && !Number.isInteger(x)
const isArr = (x) => Array.isArray(x);
exports.isArr = isArr;
const isVal = (x) => isNum(x) || isStr(x);
exports.isVal = isVal;
const isNumArr = (x) => isArr(x)
    && x.length > 0 && isNum(x[0]);
exports.isNumArr = isNumArr;
const isStrArr = (x) => isArr(x)
    && x.length > 0 && isStr(x[0]);
exports.isStrArr = isStrArr;
const check = {
    index: {
        set(k, len, v) {
            const vstr = 'the values property of index';
            if (!Number.isInteger(k))
                throw (`key for ${vstr} must be a integer. But ${k} is found.`);
            if (k < 0 || k > len)
                throw (`key for ${vstr} must be in the range of [0,${len}] inclusively.`);
            if (!isNum(v) && !isStr(v))
                throw (`value for ${vstr} must be a number or a string.`);
        }
    },
    frame: {
        index: {
            set(len, idx_len) {
                if (len !== idx_len)
                    throw ('Index shape is not equal to shape of Series or axis of DataFrame.');
            }
        },
        b: {
            expr(len) {
                if (len % 2 !== 0)
                    throw ('` is not paired in the expression.');
            }
        }
    },
    iloc: {
        num(idx, len) {
            if (!Number.isInteger(idx))
                throw ('input number index must be integer.');
            if (idx < 0 || idx >= len)
                throw ('input number index out of range.');
        },
        bool(idx, len) {
            if (idx.length !== len)
                throw ('boolean[] index shape does not match the shape of indexed vector.');
        },
        str: {
            colon(s) {
                if (!s.includes(':'))
                    throw ('no ":" is found in string range index.');
                if (s.split(':').length > 3)
                    throw ('More than two ":" in the string index');
            },
            parsed(start, end) {
                if (Number.isNaN(start) || Number.isNaN(end))
                    throw ('string range index format is not correct.');
                if (!Number.isInteger(start) || !Number.isInteger(end))
                    throw ('numbers in string range index must be integers.');
            },
            parsedStep(step) {
                if (Number.isNaN(step))
                    throw ('step string range index format is not correct.');
                if (!Number.isInteger(step))
                    throw ('step in string range index must be integers.');
                if (step === 0)
                    throw ('step cannot be less than 0.');
            }
        }
    },
    iset: {
        rpl: {
            val(val) {
                if (isArr(val)) {
                    throw ('the replacement should be a value not an array');
                }
            },
            num(values, len) {
                const isValsArr = isArr(values);
                if (!isValsArr ||
                    values.length !== len)
                    throw (`the length of replacement values (${isValsArr ? values.length : values}) ` +
                        `does not match the length (${len}) of number[] index.`);
            },
            mat(values, shape) {
                if (values.length !== shape[0])
                    throw (`the first dimension of replacement values (${values.length})` +
                        ` does not match the data frame shape ${shape}`);
                const lenEql = values.reduce((acc, val) => {
                    return acc && (val.length === shape[1]);
                }, true);
                if (!lenEql) {
                    throw (`the second dimension of replacement values` +
                        ` does not match the data frame shape ${shape}`);
                }
            },
            bool(values, idx) {
                const count = idx.reduce((x, y) => y ? x + 1 : x, 0);
                if (values.length !== count)
                    throw ('the length of replacement values ' +
                        'does not match the number of true ' +
                        'values in boolean[] index');
            }
        }
    },
    set: {
        index: {
            uniq(index) {
                // console.log('aaa',index)
                if (!index.is_unique())
                    throw ('Index of the setted object is not unique. '
                        + 'The only allowed array index type is boolean[].');
            }
        }
    },
    op: {
        index(idx1, idx2) {
            if (idx1.shape !== idx2.shape)
                throw ("The lengths of the two series' indices are not equal!");
            // if(!idx1.is_unique() || !idx2.is_unique())
            // throw("One of the series' index is not unique. Currently, Jandas only support element-wise operations on two series with unique indices.")
            // const cmm = _.intersection(idx1.values,idx2.values)
            // if(cmm.length !== idx1.shape || cmm.length !== idx2.shape )
            //     throw("The values in the two series' indices are not a exact match.")
        },
        indexSame(idx1, idx2) {
            if (JSON.stringify(idx1.values) !==
                JSON.stringify(idx2.values))
                throw ("If there are duplicate values in an index, the two series' indices must be exactly the same.");
        },
        values(idx, values) {
            if (idx.shape !== values.length)
                throw ('The length of the series is not equal to the length of the array.');
        }
    },
    set_index: {
        label_uniq(label, index) {
            const res = index.trans(label);
            if (isArr(res))
                throw ('Label set in set_index function must be unique.');
        }
    },
    concat: {
        index: {
            uniq(index) {
                // console.log('aaa',index)
                if (!index.is_unique())
                    throw ('index of concatenated objects must be unique.');
            }
        }
    }
};
exports.check = check;
function _trans_neg(x, len) {
    const nonneg = len + x;
    return nonneg < 0 ? 0 : nonneg;
}
function _trans_rg(x, len) {
    //TODO support multiple colons like 0:5:2, ::-1
    check.iloc.str.colon(x);
    const splits = x.split(':');
    let start_str, end_str, step_str = '1';
    if (splits.length === 2) {
        [start_str, end_str] = splits;
    }
    else {
        [start_str, end_str, step_str] = splits;
    }
    step_str = step_str ? step_str : '1';
    let step = parseFloat(step_str);
    check.iloc.str.parsedStep(step);
    if (step > 0) {
        start_str = start_str ? start_str : '0';
        end_str = end_str ? end_str : len.toString();
        let [start, end] = [parseFloat(start_str),
            parseFloat(end_str)];
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
        const arr = [];
        let i = start;
        while (i < end) {
            arr.push(i);
            i += step;
        }
        return arr;
    }
    else {
        start_str = start_str ? start_str : len.toString();
        let end_str_null = false;
        if (!end_str) {
            end_str = '0';
            end_str_null = true;
        }
        let [start, end] = [parseFloat(start_str),
            parseFloat(end_str)];
        check.iloc.str.parsed(start, end);
        if (start < 0)
            start = _trans_neg(start, len);
        if (end < 0)
            end = _trans_neg(end, len);
        if (start <= end)
            return [];
        if (end >= (len - 1))
            return [];
        start = start > (len - 1) ? (len - 1) : start;
        const arr = [];
        let i = start;
        end = end_str_null ? -1 : end;
        while (i > end) {
            arr.push(i);
            i += step;
        }
        return arr;
    }
}
exports._trans_rg = _trans_rg;
function range(first, second, third) {
    if (second === undefined && third === undefined)
        return _trans_rg(`:${first}`, first);
    else if (third === undefined)
        return _trans_rg(`${first}:${second}`, second);
    else
        return _trans_rg(`${first}:${second}:${third}`, third > 0 ? second : (first + 1));
}
exports.range = range;
function _trans_iloc(idx, len) {
    switch (true) {
        case typeof idx === 'string':
            return _trans_rg(idx, len);
        case isNum(idx) && idx < 0:
            return idx + len;
        case isNumArr(idx):
            return idx.map(x => x < 0 ? x + len : x);
        default:
            return idx;
    }
}
exports._trans_iloc = _trans_iloc;
