import { ns, ns_arr, numx, nsx, locParamArr, Obj, DataFrameArrInitOptions, DataFrameInitOptions, PushOptions, SortOptions, MergeOptions, DataFrameRankOptions, DataFrameRaw, DropDuplicatesOptions, QueryOptions, DiffOptions, DataFrameRollingOptions } from './interfaces';
import { GroupByThen, Rolling } from './df_lib';
import Index from './Index';
import Series from './Series';
declare class DataFrame<T> {
    values: T[][];
    shape: [number, number];
    private _index;
    private _columns;
    private _tr?;
    constructor(arr: T[][] | Obj<T>[]);
    constructor(arr: T[][], options: DataFrameArrInitOptions);
    constructor(arr: Obj<T>[], options: DataFrameInitOptions);
    constructor(arr: T[][] | Obj<T>[], options?: DataFrameInitOptions | DataFrameArrInitOptions);
    __transpose(arr: T[][]): T[][];
    _transpose(arr: T[][]): T[][];
    get tr(): T[][];
    set tr(vals: T[][]);
    get index(): Index;
    get columns(): Index;
    _indexSetterEffect(): void;
    set index(vals: ns_arr | Index);
    set columns(vals: ns_arr | Index);
    rename(labelMap: {
        index?: {
            [key: ns]: ns;
        };
        columns?: {
            [key: ns]: ns;
        };
    }, inplace?: false): DataFrame<T>;
    rename(labelMap: {
        index?: {
            [key: ns]: ns;
        };
        columns?: {
            [key: ns]: ns;
        };
    }, inplace: true): void;
    _p(): void;
    p(): void;
    transpose(inplace?: boolean): DataFrame<T>;
    _iloc_asymmetric(v1: T[][], l1: Index, l2: Index, transpose: boolean, i1: numx | boolean[], i2?: numx | boolean[]): DataFrame<T> | Series<T> | null;
    _iloc_symmetric(ir?: numx | boolean[], ic?: numx | boolean[]): DataFrame<T> | T | null;
    iloc(row: number, col: number): T;
    iloc(row: number, col?: null | string | number[] | boolean[]): Series<T>;
    iloc(row: null | string | number[] | boolean[], col: number): Series<T>;
    iloc(row?: null | string | number[] | boolean[], col?: null | string | number[] | boolean[]): DataFrame<T>;
    iloc(row?: null | string | numx | boolean[], col?: null | string | numx | boolean[]): T | Series<T> | DataFrame<T>;
    loc(row: number | string, col: number | string): T | Series<T> | DataFrame<T>;
    loc(row: number | string, col?: null | locParamArr): Series<T> | DataFrame<T>;
    loc(row: null | locParamArr, col: number | string): Series<T> | DataFrame<T>;
    loc(row?: null | locParamArr, col?: null | locParamArr): DataFrame<T>;
    loc(row?: null | number | string | locParamArr, col?: null | number | string | locParamArr): T | Series<T> | DataFrame<T>;
    _iset_asymmetric(v1: T[][], l1: Index, l2: Index, i1: numx | boolean[], rpl: T[] | T[][], i2?: numx | boolean[]): null | undefined;
    _iset_symmetric(ir: undefined | numx | boolean[], ic: undefined | numx | boolean[], rpl: T | T[] | T[][]): null | undefined;
    _iset(row: undefined | numx | boolean[], col: undefined | numx | boolean[], rpl: T | T[] | T[][]): void;
    iset(row: number, col: number, rpl: T): void;
    iset(row: number, rpl: T[]): void;
    iset(row: number, col: null | string | number[] | boolean[], rpl: T[]): void;
    iset(row: null | string | number[] | boolean[], col: number, rpl: T[]): void;
    iset(rpl: T[][]): void;
    iset(row: null | string | number[] | boolean[], rpl: T[][]): void;
    iset(row: null | string | number[] | boolean[], col: null | string | number[] | boolean[], rpl: T[][]): void;
    set(row: number | string, col: number | string, rpl: T | T[] | T[][]): void;
    set(row: number | string, rpl: T[] | T[][]): void;
    set(row: number | string, col: null | locParamArr, rpl: T[] | T[][]): void;
    set(row: null | locParamArr, col: number | string, rpl: T[] | T[][]): void;
    set(rpl: T[][]): void;
    set(row: null | locParamArr, rpl: T[][]): void;
    set(row: null | locParamArr, col: null | locParamArr, rpl: T[][]): void;
    _push(val: T[], { name, axis }?: PushOptions): void;
    _series_push(val: Series<T>, options: PushOptions): void;
    push(val: T[] | Series<T>, options?: PushOptions): void;
    _insert(i1: number, l1: Index, v1: T[][], rpl: T[], name: number | string): void;
    insert(idx: number, val: T[], { name, axis }?: PushOptions): void;
    drop(labels: nsx, axis?: 0 | 1): DataFrame<T>;
    drop_duplicates(labels: nsx, { keep, axis }?: DropDuplicatesOptions): DataFrame<T>;
    set_index(label: number | string): DataFrame<T>;
    set_columns(label: number | string): DataFrame<T>;
    reset_index(name?: string | number): DataFrame<T>;
    reset_columns(name?: string | number): DataFrame<T>;
    to_dict(axis?: 0 | 1): Obj<T>[];
    bool(expr: string, axis?: 0 | 1): boolean[];
    b(expr: string, options?: QueryOptions): boolean[];
    query(col_expr: string): DataFrame<T>;
    query(col_expr: null | string, row_expr_or_ctx: any): DataFrame<T>;
    query(col_expr: null | string, row_expr: null | string, ctx: any): DataFrame<T>;
    q(col_expr: string): DataFrame<T>;
    q(col_expr: null | string, row_expr_or_ctx: any): DataFrame<T>;
    q(col_expr: null | string, row_expr: null | string, ctx: any): DataFrame<T>;
    _iter(indexType: 'index' | 'columns'): Generator<[
        ss: Series<T>,
        key: string | number,
        i: number
    ]>;
    _iter(indexType: 'index' | 'columns', func: (row: Series<T>, key: number | string | ns_arr, i: number) => void): void;
    iterrows(): Generator<[
        row: Series<T>,
        key: string | number,
        i: number
    ]>;
    iterrows(func: (row: Series<T>, key: number | string | ns_arr, i: number) => void): void;
    itercols(): Generator<[
        col: Series<T>,
        key: string | number,
        i: number
    ]>;
    itercols(func: (row: Series<T>, key: number | string | ns_arr, i: number) => void): void;
    groupby(labels?: nsx | null, axis?: 0 | 1): GroupByThen<T>;
    _groupby(labels: nsx | null, axis?: 0 | 1): GroupByThen<T>;
    sort_values(labels: nsx | null, { ascending, axis }?: SortOptions): DataFrame<T>;
    op<K>(opStr: string | ((x: T) => K)): DataFrame<K>;
    op<K, Z>(opStr: string | ((x: T, y: Z) => K), df: DataFrame<Z> | Z[][]): DataFrame<K>;
    merge(df: DataFrame<T>, { on, axis }?: MergeOptions): DataFrame<T>;
    rank(this: DataFrame<number>, options?: DataFrameRankOptions): DataFrame<number>;
    change(this: DataFrame<number>, op_str: string, { periods, axis }?: DiffOptions): DataFrame<number>;
    diff(this: DataFrame<number>, { periods, axis }?: DiffOptions): DataFrame<number>;
    pct_change(this: DataFrame<number>, { periods, axis }?: DiffOptions): DataFrame<number>;
    rolling(this: DataFrame<number>, window: number, { min_periods, center, closed, step, axis }?: DataFrameRollingOptions): Rolling;
    isna(): DataFrame<boolean>;
    to_raw(copy?: boolean): DataFrameRaw<T>;
    reduce<K>(func: (a: T[]) => K, axis?: 0 | 1): Series<K>;
    _reduce_num(this: DataFrame<number>, func: (a: number[]) => number, axis: 0 | 1): Series<number>;
    min(this: DataFrame<number>, axis?: 0 | 1): Series<number>;
    max(this: DataFrame<number>, axis?: 0 | 1): Series<number>;
    sum(this: DataFrame<number>, axis?: 0 | 1): Series<number>;
    mean(this: DataFrame<number>, axis?: 0 | 1): Series<number>;
    median(this: DataFrame<number>, axis?: 0 | 1): Series<number>;
    std(this: DataFrame<number>, axis?: 0 | 1): Series<number>;
    var(this: DataFrame<number>, axis?: 0 | 1): Series<number>;
    mode(this: DataFrame<number>, axis?: 0 | 1): Series<number>;
    prod(this: DataFrame<number>, axis?: 0 | 1): Series<number>;
}
export default DataFrame;
