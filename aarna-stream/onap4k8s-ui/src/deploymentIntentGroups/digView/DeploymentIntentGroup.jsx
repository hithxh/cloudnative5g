//=======================================================================
// Copyright (c) 2017-2020 Aarna Networks, Inc.
// All rights reserved.
// ======================================================================
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//           http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
// ========================================================================
import React, { useEffect, useState } from "react";
import apiService from "../../services/apiService";
import DeploymentIntentGroupView from "./DeploymentIntentGroupView";
import Spinner from "../../common/Spinner";
import { withRouter } from "react-router-dom";

const DeploymentIntentGroup = ({ projectName, DigName, isEdit, ...props }) => {
  const compositeAppName = props.match.params.compositeAppName;
  const compositeAppVersion = props.match.params.compositeAppVersion;
  const digName = props.match.params.digName;
  const [data, setData] = useState();
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    getData();
  }, [compositeAppName, compositeAppVersion, digName, projectName]);

  const getData = () => {
    let request = {
      projectName: projectName,
      compositeAppName: compositeAppName,
      compositeAppVersion: compositeAppVersion,
      deploymentIntentGroupName: digName,
    };
    apiService
      .getDeploymentIntentGroupStatus(request)
      .then((res) => {
        setData(res);
      })
      .catch((err) => {
        console.log("error getting DIG details : " + err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <>
      {isLoading && <Spinner />}
      {!isLoading && data && (
        <DeploymentIntentGroupView
          data={data}
          projectName={projectName}
          compositeAppName={compositeAppName}
          compositeAppVersion={compositeAppVersion}
          deploymentIntentGroupName={digName}
          updateData={getData}
        />
      )}
    </>
  );
};

export default withRouter(DeploymentIntentGroup);
