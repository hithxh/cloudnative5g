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
import Tab from "@material-ui/core/Tab";
import Tabs from "@material-ui/core/Tabs";
import Paper from "@material-ui/core/Paper";
import { withStyles } from "@material-ui/core/styles";
import Box from "@material-ui/core/Box";
import PropTypes from "prop-types";
import BackIcon from "@material-ui/icons/ArrowBack";
import { withRouter } from "react-router-dom";
import {
  Button,
  FormControl,
  IconButton,
  InputBase,
  MenuItem,
  Select,
  Typography,
} from "@material-ui/core";
import apiService from "../services/apiService";
import Spinner from "../common/Spinner";
import Apps from "../compositeApps/apps/Apps";
import CompositeProfiles from "../compositeApps/compositeProfiles/CompositeProfiles";
import PageNotFound from "../common/PageNotFound";
import DeleteIcon from "@material-ui/icons/DeleteTwoTone";
import DeleteDialog from "../common/Dialogue";
import { ReactComponent as ServiceInstanceIcon } from "../assets/icons/service_instance.svg";
// import Intents from "../compositeApps/intents/GenericPlacementIntents";
// import NetworkIntent from "../networkIntents/NetworkIntents";

const styles = (theme) => ({
  divider: {
    borderLeft: `2px solid ${theme.palette.text.disabled}`,
    display: "inline-flex",
    height: "22px",
    marginLeft: "8px",
    verticalAlign: "middle",
  },
});

const VersionDropdown = withStyles((theme) => ({
  root: {
    "label + &": {
      marginTop: theme.spacing(3),
    },
  },
  input: {
    borderRadius: 4,
    position: "relative",
    border: "1px solid #ced4da",
    fontSize: 12,
    padding: "2px 15px 2px 4px",
    transition: theme.transitions.create(["border-color", "box-shadow"]),
    "&:focus": {
      borderRadius: 4,
      boxShadow: "0 0 0 0.2rem rgba(0,123,255,.25)",
    },
  },
}))(InputBase);

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`nav-tabpanel-${index}`}
      aria-labelledby={`nav-tab-${index}`}
      {...other}
    >
      {value === index && <Box p={3}>{children}</Box>}
    </div>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.any.isRequired,
  value: PropTypes.any.isRequired,
};

function CompositeApp(props) {
  const [activeTab, setActiveTab] = useState(0);
  const [appsData, setAppsData] = useState(null);
  const [profilesData, setProfilesData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [versions, setVersions] = useState([]);
  const [compositeAppError, setCompositeAppError] = useState(false);
  const [compositeAppStatus, setCompositeAppStatus] = useState("");
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [digCount, setDigCount] = useState(0);

  const handleChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  const [canCheckout, setCanCheckout] = useState(false);
  const { classes } = props;
  const compositeAppName = props.match.params.appname;
  const compositeAppVersion = props.match.params.version;

  useEffect(() => {
    let request = {
      projectName: props.projectName,
      compositeAppName: compositeAppName,
      compositeAppVersion: compositeAppVersion,
    };
    apiService
      .getCompositeAppDetails(request)
      .then((res) => {
        apiService
          .getCompositeAppVersions(request)
          .then((versionsRes) => {
            versionsRes.sort((a, b) => {
              let versionA = parseInt(a.replace("v", ""));
              let versionB = parseInt(b.replace("v", ""));
              if (versionA > versionB) return 1;
              else if (versionA < versionB) return -1;
              else return 0;
            });
            setVersions(versionsRes);
            setCanCheckout(
              //enable checkout only for the largest version.
              //assuming versionsRes is sorted in increasing order
              compositeAppVersion === versionsRes[versionsRes.length - 1]
            );
            setIsLoading(false);
          })
          .catch((err) => {
            console.error("error getting versions", err);
          });
        setAppsData(res.spec.apps);
        setProfilesData(res.spec.compositeProfiles);
        if (res.spec.deploymentIntentGroups) {
          setDigCount(res.spec.deploymentIntentGroups.length);
        }
        setCompositeAppStatus(res.status);
      })
      .catch((err) => {
        console.log("error getting composite app details" + err);
        setIsLoading(false);
        setCompositeAppError(true);
      });
  }, [props.projectName, compositeAppName, compositeAppVersion]);

  const handleUpdateState = (updatedData) => {
    setAppsData(updatedData);
  };

  const handleSelectVersion = (e) => {
    let selectedVersion = e.target.value;
    let path = `/app/projects/${props.projectName}/services/${compositeAppName}/${selectedVersion}`;
    props.history.push({
      pathname: path,
    });
  };

  const goToSeriveEditView = (service) => {
    let path = `/app/projects/${props.projectName}/services/${service.metadata.name}/${service.spec.version}`;
    props.history.push({
      pathname: path,
    });
  };

  const handleDeleteCompositeApp = () => {
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = (el) => {
    if (el.target.innerText === "Delete") {
      let request = {
        projectName: props.projectName,
        compositeAppName: compositeAppName,
        compositeAppVersion: compositeAppVersion,
      };
      apiService
        .deleteCompositeApp(request)
        .then(() => {
          console.log(
            `service deleted ${compositeAppName} : ${compositeAppVersion}`
          );
          //go to services page
          let index = props.history.location.pathname.indexOf(compositeAppName);
          let path = props.history.location.pathname.slice(0, index - 1);
          props.history.push({
            pathname: path,
          });
        })
        .catch((err) => {
          console.log("Error deleting service : ", err);
        })
        .finally(() => {
          setIsLoading(true);
        });
    }
    setOpenDeleteDialog(false);
  };

  const getInstancesComponent = () => {
    if (compositeAppStatus !== "checkout") {
      return (
        <div
          style={{
            display: "flex",
            float: "right",
            alignItems: "center",
            padding: "10px",
          }}
        >
          <span>
            <ServiceInstanceIcon
              style={{ height: "25px", marginRight: "15px" }}
            />
          </span>
          <Typography variant="h6" color="textSecondary">
            {digCount < 2 ? `${digCount} Instance` : `${digCount} Instances`}
          </Typography>
        </div>
      );
    } else {
      return null;
    }
  };

  return (
    <>
      {!isLoading && !compositeAppError && (
        <>
          <DeleteDialog
            open={openDeleteDialog}
            onClose={handleCloseDeleteDialog}
            title={"Delete Service"}
            content={`Are you sure you want to delete "${compositeAppName} : ${compositeAppVersion}"`}
          />
          <div style={{ paddingBottom: "20px" }}>
            <IconButton
              onClick={() => {
                props.history.push(
                  `/app/projects/${props.projectName}/services`
                );
              }}
              title="Back"
            >
              <BackIcon color="primary"></BackIcon>
            </IconButton>
            <Typography
              display="inline"
              variant="h5"
              color="textSecondary"
              style={{ paddingLeft: "5px", verticalAlign: "middle" }}
            >
              {compositeAppName}
            </Typography>
            <div className={classes.divider}></div>
            <FormControl
              style={{ marginTop: "9px", marginLeft: "10px" }}
              color="primary"
            >
              <Select
                labelId="demo-customized-select-label"
                id="demo-customized-select"
                value={compositeAppVersion}
                onChange={handleSelectVersion}
                input={<VersionDropdown />}
              >
                {versions.map((version) => (
                  <MenuItem key={version} value={version}>
                    {version}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              style={{ marginLeft: "40px" }}
              variant="outlined"
              size="small"
              color="secondary"
              disabled={digCount > 0}
              onClick={() => handleDeleteCompositeApp()}
              endIcon={<DeleteIcon />}
            >
              Delete
            </Button>
            {getInstancesComponent()}
          </div>
          <Paper square>
            <Tabs
              value={activeTab}
              indicatorColor="primary"
              textColor="primary"
              onChange={handleChange}
              style={{ borderBottom: "1px solid #e8e8e8" }}
            >
              <Tab label="Apps" />
              <Tab label="Config Override" />
            </Tabs>
            <TabPanel value={activeTab} index={0}>
              <Apps
                projectName={props.projectName}
                compositeAppName={compositeAppName}
                compositeAppVersion={compositeAppVersion}
                history={props.history}
                goToSeriveEditView={goToSeriveEditView}
                compositeAppStatus={compositeAppStatus}
                data={appsData}
                onStateChange={handleUpdateState}
                canCheckout={canCheckout}
              />
            </TabPanel>
            <TabPanel value={activeTab} index={1}>
              <CompositeProfiles
                projectName={props.projectName}
                compositeAppName={compositeAppName}
                compositeAppVersion={compositeAppVersion}
                appsData={appsData}
                profilesData={profilesData}
              />
            </TabPanel>
          </Paper>
        </>
      )}
      {!isLoading && compositeAppError && (
        <>
          <PageNotFound />
        </>
      )}
      {isLoading && <Spinner />}
    </>
  );
}

CompositeApp.propTypes = {};
export default withStyles(styles)(withRouter(CompositeApp));
