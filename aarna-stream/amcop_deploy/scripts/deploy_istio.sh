#!/bin/sh

# This script will install istio cli and initialize the operator

curl -sL https://istio.io/downloadIstioctl | sh -
export PATH=$PATH:$HOME/.istioctl/bin 

istioctl operator init
