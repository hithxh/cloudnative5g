Prerequisites to be executed in AMCOP VM:
	Install python requests library: "sudo apt-get install -y python-requests".
	
	Copy target cluster k8s config file to $HOME/k8_config in the AMCOP VM.

	Copy vFW helm packages under $HOME in the AMCOP VM.
		cp ~/aarna-stream/cnf/vfw_helm/sink.tgz $HOME/sink.tgz
		cp ~/aarna-stream/cnf/vfw_helm/packetgen.tgz $HOME/packetgen.tgz
		cp ~/aarna-stream/cnf/vfw_helm/firewall.tgz $HOME/firewall.tgz
		cp ~/aarna-stream/cnf/payload/profile.tar.gz $HOME/profile.tar.gz
Usage:
	python vfw_orchestrate_python.py <AMCOP VM IP> <middle_end_port> <orchestrator_port> <clm_port> <dcm_port>
	
	Example usage with default ports:
		python vfw_orchestrate_python.py 192.168.122.110 30481 30415 30461 30477