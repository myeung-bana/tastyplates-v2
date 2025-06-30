// utils/removeAllCookies.ts
import Cookies from 'js-cookie';

export function removeAllCookies(cookieNames?: string[]) {
    const allCookies = Cookies.get();

    if (Array.isArray(cookieNames) && cookieNames.length > 0) {
        cookieNames.forEach((name) => {
            Cookies.remove(name);
        });
    } else {
        Object.keys(allCookies).forEach((name) => {
            Cookies.remove(name);
        });
    }
}
