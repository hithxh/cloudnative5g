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
import React, { useEffect } from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import Dialog from "@material-ui/core/Dialog";
import MuiDialogTitle from "@material-ui/core/DialogTitle";
import MuiDialogContent from "@material-ui/core/DialogContent";
import IconButton from "@material-ui/core/IconButton";
import CloseIcon from "@material-ui/icons/Close";
import Typography from "@material-ui/core/Typography";
import MuiDialogActions from "@material-ui/core/DialogActions";
import { Button, Grid } from "@material-ui/core";
import * as Yup from "yup";
import { Formik } from "formik";
import AppForm from "../../DigFormApp";

const schema = Yup.object({
  apps: Yup.array()
    .of(
      Yup.object({
        clusters: Yup.array()
          .of(
            Yup.object({
              clusterProvider: Yup.string(),
              selectedClusters: Yup.array().of(
                Yup.object({
                  name: Yup.string(),
                })
              ),
              selectedLabels: Yup.array().of(
                Yup.object({
                  "label-name": Yup.string(),
                })
              ),
            })
          )
          .required("Select at least one cluster"),
        interfaces: Yup.array().of(
          Yup.object({
            networkName: Yup.string().required(),
            subnet: Yup.string().required(),
            ip: Yup.string().matches(
              /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?).){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
              "invalid ip address"
            ),
          })
        ),
        overrideValues: Yup.object().typeError(
          "Invalid override values, expected JSON"
        ),
        placementCriterion: Yup.string().required(
          "please select a placement criterion"
        ),
      })
    )
    .required("At least one app is required"),
});

const DialogActions = withStyles((theme) => ({
  root: {
    margin: 0,
    padding: theme.spacing(1),
  },
}))(MuiDialogActions);

const styles = (theme) => ({
  root: {
    margin: 0,
    padding: theme.spacing(2),
  },
  closeButton: {
    position: "absolute",
    right: theme.spacing(1),
    top: theme.spacing(1),
    color: theme.palette.grey[500],
  },
});

const DialogTitle = withStyles(styles)((props) => {
  const { children, classes, onClose, ...other } = props;
  return (
    <MuiDialogTitle disableTypography className={classes.root} {...other}>
      <Typography variant="h6">{children}</Typography>
      {onClose ? (
        <IconButton className={classes.closeButton} onClick={onClose}>
          <CloseIcon />
        </IconButton>
      ) : null}
    </MuiDialogTitle>
  );
});

const DialogContent = withStyles((theme) => ({
  root: {
    padding: theme.spacing(2),
  },
}))(MuiDialogContent);

//need to convert the datastructure returned by api to match the datastrcuture in formik for interfaces.
//TODO : this won't be required when middleend will accept interface datastructure in POST same as in GET
const getFormatedInitValues = (apps) => {
  //conver the apps object from the format checkout api returns to the format AppForm accepts
  let formatedAppsObject = [];
  apps.forEach((app) => {
    let formatedAppObject = {
      name: "",
      description: "",
      interfaces: [],
      clusters: [],
    };
    formatedAppObject.name = app.name;
    formatedAppObject.description = app.description;
    formatedAppObject.clusters = app.clusters || [];
    //based on placement intent, initialise placement type. We are only checking the placement intent
    //for the first cluster provider because all the cluster providers should have same placement type
    if (
      app.clusters &&
      app.clusters[0].selectedClusters &&
      app.clusters[0].selectedClusters.length > 0
    ) {
      formatedAppObject.placementType = "clusters";
    } else {
      formatedAppObject.placementType = "labels";
    }
    //TODO: set placementCriterion initial value to "allOf", once we get this value from the api we should use that instead
    formatedAppObject.placementCriterion = app.placementCriterion || "allOf";
    app.interfaces &&
      app.interfaces.forEach((entry) => {
        formatedAppObject.interfaces.push({
          networkName: entry.spec.name,
          ip: entry.spec.ipAddress,
          subnet: entry.spec.subnet,
        });
      });
    formatedAppsObject.push(formatedAppObject);
  });
  return formatedAppsObject;
};

const UpgradeDIGform = ({ appsToEdit, ...props }) => {
  const [initialValues, setInitialValues] = React.useState({
    apps: getFormatedInitValues(appsToEdit),
  });
  const { onClose, open, onSubmit } = props;
  const title = "Edit Application";
  const handleClose = () => {
    onClose();
  };
  useEffect(() => {
    setInitialValues({ apps: getFormatedInitValues(appsToEdit) });
  }, [appsToEdit]);
  return (
    <Dialog
      maxWidth={"md"}
      fullWidth={true}
      onClose={handleClose}
      open={open}
      disableBackdropClick
    >
      <DialogTitle id="customized-dialog-title" onClose={handleClose}>
        {title}
      </DialogTitle>
      <Formik
        initialValues={initialValues}
        onSubmit={(values) => {
          onSubmit(values);
        }}
        validationSchema={schema}
      >
        {(formikProps) => {
          const { values, isSubmitting, handleSubmit } = formikProps;
          return (
            <form noValidate onSubmit={handleSubmit}>
              <DialogContent dividers>
                <Grid container spacing={4} justify="center">
                  {initialValues.apps &&
                    initialValues.apps.length > 0 &&
                    initialValues.apps.map((app, index) => (
                      <Grid key={index} item sm={12} xs={12}>
                        <AppForm
                          expanded={true}
                          logicalCloud={props.logicalCloud}
                          formikProps={formikProps}
                          name={app.name}
                          description={app.description}
                          index={index}
                          initialValues={values}
                        />
                      </Grid>
                    ))}
                </Grid>
              </DialogContent>
              <DialogActions>
                <Button
                  autoFocus
                  onClick={handleClose}
                  color="secondary"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  autoFocus
                  type="submit"
                  color="primary"
                  disabled={isSubmitting}
                >
                  OK
                </Button>
              </DialogActions>
            </form>
          );
        }}
      </Formik>
    </Dialog>
  );
};

UpgradeDIGform.propTypes = {
  onClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
};

export default UpgradeDIGform;
