"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.from_raw = exports.concat = void 0;
const Series_1 = require("./Series");
const DataFrame_1 = require("./DataFrame");
const Index_1 = require("./Index");
const util_1 = require("./util");
const _ = require("lodash");
function concat(sdArr, axis = 0) {
    if (sdArr[0] instanceof Series_1.default) {
        let idx = [];
        const ssArr = sdArr;
        if (axis === 0) {
            let vals = [];
            ssArr.forEach(ss => {
                idx = idx.concat(ss.index.values);
                vals = vals.concat(ss.values);
            });
            return new Series_1.default(vals, { index: idx });
        }
        else {
            let vals = [];
            let cols = [];
            let emptyFlag = false;
            ssArr.every((ss, i) => {
                util_1.check.concat.index.uniq(ss.index);
                if (i === 0) {
                    idx = ss.index.values;
                    vals = ss.values.map(x => [x]);
                }
                else {
                    const _idx = idx;
                    const _vals = vals;
                    vals = [];
                    idx = _.intersection(idx, ss.index.values);
                    if (idx.length === 0) {
                        emptyFlag = true;
                        return false;
                    }
                    else {
                        // const sx = ss.loc(idx)
                        idx.forEach(label => {
                            const i = _idx.findIndex(x => x === label);
                            _vals[i].push(ss.loc(label));
                            vals.push(_vals[i]);
                        });
                    }
                }
                cols.push(ss.name);
                return true;
            });
            if (emptyFlag)
                return new DataFrame_1.default([], { columns: ssArr.map(x => x.name) });
            return new DataFrame_1.default(vals, { index: idx, columns: cols });
        }
    }
    else {
        const dfArr = sdArr;
        const getIndex = axis === 0 ?
            (x) => x.index :
            (x) => x.columns;
        const getColumns = axis === 0 ?
            (x) => x.columns :
            (x) => x.index;
        const getVals = axis === 0 ?
            (x) => x.values :
            (x) => x.tr;
        let idx = [];
        let cols = [];
        let vals = [];
        let emptyFlag = false;
        dfArr.every((df, i) => {
            const columns = getColumns(df);
            util_1.check.concat.index.uniq(columns);
            const index = getIndex(df);
            const values = getVals(df);
            if (i === 0) {
                idx = index.values;
                cols = columns.values;
                vals = values;
            }
            else {
                const _cols = cols;
                cols = _.intersection(cols, columns.values);
                if (cols.length === 0) {
                    emptyFlag = true;
                    return false;
                }
                else {
                    vals = new DataFrame_1.default(vals, { columns: _cols })
                        .loc(null, cols).values;
                    vals = axis === 0 ?
                        vals.concat(df.loc(null, cols).values) :
                        vals.concat(df.loc(cols).tr);
                    idx = idx.concat(getIndex(df).values);
                }
            }
            return true;
        });
        if (emptyFlag) {
            idx = [];
            dfArr.forEach(df => {
                idx = idx.concat(getIndex(df).values);
            });
            // console.log('aaaa',idx)
            const new_df = new DataFrame_1.default(idx.map(x => []), { index: idx });
            return axis === 0 ? new_df : new_df.transpose(true);
        }
        const new_df = new DataFrame_1.default(vals, { index: idx, columns: cols });
        return axis === 0 ? new_df : new_df.transpose(true);
    }
}
exports.concat = concat;
function from_raw(data) {
    if (_.hasIn(data, 'index') && _.hasIn(data, 'name')) {
        const data2 = data;
        return new Series_1.default(data2.values, { name: data2.name,
            index: from_raw(data2.index) });
    }
    else if (!_.hasIn(data, 'columns')) {
        const data2 = data;
        return new Index_1.default(data2.values, data2.name);
    }
    else {
        const data2 = data;
        return new DataFrame_1.default(data2.values, {
            index: from_raw(data2.index),
            columns: from_raw(data2.columns)
        });
    }
}
exports.from_raw = from_raw;
