import * as core from './core'
import * as d3 from 'd3-array'

const range = core.range
const Index = core.Index

// const d3_methods_selected = ['min','max','mode',
//         'sum','mean','median','cumsum',
//         'variance','deviation']

class Series<T> extends core.Series<T>{
    min(){
        return d3.min(this.values as number[])
    }
    max(){
        return d3.max(this.values as number[])
    }
    sum(){
        return d3.sum(this.values as number[])
    }
    mean(){
        return d3.mean(this.values as number[])
    }
    mode(){
        return d3.mode(this.values as number[])
    }
    median(){
        return d3.median(this.values as number[])
    }
    // cumsum(){
    //     return d3.cumsum(this.values as number[])
    // }
    std(){
        return d3.deviation(this.values as number[])
    }
    var(){
        return d3.variance(this.values as number[])
    }
}

class DataFrame<T> extends core.DataFrame<T>{
    _reduce_num(func:(a:number[])=>number|undefined,axis:0|1){
        if(axis===1){
            const vals = this.values.map(row=>func(row as number[])) as number[]
            return new Series(vals,this.index)
        }else{
            const vals = this.tr.map(col=>func(col as number[])) as number[]
            return new Series(vals,this.columns)
        }
    }
    min(axis:0|1=0){
        return this._reduce_num(d3.min,axis)
    }
    max(axis:0|1=0){
        return this._reduce_num(d3.max,axis)
    }
    sum(axis:0|1=0){
        return this._reduce_num(d3.sum,axis)
    }
    mean(axis:0|1=0){
        return this._reduce_num(d3.mean,axis)
    }
    median(axis:0|1=0){
        return this._reduce_num(d3.median,axis)
    }
    std(axis:0|1=0){
        return this._reduce_num(d3.deviation,axis)
    }
    var(axis:0|1=0){
        return this._reduce_num(d3.variance,axis)
    }
    mode(axis:0|1=0){
        return this._reduce_num(d3.mode,axis)
    }
    // cumsum(axis:0|1=0){
    //     return this._reduce_num(d3.cumsum,axis)
    // }
}




export {DataFrame, Series, Index, range}