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
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import IconButton from "@material-ui/core/IconButton";
import Typography from "@material-ui/core/Typography";
import CloseIcon from "@material-ui/icons/Close";
import Slide from "@material-ui/core/Slide";
import { Grid } from "@material-ui/core";
import { TextField } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import AddIcon from "@material-ui/icons/Add";
// import NewAppForm from "../../common/Form";
import NewAppForm from "../apps/AppForm";
import AppDetailForm from "./AppDetailForm";
import { Formik, FieldArray } from "formik";
import ErrorIcon from "@material-ui/icons/Error";
import * as Yup from "yup";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const useStyles = makeStyles((theme) => ({
  tableRoot: {
    width: "100%",
  },
  paper: {
    width: "100%",
    marginBottom: theme.spacing(2),
  },
  table: {
    minWidth: 550,
  },
  visuallyHidden: {
    border: 0,
    clip: "rect(0 0 0 0)",
    height: 1,
    margin: -1,
    overflow: "hidden",
    padding: 0,
    position: "absolute",
    top: 20,
    width: 1,
  },
  appBar: {
    position: "relative",
  },
  title: {
    marginLeft: theme.spacing(2),
    flex: 1,
  },
  demo: {
    backgroundColor: theme.palette.background.paper,
  },
  root: {
    flexGrow: 1,
    backgroundColor: theme.palette.background.paper,
    display: "flex",
    height: 424,
  },
  tabs: {
    borderRight: `1px solid ${theme.palette.divider}`,
  },
}));

const PROFILE_SUPPORTED_FORMATS = [
  ".tgz",
  ".tar.gz",
  ".tar",
  "application/x-tar",
  "application/x-tgz",
  "application/x-compressed",
  "application/x-gzip",
  "application/x-compressed-tar",
  "application/gzip",
];

// const APP_PACKAGE_SUPPORTED_FORMATS = [
//   ".tgz",
//   ".tar.gz",
//   ".tar",
//   "application/x-tar",
//   "application/x-tgz",
//   "application/x-compressed",
//   "application/x-gzip",
//   "application/x-compressed-tar",
// ];

const getSchema = (existingServices) => {
  let serviceBasicValidationSchema = Yup.object({
    name: Yup.string()
      .required("Service name is required")
      .test(
        "duplicate-test",
        "Service with same name exists, please use a different name",
        (name) => {
          return existingServices
            ? existingServices.findIndex((x) => x.metadata.name === name) === -1
            : true;
        }
      ),
    description: Yup.string(),
    apps: Yup.array()
      .of(
        Yup.object({
          appName: Yup.string().required("Application name is required"),
          file: Yup.mixed().required("An Application package file is required"),
          //disabling as a part of ODD-812
          // .test(
          //   "fileFormat",
          //   "Unsupported file format",
          //   (value) =>
          //     value && APP_PACKAGE_SUPPORTED_FORMATS.includes(value.type)
          // ),
          profilePackageFile: Yup.mixed()
            .required("A config package file is required")
            .test(
              "fileFormat",
              "Unsupported file format",
              (value) => value && PROFILE_SUPPORTED_FORMATS.includes(value.type)
            ),
        })
      )
      .required("At least one app is required"),
  });
  return serviceBasicValidationSchema;
};

const CreateCompositeAppForm = ({ open, handleClose, ...props }) => {
  const classes = useStyles();
  const [openForm, setOpenForm] = useState(false);
  const handleCloseForm = () => {
    setOpenForm(false);
  };
  const handleAddApp = () => {
    setOpenForm(true);
  };
  let initialValues = { name: "", description: "", apps: [] };
  return (
    <>
      {open && (
        <Dialog
          open={open}
          onClose={() => {
            handleClose();
          }}
          fullScreen
          TransitionComponent={Transition}
        >
          <Formik
            initialValues={initialValues}
            onSubmit={(values, { setSubmitting }) => {
              setSubmitting(false);
              handleClose(values);
            }}
            validationSchema={getSchema(props.existingServices)}
          >
            {(props) => {
              const {
                values,
                touched,
                errors,
                isSubmitting,
                handleChange,
                handleBlur,
                handleSubmit,
              } = props;
              return (
                <>
                  <form noValidate onSubmit={handleSubmit}>
                    <AppBar className={classes.appBar}>
                      <Toolbar>
                        <IconButton
                          edge="start"
                          color="inherit"
                          onClick={() => {
                            handleClose();
                          }}
                          aria-label="close"
                        >
                          <CloseIcon />
                        </IconButton>
                        <Typography variant="h6" className={classes.title}>
                          Add Service
                        </Typography>
                        <Button
                          type="submit"
                          autoFocus
                          variant="contained"
                          disabled={isSubmitting}
                        >
                          SUBMIT
                        </Button>
                      </Toolbar>
                    </AppBar>
                    <div style={{ padding: "12px" }}>
                      <Grid
                        container
                        direction="row"
                        justify="center"
                        alignItems="center"
                        style={{ marginTop: "40px" }}
                        spacing={3}
                      >
                        <Grid item container xs={6} spacing={3}>
                          <Grid item xs={12}>
                            {errors.apps &&
                              touched.apps &&
                              typeof errors.apps !== "object" && (
                                <>
                                  <Typography>
                                    <ErrorIcon
                                      color="error"
                                      style={{
                                        marginRight: "10px",
                                        verticalAlign: "middle",
                                      }}
                                    />
                                    {errors.apps}
                                  </Typography>
                                </>
                              )}
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              name="name"
                              id="input-name"
                              label="Name"
                              variant="outlined"
                              size="small"
                              value={values.name}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              required
                              helperText={
                                errors.name && touched.name && errors.name
                              }
                              error={errors.name && touched.name}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              name="description"
                              id="input-description"
                              label="Description"
                              variant="outlined"
                              size="small"
                              value={values.description}
                              onChange={handleChange}
                              onBlur={handleBlur}
                            />
                          </Grid>

                          <FieldArray
                            name="apps"
                            render={(arrayHelpers) => {
                              const removeApp = (appIndex) => {
                                arrayHelpers.remove(appIndex);
                              };
                              return (
                                <>
                                  <NewAppForm
                                    open={openForm}
                                    onClose={handleCloseForm}
                                    existingApps={values.apps}
                                    onSubmit={(values) => {
                                      arrayHelpers.push({
                                        appName: values.name,
                                        description: values.description,
                                      });
                                      setOpenForm(false);
                                    }}
                                  />
                                  {values.apps &&
                                    values.apps.length > 0 &&
                                    values.apps.map((app, index) => (
                                      <Grid key={index} item xs={12}>
                                        <AppDetailForm
                                          formikProps={props}
                                          name={app.appName}
                                          description={app.description}
                                          index={index}
                                          initialValues={values}
                                          handleRemoveApp={removeApp}
                                        />
                                      </Grid>
                                    ))}
                                </>
                              );
                            }}
                          />
                          <Grid item xs={12}>
                            <Button
                              variant="outlined"
                              size="small"
                              fullWidth
                              color="primary"
                              onClick={() => {
                                handleAddApp();
                              }}
                              startIcon={<AddIcon />}
                            >
                              Add Application
                            </Button>
                          </Grid>
                        </Grid>
                      </Grid>
                    </div>
                  </form>
                </>
              );
            }}
          </Formik>
        </Dialog>
      )}
    </>
  );
};
export default CreateCompositeAppForm;
