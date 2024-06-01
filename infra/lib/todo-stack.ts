import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import * as assets from "aws-cdk-lib/aws-s3-assets";
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";
import path = require("path");

export class TodoStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // provided directory is archived as a .zip file and uploaded to S3 during deployment
    const myLambdaAsset = new assets.Asset(this, "HelloGoServerLambdaFnZip", {
      path: path.join(__dirname, "../../backend/build"),
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
      reservedConcurrentExecutions: 10, // this lambda function can only be executed a maximum of 10 at a time
    });

    const api = new apigw.LambdaRestApi(this, "Endpoint", {
      handler: lambdaFn,
    });

    api.addUsagePlan("UsagePlan", {
      name: "Basic",
      throttle: {
        rateLimit: 10, // max requests a user can make per second
        burstLimit: 20, // max concurrent requests at a given time
      },
    });

    new cloudwatch.Alarm(this, "HighLambdaInvocations", {
      metric: lambdaFn.metric("Invocations"),
      threshold: 1000,
      evaluationPeriods: 1,
      alarmDescription: "Alarm when invocations exceeds 1000",
    });

    const table = new dynamodb.TableV2(this, "MyTable", {
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
      billing: dynamodb.Billing.onDemand(),
    });

    new cloudwatch.Alarm(this, "HighReadCapacityUsage", {
      metric: table.metric("ConsumedReadCapacityUnits"),
      threshold: 100,
      evaluationPeriods: 1,
      datapointsToAlarm: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      alarmDescription:
        "Alarm when consumed read capacity units exceeds 100 units",
    });

    new cloudwatch.Alarm(this, "HighWriteCapacityUsage", {
      metric: table.metric("ConsumedWriteCapacityUnits"),
      threshold: 100,
      evaluationPeriods: 1,
      datapointsToAlarm: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      alarmDescription:
        "Alarm when consumed write capacity units exceeds 100 units",
    });
  }
}
