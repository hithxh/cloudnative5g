export GO111MODULE=on

all: clean
	CGO_ENABLED=1 GOOS=linux GOARCH=amd64
	@go build -tags netgo -o ./cdsmock ./main/main.go 

clean:
	@find . -name "*so" -delete
	@rm -f cdsmock 
