import { ns } from './interfaces';
declare const isNum: (x: any) => boolean;
declare const isStr: (x: any) => boolean;
declare const isArr: (x: any) => boolean;
declare const isVal: (x: any) => boolean;
declare const isNumArr: (x: any) => boolean;
declare const isStrArr: (x: any) => boolean;
declare const check: {
    [key: ns]: any;
};
declare function _trans_rg(x: string, len: number): number[];
declare function range(end: number): number[];
declare function range(start: number, end: number): number[];
declare function range(start: number, end: number, step: number): number[];
declare function _trans_iloc(idx: undefined | string | number | number[] | boolean[], len: number): number | (number[] | boolean[]) | undefined;
export { isNum, isStr, isArr, isVal, isNumArr, isStrArr, _trans_iloc, check, range, _trans_rg };
