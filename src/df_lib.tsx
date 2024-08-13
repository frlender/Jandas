// util functions
import DataFrame from "./DataFrame"
import * as _ from 'lodash'
import {range} from './util'

import {ns_arr,Obj,GP} from './interfaces'

class GroupByThen<T>{
    gp:GP
    axis:0|1
    df:DataFrame<T>
    constructor(gp:GP,axis:0|1,df:DataFrame<T>){
        this.gp = gp
        this.axis = axis
        this.df = df
    }

    _prepare(key:string,val:number[]){
        const karr = JSON.parse(key) as T[]
        const k = karr.length === 1 ? karr[0] : karr
        const sub = this.axis === 1 ? 
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
        function* iter(){
            let i = 0
            for(const [key,val] of Object.entries(self.gp)){
                const {sub,k} = self._prepare(key,val)
                yield {group:sub as DataFrame<T>,
                    key:k,i:i,gp:sub as DataFrame<T>}
                i += 1
            }
        }
        return iter()
     }
}

function _sortIndices<S>(arr:S[]|S[][],ascending:boolean){
    const _cmp = (a:S,b:S)=>{
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
    const flag = ascending ? 1:-1
    if(_.isArray(arr[0])){
        const cmp = (a1:number,a2:number)=>{
            const ax = arr[a1] as S[]
            const bx = arr[a2] as S[]
            let res:number=0;
            for(let i=0; i<ax.length; i++){
                res = _cmp(ax[i],bx[i])
                if(res !== 0){
                    break
                }
            }
            return res
        }
        return idx.sort(cmp)
    }else{
        const cmp = (a1:number,a2:number)=>{
            return _cmp(arr[a1] as S,arr[a2] as S)
        }
        return idx.sort(cmp)
    }
}

export {Obj,GP,GroupByThen,_sortIndices}
