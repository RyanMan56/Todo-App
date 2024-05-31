import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import { Construct } from "constructs";

export class TodoStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const hello = new lambda.Function(this, "HelloHandler", {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset("lambda"), // ./lambda directory
      handler: "hello.handler", // file: hello, function: handler
    });

    new apigw.LambdaRestApi(this, "Endpoint", {
      handler: hello,
    });
  }
}
