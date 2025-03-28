import {isNum, isArr,isVal,isNumArr,isStrArr,
    _trans_iloc, check, isStr, range} from './util'

import Index from './Index'
import Series from './Series'
import * as _ from 'lodash'

import {ns,ns_arr,numx,nsx,locParam,locParamArr} from './interfaces'
import  DataFrame  from './DataFrame'

import { findUnquotedAt } from './df_lib'


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
function _trans(index:Index):undefined
function _trans(index:Index,idx:ns|ns[]|Index|Series<ns>):numx
function _trans(index:Index,idx:boolean[]|Series<boolean>):boolean[]
function _trans(index:Index,idx?:ns|locParamArr):undefined|numx|boolean[]
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



const duplicated = (vals:any[],keep:'first'|'last'|false='first',keyFunc:(x:any)=>string=JSON.stringify)=>{
    const mp: {[k:string]:number} = {}
    const arr: boolean[] = []
    vals.forEach((val,i) => {
        const k = _.isString(val) || _.isNumber(val) 
                ? val : keyFunc(val)
        if(!(k in mp)){
            arr[i] = false
            mp[k] = i
        }else{
            if(keep === 'first')
                arr[i] = true
            else if(keep === 'last'){
                arr[mp[k]] = true
                mp[k] = i
                arr[i] = false
            }else{
                arr[mp[k]] = true
                arr[i] = true
            }
        }
    })
    return arr
}
function _rename(index:Index,labelMap:{[key:ns]:ns},inplace:true):void
function _rename(index:Index,labelMap:{[key:ns]:ns},inplace:false):Index
function _rename(index:Index,labelMap:{[key:ns]:ns},inplace:boolean):void|Index
function _rename(index:Index,labelMap:{[key:ns]:ns},inplace:boolean=false):void|Index{
    if(inplace){
        for(const [i,key] of index.values.entries()){
            if(key in labelMap)
                index.values[i] = labelMap[key]
        }
    }else{
        const arr:ns[] = []
        for(const key of index.values){
            if(key in labelMap)
                arr.push(labelMap[key])
            else
                arr.push(key)
        }
        return new Index(arr,index.name)
    }
}

function addCtx(expr:string,__ctx__:any){
    const atPosArr = findUnquotedAt(expr)
    let newExpr = ''
    let lastPos = 0
    // let lastLen = 0
    for(var match of expr.matchAll(/(@[a-zA-Z_$][a-zA-Z0-9_$]*)|(@)/g)){
        const idx = match.index!
        if(atPosArr.includes(idx)){
            const addOn = match[0] === '@' ? 
                `__ctx__` : 
                `__ctx__["${match[0].slice(1)}"]`
            newExpr += expr.slice(lastPos,idx) + addOn
            lastPos = idx+match[0].length
        }
    }
    newExpr += expr.slice(lastPos)
    return newExpr
}


// function drop_duplicates_by_index<T>(
//     x:Series<T>):Series<T>
// function drop_duplicates_by_index<T>(
//     x:DataFrame<T>):DataFrame<T>
// function drop_duplicates_by_index<T>(
//     x:Series<T>|DataFrame<T>){
//     const rec:(string|number)[] = []
//     const bidx = x.index.values.map(v=>{
//         if(rec.includes(v))
//             return false
//         else{
//             rec.push(v)
//             return true
//         }
//     })
//     return x.iloc(bidx)
// }

export {vec_loc,vec_loc2,vec_set,cp,_str,_trans,
    setIndex,duplicated,_rename,addCtx}