import Series from './Series'
import DataFrame from './DataFrame'
import Index from './Index'
import { ns_arr, IndexRaw, SeriesRaw, DataFrameRaw } from './interfaces'
import {check,range} from './util'
import * as _ from 'lodash'
import { index } from 'd3-array'
// import {cp} from './cmm'

// function cp2<S>(arr:S[][]){
//     return arr.map(x=>cp(x))
// }

function concat<T>(ssArr:Series<T>[]):Series<T>
function concat<T>(dfArr:DataFrame<T>[]):DataFrame<T>
function concat<T>(ssArr:Series<T>[],axis:0|1):Series<T>|DataFrame<T>
function concat<T>(ssArr:Series<T>[],axis:1):DataFrame<T>
function concat<T>(ssArr:Series<T>[],axis:0):Series<T>
function concat<T>(dfArr:DataFrame<T>[],axis:0|1):DataFrame<T>
function concat<T>(sdArr:Series<T>[]|DataFrame<T>[],axis:0|1=0){
    if(sdArr[0] instanceof Series){
        let idx: ns_arr = []
        const ssArr = sdArr as Series<T>[]
        if(axis===0){
            let vals:T[] = []
            let indexName = ssArr[0].index.name
            let name = ssArr[0].name
            ssArr.forEach(ss=>{
                idx = idx.concat(ss.index.values)
                vals = vals.concat(ss.values)
                indexName = indexName === ss.index.name ? indexName : ''
                name = name === ss.name ? name : ''
            })
            return new Series<T>(vals,{index: new Index(idx,indexName),
                name:name})
        }else{
            let vals: T[][] = []
            let cols: ns_arr = []
            let indexName = ssArr[0].index.name
            ssArr.forEach((ss,i)=>{
                check.concat.index.uniq(ss.index)
                indexName = indexName === ss.index.name ? indexName : ''
                if(i===0){
                    idx = ss.index.values
                    vals = ss.values.map(x=>[x])
                }else{
                    const _idx = idx
                    const _vals = vals
                    vals = []
                    idx = idx.length > 0 ?
                        _.intersection(idx,ss.index.values) : []
                    if(idx.length > 0){
                        // const sx = ss.loc(idx)
                        idx.forEach(label=>{
                           const i =  _idx.findIndex(x=>x===label)
                            _vals[i].push(ss.loc(label) as T)
                            vals.push(_vals[i])
                        })
                    }
                }
                cols.push(ss.name)
            })
            return new DataFrame(vals,{index:new Index(idx,indexName),
                columns:cols})
        }
    }else if(sdArr[0] instanceof DataFrame){
        const dfArr = sdArr as DataFrame<T>[]
        const getIndex = axis === 0 ? 
            (x:DataFrame<T>)=>x.index :
            (x:DataFrame<T>)=>x.columns
        const getColumns = axis === 0 ? 
            (x:DataFrame<T>)=>x.columns :
            (x:DataFrame<T>)=>x.index
        const getVals = axis === 0 ? 
            (x:DataFrame<T>)=>x.values :
            (x:DataFrame<T>)=>x.tr
        let idx:ns_arr = []
        let cols:ns_arr = []
        let vals:T[][] = [] 
        let indexName: string|number;
        let columnsName: string|number;
        dfArr.forEach((df,i)=>{
            const columns = getColumns(df)
            check.concat.index.uniq(columns)
            const index = getIndex(df)
            const values = getVals(df)
            indexName = i === 0 || indexName === index.name ? index.name : ''
            columnsName = i=== 0 || columnsName === columns.name ? columns.name : ''
            if(i===0){
                idx = index.values
                cols = columns.values
                vals = values
            }else{
                const _cols = cols
                cols = _.intersection(cols,columns.values)
            
                vals = new DataFrame(vals,{columns:_cols})
                    .loc(null,cols).values
                vals = axis === 0 ? 
                    vals.concat(df.loc(null,cols).values) :
                    vals.concat(df.loc(cols).tr)
                idx = idx.concat(getIndex(df).values)
            
            }
        })
        const new_df = new DataFrame(vals,{index:
            new Index(idx,indexName!),columns:new Index(cols,columnsName!)})
        return axis === 0 ? new_df : new_df.transpose(true)
    }else
        throw Error('unsupported input type.')
}

function from_raw<T>(data:IndexRaw):Index
function from_raw<T>(data:SeriesRaw<T>):Series<T>
function from_raw<T>(data:DataFrameRaw<T>):DataFrame<T>
function from_raw<T>(data:IndexRaw|SeriesRaw<T>|DataFrameRaw<T>){
    if(_.hasIn(data,'index') && _.hasIn(data,'name')){
        const data2 = data as SeriesRaw<T>
        return new Series(data2.values,
                    {name:data2.name,
                    index:from_raw(data2.index)})
    }else if(!_.hasIn(data,'columns')){
        const data2 = data as IndexRaw
        return new Index(data2.values,data2.name)
    }else{
        const data2 = data as DataFrameRaw<T>
        return new DataFrame(data2.values,{
            index: from_raw(data2.index),
            columns: from_raw(data2.columns)
        })
    }
}

function full<T>(shape:number,fill_value:T):T[]
function full<T>(shape:number[],fill_value:T):T[][]
function full<T>(shape:number|number[],fill_value:T):T[]|T[][]{
    // similar to numpy.full
    if(_.isArray(shape)){
        return new Array(shape[0]).fill(new Array(shape[1]).fill(fill_value)) as T[][]
    }else
        return new Array(shape).fill(fill_value) as T[]
}

export {concat,from_raw,full}