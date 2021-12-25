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
import { makeStyles } from "@material-ui/core/styles";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import Typography from "@material-ui/core/Typography";
import DeleteIcon from "@material-ui/icons/Delete";
import EditIcon from "@material-ui/icons/Edit";
import { Button, Grid, IconButton, Tooltip } from "@material-ui/core";
import AddIcon from "@material-ui/icons/Add";
import apiService from "../../services/apiService";
import AppForm from "./AppFormGeneral";
import DeleteDialog from "../../common/Dialogue";
import CreateIcon from "@material-ui/icons/Input";
import ConfirmationDialog from "../../common/Dialogue";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    marginTop: "15px",
  },
  details: {
    display: "flex",
    flexDirection: "column",
  },
  content: {
    flex: "1 0 auto",
  },
  cover: {
    width: 151,
  },
  cardRoot: {
    width: "160px",
    boxShadow:
      "0px 3px 5px -1px rgba(0,0,0,0.2),0px 5px 8px 0px rgba(0,0,0,0.14),0px 1px 14px 0px rgba(0,0,0,0.12)",
  },
}));

const Apps = ({
  data,
  onStateChange,
  canCheckout,
  compositeAppStatus,
  ...props
}) => {
  const classes = useStyles();
  const [openDialog, setOpenDialog] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [item, setItem] = useState(null);
  const [canEdit, setCanEdit] = useState(false);
  const [openConfirmationDialog, setOpenConfirmationDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (compositeAppStatus === "checkout") setCanEdit(true);
  }, [compositeAppStatus]);
  const handleAddApp = () => {
    setItem(null);
    setFormOpen(true);
  };
  const handleFormClose = () => {
    setFormOpen(false);
  };
  const handleSubmit = (values) => {
    const formData = new FormData();
    formData.append(
      "appsPayload",
      `{"metadata":{ "name": "${values.appName}", "description": "${values.description}", "filename":"${values.file.name}" }, 
      "profileMetadata":{ "name":"${values.appName}_${values.profilePackageFile.name}", "filename":"${values.profilePackageFile.name}"}}`
    );
    formData.append("projectName", props.projectName);
    formData.append("compositeAppName", props.compositeAppName);
    formData.append("compositeAppVersion", props.compositeAppVersion);
    formData.append("appPackage", values.file);
    formData.append("profilePackage", values.profilePackageFile);
    if (values.isEdit) {
      formData.append("operation", "updateApp");
      apiService
        .updateService(formData)
        .then((res) => {
          // TODO : show notification to the user
        })
        .catch((err) => {
          console.log("error adding app : ", err);
        });
      setFormOpen(false);
    } else {
      apiService
        .updateService(formData)
        .then((res) => {
          let updatedData;
          if (!data || data.length === 0) updatedData = [res];
          else {
            updatedData = data.slice();
            updatedData.push(res);
          }
          onStateChange(updatedData);
        })
        .catch((err) => {
          console.log("error adding app : ", err);
        });
      setFormOpen(false);
    }
  };
  const handleCloseDialog = (el) => {
    if (el.target.innerText === "Delete") {
      let request = {
        projectName: props.projectName,
        compositeAppName: props.compositeAppName,
        compositeAppVersion: props.compositeAppVersion,
        appName: data[index].metadata.name,
      };
      apiService
        .removeAppFromService(request)
        .then(() => {
          console.log("app deleted");
          data.splice(index, 1);
          onStateChange([...data]);
        })
        .catch((err) => {
          console.log("Error deleting app : ", err);
        })
        .finally(() => {
          setIndex(0);
        });
    }
    setOpenDialog(false);
  };

  const handleEditApp = (itemToEdit) => {
    setItem(itemToEdit);
    setFormOpen(true);
  };

  const handleDeleteApp = (index) => {
    setIndex(index);
    setOpenDialog(true);
  };

  const handleCloseCheckoutDialog = (el) => {
    if (el.target.innerText === "OK") {
      setIsLoading(true);
      var request = {
        projectName: props.projectName,
        compositeAppName: props.compositeAppName,
        compositeAppVersion: props.compositeAppVersion,
      };
      apiService
        .checkoutService(request)
        .then((res) => {
          props.goToSeriveEditView(res);
        })
        .catch((err) => {
          console.log("error in service checkout", err);
          setIsLoading(false);
          setOpenConfirmationDialog(false);
        });
    } else {
      setOpenConfirmationDialog(false);
    }
  };

  const handleCloseCheckInDialog = (el) => {
    if (el.target.innerText === "OK") {
      setIsLoading(true);
      var request = {
        projectName: props.projectName,
        compositeAppName: props.compositeAppName,
        compositeAppVersion: props.compositeAppVersion,
      };
      apiService
        .checkInService(request)
        .then((res) => {
          props.goToSeriveEditView(res);
        })
        .catch((err) => {
          console.log("error in service check In", err);
          setIsLoading(false);
          setOpenConfirmationDialog(false);
        });
    } else {
      setOpenConfirmationDialog(false);
    }
  };

  return (
    <>
      {canEdit ? (
        <>
          <ConfirmationDialog
            confirmationText="OK"
            open={openConfirmationDialog}
            onClose={handleCloseCheckInDialog}
            title={"Check In Service"}
            content={`Are you sure you want to check In "${props.compositeAppName} : ${props.compositeAppVersion}"`}
            loading={isLoading}
          />
          <Button
            variant="outlined"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleAddApp}
            size="small"
          >
            Add App
          </Button>
          <Button
            style={{ float: "right" }}
            variant="outlined"
            size="small"
            color="primary"
            onClick={() => setOpenConfirmationDialog(true)}
            endIcon={<CreateIcon />}
            disabled={!(data && data.length > 0)}
          >
            Check In
          </Button>
        </>
      ) : (
        <>
          <ConfirmationDialog
            confirmationText="OK"
            open={openConfirmationDialog}
            onClose={handleCloseCheckoutDialog}
            title={"Checkout Service"}
            content={`Are you sure you want to checkout "${props.compositeAppName} : ${props.compositeAppVersion}"`}
            loading={isLoading}
          />
          <Button
            style={{ float: "right" }}
            variant="outlined"
            size="small"
            color="primary"
            endIcon={<CreateIcon />}
            onClick={() => setOpenConfirmationDialog(true)}
            disabled={!canCheckout}
          >
            Checkout
          </Button>
        </>
      )}
      <AppForm
        open={formOpen}
        onClose={handleFormClose}
        onSubmit={handleSubmit}
        item={item}
        existingApps={data}
      />
      <DeleteDialog
        open={openDialog}
        onClose={handleCloseDialog}
        title={"Delete Application"}
        content={`Are you sure you want to delete "${
          data && data[index] ? data[index].metadata.name : ""
        }"`}
      />
      <Grid container justify="flex-start" spacing={4} className={classes.root}>
        {data &&
          data.map((value, index) => (
            <Grid key={value.metadata.name} item>
              <Card className={classes.cardRoot}>
                <div className={classes.details}>
                  <CardContent className={classes.content}>
                    <Tooltip title={value.metadata.name} placement="top">
                      <Typography
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        component="h5"
                        variant="h5"
                      >
                        {value.metadata.name}
                      </Typography>
                    </Tooltip>
                    <Typography
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      variant="subtitle1"
                      color="textSecondary"
                    >
                      {value.metadata.description}&nbsp;
                    </Typography>
                  </CardContent>
                  {canEdit && (
                    <div className={classes.controls}>
                      <IconButton
                        onClick={handleEditApp.bind(this, value)}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        color="secondary"
                        style={{ float: "right" }}
                        onClick={() => handleDeleteApp(index)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </div>
                  )}
                </div>
              </Card>
            </Grid>
          ))}
      </Grid>
    </>
  );
};

export default Apps;
