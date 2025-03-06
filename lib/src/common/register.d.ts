export type Constructor<T> = {
    new (...args: any[]): T;
};
interface ClassDescriptor {
    kind: 'class';
    elements: ClassElement[];
    finisher?: <T>(clazz: Constructor<T>) => undefined | Constructor<T>;
}
interface ClassElement {
    kind: 'field' | 'method';
    key: PropertyKey;
    placement: 'static' | 'prototype' | 'own';
    initializer?: Function;
    extras?: ClassElement[];
    finisher?: <T>(clazz: Constructor<T>) => undefined | Constructor<T>;
    descriptor?: PropertyDescriptor;
}
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
export declare const registerCustomElement: (tagName: string) => (classOrDescriptor: Constructor<HTMLElement> | ClassDescriptor) => any;
export {};
