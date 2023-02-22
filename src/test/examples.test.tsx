import { expect, test, describe} from '@jest/globals';
import {DataFrame,Series} from '../J'
// import {range} from './util'

test('.iloc, .loc',()=>{
    const t = (x: any)=>x as Series<number>|DataFrame<number>
    const df = new DataFrame([[1,2],[3,4],[5,6]],['a','b','b'],['d',5])
    expect(df.iloc(null,0)).toEqual(
        new Series([1,3,5],['a','b','b'],'d')
    ) //output: new Series([1,3,5],['a','b','b'],'d')
    expect(t(df.iloc([0,1])).values).toEqual(
        [[1,2],[3,4]]
    ) //output: [[1,2],[3,4]]
    expect(t(df.iloc([2],[1])).values).toEqual(
        [[6]]
    ) // [[6]]
    expect(t(df.iloc(-1)).values).toEqual(
        [5,6]
    ) // [5,6]
    expect(t(df.iloc([-3,-1])).values).toEqual(
        [[1,2],[5,6]]
    ) //[[1,2],[5,6]]
    
    expect(t(df.iloc(':2')).values).toEqual(
        [[1,2],[3,4]]
    )// [[1,2],[3,4]]
    
    expect(t(df.iloc('-3:-1')).values).toEqual(
        [[1,2],[3,4]]
    ) //[[1,2],[3,4]]

    expect(t(df.iloc([true,false,false])).values).toEqual([[1,2]]) // [[1,2]]
    expect(df.iloc([false,false,false])).toEqual(new DataFrame([],[],['d',5])) // new DataFrame([],[],['d',5])
    expect(df.iloc(null,[false,false])).toEqual(new DataFrame([[],[],[]],['a','b','b'],[])) // new DataFrame([[],[],[]],['a','b','b'],[])
    
    expect(t(df.loc(['a'])).values).toEqual([[1,2]]) // [[1,2]]
    expect(t(df.loc('a')).values).toEqual([1,2]) // [1,2]
    expect(t(df.loc('b')).values).toEqual([[3,4],[5,6]]) // [[3,4],[5,6]]
    expect(t(df.loc(null,['d',5])).values).toEqual([[1,2],[3,4],[5,6]]) // [[1,2],[3,4],[5,6]]
    expect(t(df.loc(null,[true,false])).values).toEqual(
        [[1],[3],[5]]
    ) //[[1],[3],[5]]
})

test('iset set',()=>{
const df = new DataFrame([[1,2],[3,4],[5,6]],['a','b','b'],['d',5])
const t = (x: any)=>x as DataFrame<number>
let df2 = t(df.loc()) // create a copy of df
df2.iset(0,[3,3]) // df2.values equals to: [[3,3],[3,4],[5,6]]
expect(df2.values).toEqual([[3,3],[3,4],[5,6]])

df2 = df.loc() as DataFrame<number>
df2.iset([true,false,false],[[3,3]]) //df2.values: [[3,3],[3,4],[5,6]]
expect(df2.values).toEqual([[3,3],[3,4],[5,6]])

df2 = df.loc() as DataFrame<number>
df2.iset(null,[1],[[1],[3],[5]]) // [[1,1],[3,3],[5,5]]
expect(df2.values).toEqual([[1,1],[3,3],[5,5]])

df2 = df.loc() as DataFrame<number>
df2.set(['a'],['d'],[[7]]) // [[7,2],[3,4],[5,6]]
// same as df2.set('a','d',7)
expect(df2.values).toEqual([[7,2],[3,4],[5,6]])

df2 = df.loc() as DataFrame<number>
df2.set('b',[[7,8],[9,10]]) // [[1,2],[7,8],[9,10]]
expect(df2.values).toEqual([[1,2],[7,8],[9,10]])

//support adding new elements using label index
df2 = df.loc() as DataFrame<number>
df2.set(null,'e',[1,2,3]) // new DataFrame([[1,2,1],[3,4,2],[5,6,3]],
                          // ['a','b','b'],['d',5,'e'])
expect(df2).toEqual(new DataFrame([[1,2,1],[3,4,2],[5,6,3]],['a','b','b'],['d',5,'e']))
})

test('q b',()=>{
const ss = new Series([1,2,3],['a','b','b'],'kk')
const t = (x: any)=>x as DataFrame<number> | Series<number>

expect(ss.b('x > 2')).toEqual([false,false,true]) // output is: [false,false,true]
expect(ss.q('x>2')).toEqual(new Series([3],['b'],'kk')) // output is: new Series([3],['b'],'kk')
expect(t(ss.q('x>=1 && x<3')).values).toEqual([1,2]) // [1,2]

const df = new DataFrame([[1,2,3],[3,8,9],[5,6,7]],
        ['a','b','b'],['5',5,'e'])
expect(df.b('[ "5" ]>3')).toEqual([false,false,true])// output: [false,false,true]
expect(df.b('["a"]<=2',0)).toEqual([true,true,false]) // [true,true,false]

expect(df.q('["5"]>3')).toEqual(
    new DataFrame([[5,6,7]],
        ['b'],['5',5,'e'])
) //output: new DataFrame([[5,6,7]],
 //        ['b'],['5',5,'e'])

// pandas query function does not support numeric column names.
expect(df.q('[5]>3')).toEqual(
    new DataFrame([[3,8,9],[5,6,7]],
        ['b','b'],['5',5,'e'])
) //output: new DataFrame([[3,8,9],[5,6,7]],
              //        ['b','b'],['5',5,'e'])

expect(df.q('[ "a"]>1 && ["a"]<3',null)).toEqual(
    new DataFrame([[2],[8],[6]],['a','b','b'],[5])
)
// output: new DataFrame([[2],[8],[6]],['a','b','b'],[5])

expect(df.q('[ "a" ]>1','[ 5 ]>3')).toEqual(
    new DataFrame([[8,9],[6,7]],
        ['b','b'],[5,'e'])
) //output: new DataFrame([[8,9],[6,7]],
                        //        ['b','b'],[5,'e'])

const dx = new DataFrame<number|string>([[1,'e',3],[3,'a',9],[5,'c',7]],
        ['a','b','b'],['5',5,'e'])
expect(dx.q('["a","c"].includes([5]) && ["e"]>7')).toEqual(
    new DataFrame<number|string>([[3,'a',9]],
    ['b'],['5',5,'e'])
)
//output: new DataFrame<number|string>([[3,'a',9]],
//        ['b'],['5',5,'e'])
})