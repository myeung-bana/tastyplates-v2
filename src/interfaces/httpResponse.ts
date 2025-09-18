export interface HttpResponse<T = unknown> {
    status: boolean;
    message: string;
    code?: string | number;
    data?: T;
}
