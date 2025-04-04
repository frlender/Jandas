# Jandas
### A very much Pandas-like JavaScript library for data science
Jandas is designed to have very similar indexing experience as  Pandas. It implements DataFrame, Series and Index classes in TypeScript and supports position- and label-based indexing. Unlike Pandas where some operations are asymemtrical between row and column, Jandas tries to make all operations symmetrical along the two axes. It is comprehensively tested with code coverage >90%.

## Main Features
-   Row and column indexing are guaranteed the same speed.
-   Support DataFrame with zero rows/columns in the shape of (0,n) or (n,0).
-   Support index with duplicated values.
-   Negative number and range indexing.
-   Query functions with a better syntax than Pandas.
-   Avoid using objects as arguments when possible.
-   Comprehensive overloads on indexing ensuring proper return types in TypeScript.
 


## Install
Install via npm:
```bash
npm install jandas
```
Then import Jandas classes and functions in TypeScript:
```TypeScript
import {Series, DataFrame, Index, range, concat, from_raw} from 'jandas'
```

\
Include the library in a script tag:
```html
<script src="/path/to/jandas.min.js"></script>
```
The above statement inserts an object named `jandas` in the global namespace. Users can access Jandas classes and functions through the properties of the object. The minified version can be found at `dist/jandas.min.js`.

A CodePen **Playground** is provided here:

https://codepen.io/frlender/pen/WNaBvZa

## [API Reference](https://github.com/frlender/Jandas/blob/main/API.md)
## Getting Started
### Indexing
Jandas uses `.loc()` to access values with a label based-index and `.iloc()` a position-based index. Both methods accept boolean arrays as arguments. `null` is used as a placeholder as `:` in Pandas to select all elements along an axis. The output of both methods is a new object with no pass by reference to the parent object. `.iloc()` also accepts range strings as arguments with the same syntax as the range expression in python.

```TypeScript
const df = new DataFrame([[1,2],
                          [3,4],
                          [5,6]],
           {index:['a','b','b'],columns:['d',5]})
df.iloc(null,0) //output: new Series([1,3,5],{index:['a','b','b'],name:'d'})
df.iloc([0,1]).values //output: [[1,2],[3,4]]
df.iloc([2],[1]).values // [[6]]
df.iloc(-1).values // [5,6]
df.iloc([-3,-1]).values //[[1,2],[5,6]]

df.iloc(':2').values // [[1,2],[3,4]]
df.iloc('-3:-1').values //[[1,2],[3,4]]
df.iloc('::-1').values //[[5,6],[3,4],[1,2]]

df.iloc([true,false,false]).values // [[1,2]]
df.iloc([false,false,false]) // new DataFrame([],{index:[],columns:['d',5]})
df.iloc(null,[false,false]) // new DataFrame([[],[],[]],{index:['a','b','b'],columns:[]})

df.loc(['a']).values // [[1,2]]
df.loc('a').values // [1,2]
df.loc('b').values // [[3,4],[5,6]]
df.loc(null,['d',5]).values // [[1,2],[3,4],[5,6]]
df.loc(null,[true,false]).values //[[1],[3],[5]]
```
Jandas uses `.set()` or `.iset()` to change values inplace with a label- or position-based index. The indexing rule is the same as `.loc()` and `.iloc()`. The replacement value must be the same shape as the output from `.loc()` and `.iloc()` using the same indices.

```TypeScript
const df = new DataFrame([[1,2],
                          [3,4],
                          [5,6]],
           {index:['a','b','b'],columns:['d',5]})
let df2 = df.loc() // create a copy of df
df2.iset(0,[3,3]) // df2.values equals to: [[3,3],[3,4],[5,6]]

df2 = df.loc()
df2.iset([true,false,false],[[3,3]]) //df2.values: [[3,3],[3,4],[5,6]]

df2 = df.loc()
df2.iset(null,[1],[[1],[3],[5]]) // [[1,1],[3,3],[5,5]]

df2 = df.loc()
df2.set(['a'],['d'],[[7]]) // [[7,2],[3,4],[5,6]]
// same as df2.set('a','d',7)

df2 = df.loc()
df2.set('b',[[7,8],[9,10]]) // [[1,2],[7,8],[9,10]]

//support adding new elements using label index
df2 = df.loc()
df2.set(null,'e',[1,2,3]) // new DataFrame([[1,2,1],[3,4,2],[5,6,3]],
                          // {index:['a','b','b'],columns:['d',5,'e']})
```
Jandas implements two query functions `.b()` and `.q()` for Series and DataFrame. `.b()` returns a boolean index and `.q()` returns a DataFrame matching the query string. The query syntaxes are slightly different bewtween Series and DataFrame. `.bool()` and `.query()` are implemented as alias for `.b()` and `.q()`

```TypeScript
const ss = new Series([1,2,3],{index:['a','b','b'],name:'kk'})
ss.b('x > 2') // output is: [false,false,true]
ss.q('x>2') // output is: new Series([3],{index:['b'],name:'kk'})
ss.q('x>=1 && x<3').values // [1,2]

const df = new DataFrame([[1,2,3],
                          [3,8,9],
                          [5,6,7]],
        {index:['a','b','b'],columns:['5',5,'e']})
df.b('[ "5" ]>3') // output: [false,false,true]
df.b('["a"]<=2',{axis:0}) // [true,true,false]

df.q('["5"]>3') //output: new DataFrame([[5,6,7]],
                //     {index:['b'],columns:['5',5,'e']})

// pandas query function does not support numeric column names.
df.q('[5]>3') //output: new DataFrame([[3,8,9],[5,6,7]],
              //        {index:['b','b'],columns:['5',5,'e']})

const context_value = 3
df.q(null,'[ "a"]>1 && ["a"]<@',context_value)
// output: new DataFrame([[2],[8],[6]],{index:['a','b','b'],columns:[5]})

df.q('[ 5 ]>@b','[ "a" ]>@a',{a:1,b:3}) //output: new DataFrame([[8,9],[6,7]],
                        //       {index:['b','b'],columns:[5,'e']})

const dx = new DataFrame<number|string>(
               [[1,'e',3],
                [3,'a',9],
                [5,'c',7]],
  {index:['a','b','b'],columns:['5',5,'e']})

dx.q('["a","c"].includes([5]) && ["e"]>7')
//output: new DataFrame<number|string>([[3,'a',9]],
//        {index:['b'],columns:['5',5,'e']})

//use [element,] to represent an array with a single value.
dx.q('["c",].includes([5])')
//output: new DataFrame<number|string>([[5,'c',7]],
// {index:['b'],columns:['5',5,'e']})

// or use the context value (recommended):
dx.q('@.includes([5])',['c']) // the same output
```

Jandas implements `.to_dict()` to convert a dataframe into an array of objects. It is similar to `.to_dict('records')` in Pandas. It also implements `.reset_index()` and `.reset_columns()` to reset index along the row and column axes.


### Iteration
Jandas implements `.iterrows()` and `.itercols()` to iter over the rows and columns of a DataFrame. They can be iterated in two ways using either the `for...of` expression or a function. The `for...of` expression enables the use of the `break` keyword.
```TypeScript
const df = new DataFrame([[1,2],
                          [3,4],
                          [5,6]],
           {index:['a','b','b'],columns:['d',5]})

// functional iteration:
df.iterrows((row,key,i)=>{
  console.log(row.values,key)
  // output:  [1,2],'a'
  //          [3,4],'b'
  //          [5,6],'b'
})

// for...of iteration:
for(const [row,key,i] of df.iterrows()){
    console.log(row.values,key,i)
    break
}
// expose only row
for(const [row] of df.iterrows()){
    console.log(row)
    break
}

df.itercols((col,key,i)=>{
  console.log(col.values,key)
  // output:  [1,3,5],'d'
  //          [2,4,6], 5
})

// for...of iteration
for(const [col,key,i] of df.itercols()){}
```
It implements `.groupby()` to group a DataFrame by values in rows or columns designated by input labels. The method return a `GroupByThen` object that contains information about the groups. It can be iterated using either the `for...of` expression or the `then` method. Common statistics methods like `.mean()` and `.sum()` were implemented for the `GroupByThen` class for computation within each group.
```TypeScript
let df = new DataFrame([[3,2,3],
                        [3,8,9],
                        [5,6,7]],
    {index:['a','b','b'],columns:['5',5,'e']})

// for...of iteration:
for(const [group,k,i] of df.groupby()){
    // group: new DataFrame([[3,2,3]],
    //     {index:['a'],columns:['5',5,'e']})
    // k: 'a'
    // i: 0
    break
}

// expose only gp and k
for(const [gp,k] of df.groupby()){}

// functional iteration:
df.groupby().then((gp,k,i)=>{
    if(i===1){
        // gp: new DataFrame([[3,8,9],
        //                    [5,6,7]],
        //        {index:['b','b'],columns:['5',5,'e']})
        // k: 'b'
    }
})
df.groupby('a',1).then((gp,k,i)=>{
    if(i===1){
        // gp: new DataFrame([[2],[8],[6]],
        //            {index:['a','b','b'],columns:[5]})
        // k: 2
    }
})

df.groupby().mean().values
// [[3,2,3],[4,7,8]]

df = new DataFrame([[3,8,3],
                    [3,8,9],
                    [3,6,7],
                    [9,8,7]],
{index:['a','b','b','c'],columns:['5',5,'e']})

df.groupby(['5',5]).then((gp,k,i)=>{
    if(i===0){
        // gp: new DataFrame([[3,8,3],
        //                    [3,8,9]],
        //         {index:['a','b'],columns:['5',5,'e']})
        //k: [3,8]
    }
})
```
### Element-wise Operation
Jandas implement `.op()` to perform element-wise operations on a Series or a DataFrame. Its first argument is a function or an string expression that defines the operation. Its second argument is optional and is another Series or DataFrame with the same shape and index (and column) as its caller. If the caller's and the second argument's indices are unique, the order of the values in the indices can be different. The same applies to the caller's and the second argument's columns. If the second argument is an array, it only needs to have the same shape. The `.op()` method allows setting type parameters to help specify the types of the output and the second argument.
```TypeScript
let s1 = new Series([1,2,3],{index:['a','b','c']})
let s2 = new Series([1,2,3],{index:['a','c','b']})
s1.op('x*x').values // [1,4,9]
s1.op('x+y',s2).values // [2,5,5]
s1.op('x+y',s2.values).values // [2,4,6]
s1.op('x>2').values // [false,false,true], type unknown[]
s1.op<boolean>('x>2').values // [false,false,true], type boolean[]
s1.op(x=>x>2).values // [false,false,true], type boolean[]

let df = new DataFrame([[1,2],
                        [3,4]],
                {index:['a',5],columns:['b','c']})
let df2 = new DataFrame([[1,2],
                         [3,4]],
                {index:[5,'a'],columns:['b','c']})
df.op('x*x').values // [[1,4],[9,16]]
df.op('x+y',df2).values //[[4,6],[4,6]]
df.op((x,y)=>x+y,df2.values).values // [[2,4],[6,8]]
```
### Raw copy
An Index, Series or DataFrame object created by Jandas cannot be cloned using the `structuredClone` function or saved in the local storage as it has proxy methods. A `to_raw` method was implemented for each class to create a raw copy that can be cloned or saved. A `from_raw` utility function is provided to reconstruct the original object from a raw copy.
