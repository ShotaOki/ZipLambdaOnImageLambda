#!/bin/bash

cd ${ENTRYPOINT_HOME}

GET_FUNCTION_SERVICE_NAME="lambda"
SOURCE_ZIP_FILE="/tmp/source.zip"
TEMPORARY_GET_FUNCTION_JSON="/tmp/temporary-get-function.json"

jq_command='import json;
import argparse;
import urllib.request;

parser = argparse.ArgumentParser();
parser.add_argument("path", type=str);
parser.add_argument("--query", type=str);
parser.add_argument("--output", type=str, default="");
args = parser.parse_args();

with open(args.path, "r") as f:
    data = json.loads(f.read());

query_list = args.query.split(".");
for q in query_list:
    data = data[q];

with urllib.request.urlopen(data) as response:
    body = response.read();
    if len(args.output) >= 1:
        with open(args.output, "wb") as f:
            f.write(body);

print(json.dumps(data));'

curl "https://${GET_FUNCTION_SERVICE_NAME}.${AWS_REGION}.amazonaws.com/2015-03-31/functions/${LAMBDA_FUNCTION_NAME}?Qualifier=${LAMBDA_FUNCTION_QUALIFIER}" \
  -H "X-Amz-Security-Token: ${AWS_SESSION_TOKEN}" \
  --aws-sigv4 "aws:amz:${AWS_REGION}:${GET_FUNCTION_SERVICE_NAME}" \
  --user "${AWS_ACCESS_KEY_ID}:${AWS_SECRET_ACCESS_KEY}" > ${TEMPORARY_GET_FUNCTION_JSON}

CODE_LOCATION=`${ENTRYPOINT_BIN_PYTHON} -c "${jq_command}" ${TEMPORARY_GET_FUNCTION_JSON} --query Code.Location --output ${SOURCE_ZIP_FILE}`

${ENTRYPOINT_BIN_PYTHON} -m zipfile --extract ${SOURCE_ZIP_FILE} /tmp/var/task/${LAMBDA_FUNCTION_ROOT}

cd /tmp/var/task/${LAMBDA_FUNCTION_ROOT}

export PYTHONPATH="${EXTRA_PYTHON_PATH}:${PYTHONPATH}"

if [ -z "${AWS_LAMBDA_RUNTIME_API}" ]; then
  exec ${ENTRYPOINT_AWS_LAMBDA_RIE} ${ENTRYPOINT_BIN_PYTHON} -m awslambdaric $@
else
  exec ${ENTRYPOINT_BIN_PYTHON} -m awslambdaric $@
fi
