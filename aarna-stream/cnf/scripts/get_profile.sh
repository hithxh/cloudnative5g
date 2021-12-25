rb_name='test-vfw'
if [ $# -eq 0 ]
then
	curl -i http://localhost:9015/v1/rb/definition/test-vfw/v1/profile
else
	curl -i http://localhost:9015/v1/rb/definition/test-vfw/v1/profile/$1
fi
