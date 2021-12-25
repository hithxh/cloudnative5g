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

import {
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
} from "@material-ui/core";
import FileUpload from "../../common/FileUpload";
import React from "react";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import * as Yup from "yup";
import { Formik } from "formik";

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

//disabling as a part of ODD-812
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

const getSchema = (existingApps, isEdit) => {
  let schema = {};
  schema = Yup.object({
    appName: Yup.string()
      .required("Application name is required")
      .test(
        "duplicate-test",
        "App with same name exists, please use a different name",
        (name) => {
          return existingApps && !isEdit
            ? existingApps.findIndex((x) => x.metadata.name === name) === -1
            : true;
        }
      ),
    description: Yup.string(),
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
  });
  return schema;
};

const getInitValues = (item) => {
  let initialValues = {
    appName: "",
    description: "",
    file: undefined,
    profilePackageFile: undefined,
  };
  if (item) {
    initialValues.appName = item.metadata.name;
    initialValues.description = item.metadata.description;
  }
  return initialValues;
};

function AppFormGeneral(props) {
  const { onClose, item, open, onSubmit } = props;
  const isEdit = item ? true : false;
  const buttonLabel = isEdit ? "OK" : "Add";
  const title = isEdit ? "Edit Application" : "Add Application";
  const handleClose = () => {
    onClose();
  };
  return (
    <Dialog
      maxWidth={"sm"}
      onClose={handleClose}
      aria-labelledby="customized-dialog-title"
      open={open}
      disableBackdropClick
    >
      <DialogTitle id="simple-dialog-title" onClose={handleClose}>
        {title}
      </DialogTitle>
      <Formik
        initialValues={getInitValues(item)}
        onSubmit={(values) => {
          values.isEdit = isEdit;
          onSubmit(values);
        }}
        validationSchema={getSchema(props.existingApps, isEdit)}
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
            setFieldValue,
          } = props;
          return (
            <form
              encType="multipart/form-data"
              noValidate
              onSubmit={handleSubmit}
            >
              <DialogContent dividers>
                <Grid container spacing={3}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      disabled={isEdit}
                      value={values.appName}
                      name="appName"
                      id="app-name"
                      label="Application name"
                      size="small"
                      onChange={handleChange}
                      onBlur={handleBlur}
                      required
                      helperText={errors.appName}
                      error={errors.appName && true}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      disabled={isEdit}
                      value={values.description}
                      name="description"
                      id="app-description"
                      label="Description"
                      multiline
                      onChange={handleChange}
                      onBlur={handleBlur}
                      rowsMax={4}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <label
                      style={{ marginTop: "20px" }}
                      className="MuiFormLabel-root MuiInputLabel-root"
                      htmlFor="file"
                      id="file-label"
                    >
                      App tgz file
                      <span className="MuiFormLabel-asterisk MuiInputLabel-asterisk">
                         *
                      </span>
                    </label>
                    <FileUpload
                      file={values.file}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      name="file"
                      accept={".tgz"}
                      setFieldValue={setFieldValue}
                    />
                    {touched.file && errors.file && (
                      <p style={{ color: "#f44336" }}>{errors.file}</p>
                    )}
                  </Grid>
                  <Grid item xs={6}>
                    <label
                      style={{ marginTop: "20px" }}
                      className="MuiFormLabel-root MuiInputLabel-root"
                      htmlFor="file"
                      id="file-label"
                    >
                      Config override file
                      <span className="MuiFormLabel-asterisk MuiInputLabel-asterisk">
                         *
                      </span>
                    </label>
                    <FileUpload
                      file={values.profilePackageFile}
                      onBlur={handleBlur}
                      name="profilePackageFile"
                      accept={".tar.gz, .tar"}
                      setFieldValue={setFieldValue}
                    />
                    {touched.profilePackageFile &&
                      errors.profilePackageFile && (
                        <p style={{ color: "#f44336" }}>
                          {errors.profilePackageFile}
                        </p>
                      )}
                  </Grid>
                </Grid>
              </DialogContent>
              <DialogActions>
                <Button autoFocus onClick={handleClose} color="secondary">
                  Cancel
                </Button>
                <Button
                  autoFocus
                  type="submit"
                  color="primary"
                  disabled={isSubmitting}
                >
                  {buttonLabel}
                </Button>
              </DialogActions>
            </form>
          );
        }}
      </Formik>
    </Dialog>
  );
}

export default AppFormGeneral;
