import Series from './Series'
import Index from './Index'

type ns = number|string
type ns_arr =  (number | string)[]
type numx = number | number[]
type nsx = number | string | ns_arr

type locParamArr = ns_arr | Series<number|string> | boolean[] | Series<boolean> | Index
type locParam = number | string | locParamArr

interface Obj<T>{
    [key: number|string]:T
}

// for groupby method
interface GP{
    [key: string]: number[]
} 

interface SeriesInitOptions{
    name?: string|number
    index?: ns_arr | Index
}

interface DataFrameInitOptions{
    index?: Index|ns_arr
}
interface DataFrameArrInitOptions extends DataFrameInitOptions{
    columns?: Index|ns_arr
}

// push, insert
interface PushOptions{
    name?: number|string
    axis?: 0|1
}

// interface GroupByOptions{
//     axis?: 0|1
// }
interface SortOptions{
    ascending?: boolean | boolean[]
    axis?: 0|1
}

interface MergeOptions{
    on?: number|string|undefined
    axis?: 0|1
}

interface SeriesRankOptions{
    method?: 'average' | 'min' | 'max' | 'ordinal' | 'dense'
    missing?: 'last' | 'first' | 'remove'
    encoding?: (string|number|null|undefined)[]
}

interface DataFrameRankOptions extends SeriesRankOptions{
    axis?: 0|1
}

interface IndexRaw{
    values: (string | number)[];
    name: string | number;
}

interface SeriesRaw<T>{
    values: T[];
    name: string | number;
    index: {
        values: (string | number)[];
        name: string | number;
    };
}

interface DataFrameRaw<T>{
    values: T[][];
    index: {
        values: (string | number)[];
        name: string | number;
    }
    columns: {
        values: (string | number)[];
        name: string | number;
    }
}

interface DropDuplicatesOptions{
    keep?: 'first' | 'last' | false
    axis?: 0|1
}

type IndexType = 'index' | 'columns'

interface QueryOptions{
    axis?: 0|1
    ctx?: any
}

interface DiffOptions{
    periods?: number
    axis?: 0|1
}

interface RollingOptions{
    min_periods?: number;
    center?: boolean;
    closed?: 'left' | 'right' | 'both' | 'neither';
    step?: number;
}

interface DataFrameRollingOptions extends RollingOptions{
    axis?: 0|1
}

export {ns,ns_arr,numx,nsx,locParamArr,locParam,
    Obj,GP,SeriesInitOptions,
    DataFrameInitOptions,
    DataFrameArrInitOptions,
    SortOptions,PushOptions,MergeOptions,
    SeriesRankOptions,DataFrameRankOptions,
    IndexRaw, SeriesRaw, DataFrameRaw,
    DropDuplicatesOptions,IndexType,QueryOptions,
    DiffOptions,RollingOptions,DataFrameRollingOptions}
