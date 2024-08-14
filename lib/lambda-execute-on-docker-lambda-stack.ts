import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { createHash } from "crypto";
import { readFileSync } from "fs";

export type RuntimeDefines = "python-3-12-custom-runtime";

export interface DynamicRuntime {
  repositoryName: string;
  imageTag: string;
}

export class LambdaExecuteOnDockerLambda extends cdk.Stack {
  readonly runtime: Record<RuntimeDefines, DynamicRuntime>;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const stack = cdk.Stack.of(this);

    // Dockerに関係するソースのハッシュを計算する
    const directoryName = `${__dirname}/../lambda-function/python-3-12-custom-runtime`;
    const hash = createHash("sha256");
    hash.update(readFileSync(`${directoryName}/Dockerfile`));
    hash.update(readFileSync(`${directoryName}/entrypoint.sh`));
    hash.update(readFileSync(`${directoryName}/requirements.txt`));

    // Dockerイメージを作成する
    const dockerLocation = this.synthesizer.addDockerImageAsset({
      directoryName: directoryName,
      sourceHash: `${stack.stackName}-${hash.digest("hex")}`,
    });

    // 別のスタックから参照できるよう、メンバ変数を通して公開する
    // ※Importとは違って、CDK deployの実行時にハッシュが再計算される
    // もしハッシュが変わるような編集をしたのなら、cdk deploy --allで再デプロイする
    this.runtime = {
      "python-3-12-custom-runtime": {
        repositoryName: dockerLocation.repositoryName,
        imageTag: dockerLocation.imageTag ?? "latest",
      },
    };
  }
}
