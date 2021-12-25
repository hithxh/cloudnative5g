/*
 * Copyright © 2017-2020 Aarna Networks, Inc.
 *           All rights reserved.
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
import org.onap.ccsdk.cds.blueprintsprocessor.functions.resource.resolution.contentFromResolvedArtifactNB
import org.onap.ccsdk.cds.controllerblueprints.core.asJsonType
import org.onap.ccsdk.cds.controllerblueprints.core.BluePrintProcessorException

import org.springframework.http.HttpEntity
import org.springframework.http.ResponseEntity
import com.fasterxml.jackson.databind.JsonNode
import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import org.apache.commons.text.StringEscapeUtils
import org.springframework.web.client.HttpClientErrorException


open class StreamCountConfigGetSchema : AbstractScriptComponentFunction() {

	private val log = LoggerFactory.getLogger(StreamCountConfigGetSchema::class.java)!!

	override suspend fun processNB(executionRequest: ExecutionServiceInput) {

		val request_payload = executionRequest.payload
		log.info("Execution Resquest : $request_payload")

		val template_name = getDynamicProperties("resolution-key").asText()
		log.info("Got the resolution_key: $template_name from workflow request")

		val rest_api_json_payload = contentFromResolvedArtifactNB(template_name)
		log.info("PCF SM configuration data from DB : \n$rest_api_json_payload\n")

		val dev_response = "{\"status\": \"success\", \"httpStatusCode\": \"200\", \"httpResponse\": $rest_api_json_payload }"
		val jsonnode = JacksonUtils.jsonNode(dev_response)
		setAttribute("response-data", jsonnode.asJsonType())

	}

	override suspend fun recoverNB(runtimeException: RuntimeException, executionRequest: ExecutionServiceInput) {
		log.info("Executing Recovery")
	}
}
