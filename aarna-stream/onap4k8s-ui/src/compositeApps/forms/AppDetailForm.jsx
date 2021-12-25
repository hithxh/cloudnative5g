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
import ExpandableCard from "../../common/ExpandableCard";
import {
  Button,
  Grid,
  TextField,
  Typography,
  withStyles,
  makeStyles,
} from "@material-ui/core";
import FileUpload from "../../common/FileUpload";
import ReceiptIcon from "@material-ui/icons/Receipt";
import { useState } from "react";
import BlueprintModelForm from "./bluePrintModelForm/BlueprintModelForm";
import Table from "@material-ui/core/Table";
import TableRow from "@material-ui/core/TableRow";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableHead from "@material-ui/core/TableHead";
import apiService from "../../services/apiService";
import CircularProgress from "@material-ui/core/CircularProgress";
import Divider from "@material-ui/core/Divider";
import HelpTooltip from "../../common/HelpTooltip";

function SelectedWorkflowsTable({ data, ...props }) {
  const StyledTableCell = withStyles(() => ({
    body: {
      fontSize: 14,
    },
  }))(TableCell);

  const StyledTableRow = withStyles((theme) => ({
    root: {
      "&:nth-of-type(odd)": {
        backgroundColor: theme.palette.action.hover,
      },
    },
  }))(TableRow);

  const useStyles = makeStyles({
    table: {
      minWidth: 350,
    },
    cell: {
      color: "grey",
    },
  });

  const classes = useStyles();

  return (
    <React.Fragment>
      {data && data.length > 0 && (
        <>
          <TableContainer>
            <Table className={classes.table} size="small">
              <TableHead>
                <TableRow>
                  <StyledTableCell>Artifact Name</StyledTableCell>
                  <StyledTableCell>Workflow Name</StyledTableCell>
                  <StyledTableCell>Workflow Description</StyledTableCell>
                  <StyledTableCell>Workflow Type</StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map(
                  (blueprintModel, index) =>
                    blueprintModel.workflows &&
                    blueprintModel.workflows.map((workflow) => (
                      <StyledTableRow
                        key={
                          blueprintModel.artifactName + workflow.name + index
                        }
                      >
                        <StyledTableCell className={classes.cell}>
                          {blueprintModel.artifactName}
                        </StyledTableCell>
                        <StyledTableCell className={classes.cell}>
                          {workflow.name}
                        </StyledTableCell>
                        <StyledTableCell className={classes.cell}>
                          {workflow.description}
                        </StyledTableCell>
                        <StyledTableCell className={classes.cell}>
                          {workflow.type}
                        </StyledTableCell>
                      </StyledTableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </React.Fragment>
  );
}

function AppDetailsForm({ formikProps, ...props }) {
  const useStyles = makeStyles((theme) => ({
    root: {
      display: "flex",
      alignItems: "center",
    },
    wrapper: {
      margin: theme.spacing(1),
      position: "relative",
    },
    buttonProgress: {
      position: "absolute",
      top: "50%",
      left: "50%",
      marginTop: -12,
      marginLeft: -12,
    },
  }));
  const classes = useStyles();
  const [openBlueprintForm, setOpenBlueprintForm] = useState(false);
  const [availableBlueprints, setAvailableBlueprints] = useState([]);
  const [gettingBlueprintModels, setGettingBlueprintModels] = useState(false);

  const handleAddBlueprintModel = () => {
    if (availableBlueprints && availableBlueprints.length < 1) {
      setGettingBlueprintModels(true);
      apiService
        .getBlueprintConfig()
        .then((data) => {
          setAvailableBlueprints(data);
          setGettingBlueprintModels(false);
          setOpenBlueprintForm(true);
        })
        .catch((err) => {
          console.log("error getting blueprint models" + err);
          setGettingBlueprintModels(false);
        });
    } else {
      setOpenBlueprintForm(true);
    }
  };
  const handleCloseBlueprintModelForm = () => {
    setOpenBlueprintForm(false);
  };

  return (
    <>
      {openBlueprintForm && (
        <BlueprintModelForm
          onClose={handleCloseBlueprintModelForm}
          open={openBlueprintForm}
          formikProps={formikProps}
          index={props.index}
          availableBlueprints={availableBlueprints}
        ></BlueprintModelForm>
      )}

      <Grid container spacing={3}>
        <Grid item xs={6}>
          <TextField
            fullWidth
            value={formikProps.values.apps[props.index].appName}
            name={`apps[${props.index}].appName`}
            id="app-name"
            label="Application name"
            size="small"
            onChange={formikProps.handleChange}
            onBlur={formikProps.handleBlur}
            required
            helperText={
              formikProps.errors.apps &&
              formikProps.errors.apps[props.index] &&
              formikProps.errors.apps[props.index].appName
            }
            error={
              formikProps.errors.apps &&
              formikProps.errors.apps[props.index] &&
              formikProps.errors.apps[props.index].appName &&
              true
            }
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            value={formikProps.values.apps[props.index].description}
            name={`apps[${props.index}].description`}
            id="app-description"
            label="Description"
            multiline
            onChange={formikProps.handleChange}
            onBlur={formikProps.handleBlur}
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
            setFieldValue={formikProps.setFieldValue}
            file={formikProps.values.apps[props.index].file}
            onBlur={formikProps.handleBlur}
            name={`apps[${props.index}].file`}
            accept={".tgz"}
          />
          {formikProps.errors.apps &&
            formikProps.errors.apps[props.index] &&
            formikProps.errors.apps[props.index].file && (
              <p style={{ color: "#f44336" }}>
                {formikProps.errors.apps[props.index].file}
              </p>
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
            <HelpTooltip message="Overide file. File format should be .tar.gz" />
          </label>
          <FileUpload
            setFieldValue={formikProps.setFieldValue}
            file={formikProps.values.apps[props.index].profilePackageFile}
            onBlur={formikProps.handleBlur}
            name={`apps[${props.index}].profilePackageFile`}
            accept={".tar.gz, .tar"}
          />
          {formikProps.errors.apps &&
            formikProps.errors.apps[props.index] &&
            formikProps.errors.apps[props.index].profilePackageFile && (
              <p style={{ color: "#f44336" }}>
                {formikProps.errors.apps[props.index].profilePackageFile}
              </p>
            )}
        </Grid>
        <Grid item xs={12}>
          {formikProps.values.apps[props.index].blueprintModels &&
            formikProps.values.apps[props.index].blueprintModels.length > 0 && (
              <>
                <Typography
                  variant="h6"
                  style={{
                    color: "rgba(0, 0, 0, 0.54)",
                  }}
                >
                  WORKFLOWS
                </Typography>
                <Divider
                  style={{
                    marginBottom: "20px",
                  }}
                />
                <SelectedWorkflowsTable
                  data={formikProps.values.apps[props.index].blueprintModels}
                />
              </>
            )}
        </Grid>
        <Grid item xs={12}>
          <div className={classes.root}>
            <div className={classes.wrapper}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => {
                  handleAddBlueprintModel();
                }}
                disabled={gettingBlueprintModels}
                startIcon={<ReceiptIcon />}
              >
                Add Configuration Workflows
              </Button>
              {gettingBlueprintModels && (
                <CircularProgress
                  size={24}
                  className={classes.buttonProgress}
                />
              )}
            </div>
          </div>
        </Grid>
      </Grid>
    </>
  );
}

const AppForm = (props) => {
  return (
    <ExpandableCard
      error={
        props.formikProps.errors.apps &&
        props.formikProps.errors.apps[props.index]
      }
      title={<Typography variant="h6">{props.name}</Typography>}
      description={props.description}
      handleRemoveApp={props.handleRemoveApp}
      appIndex={props.index}
      content={
        <AppDetailsForm
          formikProps={props.formikProps}
          name={props.name}
          index={props.index}
        />
      }
    />
  );
};
export default AppForm;
