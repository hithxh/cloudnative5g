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
import React from "react";
import { Formik } from "formik";
import * as Yup from "yup";
import AppForm from "./DigFormApp";
import { Button, DialogActions, Grid, Typography } from "@material-ui/core";

DigFormIntents.propTypes = {};
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

function DigFormIntents({ logicalCloud, ...props }) {
  const { onSubmit, appsData } = props;
  //initalise the plcement criterion with "allOf" and placement type with "labels"
  appsData.forEach((app) => {
    app.placementCriterion = "allOf";
    app.placementType = "labels";
  });
  let initialValues = { apps: appsData };

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={(values) => {
        values.compositeAppVersion = onSubmit(values);
      }}
      validationSchema={schema}
    >
      {(formikProps) => {
        const { values, isSubmitting, handleChange, handleSubmit } =
          formikProps;
        return logicalCloud && logicalCloud.spec.clusterProviders.length > 0 ? (
          <form noValidate onSubmit={handleSubmit} onChange={handleChange}>
            <Grid container spacing={4} justify="center">
              {initialValues.apps &&
                initialValues.apps.length > 0 &&
                initialValues.apps.map((app, index) => (
                  <Grid key={index} item sm={12} xs={12}>
                    <AppForm
                      logicalCloud={logicalCloud}
                      formikProps={formikProps}
                      name={app.metadata.name}
                      description={app.metadata.description}
                      index={index}
                      initialValues={values}
                    />
                  </Grid>
                ))}

              <Grid item xs={12}>
                <DialogActions>
                  <Button
                    autoFocus
                    onClick={props.onClickBack}
                    color="secondary"
                    disabled={isSubmitting}
                  >
                    Back
                  </Button>
                  <Button
                    autoFocus
                    type="submit"
                    color="primary"
                    disabled={isSubmitting}
                  >
                    Submit
                  </Button>
                </DialogActions>
              </Grid>
            </Grid>
          </form>
        ) : (
          <Grid container item spacing={4} justify="center">
            <Typography style={{ padding: "20px" }} variant="h6">
              No Clusters Available
            </Typography>
          </Grid>
        );
      }}
    </Formik>
  );
}

export default DigFormIntents;
