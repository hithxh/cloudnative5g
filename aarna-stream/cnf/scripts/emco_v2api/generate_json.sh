#!/bin/bash

if [ $# -ne 1 ]
   then
     echo "Usage $0: <ini file path>"
     exit 1
fi

ini_file=$1
CRUDINI=`which crudini`
JQ=`which jq`

if [ ! -x $CRUDINI ]
  then
    apt-get install crudini -y
fi

if [ ! -x $JQ ]
  then
    apt-get install jq -y
fi


metadatanames=$(crudini --get --format=ini $ini_file application metaDataNames | awk -F "=" '{print $2}' | jq ".[]" | tr -d '"')
networkdata=$(crudini --get --format=ini $ini_file networks NetworkNames | awk -F "=" '{print $2}' | jq ".[] | keys[]" | tr -d '"')
provider=$(crudini --get --format=ini $ini_file application clusterProviderName | awk -F "=" '{print $2}' | jq ".[]" | tr -d '"')
clustername=$(crudini --get --format=ini $ini_file application clusterName | awk -F "=" '{print $2}' | jq ".[]" | tr -d '"')
servicename=$(crudini --get --format=ini $ini_file application serviceName | awk -F "=" '{print $2}' | tr -d ' "')
projectname=$(crudini --get --format=ini $ini_file application projectName | awk -F "=" '{print $2}' | tr -d ' "')

function interface_data(){
    appname=$1
    appinterfaces=$(crudini --get --format=ini $ini_file networks NetworkNames | awk -F "=" '{print $2}' | jq -r "to_entries |map(\"\(.key)=\(.value|tostring)\")|.[]" | awk -F "=" '{print $2}' | jq .$appname | sed 's/null//g')
    subnet_data=''
    for network in "${appinterfaces[@]}"
      do
        net_data=$(echo $network | jq -r "to_entries| map(\"\(.key)=\(.value|tostring)\")|.[]")
        for net in $net_data
          do
            subnet_data+="$(cat<<EOF
                         {"networkName": "$(echo $net | awk -F "=" '{print $1}')",
                          "ip": $(echo $net | awk -F "=" '{print $2}' |  awk -F "," '{print $1}' | tr -d "["),
                          "subnet": $(echo $net | awk -F "=" '{print $2}' |  awk -F "," '{print $2}' | tr -d "]")
                         },
EOF
)"
         done
       subnet_data=$(echo $subnet_data | rev | cut -c 2- | rev)
   done
}

for metaname in ${metadatanames[@]}
  do
    if grep -q -o "${metaname}-[0-9].[0-9].[0-9].tgz" $ini_file
      then
	filename=$(grep -o "${metaname}-[0-9].[0-9].[0-9].tgz" $ini_file)
    else
       filename="${metaname}.tgz"
    fi
    interface_data $metaname
    appdata+="$(cat<<EOF
    {
       "metadata": {
       "name": "$metaname",
       "description": "$metaname desc",
       "filename": "${filename}"
    },
      "profileMetadata": {
      "name": "${metaname}_profile",
      "filename": "profile.tar.gz"
    },
      "clusters": [{"provider": "$provider",
                "selectedClusters":[{"interfaces":[$subnet_data], "name": "$clustername"}]}]
	},
EOF
)"
done


data=$(echo $appdata | rev | cut -c 2- | rev)
servicedata="$(cat<<EOF
{
  "name": "$servicename",
  "description": "${servicename}Service description",
  "spec": {
           "projectName": "$projectname",
           "appsData": [$data]
          }
  }
EOF
)"

echo $servicedata

exit 0
