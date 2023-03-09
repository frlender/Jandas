import { DataFrame } from "./J";
interface Obj<T> {
    [key: number | string]: T;
}
interface GP {
    [key: string]: number[];
}
declare class GroupByThen<T> {
    gp: GP;
    axis: 0 | 1;
    df: DataFrame<T>;
    constructor(gp: GP, axis: 0 | 1, df: DataFrame<T>);
    then(func: (group: DataFrame<T>, key: T | T[], i: number) => void): void;
}
export { Obj, GP, GroupByThen };
