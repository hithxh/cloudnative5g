#!/usr/bin/python

import json
import os, sys, time, requests
import sys

headers = {
    'Accept': 'application/json',
    'X-FromAppId': 'vFW',
    'X-TransactionId': '1',
    'Content-Type': 'application/json',
}

k8_config = "~/.kube/config"
provider_name = "provider-1"
cluster_name = "clu-48"
project_name = "TEST8"
comp_appname = "vFW1"
#dig_name = "vfw1_15"
dig_name = "vfw1_1"


# total arguments
n = len(sys.argv)
print ("--------------------------")
print("Total arguments passed:", n)

if n < 5:
    print("Too few arguments passed") #TODO: Need to add help here
    print("required inputs in the mentioned order to the script: VM IP, middleend port, orch port, clm port, dcm port")
    print("Here are the arguments passed:")
    for i in range(1, n):
        print(sys.argv[i])
    exit(0)

print ("--------------------------")
print("Here are the arguments passed:")
for i in range(1, n):
    print(sys.argv[i])

print ("--------------------------")
amcop_deployment_ip = sys.argv[1]
middle_end_port = sys.argv[2]
orch_port = sys.argv[3]
clm_port = sys.argv[4]
dcm_port = sys.argv[5]

try:
    print("---------------Calling health check command---------------\n")
    url1 = 'http://%s:%s/middleend/healthcheck' % (amcop_deployment_ip, middle_end_port)
    res1 = requests.get(url1)
    if res1.status_code != 200:
        print("Health check command returned non 200 code\n")
        print("Health check command response code is: %s\n", res1.status_code)
        res1.raise_for_status()
        exit(0)
    print("Health check command executed successfully\n")
    print("Health check command response code is: %s\n", res1.status_code)
    print("--------------------------------------------------------------\n")
except Exception as e:
    raise Exception('Exception while calling health check command: %s' % e)

try:
    print("---------------Calling create cluster provider command---------------\n")
    md = open("./metadata.json")
    url2 = 'http://%s:%s/v2/cluster-providers' % (amcop_deployment_ip, clm_port)
    res2 = requests.post(url2, headers=headers, data=md, verify=False)
    if res2.status_code != 200 and res2.status_code != 201 and res2.status_code != 409:
        print("create cluster provider command returned non 200 code\n")
        print("create cluster provider command response code is: %s\n", res2.status_code)
        res2.raise_for_status()
        exit(0)
    print("create cluster provider command response code is: %s\n", res2.status_code)
    print("--------------------------------------------------------------\n")
except Exception as e:
    raise Exception('Exception while calling create cluster provider command: %s' % e)

try:
    print("---------------Calling Onboard cluster command---------------\n")
    f = open("clu.json", "rb")
    data = json.load(f)
    file = "/home/ubuntu/k8_config"
    files = {
	 'metadata': (None, json.dumps(data).encode('utf-8'), 'application/json'),
	 'file': (os.path.basename(file), open(file, 'rb'), 'application/octet-stream')
    }
    url3 = 'http://%s:%s/middleend/cluster-providers/%s/clusters' % (amcop_deployment_ip, middle_end_port, provider_name)
    time.sleep(1)
    res3 = requests.post(url3, files=files, verify=False)   
    #print res3.reason
    #res3.raise_for_status()
    if res3.status_code != 200 and res3.status_code != 201:
        print("create cluster command returned non 200 code\n")
        print("create cluster command response code is: %s\n", res3.status_code)
        # res3.raise_for_status()
        exit(0)
    print("create cluster command response code is: %s", res3.status_code)
    print("--------------------------------------------------------------\n")
except Exception as e:
    raise Exception('Exception while calling create cluster command: %s' % e)

try:
    print("---------------Calling create project command---------------\n")
    prj = open("./project.json")
    url4 = 'http://%s:%s/v2/projects' % (amcop_deployment_ip, orch_port)
    time.sleep(1)
    res4 = requests.post(url4, headers=headers, data=prj, verify=False)
    #print res4.reason
    #res4.raise_for_status()
    if res4.status_code != 200 and res4.status_code != 201 and res4.status_code != 409:
        print("create project command returned non 200 code\n")
        print("create project command response code is: %s\n", res4.status_code)
        res4.raise_for_status()
        exit(0)
    print("create project command response code is: %s\n", res4.status_code)
    print("--------------------------------------------------------------\n")
except Exception as e:
    raise Exception('Exception while calling create project command: %s' % e)    

try:
    print("---------------Calling create composite app command---------------\n")
    f = open("tt.json", "rb")
    data = json.load(f)
    file1 = "/home/ubuntu/sink.tgz"
    file2 = "/home/ubuntu/packetgen.tgz"
    file3 = "/home/ubuntu/firewall.tgz"
    file4 = "/home/ubuntu/profile.tar.gz"
    files = {
     'servicePayload': (None, json.dumps(data).encode('utf-8'), 'application/json'),
     'file1': (os.path.basename(file1), open(file1, 'rb'), 'application/octet-stream'),
     'file2': (os.path.basename(file2), open(file2, 'rb'), 'application/octet-stream'),
     'file3': (os.path.basename(file3), open(file3, 'rb'), 'application/octet-stream'),
     'file4': (os.path.basename(file4), open(file4, 'rb'), 'application/octet-stream')
    }
    url5 = 'http://%s:%s/middleend/projects/%s/composite-apps' % (amcop_deployment_ip, middle_end_port, project_name)
    time.sleep(3)
    res5 = requests.post(url5, files=files, verify=False)
    #print res5.reason
    #res5.raise_for_status()
    if res5.status_code != 200 and res5.status_code != 201 and res5.status_code != 409:
        print("create composite app command returned non 200 code\n")
        print("create composite app command response code is: %s\n", res5.status_code)
        res5.raise_for_status()
        exit(0)
    print("create composite app command response code is: %s\n", res5.status_code)
    print("--------------------------------------------------------------\n")
except Exception as e:
    raise Exception('Exception while calling create composite app command: %s' % e)
    
try:
    print("---------------Calling GET composite app command---------------\n")
    url6 = 'http://%s:%s/middleend/projects/%s/composite-apps?filter=depthAll' % (amcop_deployment_ip, middle_end_port, project_name)
    res6 = requests.get(url6)
    if res6.status_code != 200:
        print("GET composite app command returned non 200 code\n")
        print("GET composite app command response code is: %s\n", res6.status_code)
        res6.raise_for_status()
        exit(0)
    print("GET composite app command response code is: %s\n", res6.status_code)
    print("--------------------------------------------------------------\n")
except Exception as e:
    raise Exception('Exception while calling GET composite app command: %s' % e)  

try:
    print("---------------Calling create logical cloud command---------------\n")
    lc = open("./lc.json")
    url7 = 'http://%s:%s/middleend/projects/%s/logical-clouds' % (amcop_deployment_ip, middle_end_port, project_name)
    time.sleep(1)
    res7 = requests.post(url7, headers=headers, data=lc, verify=False)
    #print res4.reason
    #res4.raise_for_status()
    if res7.status_code != 200 and res7.status_code != 201 and res7.status_code != 409 and res7.status_code != 202:
        print("create logical cloud command returned non 200 code\n")
        print("create logical cloud command response code is: %s\n", res7.status_code)
        res7.raise_for_status()
        exit(0)
    print("create logical cloud command response code is: %s\n", res7.status_code)
    print("--------------------------------------------------------------\n")
except Exception as e:
    raise Exception('Exception while calling create logical cloud command: %s' % e)


try:
    print("---------------Calling GET logical cloud command---------------\n")
    url8 = 'http://%s:%s/v2/projects/%s/logical-clouds' % (amcop_deployment_ip, dcm_port, project_name)
    res8 = requests.get(url8)
    if res8.status_code != 200:
        print("GET logical cloud command returned non 200 code\n")
        print("GET logical cloud command response code is: %s\n", res8.status_code)
        res8.raise_for_status()
        exit(0)
    print("GET logical cloud command response code is: %s\n", res8.status_code)
    print("--------------------------------------------------------------\n")
except Exception as e:
    raise Exception('Exception while calling GET logical cloud command: %s' % e)


try:
    print("---------------Calling create DIG command---------------\n")
    dig = open("./dig.json")
    url9 = 'http://%s:%s/middleend/projects/%s/composite-apps/%s/v1/deployment-intent-groups' % (amcop_deployment_ip, middle_end_port, project_name, comp_appname)
    time.sleep(1)
    res9 = requests.post(url9, headers=headers, data=dig, verify=False)
    #print res4.reason
    #res4.raise_for_status()
    if res9.status_code != 200 and res9.status_code != 201 and res9.status_code != 409:
        print("create DIG command returned non 200 code\n")
        print("create DIG command response code is: %s\n", res9.status_code)
        res9.raise_for_status()
        exit(0)
    print("create DIG command response code is: %s\n", res9.status_code)
    print("--------------------------------------------------------------\n")
except Exception as e:
    raise Exception('Exception while calling create DIG command: %s' % e)

try:
    print("---------------Calling Verify DIG command---------------\n")
    url10 = 'http://%s:%s/middleend/projects/%s/composite-apps/%s/v1/deployment-intent-groups/%s' % (amcop_deployment_ip, middle_end_port, project_name, comp_appname, dig_name)
    res10 = requests.get(url10, headers=headers, verify=False)
    #print res4.reason
    #res4.raise_for_status()
    if res10.status_code != 200:
        print("Verify DIG command returned non 200 code\n")
        print("Verify DIG command response code is: %s\n", res10.status_code)
        res10.raise_for_status()
        exit(0)
    print("Verify DIG command response code is: %s\n", res10.status_code)
    print("--------------------------------------------------------------\n")
except Exception as e:
    raise Exception('Exception while calling Verify DIG command: %s' % e)


try:
    print("---------------Calling Approve DIG command---------------\n")
    url11 = 'http://%s:%s/v2/projects/%s/composite-apps/%s/v1/deployment-intent-groups/%s/approve' % (amcop_deployment_ip, orch_port, project_name, comp_appname, dig_name)
    time.sleep(1)
    res11 = requests.post(url11, headers=headers, verify=False)
    #print res4.reason
    #res4.raise_for_status()
    if res11.status_code != 200 and res11.status_code != 202:
        print("Approve DIG command returned non 200 code\n")
        print("Approve DIG command response code is: %s\n", res11.status_code)
        res11.raise_for_status()
        exit(0)
    print("Approve DIG command response code is: %s\n", res11.status_code)
    print("--------------------------------------------------------------\n")
except Exception as e:
    raise Exception('Exception while calling Approve DIG command: %s' % e)

try:

    print("---------------Calling Instantiate DIG command---------------\n")
    time.sleep(5)
    url12 = 'http://%s:%s/v2/projects/%s/composite-apps/%s/v1/deployment-intent-groups/%s/instantiate' % (amcop_deployment_ip, orch_port, project_name, comp_appname, dig_name)
    time.sleep(1)
    res12 = requests.post(url12)
    #print res12
    #res12.raise_for_status()
    if res12.status_code != 200 and res11.status_code != 202:
        print("Instantiate DIG command returned non 200 code\n")
        print("Instantiate DIG command response code is: %s\n", res12.status_code)
        res12.raise_for_status()
        exit(0)
    print("Instantiate DIG command response code is: %s\n", res12.status_code)
    print("--------------------------------------------------------------\n")
except Exception as e:
    raise Exception('Exception while calling Instantiate DIG command: %s' % e)


# python vfw_orchestrate_python.py 192.168.122.155 30481 30415 30461 30477








