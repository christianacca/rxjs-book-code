var RxObsConstructor = (<any> Rx.Observable);   // this hack is neccessary because the .d.ts for RxJs declares Observable as an interface)

declare module "rx" {
    interface Observable<T> {
        combineActive<TResult>() : Rx.Observable<TResult[]>
    }
}

RxObsConstructor.prototype.combineActive = combineActive;

export function combineActive<T>() : Rx.Observable<T[]> {
  return Rx.Observable.create<T[]>(subscriber => {
    let currentValues: T[] = [],
        subs: Rx.IDisposable[] = [],
        source: Rx.Observable<Rx.Observable<T>> = this,
        isCompleted = false;
    
    function dispose() {
      subs.forEach(sub => {
        sub.dispose();
      });
      subs = [];
      currentValues = [];
    }    
    
    const outerSub = source.subscribe(inner$ => {
      // note: we're using a Subject to delay the registration to 'inner$' and in that way
      // generate a reliable index position for the 'innerSub'
      let subject = new Rx.Subject<T>();
      let innerSub = subject.subscribe(
        value => {
          const idx = subs.indexOf(innerSub);
          currentValues[idx] = value;
          subscriber.onNext(currentValues);
        },
        subscriber.onError.bind(subscriber),
        () => {
          const idx = subs.indexOf(innerSub);
          currentValues.splice(idx, 1);
          subs.splice(idx, 1);
          if (subs.length === 0 && isCompleted) {
            subscriber.onCompleted();
          }
        }
      );
      subs.push(innerSub);
      inner$.subscribe(subject);
    }, 
    subscriber.onError.bind(subscriber),
    () => {
      if (subs.length === 0) {
        subscriber.onCompleted();
        return;
      }
      isCompleted = true;
    });
    return new Rx.CompositeDisposable(Rx.Disposable.create(dispose), outerSub); 
  });
}