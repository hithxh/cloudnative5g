FROM golang:1.14.1

# Set the Current Working Directory inside the container
WORKDIR /src
COPY ./ ./
RUN make all 

# Build the Go app
FROM ubuntu:16.04
WORKDIR /opt/emco
RUN groupadd -r emco && useradd -r -g emco emco
RUN chown emco:emco /opt/emco -R
RUN mkdir ./config
COPY --chown=emco --from=0 /src/configsvc ./

# Command to run the executable
CMD ["./configsvc"]
