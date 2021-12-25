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
import React, { useState } from "react";
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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Menu,
  MenuItem,
} from "@material-ui/core";
import SettingsOutlinedIcon from "@material-ui/icons/SettingsOutlined";
import CloudQueueIcon from "@material-ui/icons/CloudQueue";
import Paper from "@material-ui/core/Paper";
import SettingsEthernetIcon from "@material-ui/icons/SettingsEthernet";
import GroupWorkIcon from "@material-ui/icons/GroupWork";
import CircularProgress from "@material-ui/core/CircularProgress";
import ArchiveOutlinedIcon from "@material-ui/icons/ArchiveOutlined";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import CheckCircleOutlineRoundedIcon from "@material-ui/icons/CheckCircleOutlineRounded";
import ErrorOutlineIcon from "@material-ui/icons/ErrorOutline";
import StopScreenShareOutlinedIcon from "@material-ui/icons/StopScreenShareOutlined";
import CodeOutlinedIcon from "@material-ui/icons/CodeOutlined";
import DeleteOutlineIcon from "@material-ui/icons/DeleteOutline";
import ConfigureApp from "./configureApp/ConfigureApp";
import CreateIcon from "@material-ui/icons/Input";
import ConfirmationDialog from "../../common/Dialogue";
import apiService from "../../services/apiService";
import { useHistory } from "react-router-dom";
import { Edit as EditIcon, Restore as RestoreIcon } from "@material-ui/icons";

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

const getClusterAppStatus = (cluster, classes) => {
  let status = "";
  let statusComponent = "";
  cluster.resources.forEach((resource) => {
    if (resource.GVK.Kind === "Deployment") {
      status = resource["rsync-status"];
      if (status === "Retrying") {
        statusComponent = (
          <>
            <Grid item>
              <CircularProgress
                style={{
                  width: "18px",
                  height: "18px",
                  marginRight: "10px",
                  marginTop: "3px",
                }}
              />
            </Grid>
            <Grid item>
              <Typography component="h2" gutterBottom>
                {status}
              </Typography>
            </Grid>
          </>
        );
      } else if (status === "Applied") {
        statusComponent = (
          <>
            <Grid item>
              <CheckCircleOutlineRoundedIcon
                className={classes.appStatusIcon}
                style={{
                  color: "green",
                }}
              />
            </Grid>
            <Grid item>
              <Typography component="h2" gutterBottom>
                Deployed
              </Typography>
            </Grid>
          </>
        );
      } else if (status === "Deleted") {
        statusComponent = (
          <>
            <Grid item>
              <DeleteOutlineIcon className={classes.appStatusIcon} />
            </Grid>
            <Grid item>
              <Typography component="h2" gutterBottom>
                {status}
              </Typography>
            </Grid>
          </>
        );
      } else {
        statusComponent = (
          <>
            <Grid item>
              <ErrorOutlineIcon className={classes.appStatusIcon} />
            </Grid>
            <Grid item>
              <Typography component="h2" gutterBottom>
                {status}
              </Typography>
            </Grid>
          </>
        );
      }
    }
  });
  return { statusComponent: statusComponent, statusString: status };
};

function DeploymentIntentGroupView(props) {
  const [openConfigureApp, setOpenConfigureApp] = useState(false);
  const [appToConfigure, setAppToConfigure] = useState({});
  const classes = useStyles();
  const [openConfirmationDialog, setOpenConfirmationDialog] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [loading, setLoading] = useState(false);
  let history = useHistory();

  //if status is Instantiating then again get the data after 5 secs and repeat this
  if (props.data.status === "Instantiating") {
    setTimeout(() => {
      props.updateData();
    }, 5000);
  }
  const getClusterAppStatusWrapper = (cluster) => {
    return getClusterAppStatus(cluster, classes);
  };
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleConfigure = (app) => {
    handleClose();
    setAppToConfigure(app);
    setOpenConfigureApp(true);
  };

  const handleCloseCheckOutDialog = (el) => {
    setLoading(true);
    if (el.target.innerText === "OK") {
      var request = {
        projectName: props.projectName,
        compositeAppName: props.compositeAppName,
        compositeAppVersion: props.compositeAppVersion,
        deploymentIntentGroupName: props.deploymentIntentGroupName,
      };
      apiService
        .checkoutServiceInstance(request)
        .then((res) => {
          let path = history.location.pathname.replace("/status", "/checkout");
          history.push({
            pathname: path,
          });
        })
        .catch((err) => {
          setLoading(false);
          console.log("error in service check In", err);
          setOpenConfirmationDialog(false);
        });
    } else {
      setOpenConfirmationDialog(false);
      setLoading(false);
    }
  };
  const goToSeriveCheckoutView = () => {
    let checkoutUrl = history.location.pathname.replace(
      `/${props.data["composite-app-name"]}/${props.data["composite-app-version"]}/`,
      `/${props.data["composite-app-name"]}/${props.data.targetVersion}/`
    );
    history.push(checkoutUrl.replace("/status", "/checkout"));
  };
  return (
    <>
      <ConfirmationDialog
        confirmationText="OK"
        open={openConfirmationDialog}
        onClose={handleCloseCheckOutDialog}
        title={"Check Out Service Instance"}
        content={`Are you sure you want to check out "${props.data.name}" ?`}
        loading={loading}
      />
      <ConfigureApp
        open={openConfigureApp}
        setOpen={setOpenConfigureApp}
        compositeAppName={props.data["composite-app-name"]}
        compositeAppVersion={props.data["composite-app-version"]}
        app={appToConfigure}
      />

      <Grid container item xs={12} spacing={2} justify="space-between">
        <Grid item container spacing={1} xs={6}>
          <Grid item>
            <ArchiveOutlinedIcon
              style={{
                width: "28px",
                height: "28px",
                marginTop: "3px",
              }}
            />
          </Grid>
          <Grid item>
            <Typography
              variant="h5"
              color="textSecondary"
              style={{ display: "inline-flex" }}
            >
              {props.data.name}
            </Typography>
            {props.data.status && props.data.status === "Instantiated" && (
              <div style={{ height: "22px" }} className={classes.divider}></div>
            )}
          </Grid>
          {props.data.status && props.data.status === "Instantiated" && (
            <>
              <Grid item>
                {props.data.is_checked_out ? (
                  <Button
                    style={{ float: "right" }}
                    variant="outlined"
                    size="small"
                    color="primary"
                    endIcon={<EditIcon />}
                    onClick={() => goToSeriveCheckoutView()}
                  >
                    Edit
                  </Button>
                ) : (
                  <Button
                    style={{ float: "right" }}
                    variant="outlined"
                    size="small"
                    color="primary"
                    endIcon={<CreateIcon />}
                    onClick={() => setOpenConfirmationDialog(true)}
                  >
                    Checkout
                  </Button>
                )}
              </Grid>
              {/* <Grid item>
                <Button
                  size="small"
                  aria-haspopup="true"
                  onClick={hanldeRollback}
                  color="primary"
                  variant="outlined"
                >
                  <RestoreIcon style={{ marginRight: "5px" }} />
                  Rollback
                </Button>
              </Grid> */}
            </>
          )}
        </Grid>

        <Grid item container justify="flex-end" xs={6} spacing={1}>
          <Grid item>
            {props.data.status === "Instantiating" && (
              <CircularProgress
                style={{
                  width: "28px",
                  height: "28px",
                  marginTop: "3px",
                }}
              />
            )}

            {props.data.status === "Terminated" && (
              <StopScreenShareOutlinedIcon
                style={{
                  width: "28px",
                  height: "28px",
                  marginTop: "3px",
                }}
              />
            )}
            {props.data.status === "Instantiated" && (
              <CheckCircleOutlineRoundedIcon
                style={{
                  width: "28px",
                  height: "28px",
                  marginTop: "3px",
                  color: "green",
                }}
              />
            )}
          </Grid>
          <Grid item>
            <Typography variant="h5">{props.data.status}</Typography>
          </Grid>
        </Grid>
      </Grid>

      <Grid container spacing={4}>
        <Grid item xs={12} md={4} lg={3}>
          <Card>
            <CardContent>
              <Grid container direction="column" spacing={2}>
                <Grid item>
                  <Typography color={"textSecondary"}>Service</Typography>
                </Grid>
                <Grid item>
                  <Typography variant="h5" style={{ display: "inline-flex" }}>
                    {props.data["composite-app-name"]}
                  </Typography>
                  <div className={classes.divider}></div>
                  <Typography variant="h6" className={classes.version}>
                    {props.data["composite-app-version"]}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {props.data["composite-profile-name"] && (
          <Grid item xs={12} md={4} lg={3}>
            <Card>
              <CardContent>
                <Grid container direction="column" spacing={2}>
                  <Grid item xs={12}>
                    <Typography color={"textSecondary"}>
                      Config override
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="h5" className={classes.typography}>
                      {props.data["composite-profile-name"]}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}

        {props.data.states.actions && (
          <Grid item xs={12} md={4} lg={3}>
            <Accordion>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                id="panel1a-header"
              >
                <Typography color={"textSecondary"}>Activity Log</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead
                      style={{ backgroundColor: "rgb(234, 239, 241)" }}
                    >
                      <TableRow>
                        <TableCell>Action</TableCell>
                        <TableCell>Time</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {props.data.states.actions &&
                        props.data.states.actions.map((action, index) => (
                          <TableRow key={action.time + index}>
                            <TableCell>{action.state}</TableCell>
                            <TableCell>
                              {new Date(action.time).toDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </AccordionDetails>
            </Accordion>
          </Grid>
        )}
      </Grid>

      {props.data.apps && (
        <Grid
          container
          item
          xs={12}
          style={{ marginTop: "60px", marginBottom: "15px" }}
        >
          <GroupWorkIcon
            style={{ fontSize: 35, marginRight: "10px", float: "left" }}
          />
          <Typography variant="h5" color="textSecondary">
            Applications
          </Typography>
        </Grid>
      )}

      <Grid container spacing={4}>
        {props.data.apps &&
          props.data.apps.map((app, appIndex) => (
            <Grid
              container
              key={app.name + appIndex}
              item
              xs={12}
              md={6}
              lg={4}
            >
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Grid container>
                      <Grid item container xs={12} justify="space-between">
                        <Grid item xs={6}>
                          <CodeOutlinedIcon
                            color="secondary"
                            style={{
                              fontSize: 40,
                              float: "left",
                              marginRight: "5px",
                            }}
                          />
                          <Typography
                            variant="h4"
                            className={classes.typography}
                            gutterBottom
                          >
                            {app.name}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Button
                            aria-controls={`${app.name}-menu`}
                            aria-haspopup="true"
                            onClick={handleMenuOpen}
                            style={{ float: "right" }}
                            color="primary"
                            id={app.name}
                          >
                            <SettingsOutlinedIcon />
                            &nbsp; Configure
                          </Button>
                          <Menu
                            id={`${app.name}-menu`}
                            anchorEl={anchorEl}
                            keepMounted
                            open={Boolean(
                              anchorEl &&
                                anchorEl.id &&
                                anchorEl.id === app.name
                            )}
                            onClose={handleClose}
                          >
                            {app.clusters.map((cluster) => (
                              <MenuItem
                                style={{ minWidth: "105px" }}
                                key={`${app.name + cluster.cluster}`}
                                disabled={
                                  getClusterAppStatusWrapper(cluster)
                                    .statusString !== "Applied"
                                }
                                onClick={() => handleConfigure(app)}
                              >
                                {cluster.cluster}
                              </MenuItem>
                            ))}
                          </Menu>
                        </Grid>
                      </Grid>

                      <Grid item xs={12}>
                        <Typography color="textSecondary">
                          {app.description}
                        </Typography>
                      </Grid>
                    </Grid>
                    {app.clusters.map((cluster, index) => (
                      <Grid
                        item
                        key={(app.name + cluster.cluster, index)}
                        container
                        xs={12}
                        spacing={2}
                        style={{ padding: "20px" }}
                      >
                        <Grid container item justify="space-between">
                          <Grid item xs={6}>
                            <CloudQueueIcon
                              color="primary"
                              style={{
                                fontSize: 35,
                                marginRight: "10px",
                                float: "left",
                              }}
                            />
                            <Typography variant="h5">
                              {cluster.cluster}
                            </Typography>
                          </Grid>

                          <Grid item container xs={4} justify="flex-end">
                            {
                              getClusterAppStatusWrapper(cluster)
                                .statusComponent
                            }
                          </Grid>
                        </Grid>
                        {cluster.interfaces && (
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
                                      <TableCell>Name</TableCell>
                                      <TableCell>Network</TableCell>
                                      <TableCell>Ip Address</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {cluster.interfaces.map(
                                      (networkInterface) => (
                                        <TableRow
                                          key={
                                            networkInterface.spec.ipAddress +
                                            networkInterface.spec.interface
                                          }
                                        >
                                          <TableCell>
                                            {networkInterface.spec.interface}
                                          </TableCell>
                                          <TableCell>
                                            {networkInterface.spec.name}
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

                        <Grid item xs={12}>
                          <Accordion>
                            <AccordionSummary
                              expandIcon={<ExpandMoreIcon />}
                              id="panel1a-header"
                            >
                              <SettingsOutlinedIcon
                                style={{ float: "left", marginRight: "10px" }}
                              />
                              <Typography>Kubernetes Resources</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                              <TableContainer component={Paper}>
                                <Table size="small">
                                  <TableHead
                                    style={{
                                      backgroundColor: "rgb(234, 239, 241)",
                                    }}
                                  >
                                    <TableRow>
                                      <TableCell>Name</TableCell>
                                      <TableCell>Kind</TableCell>
                                      <TableCell>Status</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {cluster.resources.map((resource) => (
                                      <TableRow
                                        key={resource.name + resource.GVK.Kind}
                                      >
                                        <TableCell>{resource.name}</TableCell>
                                        <TableCell>
                                          {resource.GVK.Kind}
                                        </TableCell>
                                        <TableCell>
                                          {resource["rsync-status"]}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </TableContainer>
                            </AccordionDetails>
                          </Accordion>
                        </Grid>
                      </Grid>
                    ))}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          ))}
      </Grid>
    </>
  );
}

export default DeploymentIntentGroupView;
// export default withRouter(DeploymentIntentGroupView);
