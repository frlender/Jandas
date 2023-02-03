import {isNum, isArr,isVal,isNumArr,isStrArr,
    _trans_iloc, check, isStr, range} from './util'

//TODO?: set on duplicated index ['a','a'] with lower dimension values
//        namely, df.loc['a'] = [1,2,3]
//TODO: merge, range 0:5:2, iterrows/cols, mean, sum,
// std, op(for element-wise operation in dataframe).
//TODO: MultiIndex

type ns_arr =  (number | string)[]
type numx = number[] | number
// type strx = string[] | string
type nsx = number | string | ns_arr


function cp<S>(arr:S[]){
    return arr.slice(0)
} 

class Index{
    private __values!:ns_arr // original values
    _values!: ns_arr // proxy values
    mp!: Map<number | string, numx>
    shape!: number
    name: string | number
    constructor(values:ns_arr,name?:string | number){
        this.name = name ? name : ''
        this.values = values
    }

    get values(){
        return this._values
    }
    set values(vals:ns_arr){
        const self = this
        this.__values = vals
        this._values = new Proxy(vals,{
            set(target,k,v){
                // k will always be string here
                // console.log(target,k,v)
                if(k !== 'length'){
                    const kn = parseFloat(k as string)
                    check.index.set(kn,self.shape,v)
                    target[kn] = v
                    self.remap()
                    self.shape = self._values.length
                }else{
                    target[k] = v
                }
                return true
            }
        })
        this.remap()
        this.shape = this._values.length
    }

    p(){
        const key_str = Array.from(this.values.keys()).join('\t')
        const val_str = this.values.join('\t')
        const name_str = this.name ? ' '+this.name : ''
        const meta_str = `Index (${this.shape})${name_str}`
        console.log(key_str+'\n'+val_str+'\n'+meta_str)
    }

    _add(k:number|string,i:number){
        if(!this.mp.has(k))
            this.mp.set(k,i)
        else{
            const item = this.mp.get(k)!
            if(!Array.isArray(item))
                this.mp.set(k,[item,i])
            else
                item.push(i)
        }
    }

    remap(){
        this.mp = new Map<number | string, numx>()
        this.values.forEach((k,i)=>{
            this._add(k,i)
        })
    }

    insert(idx:number,val:number|string){
        // call splice on proxy will repetitively
        // run remap function.
        this.__values.splice(idx,0,val)
        this.remap()
        this.shape += 1
    }

    cp(){
        return new Index(cp(this.__values),this.name)
    }

    has(idx: number|string){
        return this.mp.has(idx)
    }

    unique(){
        return Array.from(this.mp.keys())
    }

    is_unique(){
        return this.mp.size === this.shape
    }

    check(idx: number|string){
        if(!this.mp.has(idx))
        throw(`${idx} does not exist in index`)
    }

    trans(index: nsx): numx {
        // translate index to primary number index
        if(!Array.isArray(index)){
            this.check(index)
            return this.mp.get(index)!
        }else{
            const arr: number[] = []
            index.forEach(k => {
                this.check(k)
                const val = this.trans(k)
                Array.isArray(val) ? arr.push(...val) : arr.push(val)
            })
            return arr
        }
    }
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

type locParam = nsx | Series<number|string> | boolean[] | Series<boolean> | Index

function _trans(index:Index, idx?:nsx | Series<number|string> | boolean[] | Series<boolean> | Index)
            : undefined | numx | boolean[]{
    // translate labelled index to numeric index
    switch(true){
        case isVal(idx):
            idx = index.trans(idx as number | string)
            break
        case idx instanceof Index:
            idx = index.trans((idx as Index).values)
            break
        case idx instanceof Series && idx.values.length > 0 && typeof idx.values[0] !== 'boolean':
            idx = index.trans((idx as Series<number|string>).values)
            break
        case idx instanceof Series:
            idx = (idx as Series<boolean>).values
            break
        case isArr(idx) && (idx as ns_arr).length > 0 && typeof (idx as ns_arr)[0] !== 'boolean':
            idx = index.trans(idx as (number | string)[])
            break
    }
    return idx as numx | boolean[] | undefined
}

const setIndex = (vals:ns_arr|Index,shape:number)=>{
    const len = vals instanceof Index ?
             vals.shape : vals.length
    check.frame.index.set(shape,len)
    return vals instanceof Index ? vals : new Index(vals)
}

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



    loc(index?: locParam):T|Series<T>{
        const num_idx = _trans(this.index,index)
        return this._iloc(num_idx as any)
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
    iset(index:string|numx|boolean[],rpl:T|T[]):void
    iset(first:any, second?:T|T[]):void{
        if(second===undefined){
            this._iset(undefined, first)
        }else{
            first = _trans_iloc(first,this.shape)
            this._iset(first,second)
        }
    }
    
    set(rpl:T[]):void
    set(idx:locParam,rpl:T|T[]):void
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
}

interface Obj<T>{
    [key: number|string]:T
}


class DataFrame<T>{
    values: T[][]
    tr: T[][] // transposed values
    shape: [number,number]
    _index!: Index
    _columns!:Index
    constructor(arr:T[][])
    constructor(arr:T[][],index:Index|ns_arr)
    constructor(arr:T[][],index:null|Index|ns_arr,
                    columns:Index|ns_arr)
    constructor(arr:Obj<T>[])
    constructor(arr:Obj<T>[],index:Index|ns_arr)
    constructor(arr:T[][]|Obj<T>[],index?:null|Index | ns_arr,columns?:Index | ns_arr){
        if(arr.length > 0 && !isArr(arr[0])){
            columns = Object.keys(arr[0])
            const _cols = columns as ns_arr
            arr = arr.map(obj=>_cols.map(key=>(obj as Obj<T>)[key]))
            index = index ? index : null
        }
        arr = arr as T[][]

        if(columns === undefined && arr.length === 0)
            columns = []
        if(columns === undefined) 
            columns = arr[0].map((_,i)=>i)
        if(index === null || index === undefined)
            index = arr.map((_,i)=>i)

        this._index = index instanceof Index ?
                index : new Index(index)
        this._columns = columns instanceof Index ?
                columns : new Index(columns)
        this.shape = [this.index.shape,this.columns.shape]

        check.frame.index.set(arr.length,this.shape[0])
        if(arr.length > 0)
            check.frame.index.set(arr[0].length,this.shape[1])
        this.values = arr

        if(arr.length > 0)
            this.tr = this._transpose(arr);
        else{
            this.tr = Array.from(
                Array(this.shape[1]).keys())
                .map(_=>[])
            this.values = this._transpose(this.tr)
        }
    }

    // https://stackoverflow.com/questions/17428587/transposing-a-2d-array-in-javascript
    __transpose(arr:T[][]){return arr[0].map((_, colIndex) => arr.map(row => row[colIndex]));}
    _transpose(arr:T[][]){
        if(arr.length === 0)
            return []
        else
            return this.__transpose(arr)
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
                this.columns.cp(),this.index.cp())
        }
    }
    

    _iloc_asymmetric(v1: T[][], l1: Index, l2:Index, transpose:boolean, i1:numx | boolean[],i2?:numx | boolean[]){
        // // TODO study function union types
        // type loc_fun_type = (a:T[] | T[][] | ns_arr, idx:boolean[] | number[]) => T[] | T[][] | ns_arr
        switch(true){
            case isNum(i1) && i2 === undefined:
                check.iloc.num(i1 as number, l1.shape)
                const i1x = i1 as number
                return new Series<T>(cp(v1[i1x]),l2.cp(),l1.values[i1x])
            case isNum(i1) && isArr(i2):
                { check.iloc.num(i1 as number, l1.shape)
                const i2x = i2 as number[] | boolean[]
                const i1x = i1 as number
                const vec = v1[i1x]
                const [new_vec,new_idx] = 
                    vec_loc2(vec,l2.values,i2x)
                const final_index = new Index(new_idx,l2.name)
                return new Series<T>(new_vec, final_index,l1.values[i1x]) }
            case isArr(i1) && i2 === undefined:
                { const i1x = i1 as number[] | boolean[]
                const [new_mat,new_idx] = 
                    vec_loc2(v1,l1.values,i1x)
                const final_l1 = new Index(new_idx,l1.name)
                const final_l2 = l2.cp()
                const df =  new DataFrame(new_mat,
                    final_l1,final_l2)
                return transpose ? df.transpose(true) : df }
            default:
                return null
        }
    }

    _iloc_symmetric(ir?:numx | boolean[],ic?:numx | boolean[]){
        switch(true){
            case ir == undefined && ic == undefined:
                const vals = this.values.map(r =>cp(r))
                return new DataFrame<T>(vals,this.index.cp(),this.columns.cp())
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
                return new DataFrame(final_vals,final_index,final_columns)
            default:
                return null
        }
    }

    
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

    loc(row?: null | locParam, col?: null | locParam){
        if(row === null) row = undefined
        if(col === null) col = undefined
        row = row as undefined | locParam
        col = col as undefined | locParam
        
        const num_row = _trans(this.index, row)
        const num_col = _trans(this.columns, col)
        return this.iloc(num_row, num_col)
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
                this.tr = this._transpose(this.values)
                break
            case isVal(ir) && isVal(ic):
                check.iloc.num(ir as number,this.shape[0])
                check.iloc.num(ic as number,this.shape[1])
                this.values[ir as number][ic as number] = rpl as T
                this.tr[ic as number][ir as number] = rpl as T
                break
            case isArr(ir) && isArr(ic):
                const sub_mat = vec_loc(this.values,
                    ir as number[] | number[],
                    (x:T[])=>x)
                sub_mat.forEach((vec,ix)=>{
                    vec_set(vec,(rpl as T[][])[ix],ic as boolean[] | number[])
                })
                this.tr = this._transpose(this.values)
                break
            default:
                return null
        }
    }
    
    _iset(row:undefined | numx | boolean[],col:undefined | numx | boolean[],rpl:T| T[] | T[][]){
        let res: undefined | null;
        res = this._iset_symmetric(row,col,rpl)
        if(res === null){
            rpl = rpl as T[] | T[][]
            if(col === undefined || isVal(row)){
                res = this._iset_asymmetric(this.values,this.index,this.columns,row!,rpl,col)
                // console.log(row,rpl,col,this)
                if(res===undefined) this.tr = this._transpose(this.values)
            }else{
                if(rpl.length > 0 && isArr(rpl[0])) rpl = this._transpose(rpl as T[][])
                res = this._iset_asymmetric(this.tr,this.columns,this.index,col!,rpl,row)
                if(res===undefined) this.values = this._transpose(this.tr)
            }
        }
        if(res===null) throw('function failed. Please check the input for _iset')
    }

    iset(rpl: T[][]):void
    iset(row:null | numx | boolean[],rpl: T[]|T[][]):void
    iset(row:null | numx | boolean[],col:null | numx | boolean[],rpl:T| T[] | T[][]):void
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

    set(rpl: T[][]):void
    set(row:null | locParam,rpl:T[]|T[][]):void
    set(row:null | locParam,col:null | locParam,rpl: T|T[]|T[][]):void
    set(first:any, second?:any, third?:T|T[]|T[][]):void{
        if(second===undefined && third === undefined){
            this._iset(undefined, undefined, first)
        }else if(third === undefined){
            if(first === null) first = undefined
            if(isVal(first) && !this.index.has(first))
                //using set to add new row
                this.push(second,first,0) 
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
                this.push(third as T[],second,1)
            else{
                // third = this._hdl_duplicate(second,this.columns,third)
                // third = this._hdl_duplicate(first,this.index,third)
                const num_row = _trans(this.index, first)
                const num_col = _trans(this.columns, second)
                this._iset(num_row, num_col, third)
            }
        }
    }

    _insert(i1:number,l1:Index, v1:T[][],
        rpl:T[],name:number|string){
        check.iloc.num(i1,l1.shape)
        v1.splice(i1,0,rpl)
        l1.insert(i1,name) 
    }

    push(val:T[],name:number|string='',axis:0|1=1){
        if(axis===0){
            check.iset.rpl.num(val,this.shape[1])
            this.values.push(val)
            this.index.values.push(name)
            this.shape[axis] += 1
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

    insert(idx:number,val:T[],name:number|string='',axis:0|1=1){
        if(axis===0){
            idx = idx < 0 ? this.shape[0]+idx : idx
            this._insert(idx,this.index,
                this.values,val,name)
            this.shape[axis] += 1
            this.tr = this._transpose(this.values)
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

    reset_index(name?:string|number){
        const df = new DataFrame(cp(this.values),null,
            this.columns.cp())
        const val = this.index.values
        name = name ? name : this.index.name
        // workaround for val using "as T[]""
        // maybe there is a better way to 
        // handle this.
        df.insert(0,val as T[],name,1)
        return df
    }

    reset_columns(name?:string|number){
        const df = new DataFrame(cp(this.values),
            this.index.cp())
        const val = this.columns.values
        name = name ? name : this.columns.name
        // workaround for val using "as T[]""
        // maybe there is a better way to 
        // handle this.
        df.insert(0,val as T[],name,0)
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

    q(col_expr:string):DataFrame<T>
    q(row_expr:null|string,col_expr:null|string):DataFrame<T>
    q(first:null|string,second?:null|string):DataFrame<T>{
        let row_index:null|boolean[] = null
        let col_index:null|boolean[] = null
        switch(true){
            case first !== null && second === undefined:
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

}

export {Series, DataFrame,Index,range}