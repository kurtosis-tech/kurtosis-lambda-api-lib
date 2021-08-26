import { ServerUnaryCall, sendUnaryData, ServiceError, Metadata, status, handleCall, Server, ServiceDefinition, GoogleOAuth2Client } from "grpc";
import { NetworkContext } from "kurtosis-core-api-lib";
import { KnownKeysOnly } from "minimal-grpc-server";
import { ILambdaServiceServer } from "../../kurtosis_lambda_rpc_api_bindings/api_lambda_service_grpc_pb";
import { ExecuteArgs, ExecuteResponse } from "../../kurtosis_lambda_rpc_api_bindings/api_lambda_service_pb";
import { newExecuteResponse } from "../constructor_calls";
import { KurtosisLambda } from "../kurtosis_lambda/kurtosis_lambda";
import * as google_protobuf_empty_pb from "google-protobuf/google/protobuf/empty_pb";

// The KnownKeysOnly thing is a workaround due to a silly gRPC requirement that your service implement
//  UnimplementedServiceServer
export class KurtosisLambdaServiceServer implements KnownKeysOnly<ILambdaServiceServer> {
    private readonly kurtosisLambda: KurtosisLambda;
    private readonly networkCtx: NetworkContext;

    constructor(
        kurtosisLambda: KurtosisLambda,
        networkCtx: NetworkContext
    ) {
        this.kurtosisLambda = kurtosisLambda;
        this.networkCtx = networkCtx;
    }

    public isAvailable(call: ServerUnaryCall<google_protobuf_empty_pb.Empty>, callback: sendUnaryData<google_protobuf_empty_pb.Empty>): void {
        callback(null, new google_protobuf_empty_pb.Empty());
    }

    public execute(call: ServerUnaryCall<ExecuteArgs>, callback: sendUnaryData<ExecuteResponse>): void {
        const args: ExecuteArgs = call.request;
        this.kurtosisLambda.execute(
            this.networkCtx, 
            args.getParamsJson()
        ).then(executeResult => {
            if (executeResult.isErr()) {
                callback(executeResult.error, null);
                return;
            }

            const responseJson: string = executeResult.value;
            const executeResponse: ExecuteResponse = newExecuteResponse(responseJson);

            callback(null, executeResponse);
        })
    }
}
