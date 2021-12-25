base_url='http://localhost:9015'
if [ $# -eq 0 ]
then
	echo "please give connection name"
else
	curl -i -X GET ${base_url}/v1/connectivity-info/$1
fi
