// util functions
import DataFrame from "./DataFrame"
import * as _ from 'lodash'
import {range} from './util'
import {concat} from './util2'

import {ns_arr,Obj,GP} from './interfaces'

import * as stat from 'simple-statistics'
import Series from './Series'
import Index from './Index'

class GroupByThen<T> implements Iterable<[DataFrame<T>,T|T[],number]>{
    gp:GP
    axis:0|1
    df:DataFrame<T>
    labels: ns_arr|null
    index: Index
    constructor(gp:GP,axis:0|1,df:DataFrame<T>,
        labels:ns_arr|null,index:Index
    ){
        this.gp = gp
        this.axis = axis
        this.df = df
        this.labels = labels
        this.index = index
    }

    private _get_keep_labels(){
        return _.difference(this.index.values,this.labels as ns_arr)
    }
    // _get_remain_df(){
    //     const df = this.df
    //     this.rf = _.isNull(this.labels) ? df :
    //         (this.axis === 0 ? 
    //             df.loc(null,_.difference(this.index.values,this.labels)) :
    //             df.loc(_.difference(this.index.values,this.labels)))
    // }

    private _prepare(key:string,val:number[]){
        const karr = JSON.parse(key) as T[]
        const k = karr.length === 1 ? karr[0] : karr
        const sub = this.axis === 0 ? 
            this.df.iloc(val) : this.df.iloc(null,val)
        return {sub:sub as DataFrame<T>,k:k}
    }

    then(func:(group:DataFrame<T>,key:T | T[],
        i:number)=>void){
        let i = 0
        _.forOwn(this.gp,(val,key)=>{
            const {sub,k} = this._prepare(key,val)
            func(sub,k,i)
            i += 1
        })
    }

    [Symbol.iterator]() {
        const self = this
        function* iter():Generator<[DataFrame<T>,T|T[],number]>{
            let i = 0
            for(const [key,val] of Object.entries(self.gp)){
                const {sub,k} = self._prepare(key,val)
                yield [sub as DataFrame<T>, k, i]
                i += 1
            }
        }
        return iter()
     }

     reduce(func:(a:T[])=>T){
        const keep_labels = _.isNull(this.labels) ?
            null : this._get_keep_labels()
        const get_keep = _.isNull(keep_labels) ?
            (x:Series<T>)=>x : 
            (x:Series<T>)=>x.loc(keep_labels)
        const arr = []
        for(const [gp,key] of this){
            let ss = gp.reduce(func,this.axis)
            // console.log(gp,key,keep_labels,ss)
            if(_.isString(key) || _.isNumber(key))
                ss.name = key
            else
                ss.name = JSON.stringify(key)
            ss = get_keep(ss)
            arr.push(ss)
        }
        const res = concat(arr,1)
        return this.axis === 0 ? res.transpose() : res
     }

    private  _reduce_num(func:(a:number[])=>number){
        return this.reduce(func as any) as any as Series<number>
     }

    min(){
        return this._reduce_num(stat.min)
    }
    max(){
        return this._reduce_num(stat.max)
    }
    sum(){
        return this._reduce_num(stat.sum)
    }
    mean(){
        return this._reduce_num(stat.mean)
    }
    median(){
        return this._reduce_num(stat.median)
    }
    std(){
        return this._reduce_num(stat.sampleStandardDeviation)
    }
    var(){
        return this._reduce_num(stat.sampleVariance)
    }
    mode(){
        return this._reduce_num(stat.mode)
    }
    prod(){
        return this._reduce_num(stat.product)
    }

}

function _sortIndices<S>(arr:S[]|S[][],multiple:boolean,ascending:boolean|boolean[]){
    // const flag = ascending ? 1:-1
    const _cmp = (a:S,b:S,flag:1|-1)=>{
        // const a = arr[aidx]
        // const b = arr[bidx]
        if(a===b){
            return 0
        }else{
            if(_.isNumber(a) && _.isNumber(b)){
                return (a-b)*flag
            }else{
                if(a < b){
                    return -1*flag
                }else{
                    return flag
                }
            }
        }
    }
    const idx = range(arr.length)
    if(multiple){
        const cmp = (a1:number,a2:number)=>{
            const ax = arr[a1] as S[]
            const bx = arr[a2] as S[]
            let res:number=0;
            for(let i=0; i<ax.length; i++){
                const ascending_i = _.isArray(ascending) ? ascending[i] : ascending
                const flag = ascending_i ? 1:-1
                res = _cmp(ax[i],bx[i],flag)
                if(res !== 0){
                    break
                }
            }
            return res
        }
        return idx.sort(cmp)
    }else{
        const cmp = (a1:number,a2:number)=>{
            ascending = _.isArray(ascending) ? ascending[0] : ascending
            const flag = ascending ? 1:-1
            return _cmp(arr[a1] as S,arr[a2] as S,flag)
        }
        return idx.sort(cmp)
    }
}

function findUnquotedAt(str:string) {
    let inQuotes = false;
    let quoteType = null;
    const positions = [];

    for (let i = 0; i < str.length; i++) {
        const char = str[i];

        if (char === '"' || char === "'") {
            if (!inQuotes) {
                inQuotes = true;
                quoteType = char;
            } else if (char === quoteType) {
                inQuotes = false;
            }
        } else if (char === '@' &&!inQuotes) {
            positions.push(i);
        }
    }

    return positions;
}

export {Obj,GP,GroupByThen,_sortIndices, findUnquotedAt}
