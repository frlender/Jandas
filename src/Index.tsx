import {ns_arr,numx,nsx,cp} from './cmm'
import {check} from './util'

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

    trans(index:number|string): numx
    trans(index:ns_arr):number[]
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

export default Index