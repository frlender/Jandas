import {isNum, isArr,isVal,isNumArr,isStrArr,
    _trans_iloc, check, isStr, range} from './util'

import Index from './Index'
import Series from './Series'
import * as _ from 'lodash'

import {ns_arr,numx,nsx,locParam,locParamArr} from './interfaces'


function cp<S>(arr:S[]){
    return arr.slice(0)
} 

function vec_loc<S>(vec:S[], idx: number[] | boolean[],
    f?:(x:S)=>S){
    if(idx.length === 0) return []
    if(f === undefined)
        f = isArr(vec[0]) ? (x:S)=>cp(x as []) as S
                : (x:S)=>x;
    if(typeof idx[0] === 'number'){
        return (idx as number[]).map(i=>{
            check.iloc.num(i,vec.length)
            return  f!(vec[i]) })
    }else{
        check.iloc.bool(idx as boolean[],vec.length)
        const arr:S[]=[]
        idx.forEach((b,i)=>{
            if(b) arr.push(f!(vec[i]))
        })
        return arr
    }
}


function vec_loc2<S,Z>(vec1:S[], vec2:Z[], idx: number[] | boolean[]):[S[],Z[]]{
    if(idx.length === 0) return [[],[]]
    const vec1x:S[] = []
    const vec2x:Z[] = []
    const f1 = isArr(vec1[0]) ? (x:S)=>cp(x as []) as S
                : (x:S)=>x;
    const f2 = isArr(vec2[0]) ? (x:Z)=>cp(x as []) as Z
                : (x:Z)=>x;
    if(typeof idx[0] === 'number'){
        (idx as number[]).forEach(i=>{
            check.iloc.num(i,vec1.length)
            vec1x.push(f1(vec1[i]))
            vec2x.push(f2(vec2[i]))
        })
    }else{
        check.iloc.bool(idx as boolean[],vec1.length);
        (idx as boolean[]).forEach((val,i)=>{
            if(val){
                vec1x.push(f1(vec1[i]))
                vec2x.push(f2(vec2[i]))
            }
        })
    }
    return [vec1x,vec2x]
      
}

function vec_set<S>(vec:S[],  rpl:S[], idx: number[] | boolean[]):void{
    if(idx.length === 0){
        check.iset.rpl.num(rpl,idx.length)
        return
    }
    // cp rpl element if S is an array type
    const f = isArr(rpl[0]) ? (x:S)=>cp(x as []) as S
                : (x:S)=>x;
    if(typeof idx[0] === 'number'){
        check.iset.rpl.num(rpl,idx.length);
        (idx as number[]).forEach((i,ix)=>{
            check.iloc.num(i,vec.length)
            if(ix===0)
                isArr(vec[0]) ? check.iset.rpl.num(rpl[0],(vec[0] as []).length)
                : check.iset.rpl.val(rpl[0])
            vec[i] = f(rpl[ix])})
    }else{
        let ix:number = 0;
        idx = idx as boolean[]
        check.iloc.bool(idx,vec.length)
        check.iset.rpl.bool(rpl,idx)
        idx.forEach((val,i)=>{
            if(val){
                if(ix === 0)
                    isArr(vec[0]) ? check.iset.rpl.num(rpl[0],(vec[0] as []).length)
                    : check.iset.rpl.val(rpl[0])
                vec[i] = f(rpl[ix])
                ix += 1
            }
        })
    }
}

function _str(x:any){
     if(isNum(x) || isStr(x) || isArr(x))
        return x.toString()
    else
        return JSON.stringify(x)
}

function _trans(index:Index,idx:number|string):numx
function _trans(index:Index,idx?:locParamArr):number[]| undefined | boolean[]
function _trans(index:Index, idx?:nsx | Series<number|string> | boolean[] | Series<boolean> | Index)
            : undefined | numx | boolean[]{
    // translate labelled index to numeric index
    if(isVal(idx))
    return index.trans(idx as number | string)
    else{
        // let res:number[]
        switch(true){
            case idx instanceof Index:
                return index.trans((idx as Index).values)
            case idx instanceof Series && idx.values.length > 0 && typeof idx.values[0] !== 'boolean':
                return index.trans((idx as Series<number|string>).values)
            case idx instanceof Series:
                 return (idx as Series<boolean>).values
            case _.isArray(idx) && idx.length > 0 && typeof idx[0] !== 'boolean':
                return index.trans(idx as ns_arr)
            default:
                return idx as undefined | boolean[] | number[]
        }
        // throw('unexpected error. The second argument idx does not match what is predefined.')
    }
}

const setIndex = (vals:ns_arr|Index,shape:number)=>{
    const len = vals instanceof Index ?
             vals.shape : vals.length
    check.frame.index.set(shape,len)
    return vals instanceof Index ? vals : new Index(vals)
}
export {vec_loc,vec_loc2,vec_set,cp,_str,_trans,setIndex}