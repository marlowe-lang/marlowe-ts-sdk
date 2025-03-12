import * as E from "fp-ts/lib/Either.js";
import * as t from "io-ts/lib/index.js";

import {
  TextEnvelope,
} from "@marlowe.io/runtime-core";

import { type ContractDetails, ContractDetailsGuard } from "../details.js";
import { ContractId } from "@marlowe.io/runtime-core";
import { right } from "fp-ts/lib/Either.js";
import { APIResponse, HTTPClient, HTTPError } from "../../apiResponse.js";

type GetContractByIdPayload = t.TypeOf<typeof GetContractByIdPayload>;
const GetContractByIdPayload = t.type({
  links: t.type({}),
  resource: ContractDetailsGuard,
});

/**
 * @see {@link https://docs.marlowe.iohk.io/api/get-contract-by-id}
 */
export const getContractById = async (
  httpClient: HTTPClient,
  contractId: ContractId
): Promise<APIResponse<HTTPError, ContractDetails>> => {
  return httpClient.get(
    contractEndpoint(contractId),
    {},
    (body) => E.map((r:GetContractByIdPayload) => r.resource)(GetContractByIdPayload.decode(body)),
    (error) => error,
  );
};

export type InvalidTextEnvelope = {
  type: 'invalidTextEnvelope';
  body: string;
  envelope: TextEnvelope;
};

export type UnexpectedError = {
  type: 'unexpectedError';
  body: string;
  status: number;
};

export const submitContract = async (
  httpClient: HTTPClient,
  contractId: ContractId,
  envelope: TextEnvelope
): Promise<APIResponse<InvalidTextEnvelope|UnexpectedError, null>> => {
  return await httpClient.put(
    contractEndpoint(contractId),
    envelope,
    {},
    (_: any) => right(null),
    (error) => {
      if (error.status === 400) {
        return {
          type: 'invalidTextEnvelope',
          body: error.body,
          envelope: envelope,
        };
      };
      return {
        type: 'unexpectedError',
        body: error.body,
        status: error.status,
      };
    }
  );
};

const contractEndpoint = (contractId: ContractId): string => `/contracts/${encodeURIComponent(contractId)}`;
