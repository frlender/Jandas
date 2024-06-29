import Index from './Index';
import Series from './Series';
import { ns, ns_arr, numx, locParamArr } from './interfaces';
declare function cp<S>(arr: S[]): S[];
declare function vec_loc<S>(vec: S[], idx: number[] | boolean[], f?: (x: S) => S): S[];
declare function vec_loc2<S, Z>(vec1: S[], vec2: Z[], idx: number[] | boolean[]): [S[], Z[]];
declare function vec_set<S>(vec: S[], rpl: S[], idx: number[] | boolean[]): void;
declare function _str(x: any): any;
declare function _trans(index: Index): undefined;
declare function _trans(index: Index, idx: ns | ns[] | Index | Series<ns>): numx;
declare function _trans(index: Index, idx: boolean[] | Series<boolean>): boolean[];
declare function _trans(index: Index, idx?: ns | locParamArr): undefined | numx | boolean[];
declare const setIndex: (vals: ns_arr | Index, shape: number) => Index;
declare const duplicated: (vals: any[], keep?: 'first' | 'last' | false, keyFunc?: (x: any) => string) => boolean[];
declare function _rename(index: Index, labelMap: {
    [key: ns]: ns;
}, inplace: true): void;
declare function _rename(index: Index, labelMap: {
    [key: ns]: ns;
}, inplace: false): Index;
declare function _rename(index: Index, labelMap: {
    [key: ns]: ns;
}, inplace: boolean): void | Index;
export { vec_loc, vec_loc2, vec_set, cp, _str, _trans, setIndex, duplicated, _rename };
