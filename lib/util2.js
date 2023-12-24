"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.from_raw = exports.concat = void 0;
var Series_1 = require("./Series");
var DataFrame_1 = require("./DataFrame");
var Index_1 = require("./Index");
var util_1 = require("./util");
var _ = require("lodash");
function concat(sdArr, axis) {
    if (axis === void 0) { axis = 0; }
    if (sdArr[0] instanceof Series_1.default) {
        var idx_1 = [];
        var ssArr = sdArr;
        if (axis === 0) {
            var vals_1 = [];
            ssArr.forEach(function (ss) {
                idx_1 = idx_1.concat(ss.index.values);
                vals_1 = vals_1.concat(ss.values);
            });
            return new Series_1.default(vals_1, { index: idx_1 });
        }
        else {
            var vals_2 = [];
            var cols_1 = [];
            var emptyFlag_1 = false;
            ssArr.every(function (ss, i) {
                util_1.check.concat.index.uniq(ss.index);
                if (i === 0) {
                    idx_1 = ss.index.values;
                    vals_2 = ss.values.map(function (x) { return [x]; });
                }
                else {
                    var _idx_1 = idx_1;
                    var _vals_1 = vals_2;
                    vals_2 = [];
                    idx_1 = _.intersection(idx_1, ss.index.values);
                    if (idx_1.length === 0) {
                        emptyFlag_1 = true;
                        return false;
                    }
                    else {
                        // const sx = ss.loc(idx)
                        idx_1.forEach(function (label) {
                            var i = _idx_1.findIndex(function (x) { return x === label; });
                            _vals_1[i].push(ss.loc(label));
                            vals_2.push(_vals_1[i]);
                        });
                    }
                }
                cols_1.push(ss.name);
                return true;
            });
            if (emptyFlag_1)
                return new DataFrame_1.default([], { columns: ssArr.map(function (x) { return x.name; }) });
            return new DataFrame_1.default(vals_2, { index: idx_1, columns: cols_1 });
        }
    }
    else {
        var dfArr = sdArr;
        var getIndex_1 = axis === 0 ?
            function (x) { return x.index; } :
            function (x) { return x.columns; };
        var getColumns_1 = axis === 0 ?
            function (x) { return x.columns; } :
            function (x) { return x.index; };
        var getVals_1 = axis === 0 ?
            function (x) { return x.values; } :
            function (x) { return x.tr; };
        var idx_2 = [];
        var cols_2 = [];
        var vals_3 = [];
        var emptyFlag_2 = false;
        dfArr.every(function (df, i) {
            var columns = getColumns_1(df);
            util_1.check.concat.index.uniq(columns);
            var index = getIndex_1(df);
            var values = getVals_1(df);
            if (i === 0) {
                idx_2 = index.values;
                cols_2 = columns.values;
                vals_3 = values;
            }
            else {
                var _cols = cols_2;
                cols_2 = _.intersection(cols_2, columns.values);
                if (cols_2.length === 0) {
                    emptyFlag_2 = true;
                    return false;
                }
                else {
                    vals_3 = new DataFrame_1.default(vals_3, { columns: _cols })
                        .loc(null, cols_2).values;
                    vals_3 = axis === 0 ?
                        vals_3.concat(df.loc(null, cols_2).values) :
                        vals_3.concat(df.loc(cols_2).tr);
                    idx_2 = idx_2.concat(getIndex_1(df).values);
                }
            }
            return true;
        });
        if (emptyFlag_2) {
            idx_2 = [];
            dfArr.forEach(function (df) {
                idx_2 = idx_2.concat(getIndex_1(df).values);
            });
            // console.log('aaaa',idx)
            var new_df_1 = new DataFrame_1.default(idx_2.map(function (x) { return []; }), { index: idx_2 });
            return axis === 0 ? new_df_1 : new_df_1.transpose(true);
        }
        var new_df = new DataFrame_1.default(vals_3, { index: idx_2, columns: cols_2 });
        return axis === 0 ? new_df : new_df.transpose(true);
    }
}
exports.concat = concat;
function from_raw(data) {
    if (_.hasIn(data, 'index') && _.hasIn(data, 'name')) {
        var data2 = data;
        return new Series_1.default(data2.values, { name: data2.name,
            index: from_raw(data2.index) });
    }
    else if (!_.hasIn(data, 'columns')) {
        var data2 = data;
        return new Index_1.default(data2.values, data2.name);
    }
    else {
        var data2 = data;
        return new DataFrame_1.default(data2.values, {
            index: from_raw(data2.index),
            columns: from_raw(data2.columns)
        });
    }
}
exports.from_raw = from_raw;
