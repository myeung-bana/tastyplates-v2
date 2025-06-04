// utils/removeAllCookies.ts
import Cookies from 'js-cookie';

export function removeAllCookies() {
    Object.keys(Cookies.get()).forEach((cookieName) => {
        Cookies.remove(cookieName);
    });
}
