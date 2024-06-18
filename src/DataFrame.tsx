import {ns_arr,numx,nsx,locParam,locParamArr,
    Obj,GP, DataFrameArrInitOptions,DataFrameInitOptions,PushOptions,
SortOptions,MergeOptions,DataFrameRankOptions,
DataFrameRaw,DropDuplicatesOptions} from './interfaces'

import {isNum, isArr,isVal,isNumArr,isStrArr,
    _trans_iloc, check, isStr, range} from './util'

import {vec_loc,vec_loc2,
    vec_set,cp,_str,_trans,setIndex,
    duplicated} from './cmm'

import {GroupByThen,_sortIndices} from './df_lib'
import { concat } from './util2'


import Index from './Index'
import Series from './Series'

import * as stat from 'simple-statistics'
import * as _ from 'lodash'
import ranks = require('@stdlib/stats-ranks')


class DataFrame<T>{
    values: T[][]
    // tr: T[][] // transposed values
    shape: [number,number]
    _index!: Index
    _columns!:Index
    _tr?:T[][]
    constructor(arr:T[][]|Obj<T>[])
    constructor(arr:T[][],options:DataFrameArrInitOptions)
    constructor(arr:Obj<T>[],options:DataFrameInitOptions)
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

    set index(vals: ns_arr|Index){
        this._index = setIndex(vals,this.shape[0])
    }
    set columns(vals:ns_arr|Index){
        this._columns = setIndex(vals,this.shape[1])
    }



    _p(){
        let lines : string[] = []
        const corner = `${this.index.name}\\${this.columns.name}`
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
    push(val:T[],options?: PushOptions){
        if(_.isUndefined(options))
            options = {}
        let {axis,name} = _.defaults(options,{name:'',axis:1})
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
            this.tr.push(val)
            this.columns.values.push(name)
            this.shape[axis] += 1
            this.values.forEach((v:T[],i:number)=>{
                v.push(val[i])
            })
        }
    }

    _insert(i1:number,l1:Index, v1:T[][],
        rpl:T[],name:number|string){
        check.iloc.num(i1,l1.shape)
        v1.splice(i1,0,rpl)
        l1.insert(i1,name) 
    }


    // insert(idx:number,val:T[],name:number|string='',axis:0|1=1){
    insert(idx:number,val:T[],options:PushOptions){
        if(_.isUndefined(options))
            options = {}
        let {axis,name} = _.defaults(options,{name:'',axis:1})
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

    drop_duplicates(labels:nsx,options?:DropDuplicatesOptions){
        if(_.isUndefined(options))
            options = {}
        let {keep,axis} = _.defaults(options,{keep:'first',axis:1})
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
        return this.b(expr,axis)
    }
    b(expr:string,axis:0|1=1){
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
            // for duplicate index, use the last one as in pandas query function
            const idx = isArr(indices) ? (indices as [])[(indices as []).length-1] : indices
            return idx
        })

        labels.forEach((label,i)=>{
            const num = num_idx[i]
            const pattern = isNum(label) ? 
                `[${label}]` : `["${label}"]`
            const rpl = `v[${num}]`
            expr = expr.replaceAll(pattern,rpl)
        })
        const bidx = vals.map(v=>eval(expr)) as boolean[]
        return bidx

    }

    query(col_expr:string):DataFrame<T>
    query(row_expr:null|string,col_expr:null|string):DataFrame<T>
    query(first:null|string,second?:null|string):DataFrame<T>{
        return _.isUndefined(second) ? 
            this.q(first as string) : 
            this.q(first,second) 
    }
    
    q(col_expr:string):DataFrame<T>
    q(row_expr:null|string,col_expr:null|string):DataFrame<T>
    q(first:null|string,second?:null|string):DataFrame<T>{
        let row_index:null|boolean[] = null
        let col_index:null|boolean[] = null
        switch(true){
            case first !== null && _.isUndefined(second):
                row_index = this.b(first as string,1)
                break
            case first !== null && second === null:
                col_index = this.b(first as string,0)
                break
            case first === null:
                row_index = this.b(second as string,1)
                break
            default:
                row_index = this.b(second as string,1)
                col_index = this.b(first as string,0)
        }
        return this.loc(row_index,col_index) as DataFrame<T>
    }

    iterrows(func:(row:Series<T>,key:number|string|ns_arr,
        i:number)=>void){
            this.index.values.forEach((k,i)=>{
                const row = this.iloc(i) as Series<T>
                func(row,k,i)
            })
    }

    itercols(func:(col:Series<T>,key:number|string|ns_arr,
        i:number)=>void){
            this.columns.values.forEach((k,i)=>{
                const row = this.iloc(null,i) as Series<T>
                func(row,k,i)
            })
    }


    groupby():GroupByThen<T>
    groupby(labels:nsx|null):GroupByThen<T>
    groupby(labels:nsx|null,axis:0|1):GroupByThen<T>
    groupby(first?:any, second?:0|1):GroupByThen<T>{
        if(_.isUndefined(first) && _.isUndefined(second)){
            return this._groupby(null,1)
        }else if(_.isUndefined(second)){
            return this._groupby(first,1)
        }else{
            return this._groupby(first,second)
        }
    }

    _groupby(labels:nsx|null,axis:0|1=1){
        const index = axis === 1 ? this.columns : this.index
        const iter = axis === 1 ? this.iterrows : this.itercols
        const _index = axis === 1 ? this.index : this.columns

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
            const idx = index.trans(labels) as number[]                
            iter.call(this,(ss,k,i)=>{
                const karr = ss.iloc(idx).values
                const key = JSON.stringify(karr)
                if(!(key in res))
                    res[key] = []
                res[key].push(i)
            })
        }
        const then = new GroupByThen<T>(res,axis,this)
        return then
    }

    _sort_values(labels:nsx|null,ascending=true,axis:0|1=1){
        if(axis === 1){
            if(_.isNull(labels)){
                const idx = _sortIndices(this.index.values,
                    ascending)
                return this.iloc(idx)
            }else{
                //TODO: any
                const sub = this.loc(null,labels as any) as DataFrame<T>
                const idx = _sortIndices(sub.values,
                    ascending)
                return this.iloc(idx)
            }
        }else{
            if(_.isNull(labels)){
                const idx = _sortIndices(this.columns.values,
                    ascending)
                return this.iloc(null,idx)
            }else{
                //TODO: any
                const sub = this.loc(labels as any) as DataFrame<T>
                const idx = _sortIndices(sub.tr,
                    ascending)
                return this.iloc(null,idx)
            }
        }
    }

    // sort_values(labels:nsx|null,ascending=true,axis:0|1=1){
    sort_values(labels:nsx|null,options?:SortOptions){
        if(_.isUndefined(options))
            options = {}
        let {ascending, axis} = _.defaults(options,
                {ascending:true,axis:1})
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
            const idx = _sortIndices(index.values,
                ascending)
            return iloc(idx) as DataFrame<T>
        }else{
            const sub = loc(labels)
            if(sub instanceof Series){
                const sub2 = sub as Series<T>
                const idx = _sortIndices(sub2.values,
                    ascending)
                return iloc(idx) as DataFrame<T>

            }else{
                const sub2 = sub as DataFrame<T>
                const idx = _sortIndices(subFun(sub2),
                    ascending)
                return iloc(idx) as DataFrame<T>
            }
        }
    }

    op(opStr:string): DataFrame<T>
    op(opStr:string,df:DataFrame<T>|T[][]): DataFrame<T>
    op(opStr:string,second?:DataFrame<T>|T[][]){
        if(_.isUndefined(second)){
            const vals = this.values.map(vec=>vec.map(x=>eval(opStr))) as T[][]
            return new DataFrame(vals,{index:this.index.cp(),
                columns:this.columns.cp()})
        }else if(second instanceof DataFrame){
            check.op.index(this.index,second.index)
            const vals:T[][] = []
            this.index.values.forEach((idx)=>{
                const sx = this.loc(idx) as Series<T>
                const sy = second.loc(idx) as Series<T>
                const sz = sx.op(opStr,sy)
                vals.push(sz.values)
            })
            return new DataFrame(vals,{index:this.index,
                columns:this.columns})
        }else{
            check.op.values(this.index,second)
            check.op.values(this.columns,second[0])
            const vals:T[][] = []
            this.values.forEach((vec,i)=>{
                const vec2 = second[i]
                const vecNew:T[] = []
                vec.forEach((x,j)=>{
                    const y = vec2[j]
                    vecNew.push(eval(opStr))
                })
                vals.push(vecNew)
            })
            return new DataFrame(vals,{index:this.index,
                columns:this.columns})
        }
    }

    merge(df:DataFrame<T>,options?:MergeOptions):DataFrame<T>{
        if(_.isUndefined(options))
            options = {}
        let {on, axis} = _.defaults(options,
                {on:undefined,axis:1})
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
    rank(options?:DataFrameRankOptions){
        if(_.isUndefined(options))
            options = {}
        options = _.defaults(options,{axis:0})
        if(options.axis === 0){
            const rankMat = this.tr.map(vec=>
                ranks(vec as number[],options))
            const df = new DataFrame(rankMat,{index:this.columns.cp(),
                columns:this.index.cp()})
            df.transpose(true)
            return df
        }else{
            const rankMat = this.values.map(vec=>
                ranks(vec as number[],options))
            const df = new DataFrame(rankMat,{index:this.index.cp(),
                columns:this.columns.cp()})
            return df
        }
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
    _reduce_num(func:(a:number[])=>number|undefined,axis:0|1){
        if(axis===1){
            const vals = this.values.map(row=>func(row as number[])) as number[]
            return new Series(vals,this.index)
        }else{
            const vals = this.tr.map(col=>func(col as number[])) as number[]
            return new Series(vals,this.columns)
        }
    }
    min(axis:0|1=0){
        return this._reduce_num(stat.min,axis)
    }
    max(axis:0|1=0){
        return this._reduce_num(stat.max,axis)
    }
    sum(axis:0|1=0){
        return this._reduce_num(stat.sum,axis)
    }
    mean(axis:0|1=0){
        return this._reduce_num(stat.mean,axis)
    }
    median(axis:0|1=0){
        return this._reduce_num(stat.median,axis)
    }
    std(axis:0|1=0){
        return this._reduce_num(stat.sampleStandardDeviation,axis)
    }
    var(axis:0|1=0){
        return this._reduce_num(stat.sampleVariance,axis)
    }
    mode(axis:0|1=0){
        return this._reduce_num(stat.mode,axis)
    }
}


export default DataFrame