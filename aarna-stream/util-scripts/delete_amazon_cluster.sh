#!/bin/bash

echo "## This will delete all clusters in all regions, please be careful !!!"

#List all cluster name and delete them
for region in `/usr/local/bin/aws ec2  describe-regions --output text | cut -f4` 
do 
	/usr/local/bin/aws eks list-clusters --output text --region $region > /tmp/cname
	if [ -s ${TFILE} ] ; then
		for CLUS in `awk '{ print $2 }' /tmp/cname` 
		do		
			echo "Found a cluster $CLUS in region $region, deleting it now"
			eksctl delete cluster --region=${region} --name=${CLUS}
		done
	fi
done
