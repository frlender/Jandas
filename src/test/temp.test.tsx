import { expect, test, describe} from '@jest/globals';
import {DataFrame,Index,Series} from '../J'
import { from_raw, full } from '../util2';
import {range} from '../util'
import * as _ from 'lodash'
import {sum} from 'simple-statistics'

test('a',()=>{})

test('change indexes',()=>{
    const df = new DataFrame([[1,2],[3,4],[5,6]],
        {index:['a','b','b'],columns:['d',5]})
    df.index = ['c','d','e']
    expect(df.loc('e').values).toEqual([5,6])
    df.columns = new Index(['f',6],'colIndex')
    expect(df.loc(null,'f').values).toEqual([1,3,5])
    expect(df.columns.name).toEqual('colIndex')
})

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


