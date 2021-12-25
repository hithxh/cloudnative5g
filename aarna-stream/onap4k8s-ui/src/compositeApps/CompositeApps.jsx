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
import React, { useCallback, useEffect, useState } from "react";
import CompositeAppTable from "./CompositeAppTable";
import {
  withStyles,
  Button,
  Grid,
  Typography,
  makeStyles,
  fade,
  ButtonGroup,
} from "@material-ui/core";
import CreateCompositeAppForm from "./forms/CompositeAppForm";
import AddIcon from "@material-ui/icons/Add";
import apiService from "../services/apiService";
import Spinner from "../common/Spinner";
import { ReactComponent as EmptyIcon } from "../assets/icons/empty.svg";
import Notification from "../common/Notification";
import SearchIcon from "@material-ui/icons/Search";
import InputBase from "@material-ui/core/InputBase";
import ListIcon from "@material-ui/icons/List";
import AppsIcon from "@material-ui/icons/Apps";
import CompositeAppCard from "./CompositeAppCard";
import DeleteDialog from "../common/Dialogue";

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

const useStyles = makeStyles((theme) => ({
  search: {
    position: "relative",
    borderRadius: theme.shape.borderRadius,
    backgroundColor: fade(theme.palette.common.white, 1),
    "&:hover": {
      backgroundColor: fade(theme.palette.common.white, 0.9),
    },
    marginRight: theme.spacing(2),
    marginLeft: 0,
    width: "100%",
  },
  searchIcon: {
    padding: theme.spacing(0, 2),
    height: "100%",
    position: "absolute",
    pointerEvents: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  inputRoot: {
    color: "inherit",
  },
  inputInput: {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)}px)`,
    transition: theme.transitions.create("width"),
    width: "100%",
    [theme.breakpoints.up("md")]: {
      width: "50ch",
    },
  },
  sectionDesktop: {
    display: "none",
    [theme.breakpoints.up("md")]: {
      display: "flex",
    },
  },
  sectionMobile: {
    display: "flex",
    [theme.breakpoints.up("md")]: {
      display: "none",
    },
  },
}));
function CompositeApps({ projectName, ...props }) {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [notificationDetails, setNotificationDetails] = useState({});
  const [listView, setListView] = useState(true);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState({});

  const classes = useStyles();

  //wrape the init method with useCallback so that it can be used as a dependency in useEffect
  const getAllCompositeApps = useCallback(() => {
    setIsLoading(true);
    apiService
      .getAllCompositeApps({ projectName: projectName })
      .then((response) => {
        if (response && response.length > 0)
          setData(response.sort(sortDataByName));
        else setData([]);
      })
      .catch((err) => {
        console.log("Unable to get composite apps : ", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [projectName]);

  useEffect(() => {
    getAllCompositeApps();
  }, [getAllCompositeApps]);

  const sortDataByName = (a, b) => {
    let nameA = a.metadata.name.toLowerCase();
    let nameB = b.metadata.name.toLowerCase();
    if (nameA > nameB) return 1;
    else if (nameA < nameB) return -1;
    else return 0;
  };
  const handleCreateCompositeApp = (row) => {
    setOpen(true);
  };

  useEffect(() => {
    setFilteredData(data.sort(sortDataByName));
  }, [data]);

  const handleClose = (fields) => {
    if (fields) {
      setIsLoading(true);
      const formData = new FormData();
      let appsData = [];
      fields.apps.forEach((app) => {
        app.appName = app.appName.trim();
        //add files for each app
        formData.append(`${app.appName}_package`, app.file);
        formData.append(
          `${app.appName}_profile_package`,
          app.profilePackageFile
        );
        appsData.push({
          metadata: {
            name: app.appName,
            description: app.description ? app.description : "",
            filename: `${app.file.name}`,
          },
          profileMetadata: {
            name: `${app.appName}_${app.profilePackageFile.name.replace(
              /\s/g,
              ""
            )}`,
            filename: `${app.profilePackageFile.name}`,
          },
          blueprintModels: app.blueprintModels,
          clusters: app.clusters,
        });
      });

      let servicePayload = {
        name: fields.name.trim(),
        description: fields.description,
        spec: { projectName: projectName, appsData },
      };
      formData.append("servicePayload", JSON.stringify(servicePayload));
      let request = { projectName: projectName, payload: formData };
      apiService
        .addService(request)
        .then((res) => {
          console.log("create service response : ", res);
          let spec = [];
          spec.push({ version: res.spec.version, status: "created" });
          res.spec = spec;
          if (data && data.length > 0) {
            setData((data) => [...data, res]);
          } else {
            setData([res]);
          }
          setIsLoading(false);
        })
        .catch((err) => {
          setIsLoading(false);
          console.log("error creating service : ", err);
          let message = "Error creating service : " + err;
          if (err.response && err.response.data) {
            message = `Error creating service : ${err.response.data}`;
          }
          setNotificationDetails({
            show: true,
            message: message,
            severity: "error",
          });
        });
    }
    setOpen(false);
  };

  const onChangeSearch = (e) => {
    if (e.target.value && e.target.value !== "") {
      setFilteredData(
        data.filter((item) =>
          item.metadata.name
            .toLowerCase()
            .includes(e.target.value.toLowerCase())
        )
      );
    } else {
      setFilteredData(data);
    }
  };

  const handleDeleteCompositeApp = (serviceName, serviceVersion) => {
    setServiceToDelete({ name: serviceName, version: serviceVersion });
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = (el) => {
    if (el.target.innerText === "Delete") {
      let request = {
        projectName: projectName,
        compositeAppName: serviceToDelete.name,
        compositeAppVersion: serviceToDelete.version,
      };
      apiService
        .deleteCompositeApp(request)
        .then(() => {
          console.log(
            `service deleted ${serviceToDelete.name} : ${serviceToDelete.version}`
          );
          let message = `service deleted "${serviceToDelete.name} : ${serviceToDelete.version}"`;
          setNotificationDetails({
            show: true,
            message: message,
            severity: "success",
          });
          getAllCompositeApps();
        })
        .catch((err) => {
          console.log("Error deleting service : ", err);
          let message = "Error deleting service : " + err;
          if (
            err.response &&
            err.response.data.includes("Non emtpy DIG in service")
          ) {
            message =
              "Error deleting service : please delete service instance first";
          }
          setNotificationDetails({
            show: true,
            message: message,
            severity: "error",
          });
        })
        .finally(() => {
          setServiceToDelete({});
        });
    }
    setOpenDeleteDialog(false);
  };

  return (
    <>
      <Notification notificationDetails={notificationDetails} />
      {isLoading && <Spinner />}
      {!isLoading && (
        <>
          <DeleteDialog
            open={openDeleteDialog}
            onClose={handleCloseDeleteDialog}
            title={"Delete Service"}
            content={`Are you sure you want to delete "${
              serviceToDelete.name
                ? serviceToDelete.name + " : " + serviceToDelete.version
                : ""
            }" ?`}
          />
          <CreateCompositeAppForm
            open={open}
            handleClose={handleClose}
            existingServices={data}
          />
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12}>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleCreateCompositeApp}
              >
                Add service
              </Button>

              <ButtonGroup
                style={{ float: "right" }}
                color="primary"
                aria-label="outlined secondary button group"
              >
                <Button
                  variant={listView ? "contained" : "outlined"}
                  title="List"
                  onClick={() => {
                    setListView(true);
                  }}
                >
                  <ListIcon />
                </Button>
                <Button
                  variant={!listView ? "contained" : "outlined"}
                  title="Grid"
                  onClick={() => {
                    setListView(false);
                  }}
                >
                  <AppsIcon />
                </Button>
              </ButtonGroup>
            </Grid>

            {data && data.length > 0 && (
              <Grid item lg={4} md={8} xs={8}>
                <div className={classes.search}>
                  <div className={classes.searchIcon}>
                    <SearchIcon />
                  </div>
                  <InputBase
                    placeholder="Search…"
                    classes={{
                      root: classes.inputRoot,
                      input: classes.inputInput,
                    }}
                    onChange={onChangeSearch}
                    inputProps={{ "aria-label": "search" }}
                  />
                </div>
              </Grid>
            )}

            {data && data.length > 0 && listView && (
              <Grid item xs={12}>
                <CompositeAppTable
                  data={filteredData}
                  handleDeleteCompositeApp={handleDeleteCompositeApp}
                />
              </Grid>
            )}
            {data && data.length > 0 && !listView && (
              <Grid item xs={12} style={{ padding: 0 }}>
                <CompositeAppCard
                  data={filteredData}
                  handleDeleteCompositeApp={handleDeleteCompositeApp}
                />
              </Grid>
            )}
          </Grid>
          {(!data || data.length === 0) && (
            <Grid container spacing={2} direction="column" alignItems="center">
              <Grid item xs={6}>
                <EmptyIcon />
              </Grid>
              <Grid item xs={12} style={{ textAlign: "center" }}>
                <Typography variant="h5" color="primary">
                  No Service
                </Typography>
                <Typography variant="subtitle1" color="textSecondary">
                  <strong>
                    No service created yet, start by creating a service
                  </strong>
                </Typography>
              </Grid>
            </Grid>
          )}
        </>
      )}
    </>
  );
}

export default withStyles(styles)(CompositeApps);
