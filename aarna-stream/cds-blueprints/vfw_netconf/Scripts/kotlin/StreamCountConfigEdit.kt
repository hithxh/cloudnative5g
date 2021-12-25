/*
 * Copyright © 2019 IBM, Bell Canada, AT&T, Orange
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.aarna.demo.stream.scripts

import com.fasterxml.jackson.databind.node.ObjectNode
import org.onap.ccsdk.cds.blueprintsprocessor.core.api.data.ExecutionServiceInput
import org.onap.ccsdk.cds.blueprintsprocessor.functions.resource.resolution.storedContentFromResolvedArtifactNB
import org.onap.ccsdk.cds.blueprintsprocessor.rest.BasicAuthRestClientProperties
import org.onap.ccsdk.cds.blueprintsprocessor.rest.RestClientProperties
import org.onap.ccsdk.cds.blueprintsprocessor.rest.service.BasicAuthRestClientService
import org.onap.ccsdk.cds.blueprintsprocessor.rest.service.BlueprintWebClientService
import org.onap.ccsdk.cds.blueprintsprocessor.services.execution.AbstractScriptComponentFunction
import org.onap.ccsdk.cds.controllerblueprints.core.utils.JacksonUtils
import org.slf4j.LoggerFactory
import org.springframework.http.HttpMethod
import org.springframework.web.client.RestTemplate
import org.onap.ccsdk.cds.blueprintsprocessor.functions.netconf.executor.netconfClientService
import org.onap.ccsdk.cds.blueprintsprocessor.functions.netconf.executor.netconfDevice
import org.onap.ccsdk.cds.blueprintsprocessor.functions.netconf.executor.netconfDeviceInfo
import org.onap.ccsdk.cds.blueprintsprocessor.functions.resource.resolution.contentFromResolvedArtifactNB
import org.onap.ccsdk.cds.controllerblueprints.core.asJsonType
import org.apache.commons.text.StringEscapeUtils
import com.fasterxml.jackson.dataformat.xml.XmlMapper
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.databind.JsonNode


open class StreamCountConfigEdit : AbstractScriptComponentFunction() {

    private val log = LoggerFactory.getLogger(StreamCountConfigEdit::class.java)!!

    override suspend fun processNB(executionRequest: ExecutionServiceInput) {

        /*
         * Here resolution-key could be day-1, day-2 etc.. 
         * This will come as part of config-deploy request payload.
         */
		val request_payload = executionRequest.payload
		log.info("Execution Resquest : $request_payload")
		val stream_count = request_payload.get("stream-count-config-edit-request").get("stream-count-config-edit-properties").get("vfwEditPayload").get("active-streams")
		log.info("Active stream count value : $stream_count")
		
        val resolution_key = getDynamicProperties("resolution-key").asText()
        log.info("Got the resolution_key: $resolution_key from config-deploy going to retrive the data from DB")

        // Read the config-assing data using the resolution key + Prefix name for the template
        // We can select the given configuration using the resolution_key=day-1 or day-2
        // With the template prefix name for example "netconfrpc" to load the
        // Store configuration from the CDS DB
		
		//Get the velocity context overried the method
		
        var payload = contentFromResolvedArtifactNB("stream-count-config-edit")
	    log.info("PNF configuration data from DB : \n$payload\n")
		payload = payload.replace("%active-streams%", stream_count.textValue())
		log.info("PNF Payload after editing : \n$payload\n")

        // "netconf-connection" is the tosca Node reference to "execute"
        // workflow.
        try {
	    val netconf_device = netconfDevice("netconf-connection")
        val netconf_rpc_client = netconf_device.netconfRpcService
        val netconf_session = netconf_device.netconfSession
        netconf_session.connect()

        /**
         * Invoke the NETCONF RPC, we already have the teamplate loaded
         * using "resolution-key" & template name prefix.
         */
        
        netconf_rpc_client.lock("candidate")
        netconf_rpc_client.discardConfig()
        netconf_rpc_client.editConfig(payload, "candidate", "merge")
        netconf_rpc_client.commit()
        netconf_rpc_client.unLock("candidate")
        netconf_rpc_client.getConfig("", "running")
        
        val dev_response = netconf_rpc_client.getConfig("", "running")
        log.info("NETCONF device response message : $dev_response\n")
        //setAttribute("response-data", dev_response.asJsonType())
	val res = dev_response.responseMessage
	//log.info("type ====>${res::class.qualifiedName}")

	log.info("****$res******")
        val xmlMapper = XmlMapper()
	val node: JsonNode = xmlMapper.readTree(res?.toByteArray())
	val jsonMapper = ObjectMapper()
	val json: String = jsonMapper.writeValueAsString(node)
        log.info("type ====>${json::class.qualifiedName}")
	log.info("Json msg : ****$json\n")
        
	val jsonstream = JacksonUtils.jsonNode(json)
        log.info("*************$jsonstream")
	log.info("type ====>${jsonstream::class.qualifiedName}")
	val stream = jsonstream.get("data").get("stream-count").get("streams").toString()
	//.get("active-streams")
        log.info("stream====$stream")
        
	val response = "{\"status\": \"success\", \"httpStatusCode\": \"200\", \"httpResponse\": $stream }"
        log.info("Response Data information $response")
	val jsonnode = JacksonUtils.jsonNode(response)
	setAttribute("response-data", jsonnode.asJsonType())
        log.info("Closing NETCONF device sessing with the device\n")
        netconf_session.disconnect()
	}catch (e: Exception) {
	log.info("Caught exception trying to connect !!")
	log.info("***Exception******$e************")
	val response_message = e.message
	log.info("Response string :$response_message")
	val message = StringEscapeUtils.escapeJava(response_message).toString()
	log.info("Messge info : $message")
	val dev_response = "{\"status\": \"Failure\", \"httpStatusCode\": \"500\", \"errorString\": \"$message\" }"
	val jsonnode = JacksonUtils.jsonNode(dev_response)
	setAttribute("response-data", jsonnode.asJsonType())
       }


    }

    override suspend fun recoverNB(runtimeException: RuntimeException, executionRequest: ExecutionServiceInput) {
        log.info("Executing Recovery")
    }
}
