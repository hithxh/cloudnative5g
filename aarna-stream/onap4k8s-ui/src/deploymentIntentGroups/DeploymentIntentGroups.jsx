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
import DIGtable from "./DIGtable";
import { withStyles, Button, Grid, Typography } from "@material-ui/core";
import AddIcon from "@material-ui/icons/Add";
import apiService from "../services/apiService";
import Spinner from "../common/Spinner";
import DIGform from "./DIGform";
import { ReactComponent as EmptyIcon } from "../assets/icons/empty.svg";

const styles = {
  root: {
    display: "flex",
    minHeight: "100vh",
  },
  app: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
};

const DeploymentIntentGroups = (props) => {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState([]);
  const [isLoading, setIsloading] = useState(true);
  const [compositeApps, setCompositeApps] = useState([]);
  const handleClose = () => {
    setOpen(false);
  };
  const onCreateDIG = () => {
    setOpen(true);
  };
  const handleSubmit = (inputFields) => {
    try {
      let payload = {
        spec: {
          projectName: props.projectName,
          appsData: inputFields.intents.apps,
        },
      };
      const {
        compositeApp,
        compositeAppSpec,
        logicalCloud,
        logicalCloudData,
        ...others
      } = inputFields.general;
      let overrideValues = [];
      inputFields.intents.apps.forEach((app) => {
        if (app.overrideValues && app.overrideValues !== "") {
          overrideValues.push(JSON.parse(app.overrideValues));
        }
      });

      if (overrideValues.length > 0) {
        payload.spec["override-values"] = overrideValues;
      }

      payload = { ...payload, ...others };
      payload.compositeApp = compositeApp.metadata.name;
      payload.compositeAppVersion = compositeAppSpec.version;
      payload.logicalCloud = logicalCloud.metadata.name;
      apiService
        .createDeploymentIntentGroup(payload)
        .then((response) => {
          response.metadata.compositeAppName =
            inputFields.general.compositeApp.metadata.name;
          response.metadata.compositeAppVersion =
            inputFields.general.compositeAppSpec.version;
          data && data.length > 0
            ? setData([...data, response])
            : setData([response]);
        })
        .catch((error) => {
          console.log("error creating DIG : ", error);
        })
        .finally(() => {
          setIsloading(false);
          setOpen(false);
        });
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    let getDigs = () => {
      apiService
        .getDeploymentIntentGroups({ projectName: props.projectName })
        .then((res) => {
          if (res) setData(res.sort(sortDataByName));
          else setData([]);
        })
        .catch((err) => {
          console.log("error getting deplotment intent groups : " + err);
        })
        .finally(() => setIsloading(false));
    };

    apiService
      .getCreatedCompositeApps({ projectName: props.projectName })
      .then((response) => {
        setCompositeApps(response);
        getDigs();
      })
      .catch((err) => {
        console.log("Unable to get composite apps : ", err);
      });
  }, [props.projectName]);

  const sortDataByName = (a, b) => {
    let nameA = a.metadata.name.toLowerCase();
    let nameB = b.metadata.name.toLowerCase();
    if (nameA > nameB) return 1;
    else if (nameA < nameB) return -1;
    else return 0;
  };

  return (
    <>
      {isLoading && <Spinner />}
      {!isLoading && compositeApps && (
        <>
          <DIGform
            projectName={props.projectName}
            open={open}
            onClose={handleClose}
            onSubmit={handleSubmit}
            data={{ compositeApps: compositeApps }}
            existingDigs={data}
          />
          <Grid item xs={12}>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<AddIcon />}
              onClick={onCreateDIG}
            >
              Create Service Instance
            </Button>
          </Grid>

          {data && data.length > 0 && (
            <Grid container spacing={2} alignItems="center">
              <Grid item xs style={{ marginTop: "20px" }}>
                <DIGtable
                  data={data}
                  setData={setData}
                  projectName={props.projectName}
                />
              </Grid>
            </Grid>
          )}

          {(data === null || (data && data.length < 1)) && (
            <Grid container spacing={2} direction="column" alignItems="center">
              <Grid item xs={6}>
                <EmptyIcon />
              </Grid>
              <Grid item xs={12} style={{ textAlign: "center" }}>
                <Typography variant="h5" color="primary">
                  No Service Instance
                </Typography>
                <Typography variant="subtitle1" color="textSecondary">
                  <strong>
                    No service instance created yet, start by creating a service
                    instance
                  </strong>
                </Typography>
              </Grid>
            </Grid>
          )}
        </>
      )}
    </>
  );
};
export default withStyles(styles)(DeploymentIntentGroups);
