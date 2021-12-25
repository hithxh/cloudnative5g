#!/bin/bash

#=======================================================================
# Copyright (c) 2017-2020 Aarna Networks, Inc.
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

IS_HELM3=$(helm version -c --short|grep -e "^v3")

while [ -n "$1" ]; do # while loop starts

    case "$1" in

    --namespace) NAMESPACE=$2
        shift
        ;;
    *) echo "Option $1 not recognized, for namespace pass --namesapce" ;; # In case you typed a different option other than a

    esac

    shift

done

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )"

#create namesapce if does not exists
if ! kubectl get ns ${NAMESPACE:-emco}> /dev/null 2>&1; then
    kubectl create ns ${NAMESPACE:-emco}
fi


HELM_NAME_OPT=""
if [ -z $IS_HELM3 ];then
   HELM_NAME_OPT="--name"
fi

# echo "installing emco components"
# helm install --namespace "${NAMESPACE:-emco}" ${HELM_NAME_OPT} emco $DIR/../../emco_helm/emco

sleep 10

echo "installing configsvc"
helm install --namespace "${NAMESPACE:-emco}" ${HELM_NAME_OPT} configsvc $DIR/../../awe/src/configsvc/helm/configsvc

sleep 5

echo "installing amcop"
helm install --namespace "${NAMESPACE:-emco}" ${HELM_NAME_OPT} emcoui $DIR/emcoui