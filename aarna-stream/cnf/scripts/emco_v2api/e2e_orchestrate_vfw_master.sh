#!/bin/bash

echo "-- Setting script parameters"
#middleend_port="30481"
middleend_port=$2
#orch_port="30415"
orch_port=$3
#clm_port="30461"
clm_port=$4
#dcm_port="30477"
dcm_port=$5
k8_config="k8_config"
provider_name="provider-1"
cluster_name="clu-48"
project_name="TEST"
comp_appname="vFW1"
dig_name="vfw1_14"

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

curl -vv -F 'metadata=<./clu_master.json;type=application/json' -F file=@~/.kube/config -X POST http://$vm_ip:$middleend_port/middleend/cluster-providers/$provider_name/clusters

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

curl -vv -i -F 'servicePayload=<tt_master.json;type=application/json' -F file=@~/aarna-stream/cnf/vfw_helm/sink.tgz -F file1=@~/aarna-stream/cnf/vfw_helm/packetgen.tgz -F file2=@~/aarna-stream/cnf/vfw_helm/firewall.tgz -F file3=@~/aarna-stream/cnf/payload/profile.tar.gz -X POST http://$vm_ip:$middleend_port/middleend/projects/$project_name/composite-apps

echo "-- Done Creating a composite app"

echo "-- Verifying composite app created"

#curl -v -X GET http://$vm_ip:$middleend_port/middleend/projects/$project_name/composite-apps | jq
curl -v -X GET http://$vm_ip:$middleend_port/middleend/projects/$project_name/composite-apps

#curl -v -X GET http://$vm_ip:$middleend_port/middleend/projects/$project_name/composite-apps?filter=depthAll | jq
curl -v -X GET http://$vm_ip:$middleend_port/middleend/projects/$project_name/composite-apps?filter=depthAll

echo "-- Done verifying composite app created"

echo "-- Creating Logical Cloud"

curl -vv -i -d@./lc_master.json -X POST http://$vm_ip:$middleend_port/middleend/projects/$project_name/logical-clouds

echo "-- Done Creating Logical Cloud"

echo "-- Verifying Logical Cloud"

#curl -v -X GET http://$vm_ip:$dcm_port/v2/projects/$project_name/logical-clouds | jq
curl -v -X GET http://$vm_ip:$dcm_port/v2/projects/$project_name/logical-clouds

echo "-- Done verifying Logical Cloud"

echo "-- Creating DIG"

curl -vv -i -d@./dig_master.json -X POST http://$vm_ip:$middleend_port/middleend/projects/$project_name/composite-apps/$comp_appname/v1/deployment-intent-groups
#curl -vv -i -d@./dig.json -X POST http://$vm_ip:$middleend_port/middleend/projects/TEST/composite-apps/vFW1/v1/deployment-intent-groups

echo "-- Done Creating DIG"

echo "-- Verifying created DIG"

#curl -vv GET http://$vm_ip:$middleend_port/middleend/projects/$project_name/composite-apps/$comp_appname/v1/deployment-intent-groups/$dig_name | jq
curl -vv GET http://$vm_ip:$middleend_port/middleend/projects/$project_name/composite-apps/$comp_appname/v1/deployment-intent-groups/$dig_name

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
