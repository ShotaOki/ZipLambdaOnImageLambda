# Docker Lambda で Zip Lambda を動かすサンプル

## 環境構築

- Docker が利用できる環境
- Node.js が利用できる環境
- CDK が利用できる環境

## デプロイ

DockerImage をデプロイする  
※Docker がインストールされた環境で実行してください

```
cdk deploy LambdaExecuteOnDockerLambda
```

Docker Lambda をデプロイする  
※Docker がインストールされていない環境（例：Windows）で実行して大丈夫です

```
cdk deploy LambdaProjectStack
```

※できるだけ分けてデプロイしてください。cdk deploy --all でもデプロイできますが、大きなイメージをデプロイしようとすると、デプロイの完了前に Docker Lambda をデプロイしようとして失敗することがあります
