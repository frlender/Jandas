"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("./util");
const cmm_1 = require("./cmm");
const df_lib_1 = require("./df_lib");
const util2_1 = require("./util2");
const Index_1 = require("./Index");
const Series_1 = require("./Series");
const stat = require("simple-statistics");
const _ = require("lodash");
const ranks = require("@stdlib/stats-ranks");
const UNMET = Symbol();
class DataFrame {
    constructor(arr, options) {
        if (_.isUndefined(options))
            options = {};
        let columns;
        if (arr.length > 0 && !(0, util_1.isArr)(arr[0])) {
            columns = Object.keys(arr[0]);
            const _cols = columns;
            arr = arr.map(obj => _cols.map(key => obj[key]));
            // index = options && !_.isUndefined(options.index) ? 
            //         options.index : null
            options.columns = _cols;
        }
        let _arr = arr;
        let _options = options;
        _options = _.defaults(_options, { columns: _arr.length === 0 ? [] : _arr[0].map((_, i) => i),
            index: _arr.map((_, i) => i) });
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
    __transpose(arr) { return arr[0].map((_, colIndex) => arr.map(row => row[colIndex])); }
    _transpose(arr) {
        if (arr.length === 0)
            return [];
        else
            return this.__transpose(arr);
    }
    get tr() {
        if (_.isUndefined(this._tr)) {
            if (this.values.length > 0)
                this._tr = this._transpose(this.values);
            else {
                this._tr = Array.from(Array(this.shape[1]).keys())
                    .map(_ => []);
                // this.values = this._transpose(this.tr)
            }
        }
        return this._tr;
    }
    set tr(vals) {
        this._tr = vals;
    }
    get index() {
        return this._index;
    }
    get columns() {
        return this._columns;
    }
    _indexSetterEffect() {
        // interface
        // any side effects one may want to
        // invoke when index is set
    }
    set index(vals) {
        this._index = (0, cmm_1.setIndex)(vals, this.shape[0]);
        this._indexSetterEffect();
    }
    set columns(vals) {
        this._columns = (0, cmm_1.setIndex)(vals, this.shape[1]);
    }
    rename(labelMap, inplace = false) {
        if (inplace) {
            if (labelMap.index)
                (0, cmm_1._rename)(this.index, labelMap.index, true);
            if (labelMap.columns)
                (0, cmm_1._rename)(this.columns, labelMap.columns, true);
        }
        else {
            const [index, columns] = [this.index.cp(), this.columns.cp()];
            if (labelMap.index)
                (0, cmm_1._rename)(index, labelMap.index, true);
            if (labelMap.columns)
                (0, cmm_1._rename)(columns, labelMap.columns, true);
            return new DataFrame((0, cmm_1.cp)(this.values), { index, columns });
        }
    }
    _p() {
        let lines = [];
        const corner = `${this.index.name}|${this.columns.name}`;
        lines.push(corner + '\t' + this.columns.values.map(x => x.toString()).join('\t'));
        // lines.push('\t'+this.columns.values.map(_=>'-').join('-'))
        const content = this.values.map((row, i) => {
            let line = [];
            line.push(this.index.values[i].toString());
            line = line.concat(row.map(x => JSON.stringify(x)));
            return line.join('\t');
        });
        lines = lines.concat(content);
        console.log(lines.join('\n') + '\n' + 'DataFrame ' + `(${this.shape})`);
    }
    p() {
        const corner = `${this.index.name}|${this.columns.name}`;
        const df = this.reset_index(corner).reset_columns();
        console.table(df.values);
        console.log('DataFrame ' + `(${this.shape})`);
    }
    transpose(inplace = false) {
        if (inplace) {
            [this.values, this.tr] = [this.tr, this.values];
            [this.shape[0], this.shape[1]] = [this.shape[1], this.shape[0]];
            [this.index, this.columns] = [this.columns, this.index];
            return this;
        }
        else {
            return new DataFrame((0, cmm_1.cp)(this.tr), { index: this.columns.cp(), columns: this.index.cp() });
        }
    }
    _iloc_asymmetric(v1, l1, l2, transpose, i1, i2) {
        // // TODO study function union types
        // type loc_fun_type = (a:T[] | T[][] | ns_arr, idx:boolean[] | number[]) => T[] | T[][] | ns_arr
        switch (true) {
            case (0, util_1.isNum)(i1) && i2 === undefined:
                util_1.check.iloc.num(i1, l1.shape);
                const i1x = i1;
                return new Series_1.default((0, cmm_1.cp)(v1[i1x]), { index: l2.cp(), name: l1.values[i1x] });
            case (0, util_1.isNum)(i1) && (0, util_1.isArr)(i2):
                {
                    util_1.check.iloc.num(i1, l1.shape);
                    const i2x = i2;
                    const i1x = i1;
                    const vec = v1[i1x];
                    const [new_vec, new_idx] = (0, cmm_1.vec_loc2)(vec, l2.values, i2x);
                    const final_index = new Index_1.default(new_idx, l2.name);
                    return new Series_1.default(new_vec, { index: final_index, name: l1.values[i1x] });
                }
            case (0, util_1.isArr)(i1) && i2 === undefined:
                {
                    const i1x = i1;
                    const [new_mat, new_idx] = (0, cmm_1.vec_loc2)(v1, l1.values, i1x);
                    const final_l1 = new Index_1.default(new_idx, l1.name);
                    const final_l2 = l2.cp();
                    const df = new DataFrame(new_mat, { index: final_l1, columns: final_l2 });
                    return transpose ? df.transpose(true) : df;
                }
            default:
                return UNMET;
        }
    }
    // _iloc_symmetric(ir:number,ic:number):T
    // _iloc_symmetric(ir?:number[]|boolean[],ic?:number[]|boolean[]):DataFrame<T>|null
    _iloc_symmetric(ir, ic) {
        switch (true) {
            case ir == undefined && ic == undefined:
                const vals = this.values.map(r => (0, cmm_1.cp)(r));
                return new DataFrame(vals, { index: this.index.cp(),
                    columns: this.columns.cp() });
            case (0, util_1.isNum)(ir) && (0, util_1.isNum)(ic):
                util_1.check.iloc.num(ir, this.shape[0]);
                util_1.check.iloc.num(ic, this.shape[1]);
                return this.values[ir][ic];
            case (0, util_1.isArr)(ir) && (0, util_1.isArr)(ic):
                const irx = ir;
                const icx = ic;
                // inplace vec_loc for this.values
                const sub_vals = (0, cmm_1.vec_loc)(this.values, irx, (x) => x);
                const final_vals = sub_vals.map(vec => (0, cmm_1.vec_loc)(vec, icx));
                const final_index = new Index_1.default((0, cmm_1.vec_loc)(this.index.values, irx), this.index.name);
                const final_columns = new Index_1.default((0, cmm_1.vec_loc)(this.columns.values, icx), this.columns.name);
                return new DataFrame(final_vals, { index: final_index, columns: final_columns });
            default:
                return UNMET;
        }
    }
    iloc(row, col) {
        if (row === null)
            row = undefined;
        if (col === null)
            col = undefined;
        row = (0, util_1._trans_iloc)(row, this.shape[0]);
        col = (0, util_1._trans_iloc)(col, this.shape[1]);
        let res;
        res = this._iloc_symmetric(row, col);
        // console.log('sym res',res)
        if (res !== UNMET)
            return res;
        if (col === undefined || (0, util_1.isVal)(row)) {
            res = this._iloc_asymmetric(this.values, this.index, this.columns, false, row, col);
            // console.log('asym row res',res)
            if (res !== UNMET)
                return res;
        }
        else {
            res = this._iloc_asymmetric(this.tr, this.columns, this.index, true, col, row);
            // console.log('asym col res',res)
            if (res !== UNMET)
                return res;
        }
        throw (`input parameters for iloc might be wrong`);
    }
    loc(row, col) {
        if (row === null)
            row = undefined;
        if (col === null)
            col = undefined;
        row = row;
        col = col;
        const num_row = (0, cmm_1._trans)(this.index, row);
        const num_col = (0, cmm_1._trans)(this.columns, col);
        return this.iloc(num_row, num_col);
    }
    _iset_asymmetric(v1, l1, l2, i1, rpl, i2) {
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
                    const i2x = i2;
                    const vec = v1[i1];
                    (0, cmm_1.vec_set)(vec, rpl, i2x);
                }
                break;
            case (0, util_1.isArr)(i1) && i2 === undefined:
                (0, cmm_1.vec_set)(v1, rpl, i1);
                break;
            default:
                return UNMET;
        }
    }
    _iset_symmetric(ir, ic, rpl) {
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
                const sub_mat = (0, cmm_1.vec_loc)(this.values, ir, (x) => x);
                sub_mat.forEach((vec, ix) => {
                    (0, cmm_1.vec_set)(vec, rpl[ix], ic);
                });
                this._tr = undefined;
                break;
            default:
                return UNMET;
        }
    }
    _iset(row, col, rpl) {
        let res;
        res = this._iset_symmetric(row, col, rpl);
        // console.log('_iset_symmetric',res,row,col,rpl)
        if (res === UNMET) {
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
        if (res === UNMET)
            throw ('function failed. Please check the input for _iset');
    }
    iset(first, second, third) {
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
    }
    set(first, second, third) {
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
                const num_row = (0, cmm_1._trans)(this.index, first);
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
                const num_row = (0, cmm_1._trans)(this.index, first);
                const num_col = (0, cmm_1._trans)(this.columns, second);
                this._iset(num_row, num_col, third);
            }
        }
    }
    // push(val:T[],name:number|string='',axis:0|1=1){
    _push(val, { name = '', axis = 1 } = {}) {
        if (axis === 0) {
            util_1.check.iset.rpl.num(val, this.shape[1]);
            this.values.push(val);
            this.index.values.push(name);
            this.shape[axis] += 1;
            if (!_.isUndefined(this._tr))
                this.tr.forEach((v, i) => {
                    v.push(val[i]);
                });
        }
        else {
            util_1.check.iset.rpl.num(val, this.shape[0]);
            if (!_.isUndefined(this._tr))
                this.tr.push(val);
            this.columns.values.push(name);
            this.shape[axis] += 1;
            this.values.forEach((v, i) => {
                v.push(val[i]);
            });
        }
    }
    _series_push(val, options) {
        const label = options.axis === 0 ? 'columns' : 'index';
        if (JSON.stringify(val.index.values) ===
            JSON.stringify(this[label].values))
            this._push(val.values, options);
        else {
            if (this[label].is_unique()) {
                try {
                    val = val.loc(this[label].values);
                }
                catch (e) {
                    throw (`There are values in the DataFrame's ${label} that are not in the to be pushed Series' index.`);
                }
                if (val.shape > this[label].shape)
                    throw (`The series' index values that are indexed by the DataFrame's ${label} are not unique.`);
                this._push(val.values, options);
            }
            else {
                throw (`If the to be pushed Series' index does not match the DataFrame's ${label} exactly, the DataFrame's${label} must have only unique values.`);
            }
        }
    }
    push(val, options = {}) {
        if (val instanceof Series_1.default) {
            _.defaults(options, { name: val.name, axis: 1 });
            this._series_push(val, options);
        }
        else {
            _.defaults(options, { name: '', axis: 1 });
            this._push(val, options);
        }
    }
    _insert(i1, l1, v1, rpl, name) {
        util_1.check.iloc.num(i1, l1.shape);
        v1.splice(i1, 0, rpl);
        l1.insert(i1, name);
    }
    // insert(idx:number,val:T[],name:number|string='',axis:0|1=1){
    insert(idx, val, { name = '', axis = 1 } = {}) {
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
    }
    drop(labels, axis = 1) {
        labels = (0, util_1.isArr)(labels) ? labels : [labels];
        const labels2 = labels;
        if (axis === 0) {
            const new_idx = (0, util_1.range)(this.index.shape).filter(i => !labels2.includes(this.index.values[i]));
            return this.iloc(new_idx);
        }
        else {
            const new_idx = (0, util_1.range)(this.columns.shape).filter(i => !labels2.includes(this.columns.values[i]));
            return this.iloc(null, new_idx);
        }
    }
    drop_duplicates(labels, { keep = 'first', axis = 1 } = {}) {
        if (axis === 1) {
            const sub = this.loc(null, labels);
            const idx = (0, cmm_1.duplicated)(sub.values, keep);
            return this.loc(idx.map(x => !x));
        }
        else {
            let sub = this.loc(labels);
            if (sub instanceof DataFrame)
                sub = sub.transpose();
            const idx = (0, cmm_1.duplicated)(sub.values, keep);
            return this.loc(null, idx.map(x => !x));
        }
    }
    set_index(label) {
        util_1.check.set_index.label_uniq(label, this.columns);
        const vec = this.loc(null, label).values;
        const df = this.drop(label);
        //TODO: consider validate if vec is ns_arr
        df.index = new Index_1.default(vec, label);
        return df;
    }
    set_columns(label) {
        util_1.check.set_index.label_uniq(label, this.index);
        const vec = this.loc(label).values;
        const df = this.drop(label, 0);
        //TODO: consider validate if vec is ns_arr
        df.columns = new Index_1.default(vec, label);
        return df;
    }
    reset_index(name) {
        const df = new DataFrame((0, cmm_1.cp)(this.values), { columns: this.columns.cp() });
        const val = this.index.values;
        name = name ? name : this.index.name;
        // workaround for val using "as T[]""
        // maybe there is a better way to 
        // handle this.
        df.insert(0, val, { name: name, axis: 1 });
        return df;
    }
    reset_columns(name) {
        const df = new DataFrame((0, cmm_1.cp)(this.values), { index: this.index.cp() });
        const val = this.columns.values;
        name = name ? name : this.columns.name;
        // workaround for val using "as T[]""
        // maybe there is a better way to 
        // handle this.
        df.insert(0, val, { name: name, axis: 0 });
        return df;
    }
    to_dict(axis = 1) {
        // similar to pandas DataFrame.to_dict('records')
        const vals_arr = axis === 1 ? this.values : this.tr;
        const index = axis === 1 ? this.columns : this.index;
        if (!index.is_unique())
            console.warn('The index is not unique. The output will only include the value of the last key among duplicated keys.');
        return vals_arr.map(vals => {
            const o = {};
            index.values.forEach((k, i) => {
                o[k] = vals[i];
            });
            return o;
        });
    }
    bool(expr, axis = 1) {
        return this.b(expr, { axis: axis });
    }
    b(expr, options) {
        if (_.isUndefined(options))
            options = {};
        let { ctx = undefined, axis = 1 } = options;
        // ["bc"] > 5 && [5] > 6
        const arr = [];
        (0, util_1.range)(expr.length).forEach(i => {
            let char = expr[i];
            if (char === '[' || char === ']') {
                arr.push(i);
            }
        });
        util_1.check.frame.b.expr(arr.length);
        // console.log(arr)
        let labels = [];
        let expr2 = expr;
        (0, util_1.range)(arr.length / 2).forEach(i => {
            const start = arr[i * 2];
            const end = arr[i * 2 + 1];
            // console.log(start,end)
            const pattern = expr.slice(start, end + 1);
            const labelx = expr.slice(start + 1, end);
            let label = labelx.trim();
            // differentiate loc [] from array []
            //https://stackoverflow.com/questions/881085/count-the-number-of-occurrences-of-a-character-in-a-string-in-javascript
            const dbl_quote_count = (label.match(/"/g) || []).length;
            const sgl_quote_count = (label.match(/'/g) || []).length;
            const quote_count = dbl_quote_count > sgl_quote_count ?
                dbl_quote_count : sgl_quote_count;
            if (label.includes(',') && (quote_count === 0 || quote_count > 2))
                return;
            // [element,] to represent an arry with one element.
            if (label[label.length - 1] === ',')
                return;
            // handle trailling white space in []
            if (label !== labelx)
                expr2 = expr.replaceAll(pattern, `[${label}]`);
            // console.log('a',label)
            label = label[0] === '"' || label[0] === "'" ?
                label.slice(1, label.length - 1) : parseInt(label);
            labels.push(label);
        });
        expr = expr2;
        // console.log(labels)
        const index = axis === 1 ? this.columns : this.index;
        const vals = axis === 1 ? this.values : this.tr;
        const num_idx = labels.map(x => {
            const indices = index.trans(x);
            let idx;
            if ((0, util_1.isArr)(indices)) {
                // for duplicate index, use the last one as in pandas query function
                idx = indices[indices.length - 1];
                console.warn(`label ${x} is duplicated in the DataFrame's ${axis === 1 ? 'columns' : 'index'}. The last one is used.`);
            }
            else {
                idx = indices;
            }
            return idx;
        });
        labels.forEach((label, i) => {
            const num = num_idx[i];
            const pattern = (0, util_1.isNum)(label) ?
                `[${label}]` : `["${label}"]`;
            const rpl = `v[${num}]`;
            expr = expr.replaceAll(pattern, rpl);
        });
        const __ctx__ = options.ctx;
        const newExpr = (0, cmm_1.addCtx)(expr, __ctx__);
        // console.log(expr)
        // console.log(newExpr)
        const bidx = vals.map(v => eval(newExpr));
        return bidx;
    }
    query(first, second, third) {
        return this.q(first, second, third);
    }
    q(first, second, third) {
        let row_index = null;
        let col_index = null;
        if (_.isUndefined(second))
            row_index = this.b(first, { axis: 1 });
        else if (_.isUndefined(third)) {
            if (!_.isString(second) && second !== null)
                row_index = this.b(first, { axis: 1, ctx: second });
            else {
                const atPosArr = _.isString(first) ?
                    (0, df_lib_1.findUnquotedAt)(first) :
                    undefined;
                if (atPosArr && atPosArr.length > 0)
                    row_index = this.b(first, { axis: 1, ctx: second });
                else {
                    col_index = second === null ? null :
                        this.b(second, { axis: 0 });
                    row_index = first === null ? null :
                        this.b(first, { axis: 1 });
                }
            }
        }
        else {
            col_index = second === null ? null :
                this.b(second, { axis: 0, ctx: third });
            row_index = first === null ? null :
                this.b(first, { axis: 1, ctx: third });
        }
        // switch(true){
        //     case _.isUndefined(second):
        //         row_index = this.b(first as string,{axis:1})
        //         break
        //     case first !== null && second === null:
        //         col_index = this.b(first as string,0)
        //         break
        //     case first === null:
        //         row_index = this.b(second as string,1)
        //         break
        //     default:
        //         row_index = this.b(second as string,1)
        //         col_index = this.b(first as string,0)
        // }
        return this.loc(row_index, col_index);
    }
    _iter(indexType, func) {
        const accessor = (i) => indexType === 'index' ?
            this.iloc(i) :
            this.iloc(null, i);
        if (_.isUndefined(func)) {
            const self = this;
            function* iter() {
                let i = 0;
                const itemFunc = indexType === 'index' ?
                    (row, k, i) => ({ row: row, key: k, i: i }) :
                    (row, k, i) => ({ col: row, key: k, i: i });
                for (const k of self[indexType].values) {
                    const row = accessor(i);
                    yield [row, k, i];
                    i += 1;
                }
            }
            return iter();
        }
        else
            this[indexType].values.forEach((k, i) => {
                const row = accessor(i);
                func(row, k, i);
            });
    }
    iterrows(func) {
        if (_.isUndefined(func))
            return this._iter('index');
        else
            return this._iter('index', func);
    }
    itercols(func) {
        if (_.isUndefined(func))
            return this._iter('columns');
        else
            return this._iter('columns', func);
    }
    // groupby():GroupByThen<T>
    // groupby(labels:nsx|null):GroupByThen<T>
    // groupby(labels:nsx|null,axis:0|1):GroupByThen<T>
    groupby(labels, axis = 0) {
        if (_.isUndefined(labels)) {
            return this._groupby(null);
        }
        else
            return this._groupby(labels, axis);
    }
    _groupby(labels, axis = 0) {
        const index = axis === 0 ? this.columns : this.index;
        const iter = axis === 0 ? this.iterrows : this.itercols;
        const _index = axis === 0 ? this.index : this.columns;
        const res = {};
        if (_.isNull(labels)) {
            iter.call(this, (ss, k, i) => {
                const karr = [k];
                const key = JSON.stringify(karr);
                if (!(key in res))
                    res[key] = [];
                res[key].push(i);
            });
        }
        else {
            labels = ((0, util_1.isArr)(labels) ? labels : [labels]);
            iter.call(this, (ss, k, i) => {
                const karr = ss.loc(labels).values;
                const key = JSON.stringify(karr);
                if (!(key in res))
                    res[key] = [];
                res[key].push(i);
            });
        }
        const then = new df_lib_1.GroupByThen(res, axis, this, labels, index);
        return then;
    }
    // _sort_values(labels:nsx|null,ascending=true,axis:0|1=1){
    //     if(axis === 1){
    //         if(_.isNull(labels)){
    //             const idx = _sortIndices(this.index.values,
    //                 ascending)
    //             return this.iloc(idx)
    //         }else{
    //             //TODO: any
    //             const sub = this.loc(null,labels as any) as DataFrame<T>
    //             const idx = _sortIndices(sub.values,
    //                 ascending)
    //             return this.iloc(idx)
    //         }
    //     }else{
    //         if(_.isNull(labels)){
    //             const idx = _sortIndices(this.columns.values,
    //                 ascending)
    //             return this.iloc(null,idx)
    //         }else{
    //             //TODO: any
    //             const sub = this.loc(labels as any) as DataFrame<T>
    //             const idx = _sortIndices(sub.tr,
    //                 ascending)
    //             return this.iloc(null,idx)
    //         }
    //     }
    // }
    // sort_values(labels:nsx|null,ascending=true,axis:0|1=1){
    sort_values(labels, { ascending = true, axis = 1 } = {}) {
        const index = axis === 1 ? this.index : this.columns;
        const iloc = axis === 1 ?
            ((idx) => this.iloc(idx)) :
            ((idx) => this.iloc(null, idx));
        const loc = axis === 1 ?
            ((labels) => this.loc(null, labels)) :
            ((labels) => this.loc(labels));
        const subFun = axis === 1 ?
            ((sub) => sub.values) :
            ((sub) => sub.tr);
        if (_.isNull(labels)) {
            const idx = (0, df_lib_1._sortIndices)(index.values, false, ascending);
            return iloc(idx);
        }
        else {
            const sub = loc(labels);
            if (sub instanceof Series_1.default) {
                const sub2 = sub;
                const idx = (0, df_lib_1._sortIndices)(sub2.values, false, ascending);
                return iloc(idx);
            }
            else {
                const sub2 = sub;
                const idx = (0, df_lib_1._sortIndices)(subFun(sub2), true, ascending);
                return iloc(idx);
            }
        }
    }
    op(opStr, second) {
        if (_.isUndefined(second)) {
            let vals;
            if (_.isString(opStr))
                vals = this.values.map(vec => vec.map(x => eval(opStr)));
            else
                vals = this.values.map(vec => vec.map(x => opStr(x)));
            return new DataFrame(vals, { index: this.index.cp(),
                columns: this.columns.cp() });
        }
        else if (second instanceof DataFrame &&
            this.index.is_unique() &&
            second.index.is_unique()) {
            util_1.check.op.index(this.index, second.index);
            const vals = [];
            this.index.values.forEach((idx) => {
                const sx = this.loc(idx);
                const sy = second.loc(idx);
                const sz = sx.op(opStr, sy);
                vals.push(sz.values);
            });
            return new DataFrame(vals, { index: this.index,
                columns: this.columns });
        }
        else if (second instanceof DataFrame) {
            util_1.check.op.index(this.index, second.index);
            util_1.check.op.indexSame(this.index, second.index);
            const vals = [];
            this.index.values.forEach((e, idx) => {
                const sx = this.iloc(idx);
                const sy = second.iloc(idx);
                const sz = sx.op(opStr, sy);
                vals.push(sz.values);
            });
            return new DataFrame(vals, { index: this.index,
                columns: this.columns });
        }
        else {
            util_1.check.op.values(this.index, second);
            util_1.check.op.values(this.columns, second[0]);
            const vals = [];
            this.values.forEach((vec, i) => {
                const vec2 = second[i];
                const vecNew = [];
                vec.forEach((x, j) => {
                    const y = vec2[j];
                    vecNew.push(_.isString(opStr) ?
                        eval(opStr) : opStr(x, y));
                });
                vals.push(vecNew);
            });
            return new DataFrame(vals, { index: this.index,
                columns: this.columns });
        }
    }
    merge(df, { on = undefined, axis = 1 } = {}) {
        let leftDf;
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
        const res = (0, util2_1.concat)([leftDf, df], axis);
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
    }
    rank(options = {}) {
        options = _.defaults(options, { axis: 0 });
        if (options.axis === 0) {
            const rankMat = this.tr.map(vec => ranks(vec, options));
            const df = new DataFrame(rankMat, { index: this.columns.cp(),
                columns: this.index.cp() });
            df.transpose(true);
            return df;
        }
        else {
            const rankMat = this.values.map(vec => ranks(vec, options));
            const df = new DataFrame(rankMat, { index: this.index.cp(),
                columns: this.columns.cp() });
            return df;
        }
    }
    change(op_str, { periods = 1, axis = 0 } = {}) {
        if (axis === 1) {
            const diff = this.transpose().change(op_str, { periods: periods });
            return diff.transpose(true);
        }
        if (!Number.isInteger(periods))
            throw new Error('periods must be an integer');
        if (periods >= 1) {
            const later = this.iloc(`${periods}:`);
            const earlier = this.iloc(`:-${periods}`);
            const diff = later.op(op_str, earlier.values);
            const head = new DataFrame((0, util2_1.full)([periods, this.shape[1]], NaN), { index: this.index.values.slice(0, periods),
                columns: this.columns.cp() });
            return (0, util2_1.concat)([head, diff], 0);
        }
        else if (periods <= -1) {
            const earlier = this.iloc(`:${periods}`);
            const later = this.iloc(`${-periods}:`);
            const diff = earlier.op(op_str, later.values);
            const tail = new DataFrame((0, util2_1.full)([-periods, this.shape[1]], NaN), { index: this.index.values.slice(this.shape[0] + periods),
                columns: this.columns.cp() });
            return (0, util2_1.concat)([diff, tail], 0);
        }
        else
            return new DataFrame((0, util2_1.full)(this.shape, 0), { index: this.index.cp(), columns: this.columns.cp() });
    }
    diff({ periods = 1, axis = 0 } = {}) {
        return this.change('x-y', { periods, axis });
    }
    pct_change({ periods = 1, axis = 0 } = {}) {
        return this.change('(x-y)/y', { periods, axis });
    }
    rolling(window, { min_periods = undefined, center = false, closed = 'right', step = 1, axis = 0 } = {}) {
        if (axis === 0)
            return new df_lib_1.Rolling(this, window, min_periods, center, closed, step, axis);
        else
            return new df_lib_1.Rolling(this.transpose(), window, min_periods, center, closed, step, axis);
    }
    isna() {
        return this.op('_.isNil(x) || _.isNaN(x)');
    }
    // drop_duplicates_by_index(){
    //     return drop_duplicates_by_index(this)
    // }
    to_raw(copy = true) {
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
    }
    reduce(func, axis = 0) {
        if (axis === 1) {
            const vals = this.values.map(row => func(row));
            return new Series_1.default(vals, { index: this.index });
        }
        else {
            const vals = this.tr.map(col => func(col));
            return new Series_1.default(vals, { index: this.columns });
        }
    }
    _reduce_num(func, axis) {
        return this.reduce(func, axis);
    }
    min(axis = 0) {
        return this._reduce_num(stat.min, axis);
    }
    max(axis = 0) {
        return this._reduce_num(stat.max, axis);
    }
    sum(axis = 0) {
        return this._reduce_num(stat.sum, axis);
    }
    mean(axis = 0) {
        return this._reduce_num(stat.mean, axis);
    }
    median(axis = 0) {
        return this._reduce_num(stat.median, axis);
    }
    std(axis = 0) {
        return this._reduce_num(stat.sampleStandardDeviation, axis);
    }
    var(axis = 0) {
        return this._reduce_num(stat.sampleVariance, axis);
    }
    mode(axis = 0) {
        return this._reduce_num(stat.mode, axis);
    }
    prod(axis = 0) {
        return this._reduce_num(stat.product, axis);
    }
}
// const stat_methods = ['mean','sum','median',
//     ['std','sampleStandardDeviation'],
//     ['var','sampleVariance'],
//     'mode','min','max','prod'
// ]
// stat_methods.forEach(method=>{
//     DataFrame.prototype
//     // DataFrame<T>.prototype[method as string] = function(axis:0|1=0){
//     //     return this._reduce_num(stat[method],axis)
//     // }
// })
exports.default = DataFrame;
