"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var util_1 = require("./util");
var cmm_1 = require("./cmm");
var df_lib_1 = require("./df_lib");
var util2_1 = require("./util2");
var Index_1 = require("./Index");
var Series_1 = require("./Series");
var stat = require("simple-statistics");
var _ = require("lodash");
var ranks = require("@stdlib/stats-ranks");
var DataFrame = /** @class */ (function () {
    function DataFrame(arr, options) {
        if (_.isUndefined(options))
            options = {};
        var columns;
        if (arr.length > 0 && !(0, util_1.isArr)(arr[0])) {
            columns = Object.keys(arr[0]);
            var _cols_1 = columns;
            arr = arr.map(function (obj) { return _cols_1.map(function (key) { return obj[key]; }); });
            // index = options && !_.isUndefined(options.index) ? 
            //         options.index : null
            options.columns = _cols_1;
        }
        var _arr = arr;
        var _options = options;
        _options = _.defaults(_options, { columns: _arr.length === 0 ? [] : _arr[0].map(function (_, i) { return i; }),
            index: _arr.map(function (_, i) { return i; }) });
        this._index = _options.index instanceof Index_1.default ?
            _options.index : new Index_1.default(_options.index);
        this._columns = _options.columns instanceof Index_1.default ?
            _options.columns : new Index_1.default(_options.columns);
        this.shape = [this.index.shape, this.columns.shape];
        util_1.check.frame.index.set(_arr.length, this.shape[0]);
        if (_arr.length > 0)
            util_1.check.frame.index.set(_arr[0].length, this.shape[1]);
        this.values = _arr;
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
            return new DataFrame((0, cmm_1.cp)(this.tr), { index: this.columns.cp(), columns: this.index.cp() });
        }
    };
    DataFrame.prototype._iloc_asymmetric = function (v1, l1, l2, transpose, i1, i2) {
        // // TODO study function union types
        // type loc_fun_type = (a:T[] | T[][] | ns_arr, idx:boolean[] | number[]) => T[] | T[][] | ns_arr
        switch (true) {
            case (0, util_1.isNum)(i1) && i2 === undefined:
                util_1.check.iloc.num(i1, l1.shape);
                var i1x = i1;
                return new Series_1.default((0, cmm_1.cp)(v1[i1x]), { index: l2.cp(), name: l1.values[i1x] });
            case (0, util_1.isNum)(i1) && (0, util_1.isArr)(i2):
                {
                    util_1.check.iloc.num(i1, l1.shape);
                    var i2x = i2;
                    var i1x_1 = i1;
                    var vec = v1[i1x_1];
                    var _a = (0, cmm_1.vec_loc2)(vec, l2.values, i2x), new_vec = _a[0], new_idx = _a[1];
                    var final_index = new Index_1.default(new_idx, l2.name);
                    return new Series_1.default(new_vec, { index: final_index, name: l1.values[i1x_1] });
                }
            case (0, util_1.isArr)(i1) && i2 === undefined:
                {
                    var i1x_2 = i1;
                    var _b = (0, cmm_1.vec_loc2)(v1, l1.values, i1x_2), new_mat = _b[0], new_idx = _b[1];
                    var final_l1 = new Index_1.default(new_idx, l1.name);
                    var final_l2 = l2.cp();
                    var df = new DataFrame(new_mat, { index: final_l1, columns: final_l2 });
                    return transpose ? df.transpose(true) : df;
                }
            default:
                return null;
        }
    };
    // _iloc_symmetric(ir:number,ic:number):T
    // _iloc_symmetric(ir?:number[]|boolean[],ic?:number[]|boolean[]):DataFrame<T>|null
    DataFrame.prototype._iloc_symmetric = function (ir, ic) {
        switch (true) {
            case ir == undefined && ic == undefined:
                var vals = this.values.map(function (r) { return (0, cmm_1.cp)(r); });
                return new DataFrame(vals, { index: this.index.cp(),
                    columns: this.columns.cp() });
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
                return new DataFrame(final_vals, { index: final_index, columns: final_columns });
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
                this.push(second, { name: first, axis: 0 });
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
                this.push(third, { name: second, axis: 1 });
            else {
                // third = this._hdl_duplicate(second,this.columns,third)
                // third = this._hdl_duplicate(first,this.index,third)
                var num_row = (0, cmm_1._trans)(this.index, first);
                var num_col = (0, cmm_1._trans)(this.columns, second);
                this._iset(num_row, num_col, third);
            }
        }
    };
    // push(val:T[],name:number|string='',axis:0|1=1){
    DataFrame.prototype.push = function (val, options) {
        if (_.isUndefined(options))
            options = {};
        var _a = _.defaults(options, { name: '', axis: 1 }), axis = _a.axis, name = _a.name;
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
    // insert(idx:number,val:T[],name:number|string='',axis:0|1=1){
    DataFrame.prototype.insert = function (idx, val, options) {
        if (_.isUndefined(options))
            options = {};
        var _a = _.defaults(options, { name: '', axis: 1 }), axis = _a.axis, name = _a.name;
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
    DataFrame.prototype.set_index = function (label) {
        util_1.check.set_index.label_uniq(label, this.columns);
        var vec = this.loc(null, label).values;
        var df = this.drop(label);
        //TODO: consider validate if vec is ns_arr
        df.index = new Index_1.default(vec, label);
        return df;
    };
    DataFrame.prototype.set_columns = function (label) {
        util_1.check.set_index.label_uniq(label, this.index);
        var vec = this.loc(label).values;
        var df = this.drop(label, 0);
        //TODO: consider validate if vec is ns_arr
        df.columns = new Index_1.default(vec, label);
        return df;
    };
    DataFrame.prototype.reset_index = function (name) {
        var df = new DataFrame((0, cmm_1.cp)(this.values), { columns: this.columns.cp() });
        var val = this.index.values;
        name = name ? name : this.index.name;
        // workaround for val using "as T[]""
        // maybe there is a better way to 
        // handle this.
        df.insert(0, val, { name: name, axis: 1 });
        return df;
    };
    DataFrame.prototype.reset_columns = function (name) {
        var df = new DataFrame((0, cmm_1.cp)(this.values), { index: this.index.cp() });
        var val = this.columns.values;
        name = name ? name : this.columns.name;
        // workaround for val using "as T[]""
        // maybe there is a better way to 
        // handle this.
        df.insert(0, val, { name: name, axis: 0 });
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
    DataFrame.prototype.bool = function (expr, axis) {
        if (axis === void 0) { axis = 1; }
        return this.b(expr, axis);
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
    DataFrame.prototype.query = function (first, second) {
        return _.isUndefined(second) ?
            this.q(first) :
            this.q(first, second);
    };
    DataFrame.prototype.q = function (first, second) {
        var row_index = null;
        var col_index = null;
        switch (true) {
            case first !== null && _.isUndefined(second):
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
                //TODO: any
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
                //TODO: any
                var sub = this.loc(labels);
                var idx = (0, df_lib_1._sortIndices)(sub.tr, ascending);
                return this.iloc(null, idx);
            }
        }
    };
    // sort_values(labels:nsx|null,ascending=true,axis:0|1=1){
    DataFrame.prototype.sort_values = function (labels, options) {
        var _this = this;
        if (_.isUndefined(options))
            options = {};
        var _a = _.defaults(options, { ascending: true, axis: 1 }), ascending = _a.ascending, axis = _a.axis;
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
            if (sub instanceof Series_1.default) {
                var sub2 = sub;
                var idx = (0, df_lib_1._sortIndices)(sub2.values, ascending);
                return iloc(idx);
            }
            else {
                var sub2 = sub;
                var idx = (0, df_lib_1._sortIndices)(subFun(sub2), ascending);
                return iloc(idx);
            }
        }
    };
    DataFrame.prototype.op = function (opStr, second) {
        var _this = this;
        if (_.isUndefined(second)) {
            var vals = this.values.map(function (vec) { return vec.map(function (x) { return eval(opStr); }); });
            return new DataFrame(vals, { index: this.index.cp(),
                columns: this.columns.cp() });
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
            return new DataFrame(vals_1, { index: this.index,
                columns: this.columns });
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
            return new DataFrame(vals_2, { index: this.index,
                columns: this.columns });
        }
    };
    DataFrame.prototype.merge = function (df, options) {
        if (_.isUndefined(options))
            options = {};
        var _a = _.defaults(options, { on: undefined, axis: 1 }), on = _a.on, axis = _a.axis;
        var leftDf;
        if (!_.isUndefined(on)) {
            if (axis === 1) {
                leftDf = this.set_index(on);
                df = df.set_index(on);
            }
            else {
                leftDf = this.set_columns(on);
                df = df.set_columns(on);
            }
        }
        else {
            leftDf = this;
        }
        // console.log('aaa',leftDf,df)
        var res = (0, util2_1.concat)([leftDf, df], axis);
        // console.log('aaa',res)
        if (_.isUndefined(on))
            return res;
        else {
            if (axis === 1) {
                res.index.name = on;
                return res.reset_index();
            }
            else {
                res.columns.name = on;
                return res.reset_columns();
            }
        }
    };
    DataFrame.prototype.rank = function (options) {
        if (_.isUndefined(options))
            options = {};
        options = _.defaults(options, { axis: 0 });
        if (options.axis === 0) {
            var rankMat = this.tr.map(function (vec) {
                return ranks(vec, options);
            });
            var df = new DataFrame(rankMat, { index: this.columns.cp(),
                columns: this.index.cp() });
            df.transpose(true);
            return df;
        }
        else {
            var rankMat = this.values.map(function (vec) {
                return ranks(vec, options);
            });
            var df = new DataFrame(rankMat, { index: this.index.cp(),
                columns: this.columns.cp() });
            return df;
        }
    };
    // drop_duplicates_by_index(){
    //     return drop_duplicates_by_index(this)
    // }
    DataFrame.prototype.to_raw = function (copy) {
        if (copy === void 0) { copy = true; }
        // copy = _.isUndefined(copy) ? true : copy
        if (copy)
            return { values: (0, cmm_1.cp)(this.values),
                index: this.index.to_raw(),
                columns: this.index.to_raw()
            };
        else
            return { values: this.values,
                index: this.index.to_raw(copy),
                columns: this.index.to_raw(copy)
            };
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
        return this._reduce_num(stat.min, axis);
    };
    DataFrame.prototype.max = function (axis) {
        if (axis === void 0) { axis = 0; }
        return this._reduce_num(stat.max, axis);
    };
    DataFrame.prototype.sum = function (axis) {
        if (axis === void 0) { axis = 0; }
        return this._reduce_num(stat.sum, axis);
    };
    DataFrame.prototype.mean = function (axis) {
        if (axis === void 0) { axis = 0; }
        return this._reduce_num(stat.mean, axis);
    };
    DataFrame.prototype.median = function (axis) {
        if (axis === void 0) { axis = 0; }
        return this._reduce_num(stat.median, axis);
    };
    DataFrame.prototype.std = function (axis) {
        if (axis === void 0) { axis = 0; }
        return this._reduce_num(stat.sampleStandardDeviation, axis);
    };
    DataFrame.prototype.var = function (axis) {
        if (axis === void 0) { axis = 0; }
        return this._reduce_num(stat.sampleVariance, axis);
    };
    DataFrame.prototype.mode = function (axis) {
        if (axis === void 0) { axis = 0; }
        return this._reduce_num(stat.mode, axis);
    };
    return DataFrame;
}());
exports.default = DataFrame;
