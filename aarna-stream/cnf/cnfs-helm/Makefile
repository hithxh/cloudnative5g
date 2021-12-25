# Copyright © 2020 Aarna Networks Inc
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#       http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# TODO: For now we don't have parent charts
PARENT_CHART :=
COMMON_CHARTS_DIR := 
ROOT_DIR := $(shell dirname $(realpath $(lastword $(MAKEFILE_LIST))))
OUTPUT_DIR := $(ROOT_DIR)/dist
PACKAGE_DIR := $(OUTPUT_DIR)/packages
SECRET_DIR := $(OUTPUT_DIR)/secrets
SKIP_LINT :=TRUE

ifneq ($(SKIP_LINT),TRUE)
	HELM_LINT_CMD := helm lint
else
	HELM_LINT_CMD := echo "Skipping linting of"
endif

# For now there is no sub-modules or excludes
SUBMODS := 
EXCLUDES :=  test dist helm $(PARENT_CHART) $(SUBMODS)

# Get the list of folders sorted and exclude the specified list of folders
HELM_CHARTS := $(filter-out $(EXCLUDES), $(sort $(patsubst %/.,%,$(wildcard */.)))) $(PARENT_CHART)

# Inform make about the special targets for each component folder
# Each folder a separate helm package
.PHONY: $(EXCLUDES) $(HELM_CHARTS)


# This is what we are interested
# # For now there is no COMMON_CHARTS_DIR & SUBMODS
all: $(COMMON_CHARTS_DIR) $(SUBMODS) $(HELM_CHARTS) help-msg

help-msg:
	@#echo "COMMON_CHARTS=" $(COMMON_CHARTS)
	@#echo "HELM_CHARTS=" $(HELM_CHARTS)
	@#echo "SUBMODS=" $(SUBMODS)
	@#echo "PARENT_CHART=" $(PARENT_CHART)
	@#echo "COMMON_CHARTS_DIR=" $(COMMON_CHARTS_DIR)
	@#echo "ROOT_DIR=" $(ROOT_DIR)
	@#echo "OUTPUT_DIR=" $(OUTPUT_DIR)
	@#echo "PACKAGE_DIR=" $(PACKAGE_DIR)
	@#echo "SECRET_DIR=" $(SECRET_DIR)
	@echo "--------------------------------------------------"
	@echo "You can find the helm packages under $(PACKAGE_DIR)"
	@echo "--------------------------------------------------"

	@echo "--------------------------------------------------"
	@echo "helm charts under $(PACKAGE_DIR)"
	@echo "--------------------------------------------------"
	@ls $(PACKAGE_DIR)
	@echo "--------------------------------------------------"
   
$(COMMON_CHARTS):
	@echo "\n[$@]"
	@make package-$@

# This will do helm packaing of individual folders
$(HELM_CHARTS):
	@echo "\n[$@]"
	@make package-$@

$(SUBMODS):
	@echo "\n[$@]"
	@make submod-$@
	@make package-$@

submod-%:
	@make $*/requirements.yaml

%/requirements.yaml:
	$(error Submodule $* needs to be retrieved from gerrit.  See https://wiki.onap.org/display/DW/OOM+-+Development+workflow+after+code+transfer+to+tech+teams ); fi


make-%:
	@if [ -f $*/Makefile ]; then make -C $*; fi

dep-%: make-%
	@if [ -f $*/requirements.yaml ]; then helm dep up $*; fi

lint-%: dep-%
	@if [ -f $*/Chart.yaml ]; then $(HELM_LINT_CMD) $*; fi

# This is what we are interested
# Package target has dependency with helm lint for now
# We are skiping it
package-%: lint-%
	@mkdir -p $(PACKAGE_DIR)
	@if [ -f $*/Chart.yaml ]; then helm package -d $(PACKAGE_DIR) $*; fi

# TODO : For now let us not upload it to local helm repo
	#@helm repo index $(PACKAGE_DIR)

clean:
	@rm -f */requirements.lock
	@find . -type f -name '*.tgz' -delete
	@rm -rf $(PACKAGE_DIR)/*

# publish helm plugins via distrubtion directory
plugins:
	@cp -R helm $(PACKAGE_DIR)/

# start up a local helm repo to serve up helm chart packages
repo:
	@mkdir -p $(PACKAGE_DIR)
	@helm serve --repo-path $(PACKAGE_DIR) &
	@sleep 3
	@helm repo index $(PACKAGE_DIR)
	@helm repo add local http://127.0.0.1:8879

# stop local helm repo
repo-stop:
	@pkill helm
	@helm repo remove local
%:
	@:

