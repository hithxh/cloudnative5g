#=======================================================================
# Copyright  ©  2017-2020 Aarna Networks, Inc.
# All rights reserved.
# ======================================================================
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#           http://www.apache.org/licenses/LICENSE-2.0
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
# ========================================================================
# Helm installation to bring up nrm-simulator-3gpp-mns pod 
cd ~/aarna-stream/cnf/cnfs-helm
make clean
make 

cd ~/aarna-stream/cnf/cnfs-helm/dist/packages/
helm  install nrm-simulator-3gpp-mns-0.1.0.tgz --name nrm-simulator-3gpp-mns  --namespace onap

# Exectue the booststrap scripts
cd ~/aarna-stream/cds-blueprints/k8s-utility-scripts
bash -x ./bootstrap-cds.sh

# Get the loaded blueprint models
bash -x ./get-cds-blueprint-models.sh

# Load the data dictionary to the Data base
cd ~/aarna-stream/cds-blueprints/k8s-utility-scripts
bash -x ./dd-microk8s.sh ~/aarna-stream/cds-blueprints/nrm-simulator-3gpp/Scripts/dd.json

# Zip the CBA for the Enrichment
cd ~/aarna-stream/cds-blueprints/nrm-simulator-3gpp
zip -r nrm-simulator-3gpp.zip *

# Going to Enrich nrm-simulator-3gpp.zip
cd ~/aarna-stream/cds-blueprints/k8s-utility-scripts
bash -x ./enrich-and-download-cds-blueprint.sh ~/aarna-stream/cds-blueprints/nrm-simulator-3gpp/nrm-simulator-3gpp.zip

#Save the Enrichment
cd ~/aarna-stream/cds-blueprints/k8s-utility-scripts
bash -x ./save-enriched-blueprint.sh /tmp/CBA/ENRICHED-CBA.zip
bash -x ./get-cds-blueprint-models.sh

# Check the log message 
cd ~/aarna-stream/cds-blueprints/k8s-utility-scripts/
bash -x ./tail-cds-bp-log.sh

# Edit the payload json 
cd ~/aarna-stream/cds-blueprints/nrm-simulator-3gpp/Scripts
cp add-nrm-rrmpolicy-config-deploy-payload.json.template /tmp/add-nrm-rrmpolicy-config-deploy-payload.json

# Get the netconf service port NET_CONF_PORT
kubectl get svc -n onap4k8s | grep nrm-simulator-3gpp-mns | awk  '{print $5}' | tr -d '/TCP' | awk -F ':' '{print $2}' 

# Edit PNF_IP_ADDRESS and NET_CONF_PORT
# NOTE: NET_CONF_PORT is integer
vi /tmp/add-nrm-rrmpolicy-config-deploy-payload.json

CDS_BP_SVC_IP=$(kubectl get svc -n onap | grep 'cds-blueprints-processor-http' | awk '{print $3}')
temp_file="add-nrm-rrmpolicy-config-deploy-payload.json"

# Exectue curl command to execute the config-deploy action
curl -v --location --request POST http://${CDS_BP_SVC_IP}:8080/api/v1/execution-service/process \
--header 'Content-Type: application/json;charset=UTF-8' \
--header 'Accept: application/json;charset=UTF-8,application/json' \
--header 'Authorization: Basic Y2NzZGthcHBzOmNjc2RrYXBwcw==' \
--header 'Host: cds-blueprints-processor-http:8080' \
--header 'Content-Type: text/json' \
--data  "@$temp_file" | python3 -m json.tool

# Verify the model loaded with the give data.
NRM_SIM_POD=$(kubectl get pods -n onap | grep 'nrm-simulator-3gpp' | awk '{print $1}')
kubectl exec -it -n onap $NRM_SIM_POD -- /bin/bash
netopeer2-cli
# Password is netconf
connect --host localhost --login netconf
get --filter-xpath /_3gpp-nr-nrm-rrmpolicy:*
