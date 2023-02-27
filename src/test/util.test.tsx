import { expect, test, describe} from '@jest/globals';
import {range,_trans_rg} from '../util'

const trans = _trans_rg
test('_trans_rg',()=>{
    expect(trans('::',2)).toEqual([0,1])
    expect(trans(':',2)).toEqual([0,1])
    expect(trans(':2',3)).toEqual([0,1])
    expect(trans('::2',3)).toEqual([0,2])
    expect(trans('1:2',3)).toEqual([1])
    expect(trans('2::-1',4)).toEqual([2,1,0])
    expect(trans('2:0:-1',3)).toEqual([2,1])
    expect(trans('2:2:-1',3)).toEqual([])
    expect(trans('::-1',2)).toEqual([1,0])
    expect(trans('5:1:-2',5)).toEqual([4,2])
    expect(()=>trans(':2:1.2',3)).toThrow('integer')
})

test('range',()=>{
    expect(range(2)).toEqual([0,1])
    expect(range(1,3)).toEqual([1,2])
    // console.log(trans('5:1:-2',5))
    expect(range(5,1,-2)).toEqual([5,3])
    expect(range(1,5,2)).toEqual([1,3])
    expect(range(1,5,-2)).toEqual([])

})