/** @import ReactiveComponent from "@Piglet/browser/classes/ReactiveComponent" */
/** @import AppRoot from "@Piglet/browser/classes/AppRoot" */

/**
 * @typedef {(obj: object, pathParts: string[]) => any} GetDeepValue
 * Retrieves a deep value from an object using a path (array of keys).
 */

/**
 * @typedef {(str: string) => string} ToPascalCase
 * Converts a string to PascalCase format.
 */

/**
 * @typedef {(path: string, fetchOptions?: RequestInit, expect?: 'json' | 'text' | 'blob' | 'arrayBuffer' | 'formData' | 'raw') => Promise<any>} Api
 * Makes an API request and returns a promise resolving to the response data.
 */

/**
 * @typedef {{
 *     condition: boolean, // The condition for navigation to succeed
 *     fallback?: string, // Optional fallback route if navigation fails, defaults to '/',
 * }} NavigateOptions
 */

/**
 * @typedef {(route: string, options?: NavigateOptions) => boolean} Navigate
 * Navigates to a given route.
 */

/**
 * @typedef {(str: string) => string} ToKebabCase
 * Converts a string to kebab-case format.
 */

/**
 * @typedef {(tagName: string, root: AppRoot) => Array<ReactiveComponent>} GetMountedComponentsByTag
 * Gets all mounted ReactiveComponent instances for a specific tag name.
 */

/**
 * @typedef {(requestType: string, root: AppRoot) => void} SendToExtension
 * Sends a request to the extension (e.g., for communication or data).
 */

/**
 * @typedef {(_class: typeof ReactiveComponent) => Promise<CustomElementConstructor>} LoadComponent
 * Loads a component from a given path.
 */

/**
 * @typedef {(url: string, root: AppRoot) => Promise<string>} FetchWithCache
 * Fetch a resource with a cache.
 */

export /** @exports GetDeepValue */
/** @exports ToPascalCase */
/** @exports Api */
/** @exports Navigate */
/** @exports ToKebabCase */
/** @exports GetMountedComponentsByTag */
/** @exports SendToExtension */
/** @exports LoadComponent */
/** @exports FetchWithCache */ {};
