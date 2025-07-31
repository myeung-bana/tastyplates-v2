export const emailExistCode = "email_exists"

export const sessionStatus = {
    authenticated: "authenticated",
    loading: "loading",
    unauthenticated: "unauthenticated",
}

export const sessionProvider = {
    google: "google",
    credentials: "credentials",
}

export const sessionType = {
    login: "login",
    signup: "signup",
}

export const responseStatusCode = {
    success: 200,
    created: 201,
    noContent: 204,
    badRequest: 400,
    unauthorized: 401,
    forbidden: 403,
    notFound: 404,
    conflict: 409,
    duplicate_week: 422,
    internalServerError: 500,
}

export const responseStatus = {
    success: "success",
    error: "error",
    loading: "loading",
    notFound: "not_found",
    unauthorized: "unauthorized",
    forbidden: "forbidden",
    conflict: "conflict",
    internalServerError: "internal_server_error",
}

export const FIREBASE_ERRORS = {
    CANCELLED_POPUP_REQUEST: "auth/cancelled-popup-request",
    USER_DISABLED: "auth/user-disabled",
};