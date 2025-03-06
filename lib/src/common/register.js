/*
This was pulled AND MODIFIED from the URL below as
LitElements does not prevent the same element from
being registered more than once causing errors.
https://github.com/lit/lit-element/blob/master/src/lib/decorators.ts
*/
const legacyCustomElement = (tagName, clazz) => {
    if (typeof window !== 'undefined') {
        customElements?.get?.(tagName) || window?.customElements?.define?.(tagName, clazz);
    }
    // Cast as any because TS doesn't recognize the return type as being a
    // subtype of the decorated class when clazz is typed as
    // `Constructor<HTMLElement>` for some reason.
    // `Constructor<HTMLElement>` is helpful to make sure the decorator is
    // applied to elements however.
    // tslint:disable-next-line:no-any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return clazz;
};
const standardCustomElement = (tagName, descriptor) => {
    const { kind, elements } = descriptor;
    return {
        kind,
        elements,
        // This callback is called once the class is otherwise fully defined
        finisher(clazz) {
            if (typeof window !== 'undefined') {
                customElements?.get?.(tagName) || window?.customElements?.define?.(tagName, clazz);
            }
        },
    };
};
/**
 * Class decorator factory that defines the decorated class as a custom element.
 *
 * ```
 * @registerCustomElement('my-element')
 * class MyElement {
 *   render() {
 *     return html``;
 *   }
 * }
 * ```
 * @category Decorator
 * @param tagName The name of the custom element to define.
 */
export const registerCustomElement = (tagName) => (classOrDescriptor) => typeof classOrDescriptor === 'function'
    ? legacyCustomElement(tagName, classOrDescriptor)
    : standardCustomElement(tagName, classOrDescriptor);
//# sourceMappingURL=register.js.map