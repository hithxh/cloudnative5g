#!/bin/bash

az group delete --name amcop-cluster-group --yes --no-wait

az vm delete -n amcop-kud -g AMCOP-CLUSTER-GROUP --no-wait --yes
