// util functions
import { DataFrame } from "./J"
import * as _ from 'lodash'


type ns_arr =  (number | string)[]
// type numx = number[] | number
// // type strx = string[] | string
type nsx = number | string | ns_arr

interface Obj<T>{
    [key: number|string]:T
}

// for groupby method
interface GP{
    [key: string]: number[]
} 
class GroupByThen<T>{
    gp:GP
    axis:0|1
    df:DataFrame<T>
    constructor(gp:GP,axis:0|1,df:DataFrame<T>){
        this.gp = gp
        this.axis = axis
        this.df = df
    }

    then(func:(group:DataFrame<T>,key:T | T[],
        i:number)=>void){
        let i = 0
        _.forOwn(this.gp,(val,key)=>{
            const karr = JSON.parse(key)
            const k = karr.length === 1 ? karr[0] : karr
            const sub = this.axis === 1 ? 
                this.df.iloc(val) : this.df.iloc(null,val)
            func(sub as DataFrame<T>,k,i)
            i += 1
        })
    }
}

export {Obj,GP,GroupByThen}
