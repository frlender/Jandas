import Series from './Series'
import DataFrame from './DataFrame'
import { ns_arr } from './interfaces'
import {check} from './util'
import * as _ from 'lodash'
// import {cp} from './cmm'

// function cp2<S>(arr:S[][]){
//     return arr.map(x=>cp(x))
// }

function concat<T>(ssArr:Series<T>[]):Series<T>|DataFrame<T>
function concat<T>(dfArr:DataFrame<T>[]):DataFrame<T>
function concat<T>(ssArr:Series<T>[],axis:0|1):Series<T>|DataFrame<T>
function concat<T>(dfArr:DataFrame<T>[],axis:0|1):DataFrame<T>
function concat<T>(sdArr:Series<T>[]|DataFrame<T>[],axis:0|1=0){
    if(sdArr[0] instanceof Series<T>){
        let idx: ns_arr = []
        const ssArr = sdArr as Series<T>[]
        if(axis===0){
            let vals:T[] = []
            ssArr.forEach(ss=>{
                idx = idx.concat(ss.index.values)
                vals = vals.concat(ss.values)
            })
            return new Series<T>(vals,{index:idx})
        }else{
            let vals: T[][] = []
            let cols: ns_arr = []
            let emptyFlag = false
            ssArr.every((ss,i)=>{
                check.concat.index.uniq(ss.index)
                if(i===0){
                    idx = ss.index.values
                    vals = ss.values.map(x=>[x])
                }else{
                    const _idx = idx
                    const _vals = vals
                    vals = []
                    idx = _.intersection(idx,ss.index.values)
                    if(idx.length === 0){
                        emptyFlag = true
                        return false
                    }else{
                        // const sx = ss.loc(idx)
                        idx.forEach(label=>{
                           const i =  _idx.findIndex(x=>x===label)
                            _vals[i].push(ss.loc(label) as T)
                            vals.push(_vals[i])
                        })
                    }
                }
                cols.push(ss.name)
                return true 
            })
            if(emptyFlag) return new DataFrame([],{columns:ssArr.map(x=>x.name)})
            return new DataFrame(vals,{index:idx,columns:cols})
        }
    }else{
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
        let emptyFlag = false
        dfArr.every((df,i)=>{
            const columns = getColumns(df)
            check.concat.index.uniq(columns)
            const index = getIndex(df)
            const values = getVals(df)
            if(i===0){
                idx = index.values
                cols = columns.values
                vals = values
            }else{
                const _cols = cols
                cols = _.intersection(cols,columns.values)
                if(cols.length === 0){
                    emptyFlag = true
                    return false
                }else{
                    vals = new DataFrame(vals,{columns:_cols})
                        .loc(null,cols).values
                    vals = axis === 0 ? 
                        vals.concat(df.loc(null,cols).values) :
                        vals.concat(df.loc(cols).tr)
                    idx = idx.concat(getIndex(df).values)
                }
            }
            return true 
        })
        if(emptyFlag){
            idx = []
            dfArr.forEach(df=>{
                idx = idx.concat(getIndex(df).values)
            })
            console.log('aaaa',idx)
            const new_df = new DataFrame(idx.map(x=>[]),{index:idx})
            return axis === 0 ?  new_df : new_df.transpose(true)
        }
        const new_df = new DataFrame(vals,{index:idx,columns:cols})
        return axis === 0 ? new_df : new_df.transpose(true)
    }
}

export {concat}