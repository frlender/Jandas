# Jandas
Jandas implements DataFrame, Series and Index classes and several utility functions.

## API Reference
- [Type Definitions](#type-definition)
- [DataFrame](#dataframe)
- [Series](#series)
- [Index](#index)
- [Utility](#utility)



### Type Definitions
```TypeScript
type ns_arr =  (number | string)[]
type numx = number | number[]
type nsx = number | string | ns_arr

type locParam = nsx | Series<number|string> | boolean[] | Series<boolean> | Index

interface Obj<T>{
    [key: number|string]:T
}
```

### DataFrame

**DataFrame.constructor**
```TypeScript
constructor(arr:T[][]): DataFrame<T>
constructor(arr:T[][], index:Index|ns_arr): DataFrame<T>
constructor(arr:T[][], index:null|Index|ns_arr, columns:Index|ns_arr): DataFrame<T>
constructor(arr:Obj<T>[]): DataFrame<T>
constructor(arr:Obj<T>[], index:Index|ns_arr): DataFrame<T>
constructor(arr:T[][]|Obj<T>[], index?:null|Index | ns_arr, columns?:Index | ns_arr): DataFrame<T>
```
Construct a dataframe. The first argument could be a matrix in the form of an array of arrays or an array of objects with the same keys. The second and third optional arguments are index and columns. Use `null` for index if columns is provided but index is not.

\
**DataFrame.transpose**
```TypeScript
transpose(inplace:boolean=false): DataFrame<T>
```
Transpose a dataframe. `inplace` controls whether to transpose the dataframe inplace or return a new tranposed dataframe.

\
**DataFrame.iloc**
```TypeScript
iloc(row?:null | string | numx | boolean[], col?: null | string | numx | boolean[]): T| Series<T>| DataFrame<T> 
```
Access a dataframe using position-based index. `row` and `col` are row and column indices. They can be `null`, string, number, number array or boolean array. If They are of string type, they must be a range string in the form like '1:3', ':1', '-1:', '::-1' and '5:1:-2'. Check [Getting Started](https://github.com/frlender/Jandas/blob/main/README.md#getting-started) for examples.

\
**DataFrame.loc**
```TypeScript
loc(row?: null | locParam, col?: null | locParam): T| Series<T>| DataFrame<T> 
```
Access a dataframe using label-based index.`row` and `col` are row and column indices. If `row` and `col` are of Series or Index type, their `.values` properties are used to index the dataframe. Check [Getting Started](https://github.com/frlender/Jandas/blob/main/README.md#getting-started) for examples.

\
**DataFrame.iset**
```TypeScript
iset(rpl: T[][]): void
iset(row:null | numx | boolean[],rpl: T[]|T[][]): void
iset(row:null | numx | boolean[],col:null | numx | boolean[],rpl:T| T[] | T[][]): void
iset(first:any, second?:any, third?:T| T[]|T[][]): void
```
Change the values of a dataframe using position-based index. `row` and `col` are row and column indices. Please refer to DataFrame.iloc for their possible values. `rpl` is the replacement value. It must be the same shape as the dataframe defined by the `row` and `col` indices. Check [Getting Started](https://github.com/frlender/Jandas/blob/main/README.md#getting-started) for examples.

\
**DataFrame.set**
```TypeScript
set(rpl: T[][]): void
set(row:null | locParam,rpl:T[]|T[][]): void
set(row:null | locParam,col:null | locParam,rpl: T|T[]|T[][]): void
set(first:any, second?:any, third?:T|T[]|T[][]): void
```
Change the values of a dataframe using label-based index. `row` and `col` are row and column indices. Please refer to DataFrame.loc for their possible values. `rpl` is the replacement value. It must be the same shape as the dataframe defined by the `row` and `col` indices. Check [Getting Started](https://github.com/frlender/Jandas/blob/main/README.md#getting-started) for examples.

\
**DataFrame.push**
```TypeScript
push(val:T[],name:number|string='',axis:0|1=1): void
```
Add an array `val` as a row or column to the end of the dataframe. `name` is the label for the array. `axis` determines the dimension to add the array. It is an in-place operation. 

\
**DataFrame.insert**
```TypeScript
insert(idx:number,val:T[],name:number|string='',axis:0|1=1): void
```
Insert an array `val` at designed position `idx` as a row or column in place. `idx` is position-based index. `name` is the label for the array. `axis` determines the dimension to insert the array.

\
**DataFrame.drop**
```TypeScript
drop(labels:nsx,axis:0|1=1): DataFrame<T>
```
Drop rows or columns from the dataframe and returns a new dataframe. `labels` can be a string, a number or an array. `axis` determines the dimension to drop.

\
**DataFrame.reset_index**
```TypeScript
reset_index(name?:string|number): DataFrame<T>
```
Reset the index as a column in the dataframe. `name` changes the default name of the index and use it as the label of the column.

\
**DataFrame.reset_columns**
```TypeScript
reset_columns(name?:string|number): DataFrame<T>
```
Reset the columns as a row in the dataframe. `name` changes the default name of the columns and use it as the label of the index.

\
**DataFrame.b**
```TypeScript
b(expr:string,axis:0|1=1): boolean[]
```
Return an boolean array based on the evaluation of expression `expr`. `axis` determines the dimension on which to evaluate the expression. The syntax of `expr` is plain JavaScript except that it uses `[label]` to refer a row or column. Check [Getting Started](https://github.com/frlender/Jandas/blob/main/README.md#getting-started) for examples.

\
**DataFrame.q**
```TypeScript
q(col_expr:string): DataFrame<T>
q(row_expr:null|string,col_expr:null|string): DataFrame<T>
q(first:null|string,second?:null|string): DataFrame<T>
```
Return a new dataframe based on the query expressions `col_expr` and `row_expr`. `col_expr` is evaluated on the columns and `row_expr` on the rows. When there is one argument, it will be `col_expr`. When there are two arguments, the first will be `row_expr` and the second `col_expr`. `null` is used as a placeholder. The syntax of the expressions is plain JavaScript except that it uses `[label]` to refer a row or column. Use `[value,]` to reprsent an array with a single value in the expression. Without the comma at the end, `[value]` will be treated as a label selection with the label being `value`. Check [Getting Started](https://github.com/frlender/Jandas/blob/main/README.md#getting-started) for examples.

\
**DataFrame.iterrows**
```TypeScript
iterrows(func:(row:Series<T>,key:number|string|ns_arr,i:number)=>void): void
```
Iterate over the rows of the dataframe. Similar to the `forEach` function, it accepts a function as argument where the `row`, `key` and `i` are the row, label and position in each iteration. Check [Getting Started](https://github.com/frlender/Jandas#iteration) for examples.

\
**DataFrame.itercols**
```TypeScript
itercols(func:(col:Series<T>,key:number|string|ns_arr,i:number)=>void): void
```
Iterate over the columns of the dataframe. Similar to the `forEach` function, it accepts a function as argument where the `col`, `key` and `i` are the column, label and position in each iteration. Check [Getting Started](https://github.com/frlender/Jandas#iteration) for examples.

\
**DataFrame.groupby**
```TypeScript
groupby():GroupByThen<T>
groupby(labels:nsx|null):GroupByThen<T>
groupby(labels:nsx|null,axis:0|1):GroupByThen<T>
groupby(first?:any, second?:0|1):GroupByThen<T>

GroupbyThen.then(func:(group:DataFrame<T>,key:T | T[], i:number)=>void): void
```
Group the dataframe by values in rows or columns designated by labels. When no `labels` are provided, it groups the dataframe by the row or column index. When no `axis` is provided, the `axis` defaults to 1 and the function groups by columns or the row index. It returns a `GroupByThen` object that has a `then` method. The method accepts a function as argument where the `group`, `key` and `i` are the group, group key and numric index in each iteration.
Check [Getting Started](https://github.com/frlender/Jandas#iteration) for examples.

\
**DataFrame.p**
```TypeScript
p(): void
```
Print the dataframe in console. It uses console.table to print the dataframe as a table.

\
**DataFrame.to_dict**
```TypeScript
to_dict(axis:0|1=1):Obj<T>[]
```
Return the dataframe as an array of objects. `axis` determines on which dimension to construct the array of objects. When `axis` is equal to 1, the function is the same as `DataFrame.to_dict(orient="records")` in Pandas.

### Series
**Series.constructor**
```TypeScript
constructor(values: T[]): Series<T>
constructor(values: T[], name:string | number): Series<T>
constructor(values: T[], index: ns_arr | Index, name?:string | number): Series<T>
constructor(first: T[], second?:any, third?:string | number): Series<T>
```
Constructs a series. The first argument is an array of values. The second optional argument is either the name or the index of the series depending on its type. When there are three arguments, the second will be the index of the series and the third the name.

\
**Series.iloc**
```TypeScript
iloc(index:number): T
iloc(index?:string|number[]|boolean[]): Series<T>
iloc(index?: string | numx | boolean[]): T|Series<T>
```
Access a series using position-based index. The index `index` can be string, number, number array or boolean array. If They are of string type, they must be a range string in the form like '1:3', ':1', '-1:', '::-1' and '5:1:-2'. Check [Getting Started](https://github.com/frlender/Jandas/blob/main/README.md#getting-started) for examples.

\
**Series.loc**
```TypeScript
loc(index?: locParam): T|Series<T>
```
Access a series using label-based index.If the index `index` are of Series or Index type, their `.values` properties are used to index the dataframe. Check [Getting Started](https://github.com/frlender/Jandas/blob/main/README.md#getting-started) for examples.

\
**Series.iset**
```TypeScript
iset(rpl:T[]): void
iset(index:string|numx|boolean[],rpl:T|T[]): void
iset(first:any, second?:T|T[]): void
```
Change the values of a series using position-based index. Please refer to Series.iloc for possible values of `index`. `rpl` is the replacement value. It must be the same length as the series defined by `index`. Check [Getting Started](https://github.com/frlender/Jandas/blob/main/README.md#getting-started) for examples.

\
**Series.set**
```TypeScript
set(rpl:T[]): void
set(idx:locParam,rpl:T|T[]): void
set(first: any, second?: T|T[]): void
```
Change the values of a series using label-based index. Please refer to Series.loc for possible values of `index`. `rpl` is the replacement value. It must be the same shape as the series defined by `index`. Check [Getting Started](https://github.com/frlender/Jandas/blob/main/README.md#getting-started) for examples.

\
**Series.push**
```TypeScript
push(val:T,name:number|string=''): void
```
Add a new value `val` to the end of the series in place. `name` is the label for the new value.

\
**Series.insert**
```TypeScript
insert(idx:number,val:T,name:number|string=''): void
```
Insert a new value `val` at designated position `idx` in place.  `name` is the label for the new value.

\
**Series.drop**
```TypeScript
drop(labels:nsx): Series<T>
```
Drop values from the series and returns a new series. `labels` can be a string, a number or an array.

\
**Series.b**
```TypeScript
b(expr:string): boolean[]
```
Return an boolean array based on the evaluation of expression `expr`. The syntax of `expr` is plain JavaScript except that it uses `x` to refer a value in the series. Check [Getting Started](https://github.com/frlender/Jandas/blob/main/README.md#getting-started) for examples.

\
**Series.q**
```TypeScript
q(expr:string): Series<T>
```
Return a new dataframe based on the query expression `expr`. The syntax of `expr` is plain JavaScript except that it uses `x` to refer a value in the series. Check [Getting Started](https://github.com/frlender/Jandas/blob/main/README.md#getting-started) for examples.

\
**Series.p**
```TypeScript
p(): void
```
Print the series in console.


### Index
**Index.constructor**
```TypeScript
constructor(values:ns_arr,name?:string | number): Index
```
Construct an index. The values of an index can only string or number. The first argument is an array of values. The second argument is the name of the index.

\
**Index.remap**
```TypeScript
remap(): void
```
Recreate the map that maps labels to numeric positions. 


\
**Index.insert**
```TypeScript
insert(idx:number,val:number|string): void
```
Insert a value `val` at designated position `idx` in place.

\
**Index.cp**
```TypeScript
cp(): Index
```
Create a copy of an index.

\
**Index.has**
```TypeScript
has(val: number|string): boolean
```
Check if the value `val` exisits in an index.

\
**Index.unique**
```TypeScript
unique(): (string | number)[]
```
Return the unique values of an index.

\
**Index.is_unique**
```TypeScript
is_unique(): boolean
```
Check if the values of an index is unique.

\
**Index.check**
```TypeScript
check(val: number|string): void
```
Check if the value `val` exisits in an index. Different to `Index.has`, it will throw an error if `val` does not exists in the index.


\
**Index.trans**
```TypeScript
trans(vals: nsx): numx
```
Translate an array of labels into an array of numeric positions. It will throw error if `vals` includes labels not in the index.


### Utility
**range**
```TypeScript
function range(end:number):number[]
function range(start:number,end:number):number[]
function range(start:number,end:number,step:number):number[]
function range(first:number,second?:number,third?:number):number[]
```
Return an array of numbers defined by start, end and step.
