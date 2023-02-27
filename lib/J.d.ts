import { range } from './util';
import { Obj, GroupByThen } from './df_lib';
type ns_arr = (number | string)[];
type numx = number[] | number;
type nsx = number | string | ns_arr;
declare class Index {
    private __values;
    _values: ns_arr;
    mp: Map<number | string, numx>;
    shape: number;
    name: string | number;
    constructor(values: ns_arr, name?: string | number);
    get values(): ns_arr;
    set values(vals: ns_arr);
    p(): void;
    _add(k: number | string, i: number): void;
    remap(): void;
    insert(idx: number, val: number | string): void;
    cp(): Index;
    has(idx: number | string): boolean;
    unique(): (string | number)[];
    is_unique(): boolean;
    check(idx: number | string): void;
    trans(index: nsx): numx;
}
type locParam = nsx | Series<number | string> | boolean[] | Series<boolean> | Index;
declare class Series<T> {
    values: T[];
    _index: Index;
    shape: number;
    name: string | number;
    constructor(values: T[]);
    constructor(values: T[], name: string | number);
    constructor(values: T[], index: ns_arr | Index, name?: string | number);
    get index(): Index;
    set index(vals: ns_arr | Index);
    p(): void;
    _iloc(idx: number): T;
    _iloc(idx: undefined | number[] | boolean[]): Series<T>;
    iloc(idx: number): T;
    iloc(idx?: string | number[] | boolean[]): Series<T>;
    loc(index?: locParam): T | Series<T>;
    _iset(idx: undefined | numx | boolean[], values: T | T[]): void;
    iset(rpl: T[]): void;
    iset(index: string | numx | boolean[], rpl: T | T[]): void;
    set(rpl: T[]): void;
    set(idx: locParam, rpl: T | T[]): void;
    push(val: T, name?: number | string): void;
    insert(idx: number, val: T, name?: number | string): void;
    drop(labels: nsx): Series<T>;
    b(expr: string): boolean[];
    q(expr: string): Series<T>;
}
declare class DataFrame<T> {
    values: T[][];
    tr: T[][];
    shape: [number, number];
    _index: Index;
    _columns: Index;
    constructor(arr: T[][]);
    constructor(arr: T[][], index: Index | ns_arr);
    constructor(arr: T[][], index: null | Index | ns_arr, columns: Index | ns_arr);
    constructor(arr: Obj<T>[]);
    constructor(arr: Obj<T>[], index: Index | ns_arr);
    __transpose(arr: T[][]): T[][];
    _transpose(arr: T[][]): T[][];
    get index(): Index;
    get columns(): Index;
    set index(vals: ns_arr | Index);
    set columns(vals: ns_arr | Index);
    _p(): void;
    p(): void;
    transpose(inplace?: boolean): DataFrame<T>;
    _iloc_asymmetric(v1: T[][], l1: Index, l2: Index, transpose: boolean, i1: numx | boolean[], i2?: numx | boolean[]): DataFrame<T> | Series<T> | null;
    _iloc_symmetric(ir?: numx | boolean[], ic?: numx | boolean[]): DataFrame<T> | T | null;
    iloc(row?: null | string | numx | boolean[], col?: null | string | numx | boolean[]): T | Series<T> | DataFrame<T>;
    loc(row?: null | locParam, col?: null | locParam): DataFrame<T> | T | Series<T>;
    _iset_asymmetric(v1: T[][], l1: Index, l2: Index, i1: numx | boolean[], rpl: T[] | T[][], i2?: numx | boolean[]): null | undefined;
    _iset_symmetric(ir: undefined | numx | boolean[], ic: undefined | numx | boolean[], rpl: T | T[] | T[][]): null | undefined;
    _iset(row: undefined | numx | boolean[], col: undefined | numx | boolean[], rpl: T | T[] | T[][]): void;
    iset(rpl: T[][]): void;
    iset(row: null | numx | boolean[], rpl: T[] | T[][]): void;
    iset(row: null | numx | boolean[], col: null | numx | boolean[], rpl: T | T[] | T[][]): void;
    set(rpl: T[][]): void;
    set(row: null | locParam, rpl: T[] | T[][]): void;
    set(row: null | locParam, col: null | locParam, rpl: T | T[] | T[][]): void;
    _insert(i1: number, l1: Index, v1: T[][], rpl: T[], name: number | string): void;
    push(val: T[], name?: number | string, axis?: 0 | 1): void;
    insert(idx: number, val: T[], name?: number | string, axis?: 0 | 1): void;
    drop(labels: nsx, axis?: 0 | 1): DataFrame<T>;
    reset_index(name?: string | number): DataFrame<T>;
    reset_columns(name?: string | number): DataFrame<T>;
    to_dict(axis?: 0 | 1): Obj<T>[];
    b(expr: string, axis?: 0 | 1): boolean[];
    q(col_expr: string): DataFrame<T>;
    q(row_expr: null | string, col_expr: null | string): DataFrame<T>;
    iterrows(func: (row: Series<T>, key: number | string | ns_arr, i: number) => void): void;
    itercols(func: (row: Series<T>, key: number | string | ns_arr, i: number) => void): void;
    groupby(): GroupByThen<T>;
    groupby(labels: nsx | null): GroupByThen<T>;
    groupby(labels: nsx | null, axis: 0 | 1): GroupByThen<T>;
    _groupby(labels: nsx | null, axis?: 0 | 1): GroupByThen<T>;
}
export { Series, DataFrame, Index, range };
