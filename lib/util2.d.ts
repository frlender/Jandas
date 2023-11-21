import Series from './Series';
import DataFrame from './DataFrame';
declare function concat<T>(ssArr: Series<T>[]): Series<T>;
declare function concat<T>(dfArr: DataFrame<T>[]): DataFrame<T>;
declare function concat<T>(ssArr: Series<T>[], axis: 0 | 1): Series<T> | DataFrame<T>;
declare function concat<T>(dfArr: DataFrame<T>[], axis: 0 | 1): DataFrame<T>;
export { concat };
