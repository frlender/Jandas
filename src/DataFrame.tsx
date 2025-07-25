import {ns,ns_arr,numx,nsx,locParam,locParamArr,
    Obj,GP, DataFrameArrInitOptions,DataFrameInitOptions,PushOptions,
SortOptions,MergeOptions,DataFrameRankOptions,
DataFrameRaw,DropDuplicatesOptions,QueryOptions,
DiffOptions,
RollingOptions,DataFrameRollingOptions} from './interfaces'

import {isNum, isArr,isVal,isNumArr,isStrArr,
    _trans_iloc, check, isStr, range} from './util'

import {vec_loc,vec_loc2,
    vec_set,cp,_str,_trans,setIndex,
    duplicated,_rename,addCtx} from './cmm'

import {GroupByThen,_sortIndices,findUnquotedAt,Rolling} from './df_lib'
import { concat,full } from './util2'


import Index from './Index'
import Series from './Series'

import * as stat from 'simple-statistics'
import * as _ from 'lodash'
import ranks = require('@stdlib/stats-ranks')



class DataFrame<T>{
    values: T[][]
    // tr: T[][] // transposed values
    shape: [number,number]
    private _index: Index
    private _columns:Index
    private _tr?:T[][]
    constructor(arr:T[][]|Obj<T>[])
    constructor(arr:T[][],options:DataFrameArrInitOptions)
    constructor(arr:Obj<T>[],options:DataFrameInitOptions)
    constructor(arr:T[][]|Obj<T>[],options?:DataFrameInitOptions|DataFrameArrInitOptions)
    constructor(arr:T[][]|Obj<T>[],options?:DataFrameInitOptions|DataFrameArrInitOptions){
        if(_.isUndefined(options))
            options = {}
        let columns:Index|ns_arr
        if(arr.length > 0 && !isArr(arr[0])){
            columns = Object.keys(arr[0])
            const _cols = columns as ns_arr
            arr = arr.map(obj=>_cols.map(key=>(obj as Obj<T>)[key]));
            // index = options && !_.isUndefined(options.index) ? 
            //         options.index : null
            (options as DataFrameArrInitOptions).columns = _cols
        }
        let _arr = arr as T[][]
       
        let _options = options as DataFrameArrInitOptions
        _options =  _.defaults(_options,
            {columns:_arr.length===0?[]:_arr[0].map((_,i)=>i),
            index:_arr.map((_,i)=>i)})

        this._index = _options.index instanceof Index ?
            _options.index : new Index(_options.index!)
        this._columns = _options.columns instanceof Index ?
            _options.columns : new Index(_options.columns!)
        this.shape = [this.index.shape,this.columns.shape]

        check.frame.index.set(_arr.length,this.shape[0])
        if(_arr.length > 0)
            check.frame.index.set(_arr[0].length,this.shape[1])
        this.values = _arr
        
    }

    // https://stackoverflow.com/questions/17428587/transposing-a-2d-array-in-javascript
    __transpose(arr:T[][]){return arr[0].map((_, colIndex) => arr.map(row => row[colIndex]));}
    _transpose(arr:T[][]){
        if(arr.length === 0)
            return []
        else
            return this.__transpose(arr)
    }

    get tr():T[][]{
        if(_.isUndefined(this._tr)){
            if(this.values.length > 0)
                this._tr = this._transpose(this.values);
            else{
                this._tr = Array.from(
                    Array(this.shape[1]).keys())
                    .map(_=>[])
                // this.values = this._transpose(this.tr)
            }
        }
        return this._tr 
    }

    set tr(vals:T[][]){
        this._tr = vals
    }

    get index():Index{
        return this._index
    }
    get columns():Index{
        return this._columns
    }

    _indexSetterEffect(){
        // interface
        // any side effects one may want to
        // invoke when index is set
    }

    set index(vals: ns_arr|Index){
        this._index = setIndex(vals,this.shape[0])
        this._indexSetterEffect()
    }
    set columns(vals:ns_arr|Index){
        this._columns = setIndex(vals,this.shape[1])
    }

    rename(labelMap:{index?:{[key:ns]:ns},columns?:{[key:ns]:ns}},
        inplace?:false):DataFrame<T>
    rename(labelMap:{index?:{[key:ns]:ns},columns?:{[key:ns]:ns}},
            inplace:true):void
    rename(labelMap:{index?:{[key:ns]:ns},columns?:{[key:ns]:ns}},
        inplace:boolean=false):void|DataFrame<T>{
            
        if(inplace){
            if(labelMap.index)
                _rename(this.index,labelMap.index,true)
            if(labelMap.columns)
                _rename(this.columns,labelMap.columns,true)
        }else{
            const [index,columns] = [this.index.cp(),this.columns.cp()]
            if(labelMap.index)
                _rename(index,labelMap.index,true)
            if(labelMap.columns)
                _rename(columns,labelMap.columns,true)
            return new DataFrame(cp(this.values),{index,columns})
        }
    }



    _p(){
        let lines : string[] = []
        const corner = `${this.index.name}|${this.columns.name}`
        lines.push(corner+'\t'+this.columns.values.map(x=>x.toString()).join('\t'))
        // lines.push('\t'+this.columns.values.map(_=>'-').join('-'))
        const content = this.values.map((row,i)=>{
            let line: string[] = []
            line.push(this.index.values[i].toString())
            line = line.concat(row.map(x=>JSON.stringify(x)))
            return line.join('\t')
        })
        lines = lines.concat(content)
        console.log(lines.join('\n')+'\n'+'DataFrame '+`(${this.shape})`)
    }

    p(){
        const corner =`${this.index.name}|${this.columns.name}`
        const df = this.reset_index(corner).reset_columns()
        console.table(df.values)
        console.log('DataFrame '+`(${this.shape})`)
    }


    transpose(inplace:boolean=false){
        if(inplace){
            [this.values,this.tr] = [this.tr,this.values];
            [this.shape[0],this.shape[1]] = [this.shape[1],this.shape[0]];
            [this.index,this.columns] = [this.columns,this.index];
            return this
        }else{
            return new DataFrame(cp(this.tr),
                {index:this.columns.cp(),columns:this.index.cp()})
        }
    }
    

    _iloc_asymmetric(v1: T[][], l1: Index, l2:Index, transpose:boolean, i1:numx | boolean[],i2?:numx | boolean[]){
        // // TODO study function union types
        // type loc_fun_type = (a:T[] | T[][] | ns_arr, idx:boolean[] | number[]) => T[] | T[][] | ns_arr
        switch(true){
            case isNum(i1) && i2 === undefined:
                check.iloc.num(i1 as number, l1.shape)
                const i1x = i1 as number
                return new Series<T>(cp(v1[i1x]),
                    {index:l2.cp(),name:l1.values[i1x]})
            case isNum(i1) && isArr(i2):
                { check.iloc.num(i1 as number, l1.shape)
                const i2x = i2 as number[] | boolean[]
                const i1x = i1 as number
                const vec = v1[i1x]
                const [new_vec,new_idx] = 
                    vec_loc2(vec,l2.values,i2x)
                const final_index = new Index(new_idx,l2.name)
                return new Series<T>(new_vec, 
                    {index:final_index,name:l1.values[i1x]}) }
            case isArr(i1) && i2 === undefined:
                { const i1x = i1 as number[] | boolean[]
                const [new_mat,new_idx] = 
                    vec_loc2(v1,l1.values,i1x)
                const final_l1 = new Index(new_idx,l1.name)
                const final_l2 = l2.cp()
                const df =  new DataFrame(new_mat,
                    {index:final_l1,columns:final_l2})
                return transpose ? df.transpose(true) : df }
            default:
                return null
        }
    }
    // _iloc_symmetric(ir:number,ic:number):T
    // _iloc_symmetric(ir?:number[]|boolean[],ic?:number[]|boolean[]):DataFrame<T>|null
    _iloc_symmetric(ir?:numx | boolean[],ic?:numx | boolean[]){
        switch(true){
            case ir == undefined && ic == undefined:
                const vals = this.values.map(r =>cp(r))
                return new DataFrame<T>(vals,{index:this.index.cp(),
                    columns:this.columns.cp()})
            case isNum(ir) && isNum(ic):
                check.iloc.num(ir as number,this.shape[0])
                check.iloc.num(ic as number,this.shape[1])
                return this.values[ir as number][ic as number]
            case isArr(ir) && isArr(ic):
                const irx = ir as number[] | boolean[]
                const icx = ic as number[] | boolean[]
                // inplace vec_loc for this.values
                const sub_vals = vec_loc(this.values,irx,
                    (x:T[])=>x)
                const final_vals = sub_vals.map(
                    vec=>vec_loc(vec,icx))
                const final_index = new Index(
                    vec_loc(this.index.values,irx),
                    this.index.name)
                const final_columns = new Index(
                    vec_loc(this.columns.values,icx), 
                    this.columns.name)
                return new DataFrame(final_vals,{index:final_index,  columns:final_columns})
            default:
                return null
        }
    }

    iloc(row:number,col:number):T
    iloc(row:number,col?:null|string|number[]|boolean[]):Series<T>
    iloc(row:null|string|number[]|boolean[],col:number):Series<T>
    iloc(row?:null|string|number[]|boolean[],col?:null|string|number[]|boolean[]):DataFrame<T>
    iloc(row?:null | string | numx | boolean[],
        col?: null | string | numx | boolean[])
        :T| Series<T>| DataFrame<T>
    iloc(row?:null | string | numx | boolean[],
        col?: null | string | numx | boolean[])
        :T| Series<T>| DataFrame<T> {
        if(row === null) row = undefined
        if(col === null) col = undefined
        row = _trans_iloc(row,this.shape[0])
        col = _trans_iloc(col,this.shape[1])

        let res: null | Series<T> | DataFrame<T> | T;
        res = this._iloc_symmetric(row,col)
        // console.log('sym res',res)
        if(res !== null) return res

        if(col === undefined || isVal(row)){
            res = this._iloc_asymmetric(this.values,this.index,this.columns,false,row!,col)
            // console.log('asym row res',res)
            if(res !== null) return res
        }else{
            res = this._iloc_asymmetric(this.tr,this.columns,this.index,true,col!,row,)
            // console.log('asym col res',res)
            if(res !== null) return res
        }
        throw(`input parameters for iloc might be wrong`)
    }

    // loc():DataFrame<T>
    loc(row:number|string,col:number|string):T|Series<T>|DataFrame<T>
    loc(row:number|string,col?:null|locParamArr):Series<T>|DataFrame<T>
    loc(row:null|locParamArr,col:number|string):Series<T>|DataFrame<T>
    loc(row?:null|locParamArr,col?:null|locParamArr):DataFrame<T>
    loc(row?: null | number | string | locParamArr, col?: null | number | string | locParamArr):T|Series<T>|DataFrame<T>
    loc(row?: null | number | string | locParamArr, col?: null | number | string | locParamArr){
        if(row === null) row = undefined
        if(col === null) col = undefined
        row = row as undefined | locParam
        col = col as undefined | locParam
        
        const num_row = _trans(this.index, row as any)
        const num_col = _trans(this.columns, col as any)
        return this.iloc(num_row as any, num_col as any) as T|Series<T>|DataFrame<T>
    }


    _iset_asymmetric(v1: T[][], l1: Index, l2:Index, i1:numx | boolean[], rpl: T[]|T[][], i2?:numx | boolean[]){
        // // TODO study function union types
        // type loc_fun_type = (a:T[] | T[][] | ns_arr, idx:boolean[] | number[]) => T[] | T[][] | ns_arr
        switch(true){
            case isVal(i1) && i2 === undefined:
                check.iloc.num(i1 as number, l1.shape)
                check.iset.rpl.num(rpl as T[],l2.shape)
                v1[i1 as number] = rpl as T[]
                break
            case isVal(i1) && isArr(i2):
                { check.iloc.num(i1 as number, l1.shape)
                check.iset.rpl.num(rpl as T[],(i2 as number[]|boolean[]).length)
                const i2x = i2 as number[] | boolean[]
                const vec = v1[i1 as number]
                vec_set(vec,rpl as T[],i2x) }
                break
            case isArr(i1) && i2 === undefined:
                vec_set(v1,rpl as T[][],i1 as number[] | boolean[])
                break
            default:
                return null
        }
    }

    _iset_symmetric(ir:undefined | numx | boolean[],ic: undefined | numx | boolean[],rpl: T | T[] | T[][]){
        switch(true){
            case ir == undefined && ic == undefined:
                check.iset.rpl.mat(rpl as T[][],this.shape)
                this.values = rpl as T[][]
                this._tr = undefined
                break
            case isVal(ir) && isVal(ic):
                check.iloc.num(ir as number,this.shape[0])
                check.iloc.num(ic as number,this.shape[1])
                this.values[ir as number][ic as number] = rpl as T
                if(!_.isUndefined(this._tr))
                    this.tr[ic as number][ir as number] = rpl as T
                break
            case isArr(ir) && isArr(ic):
                const sub_mat = vec_loc(this.values,
                    ir as number[] | number[],
                    (x:T[])=>x)
                sub_mat.forEach((vec,ix)=>{
                    vec_set(vec,(rpl as T[][])[ix],ic as boolean[] | number[])
                })
                this._tr = undefined
                break
            default:
                return null
        }
    }
    
    _iset(row:undefined | numx | boolean[],col:undefined | numx | boolean[],rpl:T| T[] | T[][]){
        let res: undefined | null;
        res = this._iset_symmetric(row,col,rpl)
        // console.log('_iset_symmetric',res,row,col,rpl)
        if(res === null){
            rpl = rpl as T[] | T[][]
            if(col === undefined || isVal(row)){
                res = this._iset_asymmetric(this.values,this.index,this.columns,row!,rpl,col)
                // console.log('_iset_asymmetric1',res)
                if(res===undefined) this._tr = undefined
            }else{
                if(rpl.length > 0 && isArr(rpl[0])) rpl = this._transpose(rpl as T[][])
                res = this._iset_asymmetric(this.tr,this.columns,this.index,col!,rpl,row)
                if(res===undefined) this.values = this._transpose(this.tr)
            }
        }
        if(res===null) throw('function failed. Please check the input for _iset')
    }

    // iset(rpl: T[][]):void
    // iset(row:null | numx | boolean[],rpl: T[]|T[][]):void
    // iset(row:null | numx | boolean[],col:null | numx | boolean[],rpl:T| T[] | T[][]):void
    iset(row:number,col:number,rpl:T):void
    iset(row:number,rpl:T[]):void
    iset(row:number,col:null|string|number[]|boolean[],rpl:T[]):void
    iset(row:null|string|number[]|boolean[],col:number,rpl:T[]):void
    iset(rpl:T[][]):void
    iset(row:null|string|number[]|boolean[],rpl:T[][]):void
    iset(row:null|string|number[]|boolean[],col:null|string|number[]|boolean[],rpl:T[][]):void
    iset(first:any, second?:any, third?:T| T[]|T[][]):void{
        if(second===undefined && third === undefined){
            this._iset(undefined, undefined, first)
        }else if(third === undefined){
            if(first === null) first = undefined
            this._iset(first, undefined, second)
        }else{
            if(first === null) first = undefined
            if(second === null) second = undefined
            this._iset(first, second, third)
        }
    }

    // _hdl_duplicate(idx:locParam,index:Index,rpl:T|T[]|T[][]){
    //     if(isVal(idx)){
    //         // handle duplicate index in set
    //         const pos = index.mp.get(idx as string | number)
    //         if(isArr(pos)){
    //             const res =  Array.from(
    //                 Array((pos as number[]).length).keys()
    //                 ).map(_=>rpl) as T[]|T[][]
    //             return res
    //         }
    //     }
    //     return rpl
    // }

    // set(rpl: T[][]):void
    // set(row:null | locParam,rpl:T[]|T[][]):void
    set(row:number|string,col:number|string,rpl:T|T[]|T[][]):void
    set(row:number|string,rpl:T[]|T[][]):void
    set(row:number|string,col:null|locParamArr,rpl:T[]|T[][]):void
    set(row:null|locParamArr,col:number|string,rpl:T[]|T[][]):void
    set(rpl:T[][]):void
    set(row:null|locParamArr,rpl:T[][]):void
    set(row:null|locParamArr,col:null|locParamArr,rpl:T[][]):void
    set(first:any, second?:any, third?:T|T[]|T[][]):void{
        if(second===undefined && third === undefined){
            this._iset(undefined, undefined, first)
        }else if(third === undefined){
            if(first === null) first = undefined
            if(isVal(first) && !this.index.has(first))
                //using set to add new row
                this.push(second,{name:first,axis:0}) 
            else{
                // second = this._hdl_duplicate(first,this.index,second)
                const num_row = _trans(this.index, first)
                this._iset(num_row, undefined, second)
            } 
        }else{
            if(first === null) first = undefined
            if(second === null) second = undefined
            if(first === undefined && isVal(second) && !this.columns.has(second))
                //using set to add new column
                this.push(third as T[],{name:second,axis:1})
            else{
                // third = this._hdl_duplicate(second,this.columns,third)
                // third = this._hdl_duplicate(first,this.index,third)
                const num_row = _trans(this.index, first)
                const num_col = _trans(this.columns, second)
                this._iset(num_row, num_col, third)
            }
        }
    }

    // push(val:T[],name:number|string='',axis:0|1=1){
    _push(val:T[],{name='',axis=1}: PushOptions={}){

        if(axis===0){
            check.iset.rpl.num(val,this.shape[1])
            this.values.push(val)
            this.index.values.push(name)
            this.shape[axis] += 1
            if(!_.isUndefined(this._tr))
                this.tr.forEach((v:T[],i:number)=>{
                    v.push(val[i])
                })
        }else{
            check.iset.rpl.num(val,this.shape[0])
            if(!_.isUndefined(this._tr))
                this.tr.push(val)
            this.columns.values.push(name)
            this.shape[axis] += 1
            this.values.forEach((v:T[],i:number)=>{
                v.push(val[i])
            })
        }
    }
    _series_push(val:Series<T>,options:PushOptions){
        const label = options.axis === 0? 'columns' : 'index'
        if(JSON.stringify(val.index.values) === 
            JSON.stringify(this[label].values))
            this._push(val.values,options)
        else{
            if(this[label].is_unique()){
                try{
                    val = val.loc(this[label].values)
                }catch(e){
                    throw(`There are values in the DataFrame's ${label} that are not in the to be pushed Series' index.`)
                }
                if(val.shape > this[label].shape)
                    throw(`The series' index values that are indexed by the DataFrame's ${label} are not unique.`)
                this._push(val.values,options)
            }else{
                throw(`If the to be pushed Series' index does not match the DataFrame's ${label} exactly, the DataFrame's${label} must have only unique values.` )
            }
        }
    }
    push(val:T[]|Series<T>,options: PushOptions={}){

        if(val instanceof Series){
            _.defaults(options,{name:val.name,axis:1})
           this._series_push(val,options)
        }else{
            _.defaults(options,{name:'',axis:1})
            this._push(val,options) 
        }
    }

    _insert(i1:number,l1:Index, v1:T[][],
        rpl:T[],name:number|string){
        check.iloc.num(i1,l1.shape)
        v1.splice(i1,0,rpl)
        l1.insert(i1,name) 
    }


    // insert(idx:number,val:T[],name:number|string='',axis:0|1=1){
    insert(idx:number,val:T[],{name='',axis=1}:PushOptions={}){
        
        if(axis===0){
            idx = idx < 0 ? this.shape[0]+idx : idx
            this._insert(idx,this.index,
                this.values,val,name)
            this.shape[axis] += 1
            this._tr = undefined
        }else{
            idx = idx < 0 ? this.shape[1]+idx : idx
            this._insert(idx,this.columns,
                this.tr,val,name)
            this.shape[axis] += 1
            this.values = this._transpose(this.tr)
        }
    }

    drop(labels:nsx,axis:0|1=1){
        labels = isArr(labels) ? labels : [labels] as (number|string)[]
        const labels2 = labels as (number|string)[]
        if(axis === 0){
            const new_idx = range(this.index.shape).filter(
                i=>!labels2.includes(this.index.values[i]))
            return this.iloc(new_idx) as DataFrame<T>
        }else{
            const new_idx = range(this.columns.shape).filter(
                i=>!labels2.includes(this.columns.values[i]))
            return this.iloc(null,new_idx) as DataFrame<T>
        }
    }

    drop_duplicates(labels:nsx,{keep='first',axis=1}:DropDuplicatesOptions={}){
        
        if(axis === 1){
            const sub = this.loc(null,labels) as Series<T>|DataFrame<T>
            const idx = duplicated(sub.values,keep)
            return this.loc(idx.map(x=>!x))
        }else{
            let sub = this.loc(labels) as Series<T>|DataFrame<T>
            if(sub instanceof DataFrame)
                sub = sub.transpose()
            const idx = duplicated(sub.values,keep)
            return this.loc(null,idx.map(x=>!x))
        }
    }

    set_index(label:number|string){
        check.set_index.label_uniq(label,this.columns)
        const vec = this.loc(null,label).values as T[]
        const df = this.drop(label)
        //TODO: consider validate if vec is ns_arr
        df.index = new Index(vec as ns_arr,label)
        return df
    }

    set_columns(label:number|string){
        check.set_index.label_uniq(label,this.index)
        const vec = this.loc(label).values as T[]
        const df = this.drop(label,0)
        //TODO: consider validate if vec is ns_arr
        df.columns = new Index(vec as ns_arr,label)
        return df
    }

    reset_index(name?:string|number){
        const df = new DataFrame(cp(this.values),
            {columns:this.columns.cp()})
        const val = this.index.values
        name = name ? name : this.index.name
        // workaround for val using "as T[]""
        // maybe there is a better way to 
        // handle this.
        df.insert(0,val as T[],{name:name,axis:1})
        return df
    }

    reset_columns(name?:string|number){
        const df = new DataFrame(cp(this.values),
            {index:this.index.cp()})
        const val = this.columns.values
        name = name ? name : this.columns.name
        // workaround for val using "as T[]""
        // maybe there is a better way to 
        // handle this.
        df.insert(0,val as T[],{name:name,axis:0})
        return df
    }

    to_dict(axis:0|1=1){
        // similar to pandas DataFrame.to_dict('records')
        const vals_arr = axis === 1? this.values : this.tr
        const index = axis === 1? this.columns : this.index
        if(!index.is_unique())
            console.warn('The index is not unique. The output will only include the value of the last key among duplicated keys.')
        return vals_arr.map(vals=>{
            const o:Obj<T> = {}
            index.values.forEach((k,i)=>{
                o[k as number|string] = vals[i]
            })
            return o
        })
    }

    bool(expr:string,axis:0|1=1){
        return this.b(expr,{axis:axis})
    }

    b(expr:string,options?:QueryOptions){
        if(_.isUndefined(options))
            options = {}
        let {ctx=undefined,axis=1} = options
        // ["bc"] > 5 && [5] > 6
        const arr:number[] = []
        range(expr.length).forEach(i=>{
            let char = expr[i]
            if(char === '[' || char === ']'){
                arr.push(i)
            }
        })
        check.frame.b.expr(arr.length)
        // console.log(arr)
        let labels:(string|number)[] = []
        let expr2:string = expr
        range(arr.length/2).forEach(i=>{
            const start = arr[i*2]
            const end = arr[i*2+1]
            // console.log(start,end)
            const pattern = expr.slice(start,end+1)
            const labelx = expr.slice(start+1,end)
            let label: string|number = labelx.trim()

            // differentiate loc [] from array []
            //https://stackoverflow.com/questions/881085/count-the-number-of-occurrences-of-a-character-in-a-string-in-javascript
            const dbl_quote_count = (label.match(/"/g) || []).length
            const sgl_quote_count = (label.match(/'/g) || []).length
            const quote_count = dbl_quote_count > sgl_quote_count ? 
                dbl_quote_count : sgl_quote_count
            if(label.includes(',') && (quote_count===0 ||quote_count > 2))
                return 
            // [element,] to represent an arry with one element.
            if(label[label.length-1] === ',')
                return

            // handle trailling white space in []
            if (label !== labelx)
                expr2 = expr.replaceAll(pattern,`[${label}]`)
            // console.log('a',label)
            label = label[0] === '"' || label[0] === "'" ? 
                label.slice(1,label.length-1) : parseInt(label)
            labels.push(label)
        })
        expr = expr2
        // console.log(labels)

        const index = axis === 1 ? this.columns : this.index
        const vals = axis === 1 ? this.values : this.tr

        const num_idx = labels.map(x=>{
            const indices = index.trans(x)
            let idx:numx
            if(isArr(indices)){
                // for duplicate index, use the last one as in pandas query function
                idx = (indices as [])[(indices as []).length-1]
                console.warn(`label ${x} is duplicated in the DataFrame's ${axis === 1 ? 'columns' : 'index'}. The last one is used.`)
            }else{
                idx = indices
            }
            
            return idx
        })

        labels.forEach((label,i)=>{
            const num = num_idx[i]
            const pattern = isNum(label) ? 
                `[${label}]` : `["${label}"]`
            const rpl = `v[${num}]`
            expr = expr.replaceAll(pattern,rpl)
        })

        const __ctx__ = options.ctx
        const newExpr = addCtx(expr,__ctx__)
        
        // console.log(expr)
        // console.log(newExpr)
        const bidx = vals.map(v=>eval(newExpr)) as boolean[]
        return bidx

    }

    query(col_expr:string):DataFrame<T>
    query(col_expr:null|string, row_expr_or_ctx:any):DataFrame<T>
    query(col_expr:null|string, row_expr:null|string, ctx:any):DataFrame<T>
    query(first:null|string,second?:any, third?:any):DataFrame<T>{
        return this.q(first,second,third)
    }
    
    q(col_expr:string):DataFrame<T>
    q(col_expr:null|string, row_expr_or_ctx:any):DataFrame<T>
    q(col_expr:null|string, row_expr:null|string, ctx:any):DataFrame<T>
    q(first:null|string,second?:any, third?:any):DataFrame<T>{
        let row_index:null|boolean[] = null
        let col_index:null|boolean[] = null
        if(_.isUndefined(second))
            row_index = this.b(first as string,{axis:1})
        else if(_.isUndefined(third)){
            if(!_.isString(second) && second !== null)
                row_index = this.b(first as string,{axis:1,ctx:second})
            else{
                const atPosArr = _.isString(first) ? 
                        findUnquotedAt(first) :
                        undefined
                if(atPosArr && atPosArr.length > 0)
                    row_index = this.b(first as string,{axis:1,ctx:second})
                else{
                    col_index = second === null ? null :
                        this.b(second as string,{axis:0})
                    row_index = first === null ? null :
                        this.b(first as string,{axis:1})
                }
            }
        }else{
            col_index = second === null ? null :
                this.b(second as string,{axis:0,ctx:third})
            row_index = first === null ? null :
                this.b(first as string,{axis:1,ctx:third})
        }
        // switch(true){
        //     case _.isUndefined(second):
        //         row_index = this.b(first as string,{axis:1})
        //         break
        //     case first !== null && second === null:
        //         col_index = this.b(first as string,0)
        //         break
        //     case first === null:
        //         row_index = this.b(second as string,1)
        //         break
        //     default:
        //         row_index = this.b(second as string,1)
        //         col_index = this.b(first as string,0)
        // }
        return this.loc(row_index,col_index) as DataFrame<T>
    }

    _iter(indexType:'index'|'columns'):Generator<[
            ss: Series<T>,
            key: string | number,
            i: number,
    ]>
    _iter(indexType:'index'|'columns',func:(row:Series<T>,key:number|string|ns_arr,
        i:number)=>void):void
    _iter(indexType:'index'|'columns',func?:(row:Series<T>,key:number|string|ns_arr,
        i:number)=>void){
        const accessor = (i:number) => indexType === 'index'?
            this.iloc(i) as Series<T> :
            this.iloc(null,i) as Series<T>
        
        if(_.isUndefined(func)){
            const self = this
            function* iter(){
                let i=0
                const itemFunc = indexType === 'index' ?
                    (row:Series<T>,k:number|string,i:number) => ({row:row,key:k,i:i}) :
                    (row:Series<T>,k:number|string,i:number) => ({col:row,key:k,i:i})

                for(const k of self[indexType].values){
                    const row = accessor(i)
                    yield [row,k,i]
                    i += 1
                }
            }
            return iter()
        }else
            this[indexType].values.forEach((k,i)=>{
                const row = accessor(i)
                func(row,k,i)
            })
    }

    iterrows():Generator<[
        row: Series<T>,
        key: string | number,
        i: number
    ]>
    iterrows(func:(row:Series<T>,key:number|string|ns_arr,
        i:number)=>void):void
    iterrows(func?:(row:Series<T>,key:number|string|ns_arr,
        i:number)=>void){
        if(_.isUndefined(func))
            return this._iter('index')
        else
            return this._iter('index',func)
    }

    itercols():Generator<[
        col: Series<T>,
        key: string | number,
        i: number
    ]>
    itercols(func:(row:Series<T>,key:number|string|ns_arr,
        i:number)=>void):void
    itercols(func?:(col:Series<T>,key:number|string|ns_arr,
        i:number)=>void){
        if(_.isUndefined(func))
            return this._iter('columns')
        else
            return this._iter('columns',func)
    }


    // groupby():GroupByThen<T>
    // groupby(labels:nsx|null):GroupByThen<T>
    // groupby(labels:nsx|null,axis:0|1):GroupByThen<T>
    groupby(labels?:nsx|null, axis:0|1=0):GroupByThen<T>{
        if(_.isUndefined(labels)){
            return this._groupby(null)
        }else
            return this._groupby(labels,axis)
    }

    _groupby(labels:nsx|null,axis:0|1=0){
        const index = axis === 0 ? this.columns : this.index
        const iter = axis === 0 ? this.iterrows : this.itercols
        const _index = axis === 0 ? this.index : this.columns

        const res: GP = {}
        if(_.isNull(labels)){   
            iter.call(this,(ss,k,i)=>{
                const karr = [k]
                const key = JSON.stringify(karr)
                if(!(key in res))
                    res[key] = []
                res[key].push(i)
            })
        }else{
            labels = (isArr(labels) ? labels : [labels] as ns_arr) as ns_arr
            iter.call(this,(ss,k,i)=>{
                const karr = ss.loc(labels as ns_arr).values
                const key = JSON.stringify(karr)
                if(!(key in res))
                    res[key] = []
                res[key].push(i)
            })
        }

        const then = new GroupByThen<T>(res,axis,this,labels,index)
        return then
    }

    // _sort_values(labels:nsx|null,ascending=true,axis:0|1=1){
    //     if(axis === 1){
    //         if(_.isNull(labels)){
    //             const idx = _sortIndices(this.index.values,
    //                 ascending)
    //             return this.iloc(idx)
    //         }else{
    //             //TODO: any
    //             const sub = this.loc(null,labels as any) as DataFrame<T>
    //             const idx = _sortIndices(sub.values,
    //                 ascending)
    //             return this.iloc(idx)
    //         }
    //     }else{
    //         if(_.isNull(labels)){
    //             const idx = _sortIndices(this.columns.values,
    //                 ascending)
    //             return this.iloc(null,idx)
    //         }else{
    //             //TODO: any
    //             const sub = this.loc(labels as any) as DataFrame<T>
    //             const idx = _sortIndices(sub.tr,
    //                 ascending)
    //             return this.iloc(null,idx)
    //         }
    //     }
    // }

    // sort_values(labels:nsx|null,ascending=true,axis:0|1=1){
    sort_values(labels:nsx|null, {ascending=true,axis=1}:SortOptions={}){
        
        const index = axis === 1?this.index:this.columns
        const iloc = axis === 1? 
            ((idx:number[])=>this.iloc(idx)):
            ((idx:number[])=>this.iloc(null,idx))
        const loc = axis === 1? 
            ((labels:nsx)=>this.loc(null,labels as any)):
            ((labels:nsx)=>this.loc(labels as any))
        const subFun = axis === 1? 
            ((sub:DataFrame<T>)=>sub.values):
            ((sub:DataFrame<T>)=>sub.tr)

        if(_.isNull(labels)){
            const idx = _sortIndices(index.values, false,
                ascending)
            return iloc(idx) as DataFrame<T>
        }else{
            const sub = loc(labels)
            if(sub instanceof Series){
                const sub2 = sub as Series<T>
                const idx = _sortIndices(sub2.values, false,
                    ascending)
                return iloc(idx) as DataFrame<T>

            }else{
                const sub2 = sub as DataFrame<T>
                const idx = _sortIndices(subFun(sub2), true,
                    ascending)
                return iloc(idx) as DataFrame<T>
            }
        }
    }

    op<K>(opStr:string|((x:T)=>K)): DataFrame<K>
    op<K,Z>(opStr:string|((x:T,y:Z)=>K),df:DataFrame<Z>|Z[][]): DataFrame<K>
    op<K,Z>(opStr:string|((x:T)=>K)|((x:T,y:Z)=>K),second?:DataFrame<Z>|Z[][]){
        if(_.isUndefined(second)){
            let vals:K[][]
            if(_.isString(opStr))
                vals = this.values.map(vec=>vec.map(x=>eval(opStr)))
            else
                vals = this.values.map(
                    vec=>vec.map(x=>(opStr as (x:T)=>K)(x)))
            return new DataFrame(vals,{index:this.index.cp(),
                columns:this.columns.cp()})
        }else if(second instanceof DataFrame && 
            this.index.is_unique() &&
            second.index.is_unique()){
            check.op.index(this.index,second.index)
            const vals:K[][] = []
            this.index.values.forEach((idx)=>{
                const sx = this.loc(idx) as Series<T>
                const sy = (second as DataFrame<Z>).loc(idx) as Series<Z>
                const sz = sx.op(opStr,sy)
                vals.push(sz.values)
            })
            return new DataFrame(vals,{index:this.index,
                columns:this.columns})
        }else if(second instanceof DataFrame){
            check.op.index(this.index,second.index)
            check.op.indexSame(this.index,second.index)
            const vals:K[][] = []
            this.index.values.forEach((e,idx)=>{
                const sx = this.iloc(idx) as Series<T>
                const sy = (second as DataFrame<Z>).iloc(idx) as Series<Z>
                const sz = sx.op(opStr,sy)
                vals.push(sz.values)
            })
            return new DataFrame(vals,{index:this.index,
                columns:this.columns})
        }else{
            check.op.values(this.index,second)
            check.op.values(this.columns,second[0])
            const vals:K[][] = []
            this.values.forEach((vec,i)=>{
                const vec2 = (second as Z[][])[i]
                const vecNew:K[] = []
                vec.forEach((x,j)=>{
                    const y = vec2[j]
                    vecNew.push(_.isString(opStr) ? 
                        eval(opStr) : opStr(x,y))
                })
                vals.push(vecNew)
            })
            return new DataFrame(vals,{index:this.index,
                columns:this.columns})
        }
    }

    merge(df:DataFrame<T>,{on=undefined,axis=1}:MergeOptions={}):DataFrame<T>{
        let leftDf: DataFrame<T>;
        if(!_.isUndefined(on)){
            if(axis === 1){
                leftDf = this.set_index(on)
                df = df.set_index(on)
            }else{
                leftDf = this.set_columns(on)
                df = df.set_columns(on)
            }
        }else{
            leftDf = this
        }
        // console.log('aaa',leftDf,df)
        const res = concat([leftDf,df],axis)
        // console.log('aaa',res)
        
        if(_.isUndefined(on))
            return res
        else{
            if(axis === 1){
                res.index.name = on
                return res.reset_index()
            }else{
                res.columns.name = on
                return res.reset_columns()
            }
        }
    }
    rank(this:DataFrame<number>,options:DataFrameRankOptions={}){
        options = _.defaults(options,{axis:0})
        if(options.axis === 0){
            const rankMat = this.tr.map(vec=>
                ranks(vec,options))
            const df = new DataFrame(rankMat,{index:this.columns.cp(),
                columns:this.index.cp()})
            df.transpose(true)
            return df
        }else{
            const rankMat = this.values.map(vec=>
                ranks(vec,options))
            const df = new DataFrame(rankMat,{index:this.index.cp(),
                columns:this.columns.cp()})
            return df
        }
    }

    change(this:DataFrame<number>,op_str:string,
        {periods=1,axis=0}:DiffOptions={}):DataFrame<number>{

        if(axis === 1){
            const diff = this.transpose().change(op_str,{periods:periods})
            return diff.transpose(true)
        }
           
        if(!Number.isInteger(periods))
            throw new Error('periods must be an integer')
        if(periods >= 1){
            const later = this.iloc(`${periods}:`)
            const earlier = this.iloc(`:-${periods}`)
            const diff = later.op<number,number>(op_str,earlier.values)
            const head = new DataFrame<number>(full([periods,this.shape[1]],NaN),
                {index:this.index.values.slice(0,periods),
                columns:this.columns.cp()})
            return concat([head,diff],0)
        }else if(periods <= -1){
            const earlier = this.iloc(`:${periods}`)
            const later = this.iloc(`${-periods}:`)
            const diff = earlier.op<number,number>(op_str,later.values)
            const tail = new DataFrame<number>(full([-periods,this.shape[1]],NaN),
                {index:this.index.values.slice(this.shape[0]+periods),
                columns:this.columns.cp()})
            return concat([diff,tail],0)
        }else
            return new DataFrame<number>(full(this.shape,0),
                {index:this.index.cp(),columns:this.columns.cp()})
        
    }

    diff(this:DataFrame<number>,{periods=1,axis=0}:DiffOptions={}):DataFrame<number>{
        return this.change('x-y',{periods,axis})
    }

    pct_change(this:DataFrame<number>,{periods=1,axis=0}:DiffOptions={}):DataFrame<number>{
        return this.change('(x-y)/y',{periods,axis})
    }

    rolling(this:DataFrame<number>,window:number,
        {min_periods=undefined,center=false,
            closed='right',step=1,axis=0}:DataFrameRollingOptions={}){
        if(axis === 0)
            return new Rolling(this,window,min_periods,center,closed,step,axis)
        else
            return new Rolling(this.transpose(),window,min_periods,center,closed,step,axis)
    }

    isna(){
        return this.op<boolean>('_.isNil(x) || _.isNaN(x)')
    }

    // drop_duplicates_by_index(){
    //     return drop_duplicates_by_index(this)
    // }

    to_raw(copy:boolean=true):DataFrameRaw<T>{
        // copy = _.isUndefined(copy) ? true : copy
        if(copy)
            return {values:cp(this.values),
                index:this.index.to_raw(),
                columns:this.index.to_raw()
            }
        else
            return {values:this.values,
                index:this.index.to_raw(copy),
                columns:this.index.to_raw(copy)
            }
    }

    reduce<K>(func:(a:T[])=>K,axis:0|1=0){
        if(axis===1){
            const vals = this.values.map(row=>func(row))
            return new Series(vals,{index:this.index})
        }else{
            const vals = this.tr.map(col=>func(col))
            return new Series(vals,{index:this.columns})
        }
    }
    _reduce_num(this:DataFrame<number>,func:(a:number[])=>number,axis:0|1){
        return this.reduce(func,axis)
    }
    min(this:DataFrame<number>,axis:0|1=0){
        return this._reduce_num(stat.min,axis)
    }
    max(this:DataFrame<number>,axis:0|1=0){
        return this._reduce_num(stat.max,axis)
    }
    sum(this:DataFrame<number>,axis:0|1=0){
        return this._reduce_num(stat.sum,axis)
    }
    mean(this:DataFrame<number>,axis:0|1=0){
        return this._reduce_num(stat.mean,axis)
    }
    median(this:DataFrame<number>,axis:0|1=0){  
        return this._reduce_num(stat.median,axis)
    }
    std(this:DataFrame<number>,axis:0|1=0){
        return this._reduce_num(stat.sampleStandardDeviation,axis)
    }
    var(this:DataFrame<number>,axis:0|1=0){
        return this._reduce_num(stat.sampleVariance,axis)
    }
    mode(this:DataFrame<number>,axis:0|1=0){
        return this._reduce_num(stat.mode,axis)
    }
    prod(this:DataFrame<number>,axis:0|1=0){
        return this._reduce_num(stat.product,axis)
    }
}

// const stat_methods = ['mean','sum','median',
//     ['std','sampleStandardDeviation'],
//     ['var','sampleVariance'],
//     'mode','min','max','prod'
// ]

// stat_methods.forEach(method=>{
//     DataFrame.prototype
//     // DataFrame<T>.prototype[method as string] = function(axis:0|1=0){
//     //     return this._reduce_num(stat[method],axis)
//     // }
// })




export default DataFrame