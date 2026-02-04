import { addContextToQuery, asQueryInternals } from '@rocicorp/zero/bindings';
export class Query {
    #query_impl;
    #z;
    #view = $state();
    #cleanup;
    constructor(query, z, enabled = true) {
        this.#z = z;
        this.#query_impl = query;
        this.#view = this.#z.viewStore.getView(this.#z, this.#query_impl, enabled);
        // Create a persistent effect that keeps the ViewWrapper subscription alive
        // This effect reads view.current which activates the subscription
        this.#cleanup = $effect.root(() => {
            $effect(() => {
                // Reading current activates and maintains the subscription
                void this.#view?.current;
            });
        });
    }
    get data() {
        const view = this.#view; // Read $state (tracks dependency on view changes)
        if (!view) {
            // Return default based on query format
            const internals = asQueryInternals(this.#query_impl);
            return (internals.format.singular ? undefined : []);
        }
        // Read state without re-triggering subscription (already activated in constructor)
        return view.dataOnly;
    }
    get details() {
        const view = this.#view; // Read $state (tracks dependency on view changes)
        if (!view) {
            return { type: 'unknown' };
        }
        // Read state without re-triggering subscription (already activated in constructor)
        return view.detailsOnly;
    }
    // Keep for backwards compatibility
    get view() {
        return this.#view;
    }
    // Deprecated accessor for backwards compatibility
    /** @deprecated Use .data instead */
    get current() {
        return this.data;
    }
    // Method to update the query - accepts both Query and QueryRequest
    updateQuery(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    newQuery, enabled = true) {
        this.#query_impl = addContextToQuery(newQuery, this.#z.context);
        this.#view = this.#z.viewStore.getView(this.#z, this.#query_impl, enabled);
        // Setting #view (a $state) will trigger reactivity in components reading .data/.details
    }
    // Cleanup method to destroy the persistent effect
    destroy() {
        this.#cleanup?.();
    }
}
