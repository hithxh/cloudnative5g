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
import PropTypes from "prop-types";
import MuiDialogActions from "@material-ui/core/DialogActions";
import MuiDialogTitle from "@material-ui/core/DialogTitle";
import MuiDialogContent from "@material-ui/core/DialogContent";
import {
  Chip,
  FormControl,
  Input,
  InputLabel,
  makeStyles,
  MenuItem,
  Select,
  TextField,
  Checkbox,
  ListItemText,
  FormHelperText,
  Backdrop,
  withStyles,
  Button,
  Dialog,
  IconButton,
  Typography,
  CircularProgress,
} from "@material-ui/core";
import CloseIcon from "@material-ui/icons/Close";
import apiService from "../../services/apiService";
import * as Yup from "yup";
import { Formik } from "formik";
import LoadingButton from "../../common/LoadingButton";

const useStyles = makeStyles((theme) => ({
  chips: {
    display: "flex",
    flexWrap: "wrap",
  },
  chip: {
    margin: 2,
  },
  backdrop: {
    zIndex: theme.zIndex.drawer + 9999,
    color: "#fff",
  },
}));

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

const schema = Yup.object({
  name: Yup.string().required(),
  description: Yup.string(),
  spec: Yup.object({
    clusterproviders: Yup.array()
      .of(Yup.object({}))
      .required("At least one cluster is required"),
  }),
});

const LogicalCloudForm = (props) => {
  const classes = useStyles();
  const { onClose, item, open, onSubmit } = props;
  const [selectedClusters, setSelectedClusters] = React.useState([]);
  const [isLoading, setIsloading] = useState(true);
  const [clusterProviders, setClusterProviders] = useState([]);
  const buttonLabel = item ? "OK" : "Create";
  const title = item ? "Edit Logical Cloud" : "Create Logical Cloud";
  const handleClose = () => {
    onClose();
  };

  useEffect(() => {
    apiService
      .getAllClusters()
      .then((res) => {
        setClusterProviders(res);
      })
      .catch((err) => {
        console.log("error getting all clusters : " + err);
      })
      .finally(() => {
        setIsloading(false);
      });
  }, []);

  let initialValues = item
    ? {
        name: item.metadata.name,
        description: item.metadata.description,
        spec: { clusters: [] },
      }
    : { name: "", description: "", spec: { clusterproviders: [] } };

  const selectCluster = (provider, cluster, setFieldValue) => {
    const existingList = selectedClusters.filter(
      (item) => item.metadata.name !== provider
    );
    const p = selectedClusters.filter(
      (item) => item.metadata.name === provider
    );

    //check if current selected cluster is from a provider in selectedClusters list, if not go to else
    if (p.length > 0) {
      const c = p[0].spec.clusters.filter(
        (item) => item.metadata.name === cluster.metadata.name
      );
      //if the cluster is already selected then remove it from selected, otherwise add to selected
      if (c.length > 0) {
        p[0].spec.clusters = p[0].spec.clusters.filter(
          (item) => item.metadata.name !== cluster.metadata.name
        );
      } else {
        p[0].spec.clusters.push(cluster);
      }
      //update the selected clusters with new entry and existing entries
      if (p[0].spec.clusters.length < 1) {
        setSelectedClusters([...existingList]);
        setFieldValue("spec.clusterproviders", [...existingList]);
      } else {
        setSelectedClusters([...existingList, p[0]]);
        setFieldValue("spec.clusterproviders", [...existingList, p[0]]);
      }
    } else {
      let newEntry = {
        metadata: {
          name: provider,
        },
        spec: {
          clusters: [cluster],
        },
      };
      if (selectedClusters.length > 0) {
        setSelectedClusters((selectedClusters) => [
          ...selectedClusters,
          newEntry,
        ]);
        setFieldValue("spec.clusterproviders", [...selectedClusters, newEntry]);
      } else {
        setSelectedClusters([newEntry]);
        setFieldValue("spec.clusterproviders", [newEntry]);
      }
    }
  };

  //function to handle bulk select/ unselect
  const selectClusters = (provider, setFieldValue) => {
    let newProvider = {
      metadata: provider.metadata,
      spec: {
        clusters: [...provider.spec.clusters],
      },
    };
    let providerIndex = selectedClusters.findIndex(
      (x) => x.metadata.name === provider.metadata.name
    );
    //if selected provider is not in selectedClusters list, then add that provider and select all it's clusters, else remove that entry from selectedClusters list
    if (providerIndex === -1) {
      setSelectedClusters([...selectedClusters, newProvider]);
      setFieldValue("spec.clusterproviders", [
        ...selectedClusters,
        newProvider,
      ]);
    } else {
      setSelectedClusters((selectedClusters) => {
        return selectedClusters.filter(
          (entry) => entry.metadata.name !== provider.metadata.name
        );
      });
      setFieldValue(
        "spec.clusterproviders",
        selectedClusters.filter(
          (entry) => entry.metadata.name !== provider.metadata.name
        )
      );
    }
  };

  const getIsChecked = (provider, cluster) => {
    let providerIndex = selectedClusters.findIndex(
      (x) => x.metadata.name === provider
    );
    if (providerIndex !== -1) {
      let clusterIndex = selectedClusters[
        providerIndex
      ].spec.clusters.findIndex(
        (y) => y.metadata.name === cluster.metadata.name
      );
      if (clusterIndex !== -1) {
        return true;
      } else {
        return false;
      }
    }
    return false;
  };

  const getIsIndeterminate = (provider, totalClusters) => {
    let providerIndex = selectedClusters.findIndex(
      (x) => x.metadata.name === provider
    );
    if (providerIndex !== -1) {
      if (
        selectedClusters[providerIndex].spec.clusters.length === totalClusters
      ) {
        return false;
      }
      return true;
    }
    return false;
  };

  const getIsAllChecked = (provider, totalClusters) => {
    let providerIndex = selectedClusters.findIndex(
      (x) => x.metadata.name === provider
    );
    if (providerIndex !== -1) {
      if (
        selectedClusters[providerIndex].spec.clusters.length === totalClusters
      ) {
        return true;
      }
      return false;
    }
    return false;
  };

  return (
    <>
      <Backdrop className={classes.backdrop} open={isLoading}>
        <CircularProgress color="primary" />
      </Backdrop>
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
          validationSchema={schema}
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
              <form noValidate onSubmit={handleSubmit}>
                <DialogContent dividers>
                  <TextField
                    style={{ width: "100%", marginBottom: "10px" }}
                    id="name"
                    label="Logical Cloud name"
                    type="text"
                    value={values.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    helperText={
                      errors.name && touched.name && "Name is required"
                    }
                    required
                    disabled={item}
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
                  />
                  <FormControl
                    fullWidth
                    className={classes.formControl}
                    error={errors.spec && touched.spec && true}
                  >
                    <InputLabel id="demo-mutiple-chip-label">
                      Select Clusters
                    </InputLabel>
                    <Select
                      labelId="demo-mutiple-chip-label"
                      id="demo-mutiple-chip"
                      multiple
                      value={selectedClusters}
                      input={<Input id="select-multiple-chip" />}
                      renderValue={(selected) => (
                        <div className={classes.chips}>
                          {selected.map((provider) =>
                            provider.spec.clusters.map((cluster) => (
                              <Chip
                                color="primary"
                                key={cluster.metadata.name}
                                label={cluster.metadata.name}
                                className={classes.chip}
                              />
                            ))
                          )}
                        </div>
                      )}
                    >
                      <div
                        style={{
                          padding: "0 20px",
                          maxHeight: "200px",
                          overflow: "auto",
                        }}
                      >
                        {clusterProviders.map((provider) => {
                          return (
                            <React.Fragment key={provider.metadata.name}>
                              <Typography
                                variant="body1"
                                style={{ display: "inline-flex" }}
                                key={provider.metadata.name}
                              >
                                {provider.metadata.name}
                              </Typography>
                              <Checkbox
                                checked={getIsAllChecked(
                                  provider.metadata.name,
                                  provider.spec.clusters.length
                                )}
                                indeterminate={getIsIndeterminate(
                                  provider.metadata.name,
                                  provider.spec.clusters.length
                                )}
                                onClick={(e) => {
                                  selectClusters(
                                    { ...provider },
                                    setFieldValue
                                  );
                                  e.stopPropagation();
                                }}
                              />
                              {provider.spec.clusters.map((cluster) => (
                                <MenuItem
                                  key={cluster.metadata.name}
                                  value={cluster.metadata.name}
                                  onClick={(e) => {
                                    selectCluster(
                                      provider.metadata.name,
                                      cluster,
                                      setFieldValue,
                                      values
                                    );
                                    e.stopPropagation();
                                  }}
                                >
                                  <Checkbox
                                    checked={getIsChecked(
                                      provider.metadata.name,
                                      cluster
                                    )}
                                  />
                                  <ListItemText
                                    primary={cluster.metadata.name}
                                  />
                                </MenuItem>
                              ))}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </Select>
                    {errors.spec && touched.spec && (
                      <FormHelperText>{errors.spec.clusters}</FormHelperText>
                    )}
                  </FormControl>
                </DialogContent>
                <DialogActions>
                  <Button
                    autoFocus
                    onClick={(e) => {
                      setSelectedClusters([]);
                      handleClose(e);
                    }}
                    disabled={isSubmitting}
                    color="secondary"
                  >
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
    </>
  );
};

LogicalCloudForm.propTypes = {
  onClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
};

export default LogicalCloudForm;
