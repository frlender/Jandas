import { expect, test, describe} from '@jest/globals';
import {Series,Index} from '../J'

const ss = new Series([1,2,3,4,5],['a','b','c','d','e'])
const sn = new Series([1,2,3,4,5],['a','b','b','d','e'],'k')

describe('Index',()=>{
    test('general',()=>{
        const dx = new Index(['a','b','b'])
        dx.values = ['a','a','b']
        expect(dx.mp.get('a')).toEqual([0,1])
        dx.values[1] = 'b'
        expect(dx.mp.get('a')).toEqual(0)
        expect(dx.mp.get('b')).toEqual([1,2])
        expect(dx.shape).toEqual(3)

        dx.values[3] = 'a'
        expect(dx.mp.get('a')).toEqual([0,3])
        expect(dx.shape).toEqual(4)

        expect(()=>dx.values[5]='c').toThrow('range')
        expect(()=>dx.values[-2]='c').toThrow('range')
        expect(()=>dx.values[0.2]='c').toThrow('integer')

        dx.insert(1,'c')
        expect(dx.shape).toEqual(5)
        expect(dx.values[1]).toEqual('c')
        expect(dx.mp.get('c')).toEqual(1)
    })
})

describe('Series general', ()=>{
    test('name', ()=>{
        expect(ss.name).toEqual('')
        expect(sn.name).toEqual('k')
    })

    test('constructor', ()=>{
        let ss = new Series(['3'])
        expect(ss).toEqual(new Series(['3'],[0]))
        let st = new Series([3],['a'])
        st.name = 'k'
        expect(st).toEqual(new Series([3],['a'],'k'))
        st = new Series([3],'a')
        expect(st).toEqual(new Series([3],[0],'a'))

        ss = new Series([])
        expect(ss.shape).toEqual(0)
        expect(ss.values).toEqual([])
    })

    test('index',()=>{
        const ss = new Series([1,2,3],['a','b','b'])
        const dx = new Index(['a','b','b'])
        expect(ss.index).toEqual(dx)

        ss.index = ['b','a','c']
        const dx2 = new Index(['b','a','c'])
        expect(ss.index).toEqual(dx2)

        expect(()=>ss.index=['a','b']).toThrow('shape')
    })
})

describe('iloc',()=>{
    test('non-negative number index', ()=>{
        expect(sn.iloc()).toEqual(sn)
        expect(ss.iloc()).toEqual(ss)
        expect(ss.iloc(1)).toEqual(2)
        const one = new Series([2],['b'])
        expect(ss.iloc([1])).toEqual(one)
        expect(sn.iloc([1]).name).toEqual('k')

        const zero = new Series<number>([],[])
        const zeron = new Series<number>([],[],'k')
        expect(ss.iloc([])).toEqual(zero)
        expect(sn.iloc([])).toEqual(zeron)

        const ss2 = new Series([2,5],['b','e'])
        expect(ss.iloc([1,4])).toEqual(ss2)

        expect(()=>ss.iloc(0.1)).toThrow('integer')
        expect(()=>ss.iloc([2,15])).toThrow('range')
        expect(()=>ss.iloc([2,15])).toThrow('range')
        expect(()=>ss.iloc(5)).toThrow('range')
    })

    test('negative number index', ()=>{
        expect(ss.iloc(-1)).toEqual(5)

        const ss2 = new Series([2,5],['b','e'])
        expect(ss.iloc([-4,-1])).toEqual(ss2)

        expect(ss.iloc(-5)).toEqual(1)
        expect(()=>ss.iloc(-6)).toThrow('range')
        expect(()=>ss.iloc([-10,-1])).toThrow('range')
        expect(()=>ss.iloc(-5.1)).toThrow('integer')
    })

    test('boolean index',()=>{
        let idx = [true,false,true,false,true]
        const ss2 = new Series([1,3,5],['a','c','e'])
        expect(ss.iloc(idx)).toEqual(ss2)
        idx = [false,false,false,false,false]
        const se = new Series([],[],'k')
        expect(sn.iloc(idx)).toEqual(se)

        idx = [true,false]
        expect(()=>ss.iloc(idx)).toThrow()
        idx = [true,false,true,false,true,false]
        expect(()=>ss.iloc(idx)).toThrow()
    })

    test('string range', ()=>{
        const se = new Series([],[],'k')
        expect(sn.iloc('-15:')).toEqual(sn)
        expect(sn.iloc(':-15')).toEqual(se)
        expect(sn.iloc(':10')).toEqual(sn)
        expect(sn.iloc('10:')).toEqual(se)
        expect(sn.iloc('2:2')).toEqual(se)
        expect(sn.iloc('3:2')).toEqual(se)
        expect(sn.iloc('-2:-3')).toEqual(se)
        expect(sn.iloc('15:16')).toEqual(se)

        const sn2 = new Series([2,3],['b','b'],'k')
        expect(sn.iloc('1:3')).toEqual(sn2)
        const sn3 = new Series([2,3,4],['b','b','d'],'k')
        expect(sn.iloc('-4:-1')).toEqual(sn3)

        expect(()=>sn.iloc('1.5:')).toThrow('integer')
        expect(()=>sn.iloc('-4.5:-1')).toThrow('integer')
        expect(()=>sn.iloc('-2')).toThrow(':')
        expect(()=>sn.iloc('#/:1')).toThrow('format')
        expect(()=>sn.iloc('-2:@1t')).toThrow('format')
        // expect(()=>sn.iloc('0:5:2')).toThrow('one')

    })
})

describe('loc',()=>{
    const ss = new Series([1,2,3,4,5],['a','b','b',-.5,'e'])
    test('value',()=>{
        expect(ss.loc()).toEqual(ss)
        expect(ss.loc('a')).toEqual(1)
        const ss2 = new Series([2,3],['b','b'])
        expect(ss.loc('b')).toEqual(ss2)
        expect(ss.loc(-.5)).toEqual(4)

        expect(()=>ss.loc(1)).toThrow()
        expect(()=>ss.loc('5')).toThrow()
    })

    test('array and index',()=>{
        let ss2 = new Series([1,2,3],['a','b','b'])
        expect(ss.loc(['a','b'])).toEqual(ss2)
        ss2 = new Series([5,4],['e',-.5])
        expect(ss.loc(['e',-.5])).toEqual(ss2)
        const se = new Series([],[])
        expect(ss.loc([])).toEqual(se)
        ss2 = new Series([5],['e'])
        expect(ss.loc(['e'])).toEqual(ss2)

        expect(()=>ss.loc(['fg'])).toThrow()

        let index = new Index(['a','b'],'k')
        ss2 = new Series([1,2,3],['a','b','b'])
        expect(ss.loc(['a','b'])).toEqual(ss2)
        index = new Index(['a','b'])
        expect(ss.loc(['a','b'])).toEqual(ss2)
    })  

    test('boolean',()=>{
        let idx = [true,false,true,false,true]
        const ss2 = new Series([1,3,5],['a','b','e'])
        expect(ss.loc(idx)).toEqual(ss2)
        idx = [false,false,false,false,false]
        const se = new Series([],[],'k')
        expect(sn.loc(idx)).toEqual(se)

        idx = [true,false]
        expect(()=>ss.loc(idx)).toThrow()
        idx = [true,false,true,false,true,false]
        expect(()=>ss.loc(idx)).toThrow()
    })

    test('Series',()=>{
        let ss2 = new Series([1,2,3],['a','b','b'])
        let si = new Series(['a','b'],['a','c'])
        expect(ss.loc(si)).toEqual(ss2)
        
        ss2 = new Series([4,5],[-.5,'e'])
        let si2 = new Series([false,false,false,true,true])
        expect(ss.loc(si2)).toEqual(ss2)

        ss2 = new Series([],'k')
        si = new Series([])
        expect(sn.loc(si)).toEqual(ss2)
        
        expect(ss.loc()).toEqual(ss)
        si = new Series(['a','d'],['a','b'])
        expect(()=>ss.loc(si)).toThrow()
    })
})

describe('iset',()=>{
    test('index',()=>{
        const ss = new Series([1,2,3,4,5],['a','b','c','d','e'])
        const sn = new Series([1,2,3,4,5],['a','b','b','d','e'],'k')
        const sv = ss.values
        ss.iset(2,7)
        expect(ss.iloc(2)).toEqual(7)
        sn.iset([],[])
        expect(sn).toEqual(
            new Series([1,2,3,4,5],['a','b','b','d','e'],'k'))
        expect(sn).not.toEqual(
            new Series([1,2,3,4,5],['a','b','b','d','e']))

        let vals = [5,9]
        ss.iset([1,4],vals)
        expect(ss.iloc([1,4]).values).toEqual([5,9])
        vals[0] = 8
        expect(ss.iloc([-1,-4]).values).toEqual([9,5])
        // must inplace
        expect(sv).toEqual([1,5,7,4,9])

        vals = [1,2,3]
        ss.iset(':3',vals)
        expect(ss.iloc(':3').values).toEqual([1,2,3])
        vals[2] = 7
        expect(ss.iloc(':-2').values).toEqual([1,2,3])

        ss.iset('1:3',[9,10])
        expect(ss.iloc('1:3').values).toEqual([9,10])


        vals = [5,4,3,2,1]
        ss.iset(vals)
        expect(ss.values).toEqual(vals)

        sn.iset([true,false,true,false,false],[2,6])
        const ss3 = new Series([2,6],['a','b'],'k')
        expect(sn.iloc([0,2])).toEqual(ss3)

    })
    test('error',()=>{
        const ss = new Series([1,2,3,4,5],['a','b','c','d','e'])
        expect(()=>ss.iset([1,2],[3,4,5])).toThrow()
        expect(()=>ss.iset([true,false,true,false,false],
            [2,6,8])).toThrow()

    })  
})


describe('set',()=>{
    test('general',()=>{
        const ss = new Series([1,2,3,4,5],
            ['a','b','c','d','e'])
        let sn = new Series([1,2,3,4,5],
            ['a','b','b','d','e'],'k')

        const sv = ss.values
        ss.set('c',7)
        expect(ss.iloc(2)).toEqual(7)
        sn.set([],[])
        expect(sn).toEqual(
            new Series([1,2,3,4,5],['a','b','b','d','e'],'k'))
        
        let vals = [5,9]
        ss.set(['a','e'],vals)
        expect(ss.iloc([4,0]).values).toEqual([9,5])
        vals[0] = 8
        expect(ss.iloc([-1,-5]).values).toEqual([9,5])
        // must inplace
        expect(sv).toEqual([5,2,7,4,9])    

        sn.set('b',[9,10])
        expect((sn.iloc([1,2]) as Series<number>).values)
            .toEqual([9,10])
        
        sn.set('b',9)
        expect((sn.iloc([1,2]) as Series<number>).values)
                .toEqual([9,9])
        
        sn.iset([1,2],[2,3])
        sn.set([true,false,true,false,false],[7,9])
        let sx = new Series([7,2,9,4,5],
            ['a','b','b','d','e'],'k')
        expect(sn).toEqual(sx)
        sn.set([false,true,true,false,false],[10,11])
        sx = new Series([7,10,11,4,5],
            ['a','b','b','d','e'],'k')
        expect(sn).toEqual(sx)
        sn.set([false,false,true,true,false],[15,16])
        sx = new Series([7,10,15,16,5],
            ['a','b','b','d','e'],'k')
        expect(sn).toEqual(sx)
        
        const sa = new Series([1,2,3],['a','b','c'])
        let idx = new Index(['a','b'])
        let sb = new Series([5,6,3],['a','b','c'])
        sa.set(idx,[5,6])
        expect(sa).toEqual(sb)

        let idx2 = new Series(['b','c'])
        sb = new Series([2,3],['b','c'])
        sb.set(idx2,[5,6])
        expect(sb).toEqual(new Series([5,6],['b','c'])) 

        sb = new Series([5,6,3],['a','b','c'])
        sb.set('z',7)
        expect(sb).toEqual(new Series(
            [5,6,3,7],['a','b','c','z']
        ))

        sb.set([8,9,7,6])
        expect(sb).toEqual(new Series(
            [8,9,7,6],['a','b','c','z']
        ))
        
        // differ from python
        const sc = new Series([1,2,3],['a','b','b'])
        sc.set(['b','a'],[5,6,7])
        expect(sc).toEqual(
            new Series([7,5,6],['a','b','b'])
        )
    })
})

describe('insert',()=>{
    let ss = new Series([1,2,'a'],['a','b','b'])
    ss.insert(1,'z')
    let sx = new Series([1,'z',2,'a'],['a','','b','b'])
    expect(ss).toEqual(sx)

    ss.insert(ss.shape-1,'z','k')
    sx = new Series([1,'z',2,'z','a'],
        ['a','','b','k','b'])
    expect(ss).toEqual(sx)

    expect(()=>ss.insert(ss.shape,'z')).toThrow('range')
})  

test('drop',()=>{
    let ss = new Series([1,2,'a'],['a','b','b'])
    let ss2 = ss.drop(['a'])
    expect(ss2).toEqual(new Series([2,'a'],['b','b']))

    ss2 = ss.drop('b')
    expect(ss2).toEqual(new Series([1],['a']))
})

test('b',()=>{
    let ss = new Series([1,2,3],['a','b','b'])
    expect(ss.b('x>1')).toEqual([false,true,true])
    expect(ss.b('x>1 && x<3')).toEqual([false,true,false])
    expect(ss.b('x>=1 && x<3')).toEqual([true,true,false])


    
    let sx = new Series(['a','b','b'],['a','b','b'])
    expect(sx.b('x==="b"')).toEqual([false,true,true])
    expect(sx.b('x==="b" || x ==="a"')).toEqual([true,true,true])

})

test('q',()=>{
    let ss = new Series([1,2,3],['a','b','b'])
    expect(ss.q('x>1')).toEqual(new Series([2,3],['b','b']))
    expect(ss.q('x>=1 && x<3')).toEqual(new Series([1,2],['a','b']))

    let sx = new Series(['a','b','b'],['a','b','b'])
    expect(sx.q('x==="b"')).toEqual(new Series(['b','b'],['b','b']))
})