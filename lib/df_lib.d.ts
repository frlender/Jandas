import DataFrame from "./DataFrame";
import { ns_arr, Obj, GP } from './interfaces';
import Series from './Series';
import Index from './Index';
declare class GroupByThen<T> implements Iterable<[DataFrame<T>, T | T[], number]> {
    gp: GP;
    axis: 0 | 1;
    df: DataFrame<T>;
    labels: ns_arr | null;
    index: Index;
    constructor(gp: GP, axis: 0 | 1, df: DataFrame<T>, labels: ns_arr | null, index: Index);
    private _get_keep_labels;
    private _prepare;
    then(func: (group: DataFrame<T>, key: T | T[], i: number) => void): void;
    [Symbol.iterator](): Generator<[DataFrame<T>, T | T[], number], any, unknown>;
    reduce(func: (a: T[]) => T): DataFrame<T>;
    private _reduce_num;
    min(): Series<number>;
    max(): Series<number>;
    sum(): Series<number>;
    mean(): Series<number>;
    median(): Series<number>;
    std(): Series<number>;
    var(): Series<number>;
    mode(): Series<number>;
    prod(): Series<number>;
}
declare function _sortIndices<S>(arr: S[] | S[][], multiple: boolean, ascending: boolean | boolean[]): number[];
declare function findUnquotedAt(str: string): number[];
declare class Rolling {
    private df;
    private window;
    private min_periods;
    private center;
    private closed;
    private step;
    private axis;
    wins: (DataFrame<number> | typeof NaN)[];
    labels: (string | number)[];
    constructor(df: DataFrame<number>, window: number, min_periods?: number, center?: boolean, closed?: 'left' | 'right' | 'both' | 'neither', step?: number, axis?: 0 | 1);
    apply(fn2: ((vals: number[]) => number) | string, keepNaN?: boolean): DataFrame<number>;
    sum(): DataFrame<number>;
}
declare class SeriesRolling {
    private df;
    private window;
    private min_periods;
    private center;
    private closed;
    private step;
    roll: Rolling;
    constructor(df: DataFrame<number>, window: number, min_periods?: number, center?: boolean, closed?: 'left' | 'right' | 'both' | 'neither', step?: number);
    apply(fn2: ((vals: number[]) => number) | string, keepNaN?: boolean): Series<number>;
    sum(): Series<number>;
}
export { Obj, GP, GroupByThen, _sortIndices, findUnquotedAt, Rolling, SeriesRolling };
