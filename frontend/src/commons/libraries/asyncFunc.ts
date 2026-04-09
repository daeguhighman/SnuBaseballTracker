import { FormEvent } from "react";

export const wrapAsync =
  <E>(asyncFunc: (event: E) => Promise<void>) =>
  (event: E) => {
    asyncFunc(event);
  };

// wrapAsync함수는 원래 아래와 같이 생겼는데, changeEvent외에 다른 이벤트를 넣어주기 위해 위에 처럼 제네릭타입을 사용했다!
// export const wrapAsync =
//   (asyncFunc: (event: ChangeEvent<HTMLInputElement>) => Promise<void>) =>
//     (event: ChangeEvent<HTMLInputElement>) => {
//       asyncFunc(event);
//     };

// form에서만 쓰는 Async함수
export const wrapFormAsync =
  (asyncFunc: () => Promise<void>) => (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    asyncFunc();
  };
