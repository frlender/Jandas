"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cmm_1 = require("./cmm");
const util_1 = require("./util");
const _ = require("lodash");
class Index {
    constructor(values, name) {
        this.name = name ? name : '';
        this.values = values;
    }
    get values() {
        return this._values;
    }
    set values(vals) {
        const self = this;
        this.__values = vals;
        this._values = new Proxy(vals, {
            set(target, k, v) {
                // k will always be string here
                // console.log(target,k,v)
                if (k !== 'length') {
                    const kn = parseFloat(k);
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
    }
    p() {
        const key_str = Array.from(this.values.keys()).join('\t');
        const val_str = this.values.join('\t');
        const name_str = this.name ? ' ' + this.name : '';
        const meta_str = `Index (${this.shape})${name_str}`;
        console.log(key_str + '\n' + val_str + '\n' + meta_str);
    }
    _add(k, i) {
        if (!this.mp.has(k))
            this.mp.set(k, i);
        else {
            const item = this.mp.get(k);
            if (!Array.isArray(item))
                this.mp.set(k, [item, i]);
            else
                item.push(i);
        }
    }
    remap() {
        this.mp = new Map();
        this.values.forEach((k, i) => {
            this._add(k, i);
        });
    }
    insert(idx, val) {
        // call splice on proxy will repetitively
        // run remap function.
        this.__values.splice(idx, 0, val);
        this.remap();
        this.shape += 1;
    }
    cp() {
        return new Index((0, cmm_1.cp)(this.__values), this.name);
    }
    has(idx) {
        return this.mp.has(idx);
    }
    unique() {
        return Array.from(this.mp.keys());
    }
    is_unique() {
        return this.mp.size === this.shape;
    }
    check(idx) {
        if (!this.mp.has(idx))
            throw (`${idx} does not exist in index`);
    }
    trans(index) {
        // translate index to primary number index
        if (!Array.isArray(index)) {
            this.check(index);
            return this.mp.get(index);
        }
        else {
            const arr = [];
            index.forEach(k => {
                this.check(k);
                const val = this.trans(k);
                Array.isArray(val) ? arr.push(...val) : arr.push(val);
            });
            return arr;
        }
    }
    duplicated(keep = 'first') {
        return (0, cmm_1.duplicated)(this.values, keep);
    }
    to_raw(copy) {
        copy = _.isUndefined(copy) ? true : copy;
        if (copy)
            return { values: (0, cmm_1.cp)(this.__values), name: this.name };
        else
            return { values: this.__values, name: this.name };
    }
}
exports.default = Index;
