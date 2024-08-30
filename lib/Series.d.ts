import { ns, ns_arr, numx, nsx, locParamArr, SeriesInitOptions, SeriesRankOptions } from './interfaces';
import Index from './Index';
declare class Series<T> {
    values: T[];
    private _index;
    shape: number;
    private _name;
    constructor(values: T[]);
    constructor(values: T[], options: SeriesInitOptions);
    constructor(values: T[], options?: SeriesInitOptions);
    get index(): Index;
    set index(vals: ns_arr | Index);
    get name(): string | number;
    set name(val: string | number);
    rename(labelMap: {
        [key: ns]: ns;
    }, inplace: true): void;
    rename(labelMap: {
        [key: ns]: ns;
    }, inplace: false): Series<T>;
    rename(labelMap: {
        [key: ns]: ns;
    }, inplace?: boolean): void | Series<T>;
    p(): void;
    _iloc(idx: number): T;
    _iloc(idx: undefined | number[] | boolean[]): Series<T>;
    _iloc(idx?: numx | boolean[]): T | Series<T>;
    iloc(idx: number): T;
    iloc(idx?: string | number[] | boolean[]): Series<T>;
    iloc(idx?: string | numx | boolean[]): T | Series<T>;
    loc(index: number | string): T | Series<T>;
    loc(index?: locParamArr): Series<T>;
    loc(index?: (number | string) | locParamArr): T | Series<T>;
    _iset(idx: undefined | numx | boolean[], values: T | T[]): void;
    iset(rpl: T[]): void;
    iset(index: number, rpl: T): void;
    iset(index: string | number[] | boolean[], rpl: T[]): void;
    iset(first: T[] | string | numx | boolean[], second?: T | T[]): void;
    set(rpl: T[]): void;
    set(idx: string | number, rpl: T | T[]): void;
    set(idx: locParamArr, rpl: T[]): void;
    set(first: T[] | string | numx | locParamArr, second?: T | T[]): void;
    push(val: T, name?: number | string): void;
    insert(idx: number, val: T, name?: number | string): void;
    drop(labels: nsx): Series<T>;
    drop_duplicates(keep?: 'first' | 'last' | false): Series<T>;
    bool(expr: string): boolean[];
    b(expr: string): boolean[];
    query(expr: string): Series<T>;
    q(expr: string): Series<T>;
    sort_values(ascending?: boolean): Series<T>;
    value_counts(): Series<number>;
    op<K>(opStr: string | ((x: T) => K)): Series<K>;
    op<K, Z>(opStr: string | ((x: T, y: Z) => K), ss: Series<Z> | Z[]): Series<K>;
    unique(): T[];
    rank(options?: SeriesRankOptions): Series<number>;
    reduce<K>(func: (a: T[]) => K): K;
    min(): number;
    max(): number;
    sum(): number;
    mean(): number;
    mode(): number;
    median(): number;
    std(): number;
    var(): number;
    prod(): number;
    to_raw(copy?: boolean): {
        values: T[];
        name: string | number;
        index: {
            values: (string | number)[];
            name: string | number;
        };
    };
}
export default Series;
