"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.full = exports.from_raw = exports.concat = void 0;
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
            let indexName = ssArr[0].index.name;
            let name = ssArr[0].name;
            ssArr.forEach(ss => {
                idx = idx.concat(ss.index.values);
                vals = vals.concat(ss.values);
                indexName = indexName === ss.index.name ? indexName : '';
                name = name === ss.name ? name : '';
            });
            return new Series_1.default(vals, { index: new Index_1.default(idx, indexName),
                name: name });
        }
        else {
            let vals = [];
            let cols = [];
            let indexName = ssArr[0].index.name;
            ssArr.forEach((ss, i) => {
                util_1.check.concat.index.uniq(ss.index);
                indexName = indexName === ss.index.name ? indexName : '';
                if (i === 0) {
                    idx = ss.index.values;
                    vals = ss.values.map(x => [x]);
                }
                else {
                    const _idx = idx;
                    const _vals = vals;
                    vals = [];
                    idx = idx.length > 0 ?
                        _.intersection(idx, ss.index.values) : [];
                    if (idx.length > 0) {
                        // const sx = ss.loc(idx)
                        idx.forEach(label => {
                            const i = _idx.findIndex(x => x === label);
                            _vals[i].push(ss.loc(label));
                            vals.push(_vals[i]);
                        });
                    }
                }
                cols.push(ss.name);
            });
            return new DataFrame_1.default(vals, { index: new Index_1.default(idx, indexName),
                columns: cols });
        }
    }
    else if (sdArr[0] instanceof DataFrame_1.default) {
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
        let indexName;
        let columnsName;
        dfArr.forEach((df, i) => {
            const columns = getColumns(df);
            util_1.check.concat.index.uniq(columns);
            const index = getIndex(df);
            const values = getVals(df);
            indexName = i === 0 || indexName === index.name ? index.name : '';
            columnsName = i === 0 || columnsName === columns.name ? columns.name : '';
            if (i === 0) {
                idx = index.values;
                cols = columns.values;
                vals = values;
            }
            else {
                const _cols = cols;
                cols = _.intersection(cols, columns.values);
                vals = new DataFrame_1.default(vals, { columns: _cols })
                    .loc(null, cols).values;
                vals = axis === 0 ?
                    vals.concat(df.loc(null, cols).values) :
                    vals.concat(df.loc(cols).tr);
                idx = idx.concat(getIndex(df).values);
            }
        });
        const new_df = new DataFrame_1.default(vals, { index: new Index_1.default(idx, indexName), columns: new Index_1.default(cols, columnsName) });
        return axis === 0 ? new_df : new_df.transpose(true);
    }
    else
        throw Error('unsupported input type.');
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
function full(shape, fill_value) {
    // similar to numpy.full
    if (_.isArray(shape)) {
        return new Array(shape[0]).fill(new Array(shape[1]).fill(fill_value));
    }
    else
        return new Array(shape).fill(fill_value);
}
exports.full = full;
