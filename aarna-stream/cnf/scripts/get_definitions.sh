if [ $# -eq 0 ]
then
	curl -i http://localhost:9015/v1/rb/definition
else
	curl -i http://localhost:9015/v1/rb/definition/$1
fi

