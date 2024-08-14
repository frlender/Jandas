import DataFrame from "./DataFrame";
import { ns_arr, Obj, GP } from './interfaces';
import Series from './Series';
import Index from './Index';
declare class GroupByThen<T> {
    gp: GP;
    axis: 0 | 1;
    df: DataFrame<T>;
    labels: ns_arr | null;
    index: Index;
    constructor(gp: GP, axis: 0 | 1, df: DataFrame<T>, labels: ns_arr | null, index: Index);
    private _get_keep_labels;
    private _prepare;
    then(func: (group: DataFrame<T>, key: T | T[], i: number) => void): void;
    [Symbol.iterator](): Generator<{
        group: DataFrame<T>;
        key: T | T[];
        i: number;
        gp: DataFrame<T>;
    }, void, unknown>;
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
declare function _sortIndices<S>(arr: S[] | S[][], ascending: boolean): number[];
export { Obj, GP, GroupByThen, _sortIndices };
