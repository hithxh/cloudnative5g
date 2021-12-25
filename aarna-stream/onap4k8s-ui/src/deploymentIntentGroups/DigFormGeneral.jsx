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
import { Formik } from "formik";
import * as Yup from "yup";
import apiService from "../services/apiService";
import CircularProgress from "@material-ui/core/CircularProgress";
import Backdrop from "@material-ui/core/Backdrop";

import {
  Button,
  DialogActions,
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  makeStyles,
  MenuItem,
  Select,
  TextField,
} from "@material-ui/core";

const useStyles = makeStyles((theme) => ({
  backdrop: {
    zIndex: theme.zIndex.drawer + 1,
    color: "#fff",
  },
}));

const getSchema = (existingDigs) =>
  Yup.object({
    name: Yup.string()
      .required("Name is required")
      .test(
        "duplicate-test",
        "Service instance with same name exists, please use a different name",
        (name) => {
          return existingDigs.findIndex((x) => x.metadata.name === name) === -1;
        }
      ),
    description: Yup.string(),
    version: Yup.string()
      .matches(
        /^[a-z0-9-]+$/,
        "Version must consist of lower case alphanumeric characters or '-' and no space"
      )
      .matches(/^[a-z0-9]/, "Version must start with an alphanumeric character")
      .matches(/[a-z0-9]$/, "Version must end with an alphanumeric character")
      .required("Version is required"),
    compositeAppSpec: Yup.object().required(),
    compositeProfile: Yup.string().required(),
    logicalCloud: Yup.object().required(),
  });

function DigFormGeneral(props) {
  const classes = useStyles();
  const { item, onSubmit } = props;
  const [isLoading, setIsLoading] = useState(true);
  const [logicalCloudData, setLogicalCloudData] = useState([]);
  const [selectedAppIndex, setSelectedAppIndex] = useState(0); //let the first composite app as default selection
  useEffect(() => {
    if (item) {
      props.data.compositeApps.forEach((ca, index) => {
        if (ca.metadata.name === item.compositeApp) {
          setSelectedAppIndex(index);
        }
      });
    }
  }, [item, props.data.compositeApps]);

  useEffect(() => {
    //don't call api if data is already present, e.g when back button is clicked in dig app form
    if (item && item.logicalCloudData && item.logicalCloudData.length > 0) {
      setLogicalCloudData(item.logicalCloudData);
      setIsLoading(false);
    } else {
      apiService
        .getLogicalCloudsDetail(props.projectName)
        .then((res) => {
          res.forEach((lc) => {
            lc.spec.clusterProviders.forEach((cp) => {
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
          });
          setLogicalCloudData(res);
        })
        .catch((err) => {
          console.log("error getting logical clouds details : " + err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [item, props.projectName]);

  let initialValues = item
    ? {
        ...item,
      }
    : {
        name: "",
        description: "",
        compositeApp: props.data.compositeApps[selectedAppIndex],
        compositeAppSpec: "",
        compositeProfile: "",
        version: "",
        logicalCloud: "",
      };
  return (
    <>
      <Backdrop className={classes.backdrop} open={isLoading}>
        <CircularProgress color="primary" />
      </Backdrop>
      <Formik
        initialValues={initialValues}
        onSubmit={(values) => {
          values.logicalCloudData = logicalCloudData;
          onSubmit(values);
        }}
        validationSchema={getSchema(props.existingDigs)}
      >
        {(formikProps) => {
          const {
            values,
            touched,
            errors,
            isSubmitting,
            handleChange,
            handleBlur,
            handleSubmit,
            setFieldValue,
          } = formikProps;
          return (
            <form noValidate onSubmit={handleSubmit} onChange={handleChange}>
              <Grid container spacing={3} justify="center">
                <Grid container item xs={12} spacing={7}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      id="name"
                      label="Instance Name"
                      type="text"
                      value={values.name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      helperText={touched.name && errors.name}
                      required
                      error={errors.name && touched.name}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      id="version"
                      label="Version"
                      type="text"
                      name="version"
                      value={values.version}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      helperText={
                        errors.version && touched.version && errors["version"]
                      }
                      required
                      error={errors.version && touched.version}
                    />
                  </Grid>

                  <Grid item xs={12} md={5}>
                    <TextField
                      fullWidth
                      name="description"
                      value={values.description}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      id="description"
                      label="Description"
                      multiline
                      rowsMax={4}
                    />
                  </Grid>
                </Grid>

                <Grid item container xs={12} spacing={7}>
                  <Grid item xs={12} md={4}>
                    <InputLabel shrink htmlFor="compositeApp-label-placeholder">
                      Service
                    </InputLabel>
                    <Select
                      fullWidth
                      name="compositeApp"
                      value={values.compositeApp}
                      onChange={(e) => {
                        handleChange(e);
                        setFieldValue("compositeAppSpec", "");
                        setFieldValue("compositeProfile", "");
                      }}
                      onBlur={handleBlur}
                      inputProps={{
                        name: "compositeApp",
                        id: "compositeApps-label-placeholder",
                      }}
                    >
                      {props.data &&
                        props.data.compositeApps.map((compositeApp) => (
                          <MenuItem
                            value={compositeApp}
                            key={compositeApp.metadata.name}
                          >
                            {compositeApp.metadata.name}
                          </MenuItem>
                        ))}
                    </Select>
                  </Grid>

                  <Grid item xs={12} md={3}>
                    <FormControl
                      fullWidth
                      required
                      error={
                        errors.compositeAppSpec && touched.compositeAppSpec
                      }
                    >
                      <InputLabel shrink id="compositeAppSpec">
                        Service Version
                      </InputLabel>
                      <Select
                        required
                        displayEmpty
                        name="compositeAppSpec"
                        labelId="compositeAppSpec"
                        id="compositeAppSpec"
                        value={values.compositeAppSpec}
                        onChange={(e) => {
                          handleChange(e);
                          if (e.target.value === "") {
                            setFieldValue("compositeProfile", "");
                          } else {
                            setFieldValue(
                              "compositeProfile",
                              e.target.value.compositeProfiles[0].metadata.name
                            );
                          }
                        }}
                      >
                        <MenuItem value="">
                          <em>Select</em>
                        </MenuItem>
                        {props.data &&
                          values.compositeApp.spec.map((compositeAppSpec) => (
                            <MenuItem
                              value={compositeAppSpec}
                              key={compositeAppSpec.version}
                            >
                              {compositeAppSpec.version}
                            </MenuItem>
                          ))}
                      </Select>
                      {errors.compositeAppSpec && touched.compositeAppSpec && (
                        <FormHelperText>Required</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={5}>
                    <FormControl
                      fullWidth
                      required
                      error={
                        errors.compositeProfile && touched.compositeProfile
                      }
                    >
                      <InputLabel shrink id="compositeProfile">
                        Config override
                      </InputLabel>
                      <Select
                        required
                        displayEmpty
                        disabled
                        name="compositeProfile"
                        onChange={handleChange}
                        onBlur={handleBlur}
                        value={values.compositeProfile}
                        inputProps={{
                          name: "compositeProfile",
                          id: "compositeProfile-label-placeholder",
                        }}
                      >
                        <MenuItem value="">
                          <em>None</em>
                        </MenuItem>
                        {values.compositeAppSpec.compositeProfiles &&
                          values.compositeAppSpec.compositeProfiles.map(
                            (compositeProfile) => (
                              <MenuItem
                                value={compositeProfile.metadata.name}
                                key={compositeProfile.metadata.name}
                              >
                                {compositeProfile.metadata.name}
                              </MenuItem>
                            )
                          )}
                      </Select>
                      {errors.compositeProfile && touched.compositeProfile && (
                        <FormHelperText>Required</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>
                </Grid>
                <Grid item container xs={12} spacing={7}>
                  <Grid item xs={12} md={4}>
                    <FormControl
                      fullWidth
                      required
                      error={errors.logicalCloud && touched.logicalCloud}
                    >
                      <InputLabel shrink id="logicalCloud">
                        Select Logical Cloud
                      </InputLabel>
                      {!isLoading && (
                        <Select
                          required
                          displayEmpty
                          name="logicalCloud"
                          labelId="logicalCloud"
                          id="logicalCloud"
                          value={values.logicalCloud}
                          onChange={handleChange}
                        >
                          {
                            <MenuItem value="">
                              <em>Select</em>
                            </MenuItem>
                          }
                          {logicalCloudData &&
                            logicalCloudData.length > 0 &&
                            logicalCloudData.map((logicalCloud) => (
                              <MenuItem
                                value={logicalCloud}
                                key={logicalCloud.metadata.name}
                              >
                                {logicalCloud.metadata.name}
                              </MenuItem>
                            ))}
                        </Select>
                      )}
                      {errors.compositeAppSpec && touched.compositeAppSpec && (
                        <FormHelperText>Required</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>
                </Grid>
                <Grid item xs={12}>
                  <DialogActions>
                    <Button
                      autoFocus
                      disabled
                      onClick={props.onClickBack}
                      color="secondary"
                    >
                      Back
                    </Button>
                    <Button
                      autoFocus
                      type="submit"
                      color="primary"
                      disabled={isSubmitting}
                    >
                      Next
                    </Button>
                  </DialogActions>
                </Grid>
              </Grid>
            </form>
          );
        }}
      </Formik>
    </>
  );
}

export default DigFormGeneral;
