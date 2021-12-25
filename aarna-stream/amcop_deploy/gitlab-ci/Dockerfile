FROM ubuntu:18.04
RUN apt-get update -y
RUN apt-get install git python3 -y
RUN apt-get update -y
RUN apt-get install python3-pip -y
RUN pip3 install --upgrade pip
RUN apt-get install jq -y
RUN apt install zip -y
RUN apt-get update -y
RUN apt-get install curl -y

RUN echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" | tee -a /etc/apt/sources.list.d/google-cloud-sdk.list
RUN apt-get install apt-transport-https ca-certificates gnupg -y
RUN curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key --keyring /usr/share/keyrings/cloud.google.gpg add -
RUN apt-get update -y && apt-get install google-cloud-sdk -y


RUN curl -sL https://aka.ms/InstallAzureCLIDeb | bash

RUN apt-get update && apt-get install -y apt-transport-https gnupg2
RUN curl -s https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key add -
RUN echo "deb https://apt.kubernetes.io/ kubernetes-xenial main" | tee -a /etc/apt/sources.list.d/kubernetes.list
RUN apt-get update
RUN apt-get install -y kubectl



RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
RUN unzip awscliv2.zip
RUN ./aws/install
#Install eksctl
RUN curl --silent --location "https://github.com/weaveworks/eksctl/releases/latest/download/eksctl_$(uname -s)_amd64.tar.gz" | tar xz -C /tmp
RUN mv /tmp/eksctl /usr/local/bin

ARG GIT_USER
ARG GIT_PASS
#RUN git clone https://aarna_guest:guest123@gitlab.com/aarna-networks/aarna-stream.git amcop
#RUN git clone https://gitlab.com/aarna-networks/aarna-stream.git
RUN git clone https://${GIT_USER}:${GIT_PASS}@gitlab.com/aarna-networks/aarna-stream.git /root/amcop/
#RUN git clone -n https://${GIT_USER}:${GIT_TOKEN}@gitlab.com:aarna-networks/aarna-stream.git
#RUN git clone -n https://pavans@aarnanetworks.com:pN-pwHMidNnJGq7Z8c65@gitlab.com:aarna-networks/aarna-stream.git



