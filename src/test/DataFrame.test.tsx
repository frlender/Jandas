import { expect, test, describe} from '@jest/globals';
import {DataFrame,Index,Series} from '../J'
import { from_raw, full } from '../util2';
import {range} from '../util'
import * as _ from 'lodash'


test('constructor',()=>{
    let df = new DataFrame([[1,2,3],[4,5,6]])
    expect(df.values).toEqual([[1,2,3],[4,5,6]])
    expect(df.shape).toEqual([2,3])
    expect(df.index).toEqual(new Index([0,1]))
    expect(df.columns).toEqual(new Index([0,1,2]))

    df = new DataFrame([[1, 2, 3], [4, 5, 6]],{index:['a', 2]})
    expect(df.values).toEqual([[1,2,3],[4,5,6]])
    expect(df.index).toEqual(new Index(['a',2]))

    df = new DataFrame([[1,2,3],[4,5,6]],
            {index:new Index(['b','b'],1)})
    expect(df.shape).toEqual([2,3])
    expect(df.index).toEqual(new Index(['b','b'],1))

    df = new DataFrame([[1,2,3],[4,5,6]],
        {columns:['a','b','b']})
    expect(df.index).toEqual(new Index([0,1]))
    expect(df.columns).toEqual(new Index(['a','b','b']))
        
    df = new DataFrame([[1,2,3],[4,5,6]],
        {index:[5,6],columns:new Index(['a',1,3],'k')})
    expect(df.index).toEqual(new Index([5,6]))
    expect(df.columns).toEqual(
        new Index(['a',1,3],'k'))

    df = new DataFrame([[]])
    expect(df.values).toEqual([[]])
    expect(df.index.values).toEqual([0])
    expect(df.shape).toEqual([1,0])

    expect(()=>new DataFrame([[]],{index:['a', 'b']}))
        .toThrow('shape')

    let df2 = new DataFrame([{}])
    expect(df2).toEqual(df)

    df = new DataFrame([],{columns:['a','b']})
    expect(df.shape).toEqual([0,2])
    expect(df.values).toEqual([])
    expect(df.tr).toEqual([[],[]])
    expect(df.index).toEqual(new Index([]))
    expect(df.columns).toEqual(new Index(['a','b']))

    df = new DataFrame([])
    expect(df.values).toEqual([])
    expect(df.index.values).toEqual([])
    expect(df.shape).toEqual([0,0])

    df = new DataFrame([{'a':1}])
    expect(df).toEqual(
        new DataFrame([[1]],{columns:['a']}))
    
    df = new DataFrame([{'a': 1}],{index:['B']})
    expect(df).toEqual(
            new DataFrame([[1]],{index:['B'],columns:['a']}))
    
    expect(()=>
        new DataFrame([[1],[2]]
            ,{columns:['a','b']}))
        .toThrow('shape')
})

test('index',()=>{
    let df = new DataFrame([[1],[2]])
    df.index = ['a','b']
    expect(df.index.values).toEqual(['a','b'])
    expect(()=>df.index=['a']).toThrow('shape')

    df.columns = new Index(['c'],'z')
    expect(df.columns.name).toEqual('z')

    const idx = ['a','b']
    df.index = idx
    idx[0] = 'e'
    expect(df.index.values).toEqual(['e','b'])
})

describe('iloc',()=>{
    test('empty',()=>{
        let df = new DataFrame([],{columns:[0,1]})
        expect(df.iloc(null,0)).toEqual(new Series([],{name:0}))
        expect(()=>df.iloc(0)).toThrow('range')
        expect(()=>df.iloc(0,0)).toThrow('range')
        expect(()=>df.iloc(0,[0])).toThrow('range')
        expect((df.iloc(null,[1]) as DataFrame<any>).loc()).toEqual(
            new DataFrame([],{columns:[1]}))


        df = new DataFrame([[]],{index:['a']})
        expect(df.iloc(0)).toEqual(new Series([],{name:'a'}))
        expect(()=>df.iloc(null,0)).toThrow('range')
        expect(df.iloc([0])).toEqual(df.loc())
    })

    test('_iloc',()=>{
        let df = new DataFrame([[1,2],[3,4]])
        let rf = df.iloc()
        expect(rf).toEqual(df)
        df.values[0][0] = 5
        expect(rf).not.toEqual(df)
        expect(rf).toEqual(
            new DataFrame([[1,2],[3,4]]))
        
        df = new DataFrame([[1,2],[3,4]])
        expect(df.iloc(1,0)).toEqual(3)

        expect(df.iloc(1)).toEqual(
            new Series([3,4],{name:1})
        )

        expect(df.iloc(null,0)).toEqual(
            new Series([1,3],{name:0})
        )

        expect(df.iloc(0,[1])).toEqual(
            new Series([2],{index:[1],name:0})
        )
        expect(df.iloc(0,[false,true])).toEqual(
            new Series([2],{index:[1],name:0})
        )

        expect(df.iloc([1],0)).toEqual(
            new Series([3],{index:[1],name:0})
        )
        expect(df.iloc([false,true],0)).toEqual(
            new Series([3],{index:[1],name:0})
        )

        expect(df.iloc([1])).toEqual(
            new DataFrame([[3, 4]],{index:[1]})
        )
        expect(df.iloc([false,true])).toEqual(
            new DataFrame([[3, 4]],{index:[1]})
        )

        expect((df.iloc(null,[1]) as DataFrame<number>).loc()).toEqual(
            new DataFrame([[2],[4]],{columns:[1]})
        )
        expect((df.iloc(null,[false,true]) as DataFrame<number>).loc()).toEqual(
            new DataFrame([[2],[4]],{columns:[1]})
        )

        expect(df.iloc(null,[1]).loc()).toEqual(
            new DataFrame([[2], [4]],{index:[0, 1],columns:[1]})
        )

        expect(df.iloc([0],[1]).loc()).toEqual(
            new DataFrame([[2]],{index:[0],columns:[1]})
        )
        expect(df.iloc([true,false],
            [false,true]).loc()).toEqual(
            new DataFrame([[2]],{index:[0],columns:[1]})
        )
    })

    test('iloc',()=>{
        let df = new DataFrame([[1,2],[3,4]])

        expect(df.iloc([-1],0)).toEqual(
            new Series([3],{index:[1],name:0})
        )
        expect(df.iloc(null,-2)).toEqual(
            new Series([1,3],{name:0})
        )
        expect(df.iloc(':1','1:2')).toEqual(
            new DataFrame([[2]],{index:[0],columns:[1]})
        )
        expect(df.iloc(':-1','-1:')).toEqual(
            new DataFrame([[2]],{index:[0],columns:[1]})
        )
        expect(df.iloc(0,'1:')).toEqual(
            new Series([2],{index:[1],name:0})
        )
        expect(df.iloc(':2',[false,true])).toEqual(
            new DataFrame([[2],[4]],{columns:[1]})
        )

        const df2 = new DataFrame([[1,2],[3,null]])
        expect(df2.iloc(1,1)).toEqual(null)
    })
})

describe('loc',()=>{
    test('empty',()=>{
        let df = new DataFrame([],{columns:['a','b']})
        expect(df.loc(null,'a')).toEqual(new Series([],{name:'a'}))
        expect(()=>df.loc('a')).toThrow('exist')
        expect((df.loc(null,['b']) as DataFrame<unknown>).loc()).toEqual(
            new DataFrame([],{columns:['b']}))


        df = new DataFrame([[]],{index:['a']})
        expect(df.loc('a')).toEqual(new Series([],{name:'a'}))
        expect(()=>df.loc(null,0)).toThrow('exist')
        expect(df.loc(['a'])).toEqual(df)
    })

    test('loc',()=>{
        let df = new DataFrame([[1, 2], [3, 4]],{index:['a', 'b'],columns:['c', 5]})
        expect(df.loc(['b'],'c')).toEqual(
            new Series([3],{index:['b'],name:'c'})
        )
        expect(df.loc(null,5)).toEqual(
            new Series([2,4],{index:['a','b'],name:5})
        )
        expect(df.loc(['a'],[5])).toEqual(
            new DataFrame([[2]],{index:['a'],columns:[5]})
        )
        expect(df.loc(['a','b'],['c'])).toEqual(
            new DataFrame([[1], [3]],{index:['a', 'b'],columns:['c']})
        )
        expect(df.loc('a',[5])).toEqual(
            new Series([2],{index:[5],name:'a'})
        )
        expect(df.loc(['a','b'],[5])).toEqual(
            new DataFrame([[2], [4]],{index:['a', 'b'],columns:[5]})
        )

        df = new DataFrame([[1, 2, 3], [3, 8, 9], [5, 6, 7]],{index:['a', 'b', 'b'],columns:['c', 'c', 'e']})
        expect(df.loc('b')).toEqual(
            new DataFrame([[3, 8, 9], [5, 6, 7]],{index:['b', 'b'],columns:['c', 'c', 'e']})
        )
        expect(df.loc(['b','a'])).toEqual(
            new DataFrame([[3, 8, 9], [5, 6, 7], [1, 2, 3]],{index:['b', 'b', 'a'],columns:['c', 'c', 'e']})
        )
        expect(df.loc('b','c')).toEqual(
            new DataFrame([[3, 8], [5, 6]],{index:['b', 'b'],columns:['c', 'c']})
        )
    })
})

test('transpose',()=>{
    let df = new DataFrame([[]])
    let ds = new DataFrame([],{columns:[0]})
    expect(df.transpose()).toEqual(ds)
    expect(df.transpose(true).loc()).toEqual(ds)
    expect(df.loc()).toEqual(ds)

})

describe('iset',()=>{
    test('symmetric',()=>{
        let df = new DataFrame([[1,2],[3,4]])
        df.iset([[5,6],[7,8]])
        expect(df.loc()).toEqual(
            new DataFrame([[5,6],[7,8]])
        )
        expect(()=>df.iset([[5],[6]])).toThrow('second')
        expect(()=>df.iset([[5,7],[6]])).toThrow('second')
        expect(()=>df.iset([[5,7]])).toThrow('first')
        
        df.iset(1,0,9)
        expect(df.iloc()).toEqual(
            new DataFrame([[5,6],[9,8]])
        )
        expect(()=>df.iset(2,0,9)).toThrow('range')
        expect(()=>df.iset(1,3,9)).toThrow('range')
        
        df = new DataFrame([[1,2,3],[4,5,6],[7,8,9]])
        df.iset([0,1],[1,2],[[10,10],[10,10]])
        expect(df).toEqual(
            new DataFrame([[1,10,10],
                           [4,10,10],
                           [7,8,9]])
        )
        expect(()=>
            df.iset([0,3],[1,2],[[10,10],[10,10]])
        ).toThrow('range')
        expect(()=>
            df.iset([0,1],[1,2],[[10,10],[10]])
        ).toThrow('length')
    })

    test('asymmetric',()=>{
        let df = new DataFrame([[1,2],[3,4]])
        df.iset(1,[5,6])
        expect(df.loc()).toEqual(
            new DataFrame([[1,2],[5,6]])
        )

        df.iset(null,0,[7,7])
        expect(df.loc()).toEqual(
            new DataFrame([[7,2],[7,6]])
        )
        expect(()=>{df.iset(3,[5,6])})
            .toThrow('range')
        expect(()=>{df.iset(1,[8])})
            .toThrow('length')

        df = new DataFrame([[1,2,3],[4,5,6],[7,8,9]])
        df.iset(1,[1,2],[9,10])
        expect(df).toEqual(
            new DataFrame([[1,2,3],[4,9,10],[7,8,9]])
        )
        df.iset([0,1],1,[5,8])
        expect(df.loc()).toEqual(
            new DataFrame([[1,5,3],[4,8,10],[7,8,9]])
        )
        expect(()=>{df.iset([1,2],5,[5,6])})
            .toThrow('range')
        expect(()=>{df.iset(2,[1,2],[8])})
            .toThrow('length')
        
        df = new DataFrame([[1,2,3],[4,5,6],[7,8,9]])
        df.iset([1,2],[[5,5,5],[6,6,6]])
        expect(df).toEqual(
            new DataFrame([[1,2,3],
                [5,5,5],
                [6,6,6]])
        )

        df = new DataFrame([[1,2,3],[4,5,6],[7,8,9]])
        df.iset(null,[0,1],[[5,6],[5,6],[11,12]])
        expect(df.loc()).toEqual(
            new DataFrame([[5,6,3],
                [5,6,6],
                [11,12,9]])
        )
        expect(()=>df.iset(null,[0,1],[[5,5,5],[6,6,6]]))
            .toThrow('length')
    })

    test('null',()=>{
        let df = new DataFrame<number|null>([[1,2],[3,5]])
        df.iset(0,[3,null])
        expect(df.iloc(0).values).toEqual([3,null])
    })
})

describe('set',()=>{
    test('symmetric',()=>{
        let df = new DataFrame([[1, 2], [3, 4]],{index:['a', 5],columns:['b', 'c']})
        df.set([[5,6],[7,8]])
        expect(df.loc()).toEqual(
            new DataFrame([[5, 6], [7, 8]],{index:['a', 5],columns:['b', 'c']})
        )
        expect(()=>df.set([[5],[6]])).toThrow('second')
        expect(()=>df.set([[5,7],[6]])).toThrow('second')
        expect(()=>df.set([[5,7]])).toThrow('first')
        
        df.set(5,'c',9)
        expect(df).toEqual(
            new DataFrame([[5, 6], [7, 9]],{index:['a', 5],columns:['b', 'c']})
        )
        expect(()=>df.set('d',0,9)).toThrow('exist')
        expect(()=>df.set(5,'z',9)).toThrow('exist')
        
        df = new DataFrame([[1, 2, 3], [4, 5, 6], [7, 8, 9]],{index:['a', 'b', 'c'],columns:['d', 'e', 'f']})
        df.set(['a','b'],['e','f'],[[10,10],[10,10]])
        expect(df).toEqual(
            new DataFrame([[1, 10, 10], [4, 10, 10], [7, 8, 9]],{index:['a', 'b', 'c'],columns:['d', 'e', 'f']})
        )
        expect(()=>
            df.set([0,3],[1,2],[[10,10],[10,10]])
        ).toThrow('exist')
        expect(()=>
            df.set(['a','b'],['e','f'],[[10,10],[10]])
        ).toThrow('length')
    })

    test('asymmetric',()=>{
        let df = new DataFrame([[1, 2], [3, 4]],{index:['a', 'b'],columns:['c', 'd']})
        df.set('b',[5,6])
        expect(df).toEqual(
            new DataFrame([[1, 2], [5, 6]],{index:['a', 'b'],columns:['c', 'd']})
        )

        df.set(null,'c',[7,7])
        expect(df.loc()).toEqual(
            new DataFrame([[7, 2], [7, 6]],{index:['a', 'b'],columns:['c', 'd']})
        )
        // expect(()=>{df.set('z',[5,6])})
        //     .toThrow('exist')
        expect(()=>{df.set('b',[8])})
            .toThrow('length')

        df = new DataFrame([[1, 2, 3], [4, 5, 6], [7, 8, 9]],{index:['a', 'b', 'c'],columns:['d', 'e', 'f']})
        df.set('b',['e','f'],[9,10])
        expect(df).toEqual(
            new DataFrame([[1, 2, 3], [4, 9, 10], [7, 8, 9]],{index:['a', 'b', 'c'],columns:['d', 'e', 'f']})
        )
        df.set(['a','b'],'e',[5,8])
        expect(df.loc()).toEqual(
            new DataFrame([[1, 5, 3], [4, 8, 10], [7, 8, 9]],{index:['a', 'b', 'c'],columns:['d', 'e', 'f']})
        )
        expect(()=>{df.set(['b','c'],'z',[5,6])})
            .toThrow('exist')
        expect(()=>{df.set('b',['d','e'],[8])})
            .toThrow('length')
        
        df = new DataFrame([[1, 2, 3], [4, 5, 6], [7, 8, 9]],{index:['a', 'b', 'c'],columns:['d', 'e', 'f']})
        df.set(['b','c'],[[5,5,5],[6,6,6]])
        expect(df).toEqual(
            new DataFrame([[1, 2, 3], [5, 5, 5], [6, 6, 6]],{index:['a', 'b', 'c'],columns:['d', 'e', 'f']})
        )

        df = new DataFrame([[1, 2, 3], [4, 5, 6], [7, 8, 9]],{index:['a', 'b', 'c'],columns:['d', 'e', 'f']})
        df.set(null,['d','e'],[[5,6],[5,6],[11,12]])
        expect(df.loc()).toEqual(
            new DataFrame([[5, 6, 3], [5, 6, 6], [11, 12, 9]],{index:['a', 'b', 'c'],columns:['d', 'e', 'f']})
        )
        expect(()=>df.set(null,['d','e'],[[5,5,5],[6,6,6]]))
            .toThrow('length')

        df = new DataFrame([[1, 2], [5, 6], [8, 9]],{index:['a', 'b', 'c'],columns:['e', 'f']})
        df.set('e',[10,12])
        expect(df).toEqual(
            new DataFrame([[1, 2], [5, 6], [8, 9], [10, 12]],{index:['a', 'b', 'c', 'e'],columns:['e', 'f']})
        )

        df = new DataFrame([[1, 2], [5, 6], [8, 9]],{index:['a', 'b', 'c'],columns:['e', 'f']})
        df.set(null,5,[10,12,16])
        expect(df.loc()).toEqual(
            new DataFrame([[1, 2, 10], [5, 6, 12], [8, 9, 16]],{index:['a', 'b', 'c'],columns:['e', 'f', 5]})
        )
    })
    test('index is not unique-valued',()=>{
        let df = new DataFrame([[1, 2, 3], [3, 8, 9], [5, 6, 7]],{index:['a', 'b', 'b'],columns:['c', 'c', 'e']})
        df.set('b',[[1,1,2],[3,3,5]])
        expect(df).toEqual(
            new DataFrame([[1, 2, 3], [1, 1, 2], [3, 3, 5]],{index:['a', 'b', 'b'],columns:['c', 'c', 'e']})
        )
        df.set('b','c',[[3,3],[5,5]])
        expect(df).toEqual(
            new DataFrame([[1, 2, 3], [3, 3, 2], [5, 5, 5]],{index:['a', 'b', 'b'],columns:['c', 'c', 'e']})
        )
        df.set(null,['e','c'],[[1,2,3],[3,8,9],[5,6,7]])
        expect(df.loc()).toEqual(
            new DataFrame([[2, 3, 1], [8, 9, 3], [6, 7, 5]],{index:['a', 'b', 'b'],columns:['c', 'c', 'e']})
        )
        df.set(['b','a'],['e','c'],[[1,2,3],[3,8,9],[5,6,7]])
        expect(df).toEqual(
            new DataFrame([[6, 7, 5], [2, 3, 1], [8, 9, 3]],{index:['a', 'b', 'b'],columns:['c', 'c', 'e']})
        )
        df = new DataFrame([[1, 2], [3, 4]],{index:['b', 'b']})
        df.set(['b','b'],[[5,6],[7,8],[9,10],[11,12]])
        expect(df).toEqual(
            new DataFrame([[9, 10], [11, 12]],{index:['b', 'b']})
        )
        expect(()=>df.set('b',[2,3])).toThrow('match')
        // expect(()=>df.set([true,true,false],[1,2])).toThrow('match')
    
        expect(()=>df.set(['b','b'],[[1,2],[3,4]])).toThrow('match')

        df = new DataFrame([[1, 2, 3], [3, 8, 9], [5, 6, 7]],{index:['a', 'b', 'b'],columns:['c', 'c', 'e']})
        // differ from python
        expect(()=>df.set('b','c',1)).toThrow('Cannot')
    })
})

test('insert',()=>{
    let df = new DataFrame([[1, 2], [3, 4]],{index:['a', 5],columns:['b', 'c']})
    df.insert(-1,[7,8],{name:'z'})
    // console.log(df)
    expect(df.loc()).toEqual(
        new DataFrame([[1, 7, 2], [3, 8, 4]],{index:['a', 5],columns:['b', 'z', 'c']})
    )
    
    df = new DataFrame([[1, 2], [3, 4]],{index:['a', 5],columns:['b', 'c']})
    df.insert(1,[9,10],{name:'k',axis:0})
    expect(df).toEqual(
        new DataFrame([[1, 2], [9, 10], [3, 4]],{index:['a', 'k', 5],columns:['b', 'c']})
    )

})

test('push',()=>{
    let df = new DataFrame([[1, 2], [3, 4]],{index:['a', 5],columns:['b', 'c']})
    df.push([7,8],{name:'z'})
    // console.log(df)
    expect(df.loc()).toEqual(
        new DataFrame([[1, 2, 7], [3, 4, 8]],{index:['a', 5],columns:['b', 'c', 'z']})
    )
    
    df = new DataFrame([[1, 2], [3, 4]],{index:['a', 5],columns:['b', 'c']})
    df.push([7,8],{name:'z',axis:0})
    expect(df.loc()).toEqual(
        new DataFrame([[1, 2], [3, 4], [7, 8]],{index:['a', 5, 'z'],columns:['b', 'c']})
    )

    df = new DataFrame([[1, 2], [3, 4]],
        {index:['a', 5],
        columns:['b', 'c']})
    
    let ss = new Series([7,8],
        {name:'z',index:['b','c']})
    df.push(ss,{axis:0})
    expect(df.values).toEqual([[1,2],[3,4],[7,8]])
    expect(df.index.values).toEqual(['a',5,'z'])

    df = df.drop('z',0)
    ss = new Series([7,8,9],
        {name:'z',index:['c','b','d']})
    df.push(ss,{axis:0})
    expect(df.values).toEqual([[1,2],[3,4],[8,7]])
    expect(df.index.values).toEqual(['a',5,'z'])
    
    df = df.drop('z',0)
    ss = new Series([7,8,9],
        {name:'z',index:['c','b','b']})
    expect(()=>df.push(ss,{axis:0})).toThrow('unique')

    // df = df.drop('z',0)
    ss = new Series([7,8,9],
        {name:'z',index:['a','b','b']})
    expect(()=>df.push(ss,{axis:0})).toThrow('not in')


    df = new DataFrame([[1, 2], [3, 4]],
        {index:['a', 5],
        columns:['b', 'b']})
    ss = new Series([7,8],
        {name:'z',index:['b','b']})
    df.push(ss,{axis:0})
    expect(df.values).toEqual([[1,2],[3,4],[7,8]])
    expect(df.index.values).toEqual(['a',5,'z'])

    df = df.drop('z',0)
    ss = new Series([7,8],
        {name:'z',index:['b','c']})
    expect(()=>df.push(ss,{axis:0})).toThrow('unique')


})

test('drop',()=>{
    let df = new DataFrame([[1, 2, 3], [3, 8, 9], [5, 6, 7]],{index:['a', 'b', 'b'],columns:['c', 'c', 'e']})
    let df2 = df.drop(['a'],0)
    expect(df2).toEqual(
        new DataFrame([[3, 8, 9], [5, 6, 7]],{index:['b', 'b'],columns:['c', 'c', 'e']})
    )
    df2 = df.drop('a',0)
    expect(df2).toEqual(
        new DataFrame([[3, 8, 9], [5, 6, 7]],{index:['b', 'b'],columns:['c', 'c', 'e']})
    )
    
    df = new DataFrame([[1, 2, 3], [3, 8, 9], [5, 6, 7]],{index:['a', 'b', 'b'],columns:['c', 'c', 'e']})
    df2 = df.drop(['c'])
    expect(df2.loc()).toEqual(
        new DataFrame([[3], [9], [7]],{index:['a', 'b', 'b'],columns:['e']})
    )

    df = new DataFrame([[1, 2, 3], [3, 8, 9], [5, 6, 7]],{index:['a', 'b', 'b'],columns:['c', 'c', 'e']})
    df2 = df.drop('c').drop(['a'],0)
    expect(df2).toEqual(
        new DataFrame([[9], [7]],{index:['b', 'b'],columns:['e']})
    )
})

describe('reset_index_columns',()=>{
    test('index',()=>{
        let df = new DataFrame([[1, 2], [3, 4]],{index:['a', 5],columns:['b', 'b']})
        let df2 = df.reset_index()
        expect(df2.loc()).toEqual(
            new DataFrame([['a', 1, 2], [5, 3, 4]],{index:[0, 1],columns:['', 'b', 'b']})
        )
        df2 = df.reset_index('k')
        expect(df2.loc()).toEqual(
            new DataFrame([['a', 1, 2], [5, 3, 4]],{index:[0, 1],columns:['k', 'b', 'b']})
        )
    })
    test('columns',()=>{
        let df = new DataFrame([[1, 2], [3, 4]],{index:['a', 5],columns:['b', 'b']})
        let df2 = df.reset_columns()
        expect(df2).toEqual(
            new DataFrame<number|string>([['b', 'b'], [1, 2], [3, 4]],{index:['', 'a', 5],columns:[0, 1]})
        )
        df2 = df.reset_columns('k')
        expect(df2).toEqual(
            new DataFrame<number|string>([['b', 'b'], [1, 2], [3, 4]],{index:['k', 'a', 5],columns:[0, 1]})
        )
    })
})

test('b',()=>{
    let df = new DataFrame([[1, 2, 3], 
                            [3, 8, 9], 
                            [5, 6, 7]],
{index:['a', 'b', 'b'],columns:['5', 5, 'e']})

    let bidx = df.b('["5"]>3')
    expect(bidx).toEqual([false,false,true])
    bidx = df.b('[ "5" ]>3')
    expect(bidx).toEqual([false,false,true])

    let val = 3
    bidx = df.b(`[5]>${val}`)
    expect(bidx).toEqual([false,true,true])

    bidx = df.b('["5"]>@',{ctx:val})
    expect(bidx).toEqual([false,false,true])

    bidx = df.b('["5"]>@val',{ctx:{val:3}})
    expect(bidx).toEqual([false,false,true])

    bidx = df.b('[5]>@val && [5]<@val2',{ctx:{val:3,val2:8}})
    expect(bidx).toEqual([false,false,true])
    
    // for duplicate index, use the last one as in pandas query function
    bidx = df.b('["b"]>3',{axis:0})
    expect(bidx).toEqual([true,true,true])
    // df._b('`a` > 5 && `b` === "a"')
    bidx = df.b('["5"]>3 && ["e"]<8')
    expect(bidx).toEqual([false,false,true])
})

test('q',()=>{
    let df = new DataFrame([[1, 2, 3], 
                            [3, 8, 9], 
                            [5, 6, 7]],
    {index:['a', 'b', 'b'],columns:['5', 5, 'e']})

    let df2 = df.q('["5"]>3')
    expect(df2).toEqual(new DataFrame([[5, 6, 7]],{index:['b'],columns:['5', 5, 'e']}))

    let val = 3
    df2 = df.q('["5"]>@',val)
    expect(df2).toEqual(new DataFrame([[5, 6, 7]],{index:['b'],columns:['5', 5, 'e']}))

    df2 = df.q('["5"]>@val',{val:val})
    expect(df2).toEqual(new DataFrame([[5, 6, 7]],{index:['b'],columns:['5', 5, 'e']}))

    df2 = df.q('["5"]>@val','["a"]>@val2',{val:val,val2:1})
    expect(df2).toEqual(new DataFrame([[6, 7]],{index:['b'],columns:[ 5, 'e']}))


    df2 = df.q(null,'["a"]>1 && ["a"]<3')
    expect(df2.loc()).toEqual(new DataFrame([[2], [8], [6]],{index:['a', 'b', 'b'],columns:[5]}))
    df2 = df.q('[5]>3','["a"]>1')
    expect(df2).toEqual(new DataFrame([[8, 9], [6, 7]],{index:['b', 'b'],columns:[5, 'e']}))
    let dx = new DataFrame<number|string>([[1, 2, 3], ['e', 'a', 'c'], [5, 6, 7]],{index:['a', 'b', 'b'],columns:['5', 5, 'e']})
    let dx2 = dx.q('["a","c"].includes([5]) && ["e"]<7')
    expect(dx2).toEqual(new DataFrame<number|string>([],{index:[],columns:['5', 5, 'e']}))
    let dx3 = dx.query('["a","c"].includes([5]) && ["e"]<7')
    expect(dx3).toEqual(new DataFrame<number|string>([],{index:[],columns:['5', 5, 'e']}))


    dx = new DataFrame<number|string>([[1, 'e', 3], [3, 'a', 9], [5, 'c', 7]],{index:['a', 'b', 'b'],columns:['5', 5, 'e']})
    dx2 = dx.q('["a","c"].includes([5]) && ["e"]>7')
    expect(dx2).toEqual(new DataFrame<number|string>([[3, 'a', 9]],{index:['b'],columns:['5', 5, 'e']}))
})

test('to_dict',()=>{
    let df = new DataFrame([[1, 2], [3, 4]],{index:['a', 5],columns:[3, 'b']})
    expect(df.to_dict()).toEqual([{3:1,'b':2},{3:3,'b':4}])
    expect(df.to_dict(0)).toEqual([{'a':1,5:3},{'a':2,5:4}])

    df = new DataFrame([[1, 2], [3, 5]],{index:['a', 5],columns:['b', 'b']})
    expect(df.to_dict()).toEqual([{'b':2},{'b':5}])

})

test('groupby',()=>{

    let df = new DataFrame([[3, 2, 3], 
                            [3, 8, 9], 
                            [5, 6, 7]],
            {index:['a', 'b', 'b'],
            columns:['5', 5, 'e']})
    const df2 = df.groupby().mean()
    // console.log(df2)
    expect(df2.values).toEqual([[3,2,3],
                                [4,7,8]])
    expect(df2.index.values).toEqual(['a','b'])

    for(const [gp,key,i] of df.groupby()){
        expect(gp.shape).toEqual([1,3])
        // expect(group.shape).toEqual([1,3])
        expect(key).toEqual('a')
        expect(i).toEqual(0)
        break
    }
    df.groupby().then((gp,k,i)=>{
        if(i===1){
            expect(gp).toEqual(new DataFrame([[3, 8, 9], [5, 6, 7]],{index:['b', 'b'],columns:['5', 5, 'e']}))
            expect(k).toEqual('b')
        }
    })
    df.groupby('5').then((gp,k,i)=>{
        if(i===0){
            expect(gp).toEqual(new DataFrame([[3, 2, 3], [3, 8, 9]],{index:['a', 'b'],columns:['5', 5, 'e']}))
            expect(k).toEqual(3)
        }
    })
    df.groupby('a',1).then((gp,k,i)=>{
        if(i===0){
            expect(gp.loc()).toEqual(new DataFrame([[3, 3], [3, 9], [5, 7]],{index:['a', 'b', 'b'],columns:['5', 'e']}))
            expect(k).toEqual(3)
        }
        if(i===1){
            expect(gp.loc()).toEqual(new DataFrame([[2], [8], [6]],{index:['a', 'b', 'b'],columns:[5]}))
            expect(k).toEqual(2)
        }
    })

    df = new DataFrame([[3, 8, 3], 
                        [3, 8, 9], 
                        [3, 6, 7], 
                        [9, 8, 7]],
            {index:['a', 'b', 'b', 'c'],
            columns:['5', 5, 'e']})

    const df3 = df.groupby(['5',5]).mean()
    expect(df3.values).toEqual([[6],[7],[7]])
    expect(df3.index.values).toEqual(
        [ '[3,8]', '[3,6]', '[9,8]' ])


    df.groupby(['5',5]).then((gp,k,i)=>{
        if(i===0){
            expect(gp).toEqual(new DataFrame([[3, 8, 3], [3, 8, 9]],{index:['a', 'b'],columns:['5', 5, 'e']}))
            expect(k).toEqual([3,8])
        }
    })

    df.groupby('b',1).then((gp,k,i)=>{
        if(i===1){
            expect(gp.loc()).toEqual(new DataFrame([[8], [8], [6], [8]],{index:['a', 'b', 'b', 'c'],columns:[5]}))
            expect(k).toEqual([8,6])
        }
    })
})

test('sort values',()=>{
    let df = new DataFrame([[3, 8, 3], 
                            [3, 8, 9], 
                            [3, 6, 7],
                            [9, 8, 7]],
    {index:['a', 'b', 'b', 'c'],
     columns:['5', 5, 'e']})
    
    let df2 = df.sort_values('e')
    expect(df2.values).toEqual(
        [[3,8,3],
        [3,6,7],
        [9,8,7],
        [3,8,9]]
    )
    df2 = df.sort_values([5,'e'],{ascending:[true,false]})
    expect(df2.values).toEqual(
        [ [3,6,7],
        [3,8,9],
        [9,8,7],
        [3,8,3]
        ]
    )

    df2 = df.sort_values([5,'e'])
    expect(df2.values).toEqual(
        [ [3,6,7],
        [3,8,3],
        [9,8,7],
        [3,8,9]]
    )

    df2 = df.sort_values('c',{ascending:true,axis:0})
    expect(df2.values).toEqual(
        [ [3,8,3],
        [9,8,3],
        [7,6,3],
        [7,8,9]]    
    )

    let df3 = new DataFrame([['10','2'],
                        ['3','4']])
    let dfx = df3.sort_values(0,{ascending:false,axis:0})
    expect(dfx.values).toEqual(
        [['2','10'],
        ['4','3']]
    )
})

test('value_counts',()=>{
    let df = new DataFrame([[3, 8, 3], [3, 8, 9], [3, 6, 7], [9, 8, 7]],{index:['a', 'b', 'b', 'c'],columns:['5', 5, 'e']})

    let ss = (df.loc(null,'5') as Series<number>)
        .value_counts()
    expect(ss.values).toEqual([3,1])

    ss = (df.loc(null,'e') as Series<number>)
        .value_counts()
    expect(ss.values).toEqual([2,1,1])

})

test('reduce',()=>{
    let df = new DataFrame([[1,2],[3,4]])
    expect(df.op<number>('x>2').reduce(_.sum)).toEqual(
        new Series([1,1])
    )
    expect(df.op<number>('x>2').reduce(_.sum,1)).toEqual(
        new Series([0,2])
    )
    expect(df.op<number>('x>2').reduce(_.sum,1).reduce(_.sum)).toEqual(
        2
    )
})

test('stats',()=>{
    let df = new DataFrame([[1,2],[3,4]])
    expect(df.mean(1).values).toEqual([1.5,3.5])
    expect(df.mean(0).values).toEqual([2,3])

    expect(df.median(1).values).toEqual([1.5,3.5])
    expect(df.median(0).values).toEqual([2,3])

    expect(df.min(1).values).toEqual([1,3])
    expect(df.min(0).values).toEqual([1,2])

    expect(df.max(1).values).toEqual([2,4])
    expect(df.max(0).values).toEqual([3,4])

    expect(df.sum(1).values).toEqual([3,7])
    expect(df.sum(0).values).toEqual([4,6])

})


test('op',()=>{
    let df = new DataFrame([[1, 2], [3, 4]],{index:['a', 5],columns:['b', 'c']})
    let df2 = new DataFrame([[1, 2], [3, 4]],{index:[5, 'a'],columns:['b', 'c']})

    expect(df.op('x*x').values).toEqual([[1,4],[9,16]])
    expect(df.op(x=>x*x).values).toEqual([[1,4],[9,16]])
    expect(df.op('x+y',df2).values).toEqual(
        [[4,6],[4,6]])
    expect(df.op('x+y',df2.values).values).toEqual(
        [[2,4],[6,8]]
    )

    df2 = new DataFrame([[1, 2], [3, 4]],{index:[5, 'a'],columns:['c', 'b']})
    expect(df.op('x+y',df2).values).toEqual(
        [[5,5],[5,5]])
        
    df2 = new DataFrame([[1, 2], [3, 4], [5, 7]],{index:[5, 'a', 'b'],columns:['b', 'c']})
    expect(()=>df.op('x+y',df2)).toThrow('equal')
    expect(()=>df.op('x+y',df2.values)).toThrow('equal')

    df2 = new DataFrame([[1, 2], [3, 4]],{index:['a', 'a'],columns:['b', 'c']})
    expect(()=>df.op('x+y',df2)).toThrow('same')

    df = new DataFrame([[1, 2], [3, 4]],{index:['a', 'a'],columns:['b', 'c']})
    df2 = new DataFrame([[1, 2], [3, 4]],{index:['a', 'a'],columns:['b', 'c']})
    expect(df.op('x+y',df2).values).toEqual([[2,4],[6,8]])

    df2 = new DataFrame([[2, 1], [3, 4]],{index:['a', 'a'],columns:['b', 'c']})
    expect(df.op((x,y)=>x<y,df2).values).toEqual([[true,false],[false,false]])

    
    df = new DataFrame([[1, 2], [3, 4]],{index:['a', 5],columns:['b', 'c']})
    df2 = new DataFrame([[1, 2], [3, 4]],{index:['a', 'b'],columns:['b', 'c']})
    expect(()=>df.op('x+y',df2)).toThrow('exist')

    df2 = new DataFrame([[1, 2, 3], [3, 4, 5]],{index:[5, 'a'],columns:['a', 'b', 'c']})
    expect(()=>df.op('x+y',df2.values)).toThrow('equal')
    expect(()=>df.op('x+y',df2)).toThrow('equal')

})

test('set_index/columns',()=>{
    let df = new DataFrame([[1, 2], [3, 4]],
        {index:['a', 5],columns:['b', 'c']})
    let df2 = df.set_index('b')
    let de = new DataFrame([[2], [4]],
        {index:new Index([1, 3],'b')
        ,columns:['c']})
    let tr = de.tr
    expect(df2).toEqual(de)
    
    df2 = df.set_columns(5)
    de = new DataFrame([[1,2]],{
        index:['a'],columns:new Index([3,4],5)
    })
    // tr = de.tr
    expect(df2).toEqual(de)

    df = new DataFrame([[1, 2], [3, 4]],
        {index:['a', 5],columns:['b', 'b']})
    expect(()=>df.set_index('b')).toThrow('unique')
})

describe('merge',()=>{
    test('merge by column',()=>{
        let df = new DataFrame([[1, 2], 
            [3, 4]],
        {index:new Index(['a', 5],'nx'),columns:['b', 'c']})

        let df2 = new DataFrame([[3, 2], 
                    [1, 4]],
        {index:[5, 'a'],columns:['b', 'c']})

        let ff = df.merge(df2)
        let de = new DataFrame([[1,2,1,4],[3,4,3,2]],
        {index:['a',5],columns:['b','c','b','c']})
        let tr = de.tr
        expect(ff).toEqual(de)

        ff = df.merge(df2,{on:'b'})
        de = new DataFrame([[1,2,4],[3,4,2]],
        {columns:['b','c','c']})
        tr = de.tr
        expect(ff).toEqual(de)

        df2 = new DataFrame([[3, 2], 
        [3, 4]],
        {index:[5, 'a'],columns:['b', 'c']})
        expect(()=>(df.merge(df2,{on:'b'}))).toThrow('unique')
    })
    
    test('merge by row',()=>{
        let df = new DataFrame([[1, 2], 
            [3, 4]],
        {index:new Index(['a', 5],'nx'),columns:['b', 'c']})
        .transpose()

        let df2 = new DataFrame([[3, 2], 
                    [1, 4]],
        {index:[5, 'a'],columns:['b', 'c']})
        .transpose()

        let ff = df.merge(df2,{axis:0})
        let de = new DataFrame([[1,2,1,4],[3,4,3,2]],
        {index:['a',5],columns:['b','c','b','c']}).transpose()
        // let tr = de.tr
        expect(ff).toEqual(de)

        ff = df.merge(df2,{on:'b',axis:0})
        de = new DataFrame([[1,2,4],[3,4,2]],
        {columns:['b','c','c']}).transpose()
        // tr = de.tr
        expect(ff).toEqual(de)

        df2 = new DataFrame([[3, 2], 
        [3, 4]],
        {index:[5, 'a'],columns:['b', 'c']}).transpose()
        expect(()=>(df.merge(df2,{on:'b',axis:0}))).toThrow('unique')
    })
})

test('rank',()=>{
    let df2 = new DataFrame([[3, 2], 
        [1, 4]],    
    {index:[5, 'a'],columns:['b', 'c']})
    let target = new DataFrame([[2,1],[1,2]],
        {index:[5, 'a'],columns:['b', 'c']})
    expect(df2.rank({axis:1})).toEqual(target)
    expect(df2.rank()).toEqual(target.transpose(true).transpose(true))
    expect(df2).toEqual(new DataFrame([[3, 2], 
        [1, 4]],    
    {index:[5, 'a'],columns:['b', 'c']})
        .transpose(true).transpose(true))

    df2 = new DataFrame([[3, 3], 
        [1, 4]],    
    {index:[5, 'a'],columns:['b', 'c']})
    expect(df2.rank({axis:1})).toEqual(
        new DataFrame([[1.5, 1.5], [1, 2]],    
    {index:[5, 'a'],columns:['b', 'c']}))
    expect(df2.rank({axis:1,method:'max'})).toEqual(
        new DataFrame([[2, 2], [1, 2]],    
    {index:[5, 'a'],columns:['b', 'c']}))
    expect(df2.rank({axis:1,method:'ordinal'})).toEqual(
        new DataFrame([[1,2], [1, 2]],    
    {index:[5, 'a'],columns:['b', 'c']}))
    
})

test('to_raw, from_raw',()=>{
    let df = new DataFrame([[1,2],[3,4]],{index:['a',5],columns:['b','c']})
    let df_raw = df.to_raw()
    expect(from_raw(df_raw)).toEqual(df)

    df_raw = df.to_raw(false)
    df.iset(0,1,10)
    expect(from_raw(df_raw).iloc(0,1)).toEqual(10)
})

test('drop_duplicates',()=>{
    let df = new DataFrame([[3, 8, 3], 
                            [3, 8, 9], 
                            [3, 6, 7], 
                            [9, 8, 7]],
        {index:['a', 'b', 'b', 'c'],
        columns:['5', 5, 'e']})

    expect(df.drop_duplicates('5')).toEqual(
        new DataFrame([[3,8,3],[9,8,7]],
            {index:['a','c'],columns:['5',5,'e']})
    )
    expect(df.drop_duplicates(['5',5])).toEqual(
        new DataFrame([[3,8,3],[3,6,7],[9,8,7]],
            {index:['a','b','c'],columns:['5',5,'e']})
    )
    expect(df.drop_duplicates(['5',5],{keep:'last'})).toEqual(
        new DataFrame([[3,8,9],[3,6,7],[9,8,7]],
            {index:['b','b','c'],columns:['5',5,'e']})
    )
    let df2 = new DataFrame([[3,8],[3,8],[3,6],[9,8]],
        {index:['a','b','b','c'],columns:['5',5]})
    expect(df.drop_duplicates('a',{axis:0})).toEqual(
        df2.transpose(true).transpose(true)
    )

    df = new DataFrame([[3, 8, 3, 3], 
                        [7, 8, 9, 7], 
                        [3, 7, 7, 8],
                        [3, 9, 9, 7]],
    {index:['a', 'd','b', 'b'],
    columns:['5', 5, 'e','d']})

    expect(df.drop_duplicates(['a','d'],{keep:'last',axis:0}))
        .toEqual(
            new DataFrame([[8, 3, 3], 
                            [8, 9, 7], 
                            [7, 7, 8],
                            [9, 9, 7]],
            {index:['a', 'd','b', 'b'],
            columns:[ 5, 'e','d']}).transpose(true).transpose(true)
        )
    expect(df.drop_duplicates('b',{axis:0}))
        .toEqual(
            new DataFrame([[3, 8,  3], 
                            [7, 8,  7], 
                            [3, 7,  8],
                            [3, 9, 7]],
            {index:['a', 'd','b', 'b'],
            columns:['5', 5,'d']}).transpose(true).transpose(true)
        )
})

test('rename',()=>{
    let df = new DataFrame([[1,2],[3,4]],{index:['a',5],columns:['b','c']})
    let df2 = df.rename({})
    expect(df2).toEqual(df)

    df2.rename({},true)
    expect(df2).toEqual(df)

    df.rename({index:{a:3}},true)
    expect(df.index.values).toEqual([3,5])

    df.rename({index:{3:'a'},columns:{b:5}},true)
    expect(df.index.values).toEqual(['a',5])
    expect(df.columns.values).toEqual([5,'c'])

    df2 = df.rename({index:{a:'k'}})
    expect(df2.index.values).toEqual(['k',5])
    expect(df.index.values).toEqual(['a',5])

})

test('iterrows,itercols',function(){
    let df = new DataFrame([[1,2],[3,4]],
        {index:['a',5],columns:['b','c']})

    for(const [row,key] of df.iterrows()){
        expect(row.values).toEqual([1,2])
        expect(key).toEqual('a')
        break
    }

    for(const [col,key,i] of df.itercols()){
        if(i==0){
            expect(col.values).toEqual([1,3])
            expect(key).toEqual('b')
            expect(i).toEqual(0)
        }else{
            expect(col.values).toEqual([2,4])
            expect(key).toEqual('c')
        }
        
    }

})


test('diff',()=>{
    const df = new DataFrame(
       [[ 1,  1,  1],
        [ 2,  1,  4],
        [ 3,  2,  9],
        [ 4,  3, 16],
        [ 5,  5, 25],
        [ 6,  8, 36]]
    )

    expect(df.diff().values).toEqual(
        [[NaN, NaN, NaN],
        [1, 0, 3],
        [1, 1, 5],
        [1, 1, 7],
        [1, 2, 9],
        [1, 3, 11]]
    )
    expect(df.index.values).toEqual(df.diff().index.values)
    expect(df.columns.values).toEqual(df.diff().columns.values)

    expect(df.iloc(':5').diff({periods:2}).values).toEqual(
        [[NaN, NaN, NaN],
        [NaN, NaN, NaN],
        [2.0, 1.0, 8.0],
        [2.0, 2.0, 12.0],
        [2.0, 3.0, 16.0]]   )

    let res = df.iloc(':5').diff({periods:-2})
    expect(res.values).toEqual(
        [[-2.0, -1.0, -8.0],
        [-2.0, -2.0, -12.0],
        [-2.0, -3.0, -16.0],
        [NaN, NaN, NaN],
        [NaN, NaN, NaN]]
    )

    expect(df.index.values.slice(0,5)).toEqual(res.index.values)
    expect(df.columns.values).toEqual(res.columns.values)

    expect(df.diff({periods:0}).values).toEqual(full(df.shape,0))

    df.transpose(true)
    expect(df.diff({periods:2,axis:1}).values).toEqual(
        [[NaN, NaN, 2.0, 2.0, 2.0, 2.0],
        [NaN, NaN, 1.0, 2.0, 3.0, 5.0],
        [NaN, NaN, 8.0, 12.0, 16.0, 20.0]]
    )

    res = df.diff({periods:-1,axis:1})
    expect(res.values).toEqual(
        [[-1.0, -1.0, -1.0, -1.0, -1.0, NaN],
        [0.0, -1.0, -1.0, -2.0, -3.0, NaN],
        [-3.0, -5.0, -7.0, -9.0, -11.0, NaN]]
    )

    expect(df.index.values).toEqual(res.index.values)
    expect(df.columns.values).toEqual(res.columns.values)

})  


test('pct_change',()=>{
    const df = new DataFrame([[4.0405, 1.7246, 804.74], 
        [4.0963, 1.7482, 810.01], 
        [4.3149, 1.8519, 860.13]],
        {index:['1980-01-01', '1980-02-01', '1980-03-01'],
        columns:['FR', 'GR', 'IT']})
    
    let res = df.pct_change()
    let ref = [[NaN, NaN, NaN],
        [0.013810172008414945, 0.013684332598863591, 0.00654869895866983],
        [0.05336523203866883, 0.05931815581741229, 0.06187577931136645]]

    for(const i of range(res.shape[0]))
        for(const j of range(res.shape[1]))
            if(_.isNaN(res.values[i][j]))
                expect(_.isNaN(ref[i][j])).toBe(true)
            else
                expect(res.values[i][j]).toBeCloseTo(ref[i][j],5)

        
    expect(res.index.values).toEqual(df.index.values)
    expect(res.columns.values).toEqual(df.columns.values)

    const df2 = new DataFrame([[1769950, 1500923, 1371819], 
        [30586265, 40912316, 41403351]],
        {index:['GOOG', 'APPL'],
         columns:['2016','2015','2014']
        }
    )

    res = df2.pct_change({periods:-1,axis:1})
    ref = [[0.17924104034650679, 0.09411154095401808, NaN],
        [-0.2523946823249996, -0.011859788836898755, NaN]]
    
    for(const i of range(res.shape[0]))
        for(const j of range(res.shape[1]))
            if(_.isNaN(res.values[i][j]))
                expect(_.isNaN(ref[i][j])).toBe(true)
            else
                expect(res.values[i][j]).toBeCloseTo(ref[i][j],5)
    
    expect(res.index.values).toEqual(df2.index.values)
    expect(res.columns.values).toEqual(df2.columns.values)

})

test('rolling',()=>{

    let s = new Series([1,2,3,4,5,6],{index:['a','b','c','d','e','f'],name:'s'})
    let rs = s.rolling(3,{closed:'right',center:true,min_periods:3,step:2}).sum()
    let ref = new Series([NaN,9,15],{index:['a','c','e'],name:'s'})
    expect(rs).toEqual(ref)

    rs = s.rolling(3,{closed:'right',center:true,min_periods:3,step:1}).sum()
    ref = new Series([NaN,6,9,12,15,NaN],{index:['a','b','c','d','e','f'],name:'s'})
    expect(rs).toEqual(ref)

    rs = s.rolling(3,{closed:'right',min_periods:3,step:1}).sum()
    ref = new Series([NaN,NaN,6,9,12,15],{index:['a','b','c','d','e','f'],name:'s'})
    expect(rs).toEqual(ref)

    rs = s.rolling(3,{closed:'right',min_periods:2,step:3}).sum()
    ref = new Series([NaN,9],{index:['a','d'],name:'s'})
    expect(rs).toEqual(ref)


    rs = s.rolling(3,{closed:'left',min_periods:3,step:2}).sum()
    ref = new Series([NaN,NaN,9],{index:['a','c','e'],name:'s'})
    expect(rs).toEqual(ref)

    rs = s.rolling(3,{closed:'left',min_periods:3,step:2}).sum()
    ref = new Series([NaN,NaN,9],{index:['a','c','e'],name:'s'})
    expect(rs).toEqual(ref)

    rs = s.rolling(3,{closed:'both',min_periods:3,step:2}).sum()
    ref = new Series([NaN,6,14],{index:['a','c','e'],name:'s'})
    expect(rs).toEqual(ref)

    rs = s.rolling(3,{closed:'neither',min_periods:3,step:2}).sum()
    ref = new Series([NaN,NaN,NaN],{index:['a','c','e'],name:'s'})
    expect(rs).toEqual(ref)

    rs = s.rolling(3,{closed:'neither',min_periods:1,step:2}).sum()
    ref = new Series([NaN,3,7],{index:['a','c','e'],name:'s'})
    expect(rs).toEqual(ref)

    rs = s.rolling(2,{closed:'neither',min_periods:1,step:2}).sum()
    ref = new Series([NaN,2,4],{index:['a','c','e'],name:'s'})
    expect(rs).toEqual(ref)
    
    s = new Series([1,NaN,3,4,NaN,6],{index:['a','b','c','d','e','f'],name:'s'})
    rs = s.rolling(2,{closed:'neither',min_periods:1,step:1}).sum()
    ref = new Series([NaN,1,NaN,3,4,NaN],{index:['a','b','c','d','e','f'],name:'s'})
    expect(rs).toEqual(ref)

    let df = new DataFrame([[1,1],[2,2],[3,NaN],[4,NaN],[5,5],[6,6]],{index:['a','b','c','d','e','f']})
    let rf = df.rolling(2,{closed:'right',min_periods:2,step:1}).sum()
    let refx = new DataFrame([[NaN,NaN],[3,3],[5,NaN],[7,NaN],[9,NaN],[11,11]],
        {index:['a','b','c','d','e','f']})
    expect(rf).toEqual(refx)

    df = new DataFrame([[1,1],[2,2],[3,NaN],[4,NaN],[5,5],[6,6]],{index:['a','b','c','d','e','f']})
    rf = df.rolling(2,{closed:'right',center:true,min_periods:2,step:2}).sum()
    refx = new DataFrame([[NaN,NaN],[5,NaN],[9,NaN]],
        {index:['a','c','e']})
    expect(rf).toEqual(refx)

    rf = df.transpose().rolling(2,{closed:'right',center:true,min_periods:2,step:2,axis:1}).sum()
    refx = new DataFrame([[NaN,NaN],[5,NaN],[9,NaN]],
        {index:['a','c','e']})
    expect(rf).toEqual(refx.transpose())
   
})


test('isna',()=>{
    const ss = new DataFrame([[1,2,null,3,NaN,undefined,'',Infinity]])
    expect(ss.isna().values).toEqual([[false,false,true,false,true,true,false,false]])
})

test('accumulate',()=>{
    const df = new DataFrame([[1,2],[5,6],[7,9]],
        {index:['a','b','b'], columns:['c','e']})
    const ds = df.cumsum()
    expect(ds.values).toEqual([[1,2],[6,8],[13,17]])
    expect(ds.index.values).toEqual(['a','b','b'])
    expect(ds.columns.values).toEqual(['c','e'])

    const ds2 = df.cumsum(1)
    expect(ds2.values).toEqual([[1,3],[5,11],[7,16]])
    expect(ds2.index.values).toEqual(['a','b','b'])
    expect(ds2.columns.values).toEqual(['c','e'])

    const dp = df.cumprod()
    expect(dp.values).toEqual([[1,2],[5,12],[35,108]])
    expect(dp.index.values).toEqual(['a','b','b'])
    expect(ds.columns.values).toEqual(['c','e'])

    const dp2 = df.cumprod(1)
    expect(dp2.values).toEqual([[1,2],[5,30],[7,63]])
    expect(dp.index.values).toEqual(['a','b','b'])
    expect(ds.columns.values).toEqual(['c','e'])
    
})