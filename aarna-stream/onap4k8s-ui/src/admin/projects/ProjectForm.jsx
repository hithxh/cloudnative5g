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
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";

import Dialog from "@material-ui/core/Dialog";
import MuiDialogTitle from "@material-ui/core/DialogTitle";
import MuiDialogContent from "@material-ui/core/DialogContent";
import MuiDialogActions from "@material-ui/core/DialogActions";
import IconButton from "@material-ui/core/IconButton";
import CloseIcon from "@material-ui/icons/Close";
import Typography from "@material-ui/core/Typography";
import { TextField } from "@material-ui/core";
import * as Yup from "yup";
import { Formik } from "formik";
import LoadingButton from "../../common/LoadingButton";

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

const DialogActions = withStyles((theme) => ({
  root: {
    margin: 0,
    padding: theme.spacing(1),
  },
}))(MuiDialogActions);

const DialogContent = withStyles((theme) => ({
  root: {
    padding: theme.spacing(2),
  },
}))(MuiDialogContent);
const getSchema = (existingProjects) => {
  let schema = {};
  schema = Yup.object({
    name: Yup.string()
      .required("Name is required")
      .max(50, "Tenant name cannot exceed more than 50 characters")
      .matches(
        /^[a-zA-Z0-9_-]+$/,
        "Tenant name can only contain letters, numbers, '-' and '_' and no spaces."
      )
      .matches(
        /^[a-zA-Z0-9]/,
        "Tenant name must start with an alphanumeric character"
      )
      .matches(
        /[a-zA-Z0-9]$/,
        "Tenant name must end with an alphanumeric character"
      )
      .test(
        "duplicate-test",
        "Tenant with same name exists, please use a different name",
        (name) => {
          return existingProjects
            ? existingProjects.findIndex((x) => x.metadata.name === name) === -1
            : true;
        }
      ),
    description: Yup.string().max(
      200,
      "Tenant description cannot exceed more than 200 characters"
    ),
  });
  return schema;
};

const ProjectFormFunc = (props) => {
  const { onClose, item, open, onSubmit } = props;
  const buttonLabel = item ? "OK" : "Add";
  const title = item ? "Edit Tenant" : "Add Tenant";
  const handleClose = () => {
    onClose();
  };
  let initialValues = item
    ? { name: item.metadata.name, description: item.metadata.description }
    : { name: "", description: "" };

  return (
    <Dialog
      maxWidth={"xs"}
      onClose={handleClose}
      aria-labelledby="customized-dialog-title"
      open={open}
      disableBackdropClick
    >
      <DialogTitle id="simple-dialog-title">{title}</DialogTitle>
      <Formik
        initialValues={initialValues}
        onSubmit={(values) => {
          onSubmit(values);
        }}
        validationSchema={getSchema(props.existingProjects)}
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
            <form noValidate onSubmit={handleSubmit}>
              <DialogContent dividers>
                <TextField
                  style={{ width: "100%", marginBottom: "10px" }}
                  id="name"
                  label="Tenant name"
                  type="text"
                  value={values.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  helperText={errors.name && touched.name && errors.name}
                  required
                  disabled={item && true}
                  error={errors.name && touched.name}
                />
                <TextField
                  style={{ width: "100%", marginBottom: "25px" }}
                  name="description"
                  value={values.description}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  id="description"
                  label="Description"
                  multiline
                  rowsMax={4}
                  helperText={
                    errors.description &&
                    touched.description &&
                    errors.description
                  }
                  error={errors.description && touched.description}
                />
              </DialogContent>
              <DialogActions>
                <Button autoFocus onClick={handleClose} color="secondary">
                  Cancel
                </Button>
                <LoadingButton
                  type="submit"
                  buttonLabel={buttonLabel}
                  loading={isSubmitting}
                />
              </DialogActions>
            </form>
          );
        }}
      </Formik>
    </Dialog>
  );
};

ProjectFormFunc.propTypes = {
  onClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
};

export default ProjectFormFunc;
