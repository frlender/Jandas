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

type locParamArr = ns_arr | Series<number|string> | boolean[] | Series<boolean> | Index

interface Obj<T>{
    [key: number|string]:T
}
```

### DataFrame

**DataFrame.constructor**
```TypeScript
interface DataFrameInitOptions{
    index?: Index|ns_arr
}
interface DataFrameArrInitOptions extends DataFrameInitOptions{
    columns?: Index|ns_arr
}

constructor(arr:T[][]|Obj<T>[]): DataFrame<T>
constructor(arr:T[][], options:DataFrameArrInitOptions): DataFrame<T>
constructor(arr:Obj<T>[],options:DataFrameInitOptions): DataFrame<T>
```
Construct a dataframe. The first argument could be a matrix in the form of an array of arrays or an array of objects with the same keys. The second argument is optional and used to set index and columns for the dataframe. If the first argument is an array of objects, only index can be set.

\
**DataFrame.transpose**
```TypeScript
transpose(inplace:boolean=false): DataFrame<T>
```
Transpose a dataframe. `inplace` controls whether to transpose the dataframe inplace or return a new tranposed dataframe.

\
**DataFrame.iloc**
```TypeScript
iloc(row:number,col:number):T
iloc(row:number,col?:null|string|number[]|boolean[]):Series<T>
iloc(row:null|string|number[]|boolean[],col:number):Series<T>
iloc(row?:null|string|number[]|boolean[],col?:null|string|number[]|boolean[]):DataFrame<T>
iloc(row?:null | string | numx | boolean[], col?: null | string | numx | boolean[]):T| Series<T>| DataFrame<T>
```
Access a dataframe using position-based index. `row` and `col` are row and column indices. They can be `null`, string, number, number array or boolean array. If They are of string type, they must be a range string in the form like '1:3', ':1', '-1:', '::-1' and '5:1:-2'. Check [Getting Started](https://github.com/frlender/Jandas/blob/main/README.md#getting-started) for examples.

\
**DataFrame.loc**
```TypeScript
loc(row:number|string,col:number|string):T|Series<T>|DataFrame<T>
loc(row:number|string,col?:null|locParamArr):Series<T>|DataFrame<T>
loc(row:null|locParamArr,col:number|string):Series<T>|DataFrame<T>
loc(row?:null|locParamArr,col?:null|locParamArr):DataFrame<T>
loc(row?: null | number | string | locParamArr, col?: null | number | string | locParamArr):T|Series<T>|DataFrame<T>
```
Access a dataframe using label-based index.`row` and `col` are row and column indices. If `row` and `col` are of Series or Index type, their `.values` properties are used to index the dataframe. Check [Getting Started](https://github.com/frlender/Jandas/blob/main/README.md#getting-started) for examples.

\
**DataFrame.iset**
```TypeScript
iset(row:number,col:number,rpl:T):void
iset(row:number,rpl:T[]):void
iset(row:number,col:null|string|number[]|boolean[],rpl:T[]):void
iset(row:null|string|number[]|boolean[],col:number,rpl:T[]):void
iset(rpl:T[][]):void
iset(row:null|string|number[]|boolean[],rpl:T[][]):void
iset(row:null|string|number[]|boolean[],col:null|string|number[]|boolean[],rpl:T[][]):void
```
Change the values of a dataframe using position-based index. `row` and `col` are row and column indices. Please refer to DataFrame.iloc for their possible values. `rpl` is the replacement value. It must be the same shape as the dataframe defined by the `row` and `col` indices. Check [Getting Started](https://github.com/frlender/Jandas/blob/main/README.md#getting-started) for examples.

\
**DataFrame.set**
```TypeScript
set(row:number|string,col:number|string,rpl:T|T[]|T[][]):void
set(row:number|string,rpl:T[]|T[][]):void
set(row:number|string,col:null|locParamArr,rpl:T[]|T[][]):void
set(row:null|locParamArr,col:number|string,rpl:T[]|T[][]):void
set(rpl:T[][]):void
set(row:null|locParamArr,rpl:T[][]):void
set(row:null|locParamArr,col:null|locParamArr,rpl:T[][]):void
```
Change the values of a dataframe using label-based index. `row` and `col` are row and column indices. Please refer to DataFrame.loc for their possible values. `rpl` is the replacement value. It must be the same shape as the dataframe defined by the `row` and `col` indices. Check [Getting Started](https://github.com/frlender/Jandas/blob/main/README.md#getting-started) for examples.

\
**DataFrame.push**
```TypeScript
interface PushOptions{
    name?: number|string
    axis?: 0|1
}
push(val:T[],options: PushOptions={}): void
```
Add an array `val` as a row or column to the end of the dataframe. `name` is the label for the array. `axis` determines the dimension to add the array. It is an **inplace** operation. 

\
**DataFrame.insert**
```TypeScript
interface PushOptions{
    name?: number|string
    axis?: 0|1
}
insert(idx:number,val:T[],{name='',axis=1}:PushOptions={}): void
```
Insert an array `val` at designed position `idx` as a row or column in place. `idx` is position-based index. `name` is the label for the array. `axis` determines the dimension to insert the array. It is an **inplace** operation.

\
**DataFrame.drop**
```TypeScript
drop(labels:nsx,axis:0|1=1): DataFrame<T>
```
Drop rows or columns from the dataframe and returns a new dataframe. `labels` can be a string, a number or an array. `axis` determines the dimension to drop.

\
**DataFrame.drop_duplicates**
```TypeScript
interface DropDuplicatesOptions{
    keep?: 'first' | 'last' | false
    axis?: 0|1
}

drop_duplicates(labels:nsx,{keep='first',axis=1}:DropDuplicatesOptions={}): DataFrame<T>
```
Drop rows or columns from the dataframe based on duplicate values specified by column or row `labels`. `keep` determines which duplicates to keep. If `keep` is `false`, all duplicates are dropped. If `keep` is `'first'`, the first occurrence of each duplicate is kept. If `keep` is `'last'`, the last occurrence of each duplicate is kept. The default is `'first'`. `axis` determines the dimension to drop: `1` to drop rows and `0` to drop columns. 

\
**DataFrame.set_index**
```TypeScript
set_index(label:number|string): DataFrame<T>
```
Set the column designated by label as the index of the dataframe. `label` will be the name of the index.

\
**DataFrame.set_columns**
```TypeScript
set_columns(label:number|string): DataFrame<T>
```
Set the row designated by label as the columns of the dataframe. `label` will be the name of the columns.

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
**DataFrame.bool**
```TypeScript
bool(expr:string,axis:0|1=1): boolean[]
```
Alias for `DataFrame.b`.

\
**DataFrame.b**
```TypeScript
BOptions = {
    axis?: 0|1 // defaults to 1
    ctx?: any
}
b(expr:string,options?:BOptions): boolean[]
```
Return an boolean array based on the evaluation of expression `expr`. `axis` determines the dimension on which to evaluate the expression. `ctx` holds the context values to be evaluated in the expression. The syntax of `expr` is plain JavaScript except that it uses `[label]` to refer a row or column and `@` to refer to the `ctx` value(s). If `ctx` is an object, use `@key` to refer to the value of a key in the expression. Use `[value,]` to reprsent an array with a single value in the expression. Without the comma at the end, `[value]` will be treated as a label selection with the label being `value`. Of note, if no context value is passed to the method, `@` will be `undefined` in the expression. Check [Getting Started](https://github.com/frlender/Jandas/blob/main/README.md#getting-started) for examples.

\
**DataFrame.query**
```TypeScript
query(col_expr:string):DataFrame<T>
query(col_expr:null|string, row_expr_or_ctx:any):DataFrame<T>
query(col_expr:null|string, row_expr:null|string, ctx:any):DataFrame<T>
```
Alias for `DataFrame.q`.

\
**DataFrame.q**
```TypeScript
q(col_expr:string):DataFrame<T>
q(col_expr:null|string, row_expr_or_ctx:any):DataFrame<T>
q(col_expr:null|string, row_expr:null|string, ctx:any):DataFrame<T>
```
Return a new dataframe based on the query expressions `col_expr` and `row_expr`. `col_expr` is evaluated on the columns and `row_expr` on the rows. When there is one argument, it will be `col_expr`. When there are two arguments, the second will be `row_expr`. `null` is used as a placeholder. `ctx` holds the context values to be evaluated in the expression(s). The syntax of the expressions is plain JavaScript except that it uses `[label]` to refer a row or column and `@` to refer to the `ctx` value(s). If `ctx` is an object, use `@key` to refer to the value of a key in the expression. Use `[value,]` to reprsent an array with a single value in the expression. Without the comma at the end, `[value]` will be treated as a label selection with the label being `value`. Of note, if no context value is passed to the method, `@` will be `undefined` in the expression. Check [Getting Started](https://github.com/frlender/Jandas/blob/main/README.md#getting-started) for examples.

\
**DataFrame.iterrows**
```TypeScript
iterrows():Generator<[
        row: Series<T>,
        key: string | number,
        i: number
    ]>
iterrows(func:(row:Series<T>,key:number|string|ns_arr,i:number)=>void): void
```
Iterate over the rows of the dataframe. Similar to the `forEach` function, it accepts a function as argument where the `row`, `key` and `i` are the row, label and position in each iteration. It also supports the `for...of` expression where the `break` keyword can be used to stop the iteration. Check [Getting Started](https://github.com/frlender/Jandas#iteration) for examples.

\
**DataFrame.itercols**
```TypeScript
itercols():Generator<[
        col: Series<T>,
        key: string | number,
        i: number
    ]>
itercols(func:(col:Series<T>,key:number|string|ns_arr,i:number)=>void): void
```
Iterate over the columns of the dataframe. Similar to the `forEach` function, it accepts a function as argument where the `col`, `key` and `i` are the column, label and position in each iteration.  It also supports the `for...of` expression where the `break` keyword can be used to stop the iteration. Check [Getting Started](https://github.com/frlender/Jandas#iteration) for examples.

\
**DataFrame.groupby**
```TypeScript
groupby():GroupByThen<T>
groupby(labels:nsx|null):GroupByThen<T>
groupby(labels:nsx|null,axis:0|1):GroupByThen<T>
// groupby(first?:any, second?:0|1):GroupByThen<T>

GroupbyThen.then(func:(group:DataFrame<T>,key:T | T[], i:number)=>void): void
```
Group the dataframe by values in rows or columns designated by labels. When no `labels` is provided or `labels` is equal to `null`, it groups the dataframe by the row or column index. When no `axis` is provided, the `axis` defaults to 0 and the method groups rows by designed columns labels. if `axis=1`, the method groups columns by designed index labels. It returns a `GroupByThen` object that has a `then` method. The method accepts a function as argument where the `group`, `key` and `i` are group, grouping key and numric index in each iteration. The object can also be iterated directly using the `for...of` expression where the `break` keyword can be used. Check [Getting Started](https://github.com/frlender/Jandas#iteration) for examples.

\
**DataFrame.reduce**
```TypeScript
reduce<K>(func:(a:T[])=>K,axis:0|1=0): Series<K>
```
Apply a function to the dataframe that reduces each row (`axis=1`) or each column (`axis=0`) into a scalar and collect the scalars into a new series.


\
**DataFrame.min, DataFrame.max, DataFrame.sum, DataFrame.mean, DataFrame.mode, DataFrame.median, DataFrame.std, DataFrame.var**
```TypeScript
min(this:DataFrame<number>,axis:0|1=0): Series<number>
// other functions are similarly defined
```
A collection of functions to compute statistics on the `axis` dimension. The default is to compute statistics along the row dimension. They are implemented as wrappers around the corresponding functions in the [simple-statistics](https://github.com/simple-statistics/simple-statistics) package. The `std` and `var` functions are implemented using the `sampleStandardDeviation` and `sampleVariance` functions in the package.
These methods only work for dataframes with numeric values.

\
**DataFrame.accumulate**
```TypeScript
accumulate(this:DataFrame<number>, 
        func: string | ((x:number,y:number)=>number), 
        axis=0):DataFrame<number>
```
Calculate cumulative statistics of the values along `axis` in the DataFrame as specified by `func`. Allowed `func` strings are the same as in `Series.op`. The method only works for DataFrame with numeric values.


\
**DataFrame.cumsum**
```TypeScript
cumsum(this:DataFrame<number>,axis:0|1=0):DataFrame<number>
```
Calculate cumulative sums of the values along `axis` in the DataFrame. It only works for DataFrame with numeric values.


\
**DataFrame.cumprod**
```TypeScript
cumprod(this:DataFrame<number>,axis:0|1=0):DataFrame<number>
```
Calculate cumulative products of the values along `axis` in the DataFrame. It only works for DataFrame with numeric values.

\
**DataFrame.sort_values**
```TypeScript
interface SortOptions{
    ascending?: boolean | boolean[]
    axis?: 0 | 1 
}
sort_values(labels:nsx|null,{ascending=true,axis=1}:SortOptions={}): DataFrame<T>
```
Sort the DataFrame according to values in the rows (`axis=0`) or columns (`axis=1`) designated by `labels` in the `ascending` order. If `labels` is `null`, then sort the DataFrame by the values in index. If `labels` is an array, the sorting will compare values successively according to the order specified by `labels` to determine relative large or small. That is to say, `labels[1]` will only be considered if the values of `labels[0]` are equal. When `labels` is an array, `ascending` can be either a boolean value or an array. If `ascending` is a boolean value, it will be applied to all labels. If `ascending` is an array, it must have the same length as `labels` and determines the order of sorting for each label. If the values selected by `labels` are numeric, they will be sorted by their numeric values. Otherwise, they will be sorted according to the rule in [Array.prototype.sort()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort). 

\
**DataFrame.op**
```TypeScript
op<K>(opStr:string|((x:T)=>K)): DataFrame<K>
op<K,Z>(opStr:string|((x:T,y:Z)=>K),df:DataFrame<Z>|Z[][]): DataFrame<K>
```
Element-wise operation on a single dataframe or on two dataframes. If defined, `df` represents the second dataframe. It could be a dataframe or an array of array. If it is a dataframe, it must satisfies either of two rules. First, if both dataframes' indices are unique, their indices must contain the same values but the order of the values can be different. Second, if either of the two dataframes' index is not unique, their indices' values must be exactly the same. The same rules applies to their columns. `opStr` can be a function or an string expression. A valid string expression should define the operation on a single element or a set of two elements of the dataframes. For operations on one dataframe, use `x` in `opStr` to represent the element in the dataframe. For operations on two dataframes, use `x` and `y` to represent the element in the first and second dataframes. Check [Getting Started](https://github.com/frlender/Jandas#element-wise-operation) for examples.

\
**DataFrame.isna**
```TypeScript
isna(): DataFrame<boolean>
```
Return a boolean dataframe indicating whether each element is `NaN`, `null` or `undefined`. `''` and `Infinity` are not considered as na values.


\
**DataFrame.merge**
```TypeScript
interface MergeOptions{
    on?: number|string|undefined
    axis?: 0|1
}
merge(df:DataFrame<T>,{on,axis=1}:MergeOptions={}): DataFrame<T>
```
Merge one dataframe to another on their index or a designated column or row. If `axis` equals to 1, it merges the two dataframes by index (if `on` is undefined) or a column designated by `on`. If `axis` equals to 0, it merges the two dataframes by columns (if `on` is undefined) or a row designated by `on`. Currently, the merge function only supports **inner** join of two dataframes and the values in the index, row or column that is merged on must be **unique**. It roughly equals to: 
`pandas.DataFrame.merge(...,how='inner',validate='one_to_one')`. 

\
**DataFrame.rank**
```TypeScript
interface DataFrameRankOptions{
    method?: 'average' | 'min' | 'max' | 'ordinal' | 'dense'
    missing?: 'last' | 'first' | 'remove'
    encoding?: (string|number|null|undefined)[]
    axis?: 0|1
}
rank(this:DataFrame<number>,options:DataFrameRankOptions={}): DataFrame<number>
```
Return ranks along `axis` (defaults to 0).  The `method` parameter determines how the ranks are calculated. It defaults to `'average'`. The underlying ranking function is implemented by the `ranks` function in the [@stdlib/stats-ranks](https://github.com/stdlib-js/stats-ranks) package. Please check its homepage for parameter usage. The method only works for dataframes with numeric values.

\
**DataFrame.diff**
```TypeScript
interface DiffOptions{
   periods?: number
   axis?: 0|1
}
diff(this:DataFrame<number>,{periods=1,axis=0}:DiffOptions={}):DataFrame<T>
```
First discrete difference of element. Calculates the difference of a DataFrame element compared with another element in the DataFrame (default is element in previous row `periods=1` and `axis=0`). Similar to [Pandas.DataFrame.diff](https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.diff.html). The method only works for dataframes with numeric values.


\
**DataFrame.pct_change**
```TypeScript
interface DiffOptions{
   periods?: number
   axis?: 0|1
}
pct_change(this:DataFrame<number>,{periods=1,axis=0}:DiffOptions={}):DataFrame<T>
```
Fractional change between the current and a prior element. Computes the fractional change from the immediately previous row by default (`periods=1` and `axis=0`). This is useful in comparing the fraction of change in a time series of elements. Similar to [Pandas.DataFrame.pct_change](https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.pct_change.html). The method only works for dataframes with numeric values.


\
**DataFrame.change**
```TypeScript
interface DiffOptions{
   periods?: number
   axis?: 0|1
}
change(this:DataFrame<number>,op:string,{periods=1,axis=0}:DiffOptions={}):DataFrame<T>
```
Calculates a user-defined change of a DataFrame element compared with another element in the DataFrame. The `op` argument is an operation string that is the same format as required by the `DataFrame.op` method. The `diff` and `pct_change` methods are implemented by this method with `op` being `'x-y'` and `'(x-y)/y'`, respectively. Computes the user-defined change from the immediately previous row by default (`periods=1` and `axis=0`). The method only works for dataframes with numeric values.

\
**DataFrame.rolling**
```TypeScript
interface DataFrameRollingOptions{
    min_periods?: number;
    center?: boolean;
    closed?: 'left' | 'right' | 'both' | 'neither';
    step?: number;
    axis?: 0|1
}

class Rolling{
    ...
    apply(fn:((vals:number[])=>number)|string, keepNaN=false): DataFrame<number>
}

rolling(this:DataFrame<number>,window:number,
        {min_periods=undefined,center=false,
        closed='right',step=1, axis=0}:DataFrameRollingOptions
        ={}):Rolling
```
Provide rolling window calculations. The parameters work exactly the same as in [pandas.DataFrame.rolling](https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.rolling.html). The `Rolling` object only implements the `sum` method for now. But you can do other rolling calculations by calling the `apply` method. The `fn` argument of the `apply` method can be a string that is a valid method name of the `Series` class. The method must reduce a `Series` object into a scalar value like `mean`,`sum` and `max`. As an example, to calculate mean for each window, you can do `df.rolling(window).apply('mean')`. `win_type` is not currently supported. If `keepNaN` is `true`, the input to the `fn` function will include `NaN` values, which might be useful for weighted rolling calculations. If `fn` is a string, `keepNaN` will always be `false`.


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

\
**DataFrame.to_raw**
```TypeScript
to_raw(copy:boolean=true):DataFrameRaw<T>
```
Return the dataframe as a plain object of key-value pairs. The returned object can be copied using the `structuredClone` function or saved in the local storage. The dataframe can be reconstructed from a raw copy using the `jandas.from_raw` utility function. `copy` determines whether create a new copy of values in the raw copy or just pass by reference.



### Series
**Series.constructor**
```TypeScript
interface SeriesInitOptions{
    name?: string|number
    index?: ns_arr | Index
}
constructor(values: T[]): Series<T>
constructor(values: T[], options:SeriesInitOptions): Series<T>
```
Constructs a series. The first argument is an array of values. The second argument is optional and used to set the name and the index of the series.

\
**Series.iloc**
```TypeScript
iloc(index:number): T
iloc(index?:string|number[]|boolean[]): Series<T>
iloc(idx?: string | numx | boolean[]):T|Series<T>
```
Access a series using position-based index. The index `index` can be string, number, number array or boolean array. If They are of string type, they must be a range string in the form like '1:3', ':1', '-1:', '::-1' and '5:1:-2'. Check [Getting Started](https://github.com/frlender/Jandas/blob/main/README.md#getting-started) for examples.

\
**Series.loc**
```TypeScript
loc(index:number|string): T|Series<T>
loc(index?:locParamArr): Series<T>
loc(index?: (number|string)|locParamArr):T|Series<T>
```
Access a series using label-based index.If the index `index` are of Series or Index type, their `.values` properties are used to index the dataframe. Check [Getting Started](https://github.com/frlender/Jandas/blob/main/README.md#getting-started) for examples.

\
**Series.iset**
```TypeScript
iset(rpl:T[]):void
iset(index:number,rpl:T):void
iset(index:string|number[]|boolean[],rpl:T[]):void
```
Change the values of a series using position-based index. Please refer to Series.iloc for possible values of `index`. `rpl` is the replacement value. It must be the same length as the series defined by `index`. Check [Getting Started](https://github.com/frlender/Jandas/blob/main/README.md#getting-started) for examples.

\
**Series.set**
```TypeScript
set(rpl:T[]):void
set(idx:string|number,rpl:T|T[]):void
set(idx:locParamArr,rpl:T[]):void
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
**Series.drop_duplicates**
```TypeScript

drop_duplicates(keep:'first'|'last'|false='first'): Series<T>
```
Drop duplicate values from the Series. `keep` determines which duplicates to keep. If `keep` is `false`, all duplicates are dropped. If `keep` is `'first'`, the first occurrence of each duplicate is kept. If `keep` is `'last'`, the last occurrence of each duplicate is kept. The default is `'first'`. 


\
**Series.b**
```TypeScript
b(expr:string,ctx?:any): boolean[]
```
Return an boolean array based on the evaluation of expression `expr`. `ctx` holds the context values to be evaluated in the expression. The syntax of `expr` is plain JavaScript except that it uses `x` to refer a value in the series and `@` to refer to the `ctx` value(s). If `ctx` is an object, use `@key` to refer to the value of a key in the expression. Of note, if no context value is passed to the method, `@` will be `undefined` in the expression. Check [Getting Started](https://github.com/frlender/Jandas/blob/main/README.md#getting-started) for examples.

\
**Series.query**
```TypeScript
query(expr:string): Series<T>
```
Alias for `Series.q`.

\
**Series.q**
```TypeScript
q(expr:string): Series<T>
```
Return a new dataframe based on the query expression `expr`. The syntax of `expr` is plain JavaScript except that it uses `x` to refer a value in the series and `@` to refer to the `ctx` value(s). If `ctx` is an object, use `@key` to refer to the value of a key in the expression. Of note, if no context value is passed to the method, `@` will be `undefined` in the expression. Check [Getting Started](https://github.com/frlender/Jandas/blob/main/README.md#getting-started) for examples. These functions are intended to use for Series with numeric values only.

**Series.reduce**
```TypeScript
reduce<K>(func:(a:T[])=>K,axis:0|1=0): K
```
Apply a function to the series that reduces it into a scalar.

\
**Series.min, Series.max, Series.sum, Series.mean, Series.mode, Series.median, Series.std, Series.var**
```TypeScript
min(this:Series<number>): number|undefined
// other functions are similarly defined
```
A collection of functions to compute statistics on the Series. They are implemented as wrappers around the corresponding functions in the [simple-statistics](https://github.com/simple-statistics/simple-statistics) package. The `std` and `var` functions are implemented using the `sampleStandardDeviation` and `sampleVariance` functions in the package. These functions are intended to use for Series with numeric values only. These methods only work for Series with numeric values.

\
**Series.accumulate**
```TypeScript
accumulate(this:Series<number>, func:(x:number,y:number)=>number): Series<number>
```
Calculate cumulative statistics of the values in the Series as specified by `func`. The method only works for Series with numeric values.

\
**Series.cumsum**
```TypeScript
cumsum(this:Series<number>): Series<number>
```
Calculate cumulative sum of the values in the Series. It only works for Series with numeric values.


\
**Series.cumprod**
```TypeScript
cumprod(this:Series<number>): Series<number>
```
Calculate cumulative product of the values in the Series. It only works for Series with numeric values.



\
**Series.sort_values**
```TypeScript
sort_values(ascending=true): Series<T>
```
Sort the Series in the `ascending` order. If values are numeric, they will be sorted by their numeric values. Otherwise, they will be sorted according to the rule in [Array.prototype.sort()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort).

\
**Series.op**
```TypeScript
op<K>(opStr:string|((x:T)=>K)): Series<K>
op<K,Z>(opStr:string|((x:T,y:Z)=>K),ss:Series<Z>|Z[]): Series<K>
```
Element-wise operation on a single series or on two series. If defined, `ss` represents the second series. It could be a series or an array. If it is a series, it must satisfies either of two rules. First, if both series' indices are unique, their indices must contain the same values but the order of the values can be different.  Second, if either of the series' indices is not unique, their indices' values must be exactly the same. `opStr` can be a function or an string expression. A valid string expression should define the operation on a single element or a set of two elements of the series. For operations on one series, use `x` in `opStr` to represent an element in the series. For operations on two series, use `x` and `y` to represent the elements in the first and second series. Check [Getting Started](https://github.com/frlender/Jandas#element-wise-operation) for examples.

\
**DataFrame.isna**
```TypeScript
isna(): Series<boolean>
```
Return a boolean series indicating whether each element is `NaN`, `null` or `undefined`. `''` and `Infinity` are not considered as na values.

\
**Series.unique**
```TypeScript
unique(): T[]
```
Return the unique values as an array.

**Series.value_counts**
```TypeScript
value_counts(): Series<number>
```
Return the counts of each unique value as a Series. The unique values will be the index of the Series. It is the same as pandas `value_counts()` function. Note only **number or string** values are supported by this method.

**Series.rank**
```TypeScript
interface SeriesRankOptions{
    method?: 'average' | 'min' | 'max' | 'ordinal' | 'dense'
    missing?: 'last' | 'first' | 'remove'
    encoding?: (string|number|null|undefined)[]
}
rank(this:Series<number>,options?:SeriesRankOptions): Series<number>
```
Return the ranks of the values in the Series. The `method` parameter determines how the ranks are calculated. It defaults to `'average'`. The underlying ranking function is implemented by the `ranks` function in the [@stdlib/stats-ranks](https://github.com/stdlib-js/stats-ranks) package. Please check its homepage for parameter usage. The method only works for Series with numeric values.

\
**Series.diff**
```TypeScript
diff(this:Series<number>,periods:number=1):Series<T>
```
First discrete difference of element. Calculates the difference of a Series element compared with another element in the Series (default is the previous `periods=1`). Similar to [Pandas.Series.diff](https://pandas.pydata.org/docs/reference/api/pandas.Series.diff.html). The method only works for Series with numeric values.


\
**Series.pct_change**
```TypeScript
pct_change(this:Series<number>,periods:number=1):Series<T>
```
Fractional change between the current and a prior element. Computes the fractional change from the immediately previous element by default (`periods=1`). This is useful in comparing the fraction of change in a time series of elements. Similar to [Pandas.Series.pct_change](https://pandas.pydata.org/docs/reference/api/pandas.Series.pct_change.html). The method only works for Series with numeric values.


\
**Series.change**
```TypeScript
change(this:Series<number>,op:string,periods:number=1):Series<T>
```
Calculates a user-defined change of a Series element compared with another element in the Series. The `op` argument is an operation string that is the same format as required by the `Series.op` method. The `diff` and `pct_change` methods are implemented by this method with `op` being `'x-y'` and `'(x-y)/y'`, respectively. Computes the user-defined change from the immediately previous element by default (`periods=1`). The method only works for Series with numeric values.

\
**Series.rolling**
```TypeScript
interface RollingOptions{
    min_periods?: number;
    center?: boolean;
    closed?: 'left' | 'right' | 'both' | 'neither';
    step?: number;
}

class SeriesRolling{
    ...
    apply(fn:((vals:number[])=>number)|string, keepNaN=false): Series<number>
}

rolling(this:Series<number>,window:number,
        {min_periods=undefined,center=false,
        closed='right',step=1}:RollingOptions
        ={}):SeriesRolling
```
Provide rolling window calculations. The parameters work exactly the same as in [pandas.Series.rolling](https://pandas.pydata.org/docs/reference/api/pandas.Series.rolling.html). The `SeriesRolling` object only implements the `sum` method for now. But you can do other rolling calculations by calling the `apply` method. The `fn` argument of the `apply` method can be a string that is a valid method name of the `Series` class. This method must reduce a `Series` object into a scalar value like `mean`,`sum` and `max`. As an example,to calculate mean for each window, you can do `ss.rolling(window).apply('mean')`. `win_type` is not currently supported. If `keepNaN` is `true`, the input to the `fn` function will include `NaN` values, which might be useful for weighted rolling calculations. If `fn` is a string, `keepNaN` will always be `false`.


\
**Series.p**
```TypeScript
p(): void
```
Print the series in console.

\
**Series.to_raw**
```TypeScript
to_raw(copy:boolean=true):SeriesRaw<T>
```
Return the series as a plain object of key-value pairs. The returned object can be copied using the `structuredClone` function or saved in the local storage. The series can be reconstructed from a raw copy using the `jandas.from_raw` utility function. `copy` determines whether create a new copy of values in the raw copy or just pass by reference.


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
trans(index:number|string): numx
trans(index:ns_arr): number[]
```
Translate an array of labels into an array of numeric positions. It will throw error if `vals` includes labels not in the index.

**Index.duplicated**
```TypeScript
duplicated(keep:'first'|'last'|false='first'): boolean[]
```
Return duplicated index values as a boolean array. The `keep` parameter determines which duplicated values to keep. If `keep` is `'first'`, the first occurrence of each duplicated value will be kept and marked as `false`. If `keep` is `'last'`, the last occurrence of each duplicated value will be kept and marked as `false`. If `keep` is `false`, all duplicated values will be marked as `true`.

\
**Index.to_raw**
```TypeScript
to_raw(copy:boolean=true):IndexRaw
```
Return the index as a plain object of key-value pairs. The returned object can be copied using the `structuredClone` function or saved in the local storage. The index can be reconstructed from a raw copy using the `jandas.from_raw` utility function. `copy` determines whether create a new copy of values in the raw copy or just pass by reference.


### Utility
**range**
```TypeScript
function range(end:number):number[]
function range(start:number,end:number):number[]
function range(start:number,end:number,step:number):number[]
```
Return an array of numbers defined by start, end and step.

**concat**
```TypeScript
function concat<T>(ssArr:Series<T>[]):Series<T>
function concat<T>(dfArr:DataFrame<T>[]):DataFrame<T>
function concat<T>(ssArr:Series<T>[],axis:0|1):Series<T>|DataFrame<T>
function concat<T>(dfArr:DataFrame<T>[],axis:0|1):DataFrame<T>
```
Concatenate an array of series or dataFrames into a combined series or dataFrame. It supports only **inner** join of concatenated Series or DataFrames. That is, only the common elements in the indices of the concatenated series or dataframes are kept in the combined series or dataframe. Roughly equals to `pandas.concat(...,join='inner')`.

**from_raw**
```TypeScript
function from_raw<T>(data:IndexRaw):Index
function from_raw<T>(data:SeriesRaw<T>):Series<T>
function from_raw<T>(data:DataFrameRaw<T>):DataFrame<T>
```
Create an index, a series or a dataframe from its raw copy. See the `to_raw` method for detailed usage.

**full**
```TypeScript
function full<T>(shape:number,fill_value:T):T[]
function full<T>(shape:number[],fill_value:T):T[][]
```
Return an array of a given `shape` filled with `fill_value`. Similar to `numpy.full`.
