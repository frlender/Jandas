"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.range = exports.Index = exports.Series = exports.DataFrame = void 0;
var core = require("./core");
var d3 = require("d3-array");
var range = core.range;
exports.range = range;
var Index = core.Index;
exports.Index = Index;
// const d3_methods_selected = ['min','max','mode',
//         'sum','mean','median','cumsum',
//         'variance','deviation']
var Series = /** @class */ (function (_super) {
    __extends(Series, _super);
    function Series() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Series.prototype.min = function () {
        return d3.min(this.values);
    };
    Series.prototype.max = function () {
        return d3.max(this.values);
    };
    Series.prototype.sum = function () {
        return d3.sum(this.values);
    };
    Series.prototype.mean = function () {
        return d3.mean(this.values);
    };
    Series.prototype.mode = function () {
        return d3.mode(this.values);
    };
    Series.prototype.median = function () {
        return d3.median(this.values);
    };
    // cumsum(){
    //     return d3.cumsum(this.values as number[])
    // }
    Series.prototype.std = function () {
        return d3.deviation(this.values);
    };
    Series.prototype.var = function () {
        return d3.variance(this.values);
    };
    return Series;
}(core.Series));
exports.Series = Series;
var DataFrame = /** @class */ (function (_super) {
    __extends(DataFrame, _super);
    function DataFrame() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    DataFrame.prototype._reduce_num = function (func, axis) {
        if (axis === 1) {
            var vals = this.values.map(function (row) { return func(row); });
            return new Series(vals, this.index);
        }
        else {
            var vals = this.tr.map(function (col) { return func(col); });
            return new Series(vals, this.columns);
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
}(core.DataFrame));
exports.DataFrame = DataFrame;
