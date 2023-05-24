import Index from './Index'
import * as _ from 'lodash'


const isNum = (x:any) => _.isNumber(x)
const isStr = (x:any) => _.isString(x)
// const isNonInteger = (x:any) => isNum(x) && !Number.isInteger(x)
const isArr = (x:any) => Array.isArray(x)
const isVal = (x:any) => isNum(x) || isStr(x)
const isNumArr = (x:any) => isArr(x)
    && x.length > 0 && isNum(x[0])
const isStrArr = (x:any) => isArr(x)
    && x.length > 0 && isStr(x[0])


const check = {
    index:{
        set(k:any,len:number,v:any){
            const vstr = 'the values property of index'
            if(!Number.isInteger(k))
                throw(`key for ${vstr} must be a integer. But ${k} is found.`)
            if(k<0 || k>len)
                throw(`key for ${vstr} must be in the range of [0,${len}] inclusively.`)
            if(!isNum(v) && !isStr(v))
                throw(`value for ${vstr} must be a number or a string.`)
        }
    },
    frame:{
        index:{
            set(len:number,idx_len:number){
                if(len !== idx_len)
                    throw('Index shape is not equal to shape of Series or axis of DataFrame.')
            }
        },
        b:{
            expr(len:number){
                if(len % 2 !== 0)
                    throw('` is not paired in the expression.')
            }
        }
    },
    iloc:{
        num(idx:number,len:number){
            if(!Number.isInteger(idx))
                throw('input number index must be integer.')
             if(idx < 0 || idx >= len)
                throw('input number index out of range.')
        },
        bool(idx:boolean[],len:number){
            if(idx.length !== len)
            throw('boolean[] index shape does not match the shape of indexed vector.')
        },
        str:{
            colon(s:string){
                if(!s.includes(':'))
                    throw('no ":" is found in string range index.')
                if(s.split(':').length > 3)
                    throw('More than two ":" in the string index')
            },
            parsed(start:number,end:number){
                if(Number.isNaN(start) || Number.isNaN(end))
                    throw('string range index format is not correct.')
                if(!Number.isInteger(start) || !Number.isInteger(end))
                    throw('numbers in string range index must be integers.')
            },
            parsedStep(step:number){
                if(Number.isNaN(step))
                    throw('step string range index format is not correct.')
                if(!Number.isInteger(step))
                    throw('step in string range index must be integers.')
                if(step === 0)
                    throw('step cannot be less than 0.')
            }
        }
    },
    iset:{
        rpl:{
            val<T>(val:T){
                if(isArr(val)){
                    throw('the replacement should be a value not an array')
                }
            },
            num<T>(values:T|T[],len:number){
                const isValsArr = isArr(values)
                if(!isValsArr || 
                    (values as T[]).length !== len) 
                    throw(`the length of replacement values (${
                        isValsArr? (values as T[]).length : values}) `+
                    `does not match the length (${len}) of number[] index.`)
            },
            mat<T>(values:T[][],shape:number[]){
                if(values.length !== shape[0])
                throw(`the first dimension of replacement values (${values.length})`+
                ` does not match the data frame shape ${shape}`)

                const lenEql = values.reduce((acc:boolean,val:T[])=>{
                    return acc && (val.length === shape[1])
                },true)
                if(!lenEql){
                    throw(`the second dimension of replacement values`+
                    ` does not match the data frame shape ${shape}`)
                }
            },
            bool<T>(values:T[],idx:boolean[]){
                const count = idx.reduce((x,y)=>y?x+1:x,0)
                if(values.length !== count)
                    throw('the length of replacement values '+
                    'does not match the number of true '+
                    'values in boolean[] index')
            }
        }
    },
    set:{
        index:{
            uniq(index:Index){
                // console.log('aaa',index)
                if(!index.is_unique())
                    throw('index of the setted object is not unique. '
                    +'the only allowed array index type is boolean[].')
            }
        }
    },
    op:{
        index(idx1:Index,idx2:Index){
            if(idx1.shape !== idx2.shape)
            throw("The lengths of the two series' indices are not equal!")
            if(!idx1.is_unique() || !idx2.is_unique())
            throw("One of the series' index is not unique. Currently, Jandas only support element-wise operations on two series with unique indices.")
            const cmm = _.intersection(idx1.values,idx2.values)
            if(cmm.length !== idx1.shape || cmm.length !== idx2.shape )
            throw("The values in the two series' indices are not a exact match.")
        },
        values(idx:Index,values:any[]){
            if(idx.shape !== values.length)
            throw('The length of the series is not equal to the length of the array.')
        }
    }
}


function _trans_neg(x:number,len:number){
    const nonneg = len+x
    return nonneg < 0 ? 0 : nonneg
}

function _trans_rg(x:string,len:number){
    //TODO support multiple colons like 0:5:2, ::-1
    check.iloc.str.colon(x)
    const splits = x.split(':')
    let start_str, end_str, step_str='1'
    if(splits.length===2){
        [start_str,end_str] = splits
    }else{
        [start_str,end_str,step_str] = splits
    }
    step_str = step_str ? step_str : '1'
    let step = parseFloat(step_str)
    check.iloc.str.parsedStep(step)

    if(step > 0){
        start_str = start_str ? start_str : '0'
        end_str = end_str ? end_str : len.toString()
        let [start,end] = [parseFloat(start_str),
                            parseFloat(end_str)]
                            
        check.iloc.str.parsed(start,end)
        if(start < 0) start = _trans_neg(start,len)
        if(end < 0) end = _trans_neg(end,len)
        if(start >= end) return []
        if(start >= len) return []
        end = end > len ? len : end
        const arr = []
        let i = start
        while(i<end){
            arr.push(i)
            i+=step
        }
        return arr
    }else{
        start_str = start_str ? start_str : len.toString()
        let end_str_null = false
        if(!end_str){
            end_str='0'
            end_str_null = true
        }
        let [start,end] = [parseFloat(start_str),
                            parseFloat(end_str)]
                            
        check.iloc.str.parsed(start,end)
        if(start < 0) start = _trans_neg(start,len)
        if(end < 0) end = _trans_neg(end,len)
        if(start <= end) return []
        if(end >= (len-1)) return []
        start = start > (len-1) ? (len-1) : start
        const arr = []
        let i = start
        end = end_str_null ? -1 : end
        while(i>end){
            arr.push(i)
            i+=step
        }
        return arr
    }
}

function range(end:number):number[]
function range(start:number,end:number):number[]
function range(start:number,end:number,step:number):number[]
function range(first:number,second?:number,third?:number){
    if(second === undefined && third === undefined)
        return _trans_rg(`:${first}`,first)
    else if(third=== undefined)
        return _trans_rg(`${first}:${second}`,second!)
    else
        return _trans_rg(`${first}:${second}:${third}`,
            third!>0?second!:(first+1))
}

function _trans_iloc(idx: undefined | string 
    | number | number[] | boolean[],
        len:number){
    type arr = number[]|boolean[]
    switch(true){
        case typeof idx === 'string':
            return _trans_rg(idx as string,len)
        case isNum(idx) && (idx as number) < 0:
            return (idx as number) + len
        case isNumArr(idx):
            return (idx as number[]).map(x=>
                x<0 ? x+len : x)
        default:
            return idx as undefined|number|arr
    }
}



export {isNum, isStr, isArr,isVal,isNumArr,
    isStrArr,_trans_iloc,check,range,
    _trans_rg}
