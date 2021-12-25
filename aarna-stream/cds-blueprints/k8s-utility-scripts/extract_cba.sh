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
#!/bin/bash

set -ex

which curl > /dev/null || ( echo "This script requires curl utility" && exit 1 )
which jq > /dev/null || ( echo "This script requires jq utility" && exit 1 )

CDS_BP_SVC_IP=$(kubectl get svc -n amcop-system | grep cds-blueprints-processor-http | awk '{print $3}')

# Get the list of available CBAs with name and version
BP_ARRAY=($(curl --location --request GET http://${CDS_BP_SVC_IP}:8080/api/v1/blueprint-model --header 'Authorization: Basic Y2NzZGthcHBzOmNjc2RrYXBwcw==' | jq -r '.[].blueprintModel| "\(.artifactName) \(.artifactVersion)"'))

for i in $(seq 1 2 ${#BP_ARRAY[@]})
do
  CDS_BP_POD_IPS=($(kubectl get pods -n amcop-system -o wide | grep cds-blueprints-processor | awk '{print $6}'))
  for ip in ${CDS_BP_POD_IPS[@]}
  do
    # Get workflow for CBA given name and version will extract CBA to the
    # directory shared between blueprint processor and py-executor, which
    # will allow py-executor to have a view of the data even without the
    # availability of NFS mounted volume
    curl --location --request GET http://${ip}:8080/api/v1/blueprint-model/workflows/blueprint-name/${BP_ARRAY[i-1]}/version/${BP_ARRAY[i]} --header 'Authorization: Basic Y2NzZGthcHBzOmNjc2RrYXBwcw==' > /dev/null
  done
done
