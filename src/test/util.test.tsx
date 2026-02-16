import { expect, test, describe} from '@jest/globals';
import {range,_trans_rg} from '../util'
import {concat,full} from '../util2'
import Series from '../Series'
import DataFrame from '../DataFrame';
import Index from '../Index';

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

test('full',()=>{
    expect(full([2,3],0)).toEqual([
        [0,0,0],
        [0,0,0]
    ])
    expect(full(2,1)).toEqual([1,1])
})

describe('concat',()=>{
    test('Series',()=>{
        let s1 = new Series([1,2],{index:['a','b'],name:'dd'})
        let s2 = new Series([3,4],{index:['a','b']})
        let s12: Series<number>|DataFrame<number> = concat([s1,s2])
        expect(s12).toEqual(
            new Series([1,2,3,4],{index:['a','b','a','b']})
        )

        let s2x = new Series([3,4],{index:new Index(['a','b']),name:'dd'})
        s12 = concat([s1,s2x])
        expect(s12).toEqual(
            new Series([1,2,3,4],{index:['a','b','a','b'], name:'dd'})
        )

        let s1x = new Series([1,2],{index:new Index(['a','b'],'dd')})
        s2x = new Series([3,5],{index:new Index(['a','b'],'dd')})
        s12 = concat([s1x,s2x])
        expect(s12).toEqual(
            new Series([1,2,3,5],{index: new Index(['a','b','a','b'],'dd')})
        )

        s2x.index.name = 'ee'
        s1x.name = 'kk'
        s12 = concat([s1x,s2x],1)
        expect(s12).toEqual(
            new DataFrame([[1,3,],[2,5]],{index: new Index(['a','b'],''),
                columns:['kk','']
            })
        )
        
        s12 = concat([s1,s2],1)
        expect(s12).toEqual(
            new DataFrame([[1,3],[2,4]],{index:['a','b'],
                columns:['dd','']})
        )

        s2 = new Series([3,4],{index:['e','f']})
        s12 = concat([s1,s2],1)
        expect(s12).toEqual(
            new DataFrame([],{columns:['dd','']})
        )
        expect(s12.shape).toEqual([0,2])

        s2 = new Series([3,4],{index:['f','a']})
        s12 = concat([s1,s2],1)
        expect(s12).toEqual(
            new DataFrame([[1,4]],{index:['a'],
                columns:['dd','']})
        )

        s2 = new Series([3,4],{index:['f','a']})
        s12 = concat([s1,s2],1)
        expect(s12).toEqual(
            new DataFrame([[1,4]],{index:['a'],
                columns:['dd','']})
        )

        s2 = new Series([3,4],{index:['a','a']})
        expect(()=>concat([s1,s2],1)).toThrow('unique')

        s2 = new Series([3,4],{index:['a','b']})
        s12 = concat([s1,s2],1)
        s1.set(0,-1)
        s2.set(1,-6)
        expect(s12).toEqual(
            new DataFrame([[1,3],[2,4]],{index:['a','b'],
                columns:['dd','']})
        )
    })

    test('DataFrame',()=>{
        let d1 = new DataFrame([[1],[3]],{
            index:['a','b'], columns:['c']
        })
        let d2 = new DataFrame([[2],[6]],{
            index:['a','b'], columns:['c']
        })
        let d3 = concat([d1,d2])
        expect(d3).toEqual(
            new DataFrame([[1],[3],[2],[6]],{
                index:['a','b','a','b'],columns:['c']
            })
        )
        d3 = concat([d1,d2],1)
        let df = new DataFrame([[1,2],[3,6]],{
            index:['a','b'],columns:['c','c']
        })
        let tr = df.tr // execute lazy evaluation
        expect(d3).toEqual(df)

        let d1x = d1.loc()
        let d2x = d2.loc()
        d1x.index.name = 'dd'
        d2x.index.name = 'dd'
        d1x.columns.name = 'ff'
        d2x.columns.name = 'ff'
        d3 = concat([d1x,d2x])
        expect(d3).toEqual(
            new DataFrame([[1],[3],[2],[6]],{
                index: new Index(['a','b','a','b'],'dd'),
                columns: new Index(['c'],'ff')
            })
        )

        d3 = concat([d1x,d2x],1)
        // console.log('aab')
        // let res = d3.tr
        // console.log('ttt')
        // expect(d3).toEqual([])
        let target = new DataFrame([[1,2],[3,6]],
                {index: new Index(['a','b'],'dd'),
                columns: new Index(['c','c'],'ff')}
            )
        let res = target.tr
        expect(d3).toEqual(target)

        d2x.index.name = 'ee'
        d2x.columns.name = 'ee'
        d3 = concat([d1x,d2x])
        expect(d3).toEqual(
            new DataFrame([[1],[3],[2],[6]],{
                index:new Index(['a','b','a','b']),columns:['c']
            })
        )
        
        d3 = concat([d1x,d2x],1)
        target = new DataFrame([[1,2],[3,6]],
                {index: new Index(['a','b'],''),
                columns: new Index(['c','c'],'')}
            )
        res = target.tr
        expect(d3).toEqual(target)

        d2x.index.name = 'dd'
        d3 = concat([d1x,d2x],1)
        target = new DataFrame([[1,2],[3,6]],
                {index: new Index(['a','b'],'dd'),
                columns: new Index(['c','c'],'')}
            )
        res = target.tr
        expect(d3).toEqual(target)



        d2 = new DataFrame([[2],[6]],{
            index:['a','b'], columns:['e']
        })
        d3 = concat([d1,d2])
        expect(d3).toEqual(
            new DataFrame([[],[],[],[]],
                {index:['a','b','a','b']})
        )
        expect(d3.shape).toEqual([4,0])

        d2 = new DataFrame([[2],[6]],{
            index:['g','f'], columns:['e']
        })
        d3 = concat([d1,d2],1)
        df = new DataFrame([],
            {columns:['c','e']})
        tr = df.tr
        expect(d3).toEqual(df)
        expect(d3.shape).toEqual([0,2])
        
        d2 = new DataFrame([[2],[6]],{
            index:['g','a'], columns:['e']
        })
        d3 = concat([d1,d2],1)
        df = new DataFrame([[1,6]],
            {index:['a'],columns:['c','e']})
        tr = df.tr
        expect(d3).toEqual(df)

        d2 = new DataFrame([[2],[6]],{
            index:['a','a'], columns:['e']
        })
        expect(()=>concat([d1,d2],1)).toThrow('unique')


        d2 = new DataFrame([[2],[6]],{
            index:['a','b'], columns:['c']
        })
        d3 = concat([d1,d2],1)
        d2.set('a','c',-5)
        d1.set('b','c',-6)
        df = new DataFrame([[1,2],[3,6]],{
            index:['a','b'],columns:['c','c']
        })
        tr = df.tr // execute lazy evaluation
        expect(d3).toEqual(df)
        d3.iset(0,0,99)
        df = new DataFrame([[1],[-6]],{
            index:['a','b'], columns:['c']})
        tr = df.tr
        expect(d1).toEqual(df)
    })
    
   
})