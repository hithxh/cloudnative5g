#=======================================================================
# Copyright  ©  2017-2021 Aarna Networks, Inc.
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

CBA_FOLDER_NAME=$1

TMP_FOLDER="/tmp/CDS/"
mkdir -p ${TMP_FOLDER}
pushd $HOME/aarna-stream/cds-blueprints/${CBA_FOLDER_NAME}
	# Zip the CBA for the Enrichment
	zip -r ${TMP_FOLDER}${CBA_FOLDER_NAME}.zip *
popd

# Exectue the booststrap scripts
pushd $HOME/aarna-stream/cds-blueprints/k8s-utility-scripts
	bash -x ./bootstrap-cds.sh

	# Get the loaded blueprint models
	#bash -x ./get-cds-blueprint-models.sh
	
	# Load the data dictionary to the Data base
	bash -x ./dd-microk8s.sh ~/aarna-stream/cds-blueprints/${CBA_FOLDER_NAME}/Scripts/dd.json

	# Going to Enrich nrm-simulator-3gpp.zip
	bash -x ./enrich-and-download-cds-blueprint.sh ${TMP_FOLDER}${CBA_FOLDER_NAME}.zip

	#Save the Enrichment
	bash -x ./save-enriched-blueprint.sh /tmp/CBA/ENRICHED-CBA.zip
	bash -x ./get-cds-blueprint-models.sh
	
popd