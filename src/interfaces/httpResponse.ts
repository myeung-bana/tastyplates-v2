export interface HttpResponse<T = any> {
    status: boolean;
    message: string;
    code?: any;
    data?: T;
}
