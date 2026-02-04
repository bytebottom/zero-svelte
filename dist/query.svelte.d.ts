import type { CustomMutatorDefs, DefaultSchema, HumanReadable, Query as QueryDef, QueryOrQueryRequest, Schema } from '@rocicorp/zero';
import type { ViewWrapper, Z } from './Z.svelte.js';
import type { QueryResultDetails, ResultType } from './types.js';
export type { QueryResultDetails, ResultType };
export type QueryResult<TReturn> = readonly [HumanReadable<TReturn>, QueryResultDetails];
export declare class Query<TTable extends keyof TSchema['tables'] & string, TSchema extends Schema = DefaultSchema, TReturn = unknown, MD extends CustomMutatorDefs | undefined = undefined> {
    #private;
    constructor(query: QueryDef<TTable, TSchema, TReturn>, z: Z<TSchema, MD>, enabled?: boolean);
    get data(): HumanReadable<TReturn>;
    get details(): QueryResultDetails;
    get view(): ViewWrapper<TTable, TSchema, TReturn, MD> | undefined;
    /** @deprecated Use .data instead */
    get current(): HumanReadable<TReturn>;
    updateQuery(newQuery: QueryOrQueryRequest<any, any, any, TSchema, TReturn, any>, enabled?: boolean): void;
    destroy(): void;
}
