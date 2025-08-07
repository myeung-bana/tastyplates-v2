export interface HttpResponse<T = any> {
    status: boolean;
    message: string;
    data?: T;
}
