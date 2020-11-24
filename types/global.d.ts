declare type Falsy = false | null | undefined | '' | 0;
declare type Maybe<X> = X extends Falsy ? never : X | Falsy;
declare type Some<X> = X extends Falsy ? never : X;
declare type DefinitelyHas<X extends {}, Keys> = X & { [k in keyof X & Keys]: Some<X[k]> };
