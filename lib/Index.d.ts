import { ns_arr, numx, nsx } from './cmm';
declare class Index {
    private __values;
    _values: ns_arr;
    mp: Map<number | string, numx>;
    shape: number;
    name: string | number;
    constructor(values: ns_arr, name?: string | number);
    get values(): ns_arr;
    set values(vals: ns_arr);
    p(): void;
    _add(k: number | string, i: number): void;
    remap(): void;
    insert(idx: number, val: number | string): void;
    cp(): Index;
    has(idx: number | string): boolean;
    unique(): (string | number)[];
    is_unique(): boolean;
    check(idx: number | string): void;
    trans(index: nsx): numx;
}
export default Index;
