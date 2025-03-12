import {isNum, isArr,isVal,isNumArr,isStrArr,
    _trans_iloc, check, isStr, range} from './util'

import {vec_loc,vec_loc2,
    vec_set,cp,_str,_trans,setIndex,
    duplicated,_rename,
    addCtx} from './cmm'


import {ns,ns_arr,numx,nsx,locParamArr,SeriesInitOptions,
 SeriesRankOptions} from './interfaces'

import { _sortIndices } from './df_lib'
import Index from './Index'
import DataFrame from './DataFrame'

import * as stat from 'simple-statistics'
import * as _ from 'lodash'
import ranks = require('@stdlib/stats-ranks')

class Series<T>{
    values: T[]
    private _index: Index
    shape: number
    private _name: string | number
    constructor(values: T[])
    constructor(values: T[], options:SeriesInitOptions)
    constructor(values: T[], options?:SeriesInitOptions)
    constructor(first: T[], second?:SeriesInitOptions){
        if(_.isUndefined(second))
            second = {}
        second = _.defaults(second,
            {name:'',index:new Index(first.map((_,i)=>i))})
        this.values = first
        this.shape = this.values.length
        this._name = second.name!
        this._index = second.index! instanceof Index ? 
            second.index! : new Index(second.index!)
    }

    get index():Index{
        return this._index
    }

    set index(vals: ns_arr|Index){
        this._index = setIndex(vals,this.shape)
    }

    get name():string|number{
        return this._name
    }

    set name(val:string|number){
        this._name = val
        // this.nameSetterEffect()
    }

    rename(labelMap:{[key:ns]:ns},inplace:true):void
    rename(labelMap:{[key:ns]:ns},inplace:false):Series<T>
    rename(labelMap:{[key:ns]:ns},inplace?:boolean):void|Series<T>
    rename(labelMap:{[key:ns]:ns},inplace:boolean=false):void|Series<T>{
       if(inplace)
            _rename(this.index,labelMap,true)
        else{
            const index = _rename(this.index,labelMap,false)
            return new Series(cp(this.values),
                {index,name:this.name})
        }
    }

    p(){
        const name_str = this.name ? ' '+this.name : ''
        console.log(this.index.values.map(x=>x.toString()).join('\t') + '\n' +
        this.values.map(x=>_str(x)).join('\t') + '\n' +
        `Series (${this.shape})${name_str}`)
    }

    _iloc(idx:number):T
    _iloc(idx:undefined|number[]|boolean[]):Series<T>
    _iloc(idx?: numx | boolean[]):T|Series<T>
    _iloc(idx?: numx | boolean[]){
        switch(true){
            case idx === undefined:
                return new Series(cp(this.values),
                    {index:this.index.cp(),name:this.name})
            case isNum(idx):
                check.iloc.num(idx as number, this.shape)
                return this.values[idx as number]
            default:
                const [vec,new_idx] = vec_loc2(this.values,
                    this.index.values,idx as number[] | boolean[])
                const new_index = new Index(new_idx,this.index.name)
                return new Series(vec,{index:new_idx,name:this.name})
        }
    }

    iloc(idx:number):T
    iloc(idx?:string|number[]|boolean[]):Series<T>
    iloc(idx?: string | numx | boolean[]):T|Series<T>
    iloc(idx?: string | numx | boolean[]):T|Series<T>{
        idx = _trans_iloc(idx,this.shape)
        return this._iloc(idx)
    }


    loc(index:number|string): T|Series<T>
    loc(index?:locParamArr): Series<T>
    loc(index?: (number|string)|locParamArr):T|Series<T>
    loc(index?: (number|string)|locParamArr):T|Series<T>{        
        let num_idx:numx | undefined | boolean[]
        if(_.isNumber(index)||_.isString(index))
            num_idx = _trans(this.index,index)
        else
            num_idx = _trans(this.index,index)
        
        if(_.isNumber(num_idx))
            return this._iloc(num_idx)
        else
            return this._iloc(num_idx)
    }

    
    _iset(idx: undefined | numx | boolean[], values: T| T[]){
        switch(true){
            case idx === undefined:
                check.iset.rpl.num(values,this.shape)
                this.values = cp(values as T[])
                break
            case isVal(idx):
                check.iloc.num(idx as number, this.shape)
                this.values[idx as number] = values as T
                break
            default:
                vec_set(this.values,values as T[],idx as number[] | boolean[])
        }
    }

    iset(rpl:T[]):void
    iset(index:number,rpl:T):void
    iset(index:string|number[]|boolean[],rpl:T[]):void
    iset(first:T[]|string|numx|boolean[],second?:T|T[]):void
    iset(first:any, second?:T|T[]):void{
        if(second===undefined){
            this._iset(undefined, first)
        }else{
            first = _trans_iloc(first,this.shape)
            this._iset(first,second)
        }
    }
    
    set(rpl:T[]):void
    set(idx:string|number,rpl:T|T[]):void
    set(idx:locParamArr,rpl:T[]):void
    set(first:T[]|string|numx|locParamArr,second?:T|T[]):void
    set(first: any, second?: T|T[]){
        if(second===undefined){
            this._iset(undefined, first)
        }else{
            if(isVal(first)&&!this.index.has(first))
                this.push(second as T,first)
            else{
                if(first instanceof Index || 
                    first instanceof Series)
                    first = first.values
                
                // differs from pandas with the following
                // code annotated. See Series.test.tsx 
                // line 320.
                // if(isNumArr(first)|| isStrArr(first))
                //     check.set.index.uniq(this.index)
                
                if(isNum(first) || isStr(first)){
                    const pos = this.index.mp.get(first)
                    if(isArr(pos) && !isArr(second)){
                        second = Array.from(
                            Array((pos as number[]).length).keys()
                            ).map(_=>second) as T[]
                    }
                } 
                
                const num_idx = _trans(this.index,first)
                this._iset(num_idx,second)
            }
        }
    }

    push(val:T,name:number|string=''):void{
        this.values.push(val)
        this.index.values.push(name)
        this.shape += 1
    }

    insert(idx:number,val:T,name:number|string=''):void{
        check.iloc.num(idx,this.shape)
        this.values.splice(idx,0,val)
        this.index.insert(idx,name)
        this.shape += 1
    }

    drop(labels:nsx){
        labels = isArr(labels) ? labels : [labels] as (number|string)[]
        const labels2 = labels as (number|string)[]
        const new_idx = range(this.index.shape).filter(
            i=>!labels2.includes(this.index.values[i]))
        return this.iloc(new_idx)
    }

    // drop_duplicates_by_index():Series<T>{
    //     return drop_duplicates_by_index(this)
    // }
    drop_duplicates(keep:'first'|'last'|false='first'){
        const new_idx = duplicated(this.values,keep)
        return this.loc(new_idx.map(x=>!x))
    }

    bool(expr:string){
        return this.b(expr)
    }
    b(expr:string,__ctx__?:any){
        console.log(__ctx__)
        const newExpr = addCtx(expr,__ctx__)
        return this.values.map(x=>eval(newExpr)) as boolean[]
    }

    query(expr:string,ctx?:any){
        return this.q(expr,ctx)
    }
    q(expr:string,ctx?:any){
        const bidx = this.b(expr,ctx)
        return this.loc(bidx) as Series<T>
    }

    sort_values(ascending=true){
        const idx = _sortIndices<T>(this.values,ascending)
        return this.iloc(idx)
    }

    value_counts(){
        // only work if values are string or number
        const mp = new Map<number|string, number>
        this.values.forEach((e=>{
            const e2 = e as number|string
            if(!mp.has(e2))
                mp.set(e2,0)
            mp.set(e2,mp.get(e2)!+1)
        }))
        const arr:(string | number)[][] = []
        mp.forEach((count,key)=>{
            arr.push([key,count])
        })
        const df = new DataFrame(arr,{columns:['value','count']})
        const ss = df.sort_values('count',{ascending:false}).set_index('value').loc(null,'count') as Series<number>
        ss.name = ''
        ss.index.name = ''
        return ss
    }

    op<K>(opStr:string|((x:T)=>K)): Series<K>
    op<K,Z>(opStr:string|((x:T,y:Z)=>K),ss:Series<Z>|Z[]): Series<K>
    op<K,Z>(opStr:string|((x:T)=>K)|((x:T,y:Z)=>K),ss?:Series<Z>|Z[]){
        if(_.isUndefined(ss)){
            let vals:K[]
            if(_.isString(opStr))
                vals = this.values.map(x=>eval(opStr))
            else
                vals = this.values.map(x=>(opStr as (x:T)=>K)(x))
            return new Series(vals,{index:this.index,name:this.name})
        }else if((ss instanceof Series) && 
            this.index.is_unique() &&
            ss.index.is_unique()){
            check.op.index(this.index,ss.index)
            const vals:K[] = []
            this.index.values.forEach((idx)=>{
                const x = this.loc(idx) as T
                const y = (ss as Series<Z>).loc(idx) as Z
                const val = _.isString(opStr) ? eval(opStr) : opStr(x,y)
                vals.push(val)
            })
            return new Series(vals,this.index)
        }else{
            if(ss instanceof Series){
                check.op.index(this.index,ss.index)
                check.op.indexSame(this.index,ss.index)
                ss = ss.values
            }
            check.op.values(this.index,ss)
            const vals:K[] = []
            this.values.forEach((x,i)=>{
                const y = (ss as Z[])[i]
                const val = _.isString(opStr) ? eval(opStr) : opStr(x,y)
                vals.push(val)
            })
            return new Series(vals,this.index)
        }
    }
    unique(){
        return _.uniq(this.values)
    }
    rank(options?:SeriesRankOptions){
        if(_.isUndefined(options))
            options = {}
        const vals = ranks(this.values as number[],options)
        return new Series(vals,
            {index:this.index,name:this.name})
    }
    reduce<K>(func:(a:T[])=>K){
        return func(this.values)
    }
    min(){
        return stat.min(this.values as number[])
    }
    max(){
        return stat.max(this.values as number[])
    }
    sum(){
        return stat.sum(this.values as number[])
    }
    mean(){
        return stat.mean(this.values as number[])
    }
    mode(){
        return stat.mode(this.values as number[])
    }
    median(){
        return stat.median(this.values as number[])
    }
    // cumsum(){
    //     return d3.cumsum(this.values as number[])
    // }
    std(){
        return stat.sampleStandardDeviation(this.values as number[])
    }
    var(){
        return stat.sampleVariance(this.values as number[])
    }
    prod(){
        return stat.product(this.values as number[])
    }

    to_raw(copy:boolean=true){
        if(copy)
            return {values:cp(this.values),
                name:this.name,
                index:this.index.to_raw()}
        else
            return {values:this.values,
                name:this.name,
                index:this.index.to_raw(copy)}
    }
}

export default Series
