import { Index } from './J';
declare const isNum: (x: any) => boolean;
declare const isStr: (x: any) => boolean;
declare const isArr: (x: any) => boolean;
declare const isVal: (x: any) => boolean;
declare const isNumArr: (x: any) => boolean;
declare const isStrArr: (x: any) => boolean;
declare const check: {
    index: {
        set(k: any, len: number, v: any): void;
    };
    frame: {
        index: {
            set(len: number, idx_len: number): void;
        };
        b: {
            expr(len: number): void;
        };
    };
    iloc: {
        num(idx: number, len: number): void;
        bool(idx: boolean[], len: number): void;
        str: {
            colon(s: string): void;
            parsed(start: number, end: number): void;
        };
    };
    iset: {
        rpl: {
            val<T>(val: T): void;
            num<T_1>(values: T_1 | T_1[], len: number): void;
            mat<T_2>(values: T_2[][], shape: number[]): void;
            bool<T_3>(values: T_3[], idx: boolean[]): void;
        };
    };
    set: {
        index: {
            uniq(index: Index): void;
        };
    };
};
declare function range(end: number): number[];
declare function range(start: number, end: number): number[];
declare function _trans_iloc(idx: undefined | string | number | number[] | boolean[], len: number): number | (number[] | boolean[]) | undefined;
export { isNum, isStr, isArr, isVal, isNumArr, isStrArr, _trans_iloc, check, range };
