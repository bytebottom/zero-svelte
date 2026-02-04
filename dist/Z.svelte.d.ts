import { Zero, type Connection, type ConnectionState, type CustomMutatorDefs, type DefaultContext, type DefaultSchema, type HumanReadable, type PullRow, type Query as QueryDef, type QueryOrQueryRequest, type ReadonlyJSONValue, type RunOptions, type Schema, type TTL, type TypedView, type ZeroOptions } from '@rocicorp/zero';
import { Query } from './query.svelte.js';
import type { QueryResultDetails } from './types.js';
export declare class ViewStore {
    #private;
    getView<TTable extends keyof TSchema['tables'] & string, TSchema extends Schema, TReturn, MD extends CustomMutatorDefs | undefined = undefined>(z: Z<TSchema, MD>, query: QueryDef<TTable, TSchema, TReturn>, enabled?: boolean): ViewWrapper<TTable, TSchema, TReturn, MD>;
}
export declare class ViewWrapper<TTable extends keyof TSchema['tables'] & string, TSchema extends Schema, TReturn, MD extends CustomMutatorDefs | undefined = undefined> {
    #private;
    private z;
    private query;
    private onMaterialized;
    private onDematerialized;
    private enabled;
    constructor(z: Z<TSchema, MD>, query: QueryDef<TTable, TSchema, TReturn>, onMaterialized: (view: ViewWrapper<TTable, TSchema, TReturn, MD>) => void, onDematerialized: () => void, enabled: boolean);
    get current(): readonly [HumanReadable<TReturn>, QueryResultDetails];
    get dataOnly(): HumanReadable<TReturn>;
    get detailsOnly(): QueryResultDetails;
    ensureSubscribed(): void;
}
export declare class Z<TSchema extends Schema = DefaultSchema, MD extends CustomMutatorDefs | undefined = undefined> {
    #private;
    constructor(z_options: ZeroOptions<TSchema, MD>);
    get query(): Zero<TSchema, MD>['query'];
    get mutate(): Zero<TSchema, MD>['mutate'];
    get mutateBatch(): Zero<TSchema, MD>['mutateBatch'];
    get clientID(): string;
    get userID(): string;
    get context(): unknown;
    /**
     * @deprecated Use `connectionState` instead for richer connection status information.
     */
    get online(): boolean;
    /**
     * The current connection state. One of:
     * - `connecting`: Actively trying to connect
     * - `connected`: Successfully connected to the server
     * - `disconnected`: Offline, will retry automatically
     * - `needs-auth`: Authentication required, call `connection.connect()` with auth
     * - `error`: Fatal error, call `connection.connect()` to retry
     * - `closed`: Instance was closed, create a new Zero instance
     */
    get connectionState(): ConnectionState;
    /**
     * The connection API for managing Zero's connection lifecycle.
     * Use this to manually control connections and handle auth failures.
     *
     * @example
     * ```ts
     * // Resume connection from error state
     * await z.connection.connect();
     *
     * // Resume with new auth token
     * await z.connection.connect({ auth: newToken });
     * ```
     */
    get connection(): Connection;
    get viewStore(): ViewStore;
    createQuery<TTable extends keyof TSchema['tables'] & string, TInput extends ReadonlyJSONValue | undefined, TOutput extends ReadonlyJSONValue | undefined, TReturn = PullRow<TTable, TSchema>, TContext = DefaultContext>(query: QueryOrQueryRequest<TTable, TInput, TOutput, TSchema, TReturn, TContext>, enabled?: boolean): Query<TTable, TSchema, TReturn, MD>;
    q<TTable extends keyof TSchema['tables'] & string, TInput extends ReadonlyJSONValue | undefined, TOutput extends ReadonlyJSONValue | undefined, TReturn = PullRow<TTable, TSchema>, TContext = DefaultContext>(query: QueryOrQueryRequest<TTable, TInput, TOutput, TSchema, TReturn, TContext>, enabled?: boolean): Query<TTable, TSchema, TReturn, MD>;
    preload<TTable extends keyof TSchema['tables'] & string, TInput extends ReadonlyJSONValue | undefined, TOutput extends ReadonlyJSONValue | undefined, TReturn = PullRow<TTable, TSchema>, TContext = DefaultContext>(query: QueryOrQueryRequest<TTable, TInput, TOutput, TSchema, TReturn, TContext>, options?: {
        /**
         * Time To Live. This is the amount of time to keep the rows associated with
         * this query after {@linkcode cleanup} has been called.
         */
        ttl?: TTL | undefined;
    } | undefined): {
        cleanup: () => void;
        complete: Promise<void>;
    };
    run<TTable extends keyof TSchema['tables'] & string, TInput extends ReadonlyJSONValue | undefined, TOutput extends ReadonlyJSONValue | undefined, TReturn = PullRow<TTable, TSchema>, TContext = DefaultContext>(query: QueryOrQueryRequest<TTable, TInput, TOutput, TSchema, TReturn, TContext>, runOptions?: RunOptions | undefined): Promise<HumanReadable<TReturn>>;
    materialize<TTable extends keyof TSchema['tables'] & string, TInput extends ReadonlyJSONValue | undefined, TOutput extends ReadonlyJSONValue | undefined, TReturn = PullRow<TTable, TSchema>, TContext = DefaultContext>(query: QueryOrQueryRequest<TTable, TInput, TOutput, TSchema, TReturn, TContext>): TypedView<HumanReadable<TReturn>>;
    /**
     * @deprecated Use direct accessors or methods instead. ie z.query, z.mutate, z.build
     */
    get current(): Zero<TSchema, MD>;
    build(z_options: ZeroOptions<TSchema, MD>): void;
    close(): void;
}
