import {isNum, isArr,isVal,isNumArr,isStrArr,
    _trans_iloc, check, isStr, range} from './util'

import {ns_arr,numx,nsx,locParamArr,vec_loc,vec_loc2,
    vec_set,cp,_str,_trans,setIndex} from './cmm'

import { _sortIndices } from './df_lib'
import Index from './Index'
import DataFrame from './DataFrame'

import * as d3 from 'd3-array'
import * as _ from 'lodash'


class Series<T>{
    values: T[]
    _index!: Index
    shape: number
    name: string | number
    constructor(values: T[])
    constructor(values: T[], name:string | number)
    constructor(values: T[], index: ns_arr | Index, name?:string | number)
    constructor(first: T[], second?:any, third?:string | number){
        this.values = first
        this.shape = this.values.length
        switch(true){
            case second === undefined && third === undefined:
                this.name = ''
                this.index = new Index(this.values.map((_,i)=>i))
                break
            case third === undefined && (isNum(second) || isStr(second)):
                this.name = second
                this.index = new Index(this.values.map((_,i)=>i))
                break
            case third === undefined:
                this.name = ''
                this.index = second instanceof Index ? second : new Index(second)
                break
            default:
                this.name = third!
                this.values = first
                this.index = second instanceof Index ? second : new Index(second)
        }
    }

    get index():Index{
        return this._index
    }

    set index(vals: ns_arr|Index){
        this._index = setIndex(vals,this.shape)
    }

    p(){
        const name_str = this.name ? ' '+this.name : ''
        console.log(this.index.values.map(x=>x.toString()).join('\t') + '\n' +
        this.values.map(x=>_str(x)).join('\t') + '\n' +
        `Series (${this.shape})${name_str}`)
    }

    _iloc(idx:number):T
    _iloc(idx:undefined|number[]|boolean[]):Series<T>
    _iloc(idx?: numx | boolean[]){
        switch(true){
            case idx === undefined:
                return new Series(cp(this.values),this.index.cp(),this.name)
            case isNum(idx):
                check.iloc.num(idx as number, this.shape)
                return this.values[idx as number]
            default:
                const [vec,new_idx] = vec_loc2(this.values,
                    this.index.values,idx as number[] | boolean[])
                const new_index = new Index(new_idx,this.index.name)
                return new Series(vec,new_idx,this.name)
        }
    }

    iloc(idx:number):T
    iloc(idx?:string|number[]|boolean[]):Series<T>
    iloc(idx?: string | numx | boolean[]):T|Series<T>{
        idx = _trans_iloc(idx,this.shape)
        // have to use any here. Refer to:
        // https://stackoverflow.com/questions/67972427/typescript-function-overloading-no-overload-matches-this-call
        return this._iloc(idx as any)
    }

    loc(index:number|string): T|Series<T>
    loc(index?:locParamArr): Series<T>
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

    b(expr:string){
        return this.values.map(x=>eval(expr)) as boolean[]
    }

    q(expr:string){
        const bidx = this.b(expr)
        return this.loc(bidx) as Series<T>
    }

    sort_values(ascending=true){
        const idx = _sortIndices<T>(this.values,ascending)
        return this.iloc(idx)
    }

    value_counts(){
        const obj = _.countBy(this.values)
        const pairs = _.toPairs(obj)
        const df = new DataFrame(pairs,null,['value','count'])
        return df.sort_values('count',false)
    }

    op(opStr:string): Series<T>
    op(opStr:string,ss:Series<T>|T[]): Series<T>
    op(opStr:string,ss?:Series<T>|T[]){
        if(_.isUndefined(ss)){
            const vals = this.values.map(x=>eval(opStr)) as T[]
            return new Series(vals,this.index,this.name)
        }else if(ss instanceof Series){
            check.op.index(this.index,ss.index)
            const vals:T[] = []
            this.index.values.forEach((idx)=>{
                const x = this.loc(idx)
                const y = ss.loc(idx)
                const val = eval(opStr)
                vals.push(val)
            })
            return new Series(vals,this.index)
        }else{
            check.op.values(this.index,ss)
            const vals:T[] = []
            this.values.forEach((x,i)=>{
                const y = ss[i]
                const val = eval(opStr)
                vals.push(val)
            })
            return new Series(vals,this.index)
        }
    }
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

export default Series
