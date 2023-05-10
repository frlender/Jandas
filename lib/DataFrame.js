"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var util_1 = require("./util");
var cmm_1 = require("./cmm");
var df_lib_1 = require("./df_lib");
var Index_1 = require("./Index");
var Series_1 = require("./Series");
var d3 = require("d3-array");
var _ = require("lodash");
var DataFrame = /** @class */ (function () {
    function DataFrame(arr, index, columns) {
        if (arr.length > 0 && !(0, util_1.isArr)(arr[0])) {
            columns = Object.keys(arr[0]);
            var _cols_1 = columns;
            arr = arr.map(function (obj) { return _cols_1.map(function (key) { return obj[key]; }); });
            index = index ? index : null;
        }
        arr = arr;
        if (columns === undefined && arr.length === 0)
            columns = [];
        if (columns === undefined)
            columns = arr[0].map(function (_, i) { return i; });
        if (index === null || index === undefined)
            index = arr.map(function (_, i) { return i; });
        this._index = index instanceof Index_1.default ?
            index : new Index_1.default(index);
        this._columns = columns instanceof Index_1.default ?
            columns : new Index_1.default(columns);
        this.shape = [this.index.shape, this.columns.shape];
        util_1.check.frame.index.set(arr.length, this.shape[0]);
        if (arr.length > 0)
            util_1.check.frame.index.set(arr[0].length, this.shape[1]);
        this.values = arr;
    }
    // https://stackoverflow.com/questions/17428587/transposing-a-2d-array-in-javascript
    DataFrame.prototype.__transpose = function (arr) { return arr[0].map(function (_, colIndex) { return arr.map(function (row) { return row[colIndex]; }); }); };
    DataFrame.prototype._transpose = function (arr) {
        if (arr.length === 0)
            return [];
        else
            return this.__transpose(arr);
    };
    Object.defineProperty(DataFrame.prototype, "tr", {
        get: function () {
            if (_.isUndefined(this._tr)) {
                if (this.values.length > 0)
                    this._tr = this._transpose(this.values);
                else {
                    this._tr = Array.from(Array(this.shape[1]).keys())
                        .map(function (_) { return []; });
                    // this.values = this._transpose(this.tr)
                }
            }
            return this._tr;
        },
        set: function (vals) {
            this._tr = vals;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DataFrame.prototype, "index", {
        get: function () {
            return this._index;
        },
        set: function (vals) {
            this._index = (0, cmm_1.setIndex)(vals, this.shape[0]);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DataFrame.prototype, "columns", {
        get: function () {
            return this._columns;
        },
        set: function (vals) {
            this._columns = (0, cmm_1.setIndex)(vals, this.shape[1]);
        },
        enumerable: false,
        configurable: true
    });
    DataFrame.prototype._p = function () {
        var _this = this;
        var lines = [];
        var corner = "".concat(this.index.name, "\\").concat(this.columns.name);
        lines.push(corner + '\t' + this.columns.values.map(function (x) { return x.toString(); }).join('\t'));
        // lines.push('\t'+this.columns.values.map(_=>'-').join('-'))
        var content = this.values.map(function (row, i) {
            var line = [];
            line.push(_this.index.values[i].toString());
            line = line.concat(row.map(function (x) { return JSON.stringify(x); }));
            return line.join('\t');
        });
        lines = lines.concat(content);
        console.log(lines.join('\n') + '\n' + 'DataFrame ' + "(".concat(this.shape, ")"));
    };
    DataFrame.prototype.p = function () {
        var corner = "".concat(this.index.name, "|").concat(this.columns.name);
        var df = this.reset_index(corner).reset_columns();
        console.table(df.values);
        console.log('DataFrame ' + "(".concat(this.shape, ")"));
    };
    DataFrame.prototype.transpose = function (inplace) {
        var _a, _b, _c;
        if (inplace === void 0) { inplace = false; }
        if (inplace) {
            _a = [this.tr, this.values], this.values = _a[0], this.tr = _a[1];
            _b = [this.shape[1], this.shape[0]], this.shape[0] = _b[0], this.shape[1] = _b[1];
            _c = [this.columns, this.index], this.index = _c[0], this.columns = _c[1];
            return this;
        }
        else {
            return new DataFrame((0, cmm_1.cp)(this.tr), this.columns.cp(), this.index.cp());
        }
    };
    DataFrame.prototype._iloc_asymmetric = function (v1, l1, l2, transpose, i1, i2) {
        // // TODO study function union types
        // type loc_fun_type = (a:T[] | T[][] | ns_arr, idx:boolean[] | number[]) => T[] | T[][] | ns_arr
        switch (true) {
            case (0, util_1.isNum)(i1) && i2 === undefined:
                util_1.check.iloc.num(i1, l1.shape);
                var i1x = i1;
                return new Series_1.default((0, cmm_1.cp)(v1[i1x]), l2.cp(), l1.values[i1x]);
            case (0, util_1.isNum)(i1) && (0, util_1.isArr)(i2):
                {
                    util_1.check.iloc.num(i1, l1.shape);
                    var i2x = i2;
                    var i1x_1 = i1;
                    var vec = v1[i1x_1];
                    var _a = (0, cmm_1.vec_loc2)(vec, l2.values, i2x), new_vec = _a[0], new_idx = _a[1];
                    var final_index = new Index_1.default(new_idx, l2.name);
                    return new Series_1.default(new_vec, final_index, l1.values[i1x_1]);
                }
            case (0, util_1.isArr)(i1) && i2 === undefined:
                {
                    var i1x_2 = i1;
                    var _b = (0, cmm_1.vec_loc2)(v1, l1.values, i1x_2), new_mat = _b[0], new_idx = _b[1];
                    var final_l1 = new Index_1.default(new_idx, l1.name);
                    var final_l2 = l2.cp();
                    var df = new DataFrame(new_mat, final_l1, final_l2);
                    return transpose ? df.transpose(true) : df;
                }
            default:
                return null;
        }
    };
    DataFrame.prototype._iloc_symmetric = function (ir, ic) {
        switch (true) {
            case ir == undefined && ic == undefined:
                var vals = this.values.map(function (r) { return (0, cmm_1.cp)(r); });
                return new DataFrame(vals, this.index.cp(), this.columns.cp());
            case (0, util_1.isNum)(ir) && (0, util_1.isNum)(ic):
                util_1.check.iloc.num(ir, this.shape[0]);
                util_1.check.iloc.num(ic, this.shape[1]);
                return this.values[ir][ic];
            case (0, util_1.isArr)(ir) && (0, util_1.isArr)(ic):
                var irx = ir;
                var icx_1 = ic;
                // inplace vec_loc for this.values
                var sub_vals = (0, cmm_1.vec_loc)(this.values, irx, function (x) { return x; });
                var final_vals = sub_vals.map(function (vec) { return (0, cmm_1.vec_loc)(vec, icx_1); });
                var final_index = new Index_1.default((0, cmm_1.vec_loc)(this.index.values, irx), this.index.name);
                var final_columns = new Index_1.default((0, cmm_1.vec_loc)(this.columns.values, icx_1), this.columns.name);
                return new DataFrame(final_vals, final_index, final_columns);
            default:
                return null;
        }
    };
    DataFrame.prototype.iloc = function (row, col) {
        if (row === null)
            row = undefined;
        if (col === null)
            col = undefined;
        row = (0, util_1._trans_iloc)(row, this.shape[0]);
        col = (0, util_1._trans_iloc)(col, this.shape[1]);
        var res;
        res = this._iloc_symmetric(row, col);
        // console.log('sym res',res)
        if (res !== null)
            return res;
        if (col === undefined || (0, util_1.isVal)(row)) {
            res = this._iloc_asymmetric(this.values, this.index, this.columns, false, row, col);
            // console.log('asym row res',res)
            if (res !== null)
                return res;
        }
        else {
            res = this._iloc_asymmetric(this.tr, this.columns, this.index, true, col, row);
            // console.log('asym col res',res)
            if (res !== null)
                return res;
        }
        throw ("input parameters for iloc might be wrong");
    };
    DataFrame.prototype.loc = function (row, col) {
        if (row === null)
            row = undefined;
        if (col === null)
            col = undefined;
        row = row;
        col = col;
        var num_row = (0, cmm_1._trans)(this.index, row);
        var num_col = (0, cmm_1._trans)(this.columns, col);
        return this.iloc(num_row, num_col);
    };
    DataFrame.prototype._iset_asymmetric = function (v1, l1, l2, i1, rpl, i2) {
        // // TODO study function union types
        // type loc_fun_type = (a:T[] | T[][] | ns_arr, idx:boolean[] | number[]) => T[] | T[][] | ns_arr
        switch (true) {
            case (0, util_1.isVal)(i1) && i2 === undefined:
                util_1.check.iloc.num(i1, l1.shape);
                util_1.check.iset.rpl.num(rpl, l2.shape);
                v1[i1] = rpl;
                break;
            case (0, util_1.isVal)(i1) && (0, util_1.isArr)(i2):
                {
                    util_1.check.iloc.num(i1, l1.shape);
                    util_1.check.iset.rpl.num(rpl, i2.length);
                    var i2x = i2;
                    var vec = v1[i1];
                    (0, cmm_1.vec_set)(vec, rpl, i2x);
                }
                break;
            case (0, util_1.isArr)(i1) && i2 === undefined:
                (0, cmm_1.vec_set)(v1, rpl, i1);
                break;
            default:
                return null;
        }
    };
    DataFrame.prototype._iset_symmetric = function (ir, ic, rpl) {
        switch (true) {
            case ir == undefined && ic == undefined:
                util_1.check.iset.rpl.mat(rpl, this.shape);
                this.values = rpl;
                this._tr = undefined;
                break;
            case (0, util_1.isVal)(ir) && (0, util_1.isVal)(ic):
                util_1.check.iloc.num(ir, this.shape[0]);
                util_1.check.iloc.num(ic, this.shape[1]);
                this.values[ir][ic] = rpl;
                if (!_.isUndefined(this._tr))
                    this.tr[ic][ir] = rpl;
                break;
            case (0, util_1.isArr)(ir) && (0, util_1.isArr)(ic):
                var sub_mat = (0, cmm_1.vec_loc)(this.values, ir, function (x) { return x; });
                sub_mat.forEach(function (vec, ix) {
                    (0, cmm_1.vec_set)(vec, rpl[ix], ic);
                });
                this._tr = undefined;
                break;
            default:
                return null;
        }
    };
    DataFrame.prototype._iset = function (row, col, rpl) {
        var res;
        res = this._iset_symmetric(row, col, rpl);
        // console.log('_iset_symmetric',res,row,col,rpl)
        if (res === null) {
            rpl = rpl;
            if (col === undefined || (0, util_1.isVal)(row)) {
                res = this._iset_asymmetric(this.values, this.index, this.columns, row, rpl, col);
                // console.log('_iset_asymmetric1',res)
                if (res === undefined)
                    this._tr = undefined;
            }
            else {
                if (rpl.length > 0 && (0, util_1.isArr)(rpl[0]))
                    rpl = this._transpose(rpl);
                res = this._iset_asymmetric(this.tr, this.columns, this.index, col, rpl, row);
                if (res === undefined)
                    this.values = this._transpose(this.tr);
            }
        }
        if (res === null)
            throw ('function failed. Please check the input for _iset');
    };
    DataFrame.prototype.iset = function (first, second, third) {
        if (second === undefined && third === undefined) {
            this._iset(undefined, undefined, first);
        }
        else if (third === undefined) {
            if (first === null)
                first = undefined;
            this._iset(first, undefined, second);
        }
        else {
            if (first === null)
                first = undefined;
            if (second === null)
                second = undefined;
            this._iset(first, second, third);
        }
    };
    DataFrame.prototype.set = function (first, second, third) {
        if (second === undefined && third === undefined) {
            this._iset(undefined, undefined, first);
        }
        else if (third === undefined) {
            if (first === null)
                first = undefined;
            if ((0, util_1.isVal)(first) && !this.index.has(first))
                //using set to add new row
                this.push(second, first, 0);
            else {
                // second = this._hdl_duplicate(first,this.index,second)
                var num_row = (0, cmm_1._trans)(this.index, first);
                this._iset(num_row, undefined, second);
            }
        }
        else {
            if (first === null)
                first = undefined;
            if (second === null)
                second = undefined;
            if (first === undefined && (0, util_1.isVal)(second) && !this.columns.has(second))
                //using set to add new column
                this.push(third, second, 1);
            else {
                // third = this._hdl_duplicate(second,this.columns,third)
                // third = this._hdl_duplicate(first,this.index,third)
                var num_row = (0, cmm_1._trans)(this.index, first);
                var num_col = (0, cmm_1._trans)(this.columns, second);
                this._iset(num_row, num_col, third);
            }
        }
    };
    DataFrame.prototype.push = function (val, name, axis) {
        if (name === void 0) { name = ''; }
        if (axis === void 0) { axis = 1; }
        if (axis === 0) {
            util_1.check.iset.rpl.num(val, this.shape[1]);
            this.values.push(val);
            this.index.values.push(name);
            this.shape[axis] += 1;
            if (!_.isUndefined(this._tr))
                this.tr.forEach(function (v, i) {
                    v.push(val[i]);
                });
        }
        else {
            util_1.check.iset.rpl.num(val, this.shape[0]);
            this.tr.push(val);
            this.columns.values.push(name);
            this.shape[axis] += 1;
            this.values.forEach(function (v, i) {
                v.push(val[i]);
            });
        }
    };
    DataFrame.prototype._insert = function (i1, l1, v1, rpl, name) {
        util_1.check.iloc.num(i1, l1.shape);
        v1.splice(i1, 0, rpl);
        l1.insert(i1, name);
    };
    DataFrame.prototype.insert = function (idx, val, name, axis) {
        if (name === void 0) { name = ''; }
        if (axis === void 0) { axis = 1; }
        if (axis === 0) {
            idx = idx < 0 ? this.shape[0] + idx : idx;
            this._insert(idx, this.index, this.values, val, name);
            this.shape[axis] += 1;
            this._tr = undefined;
        }
        else {
            idx = idx < 0 ? this.shape[1] + idx : idx;
            this._insert(idx, this.columns, this.tr, val, name);
            this.shape[axis] += 1;
            this.values = this._transpose(this.tr);
        }
    };
    DataFrame.prototype.drop = function (labels, axis) {
        var _this = this;
        if (axis === void 0) { axis = 1; }
        labels = (0, util_1.isArr)(labels) ? labels : [labels];
        var labels2 = labels;
        if (axis === 0) {
            var new_idx = (0, util_1.range)(this.index.shape).filter(function (i) { return !labels2.includes(_this.index.values[i]); });
            return this.iloc(new_idx);
        }
        else {
            var new_idx = (0, util_1.range)(this.columns.shape).filter(function (i) { return !labels2.includes(_this.columns.values[i]); });
            return this.iloc(null, new_idx);
        }
    };
    DataFrame.prototype.reset_index = function (name) {
        var df = new DataFrame((0, cmm_1.cp)(this.values), null, this.columns.cp());
        var val = this.index.values;
        name = name ? name : this.index.name;
        // workaround for val using "as T[]""
        // maybe there is a better way to 
        // handle this.
        df.insert(0, val, name, 1);
        return df;
    };
    DataFrame.prototype.reset_columns = function (name) {
        var df = new DataFrame((0, cmm_1.cp)(this.values), this.index.cp());
        var val = this.columns.values;
        name = name ? name : this.columns.name;
        // workaround for val using "as T[]""
        // maybe there is a better way to 
        // handle this.
        df.insert(0, val, name, 0);
        return df;
    };
    DataFrame.prototype.to_dict = function (axis) {
        if (axis === void 0) { axis = 1; }
        // similar to pandas DataFrame.to_dict('records')
        var vals_arr = axis === 1 ? this.values : this.tr;
        var index = axis === 1 ? this.columns : this.index;
        if (!index.is_unique())
            console.warn('The index is not unique. The output will only include the value of the last key among duplicated keys.');
        return vals_arr.map(function (vals) {
            var o = {};
            index.values.forEach(function (k, i) {
                o[k] = vals[i];
            });
            return o;
        });
    };
    DataFrame.prototype.b = function (expr, axis) {
        if (axis === void 0) { axis = 1; }
        // ["bc"] > 5 && [5] > 6
        var arr = [];
        (0, util_1.range)(expr.length).forEach(function (i) {
            var char = expr[i];
            if (char === '[' || char === ']') {
                arr.push(i);
            }
        });
        util_1.check.frame.b.expr(arr.length);
        // console.log(arr)
        var labels = [];
        var expr2 = expr;
        (0, util_1.range)(arr.length / 2).forEach(function (i) {
            var start = arr[i * 2];
            var end = arr[i * 2 + 1];
            // console.log(start,end)
            var pattern = expr.slice(start, end + 1);
            var labelx = expr.slice(start + 1, end);
            var label = labelx.trim();
            // differentiate loc [] from array []
            //https://stackoverflow.com/questions/881085/count-the-number-of-occurrences-of-a-character-in-a-string-in-javascript
            var dbl_quote_count = (label.match(/"/g) || []).length;
            var sgl_quote_count = (label.match(/'/g) || []).length;
            var quote_count = dbl_quote_count > sgl_quote_count ?
                dbl_quote_count : sgl_quote_count;
            if (label.includes(',') && (quote_count === 0 || quote_count > 2))
                return;
            // [element,] to represent an arry with one element.
            if (label[label.length - 1] === ',')
                return;
            // handle trailling white space in []
            if (label !== labelx)
                expr2 = expr.replaceAll(pattern, "[".concat(label, "]"));
            // console.log('a',label)
            label = label[0] === '"' || label[0] === "'" ?
                label.slice(1, label.length - 1) : parseInt(label);
            labels.push(label);
        });
        expr = expr2;
        // console.log(labels)
        var index = axis === 1 ? this.columns : this.index;
        var vals = axis === 1 ? this.values : this.tr;
        var num_idx = labels.map(function (x) {
            var indices = index.trans(x);
            // for duplicate index, use the last one as in pandas query function
            var idx = (0, util_1.isArr)(indices) ? indices[indices.length - 1] : indices;
            return idx;
        });
        labels.forEach(function (label, i) {
            var num = num_idx[i];
            var pattern = (0, util_1.isNum)(label) ?
                "[".concat(label, "]") : "[\"".concat(label, "\"]");
            var rpl = "v[".concat(num, "]");
            expr = expr.replaceAll(pattern, rpl);
        });
        var bidx = vals.map(function (v) { return eval(expr); });
        return bidx;
    };
    DataFrame.prototype.q = function (first, second) {
        var row_index = null;
        var col_index = null;
        switch (true) {
            case first !== null && second === undefined:
                row_index = this.b(first, 1);
                break;
            case first !== null && second === null:
                col_index = this.b(first, 0);
                break;
            case first === null:
                row_index = this.b(second, 1);
                break;
            default:
                row_index = this.b(second, 1);
                col_index = this.b(first, 0);
        }
        return this.loc(row_index, col_index);
    };
    DataFrame.prototype.iterrows = function (func) {
        var _this = this;
        this.index.values.forEach(function (k, i) {
            var row = _this.iloc(i);
            func(row, k, i);
        });
    };
    DataFrame.prototype.itercols = function (func) {
        var _this = this;
        this.columns.values.forEach(function (k, i) {
            var row = _this.iloc(null, i);
            func(row, k, i);
        });
    };
    DataFrame.prototype.groupby = function (first, second) {
        if (_.isUndefined(first) && _.isUndefined(second)) {
            return this._groupby(null, 1);
        }
        else if (_.isUndefined(second)) {
            return this._groupby(first, 1);
        }
        else {
            return this._groupby(first, second);
        }
    };
    DataFrame.prototype._groupby = function (labels, axis) {
        if (axis === void 0) { axis = 1; }
        var index = axis === 1 ? this.columns : this.index;
        var iter = axis === 1 ? this.iterrows : this.itercols;
        var _index = axis === 1 ? this.index : this.columns;
        var res = {};
        if (_.isNull(labels)) {
            iter.call(this, function (ss, k, i) {
                var karr = [k];
                var key = JSON.stringify(karr);
                if (!(key in res))
                    res[key] = [];
                res[key].push(i);
            });
        }
        else {
            labels = ((0, util_1.isArr)(labels) ? labels : [labels]);
            var idx_1 = index.trans(labels);
            iter.call(this, function (ss, k, i) {
                var karr = ss.iloc(idx_1).values;
                var key = JSON.stringify(karr);
                if (!(key in res))
                    res[key] = [];
                res[key].push(i);
            });
        }
        var then = new df_lib_1.GroupByThen(res, axis, this);
        return then;
    };
    DataFrame.prototype._sort_values = function (labels, ascending, axis) {
        if (ascending === void 0) { ascending = true; }
        if (axis === void 0) { axis = 1; }
        if (axis === 1) {
            if (_.isNull(labels)) {
                var idx = (0, df_lib_1._sortIndices)(this.index.values, ascending);
                return this.iloc(idx);
            }
            else {
                var sub = this.loc(null, labels);
                var idx = (0, df_lib_1._sortIndices)(sub.values, ascending);
                return this.iloc(idx);
            }
        }
        else {
            if (_.isNull(labels)) {
                var idx = (0, df_lib_1._sortIndices)(this.columns.values, ascending);
                return this.iloc(null, idx);
            }
            else {
                var sub = this.loc(labels);
                var idx = (0, df_lib_1._sortIndices)(sub.tr, ascending);
                return this.iloc(null, idx);
            }
        }
    };
    DataFrame.prototype.sort_values = function (labels, ascending, axis) {
        var _this = this;
        if (ascending === void 0) { ascending = true; }
        if (axis === void 0) { axis = 1; }
        var index = axis === 1 ? this.index : this.columns;
        var iloc = axis === 1 ?
            (function (idx) { return _this.iloc(idx); }) :
            (function (idx) { return _this.iloc(null, idx); });
        var loc = axis === 1 ?
            (function (labels) { return _this.loc(null, labels); }) :
            (function (labels) { return _this.loc(labels); });
        var subFun = axis === 1 ?
            (function (sub) { return sub.values; }) :
            (function (sub) { return sub.tr; });
        if (_.isNull(labels)) {
            var idx = (0, df_lib_1._sortIndices)(index.values, ascending);
            return iloc(idx);
        }
        else {
            var sub = loc(labels);
            if (sub instanceof (Series_1.default)) {
                var sub_1 = loc(labels);
                var idx = (0, df_lib_1._sortIndices)(sub_1.values, ascending);
                return iloc(idx);
            }
            else {
                var sub_2 = loc(labels);
                var idx = (0, df_lib_1._sortIndices)(subFun(sub_2), ascending);
                return iloc(idx);
            }
        }
    };
    DataFrame.prototype.op = function (opStr, second) {
        var _this = this;
        if (_.isUndefined(second)) {
            var vals = this.values.map(function (vec) { return vec.map(function (x) { return eval(opStr); }); });
            return new DataFrame(vals, this.index.cp(), this.columns.cp());
        }
        else if (second instanceof DataFrame) {
            util_1.check.op.index(this.index, second.index);
            var vals_1 = [];
            this.index.values.forEach(function (idx) {
                var sx = _this.loc(idx);
                var sy = second.loc(idx);
                var sz = sx.op(opStr, sy);
                vals_1.push(sz.values);
            });
            return new DataFrame(vals_1, this.index, this.columns);
        }
        else {
            util_1.check.op.values(this.index, second);
            util_1.check.op.values(this.columns, second[0]);
            var vals_2 = [];
            this.values.forEach(function (vec, i) {
                var vec2 = second[i];
                var vecNew = [];
                vec.forEach(function (x, j) {
                    var y = vec2[j];
                    vecNew.push(eval(opStr));
                });
                vals_2.push(vecNew);
            });
            return new DataFrame(vals_2, this.index, this.columns);
        }
    };
    DataFrame.prototype._reduce_num = function (func, axis) {
        if (axis === 1) {
            var vals = this.values.map(function (row) { return func(row); });
            return new Series_1.default(vals, this.index);
        }
        else {
            var vals = this.tr.map(function (col) { return func(col); });
            return new Series_1.default(vals, this.columns);
        }
    };
    DataFrame.prototype.min = function (axis) {
        if (axis === void 0) { axis = 0; }
        return this._reduce_num(d3.min, axis);
    };
    DataFrame.prototype.max = function (axis) {
        if (axis === void 0) { axis = 0; }
        return this._reduce_num(d3.max, axis);
    };
    DataFrame.prototype.sum = function (axis) {
        if (axis === void 0) { axis = 0; }
        return this._reduce_num(d3.sum, axis);
    };
    DataFrame.prototype.mean = function (axis) {
        if (axis === void 0) { axis = 0; }
        return this._reduce_num(d3.mean, axis);
    };
    DataFrame.prototype.median = function (axis) {
        if (axis === void 0) { axis = 0; }
        return this._reduce_num(d3.median, axis);
    };
    DataFrame.prototype.std = function (axis) {
        if (axis === void 0) { axis = 0; }
        return this._reduce_num(d3.deviation, axis);
    };
    DataFrame.prototype.var = function (axis) {
        if (axis === void 0) { axis = 0; }
        return this._reduce_num(d3.variance, axis);
    };
    DataFrame.prototype.mode = function (axis) {
        if (axis === void 0) { axis = 0; }
        return this._reduce_num(d3.mode, axis);
    };
    return DataFrame;
}());
exports.default = DataFrame;
