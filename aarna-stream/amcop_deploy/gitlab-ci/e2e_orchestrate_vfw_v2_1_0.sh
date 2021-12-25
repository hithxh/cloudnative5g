#!/bin/bash

echo "-- Setting script parameters"
middleend_port="30481"
orch_port="31298"
clm_port="31856"
k8_config="k8_config"

vm_ip=${1}

echo "-- Running middleend health check"
curl -X GET http://$1:$middleend_port/middleend/healthcheck -v
echo "-- Done running middleend health check"

echo "-- Creating cluster provider"

curl -v -d'{
  "metadata": {
    "name": "provider2",
    "description": "description of provider2",
    "userData1": "provider2 user data 1",
    "userData2": "provider2 user data 2"
  }
}' -X POST http://$1:$clm_port/v2/cluster-providers

echo "--Done creating cluster provider"

echo "-- Onboarding cluster"

curl -v -F 'metadata=<./clu_v2_1_0.json;type=application/json' -F file=@./k8_config -X POST http://$1:$middleend_port/middleend/clusterproviders/provider2/clusters

echo "-- Done onboarding cluster"

echo "-- Creating project"

curl -v -d'{
  "metadata": {
    "name": "vFWproject1",
    "description": "description of vFWproject1 controller",
    "userData1": "vFWproject1 user data 1",
    "userData2": "vFWproject1 user data 2"
  }
}' -X POST http://$1:$orch_port/v2/projects

echo "-- Done creating project"


echo "-- Creating a composite app"

curl -vv -i -F 'servicePayload=<tt_v2_1_0.json;type=application/json' -F file=@./sink.tgz -F file1=@./packetgen.tgz -F file3=@./profile.tar.gz -X POST http://$1:$middleend_port/middleend/projects/vFW1/composite-apps

echo "-- Done Creating a composite app"

echo "-- Verifying composite app created"

curl -v -X GET http://$1:$middleend_port/middleend/projects/vFW1/composite-apps | jq

curl -v -X GET http://$1:$middleend_port/middleend/projects/vFW1/composite-apps?filter=depthAll | jq

echo "-- Done verifying composite app created"

echo "-- Creating DIG"

curl -vv -i -d@./dig_v2_1_0.json -X POST http://$1:$middleend_port/middleend/projects/vFW1/composite-apps/vFW/v1/deployment-intent-groups

echo "-- Done Creating DIG"

echo "-- Verifying created DIG"

curl -vv GET http://$1:$middleend_port/middleend/projects/vFW1/composite-apps/vFW/v1/deployment-intent-groups/vFW_dig1 | jq

echo "-- Done Verifying created DIG"

echo "-- Approving DIG"

curl -vv -i -X POST http://$1:$orch_port/v2/projects/vFW1/composite-apps/vFW/v1/deployment-intent-groups/vFW_dig1/approve

echo "-- Done Approving DIG"

echo "-- Instantiate DIG"

curl -vv -i -X POST http://$1:$orch_port/v2/projects/vFW1/composite-apps/vFW/v1/deployment-intent-groups/vFW_dig1/instantiate

echo "-- Done Instantiating DIG"
