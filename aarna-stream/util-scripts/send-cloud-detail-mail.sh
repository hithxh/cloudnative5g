#!/bin/bash

# This script will run once a day at 10 PM IST. It will list all running VM's 
# on Google / Azure / Amazon and send a mail

YESTERDAY=`date -d "yesterday 13:00" '+%Y-%m-%d'`
TODAY=`date '+%Y-%m-%d'`
FNAME=cloud-log-${TODAY}
FILE=/home/aarna/cloud-resources-log/${FNAME}
MAIL_RCV=rpmishra@aarnanetworks.com,rpm.indian@gmail.com
MAIL_RCV=aarna_services@aarnanetworks.com,akapadia@aarnanetworks.com,bhanuchandra@aarnanetworks.com,namachi@aarnanetworks.com,pavans@aarnanetworks.com,premkumar@aarnanetworks.com,raghuram@aarnanetworks.com,rpmishra@aarnanetworks.com,ramakrishnagp@aarnanetworks.com,sailakshmi@aarnanetworks.com,ssharma@aarnanetworks.com,srupanagunta@aarnanetworks.com,vandana@aarnanetworks.com,vkumar@aarnanetworks.com,vmuthukrishnan@aarnanetworks.com
IPADR=`hostname -i`
echo " " > $FILE

echo "You are receving this mail from GCP HOST VM (IP $IPADR). It is sent as a part of the Cron Job that runs every night at 10PM IST." >> $FILE
echo "Below it will list all the resources that are in use for various clouds. " >> $FILE
echo " " >> $FILE
echo "If you see any cloud VM or cluster that is not supposed to run overnight (IST Time), please destroy it. " >> $FILE
echo "The details of delete commands are in ~/aarna-stream/util-scripts/delete*.sh scripts" >> $FILE
echo " " >> $FILE
echo "In case you do not want to receive this mail, please inform RP (rpmishra@aarnanetworks.com)" >> $FILE

echo " " >> $FILE
date >> $FILE
echo " " >> $FILE
echo "Running VM's on Azure" >> $FILE
echo "---------------------" >> $FILE
/usr/bin/az vm list -o table --show-details | grep running >> $FILE
echo "----------------------------------------------------------------------------------------" >> $FILE
echo " " >> $FILE

echo "Running Clusters on Azure" >> $FILE
echo "---------------------" >> $FILE
/usr/bin/az aks list -o table >> $FILE
echo "----------------------------------------------------------------------------------------" >> $FILE
echo " " >> $FILE

echo "Running VM on Google GCP" >> $FILE
echo "---------------------" >> $FILE
/usr/bin/gcloud compute instances list  | grep RUNNING >> $FILE
echo "----------------------------------------------------------------------------------------" >> $FILE
echo " " >> $FILE

echo "Running Clusters on Google GKE" >> $FILE
echo "---------------------" >> $FILE
/usr/bin/gcloud container clusters list >> $FILE
echo "----------------------------------------------------------------------------------------" >> $FILE
echo " " >> $FILE


# List AWS VM's
echo "Running VM on Amazon AWS" >> $FILE
echo "---------------------" >> $FILE
/usr/local/bin/aws ec2 describe-instances --query 'Reservations[].Instances[].[Tags[?Key==`Name`].Value[] | [0], Placement.AvailabilityZone,InstanceType,State.Name]' --output text >> $FILE
echo "----------------------------------------------------------------------------------------" >> $FILE
echo " " >> $FILE


# Send a mail now
{
    echo "To: $MAIL_RCV"
    echo "From: guest.aarna@gmail.com"
    echo "Subject: Summery of cloud usage"
    cat $FILE
} | /usr/sbin/ssmtp $MAIL_RCV

