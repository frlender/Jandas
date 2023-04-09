import * as core from './core';
declare const range: typeof core.range;
declare const Index: typeof core.Index;
declare class Series<T> extends core.Series<T> {
    min(): number | undefined;
    max(): number | undefined;
    sum(): number;
    mean(): number | undefined;
    mode(): number;
    median(): number | undefined;
    std(): number | undefined;
    var(): number | undefined;
}
declare class DataFrame<T> extends core.DataFrame<T> {
    _reduce_num(func: (a: number[]) => number | undefined, axis: 0 | 1): Series<number>;
    min(axis?: 0 | 1): Series<number>;
    max(axis?: 0 | 1): Series<number>;
    sum(axis?: 0 | 1): Series<number>;
    mean(axis?: 0 | 1): Series<number>;
    median(axis?: 0 | 1): Series<number>;
    std(axis?: 0 | 1): Series<number>;
    var(axis?: 0 | 1): Series<number>;
    mode(axis?: 0 | 1): Series<number>;
}
export { DataFrame, Series, Index, range };
