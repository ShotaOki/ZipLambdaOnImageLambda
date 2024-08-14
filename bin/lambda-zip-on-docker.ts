#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { LambdaExecuteOnDockerLambda } from "../lib/lambda-execute-on-docker-lambda-stack";
import { LambdaProjectStack } from "../lib/lambda-project-stack";

const app = new cdk.App();
const baseStackName = "LambdaExecuteOnDockerLambda";
const baseStack = new LambdaExecuteOnDockerLambda(app, baseStackName, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

new LambdaProjectStack(app, "LambdaProjectStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  runtime: baseStack.runtime,
});
