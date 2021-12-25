#!/bin/bash

# List all instances on aws (VM and clusters)

for region in `/usr/local/bin/aws ec2  describe-regions --output text | cut -f4` ; do echo "Region :::: $region ::::" ; /usr/local/bin/aws ec2 describe-instances --query 'Reservations[].Instances[].[Tags[?Key==`Name`].Value[] | [0], Placement.AvailabilityZone,InstanceType,State.Name]' --output table --region $region; done 
