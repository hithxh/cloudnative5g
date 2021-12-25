base_url='http://localhost:9015'
payload='../payload/register_kud.json'
curl -i -F "metadata=<${payload};type=application/json" -F file=@$HOME/.kube/config -X POST ${base_url}/v1/connectivity-info
