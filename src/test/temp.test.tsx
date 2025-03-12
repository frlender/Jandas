import { expect, test, describe} from '@jest/globals';
import {DataFrame,Index,Series} from '../J'
import { from_raw } from '../util2';
import * as _ from 'lodash'

test('b',()=>{
    let ss = new Series([1,2,3],{index:['a','b','b']})
    expect(ss.b('x>1')).toEqual([false,true,true])
    expect(ss.b('x>1 && x<3')).toEqual([false,true,false])
    expect(ss.b('x>=1 && x<3')).toEqual([true,true,false])

    expect(ss.b('x>=@a && x<@b',{a:1,b:3})).toEqual([true,true,false])
    expect(ss.b('@ === undefined')).toEqual([true,true,true])

    
    let sx = new Series(['a','b','b'],{index:['a','b','b']})
    expect(sx.b('x==="b"')).toEqual([false,true,true])
    expect(sx.b('x==="b" || x ==="a"')).toEqual([true,true,true])

})
