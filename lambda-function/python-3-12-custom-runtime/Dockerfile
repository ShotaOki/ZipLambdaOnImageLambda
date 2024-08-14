FROM public.ecr.aws/lambda/python:3.12

COPY entrypoint.sh requirements.txt ./

RUN python3.12 -m pip install -r requirements.txt -t .

WORKDIR /tmp/var/task/
WORKDIR /var/task/

env ENTRYPOINT_HOME=/var/task
env ENTRYPOINT_BIN_PYTHON=/var/lang/bin/python3.12
env ENTRYPOINT_AWS_LAMBDA_RIE=/usr/local/bin/aws-lambda-rie
env EXTRA_PYTHON_PATH=/var/task:/tmp/var/task

ENTRYPOINT [ "/bin/bash", "/var/task/entrypoint.sh" ]
CMD [ "app.lambda_handler" ]
