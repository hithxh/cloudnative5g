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
import { Checkbox, MenuItem, Select } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import React, { useEffect, useState } from "react";
import Box from "@material-ui/core/Box";
import Collapse from "@material-ui/core/Collapse";
import IconButton from "@material-ui/core/IconButton";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import Typography from "@material-ui/core/Typography";
import Paper from "@material-ui/core/Paper";
import KeyboardArrowDownIcon from "@material-ui/icons/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@material-ui/icons/KeyboardArrowUp";
import Dialogue from "../../../common/Dialogue";

const useRowStyles = makeStyles({
  root: {
    "& > *": {
      borderBottom: "unset",
    },
  },
});

function Row({ onUpdateData, row, selectedBlueprintModels, ...props }) {
  const [open, setOpen] = React.useState(false);
  const classes = useRowStyles();
  const [selected, setSelected] = React.useState([]);

  useEffect(() => {
    if (selectedBlueprintModels) {
      let formikBlueprintModelData = selectedBlueprintModels.filter(
        (blueprintModel) => blueprintModel.artifactName === row.artifactName
      );
      if (formikBlueprintModelData && formikBlueprintModelData.length > 0) {
        setSelected(formikBlueprintModelData[0].workflows);
      }
    }
  }, [row.artifactName, selectedBlueprintModels]);

  useEffect(() => {
    onUpdateData(row, selected);
  }, [selected]);

  const handleSelectRow = (workflow) => {
    if (!workflow.type || workflow.type === "") workflow.type = "Get";
    const selectedIndex = selected.findIndex((x) => x.name === workflow.name);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, workflow);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1)
      );
    }
    setSelected(newSelected);
  };
  const isSelected = (name) => {
    return selected.findIndex((x) => x.name === name) !== -1;
  };

  const onSelectType = (event, row, index) => {
    row.workflows[index].type = event.target.value;
    onUpdateData(row, selected);
  };
  return (
    <>
      <TableRow className={classes.root}>
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell component="th" scope="row">
          {row.artifactName}
        </TableCell>
        <TableCell align="right">{row.id}</TableCell>
        <TableCell align="right">{row.tags}</TableCell>
        <TableCell align="right">{row.artifactVersion}</TableCell>
        <TableCell align="right">{row.published}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box margin={1}>
              <Typography variant="h6" gutterBottom component="div">
                Workflows
              </Typography>
              {row.workflows && row.workflows.length > 0 ? (
                <Table size="small" aria-label="purchases">
                  <TableHead>
                    <TableRow>
                      <TableCell>Select</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>description</TableCell>
                      <TableCell>Select Type</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {row.workflows.map((workflowRow, index) => {
                      const isItemSelected = isSelected(workflowRow.name);
                      const labelId = `enhanced-table-checkbox-${index}`;
                      return (
                        <TableRow
                          role="checkbox"
                          aria-checked={isItemSelected}
                          tabIndex={-1}
                          key={workflowRow.name}
                          selected={isItemSelected}
                        >
                          <TableCell padding="checkbox">
                            <Checkbox
                              onClick={() => handleSelectRow(workflowRow)}
                              checked={isItemSelected}
                              inputProps={{ "aria-labelledby": labelId }}
                            />
                          </TableCell>
                          <TableCell component="th" scope="row">
                            {workflowRow.name}
                          </TableCell>
                          <TableCell>{workflowRow.description}</TableCell>
                          <TableCell>
                            <Select
                              fullWidth
                              labelId="demo-simple-select-label"
                              id="demo-simple-select"
                              value={
                                workflowRow.type ? workflowRow.type : "Get"
                              }
                              disabled={!isItemSelected}
                              onChange={(e) => {
                                e.stopPropagation();
                                onSelectType(e, row, index);
                              }}
                            >
                              <MenuItem value="Get">Get</MenuItem>
                              <MenuItem value="Edit">Edit</MenuItem>
                              <MenuItem value="Delete">Delete</MenuItem>
                            </Select>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <Typography
                  style={{ padding: "12px" }}
                  variant="body1"
                  gutterBottom
                  component="div"
                >
                  No workflows available
                </Typography>
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

function CollapsibleTable({
  selectedBlueprintModels,
  onUpdateData,
  dataRows,
  ...props
}) {
  console.log(dataRows);
  return (
    <TableContainer component={Paper}>
      <Table aria-label="collapsible table">
        <TableHead>
          <TableRow>
            <TableCell />
            <TableCell>Artifact Name</TableCell>
            <TableCell align="right">Artifact ID</TableCell>
            <TableCell align="right">Tags</TableCell>
            <TableCell align="right">Artifact Version</TableCell>
            <TableCell align="right">Published</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {dataRows ? (
            dataRows.map(
              (row) =>
                row.workflows && (
                  <Row
                    onUpdateData={onUpdateData}
                    key={row.artifactName}
                    row={row}
                    selectedBlueprintModels={selectedBlueprintModels}
                  />
                )
            )
          ) : (
            <TableRow>
              <TableCell
                style={{ paddingBottom: 0, paddingTop: 0 }}
                colSpan={6}
              >
                <Typography
                  style={{ padding: "12px", textAlign: "center" }}
                  variant="h6"
                  gutterBottom
                >
                  No workflows available
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

const getUpdateBlueprintData = (
  selectedBlueprintModels,
  artifactRow,
  selectedWorkflows
) => {
  let artifactName = artifactRow.artifactName;
  let artifactVersion = artifactRow.artifactVersion;
  if (selectedBlueprintModels && selectedBlueprintModels.length > 0) {
    //filter out the value of blueprint models so that it can be completely replaced by the new values of workflows
    let updatedBlueprintValues = selectedBlueprintModels.filter(
      (blueprintModel) => blueprintModel.artifactName !== artifactName
    );
    if (selectedWorkflows.length > 0)
      updatedBlueprintValues.push({
        artifactName: artifactName,
        artifactVersion: artifactVersion,
        workflows: selectedWorkflows,
      });
    return updatedBlueprintValues;
  } else {
    if (selectedWorkflows.length > 0) {
      let selectedBlueprintModelData = [];
      selectedBlueprintModelData.push({
        artifactName: artifactName,
        artifactVersion: artifactVersion,
        workflows: selectedWorkflows,
      });
      return selectedBlueprintModelData;
    }
    return [];
  }
};

function BlueprintModelForm({ availableBlueprints, ...props }) {
  const [selectedBlueprintModels, setSelectedBlueprintModels] = useState([]);
  useEffect(() => {
    setSelectedBlueprintModels(
      props.formikProps.values.apps[props.index].blueprintModels || []
    );
  }, []);

  const handleUpdateBlueprintModelData = (artifactRow, workflows) => {
    let updatedValues = getUpdateBlueprintData(
      selectedBlueprintModels,
      artifactRow,
      workflows
    );
    setSelectedBlueprintModels(updatedValues);
  };
  const handleCloseBlueprintModelForm = (el) => {
    //save the selected values only if "OK" is clicked
    if (el.target.innerText === "OK") {
      props.formikProps.setFieldValue(
        `apps[${props.index}].blueprintModels`,
        selectedBlueprintModels
      );
    }
    props.onClose(false);
  };

  return (
    <Dialogue
      onClose={handleCloseBlueprintModelForm}
      open={props.open}
      content={
        <CollapsibleTable
          {...props}
          dataRows={availableBlueprints}
          selectedBlueprintModels={selectedBlueprintModels}
          onUpdateData={handleUpdateBlueprintModelData}
        ></CollapsibleTable>
      }
      title="Add Configuration Workflows"
      maxWidth="lg"
      fullWidth
      confirmationText="OK"
    ></Dialogue>
  );
}

export default BlueprintModelForm;
