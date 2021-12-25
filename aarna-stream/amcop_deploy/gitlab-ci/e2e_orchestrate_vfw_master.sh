#!/bin/bash

echo "-- Setting script parameters"
middleend_port="30481"
#orch_port="31298"
orch_port="30415"
#clm_port="31856"
clm_port="30461"
dcm_port="30477"
k8_config="k8_config"
provider_name="provider5"
cluster_name="clu5"
project_name="vFW5"
comp_appname="vFWapp5"
dig_name="vFW_dig5"

vm_ip=${1}

echo "-- Running middleend health check"
curl -X GET http://$vm_ip:$middleend_port/middleend/healthcheck -v
echo "-- Done running middleend health check"

echo "-- Creating cluster provider"

curl -v -d'{
  "metadata": {
    "name": "'${provider_name}'",
    "description": "description of '${provider_name}'",
    "userData1": "'${provider_name}' user data 1",
    "userData2": "'${provider_name}' user data 2"
  }
}' -X POST http://$vm_ip:$clm_port/v2/cluster-providers

echo "--Done creating cluster provider"

echo "-- Onboarding cluster"

curl -vv -F 'metadata=<./clu_master.json;type=application/json' -F file=@./k8_config -X POST http://$vm_ip:$middleend_port/middleend/cluster-providers/$provider_name/clusters

echo "-- Done onboarding cluster"

echo "-- Creating project"

curl -v -d'{
  "metadata": {
    "name": "'${project_name}'",
    "description": "description of '${project_name}' controller",
    "userData1": "'${project_name}' user data 1",
    "userData2": "'${project_name}' user data 2"
  }
}' -X POST http://$vm_ip:$orch_port/v2/projects

echo "-- Done creating project"


echo "-- Creating a composite app"

curl -vv -i -F 'servicePayload=<tt_master.json;type=application/json' -F file=@./sink.tgz -F file1=@./packetgen.tgz -F file2=@./firewall.tgz -F file3=@./profile.tar.gz -X POST http://$vm_ip:$middleend_port/middleend/projects/$project_name/composite-apps

echo "-- Done Creating a composite app"

echo "-- Verifying composite app created"

curl -v -X GET http://$vm_ip:$middleend_port/middleend/projects/$project_name/composite-apps | jq

curl -v -X GET http://$vm_ip:$middleend_port/middleend/projects/$project_name/composite-apps?filter=depthAll | jq

echo "-- Done verifying composite app created"

echo "-- Creating Logical Cloud"

curl -vv -i -d@./lc_master.json -X POST http://$vm_ip:$middleend_port/middleend/projects/$project_name/logical-clouds

echo "-- Done Creating Logical Cloud"

echo "-- Verifying Logical Cloud"

curl -v -X GET http://$vm_ip:$dcm_port/v2/projects/$project_name/logical-clouds | jq

echo "-- Done verifying Logical Cloud"

echo "-- Creating DIG"

curl -vv -i -d@./dig_master.json -X POST http://$vm_ip:$middleend_port/middleend/projects/$project_name/composite-apps/$comp_appname/v1/deployment-intent-groups
#curl -vv -i -d@./dig.json -X POST http://$vm_ip:$middleend_port/middleend/projects/TEST/composite-apps/vFW1/v1/deployment-intent-groups

echo "-- Done Creating DIG"

echo "-- Verifying created DIG"

curl -vv GET http://$vm_ip:$middleend_port/middleend/projects/$project_name/composite-apps/$comp_appname/v1/deployment-intent-groups/$dig_name | jq
#curl -vv GET http://$vm_ip:$middleend_port/middleend/projects/TEST/composite-apps/vFW1/v1/deployment-intent-groups/vfw1_6 | jq

echo "-- Done Verifying created DIG"

echo "-- Approving DIG"

curl -vv -i -X POST http://$vm_ip:$orch_port/v2/projects/$project_name/composite-apps/$comp_appname/v1/deployment-intent-groups/$dig_name/approve
#curl -vv -i -X POST http://$vm_ip:$orch_port/v2/projects/TEST/composite-apps/vFW1/v1/deployment-intent-groups/vfw1_6/approve

echo "-- Done Approving DIG"

echo "-- Waiting for logical cloud to get instantiated"
sleep 20 

echo "-- Instantiate DIG"

curl -vv -i -X POST http://$vm_ip:$orch_port/v2/projects/$project_name/composite-apps/$comp_appname/v1/deployment-intent-groups/$dig_name/instantiate
#curl -vv -i -X POST http://$vm_ip:$orch_port/v2/projects/TEST/composite-apps/vFW1/v1/deployment-intent-groups/vfw1_6/instantiate

echo "-- Done Instantiating DIG"
