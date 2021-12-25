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
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import { makeStyles } from "@material-ui/core/styles";
import {
  Typography,
  Grid,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Button,
  FormHelperText,
} from "@material-ui/core";
import {
  CloudQueue as CloudQueueIcon,
  SettingsEthernet as SettingsEthernetIcon,
  CodeOutlined as CodeOutlinedIcon,
  EditOutlined as EditOutlinedIcon,
  Close as CloseIcon,
} from "@material-ui/icons";
import Paper from "@material-ui/core/Paper";
import UpgradeDigForm from "./upgradeDIG/UpgradeDigForm";
import apiService from "../../services/apiService";
import Dialog from "../../common/Dialogue";
import { useHistory } from "react-router-dom";
import Radio from "@material-ui/core/Radio";
import RadioGroup from "@material-ui/core/RadioGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import FormControl from "@material-ui/core/FormControl";
import FormLabel from "@material-ui/core/FormLabel";
import ErrorIcon from "@material-ui/icons/Error";

function RadioButtonsGroup({
  targetServiceVersion,
  setTargetServiceVersion,
  serviceVersions,
  currentServiceVersion,
  ...props
}) {
  const handleChange = (event) => {
    setTargetServiceVersion(event.target.value);
  };

  return (
    <form>
      <FormControl component="fieldset">
        <FormLabel component="legend">Select target service version</FormLabel>
        <RadioGroup
          aria-label="versio"
          name="gender1"
          value={targetServiceVersion}
          onChange={handleChange}
        >
          {serviceVersions.map((serviceVersion) => (
            <FormControlLabel
              disabled={currentServiceVersion === serviceVersion}
              value={serviceVersion}
              control={<Radio />}
              label={
                currentServiceVersion === serviceVersion
                  ? serviceVersion + "(current version)"
                  : serviceVersion
              }
            />
          ))}
        </RadioGroup>
        {targetServiceVersion === "" && (
          <FormHelperText error>Please select an option</FormHelperText>
        )}
      </FormControl>
    </form>
  );
}

const useStyles = makeStyles((theme) => ({
  typography: {
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  appStatusIcon: {
    width: "20px",
    height: "20px",
    marginRight: "8px",
    marginTop: "1px",
  },
  divider: {
    borderLeft: `2px solid ${theme.palette.text.disabled}`,
    display: "inline-flex",
    height: "17px",
    marginLeft: "8px",
    verticalAlign: "baseline",
  },
  version: {
    color: theme.palette.text.disabled,
    marginLeft: "5px",
    display: "inline-flex",
  },
}));

function DeploymentIntentGroupCheckoutView({ data, ...props }) {
  const [open, setOpen] = useState(false);
  const classes = useStyles();
  const [logicalCloud, setLogicalCloud] = useState([]);
  const [loading, setLoading] = useState(true);
  const [appsToEdit, setAppsToEdit] = useState([]);
  const [serviceVersions, setServiceVersions] = useState([]);
  const [openVersionChangeDialog, setOpenVersionChangeDialog] = useState(false);
  const [dialogDetails, setDialogDetails] = useState({
    open: false,
    operation: "",
    title: "",
    content: "",
  });
  const [targetServiceVersion, setTargetServiceVersion] = useState("");
  const [errors, setErrors] = useState([]);
  let history = useHistory();

  useEffect(() => {
    apiService
      .getLogicalCloudsDetail(props.projectName)
      .then((response) => {
        if (response) {
          //assumption : logical cloud associated with serive instance has an entry in all logical clouds of the project
          const lc = response.filter(
            (entry) => entry.metadata.name === data.logicalCloud
          );

          lc[0].spec.clusterProviders.forEach((cp) => {
            //first get the values in a set so that we dont duplicate the labels, then add it to the array
            let uniqueLabels = new Set();
            let labels = [];
            cp.spec.clusters.forEach((cluser) => {
              if (cluser.spec.labels && cluser.spec.labels.length > 0) {
                cluser.spec.labels.forEach((label) => {
                  uniqueLabels.add(label["label-name"]);
                });
              }
            });
            //create the required object array
            uniqueLabels.forEach((label) => {
              labels.push({ "label-name": label });
            });
            cp.spec.labels = [...labels];
          });

          setLogicalCloud(lc[0]);
        }
      })
      .catch((err) => {
        console.log("Unable to get logical clouds detail : ", err);
      })
      .finally(() => setLoading(false));
  }, [props.projectName, data.logicalCloud]);

  const handleSubmitSave = (values) => {
    let payload = values.apps[0];
    payload.metadata = { name: payload.name, description: payload.description };
    let request = {
      projectName: props.projectName,
      compositeAppName: props.compositeAppName,
      compositeAppVersion: props.compositeAppVersion,
      deploymentIntentGroupName: props.deploymentIntentGroupName,
      payload: payload,
    };
    apiService
      .saveCheckoutServiceInstance(request)
      .then((res) =>
        //refresh the data once save is successful
        props.refreshData()
      )
      .catch((err) => {
        console.log("unable to save service instance data" + err);
      })
      .finally(() => {
        handleCloseForm();
      });
  };

  const getErrors = () => {
    let errors = {};
    data.apps.forEach((app) => {
      if (!app.clusters || app.clusters.length < 1) {
        errors[app.name] = "Select at least one cluster";
      }
    });
    setErrors(errors);
    return errors;
  };
  const handleSubmit = () => {
    const err = getErrors();
    if (Object.entries(err).length > 0) return;
    setDialogDetails({
      open: true,
      operation: "submit",
      title: "Submit changes",
      content: "Are you sure you want to submit the changes ?",
    });
  };

  const handleCloseForm = () => {
    setAppsToEdit([]);
    setOpen(false);
  };

  const handleChangeServiceVersion = () => {
    setLoading(true);
    let request = {
      projectName: props.projectName,
      compositeAppName: props.compositeAppName,
      state: "created",
    };
    apiService
      .getCompositeAppVersions(request)
      .then((res) => {
        setServiceVersions(res);
        setLoading(false);
        setOpenVersionChangeDialog(true);
      })
      .catch((err) => {
        console.err("error getting composite app versions" + err);
      });
  };
  const handleEditApp = (appIndex) => {
    setAppsToEdit([data.apps[appIndex]]);
    setOpen(true);
  };
  const hanldeCancel = () => {
    setDialogDetails({
      open: true,
      operation: "cancel",
      title: "Cancel and discard changes ?",
      content: "If you cancel, all the changes will be lost",
    });
  };
  const handleCloseDialog = (el) => {
    if (el.target.innerText === "OK") {
      let request = {
        projectName: props.projectName,
        compositeAppName: props.compositeAppName,
        compositeAppVersion: props.compositeAppVersion,
        deploymentIntentGroupName: props.deploymentIntentGroupName,
      };
      if (dialogDetails.operation === "submit") {
        apiService
          .submitCheckoutServiceInstance(request)
          .then(() => {
            let path = history.location.pathname.replace(
              "/checkout",
              "/status"
            );
            history.push({
              pathname: path,
            });
          })
          .catch((err) => {
            console.log("Error submitting service instance changes : ", err);
          });
      } else {
        apiService
          .deleteCheckoutServiceInstance(request)
          .then((res) => {
            let statusUrl = history.location.pathname.replace(
              `/${props.compositeAppName}/${props.compositeAppVersion}/`,
              `/${props.compositeAppName}/${res.headers["original-version"]}/`
            );
            let path = statusUrl.replace("/checkout", "/status");
            history.push({
              pathname: path,
            });
          })
          .catch((err) => {
            console.log("Error deleting checkout service instance : ", err);
          });
      }
    }
    setDialogDetails({
      open: false,
      operation: "",
      title: "",
      content: "",
    });
  };

  const handleCloseVersionChangeDialog = (el) => {
    if (el.target.innerText === "OK" && targetServiceVersion !== "") {
      setLoading(true);
      let request = {
        projectName: props.projectName,
        compositeAppName: props.compositeAppName,
        compositeAppVersion: props.compositeAppVersion,
        deploymentIntentGroupName: props.deploymentIntentGroupName,
        targetVersion: targetServiceVersion,
      };
      apiService
        .migrateServiceInstance(request)
        .then(() => {
          let checkoutUrl = history.location.pathname.replace(
            `/${props.compositeAppName}/${props.compositeAppVersion}/`,
            `/${props.compositeAppName}/${targetServiceVersion}/`
          );

          history.push({
            pathname: checkoutUrl,
          });
        })
        .catch((err) => {
          console.error("error from migrate api : " + err);
        })
        .finally(() => {
          setLoading(false);
          setOpenVersionChangeDialog(false);
        });
    } else if (el.target.innerText === "Cancel") {
      setOpenVersionChangeDialog(false);
    }
  };
  return (
    <>
      <Dialog
        open={dialogDetails.open}
        onClose={handleCloseDialog}
        title={dialogDetails.title}
        content={dialogDetails.content}
        confirmationText="OK"
      />

      <Dialog
        open={openVersionChangeDialog}
        onClose={handleCloseVersionChangeDialog}
        title="Are you sure you want to change the service version ?"
        loading={loading}
        content={
          <RadioButtonsGroup
            serviceVersions={serviceVersions}
            targetServiceVersion={targetServiceVersion}
            setTargetServiceVersion={setTargetServiceVersion}
            currentServiceVersion={data["composite-app-version"]}
          />
        }
        confirmationText="OK"
      />
      {!loading && (
        <UpgradeDigForm
          projectName={props.projectName}
          open={open}
          onClose={handleCloseForm}
          onSubmit={handleSubmitSave}
          logicalCloud={logicalCloud}
          appsToEdit={appsToEdit}
        />
      )}
      <Grid container>
        <Grid item container xs={4}>
          <Grid item xs={12}>
            <Typography color={"textSecondary"}>Instance Name</Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="h5">{data.name}</Typography>
          </Grid>
        </Grid>
        <Grid item container xs={4}>
          <Grid item container xs={12} alignItems="center" spacing={2}>
            <Grid item>
              <Typography color={"textSecondary"}>Service</Typography>
            </Grid>
            <Grid item>
              <Button
                aria-haspopup="true"
                onClick={handleChangeServiceVersion}
                color="primary"
                size="small"
                variant="outlined"
                style={{ padding: "0 9px" }}
                disabled={loading}
              >
                Change Version
              </Button>
            </Grid>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="h5" style={{ display: "inline-flex" }}>
              {data["composite-app-name"]}
            </Typography>
            <div className={classes.divider}></div>
            <Typography variant="h6" className={classes.version}>
              {data["composite-app-version"]}
            </Typography>
          </Grid>
        </Grid>

        <Grid
          item
          xs={4}
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "flex-start",
          }}
        >
          <Button
            disabled={Object.entries(errors).length > 0}
            aria-haspopup="true"
            onClick={handleSubmit}
            color="primary"
            variant="contained"
            style={{ marginRight: "25px" }}
          >
            SUBMIT
          </Button>
          <Button
            aria-haspopup="true"
            onClick={hanldeCancel}
            color="secondary"
            variant="outlined"
          >
            <CloseIcon style={{ marginRight: "5px" }} />
            CANCEL
          </Button>
        </Grid>
      </Grid>

      {data.apps && (
        <Grid
          container
          item
          xs={12}
          style={{ marginTop: "60px", marginBottom: "15px" }}
        >
          <Typography variant="h5" color="textSecondary">
            Applications
          </Typography>
        </Grid>
      )}

      <Grid container spacing={4}>
        {data.apps &&
          data.apps.map((app, appIndex) => (
            <Grid item key={app.name + appIndex} xs={12}>
              <Card style={{ width: "40%" }}>
                <CardContent>
                  <Grid container spacing={2}>
                    {errors && errors[app.name] && (
                      <Grid item xs={12}>
                        <ErrorIcon
                          color="error"
                          style={{
                            verticalAlign: "middle",
                            marginRight: "10px",
                          }}
                        />
                        <Typography component="span">
                          {errors[app.name]}
                        </Typography>
                      </Grid>
                    )}
                    <Grid item>
                      <CodeOutlinedIcon
                        color="secondary"
                        style={{
                          fontSize: 40,
                          float: "left",
                          marginRight: "5px",
                        }}
                      />
                      <Typography variant="h4" className={classes.typography}>
                        {app.name}
                      </Typography>
                    </Grid>
                    <Grid item>
                      <Button
                        onClick={() => handleEditApp(appIndex)}
                        color="primary"
                        id={app.name}
                        size="small"
                      >
                        <EditOutlinedIcon />
                        &nbsp;Edit
                      </Button>
                    </Grid>

                    <Grid item xs={12}>
                      <Typography color="textSecondary">
                        {app.description}
                      </Typography>
                    </Grid>

                    {app.clusters && (
                      <Grid item container xs={12}>
                        <Grid item>
                          <CloudQueueIcon
                            style={{ float: "left", marginRight: "10px" }}
                          />
                        </Grid>
                        <Grid item>
                          <Typography variant="subtitle1">
                            Placement Intents
                          </Typography>
                        </Grid>
                        {app.clusters && app.clusters.length > 0 && (
                          <Grid item xs={12}>
                            <TableContainer component={Paper}>
                              <Table size="small">
                                <TableHead
                                  style={{
                                    backgroundColor: "rgb(234, 239, 241)",
                                  }}
                                >
                                  <TableRow>
                                    <TableCell>
                                      {app.clusters[0].selectedClusters &&
                                      app.clusters[0].selectedClusters.length >
                                        0
                                        ? "Cluster"
                                        : "Label"}
                                    </TableCell>
                                    <TableCell>Cluster Provider</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {app.clusters.map((cluster) => {
                                    return cluster.selectedClusters &&
                                      cluster.selectedClusters.length > 0
                                      ? cluster.selectedClusters.map(
                                          (selectedCluster) => (
                                            <TableRow
                                              key={
                                                cluster.clusterProvider +
                                                selectedCluster.name
                                              }
                                            >
                                              <TableCell>
                                                {selectedCluster.name}
                                              </TableCell>
                                              <TableCell>
                                                {cluster.clusterProvider}
                                              </TableCell>
                                            </TableRow>
                                          )
                                        )
                                      : cluster.selectedLabels.map(
                                          (selectedLabel) => (
                                            <TableRow
                                              key={
                                                cluster.clusterProvider +
                                                selectedLabel["label-name"]
                                              }
                                            >
                                              <TableCell>
                                                {selectedLabel["label-name"]}
                                              </TableCell>
                                              <TableCell>
                                                {cluster.clusterProvider}
                                              </TableCell>
                                            </TableRow>
                                          )
                                        );
                                  })}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </Grid>
                        )}
                      </Grid>
                    )}

                    {app.interfaces && (
                      <Grid item container xs={12}>
                        <Grid item>
                          <SettingsEthernetIcon
                            style={{ float: "left", marginRight: "10px" }}
                          />
                        </Grid>
                        <Grid item>
                          <Typography variant="subtitle1">
                            Network Interfaces
                          </Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <TableContainer component={Paper}>
                            <Table size="small">
                              <TableHead
                                style={{
                                  backgroundColor: "rgb(234, 239, 241)",
                                }}
                              >
                                <TableRow>
                                  <TableCell>Network</TableCell>
                                  <TableCell>Subnet</TableCell>
                                  <TableCell>IP Address</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {app.interfaces.map(
                                  (networkInterface, interfaceIndex) => (
                                    <TableRow
                                      key={
                                        networkInterface.spec.name +
                                        interfaceIndex
                                      }
                                    >
                                      <TableCell>
                                        {networkInterface.spec.name}
                                      </TableCell>
                                      <TableCell>
                                        {networkInterface.spec.subnet}
                                      </TableCell>
                                      <TableCell>
                                        {networkInterface.spec.ipAddress}
                                      </TableCell>
                                    </TableRow>
                                  )
                                )}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Grid>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))}
      </Grid>
    </>
  );
}

export default DeploymentIntentGroupCheckoutView;
