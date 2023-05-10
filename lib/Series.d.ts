import { ns_arr, numx, nsx, locParam } from './cmm';
import Index from './Index';
import DataFrame from './DataFrame';
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
    sort_values(ascending?: boolean): Series<T>;
    value_counts(): DataFrame<string | number>;
    op(opStr: string): Series<T>;
    op(opStr: string, ss: Series<T> | T[]): Series<T>;
    min(): number | undefined;
    max(): number | undefined;
    sum(): number;
    mean(): number | undefined;
    mode(): number;
    median(): number | undefined;
    std(): number | undefined;
    var(): number | undefined;
}
export default Series;
