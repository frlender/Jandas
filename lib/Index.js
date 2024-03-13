"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var cmm_1 = require("./cmm");
var util_1 = require("./util");
var _ = require("lodash");
var Index = /** @class */ (function () {
    function Index(values, name) {
        this.name = name ? name : '';
        this.values = values;
    }
    Object.defineProperty(Index.prototype, "values", {
        get: function () {
            return this._values;
        },
        set: function (vals) {
            var self = this;
            this.__values = vals;
            this._values = new Proxy(vals, {
                set: function (target, k, v) {
                    // k will always be string here
                    // console.log(target,k,v)
                    if (k !== 'length') {
                        var kn = parseFloat(k);
                        util_1.check.index.set(kn, self.shape, v);
                        target[kn] = v;
                        self.remap();
                        self.shape = self._values.length;
                    }
                    else {
                        target[k] = v;
                    }
                    return true;
                }
            });
            this.remap();
            this.shape = this._values.length;
        },
        enumerable: false,
        configurable: true
    });
    Index.prototype.p = function () {
        var key_str = Array.from(this.values.keys()).join('\t');
        var val_str = this.values.join('\t');
        var name_str = this.name ? ' ' + this.name : '';
        var meta_str = "Index (".concat(this.shape, ")").concat(name_str);
        console.log(key_str + '\n' + val_str + '\n' + meta_str);
    };
    Index.prototype._add = function (k, i) {
        if (!this.mp.has(k))
            this.mp.set(k, i);
        else {
            var item = this.mp.get(k);
            if (!Array.isArray(item))
                this.mp.set(k, [item, i]);
            else
                item.push(i);
        }
    };
    Index.prototype.remap = function () {
        var _this = this;
        this.mp = new Map();
        this.values.forEach(function (k, i) {
            _this._add(k, i);
        });
    };
    Index.prototype.insert = function (idx, val) {
        // call splice on proxy will repetitively
        // run remap function.
        this.__values.splice(idx, 0, val);
        this.remap();
        this.shape += 1;
    };
    Index.prototype.cp = function () {
        return new Index((0, cmm_1.cp)(this.__values), this.name);
    };
    Index.prototype.has = function (idx) {
        return this.mp.has(idx);
    };
    Index.prototype.unique = function () {
        return Array.from(this.mp.keys());
    };
    Index.prototype.is_unique = function () {
        return this.mp.size === this.shape;
    };
    Index.prototype.check = function (idx) {
        if (!this.mp.has(idx))
            throw ("".concat(idx, " does not exist in index"));
    };
    Index.prototype.trans = function (index) {
        var _this = this;
        // translate index to primary number index
        if (!Array.isArray(index)) {
            this.check(index);
            return this.mp.get(index);
        }
        else {
            var arr_1 = [];
            index.forEach(function (k) {
                _this.check(k);
                var val = _this.trans(k);
                Array.isArray(val) ? arr_1.push.apply(arr_1, val) : arr_1.push(val);
            });
            return arr_1;
        }
    };
    Index.prototype.duplicated = function (keep) {
        if (keep === void 0) { keep = 'first'; }
        var mp = {};
        var arr = [];
        this.values.forEach(function (k, i) {
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
    Index.prototype.to_raw = function (copy) {
        copy = _.isUndefined(copy) ? true : copy;
        if (copy)
            return { values: (0, cmm_1.cp)(this.__values), name: this.name };
        else
            return { values: this.__values, name: this.name };
    };
    return Index;
}());
exports.default = Index;
