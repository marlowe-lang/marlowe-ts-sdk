import { AxiosInstance, AxiosResponse, AxiosRequestConfig, isAxiosError, AxiosResponseHeaders, RawAxiosResponseHeaders } from "axios";
import { Either, left, match, right } from "fp-ts/lib/Either.js";
import { Errors } from "io-ts";

export type HTTPError = {
  type: 'http';
  status: number;
  statusText: string;
  body: string;
};

export type NetworkError = {
  type: 'network';
  message: string;
};

export type DecodingError<T = unknown> = {
  type: 'decoding';
  errors: Errors;
  response: T;  // The raw response of the specific endpoint
};

/* On the HTTP client level we handle three types of "standard" errors (other errors are re-thrown):
 * - HTTPError: when the server responds with a status code that is not in the 2xx range
 * - NetworkError: when the request fails due to a network error
 * - DecodingError: when the response body cannot be decoded by the provided decoder
 */

export type APIResponse<EndpointError, EndpointResponse> = Either<EndpointError | NetworkError | DecodingError<unknown>, EndpointResponse>;


// This is what is in AxiosResponse headers
export type HTTPResponseHeaders = RawAxiosResponseHeaders | AxiosResponseHeaders;
/* Given:
 * - a function to decode the response body
 * - a function which turns HTTP errors into endpoint errors (should we care about 4xx only here?)
 * - handle the response building either a DecodingError or custom Error
 *
 * Build an axios respose handler.
 */
export const mkHTTPResponseHandler = <EndpointError, Response>(
  decode: (body: any, headers: HTTPResponseHeaders) => Either<Errors, Response>,
  handleHTTPError: (error: HTTPError) => EndpointError
) => async (
  axiosResponse: Promise<AxiosResponse>
) : Promise<APIResponse<EndpointError, Response>> => {
  return await axiosResponse.then((httpResponse: AxiosResponse) => {
    const validation = decode(httpResponse.data, httpResponse.headers);
    return match(
      (errors: Errors) => left({
        type: 'decoding',
        errors,
        response: httpResponse.data
      } as DecodingError),
      (response: Response) => right(response)
    )(validation);
  }).catch((error) => {
    if(isAxiosError(error)) {
      if(error.response) {
        const response = error.response;
        return left(handleHTTPError({
          type: 'http',
          status: response.status,
          statusText: response.statusText,
          body: response.data,
        }));
      }
      return left({
        type: 'network',
        message: error.message
      });
    }
    throw error;
  });
}

export type HTTPClient = {
  get: <EndpointError, Response>(
    url: string,
    config: AxiosRequestConfig,
    decode: (body: any) => Either<Errors, Response>,
    handleHTTPError: (error: HTTPError) => EndpointError
  ) => Promise<APIResponse<EndpointError, Response>>;
  getAny: (
    url: string,
    config: AxiosRequestConfig
  ) => Promise<APIResponse<HTTPError, any>>;
  post: <EndpointError, Response>(
    url: string,
    data: any,
    config: AxiosRequestConfig,
    decode: (body: any) => Either<Errors, Response>,
    handleHTTPError: (error: HTTPError) => EndpointError
  ) => Promise<APIResponse<EndpointError, Response>>;
  postAny: (
    url: string,
    data: any,
    config: AxiosRequestConfig
  ) => Promise<APIResponse<HTTPError, any>>;
  put: <EndpointError, Response>(
    url: string,
    data: any,
    config: AxiosRequestConfig,
    decode: (body: any) => Either<Errors, Response>,
    handleHTTPError: (error: HTTPError) => EndpointError
  ) => Promise<APIResponse<EndpointError, Response>>;
  putAny: (
    url: string,
    data: any,
    config: AxiosRequestConfig
  ) => Promise<APIResponse<HTTPError, any>>;
};

export const mkHTTPClient = (axiosInstance: AxiosInstance): HTTPClient => {

  const addApiHeaders = (config: AxiosRequestConfig) => ({
    headers:
      { Accept: "application/json",
        "Content-Type": "application/json",
      },
    ...config
  });
  const get = async <EndpointError, Response>(
    url: string,
    config: AxiosRequestConfig,
    decode: (body: any) => Either<Errors, Response>,
    handleHTTPError: (error: HTTPError) => EndpointError
  ): Promise<APIResponse<EndpointError, Response>> => {
    return mkHTTPResponseHandler(
      decode,
      handleHTTPError
    )(axiosInstance.get(url, addApiHeaders(config)));
  };
  const post = async <EndpointError, Response>(
    url: string,
    data: any,
    config: AxiosRequestConfig,
    decode: (body: any) => Either<Errors, Response>,
    handleHTTPError: (error: HTTPError) => EndpointError
  ): Promise<APIResponse<EndpointError, Response>> => {
    return mkHTTPResponseHandler(
      decode,
      handleHTTPError
    )(axiosInstance.post(url, data, addApiHeaders(config)));
  }
  const put = async <EndpointError, Response>(
    url: string,
    data: any,
    config: AxiosRequestConfig,
    decode: (body: any) => Either<Errors, Response>,
    handleHTTPError: (error: HTTPError) => EndpointError
  ): Promise<APIResponse<EndpointError, Response>> => {
    return mkHTTPResponseHandler(
      decode,
      handleHTTPError
    )(axiosInstance.put(url, data, addApiHeaders(config)));
  }
  return {
    get,
    getAny: (url: string, config: AxiosRequestConfig) => get<HTTPError, any>(url, config, (body) => right(body), (error) => error),
    post,
    postAny: (url: string, data: any, config: AxiosRequestConfig) => post<HTTPError, any>(url, data, config, (body) => right(body), (error) => error),
    put,
    putAny: (url: string, data: any, config: AxiosRequestConfig) => put<HTTPError, any>(url, data, config, (body) => right(body), (error) => error),
  };
};
