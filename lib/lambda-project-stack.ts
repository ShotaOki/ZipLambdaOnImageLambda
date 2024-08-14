import * as cdk from "aws-cdk-lib";
import { Repository } from "aws-cdk-lib/aws-ecr";
import { Code, Runtime, Function, Handler } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import {
  RuntimeDefines,
  DynamicRuntime,
} from "./lambda-execute-on-docker-lambda-stack";

// もう一つのスタックから参照するパラメータを定義する
interface LambdaProjectStackProps extends cdk.StackProps {
  runtime: Record<RuntimeDefines, DynamicRuntime>;
}

// ランタイムを読み込む
function readRuntime(
  runtime: Record<RuntimeDefines, DynamicRuntime>,
  runtimeName: RuntimeDefines
) {
  return (
    runtime[runtimeName] ?? {
      repositoryName: "",
      imageTag: "",
    }
  );
}

export class LambdaProjectStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: LambdaProjectStackProps) {
    super(scope, id, props);

    // もう一つのスタックで定義したECRの情報を参照する
    const python312Runtime = readRuntime(
      props.runtime,
      "python-3-12-custom-runtime"
    );

    const stack = cdk.Stack.of(this);

    // ECRのリポジトリを取得する
    const python312RuntimeRepository = Repository.fromRepositoryAttributes(
      this,
      "Python312RuntimeRepository",
      {
        repositoryName: python312Runtime.repositoryName,
        repositoryArn: `arn:aws:ecr:${stack.region}:${stack.account}:repository/${python312Runtime.repositoryName}`,
      }
    );

    // Lambdaの実行ロールを定義する
    const lambdaRole = new cdk.aws_iam.Role(this, "LambdaRole", {
      assumedBy: new cdk.aws_iam.ServicePrincipal("lambda.amazonaws.com"),
      managedPolicies: [
        // ログの出力など、基本的な権限を設定する
        cdk.aws_iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSLambdaBasicExecutionRole"
        ),
        // zipのLambdaの設定を参照するための権限を設定する
        cdk.aws_iam.ManagedPolicy.fromAwsManagedPolicyName(
          "AWSLambda_ReadOnlyAccess"
        ),
        // Lambdaのソースをダウンロードするための権限を設定する
        cdk.aws_iam.ManagedPolicy.fromAwsManagedPolicyName(
          "AmazonS3ReadOnlyAccess"
        ),
      ],
    });

    // Lambdaのソースを作成する
    // ソースを置いておくだけで、実行しない
    const dynamicZip = new Function(this, "ZipLambdaFunction", {
      code: Code.fromAsset(`${__dirname}/../lambda-function/zip-lambda`),
      handler: "app.handler",
      runtime: Runtime.PYTHON_3_12,
    });

    // Lambdaを作成する
    // このLambdaを通して、ZipLambdaにあるソースを実行する
    new Function(this, "DockerLambdaFunction", {
      // LambdaのイメージをECRの共通イメージから参照する
      code: Code.fromEcrImage(python312RuntimeRepository, {
        cmd: ["app.lambda_handler"],
        tag: python312Runtime.imageTag,
      }),
      // ランタイムを指定する
      runtime: Runtime.FROM_IMAGE,
      handler: Handler.FROM_IMAGE,
      // タイムアウトを指定する
      timeout: cdk.Duration.seconds(30),
      // ロールを指定する
      role: lambdaRole,
      // 環境変数を設定する
      environment: {
        // Lambdaの関数名、バージョンを指定する
        LAMBDA_FUNCTION_NAME: dynamicZip.functionName,
        LAMBDA_FUNCTION_QUALIFIER: "$LATEST",
        // Lambdaのassetのディレクトリ名を指定する
        // 指定しておくと、Lambdaの関数内で、
        // from ${アセットのディレクトリ名}.app import handler
        // で、ライブラリをimportできる
        LAMBDA_FUNCTION_ROOT: "zip-lambda",
      },
    });
  }
}
