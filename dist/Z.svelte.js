import { Zero } from '@rocicorp/zero';
import { addContextToQuery, asQueryInternals } from '@rocicorp/zero/bindings';
import { untrack } from 'svelte';
import { createSubscriber, SvelteMap } from 'svelte/reactivity';
import { Query } from './query.svelte.js';
export class ViewStore {
    #views = new SvelteMap();
    getView(z, query, enabled = true) {
        if (!enabled) {
            return new ViewWrapper(z, query, () => { }, () => { }, false);
        }
        const hash = asQueryInternals(query).hash();
        // Use untrack to prevent state mutations from being tracked during $derived
        return untrack(() => {
            let existing = this.#views.get(hash);
            if (!existing) {
                existing = new ViewWrapper(z, query, (view) => {
                    const lastView = this.#views.get(hash);
                    if (lastView && lastView !== view) {
                        throw new Error('View already exists');
                    }
                    this.#views.set(hash, view);
                }, () => this.#views.delete(hash), true);
                this.#views.set(hash, existing);
            }
            return existing;
        });
    }
}
export class ViewWrapper {
    z;
    query;
    onMaterialized;
    onDematerialized;
    enabled;
    #view;
    #data = $state({ '': undefined });
    #status = $state({ type: 'unknown' });
    #subscribe;
    #refCountMap = new WeakMap();
    constructor(z, query, onMaterialized, onDematerialized, enabled) {
        this.z = z;
        this.query = query;
        this.onMaterialized = onMaterialized;
        this.onDematerialized = onDematerialized;
        this.enabled = enabled;
        // Initialize the data based on format
        const internals = asQueryInternals(this.query);
        this.#data = { '': internals.format.singular ? undefined : [] };
        // Create a subscriber that manages view life-cycle
        this.#subscribe = createSubscriber((notify) => {
            this.#materializeIfNeeded();
            let removeListener;
            if (this.#view) {
                // Listen for updates from the underlying TypedView and notify Svelte
                removeListener = this.#view.addListener((snap, resultType) => {
                    this.#onData(snap, resultType);
                    notify();
                });
            }
            // Return cleanup function that will only be called
            // when all effects are destroyed
            return () => {
                removeListener?.();
                this.#view?.destroy();
                this.#view = undefined;
                this.onDematerialized();
            };
        });
    }
    #onData = (snap, resultType
    // update: () => void // not used??
    ) => {
        // Clear old references
        this.#refCountMap.delete(this.#data);
        // Update data and track new references; snapshots from Zero are immutable
        this.#data = { '': snap };
        this.#refCountMap.set(this.#data, 1);
        this.#status = { type: resultType };
    };
    #materializeIfNeeded() {
        if (!this.enabled)
            return;
        if (!this.#view) {
            this.#view = this.z.materialize(this.query);
            this.onMaterialized(this);
        }
    }
    // Used in Svelte components and Query class
    get current() {
        // This triggers the subscription tracking
        this.#subscribe();
        const data = this.#data[''];
        return [data, this.#status];
    }
    // Access data without triggering subscription (reads $state only)
    get dataOnly() {
        return this.#data[''];
    }
    get detailsOnly() {
        return this.#status;
    }
    // Manually ensure subscription is active
    ensureSubscribed() {
        this.#subscribe();
    }
}
// This is the state of the Zero instance
// You can reset it on login or logout
export class Z {
    #zero = $state(null);
    #connectionState = $state({ name: 'connecting' });
    #connectionUnsubscribe;
    #viewStore = new ViewStore();
    constructor(z_options) {
        this.build(z_options);
    }
    // Reactive getter that proxy to internal Zero instance
    get query() {
        return this.#zero.query;
    }
    get mutate() {
        return this.#zero.mutate;
    }
    get mutateBatch() {
        return this.#zero.mutateBatch;
    }
    get clientID() {
        return this.#zero.clientID;
    }
    get userID() {
        return this.#zero.userID;
    }
    // Add getter
    get context() {
        return this.#zero.context;
    }
    /**
     * @deprecated Use `connectionState` instead for richer connection status information.
     */
    get online() {
        return this.#connectionState.name === 'connected';
    }
    /**
     * The current connection state. One of:
     * - `connecting`: Actively trying to connect
     * - `connected`: Successfully connected to the server
     * - `disconnected`: Offline, will retry automatically
     * - `needs-auth`: Authentication required, call `connection.connect()` with auth
     * - `error`: Fatal error, call `connection.connect()` to retry
     * - `closed`: Instance was closed, create a new Zero instance
     */
    get connectionState() {
        return this.#connectionState;
    }
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
    get connection() {
        return this.#zero.connection;
    }
    get viewStore() {
        return this.#viewStore;
    }
    createQuery(query, enabled = true) {
        const resolved = addContextToQuery(query, this.context);
        return new Query(resolved, this, enabled);
    }
    // // Fix createQuery
    // createQuery(query, enabled = true) {
    //     const resolved = addContextToQuery(query, this.context);  // use this.context
    //     return new Query(resolved, this, enabled);
    // }
    // Alias for createQuery - shorter syntax
    q(query, enabled = true) {
        return this.createQuery(query, enabled);
    }
    preload(query, options) {
        const resolved = addContextToQuery(query, this.context);
        return this.#zero.preload(resolved, options);
    }
    run(query, runOptions) {
        const resolved = addContextToQuery(query, this.context);
        return this.#zero.run(resolved, runOptions);
    }
    materialize(query) {
        const resolved = addContextToQuery(query, this.context);
        return this.#zero.materialize(resolved);
    }
    /**
     * @deprecated Use direct accessors or methods instead. ie z.query, z.mutate, z.build
     */
    get current() {
        return this.#zero;
    }
    build(z_options) {
        // Clean up previous subscription if it exists
        this.#connectionUnsubscribe?.();
        // Create new Zero instance
        this.#zero = new Zero(z_options);
        // Subscribe to connection state changes
        this.#connectionUnsubscribe = this.#zero.connection.state.subscribe((state) => {
            this.#connectionState = state;
        });
        // Initialize connection state
        this.#connectionState = this.#zero.connection.state.current;
    }
    close() {
        this.#connectionUnsubscribe?.();
        this.#zero.close();
    }
}
