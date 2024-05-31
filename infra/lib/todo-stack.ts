import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import * as assets from "aws-cdk-lib/aws-s3-assets";
import { Construct } from "constructs";
import path = require("path");

export class TodoStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // provided directory is archived as a .zip file and uploaded to S3 during deployment
    const myLambdaAsset = new assets.Asset(this, "HelloGoServerLambdaFnZip", {
      path: path.join(__dirname, "../../backend"),
    });

    // uses the uploaded .zip file for the code
    const lambdaFn = new lambda.Function(this, "HelloHandler", {
      code: lambda.Code.fromBucket(
        myLambdaAsset.bucket,
        myLambdaAsset.s3ObjectKey
      ),
      timeout: cdk.Duration.seconds(300),
      runtime: lambda.Runtime.PROVIDED_AL2023,
      handler: "main", // the binary generated during the build step (not a part of the cdk script)
    });

    new apigw.LambdaRestApi(this, "Endpoint", {
      handler: lambdaFn,
    });
  }
}
